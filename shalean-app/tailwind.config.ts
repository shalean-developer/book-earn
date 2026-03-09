import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      fontSize: {
        /* SweepSouth: main headings ~20-22px */
        "page-title": ["1.375rem", { lineHeight: "1.3" }],
        "main-heading": ["1.25rem", { lineHeight: "1.35" }],
        /* Section headings ~18px, card titles ~16-18px */
        "section": ["1.125rem", { lineHeight: "1.4" }],
        "card-title": ["1.0625rem", { lineHeight: "1.4" }],
        /* Sub-headings ~14-15px */
        "sub-heading": ["0.9375rem", { lineHeight: "1.5" }],
        /* Body / descriptions ~13-14px */
        "body": ["0.875rem", { lineHeight: "1.5" }],
        "small": ["0.8125rem", { lineHeight: "1.5" }],
        /* Small functional text / footer ~12-13px */
        "helper": ["0.75rem", { lineHeight: "1.5" }],
        /* Tiny tags ~10-11px */
        "tiny": ["0.6875rem", { lineHeight: "1.4" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
      borderRadius: {
        "card": "0.625rem",
      },
      boxShadow: {
        "card": "0 2px 8px rgba(0, 0, 0, 0.05)",
      },
      colors: {
        "page-bg": "#FDFCFB",
        "footer-bg": "#f5f5f4",
      },
    },
  },
  plugins: [],
};

export default config;

