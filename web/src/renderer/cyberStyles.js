export const CYBER_STYLE_CSS = `:root {
  color-scheme: dark;
  --color-background: #0a0a0f;
  --color-foreground: #e0e0e0;
  --color-card: #12121a;
  --color-muted: #1c1c2e;
  --color-muted-foreground: #6b7280;
  --color-accent: #00ff88;
  --color-accent-secondary: #ff00ff;
  --color-accent-tertiary: #00d4ff;
  --color-border: #2a2a3a;
  --color-input: #12121a;
  --color-ring: #00ff88;
  --color-destructive: #ff3366;
  --shadow-neon: 0 0 5px #00ff88, 0 0 10px #00ff8840;
  --shadow-neon-sm: 0 0 3px #00ff88, 0 0 6px #00ff8830;
  --shadow-neon-lg: 0 0 10px #00ff88, 0 0 20px #00ff8860, 0 0 40px #00ff8830;
  --shadow-neon-secondary: 0 0 5px #ff00ff, 0 0 20px #ff00ff60;
  --shadow-neon-tertiary: 0 0 5px #00d4ff, 0 0 20px #00d4ff60;
  --font-heading: "Orbitron", "Share Tech Mono", monospace;
  --font-body: "JetBrains Mono", "Fira Code", Consolas, monospace;
  --font-label: "Share Tech Mono", monospace;
  --clip-chamfer: polygon(0 10px, 10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px));
  --clip-chamfer-sm: polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px));
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
  background: var(--color-background);
}

body {
  min-height: 100vh;
  margin: 0;
  color: var(--color-foreground);
  font-family: var(--font-body);
  line-height: 1.6;
  background:
    radial-gradient(circle at 15% 10%, rgba(255, 0, 255, 0.14), transparent 28rem),
    radial-gradient(circle at 85% 0%, rgba(0, 212, 255, 0.12), transparent 26rem),
    linear-gradient(rgba(0, 255, 136, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.035) 1px, transparent 1px),
    var(--color-background);
  background-size: auto, auto, 50px 50px, 50px 50px, auto;
}

body::before {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  content: "";
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.3) 2px,
    rgba(0, 0, 0, 0.3) 4px
  );
  opacity: 0.45;
  mix-blend-mode: multiply;
}

body::after {
  position: fixed;
  inset: 0;
  z-index: 49;
  pointer-events: none;
  content: "";
  background-image:
    linear-gradient(90deg, transparent 0 24%, rgba(0, 255, 136, 0.08) 24% 25%, transparent 25% 49%, rgba(0, 212, 255, 0.07) 49% 50%, transparent 50%),
    linear-gradient(0deg, transparent 0 68%, rgba(255, 0, 255, 0.08) 68% 69%, transparent 69%);
  background-size: 240px 160px;
  opacity: 0.16;
}

a {
  color: inherit;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

:focus-visible {
  outline: 2px solid var(--color-ring);
  outline-offset: 3px;
  box-shadow: var(--shadow-neon-sm);
}

.app-shell,
.cyber-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
  isolation: isolate;
}

.cyber-nav {
  position: sticky;
  top: 0;
  align-self: start;
  min-height: 100vh;
  padding: 24px 16px;
  border-right: 1px solid rgba(0, 255, 136, 0.2);
  background: linear-gradient(180deg, rgba(18, 18, 26, 0.96), rgba(10, 10, 15, 0.92));
  box-shadow: inset -1px 0 0 rgba(255, 0, 255, 0.15);
}

.cyber-brand {
  display: grid;
  gap: 4px;
  margin-bottom: 28px;
  color: var(--color-accent);
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  text-shadow: -1px 0 var(--color-accent-secondary), 1px 0 var(--color-accent-tertiary), 0 0 12px rgba(0, 255, 136, 0.4);
}

.cyber-brand small {
  color: var(--color-muted-foreground);
  font-family: var(--font-label);
  font-size: 11px;
  letter-spacing: 0.2em;
}

.cyber-nav-links {
  display: grid;
  gap: 8px;
}

.cyber-nav a {
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 10px 12px;
  color: var(--color-muted-foreground);
  font-family: var(--font-label);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-decoration: none;
  text-transform: uppercase;
  border: 1px solid transparent;
  clip-path: var(--clip-chamfer-sm);
  transition: all 100ms steps(4);
}

.cyber-nav a::before {
  content: ">";
  margin-right: 8px;
  color: var(--color-accent);
  opacity: 0.7;
}

.cyber-nav a:hover,
.cyber-nav a[aria-current="page"] {
  color: var(--color-accent);
  border-color: rgba(0, 255, 136, 0.42);
  background: rgba(0, 255, 136, 0.08);
  box-shadow: var(--shadow-neon-sm);
}

.cyber-main {
  min-width: 0;
  padding: 32px;
}

.cyber-screen,
.cyber-detail {
  width: min(100%, 1240px);
  display: grid;
  gap: 24px;
}

.cyber-hero {
  display: grid;
  gap: 12px;
  padding: 24px 0 8px;
}

.cyber-kicker,
.cyber-label {
  color: var(--color-accent-tertiary);
  font-family: var(--font-label);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.cyber-title {
  margin: 0;
  color: var(--color-foreground);
  font-family: var(--font-heading);
  font-size: clamp(2.5rem, 8vw, 5.5rem);
  font-weight: 900;
  line-height: 1.02;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  filter: drop-shadow(0 0 20px rgba(0, 255, 136, 0.28));
}

.cyber-subtitle {
  max-width: 74ch;
  margin: 0;
  color: #9ca3af;
}

.cyber-cursor::after {
  content: "_";
  color: var(--color-accent);
  animation: blink 1s step-end infinite;
}

.cyber-glitch {
  position: relative;
  text-shadow: -2px 0 var(--color-accent-secondary), 2px 0 var(--color-accent-tertiary);
  animation: rgbShift 4s steps(2, end) infinite;
}

.cyber-glitch::before,
.cyber-glitch::after {
  position: absolute;
  inset: 0;
  overflow: hidden;
  content: attr(data-text);
  opacity: 0.35;
  pointer-events: none;
}

.cyber-glitch::before {
  color: var(--color-accent-secondary);
  clip-path: inset(0 0 55% 0);
  transform: translate(-2px, 0);
}

.cyber-glitch::after {
  color: var(--color-accent-tertiary);
  clip-path: inset(55% 0 0 0);
  transform: translate(2px, 0);
}

.cyber-grid,
.cyber-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.cyber-panel,
.cyber-card,
.cyber-terminal,
.cyber-table-wrap {
  position: relative;
  border: 1px solid var(--color-border);
  background: rgba(18, 18, 26, 0.9);
  clip-path: var(--clip-chamfer);
  box-shadow: inset 0 0 0 1px rgba(0, 255, 136, 0.04);
}

.cyber-panel,
.cyber-card {
  padding: 20px;
}

.cyber-panel:hover,
.cyber-card:hover {
  border-color: rgba(0, 255, 136, 0.5);
  box-shadow: var(--shadow-neon);
  transform: translateY(-1px);
}

.cyber-card strong,
.cyber-card a {
  color: var(--color-accent);
}

.cyber-metric {
  display: grid;
  gap: 8px;
  min-height: 112px;
}

.cyber-metric-value {
  color: var(--color-accent);
  font-family: var(--font-heading);
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
  text-shadow: var(--shadow-neon-sm);
}

.cyber-terminal {
  padding: 48px 20px 20px;
  background: rgba(5, 5, 8, 0.92);
}

.cyber-terminal::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 32px;
  content: "";
  border-bottom: 1px solid var(--color-border);
  background:
    radial-gradient(circle at 18px 16px, #ff3366 0 4px, transparent 5px),
    radial-gradient(circle at 36px 16px, #f5d742 0 4px, transparent 5px),
    radial-gradient(circle at 54px 16px, #00ff88 0 4px, transparent 5px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.08), transparent);
}

.cyber-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.cyber-field {
  display: grid;
  gap: 6px;
  color: var(--color-muted-foreground);
  font-family: var(--font-label);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.cyber-field-inner {
  position: relative;
}

.cyber-field-inner::before {
  position: absolute;
  top: 50%;
  left: 12px;
  color: var(--color-accent);
  content: ">";
  transform: translateY(-50%);
}

.cyber-input,
.cyber-select {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px 10px 30px;
  color: var(--color-accent);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-input);
  clip-path: var(--clip-chamfer-sm);
  transition: all 100ms steps(4);
}

.cyber-input::placeholder {
  color: var(--color-muted-foreground);
}

.cyber-input:focus,
.cyber-select:focus {
  border-color: var(--color-accent);
  outline: none;
  box-shadow: var(--shadow-neon-sm);
}

.cyber-button {
  min-height: 44px;
  padding: 10px 18px;
  color: var(--color-accent);
  font-family: var(--font-label);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  border: 2px solid var(--color-accent);
  background: transparent;
  clip-path: var(--clip-chamfer-sm);
  transition: all 100ms steps(4);
}

.cyber-button:hover {
  color: var(--color-background);
  background: var(--color-accent);
  box-shadow: var(--shadow-neon);
}

.cyber-button-secondary {
  color: var(--color-accent-secondary);
  border-color: var(--color-accent-secondary);
}

.cyber-button-secondary:hover {
  color: var(--color-background);
  background: var(--color-accent-secondary);
  box-shadow: var(--shadow-neon-secondary);
}

.cyber-chip {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  width: fit-content;
  padding: 3px 8px;
  color: var(--color-accent-tertiary);
  font-family: var(--font-label);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid rgba(0, 212, 255, 0.35);
  background: rgba(0, 212, 255, 0.1);
}

.cyber-table-wrap {
  overflow-x: auto;
}

.cyber-table {
  width: 100%;
  min-width: 840px;
  border-collapse: collapse;
}

.cyber-table caption {
  padding: 14px 16px;
  color: var(--color-accent-tertiary);
  font-family: var(--font-label);
  font-weight: 700;
  letter-spacing: 0.16em;
  text-align: left;
  text-transform: uppercase;
}

.cyber-table th,
.cyber-table td {
  padding: 13px 16px;
  border-top: 1px solid rgba(0, 255, 136, 0.16);
  text-align: left;
  vertical-align: top;
}

.cyber-table th {
  color: var(--color-accent);
  font-family: var(--font-label);
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.cyber-table td {
  color: var(--color-foreground);
  font-size: 13px;
}

.cyber-table tbody tr:hover {
  background: rgba(0, 255, 136, 0.06);
}

.cyber-status {
  padding: 12px 16px;
  color: var(--color-accent);
  border: 1px solid rgba(0, 255, 136, 0.35);
  background: rgba(0, 255, 136, 0.08);
  clip-path: var(--clip-chamfer-sm);
}

.cyber-alert {
  color: var(--color-destructive);
  border-color: rgba(255, 51, 102, 0.5);
  background: rgba(255, 51, 102, 0.08);
}

.cyber-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cyber-row {
  display: grid;
  gap: 4px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 255, 136, 0.16);
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@keyframes rgbShift {
  0%,
  100% {
    text-shadow: -2px 0 var(--color-accent-secondary), 2px 0 var(--color-accent-tertiary);
  }

  50% {
    text-shadow: 2px 0 var(--color-accent-secondary), -2px 0 var(--color-accent-tertiary);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
  }
}

@media (max-width: 820px) {
  .app-shell,
  .cyber-shell {
    grid-template-columns: 1fr;
  }

  .cyber-nav {
    position: relative;
    min-height: auto;
    border-right: 0;
    border-bottom: 1px solid rgba(0, 255, 136, 0.2);
  }

  .cyber-nav-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cyber-main {
    padding: 20px;
  }

  .cyber-title {
    font-size: clamp(2.25rem, 15vw, 4.5rem);
  }
}
`;
