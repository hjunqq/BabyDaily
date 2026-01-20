# Codex 持续开发手册（BabyDaily）

本文面向：使用 Codex 在本仓库进行**连续、小步、可回滚**的功能迭代与修复。

## 1. 任务粒度（建议）
把需求拆成 1–3 个可验收的小任务，每个任务满足：
- 能在本地复现/验证（接口、页面、脚本或测试）
- 影响面清晰（尽量限定在一个模块：`record` / `ootd` / `auth` 等）
- 有明确“完成定义”（见下文 Checklist）

## 2. 变更路径（按类型）
### 2.1 新增/修改 API
优先按以下顺序做：
1) 找到对应模块：`backend/src/modules/<module>`
2) DTO：`dto/*.dto.ts`（class-validator；需要时补 query DTO）
3) Service：权限与数据一致性放在 service 层
4) Controller：保持路由风格与现有一致（注意 `/baby/:babyId/*` 的具体路由要放在通配前面）
5) 错误结构：使用 `ErrorCodes` + Nest `HttpException`，保持统一返回结构
6) 文档同步：`docs/api_contracts.md`、必要时 `docs/error_code_and_permissions.md`

### 2.2 前端页面/交互
1) 路由：`frontend/src/App.tsx`
2) 接口：`frontend/src/services/api.ts`（保持 `BabyService` 风格）
3) 类型：`frontend/src/types/index.ts`
4) 组件：`frontend/src/components/*`、页面：`frontend/src/pages/*`

注意：前端默认 API 地址在 `frontend/src/config/env.ts`，需要通过 `VITE_API_URL` 指向后端（通常是 `http://127.0.0.1:3000`）。

### 2.3 小程序能力
API 封装在 `miniprogram/utils/api.js`，登录策略是：
- 先 `wx.login` → `/auth/login/wechat`
- 失败则回落 `/auth/login/dev`

## 3. Prompt 模板（复制即用）
### 3.1 修一个后端 Bug
> 以项目维护者身份：在 `backend/src/modules/<module>` 定位并修复 `<现象>`。补充/更新对应 DTO 校验与错误码，保证统一错误结构不变。最后给出验证步骤（或补测试）。

### 3.2 做一个端到端小功能（后端 + 前端）
> 实现 `<功能>`：后端新增/调整 `<接口>`（含 DTO/权限/错误码），前端在 `frontend/src/services/api.ts` 接入并在 `<页面>` 展示。更新 `docs/api_contracts.md`。给出本地验证步骤。

### 3.3 只做重构（不改行为）
> 在不改变对外行为的前提下，重构 `<目标文件/模块>`：降低重复、补类型、保持现有接口与返回结构。给出“如何证明未改行为”的验证方式。

## 4. 完成定义（Checklist）
- 能运行：`docker compose up -d`（或使用 `scripts/start_all.ps1`）后，相关功能可验证
- API 变更：Swagger（`/api/docs`）与 `docs/api_contracts.md` 同步
- 错误与权限：返回结构与 `ErrorCodes` 使用一致
- 最小回归：至少跑对应侧的基础命令
  - 后端：`npm --prefix backend test`（或最少 `npm --prefix backend run lint`）
  - 前端：`npm --prefix frontend run lint`（或能 `npm --prefix frontend run build`）

## 5. 已知“坑位”（优先避免）
- 后端 TypeORM `synchronize: true` 只适合开发；不要把它当生产策略
- 前端默认 `API_URL` 是 `http://127.0.0.1:40000`，本地直连后端需设置 `VITE_API_URL`
- 上传目前落盘到 `uploads/` 并静态暴露；生产化需要对象存储与清理策略（见 `STATUS.md` 的待办）

