---
name: zero-problems-kpi
description: 'Monitor the Problems tab continuously and fix linting/compiler issues during implementation. Trigger on requests like "keep problems at zero", "watch lint errors", "fix Problems tab issues", or "no warnings/errors before done".'
---

# Zero Problems KPI

Keep the IDE Problems tab at `0` while programming, with a default goal of no lint/type/build problems remaining when work is complete.

## Success Metric

- Primary KPI: Problems count is `0` at handoff.
- Secondary KPI: New problems introduced during edits are fixed immediately.

## Workflow

1. Baseline check
   - Run a problems scan at start using the editor diagnostics tool.
   - Record whether issues are pre-existing or introduced by current work.
2. Tight edit loop
   - Make small code changes.
   - Re-check diagnostics immediately after each logical edit.
   - Fix issues before continuing.
3. Pre-handoff gate
   - Run final diagnostics across the workspace.
   - Do not finish while lint/type/build problems remain.

## Fix Order

1. Errors that block execution/build
2. Type errors and unresolved imports
3. Lint errors
4. Lint warnings (treat as errors when possible to preserve KPI)

## Guardrails

- Prefer minimal, targeted fixes over broad rewrites.
- Follow existing project conventions and formatting.
- Do not ignore rules unless explicitly requested by the user.
- If a problem is unrelated and risky to fix in the current task, report it clearly and ask for scope confirmation.

## Tooling Pattern

1. Use diagnostics (`get_errors`) before edits.
2. Edit code (`apply_patch` or direct file edits).
3. Re-run diagnostics (`get_errors`) after edits.
4. Repeat until diagnostics are clean.

## Output Format

1. Initial problems count
2. Files/issues fixed
3. Final problems count
4. Any deferred issues with rationale
