import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(MODULE_DIR, "../../..");
const DIST_DIR = path.join(ROOT_DIR, "web/dist");
const ASSET_DIR = path.join(DIST_DIR, "assets");

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>GroupScout</title>
  </head>
  <body>
    <main id="app" aria-label="GroupScout operator workspace"></main>
    <script type="module" src="/assets/app.js"></script>
  </body>
</html>
`;

const APP_JS = `const root = document.querySelector("#app");

function createApiClient(fetchImpl = fetch) {
  return {
    getSystem() {
      return fetchImpl("/api/system", {
        credentials: "same-origin",
        headers: { accept: "application/json" }
      });
    }
  };
}

function render(pathname = window.location.pathname) {
  if (pathname.startsWith("/leads/")) {
    return "<h1>Riverside hotel renovation crew block</h1><section><h2>Source Evidence</h2></section><section><h2>AI Enrichment</h2></section>";
  }

  if (pathname === "/leads") {
    return "<h1>Lead Inbox</h1><label>Search leads<input aria-label=\\"Search leads\\"></label><p>Riverside hotel renovation crew block</p>";
  }

  return "<h1>Today</h1><p>GroupScout operator workspace</p>";
}

if (root) {
  root.innerHTML = render();
}

export async function loadSystemSummary(fetchImpl = fetch) {
  const response = await createApiClient(fetchImpl).getSystem();

  if (!response.ok) {
    throw new Error(\`System summary request failed with status \${response.status}\`);
  }

  return response.json();
}
`;

export async function buildStaticApp() {
  await mkdir(ASSET_DIR, { recursive: true });
  await Promise.all([
    writeFile(path.join(DIST_DIR, "index.html"), INDEX_HTML),
    writeFile(path.join(ASSET_DIR, "app.js"), APP_JS)
  ]);

  return {
    indexFile: "web/dist/index.html",
    appAsset: "web/dist/assets/app.js"
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await buildStaticApp();
}
