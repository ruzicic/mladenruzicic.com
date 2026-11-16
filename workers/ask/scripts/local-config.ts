/**
 * The two account-issued ids the deploy needs, kept out of the public
 * repository: the notes KV namespace and the question log's D1 database.
 * Both live in the git-ignored `deploy.local.json` (copy
 * `deploy.local.example.json`), or in the environment as
 * `ASK_NOTES_NAMESPACE_ID` and `ASK_QUESTIONS_DATABASE_ID`, which win.
 */
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

export const WORKER_DIR = join(dirname(fileURLToPath(import.meta.url)), "..")
export const LOCAL_FILE = join(WORKER_DIR, "deploy.local.json")

/** A KV namespace id: 32 hexadecimal characters. */
const NAMESPACE_ID = /^[0-9a-f]{32}$/

/** A D1 database id: a UUID. */
const DATABASE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/** The binding and name of the question log, as in `wrangler.jsonc`. */
export const QUESTIONS_BINDING = "ASK_QUESTIONS"

function localValue(env: string, key: string): string {
  const fromEnv = process.env[env]?.trim()
  if (fromEnv) return fromEnv
  if (!existsSync(LOCAL_FILE)) return ""
  const local = JSON.parse(readFileSync(LOCAL_FILE, "utf8")) as Record<
    string,
    unknown
  >
  const value = local[key]
  return typeof value === "string" ? value.trim() : ""
}

export function notesNamespaceId(): string {
  const id = localValue("ASK_NOTES_NAMESPACE_ID", "notesNamespaceId")
  if (!NAMESPACE_ID.test(id)) {
    console.error(
      "No notes namespace id. Create the namespace once (README.md, step 3),\n" +
        "then put its id in workers/ask/deploy.local.json as\n" +
        '{ "notesNamespaceId": "<32 hex characters>" } or export ASK_NOTES_NAMESPACE_ID.'
    )
    process.exit(1)
  }
  return id
}

/**
 * The question log's database id, or `null` when none is set. A value that
 * is set but is not a UUID stops the script: a typo must not deploy a
 * Worker without its log (or let Wrangler provision a second database).
 */
export function questionsDatabaseId(): string | null {
  const id = localValue("ASK_QUESTIONS_DATABASE_ID", "questionsDatabaseId")
  if (!id) return null
  if (!DATABASE_ID.test(id.toLowerCase())) {
    console.error(
      "The questions database id in workers/ask/deploy.local.json (or\n" +
        "ASK_QUESTIONS_DATABASE_ID) is not a D1 database id. Copy the\n" +
        '"database_id" that `wrangler d1 create` printed (a UUID).'
    )
    process.exit(1)
  }
  return id.toLowerCase()
}

/** Exits with the setup steps when there is no database id. */
export function requireQuestionsDatabaseId(): string {
  const id = questionsDatabaseId()
  if (id) return id
  console.error(
    "No question log database id. Create the database once (README.md,\n" +
      '"Question log"), then put its id in workers/ask/deploy.local.json as\n' +
      '"questionsDatabaseId": "<the database_id>" or export ASK_QUESTIONS_DATABASE_ID.'
  )
  process.exit(1)
}

type RawConfig = Record<string, unknown> & {
  kv_namespaces?: { binding: string; id?: string }[]
  d1_databases?: { binding: string; database_id?: string }[]
  vars?: Record<string, unknown>
}

export type DeployConfigResult =
  | { ok: true; config: RawConfig; questionLog: "on" | "off" }
  | { ok: false; error: string }

/** `ASK_LOG_RETENTION_DAYS` as the Worker reads it: "0" is off. */
export function logRetentionDays(raw: RawConfig): number {
  const n = Number.parseInt(String(raw.vars?.ASK_LOG_RETENTION_DAYS ?? ""), 10)
  return Number.isFinite(n) ? Math.max(0, n) : 90
}

/**
 * `wrangler.jsonc` with the ids filled in. With the question log switched
 * on (`ASK_LOG_RETENTION_DAYS` above 0) a database id is required: without
 * one the deploy stops, because Wrangler would otherwise provision a new,
 * unmigrated database on its own and every question would fail to log.
 * With the log switched off and no id, the binding is left out and the
 * Worker runs exactly as it did before the log existed.
 */
export function buildDeployConfig(
  raw: RawConfig,
  ids: { notesNamespaceId: string; questionsDatabaseId: string | null }
): DeployConfigResult {
  const namespaces = raw.kv_namespaces ?? []
  if (!namespaces.some((n) => n.binding === "ASK_NOTES"))
    return { ok: false, error: "wrangler.jsonc has no ASK_NOTES binding." }
  const databases = raw.d1_databases ?? []
  if (!databases.some((d) => d.binding === QUESTIONS_BINDING))
    return {
      ok: false,
      error: `wrangler.jsonc has no ${QUESTIONS_BINDING} binding.`,
    }
  const config: RawConfig = {
    ...raw,
    kv_namespaces: namespaces.map((n) =>
      n.binding === "ASK_NOTES" ? { ...n, id: ids.notesNamespaceId } : n
    ),
  }
  if (ids.questionsDatabaseId) {
    config.d1_databases = databases.map((d) =>
      d.binding === QUESTIONS_BINDING
        ? { ...d, database_id: ids.questionsDatabaseId! }
        : d
    )
    return { ok: true, config, questionLog: "on" }
  }
  if (logRetentionDays(raw) > 0)
    return {
      ok: false,
      error:
        "The question log is on (ASK_LOG_RETENTION_DAYS in wrangler.jsonc) but\n" +
        "there is no database id. Either create the database (README.md,\n" +
        '"Question log", steps 1 to 3) and put its id in deploy.local.json as\n' +
        '"questionsDatabaseId", or set ASK_LOG_RETENTION_DAYS to "0" to deploy\n' +
        "without the log. Nothing was deployed.",
    }
  const rest = databases.filter((d) => d.binding !== QUESTIONS_BINDING)
  if (rest.length) config.d1_databases = rest
  else delete config.d1_databases
  return { ok: true, config, questionLog: "off" }
}
