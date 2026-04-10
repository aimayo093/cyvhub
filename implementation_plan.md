# CYVhub Platform Security Hardening

This document outlines the approach for remediating five critical security areas across the CYVhub frontend, backend, database, and authentication layers.

## User Review Required

> [!IMPORTANT]
> **RLS Policies in Prisma Migration**
> We are adding a raw SQL migration to enable Row-Level Security (RLS) on all tables because the Supabase Anon Key is exposed in the frontend for real-time

## Current Status: [IN PROGRESS]
- [x] Phase 1: Infrastructure (Services) - [DONE]
- [x] Phase 2: Database Initialization - [DONE]
- [x] Phase 3: Core Pricing Engine Refactor - [DONE]
- [/] Phase 4: Frontend Integration - [IN PROGRESS]
- [ ] Phase 5: Admin Controls & Multi-Quote Support
- [ ] Phase 6: Verification & Polish

## Active Phase: Phase 3 (Commercial Rules Engine)

### Section G: Quotes & Booking Rules
*   **Quote Generator Logic**:
    *   Wire the Admin `QuotesScreen` inside `frontend/app/(tabs)/quotes/index.tsx` to use the live `GET /api/quotes` endpoint rather than the mock list.
    *   Implement manual Quote state updates inside `frontend/app/(tabs)/quotes/[id].tsx` (e.g., updating statuses like `PENDING` -> `APPROVED` / `REJECTED`) by calling `PATCH /api/quotes/:id/status`. Note that `backend/src/routes/quote.routes.ts` or `quote.controller.ts` will need to have a `PATCH :id/status` endpoint created.
*   **Fix manual Quote state persistence in Admin tool.**

### Section H: SLA Contracts
*   **Business Contracts (`BusinessContract`) CRUD**:
    *   The database `schema.prisma` already defines `BusinessContract` logic (linked to `BusinessAccount`).
    *   Create CRUD endpoints in an `admin-contracts.controller.ts` or add them to the existing business endpoints. We need ability to view, create, and assign contracts with specific `rateRules`.
*   **Contract Assignment UI**:
    *   Wire `businesses/[id].tsx` "Assign Contract" to hit the API endpoints and save to the database.

> [!IMPORTANT]
> **User Input Required**: Should Contracts be universally shared across multiple businesses, or is each Contract directly owned/tied to a single `BusinessAccount`? Based on current schema `BusinessContract` has `businessId String?`, suggesting they are tied but standard templates might exist? Let's assume standard 1:1 business-contract relationships unless specified otherwise.

## Open Questions

*   **Contract Generation**: For assigning contracts, should we present a list of pre-defined standard rate templates, or allow full custom creation of rate rules for every assignment? 

## Verification Plan

### Automated/Manual Tests
*   **Quotes**: Verify that changing Quote state in the Admin detail view correctly updates it in the backend and reflects on refresh.
*   **Contracts**: Open a `Business Profile`, assign a new contract, set a dummy discount rate, and verify the backend data is accurately persisted.
 on all tables and create an `admin` bypass policy. I want to confirm whether your Prisma backend connects via a SUPERUSER/postgres role (which naturally bypasses RLS) or if Prisma runs as an unprivileged user. Assuming Prisma hits the DB as `postgres` role, it will bypass RLS nicely, and RLS will only block the frontend Supabase Anon Key.

> [!WARNING]
> **Session Expiry Change**
> Access tokens will now expire in 1 hour (was 24h). A new refresh route (`/api/auth/refresh`) will be implemented and it will use a 7-day `cyvhub_refresh_session` HTTP-only cookie. The frontend will need to correctly call this refresh endpoint on 401 Unauthorized errors using an Axios/fetch interceptor. Please confirm if you're okay with this architectural shift for authentication.

## Proposed Changes

### 1. Frontend Secrets (Section A)

We discovered `EXPO_PUBLIC_ADMIN_KEY` present in local development environments. While it was previously stated to have been removed from `.env` usage in `AuthService`, the keys themselves remain in the environment files.

#### [MODIFY] [frontend/.env](file:///c:/Users/paula/Desktop/CYVHUB-main/frontend/.env)
#### [MODIFY] [frontend/.env.example](file:///c:/Users/paula/Desktop/CYVHUB-main/frontend/.env.example)
- Delete `EXPO_PUBLIC_ADMIN_KEY` definitions leaving no trace in the frontend templates.
- Confirm any manual validation against this key is removed from the frontend.

---

### 2. Backend Rate Limiting (Section B)

We will introduce specific, strict rate limiters using `express-rate-limit` for sensitive routes which are currently only protected by the global 500 req/15m limiter (with the exception of `/api/auth` which has 20 req/15m).

#### [MODIFY] [backend/src/index.ts](file:///c:/Users/paula/Desktop/CYVHUB-main/backend/src/index.ts)
- Create `quoteRateLimiter` (10 requests / 10 minutes). Apply to `/api/quotes`.
- Create `bookingRateLimiter` (10 requests / 15 minutes). Apply to `/api/jobs` and `/api/deliveries`.
- Create `adminRateLimiter` (50 requests / 15 minutes). Apply to `/api/admin`.
- Create `uploadRateLimiter` (5 requests / 15 minutes). Apply to `/api/media`.
- Adjust HTTP status codes on limiters to return `429 Too Many Requests`.

---

### 3. Database Row Level Security (Section C)

Since Prisma is being used for the backend schema definition, RLS needs to be handled via a raw SQL migration. Enabling RLS blocks the Supabase `anon` and `authenticated` roles from performing unauthorized operations (which mitigates risks tied to the exposed Supabase anon key needed for real-time location updates).

#### [NEW] [backend/prisma/migrations/20260407000000_enable_rls/migration.sql](file:///c:/Users/paula/Desktop/CYVHUB-main/backend/prisma/migrations/20260407000000_enable_rls/migration.sql)
- Generate raw SQL `ALTER TABLE "tableName" ENABLE ROW LEVEL SECURITY;` for all Prisma tables.
- Create restrictive policies: For `User` table, allow read-only access to specific roles/columns if needed for the driver location realtime socket. Wait, actual driver location realtime relies on Supabase socket. Thus, `CREATE POLICY "Allow public read for driver location" ON "User" FOR SELECT USING (role = 'driver');` for example.
- Block ALL other access to public/anon (except what is strictly needed).
- No impact on the Prisma client due to standard postgres role bypass.

---

### 4. Strict Input Validation (Section D)

Payloads are currently extracted directly from `req.body` and fed into Prisma or downstream functions. While Prisma protects against SQL injection, it does not validate malicious object shapes (prototype pollution, Prisma specific query shapes like `{ $gte: ... }`, missing limits).

#### [MODIFY] [backend/src/controllers/quote.controller.ts](file:///c:/Users/paula/Desktop/CYVHUB-main/backend/src/controllers/quote.controller.ts)
- Implement strict type checking for `req.body.pickupPostcode`, `req.body.dropoffPostcode`.
- Add explicit length limits and RegEx matching on postcodes to stop payload injection.
- Validate `items` array limits to prevent memory exhaustion DoS (e.g. max 100 items).

#### [MODIFY] [backend/src/controllers/job.controller.ts](file:///c:/Users/paula/Desktop/CYVHUB-main/backend/src/controllers/job.controller.ts)
- Apply thorough sanitization on job creation parameters (strings only, max length, proper enum checking).

#### [MODIFY] [backend/src/controllers/auth.controller.ts](file:///c:/Users/paula/Desktop/CYVHUB-main/backend/src/controllers/auth.controller.ts)
- Explicit type-checking (typeof string) on `email` and `password` payload to prevent NoSQL/query-injection style inputs.
- Strip HTML tags and enforce max string lengths across input forms.

---

### 5. Token Expiry & Refresh Flow (Section E)

Current tokens are set to expire in `24h` without a refresh mechanism, creating security risks for long-standing compromised sessions.

#### [MODIFY] [backend/src/utils/jwt.ts](file:///c:/Users/paula/Desktop/CYVHUB-main/backend/src/utils/jwt.ts)
- Change `JWT_EXPIRES_IN` to `1h`.
- Export a new `generateRefreshToken` function lasting `7d`.

#### [MODIFY] [backend/src/controllers/auth.controller.ts](file:///c:/Users/paula/Desktop/CYVHUB-main/backend/src/controllers/auth.controller.ts)
- In `login`: Generate both an `accessToken` (1h) and `refreshToken` (7d).
- Return `cyvhub_session` cookie (1h) and `cyvhub_refresh_session` cookie (7d).
- Create `refresh(req, res)`: Validate the incoming refresh HTTP-only cookie and issue a new `accessToken`.
- Update `logout(req, res)` to clear both cookies.

#### [MODIFY] [backend/src/routes/auth.routes.ts](file:///c:/Users/paula/Desktop/CYVHUB-main/backend/src/routes/auth.routes.ts)
- Register `POST /api/auth/refresh`.

### Phase 4: Frontend Integration (Continued)
#### [MODIFY] [book-delivery.tsx](file:///c:/Users/paula/Desktop/CYVHUB-main/frontend/app/book-delivery.tsx)
#### [MODIFY] [index.tsx](file:///c:/Users/paula/Desktop/CYVHUB-main/frontend/app/(tabs)/customer-quotes/index.tsx)
Integrated `AddressAutocomplete` and updated pricing calls to use coordinates.

#### [NEW] [admin-create-job.tsx](file:///c:/Users/paula/Desktop/CYVHUB-main/frontend/app/admin-create-job.tsx) [IN PROGRESS]
Integrate `AddressAutocomplete` for admin manual bookings.

---

### Phase 5: Admin Controls (Redesign)
#### [MODIFY] [admin-pricing.tsx](file:///c:/Users/paula/Desktop/CYVHUB-main/frontend/app/admin-pricing.tsx)
Refactor this screen to provide a full UI for the `pricing_engine_config` GlobalConfig:
- **Vehicle Matrix**: Base Fees and Mileage Rates for all 5 vehicle classes.
- **Handling Rules**: Tiered parcel pricing (1st free, others paid).
- **Service Levels**: Edit SLA multipliers (Economy, Standard, Priority, Urgent).
- **Surcharges**: Edit VAT (20%), Remote Area Flat, and OOH Flat fees.
- **Postcode Lists**: View/Edit remote area prefixes.

---

### Phase 6: Verification & Polish
- **Test Case 1**: Neath SA11 2AY to Cardiff CF5 4TF (Medium Van). 
  - Expected: ~35 miles. Base (£39) + Mileage (£47.25) = ~£86 + VAT. Commercially reasonable.
- **Test Case 2**: Multi-Parcel Job (10 items).
  - Expected: Base + Mileage + Handling fees for 9 extra items.
- **Test Case 3**: Remote Area (Highlands IV postcode).
  - Expected: Remote surcharge applied automatically.

## Verification Plan

### Automated / API Tests
- Make a `POST` request to `/api/quotes` repeatedly to verify that `429 Too Many Requests` is thrown after hitting the rate limit.
- Examine HTTP headers on `POST /api/auth/login` to confirm two distinct cookies (`cyvhub_session` and `cyvhub_refresh_session`) are set.

### Manual Verification
- Ask the user to run backend `prisma migrate deploy` and confirm DB operates normally (Prisma ignores RLS, frontend apps respect RLS).
- Instruct the user to log into the frontend, wait 1 hour, and confirm the frontend automatically refreshes the token without forcing a hard log-out.
