param(
    [switch]$SkipDocker
)

$ErrorActionPreference = "Stop"

# Helper functions
function Initialize-FNM {
    if (-not (Get-Command node -ErrorAction SilentlyContinue) -and (Get-Command fnm -ErrorAction SilentlyContinue)) {
        Write-Host "[env] Node not found but fnm detected. Initializing fnm..." -ForegroundColor DarkGray
        fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
    }
}

function Ensure-Command {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [string]$InstallHint = ""
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        if ($InstallHint) {
            throw "$Name is not installed. $InstallHint"
        }
        throw "$Name is not installed. Please install it first."
    }
}

function Ensure-Dependencies {
    param([Parameter(Mandatory = $true)][string]$Path)

    $nodeModules = Join-Path $Path "node_modules"
    if (-not (Test-Path $nodeModules)) {
        Write-Host "[deps] Installing packages in $Path" -ForegroundColor Cyan
        npm install --prefix $Path
    }
    else {
        Write-Host "[deps] node_modules found in $Path; skipping install" -ForegroundColor DarkGray
    }
}

function Start-Docker {
    param([switch]$SkipDocker)

    if ($SkipDocker) {
        Write-Host "[docker] Skipped per flag" -ForegroundColor DarkGray
        return
    }

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Warning "[docker] Docker not found; skip starting postgres/redis. Start them manually if needed."
        return
    }

    Write-Host "[docker] Starting postgres + redis (docker compose up -d)" -ForegroundColor Cyan
    docker compose up -d
}

function Start-ProcessWindow {
    param(
        [Parameter(Mandatory = $true)][string]$Title,
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Command
    )

    $escapedPath = $Path.Replace('"', '`"')
    $fnmCheck = 'if (Get-Command fnm -ErrorAction SilentlyContinue) { fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression }; '
    $cmd = "cd `"$escapedPath`"; $fnmCheck$Command"
    Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $cmd) -WorkingDirectory $Path
    Write-Host "[start] $Title -> $Command" -ForegroundColor Green
}

# Script entry
$root = (Resolve-Path "$PSScriptRoot/..").Path
$backendPath = Join-Path $root "backend"
$frontendPath = Join-Path $root "frontend"

Write-Host "BabyDaily one-click start" -ForegroundColor Cyan
Write-Host "Root: $root" -ForegroundColor DarkGray

Initialize-FNM
Ensure-Command -Name "node" -InstallHint "Install from https://nodejs.org/"
Ensure-Command -Name "npm" -InstallHint "Install from https://nodejs.org/"

Start-Docker -SkipDocker:$SkipDocker

Ensure-Dependencies -Path $backendPath
Ensure-Dependencies -Path $frontendPath

if (-not (Test-Path (Join-Path $backendPath ".env"))) {
    Write-Warning "[env] backend/.env not found. Copy backend/.env.example and adjust DB credentials before running."
}

Start-ProcessWindow -Title "BabyDaily Backend" -Path $backendPath -Command "npm run start:dev"
Start-ProcessWindow -Title "BabyDaily Frontend" -Path $frontendPath -Command "npm run dev -- --host"

Write-Host ""
Write-Host "Backend: http://localhost:3000 (Swagger: /api/docs)" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173 (Dashboard: /web, Mobile: /mobile, OOTD: /ootd)" -ForegroundColor Yellow
Write-Host "Tip: use -SkipDocker to bypass docker compose if Postgres/Redis are already running." -ForegroundColor DarkGray
