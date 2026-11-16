import "@/app/styles/landing.css"

import { getHome, getProductMark } from "@/lib/content"

import {
  HeadlineOn,
  HeadlinePause,
  HeadlineSlot,
  HoldZone,
  type CyclePhrase,
} from "./HeadlineCycle"

/**
 * "I'm working with [tile] Swiss bid teams", cycling through the five phrases
 * (`Landing.dc.html`, story "working"). The `<h1>` of `/`.
 *
 * How the five phrases are exposed: the prefix is real text; right after it a
 * visually hidden span finishes the content's `srText` (" Swiss bid teams,
 * designers on a budget, … and truck drivers."), so a screen reader and a
 * crawler read one plain sentence naming all five. The swapping line is `aria-hidden`
 * and holds only the phrase on show (plus the one leaving), so no phrase is
 * repeated five times in the markup. The product lines are one hidden sentence
 * after the heading (`onSrText`).
 *
 * The server renders the first phrase, so the page's largest paint is this
 * text; the line box is reserved for the longest phrase (a CSS `attr()` sizer,
 * not a second copy of the text), so nothing moves when the cycle starts or
 * when a longer phrase wraps on a narrow screen.
 */
export function Headline() {
  const { headline } = getHome()
  const phrases: CyclePhrase[] = headline.phrases.map((p) => {
    const mark = getProductMark(p.ref)
    if (!mark) throw new Error(`headline: no product "${p.ref}"`)
    return { phrase: p.phrase, on: p.on, mark }
  })
  const sizer = phrases.reduce(
    (a, p) => (p.phrase.length > a.length ? p.phrase : a),
    ""
  )
  const rest = headline.srText.startsWith(headline.prefix)
    ? headline.srText.slice(headline.prefix.length)
    : null

  return (
    <section id="headline" className="lw">
      <HoldZone hold="head" className="lw-zone">
        <h1 className="lw-h">
          {rest === null ? (
            <>
              <span className="sr-only">{headline.srText}</span>
              <span aria-hidden="true" className="lw-prefix">
                {headline.prefix}
              </span>
            </>
          ) : (
            <>
              <span className="lw-prefix">{headline.prefix}</span>
              <span className="sr-only">{rest}</span>
            </>
          )}
          <HeadlineSlot phrases={phrases} sizer={sizer} />
        </h1>
        <div className="lw-row">
          <HeadlineOn phrases={phrases} />
          <HeadlinePause
            count={phrases.length}
            paceMs={headline.paceMs}
            pauseLabel={headline.pauseLabel}
            playLabel={headline.playLabel}
          />
        </div>
        <p className="sr-only">{headline.onSrText}</p>
      </HoldZone>
    </section>
  )
}
