export function detailSummaryMap(summary) {
  return Object.fromEntries((summary?.items ?? []).map(([label, value]) => [label, value]));
}

export function normalizeClassToken(value) {
  return String(value ?? "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

export function scoreBand(score) {
  if (score >= 90) return "high";
  if (score >= 75) return "medium";
  return "low";
}

export function formatCellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(formatCellValue).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value).map(formatCellValue).join(" ");
  }

  return value;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
