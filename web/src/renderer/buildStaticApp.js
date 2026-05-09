import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(MODULE_DIR, "../../..");
const DIST_DIR = path.join(ROOT_DIR, "web/dist");
const ASSET_DIR = path.join(DIST_DIR, "assets");
const SRC_DIR = path.join(ROOT_DIR, "web/src");
const DIST_SRC_DIR = path.join(DIST_DIR, "src");
const STATIC_STYLE_SOURCE = path.join(MODULE_DIR, "staticStyles.css");
const STATIC_APP_SOURCE = path.join(MODULE_DIR, "staticAppEntry.js");

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>GroupScout</title>
    <link rel="stylesheet" href="/assets/styles.css?v=admin-login-1">
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/assets/app.js?v=admin-login-1"></script>
  </body>
</html>
`;

export async function buildStaticApp() {
  await mkdir(ASSET_DIR, { recursive: true });
  await rm(DIST_SRC_DIR, { recursive: true, force: true });
  await mkdir(path.join(DIST_SRC_DIR, "renderer"), { recursive: true });
  await Promise.all([
    cp(path.join(SRC_DIR, "api"), path.join(DIST_SRC_DIR, "api"), { recursive: true }),
    cp(path.join(SRC_DIR, "app"), path.join(DIST_SRC_DIR, "app"), { recursive: true }),
    cp(path.join(SRC_DIR, "design"), path.join(DIST_SRC_DIR, "design"), { recursive: true }),
    cp(path.join(SRC_DIR, "renderer/domRenderer.js"), path.join(DIST_SRC_DIR, "renderer/domRenderer.js")),
    cp(path.join(SRC_DIR, "renderer/pipelineRuntime.js"), path.join(DIST_SRC_DIR, "renderer/pipelineRuntime.js")),
    cp(STATIC_STYLE_SOURCE, path.join(ASSET_DIR, "styles.css")),
    cp(STATIC_APP_SOURCE, path.join(ASSET_DIR, "app.js")),
    writeFile(path.join(DIST_DIR, "index.html"), INDEX_HTML)
  ]);

  return {
    indexFile: "web/dist/index.html",
    appAsset: "web/dist/assets/app.js",
    styleAsset: "web/dist/assets/styles.css",
    moduleRoot: "web/dist/src"
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await buildStaticApp();
}
