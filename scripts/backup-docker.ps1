# ============================================
# BabyDaily Docker 数据库备份脚本
# ============================================
# 用于备份运行在 Docker 中的 PostgreSQL 数据库
# 
# 使用方法:
#   .\backup-docker.ps1                    # 导出所有表到CSV
#   .\backup-docker.ps1 -Action backup     # 完整SQL备份
#   .\backup-docker.ps1 -Action list       # 列出已有备份

param(
    [Parameter(Position = 0)]
    [ValidateSet("export", "backup", "list")]
    [string]$Action = "export",
    
    [string]$ContainerName = "babydaily-postgres",
    [string]$DbName = "babydaily",
    [string]$DbUser = "postgres"
)

$ErrorActionPreference = "Stop"

# 路径设置
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$backupsDir = Join-Path $projectRoot "database-backups"
$exportsDir = Join-Path $projectRoot "database-exports"

# 确保目录存在
if (-not (Test-Path $backupsDir)) { New-Item -ItemType Directory -Path $backupsDir -Force | Out-Null }
if (-not (Test-Path $exportsDir)) { New-Item -ItemType Directory -Path $exportsDir -Force | Out-Null }

# ============================================
# 辅助函数
# ============================================

function Show-Banner {
    Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║   BabyDaily Docker 数据库备份工具      ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Test-DockerContainer {
    $container = docker ps --filter "name=$ContainerName" --format "{{.Names}}" 2>$null
    if ($container -eq $ContainerName) {
        Write-Host "✓ 找到 Docker 容器: $ContainerName" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "✗ 未找到运行中的容器: $ContainerName" -ForegroundColor Red
        Write-Host "  请确保 Docker 容器正在运行" -ForegroundColor Yellow
        return $false
    }
}

function Export-ToCSV {
    Write-Host "`n开始导出数据到 CSV...`n" -ForegroundColor Cyan
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $exportPath = Join-Path $exportsDir $timestamp
    New-Item -ItemType Directory -Path $exportPath -Force | Out-Null
    
    # 获取所有用户表
    $tables = @("users", "families", "family_members", "babies", "records", "ootd", "notifications", "user_settings")
    
    $successCount = 0
    $totalRows = 0
    
    foreach ($table in $tables) {
        Write-Host "  导出: $table..." -NoNewline
        
        try {
            # 获取记录数
            $countResult = docker exec $ContainerName psql -U $DbUser -d $DbName -t -c "SELECT COUNT(*) FROM $table;" 2>$null
            $count = if ($countResult) { $countResult.Trim() } else { "0" }
            
            # 导出到CSV（在容器内）
            $csvContent = docker exec $ContainerName psql -U $DbUser -d $DbName -c "\COPY (SELECT * FROM $table ORDER BY created_at) TO STDOUT WITH CSV HEADER" 2>$null
            
            if ($csvContent) {
                $csvFile = Join-Path $exportPath "$table.csv"
                $csvContent | Out-File -FilePath $csvFile -Encoding UTF8
                $fileSize = (Get-Item $csvFile).Length
                Write-Host " ✓ ($count 条, $([math]::Round($fileSize/1KB, 2)) KB)" -ForegroundColor Green
                $successCount++
                $totalRows += [int]$count
            }
            else {
                Write-Host " ⊘ 空表" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host " ✗ 失败" -ForegroundColor Red
        }
    }
    
    # 创建清单
    $manifest = @{
        export_time     = $timestamp
        database        = $DbName
        container       = $ContainerName
        tables_exported = $successCount
        total_rows      = $totalRows
    } | ConvertTo-Json
    
    $manifest | Out-File -FilePath (Join-Path $exportPath "manifest.json") -Encoding UTF8
    
    Write-Host "`n✓ 导出完成!" -ForegroundColor Green
    Write-Host "  位置: $exportPath" -ForegroundColor Yellow
    Write-Host "  表数: $successCount, 总记录: $totalRows`n" -ForegroundColor Yellow
}

function Backup-FullSQL {
    Write-Host "`n开始完整 SQL 备份...`n" -ForegroundColor Cyan
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = Join-Path $backupsDir "babydaily_$timestamp.sql"
    
    try {
        # 使用 pg_dump 在容器内执行备份
        Write-Host "  执行 pg_dump..." -NoNewline
        docker exec $ContainerName pg_dump -U $DbUser -d $DbName > $backupFile
        
        if (Test-Path $backupFile) {
            $fileSize = (Get-Item $backupFile).Length
            
            if ($fileSize -gt 0) {
                Write-Host " ✓" -ForegroundColor Green
                
                # 压缩
                Write-Host "  压缩备份文件..." -NoNewline
                $zipFile = "$backupFile.zip"
                Compress-Archive -Path $backupFile -DestinationPath $zipFile -Force
                Remove-Item $backupFile
                
                $zipSize = (Get-Item $zipFile).Length
                Write-Host " ✓" -ForegroundColor Green
                
                Write-Host "`n✓ 备份完成!" -ForegroundColor Green
                Write-Host "  文件: $zipFile" -ForegroundColor Yellow
                Write-Host "  大小: $([math]::Round($zipSize/1KB, 2)) KB`n" -ForegroundColor Yellow
            }
            else {
                Write-Host " ✗ 文件为空" -ForegroundColor Red
                Remove-Item $backupFile -ErrorAction SilentlyContinue
            }
        }
    }
    catch {
        Write-Host " ✗ 失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Show-Backups {
    Write-Host "`n已有备份:`n" -ForegroundColor Cyan
    
    # SQL 备份
    Write-Host "SQL 备份 ($backupsDir):" -ForegroundColor Yellow
    $sqlBackups = Get-ChildItem $backupsDir -Filter "*.zip" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    if ($sqlBackups) {
        foreach ($f in $sqlBackups) {
            Write-Host "  📦 $($f.Name) - $([math]::Round($f.Length/1KB, 2)) KB - $($f.LastWriteTime.ToString('yyyy-MM-dd HH:mm'))"
        }
    }
    else {
        Write-Host "  (无)"
    }
    
    Write-Host ""
    
    # CSV 导出
    Write-Host "CSV 导出 ($exportsDir):" -ForegroundColor Yellow
    $csvExports = Get-ChildItem $exportsDir -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
    if ($csvExports) {
        foreach ($d in $csvExports) {
            $manifestFile = Join-Path $d.FullName "manifest.json"
            if (Test-Path $manifestFile) {
                $m = Get-Content $manifestFile | ConvertFrom-Json
                Write-Host "  📁 $($d.Name) - $($m.tables_exported) 表, $($m.total_rows) 条记录"
            }
            else {
                Write-Host "  📁 $($d.Name)"
            }
        }
    }
    else {
        Write-Host "  (无)"
    }
    
    Write-Host ""
}

# ============================================
# 主程序
# ============================================

Show-Banner

if (-not (Test-DockerContainer)) {
    exit 1
}

switch ($Action) {
    "export" { Export-ToCSV }
    "backup" { Backup-FullSQL }
    "list" { Show-Backups }
}

Write-Host "完成!`n" -ForegroundColor Green
