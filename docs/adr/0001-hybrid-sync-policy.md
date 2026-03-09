# ADR 0001: Hybrid Synchronization Policy

## Status
Accepted

## Context
The platform requires immediate account data continuity across sessions, but social surfaces can trade immediacy for predictable load and lower cost.

## Decision
- Account-owned data uses realtime sync.
- Social modules use a fixed 60-second refresh cadence.

## Consequences
- Better perceived continuity for budgeting/settings.
- Reduced social query load and subscription complexity.
