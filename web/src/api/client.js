export const API_BASE_PATH = "/api";

export function createApiClient({ fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("createApiClient requires a fetch implementation");
  }

  return {
    async request(path, init = {}) {
      assertSameOriginApiPath(path);

      const response = await fetchImpl(path, {
        ...init,
        credentials: "same-origin",
        headers: {
          accept: "application/json",
          ...init.headers
        }
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      let contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        return undefined;
      }

      return response.json();
    }
  };
}

function assertSameOriginApiPath(path) {
  if (typeof path !== "string" || path.length === 0) {
    throw new TypeError("API path must be a non-empty string");
  }

  if (/^https?:\/\//i.test(path)) {
    throw new Error("Browser API requests must stay same-origin");
  }

  if (!path.startsWith(`${API_BASE_PATH}/`)) {
    throw new Error("Browser API requests must use the /api boundary");
  }
}
