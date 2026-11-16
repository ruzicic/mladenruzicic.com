/**
 * The links an answer may point to: exactly the site map at the end of
 * `content/ask/context.md` (`- <href> | <label> | <what it is>`). Anything
 * the model names that is not in it is dropped before it reaches a visitor.
 */

export interface Source {
  href: string
  label: string
}

export interface SourceIndex {
  /** Every allowed link, in site-map order. */
  all: Source[]
  /** The site's own origin, read from the context (`https://…`). */
  siteUrl: string
  /** The `mailto:` link, for "unknown" answers. */
  email?: Source
  find(href: string): Source | undefined
}

const LINE = /^- (\S+) \| ([^|]+?) \| .*$/

export function parseSiteMap(context: string): SourceIndex {
  const start = context.indexOf("\n## Site map")
  if (start < 0) throw new Error("context.md has no '## Site map' section")
  const all: Source[] = []
  for (const line of context
    .slice(start + 1)
    .split("\n")
    .slice(1)) {
    if (line.startsWith("## ")) break
    const m = LINE.exec(line.trim())
    if (m) all.push({ href: m[1], label: m[2].trim() })
  }
  if (all.length === 0) throw new Error("context.md has an empty site map")
  const siteUrl =
    /the page of (https:\/\/[^\s,]+?) it comes from/.exec(context)?.[1] ?? ""
  const byKey = new Map(all.map((s) => [key(s.href), s]))
  return {
    all,
    siteUrl,
    email: all.find((s) => s.href.startsWith("mailto:")),
    find(href: string) {
      return byKey.get(key(normalize(href, siteUrl)))
    },
  }
}

/** Compare links without a trailing slash, case-insensitive for the host. */
function key(href: string): string {
  if (href.startsWith("/") || href.startsWith("mailto:"))
    return href.replace(/(.)\/$/, "$1")
  try {
    const u = new URL(href)
    return `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/(.)\/$/, "$1")}${u.search}${u.hash}`
  } catch {
    return href
  }
}

/** The site's own absolute URLs become paths: `https://site/about` -> `/about`. */
export function normalize(href: string, siteUrl: string): string {
  const h = href.trim()
  if (
    siteUrl &&
    (h === siteUrl ||
      h.startsWith(`${siteUrl}/`) ||
      h.startsWith(`${siteUrl}#`))
  ) {
    const rest = h.slice(siteUrl.length)
    return rest === "" ? "/" : rest.startsWith("#") ? `/${rest}` : rest
  }
  return h
}

/**
 * The model's proposed sources, kept only when they are in the site map:
 * deduplicated, at most `max`, in the model's order.
 */
export function validateSources(
  proposed: unknown,
  index: SourceIndex,
  max = 3
): Source[] {
  if (!Array.isArray(proposed)) return []
  const out: Source[] = []
  for (const item of proposed) {
    const href =
      typeof item === "string"
        ? item
        : item &&
            typeof item === "object" &&
            typeof (item as { href?: unknown }).href === "string"
          ? (item as { href: string }).href
          : null
    if (!href) continue
    const found = index.find(href)
    if (found && !out.some((s) => s.href === found.href)) out.push(found)
    if (out.length >= max) break
  }
  return out
}
