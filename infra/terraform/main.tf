terraform {
  required_version = ">= 1.3.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

# ──────────────────────────────────────────
# PROVIDER
# ──────────────────────────────────────────
provider "digitalocean" {
  token = var.do_token
}

# ──────────────────────────────────────────
# SSH KEY  (upload your public key once)
# ──────────────────────────────────────────
resource "digitalocean_ssh_key" "civitrack_key" {
  name       = "civitrack-key"
  public_key = file(var.ssh_public_key_path)
}

# ──────────────────────────────────────────
# DROPLET  (the VM that runs everything)
# ──────────────────────────────────────────
resource "digitalocean_droplet" "civitrack_server" {
  name   = "civitrack-server"
  region = var.region
  size   = var.droplet_size  # s-2vcpu-2gb = ~$18/mo, enough for demo
  image  = "ubuntu-22-04-x64"

  ssh_keys = [digitalocean_ssh_key.civitrack_key.fingerprint]

  # Cloud-init: runs once on first boot
  user_data = templatefile("${path.module}/scripts/startup.sh.tpl", {
    repo_url   = var.repo_url
    jwt_secret = var.jwt_secret
  })

  tags = ["civitrack", "microservices", var.environment]
}

# ──────────────────────────────────────────
# FIREWALL
# ──────────────────────────────────────────
resource "digitalocean_firewall" "civitrack_fw" {
  name = "civitrack-firewall"

  droplet_ids = [digitalocean_droplet.civitrack_server.id]

  # Allow SSH
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Allow Gateway (public API)
  inbound_rule {
    protocol         = "tcp"
    port_range       = "3000"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Allow Jenkins
  inbound_rule {
    protocol         = "tcp"
    port_range       = "8080"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Allow Grafana
  inbound_rule {
    protocol         = "tcp"
    port_range       = "3003"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Allow all outbound
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}
