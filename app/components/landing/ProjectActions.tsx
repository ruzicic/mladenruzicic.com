// clsx, not `cn`: this renders inside the popover island too, and `cn` pulls
// tailwind-merge into its chunk. Nothing here needs merging.
import { clsx as cn } from "clsx"

import type { ProjectLinks } from "@/lib/content/schema"
import { Icon } from "@/app/components/primitives/Icon"
import { TransitionLink } from "@/app/components/primitives/TransitionLink"

export interface ProjectActionsProps {
  links: ProjectLinks
  /** The wrapper (`lk-pop-acts` in a popover, `lc-acts` on a strip card). */
  className?: string
  /** Each link. */
  linkClassName?: string
  /**
   * Marks the primary action, the case study or else the website, with
   * `data-rail-primary`: a click on the rest of a strip card in focus
   * follows it (`useRail`). Strip cards only.
   */
  markPrimary?: boolean
}

/**
 * A project's two explicit actions on the landing (owner, 13 Nov 2026):
 * "Case study →" (its page here, same tab) first, then "Website ↗" (its own
 * site, a new tab). Either may be missing; with neither this renders
 * nothing. Each link's accessible name says the project and where it goes
 * ("TenderLift case study", "TenderLift website, tenderlift.ch, opens in a
 * new tab"), so it stands on its own in a links list. The arrows are
 * decorative. On a strip card (`markPrimary`) the first of them is also
 * where a click on the card itself goes (owner, 16 Nov 2026).
 */
export function ProjectActions({
  links,
  className,
  linkClassName,
  markPrimary = false,
}: ProjectActionsProps) {
  const { caseStudy, website } = links
  if (!caseStudy && !website) return null
  return (
    <span className={className}>
      {caseStudy ? (
        <TransitionLink
          href={caseStudy.href}
          className={cn(linkClassName)}
          aria-label={caseStudy.name}
          data-action="case-study"
          data-rail-primary={markPrimary ? "" : undefined}
        >
          {caseStudy.label}
          <Icon name="arrow-right" />
        </TransitionLink>
      ) : null}
      {website ? (
        <a
          href={website.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(linkClassName)}
          aria-label={website.name}
          data-action="website"
          data-track={website.track}
          data-rail-primary={markPrimary && !caseStudy ? "" : undefined}
        >
          {website.label}
          <Icon name="arrow-up-right" />
        </a>
      ) : null}
    </span>
  )
}
