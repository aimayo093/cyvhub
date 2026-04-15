- [x] **Phase 1: Frontend Secrets (Section A)**
  - [x] Remove `EXPO_PUBLIC_ADMIN_KEY` from `frontend/.env`
  - [x] Remove `EXPO_PUBLIC_ADMIN_KEY` from `frontend/.env.example`

- [x] **Phase 2: Backend Rate Limiting (Section B)**
  - [x] Modify `backend/src/index.ts` to add and apply `quoteRateLimiter`, `bookingRateLimiter`, `adminRateLimiter`, `uploadRateLimiter`.

- [x] **Phase 3: Database RLS (Section C)**
  - [x] Create `backend/prisma/migrations/20260407000000_enable_rls/migration.sql` with `ENABLE ROW LEVEL SECURITY` scripts and limited policies for Supabase anon.
  - [ ] **Section D: Carrier Management**
  - [ ] Connect "Upload Compliance Document" directly to MediaAsset backend / Supabase storage.
  - [ ] Un-mock "Suspend Carrier" actions.
  - [ ] **Section E: Businesses Module**
  - [ ] Wire UI to allow modifying Business Account properties (billing terms, overrides).
  - [ ] Enable business account suspensions/approvals.
  - [ ] **Section F: User Management**
  - [x] **Section D: Carrier Management**
  - [x] Connect "Upload Compliance Document" directly to MediaAsset backend / Supabase storage.
  - [x] Un-mock "Suspend Carrier" actions.
  - [x] **Section E: Businesses Module**
  - [x] Wire UI to allow modifying Business Account properties (billing terms, overrides).
  - [x] Enable business account suspensions/approvals.
  - [x] **Section F: User Management**
  - [x] General user suspension routes for drivers/customers.
  - [x] Wire up User Management list component

- [x] **Phase 4: Input Validation (Section D)**
  - [x] Review and sanitize `quote.controller.ts` payload limits and type-checking.
  - [x] Revisit `auth.controller.ts` for strict type checking of email, password.
  - [x] Integrate `CMSImagePicker` in Admin dashboard
  - [x] Add Hard Publish button to Homepage CMS
  - [x] Implement backend `PublishController` with GitHub REST API integration
  - [x] Create and run `migrate-cms-content.ts` script
  - [x] Refactor Backend `CMSController` to use `CMSPage`/`CMSSection`
  - [x] Refactor Frontend `CMSContext` to handle granular data
  - [x] Finalize E2E Verification
  - [x] Update `backend/prisma/schema.prisma` to include the `CMSRevision` table.
  - [x] Run Prisma migration / db push to update the database schema.
  - [x] Update `backend/src/controllers/cms.controller.ts` to insert a snapshot row into `CMSRevision` immediately before `upsertConfig` overrides `GlobalConfig`.
  - [x] Add endpoints to `cms.routes.ts` to retrieve and restore `CMSRevision` records.
  - [x] Update `frontend/context/CMSContext.tsx` with a new `batchUpdateAndSync` method to prevent racing conditions from closure snapshots.
  - [x] Refactor `frontend/app/(tabs)/cms/homepage.tsx` to invoke `batchUpdateAndSync` instead of multiple sequential setter calls.
  - [x] Refactor other CMS edit files (like `about.tsx`, `contact.tsx`, `services.tsx`, `industries.tsx`, `seo.tsx`) to safely use `batchUpdateAndSync` if needed.
  - [x] Configure Supabase Realtime in `frontend/context/CMSContext.tsx` to automatically listen for `GlobalConfig` database row updates and invoke `refreshFromBackend(false)` across all active platforms.
  - [x] Validate and test the CMS configuration saving mechanism with end-to-end payloads.

- [x] **Phase 5: Token Expiry & Refresh Flow (Section E)**
  - [x] Modify `backend/src/utils/jwt.ts` for 1h and 7d tokens.
  - [x] Modify `backend/src/controllers/auth.controller.ts` to implement `/refresh`.
  - [x] Register new route in `backend/src/routes/auth.routes.ts`.
  - [x] Update frontend `frontend/services/api.ts` to handle 401 and refresh automatically.

### Phase 3: Commercial Rules Engine (Current)
- [x] **Section G: Quotes & Booking Rules**
  - [x] Connect Quote Generator to backend pricing engine.
  - [x] Fix manual Quote state persistence in Admin tool.
- [x] **Section H: SLA Contracts**
### Phase 4: Invoice & Payment Systems (Current)
- [x] **Section I: Invoicing & Export**
  - [x] Implement robust `GET /api/admin/accounting/invoices` with VAT% and VAT Reg included.
  - [x] Wire `frontend/app/(tabs)/accounting/invoices.tsx` to display real invoice data from API.
  - [x] Implement frontend-native "Print/Export PDF" action.
- [x] **Section J: Automated Settlements**
  - [x] Wire `frontend/app/(tabs)/accounting/settlements.tsx` to handle "Approve" via `PATCH /api/admin/accounting/settlements/:id/approve`.
  - [x] Ensure backend natively handles processing logic and state persistence.
