<#
.SYNOPSIS
    BabyDaily Project Initialization Script
.DESCRIPTION
    This script automates the setup of the BabyDaily project structure.
    It performs the following steps:
    1. Checks for necessary prerequisites (Node.js).
    2. Creates the main project directories (backend, frontend, miniprogram).
    3. Initializes the NestJS backend project.
.NOTES
    Author: Antigravity
    Date: 2025-12-05
#>

$ErrorActionPreference = "Stop"

function Write-Header {
    param([string]$Message)
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Yellow
}

# 1. Check Prerequisites
Write-Header "Checking Prerequisites"

try {
    $nodeVersion = node -v
    Write-Success "Node.js is installed: $nodeVersion"
}
catch {
    Write-Error "Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
}

# 2. Setup Directory Structure
Write-Header "Setting up Directory Structure"

$projectRoot = Get-Location
Write-Info "Project Root: $projectRoot"

$dirs = @("frontend", "miniprogram")

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
        Write-Success "Created directory: $dir"
    } else {
        Write-Info "Directory already exists: $dir"
    }
}

# 3. Initialize NestJS Backend
Write-Header "Initializing NestJS Backend"

if (-not (Test-Path "backend")) {
    Write-Info "Creating NestJS project in 'backend' folder..."
    Write-Info "This may take a few minutes as it installs dependencies."
    
    # Use npx to run the NestJS CLI without installing it globally
    # --package-manager npm: Use npm as the package manager
    # --skip-git: Skip git initialization (we'll manage git at the root)
    # --strict: Enable strict TypeScript mode (recommended for maintainability)
    npx @nestjs/cli new backend --package-manager npm --skip-git --strict
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "NestJS backend initialized successfully!"
    } else {
        Write-Error "Failed to initialize NestJS backend."
        exit 1
    }
} else {
    Write-Info "Backend directory already exists. Skipping initialization."
}

Write-Header "Initialization Complete!"
Write-Info "Next Steps:"
Write-Info "1. cd backend"
Write-Info "2. npm run start:dev"
