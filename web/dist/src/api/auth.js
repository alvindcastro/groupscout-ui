import { API_BASE_PATH } from "./transport.js";

export function createAuthApiMethods() {
  return {
    async getAuthStatus() {
      return this.request(`${API_BASE_PATH}/auth/status`, {
        method: "GET"
      });
    },

    async loginWithSetupToken({ token }) {
      if (typeof token !== "string" || token.trim() === "") {
        throw new Error("Setup token is required");
      }

      return this.request(`${API_BASE_PATH}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: token.trim() })
      });
    },

    async logout() {
      return this.request(`${API_BASE_PATH}/auth/logout`, {
        method: "POST"
      });
    },

    async getCurrentAdmin() {
      return this.request(`${API_BASE_PATH}/auth/me`, {
        method: "GET"
      });
    }
  };
}
