# Architecture

## Layers
- `src/app`: routing and page composition.
- `src/design-system`: visual tokens, primitives, layout shells.
- `src/features`: feature orchestration and view-level behavior.
- `src/domain`: pure business rules and calculations.
- `src/data`: repositories and persistence interfaces.
- `src/lib`: framework integrations and cross-cutting support.
- `src/contracts`: shared DTO and policy contracts.

## Dependency Rules
- `design-system` must not import from `domain` or `data`.
- `features` use repositories/interfaces, not raw backend SDK calls.
- `domain` remains framework-free and side-effect-free.

## Hybrid Sync Model
- Account data: realtime synchronization via account-scoped channels.
- Social data: fixed 60-second refresh cadence.
- Concurrency: versioned writes for mutable account entities.

Implementation anchor files:
- `src/features/shared/sync/useAccountRealtimeInvalidation.ts`
- `src/features/shared/sync/useSocialQueryOptions.ts`
