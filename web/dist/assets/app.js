const root = document.querySelector("#app");

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
    return "<h1>Lead Inbox</h1><label>Search leads<input aria-label=\"Search leads\"></label><p>Riverside hotel renovation crew block</p>";
  }

  return "<h1>Today</h1><p>GroupScout operator workspace</p>";
}

if (root) {
  root.innerHTML = render();
}

export async function loadSystemSummary(fetchImpl = fetch) {
  const response = await createApiClient(fetchImpl).getSystem();

  if (!response.ok) {
    throw new Error(`System summary request failed with status ${response.status}`);
  }

  return response.json();
}
