# BabyDaily Repo Map（速查）

## 根目录
- `README.md`：项目概览与启动入口（当前文件存在部分乱码，优先参考 `docs/GETTING_STARTED.md`）
- `docker-compose.yml`：本地 Postgres/Redis
- `scripts/start_all.ps1`：一键启动前后端（可选启动 docker）
- `scripts/manage_backend.ps1`：后端进程管理（dev/prod）
- `AGENTS.md`：Codex/维护者工作约定（本仓库新增）

## 后端（NestJS）
- 入口：`backend/src/main.ts`
- 模块汇总：`backend/src/app.module.ts`
- 公共能力：
  - 错误码：`backend/src/common/enums/error-codes.enum.ts`
  - 全局异常：`backend/src/common/filters/all-exceptions.filter.ts`
  - 业务异常：`backend/src/common/filters/business-exception.filter.ts`
  - 家庭权限：`backend/src/common/guards/family.guard.ts`
- 业务模块：
  - 认证：`backend/src/modules/auth/*`（含 `POST /auth/login/dev`）
  - 记录：`backend/src/modules/record/*`
  - OOTD：`backend/src/modules/ootd/*`（含 `POST /ootd/upload`）
  - 家庭/宝宝：`backend/src/modules/family/*`、`backend/src/modules/baby/*`

## 前端（Vite + React）
- 路由入口：`frontend/src/App.tsx`
- API 层：`frontend/src/services/api.ts`
- API URL：`frontend/src/config/env.ts`（`VITE_API_URL`）
- 页面：`frontend/src/pages/*`

## 小程序
- API：`miniprogram/utils/api.js`
- 页面：`miniprogram/pages/*`

## 文档（docs）
- 上手：`docs/GETTING_STARTED.md`
- API 契约：`docs/api_contracts.md`
- 错误码/权限：`docs/error_code_and_permissions.md`
- Codex 手册：`docs/CODEX_CONTINUOUS_DEV.md`

