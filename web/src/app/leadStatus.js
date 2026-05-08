export const LEAD_STATUSES = [
  "new",
  "notified",
  "claimed",
  "contacted",
  "snoozed",
  "flagged",
  "verified",
  "dismissed",
  "won",
  "lost",
  "no_response"
];

export const LEAD_STATUS_TRANSITIONS = {
  new: ["claim", "dismiss", "snooze", "flag"],
  notified: ["claim", "dismiss", "snooze", "flag"],
  claimed: ["contacted", "won", "lost", "no_response", "snooze"],
  contacted: ["won", "lost", "no_response", "follow_up"],
  snoozed: ["reopen", "dismiss"],
  flagged: ["verified", "corrected", "dismiss"],
  verified: ["claim", "dismiss"],
  dismissed: ["reopen"],
  won: ["reopen"],
  lost: ["reopen"],
  no_response: ["follow_up", "lost", "snooze"]
};

export const LEAD_STATUS_ACTIONS = {
  claim: {
    action: "claim",
    label: "Claim lead",
    resultStatus: "claimed",
    requires: ["owner"],
    mutationFields: ["status", "owner"],
    token: "button-primary"
  },
  dismiss: {
    action: "dismiss",
    label: "Dismiss",
    resultStatus: "dismissed",
    requires: ["notes"],
    mutationFields: ["status", "notes"],
    token: "button-secondary"
  },
  snooze: {
    action: "snooze",
    label: "Snooze",
    resultStatus: "snoozed",
    requires: ["snoozeUntil"],
    mutationFields: ["status", "snoozeDate"],
    token: "button-secondary"
  },
  flag: {
    action: "flag",
    label: "Flag for verification",
    resultStatus: "flagged",
    requires: ["notes"],
    mutationFields: ["status", "notes"],
    token: "button-secondary"
  },
  contacted: {
    action: "contacted",
    label: "Mark contacted",
    resultStatus: "contacted",
    requires: ["notes"],
    mutationFields: ["status", "notes"],
    token: "button-primary"
  },
  won: {
    action: "won",
    label: "Mark won",
    resultStatus: "won",
    requires: ["notes"],
    mutationFields: ["status", "notes"],
    token: "button-primary"
  },
  lost: {
    action: "lost",
    label: "Mark lost",
    resultStatus: "lost",
    requires: ["notes"],
    mutationFields: ["status", "notes"],
    token: "button-secondary"
  },
  no_response: {
    action: "no_response",
    label: "No response",
    resultStatus: "no_response",
    requires: ["notes"],
    mutationFields: ["status", "notes"],
    token: "button-secondary"
  },
  follow_up: {
    action: "follow_up",
    label: "Log follow-up",
    resultStatus: "current",
    requires: ["notes"],
    mutationFields: ["status", "notes"],
    token: "button-secondary"
  },
  reopen: {
    action: "reopen",
    label: "Reopen",
    resultStatus: "new",
    requires: ["notes"],
    mutationFields: ["status", "notes"],
    token: "button-secondary"
  },
  verified: {
    action: "verified",
    label: "Mark verified",
    resultStatus: "verified",
    requires: ["notes"],
    mutationFields: ["status", "notes"],
    token: "button-primary"
  },
  corrected: {
    action: "corrected",
    label: "Record correction",
    resultStatus: "current",
    requires: ["corrections", "correctionReason"],
    mutationFields: ["status", "corrections"],
    token: "button-secondary"
  }
};

const STATUS_SET = new Set(LEAD_STATUSES);

export function isLeadStatus(status) {
  return STATUS_SET.has(status);
}

export function canApplyLeadStatusAction(currentStatus, action) {
  return LEAD_STATUS_TRANSITIONS[currentStatus]?.includes(action) ?? false;
}

export function getLeadStatusActions(lead = {}) {
  return (LEAD_STATUS_TRANSITIONS[lead.status] ?? []).map((action) => ({
    ...LEAD_STATUS_ACTIONS[action],
    requires: [...LEAD_STATUS_ACTIONS[action].requires],
    mutationFields: [...LEAD_STATUS_ACTIONS[action].mutationFields]
  }));
}

export function validateLeadStatusAction({
  currentStatus,
  action,
  owner,
  notes,
  snoozeUntil,
  corrections,
  correctionReason
} = {}) {
  const errors = [];

  if (!canApplyLeadStatusAction(currentStatus, action)) {
    errors.push(`${action} is not allowed from ${currentStatus}`);
    return { valid: false, errors };
  }

  const metadata = LEAD_STATUS_ACTIONS[action];

  for (const requirement of metadata.requires) {
    if (requirement === "owner" && isBlank(owner)) {
      errors.push(`owner is required for ${action}`);
    }

    if (requirement === "notes" && isBlank(notes)) {
      errors.push(`notes is required for ${action}`);
    }

    if (requirement === "snoozeUntil") {
      if (isBlank(snoozeUntil)) {
        errors.push(`snoozeUntil is required for ${action}`);
      } else if (!isDateOnly(snoozeUntil)) {
        errors.push("snoozeUntil must use YYYY-MM-DD format");
      }
    }

    if (requirement === "correctionReason" && isBlank(correctionReason)) {
      errors.push(`correctionReason is required for ${action}`);
    }

    if (requirement === "corrections" && (!Array.isArray(corrections) || corrections.length === 0)) {
      errors.push(`corrections is required for ${action}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function createLeadStatusMutation(options = {}) {
  const validation = validateLeadStatusAction(options);

  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }

  const {
    leadId,
    currentStatus,
    action,
    owner,
    notes,
    snoozeUntil,
    corrections,
    correctionReason
  } = options;
  const metadata = LEAD_STATUS_ACTIONS[action];
  const body = {
    status: resolveResultStatus(metadata.resultStatus, currentStatus)
  };

  if (!isBlank(owner)) {
    body.owner = owner;
  }

  if (!isBlank(notes)) {
    body.notes = notes;
  }

  if (!isBlank(snoozeUntil)) {
    body.snoozeDate = snoozeUntil;
  }

  if (Array.isArray(corrections) && corrections.length > 0) {
    body.corrections = corrections;
  }

  if (!isBlank(correctionReason)) {
    body.correctionReason = correctionReason;
  }

  return {
    method: "PATCH",
    path: `/api/leads/${leadId}`,
    body
  };
}

export function createLeadFieldCorrection({
  field,
  originalAiValue,
  originalSourceValue,
  correctedValue,
  correctedBy,
  reason
} = {}) {
  const missing = [];

  for (const [name, value] of [
    ["field", field],
    ["correctedBy", correctedBy],
    ["reason", reason]
  ]) {
    if (isBlank(value)) {
      missing.push(name);
    }
  }

  if (originalAiValue === undefined) {
    missing.push("originalAiValue");
  }

  if (originalSourceValue === undefined || originalSourceValue === null || originalSourceValue === "") {
    missing.push("originalSourceValue");
  }

  if (correctedValue === undefined || correctedValue === null || correctedValue === "") {
    missing.push("correctedValue");
  }

  if (missing.length > 0) {
    throw new Error(`Correction is missing ${missing.join(", ")}`);
  }

  return {
    field,
    correctedValue,
    originalAiValue,
    originalSourceValue,
    actor: correctedBy,
    reason
  };
}

function resolveResultStatus(resultStatus, currentStatus) {
  return resultStatus === "current" ? currentStatus : resultStatus;
}

function isBlank(value) {
  return typeof value !== "string" ? value === undefined || value === null : value.trim() === "";
}

function isDateOnly(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
