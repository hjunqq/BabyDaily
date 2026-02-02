# BabyDaily 
## Step-by-step refactor instructions (for Claude Code)

This document provides a staged refactor plan to improve deployment speed, runtime performance, and Kindle compatibility while keeping behavior stable. Follow each step in order. Do not skip validation or documentation updates.

---

## Phase 0: Baseline and guardrails

1) Snapshot current state
- Record current build and startup times (frontend, backend).
- Record API response times for key endpoints: `/records/baby/:id`, `/records/baby/:id/summary`, `/ootd/baby/:id`.
- Capture current routes and payload shapes from `docs/api_contracts.md`.

2) Freeze behavior
- Do not change user-facing functionality in this phase.
- Only add missing tests or logs needed for verification.

3) Create a refactor branch
- Use a new branch name such as `refactor/perf-structure`.

---

## Phase 1: Fix critical security and correctness issues

1) Authorization hardening
- Add `FamilyGuard` or equivalent access checks to all baby endpoints.
- Block `GET /users/:id` unless explicitly required. If needed, restrict to admin family members.
- Ensure `GET /records/:id` validates ownership or family membership.

2) OOTD guard alignment
- OOTD routes that do not include `babyId` must not require `FamilyGuard` at controller level.
- Move `FamilyGuard` to only routes that include `babyId` or add a guard that resolves babyId from OOTD id.

3) JWT secret enforcement
- Remove `defaultSecret` fallback. If `JWT_SECRET` is missing, the app should fail fast at startup.

4) Dev login gating
- Restrict `POST /auth/login/dev` to development only (via `NODE_ENV`).

5) SQL injection prevention (tags filter)
- Replace string interpolation with parameterized queries in OOTD tags filtering.

6) Align API contract
- Ensure summary and trend responses match documented casing and fields.
- Update `docs/api_contracts.md` to match implementation.

Validation
- Add or update tests for auth guards.
- Run `npm --prefix backend test` if tests exist.

---

## Phase 2: Performance and deployment speed

1) Backend performance
- Move summary and trend calculations to DB-level aggregation where possible.
- Limit fields in list queries (select only needed columns).
- Add indexes for high-traffic query fields: `records(baby_id, time)`, `ootd(baby_id, date)`.

2) Frontend performance
- Ensure Kindle mode skips heavy charts or uses lightweight rendering.
- Lazy-load large routes and charts.
- Cache static data and avoid duplicate API calls on load.

3) Build and deploy
- Remove unused dependencies.
- Make sure production build disables debug logs or strips them.

Validation
- Compare new build time, startup time, and API latency to baseline.

---

## Phase 3: Code structure refactor

1) Backend layering
- Split complex query logic into `repo` classes.
- Move mapping logic into dedicated `mapper` files.
- Keep controllers thin: validation + parameter parsing only.

2) Frontend structure
- `services/` only API calls.
- `hooks/` only data composition.
- `components/` pure UI.
- `pages/` only layout and page behavior.

3) Shared conventions
- Choose one response casing for all endpoints and enforce via mappers.
- Update docs and types accordingly.

Validation
- Ensure no regressions in tests.
- Manual smoke test for key routes on desktop and Kindle.

---

## Phase 4: Kindle mode optimization

1) Create a Kindle feature flag
- Example: `VITE_KINDLE_MODE=true` (frontend) and `KINDLE_MODE=true` (backend optional).

2) Reduce payloads
- Add lightweight response DTOs for Kindle usage.
- Avoid large nested objects in list views.

3) Reduce UI cost
- Disable animations and large images.
- Use list virtualization only if needed; avoid heavy libraries on Kindle.

Validation
- Kindle mode first contentful paint < 3s on low-power devices.

---

## Phase 5: Documentation and contracts

1) Update API contracts
- `docs/api_contracts.md` must match actual response shapes.
- Include error codes for common failures.

2) Update error codes and permissions
- `docs/error_code_and_permissions.md` sync with guards and service rules.

3) Update README and Getting Started
- Align environment variables, default ports, and dev/prod behaviors.

---

## Final acceptance criteria

- Backend cold start < 2s on dev machine.
- Frontend cold start < 3s in Kindle mode.
- P95 API latency < 200ms for common endpoints.
- No unauthorized access to baby/record/user data.
- All docs in `docs/` match implemented behavior.

---

## Execution checklist (for Claude Code)

- [ ] Phase 1 complete and validated
- [ ] Phase 2 complete and validated
- [ ] Phase 3 complete and validated
- [ ] Phase 4 complete and validated
- [ ] Phase 5 complete and validated

