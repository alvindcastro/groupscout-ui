const root = document.querySelector("#app");

function createApiClient(fetchImpl = fetch) {
  return {
    getSystem() {
      return fetchImpl("/api/system", {
        credentials: "same-origin",
        headers: { accept: "application/json" }
      });
    }
  };
}

function render(pathname = window.location.pathname) {
  if (pathname.startsWith("/leads/")) {
    return [
      '<div class="app-shell soft-shell" data-renderer="static-dom">',
      '<nav class="soft-nav" aria-label="Primary"><div class="soft-brand">GroupScout<small>operator console</small></div><div class="soft-nav-links"><a href="/">Today</a><a href="/leads" aria-current="page">Leads</a></div></nav>',
      '<section class="soft-main soft-detail" data-layout="desktop-evidence-workspace">',
      '<header class="soft-hero"><div class="soft-kicker">Evidence workspace</div><h1 class="soft-title">Riverside hotel renovation crew block</h1><p class="soft-subtitle">Keep source evidence and AI enrichment visible together.</p></header>',
      '<section class="soft-terminal"><h2 class="soft-label">Source Evidence</h2></section>',
      '<section class="soft-panel"><h2 class="soft-label">AI Enrichment</h2></section>',
      '</section>',
      '</div>'
    ].join("");
  }

  if (pathname === "/leads") {
    return [
      '<div class="app-shell soft-shell" data-renderer="static-dom">',
      '<nav class="soft-nav" aria-label="Primary"><div class="soft-brand">GroupScout<small>operator console</small></div><div class="soft-nav-links"><a href="/">Today</a><a href="/leads" aria-current="page">Leads</a></div></nav>',
      '<section class="soft-main soft-screen" data-layout="desktop-table">',
      '<header class="soft-hero"><div class="soft-kicker">Lead acquisition</div><h1 class="soft-title">Lead Inbox</h1><p class="soft-subtitle">Filter high-intent crew lodging demand.</p></header>',
      '<form class="soft-controls" aria-label="Lead filters"><label class="soft-field">Search leads<span class="soft-field-inner"><input class="soft-input" type="search" aria-label="Search leads" name="q"></span></label></form>',
      '<div class="soft-table-wrap"><table class="soft-table"><caption>Lead Inbox leads</caption><tbody><tr><td><a href="/leads/lead_hotel_001">Riverside hotel renovation crew block</a></td></tr></tbody></table></div>',
      '</section>',
      '</div>'
    ].join("");
  }

  return [
    '<div class="app-shell soft-shell" data-renderer="static-dom">',
    '<nav class="soft-nav" aria-label="Primary"><div class="soft-brand">GroupScout<small>operator console</small></div><div class="soft-nav-links"><a href="/" aria-current="page">Today</a><a href="/leads">Leads</a></div></nav>',
    '<section class="soft-main soft-screen" data-layout="desktop-command-center">',
    '<header class="soft-hero"><div class="soft-kicker">Command feed</div><h1 class="soft-title">Today</h1><p class="soft-subtitle">GroupScout operator workspace</p></header>',
    '<section class="soft-terminal"><p >High-score leads and operational risk signals online.</p></section>',
    '</section>',
    '</div>'
  ].join("");
}

if (root) {
  root.innerHTML = render();
}

export async function loadSystemSummary(fetchImpl = fetch) {
  const response = await createApiClient(fetchImpl).getSystem();

  if (!response.ok) {
    throw new Error(`System summary request failed with status ${response.status}`);
  }

  return response.json();
}
