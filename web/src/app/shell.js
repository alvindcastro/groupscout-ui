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
  const activeRoute =
    appNavigation.find((route) => route.path === pathname) ?? appNavigation[0];

  return {
    kind: "operator-workspace-shell",
    activeRoute,
    sections: appNavigation.map((route) => ({
      ...route,
      active: route.path === activeRoute.path
    })),
    content: {
      status: "placeholder",
      description:
        "Phase 0 reserves navigation slots for future lead-management views while product workflows remain unimplemented."
    }
  };
}
