import type { CSSProperties } from "react"

import { getMentoring, getProductMark } from "@/lib/content"
import type { RichText } from "@/lib/content/schema"
import { ExternalLink } from "@/app/components/primitives/ExternalLink"
import { Icon } from "@/app/components/primitives/Icon"
import { ProductTile } from "@/app/components/primitives/ProductTile"
import { mapRich } from "@/app/components/primitives/rich-text"
import { TransitionLink } from "@/app/components/primitives/TransitionLink"

/**
 * The heading block of `/mentoring` (`Landing-Mentoring.dc.html`): the Geist
 * Serif `<h1>`, the proof line under it, with MentorCruise, EVO Touch and
 * TenderLift as tile lockups (tile, then the underlined name), and the row of
 * public figures (`numbers`). Server-only: unlike the landing's story,
 * nothing here talks to a headline.
 */
export function MentoringIntro() {
  const { title, intro, numbers } = getMentoring()

  return (
    <div className="ment-head">
      <h1 className="ment-h1">{title}</h1>
      <p className="ment-intro">{renderRich(intro)}</p>
      {/* A list, not a <dl>: each item reads value first ("5.0 average
          rating"), as it is seen. */}
      <ul
        className="ment-nums"
        style={{ "--ment-n": numbers.length } as CSSProperties}
      >
        {numbers.map((n) => (
          <li key={n.label} className="ment-num">
            <span className="ment-num-v">{n.value}</span>{" "}
            <span className="ment-num-l">
              {!n.href ? (
                n.label
              ) : /^https?:/.test(n.href) ? (
                <ExternalLink href={n.href} hideArrow>
                  {withArrow(n.label)}
                </ExternalLink>
              ) : (
                <TransitionLink href={n.href}>{n.label}</TransitionLink>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The label with its last word and the outgoing arrow kept on one line. */
function withArrow(label: string) {
  const cut = label.lastIndexOf(" ")
  return (
    <>
      {cut > 0 ? label.slice(0, cut + 1) : null}
      <span className="ment-num-end">
        {label.slice(cut + 1)}
        <Icon name="arrow-up-right" />
      </span>
    </>
  )
}

function renderRich(text: RichText) {
  return mapRich(text, (seg, i) => {
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
    if (!mark) throw new Error(`mentoring intro: no product "${seg.ref}"`)
    const brand = { "--brand": mark.brand } as CSSProperties
    const face = (
      <>
        <ProductTile mark={mark} />
        <span className="blk-w">{seg.text}</span>
      </>
    )
    if (!seg.href) {
      return (
        <span key={i} className="ment-lk">
          {face}
        </span>
      )
    }
    // External lockups keep the board's look (no arrow after the name); the
    // primitive still adds `noopener` and the "opens in a new tab" note.
    return /^https?:/.test(seg.href) ? (
      <ExternalLink
        key={i}
        href={seg.href}
        hideArrow
        className="ment-lk blk"
        style={brand}
      >
        {face}
      </ExternalLink>
    ) : (
      <TransitionLink
        key={i}
        href={seg.href}
        className="ment-lk blk"
        style={brand}
      >
        {face}
      </TransitionLink>
    )
  })
}
