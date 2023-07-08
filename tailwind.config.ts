import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

module.exports = {
  mode: 'jit',
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.mdx',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E1E1E',
        accent: '#F1FE92',
      },
      backgroundImage: {
        noise: "url('/static/images/background-noise.png')",
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [typography],
} satisfies Config
