import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import { Container } from "./Container"
import { Eyebrow } from "./Eyebrow"

export interface SectionProps {
  children: ReactNode
  /** Anchor id — also used as `aria-labelledby` target by `SectionHeader`. */
  id?: string
  /** Human label for the mobile pill / IntersectionObserver. */
  label?: string
  /** Hairline above the section. */
  divider?: boolean
  /** Skip the Container so the section can host a full-bleed rail. */
  bleed?: boolean
  className?: string
}

/** A page section: vertical rhythm, optional hairline, optional container. */
export function Section({
  children,
  id,
  label,
  divider = false,
  bleed = false,
  className,
}: SectionProps) {
  const body = bleed ? children : <Container>{children}</Container>
  return (
    <section
      id={id}
      data-section={label}
      aria-label={label}
      className={cn(
        "relative py-[96px] md:py-[120px]",
        divider && "border-t border-line-soft",
        className
      )}
    >
      {body}
    </section>
  )
}

export interface SectionHeaderProps {
  /** Left-hand label. Rendered as an `h2` in the eyebrow style, per the design. */
  title: string
  /** Right-hand metadata ("5 of many · most recent first"). */
  meta?: ReactNode
  id?: string
  className?: string
}

/** Eyebrow left, meta right, hairline on top. */
export function SectionHeader({
  title,
  meta,
  id,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-[72px] flex items-baseline justify-between gap-6",
        "border-t border-line pt-5",
        className
      )}
    >
      <Eyebrow as="h2" id={id} className="text-fg">
        {title}
      </Eyebrow>
      {meta ? (
        <Eyebrow className="justify-end text-right">{meta}</Eyebrow>
      ) : null}
    </div>
  )
}
