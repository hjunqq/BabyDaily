# 数据库文件夹清理说明

## 问题

`database/postgres` 文件夹包含1000多个文件，占用空间。

## 原因

在 `docker-compose.yml` 中，PostgreSQL 容器的数据被映射到本地文件夹：

```yaml
volumes:
  - ./database/postgres:/var/lib/postgresql/data
```

这意味着虽然数据库运行在 Docker 容器里，但**数据文件存储在您的项目文件夹**中。

## 已修改的配置

现在改为使用 **Docker 命名卷**：

```yaml
volumes:
  - postgres-data:/var/lib/postgresql/data  # Docker管理，不在项目文件夹
```

## 迁移步骤

### 1. 停止当前容器
```powershell
cd d:\Projects\BabyDaily
docker-compose down
```

### 2. 删除本地数据库文件夹
```powershell
Remove-Item -Path "database\postgres" -Recurse -Force
```

### 3. 使用新配置启动容器
```powershell
docker-compose up -d
```

### 4. 运行数据库迁移
```powershell
cd backend
npm run migration:run
```

## 结果

✅ 项目文件夹中不再有 `database/postgres` 文件夹和1000多个文件
✅ 数据库文件由 Docker 管理，存储在 Docker 的内部位置
✅ 数据仍然是持久化的（重启容器不会丢失）
✅ 项目文件夹更干净

## 数据备份

如果需要备份数据库，使用以下命令：

```powershell
# 导出数据
docker exec babydaily-postgres pg_dump -U postgres babydaily > backup.sql

# 恢复数据
Get-Content backup.sql | docker exec -i babydaily-postgres psql -U postgres -d babydaily
```

## 查看 Docker 卷

```powershell
# 查看所有卷
docker volume ls

# 查看 postgres-data 卷的详细信息
docker volume inspect babydaily_postgres-data
```

## 完全删除数据（如果需要）

```powershell
# 停止容器
docker-compose down

# 删除卷（会删除所有数据）
docker volume rm babydaily_postgres-data

# 重新启动
docker-compose up -d
```
