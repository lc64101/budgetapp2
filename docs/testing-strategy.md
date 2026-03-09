# Testing Strategy

## Unit
- Domain calculations and pure business rules.

## Integration
- Repository behavior, RLS policy assumptions, and mutation concurrency.

## End-to-End
- Auth flows.
- Account data continuity across sessions.
- Social refresh cadence every 60 seconds.

## Performance
- Build-size checks and route timing assertions in CI.
