import { getMentoring } from "@/lib/content"
import type { RichText } from "@/lib/content/schema"
import { Button } from "@/app/components/primitives/Button"
import { ExternalLink } from "@/app/components/primitives/ExternalLink"
import { mapRich } from "@/app/components/primitives/rich-text"
import { TransitionLink } from "@/app/components/primitives/TransitionLink"
import { VisuallyHidden } from "@/app/components/primitives/VisuallyHidden"

/**
 * The closing block of `/mentoring`, after "How it works" (owner, 15 Nov
 * 2026: "include booking link on my mentoring page"): one line, the page's
 * one clear action (the booking link, drawn with the `Button` primitive like
 * the About CV download), and a quiet second way in under it.
 */
export function MentoringCta() {
  const { cta } = getMentoring()
  const external = cta.action.external || /^https?:/.test(cta.action.href)

  return (
    <section aria-labelledby="ment-cta" className="ment-col ment-cta">
      <h2 id="ment-cta" className="ment-h2">
        {cta.line}
      </h2>
      <div className="ment-cta__action">
        {external ? (
          <Button
            as="a"
            href={cta.action.href}
            target="_blank"
            rel="noopener"
            data-external=""
          >
            {cta.action.label}
            <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
          </Button>
        ) : (
          <Button as={TransitionLink} href={cta.action.href}>
            {cta.action.label}
          </Button>
        )}
      </div>
      <p className="ment-cta__alt">{renderAlt(cta.alt)}</p>
    </section>
  )
}

function renderAlt(text: RichText) {
  return mapRich(text, (seg, i) => {
    if (seg.kind !== "link") return seg.text
    if (/^https?:/.test(seg.href))
      return (
        <ExternalLink key={i} href={seg.href} hideArrow>
          {seg.text}
        </ExternalLink>
      )
    if (seg.href.startsWith("/"))
      return (
        <TransitionLink key={i} href={seg.href}>
          {seg.text}
        </TransitionLink>
      )
    return (
      <a key={i} href={seg.href}>
        {seg.text}
      </a>
    )
  })
}
