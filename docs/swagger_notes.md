# Swagger 补充说明

- 文档地址：`/api/docs`
- 认证：Bearer Token，所有接口需携带
- 上传接口：`POST /ootd/upload`
  - Content-Type: multipart/form-data
  - 字段：files (最多 3, image, <=2MB)，baby_id，tags(逗号分隔，可选)，date(ISO，可选)
  - 响应：OOTD 对象，包含 image_url/thumbnail_url
- 错误码示例：
```json
{
  "statusCode": 400,
  "message": ["files only accept image/*"],
  "error": "Bad Request",
  "code": "UPLOAD_INVALID_TYPE",
  "path": "/ootd/upload",
  "method": "POST",
  "timestamp": "2024-12-06T12:00:00.000Z"
}
```
- 权限：需校验 babyId 归属家庭（FamilyGuard）
- 常见业务码：AUTH_FORBIDDEN, AUTH_UNAUTHORIZED, NOT_FOUND, UPLOAD_INVALID_TYPE, UPLOAD_TOO_LARGE, VALIDATION_FAILED, GENERIC_ERROR
-
示例（上传成功）：
```json
{
  "id": "ootd-uuid",
  "baby_id": "baby-uuid",
  "image_url": "/uploads/ootd/1700000000-1.png",
  "thumbnail_url": "/uploads/ootd/1700000000-1.png",
  "tags": ["公主风", "粉色"],
  "date": "2024-12-06",
  "likes": 0,
  "created_at": "2024-12-06T10:00:00.000Z",
  "updated_at": "2024-12-06T10:00:00.000Z"
}
```
