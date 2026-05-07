# Budget App 2

Refreshed budget platform built for high performance, strict data isolation, and safe UI customization.

## Core Guarantees
- Account-owned data (budgets, expenses, settings) is synchronized in realtime across sessions.
- Social data (leaderboards, friend requests, sharing) refreshes every 60 seconds.
- Visual/layout changes are isolated to `src/design-system` and route-level shells.
- Domain and data layers are protected by import-boundary lint rules.

## Scripts
- `npm run dev`: start local development server on port `4001`.
- `npm run dev:4000`: start local development server on port `4000`.
- `npm run build`: build for production.
- `npm run start`: run production build on port `4001`.
- `npm run start:4000`: run production build on port `4000`.
- `npm run lint`: run linting and boundary checks.
- `npm run typecheck`: run strict TypeScript checks.

## Environment
- Copy `.env.example` values into your local environment.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be used in browser code.

## Architecture
See `docs/architecture.md` for layer rules and sync model.
See `docs/supabase-setup.md` for schema, RLS, and RPC setup.
See `docs/supabase-fresh-setup.md` for first-time project setup with a new Supabase instance.

## Sync Behavior
- Account domain: realtime invalidation/subscriptions for immediate multi-session continuity.
- Social domain: fixed 60-second refresh cadence.

## Runtime Notes
- Dashboard data panels render when a user session exists.
- Account settings write immediately on toggle/select changes.
- Auth uses Supabase SSR session cookies so returning users can stay signed in across visits.
- Middleware protects app routes server-side and redirects authenticated users away from the login page.
- Users can sign in with either email or a unique username.
- Users can change their username from the settings page, subject to uniqueness validation.
