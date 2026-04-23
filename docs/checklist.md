# Backend Implementation & Integration Checklist

- [x] Investigate `docs/backend.md` vs current schema <!-- id: 5 -->
- [x] Implement missing RPCs (Local SQL Migration) <!-- id: 6 -->
  - [x] `get_email_for_login` <!-- id: 7 -->
  - [x] `search_orders` <!-- id: 8 -->
  - [x] `process_order_return` <!-- id: 9 -->
- [x] Database Seeding & Real-time (Local SQL Migration) <!-- id: 10 -->
  - [x] Seed default `signup_token` <!-- id: 11 -->
  - [x] Enable Real-time for core tables <!-- id: 12 -->
- [x] Logic Synchronization & Gaps <!-- id: 100 -->
  - [x] Implement `get_available_stock` RPC migration <!-- id: 101 -->
  - [x] Implement Client Analytics Triggers (`total_orders`, `total_spent`) <!-- id: 102 -->
  - [x] Sync `docs/backend.md` with all current RPCs and logic <!-- id: 103 -->
  - [x] Update `all_schema.sql` with consolidated logic <!-- id: 104 -->
- [x] Type Safety & Integration <!-- id: 105 -->
  - [x] Sync `apps/web/app/types/supabase.ts` with latest schema/enums <!-- id: 106 -->
  - [x] Verify `inventoryService.ts` usage of `get_available_stock` <!-- id: 107 -->
- [ ] Verification & Stability <!-- id: 13 -->
  - [ ] Apply New Migrations to Supabase (if connectivity allows) <!-- id: 18 -->
  - [ ] Final Stability Check (pnpm build) <!-- id: 17 -->
- [ ] Cloudflare Build Fix & Middleware Migration <!-- id: 200 -->
  - [x] Make Supabase client initialization resilient during build time (Fix @supabase/ssr empty string error) <!-- id: 201 -->
  - [x] Maintain `middleware.ts` (Next.js 16 `proxy.ts` is incompatible with current Cloudflare adapter) <!-- id: 202 -->
  - [x] Verify build stability locally (`pnpm build:pages`) <!-- id: 203 -->

## Completed Fixes
- [x] Investigate `DataContext.tsx` and `settingsService.ts` for error handling <!-- id: 0 -->
- [x] Reproduce/Analyze the "Failed to fetch settings {}" error <!-- id: 1 -->
- [x] Check/Fix RLS policies for `settings` table <!-- id: 2 -->
- [x] Improve error logging in `DataContext.tsx` to show more detail <!-- id: 3 -->
