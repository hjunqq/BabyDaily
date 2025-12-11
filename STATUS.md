# BabyDaily 项目状态说明

**更新时间**: 2025-12-09

---

## ✅ 已完成
### 前端
- React + TypeScript + TailwindCSS 框架与主题/组件基线，Dashboard/Mobile/OOTD 页面可用。
- 数据层接入真实后端接口：Dashboard/Mobile/OOTD 通过 `BabyService.ensureDevEnvironment` 自动登录 DEV 并创建默认家庭/宝宝后再取接口数据，不再使用本地 mock。
- 记录 CRUD：Dashboard 表格支持删除、编辑（RecordEditForm）、导出 CSV；表单校验基础逻辑。
- OOTD：列表/按标签过滤、点赞、删除、图片上传（前端校验图片 MIME、限制 2MB、支持多图）。
### 后端
- NestJS 模块：auth(dev/微信登录)、users、family/baby 权限链路，FamilyGuard 检查 babyId 所属家庭。
- Record 模块：CRUD、summary `/records/baby/:id/summary`、trend `/records/baby/:id/trend`（snake_case 字段）、CSV 导出 `/records/baby/:id/export`。
- OOTD 模块：列表/按月查询、点赞、删除、上传（multer 本地存储、2MB、仅 image/*）、自动填充 creator_id/date。
- 全局 ValidationPipe + AllExceptionsFilter/BusinessExceptionFilter；Swagger 基础配置；静态上传目录 `/uploads` 暴露。

---

## ⚠️ 当前状态
- Web 前端完全依赖真实接口，接口异常时展示错误态；无本地 fallback。
- 开发模式下自动登录并创建默认家庭/宝宝，正式环境需替换为真实登录与数据初始化。
- 中文文案在前端代码中存在编码乱码，需统一为可读的 UTF-8 文案。

---

## 🔥 待办事项（高优先级）
1) 生产化文件上传
- [ ] OOTD 图片改为对象存储/签名上传，并提供删除/清理策略；前端适配上传地址与展示 URL。

2) 接口文档与契约
- [ ] 补充 Swagger/OpenAPI 覆盖 record/ootd/family/baby/auth 的请求体与响应示例，保证 summary/trend/导出等接口可查。
- [ ] 统一错误码/文案输出（前后端）并补齐用户可见的错误提示。

3) 中文文案修复
- [ ] 修复前端页面/表单/提示的乱码文本，统一采用 UTF-8 与中英文翻译策略。

---

## 🟡 待办事项（中优先级）
- [ ] 前端/后端补充单元与集成测试（Record CRUD、summary/trend、OOTD 上传/点赞/删除、FamilyGuard 权限）。
- [ ] OOTD 上传/记录导出增加权限与尺寸/数量限制的响应提示，前端界面友好提示。
- [ ] 错误态与空态文案/i18n 方案（含微信小程序）对齐设计规范。

---

## 🔵 待办事项（低优先级）
- [ ] WCAG AA 可访问性校验（颜色对比、触控尺寸、aria-label）。
- [ ] 国际化与文案校对流程。
- [ ] 部署与运维文档、环境变量示例的完善。
