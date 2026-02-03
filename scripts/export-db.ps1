# ============================================
# BabyDaily Database Export Script
# ============================================
# 导出数据库所有表到CSV文件
# 使用方法: .\export-db.ps1 [-OutputDir <路径>] [-Tables <表名数组>]

param(
    [string]$OutputDir = ".\database-exports",
    [string[]]$Tables = @("users", "families", "family_members", "babies", "records", "ootd", "notifications", "user_settings"),
    [string]$DbHost = "localhost",
    [int]$DbPort = 54320,
    [string]$DbName = "babydaily",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "postgres"
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 创建输出目录
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$exportPath = Join-Path $OutputDir $timestamp
if (-not (Test-Path $exportPath)) {
    New-Item -ItemType Directory -Path $exportPath -Force | Out-Null
    Write-Host "✓ 创建导出目录: $exportPath" -ForegroundColor Green
}

# 设置PostgreSQL密码环境变量
$env:PGPASSWORD = $DbPassword

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BabyDaily 数据库导出工具" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "数据库连接信息:" -ForegroundColor Yellow
Write-Host "  主机: $DbHost"
Write-Host "  端口: $DbPort"
Write-Host "  数据库: $DbName"
Write-Host "  用户: $DbUser"
Write-Host ""

# 导出每个表
$successCount = 0
$failCount = 0

foreach ($table in $Tables) {
    try {
        $csvFile = Join-Path $exportPath "$table.csv"
        
        Write-Host "正在导出表: $table..." -NoNewline
        
        # 使用psql执行COPY命令导出为CSV
        $query = "\COPY (SELECT * FROM $table) TO STDOUT WITH CSV HEADER"
        
        $psqlCmd = "psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c `"$query`""
        
        # 执行导出
        $output = Invoke-Expression $psqlCmd 2>&1
        
        # 将输出保存到文件
        $output | Out-File -FilePath $csvFile -Encoding UTF8
        
        # 检查文件是否创建成功
        if (Test-Path $csvFile) {
            $fileSize = (Get-Item $csvFile).Length
            $lines = (Get-Content $csvFile).Count - 1  # 减去标题行
            Write-Host " ✓ ($lines 条记录, $([math]::Round($fileSize/1KB, 2)) KB)" -ForegroundColor Green
            $successCount++
        }
        else {
            Write-Host " ✗ 文件未创建" -ForegroundColor Red
            $failCount++
        }
        
    }
    catch {
        Write-Host " ✗ 失败" -ForegroundColor Red
        Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

# 创建导出清单文件
$manifestFile = Join-Path $exportPath "export-manifest.json"
$manifest = @{
    export_time   = $timestamp
    database      = $DbName
    host          = $DbHost
    port          = $DbPort
    tables        = $Tables
    success_count = $successCount
    fail_count    = $failCount
    export_path   = $exportPath
} | ConvertTo-Json -Depth 3

$manifest | Out-File -FilePath $manifestFile -Encoding UTF8

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "导出完成!" -ForegroundColor Green
Write-Host "  成功: $successCount 个表" -ForegroundColor Green
Write-Host "  失败: $failCount 个表" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Gray" })
Write-Host "  导出位置: $exportPath" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# 清除密码环境变量
Remove-Item Env:\PGPASSWORD

# 返回导出路径
return $exportPath
