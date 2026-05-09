import { SESSION_COOKIE_NAME } from "./uiDeployment.js";

const FORBIDDEN_BROWSER_ENV = [
  "API_TOKEN",
  "DATABASE_URL",
  "SLACK_BOT_TOKEN",
  "RESEND_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "OLLAMA_BASE_URL",
  "UI_SESSION_SECRET"
];

export const BROWSER_RUNTIME_CONTRACT = Object.freeze({
  phase: "D2",
  status: "contract-only",
  runtime: "lightweight-node-server",
  framework: "not-selected",
  startCommand: "npm run start:ui",
  containerPort: 3000,
  healthPath: "/healthz",
  staticAssets: Object.freeze({
    mode: "server-owned-generated-assets",
    publicRoot: "web/dist",
    generatedPublicConfig: false
  }),
  apiRouting: Object.freeze({
    browserPath: "/api/*",
    internalTarget: "http://groupscout:8080",
    sameOrigin: true,
    credentials: "same-origin",
    sessionCookieName: SESSION_COOKIE_NAME,
    exposeAutomationToken: false
  }),
  forbiddenBrowserEnv: Object.freeze([...FORBIDDEN_BROWSER_ENV])
});

export function assertBrowserRuntimeContract(contract = BROWSER_RUNTIME_CONTRACT) {
  if (contract.status !== "contract-only") {
    throw new Error("D2 must remain contract-only until a later phase adds runtime code");
  }

  if (contract.runtime !== "lightweight-node-server") {
    throw new Error("D2 runtime contract must choose the lightweight Node server model");
  }

  if (contract.framework !== "not-selected") {
    throw new Error("D2 must not select a browser framework");
  }

  if (!Number.isInteger(contract.containerPort) || contract.containerPort <= 0) {
    throw new Error("D2 browser runtime contract requires a positive container port");
  }

  if (!String(contract.healthPath).startsWith("/")) {
    throw new Error("D2 browser runtime contract requires an absolute health path");
  }

  if (contract.apiRouting?.browserPath !== "/api/*" || contract.apiRouting?.sameOrigin !== true) {
    throw new Error("D2 browser runtime contract must keep browser API calls same-origin through /api/*");
  }

  if (contract.apiRouting?.internalTarget !== "http://groupscout:8080") {
    throw new Error("D2 browser runtime contract must target groupscout:8080 server-side");
  }

  assertBrowserRuntimePublicConfigSafe(contract.staticAssets);

  return true;
}

export function assertBrowserRuntimePublicConfigSafe(value) {
  const match = findForbiddenPublicConfigKey(value);

  if (match) {
    throw new Error(`${match} must not enter browser runtime public config`);
  }

  return true;
}

function findForbiddenPublicConfigKey(value) {
  const stack = [{ key: "", value }];
  const forbidden = new Set(FORBIDDEN_BROWSER_ENV.map(normalizeConfigKey));

  while (stack.length > 0) {
    const current = stack.pop();
    const normalizedKey = normalizeConfigKey(current.key);

    if (current.key && forbidden.has(normalizedKey)) {
      return FORBIDDEN_BROWSER_ENV.find((key) => normalizeConfigKey(key) === normalizedKey);
    }

    if (typeof current.value === "string") {
      const normalizedValue = normalizeConfigKey(current.value);

      if (forbidden.has(normalizedValue)) {
        return FORBIDDEN_BROWSER_ENV.find((key) => normalizeConfigKey(key) === normalizedValue);
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
