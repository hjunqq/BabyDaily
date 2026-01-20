# 错误码与权限补充说明

## 错误码
- 统一返回结构：`{ statusCode, message, error, code, path, method, timestamp }`
- 业务错误码枚举（ErrorCodes）：
  - GENERIC_ERROR
  - AUTH_FORBIDDEN
  - AUTH_UNAUTHORIZED
  - NOT_FOUND
  - UPLOAD_INVALID_TYPE
  - UPLOAD_TOO_LARGE
  - VALIDATION_FAILED
- 当前 AllExceptionsFilter/BusinessExceptionFilter 默认 `code = GENERIC_ERROR`；业务异常可传入具体 code。

## 权限
- Records/OOTD 已接入 FamilyGuard，校验 babyId 归属家庭。
- `records/:id` 读/写/删：service 层二次校验（默认限定创建者），可扩展为家庭权限。
- 上传/导出接口需认证；后续需补充对象存储签名/路径校验与权限提示。

## Swagger
- 访问地址：`/api/docs`
- 上传接口：`POST /ootd/upload`（multipart/form-data，files[]，image，<=2MB，当前本地存储）
- 待补充：错误码示例、权限说明、summary/trend/query/upload DTO 示例。

## 待办
- 在实际业务异常中使用具体业务码（如权限、上传、校验等）。
- 如需，扩展 `records/:id` 的家庭成员权限策略。
- Swagger 中补充上传/权限/错误码示例，覆盖 record/ootd/family/baby/auth。
- 增补 summary/trend/query/upload 的 DTO 校验与错误提示，统一前后端文案。
