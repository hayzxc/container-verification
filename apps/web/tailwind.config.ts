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
        substrate: "var(--substrate)",
        ink: "var(--ink)",
        hazard: "#E61919",
        // Overwrite shadcn tokens
        background: "var(--substrate)",
        foreground: "var(--ink)",
        primary: {
          DEFAULT: "var(--ink)",
          foreground: "var(--substrate)",
        },
        accent: {
          DEFAULT: "#E61919",
          foreground: "var(--substrate)",
        },
        border: "var(--ink)",
      },
      borderRadius: {
        lg: "0px",
        md: "0px",
        sm: "0px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
