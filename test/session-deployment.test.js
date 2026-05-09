import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { test } from "node:test";

import {
  SESSION_COOKIE_NAME,
  assertUiDeploymentReady,
  authorizeUiApiRequest,
  createUiDeploymentConfig,
  resolveUiMount
} from "../web/src/server/uiDeployment.js";
import { createProductionRequestHandler, startProductionServer } from "../web/src/server/productionServer.js";

test("UI API requests require a valid operator session cookie", () => {
  const config = createUiDeploymentConfig({
    UI_ENABLED: "true",
    UI_BASE_PATH: "/ops",
    UI_SESSION_SECRET: "0123456789abcdef0123456789abcdef"
  });
  const sessions = new Set(["session_123"]);

  assert.deepEqual(
    authorizeUiApiRequest(
      {
        pathname: "/api/leads",
        headers: { cookie: `${SESSION_COOKIE_NAME}=session_123` }
      },
      { config, sessions }
    ),
    { allowed: true, reason: "session-valid" }
  );

  assert.deepEqual(
    authorizeUiApiRequest({ pathname: "/api/leads", headers: {} }, { config, sessions }),
    {
      allowed: false,
      status: 401,
      reason: "missing-session",
      headers: { "www-authenticate": "GroupScoutSession" }
    }
  );

  assert.deepEqual(
    authorizeUiApiRequest(
      {
        pathname: "/api/leads",
        headers: { authorization: "Bearer automation-token" }
      },
      { config, sessions }
    ),
    {
      allowed: false,
      status: 401,
      reason: "missing-session",
      headers: { "www-authenticate": "GroupScoutSession" }
    }
  );

  assert.deepEqual(
    authorizeUiApiRequest(
      {
        pathname: "/api/leads",
        headers: { cookie: `${SESSION_COOKIE_NAME}=expired` }
      },
      { config, sessions }
    ),
    {
      allowed: false,
      status: 401,
      reason: "invalid-session",
      headers: { "www-authenticate": "GroupScoutSession" }
    }
  );
});

test("UI auth endpoints reach the backend before a session exists", () => {
  const config = createUiDeploymentConfig({
    UI_ENABLED: "true",
    UI_SESSION_SECRET: "0123456789abcdef0123456789abcdef"
  });

  assert.deepEqual(
    authorizeUiApiRequest({ pathname: "/api/auth/status", headers: {} }, { config, sessions: new Set() }),
    { allowed: true, reason: "public-auth-endpoint" }
  );

  assert.deepEqual(
    authorizeUiApiRequest({ pathname: "/api/auth/login", headers: {} }, { config, sessions: new Set() }),
    { allowed: true, reason: "public-auth-endpoint" }
  );

  assert.deepEqual(
    authorizeUiApiRequest({ pathname: "/api/auth/logout", headers: {} }, { config, sessions: new Set() }),
    { allowed: true, reason: "public-auth-endpoint" }
  );

  assert.deepEqual(
    authorizeUiApiRequest({ pathname: "/api/auth/me", headers: {} }, { config, sessions: new Set() }),
    {
      allowed: false,
      status: 401,
      reason: "missing-session",
      headers: { "www-authenticate": "GroupScoutSession" }
    }
  );
});

test("UI proxy can forward backend-owned admin session cookies", () => {
  const config = createUiDeploymentConfig({
    UI_ENABLED: "true",
    UI_SESSION_SECRET: "0123456789abcdef0123456789abcdef"
  });

  assert.deepEqual(
    authorizeUiApiRequest(
      {
        pathname: "/api/leads",
        headers: { cookie: `${SESSION_COOKIE_NAME}=backend-session-token` }
      },
      { config }
    ),
    { allowed: true, reason: "session-forwarded" }
  );
});

test("UI API requests allow backend Docker smoke when session auth is not configured", () => {
  const config = createUiDeploymentConfig({
    UI_ENABLED: "true"
  });

  assert.deepEqual(
    authorizeUiApiRequest({ pathname: "/api/leads", headers: {} }, { config }),
    { allowed: true, reason: "session-unconfigured" }
  );
});

test("UI API requests fail closed when session auth is partially configured", () => {
  const config = createUiDeploymentConfig({
    UI_ENABLED: "true",
    UI_SESSION_SECRET: "too-short"
  });

  assert.deepEqual(
    authorizeUiApiRequest({ pathname: "/api/leads", headers: {} }, { config }),
    {
      allowed: false,
      status: 500,
      reason: "invalid-session-config"
    }
  );
});

test("UI deployment config normalizes base path and disabled UI behavior", () => {
  const enabled = createUiDeploymentConfig({
    UI_ENABLED: "true",
    UI_BASE_PATH: "ops",
    UI_SESSION_SECRET: "0123456789abcdef0123456789abcdef"
  });

  assert.equal(enabled.enabled, true);
  assert.equal(enabled.basePath, "/ops");
  assert.deepEqual(resolveUiMount("/ops/leads", enabled), {
    mounted: true,
    shellPath: "/leads",
    basePath: "/ops"
  });
  assert.deepEqual(resolveUiMount("/leads", enabled), {
    mounted: false,
    status: 404,
    reason: "outside-ui-base-path",
    basePath: "/ops"
  });

  const disabled = createUiDeploymentConfig({
    UI_ENABLED: "false",
    UI_SESSION_SECRET: "0123456789abcdef0123456789abcdef"
  });

  assert.equal(disabled.enabled, false);
  assert.deepEqual(resolveUiMount("/leads", disabled), {
    mounted: false,
    status: 404,
    reason: "ui-disabled",
    basePath: "/"
  });
});

test("deployment readiness requires session secret only when UI is enabled", () => {
  assert.throws(
    () => assertUiDeploymentReady(createUiDeploymentConfig({ UI_ENABLED: "true" })),
    /UI_SESSION_SECRET/
  );

  assert.doesNotThrow(() =>
    assertUiDeploymentReady(createUiDeploymentConfig({ UI_ENABLED: "false" }))
  );

  assert.throws(
    () => startProductionServer({ env: { UI_ENABLED: "true", UI_PORT: "0" } }),
    /UI_SESSION_SECRET/
  );
});

test("CORS allow-list is development-only for the operator UI", () => {
  const dev = createUiDeploymentConfig({
    NODE_ENV: "development",
    UI_SESSION_SECRET: "0123456789abcdef0123456789abcdef",
    CORS_ALLOWED_ORIGINS: "http://localhost:5173, http://127.0.0.1:5173"
  });

  assert.deepEqual(dev.cors, {
    mode: "development-only",
    allowedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"]
  });
  assert.doesNotThrow(() => assertUiDeploymentReady(dev));

  assert.throws(
    () =>
      assertUiDeploymentReady(
        createUiDeploymentConfig({
          NODE_ENV: "production",
          UI_SESSION_SECRET: "0123456789abcdef0123456789abcdef",
          CORS_ALLOWED_ORIGINS: "https://app.example.test"
        })
      ),
    /development-only CORS/
  );
});

test("production request handler gates /api proxying behind the UI session contract", async () => {
  const handler = createProductionRequestHandler({
    env: {
      UI_ENABLED: "true",
      UI_SESSION_SECRET: "0123456789abcdef0123456789abcdef",
      UI_API_PROXY_TARGET: "http://backend.example.test"
    },
    sessions: new Set(["valid-session"]),
    fetchImpl: async (url, init) => Response.json({
      path: new URL(url).pathname + new URL(url).search,
      cookie: init.headers.cookie ?? ""
    })
  });

  const missing = await dispatchProductionRequest(handler, { url: "/api/system" });
  assert.equal(missing.statusCode, 401);
  assert.equal(missing.headers["www-authenticate"], "GroupScoutSession");
  assert.equal(JSON.parse(missing.body).reason, "missing-session");

  const invalid = await dispatchProductionRequest(handler, {
    url: "/api/system",
    headers: { cookie: `${SESSION_COOKIE_NAME}=expired-session` }
  });
  assert.equal(invalid.statusCode, 401);
  assert.equal(JSON.parse(invalid.body).reason, "invalid-session");

  const valid = await dispatchProductionRequest(handler, {
    url: "/api/system?scope=smoke",
    headers: { cookie: `${SESSION_COOKIE_NAME}=valid-session` }
  });
  assert.equal(valid.statusCode, 200);
  assert.deepEqual(JSON.parse(valid.body), {
    path: "/api/system?scope=smoke",
    cookie: `${SESSION_COOKIE_NAME}=valid-session`
  });
});

test("production request handler forwards admin login and logout before session gating", async () => {
  const handler = createProductionRequestHandler({
    env: {
      UI_ENABLED: "true",
      UI_SESSION_SECRET: "0123456789abcdef0123456789abcdef",
      UI_API_PROXY_TARGET: "http://backend.example.test"
    },
    fetchImpl: async (url, init) =>
      Response.json(
        {
          path: new URL(url).pathname,
          method: init.method
        },
        {
          headers: {
            "set-cookie": `${SESSION_COOKIE_NAME}=backend-session-token; Path=/; HttpOnly`
          }
        }
      )
  });

  const login = await dispatchProductionRequest(handler, { url: "/api/auth/login", method: "POST" });
  const logout = await dispatchProductionRequest(handler, { url: "/api/auth/logout", method: "POST" });

  assert.equal(login.statusCode, 200);
  assert.equal(login.headers["set-cookie"], `${SESSION_COOKIE_NAME}=backend-session-token; Path=/; HttpOnly`);
  assert.deepEqual(JSON.parse(login.body), {
    path: "/api/auth/login",
    method: "POST"
  });
  assert.equal(logout.statusCode, 200);
  assert.deepEqual(JSON.parse(logout.body), {
    path: "/api/auth/logout",
    method: "POST"
  });
});

test("production request handler proxies backend Docker smoke without session auth configured", async () => {
  const handler = createProductionRequestHandler({
    env: {
      UI_ENABLED: "true",
      UI_API_PROXY_TARGET: "http://backend.example.test"
    },
    fetchImpl: async (url, init) => Response.json({
      path: new URL(url).pathname + new URL(url).search,
      cookie: init.headers.cookie ?? ""
    })
  });

  const smoke = await dispatchProductionRequest(handler, { url: "/api/leads?limit=1" });

  assert.equal(smoke.statusCode, 200);
  assert.deepEqual(JSON.parse(smoke.body), {
    path: "/api/leads?limit=1",
    cookie: ""
  });
});

test("production request handler applies browser security headers to health and static responses", async () => {
  const handler = createProductionRequestHandler({
    env: {
      UI_ENABLED: "true",
      UI_SESSION_SECRET: "0123456789abcdef0123456789abcdef"
    }
  });
  const health = await dispatchProductionRequest(handler, { url: "/healthz" });
  const app = await dispatchProductionRequest(handler, { url: "/" });

  for (const response of [health, app]) {
    assert.equal(response.headers["x-content-type-options"], "nosniff");
    assert.equal(response.headers["x-frame-options"], "DENY");
    assert.equal(response.headers["referrer-policy"], "same-origin");
    assert.match(response.headers["content-security-policy"], /default-src 'self'/);
    assert.match(response.headers["content-security-policy"], /frame-ancestors 'none'/);
  }
});

async function dispatchProductionRequest(handler, { url, method = "GET", headers = {} }) {
  const chunks = [];
  const response = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    }
  });
  response.statusCode = undefined;
  response.headers = undefined;
  response.writeHead = function writeHead(statusCode, responseHeaders) {
    this.statusCode = statusCode;
    this.headers = normalizeHeaderObject(responseHeaders);
  };
  const finished = new Promise((resolve, reject) => {
    response.once("finish", resolve);
    response.once("error", reject);
  });

  await handler({ url, method, headers }, response);

  if (!response.writableEnded) {
    await finished;
  }

  return {
    statusCode: response.statusCode,
    headers: response.headers,
    body: Buffer.concat(chunks).toString("utf8")
  };
}

function normalizeHeaderObject(headers = {}) {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value])
  );
}
