# Security Baseline

- Supabase keys: anon key only on client; service role key server-only.
- All user tables must enforce RLS with owner-first policies.
- Account mutation RPCs must include optimistic concurrency inputs.
- Audit critical destructive operations.
