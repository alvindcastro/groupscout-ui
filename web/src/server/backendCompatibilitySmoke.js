export const BACKEND_COMPATIBILITY_SMOKE_CONTRACT = Object.freeze({
  phase: "13-F",
  owner: "backend-api-compatibility",
  routes: Object.freeze([
    Object.freeze({ path: "/api/system", method: "GET", requiredFields: Object.freeze(["status"]) }),
    Object.freeze({ path: "/api/leads", method: "GET", requiredFields: Object.freeze(["items"]) }),
    Object.freeze({ path: "/api/pipeline/runs", method: "GET", requiredFields: Object.freeze(["items"]) }),
    Object.freeze({ path: "/api/stats", method: "GET", requiredFields: Object.freeze(["summary"]) }),
    Object.freeze({ path: "/api/alerts", method: "GET", requiredFields: Object.freeze(["items"]) }),
    Object.freeze({ path: "/api/leads/{id}/raw", method: "GET", requiredFields: Object.freeze(["raw"]) })
  ])
});

export function classifyBackendCompatibilityResponse(response, expectation = {}) {
  if (!response || response.error === "network") {
    return { classification: "proxy_failure", reason: "No backend response reached the UI proxy." };
  }

  if (response.status === 502 || response.status === 503 || response.status === 504) {
    return { classification: "proxy_failure", reason: `Proxy returned ${response.status}.` };
  }

  if (response.status === 401 || response.status === 403) {
    return { classification: "auth_required", reason: `Backend returned ${response.status}.` };
  }

  if (response.status === 404) {
    return { classification: "backend_route_drift", reason: "Backend route is not implemented at the UI-modeled path." };
  }

  const requiredFields = expectation.requiredFields ?? [];
  const body = response.body ?? {};
  const missingFields = requiredFields.filter((field) => !(field in body));

  if (response.status >= 200 && response.status < 300 && missingFields.length > 0) {
    return {
      classification: "schema_drift",
      reason: `Backend response is missing: ${missingFields.join(", ")}.`
    };
  }

  if (response.status >= 200 && response.status < 300) {
    return { classification: "compatible", reason: "Backend route and schema matched the UI smoke expectation." };
  }

  return { classification: "backend_error", reason: `Backend returned ${response.status}.` };
}
