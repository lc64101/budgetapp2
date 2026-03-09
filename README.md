# Budget App 2

Refreshed budget platform built for high performance, strict data isolation, and safe UI customization.

## Core Guarantees
- Account-owned data (budgets, expenses, settings) is synchronized in realtime across sessions.
- Social data (leaderboards, friend requests, sharing) refreshes every 60 seconds.
- Visual/layout changes are isolated to `src/design-system` and route-level shells.
- Domain and data layers are protected by import-boundary lint rules.

## Scripts
- `npm run dev`: start local development server.
- `npm run build`: build for production.
- `npm run start`: run production build.
- `npm run lint`: run linting and boundary checks.
- `npm run typecheck`: run strict TypeScript checks.

## Environment
- Copy `.env.example` values into your local environment.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be used in browser code.

## Architecture
See `docs/architecture.md` for layer rules and sync model.
See `docs/supabase-setup.md` for schema, RLS, and RPC setup.

## Sync Behavior
- Account domain: realtime invalidation/subscriptions for immediate multi-session continuity.
- Social domain: fixed 60-second refresh cadence.
