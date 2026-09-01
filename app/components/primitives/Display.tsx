import { cn } from "@/lib/utils"

export interface DisplayProps {
  /**
   * Heading text. Words wrapped in braces become the italic accent:
   * `"I build products, platforms and the {systems} around them."`
   */
  children: string
  /** Heading level. Default `h2`. */
  as?: "h1" | "h2" | "h3"
  /** Size ramp. `hero` is the homepage H1 clamp; `section` is the work-row h3. */
  size?: "hero" | "section" | "sub"
  className?: string
  id?: string
}

const SIZES: Record<NonNullable<DisplayProps["size"]>, string> = {
  hero: "text-[clamp(46px,7.4vw,124px)] leading-[0.96] tracking-[-0.025em] max-w-[15ch]",
  section: "text-[clamp(34px,3.6vw,56px)] leading-none tracking-[-0.02em]",
  sub: "text-[clamp(28px,3vw,44px)] leading-[1.05] tracking-[-0.02em]",
}

/** Splits `"a {b} c"` into plain and accented runs. Exported for tests/mirrors. */
export function parseDisplay(
  value: string
): { text: string; accent: boolean }[] {
  const out: { text: string; accent: boolean }[] = []
  const re = /\{([^{}]+)\}/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(value)) !== null) {
    if (m.index > last)
      out.push({ text: value.slice(last, m.index), accent: false })
    out.push({ text: m[1], accent: true })
    last = m.index + m[0].length
  }
  if (last < value.length) out.push({ text: value.slice(last), accent: false })
  return out
}

/** Plain-text version of a `{braced}` heading, for metadata and md mirrors. */
export function displayToPlainText(value: string): string {
  return value.replace(/\{([^{}]+)\}/g, "$1")
}

/**
 * Display heading set in Gloock. `{braced}` words render as `<em>` in
 * Instrument Serif Italic, accent colour.
 */
export function Display({
  children,
  as: Tag = "h2",
  size = "section",
  className,
  id,
}: DisplayProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "m-0 font-display font-normal text-fg",
        SIZES[size],
        className
      )}
    >
      {parseDisplay(children).map((part, i) =>
        part.accent ? (
          <em key={i} className="font-serif-italic italic text-accent">
            {part.text}
          </em>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </Tag>
  )
}
