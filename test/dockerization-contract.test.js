import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

const DOCKERFILE = new URL("../Dockerfile", import.meta.url);
const DOCKERIGNORE = new URL("../.dockerignore", import.meta.url);
const COMPOSE_DEV = new URL("../compose.dev.yml", import.meta.url);
const PACKAGE_JSON = new URL("../package.json", import.meta.url);
const RUNTIME_CONTRACT = new URL("../web/src/server/browserRuntimeContract.js", import.meta.url);
const DEV_COMPOSE_SERVER = new URL("../web/src/server/devComposeHealthServer.js", import.meta.url);
const PRODUCTION_SERVER = new URL("../web/src/server/productionServer.js", import.meta.url);
const STATIC_INDEX = new URL("../web/dist/index.html", import.meta.url);
const STATIC_APP = new URL("../web/dist/assets/app.js", import.meta.url);
const DOCS_ROOT = pathToFileURL(
  `${(process.env.GROUPSCOUT_UI_DOCS_ROOT || "/mnt/c/Users/alvin/groupscout-site/frontend").replace(/\/$/, "")}/`
);
const CONTRACT_DOC = new URL("docs/ui-dockerization-contract.md", DOCS_ROOT);
const PHASE_DOC = new URL("docs/phase-12-ui-dockerization.md", DOCS_ROOT);
const DEVELOPER_GUIDE = new URL("docs/developer-guide.md", DOCS_ROOT);
const TESTING_DOC = new URL("docs/testing.md", DOCS_ROOT);
const TROUBLESHOOTING_DOC = new URL("docs/troubleshooting.md", DOCS_ROOT);

test("D0 dockerization contract documents the chosen path before Docker files exist", async (t) => {
  const contract = await readDoc(t, CONTRACT_DOC);
  if (contract === null) return;

  assert.match(contract, /^# UI Dockerization Contract/m);
  assert.match(contract, /D0 status: documentation-only/i);
  assert.match(contract, /test image first, browser runtime later/i);
  assert.match(contract, /No Dockerfile, Compose file, reverse proxy, dev server, renderer, or application runtime is added in D0\./);
});

test("D0 dockerization contract records backend service names and internal URLs", async (t) => {
  const contract = await readDoc(t, CONTRACT_DOC);
  if (contract === null) return;

  assert.match(contract, /Backend service: `groupscout`/);
  assert.match(contract, /Backend internal URL: `http:\/\/groupscout:8080`/);
  assert.match(contract, /Alert service: `alertd`/);
  assert.match(contract, /Alert internal URL: `http:\/\/alertd:8081`/);
  assert.match(contract, /Shared backend network: `groupscout_net`/);
});

test("D0 dockerization contract preserves same-origin and browser credential boundaries", async (t) => {
  const contract = await readDoc(t, CONTRACT_DOC);
  if (contract === null) return;

  assert.match(contract, /Browser API calls stay same-origin through `\/api\/\*`/);
  assert.match(contract, /`API_TOKEN` remains reserved for automation clients/);
  assert.match(contract, /must not enter browser JavaScript, static assets, generated public config, or image-baked browser environment/);
  assert.match(contract, /session-cookie/i);
});

test("D0 dockerization docs expose the contract and red-green evidence", async (t) => {
  const [phaseDoc, developerGuide, testingDoc] = await Promise.all([
    readDoc(t, PHASE_DOC),
    readDoc(t, DEVELOPER_GUIDE),
    readDoc(t, TESTING_DOC)
  ]);
  if ([phaseDoc, developerGuide, testingDoc].includes(null)) return;

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
  assert.match(dockerfile, /^COPY compose\.dev\.yml \.\/$/m);
  assert.match(dockerfile, /^CMD \["npm", "test"\]$/m);
  assert.equal(packageJson.scripts.test, "node --test");
  assert.doesNotMatch(dockerfile, /\bnpm\s+(ci|install)\b/);
  assert.doesNotMatch(dockerfile, /\b(yarn|pnpm)\b/);
});

test("D1 Dockerfile does not introduce browser runtime, proxy, Compose, backend, or secret wiring", async () => {
  const dockerfile = await readFile(DOCKERFILE, "utf8");
  const testStage = extractDockerStage(dockerfile, "test");

  assert.doesNotMatch(testStage, /\b(EXPOSE|HEALTHCHECK)\b/);
  assert.doesNotMatch(testStage, /\b(vite|next|webpack|nginx|caddy|http-server|serve)\b/i);
  assert.doesNotMatch(testStage, /groupscout:8080|alertd:8081|groupscout_net/);
  assert.doesNotMatch(testStage, /API_TOKEN|UI_SESSION_SECRET|DATABASE_URL|SLACK|RESEND|OPENAI|ANTHROPIC|CLAUDE|OLLAMA/i);
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

test("D1 documentation records test-image commands and non-runtime scope", async (t) => {
  const [contract, phaseDoc, developerGuide, testingDoc] = await Promise.all([
    readDoc(t, CONTRACT_DOC),
    readDoc(t, PHASE_DOC),
    readDoc(t, DEVELOPER_GUIDE),
    readDoc(t, TESTING_DOC)
  ]);
  if ([contract, phaseDoc, developerGuide, testingDoc].includes(null)) return;

  assert.match(contract, /D1 status: UI test container/i);
  assert.match(contract, /docker build --target test -t groupscout-ui-test \./);
  assert.match(contract, /docker run --rm groupscout-ui-test/);
  assert.match(contract, /does not expose ports, declare healthchecks, start a dev server, run a proxy, or connect to backend services/i);
  assert.match(phaseDoc, /D1 Evidence/);
  assert.match(phaseDoc, /Docker build: `docker build --target test -t groupscout-ui-test \.`/);
  assert.match(developerGuide, /docker build --target test -t groupscout-ui-test \./);
  assert.match(testingDoc, /docker run --rm groupscout-ui-test/);
});

test("D2 browser runtime contract preserves the lightweight Node server shape", async () => {
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
  assert.equal(packageJson.scripts["start:ui"], "node web/src/server/productionServer.js");
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

test("D2 documentation records runtime contract, red-green evidence, and future scope", async (t) => {
  const [contract, phaseDoc, developerGuide, testingDoc] = await Promise.all([
    readDoc(t, CONTRACT_DOC),
    readDoc(t, PHASE_DOC),
    readDoc(t, DEVELOPER_GUIDE),
    readDoc(t, TESTING_DOC)
  ]);
  if ([contract, phaseDoc, developerGuide, testingDoc].includes(null)) return;

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

test("D3 Compose override wires the UI service to the backend network without secrets", async () => {
  const compose = await readFile(COMPOSE_DEV, "utf8");

  assert.match(compose, /^services:\n  groupscout-ui:/m);
  assert.match(compose, /context: \$\{GROUPSCOUT_UI_REPO:-\/mnt\/c\/Users\/alvin\/WebstormProjects\/groupscout-ui\}/);
  assert.match(compose, /dockerfile: Dockerfile/);
  assert.match(compose, /target: test/);
  assert.match(compose, /command: \["node", "web\/src\/server\/productDevServer\.js"\]/);
  assert.match(compose, /"\$\{GROUPSCOUT_UI_HOST_PORT:-3001\}:3000"/);
  assert.match(compose, /UI_API_PROXY_TARGET: "http:\/\/groupscout:8080"/);
  assert.match(compose, /UI_PUBLIC_API_PATH: "\/api\/\*"/);
  assert.match(compose, /UI_HEALTH_PATH: "\/healthz"/);
  assert.match(compose, /networks:\n      - groupscout_net/);
  assert.match(compose, /depends_on:\n      groupscout:\n        condition: service_started/);
  assert.match(compose, /healthcheck:\n      test: \["CMD-SHELL", "node -e \\"fetch\('http:\/\/127\.0\.0\.1:3000\/healthz'\)/);
  assert.doesNotMatch(compose, /API_TOKEN|DATABASE_URL|SLACK|RESEND|OPENAI|ANTHROPIC|CLAUDE|OLLAMA|UI_SESSION_SECRET/i);
});

test("D4 production Compose profile wires static UI runtime without secrets", async () => {
  const compose = await readFile(COMPOSE_DEV, "utf8");

  assert.match(compose, /^  groupscout-ui-production:/m);
  assert.match(compose, /profiles:\n      - smoke-ui-e2e/);
  assert.match(compose, /target: production/);
  assert.match(compose, /image: groupscout-ui-production/);
  assert.match(compose, /"\$\{GROUPSCOUT_UI_PRODUCTION_HOST_PORT:-3002\}:3000"/);
  assert.match(compose, /UI_API_PROXY_TARGET: "http:\/\/groupscout:8080"/);
  assert.match(compose, /UI_PUBLIC_API_PATH: "\/api\/\*"/);
  assert.match(compose, /networks:\n      - groupscout_net/);
  assert.match(compose, /depends_on:\n      groupscout:\n        condition: service_started/);
  assert.match(compose, /^  groupscout-ui-production-bad-proxy:/m);
  assert.match(compose, /"\$\{GROUPSCOUT_UI_BAD_PROXY_HOST_PORT:-3003\}:3000"/);
  assert.match(compose, /UI_API_PROXY_TARGET: "http:\/\/groupscout-bad-proxy-target:8080"/);
  assert.doesNotMatch(compose, /API_TOKEN|DATABASE_URL|POSTGRES_URL|SLACK|RESEND|SENDGRID|OPENAI|ANTHROPIC|CLAUDE|OLLAMA|UI_SESSION_SECRET/i);
});

test("D3 dev Compose health harness matches the D2 runtime contract", async () => {
  const {
    DEV_COMPOSE_CONTRACT,
    createDevComposeHealthPayload
  } = await import(DEV_COMPOSE_SERVER);

  assert.deepEqual(DEV_COMPOSE_CONTRACT, {
    phase: "D3",
    status: "development-compose",
    composeFile: "compose.dev.yml",
    serviceName: "groupscout-ui",
    backendServiceName: "groupscout",
    backendNetwork: "groupscout_net",
    backendTarget: "http://groupscout:8080",
    browserApiPath: "/api/*",
    healthPath: "/healthz",
    containerPort: 3000,
    hostPortEnv: "GROUPSCOUT_UI_HOST_PORT",
    defaultHostPort: 3001,
    smokeRequiresBackendServices: ["groupscout", "postgres", "ollama", "ollama-init"]
  });

  assert.deepEqual(
    createDevComposeHealthPayload({
      UI_API_PROXY_TARGET: "http://groupscout:8080",
      UI_PUBLIC_API_PATH: "/api/*"
    }),
    {
      status: "ok",
      phase: "D3",
      service: "groupscout-ui",
      healthPath: "/healthz",
      api: {
        browserPath: "/api/*",
        internalTarget: "http://groupscout:8080",
        sameOrigin: true
      }
    }
  );
  assert.doesNotThrow(() =>
    createDevComposeHealthPayload({
      API_TOKEN: "must-not-leak",
      UI_API_PROXY_TARGET: "http://groupscout:8080"
    })
  );
  assert.doesNotMatch(
    JSON.stringify(createDevComposeHealthPayload({ API_TOKEN: "must-not-leak" })),
    /must-not-leak|API_TOKEN/
  );
});

test("D3 documentation records Compose commands, constraints, and evidence", async (t) => {
  const [contract, phaseDoc, developerGuide, testingDoc, troubleshootingDoc] = await Promise.all([
    readDoc(t, CONTRACT_DOC),
    readDoc(t, PHASE_DOC),
    readDoc(t, DEVELOPER_GUIDE),
    readDoc(t, TESTING_DOC),
    readDoc(t, TROUBLESHOOTING_DOC)
  ]);
  if ([contract, phaseDoc, developerGuide, testingDoc, troubleshootingDoc].includes(null)) return;

  assert.match(contract, /D3 status: development Compose integration/i);
  assert.match(contract, /Compose override: `compose\.dev\.yml`/);
  assert.match(contract, /UI service: `groupscout-ui`/);
  assert.match(contract, /Host port: `\$\{GROUPSCOUT_UI_HOST_PORT:-3001\}` maps to container port `3000`/);
  assert.match(contract, /D3 still does not add production same-origin proxying, static asset serving, or a product UI renderer/);
  assert.match(phaseDoc, /#### D3 Evidence/);
  assert.match(phaseDoc, /Docker Compose config: `docker compose -f \/mnt\/c\/Users\/alvin\/GolandProjects\/groupscout\/docker-compose\.yml -f compose\.dev\.yml config --quiet`/);
  assert.match(developerGuide, /Docker Runtime Matrix/);
  assert.match(developerGuide, /Development Compose and D4 production smoke details live/);
  assert.match(testingDoc, /Phase 12 D3 run on 2026-05-09/);
  assert.match(troubleshootingDoc, /## UI Development Compose Fails/);
});

test("D4 production server serves assets and forwards /api/* through one origin", async () => {
  const {
    PRODUCTION_SERVING_CONTRACT,
    createApiProxyRequest,
    createProductionHealthPayload
  } = await import(PRODUCTION_SERVER);

  assert.deepEqual(PRODUCTION_SERVING_CONTRACT, {
    phase: "D4",
    status: "production-same-origin-serving",
    servingModel: "node-static-assets-and-api-proxy",
    serviceName: "groupscout-ui",
    containerPort: 3000,
    healthPath: "/healthz",
    publicRoot: "web/dist",
    indexFile: "index.html",
    staticAssetPath: "/assets/app.js",
    browserApiPath: "/api/*",
    backendTarget: "http://groupscout:8080"
  });

  const [indexHtml, appJs] = await Promise.all([
    readFile(STATIC_INDEX, "utf8"),
    readFile(STATIC_APP, "utf8")
  ]);
  const proxyRequest = createApiProxyRequest({
    requestUrl: "/api/system?scope=smoke",
    method: "GET",
    headers: {
      authorization: "Bearer must-not-forward",
      cookie: "groupscout_session=session-value",
      host: "localhost:3000",
      "x-api-key": "must-not-forward",
      "x-api-token": "must-not-forward"
    },
    targetBaseUrl: "http://groupscout:8080"
  });

  assert.deepEqual(createProductionHealthPayload({ UI_PUBLIC_API_PATH: "/api/*" }), {
    status: "ok",
    phase: "D4",
    service: "groupscout-ui",
    api: {
      browserPath: "/api/*",
      sameOrigin: true
    }
  });
  assert.match(indexHtml, /<script type="module" src="\/assets\/app\.js"><\/script>/);
  assert.match(appJs, /fetchImpl\("\/api\/system"/);
  assert.equal(proxyRequest.url.href, "http://groupscout:8080/api/system?scope=smoke");
  assert.equal(proxyRequest.method, "GET");
  assert.equal(proxyRequest.headers.cookie, "groupscout_session=session-value");
  assert.equal(proxyRequest.headers.authorization, undefined);
  assert.equal(proxyRequest.headers["x-api-key"], undefined);
  assert.equal(proxyRequest.headers["x-api-token"], undefined);
  assert.equal(proxyRequest.headers.host, undefined);
});

test("D4 public config and static assets reject browser-visible secrets", async () => {
  const {
    assertProductionPublicConfigSafe,
    createPublicRuntimeConfig
  } = await import(PRODUCTION_SERVER);
  const [indexHtml, appJs] = await Promise.all([
    readFile(STATIC_INDEX, "utf8"),
    readFile(STATIC_APP, "utf8")
  ]);
  const forbiddenPublicNames = [
    "API_TOKEN",
    "CLAUDE_API_KEY",
    "SLACK_BOT_TOKEN",
    "SLACK_WEBHOOK_URL",
    "RESEND_API_KEY",
    "SENDGRID_API_KEY",
    "DATABASE_URL",
    "POSTGRES_URL",
    "TEST_POSTGRES_URL",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "OLLAMA_BASE_URL",
    "UI_SESSION_SECRET"
  ];

  assert.deepEqual(createPublicRuntimeConfig({ UI_PUBLIC_API_PATH: "/api/*" }), {
    apiPath: "/api/*"
  });
  assert.doesNotThrow(() => assertProductionPublicConfigSafe({ apiPath: "/api/*" }));

  for (const name of forbiddenPublicNames) {
    assert.throws(
      () => assertProductionPublicConfigSafe({ publicEnv: { [name]: "secret" } }),
      new RegExp(name)
    );
    assert.doesNotMatch(indexHtml, new RegExp(name));
    assert.doesNotMatch(appJs, new RegExp(name));
  }

  assert.throws(
    () => createPublicRuntimeConfig({ UI_PUBLIC_API_PATH: "http://groupscout:8080/api" }),
    /same-origin/
  );
});

test("D4 Dockerfile adds a production target without baking production secrets", async () => {
  const [dockerfile, packageJsonSource] = await Promise.all([
    readFile(DOCKERFILE, "utf8"),
    readFile(PACKAGE_JSON, "utf8")
  ]);
  const packageJson = JSON.parse(packageJsonSource);
  const productionStage = extractDockerStage(dockerfile, "production");

  assert.equal(packageJson.scripts["start:ui"], "node web/src/server/productionServer.js");
  assert.match(productionStage, /^FROM test AS production/m);
  assert.match(productionStage, /^ENV NODE_ENV=production/m);
  assert.match(productionStage, /^EXPOSE 3000/m);
  assert.match(productionStage, /^HEALTHCHECK /m);
  assert.match(productionStage, /^CMD \["npm", "run", "start:ui"\]$/m);
  assert.doesNotMatch(productionStage, /API_TOKEN|DATABASE_URL|POSTGRES_URL|SLACK|RESEND|SENDGRID|OPENAI|ANTHROPIC|CLAUDE|OLLAMA|UI_SESSION_SECRET/i);
});

test("D4 documentation records production same-origin commands, smoke checks, and evidence", async (t) => {
  const [contract, phaseDoc, developerGuide, testingDoc, troubleshootingDoc] = await Promise.all([
    readDoc(t, CONTRACT_DOC),
    readDoc(t, PHASE_DOC),
    readDoc(t, DEVELOPER_GUIDE),
    readDoc(t, TESTING_DOC),
    readDoc(t, TROUBLESHOOTING_DOC)
  ]);
  if ([contract, phaseDoc, developerGuide, testingDoc, troubleshootingDoc].includes(null)) return;

  assert.match(contract, /D4 status: production same-origin serving/i);
  assert.match(contract, /Serving model: `node-static-assets-and-api-proxy`/);
  assert.match(contract, /Production Docker target: `production`/);
  assert.match(contract, /docker build --target production -t groupscout-ui-production \./);
  assert.match(phaseDoc, /#### D4 Evidence/);
  assert.match(phaseDoc, /Smoke health: `GET \/healthz`/);
  assert.match(phaseDoc, /Smoke root: `GET \/`/);
  assert.match(phaseDoc, /Smoke static asset: `GET \/assets\/app\.js`/);
  assert.match(phaseDoc, /Smoke API proxy: `GET \/api\/leads\?limit=1`, `GET \/api\/system`, and `GET \/api\/alerts\?limit=1`/);
  assert.match(developerGuide, /Production same-origin server:/);
  assert.match(developerGuide, /npm run start:ui/);
  assert.match(testingDoc, /Phase 12 D4 run on 2026-05-09/);
  assert.match(troubleshootingDoc, /## Production UI Runtime Fails/);
});

test("D5 operations docs record repeatable Docker commands, dependencies, CI notes, and troubleshooting", async (t) => {
  const [contract, phaseDoc, developerGuide, testingDoc, troubleshootingDoc] = await Promise.all([
    readDoc(t, CONTRACT_DOC),
    readDoc(t, PHASE_DOC),
    readDoc(t, DEVELOPER_GUIDE),
    readDoc(t, TESTING_DOC),
    readDoc(t, TROUBLESHOOTING_DOC)
  ]);
  if ([contract, phaseDoc, developerGuide, testingDoc, troubleshootingDoc].includes(null)) return;

  assert.match(contract, /D5 status: Docker operations docs and CI hooks/i);
  assert.match(contract, /Local test command: `npm test`/);
  assert.match(contract, /Containerized test command: `docker run --rm groupscout-ui-test`/);
  assert.match(contract, /Development Compose startup:/);
  assert.match(contract, /Development Compose teardown:/);
  assert.match(contract, /CI order: local Node tests, Docker test-image build\/run, production image build, then optional smoke checks/);
  assert.match(contract, /CI must not inject `API_TOKEN`, provider keys, Slack tokens, Resend\/SendGrid keys, database URLs, `OLLAMA_BASE_URL`, or `UI_SESSION_SECRET` into browser-visible config or static assets/);
  assert.match(phaseDoc, /#### D5 Evidence/);
  assert.match(phaseDoc, /Docker Compose startup: `docker compose -f \/mnt\/c\/Users\/alvin\/GolandProjects\/groupscout\/docker-compose\.yml -f compose\.dev\.yml up --build groupscout-ui groupscout`/);
  assert.match(developerGuide, /## Docker Operations/);
  assert.match(developerGuide, /Docker Runtime Matrix/);
  assert.match(developerGuide, /CI hook order:/);
  assert.match(testingDoc, /Phase 12 D5 run on 2026-05-09/);
  assert.match(testingDoc, /Docker operations docs check:/);
  assert.match(troubleshootingDoc, /## Docker Operations Fail Before Startup/);
  assert.match(troubleshootingDoc, /## Docker Port Conflicts/);
  assert.match(troubleshootingDoc, /## UI Proxy Smoke Fails/);
});

function extractDockerStage(dockerfile, stageName) {
  const stagePattern = new RegExp(`^FROM .+ AS ${stageName}\\n[\\s\\S]*?(?=^FROM .+ AS |(?![\\s\\S]))`, "m");
  const match = dockerfile.match(stagePattern);

  assert.ok(match, `Expected Dockerfile stage ${stageName}`);

  return match[0];
}

async function readDoc(t, url) {
  try {
    return await readFile(url, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      t.skip(`centralized UI docs are not mounted at ${DOCS_ROOT.pathname}`);
      return null;
    }

    throw error;
  }
}
