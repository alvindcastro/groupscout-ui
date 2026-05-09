import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { test } from "node:test";

import * as apiClientModule from "../web/src/api/client.js";

const { API_BASE_PATH, createApiClient } = apiClientModule;

test("API client module keeps the public entry point and constants stable for adapter splits", () => {
  assert.deepEqual(Object.keys(apiClientModule).sort(), [
    "API_BASE_PATH",
    "DEFAULT_LEAD_INBOX_SORT",
    "LEAD_INBOX_ITEM_FIELDS",
    "createApiClient"
  ]);

  const client = createApiClient({
    fetchImpl: async () => Response.json({ ok: true })
  });

  assert.deepEqual(
    Object.keys(client).sort(),
    [
      "getLeadRawAudit",
      "getLead",
      "getAuthStatus",
      "getCurrentAdmin",
      "getStats",
      "getSystem",
      "listAlerts",
      "listLeadOutreach",
      "listLeads",
      "listPipelineRuns",
      "logLeadOutreach",
      "loginWithSetupToken",
      "patchLead",
      "request",
      "startPipelineRun"
    ].sort()
  );
});

test("API client split keeps feature adapters focused behind the facade", async () => {
  const apiDir = new URL("../web/src/api/", import.meta.url);
  const entries = await readdir(apiDir);

  assert.deepEqual(
    entries.filter((entry) => entry.endsWith(".js")).sort(),
    [
      "alerts.js",
      "auth.js",
      "client.js",
      "leads.js",
      "outreach.js",
      "pipeline.js",
      "rawAudit.js",
      "shared.js",
      "stats.js",
      "system.js",
      "transport.js"
    ]
  );

  const transportSource = await readFile(new URL("../web/src/api/transport.js", import.meta.url), "utf8");
  assert.match(transportSource, /function assertSameOriginApiPath/);
  assert.match(transportSource, /credentials: "same-origin"/);

  const clientSource = await readFile(new URL("../web/src/api/client.js", import.meta.url), "utf8");
  assert.doesNotMatch(clientSource, /function assertSameOriginApiPath/);
  assert.doesNotMatch(clientSource, /function adaptLeadInboxResponse/);
});

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

test("API request transport applies JSON defaults and preserves same-origin session credentials", async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return new Response("accepted", {
        headers: { "content-type": "text/plain" }
      });
    }
  });

  const response = await client.request("/api/system", {
    credentials: "include",
    headers: {
      "x-request-id": "req_123"
    }
  });

  assert.equal(response, undefined);
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.equal(calls[0].init.headers.accept, "application/json");
  assert.equal(calls[0].init.headers["x-request-id"], "req_123");

  const errorClient = createApiClient({
    fetchImpl: async () => Response.json({ error: "unavailable" }, { status: 503 })
  });

  await assert.rejects(() => errorClient.request("/api/system"), /Request failed with status 503/);
});

test("client rejects non-/api browser endpoints before fetch", async () => {
  let fetchCalls = 0;
  const client = createApiClient({
    fetchImpl: async () => {
      fetchCalls += 1;
      throw new Error("fetch should not be called");
    }
  });

  await assert.rejects(() => client.request("/run"), /\/api/);
  await assert.rejects(() => client.request("https://example.com/api/system"), /same-origin/);
  await assert.rejects(() => client.request("HTTP://example.com/api/system"), /same-origin/);
  await assert.rejects(() => client.request("//example.com/api/system"), /\/api/);
  await assert.rejects(() => client.request(""), /non-empty string/);
  await assert.rejects(() => client.request(null), /non-empty string/);
  await assert.rejects(() => client.request("/api"), /\/api/);
  await assert.rejects(() => client.request("api/system"), /\/api/);
  await assert.rejects(() => client.request("/apiary/system"), /\/api/);
  assert.equal(fetchCalls, 0);
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
