import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        onyx: {
          50: "rgb(var(--onyx-50) / <alpha-value>)",
          100: "rgb(var(--onyx-100) / <alpha-value>)",
          200: "rgb(var(--onyx-200) / <alpha-value>)",
          300: "rgb(var(--onyx-300) / <alpha-value>)",
          400: "rgb(var(--onyx-400) / <alpha-value>)",
          500: "rgb(var(--onyx-500) / <alpha-value>)",
          600: "rgb(var(--onyx-600) / <alpha-value>)",
          700: "rgb(var(--onyx-700) / <alpha-value>)",
          800: "rgb(var(--onyx-800) / <alpha-value>)",
          900: "rgb(var(--onyx-900) / <alpha-value>)",
          950: "rgb(var(--onyx-950) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--gold-500) / <alpha-value>)",
          light: "rgb(var(--gold-400) / <alpha-value>)",
          dark: "rgb(var(--gold-600) / <alpha-value>)",
        },
        cream: {
          DEFAULT: "rgb(var(--cream-500) / <alpha-value>)",
          dark: "rgb(var(--cream-700) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
