# BabyDaily API 契约文档（修订版）
**更新时间**：2025-12-11

## 认证
- 所有接口需要 JWT；请求头：`Authorization: Bearer {access_token}`。
- FamilyGuard 校验 babyId/familyId 归属当前用户家庭（已接入 records/ootd）。
- 开发模式可用 `POST /auth/login/dev` 获取测试 token。

## 记录（Record）模块
### 1) 获取记录列表
- `GET /records/baby/:babyId?limit=50&offset=0&sort=time.desc`
- 响应：`[{ id, baby_id, family_id?, creator_id, type, time, end_time?, details, remark?, media_urls?, creator { id, nickname, avatar_url } }]`
- 说明：`type` 枚举 FEED/SLEEP/DIAPER/BATH/HEALTH/GROWTH/MILESTONE；默认按 `time desc`，支持 limit/offset。

### 2) 今日统计
- `GET /records/baby/:babyId/summary?days=1`
- 返回（snake_case）：`{ milk_ml, diaper_wet, diaper_soiled, sleep_minutes, last_feed_time? }`

### 3) 近 7 天趋势
- `GET /records/baby/:babyId/trend?days=7`
- 返回（snake_case）：`[{ date: '2024-02-15', milk_ml, solid_g }]`

### 4) 创建记录
- `POST /records`
- 请求体（示例）：  
```json
{
  "baby_id": 1,
  "type": "FEED",
  "time": "2024-12-06T10:00:00.000Z",
  "end_time": "2024-12-06T10:20:00.000Z",
  "details": { "subtype": "BOTTLE", "amount": 120, "unit": "ml" },
  "remark": "morning feed",
  "media_urls": []
}
```
- 说明：  
  - FEED: `{ subtype: 'BREAST'|'BOTTLE'|'SOLID', amount?: number, unit?: string, duration?: string, food?: string }`  
  - DIAPER: `{ type: 'PEE'|'POO'|'BOTH', color?: string, texture?: string }`  
  - SLEEP: `{ is_nap: boolean, location?: string }`  
- 响应：创建的记录对象（字段为 snake_case）。

### 5) 更新 / 删除
- `PATCH /records/:id`（同创建体的部分字段）  
- `DELETE /records/:id`  
- 权限：默认限制创建者，后续可扩展家庭权限。

### 6) CSV 导出
- `GET /records/baby/:id/export`  
- 返回 CSV 流；需带认证。

## OOTD 模块
### 1) 获取列表
- `GET /ootd/baby/:babyId?page=1&limit=20&tags=公主|粉色`
- 返回：`[{ id, baby_id, image_url, thumbnail_url?, tags: string[], likes, date, created_at, updated_at }]`

### 2) 点赞 / 删除
- `POST /ootd/:id/like`  
- `DELETE /ootd/:id`

### 3) 创建 OOTD
- `POST /ootd`
- 请求体：`{ baby_id, image_url, thumbnail_url?, tags: string[], date }`
- 说明：image_url/thumbnail_url 由上传接口生成。

### 4) 上传接口（当前本地存储，待生产化）
- `POST /ootd/upload`  
- `multipart/form-data`，字段：`files[]`，类型 image/*，单文件 <= 2MB。  
- 返回：`[{ image_url, thumbnail_url? }]`（当前为本地路径）。  
- 待办：对象存储/签名上传、删除/清理策略、前端展示 URL 适配。

## 错误响应（统一结构）
```json
{
  "statusCode": 400,
  "message": ["错误信息"],
  "error": "Bad Request",
  "code": "GENERIC_ERROR",
  "path": "/records",
  "method": "POST",
  "timestamp": "2024-12-06T10:00:00.000Z"
}
```
业务码枚举见 `docs/error_code_and_permissions.md`。

## 待办（需后端补强并与前端对齐）
- DTO 覆盖 summary/trend/query/upload，校验分页/排序参数，日期使用 ISO 字符串。
- 上传改为对象存储/签名上传，补充删除/清理策略与 thumbnail 生成。
- Swagger/OpenAPI：为 record/ootd/family/baby/auth 补充请求体与响应示例，覆盖错误码/权限说明。
- 统一错误码输出并在业务异常中使用具体业务码；前端需同步错误提示。

## 用户（User）
### 1) 获取当前用户
- `GET /users/me`
- 返回：`{ id, openid, nickname, avatar_url, created_at, updated_at }`

### 2) 更新当前用户
- `PATCH /users/me`
- 请求体：`{ nickname?, avatar_url? }`
- 返回：更新后的用户对象

## 设置（Settings）
### 1) 获取设置
- `GET /settings`
- 返回：`{ id, user_id, theme, language, export_format, created_at, updated_at }`

### 2) 更新设置
- `PUT /settings`
- 请求体：`{ theme?, language?, export_format? }`
- 返回：更新后的设置对象

## 通知（Notifications）
### 1) 获取通知列表
- `GET /notifications?limit=20&offset=0`
- 返回：`[{ id, user_id, title, content?, type?, is_read, created_at, updated_at }]`

### 2) 标记已读
- `POST /notifications/:id/read`
- 返回：更新后的通知对象

### 3) 创建通知（内部/管理）
- `POST /notifications`
- 请求体：`{ title, content?, type? }`
- 返回：创建后的通知对象
