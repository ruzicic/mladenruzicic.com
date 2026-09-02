"use client"

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  EXPANDED_WIDTH,
  initialsOf,
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
  const { highlight, expandRequest } = useHeroHighlight()

  const scrollerRef = useRef<HTMLDivElement>(null)
  const pointerX = useRef(0)
  const drag = useRef<{
    id: number
    startX: number
    startLeft: number
  } | null>(null)

  const ticks = useMemo(() => {
    const out: number[] = []
    for (let year = 2026; year >= SPAN_FROM; year -= 2) out.push(year)
    return out
  }, [])

  /** id → the band that lists this person, for the "Where:" link. */
  const bandOfPerson = useMemo(() => {
    const map = new Map<string, CompanyId>()
    for (const company of companies) {
      for (const id of company.people) map.set(id, company.id)
    }
    return map
  }, [companies])

  const peopleById = useMemo(
    () => new Map(people.map((person) => [person.id, person])),
    [people]
  )

  const openBand = useCallback((id: CompanyId) => {
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

  const toggleBand = useCallback((id: CompanyId) => {
    setExpanded((current) => {
      if (current === id) return null
      play("expand")
      return id
    })
  }, [])

  // The hero's logo shards (and the mobile scrubber) ask for a band to open
  // (§5.1). Deferred a frame so the store update never renders synchronously
  // from inside the effect.
  useEffect(() => {
    const request = expandRequest
    if (!request) return
    const frame = requestAnimationFrame(() => openBand(request.id))
    return () => cancelAnimationFrame(frame)
  }, [expandRequest, openBand])

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

  const railHeight = expanded ? RAIL_HEIGHT_EXPANDED : RAIL_HEIGHT

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
          style={{ height: railHeight }}
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

          {companies.map((company) => {
            const to = resolveTo(company.to, nowFraction)
            const isExpanded = expanded === company.id
            const isHighlighted = highlight === company.id
            const widthPct = ((to - company.from) / SPAN_YEARS) * 100
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
                style={{
                  top: ROW.bands,
                  left: isExpanded
                    ? `clamp(0px, ${pct(to)}%, calc(100% - ${EXPANDED_WIDTH}px))`
                    : `${pct(to)}%`,
                  width: isExpanded
                    ? `${EXPANDED_WIDTH}px`
                    : `calc(${widthPct}% - 6px)`,
                  zIndex: isExpanded ? 5 : isHighlighted ? 4 : 1,
                  transformOrigin: "left top",
                  borderColor: company.color,
                  backgroundColor: isExpanded
                    ? "var(--color-surface-3)"
                    : `${company.color}42`,
                  boxShadow: isExpanded
                    ? `0 40px 100px -20px rgba(0,0,0,.95), 0 0 0 6px ${company.color}1A`
                    : isHighlighted
                      ? `0 0 0 2px ${company.color}, 0 0 32px 0 ${company.color}80`
                      : "none",
                }}
              >
                <button
                  type="button"
                  data-testid="timeline-band"
                  data-band={company.id}
                  data-hover
                  aria-expanded={isExpanded}
                  aria-controls={`band-panel-${company.id}`}
                  onClick={() => toggleBand(company.id)}
                  className={[
                    "relative flex h-[72px] w-full flex-col justify-between gap-1",
                    "border-0 bg-transparent px-[14px] py-3 text-left text-fg",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2 pr-7 text-[14px] font-semibold tracking-[-0.01em] whitespace-nowrap">
                    <BandMark company={company} size={18} />
                    <span
                      itemProp="name"
                      className="overflow-hidden text-ellipsis"
                    >
                      {company.name}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 overflow-hidden font-mono text-[10px] tracking-[0.06em] whitespace-nowrap">
                    <span style={{ color: inkOnTint(company.color) }}>
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
                    className="absolute right-[10px] top-[10px] grid h-[26px] w-[26px] place-items-center rounded-xs border border-[var(--color-line-strong)] text-[13px] leading-none"
                  >
                    {isExpanded ? "✕" : "⤢"}
                  </span>
                </button>

                <div
                  id={`band-panel-${company.id}`}
                  data-band-panel={company.id}
                  // React DOM still normalises `hidden` to a boolean, so the
                  // server renders a plain `hidden` (which is what a visitor
                  // without JavaScript needs) and the effect above upgrades it
                  // to `until-found` (§5.6).
                  hidden={!isExpanded}
                  className="grid gap-5 px-[22px] pb-6 pt-[6px]"
                  style={{
                    background: `linear-gradient(160deg, ${company.color}2E, rgba(20,20,22,0) 55%)`,
                  }}
                >
                  <div className="flex items-center gap-[14px]">
                    <BandMark company={company} size={52} />
                    <strong className="font-display text-[32px] font-normal leading-none tracking-[-0.025em]">
                      {company.name}
                    </strong>
                  </div>

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
                    <p className="m-0 border-t border-line pt-4 text-[15px] leading-[1.5]">
                      <span
                        className="mb-[6px] block font-mono text-[11px] uppercase tracking-[0.1em]"
                        style={{ color: brandInkOnDark(company.color) }}
                      >
                        Worth knowing
                      </span>
                      {company.fact}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                    {bandPeople.length > 0 ? (
                      <span className="flex items-center gap-3">
                        With
                        <span className="flex">
                          {bandPeople.map((person) => (
                            <span key={person.id} className="-ml-2 first:ml-0">
                              <PersonPopover
                                person={person}
                                size={32}
                                companyId={bandOfPerson.get(person.id)}
                                onGoToBand={openBand}
                              />
                            </span>
                          ))}
                        </span>
                      </span>
                    ) : null}

                    {company.workSlug ? (
                      <TransitionLink
                        href={`/work/${company.workSlug}`}
                        data-hover
                        className="ml-auto inline-flex items-center gap-2 text-fg"
                      >
                        Case study <span aria-hidden>→</span>
                        <NavPending />
                      </TransitionLink>
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
                top: index % 2 ? ROW.markerB : ROW.markerA,
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

      <Container className="flex flex-wrap items-center justify-between gap-6 pt-4">
        {people.length > 0 ? (
          <div className="flex items-center gap-[14px] font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
            <span id="alongside-label">{labels.alongsideLabel}</span>
            <ul
              aria-labelledby="alongside-label"
              className="m-0 flex list-none p-0"
            >
              {people.map((person) => (
                <li key={person.id} className="-ml-2 first:ml-0">
                  <PersonPopover
                    person={person}
                    companyId={bandOfPerson.get(person.id)}
                    onGoToBand={openBand}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

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

/** The band's logo, or its coloured initial square when there is no mark yet. */
function BandMark({ company, size }: { company: Company; size: number }) {
  const radius = size >= 40 ? "6px" : "4px"
  if (company.logo) {
    return (
      <span
        role="img"
        aria-label={`${company.name} logo`}
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
      className="grid flex-none place-items-center font-mono font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: company.color,
        color: inkOn(company.color),
        fontSize: size >= 40 ? 20 : 9,
      }}
    >
      {company.mark ?? initialsOf(company.short)}
    </span>
  )
}
