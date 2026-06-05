# CiviTrack Ansible Playbooks

Infrastructure as Code (IaC) using Ansible to provision and deploy CiviTrack.

## Structure

```
ansible/
├── ansible.cfg              ← Ansible configuration
├── inventory.ini            ← Server inventory
└── playbooks/
    ├── install-docker.yml   ← Playbook 1: Install Docker
    ├── deploy-civitrack.yml ← Playbook 2: Deploy app
    └── health-check.yml     ← Playbook 3: Health check
```

## Prerequisites

Install Ansible on your machine:

```bash
# Ubuntu/Debian
sudo apt install ansible -y

# macOS
brew install ansible

# Windows (WSL)
sudo apt install ansible -y
```

## Playbooks

### Playbook 1 — Install Docker

Installs Docker, Docker Compose, Git, and configures firewall on the VPS.

```bash
cd ansible
ansible-playbook playbooks/install-docker.yml
```

What it does:
- Updates system packages
- Installs Docker and Docker Compose
- Configures Docker daemon
- Opens required ports in firewall (3000, 3003, 3004, 9090)

### Playbook 2 — Deploy CiviTrack

Clones the repo and deploys the full stack with Docker Compose.

```bash
ansible-playbook playbooks/deploy-civitrack.yml
```

What it does:
- Clones/updates GitHub repo
- Creates Prometheus config
- Runs docker-compose up --build
- Creates systemd service for auto-restart on reboot
- Prints live URLs

### Playbook 3 — Health Check

Checks status of all running services.

```bash
ansible-playbook playbooks/health-check.yml
```

What it does:
- Checks Docker service
- Lists all running containers
- Hits health endpoints for all services
- Reports disk and memory usage

## Run All Playbooks

```bash
cd ansible
ansible-playbook playbooks/install-docker.yml
ansible-playbook playbooks/deploy-civitrack.yml
ansible-playbook playbooks/health-check.yml
```

## Expected Output

```
PLAY RECAP
vps : ok=12  changed=5  unreachable=0  failed=0
```

## Server

| Server | IP | User |
|--------|----|------|
| VPS | 187.124.48.107 | root |
