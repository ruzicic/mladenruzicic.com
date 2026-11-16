/**
 * Writes `wrangler.deploy.json` (git-ignored): `wrangler.jsonc` with the
 * notes namespace id and the question log's database id filled in from
 * `deploy.local.json`. `pnpm run deploy` runs this and then
 * `wrangler deploy --config wrangler.deploy.json`, so the committed config
 * never holds an id and Wrangler never provisions a second namespace or
 * database or writes one back into it.
 *
 * With the question log on and no database id, this stops the deploy (see
 * `buildDeployConfig`).
 */
import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { experimental_readRawConfig } from "wrangler"

import {
  buildDeployConfig,
  notesNamespaceId,
  questionsDatabaseId,
  WORKER_DIR,
} from "./local-config"

const OUT = join(WORKER_DIR, "wrangler.deploy.json")

const { rawConfig } = experimental_readRawConfig(
  { config: join(WORKER_DIR, "wrangler.jsonc") },
  { useRedirectIfAvailable: false }
)
const result = buildDeployConfig(rawConfig as Record<string, unknown>, {
  notesNamespaceId: notesNamespaceId(),
  questionsDatabaseId: questionsDatabaseId(),
})
if (!result.ok) {
  console.error(result.error)
  process.exit(1)
}
writeFileSync(OUT, `${JSON.stringify(result.config, null, 2)}\n`)
console.log(
  result.questionLog === "on"
    ? "Wrote wrangler.deploy.json (git-ignored) with the notes namespace and the question log."
    : "Wrote wrangler.deploy.json (git-ignored) with the notes namespace; the question log is off."
)
