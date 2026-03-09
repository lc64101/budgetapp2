---
name: testing-docs
description: 'Use when adding or updating tests and docs after code changes. Triggers on requests like "add tests", "write regression tests", "update docs", "update README", "document this change", and "what tests should we add".'
---

# Testing and Docs

Ensure changes are protected with focused tests and clear documentation.

## Workflow

1. Identify behavior changes
   - list what changed functionally and what can regress.
2. Add or update tests
   - prefer narrow regression tests first, then happy-path coverage.
3. Validate quality
   - run relevant tests; confirm failures are meaningful.
4. Update docs
   - README, usage notes, or inline docs for changed behavior.

## Test Priorities

1. Input validation and edge cases
2. Error handling and retries/timeouts
3. Data integrity and state transitions
4. Public API/interface contract behavior

## Output Format

1. Tests added/updated
2. Behaviors covered
3. Doc updates made
4. Remaining test gaps
