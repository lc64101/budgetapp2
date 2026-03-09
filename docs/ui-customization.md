# UI Customization Safety Guide

## Where Visual Changes Belong
- Theme tokens and primitives: `src/design-system`.
- App/page shell structure: `src/design-system` and `src/app` layouts.
- Feature modules should consume visual components, not define global visual policy.

## Safe Change Workflow
1. Modify tokens or shell components in `design-system`.
2. Verify stories or page previews.
3. Run `npm run lint` and `npm run typecheck`.

## Do Not
- Move business logic into visual components.
- Import repository or domain modules inside `design-system`.
