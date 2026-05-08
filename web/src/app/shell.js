import { createLeadDetailScreen } from "./leadDetail.js";
import { createLeadInboxScreen } from "./leadInbox.js";
import { createOutreachWorkspaceScreen } from "./outreachWorkspace.js";
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

  return {
    status: "placeholder",
    description:
      "Phase 0 reserves navigation slots for future lead-management views while product workflows remain unimplemented."
  };
}
