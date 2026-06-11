import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

import { designTokens } from "../web/src/design/tokens.js";

async function readDesignMarkdown() {
  const docsRoot = process.env.GROUPSCOUT_UI_DOCS_ROOT || "/mnt/c/Users/alvin/groupscout-site/frontend";
  const candidates = [
    new URL("../DESIGN.md", import.meta.url),
    new URL("DESIGN.md", pathToFileURL(`${docsRoot.replace(/\/$/, "")}/`))
  ];

  for (const candidate of candidates) {
    try {
      return await readFile(candidate, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return null;
}

function designValue(designMarkdown, path) {
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

test("design tokens expose the active neumorphic color, spacing, radius, and shadow values verbatim", async (t) => {
  const designMarkdown = await readDesignMarkdown();
  if (!designMarkdown) {
    t.skip("centralized DESIGN.md is not mounted");
    return;
  }
  if (!designMarkdown.includes("soft-colors:")) {
    t.skip("centralized DESIGN.md does not define legacy soft token sections");
    return;
  }

  assert.equal(designTokens.colors.background, designValue(designMarkdown, "soft-colors.background"));
  assert.equal(designTokens.colors.foreground, designValue(designMarkdown, "soft-colors.foreground"));
  assert.equal(designTokens.colors.accent, designValue(designMarkdown, "soft-colors.accent"));
  assert.equal(designTokens.colors.accentLight, designValue(designMarkdown, "soft-colors.accentLight"));
  assert.equal(designTokens.colors.accentSecondary, designValue(designMarkdown, "soft-colors.accentSecondary"));
  assert.equal(designTokens.colors.border, designValue(designMarkdown, "soft-colors.border"));
  assert.equal(designTokens.effects.extruded, designValue(designMarkdown, "soft-effects.extruded"));
  assert.equal(designTokens.effects.insetDeep, designValue(designMarkdown, "soft-effects.insetDeep"));
  assert.equal(designTokens.spacing.md, designValue(designMarkdown, "spacing.md"));
  assert.equal(designTokens.rounded.container, "32px");
});

test("component tokens preserve named contracts while mapping them to the neumorphic system", () => {
  assert.equal(designTokens.components["button-primary"].backgroundColor, "{colors.accent}");
  assert.equal(designTokens.components["button-primary"].rounded, "{rounded.base}");
  assert.equal(designTokens.components["button-primary"].shadow, "{effects.extrudedSmall}");
  assert.equal(designTokens.components["button-secondary"].border, "0");
  assert.equal(designTokens.components["button-secondary"].shadow, "{effects.extrudedSmall}");
  assert.equal(designTokens.components["text-input"].height, "48px");
  assert.equal(designTokens.components["text-input"].focusShadow, "{effects.insetDeep}");
  assert.equal(designTokens.components["search-pill"].height, "44px");
  assert.equal(designTokens.components["search-pill"].shadow, "{effects.insetSmall}");
  assert.equal(designTokens.components["segmented-tab-active"].border, "0");
  assert.equal(designTokens.components["badge-tag"].textColor, "{colors.accent}");
  assert.equal(designTokens.components["badge-type"].typography, "{typography.code-sm}");
  assert.equal(designTokens.components["card-base"].padding, "{spacing.xl}");
  assert.equal(designTokens.components["card-base"].rounded, "{rounded.container}");
  assert.equal(designTokens.components["card-base"].shadow, "{effects.extruded}");
  assert.equal(designTokens.components["code-inline"].typography, "{typography.code-inline}");
  assert.equal(
    designTokens.components["feature-comparison-table"].border,
    "0"
  );
  assert.equal(
    designTokens.components["property-row"].border,
    "0"
  );
  assert.equal(designTokens.components["sidebar-nav-item-active"].shadow, "{effects.insetSmall}");
});
