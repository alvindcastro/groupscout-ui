import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CYBER_STYLE_CSS } from "./cyberStyles.js";

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
    <link rel="stylesheet" href="/assets/app.css">
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
    return [
      '<div class="app-shell cyber-shell" data-renderer="static-dom">',
      '<nav class="cyber-nav" aria-label="Primary"><div class="cyber-brand">GroupScout<small>operator console</small></div><div class="cyber-nav-links"><a href="/">Today</a><a href="/leads" aria-current="page">Leads</a></div></nav>',
      '<section class="cyber-main cyber-detail" data-layout="desktop-evidence-workspace">',
      '<header class="cyber-hero"><div class="cyber-kicker cyber-cursor">Evidence workspace</div><h1 class="cyber-title cyber-glitch" data-text="Riverside hotel renovation crew block">Riverside hotel renovation crew block</h1><p class="cyber-subtitle">Keep source evidence and AI enrichment visible together.</p></header>',
      '<section class="cyber-terminal"><h2 class="cyber-label">Source Evidence</h2></section>',
      '<section class="cyber-panel"><h2 class="cyber-label">AI Enrichment</h2></section>',
      '</section>',
      '</div>'
    ].join("");
  }

  if (pathname === "/leads") {
    return [
      '<div class="app-shell cyber-shell" data-renderer="static-dom">',
      '<nav class="cyber-nav" aria-label="Primary"><div class="cyber-brand">GroupScout<small>operator console</small></div><div class="cyber-nav-links"><a href="/">Today</a><a href="/leads" aria-current="page">Leads</a></div></nav>',
      '<section class="cyber-main cyber-screen" data-layout="desktop-table">',
      '<header class="cyber-hero"><div class="cyber-kicker cyber-cursor">Lead acquisition</div><h1 class="cyber-title cyber-glitch" data-text="Lead Inbox">Lead Inbox</h1><p class="cyber-subtitle">Filter high-intent crew lodging demand.</p></header>',
      '<form class="cyber-controls" aria-label="Lead filters"><label class="cyber-field">Search leads<span class="cyber-field-inner"><input class="cyber-input" type="search" aria-label="Search leads" name="q"></span></label></form>',
      '<div class="cyber-table-wrap"><table class="cyber-table"><caption>Lead Inbox leads</caption><tbody><tr><td><a href="/leads/lead_hotel_001">Riverside hotel renovation crew block</a></td></tr></tbody></table></div>',
      '</section>',
      '</div>'
    ].join("");
  }

  return [
    '<div class="app-shell cyber-shell" data-renderer="static-dom">',
    '<nav class="cyber-nav" aria-label="Primary"><div class="cyber-brand">GroupScout<small>operator console</small></div><div class="cyber-nav-links"><a href="/" aria-current="page">Today</a><a href="/leads">Leads</a></div></nav>',
    '<section class="cyber-main cyber-screen" data-layout="desktop-command-center">',
    '<header class="cyber-hero"><div class="cyber-kicker cyber-cursor">Command feed</div><h1 class="cyber-title cyber-glitch" data-text="Today">Today</h1><p class="cyber-subtitle">GroupScout operator workspace</p></header>',
    '<section class="cyber-terminal"><p class="cyber-cursor">High-score leads and operational risk signals online.</p></section>',
    '</section>',
    '</div>'
  ].join("");
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
    writeFile(path.join(ASSET_DIR, "app.css"), CYBER_STYLE_CSS),
    writeFile(path.join(ASSET_DIR, "app.js"), APP_JS)
  ]);

  return {
    indexFile: "web/dist/index.html",
    appAsset: "web/dist/assets/app.js",
    styleAsset: "web/dist/assets/app.css"
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await buildStaticApp();
}
