#!/usr/bin/env bash
# BabyDaily deploy script (run on the LXC host locally)
# - Backend: PM2 (Node)
# - Frontend: Nginx serving frontend/dist
# - Database: Postgres via Docker (optional)
#
# Usage:
#   ./scripts/deploy-lxc.sh [--path /opt/BabyDaily] [--node 24] [--frontend-heap 4096] [--skip-db] [--skip-nginx]
#
# Notes:
# - This script intentionally does NOT source ~/.bashrc to avoid non-interactive issues (PS1, set -u).
# - Expects project code already present on the LXC host at DEPLOY_PATH.

set -euo pipefail

DEPLOY_PATH="/opt/BabyDaily"
NODE_VERSION="24"
FRONTEND_HEAP_MB="4096"
SKIP_DB="false"
SKIP_NGINX="false"
BACKEND_PORT="3000"

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options]

Options:
  --path <dir>            Deploy path (default: ${DEPLOY_PATH})
  --node <version>        Node version via fnm (default: ${NODE_VERSION})
  --frontend-heap <mb>    Node heap for frontend build (default: ${FRONTEND_HEAP_MB})
  --backend-port <port>   Backend port (default: ${BACKEND_PORT})
  --skip-db               Skip postgres docker update/start
  --skip-nginx            Skip nginx config/reload
  -h, --help              Show help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --path) DEPLOY_PATH="$2"; shift 2 ;;
    --node) NODE_VERSION="$2"; shift 2 ;;
    --frontend-heap) FRONTEND_HEAP_MB="$2"; shift 2 ;;
    --backend-port) BACKEND_PORT="$2"; shift 2 ;;
    --skip-db) SKIP_DB="true"; shift ;;
    --skip-nginx) SKIP_NGINX="true"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

echo "========================================"
echo " BabyDaily Deploy (LXC local)"
echo " Path: ${DEPLOY_PATH}"
echo " Node: v${NODE_VERSION}"
echo "========================================"

cd "${DEPLOY_PATH}"

echo ""
echo "[1/6] Prepare Node via fnm..."

# Ensure fnm is in PATH for non-interactive execution.
export PATH="/opt/homebrew/bin:/home/linuxbrew/.linuxbrew/bin:/usr/local/bin:${HOME}/.local/share/fnm:${HOME}/.fnm:${HOME}/.cargo/bin:${PATH}"

if ! command -v fnm >/dev/null 2>&1; then
  echo "ERROR: fnm not found in PATH: ${PATH}" >&2
  echo "Hint: ensure fnm is installed and available at /opt/homebrew/bin/fnm or add it to PATH." >&2
  exit 1
fi

eval "$(fnm env)"
fnm install "${NODE_VERSION}" >/dev/null 2>&1 || fnm install "${NODE_VERSION}"
fnm use "${NODE_VERSION}"

echo ">> Node: $(node -v)"
echo ">> npm : $(npm -v)"

echo ""
echo "[2/6] Database (Postgres docker)..."
if [[ "${SKIP_DB}" == "true" ]]; then
  echo ">> Skip DB"
else
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: docker not found. Install docker or use --skip-db." >&2
    exit 1
  fi

  mkdir -p "${DEPLOY_PATH}/database/postgres"

  if [[ -f "${DEPLOY_PATH}/docker-compose.db.yml" ]]; then
    docker compose -f "${DEPLOY_PATH}/docker-compose.db.yml" up -d
  elif [[ -f "${DEPLOY_PATH}/docker-compose.prod.yml" ]]; then
    docker compose -f "${DEPLOY_PATH}/docker-compose.prod.yml" up -d postgres
  else
    echo "ERROR: docker-compose.db.yml or docker-compose.prod.yml not found in ${DEPLOY_PATH}" >&2
    exit 1
  fi

  echo ">> Wait postgres ready..."
  for _ in {1..30}; do
    if docker exec babydaily-postgres pg_isready -U postgres -d babydaily >/dev/null 2>&1; then
      echo ">> Postgres ready"
      break
    fi
    sleep 1
  done
fi

echo ""
echo "[3/6] Backend install + build..."
cd "${DEPLOY_PATH}/backend"
npm install --production=false
npm run build

echo ""
echo "[4/6] Frontend install + build..."
cd "${DEPLOY_PATH}/frontend"
npm install
NODE_OPTIONS="--max-old-space-size=${FRONTEND_HEAP_MB}" npm run build

echo ""
echo "[5/6] Nginx config..."
if [[ "${SKIP_NGINX}" == "true" ]]; then
  echo ">> Skip Nginx"
else
  if ! command -v nginx >/dev/null 2>&1; then
    echo "ERROR: nginx not found. Install nginx or use --skip-nginx." >&2
    exit 1
  fi

  cat > /etc/nginx/sites-available/babydaily <<EOF
server {
    listen 80;
    server_name _;

    location / {
        root ${DEPLOY_PATH}/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:${BACKEND_PORT}/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location /uploads/ {
        alias ${DEPLOY_PATH}/backend/uploads/;
    }
}
EOF

  ln -sf /etc/nginx/sites-available/babydaily /etc/nginx/sites-enabled/
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

  nginx -t
  systemctl reload nginx 2>/dev/null || service nginx reload
  echo ">> Nginx reloaded"
fi

echo ""
echo "[6/6] PM2 restart..."
cd "${DEPLOY_PATH}"

mkdir -p backend/uploads/avatars

if ! command -v pm2 >/dev/null 2>&1; then
  echo ">> pm2 not found, installing..."
  npm install -g pm2
fi

if pm2 describe babydaily-backend >/dev/null 2>&1; then
  pm2 restart babydaily-backend
else
  pm2 start ecosystem.config.js
fi

pm2 save
pm2 status

echo ""
echo "========================================"
echo "DONE"
echo "Frontend: http://<LXC_IP>/"
echo "Backend : http://<LXC_IP>:${BACKEND_PORT}/"
echo "========================================"

