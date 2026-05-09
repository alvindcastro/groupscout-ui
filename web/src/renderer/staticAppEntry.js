const root = typeof document === "undefined" ? undefined : document.querySelector("#app");
const workspaceLabel = "GroupScout operator workspace";
const STATIC_ROUTE_PREFIXES = Object.freeze(["/api/", "/assets/", "/src/"]);
let rendererModulesPromise;

root?.setAttribute("aria-label", workspaceLabel);

async function renderCurrentRoute() {
  const { mountRoute, attachPipelineMonitor } = await loadRendererModules();

  mountRoute(root, { pathname: window.location.pathname });
  attachPipelineMonitor();
}

function loadRendererModules() {
  rendererModulesPromise ??= Promise.all([
    import("/src/renderer/domRenderer.js?v=pipeline-output-4"),
    import("/src/renderer/pipelineRuntime.js?v=pipeline-output-4")
  ]).then(([domRenderer, pipelineRuntime]) => ({
    mountRoute: domRenderer.mountRoute,
    attachPipelineMonitor: pipelineRuntime.attachPipelineMonitor
  }));

  return rendererModulesPromise;
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a[href]");

    if (!shouldInterceptAppNavigation(event, anchor, window.location)) {
      return;
    }

    const target = new URL(anchor.href, window.location.href);

    event.preventDefault();
    window.history.pushState({}, "", target.pathname + target.search + target.hash);
    renderCurrentRoute();
  });

  window.addEventListener("popstate", renderCurrentRoute);
  renderCurrentRoute();
}

export function shouldInterceptAppNavigation(event, anchor, location = globalThis.window?.location) {
  if (!anchor || event.defaultPrevented || event.button !== 0) {
    return false;
  }

  if (!location) {
    return false;
  }

  if (anchor.target || anchor.hasAttribute("download")) {
    return false;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }

  const target = new URL(anchor.href, location.href);

  if (target.origin !== location.origin) {
    return false;
  }

  if (STATIC_ROUTE_PREFIXES.some((prefix) => target.pathname.startsWith(prefix))) {
    return false;
  }

  return !hasStaticFileExtension(target.pathname);
}

function hasStaticFileExtension(pathname) {
  const finalSegment = pathname.split("/").pop() ?? "";

  return /\.[a-z0-9][a-z0-9-]*$/i.test(finalSegment);
}

export async function loadSystemSummary(fetchImpl = fetch) {
  const response = await fetchImpl("/api/system", {
    credentials: "same-origin",
    headers: { accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`System summary request failed with status ${response.status}`);
  }

  return response.json();
}
