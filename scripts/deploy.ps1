<#
.SYNOPSIS
    BabyDaily 离线镜像发布脚本 (Offline Docker Deployment)
.DESCRIPTION
    构建镜像、打包并上传到远程服务器，支持离线部署。
    修复：1. 包含数据库镜像；2. 使用 LF 行尾符的远程脚本。
.PARAMETER DeployHost
    目标服务器 IP 或主机名，默认 192.168.8.106
.PARAMETER DeployUser
    SSH 用户名，默认 root
.PARAMETER DeployPath
    远程部署路径，默认 /opt/BabyDaily
#>
param(
    [string]$DeployHost = "192.168.8.106",
    [string]$DeployUser = "root",
    [string]$DeployPath = "/opt/BabyDaily"
)

$ErrorActionPreference = "Stop"
$ProjectPath = (Get-Item "$PSScriptRoot\..").FullName
$ImageFile = "$PSScriptRoot\babydaily-images.tar"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BabyDaily 部署脚本" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ===== 1. 构建镜像 =====
Write-Host "[1/4] 构建 Docker 镜像..." -ForegroundColor Yellow
Push-Location $ProjectPath
try {
    docker-compose build --no-cache
    if ($LASTEXITCODE -ne 0) { throw "Docker 构建失败" }
}
finally {
    Pop-Location
}
Write-Host "? 镜像构建完成" -ForegroundColor Green

# ===== 2. 导出镜像（包含 postgres） =====
Write-Host "`n[2/4] 导出镜像到文件..." -ForegroundColor Yellow
if (Test-Path $ImageFile) { Remove-Item $ImageFile -Force }

# 导出 backend, frontend 和 postgres 镜像
docker save babydaily-backend babydaily-frontend postgres:16-alpine -o $ImageFile
if ($LASTEXITCODE -ne 0) { throw "镜像导出失败" }

$ImageSizeMB = [math]::Round((Get-Item $ImageFile).Length / 1MB, 2)
Write-Host "? 镜像导出完成: $ImageFile ($ImageSizeMB MB)" -ForegroundColor Green

# ===== 3. 上传文件 =====
Write-Host "`n[3/4] 上传文件到服务器 ($DeployUser@$DeployHost)..." -ForegroundColor Yellow
$SshTarget = "$DeployUser@$DeployHost"

# 创建远程目录
Write-Host "   - 创建远程目录..." -ForegroundColor Gray
ssh $SshTarget "mkdir -p $DeployPath/uploads $DeployPath/database/postgres"
if ($LASTEXITCODE -ne 0) { throw "创建远程目录失败" }

# 准备上传文件列表
$FilesToUpload = @(
    "$ProjectPath\docker-compose.prod.yml",
    $ImageFile
)
if (Test-Path "$ProjectPath\backend\.env") {
    $FilesToUpload += "$ProjectPath\backend\.env"
}

# 批量上传
Write-Host "   - 上传文件..." -ForegroundColor Gray
foreach ($file in $FilesToUpload) {
    $fileName = Split-Path $file -Leaf
    Write-Host "     -> $fileName" -ForegroundColor DarkGray
    scp $file "${SshTarget}:$DeployPath/"
    if ($LASTEXITCODE -ne 0) { throw "上传 $fileName 失败" }
}
Write-Host "? 文件上传完成" -ForegroundColor Green

# ===== 4. 远程部署 =====
Write-Host "`n[4/4] 执行远程部署命令..." -ForegroundColor Yellow

# 构建远程脚本
$RemoteScript = @"
#!/bin/bash
set -e
cd $DeployPath

echo '>>> 准备配置文件...'
if [ -f docker-compose.prod.yml ]; then
    mv docker-compose.prod.yml docker-compose.yml
fi

echo '>>> 加载 Docker 镜像...'
docker load -i babydaily-images.tar

echo '>>> 停止旧容器...'
docker compose down --remove-orphans 2>/dev/null || true

echo '>>> 启动新容器...'
docker compose up -d

echo '>>> 清理临时文件...'
rm -f babydaily-images.tar

echo '>>> 查看容器状态...'
docker compose ps

echo '>>> 部署完成!'
"@

# 转换为 LF 行尾符（Linux 格式）
$RemoteScriptLF = $RemoteScript -replace "`r`n", "`n"

# 执行远程脚本
Write-Host "   - 执行远程部署脚本..." -ForegroundColor Gray
$RemoteScriptLF | ssh $SshTarget 'bash -s'
if ($LASTEXITCODE -ne 0) { throw "远程部署命令执行失败" }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ? 部署成功!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n前端访问地址: http://${DeployHost}:8080" -ForegroundColor White
Write-Host "后端API地址: http://${DeployHost}:3000" -ForegroundColor White
Write-Host ""

# 清理本地临时文件
Write-Host "清理本地临时文件..." -ForegroundColor Gray
if (Test-Path $ImageFile) { Remove-Item $ImageFile -Force }
Write-Host "? 清理完成" -ForegroundColor Green
