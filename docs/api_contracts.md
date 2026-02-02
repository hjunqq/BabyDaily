# BabyDaily API 契约文档（修订版）
**更新时间**：2026-02-02

## 认证

### JWT 认证
- 所有接口需要 JWT；请求头：`Authorization: Bearer {access_token}`。
- FamilyGuard 校验 babyId/familyId 归属当前用户家庭。
- **JWT_SECRET 必须配置**，否则应用启动失败。

### 开发登录
- `POST /auth/login/dev` - 仅在 `NODE_ENV=development` 时可用
- 生产环境返回 403 Forbidden

## 用户（User）

### 获取当前用户
- `GET /users/me`
- 返回（camelCase）：`{ id, openid, nickname, avatarUrl, createdAt, updatedAt }`

### 更新当前用户
- `PATCH /users/me`
- 请求体：`{ nickname?, avatarUrl? }`
- 返回：更新后的用户对象

> ⚠️ `GET /users/:id` 已移除，用户只能访问自己的信息

---

## 记录（Record）模块

### 1) 获取记录列表
- `GET /records/baby/:babyId?limit=50&offset=0`
- 权限：FamilyGuard 校验 babyId 归属
- 响应（camelCase）：
```json
[{
  "id": "uuid",
  "babyId": "uuid",
  "creatorId": "uuid",
  "type": "FEED",
  "time": "2024-02-15T10:00:00.000Z",
  "endTime": "2024-02-15T10:20:00.000Z",
  "details": { "subtype": "BOTTLE", "amount": 120, "unit": "ml" },
  "remark": "备注",
  "mediaUrls": [],
  "timeAgo": "2小时30分钟前",
  "formattedTime": "10:00",
  "elapsedMs": 9000000,
  "creator": { "id": "uuid", "nickname": "妈妈", "avatarUrl": "..." }
}]
```

### 2) 今日统计
- `GET /records/baby/:babyId/summary?days=1`
- 响应（camelCase）：
```json
{
  "milkMl": 480,
  "diaperWet": 4,
  "diaperSoiled": 2,
  "sleepMinutes": 180,
  "lastFeedTime": "2024-02-15T14:30:00.000Z"
}
```

### 3) 近 7 天趋势
- `GET /records/baby/:babyId/trend?days=7`
- 响应（camelCase）：`[{ date: "2024-02-15", milkMl: 520, solidG: 30 }]`

### 4) 今日喂奶时间线
- `GET /records/baby/:babyId/feed-timeline?dayStartHour=0`
- 响应：
```json
{
  "dayStartHour": 0,
  "from": "2024-02-15T00:00:00.000Z",
  "to": "2024-02-15T18:00:00.000Z",
  "totalMl": 480,
  "items": [{ "id": "uuid", "time": "...", "amount": 120, "subtype": "BOTTLE" }]
}
```

### 5) 创建记录
- `POST /records`
- 请求体（支持 camelCase 或 snake_case）：
```json
{
  "babyId": "uuid",
  "type": "FEED",
  "time": "2024-12-06T10:00:00.000Z",
  "endTime": "2024-12-06T10:20:00.000Z",
  "details": { "subtype": "BOTTLE", "amount": 120, "unit": "ml" },
  "remark": "morning feed"
}
```
- type 枚举：`FEED | SLEEP | DIAPER | BATH | HEALTH | GROWTH | MILESTONE | VITA_AD | VITA_D3`

### 6) 更新 / 删除
- `PATCH /records/:id` - 仅创建者可更新
- `DELETE /records/:id` - 仅创建者可删除
- `DELETE /records/batch` - 批量删除（body: `{ ids: string[] }`）
- `DELETE /records/baby/:babyId/all` - 删除宝宝所有记录

### 7) 导入/导出
- `POST /records/baby/:babyId/import` - 批量导入
- `GET /records/baby/:babyId/export` - CSV 导出

---

## OOTD 模块

### 1) 获取列表
- `GET /ootd/baby/:babyId?page=1&limit=20&tags=公主,粉色`
- 权限：FamilyGuard 校验
- 响应（camelCase）：`[{ id, babyId, imageUrl, thumbnailUrl, tags, likes, date, createdAt }]`

### 2) 获取单条
- `GET /ootd/:id`
- 权限：Service 层校验 babyId 归属用户家庭

### 3) 删除
- `DELETE /ootd/:id`
- 权限：Service 层校验所有权后删除

### 4) 创建 OOTD
- `POST /ootd`
- 请求体：`{ babyId, imageUrl, thumbnailUrl?, tags: string[], date }`

### 5) 上传接口
- `POST /ootd/upload`
- `multipart/form-data`，字段：`files[]`
- 返回：`[{ imageUrl, thumbnailUrl? }]`

---

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

---

## 设置（Settings）
- `GET /settings` - 获取用户设置
- `PUT /settings` - 更新设置

## 通知（Notifications）
- `GET /notifications?limit=20&offset=0` - 获取列表
- `POST /notifications/:id/read` - 标记已读
- `POST /notifications` - 创建通知（内部）
