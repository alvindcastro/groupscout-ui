import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SESSION_COOKIE_NAME,
  assertUiDeploymentReady,
  authorizeUiApiRequest,
  createUiDeploymentConfig,
  resolveUiMount
} from "../web/src/server/uiDeployment.js";
import { createProductionApiAuthorizationPlan } from "../web/src/server/productionServer.js";

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

test("production API proxy applies UI session authorization before upstream forwarding", () => {
  const env = {
    UI_ENABLED: "true",
    UI_SESSION_SECRET: "0123456789abcdef0123456789abcdef"
  };
  const sessions = new Set(["session_123"]);

  assert.deepEqual(
    createProductionApiAuthorizationPlan({
      pathname: "/api/leads",
      headers: { cookie: `${SESSION_COOKIE_NAME}=session_123` },
      env,
      sessions
    }),
    { allowed: true, reason: "session-valid" }
  );

  assert.deepEqual(
    createProductionApiAuthorizationPlan({
      pathname: "/api/leads",
      headers: {},
      env,
      sessions
    }),
    {
      allowed: false,
      status: 401,
      reason: "missing-session",
      headers: { "www-authenticate": "GroupScoutSession" }
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
