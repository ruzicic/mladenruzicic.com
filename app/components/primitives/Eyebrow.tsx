import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import type { PolymorphicTag } from "./polymorphic"

export interface EyebrowProps {
  /**
   * A single node, or an array of nodes joined by accent dot separators
   * (the hero eyebrow: "Technical product owner · Founder · Builder · …").
   */
  children?: ReactNode
  items?: ReactNode[]
  /** Render as something else (`h2` for section headings). Default `p`. */
  as?: PolymorphicTag
  className?: string
  id?: string
}

/**
 * 12px mono, uppercase, `.08em` tracking, muted. The one label style used for
 * every eyebrow, section heading and metadata line in the design.
 */
export function Eyebrow({
  children,
  items,
  as: Tag = "p",
  className,
  id,
}: EyebrowProps) {
  const content =
    items && items.length > 0
      ? items.map((item, i) => (
          <span key={i} className="contents">
            {i > 0 ? (
              <span aria-hidden className="text-accent">
                ·
              </span>
            ) : null}
            <span>{item}</span>
          </span>
        ))
      : children

  return (
    <Tag
      id={id}
      className={cn(
        "m-0 flex flex-wrap items-center gap-x-[18px] gap-y-1",
        "font-mono text-[12px] uppercase leading-none tracking-[0.08em] text-muted",
        className
      )}
    >
      {content}
    </Tag>
  )
}
