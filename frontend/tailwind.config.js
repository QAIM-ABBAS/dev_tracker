/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        pf: {
          950: "var(--pf-950)",
          900: "var(--pf-900)",
          700: "var(--pf-700)",
          400: "var(--pf-400)",
          100: "var(--pf-100)",
          surface: "var(--pf-surface)",
          "muted-fg": "var(--pf-muted-fg)",
          border: "var(--pf-border)",
          destructive: "var(--pf-destructive)",
        },
        ink: {
          50: "#f8fafc",
          100: "var(--pf-100)",
          200: "var(--pf-100)",
          300: "var(--pf-400)",
          400: "var(--pf-700)",
          500: "var(--pf-700)",
          600: "var(--pf-900)",
          700: "var(--pf-900)",
          800: "var(--pf-950)",
          900: "var(--pf-950)",
          950: "var(--pf-950)",
        },
        accent: {
          DEFAULT: "var(--pf-400)",
          hover: "var(--pf-700)",
          subtle: "var(--pf-900)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "snap-in": {
          "0%": { opacity: "0.6", transform: "scale(0.97)" },
          "50%": { opacity: "1", transform: "scale(1.01)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "motion-safe:fade-in 0.18s ease-out",
        "scale-in": "motion-safe:scale-in 0.14s ease-out",
        "snap-in": "motion-safe:snap-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};