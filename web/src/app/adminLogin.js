export function createAdminLoginScreen() {
  return {
    kind: "admin-login-screen",
    heading: "Admin Login",
    layout: { mode: "admin-login" },
    form: {
      action: "/api/auth/login",
      method: "post",
      fields: [
        {
          name: "token",
          label: "Setup token",
          ariaLabel: "Setup token",
          inputMode: "text",
          autocomplete: "one-time-code"
        }
      ],
      submitLabel: "Log in"
    },
    statusRegion: {
      role: "status",
      message: ""
    }
  };
}
