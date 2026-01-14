import typography from "@tailwindcss/typography"
import type { Config } from "tailwindcss"

module.exports = {
  mode: "jit",
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.mdx",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter Variable",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        primary: "#1E1E1E",
        accent: "#F1FE92",
      },
      backgroundImage: {
        noise: "url('/static/images/background-noise.png')",
      },
      screens: {
        "2xl": "1200px",
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [typography],
} satisfies Config
