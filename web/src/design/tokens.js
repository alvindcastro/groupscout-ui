const bodyFont = "\"DM Sans\", system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
const displayFont = "\"Plus Jakarta Sans\", \"DM Sans\", system-ui, sans-serif";

export const designTokens = {
  colors: {
    background: "#E0E5EC",
    foreground: "#3D4852",
    card: "#E0E5EC",
    muted: "#6B7280",
    mutedForeground: "#6B7280",
    accent: "#6C63FF",
    accentLight: "#8B84FF",
    accentSecondary: "#38B2AC",
    border: "transparent",
    input: "#E0E5EC",
    ring: "#6C63FF",
    destructive: "#B42318",
    placeholder: "#A0AEC0",
    shadowLight: "rgba(255, 255, 255, 0.56)",
    shadowDark: "rgb(163, 177, 198, 0.64)",

    primary: "#6C63FF",
    "on-primary": "#ffffff",
    "brand-green": "#38B2AC",
    "brand-green-deep": "#2C7A7B",
    "brand-green-soft": "#B2F5EA",
    "brand-tag": "#6C63FF",
    "brand-warn": "#946200",
    "brand-annotate": "#38B2AC",
    "brand-error": "#B42318",
    "brand-cursor": "#6C63FF",
    "hero-sky-from": "#E0E5EC",
    "hero-sky-to": "#E0E5EC",
    "hero-dark-from": "#CBD5E1",
    "hero-dark-to": "#E0E5EC",
    "testimonial-orange": "#6C63FF",
    "testimonial-orange-deep": "#5147D9",
    canvas: "#E0E5EC",
    "canvas-dark": "#3D4852",
    surface: "#E0E5EC",
    "surface-soft": "#E0E5EC",
    "surface-code": "#D5DCE5",
    hairline: "transparent",
    "hairline-soft": "transparent",
    "hairline-dark": "transparent",
    ink: "#3D4852",
    charcoal: "#3D4852",
    slate: "#4B5563",
    steel: "#6B7280",
    stone: "#718096",
    "on-dark": "#ffffff",
    "on-dark-muted": "#E2E8F0"
  },
  typography: {
    "hero-display": {
      fontFamily: displayFont,
      fontSize: "64px",
      fontWeight: 800,
      lineHeight: 1.02,
      letterSpacing: "-0.03em"
    },
    "heading-1": {
      fontFamily: displayFont,
      fontSize: "42px",
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: "-0.03em"
    },
    "heading-2": {
      fontFamily: displayFont,
      fontSize: "30px",
      fontWeight: 700,
      lineHeight: 1.18,
      letterSpacing: "-0.02em"
    },
    "body-md": {
      fontFamily: bodyFont,
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: "0"
    },
    "body-sm": {
      fontFamily: bodyFont,
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: "0"
    },
    "body-sm-medium": {
      fontFamily: bodyFont,
      fontSize: "14px",
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: "0"
    },
    "caption-bold": {
      fontFamily: bodyFont,
      fontSize: "13px",
      fontWeight: 700,
      lineHeight: 1.4,
      letterSpacing: "0.02em"
    },
    micro: {
      fontFamily: bodyFont,
      fontSize: "12px",
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: "0.04em"
    },
    "micro-uppercase": {
      fontFamily: bodyFont,
      fontSize: "11px",
      fontWeight: 700,
      lineHeight: 1.4,
      letterSpacing: "0.08em",
      textTransform: "uppercase"
    },
    "button-md": {
      fontFamily: bodyFont,
      fontSize: "14px",
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "0"
    },
    "code-sm": {
      fontFamily: bodyFont,
      fontSize: "13px",
      fontWeight: 600,
      lineHeight: 1.4
    },
    "code-inline": {
      fontFamily: bodyFont,
      fontSize: "13px",
      fontWeight: 700,
      lineHeight: 1.3
    }
  },
  rounded: {
    none: "0px",
    xs: "12px",
    sm: "12px",
    base: "16px",
    md: "16px",
    lg: "32px",
    xl: "32px",
    xxl: "32px",
    full: "9999px",
    container: "32px"
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
  effects: {
    extruded: "9px 9px 16px rgb(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5)",
    extrudedHover: "12px 12px 20px rgb(163, 177, 198, 0.7), -12px -12px 20px rgba(255, 255, 255, 0.6)",
    extrudedSmall: "5px 5px 10px rgb(163, 177, 198, 0.6), -5px -5px 10px rgba(255, 255, 255, 0.5)",
    inset: "inset 6px 6px 10px rgb(163, 177, 198, 0.6), inset -6px -6px 10px rgba(255, 255, 255, 0.5)",
    insetDeep: "inset 10px 10px 20px rgb(163, 177, 198, 0.7), inset -10px -10px 20px rgba(255, 255, 255, 0.6)",
    insetSmall: "inset 3px 3px 6px rgb(163, 177, 198, 0.6), inset -3px -3px 6px rgba(255, 255, 255, 0.5)",
    accentInset: "inset 4px 4px 8px rgba(43, 38, 143, 0.35), inset -4px -4px 8px rgba(255, 255, 255, 0.22)",
    floating: "float 3s ease-in-out infinite"
  },
  components: {
    "button-primary": {
      backgroundColor: "{colors.accent}",
      textColor: "{colors.on-primary}",
      typography: "{typography.button-md}",
      rounded: "{rounded.base}",
      padding: "12px 20px",
      border: "0",
      shadow: "{effects.extrudedSmall}",
      activeShadow: "{effects.accentInset}"
    },
    "button-secondary": {
      backgroundColor: "{colors.background}",
      textColor: "{colors.foreground}",
      typography: "{typography.button-md}",
      rounded: "{rounded.base}",
      padding: "12px 20px",
      border: "0",
      shadow: "{effects.extrudedSmall}",
      activeShadow: "{effects.insetSmall}"
    },
    "button-ghost": {
      backgroundColor: "{colors.background}",
      textColor: "{colors.accent}",
      typography: "{typography.button-md}",
      rounded: "{rounded.full}",
      padding: "8px 12px",
      shadow: "{effects.insetSmall}"
    },
    "text-input": {
      backgroundColor: "{colors.input}",
      textColor: "{colors.foreground}",
      typography: "{typography.body-md}",
      rounded: "{rounded.base}",
      padding: "{spacing.sm} {spacing.md}",
      border: "0",
      height: "48px",
      shadow: "{effects.inset}",
      focusShadow: "{effects.insetDeep}"
    },
    "search-pill": {
      backgroundColor: "{colors.background}",
      textColor: "{colors.muted}",
      typography: "{typography.body-sm}",
      rounded: "{rounded.full}",
      padding: "{spacing.xs} {spacing.md}",
      height: "44px",
      border: "0",
      shadow: "{effects.insetSmall}"
    },
    "segmented-tab": {
      backgroundColor: "{colors.background}",
      textColor: "{colors.muted}",
      typography: "{typography.body-sm-medium}",
      padding: "{spacing.sm} {spacing.md}",
      border: "0",
      shadow: "{effects.extrudedSmall}"
    },
    "segmented-tab-active": {
      backgroundColor: "{colors.background}",
      textColor: "{colors.accent}",
      typography: "{typography.body-sm-medium}",
      border: "0",
      shadow: "{effects.insetSmall}"
    },
    "sidebar-nav-item": {
      backgroundColor: "{colors.background}",
      textColor: "{colors.muted}",
      typography: "{typography.body-sm}",
      rounded: "{rounded.base}",
      padding: "{spacing.xs} {spacing.md}",
      shadow: "{effects.extrudedSmall}"
    },
    "sidebar-nav-item-active": {
      backgroundColor: "{colors.background}",
      textColor: "{colors.accent}",
      typography: "{typography.body-sm-medium}",
      shadow: "{effects.insetSmall}"
    },
    "badge-tag": {
      backgroundColor: "{colors.background}",
      textColor: "{colors.accent}",
      typography: "{typography.caption-bold}",
      rounded: "{rounded.full}",
      padding: "4px 10px",
      border: "0",
      shadow: "{effects.insetSmall}"
    },
    "badge-type": {
      backgroundColor: "{colors.background}",
      textColor: "{colors.accentSecondary}",
      typography: "{typography.code-sm}",
      rounded: "{rounded.full}",
      padding: "4px 10px",
      border: "0",
      shadow: "{effects.insetSmall}"
    },
    "card-base": {
      backgroundColor: "{colors.background}",
      rounded: "{rounded.container}",
      padding: "{spacing.xl}",
      border: "0",
      shadow: "{effects.extruded}",
      hoverShadow: "{effects.extrudedHover}"
    },
    "code-inline": {
      backgroundColor: "{colors.background}",
      textColor: "{colors.foreground}",
      typography: "{typography.code-inline}",
      rounded: "{rounded.sm}",
      padding: "4px 8px",
      border: "0",
      shadow: "{effects.insetSmall}"
    },
    "feature-comparison-table": {
      backgroundColor: "{colors.background}",
      textColor: "{colors.foreground}",
      typography: "{typography.body-sm}",
      rounded: "{rounded.container}",
      border: "0",
      shadow: "{effects.extruded}"
    },
    "property-row": {
      backgroundColor: "transparent",
      textColor: "{colors.foreground}",
      typography: "{typography.body-sm}",
      padding: "{spacing.md} 0",
      border: "0",
      shadow: "{effects.insetSmall}"
    }
  }
};
