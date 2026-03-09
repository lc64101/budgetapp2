# Performance Budget

## Targets
- Route transition latency: p75 under 300ms.
- LCP on mid-tier mobile: under 2.5s.
- Route JS budget: 170KB gzipped initial target.

## Guardrails
- Server components by default for data-heavy routes.
- Lazy-load non-critical UI sections.
- Paginate social datasets and avoid N+1 patterns.
- Measure in CI and block regressions.
