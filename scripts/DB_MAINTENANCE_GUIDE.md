# BabyDaily 数据库维护脚本使用指南

本目录包含用于 BabyDaily 数据库维护的 PowerShell 脚本，支持数据导出、导入、备份和恢复功能。

## 📋 脚本列表

### 1. `db-manager.ps1` - 数据库管理主脚本 ⭐ 推荐使用

这是一个综合性的数据库管理工具，提供所有常用功能。

#### 功能特性

- ✅ 导出所有表到 CSV 文件
- ✅ 从 CSV 文件导入数据
- ✅ 自动避免导入重复记录
- ✅ 完整数据库备份（SQL 格式）
- ✅ 数据库恢复
- ✅ 列出所有可用的导出
- ✅ 自动连接测试
- ✅ 友好的用户界面

#### 使用方法

```powershell
# 导出数据库到 CSV
.\db-manager.ps1 export

# 导入最新的导出数据
.\db-manager.ps1 import

# 从指定目录导入
.\db-manager.ps1 import -Path ".\database-exports\20260203_201800"

# 导入并更新已存在的记录
.\db-manager.ps1 import -UpdateExisting

# 完整数据库备份
.\db-manager.ps1 backup

# 恢复数据库
.\db-manager.ps1 restore -Path ".\database-backups\babydaily_backup_20260203_201800.sql.zip"

# 列出所有可用的导出
.\db-manager.ps1 list
```

#### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-Action` | 操作类型：export, import, backup, restore, list | 必填 |
| `-Path` | 导入/恢复的文件路径 | 自动选择最新 |
| `-DbHost` | 数据库主机 | localhost |
| `-DbPort` | 数据库端口 | 54320 |
| `-DbName` | 数据库名称 | babydaily |
| `-DbUser` | 数据库用户 | postgres |
| `-DbPassword` | 数据库密码 | postgres |
| `-SkipDuplicates` | 跳过重复记录 | true |
| `-UpdateExisting` | 更新已存在记录 | false |
| `-Tables` | 要处理的表列表 | 所有表 |

---

### 2. `export-db.ps1` - 数据导出脚本

单独的数据导出脚本，将所有表导出为 CSV 文件。

#### 使用方法

```powershell
# 基本导出
.\export-db.ps1

# 导出到指定目录
.\export-db.ps1 -OutputDir "D:\Backups\BabyDaily"

# 只导出特定表
.\export-db.ps1 -Tables @("records", "babies")

# 自定义数据库连接
.\export-db.ps1 -DbHost "192.168.1.100" -DbPort 5432
```

#### 输出结构

```
database-exports/
└── 20260203_201800/          # 时间戳目录
    ├── users.csv
    ├── families.csv
    ├── family_members.csv
    ├── babies.csv
    ├── records.csv
    ├── ootd.csv
    ├── notifications.csv
    ├── user_settings.csv
    └── export-manifest.json   # 导出清单
```

---

### 3. `import-db.ps1` - 数据导入脚本

单独的数据导入脚本，从 CSV 文件导入数据到数据库。

#### 使用方法

```powershell
# 导入最新的导出
.\import-db.ps1

# 从指定目录导入
.\import-db.ps1 -ImportDir ".\database-exports\20260203_201800"

# 导入并更新已存在的记录（而不是跳过）
.\import-db.ps1 -UpdateExisting

# 允许重复记录（不推荐）
.\import-db.ps1 -SkipDuplicates:$false

# 只导入特定表
.\import-db.ps1 -Tables @("records", "babies")
```

#### 重复记录处理

脚本提供三种处理重复记录的方式：

1. **跳过重复** (默认，`-SkipDuplicates`)
   - 如果记录的 ID 已存在，则跳过该记录
   - 不会修改现有数据
   - 最安全的选项

2. **更新已存在** (`-UpdateExisting`)
   - 如果记录的 ID 已存在，则更新该记录
   - 会覆盖现有数据（除了 `created_at` 字段）
   - 适用于数据同步场景

3. **允许重复** (`-SkipDuplicates:$false`)
   - 尝试插入所有记录
   - 如果有重复会导致错误
   - 不推荐使用

---

## 🎯 常见使用场景

### 场景 1: 定期备份数据

```powershell
# 每周执行一次完整备份
.\db-manager.ps1 backup

# 或者导出为 CSV（便于查看和编辑）
.\db-manager.ps1 export
```

### 场景 2: 迁移数据到新服务器

```powershell
# 在旧服务器上导出
.\db-manager.ps1 export

# 将 database-exports 文件夹复制到新服务器

# 在新服务器上导入
.\db-manager.ps1 import -Path ".\database-exports\20260203_201800"
```

### 场景 3: 恢复误删除的数据

```powershell
# 1. 先备份当前状态（以防万一）
.\db-manager.ps1 backup

# 2. 从之前的导出恢复数据
.\db-manager.ps1 import -Path ".\database-exports\20260203_120000"
```

### 场景 4: 合并多个数据源

```powershell
# 导入第一个数据源
.\db-manager.ps1 import -Path ".\exports\source1"

# 导入第二个数据源（自动跳过重复）
.\db-manager.ps1 import -Path ".\exports\source2"
```

### 场景 5: 测试环境数据同步

```powershell
# 从生产环境导出
.\db-manager.ps1 export -DbHost "prod-server" -DbPort 5432

# 导入到测试环境
.\db-manager.ps1 import -DbHost "localhost" -DbPort 54320
```

---

## 📊 数据表说明

脚本按以下顺序处理表（考虑外键依赖关系）：

1. **users** - 用户表
2. **families** - 家庭表
3. **family_members** - 家庭成员表
4. **babies** - 宝宝信息表
5. **records** - 记录表（喂养、睡眠、换尿布等）
6. **ootd** - 每日穿搭表
7. **notifications** - 通知表
8. **user_settings** - 用户设置表

---

## ⚙️ 配置说明

### 数据库连接配置

默认连接参数：

```powershell
$DbHost = "localhost"
$DbPort = 54320
$DbName = "babydaily"
$DbUser = "postgres"
$DbPassword = "postgres"
```

如果您的数据库配置不同，可以通过参数覆盖：

```powershell
.\db-manager.ps1 export `
    -DbHost "192.168.1.100" `
    -DbPort 5432 `
    -DbUser "admin" `
    -DbPassword "your-password"
```

### 环境变量配置（可选）

您也可以设置环境变量来避免每次输入密码：

```powershell
$env:PGPASSWORD = "your-password"
.\db-manager.ps1 export
```

---

## 🔧 故障排除

### 问题 1: "psql: command not found"

**原因**: PostgreSQL 客户端工具未安装或未添加到 PATH

**解决方案**:
1. 确保已安装 PostgreSQL 客户端工具
2. 将 PostgreSQL 的 bin 目录添加到系统 PATH
   - 通常位于: `C:\Program Files\PostgreSQL\16\bin`

### 问题 2: "连接被拒绝"

**原因**: 数据库未运行或端口配置错误

**解决方案**:
```powershell
# 检查 Docker 容器是否运行
docker ps

# 启动数据库容器
docker-compose up -d postgres

# 检查端口映射
docker-compose ps
```

### 问题 3: "权限被拒绝"

**原因**: 数据库用户权限不足

**解决方案**:
```sql
-- 使用管理员账户连接数据库
GRANT ALL PRIVILEGES ON DATABASE babydaily TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

### 问题 4: 导入时出现重复键错误

**原因**: CSV 文件中包含已存在的记录

**解决方案**:
```powershell
# 使用跳过重复选项（默认）
.\db-manager.ps1 import -SkipDuplicates

# 或者使用更新模式
.\db-manager.ps1 import -UpdateExisting
```

### 问题 5: CSV 文件编码问题

**原因**: CSV 文件编码不是 UTF-8

**解决方案**:
- 脚本已自动使用 UTF-8 编码
- 如果仍有问题，请使用文本编辑器将 CSV 转换为 UTF-8 编码

---

## 📝 最佳实践

### 1. 定期备份

建议设置定时任务每天自动备份：

```powershell
# 创建定时任务脚本 backup-daily.ps1
$scriptPath = "D:\Projects\BabyDaily\scripts\db-manager.ps1"
& $scriptPath backup

# 删除 30 天前的备份
$backupDir = "D:\Projects\BabyDaily\database-backups"
Get-ChildItem $backupDir -Filter "*.zip" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | 
    Remove-Item
```

### 2. 导出前验证

```powershell
# 先测试连接
.\db-manager.ps1 list

# 确认连接成功后再导出
.\db-manager.ps1 export
```

### 3. 导入前备份

```powershell
# 导入前先备份当前数据
.\db-manager.ps1 backup

# 然后再导入
.\db-manager.ps1 import
```

### 4. 分批导入大数据

如果数据量很大，可以分表导入：

```powershell
# 先导入基础表
.\db-manager.ps1 import -Tables @("users", "families", "babies")

# 再导入记录表
.\db-manager.ps1 import -Tables @("records")
```

---

## 🔐 安全建议

1. **不要在脚本中硬编码密码**
   - 使用参数传递
   - 或使用环境变量

2. **限制备份文件访问权限**
   ```powershell
   # 设置备份目录权限
   icacls ".\database-backups" /inheritance:r /grant:r "$env:USERNAME:(OI)(CI)F"
   ```

3. **定期清理旧备份**
   - 避免占用过多磁盘空间
   - 保留最近 30 天的备份即可

4. **加密敏感备份**
   ```powershell
   # 使用 7-Zip 加密备份
   7z a -p"your-password" backup.7z .\database-backups\*.zip
   ```

---

## 📞 支持

如有问题，请查看：
- 项目文档: `README.md`
- 数据库清理指南: `DATABASE_CLEANUP.md`
- 或联系开发团队

---

## 📄 许可证

这些脚本是 BabyDaily 项目的一部分，遵循项目的许可证。
