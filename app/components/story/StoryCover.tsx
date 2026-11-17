import type { CSSProperties } from "react"

import { websiteEvent } from "@/lib/analytics"
import { getProductMark, getProjectLinks } from "@/lib/content"
import type { Story } from "@/lib/content/schema"
import { ExternalLink } from "@/app/components/primitives/ExternalLink"
import { ProductTile } from "@/app/components/primitives/ProductTile"

import { serifEm } from "./fit"
import { STORY_LABELS } from "./labels"

/** The name's tracking (story.css, `.cs-name`). */
const NAME_TRACKING = -0.03

/**
 * The first screen of a case study (owner, 16 Nov 2026: "full height focus
 * on the case study of that project: name, description, logo, backdrop,
 * core numbers"; the board's "A · Plate"): the whole screen in the story's
 * plate, the tile, the name in large Geist Serif, the summary, the mono meta
 * line and the live site (the story's `live`, else the product's website);
 * the numbers anchored to the foot above a thin rule, with their "as of"
 * line where there is one. No picture: the first square of the column
 * comes up over the cover's foot (`StoryPage`).
 *
 * The name and the figures are sized to their room on the server
 * (`serifEm`): the name is the page's largest paint, so nothing measures it
 * after the fact.
 */
export function StoryCover({ story }: { story: Story }) {
  const { panel } = story
  const mark = getProductMark(story.slug)
  const numbers = panel.numbers ?? []
  // The live site: the story's own line, else the product's website, so
  // every story whose project has one shows it here (owner, 16 Nov 2026: on
  // phones a list row goes to the case study only, and the website is on
  // the cover).
  const site = getProjectLinks(story.slug, story.title).website
  const live =
    panel.live ?? (site ? { label: site.domain, href: site.href } : undefined)
  const widest = Math.max(0, ...numbers.map((n) => serifEm(n.value)))

  return (
    <header className="cs-cover" aria-labelledby="cs-title">
      <div
        className="cs-cover-in"
        style={
          {
            "--cs-name-em": serifEm(story.title, NAME_TRACKING),
          } as CSSProperties
        }
      >
        <div className="cs-cover-head">
          {mark ? (
            <span className="cs-cover-tile">
              <ProductTile mark={mark} className="cs-tile" />
            </span>
          ) : null}
          {/* Focus lands here from the bar's "back to top" (`StoryBack`). */}
          <h1 id="cs-title" className="cs-name" tabIndex={-1}>
            {story.title}
          </h1>
          <p className="cs-summary">{panel.summary}</p>
          <p className="cs-meta">{panel.meta.join(" · ")}</p>
          {live ? (
            <p className="cs-live-line">
              <ExternalLink
                href={live.href}
                className="cs-live"
                data-track={websiteEvent(story.slug)}
              >
                {live.label}
              </ExternalLink>
            </p>
          ) : null}
        </div>

        <div className="cs-cover-foot">
          {numbers.length ? (
            <dl
              className="cs-numbers"
              aria-label={STORY_LABELS.numbers}
              style={
                {
                  "--cs-n": numbers.length,
                  "--cs-num-em": widest,
                } as CSSProperties
              }
            >
              {numbers.map((n) => (
                <div key={n.value + n.lines.join(" ")} className="cs-number">
                  <dt className="cs-number-label">
                    {n.lines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </dt>
                  <dd className="cs-number-value">{n.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {numbers.length ? (
            <div className="cs-cover-rule" aria-hidden="true" />
          ) : null}
          {numbers.length && panel.numbersAsOf ? (
            <p className="cs-meta cs-asof">{panel.numbersAsOf}</p>
          ) : null}
        </div>
      </div>
    </header>
  )
}
