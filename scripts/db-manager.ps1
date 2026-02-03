# ============================================
# BabyDaily Database Management Script
# ============================================
# 数据库维护一键脚本：导出、导入、备份、恢复
# 使用方法: 
#   .\db-manager.ps1 export              # 导出所有表到CSV
#   .\db-manager.ps1 import              # 从最新导出导入
#   .\db-manager.ps1 import -Dir <路径>  # 从指定目录导入
#   .\db-manager.ps1 backup              # 完整数据库备份
#   .\db-manager.ps1 restore <文件>      # 恢复数据库

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet("export", "import", "backup", "restore", "list")]
    [string]$Action,
    
    [Parameter(Position = 1)]
    [string]$Path,
    
    [string]$DbHost = "192.168.8.106",
    [int]$DbPort = 54320,
    [string]$DbName = "babydaily",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "postgres",
    
    [switch]$SkipDuplicates = $true,
    [switch]$UpdateExisting = $false,
    
    [string[]]$Tables = @("users", "families", "family_members", "babies", "records", "ootd", "notifications", "user_settings")
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 设置路径
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$exportsDir = Join-Path $projectRoot "database-exports"
$backupsDir = Join-Path $projectRoot "database-backups"

# 设置PostgreSQL密码
$env:PGPASSWORD = $DbPassword

# ============================================
# 辅助函数
# ============================================

function Show-Banner {
    Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║   BabyDaily 数据库管理工具            ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Show-DbInfo {
    Write-Host "数据库连接信息:" -ForegroundColor Yellow
    Write-Host "  主机: $DbHost"
    Write-Host "  端口: $DbPort"
    Write-Host "  数据库: $DbName"
    Write-Host "  用户: $DbUser"
    Write-Host ""
}

function Test-DbConnection {
    try {
        $testQuery = "SELECT 1;"
        $result = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $testQuery 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ 数据库连接成功" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "✗ 数据库连接失败" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "✗ 数据库连接失败: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Export-Database {
    Write-Host "`n开始导出数据库..." -ForegroundColor Cyan
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $exportPath = Join-Path $exportsDir $timestamp
    
    if (-not (Test-Path $exportPath)) {
        New-Item -ItemType Directory -Path $exportPath -Force | Out-Null
    }
    
    Write-Host "导出目录: $exportPath`n" -ForegroundColor Yellow
    
    $successCount = 0
    $failCount = 0
    
    foreach ($table in $Tables) {
        try {
            $csvFile = Join-Path $exportPath "$table.csv"
            Write-Host "导出表: $table..." -NoNewline
            
            # 获取记录数
            $countQuery = "SELECT COUNT(*) FROM $table;"
            $count = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -c $countQuery 2>&1
            $count = $count.Trim()
            
            # 导出到CSV
            $copyQuery = "\COPY (SELECT * FROM $table ORDER BY created_at) TO '$csvFile' WITH CSV HEADER ENCODING 'UTF8'"
            psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $copyQuery 2>&1 | Out-Null
            
            if (Test-Path $csvFile) {
                $fileSize = (Get-Item $csvFile).Length
                Write-Host " ✓ ($count 条记录, $([math]::Round($fileSize/1KB, 2)) KB)" -ForegroundColor Green
                $successCount++
            }
            else {
                Write-Host " ✗ 失败" -ForegroundColor Red
                $failCount++
            }
        }
        catch {
            Write-Host " ✗ 失败: $($_.Exception.Message)" -ForegroundColor Red
            $failCount++
        }
    }
    
    # 创建清单文件
    $manifest = @{
        export_time   = $timestamp
        database      = $DbName
        host          = $DbHost
        port          = $DbPort
        tables        = $Tables
        success_count = $successCount
        fail_count    = $failCount
    } | ConvertTo-Json -Depth 3
    
    $manifestFile = Join-Path $exportPath "manifest.json"
    $manifest | Out-File -FilePath $manifestFile -Encoding UTF8
    
    Write-Host "`n✓ 导出完成! 成功: $successCount, 失败: $failCount" -ForegroundColor Green
    Write-Host "  位置: $exportPath`n" -ForegroundColor Yellow
    
    return $exportPath
}

function Import-Database {
    param([string]$ImportPath)
    
    Write-Host "`n开始导入数据库..." -ForegroundColor Cyan
    
    # 如果没有指定路径，使用最新的导出
    if (-not $ImportPath) {
        if (Test-Path $exportsDir) {
            $latest = Get-ChildItem $exportsDir -Directory | Sort-Object Name -Descending | Select-Object -First 1
            if ($latest) {
                $ImportPath = $latest.FullName
                Write-Host "使用最新导出: $($latest.Name)" -ForegroundColor Yellow
            }
            else {
                Write-Host "✗ 未找到导出目录" -ForegroundColor Red
                return
            }
        }
        else {
            Write-Host "✗ 导出目录不存在" -ForegroundColor Red
            return
        }
    }
    
    if (-not (Test-Path $ImportPath)) {
        Write-Host "✗ 导入路径不存在: $ImportPath" -ForegroundColor Red
        return
    }
    
    Write-Host "导入目录: $ImportPath" -ForegroundColor Yellow
    Write-Host "跳过重复: $SkipDuplicates" -ForegroundColor Yellow
    Write-Host "更新现有: $UpdateExisting`n" -ForegroundColor Yellow
    
    $successCount = 0
    $failCount = 0
    $totalInserted = 0
    $totalDuplicates = 0
    
    # 按依赖顺序导入
    $orderedTables = @("users", "families", "family_members", "babies", "records", "ootd", "notifications", "user_settings")
    
    foreach ($table in $orderedTables) {
        if ($Tables -notcontains $table) { continue }
        
        $csvFile = Join-Path $ImportPath "$table.csv"
        
        if (-not (Test-Path $csvFile)) {
            Write-Host "⊘ 跳过表 $table (文件不存在)" -ForegroundColor Gray
            continue
        }
        
        try {
            Write-Host "导入表: $table..." -NoNewline
            
            # 读取CSV获取行数
            $csvData = Import-Csv $csvFile -Encoding UTF8
            $totalRows = $csvData.Count
            
            if ($totalRows -eq 0) {
                Write-Host " ⊘ 空文件" -ForegroundColor Gray
                continue
            }
            
            # 创建临时表
            $tempTable = "${table}_temp"
            psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "DROP TABLE IF EXISTS $tempTable;" 2>&1 | Out-Null
            psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "CREATE TEMP TABLE $tempTable AS SELECT * FROM $table WHERE 1=0;" 2>&1 | Out-Null
            
            # 导入到临时表
            $copyQuery = "\COPY $tempTable FROM '$csvFile' WITH CSV HEADER ENCODING 'UTF8'"
            psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $copyQuery 2>&1 | Out-Null
            
            # 插入数据（跳过重复）
            if ($SkipDuplicates) {
                $insertQuery = @"
INSERT INTO $table
SELECT t.* FROM $tempTable t
WHERE NOT EXISTS (SELECT 1 FROM $table o WHERE o.id = t.id)
ON CONFLICT (id) DO NOTHING;
"@
            }
            elseif ($UpdateExisting) {
                # 获取列名用于更新
                $columns = $csvData[0].PSObject.Properties.Name | Where-Object { $_ -notin @('id', 'created_at') }
                $updateSet = ($columns | ForEach-Object { "$_ = EXCLUDED.$_" }) -join ", "
                
                $insertQuery = @"
INSERT INTO $table
SELECT * FROM $tempTable
ON CONFLICT (id) DO UPDATE SET $updateSet;
"@
            }
            else {
                $insertQuery = "INSERT INTO $table SELECT * FROM $tempTable ON CONFLICT (id) DO NOTHING;"
            }
            
            $result = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $insertQuery 2>&1
            
            # 解析插入结果
            $inserted = 0
            if ($result -match "INSERT 0 (\d+)") {
                $inserted = [int]$Matches[1]
            }
            
            $duplicates = $totalRows - $inserted
            $totalInserted += $inserted
            $totalDuplicates += $duplicates
            
            Write-Host " ✓ ($inserted/$totalRows 条已导入" -NoNewline -ForegroundColor Green
            if ($duplicates -gt 0) {
                Write-Host ", $duplicates 条重复" -NoNewline -ForegroundColor Yellow
            }
            Write-Host ")" -ForegroundColor Green
            
            $successCount++
            
        }
        catch {
            Write-Host " ✗ 失败: $($_.Exception.Message)" -ForegroundColor Red
            $failCount++
        }
    }
    
    Write-Host "`n✓ 导入完成!" -ForegroundColor Green
    Write-Host "  成功表数: $successCount" -ForegroundColor Green
    Write-Host "  失败表数: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Gray" })
    Write-Host "  总插入数: $totalInserted" -ForegroundColor Green
    Write-Host "  总重复数: $totalDuplicates`n" -ForegroundColor Yellow
}

function Backup-Database {
    Write-Host "`n开始备份数据库..." -ForegroundColor Cyan
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    
    if (-not (Test-Path $backupsDir)) {
        New-Item -ItemType Directory -Path $backupsDir -Force | Out-Null
    }
    
    $backupFile = Join-Path $backupsDir "babydaily_backup_$timestamp.sql"
    
    Write-Host "备份文件: $backupFile`n" -ForegroundColor Yellow
    
    try {
        # 使用pg_dump创建完整备份
        pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName -F p -f $backupFile 2>&1 | Out-Null
        
        if (Test-Path $backupFile) {
            $fileSize = (Get-Item $backupFile).Length
            Write-Host "✓ 备份成功! 文件大小: $([math]::Round($fileSize/1MB, 2)) MB" -ForegroundColor Green
            Write-Host "  位置: $backupFile`n" -ForegroundColor Yellow
            
            # 压缩备份文件
            Write-Host "正在压缩备份文件..." -NoNewline
            $zipFile = "$backupFile.zip"
            Compress-Archive -Path $backupFile -DestinationPath $zipFile -Force
            Remove-Item $backupFile
            
            $zipSize = (Get-Item $zipFile).Length
            Write-Host " ✓ ($([math]::Round($zipSize/1MB, 2)) MB)" -ForegroundColor Green
            Write-Host "  压缩文件: $zipFile`n" -ForegroundColor Yellow
        }
        else {
            Write-Host "✗ 备份失败" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "✗ 备份失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Restore-Database {
    param([string]$BackupFile)
    
    if (-not $BackupFile) {
        Write-Host "✗ 请指定备份文件路径" -ForegroundColor Red
        return
    }
    
    if (-not (Test-Path $BackupFile)) {
        Write-Host "✗ 备份文件不存在: $BackupFile" -ForegroundColor Red
        return
    }
    
    Write-Host "`n⚠️  警告: 此操作将覆盖当前数据库!" -ForegroundColor Red
    $confirm = Read-Host "确认恢复数据库? (yes/no)"
    
    if ($confirm -ne "yes") {
        Write-Host "操作已取消" -ForegroundColor Yellow
        return
    }
    
    Write-Host "`n开始恢复数据库..." -ForegroundColor Cyan
    
    try {
        # 如果是zip文件，先解压
        $sqlFile = $BackupFile
        if ($BackupFile -match "\.zip$") {
            Write-Host "解压备份文件..." -NoNewline
            $tempDir = Join-Path $env:TEMP "babydaily_restore"
            if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
            Expand-Archive -Path $BackupFile -DestinationPath $tempDir
            $sqlFile = Get-ChildItem $tempDir -Filter "*.sql" | Select-Object -First 1 -ExpandProperty FullName
            Write-Host " ✓" -ForegroundColor Green
        }
        
        # 恢复数据库
        Write-Host "恢复数据库..." -NoNewline
        psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $sqlFile 2>&1 | Out-Null
        Write-Host " ✓" -ForegroundColor Green
        
        Write-Host "`n✓ 数据库恢复成功!`n" -ForegroundColor Green
        
    }
    catch {
        Write-Host " ✗" -ForegroundColor Red
        Write-Host "✗ 恢复失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Show-Exports {
    Write-Host "`n可用的导出:" -ForegroundColor Cyan
    
    if (-not (Test-Path $exportsDir)) {
        Write-Host "  (无)" -ForegroundColor Gray
        return
    }
    
    $exports = Get-ChildItem $exportsDir -Directory | Sort-Object Name -Descending
    
    if ($exports.Count -eq 0) {
        Write-Host "  (无)" -ForegroundColor Gray
        return
    }
    
    foreach ($export in $exports) {
        $manifestFile = Join-Path $export.FullName "manifest.json"
        if (Test-Path $manifestFile) {
            $manifest = Get-Content $manifestFile | ConvertFrom-Json
            Write-Host "  📁 $($export.Name) - $($manifest.success_count) 个表" -ForegroundColor Yellow
        }
        else {
            Write-Host "  📁 $($export.Name)" -ForegroundColor Gray
        }
    }
    
    Write-Host ""
}

# ============================================
# 主程序
# ============================================

Show-Banner
Show-DbInfo

# 测试数据库连接
if (-not (Test-DbConnection)) {
    Write-Host "`n✗ 无法连接到数据库，请检查连接信息`n" -ForegroundColor Red
    Remove-Item Env:\PGPASSWORD
    exit 1
}

# 执行操作
switch ($Action) {
    "export" {
        Export-Database
    }
    "import" {
        Import-Database -ImportPath $Path
    }
    "backup" {
        Backup-Database
    }
    "restore" {
        Restore-Database -BackupFile $Path
    }
    "list" {
        Show-Exports
    }
}

# 清除密码环境变量
Remove-Item Env:\PGPASSWORD

Write-Host "完成!`n" -ForegroundColor Green
