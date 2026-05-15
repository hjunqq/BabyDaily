<#
.SYNOPSIS
    Production DB backup + schema migration helper for BabyDaily.
.DESCRIPTION
    Before deploying new backend code that adds new RecordType enum values,
    this script:
      1) Verifies SSH + remote containers are healthy
      2) Dumps the postgres DB to a timestamped tar in $DeployPath/database/backups/
      3) Uploads the migration SQL(s) and applies them inside babydaily-postgres
      4) Verifies the new enum values exist

    Safe to run multiple times — all migrations are idempotent.
    Run this BEFORE deploy.ps1 when shipping changes that touch enums.
#>
param(
    [string]$DeployHost = "192.168.8.106",
    [string]$DeployUser = "root",
    [string]$DeployPath = "/opt/BabyDaily",
    [string]$SshKey = "$env:USERPROFILE\.ssh\CommonPrivateKey",
    [string]$PostgresContainer = "babydaily-postgres",
    [string]$DbName = "babydaily",
    [string]$DbUser = "postgres",
    [switch]$SkipBackup,
    [string[]]$MigrationFiles = @("migrate-records-topical-solids.sql")
)

$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
[Console]::OutputEncoding = $Utf8NoBom
$OutputEncoding = $Utf8NoBom
$ErrorActionPreference = "Stop"

$SshTarget = "$DeployUser@$DeployHost"

function Invoke-RemoteBash {
    param([string]$Script)
    # Normalize to LF and write to a temp file without BOM, then feed via cmd's redirect
    # so PowerShell's stdin-encoding quirks don't add BOM/CR back.
    $lf = $Script -replace "`r`n", "`n"
    $tmp = [System.IO.Path]::GetTempFileName()
    try {
        [System.IO.File]::WriteAllText($tmp, $lf, $Utf8NoBom)
        & cmd /c "ssh -i `"$SshKey`" $SshTarget bash -s < `"$tmp`""
        if ($LASTEXITCODE -ne 0) { throw "Remote bash failed (exit $LASTEXITCODE)" }
    }
    finally {
        Remove-Item $tmp -ErrorAction SilentlyContinue
    }
}

function Invoke-Scp {
    param([string]$LocalFile, [string]$RemotePath)
    & scp -i "$SshKey" "$LocalFile" "${SshTarget}:${RemotePath}"
    if ($LASTEXITCODE -ne 0) { throw "SCP failed: $LocalFile" }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BabyDaily DB Migration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "[config] Host: $DeployHost | Path: $DeployPath" -ForegroundColor DarkGray
Write-Host "[config] Container: $PostgresContainer | DB: $DbName | User: $DbUser" -ForegroundColor DarkGray
Write-Host "[config] Migrations: $($MigrationFiles -join ', ')" -ForegroundColor DarkGray

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupRel = "database/backups/${DbName}_${Timestamp}.dump"

# ===== 1. Sanity check =====
Write-Host "`n[1/4] Verifying remote state..." -ForegroundColor Yellow
$sanityScript = @"
set -e
docker ps --filter name=$PostgresContainer --format '{{.Names}} {{.Status}}'
echo '--- enum before ---'
docker exec $PostgresContainer psql -U $DbUser -d $DbName -tA <<'SQL'
SELECT string_agg(unnest::text, ',') FROM unnest(enum_range(NULL::records_type_enum));
SQL
"@
Invoke-RemoteBash -Script $sanityScript

# ===== 2. Backup =====
if ($SkipBackup) {
    Write-Host "`n[2/4] Skipping backup (per -SkipBackup)" -ForegroundColor Yellow
}
else {
    Write-Host "`n[2/4] Backing up DB to $DeployPath/$BackupRel ..." -ForegroundColor Yellow
    $backupScript = @"
set -e
cd $DeployPath
mkdir -p database/backups
docker exec $PostgresContainer pg_dump -U $DbUser -F c -d $DbName -f /tmp/dump.bin
docker cp ${PostgresContainer}:/tmp/dump.bin $BackupRel
docker exec $PostgresContainer rm -f /tmp/dump.bin
ls -lh $BackupRel
"@
    Invoke-RemoteBash -Script $backupScript
    Write-Host "   [OK] Backup saved" -ForegroundColor Green
}

# ===== 3. Upload + apply migrations =====
Write-Host "`n[3/4] Applying migrations..." -ForegroundColor Yellow
foreach ($file in $MigrationFiles) {
    $localPath = Join-Path $PSScriptRoot $file
    if (-not (Test-Path $localPath)) {
        throw "Migration file not found locally: $localPath"
    }
    $remoteTmp = "$DeployPath/migration-${Timestamp}-$file"
    Write-Host "   -> Upload $file" -ForegroundColor DarkGray
    Invoke-Scp -LocalFile $localPath -RemotePath $remoteTmp

    Write-Host "   -> Apply $file" -ForegroundColor DarkGray
    $applyScript = @"
set -e
docker cp $remoteTmp ${PostgresContainer}:/tmp/$file
docker exec $PostgresContainer psql -U $DbUser -d $DbName -f /tmp/$file
docker exec $PostgresContainer rm -f /tmp/$file
rm -f $remoteTmp
"@
    Invoke-RemoteBash -Script $applyScript
    Write-Host "   [OK] $file applied" -ForegroundColor Green
}

# ===== 4. Verify =====
Write-Host "`n[4/4] Verifying enum after migration..." -ForegroundColor Yellow
$verifyScript = @"
set -e
docker exec $PostgresContainer psql -U $DbUser -d $DbName -tA <<'SQL'
SELECT string_agg(unnest::text, ',') FROM unnest(enum_range(NULL::records_type_enum));
SQL
"@
Invoke-RemoteBash -Script $verifyScript

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Migration step done." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backup: $DeployPath/$BackupRel" -ForegroundColor White
Write-Host "  Next: run .\scripts\deploy.ps1 to push new code" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan
