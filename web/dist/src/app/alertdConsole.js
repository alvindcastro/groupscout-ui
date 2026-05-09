import { designTokens } from "../design/tokens.js";

export const ALERTD_ACTION_POLICY = {
  readOnly: true,
  mutationsAllowed: false,
  disabledActions: [
    { label: "Acknowledge", disabled: true, reason: "Alert mutations are out of scope for Phase 10." },
    { label: "Resolve", disabled: true, reason: "Alert mutations are out of scope for Phase 10." },
    { label: "Suppress", disabled: true, reason: "Alert mutations are out of scope for Phase 10." }
  ]
};

export const mockAlertdAlerts = [
  {
    id: "alert_riverside_001",
    property: "Riverside Hotel",
    sps: 91,
    state: "active",
    impact: "38 rooms unavailable",
    updatedAt: "2026-05-08T15:15:00Z",
    evidence: [
      {
        type: "weather",
        label: "Flood watch",
        value: "County flood watch overlaps Riverside Hotel district",
        sourceUrl: "https://alerts.example.test/weather/flood-watch",
        observedAt: "2026-05-08T14:52:00Z"
      },
      {
        type: "maintenance",
        label: "Elevator outage",
        value: "Service log reports two elevators unavailable",
        sourceUrl: "https://ops.example.test/riverside/elevators",
        observedAt: "2026-05-08T15:03:00Z"
      }
    ],
    roomInventory: {
      total: 140,
      unavailable: 38,
      available: 102,
      outOfService: 11,
      updatedAt: "2026-05-08T15:12:00Z"
    },
    actionHistory: [
      {
        actor: "alertd",
        action: "created",
        channel: "slack",
        note: "Posted disruption alert to #ops-alerts.",
        createdAt: "2026-05-08T15:15:00Z"
      },
      {
        actor: "Dana Lee",
        action: "investigated",
        channel: "phone",
        note: "Confirmed inventory with property manager.",
        createdAt: "2026-05-08T15:22:00Z"
      }
    ]
  },
  {
    id: "alert_northbank_002",
    property: "Northbank Apartments",
    sps: 74,
    state: "watching",
    impact: "12 rooms at risk",
    updatedAt: "2026-05-08T14:48:00Z",
    evidence: [
      {
        type: "utility",
        label: "Power instability",
        value: "Utility notice reports rolling service interruptions.",
        sourceUrl: "https://utility.example.test/outages/northbank",
        observedAt: "2026-05-08T14:40:00Z"
      }
    ],
    roomInventory: {
      total: 96,
      unavailable: 0,
      available: 96,
      outOfService: 0,
      updatedAt: "2026-05-08T14:45:00Z"
    },
    actionHistory: [
      {
        actor: "alertd",
        action: "created",
        channel: "slack",
        note: "Posted watch alert to #ops-alerts.",
        createdAt: "2026-05-08T14:48:00Z"
      }
    ]
  }
];

const CONTROL_DEFINITIONS = [
  ["state", "Alert state", "select"],
  ["property", "Property", "select"],
  ["refresh", "Refresh alerts", "button"]
];

const ALERT_COLUMNS = [
  { key: "property", label: "Property" },
  { key: "sps", label: "SPS" },
  { key: "state", label: "State" },
  { key: "impact", label: "Impact" },
  { key: "updated", label: "Updated" }
];

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short"
});

export function createAlertdConsoleScreen({
  alerts = mockAlertdAlerts,
  state,
  errorMessage,
  viewport = "desktop"
} = {}) {
  const displayState = state ?? inferState(alerts);
  const baseScreen = {
    kind: "alertd-console-screen",
    heading: "Alerts",
    state: displayState,
    layout: createLayout(viewport),
    controls: createControls(),
    channelPolicy: {
      slackFirst: true,
      description: "Slack remains the interrupt channel; this console is durable read-only monitoring."
    },
    actionPolicy: ALERTD_ACTION_POLICY,
    tokens: {
      card: designTokens.components["card-base"],
      tableSurface: designTokens.components["feature-comparison-table"],
      row: designTokens.components["property-row"],
      badge: designTokens.components["badge-tag"],
      typeBadge: designTokens.components["badge-type"],
      filter: designTokens.components["search-pill"],
      secondaryAction: designTokens.components["button-secondary"]
    }
  };

  if (displayState === "loading") {
    return {
      ...baseScreen,
      statusRegion: {
        role: "status",
        message: "Loading alerts."
      }
    };
  }

  if (displayState === "error") {
    return {
      ...baseScreen,
      statusRegion: {
        role: "alert",
        message: errorMessage ?? "Alert console could not load."
      },
      errorState: {
        title: "Alert console could not load",
        message: errorMessage ?? "Try again after the alert API recovers."
      }
    };
  }

  if (displayState === "empty") {
    return {
      ...baseScreen,
      emptyState: {
        title: "No active disruption alerts",
        message: "Slack remains the interrupt channel when alertd detects a new disruption."
      },
      summary: createSummary([]),
      table: createAlertTable([]),
      alertDetails: []
    };
  }

  return {
    ...baseScreen,
    summary: createSummary(alerts),
    table: createAlertTable(alerts),
    alertDetails: alerts.map(createAlertDetail)
  };
}

export function createAlertConsoleRequest({ state, property, limit, cursor } = {}) {
  const query = {};

  for (const [key, value] of Object.entries({ state, property, limit, cursor })) {
    if (value !== undefined && value !== null && value !== "") {
      query[key] = value;
    }
  }

  return {
    method: "GET",
    path: "/api/alerts",
    query,
    readOnly: true
  };
}

function inferState(alerts) {
  return alerts.length === 0 ? "empty" : "ready";
}

function createControls() {
  return CONTROL_DEFINITIONS.map(([name, label, type]) => ({
    name,
    label,
    type,
    ariaLabel: label,
    minTouchTarget: 44,
    token: type === "button" ? "button-secondary" : "search-pill"
  }));
}

function createLayout(viewport) {
  if (viewport === "mobile") {
    return {
      viewport,
      mode: "mobile-alert-stack",
      regions: ["summary", "alerts", "evidence", "inventory", "history"]
    };
  }

  if (viewport === "tablet") {
    return {
      viewport,
      mode: "tablet-alert-stack",
      regions: ["summary", "alerts", "evidence", "inventory", "history"]
    };
  }

  return {
    viewport: "desktop",
    mode: "desktop-alert-console",
    regions: ["summary", "alerts", "evidence", "inventory", "history"]
  };
}

function createSummary(alerts) {
  const highestSps = alerts.reduce((max, alert) => Math.max(max, alert.sps ?? 0), 0);
  const criticalRooms = alerts
    .filter((alert) => alert.state === "active")
    .reduce((total, alert) => total + (alert.roomInventory?.unavailable ?? 0), 0);
  const latestUpdate = alerts
    .map((alert) => alert.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    items: [
      { label: "Active alerts", value: pluralize(alerts.length, "alert", "alerts") },
      { label: "Highest SPS", value: String(highestSps) },
      { label: "Critical rooms unavailable", value: pluralize(criticalRooms, "room", "rooms") },
      { label: "Last update", value: formatDateTime(latestUpdate) }
    ]
  };
}

function createAlertTable(alerts) {
  return {
    dense: true,
    columns: ALERT_COLUMNS,
    rows: alerts.map((alert) => ({
      id: alert.id,
      cells: {
        property: alert.property,
        sps: String(alert.sps),
        state: alert.state,
        impact: alert.impact,
        updated: formatDateTime(alert.updatedAt)
      }
    }))
  };
}

function createAlertDetail(alert) {
  return {
    id: alert.id,
    property: alert.property,
    evidence: {
      dense: true,
      rows: alert.evidence.map((item) => ({
        type: item.type,
        label: item.label,
        value: item.value,
        sourceUrl: item.sourceUrl,
        observedAt: formatDateTime(item.observedAt),
        token: "code-inline"
      }))
    },
    roomInventory: createRoomInventory(alert.roomInventory),
    actionHistory: {
      dense: true,
      rows: alert.actionHistory.map((item) => ({
        actor: item.actor,
        action: item.action,
        channel: item.channel,
        note: item.note,
        createdAt: formatDateTime(item.createdAt)
      }))
    }
  };
}

function createRoomInventory(inventory = {}) {
  return {
    items: [
      { label: "Total rooms", value: String(inventory.total ?? "Unknown") },
      { label: "Unavailable", value: String(inventory.unavailable ?? "Unknown") },
      { label: "Available", value: String(inventory.available ?? "Unknown") },
      { label: "Out of service", value: String(inventory.outOfService ?? "Unknown") },
      { label: "Last updated", value: formatDateTime(inventory.updatedAt) }
    ]
  };
}

function formatDateTime(value) {
  if (!value) {
    return "Unknown";
  }

  return DATE_TIME_FORMATTER.format(new Date(value));
}

function pluralize(value, singular, plural) {
  return `${value} ${value === 1 ? singular : plural}`;
}
