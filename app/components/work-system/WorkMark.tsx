import { inkOn } from "@/lib/color"
import type { WorkEntry } from "@/lib/content/schema"
import { cn } from "@/lib/utils"

/** The letters shown when an entry has neither a `logo` nor a `mark`. */
export function fallbackMark(entry: WorkEntry): string {
  const source = entry.shortTitle ?? entry.title
  const words = source.split(/[\s.\-/]+/).filter(Boolean)
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

export interface WorkMarkProps {
  entry: WorkEntry
  /** Edge of the square, in px. The set is tuned at 18 / 28 / 52. */
  size?: number
  className?: string
}

/**
 * One entry's mark in a square tinted with its accent — the same idiom as the
 * `brand` chip's leading square, standing on its own next to a title.
 *
 * The SVGs under `public/static/logos/work/` are white-filled geometry, so the
 * mark is painted as a `mask-image` in `inkOn(accent)` rather than drawn as an
 * `<img>`: a white glyph would disappear on TenderLift yellow or FontSwap bone.
 * When `logo` is absent (Boxium, FlexMatch, Hi Fam — no published mark exists)
 * the square falls back to `mark`, and then to the entry's initials.
 */
export function WorkMark({ entry, size = 28, className }: WorkMarkProps) {
  const ink = inkOn(entry.accent)
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-xs font-semibold leading-none",
        className
      )}
      style={{
        width: size,
        height: size,
        background: entry.accent,
        color: ink,
        fontSize: Math.round(size * 0.4),
      }}
    >
      {entry.logo ? (
        <span
          className="block"
          style={{
            width: Math.round(size * 0.7),
            height: Math.round(size * 0.7),
            background: ink,
            maskImage: `url(${entry.logo})`,
            WebkitMaskImage: `url(${entry.logo})`,
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
      ) : (
        (entry.mark ?? fallbackMark(entry))
      )}
    </span>
  )
}
