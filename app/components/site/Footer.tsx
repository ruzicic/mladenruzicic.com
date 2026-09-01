import { getSite } from "@/lib/content"

import { Container } from "../primitives/Container"
import { NavPending } from "../primitives/NavPending"
import { TransitionLink } from "../primitives/TransitionLink"
import { currentYear } from "./now"

/**
 * Site footer. The extra bottom padding clears the mobile pill and the home
 * indicator on iOS.
 */
export async function Footer() {
  const site = getSite()
  const year = await currentYear()

  return (
    <Container
      as="footer"
      className={[
        "flex flex-wrap items-center justify-between gap-6 border-t border-line-soft",
        "pt-10 pb-[calc(100px+env(safe-area-inset-bottom))]",
        "font-mono text-[12px] uppercase tracking-[0.08em] text-muted",
      ].join(" ")}
    >
      <span>
        {site.name} © {year}
      </span>
      <nav aria-label="Elsewhere" className="flex flex-wrap gap-6">
        <a
          href={site.links.linkedin}
          target="_blank"
          rel="noreferrer noopener"
          data-hover
        >
          LinkedIn ↗
        </a>
        <a
          href={site.links.github}
          target="_blank"
          rel="noreferrer noopener"
          data-hover
        >
          GitHub ↗
        </a>
        <TransitionLink href="/uses" data-hover>
          Uses
          <NavPending />
        </TransitionLink>
        <a href={site.links.cv} data-hover>
          CV
        </a>
      </nav>
    </Container>
  )
}
