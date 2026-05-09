import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const DOCKERFILE = new URL("../Dockerfile", import.meta.url);
const DOCKERIGNORE = new URL("../.dockerignore", import.meta.url);
const PACKAGE_JSON = new URL("../package.json", import.meta.url);
const RUNTIME_CONTRACT = new URL("../web/src/server/browserRuntimeContract.js", import.meta.url);
const CONTRACT_DOC = new URL("../docs/ui-dockerization-contract.md", import.meta.url);
const PHASE_DOC = new URL("../docs/phase-12-ui-dockerization.md", import.meta.url);
const DEVELOPER_GUIDE = new URL("../docs/developer-guide.md", import.meta.url);
const TESTING_DOC = new URL("../docs/testing.md", import.meta.url);

test("D0 dockerization contract documents the chosen path before Docker files exist", async () => {
  const contract = await readFile(CONTRACT_DOC, "utf8");

  assert.match(contract, /^# UI Dockerization Contract/m);
  assert.match(contract, /D0 status: documentation-only/i);
  assert.match(contract, /test image first, browser runtime later/i);
  assert.match(contract, /No Dockerfile, Compose file, reverse proxy, dev server, renderer, or application runtime is added in D0\./);
});

test("D0 dockerization contract records backend service names and internal URLs", async () => {
  const contract = await readFile(CONTRACT_DOC, "utf8");

  assert.match(contract, /Backend service: `groupscout`/);
  assert.match(contract, /Backend internal URL: `http:\/\/groupscout:8080`/);
  assert.match(contract, /Alert service: `alertd`/);
  assert.match(contract, /Alert internal URL: `http:\/\/alertd:8081`/);
  assert.match(contract, /Shared backend network: `groupscout_net`/);
});

test("D0 dockerization contract preserves same-origin and browser credential boundaries", async () => {
  const contract = await readFile(CONTRACT_DOC, "utf8");

  assert.match(contract, /Browser API calls stay same-origin through `\/api\/\*`/);
  assert.match(contract, /`API_TOKEN` remains reserved for automation clients/);
  assert.match(contract, /must not enter browser JavaScript, static assets, generated public config, or image-baked browser environment/);
  assert.match(contract, /session-cookie/i);
});

test("D0 dockerization docs expose the contract and red-green evidence", async () => {
  const [phaseDoc, developerGuide, testingDoc] = await Promise.all([
    readFile(PHASE_DOC, "utf8"),
    readFile(DEVELOPER_GUIDE, "utf8"),
    readFile(TESTING_DOC, "utf8")
  ]);

  assert.match(phaseDoc, /\[UI Dockerization Contract\]\(\.\/ui-dockerization-contract\.md\)/);
  assert.match(phaseDoc, /Red run: `node --test test\/dockerization-contract\.test\.js`/);
  assert.match(phaseDoc, /Green run: `node --test test\/dockerization-contract\.test\.js`/);
  assert.match(developerGuide, /\[UI Dockerization Contract\]\(\.\/ui-dockerization-contract\.md\)/);
  assert.match(testingDoc, /node --test test\/dockerization-contract\.test\.js/);
});

test("D1 Dockerfile defines only a Node test target for npm test", async () => {
  const [dockerfile, packageJsonSource] = await Promise.all([
    readFile(DOCKERFILE, "utf8"),
    readFile(PACKAGE_JSON, "utf8")
  ]);
  const packageJson = JSON.parse(packageJsonSource);

  assert.match(dockerfile, /^FROM node:[^\s]+ AS test/m);
  assert.match(dockerfile, /^WORKDIR \/workspace/m);
  assert.match(dockerfile, /^ENV NODE_ENV=test/m);
  assert.match(dockerfile, /^COPY package\.json \.\/$/m);
  assert.match(dockerfile, /^COPY web \.\/web$/m);
  assert.match(dockerfile, /^COPY test \.\/test$/m);
  assert.match(dockerfile, /^CMD \["npm", "test"\]$/m);
  assert.equal(packageJson.scripts.test, "node --test");
  assert.doesNotMatch(dockerfile, /\bnpm\s+(ci|install)\b/);
  assert.doesNotMatch(dockerfile, /\b(yarn|pnpm)\b/);
});

test("D1 Dockerfile does not introduce browser runtime, proxy, Compose, backend, or secret wiring", async () => {
  const dockerfile = await readFile(DOCKERFILE, "utf8");

  assert.doesNotMatch(dockerfile, /\b(EXPOSE|HEALTHCHECK)\b/);
  assert.doesNotMatch(dockerfile, /\b(vite|next|webpack|nginx|caddy|http-server|serve)\b/i);
  assert.doesNotMatch(dockerfile, /groupscout:8080|alertd:8081|groupscout_net/);
  assert.doesNotMatch(dockerfile, /API_TOKEN|UI_SESSION_SECRET|DATABASE_URL|SLACK|RESEND|OPENAI|ANTHROPIC|OLLAMA/i);
});

test("D1 .dockerignore excludes local, dependency, VCS, log, and generated artifacts", async () => {
  const dockerignore = await readFile(DOCKERIGNORE, "utf8");
  const requiredPatterns = [
    ".git",
    "node_modules",
    "*.log",
    "npm-debug.log*",
    ".idea",
    ".vscode",
    "coverage",
    "dist",
    "build",
    ".env",
    ".env.*"
  ];

  for (const pattern of requiredPatterns) {
    assert.match(dockerignore, new RegExp(`^${pattern.replaceAll(".", "\\.").replaceAll("*", ".*")}$`, "m"));
  }
});

test("D1 documentation records test-image commands and non-runtime scope", async () => {
  const [contract, phaseDoc, developerGuide, testingDoc] = await Promise.all([
    readFile(CONTRACT_DOC, "utf8"),
    readFile(PHASE_DOC, "utf8"),
    readFile(DEVELOPER_GUIDE, "utf8"),
    readFile(TESTING_DOC, "utf8")
  ]);

  assert.match(contract, /D1 status: UI test container/i);
  assert.match(contract, /docker build --target test -t groupscout-ui-test \./);
  assert.match(contract, /docker run --rm groupscout-ui-test/);
  assert.match(contract, /does not expose ports, declare healthchecks, start a dev server, run a proxy, or connect to backend services/i);
  assert.match(phaseDoc, /D1 Evidence/);
  assert.match(phaseDoc, /Docker build: `docker build --target test -t groupscout-ui-test \.`/);
  assert.match(developerGuide, /docker build --target test -t groupscout-ui-test \./);
  assert.match(testingDoc, /docker run --rm groupscout-ui-test/);
});

test("D2 browser runtime contract selects a lightweight Node server without adding runtime code", async () => {
  const [{ BROWSER_RUNTIME_CONTRACT }, packageJsonSource] = await Promise.all([
    import(RUNTIME_CONTRACT),
    readFile(PACKAGE_JSON, "utf8")
  ]);
  const packageJson = JSON.parse(packageJsonSource);

  assert.equal(BROWSER_RUNTIME_CONTRACT.phase, "D2");
  assert.equal(BROWSER_RUNTIME_CONTRACT.status, "contract-only");
  assert.equal(BROWSER_RUNTIME_CONTRACT.runtime, "lightweight-node-server");
  assert.equal(BROWSER_RUNTIME_CONTRACT.framework, "not-selected");
  assert.equal(BROWSER_RUNTIME_CONTRACT.startCommand, "npm run start:ui");
  assert.equal(BROWSER_RUNTIME_CONTRACT.containerPort, 3000);
  assert.equal(BROWSER_RUNTIME_CONTRACT.healthPath, "/healthz");
  assert.deepEqual(BROWSER_RUNTIME_CONTRACT.staticAssets, {
    mode: "server-owned-generated-assets",
    publicRoot: "web/dist",
    generatedPublicConfig: false
  });
  assert.equal(packageJson.scripts.start, undefined);
  assert.equal(packageJson.scripts.dev, undefined);
  assert.equal(packageJson.scripts["start:ui"], undefined);
});

test("D2 browser runtime contract keeps /api routing same-origin and token-free", async () => {
  const {
    BROWSER_RUNTIME_CONTRACT,
    assertBrowserRuntimeContract,
    assertBrowserRuntimePublicConfigSafe
  } = await import(RUNTIME_CONTRACT);

  assert.doesNotThrow(() => assertBrowserRuntimeContract(BROWSER_RUNTIME_CONTRACT));
  assert.deepEqual(BROWSER_RUNTIME_CONTRACT.apiRouting, {
    browserPath: "/api/*",
    internalTarget: "http://groupscout:8080",
    sameOrigin: true,
    credentials: "same-origin",
    sessionCookieName: "groupscout_session",
    exposeAutomationToken: false
  });
  assert.deepEqual(BROWSER_RUNTIME_CONTRACT.forbiddenBrowserEnv, [
    "API_TOKEN",
    "DATABASE_URL",
    "SLACK_BOT_TOKEN",
    "RESEND_API_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "OLLAMA_BASE_URL",
    "UI_SESSION_SECRET"
  ]);
  assert.doesNotThrow(() =>
    assertBrowserRuntimePublicConfigSafe({
      publicBasePath: "/",
      features: { commandCenter: true }
    })
  );
  assert.throws(
    () => assertBrowserRuntimePublicConfigSafe({ API_TOKEN: "automation-token" }),
    /API_TOKEN/
  );
  assert.throws(
    () => assertBrowserRuntimePublicConfigSafe({ env: { uiSessionSecret: "secret" } }),
    /UI_SESSION_SECRET/
  );
  assert.throws(
    () => assertBrowserRuntimePublicConfigSafe({ publicEnv: ["API_TOKEN"] }),
    /API_TOKEN/
  );
});

test("D2 documentation records runtime contract, red-green evidence, and future scope", async () => {
  const [contract, phaseDoc, developerGuide, testingDoc] = await Promise.all([
    readFile(CONTRACT_DOC, "utf8"),
    readFile(PHASE_DOC, "utf8"),
    readFile(DEVELOPER_GUIDE, "utf8"),
    readFile(TESTING_DOC, "utf8")
  ]);

  assert.match(contract, /D2 status: browser runtime contract/i);
  assert.match(contract, /Runtime model: `lightweight-node-server`/);
  assert.match(contract, /Reserved start command: `npm run start:ui`/);
  assert.match(contract, /UI container port: `3000`/);
  assert.match(contract, /Health path: `\/healthz`/);
  assert.match(contract, /API proxy target: `http:\/\/groupscout:8080`/);
  assert.match(contract, /No framework, dev server, renderer, Compose service, or runnable UI server is added in D2\./);
  assert.match(phaseDoc, /D2 Evidence/);
  assert.match(phaseDoc, /Green run: `node --test test\/dockerization-contract\.test\.js`/);
  assert.match(developerGuide, /Runtime model: `lightweight-node-server`/);
  assert.match(testingDoc, /Phase 12 D2 run on 2026-05-09/);
});
