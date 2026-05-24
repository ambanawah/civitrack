#!/bin/bash
set -e

LOG="/var/log/civitrack-setup.log"
exec > >(tee -a $LOG) 2>&1

echo "========================================"
echo " CiviTrack Server Setup — $(date)"
echo "========================================"

# ── 1. System update ─────────────────────────
echo "[1/6] Updating system packages..."
apt-get update -y
apt-get upgrade -y
apt-get install -y curl git unzip software-properties-common

# ── 2. Install Docker ────────────────────────
echo "[2/6] Installing Docker..."
curl -fsSL https://get.docker.com | bash
systemctl enable docker
systemctl start docker

# Install docker-compose v2
curl -SL "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker-compose --version)"

# ── 3. Clone the repo ────────────────────────
echo "[3/6] Cloning CiviTrack repository..."
cd /opt
git clone ${repo_url} civitrack || (cd civitrack && git pull)
cd /opt/civitrack

# ── 4. Inject environment variables ──────────
echo "[4/6] Writing production .env files..."

# Gateway
cat > /opt/civitrack/gateway/.env <<EOF
PORT=3000
JWT_SECRET=${jwt_secret}
AUTH_SERVICE_URL=http://auth-service:3001
COMPLAINT_SERVICE_URL=http://complaint-service:3002
EOF

# Auth service
cat > /opt/civitrack/auth-service/.env <<EOF
DATABASE_URL=postgresql://auth_user:auth_pass@auth-db:5432/auth_db
JWT_SECRET=${jwt_secret}
JWT_EXPIRES_IN=7d
PORT=3001
EOF

# Complaint service
cat > /opt/civitrack/complaint-service/.env <<EOF
DATABASE_URL=postgresql://complaint_user:complaint_pass@complaint-db:5432/complaint_db
JWT_SECRET=${jwt_secret}
PORT=3002
EOF

# ── 5. Start the application ─────────────────
echo "[5/6] Starting CiviTrack with docker-compose..."
cd /opt/civitrack
docker-compose up --build -d

# ── 6. Create systemd service for auto-restart ─
echo "[6/6] Creating systemd service..."
cat > /etc/systemd/system/civitrack.service <<EOF
[Unit]
Description=CiviTrack Application
After=docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/opt/civitrack
ExecStart=/usr/local/bin/docker-compose up
ExecStop=/usr/local/bin/docker-compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable civitrack

echo "========================================"
echo " Setup complete! $(date)"
echo " Gateway: http://$(curl -s ifconfig.me):3000"
echo " Health:  http://$(curl -s ifconfig.me):3000/health"
echo "========================================"
