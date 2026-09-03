import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gate: {
          bg: "var(--gate-bg)",
          surface: "var(--gate-surface)",
          elevated: "var(--gate-elevated)",
          card: "var(--gate-card)",
          ink: "var(--gate-ink)",
          muted: "var(--gate-muted)",
          line: "var(--gate-line)",
          "line-strong": "var(--gate-line-strong)",
          gold: "#2563eb",
          "gold-strong": "#3b82f6",
          "gold-dim": "#1d4ed8",
          danger: "#ef4444",
          ok: "#16a34a",
          waiting: "#f59e0b",
          cyan: "#0284c7",
          steel: "#334155",
        },
      },
      fontFamily: {
        sans: ['var(--font-noto)', "Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gate: "0 20px 50px rgba(37, 99, 235, 0.12)",
        "gate-sm": "0 4px 20px rgba(15, 23, 42, 0.08)",
        glow: "0 8px 32px rgba(37, 99, 235, 0.2)",
        "glow-ok": "0 8px 32px rgba(22, 163, 74, 0.25)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.8)",
      },
      borderRadius: {
        gate: "24px",
        "gate-lg": "32px",
      },
      animation: {
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      backgroundImage: {
        "gate-mesh":
          "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(59,130,246,0.18), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(22,163,74,0.08), transparent 50%), radial-gradient(ellipse 40% 30% at 0% 80%, rgba(14,165,233,0.1), transparent 50%)",
        "gold-shine":
          "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
