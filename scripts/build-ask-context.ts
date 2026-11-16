/**
 * Writes `content/ask/context.md`, the knowledge the Ask Worker
 * (`workers/ask`) answers from, out of the site's own content
 * (`lib/ask/context.ts`). Run it after any content change:
 *
 *   pnpm --dir workers/ask context          # write the file
 *   pnpm --dir workers/ask context:check    # fail if the file is stale
 *
 * It prints every sentence it dropped because it held a visible placeholder,
 * and any warning about `content/ask/notes.md`.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
// The content loaders resolve `content/` against the working directory.
process.chdir(ROOT)

const { buildAskContext } = await import("../lib/ask/context")

const OUT = join("content", "ask", "context.md")
const check = process.argv.includes("--check")
const quiet = process.argv.includes("--quiet")

const { markdown, dropped, siteMap, warnings } = buildAskContext(ROOT)

if (check) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : ""
  if (current !== markdown) {
    console.error(
      `${OUT} is out of date with content/**. Run: pnpm --dir workers/ask context`
    )
    process.exit(1)
  }
  if (!quiet) console.log(`${OUT} is up to date.`)
} else {
  writeFileSync(OUT, markdown)
  console.log(
    `Wrote ${OUT}: ${markdown.length} characters, ${siteMap.length} links in the site map.`
  )
}

if (!quiet && !check) {
  if (dropped.length) {
    console.log(`\nDropped ${dropped.length} item(s) that hold a placeholder:`)
    for (const d of dropped) console.log(`  ${d.where}: ${d.text}`)
  }
}
for (const w of warnings) console.warn(`warning: ${w}`)
