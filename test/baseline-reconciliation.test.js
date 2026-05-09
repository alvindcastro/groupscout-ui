import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const browserSecretNames = [
  "API_TOKEN",
  "OLLAMA_ENDPOINT",
  "DATABASE_URL",
  "UI_SESSION_SECRET",
  "SLACK_TOKEN",
  "RESEND_API_KEY",
];

test("Phase 0 baseline exposes package scripts, renderer runtime, route shell, and secret guardrails", () => {
  assert.ok(existsSync("package.json"), "package.json should exist");
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts?.test, "node --test");
  assert.equal(pkg.scripts?.build, "node web/src/renderer/buildStaticApp.js");
  assert.equal(pkg.scripts?.["start:ui"], "node web/src/server/productionServer.js");

  assert.ok(existsSync("web/src/app/shell.js"), "route shell should exist");
  assert.ok(existsSync("web/src/renderer/domRenderer.js"), "DOM renderer should exist");
  assert.ok(existsSync("web/src/server/productRendererRuntime.js"), "product runtime should exist");
  assert.ok(existsSync("web/src/api/client.js"), "API client boundary should exist");

  const shellSource = readFileSync("web/src/app/shell.js", "utf8");
  for (const label of ["Today", "Leads", "Verification", "Outreach", "Pipeline", "Analytics", "Alerts", "Settings"]) {
    assert.match(shellSource, new RegExp(`\\b${label}\\b`));
  }

  const browserSources = [
    "web/src/api/client.js",
    "web/src/app/shell.js",
    "web/src/renderer/domRenderer.js",
    "web/dist/assets/app.js",
  ];
  for (const sourcePath of browserSources) {
    assert.ok(existsSync(sourcePath), `${sourcePath} should exist`);
    const source = readFileSync(sourcePath, "utf8");
    for (const secretName of browserSecretNames) {
      assert.ok(!source.includes(secretName), `${sourcePath} should not expose ${secretName}`);
    }
  }
});
