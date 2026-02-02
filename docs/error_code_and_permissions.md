# 错误码与权限说明
**更新时间**：2026-02-02

## 错误码枚举

| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| `GENERIC_ERROR` | 4xx/5xx | 通用错误 |
| `AUTH_UNAUTHORIZED` | 401 | 未认证或 token 无效 |
| `AUTH_FORBIDDEN` | 403 | 无权访问资源 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `UPLOAD_INVALID_TYPE` | 400 | 上传文件类型不支持 |
| `UPLOAD_TOO_LARGE` | 400 | 上传文件超过限制 |
| `VALIDATION_FAILED` | 400 | 请求参数校验失败 |

## 错误响应结构
```json
{
  "statusCode": 403,
  "message": "No permission to access this resource",
  "error": "ForbiddenException",
  "code": "AUTH_FORBIDDEN",
  "path": "/ootd/123",
  "method": "GET",
  "timestamp": "2026-02-02T10:00:00.000Z"
}
```

---

## 权限模型

### 认证层
| 检查项 | 处理 |
|--------|------|
| JWT_SECRET 未配置 | 应用启动失败 |
| 无 Authorization header | 401 AUTH_UNAUTHORIZED |
| Token 过期/无效 | 401 AUTH_UNAUTHORIZED |

### 开发登录（/auth/login/dev）
| 环境 | 行为 |
|------|------|
| `NODE_ENV=development` | ✅ 可用 |
| 其他环境 | 403 AUTH_FORBIDDEN |

### FamilyGuard（家庭权限）
用于保护涉及 babyId 的路由：
- `GET /records/baby/:babyId`
- `POST /records`
- `GET /ootd/baby/:babyId`
- `POST /ootd`
- `POST /ootd/upload`
- `GET /ootd/calendar`

校验逻辑：`baby.family_id` 属于用户的家庭列表

### 所有权校验（Service 层）
对于不含 babyId 的路由，在 Service 层校验：
- `GET /ootd/:id` - 校验 OOTD 所属 baby 归属用户家庭
- `DELETE /ootd/:id` - 同上
- `PATCH /records/:id` - 校验 creator_id 是当前用户
- `DELETE /records/:id` - 同上

### 已移除端点
- ❌ `GET /users/:id` - 用户只能通过 `/users/me` 访问自己的信息

---

## Swagger 文档
- 访问地址：`/api/docs`
- 包含所有端点的请求/响应示例

## 待办
- [ ] 扩展家庭成员权限策略（允许家庭成员编辑/删除其他成员的记录）
- [ ] 补充上传相关的错误码（如存储空间不足）
- [ ] 添加审计日志记录敏感操作
