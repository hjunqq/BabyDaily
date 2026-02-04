#!/bin/bash
# BabyDaily 服务器首次设置脚本
# 在 LXC 主机上运行此脚本进行初始化

set -e

echo "========================================"
echo "  BabyDaily 服务器初始化"
echo "========================================"

# 1. 更新系统
echo ""
echo "[1/5] 更新系统..."
apt update && apt upgrade -y

# 2. 安装 Node.js 20
echo ""
echo "[2/5] 安装 Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. 安装 PM2
echo ""
echo "[3/5] 安装 PM2..."
npm install -g pm2

# 设置 PM2 开机自启
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

# 4. 安装 Nginx
echo ""
echo "[4/5] 安装 Nginx..."
apt install -y nginx

# 5. 创建部署目录
echo ""
echo "[5/5] 创建部署目录..."
mkdir -p /opt/babydaily
mkdir -p /opt/babydaily/backend/uploads/avatars

echo ""
echo "========================================"
echo "  服务器初始化完成！"
echo ""
echo "  Node.js: $(node -v)"
echo "  NPM: $(npm -v)"
echo "  PM2: $(pm2 -v)"
echo ""
echo "  下一步: 在本地运行 deploy-pm2.sh 部署应用"
echo "========================================"
