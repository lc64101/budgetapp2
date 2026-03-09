---
name: code-review
description: 'Use when reviewing PRs, diffs, or code changes for bugs, regressions, risky logic, and missing tests. Triggers on requests like "review this", "review my changes", "find bugs", "spot regressions", "is this safe to merge", and "check test coverage".'
---

# Code Review

Perform findings-first code review with an emphasis on correctness and risk.

## Review Goals

1. Identify bugs and behavioral regressions.
2. Identify security and reliability risks.
3. Identify missing tests for changed behavior.
4. Keep summaries brief after findings.

## Workflow

1. Gather changed files and classify risk areas.
2. Read high-risk paths first:
   - auth, permissions, money/data writes, migrations, validation, error handling.
3. For each finding, capture:
   - severity (`high`, `medium`, `low`), impact, and concise fix direction.
4. Verify tests:
   - expected new tests, updated tests, and flaky risk.
5. Produce report ordered by severity with file/line references.

## Output Format

1. Findings (ordered high to low)
2. Open questions or assumptions
3. Brief change summary
4. Test gaps and suggested tests

## Quality Bar

- Do not approve code mentally without checking edge cases.
- Prefer concrete examples over generic comments.
- Call out unclear requirements that could hide regressions.
