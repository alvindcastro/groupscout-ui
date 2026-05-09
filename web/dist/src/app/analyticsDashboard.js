import { designTokens } from "../design/tokens.js";

export const ANALYTICS_HIT_RATE_DEFINITION = {
  label: "Won leads / total source leads",
  numeratorStatuses: ["won"],
  denominator: "All leads from the source collected in the selected date range",
  excludedFromNumerator: ["claimed", "contacted", "lost", "no_response", "dismissed"]
};

export const ANALYTICS_SUMMARY_SECTIONS = [
  ["status", "Status"],
  ["source", "Source"],
  ["scoreBand", "Score band"],
  ["owner", "Owner"],
  ["week", "Week"]
];

export const mockAnalyticsStats = {
  dateRange: {
    from: "2026-04-01",
    to: "2026-05-08",
    label: "Apr 1-May 8, 2026"
  },
  denominator: {
    label: "All leads collected in the selected date range",
    total: 64
  },
  summaries: {
    status: [
      { key: "new", label: "New", count: 14 },
      { key: "claimed", label: "Claimed", count: 22 },
      { key: "won", label: "Won", count: 8 },
      { key: "lost", label: "Lost", count: 5 }
    ],
    source: [
      { key: "permit_feed", label: "Permit Feed", count: 28 },
      { key: "builder_network", label: "Builder Network", count: 18 },
      { key: "manual_review", label: "Manual Review", count: 9 }
    ],
    scoreBand: [
      { key: "80_100", label: "80-100", count: 19 },
      { key: "60_79", label: "60-79", count: 31 },
      { key: "0_59", label: "0-59", count: 14 }
    ],
    owner: [
      { key: "dana", label: "Dana Lee", count: 24 },
      { key: "sam", label: "Sam Rivera", count: 18 },
      { key: "unowned", label: "Unowned", count: 11 }
    ],
    week: [
      { key: "2026-W18", label: "Week of Apr 27", count: 17 },
      { key: "2026-W19", label: "Week of May 4", count: 21 }
    ]
  },
  sourceYield: [
    {
      source: "Permit Feed",
      total: 28,
      claimed: 15,
      won: 6,
      lost: 3,
      noResponse: 2
    },
    {
      source: "Builder Network",
      total: 18,
      claimed: 7,
      won: 2,
      lost: 3,
      noResponse: 4
    },
    {
      source: "Manual Review",
      total: 9,
      claimed: 3,
      won: 0,
      lost: 1,
      noResponse: 1
    }
  ],
  leadAging: [
    { key: "0_2_days", label: "0-2 days", count: 23 },
    { key: "3_7_days", label: "3-7 days", count: 18 },
    { key: "8_plus_days", label: "8+ days", count: 7 }
  ],
  verificationQuality: [
    { key: "verified_clean", label: "Verified without correction", count: 18, denominator: 27 },
    { key: "corrected", label: "Corrected after review", count: 9, denominator: 27 },
    { key: "returned", label: "Returned to queue", count: 3, denominator: 27 }
  ],
  demand: [
    {
      weekStart: "2026-05-11",
      segment: "Hotel renovation",
      property: "Riverside Hotel",
      leadCount: 9,
      estimatedRoomNights: 144
    },
    {
      weekStart: "2026-05-18",
      segment: "Multifamily repair",
      property: "Northbank Apartments",
      leadCount: 6,
      estimatedRoomNights: 72
    }
  ]
};

const CONTROL_DEFINITIONS = [
  ["dateRange", "Date range", "select"],
  ["segment", "Segment", "select"],
  ["property", "Property", "select"],
  ["refresh", "Refresh analytics", "button"]
];

export function createAnalyticsDashboardScreen({
  stats = mockAnalyticsStats,
  state,
  errorMessage,
  viewport = "desktop"
} = {}) {
  const displayState = state ?? inferState(stats);
  const baseScreen = {
    kind: "analytics-dashboard-screen",
    heading: "Analytics",
    state: displayState,
    rawStats: stats,
    layout: createLayout(viewport),
    controls: createControls(),
    tokens: {
      card: designTokens.components["card-base"],
      tableSurface: designTokens.components["feature-comparison-table"],
      row: designTokens.components["property-row"],
      badge: designTokens.components["badge-tag"],
      typeBadge: designTokens.components["badge-type"],
      filter: designTokens.components["search-pill"],
      input: designTokens.components["text-input"],
      secondaryAction: designTokens.components["button-secondary"]
    }
  };

  if (displayState === "loading") {
    return {
      ...baseScreen,
      statusRegion: {
        role: "status",
        message: "Loading analytics."
      }
    };
  }

  if (displayState === "error") {
    return {
      ...baseScreen,
      statusRegion: {
        role: "alert",
        message: errorMessage ?? "Analytics could not load."
      },
      errorState: {
        title: "Analytics could not load",
        message: errorMessage ?? "Try again after the stats API recovers."
      }
    };
  }

  if (displayState === "empty") {
    return {
      ...baseScreen,
      dateRange: stats.dateRange,
      denominatorLabel: createDenominatorLabel(stats),
      emptyState: {
        title: "No analytics data for this range",
        action: { label: "Clear filters" }
      },
      summaries: createSummaries(stats),
      sourceYield: createSourceYield(stats),
      leadAging: createLeadAging(stats),
      verificationQuality: createVerificationQuality(stats),
      demand: createDemand(stats),
      metricDefinitions: createMetricDefinitions(stats)
    };
  }

  return {
    ...baseScreen,
    dateRange: stats.dateRange,
    denominatorLabel: createDenominatorLabel(stats),
    summaries: createSummaries(stats),
    sourceYield: createSourceYield(stats),
    leadAging: createLeadAging(stats),
    verificationQuality: createVerificationQuality(stats),
    demand: createDemand(stats),
    metricDefinitions: createMetricDefinitions(stats)
  };
}

export function createStatsRequest({ from, to, segment, property } = {}) {
  const query = {};

  for (const [key, value] of Object.entries({ from, to, segment, property })) {
    if (value !== undefined && value !== null && value !== "") {
      query[key] = value;
    }
  }

  return {
    method: "GET",
    path: "/api/stats",
    query
  };
}

function inferState(stats) {
  if (stats.denominator?.total === 0) {
    return "empty";
  }

  return "ready";
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
      mode: "mobile-analytics-stack",
      regions: ["summary", "source-yield", "quality", "demand"]
    };
  }

  if (viewport === "tablet") {
    return {
      viewport,
      mode: "tablet-analytics-stack",
      regions: ["summary", "source-yield", "aging", "quality", "demand"]
    };
  }

  return {
    viewport: "desktop",
    mode: "desktop-analytics-dashboard",
    regions: ["summary", "source-yield", "aging", "quality", "demand"]
  };
}

function createDenominatorLabel(stats) {
  return `${stats.denominator.total} leads collected in ${stats.dateRange.label}`;
}

function createSummaries(stats) {
  return Object.fromEntries(
    ANALYTICS_SUMMARY_SECTIONS.map(([key, title]) => [
      key,
      {
        title,
        items: stats.summaries[key].map((item) => ({
          key: item.key,
          label: item.label,
          value: pluralize(item.count, "lead", "leads"),
          percent: percentage(item.count, stats.denominator.total)
        }))
      }
    ])
  );
}

function createSourceYield(stats) {
  return {
    dense: true,
    definition: ANALYTICS_HIT_RATE_DEFINITION,
    columns: [
      { key: "source", label: "Source" },
      { key: "total", label: "Total" },
      { key: "claimedRate", label: "Claimed" },
      { key: "wonRate", label: "Won" },
      { key: "lostRate", label: "Lost" },
      { key: "hitRate", label: "Hit rate" },
      { key: "denominator", label: "Denominator" }
    ],
    rows: stats.sourceYield.map((source) => ({
      source: source.source,
      cells: {
        total: pluralize(source.total, "lead", "leads"),
        claimedRate: `${percentage(source.claimed, source.total)}% claimed`,
        wonRate: `${percentage(source.won, source.total)}% won`,
        lostRate: `${percentage(source.lost, source.total)}% lost`,
        hitRate: `${percentage(source.won, source.total)}% hit rate`,
        denominator: `${source.total} source leads`
      }
    }))
  };
}

function createLeadAging(stats) {
  return {
    title: "Lead aging",
    buckets: stats.leadAging.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      value: pluralize(bucket.count, "lead", "leads"),
      percent: percentage(bucket.count, stats.denominator.total)
    }))
  };
}

function createVerificationQuality(stats) {
  return {
    dense: true,
    rows: stats.verificationQuality.map((item) => ({
      key: item.key,
      label: item.label,
      cells: {
        count: pluralize(item.count, "lead", "leads"),
        rate: `${percentage(item.count, item.denominator)}%`,
        denominator: `${item.denominator} reviewed leads`
      }
    }))
  };
}

function createDemand(stats) {
  return {
    dense: true,
    rows: stats.demand.map((item) => ({
      weekStart: item.weekStart,
      cells: {
        segment: item.segment,
        property: item.property,
        leads: pluralize(item.leadCount, "lead", "leads"),
        roomNights: `${item.estimatedRoomNights} room nights`
      }
    }))
  };
}

function createMetricDefinitions(stats) {
  return {
    sourceHitRate: {
      ...ANALYTICS_HIT_RATE_DEFINITION,
      visibleExplanation: `Source hit rate is won leads divided by total leads from that source for ${stats.dateRange.label}.`
    },
    denominator: {
      label: stats.denominator.label,
      visibleExplanation: `${stats.denominator.total} leads are included in ${stats.dateRange.label}.`
    }
  };
}

function percentage(value, denominator) {
  if (!denominator) {
    return 0;
  }

  return Math.round((value / denominator) * 100);
}

function pluralize(value, singular, plural) {
  return `${value} ${value === 1 ? singular : plural}`;
}
