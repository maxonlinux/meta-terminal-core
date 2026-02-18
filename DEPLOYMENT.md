# Deployment Guide

## Quick Deploy (One Command)

```bash
git clone https://github.com/maxonlinux/meta-terminal-core.git
cd meta-terminal-core
./scripts/deploy.sh
```

That's it. Everything is automated.

## Manual Deployment

### 1. Prerequisites

```bash
sudo apt update && sudo apt upgrade -y

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git
sudo apt install -y git
```

### 2. Clone & Configure

```bash
git clone https://github.com/maxonlinux/meta-terminal-core.git
cd meta-terminal-core
nano .env
```

Suggested variables:
```env
LOG_LEVEL=info
NODE_ENV=production
GRAFANA_PASSWORD=your-secure-password
CH_USER=clickhouse-secret-user
CH_PASSWORD=super-secure-clickhouse-password
CH_DB=default
JWT_SECRET=replace-with-strong-secret
COOKIE_SECRET=replace-with-strong-secret
NATS_URL=nats://nats:4222
NATS_TOKEN=replace-with-nats-token
NATS_TOPIC=core.price
BUN_PROFILING=false
```

### 3. Deploy

```bash
# Start services
docker compose up -d --build
```

## Troubleshooting

### App health
If the API is not responding, check:
```bash
docker compose logs -f app
curl http://localhost:3030/api/health
```

## Useful Commands

```bash
docker compose logs -f app    # View logs
docker compose restart app    # Restart app
docker compose down           # Stop all
git pull && docker compose up -d --build  # Update
curl http://localhost:3030/api/health  # Health check
docker stats                   # Resources
```

## Ports

| Service | Port |
|---------|------|
| Frontend (Traefik) | 3030 |
| API (Traefik) | 3030 (/api) |
| Grafana | 3030 (/grafana) |
