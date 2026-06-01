export const SOFT_LAYOUT_CSS = `.app-shell,
.soft-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(188px, 256px) minmax(0, 1fr);
  isolation: isolate;
}

.soft-nav {
  position: sticky;
  top: 0;
  align-self: start;
  min-height: 100vh;
  padding: 24px 18px;
  background: var(--color-background);
}

.soft-brand {
  display: grid;
  gap: 4px;
  margin-bottom: 28px;
  padding: 18px;
  color: var(--color-foreground);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.02em;
  border-radius: 24px;
  box-shadow: var(--shadow-extruded);
}

.soft-brand small {
  color: var(--color-muted);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.soft-nav-links {
  display: grid;
  gap: 12px;
}

.soft-nav a {
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  border: 0;
  border-radius: 16px;
  background: var(--color-background);
  box-shadow: var(--shadow-extruded-sm);
  transition: transform 300ms ease-out, box-shadow 300ms ease-out, color 300ms ease-out;
}

.soft-nav a:hover {
  color: var(--color-foreground);
  transform: translateY(-1px);
  box-shadow: var(--shadow-extruded-hover);
}

.soft-nav a[aria-current="page"] {
  color: var(--color-accent);
  box-shadow: var(--shadow-inset-sm);
}

.soft-main {
  min-width: 0;
  padding: 32px;
}

.soft-screen,
.soft-detail {
  width: min(100%, 1240px);
  display: grid;
  gap: 28px;
}

.soft-hero {
  position: relative;
  display: grid;
  gap: 14px;
  padding: 32px;
  overflow: hidden;
  border-radius: 32px;
  background: var(--color-background);
  box-shadow: var(--shadow-extruded);
}

.soft-hero::after {
  position: absolute;
  top: 28px;
  right: 32px;
  width: 112px;
  height: 112px;
  content: "";
  border-radius: 9999px;
  background: var(--color-background);
  box-shadow: var(--shadow-inset-deep);
  animation: float 3s ease-in-out infinite;
}

.soft-kicker,
.soft-label {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.soft-title {
  position: relative;
  z-index: 1;
  max-width: 12ch;
  margin: 0;
  color: var(--color-foreground);
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.soft-subtitle {
  position: relative;
  z-index: 1;
  max-width: 74ch;
  margin: 0;
  color: var(--color-muted);
  font-size: 14px;
}

.soft-grid,
.soft-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}`;
