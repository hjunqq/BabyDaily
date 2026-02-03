# ============================================
# BabyDaily Database Import Script
# ============================================
# 从CSV文件导入数据到数据库，自动避免重复记录
# 使用方法: .\import-db.ps1 [-ImportDir <路径>] [-Tables <表名数组>] [-SkipDuplicates]

param(
    [Parameter(Mandatory = $false)]
    [string]$ImportDir,
    
    [string[]]$Tables = @("users", "families", "family_members", "babies", "records", "ootd", "notifications", "user_settings"),
    
    [switch]$SkipDuplicates = $true,
    
    [switch]$UpdateExisting = $false,
    
    [string]$DbHost = "localhost",
    [int]$DbPort = 54320,
    [string]$DbName = "babydaily",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "postgres"
)

# 设置错误处理
$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BabyDaily 数据库导入工具" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 如果没有指定导入目录，查找最新的导出目录
if (-not $ImportDir) {
    $exportsBase = ".\database-exports"
    if (Test-Path $exportsBase) {
        $latestExport = Get-ChildItem $exportsBase -Directory | 
        Sort-Object Name -Descending | 
        Select-Object -First 1
        
        if ($latestExport) {
            $ImportDir = $latestExport.FullName
            Write-Host "✓ 自动选择最新导出目录: $($latestExport.Name)" -ForegroundColor Green
        }
        else {
            Write-Host "✗ 未找到导出目录" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "✗ 导出目录不存在: $exportsBase" -ForegroundColor Red
        exit 1
    }
}

# 验证导入目录存在
if (-not (Test-Path $ImportDir)) {
    Write-Host "✗ 导入目录不存在: $ImportDir" -ForegroundColor Red
    exit 1
}

Write-Host "数据库连接信息:" -ForegroundColor Yellow
Write-Host "  主机: $DbHost"
Write-Host "  端口: $DbPort"
Write-Host "  数据库: $DbName"
Write-Host "  用户: $DbUser"
Write-Host "  导入目录: $ImportDir"
Write-Host "  跳过重复: $SkipDuplicates"
Write-Host "  更新现有: $UpdateExisting"
Write-Host ""

# 设置PostgreSQL密码环境变量
$env:PGPASSWORD = $DbPassword

# 定义表的导入顺序（考虑外键依赖）
$orderedTables = @(
    "users",
    "families", 
    "family_members",
    "babies",
    "records",
    "ootd",
    "notifications",
    "user_settings"
)

# 只导入指定的表
$tablesToImport = $orderedTables | Where-Object { $Tables -contains $_ }

$successCount = 0
$failCount = 0
$skippedCount = 0

foreach ($table in $tablesToImport) {
    $csvFile = Join-Path $ImportDir "$table.csv"
    
    if (-not (Test-Path $csvFile)) {
        Write-Host "⊘ 跳过表 $table (CSV文件不存在)" -ForegroundColor Gray
        $skippedCount++
        continue
    }
    
    try {
        Write-Host "正在导入表: $table..." -NoNewline
        
        # 读取CSV文件
        $csvData = Import-Csv $csvFile -Encoding UTF8
        $totalRows = $csvData.Count
        
        if ($totalRows -eq 0) {
            Write-Host " ⊘ 空文件" -ForegroundColor Gray
            $skippedCount++
            continue
        }
        
        # 创建临时表
        $tempTable = "${table}_temp_import"
        
        # 获取表结构
        $getColumnsQuery = @"
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = '$table'
ORDER BY ordinal_position;
"@
        
        $columnsResult = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -t -A -F"," -c $getColumnsQuery 2>&1
        
        # 创建临时表（与原表结构相同，但没有约束）
        $createTempQuery = @"
CREATE TEMP TABLE $tempTable AS 
SELECT * FROM $table WHERE 1=0;
"@
        
        psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $createTempQuery 2>&1 | Out-Null
        
        # 导入CSV到临时表
        $copyQuery = "\COPY $tempTable FROM '$csvFile' WITH CSV HEADER"
        psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $copyQuery 2>&1 | Out-Null
        
        # 根据选项处理数据
        if ($SkipDuplicates) {
            # 插入不存在的记录（基于主键id）
            $insertQuery = @"
INSERT INTO $table
SELECT t.* FROM $tempTable t
WHERE NOT EXISTS (
    SELECT 1 FROM $table o WHERE o.id = t.id
)
ON CONFLICT (id) DO NOTHING;
"@
        }
        elseif ($UpdateExisting) {
            # 使用UPSERT（插入或更新）
            # 获取所有列名（除了created_at）
            $columns = $csvData[0].PSObject.Properties.Name | Where-Object { $_ -ne 'created_at' }
            $updateSet = ($columns | Where-Object { $_ -ne 'id' } | ForEach-Object { "$_ = EXCLUDED.$_" }) -join ", "
            
            $insertQuery = @"
INSERT INTO $table
SELECT * FROM $tempTable
ON CONFLICT (id) DO UPDATE SET
$updateSet;
"@
        }
        else {
            # 直接插入（可能失败如果有重复）
            $insertQuery = @"
INSERT INTO $table
SELECT * FROM $tempTable;
"@
        }
        
        # 执行插入
        $result = psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $insertQuery 2>&1
        
        # 获取实际插入的行数
        $insertedRows = 0
        if ($result -match "INSERT 0 (\d+)") {
            $insertedRows = [int]$Matches[1]
        }
        
        # 清理临时表
        psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "DROP TABLE IF EXISTS $tempTable;" 2>&1 | Out-Null
        
        $duplicates = $totalRows - $insertedRows
        Write-Host " ✓ ($insertedRows/$totalRows 条记录已导入" -NoNewline -ForegroundColor Green
        if ($duplicates -gt 0) {
            Write-Host ", $duplicates 条重复已跳过" -NoNewline -ForegroundColor Yellow
        }
        Write-Host ")" -ForegroundColor Green
        
        $successCount++
        
    }
    catch {
        Write-Host " ✗ 失败" -ForegroundColor Red
        Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "导入完成!" -ForegroundColor Green
Write-Host "  成功: $successCount 个表" -ForegroundColor Green
Write-Host "  失败: $failCount 个表" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Gray" })
Write-Host "  跳过: $skippedCount 个表" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

# 清除密码环境变量
Remove-Item Env:\PGPASSWORD

if ($failCount -gt 0) {
    exit 1
}
