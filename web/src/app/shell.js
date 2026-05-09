import { createAnalyticsDashboardScreen } from "./analyticsDashboard.js";
import { createAdminLoginScreen } from "./adminLogin.js";
import { createAlertdConsoleScreen } from "./alertdConsole.js";
import { createLeadDetailScreen } from "./leadDetail.js";
import { createLeadInboxScreen } from "./leadInbox.js";
import { createOutreachWorkspaceScreen } from "./outreachWorkspace.js";
import { createPipelineMonitorScreen } from "./pipelineMonitor.js";
import { createTodayCommandCenterScreen } from "./todayCommandCenter.js";
import { createVerificationQueueScreen } from "./verificationQueue.js";

export const appNavigation = [
  { label: "Today", path: "/" },
  { label: "Leads", path: "/leads" },
  { label: "Verification", path: "/verification" },
  { label: "Outreach", path: "/outreach" },
  { label: "Pipeline", path: "/pipeline" },
  { label: "Analytics", path: "/analytics" },
  { label: "Alerts", path: "/alerts" },
  { label: "Settings", path: "/settings" }
];

export function createRouteShell(pathname = "/", options = {}) {
  const activeRoute = findActiveRoute(pathname);
  const content = createRouteContent(pathname, activeRoute, options);

  return {
    kind: "operator-workspace-shell",
    activeRoute,
    chrome: {
      logoutControl: activeRoute.hidden
        ? undefined
        : {
          label: "Log out",
          ariaLabel: "Log out of admin session"
        }
    },
    sections: appNavigation.map((route) => ({
      ...route,
      active: route.path === activeRoute.path
    })),
    content
  };
}

export function createMountedRouteShell(pathname = "/", { basePath = "/", viewport = "desktop" } = {}) {
  const normalizedBasePath = normalizeBasePath(basePath);
  const shellPath = stripBasePath(pathname, normalizedBasePath);
  const shell = createRouteShell(shellPath, { viewport });

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
  if (pathname === "/admin/login") {
    return { label: "Admin Login", path: "/admin/login", hidden: true };
  }

  if (pathname.startsWith("/leads/")) {
    return appNavigation.find((route) => route.path === "/leads");
  }

  return appNavigation.find((route) => route.path === pathname) ?? appNavigation[0];
}

function createRouteContent(pathname, activeRoute, { viewport = "desktop" } = {}) {
  if (pathname === "/admin/login") {
    return createAdminLoginScreen();
  }

  if (pathname.startsWith("/leads/")) {
    return createLeadDetailScreen({ leadId: pathname.slice("/leads/".length), viewport });
  }

  if (activeRoute.path === "/") {
    return createTodayCommandCenterScreen({ viewport });
  }

  if (activeRoute.path === "/leads") {
    return createLeadInboxScreen({ viewport });
  }

  if (activeRoute.path === "/verification") {
    return createVerificationQueueScreen({ viewport });
  }

  if (activeRoute.path === "/outreach") {
    return createOutreachWorkspaceScreen({ leadId: "lead_hotel_001", viewport });
  }

  if (activeRoute.path === "/pipeline") {
    return createPipelineMonitorScreen({ viewport });
  }

  if (activeRoute.path === "/analytics") {
    return createAnalyticsDashboardScreen({ viewport });
  }

  if (activeRoute.path === "/alerts") {
    return createAlertdConsoleScreen({ viewport });
  }

  return {
    status: "placeholder",
    description:
      "Settings remains reserved for operator configuration; core workbench routes are implemented in the current model-level UI."
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
