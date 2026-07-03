import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050505",
        accent: "#B6FF00",
        cursed: "#3C1A47",
        "mecha-purple": "#3C1A47",
        "mecha-green": "#B6FF00",
        "neon-cyan": "#B6FF00",
        "neon-magenta": "#ff003c",
        "neon-yellow": "#fce205",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        jp: ["var(--font-jp)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(182, 255, 0, 0.35)",
        "glow-purple": "0 0 24px rgba(60, 26, 71, 0.55)",
        "neon-cyan": "0 0 5px #B6FF00, 0 0 20px #B6FF00",
        "neon-magenta": "0 0 5px #ff003c, 0 0 20px #ff003c",
        "neon-yellow": "0 0 5px #fce205, 0 0 20px #fce205",
        "mecha-purple": "0 0 24px rgba(60, 26, 71, 0.55)",
        "mecha-green": "0 0 24px rgba(182, 255, 0, 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
