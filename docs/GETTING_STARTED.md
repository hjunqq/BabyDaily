# BabyDaily 启动与预览指引

## 后端 (NestJS)
1) 安装依赖：`cd backend && npm install`
2) 配置环境变量（`.env`），示例：
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=babydaily
PORT=3000
```
3) 启动：`npm run start:dev`
   - Swagger 文档：http://localhost:3000/api/docs
   - 静态上传目录：http://localhost:3000/uploads
4) 账号：可用 `POST /auth/login/dev` 获取测试 token，或按需实现正式登录。

## 前端 (Web, Vite + React)
1) 安装依赖：`cd frontend && npm install`
2) 启动开发服务器：`npm run dev`
   - Dashboard（桌面）：http://localhost:5173/web
   - Mobile Home（移动预览）：http://localhost:5173/mobile
   - OOTD：http://localhost:5173/ootd
   - API 测试页：/test
3) 生产构建：`npm run build`

## 小程序
1) 代码目录：`miniprogram`
2) 用微信开发者工具打开该目录，保持本地服务端口可访问（默认 http://localhost:3000）。
3) Home 页拉取 summary/records（最近 5 条）；Record 页支持提交记录（喂奶/尿布/睡眠）。

## 功能概览
- Web：Dashboard/MobileHome/OOTD，含记录新增、编辑、删除、上传穿搭、CSV 导出等（上传需后端启动）。
- 后端：记录列表/统计/趋势，OOTD 列表/点赞/上传，JWT + 家庭权限校验，统一错误码，Swagger。
- 小程序：展示统计/最近记录，提交记录（基础版）。

## 已知提醒
- 前端构建体积有警告，可按需拆分图表/图标。
- 上传使用本地文件系统，生产需改为对象存储。
- 错误码已统一输出，业务码示例见 `docs/swagger_notes.md` / `error_code_and_permissions.md`。
