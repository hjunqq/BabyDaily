param(
    [ValidateSet('start', 'stop', 'restart', 'status')]
    [string]$Action = "status",

    [ValidateSet('dev', 'prod')]
    [string]$Mode = "dev",

    [switch]$SkipDocker,
    [switch]$ForceBuild
)

$ErrorActionPreference = "Stop"

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

function Get-PidFile {
    param([string]$Mode)
    $pidDir = Join-Path $PSScriptRoot ".pids"
    if (-not (Test-Path $pidDir)) {
        New-Item -ItemType Directory -Path $pidDir | Out-Null
    }
    return (Join-Path $pidDir "backend-$Mode.pid")
}

function Read-PidInfo {
    param([string]$PidFile)
    if (-not (Test-Path $PidFile)) { return $null }

    try {
        return Get-Content $PidFile | ConvertFrom-Json
    }
    catch {
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
        return $null
    }
}

function Save-PidInfo {
    param([string]$PidFile, [System.Diagnostics.Process]$Process)
    $info = @{ pid = $Process.Id; startTime = $Process.StartTime.ToString("o") }
    $info | ConvertTo-Json | Set-Content -Path $PidFile -Encoding UTF8
}

function Clear-PidInfo {
    param([string]$PidFile)
    if (Test-Path $PidFile) {
        Remove-Item $PidFile -Force
    }
}

function Resolve-ProcessFromPid {
    param([string]$PidFile)

    $info = Read-PidInfo -PidFile $PidFile
    if (-not $info) { return $null }

    $proc = Get-Process -Id $info.pid -ErrorAction SilentlyContinue
    if (-not $proc) {
        Clear-PidInfo -PidFile $PidFile
        return $null
    }

    # If start time matches, consider it ours; otherwise, likely recycled PID.
    if ($info.startTime -and $proc.StartTime.ToString("o") -ne $info.startTime) {
        Write-Warning "[status] PID $($info.pid) was recycled; clearing stale pid file."
        Clear-PidInfo -PidFile $PidFile
        return $null
    }

    return $proc
}

function Get-PortOwner {
    param([int]$Port)
    try {
        return Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
    }
    catch {
        return $null
    }
}

function Ensure-Build {
    param([string]$BackendPath, [switch]$ForceBuild)

    $distMain = Join-Path $BackendPath "dist/main.js"
    if ($ForceBuild -or -not (Test-Path $distMain)) {
        Write-Host "[build] npm run build (backend)" -ForegroundColor Cyan
        npm --prefix $BackendPath run build
    }
    else {
        Write-Host "[build] dist/main.js found; skip build (use -ForceBuild to rebuild)" -ForegroundColor DarkGray
    }
}

function Start-Backend {
    param(
        [string]$BackendPath,
        [string]$Mode,
        [string]$PidFile,
        [switch]$SkipDocker,
        [switch]$ForceBuild
    )

    Ensure-Command -Name "node" -InstallHint "Install from https://nodejs.org/"
    Ensure-Command -Name "npm" -InstallHint "Install from https://nodejs.org/"

    $existing = Resolve-ProcessFromPid -PidFile $PidFile
    if ($existing) {
        Write-Host "[start] backend ($Mode) already running (pid $($existing.Id))" -ForegroundColor Yellow
        return
    }

    Start-Docker -SkipDocker:$SkipDocker
    Ensure-Dependencies -Path $BackendPath

    if ($Mode -eq "prod") {
        Ensure-Build -BackendPath $BackendPath -ForceBuild:$ForceBuild
        $command = "npm run start:prod"
    }
    else {
        $command = "npm run start:dev"
    }

    $escapedPath = $BackendPath.Replace('`"', '``"')
    $psCmd = "cd `"$escapedPath`"; $command"
    $process = Start-Process -FilePath "powershell" -ArgumentList @("-NoExit", "-Command", $psCmd) -WorkingDirectory $BackendPath -WindowStyle Minimized -PassThru

    Save-PidInfo -PidFile $PidFile -Process $process
    Write-Host "[start] backend ($Mode) started (pid $($process.Id))" -ForegroundColor Green
}

function Stop-Backend {
    param([string]$PidFile, [string]$Mode)

    $existing = Resolve-ProcessFromPid -PidFile $PidFile
    if (-not $existing) {
        Write-Host "[stop] backend ($Mode) not running" -ForegroundColor DarkGray
        return
    }

    Write-Host "[stop] stopping backend ($Mode) pid $($existing.Id)" -ForegroundColor Cyan
    Stop-Process -Id $existing.Id -Force
    Clear-PidInfo -PidFile $PidFile
    Write-Host "[stop] backend ($Mode) stopped" -ForegroundColor Green
}

function Show-Status {
    param([string]$PidFile, [string]$Mode)

    $existing = Resolve-ProcessFromPid -PidFile $PidFile
    if ($existing) {
        Write-Host "[status] backend ($Mode) running (pid $($existing.Id), started $($existing.StartTime))" -ForegroundColor Green
    }
    else {
        Write-Host "[status] backend ($Mode) not running" -ForegroundColor DarkGray
    }

    $portInfo = Get-PortOwner -Port 3000
    if ($portInfo) {
        Write-Host "[status] port 3000 in use by pid $($portInfo.OwningProcess) (state: $($portInfo.State))" -ForegroundColor Yellow
    }
}

# Entry
$root = (Resolve-Path "$PSScriptRoot/..").Path
$backendPath = Join-Path $root "backend"
$pidFile = Get-PidFile -Mode $Mode

switch ($Action) {
    "start"   { Start-Backend -BackendPath $backendPath -Mode $Mode -PidFile $pidFile -SkipDocker:$SkipDocker -ForceBuild:$ForceBuild }
    "stop"    { Stop-Backend -PidFile $pidFile -Mode $Mode }
    "restart" { Stop-Backend -PidFile $pidFile -Mode $Mode; Start-Backend -BackendPath $backendPath -Mode $Mode -PidFile $pidFile -SkipDocker:$SkipDocker -ForceBuild:$ForceBuild }
    "status"  { Show-Status -PidFile $pidFile -Mode $Mode }
    default   { Write-Error "Unknown action: $Action" }
}
