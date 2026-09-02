import type { CompanyId, HeroLogoId } from "@/lib/content/schema"

/**
 * The serialisable shape the Server Component hands to the canvas island.
 * Everything the scene and the tooltip need — no content loader on the client.
 */
export interface HeroLogoShard {
  id: HeroLogoId
  /** Timeline band this shard highlights/expands (`execom` → `wolkabout`). */
  bandId: CompanyId
  /** Company name for the tooltip. */
  name: string
  /** e.g. "Oct 2023 – now". */
  years: string
  /** Brand hex, used for the hover tint and the tooltip rule. */
  color: string
  /** 1–2 letter fallback drawn when the SVG mark is missing or empty. */
  mark: string
  /** `/static/logos/mono/<id>.svg`. */
  markSrc: string
}

/**
 * Yellow accent from `--color-accent`; the WebGL scene needs a literal, not a
 * custom property. Re-exported from `lib/color` so there is one copy of the
 * value in the repo — a second literal is how the hero lede chip ended up
 * computing its ink against black instead of yellow.
 */
export { ACCENT } from "@/lib/color"

/** `--color-bg`, for the fog. */
export const BG = "#0B0B0C"
