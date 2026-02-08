<#
.SYNOPSIS
    BabyDaily Offline Docker Deployment Script
.DESCRIPTION
    Build images, package and upload to remote server for offline deployment.
.PARAMETER DeployHost
    Target server IP or hostname, default 192.168.8.106
.PARAMETER DeployUser
    SSH username, default root
.PARAMETER DeployPath
    Remote deployment path, default /opt/BabyDaily
.PARAMETER SkipBuild
    Skip build step, use existing images
.PARAMETER NoBuildCache
    Build without cache (full rebuild)
#>
param(
    [string]$DeployHost = "192.168.8.106",
    [string]$DeployUser = "root",
    [string]$DeployPath = "/opt/BabyDaily",
    [switch]$SkipBuild,
    [switch]$NoBuildCache
)

# Fix encoding issue
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"
$ProjectPath = (Get-Item "$PSScriptRoot\..").FullName
$ImageFile = "$PSScriptRoot\babydaily-images.tar"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BabyDaily Deploy Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ===== 1. Build Images =====
if ($SkipBuild) {
    Write-Host "[1/4] Skip build (using existing images)" -ForegroundColor Yellow
}
else {
    Write-Host "[1/4] Building Docker images..." -ForegroundColor Yellow
    Push-Location $ProjectPath
    try {
        if ($NoBuildCache) {
            Write-Host "   (using --no-cache for full rebuild)" -ForegroundColor Gray
            docker-compose build --no-cache
        }
        else {
            docker-compose build
        }
        if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }
    }
    finally {
        Pop-Location
    }
    Write-Host "[OK] Images built successfully" -ForegroundColor Green
}

# ===== 2. Export Images =====
Write-Host "`n[2/4] Exporting images to file..." -ForegroundColor Yellow
if (Test-Path $ImageFile) { Remove-Item $ImageFile -Force }

docker save babydaily-backend babydaily-frontend postgres:16-alpine -o $ImageFile
if ($LASTEXITCODE -ne 0) { throw "Image export failed" }

$ImageSizeMB = [math]::Round((Get-Item $ImageFile).Length / 1MB, 2)
Write-Host "[OK] Images exported: $ImageFile ($ImageSizeMB MB)" -ForegroundColor Green

# ===== 3. Upload Files =====
Write-Host "`n[3/4] Uploading files to server ($DeployUser@$DeployHost)..." -ForegroundColor Yellow
$SshTarget = "$DeployUser@$DeployHost"

ssh $SshTarget "mkdir -p $DeployPath/uploads $DeployPath/database/postgres"
if ($LASTEXITCODE -ne 0) { throw "Failed to create remote directory" }

$FilesToUpload = @(
    "$ProjectPath\docker-compose.prod.yml",
    $ImageFile
)
if (Test-Path "$ProjectPath\backend\.env") {
    $FilesToUpload += "$ProjectPath\backend\.env"
}

foreach ($file in $FilesToUpload) {
    $fileName = Split-Path $file -Leaf
    Write-Host "   -> $fileName" -ForegroundColor DarkGray
    scp $file "${SshTarget}:$DeployPath/"
    if ($LASTEXITCODE -ne 0) { throw "Failed to upload $fileName" }
}
Write-Host "[OK] Files uploaded successfully" -ForegroundColor Green

# ===== 4. Remote Deploy =====
Write-Host "`n[4/4] Executing remote deploy commands..." -ForegroundColor Yellow

$RemoteScript = @"
#!/bin/bash
set -e
cd $DeployPath

echo '>>> Preparing config files...'
if [ -f docker-compose.prod.yml ]; then
    mv docker-compose.prod.yml docker-compose.yml
fi

echo '>>> Loading Docker images...'
docker load -i babydaily-images.tar

echo '>>> Stopping old containers...'
docker compose down --remove-orphans 2>/dev/null || true

echo '>>> Starting new containers...'
docker compose up -d

echo '>>> Cleaning up temp files...'
rm -f babydaily-images.tar

echo '>>> Container status...'
docker compose ps

echo '>>> Deploy completed!'
"@

$RemoteScriptLF = $RemoteScript -replace "`r`n", "`n"
$RemoteScriptLF | ssh $SshTarget 'bash -s'
if ($LASTEXITCODE -ne 0) { throw "Remote deploy failed" }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  [OK] Deploy Successful!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nFrontend URL: http://${DeployHost}:8080" -ForegroundColor White
Write-Host "Backend API:  http://${DeployHost}:3000" -ForegroundColor White
Write-Host ""

# Cleanup local temp files
if (Test-Path $ImageFile) { Remove-Item $ImageFile -Force }
Write-Host "[OK] Cleanup completed" -ForegroundColor Green
