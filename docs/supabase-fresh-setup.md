# Fresh Supabase Setup Guide

Use this when creating a brand new Supabase project for this app.

## 1. Create a New Supabase Project
1. Open Supabase dashboard and create a new project.
2. Wait for database provisioning to complete.
3. In Project Settings > API, copy:
- `Project URL`
- `anon public key`
- `service_role key`

## 2. Configure Local Environment
Create `.env.local` in project root with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_REQUIRE_EMAIL_CONFIRMATION_FOR_SOCIAL=false
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Important:
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.
- Do not expose service role key in browser code.
- Keep `NEXT_PUBLIC_REQUIRE_EMAIL_CONFIRMATION_FOR_SOCIAL=false` during easy testing; switch to `true` later to enforce confirmation before social access.

## 3. Enable Email Auth
In Supabase dashboard:
1. Go to Authentication > Providers.
2. Enable `Email` provider.
3. Turn on `Confirm email` only if you want verification flow now.

## 4. Run Database Migrations
Apply SQL files in order:
1. `supabase/migrations/202603090001_core_schema.sql`
2. `supabase/migrations/202603090002_realtime_publication.sql`
3. `supabase/migrations/202603090003_auth_bootstrap.sql`
4. `supabase/migrations/202603120001_dashboard_layout.sql`
5. `supabase/migrations/202603120002_budget_social_features.sql`
6. `supabase/migrations/202603120003_allocation_mode_preferences_and_pay_entries.sql`
7. `supabase/migrations/202603230001_auth_username_support.sql`

Options:
- Supabase SQL editor: paste and run each file.
- Supabase CLI (recommended for team workflows):

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## 5. (Optional) Seed Data
`supabase/seed.sql` is minimal by default. Add fixture rows if needed.

## 6. Verify Security and RPCs
Run these checks in SQL editor:
1. Confirm RLS enabled for app tables.
2. Confirm functions exist:
- `rpc_update_app_settings`
- `rpc_accept_friend_request`
3. Confirm realtime publication includes:
- `app_settings`
- `budget_periods`
- `expenses`

## 7. Run the App
```bash
npm install
npm run dev
```
Open `http://localhost:4001` (or the printed port).

## 8. Smoke Test Flow
1. Open `/login`.
2. Create account with email, password, and a unique username.
3. Login and ensure redirect to `/`.
4. Navigate tabs: dashboard, calculator, budget, social, settings.
5. Verify no runtime errors in browser console.

## 9. Multi-Device Sync Expectations
- Account domain (settings/budget data): realtime updates by account.
- Social domain (leaderboards/friend requests): refreshes every 60 seconds.
