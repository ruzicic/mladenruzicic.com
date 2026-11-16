import { z } from "zod"

/**
 * Shared zod building blocks for every content schema. Filesystem-free, so
 * client components may import anything re-exported from `./schema`.
 */

export const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "expected a 6-digit hex colour")

export const kebab = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a kebab-case id")

/** A site path (`/about`, `/#everything`), a `mailto:` or an absolute URL. */
export const href = z
  .string()
  .regex(
    /^(\/|#|mailto:|https?:\/\/)/,
    "expected a path, #anchor, mailto: or URL"
  )

/** A public path to a file under `public/`. */
export const publicPath = z.string().regex(/^\/[^/]/, "expected a public path")

/**
 * Parses `value` and, on failure, throws an Error naming the source file and
 * every offending path, so `next build` fails loudly on bad content.
 */
export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  value: unknown,
  source: string
): z.infer<T> {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  const issues = result.error.issues
    .map((i) => `  · ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n")
  throw new Error(`Invalid content in ${source}:\n${issues}`)
}
