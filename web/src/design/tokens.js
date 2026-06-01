const monoBody = "\"JetBrains Mono\", \"Fira Code\", Consolas, monospace";
const monoAccent = "\"Share Tech Mono\", monospace";
const monoHeading = "\"Orbitron\", \"Share Tech Mono\", monospace";

export const designTokens = {
  colors: {
    background: "#0a0a0f",
    foreground: "#e0e0e0",
    card: "#12121a",
    muted: "#1c1c2e",
    mutedForeground: "#6b7280",
    accent: "#00ff88",
    accentSecondary: "#ff00ff",
    accentTertiary: "#00d4ff",
    border: "#2a2a3a",
    input: "#12121a",
    ring: "#00ff88",
    destructive: "#ff3366",

    primary: "#00ff88",
    "on-primary": "#0a0a0f",
    "brand-green": "#00ff88",
    "brand-green-deep": "#00cc6d",
    "brand-green-soft": "#70ffc1",
    "brand-tag": "#00d4ff",
    "brand-warn": "#f5d742",
    "brand-annotate": "#00ff88",
    "brand-error": "#ff3366",
    "brand-cursor": "#00ff88",
    "hero-sky-from": "#0a0a0f",
    "hero-sky-to": "#12121a",
    "hero-dark-from": "#050508",
    "hero-dark-to": "#12121a",
    "testimonial-orange": "#ff00ff",
    "testimonial-orange-deep": "#b000b8",
    canvas: "#0a0a0f",
    "canvas-dark": "#050508",
    surface: "#12121a",
    "surface-soft": "#1c1c2e",
    "surface-code": "#050508",
    hairline: "#2a2a3a",
    "hairline-soft": "rgba(0, 255, 136, 0.18)",
    "hairline-dark": "#2a2a3a",
    ink: "#e0e0e0",
    charcoal: "#12121a",
    slate: "#8b94a7",
    steel: "#6b7280",
    stone: "#8b94a7",
    "on-dark": "#e0e0e0",
    "on-dark-muted": "#9ca3af"
  },
  typography: {
    "hero-display": {
      fontFamily: monoHeading,
      fontSize: "64px",
      fontWeight: 900,
      lineHeight: 1.02,
      letterSpacing: "0.08em",
      textTransform: "uppercase"
    },
    "heading-1": {
      fontFamily: monoHeading,
      fontSize: "42px",
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: "0.06em",
      textTransform: "uppercase"
    },
    "heading-2": {
      fontFamily: monoHeading,
      fontSize: "30px",
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: "0.04em",
      textTransform: "uppercase"
    },
    "body-md": {
      fontFamily: monoBody,
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: "0"
    },
    "body-sm": {
      fontFamily: monoBody,
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: "0"
    },
    "body-sm-medium": {
      fontFamily: monoBody,
      fontSize: "14px",
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: "0.02em"
    },
    "caption-bold": {
      fontFamily: monoAccent,
      fontSize: "13px",
      fontWeight: 700,
      lineHeight: 1.4,
      letterSpacing: "0.12em",
      textTransform: "uppercase"
    },
    micro: {
      fontFamily: monoAccent,
      fontSize: "12px",
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: "0.16em",
      textTransform: "uppercase"
    },
    "micro-uppercase": {
      fontFamily: monoAccent,
      fontSize: "11px",
      fontWeight: 700,
      lineHeight: 1.4,
      letterSpacing: "0.2em",
      textTransform: "uppercase"
    },
    "button-md": {
      fontFamily: monoAccent,
      fontSize: "14px",
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: "0.12em",
      textTransform: "uppercase"
    },
    "code-sm": {
      fontFamily: monoBody,
      fontSize: "13px",
      fontWeight: 500,
      lineHeight: 1.4
    },
    "code-inline": {
      fontFamily: monoBody,
      fontSize: "13px",
      fontWeight: 600,
      lineHeight: 1.3
    }
  },
  rounded: {
    none: "0px",
    xs: "0px",
    sm: "2px",
    base: "4px",
    md: "4px",
    lg: "4px",
    xl: "4px",
    xxl: "4px",
    full: "4px",
    chamfer: "10px"
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
    "shadow-neon": "0 0 5px #00ff88, 0 0 10px #00ff8840",
    "shadow-neon-sm": "0 0 3px #00ff88, 0 0 6px #00ff8830",
    "shadow-neon-lg": "0 0 10px #00ff88, 0 0 20px #00ff8860, 0 0 40px #00ff8830",
    "shadow-neon-secondary": "0 0 5px #ff00ff, 0 0 20px #ff00ff60",
    "shadow-neon-tertiary": "0 0 5px #00d4ff, 0 0 20px #00d4ff60",
    "clip-chamfer": "polygon(0 10px, 10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px))",
    "clip-chamfer-sm": "polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px))"
  },
  components: {
    "button-primary": {
      backgroundColor: "{colors.accent}",
      textColor: "{colors.background}",
      typography: "{typography.button-md}",
      rounded: "{rounded.none}",
      clipPath: "{effects.clip-chamfer-sm}",
      padding: "10px 20px",
      border: "2px solid {colors.accent}",
      shadow: "{effects.shadow-neon}"
    },
    "button-secondary": {
      backgroundColor: "transparent",
      textColor: "{colors.accentSecondary}",
      typography: "{typography.button-md}",
      rounded: "{rounded.none}",
      clipPath: "{effects.clip-chamfer-sm}",
      padding: "10px 20px",
      border: "2px solid {colors.accentSecondary}",
      shadow: "{effects.shadow-neon-secondary}"
    },
    "button-ghost": {
      backgroundColor: "rgba(0, 255, 136, 0.08)",
      textColor: "{colors.accent}",
      typography: "{typography.button-md}",
      rounded: "{rounded.none}",
      clipPath: "{effects.clip-chamfer-sm}",
      padding: "8px 12px"
    },
    "text-input": {
      backgroundColor: "{colors.input}",
      textColor: "{colors.accent}",
      typography: "{typography.body-md}",
      rounded: "{rounded.base}",
      clipPath: "{effects.clip-chamfer-sm}",
      padding: "{spacing.sm} {spacing.md}",
      border: "1px solid {colors.border}",
      height: "44px",
      focusShadow: "{effects.shadow-neon-sm}"
    },
    "search-pill": {
      backgroundColor: "{colors.muted}",
      textColor: "{colors.foreground}",
      typography: "{typography.body-sm}",
      rounded: "{rounded.none}",
      clipPath: "{effects.clip-chamfer-sm}",
      padding: "{spacing.xs} {spacing.md}",
      height: "44px",
      border: "1px solid {colors.border}"
    },
    "segmented-tab": {
      backgroundColor: "transparent",
      textColor: "{colors.mutedForeground}",
      typography: "{typography.body-sm-medium}",
      padding: "{spacing.sm} {spacing.md}",
      border: "0 0 2px transparent solid"
    },
    "segmented-tab-active": {
      backgroundColor: "rgba(0, 255, 136, 0.08)",
      textColor: "{colors.accent}",
      typography: "{typography.body-sm-medium}",
      border: "0 0 2px {colors.accent} solid",
      shadow: "{effects.shadow-neon-sm}"
    },
    "sidebar-nav-item": {
      backgroundColor: "transparent",
      textColor: "{colors.mutedForeground}",
      typography: "{typography.body-sm}",
      rounded: "{rounded.none}",
      clipPath: "{effects.clip-chamfer-sm}",
      padding: "{spacing.xs} {spacing.md}"
    },
    "sidebar-nav-item-active": {
      backgroundColor: "rgba(0, 255, 136, 0.1)",
      textColor: "{colors.accent}",
      typography: "{typography.body-sm-medium}",
      border: "1px solid rgba(0, 255, 136, 0.35)"
    },
    "badge-tag": {
      backgroundColor: "rgba(0, 212, 255, 0.12)",
      textColor: "{colors.accentTertiary}",
      typography: "{typography.caption-bold}",
      rounded: "{rounded.sm}",
      padding: "2px 8px",
      border: "1px solid rgba(0, 212, 255, 0.35)"
    },
    "badge-type": {
      backgroundColor: "rgba(255, 0, 255, 0.1)",
      textColor: "{colors.accentSecondary}",
      typography: "{typography.code-sm}",
      rounded: "{rounded.sm}",
      padding: "2px 6px",
      border: "1px solid rgba(255, 0, 255, 0.3)"
    },
    "card-base": {
      backgroundColor: "{colors.card}",
      rounded: "{rounded.none}",
      clipPath: "{effects.clip-chamfer}",
      padding: "{spacing.xl}",
      border: "1px solid {colors.border}",
      hoverShadow: "{effects.shadow-neon}"
    },
    "code-inline": {
      backgroundColor: "{colors.background}",
      textColor: "{colors.accent}",
      typography: "{typography.code-inline}",
      rounded: "{rounded.sm}",
      padding: "2px 6px",
      border: "1px solid rgba(0, 255, 136, 0.35)"
    },
    "feature-comparison-table": {
      backgroundColor: "{colors.card}",
      textColor: "{colors.foreground}",
      typography: "{typography.body-sm}",
      rounded: "{rounded.none}",
      clipPath: "{effects.clip-chamfer}",
      border: "1px solid {colors.border}"
    },
    "property-row": {
      backgroundColor: "transparent",
      textColor: "{colors.foreground}",
      typography: "{typography.body-sm}",
      padding: "{spacing.md} 0",
      border: "0 0 1px rgba(0, 255, 136, 0.18) solid"
    }
  }
};
