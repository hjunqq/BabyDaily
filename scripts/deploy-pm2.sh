#!/usr/bin/env bash
# BabyDaily one-click deployment (PM2 backend + Nginx frontend + Docker Postgres)
# Run on your local machine (macOS/Linux) to deploy to an Intel LXC host.

set -euo pipefail

SERVER_IP="192.168.8.106"
SERVER_USER="root"
DEPLOY_PATH="/opt/BabyDaily"
FRONTEND_HEAP_MB="4096"
NODE_VERSION="24"
SKIP_DB="false"
SKIP_NGINX="false"
SSH_OPTS="-o StrictHostKeyChecking=no"

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options]

Options:
  --host <ip-or-hostname>   Deploy host (default: ${SERVER_IP})
  --user <ssh-user>         SSH user (default: ${SERVER_USER})
  --path <remote-path>      Remote deploy path (default: ${DEPLOY_PATH})
  --frontend-heap <mb>      Node heap for frontend build (default: ${FRONTEND_HEAP_MB})
  --node-version <ver>      Node version via fnm (default: ${NODE_VERSION})
  --skip-db                 Skip postgres docker update/start
  --skip-nginx              Skip nginx config/reload
  --strict-host-checking    Enable strict host key checking
  -h, --help                Show help

Example:
  ./scripts/deploy-pm2.sh --host 192.168.8.106 --user root --path /opt/BabyDaily
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) SERVER_IP="$2"; shift 2 ;;
    --user) SERVER_USER="$2"; shift 2 ;;
    --path) DEPLOY_PATH="$2"; shift 2 ;;
    --frontend-heap) FRONTEND_HEAP_MB="$2"; shift 2 ;;
    --node-version) NODE_VERSION="$2"; shift 2 ;;
    --skip-db) SKIP_DB="true"; shift ;;
    --skip-nginx) SKIP_NGINX="true"; shift ;;
    --strict-host-checking) SSH_OPTS=""; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

echo "========================================"
echo "  BabyDaily 一键部署脚本 (PM2 + Nginx + Postgres)"
echo "========================================"

# 1. 同步代码到服务器
echo ""
echo "[1/6] 同步代码到服务器..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude 'uploads' \
    --exclude 'database/postgres' \
    --exclude '.env.local' \
    -e "ssh ${SSH_OPTS}" \
    ./ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/

# 2. 确保数据库容器运行
echo ""
echo "[2/6] 更新/启动数据库(Postgres)..."
ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_IP} bash -s -- "${DEPLOY_PATH}" "${SKIP_DB}" << 'ENDSSH'
set -euo pipefail
DEPLOY_PATH="$1"
SKIP_DB="$2"

cd "${DEPLOY_PATH}"
mkdir -p database/postgres

if [[ "${SKIP_DB}" == "true" ]]; then
  echo ">> 跳过数据库步骤"
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker 未安装或不可用，无法启动 Postgres" >&2
  exit 1
fi

echo ">> 启动/更新 Postgres 容器..."
docker compose -f docker-compose.db.yml up -d

echo ">> 等待 Postgres 就绪..."
for i in {1..30}; do
  if docker exec babydaily-postgres pg_isready -U postgres -d babydaily >/dev/null 2>&1; then
    echo ">> Postgres ready"
    exit 0
  fi
  sleep 1
done

echo "Postgres 未在预期时间内就绪" >&2
docker logs --tail=50 babydaily-postgres || true
exit 1
ENDSSH

# 3. 在服务器上安装依赖并构建
echo ""
echo "[3/6] 在服务器上安装依赖并构建..."
ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_IP} bash -s -- "${DEPLOY_PATH}" "${FRONTEND_HEAP_MB}" "${NODE_VERSION}" << 'ENDSSH'
set -euo pipefail
DEPLOY_PATH="$1"
FRONTEND_HEAP_MB="$2"
NODE_VERSION="$3"

cd "${DEPLOY_PATH}"

# Ensure Node v${NODE_VERSION} via fnm.
# Do NOT source ~/.bashrc here: non-interactive shells + `set -u` can break on PS1, etc.
if [[ -f /etc/profile ]]; then
  # shellcheck disable=SC1091
  source /etc/profile || true
fi
if [[ -f "${HOME}/.profile" ]]; then
  # shellcheck disable=SC1090
  source "${HOME}/.profile" || true
fi
if [[ -f "${HOME}/.bash_profile" ]]; then
  # shellcheck disable=SC1090
  source "${HOME}/.bash_profile" || true
fi
export PATH="/opt/homebrew/bin:/home/linuxbrew/.linuxbrew/bin:/usr/local/bin:${HOME}/.local/share/fnm:${HOME}/.fnm:${HOME}/.cargo/bin:${PATH}"

if ! command -v fnm >/dev/null 2>&1; then
  echo "fnm not found in non-interactive shell PATH." >&2
  echo "PATH=${PATH}" >&2
  ls -la "${HOME}/.local/share/fnm" 2>/dev/null || true
  ls -la "${HOME}/.fnm" 2>/dev/null || true
  ls -la "${HOME}/.cargo/bin" 2>/dev/null || true
  exit 1
fi

eval "$(fnm env)"
fnm install "${NODE_VERSION}" >/dev/null 2>&1 || fnm install "${NODE_VERSION}"
fnm use "${NODE_VERSION}"
echo ">> Using Node: $(node -v)"
# 安装后端依赖并构建
echo ">> 安装后端依赖..."
cd backend
npm install --production=false
npm run build
cd ..

# 安装前端依赖并构建
echo ">> 安装前端依赖..."
cd frontend
npm install
NODE_OPTIONS="--max-old-space-size=${FRONTEND_HEAP_MB}" npm run build
cd ..

echo ">> 依赖安装完成！"
ENDSSH

# 4. 配置 Nginx
echo ""
echo "[4/6] 配置 Nginx..."
ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_IP} bash -s -- "${DEPLOY_PATH}" "${SKIP_NGINX}" << 'ENDSSH'
set -euo pipefail
DEPLOY_PATH="$1"
SKIP_NGINX="$2"

if [[ "${SKIP_NGINX}" == "true" ]]; then
  echo ">> 跳过 Nginx 步骤"
  exit 0
fi

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/babydaily << 'EOF'
server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root __DEPLOY_PATH__/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 上传文件访问
    location /uploads/ {
        alias __DEPLOY_PATH__/backend/uploads/;
    }
}
EOF

# 替换占位符为真实路径
sed -i "s#__DEPLOY_PATH__#${DEPLOY_PATH}#g" /etc/nginx/sites-available/babydaily

# 启用站点
ln -sf /etc/nginx/sites-available/babydaily /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# 测试并重载 Nginx
nginx -t && systemctl reload nginx
echo ">> Nginx 配置完成！"
ENDSSH

# 5. 启动/重启 PM2
echo ""
echo "[5/6] 启动 PM2 服务..."
ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_IP} bash -s -- "${DEPLOY_PATH}" "${NODE_VERSION}" << 'ENDSSH'
set -euo pipefail
DEPLOY_PATH="$1"
NODE_VERSION="$2"
cd "${DEPLOY_PATH}"

# Ensure Node version for PM2 runtime as well (same reasoning: avoid ~/.bashrc).
if [[ -f /etc/profile ]]; then
  # shellcheck disable=SC1091
  source /etc/profile || true
fi
if [[ -f "${HOME}/.profile" ]]; then
  # shellcheck disable=SC1090
  source "${HOME}/.profile" || true
fi
if [[ -f "${HOME}/.bash_profile" ]]; then
  # shellcheck disable=SC1090
  source "${HOME}/.bash_profile" || true
fi
export PATH="/opt/homebrew/bin:/home/linuxbrew/.linuxbrew/bin:/usr/local/bin:${HOME}/.local/share/fnm:${HOME}/.fnm:${HOME}/.cargo/bin:${PATH}"

if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env)"
  fnm install "${NODE_VERSION}" >/dev/null 2>&1 || fnm install "${NODE_VERSION}"
  fnm use "${NODE_VERSION}"
fi

# Ensure pm2 exists under this node version
if ! command -v pm2 >/dev/null 2>&1; then
  echo ">> pm2 not found, installing..."
  npm install -g pm2
fi

# 确保 uploads 目录存在
mkdir -p backend/uploads/avatars

# 使用 PM2 启动或重启
if pm2 describe babydaily-backend > /dev/null 2>&1; then
    echo ">> 重启后端服务..."
    pm2 restart babydaily-backend
else
    echo ">> 首次启动后端服务..."
    pm2 start ecosystem.config.js
fi

# 保存 PM2 进程列表
pm2 save

echo ">> PM2 服务启动完成！"
ENDSSH

# 6. 显示状态
echo ""
echo "[6/6] 部署完成！"
echo ""
ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_IP} "pm2 status"
echo ""
echo "========================================"
echo "  部署成功！"
echo "  访问地址: http://${SERVER_IP}"
echo "========================================"
