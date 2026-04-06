# BabyDaily Error Codes And Permissions
**Updated:** 2026-04-06

## Error Codes

| Code | HTTP | Meaning |
| --- | --- | --- |
| `GENERIC_ERROR` | 4xx/5xx | Generic server or business error |
| `AUTH_UNAUTHORIZED` | 401 | Missing, expired, or invalid JWT |
| `AUTH_FORBIDDEN` | 403 | Authenticated but not allowed to access the resource |
| `RATE_LIMITED` | 429 | Request frequency exceeded the route or global throttle |
| `NOT_FOUND` | 404 | Resource does not exist |
| `UPLOAD_INVALID_TYPE` | 400 | Unsupported upload file type |
| `UPLOAD_TOO_LARGE` | 400 | Upload exceeds file size limit |
| `VALIDATION_FAILED` | 400 | DTO validation failed |

## Unified Error Response

```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests",
  "code": "RATE_LIMITED",
  "path": "/auth/bootstrap",
  "method": "POST",
  "timestamp": "2026-04-06T10:00:00.000Z"
}
```

## Authentication

- JWT is required for protected APIs through `Authorization: Bearer <access_token>`.
- `JWT_SECRET` must be configured or the application should not be considered deployable.
- `GET /auth/session` returns the current session context and onboarding state.

## Dev Login

- `POST /auth/login/dev` is only allowed when:
  - `NODE_ENV=development`, or
  - `ENABLE_DEV_LOGIN=true`
- Production should keep `ENABLE_DEV_LOGIN=false`.

## Family Access Control

`FamilyGuard` protects APIs that operate on a `babyId` in route params or request body.

Protected examples:
- `POST /records`
- `GET /records/baby/:babyId`
- `POST /records/baby/:babyId/import`
- `POST /ootd`
- `POST /ootd/upload`
- `GET /ootd/baby/:babyId`
- `GET /ootd/calendar/:babyId/:year/:month`

Validation rule:
- the target baby must belong to a family that the current user is a member of

## Service-Level Ownership Checks

Some APIs do not carry `babyId` directly in params and therefore validate ownership in the service layer:

- `GET /ootd/:id`
- `DELETE /ootd/:id`
- `PATCH /records/:id`
- `DELETE /records/:id`
- `DELETE /records/batch`

## Rate Limits

Global throttle:
- `120 requests / 60 seconds / IP`

Route-specific throttles:
- `POST /auth/login/wechat`: `10 / min`
- `POST /auth/login/dev`: `5 / min`
- `POST /auth/bootstrap`: `10 / min`
- `POST /families`: `5 / min`
- `POST /babies`: `10 / min`
- `POST /babies/:id/avatar`: `10 / 10 min`
- `POST /records`: `40 / min`
- `POST /records/baby/:babyId/import`: `5 / min`
- `PATCH /records/:id`: `30 / min`
- `DELETE /records/batch`: `10 / min`
- `DELETE /records/:id`: `20 / min`
- `DELETE /records/baby/:babyId/all`: `5 / min`
- `POST /ootd`: `20 / min`
- `POST /ootd/upload`: `10 / 10 min`
- `POST /ootd/:id/like`: `30 / min`
- `DELETE /ootd/:id`: `20 / min`

## Swagger

- API docs: `/api/docs`

## Notes

- First-time users must complete onboarding explicitly through `POST /families` and `POST /babies`.
- Auth bootstrap no longer auto-creates family or baby data.
