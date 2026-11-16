import { readFileSync } from "node:fs"
import { defineConfig, type Plugin } from "vitest/config"

/** `.md` imports as strings, the way Wrangler's `Text` rule bundles them. */
const markdownAsText: Plugin = {
  name: "markdown-as-text",
  enforce: "pre",
  load(id) {
    if (!id.endsWith(".md")) return null
    return `export default ${JSON.stringify(readFileSync(id, "utf8"))}`
  },
}

// The tests stub the model, Siteverify, the rate limiter, the Durable Object's
// storage and KV (test/helpers.ts): they never touch the network or a
// Cloudflare account.
export default defineConfig({
  plugins: [markdownAsText],
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
})
