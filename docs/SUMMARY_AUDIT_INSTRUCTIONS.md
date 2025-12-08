# SUMMARY 审计与修正指令（适用于 COMPLETION_SUMMARY.md 与 FINAL_SUMMARY.md）

## 发现的问题
- 编码/排版：两份文件仍有乱码符号；需用纯 UTF-8 简体中文重写。
- 夸大完成度：前端仍依赖 fallback/示例数据；RecordForm/API Test 仅基本通路，未完善校验与编辑/删除/上传/导出；不可宣称“核心功能已完成”或“仅待测试”。
- 数据格式描述不符：记录 trend/summary 返回的是 snake_case（`date`,`milk_ml`,`solid_g`,`diaper_wet`,`diaper_soiled`,`sleep_minutes`,`last_feed_time`），不能写成 camelCase 或 `{ name, milk, solid }`。
- 未标明缺口：文件未明确前端联调状态、缺失的上传/导出/i18n/WCAG/测试、DTO 覆盖范围与错误码规范。

## 重写要求
1) 统一编码：全文 UTF-8，无表情/乱码，无花哨符号。
2) 真实现状：
   - 后端：已有 summary/trend 分页接口、DTO 校验、ValidationPipe、AllExceptionsFilter；但文件上传/导出、统一错误码规范、Swagger 未做。
   - 前端：Dashboard/MobileHome/OOTD 仍有 fallback 数据；RecordForm/API Test 仅基本通路；Activity 编辑/删除/导出、OOTD 上传为占位/未完成。
3) 数据格式：明确 summary/trend 返回字段为 snake_case；写清前端依赖的接口与回退逻辑。
4) 待办清单：与 `progress_summary.md`、`api_contracts.md` 对齐，列出高/中/低优先级（接口联调、移除回退、上传/导出、DTO/错误码完善、WCAG/i18n、测试文档等）。
5) 文件列表：只列出实际存在的文件与变更，不添加虚构文件或功能。

请据此重写 `COMPLETION_SUMMARY.md` 与 `FINAL_SUMMARY.md`，保持简洁、真实、可执行。***
