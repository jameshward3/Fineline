import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        "surface-inset": "var(--surface-inset)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        "ink-faint": "var(--ink-faint)",
        accent: {
          DEFAULT: "var(--accent)",
          muted: "var(--accent-muted)",
          foreground: "var(--accent-foreground)",
        },
        ivory: "var(--ivory)",
        status: {
          success: "var(--status-success)",
          warning: "var(--status-warning)",
          danger: "var(--status-danger)",
          info: "var(--status-info)",
        },
        // Public marketing site — fixed warm-neutral luxury palette.
        // Distinct namespace from the STITCH OS admin tokens above so the
        // two visual systems can never bleed into one another.
        fl: {
          paper: "#F6F2EC",
          ivory: "#FBF8F2",
          cream: "#EDE6DD",
          line: "#D9D0C4",
          charcoal: "#1A1A1A",
          ink: "#3A3833",
          "ink-muted": "#54514A",
          "ink-faint": "#8B8276",
          champagne: "#D8CDBE",
          brass: "#A27A51",
          gold: "#B28D6B",
          "gold-soft": "#CBA968",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        serif: ["var(--font-fl-serif)", "ui-serif", "Georgia", "Times New Roman", "serif"],
        display: ["var(--font-fl-display)", "Playfair Display", "Georgia", "Times New Roman", "serif"],
        flsans: ["var(--font-fl-sans)", "Inter", "Arial", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.28em",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 1px 2px rgba(0,0,0,0.4)",
      },
      transitionTimingFunction: {
        "fl-ease": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
