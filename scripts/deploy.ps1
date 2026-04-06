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
    [string]$AccessPin = "",
    [string]$EnableDevLogin = "",
    [switch]$UploadProductionEnv,
    [switch]$SkipBuild,
    [switch]$NoBuildCache
)

# Fix encoding issue
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"
$ProjectPath = (Get-Item "$PSScriptRoot\..").FullName
$ImageFile = "$PSScriptRoot\babydaily-images.tar"
$FrontendEnvFile = Join-Path $ProjectPath "frontend\.env"
$BackendEnvFile = Join-Path $ProjectPath "backend\.env"
$ProductionEnvFile = Join-Path $PSScriptRoot ".env.production"

function Resolve-AccessPin {
    param(
        [string]$CliPin,
        [string]$EnvFilePath
    )

    if ($CliPin -and $CliPin.Trim()) {
        return $CliPin.Trim()
    }

    if (Test-Path $EnvFilePath) {
        $line = Get-Content $EnvFilePath | Where-Object { $_ -match '^\s*VITE_ACCESS_PIN\s*=' } | Select-Object -First 1
        if ($line) {
            $value = ($line -replace '^\s*VITE_ACCESS_PIN\s*=\s*', '').Trim()
            if ($value -match '^".*"$' -or $value -match "^'.*'$") {
                $value = $value.Substring(1, $value.Length - 2)
            }
            return $value
        }
    }

    return ""
}

function Resolve-FrontendEnvValue {
    param(
        [string]$CliValue,
        [string]$EnvFilePath,
        [string]$Key,
        [string]$DefaultValue
    )

    if ($CliValue -and $CliValue.Trim()) {
        return $CliValue.Trim()
    }

    if (Test-Path $EnvFilePath) {
        $line = Get-Content $EnvFilePath | Where-Object { $_ -match "^\s*$Key\s*=" } | Select-Object -First 1
        if ($line) {
            $value = ($line -replace "^\s*$Key\s*=\s*", '').Trim()
            if ($value -match '^".*"$' -or $value -match "^'.*'$") {
                $value = $value.Substring(1, $value.Length - 2)
            }
            return $value
        }
    }

    return $DefaultValue
}

function Get-EnvFileMap {
    param(
        [string]$EnvFilePath
    )

    $values = @{}
    if (-not (Test-Path $EnvFilePath)) {
        return $values
    }

    foreach ($line in Get-Content $EnvFilePath) {
        if ($line -match '^\s*#' -or $line -match '^\s*$') {
            continue
        }

        $parts = $line -split '=', 2
        if ($parts.Count -ne 2) {
            continue
        }

        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        if ($value -match '^".*"$' -or $value -match "^'.*'$") {
            $value = $value.Substring(1, $value.Length - 2)
        }
        $values[$key] = $value
    }

    return $values
}

function Get-RequiredEnvValue {
    param(
        [hashtable]$EnvMap,
        [string]$Key
    )

    $value = $EnvMap[$Key]
    if (-not $value -or -not $value.Trim()) {
        throw "Missing required value '$Key' in $BackendEnvFile"
    }

    return $value.Trim()
}

function Write-ProductionEnvFile {
    param(
        [string]$SourceEnvFile,
        [string]$DestinationEnvFile
    )

    if (-not (Test-Path $SourceEnvFile)) {
        throw "backend env file not found: $SourceEnvFile"
    }

    $envMap = Get-EnvFileMap -EnvFilePath $SourceEnvFile
    $dbUser = Get-RequiredEnvValue -EnvMap $envMap -Key "DB_USERNAME"
    $dbPassword = Get-RequiredEnvValue -EnvMap $envMap -Key "DB_PASSWORD"
    $dbName = if ($envMap.ContainsKey("DB_DATABASE") -and $envMap["DB_DATABASE"].Trim()) {
        $envMap["DB_DATABASE"].Trim()
    }
    else {
        "babydaily"
    }
    $jwtSecret = Get-RequiredEnvValue -EnvMap $envMap -Key "JWT_SECRET"
    $webAccessPin = if ($envMap.ContainsKey("WEB_ACCESS_PIN") -and $envMap["WEB_ACCESS_PIN"].Trim()) {
        $envMap["WEB_ACCESS_PIN"].Trim()
    }
    else {
        Resolve-AccessPin -CliPin $AccessPin -EnvFilePath $FrontendEnvFile
    }
    $wechatAppId = if ($envMap.ContainsKey("WECHAT_APPID")) { $envMap["WECHAT_APPID"].Trim() } else { "" }
    $wechatSecret = if ($envMap.ContainsKey("WECHAT_SECRET")) { $envMap["WECHAT_SECRET"].Trim() } else { "" }
    $adminUsername = if ($envMap.ContainsKey("ADMIN_USERNAME")) { $envMap["ADMIN_USERNAME"].Trim() } else { "" }
    $adminPassword = if ($envMap.ContainsKey("ADMIN_PASSWORD")) { $envMap["ADMIN_PASSWORD"].Trim() } else { "" }

    $content = @(
        "DB_USERNAME=$dbUser"
        "DB_PASSWORD=$dbPassword"
        "DB_DATABASE=$dbName"
        "JWT_SECRET=$jwtSecret"
        "WEB_ACCESS_PIN=$webAccessPin"
        "WECHAT_APPID=$wechatAppId"
        "WECHAT_SECRET=$wechatSecret"
        "ADMIN_USERNAME=$adminUsername"
        "ADMIN_PASSWORD=$adminPassword"
    )

    Set-Content -Path $DestinationEnvFile -Value $content -Encoding utf8
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BabyDaily Deploy Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ResolvedPin = Resolve-AccessPin -CliPin $AccessPin -EnvFilePath $FrontendEnvFile
$ResolvedDevLogin = Resolve-FrontendEnvValue -CliValue $EnableDevLogin -EnvFilePath $FrontendEnvFile -Key "VITE_ENABLE_DEV_LOGIN" -DefaultValue "false"
if ($ResolvedPin) {
    $env:VITE_ACCESS_PIN = $ResolvedPin
    Write-Host "[env] VITE_ACCESS_PIN loaded for frontend build" -ForegroundColor Green
}
else {
    Write-Host "[env] VITE_ACCESS_PIN is empty; PIN gate will be disabled in built frontend" -ForegroundColor Yellow
}
$env:VITE_ENABLE_DEV_LOGIN = $ResolvedDevLogin
Write-Host "[env] VITE_ENABLE_DEV_LOGIN=$ResolvedDevLogin (frontend build)" -ForegroundColor Cyan
if ($ResolvedDevLogin -eq "true") {
    Write-Host "[warn] Frontend dev login is enabled for this build. Do not deploy this setting to production unless you explicitly intend to." -ForegroundColor Yellow
}

if ($UploadProductionEnv) {
    Write-ProductionEnvFile -SourceEnvFile $BackendEnvFile -DestinationEnvFile $ProductionEnvFile
    Write-Host "[env] Generated production compose env: $ProductionEnvFile" -ForegroundColor Green
}
else {
    Write-Host "[env] Reusing remote .env.production (default safe behavior)" -ForegroundColor Cyan
}

# ===== 1. Build Images =====
if ($SkipBuild) {
    Write-Host "[1/4] Skip build (using existing images)" -ForegroundColor Yellow
    if ($ResolvedPin) {
        Write-Host "      Note: -SkipBuild is set, so updated VITE_ACCESS_PIN will NOT be baked into images." -ForegroundColor Yellow
    }
    Write-Host "      Note: -SkipBuild is set, so updated VITE_ENABLE_DEV_LOGIN will NOT be baked into images." -ForegroundColor Yellow
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

docker save babydaily-backend babydaily-frontend -o $ImageFile
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
if ($UploadProductionEnv) {
    $FilesToUpload += $ProductionEnvFile
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

if [ ! -f .env.production ]; then
    echo 'Missing .env.production on remote host.' >&2
    echo 'Run deploy.ps1 with -UploadProductionEnv for first-time setup, or create the file manually.' >&2
    exit 1
fi

echo '>>> Loading Docker images...'
docker load -i babydaily-images.tar

echo '>>> Stopping old containers...'
docker compose --env-file .env.production down --remove-orphans 2>/dev/null || true

echo '>>> Starting new containers...'
docker compose --env-file .env.production up -d

echo '>>> Cleaning up temp files...'
rm -f babydaily-images.tar

echo '>>> Container status...'
docker compose --env-file .env.production ps

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
if ($UploadProductionEnv -and (Test-Path $ProductionEnvFile)) { Remove-Item $ProductionEnvFile -Force }
Write-Host "[OK] Cleanup completed" -ForegroundColor Green
