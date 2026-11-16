/**
 * Uploads the owner's notes for Ask to Workers KV, from a file that lives
 * outside this repository. The public repo holds only this mechanism.
 *
 *   pnpm --dir workers/ask notes:check  ~/private/ask-notes.md
 *   pnpm --dir workers/ask notes:upload ~/private/ask-notes.md
 *   pnpm --dir workers/ask notes:upload ~/private/ask-notes.md --local
 *   pnpm --dir workers/ask notes:delete
 *
 * `check` reads and validates the file and changes nothing. `upload` does
 * the same checks and then runs `wrangler kv key put` (remote, or with
 * `--local` into `wrangler dev`'s local namespace). `delete` removes the
 * key, so Ask answers from the site alone again. Add `--dry-run` to print
 * the Wrangler command instead of running it.
 *
 * The file is sent as it is; the Worker cleans it on every read
 * (src/notes.ts). Its text is never printed here.
 *
 * Anything the model can read can be drawn out of it by a determined
 * visitor. These notes are "not on GitHub", not "secret".
 */
import { spawnSync } from "node:child_process"
import { readFileSync, realpathSync, statSync } from "node:fs"
import { join, resolve, sep } from "node:path"

import { cleanNotes, MAX_NOTES_BYTES, NOTES_KEY } from "../src/notes"
import { notesNamespaceId, WORKER_DIR } from "./local-config"

const REPO = realpathSync(join(WORKER_DIR, "..", ".."))
const args = process.argv.slice(2)
const command = args[0]
const flags = new Set(args.filter((a) => a.startsWith("--")))
const file = args.slice(1).find((a) => !a.startsWith("--"))
const dryRun = flags.has("--dry-run")
const local = flags.has("--local")

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

function wrangler(argv: string[]) {
  const bin = join(WORKER_DIR, "node_modules", ".bin", "wrangler")
  console.log(`wrangler ${argv.join(" ")}`)
  if (dryRun) return
  const run = spawnSync(bin, argv, { cwd: WORKER_DIR, stdio: "inherit" })
  process.exit(run.status ?? 1)
}

function target(): string[] {
  return local
    ? ["--binding", "ASK_NOTES", "--local"]
    : ["--namespace-id", notesNamespaceId(), "--remote"]
}

/** Reads and checks the file; returns its real path. */
function checked(path: string | undefined): string {
  if (!path) fail("Give the path of the notes file, outside this repository.")
  let real: string
  try {
    real = realpathSync(resolve(path))
  } catch {
    fail(`No such file: ${path}`)
  }
  if (real === REPO || real.startsWith(`${REPO}${sep}`))
    fail(
      "That file is inside the repository, which is public. Keep the notes " +
        "outside it (for example in ~/Documents) and pass that path."
    )
  if (!statSync(real).isFile()) fail(`Not a file: ${path}`)
  const bytes = readFileSync(real)
  if (bytes.byteLength > MAX_NOTES_BYTES)
    fail(
      `The file is ${bytes.byteLength} bytes; the Worker ignores notes over ${MAX_NOTES_BYTES}.`
    )
  let text: string
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(
      bytes
    )
  } catch {
    fail("The file is not UTF-8 text.")
  }
  const cleaned = cleanNotes(text)
  if (!cleaned) fail("The file is empty once comments are removed.")
  const facts = cleaned.split("\n").filter((l) => l.startsWith("- "))
  const unsourced = facts.filter((l) => !/\(source: \/[^)]*\)\s*$/.test(l))
  const placeholders = cleaned.match(/\[[A-Z][A-Z0-9 :]{2,}\]/g) ?? []
  console.log(
    `${real}: ${bytes.byteLength} bytes, ${facts.length} facts as the model will read them.`
  )
  if (unsourced.length)
    console.warn(
      `  ${unsourced.length} fact lines do not end with "(source: /page)". Ask can still use them, but cannot link them.`
    )
  if (placeholders.length)
    console.warn(
      `  ${placeholders.length} placeholders such as [LIKE THIS] are still in the file.`
    )
  console.log(
    "  Remember: a visitor can get the model to repeat any of this. Keep only what you would say on the record."
  )
  return real
}

switch (command) {
  case "check":
    checked(file)
    break
  case "upload":
    wrangler([
      "kv",
      "key",
      "put",
      NOTES_KEY,
      "--path",
      checked(file),
      ...target(),
    ])
    break
  case "delete":
    wrangler(["kv", "key", "delete", NOTES_KEY, ...target()])
    break
  default:
    fail(
      "Usage: notes.ts check|upload <file> [--local] [--dry-run], or notes.ts delete [--local]"
    )
}
