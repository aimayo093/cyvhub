- [x] **Phase 1: Frontend Secrets (Section A)**
  - [x] Remove `EXPO_PUBLIC_ADMIN_KEY` from `frontend/.env`
  - [x] Remove `EXPO_PUBLIC_ADMIN_KEY` from `frontend/.env.example`

- [x] **Phase 2: Backend Rate Limiting (Section B)**
  - [x] Modify `backend/src/index.ts` to add and apply `quoteRateLimiter`, `bookingRateLimiter`, `adminRateLimiter`, `uploadRateLimiter`.

- [x] **Phase 3: Database RLS (Section C)**
  - [x] Create `backend/prisma/migrations/20260407000000_enable_rls/migration.sql` with `ENABLE ROW LEVEL SECURITY` scripts and limited policies for Supabase anon.

- [x] **Phase 4: Input Validation (Section D)**
  - [x] Review and sanitize `quote.controller.ts` payload limits and type-checking.
  - [x] Revisit `auth.controller.ts` for strict type checking of email, password.
  - [x] Update `job.controller.ts` for data sanitization.

- [x] **Phase 5: Token Expiry & Refresh Flow (Section E)**
  - [x] Modify `backend/src/utils/jwt.ts` for 1h and 7d tokens.
  - [x] Modify `backend/src/controllers/auth.controller.ts` to implement `/refresh`.
  - [x] Register new route in `backend/src/routes/auth.routes.ts`.
  - [x] Update frontend `frontend/services/api.ts` to handle 401 and refresh automatically.
