const FORBIDDEN_PUBLIC_CONFIG = Object.freeze([
  "API_TOKEN",
  "DATABASE_URL",
  "SLACK_BOT_TOKEN",
  "RESEND_API_KEY",
  "SENDGRID_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "OLLAMA_BASE_URL",
  "UI_SESSION_SECRET"
]);

export const PRODUCT_RENDERER_RUNTIME_CONTRACT = Object.freeze({
  phase: "13",
  status: "product-renderer-runtime",
  renderer: "vanilla-dom",
  dependencyPolicy: "no-runtime-dependencies",
  productionServingModel: "d4-node-static-proxy",
  developmentServingModel: "product-dev-server-compose-override",
  build: Object.freeze({
    command: "npm run build",
    publicRoot: "web/dist",
    indexFile: "index.html",
    entryAsset: "/assets/app.js"
  }),
  server: Object.freeze({
    containerPort: 3000,
    defaultDevHostPort: 3001,
    healthPath: "/healthz"
  }),
  api: Object.freeze({
    browserPath: "/api/*",
    internalTarget: "http://groupscout:8080",
    sameOrigin: true,
    credentials: "same-origin"
  }),
  publicConfigAllowlist: Object.freeze(["UI_PUBLIC_API_PATH"]),
  forbiddenPublicConfig: FORBIDDEN_PUBLIC_CONFIG
});

export const BROWSER_COMPONENT_HARNESS_CONTRACT = Object.freeze({
  phase: "13-B",
  harness: "node-rendered-dom-smoke",
  packageDependencies: Object.freeze([]),
  firstRoutes: Object.freeze(["/", "/leads", "/leads/lead_hotel_001"]),
  capabilities: Object.freeze({
    routeRendering: true,
    focusableControls: true,
    accessibleNames: true,
    responsiveNavigation: true,
    sameOriginApiCalls: true,
    staticAssetSecretScan: true
  })
});

export function assertProductRendererRuntimeContract(contract = PRODUCT_RENDERER_RUNTIME_CONTRACT) {
  if (contract.productionServingModel !== "d4-node-static-proxy") {
    throw new Error("Phase 13 production must preserve the D4 static/proxy boundary");
  }

  if (contract.api?.browserPath !== "/api/*" || contract.api?.sameOrigin !== true) {
    throw new Error("Phase 13 browser API calls must stay same-origin through /api/*");
  }

  if (contract.api?.internalTarget !== "http://groupscout:8080") {
    throw new Error("Phase 13 server-side API target must remain http://groupscout:8080");
  }

  if (contract.build?.publicRoot !== "web/dist") {
    throw new Error("Phase 13 static build output must remain web/dist");
  }

  assertProductRendererPublicConfigSafe({ UI_PUBLIC_API_PATH: contract.api.browserPath });

  return true;
}

export function assertProductRendererPublicConfigSafe(value) {
  const match = findForbiddenPublicConfigKey(value);

  if (match) {
    throw new Error(`${match} must not enter Phase 13 browser public config`);
  }

  return true;
}

function findForbiddenPublicConfigKey(value) {
  const stack = [{ key: "", value }];
  const forbidden = FORBIDDEN_PUBLIC_CONFIG.map((key) => ({
    key,
    normalized: normalizeConfigKey(key)
  }));

  while (stack.length > 0) {
    const current = stack.pop();
    const normalizedKey = normalizeConfigKey(current.key);

    if (current.key) {
      const keyMatch = forbidden.find((entry) => normalizedKey.includes(entry.normalized));

      if (keyMatch) {
        return keyMatch.key;
      }
    }

    if (typeof current.value === "string") {
      const normalizedValue = normalizeConfigKey(current.value);
      const valueMatch = forbidden.find((entry) => normalizedValue.includes(entry.normalized));

      if (valueMatch) {
        return valueMatch.key;
      }
    }

    if (!current.value || typeof current.value !== "object") {
      continue;
    }

    for (const [key, childValue] of Object.entries(current.value)) {
      stack.push({ key, value: childValue });
    }
  }

  return undefined;
}

function normalizeConfigKey(key) {
  return String(key).replaceAll(/[^a-z0-9]/gi, "").toLowerCase();
}
