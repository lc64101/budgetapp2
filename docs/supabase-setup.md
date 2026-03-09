# Supabase Setup

## Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

## Migrations
- Core schema, RLS, and RPCs: `supabase/migrations/202603090001_core_schema.sql`
- Realtime publication for account data tables: `supabase/migrations/202603090002_realtime_publication.sql`

Apply migrations with your standard Supabase workflow (CLI or dashboard SQL editor) in order.

## Hybrid Sync Contract
- Realtime tables: `app_settings`, `budget_periods`, `expenses`
- Social refresh cadence: 60 seconds in app query layer

## RPC Contracts
- `rpc_update_app_settings`: atomic settings update with optimistic concurrency via version checks
- `rpc_accept_friend_request`: atomic friend request acceptance + friendship creation
