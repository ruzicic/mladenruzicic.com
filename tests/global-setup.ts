import { request, type FullConfig } from "@playwright/test"

import { PAGES } from "./helpers"

/**
 * Requests every route once before the first test. Against `next dev` each
 * route compiles on its first hit (seconds each), and against `next start` it
 * costs nothing, so the first test of every spec does not pay the compile
 * inside its own timeout. Failures are ignored here: the specs report them.
 */
const WARM = [
  ...PAGES,
  "/work/does-not-exist",
  "/llms.txt",
  "/llms-full.txt",
  "/sitemap.xml",
  "/robots.txt",
]

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL
  if (!baseURL) return
  const ctx = await request.newContext({ baseURL })
  try {
    await Promise.all(
      WARM.map((path) =>
        ctx.get(path, { timeout: 120_000, maxRedirects: 0 }).catch(() => null)
      )
    )
    // The markdown twins are a separate route handler.
    await Promise.all(
      PAGES.map((path) =>
        ctx
          .get(path, {
            timeout: 120_000,
            headers: { Accept: "text/markdown" },
          })
          .catch(() => null)
      )
    )
  } finally {
    await ctx.dispose()
  }
}
