#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "🚀 Deploying Meta Core..."

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER"
fi

generate_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -base64 32
    else
        head -c 32 /dev/urandom | base64
    fi
}

if [ -f .env ]; then
    set -a
    . ./.env
    set +a
fi

echo "🔧 Environment setup"
CH_USER="${CH_USER:-clickhouse-secret-user}"
CH_PASSWORD="${CH_PASSWORD:-}"
if [ -z "$CH_PASSWORD" ]; then
    CH_PASSWORD="$(generate_secret)"
fi
CH_DB="${CH_DB:-default}"

JWT_SECRET="${JWT_SECRET:-}"
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET="$(generate_secret)"
fi

COOKIE_SECRET="${COOKIE_SECRET:-}"
if [ -z "$COOKIE_SECRET" ]; then
    COOKIE_SECRET="$(generate_secret)"
fi

NATS_URL="${NATS_URL:-nats://nats:4222}"
NATS_TOPIC="${NATS_TOPIC:-core.price}"
NATS_TOKEN="${NATS_TOKEN:-}"
if [ -z "$NATS_TOKEN" ]; then
    NATS_TOKEN="$(generate_secret)"
fi

GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-admin}"
LOG_LEVEL="${LOG_LEVEL:-info}"
NODE_ENV="${NODE_ENV:-production}"
BUN_PROFILING="${BUN_PROFILING:-false}"

cat > .env <<EOF
LOG_LEVEL=$LOG_LEVEL
NODE_ENV=$NODE_ENV
GRAFANA_PASSWORD=$GRAFANA_PASSWORD
CH_USER=$CH_USER
CH_PASSWORD=$CH_PASSWORD
CH_DB=$CH_DB
JWT_SECRET=$JWT_SECRET
COOKIE_SECRET=$COOKIE_SECRET
NATS_URL=$NATS_URL
NATS_TOKEN=$NATS_TOKEN
NATS_TOPIC=$NATS_TOPIC
BUN_PROFILING=$BUN_PROFILING
EOF

# Install Loki driver (optional)
echo "📦 Loki driver (optional)..."
docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions 2>/dev/null || true

# Build and start
echo "🚀 Starting services..."
docker compose up -d --build

# Remove garage-setup after success
echo "🧹 Cleaning up garage-setup..."
docker rm -f garage-setup 2>/dev/null || true

# Setup daily reboot
echo "⏰ Setting up daily reboot at 00:00 UTC..."
(crontab -l 2>/dev/null | grep -v reboot; echo "0 0 * * * /usr/sbin/reboot") | crontab -

echo ""
echo "✅ Deployed!"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:3030"
echo "   API:      http://localhost:3030/api"
echo "   Grafana:  http://localhost:3030/grafana"
echo ""
echo "📊 Profiling: Grafana → Explore → Pyroscope datasource"
