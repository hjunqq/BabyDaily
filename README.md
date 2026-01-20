# BabyDaily 项目总览

BabyDaily 是一套婴儿日常追踪应用，包含后端（NestJS）、Web 前端（React + Vite + TailwindCSS）和微信小程序。下方提供目录说明与快速启动方式。

## 目录结构
- `backend/`：NestJS 服务，提供记录统计/趋势、OOTD 上传与点赞、JWT + 家庭权限、Swagger。
- `frontend/`：Vite + React Web 客户端，包含 Dashboard、Mobile Home、OOTD 页面。
- `miniprogram/`：微信小程序，展示统计与最近记录，支持提交记录。
- `docs/`：需求、设计、API 契约与使用说明；快速上手见 `docs/GETTING_STARTED.md`。

## 快速启动
1) 启动后端：`cd backend && npm install && npm run start:dev`  
   - Swagger: http://localhost:3000/api/docs  
   - 静态上传: http://localhost:3000/uploads  
   - 开发 token: `POST /auth/login/dev`
2) 启动 Web 前端：`cd frontend && npm install && npm run dev`  
   - Dashboard: http://localhost:5173/web  
   - Mobile 预览: http://localhost:5173/mobile  
   - OOTD: http://localhost:5173/ootd
   - 如后端端口非 3000，可设置 `VITE_API_URL`（例：`http://127.0.0.1:40000`）
3) 打开小程序：用微信开发者工具打开 `miniprogram` 目录，指向本地后端（默认 http://localhost:3000）。

更详细的运行步骤、环境变量示例与端口信息见 `docs/GETTING_STARTED.md`；接口契约见 `docs/api_contracts.md`，错误码见 `docs/error_code_and_permissions.md`。

## 服务管理脚本（后端）
- 启动开发：`pwsh -File scripts/manage_backend.ps1 -Action start -Mode dev`
- 启动生产：`pwsh -File scripts/manage_backend.ps1 -Action start -Mode prod [-ForceBuild]`
- 停止：`pwsh -File scripts/manage_backend.ps1 -Action stop -Mode dev|prod`
- 状态：`pwsh -File scripts/manage_backend.ps1 -Action status -Mode dev|prod`
- 重启：`pwsh -File scripts/manage_backend.ps1 -Action restart -Mode dev|prod`
可选：加 `-SkipDocker` 跳过 docker compose（已自行启动数据库时使用）。
