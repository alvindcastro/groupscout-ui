import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { designTokens } from "../web/src/design/tokens.js";

const designMarkdown = await readFile(new URL("../DESIGN.md", import.meta.url), "utf8");

function designValue(path) {
  const segments = path.split(".");
  let section = segments[0];
  let key = segments[1];
  let pattern = new RegExp(`^\\s+${key}:\\s+\"?([^\"\\n]+)\"?\\s*$`, "m");
  let sectionStart = designMarkdown.indexOf(`${section}:\n`);

  assert.notEqual(sectionStart, -1, `missing ${section} section in DESIGN.md`);

  let nextSection = designMarkdown
    .slice(sectionStart + section.length + 2)
    .search(/^[a-z][a-z-]+:\n/m);
  let sectionBody =
    nextSection === -1
      ? designMarkdown.slice(sectionStart)
      : designMarkdown.slice(sectionStart, sectionStart + section.length + 2 + nextSection);
  let match = sectionBody.match(pattern);

  assert.ok(match, `missing ${path} in DESIGN.md`);
  return match[1];
}

test("design tokens expose the active cyberpunk color, spacing, and radius values verbatim", () => {
  assert.equal(designTokens.colors.background, designValue("cyber-colors.background"));
  assert.equal(designTokens.colors.foreground, designValue("cyber-colors.foreground"));
  assert.equal(designTokens.colors.accent, designValue("cyber-colors.accent"));
  assert.equal(designTokens.colors.accentSecondary, designValue("cyber-colors.accentSecondary"));
  assert.equal(designTokens.colors.accentTertiary, designValue("cyber-colors.accentTertiary"));
  assert.equal(designTokens.colors.border, designValue("cyber-colors.border"));
  assert.equal(designTokens.effects["shadow-neon"], designValue("cyber-effects.shadow-neon"));
  assert.equal(designTokens.effects["clip-chamfer"], designValue("cyber-effects.clip-chamfer"));
  assert.equal(designTokens.spacing.md, designValue("spacing.md"));
  assert.equal(designTokens.rounded.chamfer, "10px");
});

test("component tokens preserve named contracts while mapping them to the cyberpunk system", () => {
  assert.equal(designTokens.components["button-primary"].backgroundColor, "{colors.accent}");
  assert.equal(designTokens.components["button-primary"].rounded, "{rounded.none}");
  assert.equal(designTokens.components["button-primary"].clipPath, "{effects.clip-chamfer-sm}");
  assert.equal(designTokens.components["button-secondary"].border, "2px solid {colors.accentSecondary}");
  assert.equal(designTokens.components["text-input"].height, "44px");
  assert.equal(designTokens.components["text-input"].focusShadow, "{effects.shadow-neon-sm}");
  assert.equal(designTokens.components["search-pill"].height, "44px");
  assert.equal(designTokens.components["segmented-tab-active"].border, "0 0 2px {colors.accent} solid");
  assert.equal(designTokens.components["badge-tag"].textColor, "{colors.accentTertiary}");
  assert.equal(designTokens.components["badge-type"].typography, "{typography.code-sm}");
  assert.equal(designTokens.components["card-base"].padding, "{spacing.xl}");
  assert.equal(designTokens.components["card-base"].clipPath, "{effects.clip-chamfer}");
  assert.equal(designTokens.components["code-inline"].typography, "{typography.code-inline}");
  assert.equal(
    designTokens.components["feature-comparison-table"].border,
    "1px solid {colors.border}"
  );
  assert.equal(
    designTokens.components["property-row"].border,
    "0 0 1px rgba(0, 255, 136, 0.18) solid"
  );
  assert.equal(designTokens.components["sidebar-nav-item-active"].backgroundColor, "rgba(0, 255, 136, 0.1)");
});
