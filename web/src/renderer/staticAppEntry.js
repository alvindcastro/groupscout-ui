const root = typeof document === "undefined" ? undefined : document.querySelector("#app");
const workspaceLabel = "GroupScout operator workspace";
const STATIC_ROUTE_PREFIXES = Object.freeze(["/api/", "/assets/", "/src/"]);
const ADMIN_LOGIN_PATH = "/admin/login";
let rendererModulesPromise;
let apiClientPromise;

root?.setAttribute("aria-label", workspaceLabel);

async function renderCurrentRoute() {
  if (await redirectToLoginWhenUnauthenticated(window.location.pathname)) {
    return;
  }

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

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-admin-logout]");

    if (!button) {
      return;
    }

    event.preventDefault();
    await submitAdminLogout(button);
  });

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("form[data-admin-login-form]");

    if (!form) {
      return;
    }

    event.preventDefault();
    await submitAdminLogin(form);
  });

  window.addEventListener("popstate", renderCurrentRoute);
  renderCurrentRoute();
}

async function submitAdminLogin(form) {
  const feedback = form.querySelector("[data-admin-login-feedback]");
  const submit = form.querySelector('button[type="submit"]');
  const token = new FormData(form).get("token");

  setLoginFeedback(feedback, "Checking token.");
  if (submit) {
    submit.disabled = true;
  }

  try {
    const apiClient = await loadApiClient();
    await apiClient.loginWithSetupToken({ token: String(token ?? "") });
    await verifyAuthenticatedAdmin(apiClient);
    window.history.pushState({}, "", "/");
    await renderCurrentRoute();
  } catch {
    setLoginFeedback(feedback, "Token rejected.");
  } finally {
    if (submit) {
      submit.disabled = false;
    }
  }
}

async function submitAdminLogout(button) {
  button.disabled = true;

  try {
    const apiClient = await loadApiClient();
    await apiClient.logout();
  } catch {
    // The local browser state should leave protected routes even when the session is already expired.
  } finally {
    button.disabled = false;
    redirectToLogin();
  }
}

async function redirectToLoginWhenUnauthenticated(pathname) {
  if (!routeRequiresAuth(pathname)) {
    return false;
  }

  try {
    const apiClient = await loadApiClient();
    const status = await apiClient.getAuthStatus();

    if (!getUnauthenticatedRedirect(pathname, status)) {
      return false;
    }
  } catch {
    // Fall through to the public login route.
  }

  redirectToLogin();
  return true;
}

export async function verifyAuthenticatedAdmin(apiClient) {
  const status = await apiClient.getAuthStatus();

  if (isAuthenticatedStatus(status)) {
    return status;
  }

  const admin = await apiClient.getCurrentAdmin();

  if (admin && typeof admin === "object") {
    return admin;
  }

  throw new Error("Admin session was not established");
}

function redirectToLogin() {
  if (window.location.pathname === ADMIN_LOGIN_PATH) {
    renderCurrentRoute();
    return;
  }

  window.history.replaceState({}, "", ADMIN_LOGIN_PATH);
  renderCurrentRoute();
}

function loadApiClient() {
  apiClientPromise ??= import("/src/api/client.js?v=pipeline-output-4").then(({ createApiClient }) => createApiClient());

  return apiClientPromise;
}

function setLoginFeedback(feedback, message) {
  if (feedback) {
    feedback.textContent = message;
  }
}

export function isPublicRoute(pathname) {
  return pathname === ADMIN_LOGIN_PATH;
}

export function routeRequiresAuth(pathname) {
  return !isPublicRoute(pathname);
}

export function getUnauthenticatedRedirect(pathname, status) {
  if (!routeRequiresAuth(pathname) || isAuthenticatedStatus(status)) {
    return undefined;
  }

  return ADMIN_LOGIN_PATH;
}

export function isAuthenticatedStatus(status) {
  if (status === true) {
    return true;
  }

  if (!status || typeof status !== "object") {
    return false;
  }

  return status.auth_required === false || status.authenticated === true || status.loggedIn === true || status.status === "authenticated";
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
