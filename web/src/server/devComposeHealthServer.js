import http from "node:http";
import { pathToFileURL } from "node:url";
import { BROWSER_RUNTIME_CONTRACT } from "./browserRuntimeContract.js";

export const DEV_COMPOSE_CONTRACT = Object.freeze({
  phase: "D3",
  status: "development-compose",
  composeFile: "compose.dev.yml",
  serviceName: "groupscout-ui",
  backendServiceName: "groupscout",
  backendNetwork: "groupscout_net",
  backendTarget: BROWSER_RUNTIME_CONTRACT.apiRouting.internalTarget,
  browserApiPath: BROWSER_RUNTIME_CONTRACT.apiRouting.browserPath,
  healthPath: BROWSER_RUNTIME_CONTRACT.healthPath,
  containerPort: BROWSER_RUNTIME_CONTRACT.containerPort,
  hostPortEnv: "GROUPSCOUT_UI_HOST_PORT",
  defaultHostPort: 3001,
  smokeRequiresBackendServices: Object.freeze(["groupscout", "postgres", "ollama", "ollama-init"])
});

export function createDevComposeHealthPayload(env = process.env) {
  return {
    status: "ok",
    phase: DEV_COMPOSE_CONTRACT.phase,
    service: DEV_COMPOSE_CONTRACT.serviceName,
    healthPath: DEV_COMPOSE_CONTRACT.healthPath,
    api: {
      browserPath: env.UI_PUBLIC_API_PATH || DEV_COMPOSE_CONTRACT.browserApiPath,
      internalTarget: env.UI_API_PROXY_TARGET || DEV_COMPOSE_CONTRACT.backendTarget,
      sameOrigin: true
    }
  };
}

export function createDevComposeHealthServer({ env = process.env } = {}) {
  return http.createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");

    if (url.pathname !== DEV_COMPOSE_CONTRACT.healthPath) {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "not_found" }));
      return;
    }

    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": "application/json"
    });
    response.end(JSON.stringify(createDevComposeHealthPayload(env)));
  });
}

export function startDevComposeHealthServer({ env = process.env } = {}) {
  const port = Number.parseInt(env.UI_PORT || String(DEV_COMPOSE_CONTRACT.containerPort), 10);
  const server = createDevComposeHealthServer({ env });

  server.listen(port, "0.0.0.0");

  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startDevComposeHealthServer();
}
