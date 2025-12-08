# BabyDaily API 契约文档（修订版）

**更新时间**: 2024-12-06

## 认证
- 所有接口需要 JWT；请求头 `Authorization: Bearer {access_token}`。
- 必须校验 babyId/familyId 归属当前用户家庭（需在后端实现）。

## 记录模块
### 1) 获取记录列表
- `GET /records/baby/:babyId?limit=50&offset=0&sort=time.desc`
- 响应：`[{ id, baby_id, creator_id, type, time, end_time?, details, remark?, media_urls?, creator { id, nickname, avatar_url } }]`
- 说明：type 枚举 FEED/SLEEP/DIAPER/BATH/HEALTH/GROWTH/MILESTONE；默认按 time desc，支持 limit/offset。

### 2) 今日统计
- `GET /records/baby/:babyId/summary?days=1`
- 返回（snake_case）：`{ milk_ml, diaper_wet, diaper_soiled, sleep_minutes, last_feed_time? }`

### 3) 近 7 天趋势
- `GET /records/baby/:babyId/trend?days=7`
- 返回（snake_case）：`[{ date: '2024-02-15', milk_ml, solid_g }]`

### 4) 创建记录
- `POST /records`
- 请求体：`{ baby_id, type, time, end_time?, details, remark?, media_urls? }`
  - FEED: `{ subtype: 'BREAST'|'BOTTLE'|'SOLID', amount?: number, unit?: string, duration?: string, food?: string }`
  - DIAPER: `{ type: 'PEE'|'POO'|'BOTH', color?: string, texture?: string }`
  - SLEEP: `{ is_nap: boolean, location?: string }`
- 响应：创建的记录对象

### 5) 更新 / 删除
- `PATCH /records/:id`，`DELETE /records/:id`

## OOTD 模块
### 1) 获取列表
- `GET /ootd/baby/:babyId?page=1&limit=20&tags=公主风,粉色`
- 返回：`[{ id, baby_id, image_url, thumbnail_url?, tags: string[], likes, date, created_at, updated_at }]`

### 2) 点赞 / 删除
- `POST /ootd/:id/like`，`DELETE /ootd/:id`

### 3) 创建 OOTD
- `POST /ootd`
- 请求体：`{ baby_id, image_url, thumbnail_url?, tags: string[], date }`
- 上传接口（待实现）：需校验文件类型/大小，生成 image_url/thumbnail_url。

## 错误响应（建议统一）
```json
{
  "statusCode": 400,
  "message": ["错误信息"],
  "path": "/records",
  "method": "POST",
  "timestamp": "2024-12-06T10:00:00.000Z",
  "error": "Bad Request"
}
```

## 待办（后端需补强）
- DTO 覆盖 summary/trend/OOTD 上传，完善枚举与字段校验；日期用 ISO 字符串。
- 家庭权限校验：babyId/familyId 必须属于当前用户。
- 统一错误码/响应格式；异常过滤器输出与前端对齐。
- Swagger/OpenAPI 文档；文件上传存储策略（本地/对象存储），生成 thumbnail_url。
- 记录/趋势/统计接口增加测试；分页/排序参数校验。
