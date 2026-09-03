"use client"

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react"

import { brandInkOnDark, inkOn, inkOnTint } from "@/lib/color"
import type { Company, CompanyId, Home, Person } from "@/lib/content/schema"

import { useHeroHighlight } from "../hero/highlight-store"
import { Container } from "../primitives/Container"
import { NavPending } from "../primitives/NavPending"
import { TransitionLink } from "../primitives/TransitionLink"
import { play } from "../sound/sound"
import { PersonPopover } from "./PersonPopover"
import {
  assignMarkerRows,
  BAND_GAP,
  EXPANDED_WIDTH,
  initialsOf,
  MARKER_ROWS,
  overlapWithNewer,
  pct,
  RAIL_HEIGHT,
  RAIL_HEIGHT_EXPANDED,
  resolveTo,
  ROW,
  SPAN_FROM,
  SPAN_YEARS,
} from "./span"

/** Pong never ships unless someone presses Play. */
const Pong = lazy(() =>
  import("./Pong").then((module) => ({ default: module.Pong }))
)

export interface TimelineMarker {
  slug: string
  title: string
  accent: string
  year: number
}

export interface TimelineRailProps {
  companies: Company[]
  people: Person[]
  markers: TimelineMarker[]
  /** Current year plus month fraction, computed on the server. */
  nowFraction: number
  labels: Home["history"]
}

const KEY_STEP = 140

/**
 * What the band announces, in both the wide and the mark-only state.
 *
 * Set explicitly rather than left to the contents, because below
 * `--band-narrow` the name and the date line are `display: none` and would drop
 * out of the accessible name with them — a ten-month band would announce as
 * "HEGIAS logo" and nothing else. No `title`: it is unreachable by keyboard and
 * duplicates the name for a screen reader.
 *
 * The verb is part of the name — "Expand HEGIAS, Jul 2020 – Apr 2021" and
 * "Close HEGIAS" — because the ✕ that replaces the ⤢ is decorative and would
 * otherwise leave the control unnamed as a close control. The dates stay in the
 * expand label so a mark-only band still announces its span.
 */
function bandLabel(company: Company, expanded: boolean): string {
  if (expanded) return `Close ${company.name}`
  const label = `Expand ${company.name}, ${company.yearsLabel}`
  return company.approx ? `${label}, dates approximate` : label
}

/** True while a person card (or any other popover) is open inside `root`. */
function openPopoverInside(root: HTMLElement): boolean {
  try {
    return Boolean(root.querySelector(":popover-open"))
  } catch {
    // `:popover-open` is a syntax error in an engine without the Popover API,
    // and `querySelector` throws rather than returning null.
    return false
  }
}

/**
 * The horizontal work-history rail — docs/v3-redesign-plan.md §5.7, §5.8.
 *
 * A client island, but every band, tick, marker and expanded panel is present
 * in the server HTML: with JavaScript off the rail still renders and still
 * scrolls (it is a plain `overflow-x: auto` box), and collapsed panels use
 * `hidden="until-found"` so find-in-page reaches their text.
 */
export function TimelineRail({
  companies,
  people,
  markers,
  nowFraction,
  labels,
}: TimelineRailProps) {
  const [expanded, setExpanded] = useState<CompanyId | null>(null)
  const [pongOn, setPongOn] = useState(false)
  /*
   * The measured height of the open card. The rail is a fixed-height box with
   * absolutely positioned bands, so it cannot grow with its contents on its
   * own — and now that the people live inside the cards, a four-person band is
   * several hundred pixels taller than a band with none. `RAIL_HEIGHT_EXPANDED`
   * stays the floor (and the server value: nothing is expanded before
   * hydration, so there is no mismatch to reconcile).
   */
  const [openCardHeight, setOpenCardHeight] = useState(0)
  const { highlight, expandRequest } = useHeroHighlight()

  const scrollerRef = useRef<HTMLDivElement>(null)
  const pointerX = useRef(0)
  const drag = useRef<{
    id: number
    startX: number
    startLeft: number
  } | null>(null)

  /*
   * Derived from `nowFraction` rather than a hardcoded 2026: the axis runs to
   * SPAN_TO and "now" is live, so a literal here silently stops the ticks short
   * the moment the year rolls over.
   */
  const ticks = useMemo(() => {
    const out: number[] = []
    for (let year = Math.floor(nowFraction); year >= SPAN_FROM; year -= 2)
      out.push(year)
    return out
  }, [nowFraction])

  const peopleById = useMemo(
    () => new Map(people.map((person) => [person.id, person])),
    [people]
  )

  const openBand = useCallback((id: CompanyId) => {
    // Drop the previous card's measurement here rather than in the effect
    // below: setting state from an effect body is a cascading render, and this
    // is the moment the old height stops being true.
    setOpenCardHeight(0)
    setExpanded(id)
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-band="${id}"]`)
        ?.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "nearest",
          inline: "center",
        })
    })
  }, [])

  const toggleBand = useCallback(
    (id: CompanyId) => {
      setOpenCardHeight(0)
      if (expanded === id) {
        setExpanded(null)
        return
      }
      play("expand")
      /*
       * Opening goes through `openBand`, which also centres the band in the
       * rail. That matters more than it used to: the card is centred on the
       * band's own centre, so half of it now grows to the LEFT of where the
       * band was, and on a phone — where the rail is 1400px wide inside a
       * 390px window — a card opened at the scroll position you were at would
       * hang off the left edge. Centring the band centres the card, because
       * they share a centre by construction (except at the clamped ends).
       */
      openBand(id)
    },
    [expanded, openBand]
  )

  // The hero's logo shards (and the mobile scrubber) ask for a band to open
  // (§5.1). Deferred a frame so the store update never renders synchronously
  // from inside the effect.
  useEffect(() => {
    const request = expandRequest
    if (!request) return
    const frame = requestAnimationFrame(() => openBand(request.id))
    return () => cancelAnimationFrame(frame)
  }, [expandRequest, openBand])

  // Measure the open card so the rail can make room for it. A ResizeObserver
  // rather than a one-off read: the panel's copy reflows when the viewport
  // changes, and a font swapping in after paint changes its height too.
  useEffect(() => {
    if (!expanded) return
    const card = document.getElementById(`band-${expanded}`)
    if (!card) return
    const observer = new ResizeObserver(() => {
      setOpenCardHeight(card.offsetHeight)
    })
    observer.observe(card)
    return () => observer.disconnect()
  }, [expanded])

  // `hidden="until-found"` keeps a collapsed panel's copy reachable by
  // find-in-page; `beforematch` opens the band the browser landed in.
  useEffect(() => {
    const panels = Array.from(
      document.querySelectorAll<HTMLElement>("[data-band-panel]")
    )
    const onBeforeMatch = (event: Event) => {
      const id = (event.currentTarget as HTMLElement).dataset.bandPanel
      if (id) setExpanded(id as CompanyId)
    }
    for (const panel of panels) {
      if (panel.hidden) panel.setAttribute("hidden", "until-found")
      panel.addEventListener("beforematch", onBeforeMatch)
    }
    return () => {
      for (const panel of panels) {
        panel.removeEventListener("beforematch", onBeforeMatch)
      }
    }
  }, [expanded])

  /* ---------------------------------------------------------------------- */
  /* Drag to scroll                                                          */
  /* ---------------------------------------------------------------------- */

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = scrollerRef.current
    if (!element || event.button !== 0) return
    // Never hijack a real control.
    if (event.target instanceof Element && event.target.closest("a,button"))
      return
    drag.current = {
      id: event.pointerId,
      startX: event.clientX,
      startLeft: element.scrollLeft,
    }
    element.setPointerCapture(event.pointerId)
    element.dataset.dragging = "1"
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = scrollerRef.current
    if (!element) return
    pointerX.current =
      event.clientX - element.getBoundingClientRect().left + element.scrollLeft
    const state = drag.current
    if (!state || state.id !== event.pointerId) return
    element.scrollLeft = state.startLeft - (event.clientX - state.startX)
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = scrollerRef.current
    const state = drag.current
    if (!element || !state || state.id !== event.pointerId) return
    try {
      element.releasePointerCapture(event.pointerId)
    } catch {
      /* ignore */
    }
    delete element.dataset.dragging
    drag.current = null
  }

  /* ---------------------------------------------------------------------- */
  /* Keyboard — scoped to the rail region, never to the document             */
  /* ---------------------------------------------------------------------- */

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const element = scrollerRef.current
    if (!element) return
    if (event.key === "ArrowRight") {
      event.preventDefault()
      element.scrollLeft += KEY_STEP
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      element.scrollLeft -= KEY_STEP
    } else if (event.key === "Escape") {
      // A person card is open in the top layer. It is a DOM descendant of the
      // rail, so its own Escape bubbles here; collapsing the band as well would
      // dismiss two things on one keystroke and lose the reader's place.
      if (openPopoverInside(element)) return
      setExpanded(null)
    }
    /*
     * No Space handler here. The rail is `role="region" tabIndex={0}`, so a
     * keyboard visitor tabs onto it on the way down the page; Space is the
     * universal page-down, and preventing it to start an unannounced Pong
     * canvas (aria-hidden, no live region) left them stuck with no visible way
     * out. The `space` shortcut the Play button advertises is the native one:
     * Space on a focused <button> activates it.
     */
  }

  const railHeight = expanded
    ? Math.max(RAIL_HEIGHT_EXPANDED, ROW.bands + openCardHeight + 24)
    : RAIL_HEIGHT
  const markerRows = assignMarkerRows(markers)

  return (
    <>
      <div
        ref={scrollerRef}
        data-rail-scroller
        role="region"
        tabIndex={0}
        aria-label={`${labels.eyebrow}. ${labels.rangeLabel}. Use the left and right arrow keys to scroll.`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="relative px-[var(--gutter)] pb-6"
      >
        <div
          data-rail-inner
          className="relative w-[1400px] min-w-full min-[720px]:w-[1800px]"
          style={
            {
              height: railHeight,
              /*
               * The open card's width, published once so the width and the
               * centring clamp below cannot drift apart. `EXPANDED_WIDTH` is
               * the design figure; on a 390px phone it would be wider than the
               * screen, and the rail scrolls horizontally, so a card that never
               * fits can never be fully read. The gutter is 20px a side.
               */
              "--card-w": `min(${EXPANDED_WIDTH}px, calc(100vw - 40px))`,
            } as CSSProperties
          }
        >
          {ticks.map((year) => (
            <div
              key={year}
              aria-hidden
              className="absolute bottom-0 top-0 border-l border-line-soft pl-2 font-mono text-[11px] tracking-[0.06em] text-muted"
              style={{ left: `${pct(year + 1)}%` }}
            >
              {year}
            </div>
          ))}

          <p
            className="absolute inset-x-0 m-0 pl-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted"
            style={{ top: ROW.employedLabel }}
          >
            {labels.employedLabel}
          </p>

          {companies.map((company, index) => {
            const to = resolveTo(company.to, nowFraction)
            const isExpanded = expanded === company.id
            const isHighlighted = highlight === company.id
            const widthPct = ((to - company.from) / SPAN_YEARS) * 100
            /*
             * `companies` is newest-first, so `index - 1` is the band that was
             * painted just before this one — the one this band covers when the
             * two spans overlap.
             */
            const newer = companies[index - 1]
            const overlap = overlapWithNewer(
              { from: company.from, to },
              newer?.from
            )
            const bandPeople = company.people
              .map((id) => peopleById.get(id))
              .filter((person): person is Person => Boolean(person))

            return (
              <div
                key={company.id}
                id={`band-${company.id}`}
                data-rail-band
                data-expanded={isExpanded ? "" : undefined}
                data-highlight={isHighlighted ? "" : undefined}
                itemScope
                itemType="https://schema.org/Organization"
                className="absolute box-border overflow-hidden rounded-xs border text-fg"
                style={
                  {
                    /*
                     * The brand colour and its readable ink, published to CSS so
                     * `app/styles/shell.css` can paint the expanded card's rings
                     * and rules with them. `brandInkOnDark` is measured against
                     * `--color-bg`, which is exactly the expanded card's ground
                     * — ZF blue goes 2.86:1 → 4.63:1, HEGIAS purple 2.02:1 →
                     * 4.69:1; the other four already pass and come back
                     * untouched.
                     */
                    "--band-brand": company.color,
                    "--band-ink": brandInkOnDark(company.color),
                    top: ROW.bands,
                    /*
                     * The card grows out of the band's own centre, not its left
                     * edge: anchoring top-left made a two-year band appear to
                     * shoot rightwards across three other spans. The clamp keeps
                     * a card near either end of the axis inside the rail rather
                     * than letting it hang off it.
                     */
                    left: isExpanded
                      ? `clamp(0px, calc(${(pct(to) + widthPct / 2).toFixed(3)}% - var(--card-w) / 2), calc(100% - var(--card-w)))`
                      : `${pct(to)}%`,
                    width: isExpanded
                      ? "var(--card-w)"
                      : `calc(${widthPct}% - ${BAND_GAP}px)`,
                    // A custom property rather than `z-index` directly, so the
                    // hover/focus rule in shell.css can lift the scaled band
                    // over its neighbours — an inline `z-index` would outrank
                    // it and the growth would slide under the next span.
                    "--band-z": isExpanded ? 5 : isHighlighted ? 4 : 1,
                    // The hover state scales in place; growing from the centre is
                    // the same gesture the expansion makes, one step smaller.
                    transformOrigin: "center",
                    borderColor: company.color,
                    /*
                     * Expanded, the card drops the tint and sits on the page's
                     * own ground: the brand colour carries the card through its
                     * border, ring, title, labels and rules instead of through a
                     * wash that dulls every one of them. Collapsed bands keep the
                     * 26%-alpha tint they have always had.
                     */
                    backgroundColor: isExpanded
                      ? "var(--color-bg)"
                      : `${company.color}42`,
                    // Expanded: shell.css owns the shadow, so `:hover` and
                    // `:focus-within` can thicken the brand ring (an inline
                    // box-shadow would outrank them).
                    boxShadow: isExpanded
                      ? undefined
                      : isHighlighted
                        ? /*
                           * Two rings: the brand one, then a token-coloured one
                           * outside it. The brand colour alone is 2.86:1 for ZF
                           * and 2.02:1 for HEGIAS against `--color-bg`, so on
                           * those two bands a hero-driven highlight was a state
                           * change no low-vision reader could see.
                           */
                          `0 0 0 2px ${company.color}, 0 0 0 4px var(--color-muted), 0 0 32px 0 ${company.color}80`
                        : "none",
                  } as CSSProperties
                }
              >
                {/*
                 * The months this band shares with the one underneath it.
                 * Painted before the head so it tints the fill and never the
                 * mark or the copy, and `aria-hidden` because both date lines
                 * already state the overlap.
                 */}
                {overlap > 0 && newer ? (
                  <span
                    aria-hidden
                    data-band-overlap
                    style={{
                      // The strip is a share of *this* band's width, while the
                      // covered pixels are that share of the band plus the gap
                      // trimmed off its neighbour — hence the correction, which
                      // lands the dashed edge on the hidden band's start edge
                      // rather than a few pixels past it.
                      width: `calc(${(overlap * 100).toFixed(3)}% - ${(BAND_GAP * (1 - overlap)).toFixed(2)}px)`,
                      backgroundImage: `repeating-linear-gradient(-45deg, transparent 0 4px, ${newer.color}55 4px 8px)`,
                      borderRightColor: newer.color,
                    }}
                  />
                ) : null}

                <div
                  data-band-head
                  // Only the narrow layout reads this: with no name or dates to
                  // lay out, the mark centres itself, and it should centre in
                  // the part of the band that is not under its neighbour.
                  style={
                    {
                      "--band-lead": `${(overlap * 100).toFixed(3)}%`,
                    } as CSSProperties
                  }
                >
                  <button
                    type="button"
                    data-testid="timeline-band"
                    data-band-button
                    data-band={company.id}
                    data-hover
                    aria-expanded={isExpanded}
                    aria-controls={`band-panel-${company.id}`}
                    aria-label={bandLabel(company, isExpanded)}
                    onClick={() => toggleBand(company.id)}
                    className={[
                      "relative flex h-[72px] w-full flex-col justify-between gap-1",
                      "border-0 bg-transparent px-[14px] py-3 text-left text-fg",
                    ].join(" ")}
                  >
                    {/*
                     * The card's title IS the band's title. Expanding scales
                     * these same nodes up — `--band-mark` grows the mark,
                     * `[data-band-text]` grows into the display face, both on
                     * the same 500ms geometry easing as the band's own
                     * left/width — so nothing is drawn twice and there is no
                     * second header strip to close.
                     */}
                    <span
                      data-band-name
                      className="flex items-center gap-2 pr-7 text-[14px] font-semibold tracking-[-0.01em] whitespace-nowrap"
                    >
                      <BandMark company={company} />
                      <span
                        itemProp="name"
                        data-band-text
                        className="overflow-hidden text-ellipsis"
                      >
                        {company.name}
                      </span>
                    </span>
                    <span
                      data-band-dates
                      className="flex items-center gap-2 overflow-hidden font-mono text-[10px] tracking-[0.06em] whitespace-nowrap"
                    >
                      <span
                        style={{
                          // Collapsed the ink sits on the band's own tint;
                          // expanded it sits on `--color-bg`, and the two need
                          // different lifts to clear 4.5:1.
                          color: isExpanded
                            ? "var(--band-ink)"
                            : inkOnTint(company.color),
                        }}
                      >
                        {company.yearsLabel}
                      </span>
                      {company.approx ? (
                        <span className="rounded-[3px] border border-line px-[5px] py-px text-[9px] uppercase tracking-[0.08em] text-dim">
                          ≈ dates approximate
                        </span>
                      ) : null}
                    </span>
                    <span
                      aria-hidden
                      data-band-toggle
                      className="absolute right-[10px] top-[10px] grid h-[26px] w-[26px] place-items-center rounded-xs border border-[var(--color-line-strong)] leading-none"
                    >
                      <BandToggleIcon />
                    </span>
                  </button>

                  {/*
                   * The label a mark-only band cannot show. Decorative: the
                   * button's `aria-label` already carries the same words, so
                   * announcing them twice would be noise.
                   */}
                  <span aria-hidden data-band-tip>
                    {company.name} · {company.yearsLabel}
                  </span>
                </div>

                <div
                  id={`band-panel-${company.id}`}
                  data-band-panel={company.id}
                  // React DOM still normalises `hidden` to a boolean, so the
                  // server renders a plain `hidden` (which is what a visitor
                  // without JavaScript needs) and the effect above upgrades it
                  // to `until-found` (§5.6).
                  hidden={!isExpanded}
                  /*
                   * No padding and no background on the panel element itself.
                   * `hidden="until-found"` is `content-visibility: hidden`,
                   * which skips the contents but still lays out this box — so
                   * padding here made every *collapsed* band 30px taller than
                   * its 72px head, which is what pushed the bands down into the
                   * "Side track" label. The padding lives on the inner grid,
                   * whose layout is skipped with the rest.
                   *
                   * No background either: the card is one surface, the page
                   * ground, from the scaled title down. The gradient that used
                   * to sit here made the panel read as a second, darker block
                   * bolted under a header strip.
                   */
                >
                  <div className="grid gap-5 px-[22px] pb-6 pt-[6px]">
                    <p className="m-0 font-serif-italic text-[23px] italic leading-[1.2] tracking-[-0.01em]">
                      {company.role}
                    </p>
                    {company.prev ? (
                      <p className="m-0 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                        {company.prev}
                      </p>
                    ) : null}
                    <p className="m-0 text-[16px] leading-[1.5] text-dim">
                      {company.summary}
                    </p>

                    {company.fact ? (
                      <p
                        data-band-rule
                        className="m-0 pt-4 text-[15px] leading-[1.5]"
                      >
                        <span
                          className="mb-[6px] block font-mono text-[11px] uppercase tracking-[0.1em]"
                          style={{ color: "var(--band-ink)" }}
                        >
                          Worth knowing
                        </span>
                        {company.fact}
                      </p>
                    ) : null}

                    {/*
                     * The people belong to the chapter they were part of, not to
                     * a strip of avatars under the whole rail. Each one gets a
                     * name, the line that says what we did together and a link;
                     * the avatar is still the popover trigger, because `note` is
                     * a paragraph of prose and 480px of panel cannot hold four of
                     * them.
                     */}
                    {bandPeople.length > 0 ? (
                      <section
                        data-band-people
                        data-band-rule
                        aria-labelledby={`band-people-${company.id}`}
                        className="pt-4"
                      >
                        <h3
                          id={`band-people-${company.id}`}
                          className="m-0 font-mono text-[11px] uppercase tracking-[0.1em]"
                          style={{ color: "var(--band-ink)" }}
                        >
                          {labels.alongsideLabel}
                        </h3>
                        {/* role="list": Safari/VoiceOver drops list semantics on
                          `list-style: none`. */}
                        <ul
                          role="list"
                          className="m-0 mt-[14px] grid list-none gap-[14px] p-0"
                        >
                          {bandPeople.map((person) => (
                            <li
                              key={person.id}
                              className="flex items-start gap-[12px]"
                            >
                              <PersonPopover
                                person={person}
                                size={36}
                                triggerLabel={`More about ${person.name}`}
                              />
                              <span className="grid min-w-0 gap-[3px] pt-[2px]">
                                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                  <strong className="text-[14px] font-semibold tracking-[-0.01em]">
                                    {person.name}
                                  </strong>
                                  {person.linkedin ? (
                                    <a
                                      href={person.linkedin}
                                      target="_blank"
                                      rel="noreferrer noopener"
                                      data-hover
                                      className="font-mono text-[10px] uppercase tracking-[0.08em]"
                                      style={{ color: "var(--band-ink)" }}
                                    >
                                      LinkedIn ↗
                                    </a>
                                  ) : null}
                                </span>
                                <span className="text-[13px] leading-[1.45] text-dim-2">
                                  {person.why}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}

                    {company.workSlug ? (
                      <p
                        data-band-rule
                        className="m-0 pt-4 font-mono text-[11px] uppercase tracking-[0.08em]"
                      >
                        <TransitionLink
                          href={`/work/${company.workSlug}`}
                          data-hover
                          className="inline-flex items-center gap-2"
                          style={{ color: "var(--band-ink)" }}
                        >
                          Case study <span aria-hidden>→</span>
                          <NavPending />
                        </TransitionLink>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}

          <p
            className="absolute inset-x-0 m-0 pl-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted"
            style={{ top: ROW.independentLabel }}
          >
            {labels.independentLabel}
          </p>

          {markers.map((marker, index) => (
            <a
              key={marker.slug}
              href={`#project-${marker.slug}`}
              data-hover
              className="absolute flex translate-x-[-6px] items-center gap-2 bg-bg pr-2 text-[13px] whitespace-nowrap text-fg"
              style={{
                top: MARKER_ROWS[markerRows[index]],
                left: `${pct(marker.year + 0.8)}%`,
              }}
            >
              <span
                aria-hidden
                className="h-3 w-3 flex-none rounded-full"
                style={{
                  background: marker.accent,
                  boxShadow: `0 0 0 4px var(--color-bg), 0 0 0 5px ${marker.accent}`,
                }}
              />
              {marker.title}
              <span className="font-mono text-[10px] text-muted">
                {marker.year}
              </span>
            </a>
          ))}

          <div
            aria-hidden
            className="absolute inset-x-0 border-t border-dashed border-line"
            style={{ top: ROW.divider }}
          />
        </div>

        {pongOn ? (
          <Suspense fallback={null}>
            <Pong pointerX={pointerX} />
          </Suspense>
        ) : null}
      </div>

      {/*
       * The "Worked alongside" row that used to sit here is gone: every person
       * now reads inside the band they belong to (and on that chapter's case
       * study), where the years and the work are already on screen. What is
       * left under the rail is the Pong control, which is what the "space"
       * shortcut has always addressed — it keeps its place at the end of the
       * rail, now as the only thing there.
       */}
      <Container className="flex flex-wrap items-center justify-end gap-6 pt-4">
        <button
          type="button"
          data-hover
          onClick={() => setPongOn((value) => !value)}
          aria-pressed={pongOn}
          className="ml-auto flex items-center gap-[10px] bg-transparent p-0 font-mono text-[11px] uppercase tracking-[0.1em] text-accent"
        >
          <kbd className="rounded-xs border border-accent/50 px-2 py-px font-mono">
            space
          </kbd>
          {pongOn ? "Stop" : "Play"}
        </button>
      </Container>
    </>
  )
}

/**
 * The expand affordance and the close control, as one icon.
 *
 * Three strokes in a 16-unit box: a shaft on the anti-diagonal and two
 * arrowheads at its ends. Expanding does not swap this for a second glyph — the
 * two heads slide to the centre and rotate 45°, where their outward arms form
 * the missing diagonal of an ✕ and their inward arms lie along the shaft, which
 * scales down to match. Every step is a `transform` on the same three elements,
 * so it interpolates on the shell's own easing (see `app/styles/shell.css`).
 *
 * `aria-hidden`: the button around it carries "Expand …" / "Close …" and
 * `aria-expanded`, so the icon has nothing of its own to announce.
 */
function BandToggleIcon() {
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const
  return (
    <svg
      aria-hidden
      focusable="false"
      data-band-toggle-icon
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
    >
      <line
        data-toggle-shaft
        x1="3.5"
        y1="12.5"
        x2="12.5"
        y2="3.5"
        vectorEffect="non-scaling-stroke"
        {...stroke}
      />
      {/* Both heads are the same corner, drawn at the origin: one arm back
          along -x, one down +y. Placement and rotation live in CSS, because
          that is what has to animate. */}
      <path data-toggle-head="ne" d="M-4.6 0H0v4.6" {...stroke} />
      <path data-toggle-head="sw" d="M-4.6 0H0v4.6" {...stroke} />
    </svg>
  )
}

/**
 * The band's logo, or its coloured initial square when there is no mark yet.
 *
 * Sized entirely off `--band-mark` (18px in a collapsed band, 52px in an open
 * card — see `app/styles/shell.css`), because this is the *same element* in
 * both states: expanding scales it rather than swapping it for a bigger copy.
 */
function BandMark({ company }: { company: Company }) {
  const size = "var(--band-mark, 18px)"
  const radius = "calc(var(--band-mark, 18px) * 0.115)"
  if (company.logo) {
    return (
      <span
        role="img"
        aria-label={`${company.name} logo`}
        data-band-mark
        className="block flex-none bg-cover bg-center"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundImage: `url(${company.logo})`,
        }}
      />
    )
  }
  return (
    <span
      aria-hidden
      data-band-mark
      className="grid flex-none place-items-center font-mono font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: company.color,
        color: inkOn(company.color),
        // 9px at 18, 26px at 52 — the two sizes the design calls for.
        fontSize: "calc(var(--band-mark, 18px) * 0.5)",
      }}
    >
      {company.mark ?? initialsOf(company.short)}
    </span>
  )
}
