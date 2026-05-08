export const designTokens = {
  colors: {
    primary: "#0a0a0a",
    "on-primary": "#ffffff",
    "brand-green": "#00d4a4",
    "brand-green-deep": "#00b48a",
    "brand-green-soft": "#7cebcb",
    "brand-tag": "#3772cf",
    "brand-warn": "#c37d0d",
    "brand-annotate": "#1ba673",
    "brand-error": "#d45656",
    "brand-cursor": "#888888",
    "hero-sky-from": "#87a8c8",
    "hero-sky-to": "#f5e9d8",
    "hero-dark-from": "#1a3d4a",
    "hero-dark-to": "#2d5a4f",
    "testimonial-orange": "#f55a3c",
    "testimonial-orange-deep": "#cc3a1f",
    canvas: "#ffffff",
    "canvas-dark": "#0a0a0a",
    surface: "#f7f7f7",
    "surface-soft": "#fafafa",
    "surface-code": "#1c1c1e",
    hairline: "#e5e5e5",
    "hairline-soft": "#ededed",
    "hairline-dark": "#1f1f1f",
    ink: "#0a0a0a",
    charcoal: "#1c1c1e",
    slate: "#3a3a3c",
    steel: "#5a5a5c",
    stone: "#888888",
    muted: "#a8a8aa",
    "on-dark": "#ffffff",
    "on-dark-muted": "#b3b3b3"
  },
  typography: {
    "body-md": {
      fontFamily: "Inter",
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: 1.5
    },
    "body-sm": {
      fontFamily: "Inter",
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: 1.5
    },
    "body-sm-medium": {
      fontFamily: "Inter",
      fontSize: "14px",
      fontWeight: 500,
      lineHeight: 1.5
    },
    "caption-bold": {
      fontFamily: "Inter",
      fontSize: "13px",
      fontWeight: 600,
      lineHeight: 1.4
    },
    micro: {
      fontFamily: "Inter",
      fontSize: "12px",
      fontWeight: 500,
      lineHeight: 1.4
    },
    "button-md": {
      fontFamily: "Inter",
      fontSize: "14px",
      fontWeight: 500,
      lineHeight: 1.3
    },
    "code-sm": {
      fontFamily: "Geist Mono",
      fontSize: "13px",
      fontWeight: 400,
      lineHeight: 1.4
    }
  },
  rounded: {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    xxl: "24px",
    full: "9999px"
  },
  spacing: {
    xxs: "4px",
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "24px",
    xxl: "32px",
    xxxl: "40px",
    "section-sm": "48px",
    section: "64px",
    "section-lg": "96px",
    hero: "120px"
  },
  components: {
    "button-primary": {
      backgroundColor: "{colors.primary}",
      textColor: "{colors.on-primary}",
      typography: "{typography.button-md}",
      rounded: "{rounded.full}",
      padding: "10px 20px"
    },
    "button-secondary": {
      backgroundColor: "transparent",
      textColor: "{colors.ink}",
      typography: "{typography.button-md}",
      rounded: "{rounded.full}",
      padding: "10px 20px",
      border: "1px solid {colors.hairline}"
    },
    "text-input": {
      backgroundColor: "{colors.canvas}",
      textColor: "{colors.ink}",
      typography: "{typography.body-md}",
      rounded: "{rounded.md}",
      padding: "{spacing.sm} {spacing.md}",
      border: "1px solid {colors.hairline}",
      height: "40px"
    },
    "search-pill": {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.steel}",
      typography: "{typography.body-sm}",
      rounded: "{rounded.md}",
      padding: "{spacing.xs} {spacing.md}",
      height: "36px",
      border: "1px solid {colors.hairline}"
    },
    "segmented-tab": {
      backgroundColor: "transparent",
      textColor: "{colors.steel}",
      typography: "{typography.body-sm-medium}",
      padding: "{spacing.sm} {spacing.md}",
      border: "0 0 2px transparent solid"
    },
    "segmented-tab-active": {
      backgroundColor: "transparent",
      textColor: "{colors.ink}",
      typography: "{typography.body-sm-medium}",
      border: "0 0 2px {colors.ink} solid"
    },
    "sidebar-nav-item": {
      backgroundColor: "transparent",
      textColor: "{colors.steel}",
      typography: "{typography.body-sm}",
      rounded: "{rounded.sm}",
      padding: "{spacing.xs} {spacing.md}"
    },
    "sidebar-nav-item-active": {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.ink}",
      typography: "{typography.body-sm-medium}"
    },
    "badge-tag": {
      backgroundColor: "rgba(55, 114, 207, 0.15)",
      textColor: "{colors.brand-tag}",
      typography: "{typography.caption-bold}",
      rounded: "{rounded.sm}",
      padding: "2px 8px"
    },
    "badge-type": {
      backgroundColor: "{colors.surface}",
      textColor: "{colors.steel}",
      typography: "{typography.code-sm}",
      rounded: "{rounded.sm}",
      padding: "2px 6px"
    },
    "feature-comparison-table": {
      backgroundColor: "{colors.canvas}",
      textColor: "{colors.ink}",
      typography: "{typography.body-sm}",
      rounded: "{rounded.md}",
      border: "1px solid {colors.hairline}"
    },
    "property-row": {
      backgroundColor: "{colors.canvas}",
      textColor: "{colors.ink}",
      typography: "{typography.body-sm}",
      padding: "{spacing.md} 0",
      border: "0 0 1px {colors.hairline-soft} solid"
    }
  }
};
