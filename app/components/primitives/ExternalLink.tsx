import type { AnchorHTMLAttributes, ReactNode } from "react"
// clsx, not `cn`: this renders inside client islands, and `cn` pulls
// tailwind-merge (about 8 KB gzipped) into their chunks. No caller passes a
// class that conflicts with the ones set here, so there is nothing to merge.
import { clsx as cn } from "clsx"

import { linkEvent } from "@/lib/analytics"

import { Icon } from "./Icon"
import { VisuallyHidden } from "./VisuallyHidden"

export interface ExternalLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "children"
> {
  href: string
  children: ReactNode
  /**
   * Extra `rel` tokens (for example `"me"` on his own profiles). `noopener` is
   * always present.
   */
  rel?: string
  /**
   * Open in a new tab. Default `true`; a visually hidden "(opens in a new
   * tab)" is appended for screen readers.
   */
  newTab?: boolean
  /** Hide the arrow (when the context already says the link leaves). */
  hideArrow?: boolean
}

/**
 * A link to another site: the text, then a small up-right arrow that nudges
 * 1px up and right on hover and focus (`.lp-ext` on the boards). Inherits
 * colour and size from its context; the underline, if any, comes from the
 * caller's class or the base link styles.
 */
export function ExternalLink({
  href,
  children,
  rel,
  newTab = true,
  hideArrow = false,
  className,
  ...rest
}: ExternalLinkProps) {
  const relTokens = new Set(["noopener", ...(rel?.split(/\s+/) ?? [])])
  relTokens.delete("")
  return (
    <a
      href={href}
      rel={[...relTokens].join(" ")}
      target={newTab ? "_blank" : undefined}
      data-external=""
      data-track={linkEvent(href)}
      className={cn(
        "group/ext inline-flex items-baseline gap-[0.25em]",
        className
      )}
      {...rest}
    >
      {children}
      {hideArrow ? null : <Icon name="arrow-up-right" />}
      {newTab ? <VisuallyHidden> (opens in a new tab)</VisuallyHidden> : null}
    </a>
  )
}
