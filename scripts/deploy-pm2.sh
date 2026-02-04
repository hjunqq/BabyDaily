#!/bin/bash
# BabyDaily PM2 部署脚本
# 在本地 Windows 上运行此脚本将代码同步到远程服务器并部署

set -e

# 服务器配置
SERVER_IP="192.168.8.106"
SERVER_USER="root"
DEPLOY_PATH="/opt/babydaily"

echo "========================================"
echo "  BabyDaily PM2 部署脚本"
echo "========================================"

# 1. 同步代码到服务器
echo ""
echo "[1/5] 同步代码到服务器..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude 'uploads' \
    --exclude '.env.local' \
    -e "ssh -o StrictHostKeyChecking=no" \
    ./ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/

# 2. 在服务器上执行部署
echo ""
echo "[2/5] 在服务器上安装依赖..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/babydaily

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
npm run build
cd ..

echo ">> 依赖安装完成！"
ENDSSH

# 3. 配置 Nginx
echo ""
echo "[3/5] 配置 Nginx..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# 创建 Nginx 配置
cat > /etc/nginx/sites-available/babydaily << 'EOF'
server {
    listen 80;
    server_name _;

    # 前端静态文件
    location / {
        root /opt/babydaily/frontend/dist;
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
        alias /opt/babydaily/backend/uploads/;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/babydaily /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# 测试并重载 Nginx
nginx -t && systemctl reload nginx
echo ">> Nginx 配置完成！"
ENDSSH

# 4. 启动/重启 PM2
echo ""
echo "[4/5] 启动 PM2 服务..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /opt/babydaily

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

# 5. 显示状态
echo ""
echo "[5/5] 部署完成！"
echo ""
ssh ${SERVER_USER}@${SERVER_IP} "pm2 status"
echo ""
echo "========================================"
echo "  部署成功！"
echo "  访问地址: http://${SERVER_IP}"
echo "========================================"
