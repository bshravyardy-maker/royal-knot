import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#151B2B",
          dark: "#0E121D",
          light: "#1F283E",
          surface: "#1A2236",
          border: "#293552",
        },
        gold: {
          DEFAULT: "#C6A46A",
          light: "#DFC698",
          dark: "#A58348",
          muted: "#8C7142",
          subtle: "#F5EEDF",
        },
        ivory: {
          DEFAULT: "#F7F5F0",
          light: "#FCFBF9",
          dark: "#ECE7DC",
          border: "#E4DEC8",
        },
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-manrope)", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 2px 10px rgba(21, 27, 43, 0.04)",
        card: "0 4px 20px -2px rgba(21, 27, 43, 0.06), 0 2px 6px -1px rgba(21, 27, 43, 0.03)",
        elevated: "0 10px 30px -4px rgba(21, 27, 43, 0.1), 0 4px 12px -2px rgba(21, 27, 43, 0.05)",
        gold: "0 4px 20px -2px rgba(198, 164, 106, 0.25)",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
