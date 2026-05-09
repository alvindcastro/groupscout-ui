export function appendDefinedQueryParams(searchParams, query) {
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }
}

export function assertLeadId(leadId) {
  if (typeof leadId !== "string" || leadId.length === 0) {
    throw new TypeError("Lead id must be a non-empty string");
  }
}

export function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function isBlankValue(value) {
  return value === undefined || value === null || value === "";
}
