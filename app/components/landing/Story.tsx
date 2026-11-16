import "@/app/styles/landing.css"
import "@/app/styles/brand-link.css"

import { getHome, getProductMark, getProjectLinks } from "@/lib/content"
import type { RichText } from "@/lib/content/schema"
import { ExternalLink } from "@/app/components/primitives/ExternalLink"
import { mapRich } from "@/app/components/primitives/rich-text"
import { TransitionLink } from "@/app/components/primitives/TransitionLink"

import { HoldZone } from "./HeadlineCycle"
import { LinkLockup, PopoverLockup } from "./StoryLockup"

/**
 * The four paragraphs under the headline, with inline product
 * tiles (`Landing.dc.html`, story "working").
 *
 * Wired both ways to the headline through `headline-store`: pointing at (or
 * focusing) a product shows its phrase above, and the product whose phrase is
 * on show is lit (its tile pops once, its underline turns ink). Only the small
 * lockup islands subscribe; the paragraphs themselves are server-rendered.
 *
 * A popover's links are the project's own (owner, 13 Nov 2026): "Case
 * study" and "Website" from `content/products.ts` (`getProjectLinks`); a
 * tile that is not such a project keeps its content link (Mentoring).
 *
 * The paragraphs are real `<p>`s. Each popover panel is a `<span popover>`
 * right after its trigger (the `Popover` primitive with `as="span"`): valid
 * inside a paragraph, shown in the top layer while open, and read straight
 * after the name it belongs to.
 */
export function Story() {
  const { headline, stance, paragraphs } = getHome()
  const phraseOf = (ref: string) =>
    headline.phrases.findIndex((p) => p.ref === ref)

  const render = (text: RichText) =>
    mapRich(text, (seg, i) => {
      if (seg.kind === "text") return seg.text
      if (seg.kind === "link") {
        return seg.external ? (
          <ExternalLink key={i} href={seg.href} rel={seg.me ? "me" : undefined}>
            {seg.text}
          </ExternalLink>
        ) : (
          <TransitionLink key={i} href={seg.href}>
            {seg.text}
          </TransitionLink>
        )
      }
      const mark = getProductMark(seg.ref)
      if (!mark) throw new Error(`story: no product "${seg.ref}"`)
      const face = { mark, text: seg.text, phrase: phraseOf(seg.ref) }
      if (seg.popover) {
        return (
          <PopoverLockup
            key={i}
            popover={seg.popover}
            links={getProjectLinks(seg.ref, seg.text)}
            {...face}
          />
        )
      }
      if (seg.href) return <LinkLockup key={i} href={seg.href} {...face} />
      return (
        <span key={i} className="lk-static">
          {seg.text}
        </span>
      )
    })

  return (
    <section id="story" className="lp-story">
      <p className="lp-stance">{stance}</p>
      <HoldZone hold="para" className="lp-paras">
        {paragraphs.map((p, i) => (
          <p key={i} className="lp-para">
            {render(p)}
          </p>
        ))}
      </HoldZone>
    </section>
  )
}
