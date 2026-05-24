variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "ssh_public_key_path" {
  description = "Path to your SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "fra1" # Frankfurt — closest to Cameroon
}

variable "droplet_size" {
  description = "Droplet size slug"
  type        = string
  default     = "s-2vcpu-2gb"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "repo_url" {
  description = "GitHub repo URL to clone"
  type        = string
  default     = "https://github.com/ambanawah/civitrack.git"
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
  default     = "civitrack_super_secret_key_change_in_production"
}
