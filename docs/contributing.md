# Contributing

## Required Checks
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`

CI workflow: `.github/workflows/ci.yml` runs the same checks on pushes and pull requests.

## Rules
- Respect layer boundaries.
- Keep visual changes inside `design-system` or route shell files.
- Keep sync policy unchanged unless approved in ADR.
- Keep SQL/RLS/RPC changes documented in `docs/supabase-setup.md`.
