/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // ── Override defaults ───────────────────────────────────
    container: {
      center: true,
      padding: "24px",
      screens: { "2xl": "1440px" },
    },

    extend: {
      // ── Fonts ─────────────────────────────────────────────
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },

      // ── Color Palette ─────────────────────────────────────
      colors: {
        // Raw tokens (CSS var based)
        bg:         "var(--color-bg)",
        surface:    "var(--color-surface)",
        "surface-2":"var(--color-surface-2)",
        elevated:   "var(--color-elevated)",

        border:     "var(--color-border)",
        "border-2": "var(--color-border-2)",

        "text-1":   "var(--color-text-1)",
        "text-2":   "var(--color-text-2)",
        "text-3":   "var(--color-text-3)",

        accent: {
          DEFAULT: "var(--color-accent)",
          light:   "var(--color-accent-light)",
          dim:     "var(--color-accent-dim)",
          glow:    "var(--color-accent-glow)",
        },
        teal: {
          DEFAULT: "var(--color-teal)",
          light:   "var(--color-teal-light)",
          dim:     "var(--color-teal-dim)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          dim:     "var(--color-success-dim)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          dim:     "var(--color-warning-dim)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          dim:     "var(--color-danger-dim)",
        },

        // ── Shadcn/ui aliases (keeps ui/ components working) ──
        background:  "var(--color-bg)",
        foreground:  "var(--color-text-1)",
        card: {
          DEFAULT:    "var(--color-surface)",
          foreground: "var(--color-text-1)",
        },
        popover: {
          DEFAULT:    "var(--color-elevated)",
          foreground: "var(--color-text-1)",
        },
        primary: {
          DEFAULT:    "var(--color-accent)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT:    "var(--color-surface-2)",
          foreground: "var(--color-text-1)",
        },
        muted: {
          DEFAULT:    "var(--color-surface)",
          foreground: "var(--color-text-2)",
        },
        destructive: {
          DEFAULT:    "var(--color-danger)",
          foreground: "#ffffff",
        },
        input:  "var(--color-surface-2)",
        ring:   "var(--color-accent)",

        // ── Legacy aliases ───────────────────────────────────
        text:          "var(--color-text-1)",
        "text-muted":  "var(--color-text-2)",

        // ── Chart tokens ─────────────────────────────────────
        chart: {
          "1": "var(--color-accent)",
          "2": "var(--color-teal)",
          "3": "var(--color-success)",
          "4": "var(--color-warning)",
          "5": "var(--color-danger)",
        },
      },

      // ── Border Radius ─────────────────────────────────────
      borderRadius: {
        sm:    "var(--radius-sm)",
        md:    "var(--radius-md)",
        DEFAULT: "var(--radius-md)",
        lg:    "var(--radius-lg)",
        xl:    "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },

      // ── Spacing Extensions ────────────────────────────────
      spacing: {
        "4.5":  "18px",
        "5.5":  "22px",
        "13":   "52px",
        "15":   "60px",
        "18":   "72px",
        "sidebar": "var(--sidebar-width)",
        "header":  "var(--header-height)",
      },

      // ── Width/Height ──────────────────────────────────────
      width:  { sidebar: "var(--sidebar-width)", "sidebar-collapsed": "var(--sidebar-collapsed)" },
      minWidth: { sidebar: "var(--sidebar-width)" },

      // ── Shadows ───────────────────────────────────────────
      boxShadow: {
        sm:     "0 1px 2px rgba(0,0,0,0.4)",
        md:     "0 4px 12px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2)",
        lg:     "0 8px 24px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.2)",
        glow:   "0 0 0 1px var(--color-accent-glow), 0 4px 16px var(--color-accent-dim)",
        "glow-teal": "0 0 0 1px var(--color-teal-dim), 0 4px 16px var(--color-teal-dim)",
        // Legacy
        soft:        "0 2px 8px rgba(0,0,0,0.3)",
        "soft-lg":   "0 4px 16px rgba(0,0,0,0.35)",
      },

      // ── Typography ────────────────────────────────────────
      fontSize: {
        "2xs": ["11px", { lineHeight: "16px", letterSpacing: "0.02em" }],
        xs:    ["12px", { lineHeight: "18px" }],
        sm:    ["13px", { lineHeight: "20px" }],
        base:  ["14px", { lineHeight: "22px" }],
        md:    ["15px", { lineHeight: "24px" }],
        lg:    ["18px", { lineHeight: "28px" }],
        xl:    ["22px", { lineHeight: "32px" }],
        "2xl": ["28px", { lineHeight: "36px", letterSpacing: "-0.02em" }],
        "3xl": ["36px", { lineHeight: "44px", letterSpacing: "-0.03em" }],
      },

      // ── Keyframes ─────────────────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "slide-in": {
          from: { transform: "translateX(-8px)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        "skeleton": {
          "0%, 100%": { opacity: "0.35" },
          "50%":      { opacity: "0.65" },
        },
        "ping-soft": {
          "75%, 100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },

      // ── Animations ────────────────────────────────────────
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 200ms ease-out both",
        "fade-up":        "fade-up 220ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in":       "scale-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in":       "slide-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "skeleton":       "skeleton 1.8s ease-in-out infinite",
        "ping-soft":      "ping-soft 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
      },

      // ── Transition ────────────────────────────────────────
      transitionDuration: { "150": "150ms", "200": "200ms", "300": "300ms" },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.16, 1, 0.3, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
