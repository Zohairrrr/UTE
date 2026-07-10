import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./prisma/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-green": "#233426",
        "brand-ochre": "#A07A4B",
        "brand-cream": "#F9F7F2",
        "brand-cream-dark": "#F1EDE2"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Arial", "sans-serif"]
      },
      boxShadow: {
        sharp: "6px 6px 0 rgba(35, 52, 38, 0.08)"
      }
    }
  },
  plugins: [forms]
};

export default config;
