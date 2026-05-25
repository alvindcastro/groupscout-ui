export const VERIFICATION_TRIGGERS = {
  missing_raw_audit: {
    key: "missing_raw_audit",
    label: "Missing source or raw audit",
    severity: "high"
  },
  high_score_weak_rationale: {
    key: "high_score_weak_rationale",
    label: "High score with weak rationale",
    severity: "high"
  },
  raw_enrichment_contradiction: {
    key: "raw_enrichment_contradiction",
    label: "Raw/enrichment contradiction",
    severity: "medium"
  },
  low_confidence_parse: {
    key: "low_confidence_parse",
    label: "Low confidence collector parse",
    severity: "medium"
  },
  manual_operator_flag: {
    key: "manual_operator_flag",
    label: "Manual operator flag",
    severity: "medium"
  }
};

export function classifyVerificationTriggers(lead) {
  const triggers = [];

  if (!lead?.sourceUrl || !lead?.rawAuditRecordId) {
    triggers.push(VERIFICATION_TRIGGERS.missing_raw_audit);
  }

  if (lead?.score >= 90 && (lead?.aiConfidence < 0.6 || isWeakRationale(lead.aiRationale))) {
    triggers.push(VERIFICATION_TRIGGERS.high_score_weak_rationale);
  }

  if (hasRawEnrichmentContradiction(lead)) {
    triggers.push(VERIFICATION_TRIGGERS.raw_enrichment_contradiction);
  }

  if (lead?.collectorParseConfidence < 0.5) {
    triggers.push(VERIFICATION_TRIGGERS.low_confidence_parse);
  }

  if (lead?.manuallyFlagged === true) {
    triggers.push(VERIFICATION_TRIGGERS.manual_operator_flag);
  }

  return triggers;
}

function isWeakRationale(rationale) {
  return typeof rationale !== "string" || rationale.trim().split(/\s+/).length < 5;
}

function hasRawEnrichmentContradiction(lead) {
  if (!lead?.rawFields || !lead?.enrichedFields) return false;

  return Object.entries(lead.rawFields).some(
    ([field, value]) =>
      lead.enrichedFields[field] !== undefined && String(lead.enrichedFields[field]) !== String(value)
  );
}
