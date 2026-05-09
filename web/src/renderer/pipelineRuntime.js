const PIPELINE_POLL_INTERVAL_MS = 2000;
const PIPELINE_MAX_POLLS = 60;

export function attachPipelineMonitor() {
  if (window.location.pathname !== "/pipeline") {
    return;
  }

  const startButton = document.querySelector('[data-pipeline-action="start"]');
  const refreshButton = document.querySelector('[data-pipeline-action="refresh"]');

  startButton?.addEventListener("click", () => startPipelineRun(startButton));
  refreshButton?.addEventListener("click", () => refreshPipelineHistory());
}

async function startPipelineRun(button) {
  const feedback = showPipelineFeedback("Starting pipeline run...", 18);
  appendPipelineLog("Sending POST /api/pipeline/runs");
  button.disabled = true;

  try {
    const response = await fetch("/api/pipeline/runs", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ reason: "manual_operator_run", actor: "browser_operator" })
    });
    const payload = await readJson(response);

    if (!response.ok) {
      throw new Error(payload?.error || `Pipeline run request failed with status ${response.status}`);
    }

    const runId = payload.run_id || payload.id || "unknown";
    setPipelineStatus(`Run accepted: ${payload.status || "running"}`, runId, 42);
    appendPipelineLog(`Backend accepted run ${runId}`);
    appendPipelineLog(payload.started_at ? `Started at ${payload.started_at}` : "Backend queued the run");
    await pollPipelineRun(runId);
  } catch (error) {
    setPipelineStatus("Run request failed", "", 100);
    feedback.classList.add("is-error");
    appendPipelineLog(error.message || String(error));
  } finally {
    button.disabled = false;
  }
}

async function refreshPipelineHistory() {
  showPipelineFeedback("Refreshing pipeline history...", 25);
  appendPipelineLog("Fetching GET /api/pipeline/runs?limit=5");

  try {
    const payload = await fetchPipelineRuns();
    const runs = normalizeRuns(payload);
    appendPipelineLog(`History returned ${runs.length} run(s)`);

    const latest = runs[0];
    if (!latest) {
      setPipelineStatus("History refreshed; no runs returned", "", 100);
      return;
    }

    const latestRunId = getRunId(latest);
    const latestStatus = getRunStatus(latest);
    setPipelineStatus(`Latest run: ${latestStatus}`, latestRunId, ["succeeded", "failed"].includes(latestStatus) ? 100 : 55);

    if (latestStatus === "succeeded") {
      await loadPipelineOutput(latestRunId);
    }
  } catch (error) {
    setPipelineStatus("History refresh failed", "", 100);
    appendPipelineLog(error.message || String(error));
  }
}

async function pollPipelineRun(runId) {
  for (let attempt = 1; attempt <= PIPELINE_MAX_POLLS; attempt += 1) {
    await delay(PIPELINE_POLL_INTERVAL_MS);
    const payload = await fetchPipelineRuns();
    const runs = normalizeRuns(payload);
    const run = runs.find((item) => getRunId(item) === runId);
    const percent = Math.min(96, 42 + attempt);

    if (!run) {
      setPipelineStatus("Run accepted; waiting for history row", runId, percent);
      appendPollLog(attempt, "run not listed yet");
      continue;
    }

    const status = getRunStatus(run);
    setPipelineStatus(`Run status: ${status}`, runId, percent);
    appendPollLog(attempt, `backend reports ${status}`);

    if (["succeeded", "failed"].includes(status)) {
      setPipelineStatus(`Run ${status}`, runId, 100);
      if (status === "succeeded") {
        try {
          await loadPipelineOutput(runId);
        } catch (error) {
          setPipelineStatus("Run complete; Slack output failed to load", runId, 100);
          appendPipelineLog(error.message || String(error));
        }
      } else {
        appendPipelineLog("Run failed before Slack output could be rendered.");
      }
      return;
    }
  }

  setPipelineStatus("Run still in progress; polling paused", runId, 96);
  appendPipelineLog("Polling paused after 2 minutes. Use Refresh history to check the latest backend status and load any Slack output.");
}

async function fetchPipelineRuns() {
  const response = await fetch("/api/pipeline/runs?limit=5", {
    headers: { accept: "application/json" },
    cache: "no-store"
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error(payload?.error || `Pipeline history request failed with status ${response.status}`);
  }

  return payload;
}

async function loadPipelineOutput(runId) {
  setPipelineStatus("Loading Slack output...", runId, 96);
  appendPipelineLog("Loading the notified leads used for the Slack digest");

  const response = await fetch("/api/leads?status=notified&limit=10", {
    headers: { accept: "application/json" },
    cache: "no-store"
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error(payload?.error || `Slack output request failed with status ${response.status}`);
  }

  const leads = Array.isArray(payload?.items) ? payload.items : [];
  renderPipelineOutput(leads, runId);
  setPipelineStatus("Run complete; Slack output rendered", runId, 100);
  appendPipelineLog(`Rendered ${leads.length} lead(s) in the UI output panel`);
}

function renderPipelineOutput(leads, runId) {
  const panel = document.querySelector("#pipeline-output");
  const count = document.querySelector("#pipeline-output-count");
  const list = document.querySelector("#pipeline-output-list");

  if (!panel || !list) {
    return;
  }

  panel.hidden = false;
  list.innerHTML = "";

  if (count) {
    count.textContent = runId ? `Run ID: ${runId}` : "";
  }

  if (leads.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No notified leads were returned for the Slack output preview.";
    list.append(empty);
    return;
  }

  for (const lead of leads) {
    list.append(createSlackLeadCard(lead));
  }
}

function createSlackLeadCard(lead) {
  const card = document.createElement("article");
  card.className = "slack-lead-card";

  const title = document.createElement("h3");
  title.textContent = getLeadField(lead, "title", "Title") || "Untitled lead";
  card.append(title);

  const meta = document.createElement("div");
  meta.className = "slack-lead-meta";
  for (const value of [
    formatScore(getLeadField(lead, "priority_score", "priorityScore", "Score")),
    getLeadField(lead, "location", "Location"),
    getLeadField(lead, "source", "Source"),
    formatMoney(getLeadField(lead, "project_value", "projectValue", "ProjectValue"))
  ].filter(Boolean)) {
    const chip = document.createElement("span");
    chip.textContent = value;
    meta.append(chip);
  }
  card.append(meta);

  const reason = getLeadField(lead, "priority_reason", "priorityReason", "PriorityReason");
  if (reason) {
    const detail = document.createElement("p");
    detail.textContent = reason;
    card.append(detail);
  }

  const sourceUrl = getLeadField(lead, "audit_source_url", "auditSourceUrl", "AuditSourceURL");
  if (sourceUrl) {
    const link = document.createElement("a");
    link.href = sourceUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Open source evidence";
    card.append(link);
  }

  return card;
}

function getLeadField(lead, ...names) {
  for (const name of names) {
    if (lead?.[name] !== undefined && lead[name] !== null && lead[name] !== "") {
      return lead[name];
    }
  }
  return "";
}

function formatScore(value) {
  return value === "" ? "" : `Score ${value}`;
}

function formatMoney(value) {
  const amount = Number(value);

  if (value === "" || !Number.isFinite(amount) || amount === 0) {
    return "";
  }

  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function normalizeRuns(payload) {
  return Array.isArray(payload?.runs)
    ? payload.runs
    : Array.isArray(payload?.items)
      ? payload.items
      : [];
}

function getRunId(run) {
  return run.id || run.ID || run.run_id;
}

function getRunStatus(run) {
  return run.status || run.Status || "unknown";
}

function showPipelineFeedback(message, progress) {
  const feedback = document.querySelector("#pipeline-run-feedback");
  const log = document.querySelector("#pipeline-run-log");

  if (feedback) {
    feedback.hidden = false;
    feedback.classList.remove("is-error");
  }

  if (log) {
    log.innerHTML = "";
  }

  setPipelineStatus(message, "", progress);
  return feedback;
}

function setPipelineStatus(message, runId, progress) {
  const status = document.querySelector("#pipeline-run-status");
  const id = document.querySelector("#pipeline-run-id");
  const bar = document.querySelector("#pipeline-run-progress");

  if (status) status.textContent = message;
  if (id) id.textContent = runId ? `Run ID: ${runId}` : "";
  if (bar) bar.style.width = `${progress}%`;
}

function appendPipelineLog(message) {
  const log = document.querySelector("#pipeline-run-log");

  if (!log) {
    return;
  }

  const item = document.createElement("li");
  item.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  log.append(item);
}

function appendPollLog(attempt, message) {
  if (attempt <= 6 || attempt % 5 === 0) {
    appendPipelineLog(`Poll ${attempt}: ${message}`);
  }
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
