# Frontend Implementation Progress (DevExtreme)

Updated: 2025-02-XX
Owner: Tech Lead

## Scope
- All pages listed in `docs/prototypes_html/index.html`
- Frontend uses DevExtreme, must match light-luxury B visuals
- All UI text in Chinese (except brand name)

## Page → API Mapping (Draft)

### Auth & Context
- Login: `POST /auth/login/dev` (dev) → token → localStorage
- Family (context): `GET /families/my`
- Baby (context): `GET /babies/family/:familyId` / `GET /babies/:id`

### Records
- Dashboard (web):
  - Summary: `GET /records/baby/:babyId/summary`
  - Trend: `GET /records/baby/:babyId/trend`
  - Recent list: `GET /records/baby/:babyId?limit=...`
- Mobile Home:
  - Summary + Recent list (same as above)
- Records list:
  - `GET /records/baby/:babyId?limit=&offset=`
- Record create:
  - `POST /records`
- Record detail:
  - `GET /records/:id`
- Record edit:
  - `PATCH /records/:id`
- Record delete:
  - `DELETE /records/:id`
- CSV export (web):
  - `GET /records/baby/:babyId/export`

### Statistics
- Trend charts:
  - `GET /records/baby/:babyId/trend?days=`

### OOTD
- List: `GET /ootd/baby/:babyId?page=&limit=&tags=`
- Upload: `POST /ootd/upload` (multipart)
- Like: `POST /ootd/:id/like`
- Delete: `DELETE /ootd/:id`
- Calendar: `GET /ootd/calendar/:babyId/:year/:month` (optional)

### Profile / Family / Baby
- Profile: `GET /users/me` (NOT PRESENT) → fallback to dev login user
- Family: `GET /families/my`
- Baby profile: `GET /babies/:id`

### Settings / Notifications
- No backend endpoints yet → local-only UI until API is available

## Status Log
- 2025-02-XX: DevExtreme pages wired; visual baseline created.
- 2025-02-XX: Core data flow wired (auth/dev login, baby context, records CRUD, summary/trend, OOTD list/upload/like/delete, family/baby profile).
- 2025-02-XX: Backend补齐 users/me、settings、notifications endpoints；前端接入设置与通知。

## Next Tasks
1) Verify backend endpoints for users/notifications/settings (missing APIs)
2) Wire CSV export button on web records if needed
3) Refine error handling + empty states per page
4) Add production login flow if required
