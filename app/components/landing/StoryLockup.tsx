"use client"

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
} from "react"

import type {
  Popover as PopoverContent,
  ProductMark,
  ProjectLinks,
} from "@/lib/content/schema"
import { Button } from "@/app/components/primitives/Button"
import { ExternalLink } from "@/app/components/primitives/ExternalLink"
import { Icon } from "@/app/components/primitives/Icon"
import { Popover } from "@/app/components/primitives/Popover"
import { ProductTile } from "@/app/components/primitives/ProductTile"
import { lockScroll } from "@/app/components/primitives/scroll-lock"
import { TransitionLink } from "@/app/components/primitives/TransitionLink"

import { holdHeadline, showPhrase, useHeadline } from "./headline-store"
import { ProjectActions } from "./ProjectActions"

interface LockupBase {
  mark: ProductMark
  text: string
  /** The headline phrase this product belongs to, or -1. */
  phrase: number
}

/** Tile + underlined name; lit while the headline shows this product. */
function Face({ mark, text, phrase }: LockupBase) {
  const lit = useHeadline((s) => phrase >= 0 && s.cur === phrase)
  return (
    <>
      <ProductTile mark={mark} className={lit ? "lk-lit" : undefined} />
      <span className="lk-w blk-w" data-lit={lit ? "" : undefined}>
        {text}
      </span>
    </>
  )
}

function finePointer(e: PointerEvent) {
  return e.pointerType === "mouse"
}

/**
 * The branded-link colour on the element that washes (`.blk`,
 * `app/styles/brand-link.css`).
 */
function brandStyle(mark: ProductMark): CSSProperties {
  return { "--brand": mark.brand } as CSSProperties
}

/** A product name that is a link (an in-page or other plain link). */
export function LinkLockup({ href, ...face }: LockupBase & { href: string }) {
  const show = () => showPhrase(face.phrase)
  const props = {
    className: "lk-chip blk",
    style: brandStyle(face.mark),
    onPointerEnter: (e: PointerEvent) => finePointer(e) && show(),
    onFocus: show,
  }
  return href.startsWith("/") ? (
    <TransitionLink href={href} {...props}>
      <Face {...face} />
    </TransitionLink>
  ) : (
    <a href={href} {...props}>
      <Face {...face} />
    </a>
  )
}

/**
 * How long a panel stays open after the pointer leaves its name or the panel
 * itself: long enough to cross the gap (and the line of text under the name)
 * without aiming, short enough that it is gone by the time the reader looks
 * elsewhere.
 */
const GRACE_MS = 300

/**
 * While one panel is open and the pointer is on its way into it, crossing
 * another product name does not swap the panel: that name opens only if the
 * pointer rests on it this long.
 */
const INTENT_MS = 220

/** Where the panel is a bottom sheet (`.lk-pop`, app/styles/landing.css). */
const PHONE_SHEET = "(max-width: 720px)"

/**
 * The lockup whose panel is open, so a neighbour can tell whether the reader
 * is still heading for it. One at a time: the panels are `popover="auto"`.
 */
let openLockup: { id: string; hovered: () => boolean } | null = null

/**
 * A product name with the board's popover. Desktop: it opens on hover and on
 * keyboard focus, and a click pins it (the board's `lockup()`); the panel
 * stays open while the pointer is on the name or the panel, with a grace
 * period and an invisible bridge over the gap between them
 * (`app/styles/landing.css`), so the reader can move in and use the link.
 * Touch: a tap opens it, as a bottom sheet on phones (CSS), and a tap outside
 * closes it. Its foot holds the project's links ("Case study →", then
 * "Website ↗"), or the content link of a tile that is not a project. Built on the `Popover` primitive, so Escape and light dismiss
 * are native and focus comes back to the name.
 */
export function PopoverLockup({
  popover,
  links,
  ...face
}: LockupBase & { popover: PopoverContent; links: ProjectLinks }) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const pinned = useRef(false)
  const hovered = useRef(false)
  const closeT = useRef<number | undefined>(undefined)
  const openT = useRef<number | undefined>(undefined)
  const [open, setOpen] = useState(false)

  const panel = () =>
    wrapRef.current?.querySelector<HTMLElement>("[popover]") ?? null
  const isOpen = () => panel()?.matches(":popover-open") ?? false
  const show = () => {
    window.clearTimeout(closeT.current)
    window.clearTimeout(openT.current)
    const p = panel()
    if (p && !isOpen()) p.showPopover()
  }
  /** Hover: at once, unless another panel is open and still wanted. */
  const showOnHover = () => {
    window.clearTimeout(closeT.current)
    const id = panel()?.id
    const other = openLockup && openLockup.id !== id ? openLockup : null
    if (!other) return show()
    window.clearTimeout(openT.current)
    openT.current = window.setTimeout(() => {
      if (hovered.current) show()
    }, INTENT_MS)
  }
  const hideSoon = () => {
    window.clearTimeout(closeT.current)
    window.clearTimeout(openT.current)
    closeT.current = window.setTimeout(() => {
      if (pinned.current || hovered.current) return
      const wrap = wrapRef.current
      if (wrap?.contains(document.activeElement)) return
      if (isOpen()) panel()?.hidePopover()
    }, GRACE_MS)
  }

  useEffect(() => {
    const p = panel()
    if (!p) return
    const mine = { id: p.id, hovered: () => hovered.current }
    // On a phone the panel is a bottom sheet over a dimmed page: the page
    // holds still under it and only the sheet scrolls. On desktop it is a
    // small panel beside the name, opened by hover: the page keeps scrolling.
    let unlock: (() => void) | null = null
    const onToggle = (e: Event) => {
      const now = (e as ToggleEvent).newState === "open"
      if (!now) pinned.current = false
      if (now) openLockup = mine
      else if (openLockup?.id === p.id) openLockup = null
      setOpen(now)
      holdHeadline(`pop:${p.id}`, now)
      unlock?.()
      unlock =
        now && window.matchMedia(PHONE_SHEET).matches
          ? lockScroll({ allow: () => p })
          : null
    }
    p.addEventListener("toggle", onToggle)
    return () => {
      unlock?.()
      p.removeEventListener("toggle", onToggle)
      if (openLockup?.id === p.id) openLockup = null
      holdHeadline(`pop:${p.id}`, false)
      window.clearTimeout(closeT.current)
      window.clearTimeout(openT.current)
    }
  }, [])

  const link = popover.link
  return (
    <span
      ref={wrapRef}
      className="lk"
      data-open={open ? "" : undefined}
      onPointerEnter={(e: PointerEvent) => {
        if (!finePointer(e)) return
        hovered.current = true
        showPhrase(face.phrase)
        showOnHover()
      }}
      onPointerLeave={(e: PointerEvent) => {
        if (!finePointer(e)) return
        hovered.current = false
        hideSoon()
      }}
      onBlur={(e: FocusEvent<HTMLSpanElement>) => {
        const to = e.relatedTarget
        if (to instanceof Node && e.currentTarget.contains(to)) return
        if (!pinned.current && isOpen()) panel()?.hidePopover()
      }}
    >
      <Popover
        side="below"
        as="span"
        label={popover.title}
        className="lk-pop"
        trigger={(p) => (
          <button
            type="button"
            {...p}
            className="lk-chip blk"
            // Keep the primitive's `anchor-name`; add the brand colour.
            style={{ ...p.style, ...brandStyle(face.mark) }}
            onFocus={(e) => {
              showPhrase(face.phrase)
              if (e.currentTarget.matches(":focus-visible")) show()
            }}
            onClick={(e: MouseEvent) => {
              // Opened by hover or focus: the click pins it instead of
              // letting the native toggle close it.
              if (isOpen() && !pinned.current) {
                e.preventDefault()
                pinned.current = true
                return
              }
              pinned.current = !isOpen()
            }}
          >
            <Face {...face} />
          </button>
        )}
      >
        <span className="lk-pop-head">
          <span className="lk-pop-eyebrow">{popover.eyebrow}</span>
          <Button
            size="icon"
            className="lk-x"
            aria-label="Close"
            onClick={(e) => {
              pinned.current = false
              ;(
                e.currentTarget.closest("[popover]") as HTMLElement | null
              )?.hidePopover()
            }}
          >
            <Icon name="close" size={16} />
          </Button>
        </span>
        <span className="lk-pop-title">
          {popover.titleLong ?? popover.title}
        </span>
        <span className="lk-pop-body">{popover.body}</span>
        {popover.meta ? (
          <span className="lk-pop-meta">{popover.meta}</span>
        ) : null}
        {links.caseStudy || links.website ? (
          <ProjectActions
            links={links}
            className="lk-pop-acts"
            linkClassName="lk-pop-link"
          />
        ) : link ? (
          link.external ? (
            <ExternalLink
              href={link.href}
              rel={link.me ? "me" : undefined}
              className="lk-pop-link"
            >
              {link.label}
            </ExternalLink>
          ) : link.href.startsWith("/") ? (
            <TransitionLink href={link.href} className="lk-pop-link">
              {link.label}
              <Icon name="arrow-right" />
            </TransitionLink>
          ) : (
            <a href={link.href} className="lk-pop-link">
              {link.label}
              <Icon name="arrow-right" />
            </a>
          )
        ) : null}
      </Popover>
    </span>
  )
}
