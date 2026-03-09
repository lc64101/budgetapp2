---
name: debugging
description: 'Use when something is broken, commands fail, or app behavior is unexpected. Triggers on requests like "debug this", "why is this failing", "why is this broken", "fix this error", "trace this bug", and "find the root cause".'
---

# Debugging

Use a reproduce-isolate-fix-verify loop to resolve issues safely.

## Workflow

1. Reproduce
   - capture exact command, inputs, environment, and observed vs expected output.
2. Isolate
   - narrow to the smallest failing component or code path.
3. Form hypotheses
   - list likely causes, then test fastest/highest-confidence first.
4. Fix
   - apply minimal targeted change consistent with project patterns.
5. Verify
   - rerun failing flow and nearby regression checks.

## Guardrails

- Avoid broad refactors during active debugging.
- Prefer one logical fix per change when possible.
- If uncertainty remains, document assumptions and follow-up checks.

## Output Format

1. Root cause
2. Fix implemented
3. Verification evidence
4. Residual risks
