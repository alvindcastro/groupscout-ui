export const SOFT_BASE_CSS = `:root {
  color-scheme: light;
  --color-background: #E0E5EC;
  --color-foreground: #3D4852;
  --color-muted: #6B7280;
  --color-accent: #6C63FF;
  --color-accent-light: #8B84FF;
  --color-accent-secondary: #38B2AC;
  --color-destructive: #B42318;
  --color-placeholder: #A0AEC0;
  --font-display: "Plus Jakarta Sans", "DM Sans", system-ui, sans-serif;
  --font-body: "DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --shadow-extruded: 9px 9px 16px rgb(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5);
  --shadow-extruded-hover: 12px 12px 20px rgb(163, 177, 198, 0.7), -12px -12px 20px rgba(255, 255, 255, 0.6);
  --shadow-extruded-sm: 5px 5px 10px rgb(163, 177, 198, 0.6), -5px -5px 10px rgba(255, 255, 255, 0.5);
  --shadow-inset: inset 6px 6px 10px rgb(163, 177, 198, 0.6), inset -6px -6px 10px rgba(255, 255, 255, 0.5);
  --shadow-inset-deep: inset 10px 10px 20px rgb(163, 177, 198, 0.7), inset -10px -10px 20px rgba(255, 255, 255, 0.6);
  --shadow-inset-sm: inset 3px 3px 6px rgb(163, 177, 198, 0.6), inset -3px -3px 6px rgba(255, 255, 255, 0.5);
  --shadow-accent-inset: inset 4px 4px 8px rgba(43, 38, 143, 0.35), inset -4px -4px 8px rgba(255, 255, 255, 0.22);
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
  scroll-behavior: smooth;
  background: var(--color-background);
}

body {
  min-height: 100vh;
  margin: 0;
  color: var(--color-foreground);
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.6;
  background: var(--color-background);
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
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  box-shadow: var(--shadow-extruded-sm);
}`;
