export const SESSION_COOKIE_NAME = "groupscout_session";

export function createUiDeploymentConfig(env = {}) {
  const enabled = parseEnabled(env.UI_ENABLED);
  const basePath = normalizeBasePath(env.UI_BASE_PATH ?? "/");
  const sessionSecret = env.UI_SESSION_SECRET ?? "";
  const nodeEnv = env.NODE_ENV ?? "development";
  const cors = createCorsConfig(env.CORS_ALLOWED_ORIGINS);

  return {
    enabled,
    basePath,
    sessionSecret,
    nodeEnv,
    cors,
    sessionCookieName: SESSION_COOKIE_NAME
  };
}

export function assertUiDeploymentReady(config) {
  if (!config.enabled) {
    return true;
  }

  if (typeof config.sessionSecret !== "string" || config.sessionSecret.length < 32) {
    throw new Error("UI_SESSION_SECRET must be set to at least 32 characters when UI is enabled");
  }

  if (config.nodeEnv === "production" && config.cors.allowedOrigins.length > 0) {
    throw new Error("Operator UI CORS allow-list is development-only CORS");
  }

  return true;
}

export function resolveUiMount(pathname, config) {
  if (!config.enabled) {
    return {
      mounted: false,
      status: 404,
      reason: "ui-disabled",
      basePath: config.basePath
    };
  }

  const path = normalizeRequestPath(pathname);

  if (config.basePath === "/") {
    return {
      mounted: true,
      shellPath: path,
      basePath: config.basePath
    };
  }

  if (path === config.basePath) {
    return {
      mounted: true,
      shellPath: "/",
      basePath: config.basePath
    };
  }

  if (path.startsWith(`${config.basePath}/`)) {
    return {
      mounted: true,
      shellPath: path.slice(config.basePath.length),
      basePath: config.basePath
    };
  }

  return {
    mounted: false,
    status: 404,
    reason: "outside-ui-base-path",
    basePath: config.basePath
  };
}

export function authorizeUiApiRequest(request, { config, sessions } = {}) {
  if (!request?.pathname?.startsWith("/api/")) {
    return { allowed: true, reason: "outside-api-boundary" };
  }

  if (!config?.enabled) {
    return {
      allowed: false,
      status: 404,
      reason: "ui-disabled"
    };
  }

  if (!config.sessionSecret) {
    return { allowed: true, reason: "session-unconfigured" };
  }

  if (config.sessionSecret.length < 32) {
    return {
      allowed: false,
      status: 500,
      reason: "invalid-session-config"
    };
  }

  const sessionId = getCookieValue(request.headers?.cookie ?? "", config.sessionCookieName);

  if (!sessionId) {
    return unauthorized("missing-session");
  }

  if (!hasSession(sessions, sessionId)) {
    return unauthorized("invalid-session");
  }

  return { allowed: true, reason: "session-valid" };
}

function parseEnabled(value) {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  return !["0", "false", "off", "no"].includes(String(value).toLowerCase());
}

function normalizeBasePath(value) {
  let basePath = String(value || "/").trim();

  if (basePath === "" || basePath === "/") {
    return "/";
  }

  if (!basePath.startsWith("/")) {
    basePath = `/${basePath}`;
  }

  return basePath.replace(/\/+$/, "");
}

function normalizeRequestPath(pathname) {
  let path = String(pathname || "/");

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  return path;
}

function createCorsConfig(origins) {
  let allowedOrigins = String(origins ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    mode: "development-only",
    allowedOrigins
  };
}

function getCookieValue(cookieHeader, name) {
  return String(cookieHeader)
    .split(";")
    .map((part) => part.trim())
    .map((part) => part.split("="))
    .find(([cookieName]) => cookieName === name)?.[1];
}

function hasSession(sessions, sessionId) {
  if (typeof sessions?.has === "function") {
    return sessions.has(sessionId);
  }

  if (typeof sessions === "function") {
    return sessions(sessionId) === true;
  }

  return false;
}

function unauthorized(reason) {
  return {
    allowed: false,
    status: 401,
    reason,
    headers: { "www-authenticate": "GroupScoutSession" }
  };
}
