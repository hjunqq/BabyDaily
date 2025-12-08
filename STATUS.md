# BabyDaily 项目现状说明

**更新时间**: 2025-12-08

---

## ✅ 已完成
### 前端
- ✅ 基础架构（React + TypeScript + TailwindCSS）
- ✅ 设计体系（tokens、主题 A/B、全局样式）
- ✅ 通用组件库（Button/Loading/EmptyState/ErrorState/Skeleton 等）
- ✅ 页面实现（Dashboard、MobileHome、OOTD）
- ✅ 数据层框架（useDashboardData、useOotdData、API services）
- ✅ 移动端：DailySummary/RecordModal 用真实接口，最近记录可切换查看全部，文案改为中文
- ✅ Dashboard/OOTD 中文化，无本地 mock，接口错误有提示
- ✅ 记录创建/编辑/删除表单（Web/Mobile），校验与中文提示

### 后端
- ✅ 基础模块（记录、OOTD、宝宝、家庭、认证）
- ✅ 记录统计接口：`/records/baby/:id/summary`（snake_case 字段）
- ✅ 记录趋势接口：`/records/baby/:id/trend`（返回 {date,milk_ml,solid_g} 列表）
- ✅ OOTD 接口：列表/点赞/删除、文件上传（本地存储）
- ✅ 家庭权限与守卫依赖修复（FamilyModule/Guard 注入正确，错误信息英文）
- ✅ DTO 校验覆盖：记录/家庭/宝宝/微信登录；全局 ValidationPipe 已启用；错误过滤统一输出

---

## ⚠️ 当前状态
### 数据使用策略
前端以真实接口为主，错误时给出提示，不再造本地假数据：
- Dashboard：已去除 fallback，接口为空视为错误
- MobileHome：DailySummary/RecordModal/列表用真实接口，错误提示兜底
- OOTD：使用真实接口，错误提示，不造本地假数据

---

## 🔥 待办事项（高优先级）
### 1. 前后端接口联调
- [x] 验证 `/records/baby/:id/summary` 接口
- [x] 验证 `/records/baby/:id/trend` 接口
- [x] 验证 `/ootd/baby/:id` 接口
- [x] 验证 `/ootd/:id/like` 接口
- [ ] 确认数据格式和字段名一致（前端彻底移除兜底逻辑后收口）

### 2. 移除 Fallback 依赖
- [x] Dashboard 使用真实数据（接口缺失即报错）
- [x] MobileHome 使用真实数据（错误提示兜底）
- [x] OOTD 使用真实数据

---

## 🟡 待办事项（中优先级）

### 3. 功能实现
- [x] 记录新增表单（前端）
- [x] 记录编辑功能（前端）
- [x] 记录删除功能（前端）
- [x] 活动导出功能（前端调用后端 CSV 导出接口）
- [~] OOTD 图片上传（前端校验图片/2MB；后端本地存储，生产存储方案待定）

### 4. 后端增强
- [x] DTO 校验（class-validator：record/ootd/baby/family/login-wechat）
- [~] 统一错误处理（全局过滤已启用，仍需完善业务码/国际化）
- [~] 文件上传配置（生产化存储方案：OOS/对象存储待定）
- [ ] Swagger/OpenAPI 文档补充

---

## 🔵 待办事项（低优先级）

### 5. 可访问性和国际化
- [ ] WCAG AA 验证
- [ ] i18n 国际化
- [ ] 中文编码检查

### 6. 测试和文档
- [ ] 单元测试
- [ ] 集成测试
- [ ] API 文档（Swagger）

---

## 📚 文档
- [进度总结](./docs/progress_summary.md) - 当前状态和待办清单
- [组件使用指南](./docs/component_guide.md) - 组件用法与示例
- [设计蓝图](./docs/prototype_blueprints.md) - 高保真原型与验收要点
- [执行计划](./docs/execution_plan.md) - 项目执行规划

---

**当前状态**：基础架构完成，接口可用，Dashboard/OOTD 已无 mock；MobileHome 主要视图用真实数据，仍保留错误兜底，需继续联调与完善。
