# Phase 15 Browser UX Hardening

## Scope

Phase 15 adds deterministic UX hardening evidence for the current dependency-free renderer. It verifies primary routes expose keyboard-focus labels, accessible names, responsive variants, stable state regions, same-origin API metadata, and a text-containment policy without adding a browser dependency.

## UI Behavior

- Primary routes covered: Today, Leads, Lead Detail, Verification, Outreach, Pipeline, Analytics, and Alerts.
- Lead Inbox loading, error, and empty states remain stable and expose `role="status"` or `role="alert"` where appropriate.
- Focusable labels are derived from rendered controls and primary navigation.
- Browser API calls remain same-origin through `/api/*`.

## TDD Evidence

- Red: `node --test test/browser-ux-hardening.test.js` failed because `web/src/renderer/browserUxHardening.js` did not exist.
- Green: `node --test test/browser-ux-hardening.test.js` passed after adding `BROWSER_UX_HARDENING_CONTRACT` and `createBrowserUxHardeningReport(...)`.
- Broader verification: `npm test`.

## Out Of Scope

Real browser-engine focus traversal, screenshots, pixel checks, computed layout, and visual overlap detection are still out of scope until a deterministic browser harness such as Playwright is introduced.

