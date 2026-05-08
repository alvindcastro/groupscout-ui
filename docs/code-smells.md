# Code Smells And Housekeeping Notes

These are documentation-only findings from the current UI and backend housekeeping pass. They are not code changes.

## UI Repo

### Partial Design Token Mapping

`web/src/design/tokens.js` exports only the token subset needed by current tests. One observed risk is component token references that point to nested token names without a resolver/parity check against `DESIGN.md`.

Impact: future rendered CSS could rely on unresolved token references even while current model tests pass.

Suggested follow-up: add token parity or resolver tests before introducing real CSS rendering.

### File-List Credential Guard

`test/api-boundary.test.js` checks a hard-coded set of files for browser credential leaks.

Impact: a new browser-facing file can be missed unless the allowlist is updated.

Suggested follow-up: scan all relevant `web/src/**/*.js` files instead of maintaining a static list.

### Mutation Metadata Is Not A Full Payload Schema

`leadStatus.js` exposes `mutationFields` as UI metadata. The `corrected` action requires `correctionReason` and serializes it, but its `mutationFields` list only calls out `status` and `corrections`.

Impact: treating `mutationFields` as the complete PATCH schema would miss `correctionReason`.

Suggested follow-up: either document `mutationFields` as display metadata only or include all serialized fields in the metadata.

### Mock Route Parsing

`shell.js` extracts lead IDs from `/leads/{id}` with a raw string slice.

Impact: query strings, trailing slashes, and encoded route params will be treated as literal IDs.

Suggested follow-up: normalize route params when a real router is introduced.

### Model-Level Test Coverage Only

The current tests assert JavaScript objects and metadata, not browser-rendered UI.

Impact: green tests do not prove keyboard behavior, visual layout, focus handling, or responsive rendering.

Suggested follow-up: add browser/component coverage when a renderer exists.

### Missing Runtime Contract

The tests use modern Node and web APIs, but `package.json` does not declare an `engines` field.

Impact: developers on older Node versions can see confusing failures.

Suggested follow-up: standardize Node version in docs first, then add an `engines` field when package policy is ready.

## Backend Repo Documentation Drift

The backend repo was inspected as a source for startup and testing instructions. A few docs appear stale relative to current config:

- Some Docker log examples use service name `app`; current compose service is `groupscout`.
- Some Postgres examples reference generated container names; current compose sets `groupscout_postgres`.
- Some docs reference `docs/API_TESTING.md`, but that file was not present during inspection.
- Email provider docs mention `SENDGRID_API_KEY`, while `.env.example` and config use `RESEND_API_KEY`.

Suggested follow-up: update backend docs in `/mnt/c/Users/alvin/GolandProjects/groupscout` in a separate backend-docs pass.
