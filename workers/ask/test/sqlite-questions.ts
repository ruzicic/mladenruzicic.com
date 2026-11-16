import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { DatabaseSync } from "node:sqlite"

import type { LogDatabase } from "../src/questions-log"

const MIGRATIONS = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "migrations"
)

/**
 * The question log's D1 database, as a local in-memory SQLite (`node:sqlite`)
 * built from the real migration, so the tests run the Worker's own SQL
 * against the real schema. `fail` makes every statement throw, `hang` makes
 * every statement never finish, like a D1 outage.
 */
export class SqliteQuestions implements LogDatabase {
  readonly db = new DatabaseSync(":memory:")
  readonly statements: string[] = []
  fail = false
  hang = false

  constructor() {
    for (const file of readdirSync(MIGRATIONS).sort())
      this.db.exec(readFileSync(join(MIGRATIONS, file), "utf8"))
  }

  prepare(query: string) {
    return {
      bind: (...values: unknown[]) => ({
        run: async () => {
          this.statements.push(query)
          if (this.hang) return new Promise<never>(() => {})
          if (this.fail) throw new Error("D1_ERROR: database unavailable")
          return this.db
            .prepare(query)
            .run(...(values as (string | number | null)[]))
        },
      }),
    }
  }

  rows(): Record<string, unknown>[] {
    return this.db
      .prepare("SELECT * FROM questions ORDER BY id")
      .all() as Record<string, unknown>[]
  }

  columns(): string[] {
    return (
      this.db.prepare("PRAGMA table_info(questions)").all() as {
        name: string
      }[]
    ).map((c) => c.name)
  }
}
