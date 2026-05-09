import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { BROWSER_RUNTIME_CONTRACT } from "./browserRuntimeContract.js";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PUBLIC_ROOT = path.resolve(MODULE_DIR, "../../dist");
const DEFAULT_INDEX_FILE = "index.html";
const DEFAULT_STATIC_ASSET_PATH = "/assets/app.js";
const DEFAULT_BACKEND_TARGET = BROWSER_RUNTIME_CONTRACT.apiRouting.internalTarget;
const DEFAULT_BROWSER_API_PATH = BROWSER_RUNTIME_CONTRACT.apiRouting.browserPath;
const DEFAULT_HEALTH_PATH = BROWSER_RUNTIME_CONTRACT.healthPath;
const DEFAULT_CONTAINER_PORT = BROWSER_RUNTIME_CONTRACT.containerPort;

const FORBIDDEN_PUBLIC_CONFIG = Object.freeze([
  "API_TOKEN",
  "DATABASE_URL",
  "POSTGRES_URL",
  "TEST_POSTGRES_URL",
  "SLACK_BOT_TOKEN",
  "SLACK_SIGNING_SECRET",
  "SLACK_WEBHOOK_URL",
  "RESEND_API_KEY",
  "SENDGRID_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "CLAUDE_API_KEY",
  "OLLAMA_BASE_URL",
  "UI_SESSION_SECRET",
  "AUTHORIZATION",
  "BEARER",
  "X_API_KEY",
  "X_API_TOKEN",
  "PASSWORD",
  "SECRET",
  "TOKEN",
  "PRIVATE_KEY"
]);

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);

const BLOCKED_PROXY_HEADERS = new Set([
  "authorization",
  "x-api-key",
  "x-api-token"
]);

export const PRODUCTION_SERVING_CONTRACT = Object.freeze({
  phase: "D4",
  status: "production-same-origin-serving",
  servingModel: "node-static-assets-and-api-proxy",
  serviceName: "groupscout-ui",
  containerPort: DEFAULT_CONTAINER_PORT,
  healthPath: DEFAULT_HEALTH_PATH,
  publicRoot: "web/dist",
  indexFile: DEFAULT_INDEX_FILE,
  staticAssetPath: DEFAULT_STATIC_ASSET_PATH,
  browserApiPath: DEFAULT_BROWSER_API_PATH,
  backendTarget: DEFAULT_BACKEND_TARGET
});

export function createPublicRuntimeConfig(env = process.env) {
  const apiPath = env.UI_PUBLIC_API_PATH || DEFAULT_BROWSER_API_PATH;

  if (apiPath !== "/api/*") {
    throw new Error("Production public API path must remain same-origin /api/*");
  }

  const config = { apiPath };
  assertProductionPublicConfigSafe(config);

  return config;
}

export function createProductionHealthPayload(env = process.env) {
  const safePublicConfig = createPublicRuntimeConfig(env);

  return {
    status: "ok",
    phase: PRODUCTION_SERVING_CONTRACT.phase,
    service: PRODUCTION_SERVING_CONTRACT.serviceName,
    api: {
      browserPath: safePublicConfig.apiPath,
      sameOrigin: true
    }
  };
}

export function assertProductionPublicConfigSafe(value) {
  const match = findForbiddenPublicConfigKey(value);

  if (match) {
    throw new Error(`${match} must not enter production public config or static assets`);
  }

  return true;
}

export function createProductionServer({
  env = process.env,
  publicRoot = DEFAULT_PUBLIC_ROOT
} = {}) {
  const resolvedPublicRoot = path.resolve(publicRoot);
  const backendTarget = env.UI_API_PROXY_TARGET || DEFAULT_BACKEND_TARGET;

  return http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");

    if (url.pathname === DEFAULT_HEALTH_PATH) {
      sendJson(response, 200, createProductionHealthPayload(env));
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      await proxyApiRequest({ request, response, targetBaseUrl: backendTarget });
      return;
    }

    await serveStaticAsset({
      requestPath: url.pathname,
      response,
      publicRoot: resolvedPublicRoot
    });
  });
}

export function startProductionServer({ env = process.env } = {}) {
  const port = Number.parseInt(env.UI_PORT || String(DEFAULT_CONTAINER_PORT), 10);
  const server = createProductionServer({ env });

  server.listen(port, "0.0.0.0");

  return server;
}

async function proxyApiRequest({ request, response, targetBaseUrl }) {
  try {
    const proxyRequest = createApiProxyRequest({
      requestUrl: request.url || "/",
      method: request.method,
      headers: request.headers,
      targetBaseUrl
    });
    const init = {
      method: proxyRequest.method,
      headers: proxyRequest.headers,
      redirect: "manual"
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request;
      init.duplex = "half";
    }

    const upstreamResponse = await fetch(proxyRequest.url, init);

    response.writeHead(upstreamResponse.status, filterProxyResponseHeaders(upstreamResponse.headers));

    if (upstreamResponse.body) {
      for await (const chunk of upstreamResponse.body) {
        response.write(chunk);
      }
    }

    response.end();
  } catch {
    sendJson(response, 502, { error: "bad_gateway" });
  }
}

export function createApiProxyRequest({ requestUrl, method, headers, targetBaseUrl }) {
  return {
    url: new URL(requestUrl, targetBaseUrl),
    method,
    headers: filterProxyRequestHeaders(headers)
  };
}

async function serveStaticAsset({ requestPath, response, publicRoot }) {
  const pathname = requestPath === "/" ? `/${DEFAULT_INDEX_FILE}` : requestPath;
  const decodedPathname = decodeURIComponent(pathname);
  const resolvedPath = path.resolve(publicRoot, `.${decodedPathname}`);
  const relativePath = path.relative(publicRoot, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    sendJson(response, 404, { error: "not_found" });
    return;
  }

  try {
    const fileStat = await stat(resolvedPath);

    if (!fileStat.isFile()) {
      sendJson(response, 404, { error: "not_found" });
      return;
    }
  } catch {
    sendJson(response, 404, { error: "not_found" });
    return;
  }

  response.writeHead(200, {
    "cache-control": requestPath === "/" ? "no-store" : "public, max-age=31536000, immutable",
    "content-type": contentTypeForPath(resolvedPath)
  });
  createReadStream(resolvedPath).pipe(response);
}

function filterProxyRequestHeaders(headers) {
  const nextHeaders = {};

  for (const [name, value] of Object.entries(headers)) {
    const lowerName = name.toLowerCase();

    if (HOP_BY_HOP_HEADERS.has(lowerName) || BLOCKED_PROXY_HEADERS.has(lowerName) || lowerName === "host") {
      continue;
    }

    nextHeaders[name] = value;
  }

  return nextHeaders;
}

function filterProxyResponseHeaders(headers) {
  const nextHeaders = {};

  for (const [name, value] of headers.entries()) {
    const lowerName = name.toLowerCase();

    if (HOP_BY_HOP_HEADERS.has(lowerName)) {
      continue;
    }

    nextHeaders[name] = value;
  }

  return nextHeaders;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": "application/json"
  });
  response.end(JSON.stringify(payload));
}

function contentTypeForPath(filePath) {
  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }

  if (filePath.endsWith(".js")) {
    return "application/javascript; charset=utf-8";
  }

  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }

  if (filePath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }

  return "application/octet-stream";
}

function findForbiddenPublicConfigKey(value) {
  const stack = [{ key: "", value }];
  const forbidden = new Set(FORBIDDEN_PUBLIC_CONFIG.map(normalizeConfigKey));

  while (stack.length > 0) {
    const current = stack.pop();
    const normalizedKey = normalizeConfigKey(current.key);

    if (current.key && forbidden.has(normalizedKey)) {
      return FORBIDDEN_PUBLIC_CONFIG.find((key) => normalizeConfigKey(key) === normalizedKey);
    }

    if (typeof current.value === "string") {
      const normalizedValue = normalizeConfigKey(current.value);

      if (forbidden.has(normalizedValue)) {
        return FORBIDDEN_PUBLIC_CONFIG.find((key) => normalizeConfigKey(key) === normalizedValue);
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startProductionServer();
}
