# GroupScout UI

Phase 0 establishes the product contract and test harness for the future GroupScout operator workspace. It does not implement lead-management workflows.

## Current Scope

- Design tokens live in `web/src/design/tokens.js` and are mapped from `DESIGN.md`.
- The placeholder route shell lives in `web/src/app/shell.js`.
- Browser API access is isolated in `web/src/api/client.js` and restricted to same-origin `/api/*` paths.
- Tests use Node's built-in `node:test` runner so the harness has no package-install requirement yet.

## Test Command

```sh
npm test
```

## Phase 0 Guardrails

- Browser-facing source must not reference automation credentials.
- Browser requests must stay behind explicit `/api/*` contracts.
- The shell reserves navigation for Today, Leads, Verification, Outreach, Pipeline, Analytics, and Settings.
- Feature screens, real API calls, auth, analytics, and deployment behavior remain out of scope until later phases.
