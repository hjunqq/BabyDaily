<#
.SYNOPSIS
    BabyDaily Local Build + Remote Deploy Script
.DESCRIPTION
    Build Docker images locally, export and upload to remote server for deployment.
    Uses docker-compose.prod.yml for production configuration.
.PARAMETER DeployHost
    Target server IP or hostname, default 192.168.8.106
.PARAMETER DeployUser
    SSH username, default root
.PARAMETER DeployPath
    Remote deployment path, default /opt/BabyDaily
.PARAMETER SshKey
    Path to SSH private key
.PARAMETER SkipBuild
    Skip build step, use existing images
.PARAMETER NoBuildCache
    Build without cache (full rebuild)
.PARAMETER UploadProductionEnv
    Generate and upload .env.production from local backend/.env
.PARAMETER BackendOnly
    Only rebuild and deploy the backend image
.PARAMETER FrontendOnly
    Only rebuild and deploy the frontend image
#>
param(
    [string]$DeployHost = "192.168.8.106",
    [string]$DeployUser = "root",
    [string]$DeployPath = "/opt/BabyDaily",
    [string]$SshKey = "$env:USERPROFILE\.ssh\CommonPrivateKey",
    [switch]$UploadProductionEnv,
    [switch]$SkipBuild,
    [switch]$NoBuildCache,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

# Fix encoding issue
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"
$ProjectPath = (Get-Item "$PSScriptRoot\..").FullName
$ImageFile = "$PSScriptRoot\babydaily-images.tar"
$BackendEnvFile = Join-Path $ProjectPath "backend\.env"
$ProductionEnvFile = Join-Path $PSScriptRoot ".env.production"

$SshTarget = "$DeployUser@$DeployHost"
$SshCmd = "ssh -i `"$SshKey`""
$ScpCmd = "scp -i `"$SshKey`""

function Run-Ssh {
    param([string]$Command)
    $fullCmd = "$SshCmd $SshTarget `"$Command`""
    $result = Invoke-Expression $fullCmd
    if ($LASTEXITCODE -ne 0) { throw "SSH command failed: $Command" }
    return $result
}

function Run-Scp {
    param([string]$LocalFile, [string]$RemotePath)
    $fullCmd = "$ScpCmd `"$LocalFile`" `"${SshTarget}:$RemotePath`""
    Invoke-Expression $fullCmd
    if ($LASTEXITCODE -ne 0) { throw "SCP failed: $LocalFile" }
}

function Get-EnvFileMap {
    param([string]$EnvFilePath)
    $values = @{}
    if (-not (Test-Path $EnvFilePath)) { return $values }
    foreach ($line in Get-Content $EnvFilePath) {
        if ($line -match '^\s*#' -or $line -match '^\s*$') { continue }
        $parts = $line -split '=', 2
        if ($parts.Count -ne 2) { continue }
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        if ($value -match '^".*"$' -or $value -match "^'.*'$") {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $values[$key] = $value
    }
    return $values
}

function Write-ProductionEnvFile {
    param([string]$SourceEnvFile, [string]$DestinationEnvFile)
    if (-not (Test-Path $SourceEnvFile)) {
        throw "backend env file not found: $SourceEnvFile"
    }
    $envMap = Get-EnvFileMap -EnvFilePath $SourceEnvFile
    $requiredKeys = @("DB_USERNAME", "DB_PASSWORD", "JWT_SECRET")
    foreach ($key in $requiredKeys) {
        if (-not $envMap.ContainsKey($key) -or -not $envMap[$key].Trim()) {
            throw "Missing required value '$key' in $SourceEnvFile"
        }
    }
    # Write all key=value pairs (excluding local-only keys)
    $localOnlyKeys = @("DB_HOST", "DB_PORT")
    $content = @()
    foreach ($key in $envMap.Keys) {
        if ($localOnlyKeys -contains $key) { continue }
        $content += "$key=$($envMap[$key])"
    }
    Set-Content -Path $DestinationEnvFile -Value $content -Encoding utf8
    Write-Host "[env] Generated: $DestinationEnvFile" -ForegroundColor Green
}

# ===== Start =====
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BabyDaily Deploy Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "[config] Host: $DeployHost | Path: $DeployPath" -ForegroundColor DarkGray
Write-Host "[config] SSH Key: $SshKey" -ForegroundColor DarkGray

# Resolve build args from backend/.env
$envMap = Get-EnvFileMap -EnvFilePath $BackendEnvFile
$ResolvedPin = if ($envMap.ContainsKey("WEB_ACCESS_PIN")) { $envMap["WEB_ACCESS_PIN"] } else { "" }
if ($ResolvedPin) {
    Write-Host "[env] VITE_ACCESS_PIN=$ResolvedPin (from backend/.env)" -ForegroundColor Green
} else {
    Write-Host "[env] VITE_ACCESS_PIN is empty; PIN gate disabled" -ForegroundColor Yellow
}

if ($UploadProductionEnv) {
    Write-ProductionEnvFile -SourceEnvFile $BackendEnvFile -DestinationEnvFile $ProductionEnvFile
}
else {
    Write-Host "[env] Reusing remote .env.production (use -UploadProductionEnv to override)" -ForegroundColor Cyan
}

# Determine which images to build
$BuildBackend = -not $FrontendOnly
$BuildFrontend = -not $BackendOnly

# ===== 1. Build Images Locally =====
if ($SkipBuild) {
    Write-Host "`n[1/4] Skip build (using existing images)" -ForegroundColor Yellow
}
else {
    Write-Host "`n[1/4] Building Docker images locally..." -ForegroundColor Yellow
    $cacheFlag = if ($NoBuildCache) { "--no-cache" } else { "" }

    if ($BuildBackend) {
        Write-Host "   Building backend..." -ForegroundColor DarkGray
        $cmd = "docker build $cacheFlag -t babydaily-backend `"$ProjectPath\backend`""
        Invoke-Expression $cmd
        if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
        Write-Host "   [OK] Backend built" -ForegroundColor Green
    }

    if ($BuildFrontend) {
        Write-Host "   Building frontend..." -ForegroundColor DarkGray
        $cmd = "docker build $cacheFlag --build-arg VITE_ACCESS_PIN=$ResolvedPin --build-arg VITE_ENABLE_DEV_LOGIN=false -t babydaily-frontend `"$ProjectPath\frontend`""
        Invoke-Expression $cmd
        if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
        Write-Host "   [OK] Frontend built" -ForegroundColor Green
    }
}

# ===== 2. Export Images =====
Write-Host "`n[2/4] Exporting images..." -ForegroundColor Yellow
if (Test-Path $ImageFile) { Remove-Item $ImageFile -Force }

$imagesToSave = @()
if ($BuildBackend -or (-not $FrontendOnly)) { $imagesToSave += "babydaily-backend" }
if ($BuildFrontend -or (-not $BackendOnly)) { $imagesToSave += "babydaily-frontend" }
$imageList = $imagesToSave -join " "

Invoke-Expression "docker save $imageList -o `"$ImageFile`""
if ($LASTEXITCODE -ne 0) { throw "Image export failed" }

$ImageSizeMB = [math]::Round((Get-Item $ImageFile).Length / 1MB, 1)
Write-Host "[OK] Exported: $ImageSizeMB MB" -ForegroundColor Green

# ===== 3. Upload Files =====
Write-Host "`n[3/4] Uploading to $DeployHost..." -ForegroundColor Yellow
Run-Ssh "mkdir -p $DeployPath/uploads $DeployPath/database/postgres"

$filesToUpload = @(
    @{ Local = "$ProjectPath\docker-compose.prod.yml"; Remote = "$DeployPath/" }
    @{ Local = $ImageFile; Remote = "$DeployPath/" }
)
if ($UploadProductionEnv) {
    $filesToUpload += @{ Local = $ProductionEnvFile; Remote = "$DeployPath/" }
}

foreach ($f in $filesToUpload) {
    $name = Split-Path $f.Local -Leaf
    Write-Host "   -> $name" -ForegroundColor DarkGray
    Run-Scp -LocalFile $f.Local -RemotePath $f.Remote
}
Write-Host "[OK] Upload complete" -ForegroundColor Green

# ===== 4. Remote Deploy =====
Write-Host "`n[4/4] Deploying on remote..." -ForegroundColor Yellow

$RemoteScript = @"
#!/bin/bash
set -e
cd $DeployPath

echo '>>> Applying production compose config...'
cp docker-compose.prod.yml docker-compose.yml

if [ ! -f .env.production ]; then
    echo 'ERROR: Missing .env.production on remote host.' >&2
    echo 'Run deploy.ps1 with -UploadProductionEnv for first-time setup.' >&2
    exit 1
fi

echo '>>> Loading Docker images...'
docker load -i babydaily-images.tar

echo '>>> Restarting services...'
docker compose --env-file .env.production down --remove-orphans 2>/dev/null || true
docker compose --env-file .env.production up -d

echo '>>> Cleaning up...'
rm -f babydaily-images.tar

echo '>>> Waiting for backend startup...'
sleep 3

echo '>>> Verifying deployment...'
docker compose --env-file .env.production ps

# Health check: verify backend responds
if docker exec babydaily-frontend wget -qO- --timeout=5 http://backend:3000/auth/session 2>/dev/null | grep -q 'Unauthorized\|user'; then
    echo '>>> Backend health check: OK'
else
    echo '>>> WARNING: Backend may not be responding correctly'
    docker logs babydaily-backend --tail 10
fi

echo '>>> Deploy completed!'
"@

$RemoteScriptLF = $RemoteScript -replace "`r`n", "`n"
$RemoteScriptLF | & ssh -i "$SshKey" $SshTarget 'bash -s'
if ($LASTEXITCODE -ne 0) { throw "Remote deploy failed" }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Deploy Successful!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  URL: http://$DeployHost" -ForegroundColor White
Write-Host "  Admin: http://$DeployHost/login" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan

# Cleanup local temp files
if (Test-Path $ImageFile) { Remove-Item $ImageFile -Force }
if ($UploadProductionEnv -and (Test-Path $ProductionEnvFile)) { Remove-Item $ProductionEnvFile -Force }
Write-Host "[OK] Local cleanup done" -ForegroundColor Green
