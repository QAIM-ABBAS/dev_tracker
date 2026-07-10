/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ProjectFlow color palette
        pf: {
          950: "#041421",
          900: "#042630",
          700: "#4c7273",
          400: "#86b9b0",
          100: "#d0d6d6",
        },
        // Legacy ink palette (for backward compatibility)
        ink: {
          50: "#f8fafc",
          100: "#d0d6d6",
          200: "#d0d6d6",
          300: "#86b9b0",
          400: "#4c7273",
          500: "#4c7273",
          600: "#042630",
          700: "#042630",
          800: "#041421",
          900: "#041421",
          950: "#041421",
        },
        accent: {
          DEFAULT: "#86b9b0",
          hover: "#4c7273",
          subtle: "#042630",
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
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "scale-in": "scale-in 0.14s ease-out",
      },
    },
  },
  plugins: [],
};