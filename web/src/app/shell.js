import { createAnalyticsDashboardScreen } from "./analyticsDashboard.js";
import { createLeadDetailScreen } from "./leadDetail.js";
import { createLeadInboxScreen } from "./leadInbox.js";
import { createOutreachWorkspaceScreen } from "./outreachWorkspace.js";
import { createPipelineMonitorScreen } from "./pipelineMonitor.js";
import { createVerificationQueueScreen } from "./verificationQueue.js";

export const appNavigation = [
  { label: "Today", path: "/" },
  { label: "Leads", path: "/leads" },
  { label: "Verification", path: "/verification" },
  { label: "Outreach", path: "/outreach" },
  { label: "Pipeline", path: "/pipeline" },
  { label: "Analytics", path: "/analytics" },
  { label: "Settings", path: "/settings" }
];

export function createRouteShell(pathname = "/") {
  const activeRoute = findActiveRoute(pathname);
  const content = createRouteContent(pathname, activeRoute);

  return {
    kind: "operator-workspace-shell",
    activeRoute,
    sections: appNavigation.map((route) => ({
      ...route,
      active: route.path === activeRoute.path
    })),
    content
  };
}

export function createMountedRouteShell(pathname = "/", { basePath = "/" } = {}) {
  const normalizedBasePath = normalizeBasePath(basePath);
  const shellPath = stripBasePath(pathname, normalizedBasePath);
  const shell = createRouteShell(shellPath);

  return {
    ...shell,
    basePath: normalizedBasePath,
    sections: shell.sections.map((section) => ({
      ...section,
      href: joinBasePath(normalizedBasePath, section.path)
    }))
  };
}

function findActiveRoute(pathname) {
  if (pathname.startsWith("/leads/")) {
    return appNavigation.find((route) => route.path === "/leads");
  }

  return appNavigation.find((route) => route.path === pathname) ?? appNavigation[0];
}

function createRouteContent(pathname, activeRoute) {
  if (pathname.startsWith("/leads/")) {
    return createLeadDetailScreen({ leadId: pathname.slice("/leads/".length) });
  }

  if (activeRoute.path === "/leads") {
    return createLeadInboxScreen();
  }

  if (activeRoute.path === "/verification") {
    return createVerificationQueueScreen();
  }

  if (activeRoute.path === "/outreach") {
    return createOutreachWorkspaceScreen({ leadId: "lead_hotel_001" });
  }

  if (activeRoute.path === "/pipeline") {
    return createPipelineMonitorScreen();
  }

  if (activeRoute.path === "/analytics") {
    return createAnalyticsDashboardScreen();
  }

  return {
    status: "placeholder",
    description:
      "Phase 0 reserves navigation slots for future lead-management views while product workflows remain unimplemented."
  };
}

function stripBasePath(pathname, basePath) {
  const normalizedBasePath = normalizeBasePath(basePath);
  let path = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (normalizedBasePath === "/") {
    return path;
  }

  if (path === normalizedBasePath) {
    return "/";
  }

  if (path.startsWith(`${normalizedBasePath}/`)) {
    return path.slice(normalizedBasePath.length);
  }

  return path;
}

function normalizeBasePath(basePath) {
  let normalized = String(basePath || "/").trim();

  if (normalized === "" || normalized === "/") {
    return "/";
  }

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  return normalized.replace(/\/+$/, "");
}

function joinBasePath(basePath, routePath) {
  if (basePath === "/") {
    return routePath;
  }

  if (routePath === "/") {
    return basePath;
  }

  return `${basePath}${routePath}`;
}
