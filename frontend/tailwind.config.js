/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        soil: {
          50: "#fbf8f1",
          100: "#f3ecdc",
          200: "#e6d8bb",
          300: "#d6c29a",
          400: "#bea274",
          500: "#a78655",
          600: "#8b6c43",
          700: "#705538",
          800: "#5b4531",
          900: "#4a392b",
        },
        leaf: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        sky: {
          50: "#eff8ff",
          100: "#dbeefe",
          200: "#bfe3fe",
          300: "#93d2fc",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        harvest: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      fontFamily: {
        sans: ["Manrope", "Noto Sans Devanagari", "system-ui", "sans-serif"],
        display: ["Fraunces", "Noto Sans Devanagari", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 18px 45px -24px rgba(20, 83, 45, 0.35)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.45s ease-out both",
      },
    },
  },
  plugins: [],
};
