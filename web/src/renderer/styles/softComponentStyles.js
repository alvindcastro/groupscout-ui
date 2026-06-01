export const SOFT_COMPONENT_CSS = `.soft-panel,
.soft-card,
.soft-terminal,
.soft-table-wrap {
  position: relative;
  border: 0;
  border-radius: 32px;
  background: var(--color-background);
  box-shadow: var(--shadow-extruded);
  transition: transform 300ms ease-out, box-shadow 300ms ease-out;
}

.soft-panel,
.soft-card {
  padding: 24px;
}

.soft-panel:hover,
.soft-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-extruded-hover);
}

.soft-card strong,
.soft-card a,
.soft-row a {
  color: var(--color-accent);
}

.soft-metric {
  display: grid;
  gap: 12px;
  min-height: 124px;
}

.soft-metric-value {
  color: var(--color-foreground);
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
}

.soft-terminal {
  padding: 28px;
}

.soft-terminal::before {
  display: block;
  width: 68px;
  height: 16px;
  margin-bottom: 18px;
  content: "";
  border-radius: 9999px;
  background: var(--color-background);
  box-shadow: var(--shadow-inset-sm);
}

.soft-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.soft-field {
  display: grid;
  gap: 8px;
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 800;
}

.soft-field-inner {
  position: relative;
}

.soft-input,
.soft-select {
  width: 100%;
  min-height: 48px;
  padding: 12px 14px;
  color: var(--color-foreground);
  border: 0;
  border-radius: 16px;
  background: var(--color-background);
  box-shadow: var(--shadow-inset);
  transition: box-shadow 300ms ease-out, transform 300ms ease-out;
}

.soft-input::placeholder {
  color: var(--color-placeholder);
}

.soft-input:focus,
.soft-select:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  box-shadow: var(--shadow-inset-deep);
}

.soft-button {
  min-height: 48px;
  padding: 12px 20px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  border: 0;
  border-radius: 16px;
  background: var(--color-accent);
  box-shadow: var(--shadow-extruded-sm);
  transition: transform 300ms ease-out, box-shadow 300ms ease-out, background-color 300ms ease-out;
}

.soft-button:hover {
  transform: translateY(-1px);
  background: var(--color-accent-light);
  box-shadow: var(--shadow-extruded-hover);
}

.soft-button:active {
  transform: translateY(0.5px);
  box-shadow: var(--shadow-accent-inset);
}

.soft-button-secondary {
  color: var(--color-foreground);
  background: var(--color-background);
}

.soft-button-secondary:hover {
  color: var(--color-accent);
  background: var(--color-background);
}

.soft-button-secondary:active {
  box-shadow: var(--shadow-inset-sm);
}

.soft-chip {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  width: fit-content;
  padding: 4px 10px;
  color: var(--color-accent-secondary);
  font-size: 11px;
  font-weight: 800;
  border-radius: 9999px;
  background: var(--color-background);
  box-shadow: var(--shadow-inset-sm);
}`;
