---
version: alpha
name: Neumorphism Soft UI
description: GroupScout uses a cool-grey neumorphic operator workspace. The active surface is molded from #E0E5EC, with depth created by opposing translucent RGB shadows instead of borders or flat color blocks. The legacy token names remain as compatibility aliases for existing screen-model contracts, but the rendered UI follows the Soft UI token set below.

soft-colors:
  background: "#E0E5EC"
  foreground: "#3D4852"
  card: "#E0E5EC"
  muted: "#6B7280"
  accent: "#6C63FF"
  accentLight: "#8B84FF"
  accentSecondary: "#38B2AC"
  border: "transparent"
  input: "#E0E5EC"
  ring: "#6C63FF"
  destructive: "#B42318"
  placeholder: "#A0AEC0"

soft-typography:
  heading:
    fontFamily: "\"Plus Jakarta Sans\", \"DM Sans\", system-ui, sans-serif"
    fontWeight: 800
    letterSpacing: "-0.03em"
  body:
    fontFamily: "\"DM Sans\", system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    lineHeight: 1.6
  label:
    fontFamily: "\"DM Sans\", system-ui, sans-serif"
    fontWeight: 800

soft-effects:
  extruded: "9px 9px 16px rgb(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)"
  extrudedHover: "12px 12px 20px rgb(163, 177, 198, 0.7), -12px -12px 20px rgba(255, 255, 255, 0.6)"
  extrudedSmall: "5px 5px 10px rgb(163, 177, 198, 0.6), -5px -5px 10px rgba(255, 255, 255, 0.5)"
  inset: "inset 6px 6px 10px rgb(163, 177, 198, 0.6), inset -6px -6px 10px rgba(255, 255, 255, 0.5)"
  insetDeep: "inset 10px 10px 20px rgb(163, 177, 198, 0.7), inset -10px -10px 20px rgba(255, 255, 255, 0.6)"
  insetSmall: "inset 3px 3px 6px rgb(163, 177, 198, 0.6), inset -3px -3px 6px rgba(255, 255, 255, 0.5)"

soft-components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-primary}"
    border: "0"
    rounded: "{rounded.base}"
    shadow: "{effects.extrudedSmall}"
  button-secondary:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    border: "0"
    rounded: "{rounded.base}"
    shadow: "{effects.extrudedSmall}"
  text-input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    height: 48px
    shadow: "{effects.inset}"
  card-base:
    backgroundColor: "{colors.background}"
    border: "0"
    rounded: "{rounded.container}"
    shadow: "{effects.extruded}"
  feature-comparison-table:
    backgroundColor: "{colors.background}"
    border: "0"
    rounded: "{rounded.container}"
    shadow: "{effects.extruded}"
  property-row:
    border: "0"
    shadow: "{effects.insetSmall}"

colors:
  background: "#E0E5EC"
  foreground: "#3D4852"
  card: "#E0E5EC"
  muted: "#6B7280"
  accent: "#6C63FF"
  accentLight: "#8B84FF"
  accentSecondary: "#38B2AC"
  border: "transparent"
  input: "#E0E5EC"
  ring: "#6C63FF"
  destructive: "#B42318"
  primary: "#6C63FF"
  on-primary: "#ffffff"
  brand-green: "#38B2AC"
  brand-tag: "#6C63FF"
  brand-error: "#B42318"
  canvas: "#E0E5EC"
  surface: "#E0E5EC"
  hairline: "transparent"
  ink: "#3D4852"
  steel: "#6B7280"

rounded:
  xs: 12px
  sm: 12px
  base: 16px
  md: 16px
  lg: 32px
  xl: 32px
  xxl: 32px
  full: 9999px
  container: 32px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  xxxl: 40px
  section-sm: 48px
  section: 64px
  section-lg: 96px
  hero: 120px

components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-primary}"
    border: "0"
    rounded: "{rounded.base}"
    shadow: "{effects.extrudedSmall}"
  button-secondary:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    border: "0"
    rounded: "{rounded.base}"
    shadow: "{effects.extrudedSmall}"
  text-input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    height: 48px
    shadow: "{effects.inset}"
  search-pill:
    backgroundColor: "{colors.background}"
    textColor: "{colors.muted}"
    height: 44px
    shadow: "{effects.insetSmall}"
  card-base:
    backgroundColor: "{colors.background}"
    border: "0"
    rounded: "{rounded.container}"
    shadow: "{effects.extruded}"
---

## Overview

GroupScout's frontend is a dependency-free vanilla DOM renderer. The design system is implemented through:

- `web/src/design/tokens.js` for structured screen-model tokens.
- `web/src/renderer/softStyles.js` for the generated CSS bundle.
- `web/src/renderer/domRenderer.js` for semantic markup and shared class names.
- `web/src/renderer/buildStaticApp.js` for `web/dist` production assets.

The visual language is Soft UI / Neumorphism. Elements are molded from a single cool-grey material and differentiated through shadow depth.

## Visual Rules

- The page background, cards, inputs, navigation, and tables all use `#E0E5EC`.
- Edges come from box shadows, not borders.
- Raised elements use `extruded` shadows.
- Inputs, active navigation, chips, and table cells use inset shadows.
- Primary actions use violet sparingly.
- Success and positive indicators use teal.
- Text uses high-contrast blue-grey values for WCAG AA/AAA readability.

## Typography

Display headings use Plus Jakarta Sans where available, falling back to DM Sans and system sans fonts. Body and UI copy use DM Sans with system fallbacks. Font loading is not runtime-coupled; the app remains dependency-free if those fonts are unavailable.

## Accessibility

All interactive controls keep visible focus rings, touch targets remain at least 44px tall, and semantic controls remain native inputs, selects, buttons, links, tables, and regions. Motion is disabled under `prefers-reduced-motion`.

## Responsive Behavior

Desktop uses a left navigation rail and dense operator workspace. Mobile collapses the layout to one column, keeps the navigation touch-friendly, and preserves the same Soft UI depth primitives.
