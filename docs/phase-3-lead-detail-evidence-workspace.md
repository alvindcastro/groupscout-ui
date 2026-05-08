# Phase 3 Lead Detail Evidence Workspace

Phase 3 builds a read-only Lead Detail workspace around source-backed review. It lets operators understand why a lead exists, what the AI inferred, what evidence supports those claims, and what has already happened without adding write workflows yet.

## Scope

- `createLeadDetailScreen(...)` returns a dense detail workspace model for `/leads/{id}`.
- `/leads/{id}` mounts the Lead Detail Evidence Workspace through `createRouteShell(...)` while keeping the Leads navigation item active.
- Required sections are Summary, Source Evidence, AI Enrichment, Actions, Outreach, and Activity.
- Summary exposes title, score, suggested timing, room-night signal, and property fit.
- Source Evidence exposes source name, source URL, raw audit link, and collected timestamp.
- AI Enrichment exposes contractor or applicant, project type, crew size, duration, rationale, uncertainty, and the source evidence for reviewable claims.
- Activity exposes status history, notes, outreach attempts, and reviewer corrections.
- Raw audit access is represented as a link intent only; raw payloads are not loaded inline in this phase.

## UI Behavior

- The workspace is read-only: status changes, ownership edits, outreach logging, reviewer corrections, and mutation side effects stay out of scope.
- Source-backed extraction values and reviewer corrections must remain visually distinct so corrections never silently replace original evidence.
- Actions are visible but disabled, with a read-only reason for Phase 3.
- Loading, not found, and error states are explicit screen states with accessible status or alert metadata.
- Desktop layout uses an evidence workspace with summary, evidence, and side-panel regions.
- Tablet and mobile layouts collapse into readable stacked sequences; mobile keeps actions reachable in sticky-bottom metadata.

## Design Tokens

The workspace uses documented `DESIGN.md` tokens rather than adding new visual primitives:

- `card-base` for bounded detail panels.
- `property-row` for field-level evidence, extracted values, and correction rows.
- `badge-type` for claim types, uncertainty labels, and field categories.
- `badge-tag` for reviewer corrections.
- `button-secondary` for the raw audit link affordance.
- `code-inline` for original AI extraction values.

Mint green remains reserved for active or confirmation accents. Evidence trust, warnings, uncertainty, and errors should use the existing neutral, tag, warn, or error tokens instead of expanding the palette.

## TDD Evidence

The current repo uses Node's built-in `node:test` harness without a DOM or browser runtime. Phase 3 tests verify screen contracts, section metadata, responsive layout metadata, token references, and navigation/link intents rather than computed CSS or real focus traversal.

- Red run: `node --test test/lead-detail-screen.test.js test/app-shell.test.js` failed because `web/src/app/leadDetail.js` did not exist yet.
- Green run: `node --test test/lead-detail-screen.test.js test/app-shell.test.js test/design-tokens.test.js` passed after adding the read-only detail workspace, `/leads/{id}` route contract, Phase 3 token exports, state metadata, source-versus-correction distinction, and raw audit link intent.
- Full-suite run: `npm test` passes all Phase 0, Phase 1, Phase 2, and Phase 3 tests.

## Out Of Scope

- Mutating lead status, owner, reviewer corrections, notes, or outreach history.
- Fetching or rendering raw audit payloads inline.
- Browser-only assertions for computed layout, CSS media queries, or focus traversal.
- Analytics, auth/session behavior, and production API integration beyond the detail read contract.
