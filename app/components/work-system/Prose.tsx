import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export interface ProseProps {
  children: ReactNode
  className?: string
}

/**
 * Long-form body copy: compiled MDX on `/work/[slug]`, `/about` and `/uses`.
 *
 * `prose prose-invert` supplies the vertical rhythm from
 * `@tailwindcss/typography`; `prose-tuned` (app/styles/pages.css) retunes it to
 * the design tokens — a 68ch measure, `text-wrap: pretty`, headings in the sans
 * face at 600 with mono/tabular numerals, hairline section rules and accent
 * links.
 */
export function Prose({ children, className }: ProseProps) {
  return (
    <div className={cn("prose prose-invert prose-tuned", className)}>
      {children}
    </div>
  )
}
