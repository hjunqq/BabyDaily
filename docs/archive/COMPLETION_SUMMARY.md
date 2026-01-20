# BabyDaily COMPLETION SUMMARY
更新时间：2025-12-11  
状态：后端核心接口可用（snake_case），前端核心流程仍需联调与完善上传/导出/错误提示。

## 已完成
- 后端：记录 CRUD/summary/trend（snake_case），CSV 导出，OOTD 列表/点赞/上传（本地存储，<=2MB，image/*），FamilyGuard 校验 babyId 归属，dev/微信登录，全局 ValidationPipe + 异常过滤器，Swagger 基础配置，静态 `/uploads` 暴露。
- 前端：Dashboard/Mobile/OOTD/API Test；RecordForm/RecordEditForm/ActivityTable（含删除）、CSV 导出 UI；数据接入真实接口（开发模式自动登录并创建默认家庭/宝宝）；OOTD 列表/点赞，多图上传前端校验（MIME/2MB）。
- 文档：`STATUS.md`、`README.md`、`docs/GETTING_STARTED.md`、`docs/api_contracts.md`、`docs/error_code_and_permissions.md`、`docs/work_summary_20241206.md`、`docs/WORK_SUMMARY_FINAL.md` 均已转为 UTF-8 并更新现状。

## 限制与风险
- 前端仍依赖部分 fallback/占位逻辑，接口异常时直接报错，无友好提示；记录编辑/导出与 OOTD 上传尚未端到端验证。
- 上传使用本地文件系统，缺少对象存储/签名上传与删除/清理策略；Swagger 示例与错误码/权限提示不完整。
- 文案存在遗留乱码或未统一的中英文翻译策略；summary/trend 返回 snake_case，前端需适配。

## 待办（高/中/低）
- 高：对象存储/签名上传与删除策略，前后端联调移除 fallback，记录编辑/导出与 OOTD 上传全流程，统一错误码与用户可见的错误提示，补全 Swagger 示例。
- 中：上传/导出权限与尺寸/数量限制提示；补充 DTO 校验（summary/trend/query/upload）与前端表单校验；完善错误态/空态文案和 i18n（含小程序）。
- 低：WCAG AA 可访问性检查；国际化与文案校对流程；部署/运维文档与环境变量示例完善。

## 数据格式提醒
- summary/trend 返回字段为 snake_case：`{ milk_ml, diaper_wet, diaper_soiled, sleep_minutes, last_feed_time }` 与 `[{ date, milk_ml, solid_g }]`。前端需保持一致或在后端统一后同步调整。
