# BabyDaily PM2 部署脚本 (PowerShell 版本)
# 在 Windows 上运行此脚本部署到 Linux 服务器

param(
    [switch]$SetupOnly,  # 仅运行服务器初始化
    [switch]$DeployOnly  # 仅部署（跳过初始化）
)

$ErrorActionPreference = "Stop"

# 服务器配置
$SERVER_IP = "192.168.8.106"
$SERVER_USER = "root"
$DEPLOY_PATH = "/opt/babydaily"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BabyDaily PM2 部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 检查 SSH 连接
Write-Host ""
Write-Host "[0/5] 检查 SSH 连接..." -ForegroundColor Yellow
try {
    ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "echo 'SSH 连接成功'"
}
catch {
    Write-Host "无法连接到服务器 ${SERVER_IP}" -ForegroundColor Red
    exit 1
}

if (-not $DeployOnly) {
    # 1. 首次设置检查
    Write-Host ""
    Write-Host "[1/5] 检查服务器环境..." -ForegroundColor Yellow
    $hasNode = ssh ${SERVER_USER}@${SERVER_IP} "which node 2>/dev/null || echo 'NOT_FOUND'"
    if ($hasNode -eq "NOT_FOUND") {
        Write-Host "  -> 需要初始化服务器，正在安装依赖..." -ForegroundColor Yellow
        # 复制设置脚本到服务器并执行
        scp -o StrictHostKeyChecking=no scripts/setup-server.sh ${SERVER_USER}@${SERVER_IP}:/tmp/
        ssh ${SERVER_USER}@${SERVER_IP} "chmod +x /tmp/setup-server.sh && /tmp/setup-server.sh"
    }
    else {
        Write-Host "  -> 服务器环境已就绪" -ForegroundColor Green
    }
}

if ($SetupOnly) {
    Write-Host ""
    Write-Host "服务器初始化完成！使用 -DeployOnly 参数部署应用。" -ForegroundColor Green
    exit 0
}

# 2. 同步代码
Write-Host ""
Write-Host "[2/5] 同步代码到服务器..." -ForegroundColor Yellow

# 创建目录
ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${DEPLOY_PATH}"

# 使用 scp 同步关键文件（Windows 没有 rsync）
$filesToSync = @(
    "ecosystem.config.js",
    "package.json"
)

foreach ($file in $filesToSync) {
    if (Test-Path $file) {
        scp -o StrictHostKeyChecking=no $file ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/
    }
}

# 同步 backend 目录
Write-Host "  -> 同步 backend..." 
scp -r -o StrictHostKeyChecking=no backend/src ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/backend/
scp -o StrictHostKeyChecking=no backend/package*.json ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/backend/
scp -o StrictHostKeyChecking=no backend/tsconfig*.json ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/backend/
scp -o StrictHostKeyChecking=no backend/nest-cli.json ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/backend/

# 同步 frontend 目录  
Write-Host "  -> 同步 frontend..."
scp -r -o StrictHostKeyChecking=no frontend/src ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/frontend/
scp -r -o StrictHostKeyChecking=no frontend/public ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/frontend/
scp -o StrictHostKeyChecking=no frontend/package*.json ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/frontend/
scp -o StrictHostKeyChecking=no frontend/index.html ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/frontend/
scp -o StrictHostKeyChecking=no frontend/vite.config.ts ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/frontend/
scp -o StrictHostKeyChecking=no frontend/tsconfig*.json ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/frontend/
scp -o StrictHostKeyChecking=no frontend/nginx.conf ${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/frontend/

# 3. 服务器端构建
Write-Host ""
Write-Host "[3/5] 在服务器上构建应用..." -ForegroundColor Yellow

$buildScript = @'
cd /opt/babydaily

# 构建后端
echo ">> 安装后端依赖..."
cd backend
npm install
echo ">> 构建后端..."
npm run build
cd ..

# 构建前端
echo ">> 安装前端依赖..."
cd frontend
npm install
echo ">> 构建前端..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build
cd ..

echo ">> 构建完成！"
'@

ssh ${SERVER_USER}@${SERVER_IP} $buildScript

# 4. 配置 Nginx
Write-Host ""
Write-Host "[4/5] 配置 Nginx..." -ForegroundColor Yellow

$nginxConfig = @'
cat > /etc/nginx/sites-available/babydaily << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        root /opt/babydaily/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        alias /opt/babydaily/backend/uploads/;
    }
}
EOF

ln -sf /etc/nginx/sites-available/babydaily /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t && systemctl reload nginx
echo ">> Nginx 配置完成！"
'@

ssh ${SERVER_USER}@${SERVER_IP} $nginxConfig

# 5. 启动 PM2
Write-Host ""
Write-Host "[5/5] 启动 PM2 服务..." -ForegroundColor Yellow

$pm2Script = @'
cd /opt/babydaily
mkdir -p backend/uploads/avatars

if pm2 describe babydaily-backend > /dev/null 2>&1; then
    echo ">> 重启后端服务..."
    pm2 restart babydaily-backend
else
    echo ">> 首次启动后端服务..."
    pm2 start ecosystem.config.js
fi

pm2 save
pm2 status
'@

ssh ${SERVER_USER}@${SERVER_IP} $pm2Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  部署成功！" -ForegroundColor Green
Write-Host "  访问地址: http://${SERVER_IP}" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
