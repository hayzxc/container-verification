import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1A3C5E",
        accent: "#F0A500",
        approved: "#27AE60",
        rejected: "#E74C3C",
        pending: "#F39C12",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        text: "#0F172A",
        muted: "#64748B",
        border: "#E2E8F0"
      },
    },
  },
  plugins: [],
};
export default config;
