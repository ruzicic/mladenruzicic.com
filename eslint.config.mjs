import js from "@eslint/js"
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      ".claude/**",
      "content/**/*.mdx",
      "node_modules/**",
      "public/**",
      "docs/**",
      // Playwright artefacts: minified vendor bundles that would otherwise
      // make `pnpm lint` fail after any local `pnpm test:e2e`. Both are
      // already in .gitignore.
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
      "prettier.config.cjs",
    ],
  },
  js.configs.recommended,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  }
)
