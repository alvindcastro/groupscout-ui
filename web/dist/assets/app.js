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
      '<div class="app-shell cyber-shell" data-renderer="static-dom">',
      '<nav class="cyber-nav" aria-label="Primary"><div class="cyber-brand">GroupScout<small>operator console</small></div><div class="cyber-nav-links"><a href="/">Today</a><a href="/leads" aria-current="page">Leads</a></div></nav>',
      '<section class="cyber-main cyber-detail" data-layout="desktop-evidence-workspace">',
      '<header class="cyber-hero"><div class="cyber-kicker cyber-cursor">Evidence workspace</div><h1 class="cyber-title cyber-glitch" data-text="Riverside hotel renovation crew block">Riverside hotel renovation crew block</h1><p class="cyber-subtitle">Keep source evidence and AI enrichment visible together.</p></header>',
      '<section class="cyber-terminal"><h2 class="cyber-label">Source Evidence</h2></section>',
      '<section class="cyber-panel"><h2 class="cyber-label">AI Enrichment</h2></section>',
      '</section>',
      '</div>'
    ].join("");
  }

  if (pathname === "/leads") {
    return [
      '<div class="app-shell cyber-shell" data-renderer="static-dom">',
      '<nav class="cyber-nav" aria-label="Primary"><div class="cyber-brand">GroupScout<small>operator console</small></div><div class="cyber-nav-links"><a href="/">Today</a><a href="/leads" aria-current="page">Leads</a></div></nav>',
      '<section class="cyber-main cyber-screen" data-layout="desktop-table">',
      '<header class="cyber-hero"><div class="cyber-kicker cyber-cursor">Lead acquisition</div><h1 class="cyber-title cyber-glitch" data-text="Lead Inbox">Lead Inbox</h1><p class="cyber-subtitle">Filter high-intent crew lodging demand.</p></header>',
      '<form class="cyber-controls" aria-label="Lead filters"><label class="cyber-field">Search leads<span class="cyber-field-inner"><input class="cyber-input" type="search" aria-label="Search leads" name="q"></span></label></form>',
      '<div class="cyber-table-wrap"><table class="cyber-table"><caption>Lead Inbox leads</caption><tbody><tr><td><a href="/leads/lead_hotel_001">Riverside hotel renovation crew block</a></td></tr></tbody></table></div>',
      '</section>',
      '</div>'
    ].join("");
  }

  return [
    '<div class="app-shell cyber-shell" data-renderer="static-dom">',
    '<nav class="cyber-nav" aria-label="Primary"><div class="cyber-brand">GroupScout<small>operator console</small></div><div class="cyber-nav-links"><a href="/" aria-current="page">Today</a><a href="/leads">Leads</a></div></nav>',
    '<section class="cyber-main cyber-screen" data-layout="desktop-command-center">',
    '<header class="cyber-hero"><div class="cyber-kicker cyber-cursor">Command feed</div><h1 class="cyber-title cyber-glitch" data-text="Today">Today</h1><p class="cyber-subtitle">GroupScout operator workspace</p></header>',
    '<section class="cyber-terminal"><p class="cyber-cursor">High-score leads and operational risk signals online.</p></section>',
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
