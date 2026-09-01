import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import type { PolymorphicTag } from "./polymorphic"

export interface ContainerProps {
  children: ReactNode
  as?: PolymorphicTag
  /** Drop the horizontal gutters (for full-bleed rails that pad themselves). */
  bleed?: boolean
  className?: string
  id?: string
}

/**
 * Centred 1400px column with the 40px gutter (24px under 720px).
 * Gutters come from the `--gutter` custom property in `app/globals.css`.
 */
export function Container({
  children,
  as: Tag = "div",
  bleed = false,
  className,
  id,
}: ContainerProps) {
  return (
    <Tag
      id={id}
      className={cn("mx-auto w-full max-w-page box-border", className)}
      style={bleed ? undefined : { paddingInline: "var(--gutter)" }}
    >
      {children}
    </Tag>
  )
}
