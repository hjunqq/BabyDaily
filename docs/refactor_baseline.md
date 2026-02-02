# BabyDaily Refactor Baseline Metrics

**Captured Date**: 2026-02-02  
**Branch**: `refactor/perf-structure`  
**Environment**: Windows 11, Node v24.13.0, PostgreSQL 16-alpine (Docker)

---

## API Response Times (baseline)

| Endpoint | Response Time |
|----------|---------------|
| `GET /records/baby/:id` | ~27ms |
| `GET /records/baby/:id/summary` | ~44ms |
| `GET /ootd/baby/:id` | ~60ms |

Note: Measured with test-user token, fresh database with minimal data.

---

## Build Times

| Component | Command | Time |
|-----------|---------|------|
| Backend (dev compile) | `npm run start:dev` | ~6s (first compile) |
| Frontend (dev start) | `npm run dev` | ~1.5s (Vite ready) |

---

## Key Routes (from api_contracts.md)

### Record Module
- `GET /records/baby/:babyId` - List records
- `GET /records/baby/:babyId/summary?days=1` - Today summary
- `GET /records/baby/:babyId/trend?days=7` - 7-day trend
- `POST /records` - Create record
- `PATCH /records/:id` - Update record
- `DELETE /records/:id` - Delete record
- `GET /records/baby/:id/export` - CSV export

### OOTD Module
- `GET /ootd/baby/:babyId` - List OOTD
- `POST /ootd/:id/like` - Like OOTD
- `DELETE /ootd/:id` - Delete OOTD
- `POST /ootd` - Create OOTD
- `POST /ootd/upload` - Upload image

### User/Settings/Notifications
- `GET /users/me` - Current user
- `PATCH /users/me` - Update user
- `GET /settings` - Get settings
- `PUT /settings` - Update settings
- `GET /notifications` - List notifications
- `POST /notifications/:id/read` - Mark read

---

## Response Casing Convention

API contracts specify **snake_case** for all responses:
- `baby_id`, `family_id`, `creator_id`, `end_time`
- `milk_ml`, `sleep_minutes`, `last_feed_time`
- `image_url`, `thumbnail_url`, `created_at`, `updated_at`

---

## Phase 0 Checklist

- [x] Create refactor branch (`refactor/perf-structure`)
- [x] Record API response times
- [x] Record build/startup times
- [x] Capture routes and payload shapes
- [x] Freeze behavior (no functional changes)
