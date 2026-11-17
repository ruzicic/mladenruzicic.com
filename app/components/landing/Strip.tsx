import "@/app/styles/landing.css"
import "@/app/styles/rail.css"

import type { CSSProperties, ReactNode } from "react"
import { getImageProps } from "next/image"

import { recentWorkEvent } from "@/lib/analytics"
import {
  getHome,
  getMedia,
  getProductMark,
  getProjectLinks,
  getStripRest,
} from "@/lib/content"
import type {
  CardClip as Clip,
  Media,
  MoreCard,
  WorkCard,
} from "@/lib/content/schema"
import { Button } from "@/app/components/primitives/Button"
import { Icon } from "@/app/components/primitives/Icon"
import { IslandBoundary } from "@/app/components/primitives/IslandBoundary"
import { ProductTile } from "@/app/components/primitives/ProductTile"
import { TransitionLink } from "@/app/components/primitives/TransitionLink"

import { CardClip } from "./CardClip"
import { ProjectActions } from "./ProjectActions"
import { StripRail } from "./StripRail"

/**
 * "Recent work": the ten cards in content order (`Landing.dc.html` desktop,
 * `Landing-Mobile.dc.html` phone). Native horizontal scroll with snap; the
 * card in focus is full size and the rest sit back (see `StripRail` and
 * `app/styles/landing.css`).
 *
 * A work card's links are its action pills, top right, from
 * `content/products.ts` (owner, 13 Nov 2026): "Case study →" (`/work/<slug>`,
 * a client navigation with the page transition) and "Website ↗" (a new
 * tab), either, both or neither. They stay the card's only real links, one
 * per destination, each named on its own. The rest of the card is a
 * pointer shortcut to the first of them (owner, 16 Nov 2026: "make cards
 * link to case study if it exists; then to website if it exists"): a click
 * or tap on the card in focus follows its case study, or else its website,
 * through that very link (`data-rail-primary`, `useRail`), so the page
 * transition and the new tab behave as on the pill. A card out of focus
 * only comes into focus, a drag never navigates, and a card with neither
 * link is not a shortcut. Assistive technology meets the pills alone, so
 * nothing interactive is nested. The end card stays one link to `/work`.
 * No story sheet (owner, 12 Nov). The clips still to make are listed in
 * docs/v4-build/PLACEHOLDERS.md.
 *
 * A card's media, in order of preference: its product clip (`media.clip`,
 * see `ClipWindow`), its screenshots (`media.desktop` and friends), or the
 * poster: the plate with the product's tile drawn large.
 *
 * Every card is printed the same way: a `Film` layer over its media (a
 * static grain, the corner falloff, and the paper veil that washes the card
 * as it leaves focus), under the scrim and the words. See the comment above
 * `@property --lc-f` in landing.css.
 */
export function Strip() {
  const { recentWork } = getHome()

  let shotIndex = 0
  const cards = recentWork.cards.map((card, i) => {
    if (card.kind === "more") return <EndCard key={i} card={card} />
    const hasShot = Boolean(card.media?.desktop)
    const drift = hasShot ? DRIFT[shotIndex++ % DRIFT.length] : DRIFT[0]
    return <Card key={i} card={card} first={i === 0} drift={drift} />
  })

  return (
    <section
      id="recent-work"
      aria-labelledby="recent-work-title"
      className="lp-work"
    >
      <StripRail
        title={recentWork.title}
        counterFormat={recentWork.counterFormat}
        total={recentWork.cards.length}
        prevLabel={recentWork.prevLabel}
        nextLabel={recentWork.nextLabel}
        regionLabel={recentWork.regionLabel}
        regionLabelTouch={recentWork.regionLabelTouch}
      >
        {cards}
      </StripRail>
    </section>
  )
}

/** The board's slow drift, per screenshot card: duration and phase (seconds). */
const DRIFT = [
  { dur: 20, delay: -3 },
  { dur: 22, delay: -9 },
  { dur: 24, delay: -14 },
  { dur: 19, delay: -5 },
  { dur: 23, delay: -11 },
]

/** Status dot by pill word: coming amber, the rest grey. */
function tone(pill: string) {
  const p = pill.toUpperCase()
  if (p === "BUILDING" || p === "PRE-LAUNCH") return "soon"
  return "idle"
}

function imageProps(m: Media, sizes: string) {
  const meta = getMedia(m.src)
  if (!meta) throw new Error(`strip: no media entry for ${m.src}`)
  return getImageProps({
    src: m.src,
    alt: m.alt,
    width: meta.width,
    height: meta.height,
    sizes,
    placeholder: "blur",
    blurDataURL: meta.blurDataURL,
  }).props
}

function Shot({
  card,
  drift,
}: {
  card: WorkCard
  drift: { dur: number; delay: number }
}) {
  const media = card.media
  if (!media?.desktop) return null
  const main = imageProps(media.desktop, "(max-width: 720px) 400px, 820px")
  const tablet = media.tablet
    ? imageProps(media.tablet, "400px").srcSet
    : undefined
  const phone = media.phone
    ? imageProps(media.phone, "(max-width: 720px) 96px, 150px")
    : null
  const driftStyle = {
    "--dr-dur": `${drift.dur}s`,
    "--dr-delay": `${drift.delay}s`,
  } as CSSProperties
  return (
    <>
      <picture>
        {tablet ? (
          <source media="(max-width: 720px)" srcSet={tablet} sizes="400px" />
        ) : null}
        {/* eslint-disable-next-line jsx-a11y/alt-text -- art-directed next/image (getImageProps); alt is in the props */}
        <img
          {...main}
          className="lc-shot"
          data-geo={phone ? "a" : "b"}
          style={{ ...main.style, ...driftStyle }}
        />
      </picture>
      {phone ? (
        <span className="lc-phone">
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- next/image props via getImageProps; alt is in the props */}
          <img {...phone} />
          <Film inset />
        </span>
      ) : null}
    </>
  )
}

/**
 * A product clip in the desktop still's place: a window on the card's plate
 * (`.lc-clip` in landing.css; whole on the plate, or with `fit: "bleed"`
 * running under the caption band like a still) holding the poster, which
 * paints first and is
 * the text alternative, and the `CardClip` island over it. If the island
 * fails, the poster is what stays. With a `narrow` take, phones get its
 * poster (a `<picture>` source) and its video, and never the wide ones.
 */
function ClipWindow({ clip }: { clip: Clip }) {
  const poster = imageProps({ src: clip.poster, alt: clip.alt }, "480px")
  const narrow = clip.narrow
  const narrowPoster = narrow
    ? imageProps({ src: narrow.poster, alt: clip.alt }, "272px")
    : null
  const style = {
    "--lc-clip-ar-wide": `${clip.width} / ${clip.height}`,
    "--lc-clip-ar-narrow": narrow
      ? `${narrow.width} / ${narrow.height}`
      : undefined,
  } as CSSProperties
  return (
    <span
      className="lc-clip"
      data-narrow={narrow ? "" : undefined}
      data-fit={clip.fit ?? "window"}
      style={style}
    >
      <span className="lc-clip-frame">
        <picture>
          {narrow && narrowPoster ? (
            <source
              media="(max-width: 720px)"
              srcSet={narrowPoster.srcSet}
              sizes="272px"
              width={narrow.width}
              height={narrow.height}
            />
          ) : null}
          {/* eslint-disable-next-line jsx-a11y/alt-text -- art-directed next/image (getImageProps); alt is in the props */}
          <img {...poster} />
        </picture>
        <IslandBoundary>
          <CardClip
            webm={clip.webm}
            mp4={clip.mp4}
            narrow={narrow ? { webm: narrow.webm, mp4: narrow.mp4 } : undefined}
          />
        </IslandBoundary>
        <Film inset />
      </span>
    </span>
  )
}

/**
 * The print over a picture: grain, the corner falloff and the paper veil
 * (`.lc-film` in landing.css). `inset` is the lighter take inside a window
 * on the card (the clip, the phone shot): half the grain, no falloff. The
 * end card splits it: the `print` (grain and falloff) under its words and
 * tiles, the `veil` over everything. Decorative, never hit by the pointer.
 */
function Film({
  inset = false,
  only,
}: {
  inset?: boolean
  only?: "print" | "veil"
}) {
  return (
    <span
      aria-hidden="true"
      className="lc-film"
      data-inset={inset ? "" : undefined}
      data-only={only}
    />
  )
}

/**
 * A card with no footage yet, as a deliberate poster: the brand plate and
 * the product's own tile drawn large (EVO Touch: ZF's logo, at the owner's
 * request). Decorative: the card's words name it.
 */
function Poster({ card }: { card: WorkCard }) {
  const mark = getProductMark(card.ref)
  return (
    <span aria-hidden="true" className="lc-poster">
      {mark ? <ProductTile mark={mark} className="lc-poster-tile" /> : null}
    </span>
  )
}

function Card({
  card,
  first,
  drift,
}: {
  card: WorkCard
  first: boolean
  drift: { dur: number; delay: number }
}) {
  const links = getProjectLinks(card.ref, card.title)
  const style = {
    background: card.bg,
    color: card.fg,
    "--lc-plate": card.bg,
  } as CSSProperties

  const body: ReactNode = (
    <>
      {card.media?.clip ? (
        <ClipWindow clip={card.media.clip} />
      ) : card.media?.desktop ? (
        <Shot card={card} drift={drift} />
      ) : (
        <Poster card={card} />
      )}
      <Film />
      <span aria-hidden="true" className="lc-shade" />
      {/* The status pill, where a card has one, is real text; the action
          pills are the card's only links, named on their own
          (`ProjectActions`), the first of them also the card's shortcut. */}
      <span className="lc-top">
        {card.pill ? (
          <span className="lc-pill">
            <span
              aria-hidden="true"
              className="lc-dot"
              data-tone={tone(card.pill)}
            />
            {card.pill}
          </span>
        ) : null}
        <ProjectActions
          links={links}
          className="lc-acts"
          linkClassName="lc-pill lc-act"
          markPrimary
        />
      </span>
      <span className="lc-txt">
        <span className="lc-title">{card.title}</span>{" "}
        <span className="lc-cap">{card.caption}</span>
        {card.media?.desktop && card.media.credit ? (
          <span className="lc-credit">{card.media.credit}</span>
        ) : null}
      </span>
    </>
  )

  const common = {
    className: "lc",
    "data-card": "",
    // White words over a dark shade: the dark-ground marker (selection).
    "data-surface": "night",
    "data-on": first ? "" : undefined,
    "data-tablet": card.media?.tablet ? "" : undefined,
    "data-poster": card.media ? undefined : "",
    // Opened through the card itself (`useRail`): `recent work: <slug>`.
    "data-track-open":
      links.caseStudy || links.website ? recentWorkEvent(card.ref) : undefined,
    style,
  }

  return <div {...common}>{body}</div>
}

/**
 * At most this many credit tiles, then "+n": one row on phones, two on
 * desktop. landing.css hides the tiles past these (`.lc-end-credits`).
 */
const CREDITS = { phone: 6, desktop: 32 }

/**
 * The last card, the end title of the reel: "That's all, folks!" with an
 * editor's insertion putting NOT into it. The whole card is one link to
 * `/work`. Its heading is the plain sentence (`card.title`); the drawn line
 * is `aria-hidden`. Under it, how many entries the strip left out (counted
 * from content), their tiles as credits, and the `Button` as the visual of
 * the card's own link (a `span`, so there is no link inside the link).
 *
 * Nothing moves when it comes into focus: the only motion is the button's
 * hover sweep, which the card's hover and keyboard focus trigger.
 */
function EndCard({ card }: { card: MoreCard }) {
  const { link } = card
  const rest = getStripRest()
  const body = card.body.replace("{n}", String(rest.length))
  const credits = rest.flatMap((row) => {
    const mark = getProductMark(row.ref)
    return mark ? [mark] : []
  })
  // Past the limit, the last place goes to "+n" (CSS hides the extra tiles).
  const over = (max: number) =>
    credits.length > max + 1 ? credits.length - max : 0
  const phoneMore = over(CREDITS.phone)
  const deskMore = over(CREDITS.desktop)

  // "That's not all, folks!" is drawn as "That's", the caret, "all, folks!",
  // with "not" set above the caret. Any other title is drawn as it is.
  const cut = card.title.match(/^(.*?) (not) (.*)$/i)
  const curly = (t: string) => t.replace(/'/g, "\u2019")

  const inner = (
    <>
      <Film only="print" />
      <div className="lc-end-main">
        <h3 className="lc-end-title">
          <span className="sr-only">{card.title}</span>
          <span aria-hidden="true" className="lc-end-line">
            {cut ? (
              <>
                {curly(cut[1])}
                <span className="lc-end-ins">
                  <span className="lc-end-not">{cut[2].toUpperCase()}</span>
                  <svg
                    viewBox="0 0 24 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    focusable="false"
                    className="lc-end-caret"
                  >
                    <path d="M3 13 12 2l9 11" />
                  </svg>
                </span>
                {curly(cut[3])}
              </>
            ) : (
              curly(card.title)
            )}
          </span>
        </h3>
        <p className="lc-end-body">{body}</p>
        {credits.length ? (
          <span
            aria-hidden="true"
            className="lc-end-credits"
            data-cut-phone={phoneMore ? "" : undefined}
            data-cut-desk={deskMore ? "" : undefined}
          >
            {credits.map((mark) => (
              <ProductTile
                key={mark.slug}
                mark={mark}
                className="lc-end-tile"
              />
            ))}
            {phoneMore ? (
              <span className="lc-end-more" data-for="phone">
                +{phoneMore}
              </span>
            ) : null}
            {deskMore ? (
              <span className="lc-end-more" data-for="desk">
                +{deskMore}
              </span>
            ) : null}
          </span>
        ) : null}
      </div>
      <Button as="span" size="compact" tone="dark" className="lc-end-btn">
        {link.label}
        <Icon name="arrow-right" />
      </Button>
      <Film only="veil" />
    </>
  )

  const common = {
    className: "lc lc-end",
    "data-card": "",
    "data-surface": "night",
  }
  return link.href.startsWith("/") ? (
    <TransitionLink href={link.href} {...common}>
      {inner}
    </TransitionLink>
  ) : (
    <a href={link.href} {...common}>
      {inner}
    </a>
  )
}
