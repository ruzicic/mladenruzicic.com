import type { ReactNode } from "react"
// clsx, not `cn`: `app/error.tsx` is a client component that renders this,
// so `cn` put tailwind-merge (about 9 KB gzipped) in every page's bundle. No
// caller overrides the width or margin set here, so there is nothing to
// merge.
import { clsx as cn } from "clsx"

import type { PolymorphicTag } from "./polymorphic"

export interface ContainerProps {
  children: ReactNode
  as?: PolymorphicTag
  className?: string
  id?: string
}

/**
 * The text column every page uses: the boards' 540px times the type scale
 * (632px), starting 30px left of centre (374px on the 1440 frame), with a
 * 24px gutter on phones. The numbers live in
 * `app/globals.css` (`--column-width`, `--column-start`).
 */
export function Container({
  children,
  as: Tag = "div",
  className,
  id,
}: ContainerProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "box-border w-(--column-width) ml-(--column-start)",
        className
      )}
    >
      {children}
    </Tag>
  )
}
