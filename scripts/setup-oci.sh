#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AliArts — OCI Server One-Time Setup Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# Run this ONCE on your Oracle Cloud server to:
#   1. Install Docker & Docker Compose (if not already installed)
#   2. Create the app directory
#   3. Clone the repository
#   4. Set up Nginx reverse proxy
#   5. Get SSL certificate with Certbot
#   6. Start the application
#
# Usage:
#   chmod +x scripts/setup-oci.sh
#   ./scripts/setup-oci.sh yourdomain.com
#
# Example:
#   ./scripts/setup-oci.sh aliarts.yourname.com
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

DOMAIN="${1:?Usage: $0 <your-domain.com>}"
APP_DIR="/home/ubuntu/aliarts"
REPO_URL="https://github.com/gravitybreached/aliarts.git"
BRANCH="artwork"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AliArts OCI Setup"
echo "  Domain: $DOMAIN"
echo "  App Dir: $APP_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Step 1: Install Docker (if not installed) ───
if ! command -v docker &> /dev/null; then
    echo ""
    echo ">>> Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker installed successfully!"
else
    echo "Docker already installed — skipping."
fi

# ─── Step 2: Ensure Docker Compose is available ───
if ! docker compose version &> /dev/null; then
    echo ""
    echo ">>> Installing Docker Compose plugin..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
    echo "Docker Compose installed!"
else
    echo "Docker Compose already available — skipping."
fi

# ─── Step 3: Install Certbot (if not installed) ───
if ! command -v certbot &> /dev/null; then
    echo ""
    echo ">>> Installing Certbot for SSL..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
    echo "Certbot installed!"
else
    echo "Certbot already installed — skipping."
fi

# ─── Step 4: Clone or update repository ───
if [ ! -d "$APP_DIR" ]; then
    echo ""
    echo ">>> Cloning repository..."
    git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
else
    echo ""
    echo ">>> Repository exists — pulling latest..."
    cd "$APP_DIR"
    git fetch origin "$BRANCH"
    git reset --hard "origin/$BRANCH"
fi

# ─── Step 5: Build and start the Docker container ───
echo ""
echo ">>> Building and starting AliArts container..."
cd "$APP_DIR"
docker compose up -d --build

echo ""
echo ">>> Waiting for container to start..."
sleep 15

if docker ps | grep -q aliarts-app; then
    echo "Container is running on port 3001!"
else
    echo "WARNING: Container may not have started properly. Check logs:"
    docker compose logs --tail=30
fi

# ─── Step 6: Configure Nginx ───
echo ""
echo ">>> Setting up Nginx reverse proxy..."

# Create the Nginx config from the template in the repo
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

# Replace "yourdomain.com" with actual domain
sed "s/yourdomain.com/$DOMAIN/g; s/www\.yourdomain\.com/www.$DOMAIN/g" \
    "$APP_DIR/nginx-aliarts.conf" | sudo tee "$NGINX_CONF" > /dev/null

# Create symlink to sites-enabled
sudo ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$DOMAIN"

# Test Nginx config
echo "Testing Nginx configuration..."
if sudo nginx -t; then
    echo "Nginx config is valid!"
    sudo systemctl reload nginx
    echo "Nginx reloaded!"
else
    echo "ERROR: Nginx config test failed. Fix issues before continuing."
    echo "You may need to get the SSL cert first. Run:"
    echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    exit 1
fi

# ─── Step 7: Get SSL Certificate ───
echo ""
echo ">>> Getting SSL certificate for $DOMAIN..."
echo "Make sure your DNS A record points to this server's IP!"
echo ""
read -p "Press Enter to continue with SSL setup (or Ctrl+C to skip)..."

sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" || {
    echo ""
    echo "SSL cert failed. This usually means DNS hasn't propagated yet."
    echo "You can retry later with: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    echo ""
    echo "Your app is still accessible at http://$DOMAIN (without SSL)"
}

# ─── Step 7b: Update NEXTAUTH_URL in docker-compose.yml ───
echo ""
echo ">>> Updating NEXTAUTH_URL in docker-compose.yml..."
sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN|g" "$APP_DIR/docker-compose.yml"
sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$DOMAIN|g" "$APP_DIR/docker-compose.yml"

# Restart container with updated URLs
docker compose up -d

# ─── Step 8: Open firewall port ───
echo ""
echo ">>> Opening firewall ports..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
# Save iptables rules
if command -v netfilter-persistent &> /dev/null; then
    sudo netfilter-persistent save
fi

# ─── Done! ───
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AliArts Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Your app: https://$DOMAIN"
echo "  Admin UI: https://$DOMAIN/admin"
echo "  Admin login: admin@aliarts.com / admin123"
echo ""
echo "  Useful commands:"
echo "  ─────────────────────────────────────"
echo "  View logs:    cd $APP_DIR && docker compose logs -f"
echo "  Restart:      cd $APP_DIR && docker compose restart"
echo "  Stop:         cd $APP_DIR && docker compose down"
echo "  Rebuild:      cd $APP_DIR && docker compose up -d --build"
echo "  Check status: docker ps | grep aliarts"
echo ""
echo "  GitHub Auto-Deploy:"
echo "  ─────────────────────────────────────"
echo "  Add these secrets to your GitHub repo:"
echo "  Settings → Secrets and variables → Actions"
echo "    OCI_HOST    = Your server's public IP"
echo "    OCI_USER    = ubuntu"
echo "    OCI_SSH_KEY = Your SSH private key"
echo "    APP_DIR     = $APP_DIR"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
