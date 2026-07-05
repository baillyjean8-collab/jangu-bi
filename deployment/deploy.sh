#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# JANGU BI — Production Deployment Runbook
# Target: Ubuntu 22.04 LTS VPS (Render / AWS EC2 / DigitalOcean Droplet)
#
# Run this script section by section — DO NOT run it blindly end-to-end.
# Each section is idempotent (safe to re-run).
#
# Estimated time: 30–45 minutes for a fresh server.
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# ── SECTION 0: Pre-flight ──────────────────────────────────────────────────────
echo "=== JANGU BI Deployment Runbook ==="
echo "Server: $(hostname)"
echo "Date:   $(date -u)"
echo ""

# Verify running as non-root with sudo
if [ "$EUID" -eq 0 ]; then
  echo "❌ Do NOT run as root. Use a sudo-capable deploy user."
  exit 1
fi

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1: System Dependencies
# ══════════════════════════════════════════════════════════════════════════════
echo "--- Section 1: System dependencies ---"

sudo apt-get update -q
sudo apt-get upgrade -y -q
sudo apt-get install -y -q \
  curl wget git build-essential \
  nginx certbot python3-certbot-nginx \
  ufw fail2ban \
  htop logrotate

# ── Node.js 20 LTS via NodeSource ─────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "Node: $(node -v) | npm: $(npm -v)"

# ── PM2 global ────────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  sudo npm install -g pm2
fi
echo "PM2: $(pm2 -v)"

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2: Firewall (UFW)
# ══════════════════════════════════════════════════════════════════════════════
echo "--- Section 2: Firewall ---"

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh                # Port 22 (or your custom SSH port)
sudo ufw allow 80/tcp             # HTTP (redirect to HTTPS)
sudo ufw allow 443/tcp            # HTTPS
sudo ufw --force enable
sudo ufw status verbose

# ── Fail2ban: block brute force SSH attempts ───────────────────────────────────
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3: Application User
# ══════════════════════════════════════════════════════════════════════════════
echo "--- Section 3: App user ---"

# Create a dedicated app user (no shell login, no sudo)
# The app never runs as root — principle of least privilege
sudo useradd --system --no-create-home --shell /usr/sbin/nologin jangubi 2>/dev/null || true

# Create app directories
sudo mkdir -p /var/www/jangubi-server
sudo mkdir -p /var/www/jangubi-client/dist
sudo mkdir -p /var/log/pm2
sudo mkdir -p /etc/jangubi

# Set ownership
sudo chown -R jangubi:jangubi /var/www/jangubi-server
sudo chown -R jangubi:jangubi /var/www/jangubi-client
sudo chown -R jangubi:jangubi /var/log/pm2

# The deploy user (you) needs write access to deploy files
sudo chown -R $USER:jangubi /var/www/jangubi-server
sudo chown -R $USER:jangubi /var/www/jangubi-client
sudo chmod -R 775 /var/www/jangubi-server
sudo chmod -R 775 /var/www/jangubi-client

echo "✅ App user 'jangubi' created"

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4: Environment Secrets
# ══════════════════════════════════════════════════════════════════════════════
echo "--- Section 4: Secrets setup ---"

# Secrets file — readable only by jangubi user and root
# NEVER put this file in git or any publicly accessible location
SECRETS_FILE="/etc/jangubi/production.env"

if [ ! -f "$SECRETS_FILE" ]; then
  echo ""
  echo "⚠️  Creating secrets template at $SECRETS_FILE"
  echo "    You MUST fill in all values before starting the app."
  echo ""

  sudo tee "$SECRETS_FILE" > /dev/null << 'SECRETS_TEMPLATE'
# JANGU BI Production Secrets
# Generated: $(date -u)
# KEEP THIS FILE SECURE — chmod 600 and owned by root

NODE_ENV=production
PORT=5000
CLIENT_URL=https://app.jangubi.com

MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/jangubi?retryWrites=true&w=majority

# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=FILL_IN_64_CHAR_RANDOM_HEX
JWT_REFRESH_SECRET=FILL_IN_DIFFERENT_64_CHAR_RANDOM_HEX
OTP_HMAC_SECRET=FILL_IN_64_CHAR_RANDOM_HEX_FOR_OTP

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=10

CINETPAY_API_KEY=
CINETPAY_SITE_ID=
WAVE_SECRET_KEY=
ORANGE_MONEY_SECRET=
MTN_MOMO_SECRET=
SECRETS_TEMPLATE

  sudo chmod 600 "$SECRETS_FILE"
  sudo chown root:root "$SECRETS_FILE"
  echo "❗ Fill in $SECRETS_FILE before continuing to Section 6."
fi

# Validate all required secrets are filled in
check_secret() {
  local key=$1
  local value
  value=$(sudo grep "^${key}=" "$SECRETS_FILE" | cut -d= -f2-)
  if [ -z "$value" ] || [[ "$value" == FILL_IN* ]]; then
    echo "❌ Missing or placeholder secret: $key"
    return 1
  fi
  echo "  ✓ $key"
}

echo "Checking secrets..."
all_ok=true
for key in NODE_ENV PORT CLIENT_URL MONGODB_URI JWT_ACCESS_SECRET JWT_REFRESH_SECRET OTP_HMAC_SECRET; do
  check_secret "$key" || all_ok=false
done

if [ "$all_ok" = false ]; then
  echo ""
  echo "❌ Fill in all secrets in $SECRETS_FILE before continuing."
  exit 1
fi
echo "✅ All required secrets present"

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 5: TLS Certificate (Let's Encrypt)
# ══════════════════════════════════════════════════════════════════════════════
echo "--- Section 5: TLS setup ---"

# Set your domains here
API_DOMAIN="api.jangubi.com"
APP_DOMAIN="app.jangubi.com"
EMAIL="admin@jangubi.com"    # Must be real — receives expiry notices

# Verify DNS is pointing to this server before running certbot
echo "Checking DNS for $API_DOMAIN..."
SERVER_IP=$(curl -s ifconfig.me)
API_IP=$(dig +short "$API_DOMAIN" 2>/dev/null | tail -1)

if [ "$API_IP" != "$SERVER_IP" ]; then
  echo "⚠️  DNS warning: $API_DOMAIN resolves to $API_IP, this server is $SERVER_IP"
  echo "    Ensure DNS A records point to this server before running certbot."
  echo "    Skipping certbot for now..."
else
  # Obtain certificate (nginx plugin handles Nginx config automatically)
  sudo certbot --nginx \
    -d "$API_DOMAIN" -d "$APP_DOMAIN" \
    --non-interactive --agree-tos \
    --email "$EMAIL"

  # Generate DH params (takes 2-5 minutes — run in background)
  if [ ! -f /etc/ssl/dhparam.pem ]; then
    echo "Generating DH params (this takes a few minutes)..."
    sudo openssl dhparam -out /etc/ssl/dhparam.pem 2048 &
    echo "  Running in background..."
  fi

  echo "✅ TLS certificates obtained"
fi

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 6: Deploy Application Code
# ══════════════════════════════════════════════════════════════════════════════
echo "--- Section 6: Application code ---"

# Clone or pull latest code
if [ ! -d "/var/www/jangubi-server/.git" ]; then
  git clone https://github.com/YOUR_ORG/jangu-bi.git /tmp/jangubi-clone
  cp -r /tmp/jangubi-clone/server/. /var/www/jangubi-server/
  cp -r /tmp/jangubi-clone/client/dist/. /var/www/jangubi-client/dist/
  rm -rf /tmp/jangubi-clone
else
  cd /var/www/jangubi-server
  git fetch origin main
  git reset --hard origin/main
fi

# Install production dependencies (no devDependencies)
cd /var/www/jangubi-server
npm ci --omit=dev

echo "✅ Application code deployed"

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 7: Nginx Configuration
# ══════════════════════════════════════════════════════════════════════════════
echo "--- Section 7: Nginx ---"

sudo cp /var/www/jangubi-server/deployment/nginx.conf \
     /etc/nginx/sites-available/jangubi

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Enable jangubi site
sudo ln -sf /etc/nginx/sites-available/jangubi \
            /etc/nginx/sites-enabled/jangubi

# Test config before applying
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Nginx configured and reloaded"

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 8: Start Application with PM2
# ══════════════════════════════════════════════════════════════════════════════
echo "--- Section 8: PM2 process manager ---"

cd /var/www/jangubi-server

# Source secrets as environment variables for PM2
set -a
source /etc/jangubi/production.env
set +a

# Start (or reload) the application
if pm2 show jangu-bi-api > /dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi

# Save PM2 process list (auto-restores on server reboot)
pm2 save

# Configure PM2 to start on system boot
pm2 startup systemd -u $USER --hp $HOME | tail -1 | sudo bash

echo "✅ Application running under PM2"

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 9: Log Rotation
# ══════════════════════════════════════════════════════════════════════════════
echo "--- Section 9: Log rotation ---"

sudo tee /etc/logrotate.d/pm2-jangubi > /dev/null << 'LOGROTATE'
/var/log/pm2/jangu-bi-*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
LOGROTATE

echo "✅ Log rotation configured"

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 10: Health Check & Smoke Test
# ══════════════════════════════════════════════════════════════════════════════
echo "--- Section 10: Smoke tests ---"

sleep 5  # Give the app a moment to start

# Test the API health endpoint
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ API health check failed (HTTP $HTTP_STATUS)"
  echo "   Check logs: pm2 logs jangu-bi-api"
  exit 1
fi
echo "✅ API health: OK (HTTP $HTTP_STATUS)"

# Test via Nginx
NGINX_STATUS=$(curl -sk -o /dev/null -w "%{http_code}" https://api.jangubi.com/health 2>/dev/null || echo "000")
if [ "$NGINX_STATUS" = "200" ]; then
  echo "✅ Nginx proxy: OK"
else
  echo "⚠️  Nginx proxy: HTTP $NGINX_STATUS (may need DNS propagation)"
fi

# ══════════════════════════════════════════════════════════════════════════════
# SECTION 11: MongoDB Atlas Security Checklist
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "=== MongoDB Atlas Security Checklist ==="
echo "Complete these manually in the Atlas dashboard:"
echo ""
echo "[ ] Network Access → Add this server's IP to allowlist: $SERVER_IP"
echo "[ ] Database Access → Create dedicated user (not admin) with readWrite on jangubi DB only"
echo "[ ] Clusters → Enable audit logging"
echo "[ ] Clusters → Enable automated backups (daily)"
echo "[ ] Clusters → Set maintenance window (off-peak hours)"
echo "[ ] Alerts → Set up alerts for: high connections, slow queries, storage > 80%"
echo ""
echo "=== Final Checklist ==="
echo "[ ] DNS A records pointing to $SERVER_IP"
echo "[ ] TLS certificate obtained (certbot --nginx)"
echo "[ ] All secrets filled in at /etc/jangubi/production.env"
echo "[ ] Payment provider webhook URLs configured in provider dashboards"
echo "[ ] PM2 startup command run (shown above)"
echo "[ ] pm2 save run"
echo "[ ] Smoke tests passing"
echo ""
echo "🚀 JANGU BI deployment complete!"
echo "   API: https://api.jangubi.com"
echo "   App: https://app.jangubi.com"
