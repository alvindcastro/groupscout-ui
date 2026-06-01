export const SOFT_TABLE_CSS = `.soft-table-wrap {
  overflow-x: auto;
}

.soft-table {
  width: 100%;
  min-width: 840px;
  border-collapse: separate;
  border-spacing: 0 10px;
  padding: 12px;
}

.soft-table caption {
  padding: 10px 14px 16px;
  color: var(--color-muted);
  font-weight: 800;
  text-align: left;
}

.soft-table th,
.soft-table td {
  padding: 14px 16px;
  text-align: left;
  vertical-align: top;
}

.soft-table th {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.soft-table td {
  color: var(--color-foreground);
  font-size: 13px;
  background: var(--color-background);
  box-shadow: var(--shadow-inset-sm);
}

.soft-table td:first-child {
  border-radius: 16px 0 0 16px;
}

.soft-table td:last-child {
  border-radius: 0 16px 16px 0;
}

.soft-status {
  padding: 14px 18px;
  color: var(--color-accent-secondary);
  border: 0;
  border-radius: 16px;
  background: var(--color-background);
  box-shadow: var(--shadow-inset-sm);
}

.soft-alert {
  color: var(--color-destructive);
}

.soft-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.soft-row {
  display: grid;
  gap: 5px;
  padding: 14px;
  border-radius: 16px;
  background: var(--color-background);
  box-shadow: var(--shadow-inset-sm);
}`;
