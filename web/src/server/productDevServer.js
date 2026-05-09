import http from "node:http";
import { pathToFileURL } from "node:url";
import { createProductionServer } from "./productionServer.js";

export const PRODUCT_DEV_SERVER_CONTRACT = Object.freeze({
  phase: "13-E",
  status: "product-dev-server",
  command: "node web/src/server/productDevServer.js",
  healthPath: "/healthz",
  containerPort: 3000,
  defaultHostPort: 3001,
  publicRoot: "web/dist",
  browserApiPath: "/api/*",
  backendTarget: "http://groupscout:8080"
});

export function createProductDevHealthPayload(env = process.env) {
  return {
    status: "ok",
    phase: PRODUCT_DEV_SERVER_CONTRACT.phase,
    service: "groupscout-ui",
    mode: "product-dev-server",
    assets: {
      publicRoot: PRODUCT_DEV_SERVER_CONTRACT.publicRoot
    },
    api: {
      browserPath: env.UI_PUBLIC_API_PATH || PRODUCT_DEV_SERVER_CONTRACT.browserApiPath,
      internalTarget: env.UI_API_PROXY_TARGET || PRODUCT_DEV_SERVER_CONTRACT.backendTarget,
      sameOrigin: true
    }
  };
}

export function createProductDevServer({ env = process.env } = {}) {
  const productionServer = createProductionServer({ env });

  return http.createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");

    if (url.pathname === PRODUCT_DEV_SERVER_CONTRACT.healthPath) {
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": "application/json"
      });
      response.end(JSON.stringify(createProductDevHealthPayload(env)));
      return;
    }

    productionServer.emit("request", request, response);
  });
}

export function startProductDevServer({ env = process.env } = {}) {
  const port = Number.parseInt(env.UI_PORT || String(PRODUCT_DEV_SERVER_CONTRACT.containerPort), 10);
  const server = createProductDevServer({ env });

  server.listen(port, "0.0.0.0");

  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startProductDevServer();
}
