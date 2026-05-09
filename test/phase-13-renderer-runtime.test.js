import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

const RENDERER_RUNTIME = new URL("../web/src/server/productRendererRuntime.js", import.meta.url);
const RENDERER = new URL("../web/src/renderer/domRenderer.js", import.meta.url);
const PRODUCT_DEV_SERVER = new URL("../web/src/server/productDevServer.js", import.meta.url);
const BACKEND_SMOKE = new URL("../web/src/server/backendCompatibilitySmoke.js", import.meta.url);
const PRODUCTION_SERVER = new URL("../web/src/server/productionServer.js", import.meta.url);
const STATIC_APP_ENTRY = new URL("../web/src/renderer/staticAppEntry.js", import.meta.url);
const PACKAGE_JSON = new URL("../package.json", import.meta.url);
const COMPOSE_DEV = new URL("../compose.dev.yml", import.meta.url);
const STATIC_ROOT = new URL("../web/dist/", import.meta.url);
const STATIC_INDEX = new URL("../web/dist/index.html", import.meta.url);
const STATIC_APP = new URL("../web/dist/assets/app.js", import.meta.url);
const STATIC_STYLE = new URL("../web/dist/assets/styles.css", import.meta.url);

test("13-A renderer runtime contract preserves D4 production and secret-free public config", async () => {
  const {
    PRODUCT_RENDERER_RUNTIME_CONTRACT,
    assertProductRendererRuntimeContract,
    assertProductRendererPublicConfigSafe
  } = await import(RENDERER_RUNTIME);

  assert.deepEqual(PRODUCT_RENDERER_RUNTIME_CONTRACT, {
    phase: "13",
    status: "product-renderer-runtime",
    renderer: "vanilla-dom",
    dependencyPolicy: "no-runtime-dependencies",
    productionServingModel: "d4-node-static-proxy",
    developmentServingModel: "product-dev-server-compose-override",
    build: {
      command: "npm run build",
      publicRoot: "web/dist",
      indexFile: "index.html",
      entryAsset: "/assets/app.js"
    },
    server: {
      containerPort: 3000,
      defaultDevHostPort: 3001,
      healthPath: "/healthz"
    },
    api: {
      browserPath: "/api/*",
      internalTarget: "http://groupscout:8080",
      sameOrigin: true,
      credentials: "same-origin"
    },
    publicConfigAllowlist: ["UI_PUBLIC_API_PATH"],
    forbiddenPublicConfig: [
      "API_TOKEN",
      "DATABASE_URL",
      "SLACK_BOT_TOKEN",
      "RESEND_API_KEY",
      "SENDGRID_API_KEY",
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
      "OLLAMA_BASE_URL",
      "UI_SESSION_SECRET"
    ]
  });
  assert.doesNotThrow(() => assertProductRendererRuntimeContract(PRODUCT_RENDERER_RUNTIME_CONTRACT));
  assert.doesNotThrow(() => assertProductRendererPublicConfigSafe({ UI_PUBLIC_API_PATH: "/api/*" }));
  assert.throws(
    () => assertProductRendererPublicConfigSafe({ API_TOKEN: "must-not-leak" }),
    /API_TOKEN/
  );
  assert.throws(
    () => assertProductRendererPublicConfigSafe({ PUBLIC_DATABASE_URL: "postgres://example" }),
    /DATABASE_URL|public config allowlist/
  );
});

test("13-B browser harness decision names rendered behavior not covered by model tests", async () => {
  const { BROWSER_COMPONENT_HARNESS_CONTRACT } = await import(RENDERER_RUNTIME);

  assert.equal(BROWSER_COMPONENT_HARNESS_CONTRACT.phase, "13-B");
  assert.equal(BROWSER_COMPONENT_HARNESS_CONTRACT.harness, "node-rendered-dom-smoke");
  assert.deepEqual(BROWSER_COMPONENT_HARNESS_CONTRACT.packageDependencies, []);
  assert.deepEqual(BROWSER_COMPONENT_HARNESS_CONTRACT.firstRoutes, ["/", "/leads", "/leads/lead_hotel_001"]);
  assert.equal(BROWSER_COMPONENT_HARNESS_CONTRACT.capabilities.routeRendering, true);
  assert.equal(BROWSER_COMPONENT_HARNESS_CONTRACT.capabilities.focusableControls, true);
  assert.equal(BROWSER_COMPONENT_HARNESS_CONTRACT.capabilities.accessibleNames, true);
  assert.equal(BROWSER_COMPONENT_HARNESS_CONTRACT.capabilities.responsiveNavigation, true);
  assert.equal(BROWSER_COMPONENT_HARNESS_CONTRACT.capabilities.sameOriginApiCalls, true);
  assert.equal(BROWSER_COMPONENT_HARNESS_CONTRACT.capabilities.staticAssetSecretScan, true);
});

test("13-B static browser entry redirects protected routes until admin session is active", async () => {
  const {
    getUnauthenticatedRedirect,
    isAuthenticatedStatus,
    isPublicRoute,
    routeRequiresAuth,
    verifyAuthenticatedAdmin
  } = await import(STATIC_APP_ENTRY);

  assert.equal(isPublicRoute("/admin/login"), true);
  assert.equal(routeRequiresAuth("/leads"), true);
  assert.equal(getUnauthenticatedRedirect("/leads", { auth_required: true, authenticated: false }), "/admin/login");
  assert.equal(getUnauthenticatedRedirect("/leads", { auth_required: true, authenticated: true }), undefined);
  assert.equal(getUnauthenticatedRedirect("/leads", { auth_required: false, authenticated: false }), undefined);
  assert.equal(isAuthenticatedStatus({ authenticated: true }), true);
  assert.equal(isAuthenticatedStatus({ auth_required: false, authenticated: false }), true);
  assert.equal(isAuthenticatedStatus({ authenticated: false }), false);

  const verified = await verifyAuthenticatedAdmin({
    getAuthStatus: async () => ({ auth_required: true, authenticated: false }),
    getCurrentAdmin: async () => ({ user: { role: "admin" } })
  });
  assert.deepEqual(verified, { user: { role: "admin" } });

  await assert.rejects(
    () =>
      verifyAuthenticatedAdmin({
        getAuthStatus: async () => ({ auth_required: true, authenticated: false }),
        getCurrentAdmin: async () => undefined
      }),
    /Admin session/
  );
});

test("13-C renderer mounts Today, Lead Inbox, and Lead Detail from existing screen models", async () => {
  const {
    RENDERER_BROWSER_ENTRY_CONTRACT,
    renderRouteToHtml
  } = await import(RENDERER);

  const today = renderRouteToHtml("/");
  const leads = renderRouteToHtml("/leads");
  const detail = renderRouteToHtml("/leads/lead_hotel_001");
  const pipeline = renderRouteToHtml("/pipeline");
  const login = renderRouteToHtml("/admin/login");
  const loading = renderRouteToHtml("/leads", { screenState: "loading" });
  const empty = renderRouteToHtml("/leads", { leads: [] });
  const error = renderRouteToHtml("/leads", { screenState: "error", errorMessage: "API unavailable" });

  assert.equal(RENDERER_BROWSER_ENTRY_CONTRACT.apiClientFactory, "createApiClient");
  assert.equal(RENDERER_BROWSER_ENTRY_CONTRACT.apiPath, "/api/*");
  assert.equal(RENDERER_BROWSER_ENTRY_CONTRACT.sameOriginOnly, true);
  assert.match(today.html, /<nav[^>]+aria-label="Primary"/);
  assert.match(today.html, /<main[^>]+aria-label="GroupScout operator workspace"/);
  assert.match(today.html, /Today/);
  assert.match(leads.html, /Lead Inbox/);
  assert.match(leads.html, /aria-label="Search leads"/);
  assert.match(leads.html, /data-admin-logout/);
  assert.match(leads.html, /Riverside hotel renovation crew block/);
  assert.match(detail.html, /Source Evidence/);
  assert.match(detail.html, /AI Enrichment/);
  assert.match(detail.html, /Riverside hotel renovation crew block/);
  assert.match(pipeline.html, /data-pipeline-action="start"/);
  assert.match(pipeline.html, /id="pipeline-run-feedback"/);
  assert.match(pipeline.html, /id="pipeline-output"/);
  assert.match(pipeline.html, /Slack output preview/);
  assert.match(login.html, /data-admin-login-form/);
  assert.match(login.html, /class="admin-login-window"/);
  assert.match(login.html, /aria-label="Setup token"/);
  assert.match(login.html, /aria-disabled="true"/);
  assert.doesNotMatch(login.html, /<nav[^>]*>[\s\S]*<a\s/i);
  assert.doesNotMatch(login.html, /data-admin-logout/);
  assert.match(loading.html, /role="status"[^>]*>Loading leads for review\./);
  assert.match(empty.html, /No leads available/);
  assert.match(error.html, /role="alert"[^>]*>API unavailable/);
  assert.deepEqual(leads.focusableLabels.slice(0, 3), ["Search leads", "Status", "Source"]);
  assert.equal(leads.responsiveMode, "desktop-table");
  assert.doesNotMatch(JSON.stringify(leads.props), /API_TOKEN|DATABASE_URL|UI_SESSION_SECRET/);
});

test("13-C renderer renders mobile verification queue cards from mobile model data", async () => {
  const { renderRouteToHtml } = await import(RENDERER);

  const verification = renderRouteToHtml("/verification", { viewport: "mobile" });

  assert.equal(verification.responsiveMode, "mobile-verification-cards");
  assert.equal(verification.props.content.table.rows.length, 0);
  assert.ok(verification.props.content.mobileCards.length > 0);
  assert.match(verification.html, /5 leads need review/);
  assert.match(verification.html, /Hotel wing renovation with inferred crew need/);
  assert.match(verification.html, /High score with weak rationale/);
  assert.match(verification.html, /href="\/api\/leads\/lead_weak_rationale\/raw"/);
  assert.match(verification.html, /Open raw audit evidence/);
  assert.match(verification.html, />Verify</);
  assert.match(verification.html, />Correct</);
  assert.match(verification.html, />Dismiss</);
  assert.match(verification.html, />Return to lead</);
});

test("13-D static product build output is present, route-safe, and secret-free", async () => {
  const [{ createStaticAssetResponsePlan }, packageJsonSource, indexHtml, appJs, styleCss] = await Promise.all([
    import(PRODUCTION_SERVER),
    readFile(PACKAGE_JSON, "utf8"),
    readFile(STATIC_INDEX, "utf8"),
    readFile(STATIC_APP, "utf8"),
    readFile(STATIC_STYLE, "utf8")
  ]);
  const packageJson = JSON.parse(packageJsonSource);

  assert.equal(packageJson.scripts.build, "node web/src/renderer/buildStaticApp.js");
  assert.match(indexHtml, /<div id="app"><\/div>/);
  assert.match(indexHtml, /<link rel="stylesheet" href="\/assets\/styles\.css\?v=admin-login-2">/);
  assert.match(indexHtml, /<script type="module" src="\/assets\/app\.js\?v=admin-login-2"><\/script>/);
  assert.match(appJs, /GroupScout operator workspace/);
  assert.match(appJs, /pipelineRuntime\.js\?v=admin-login-2/);
  assert.match(appJs, /createApiClient|\/api\/system/);
  assert.match(styleCss, /\.lead-inbox-table/);
  assert.match(styleCss, /\.pipeline-output/);

  for (const asset of await listStaticFiles(STATIC_ROOT)) {
    const source = await readFile(new URL(asset, STATIC_ROOT), "utf8");
    assert.doesNotMatch(
      source,
      /API_TOKEN|DATABASE_URL|SLACK_BOT_TOKEN|RESEND_API_KEY|SENDGRID_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|OLLAMA_BASE_URL|UI_SESSION_SECRET/
    );
  }

  const fallback = await createStaticAssetResponsePlan({
    requestPath: "/leads/lead_hotel_001",
    publicRoot: STATIC_ROOT
  });

  assert.equal(fallback.statusCode, 200);
  assert.match(fallback.contentType, /text\/html/);
  assert.equal(fallback.filePath.endsWith("web/dist/index.html"), true);

  const copiedModule = await createStaticAssetResponsePlan({
    requestPath: "/src/renderer/domRenderer.js",
    publicRoot: STATIC_ROOT
  });

  assert.equal(copiedModule.statusCode, 200);
  assert.equal(copiedModule.cacheControl, "no-store");
});

test("13-G static app intercepts only browser app-route navigation", async () => {
  const { shouldInterceptAppNavigation } = await import(STATIC_APP_ENTRY);
  const location = new URL("https://groupscout.test/leads");

  assert.equal(shouldInterceptAppNavigation(clickEvent(), anchor("/leads/lead_hotel_001"), location), true);
  assert.equal(shouldInterceptAppNavigation(clickEvent(), anchor("/pipeline?tab=runs#latest"), location), true);
  assert.equal(shouldInterceptAppNavigation(clickEvent(), anchor("/api/leads/lead_hotel_001/raw"), location), false);
  assert.equal(shouldInterceptAppNavigation(clickEvent(), anchor("/assets/app.js?v=admin-login-2"), location), false);
  assert.equal(shouldInterceptAppNavigation(clickEvent(), anchor("/src/renderer/domRenderer.js"), location), false);
  assert.equal(shouldInterceptAppNavigation(clickEvent(), anchor("/exports/leads.csv"), location), false);
  assert.equal(shouldInterceptAppNavigation(clickEvent(), anchor("https://api.groupscout.test/leads"), location), false);
  assert.equal(shouldInterceptAppNavigation(clickEvent({ ctrlKey: true }), anchor("/leads"), location), false);
  assert.equal(shouldInterceptAppNavigation(clickEvent({ button: 1 }), anchor("/leads"), location), false);
  assert.equal(shouldInterceptAppNavigation(clickEvent(), anchor("/leads", { target: "_blank" }), location), false);
  assert.equal(shouldInterceptAppNavigation(clickEvent(), anchor("/leads.csv", { download: true }), location), false);
});

test("13-E product dev server and Compose keep backend discovery server-side", async () => {
  const [
    { PRODUCT_DEV_SERVER_CONTRACT, createProductDevHealthPayload },
    compose
  ] = await Promise.all([
    import(PRODUCT_DEV_SERVER),
    readFile(COMPOSE_DEV, "utf8")
  ]);

  assert.deepEqual(PRODUCT_DEV_SERVER_CONTRACT, {
    phase: "13-E",
    status: "product-dev-server",
    command: "node web/src/server/productDevServer.js",
    healthPath: "/healthz",
    containerPort: 3000,
    defaultHostPort: 3001,
    publicRoot: "web/dist",
    browserApiPath: "/api/*",
    backendTarget: "http://groupscout:8080"
  });
  assert.deepEqual(createProductDevHealthPayload({ UI_PUBLIC_API_PATH: "/api/*" }), {
    status: "ok",
    phase: "13-E",
    service: "groupscout-ui",
    mode: "product-dev-server",
    assets: { publicRoot: "web/dist" },
    api: {
      browserPath: "/api/*",
      internalTarget: "http://groupscout:8080",
      sameOrigin: true
    }
  });
  assert.match(compose, /command: \["node", "web\/src\/server\/productDevServer\.js"\]/);
  assert.match(compose, /"\$\{GROUPSCOUT_UI_HOST_PORT:-3001\}:3000"/);
  assert.match(compose, /UI_API_PROXY_TARGET: "http:\/\/groupscout:8080"/);
  assert.match(compose, /networks:\n      - groupscout_net/);
  assert.doesNotMatch(compose, /API_TOKEN|DATABASE_URL|SLACK|RESEND|SENDGRID|OPENAI|ANTHROPIC|CLAUDE|OLLAMA|UI_SESSION_SECRET/i);
});

test("13-F backend compatibility smoke classifies proxy, auth, route, and schema drift", async () => {
  const {
    BACKEND_COMPATIBILITY_SMOKE_CONTRACT,
    classifyBackendCompatibilityResponse
  } = await import(BACKEND_SMOKE);

  assert.deepEqual(
    BACKEND_COMPATIBILITY_SMOKE_CONTRACT.routes.map((route) => route.path),
    ["/api/system", "/api/leads", "/api/pipeline/runs", "/api/stats", "/api/alerts", "/api/leads/{id}/raw"]
  );
  assert.equal(BACKEND_COMPATIBILITY_SMOKE_CONTRACT.phase, "13-F");
  assert.equal(BACKEND_COMPATIBILITY_SMOKE_CONTRACT.owner, "backend-api-compatibility");
  assert.equal(classifyBackendCompatibilityResponse({ status: 502, body: {} }).classification, "proxy_failure");
  assert.equal(classifyBackendCompatibilityResponse({ status: 404, body: {} }).classification, "backend_route_drift");
  assert.equal(classifyBackendCompatibilityResponse({ status: 401, body: {} }).classification, "auth_required");
  assert.equal(
    classifyBackendCompatibilityResponse({ status: 200, body: { unexpected: true } }, { requiredFields: ["status"] }).classification,
    "schema_drift"
  );
  assert.equal(
    classifyBackendCompatibilityResponse({ status: 200, body: { status: "ok" } }, { requiredFields: ["status"] }).classification,
    "compatible"
  );
});

async function listStaticFiles(rootUrl, relativeDir = ".") {
  const dirUrl = new URL(`${relativeDir}/`, rootUrl);
  const entries = await readdir(dirUrl, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(relativeDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listStaticFiles(rootUrl, relativePath));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

function clickEvent(overrides = {}) {
  return {
    altKey: false,
    button: 0,
    ctrlKey: false,
    defaultPrevented: false,
    metaKey: false,
    shiftKey: false,
    ...overrides
  };
}

function anchor(href, { target = "", download = false } = {}) {
  return {
    href: new URL(href, "https://groupscout.test").href,
    target,
    hasAttribute(name) {
      return name === "download" ? download : false;
    }
  };
}
