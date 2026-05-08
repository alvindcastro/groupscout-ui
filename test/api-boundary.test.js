import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { API_BASE_PATH, createApiClient } from "../web/src/api/client.js";

test("browser API access is isolated behind a same-origin /api client boundary", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" }
      });
    }
  });

  const response = await client.request("/api/system");

  assert.equal(API_BASE_PATH, "/api");
  assert.deepEqual(response, { ok: true });
  assert.equal(calls[0].url, "/api/system");
  assert.equal(calls[0].init.credentials, "same-origin");
});

test("client rejects non-/api browser endpoints before fetch", async () => {
  const client = createApiClient({
    fetchImpl: async () => {
      throw new Error("fetch should not be called");
    }
  });

  await assert.rejects(() => client.request("/run"), /\/api/);
  await assert.rejects(() => client.request("https://example.com/api/system"), /same-origin/);
});

test("browser-facing source files do not reference API_TOKEN", async () => {
  const files = [
    "../web/src/api/client.js",
    "../web/src/app/leadDetail.js",
    "../web/src/app/pipelineMonitor.js",
    "../web/src/app/shell.js",
    "../web/src/design/tokens.js"
  ];

  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /API_TOKEN/);
  }
});
