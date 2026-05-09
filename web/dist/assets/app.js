const root = document.querySelector("#app");

if (root) {
  root.textContent = "GroupScout operator workspace";
}

export async function loadSystemSummary(fetchImpl = fetch) {
  const response = await fetchImpl("/api/system", {
    credentials: "same-origin",
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`System summary request failed with status ${response.status}`);
  }

  return response.json();
}
