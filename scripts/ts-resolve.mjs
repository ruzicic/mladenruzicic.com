/**
 * A tiny resolve hook so plain Node (22.18+, which strips TypeScript types
 * itself) can run the site's own content loaders outside Next: it maps the
 * `@/` alias from `tsconfig.json` to the repo root and adds the `.ts`
 * extension the source omits. No dependency, no build step.
 *
 *   node --import ./scripts/ts-register.mjs scripts/build-ask-context.ts
 */
import { existsSync, statSync } from "node:fs"
import { dirname, resolve as resolvePath } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..")
const EXTENSIONS = [".ts", ".tsx", "/index.ts"]

function candidate(path) {
  if (existsSync(path) && statSync(path).isFile()) return path
  for (const ext of EXTENSIONS) {
    if (existsSync(path + ext)) return path + ext
  }
  return null
}

export async function resolve(specifier, context, next) {
  let path = null
  if (specifier.startsWith("@/")) {
    path = candidate(resolvePath(ROOT, specifier.slice(2)))
  } else if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL?.startsWith("file:")
  ) {
    const base = dirname(fileURLToPath(context.parentURL))
    const full = resolvePath(base, specifier)
    if (!existsSync(full) || !statSync(full).isFile()) path = candidate(full)
  }
  if (path) return next(pathToFileURL(path).href, context)
  return next(specifier, context)
}
