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
