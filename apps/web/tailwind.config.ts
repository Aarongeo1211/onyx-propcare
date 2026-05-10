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
          50: "rgb(var(--gold-50) / <alpha-value>)",
          100: "rgb(var(--gold-100) / <alpha-value>)",
          200: "rgb(var(--gold-200) / <alpha-value>)",
          300: "rgb(var(--gold-300) / <alpha-value>)",
          400: "rgb(var(--gold-400) / <alpha-value>)",
          500: "rgb(var(--gold-500) / <alpha-value>)",
          600: "rgb(var(--gold-600) / <alpha-value>)",
          700: "rgb(var(--gold-700) / <alpha-value>)",
          800: "rgb(var(--gold-800) / <alpha-value>)",
          900: "rgb(var(--gold-900) / <alpha-value>)",
        },
        cream: {
          DEFAULT: "rgb(var(--cream-500) / <alpha-value>)",
          dark: "rgb(var(--cream-700) / <alpha-value>)",
        },
        earth: {
          green: "rgb(var(--earth-green) / <alpha-value>)",
          brown: "rgb(var(--earth-brown) / <alpha-value>)",
          terracotta: "rgb(var(--earth-terracotta) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-gold":
          "linear-gradient(135deg, rgb(var(--gold-500)) 0%, rgb(var(--gold-400)) 50%, rgb(var(--gold-600)) 100%)",
        "gradient-dark":
          "linear-gradient(180deg, rgb(var(--onyx-950)) 0%, rgb(var(--onyx-900)) 100%)",
        "noise": "url('/images/noise.svg')",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "slide-in-left": "slideInLeft 0.6s ease-out forwards",
        "slide-in-right": "slideInRight 0.6s ease-out forwards",
        "scale-in": "scaleIn 0.5s ease-out forwards",
        "shimmer": "shimmer 2s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(40px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(201, 168, 76, 0.2)" },
          "100%": { boxShadow: "0 0 40px rgba(201, 168, 76, 0.4)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
