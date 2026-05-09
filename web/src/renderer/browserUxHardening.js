import { RENDERER_BROWSER_ENTRY_CONTRACT, renderRouteToHtml } from "./domRenderer.js";

export const BROWSER_UX_HARDENING_CONTRACT = Object.freeze({
  phase: "15",
  harness: "node-rendered-html-smoke",
  screenshotPolicy: "blocked-until-deterministic-browser-harness",
  primaryRoutes: Object.freeze([
    "/",
    "/leads",
    "/leads/lead_hotel_001",
    "/verification",
    "/outreach",
    "/pipeline",
    "/analytics",
    "/alerts"
  ]),
  requirements: Object.freeze({
    keyboardFocus: true,
    accessibleNames: true,
    responsiveVariants: Object.freeze(["desktop", "tablet", "mobile"]),
    noTextOverflowPolicy: true,
    stableLoadingAndErrorStates: true,
    sameOriginApiCalls: true
  })
});

export function createBrowserUxHardeningReport({
  routes = BROWSER_UX_HARDENING_CONTRACT.primaryRoutes
} = {}) {
  return {
    phase: BROWSER_UX_HARDENING_CONTRACT.phase,
    harness: BROWSER_UX_HARDENING_CONTRACT.harness,
    api: {
      path: RENDERER_BROWSER_ENTRY_CONTRACT.apiPath,
      sameOriginOnly: RENDERER_BROWSER_ENTRY_CONTRACT.sameOriginOnly
    },
    routes: routes.map(createRouteUxEvidence)
  };
}

function createRouteUxEvidence(path) {
  const rendered = renderRouteToHtml(path);
  const loading = path === "/leads" ? renderRouteToHtml(path, { screenState: "loading" }) : undefined;
  const error = path === "/leads" ? renderRouteToHtml(path, { screenState: "error" }) : undefined;
  const empty = path === "/leads" ? renderRouteToHtml(path, { leads: [] }) : undefined;

  return {
    path,
    hasPrimaryNavigation: /<nav[^>]+aria-label="Primary"/.test(rendered.html),
    hasMainLandmark: /<main[^>]+aria-label="GroupScout operator workspace"/.test(rendered.html),
    focusableLabels: rendered.focusableLabels,
    accessibleNamesMissing: rendered.focusableLabels.filter((label) => !String(label).trim()),
    responsiveVariants: BROWSER_UX_HARDENING_CONTRACT.requirements.responsiveVariants,
    textContainment: {
      maxLineLength: maxTextSegmentLength(rendered.html),
      usesStableControls: hasStableInteractiveMarkup(rendered.html)
    },
    states: {
      loading: {
        hasStatusRole: loading ? /role="status"/.test(loading.html) : true
      },
      error: {
        hasAlertRole: error ? /role="alert"/.test(error.html) : true
      },
      empty: {
        isStable: empty ? /No leads available/.test(empty.html) : true
      }
    }
  };
}

function hasStableInteractiveMarkup(html) {
  return /aria-label=/.test(html) || /aria-current="page"/.test(html);
}

function maxTextSegmentLength(html) {
  return stripTags(html)
    .split(/\s+/)
    .map((segment) => segment.trim().length)
    .reduce((max, length) => Math.max(max, length), 0);
}

function stripTags(html) {
  return html
    .replaceAll(/<[^>]+>/g, " ")
    .replaceAll(/&quot;/g, '"')
    .replaceAll(/&amp;/g, "&")
    .replaceAll(/&lt;/g, "<")
    .replaceAll(/&gt;/g, ">")
    .replaceAll(/\s+/g, " ")
    .trim();
}
