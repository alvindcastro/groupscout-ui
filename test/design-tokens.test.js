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

test("design tokens expose the required Mintlify color, spacing, and radius values verbatim", () => {
  assert.equal(designTokens.colors.primary, designValue("colors.primary"));
  assert.equal(designTokens.colors["brand-green"], designValue("colors.brand-green"));
  assert.equal(designTokens.colors.hairline, designValue("colors.hairline"));
  assert.equal(designTokens.spacing.md, designValue("spacing.md"));
  assert.equal(designTokens.rounded.full, designValue("rounded.full"));
});

test("component tokens preserve the named DESIGN.md component contracts", () => {
  assert.equal(designTokens.components["button-primary"].backgroundColor, "{colors.primary}");
  assert.equal(designTokens.components["button-primary"].rounded, "{rounded.full}");
  assert.equal(designTokens.components["text-input"].height, "40px");
  assert.equal(designTokens.components["segmented-tab-active"].border, "0 0 2px {colors.ink} solid");
  assert.equal(designTokens.components["sidebar-nav-item-active"].backgroundColor, "{colors.surface}");
});
