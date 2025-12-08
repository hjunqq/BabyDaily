# 错误码与权限补充说明（更新）

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
- 当前过滤器默认 code 为 GENERIC_ERROR；可在业务异常中传入 code。

## 权限
- Records/OOTD 已接入 FamilyGuard 校验 babyId 归属
- records/:id 读/写/删：service 二次校验（默认限定创建者），可扩展为家庭权限

## Swagger
- 地址：`/api/docs`
- 上传接口：`POST /ootd/upload`（multipart/form-data，files[]，image，<=2MB），需补充示例说明

## 待办
- 在实际业务异常中使用具体业务码
- 如需，扩展 records/:id 的家庭成员权限
- Swagger 描述上传/权限/错误码示例
- 增补 summary/trend/query DTO 校验覆盖
