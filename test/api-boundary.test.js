import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
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
  const files = await listBrowserSourceFiles(new URL("../web/src/", import.meta.url));

  for (const file of files) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /API_TOKEN/);
  }
});

test("browser API client does not inject automation credentials into session requests", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" }
      });
    }
  });

  await client.request("/api/leads");

  assert.equal(calls[0].init.credentials, "same-origin");
  assert.equal(calls[0].init.headers.authorization, undefined);
  assert.equal(calls[0].init.headers["x-api-key"], undefined);
  assert.equal(calls[0].init.headers["x-api-token"], undefined);
});

async function listBrowserSourceFiles(rootUrl) {
  const entries = await readdir(rootUrl, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, rootUrl);

    if (entry.isDirectory()) {
      if (entry.name === "server") {
        continue;
      }

      files.push(...(await listBrowserSourceFiles(entryUrl)));
      continue;
    }

    if (entry.name.endsWith(".js")) {
      files.push(entryUrl);
    }
  }

  return files;
}
