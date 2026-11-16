"use client"

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

import { haptic } from "@/lib/haptics"

import "../../styles/ask.css"

import { Button } from "../primitives/Button"
import { IslandBoundary } from "../primitives/IslandBoundary"
import type { AskVariant } from "./AskDialog"
import { AskFace } from "./AskFace"
import type { AskClientData } from "./types"

type DialogModule = typeof import("./AskDialog")

/**
 * The island (panel, sheet, answers) is its own chunk. Once it is in, the
 * component is kept here and rendered directly: going through `lazy` again
 * would suspend for a tick, and React holds a revealed Suspense boundary
 * back for up to 300ms, which a tap on a phone felt as lag.
 */
let loaded: DialogModule["default"] | null = null
const loadDialog = () =>
  import("./AskDialog").then((m) => {
    loaded = m.default
    return m
  })
const LazyDialog = lazy(loadDialog)
/** Warm the chunk; a failure surfaces (and is handled) on open. */
const preload = () => {
  loadDialog().catch(() => {})
}

const noopSubscribe = () => () => {}

/** Phones get the side sheet; the shell's one breakpoint. */
const PHONE = "(max-width: 720px)"

/**
 * A touch screen has no hover to warn of a press, so there the chunk is
 * fetched once the page has loaded and the main thread is idle (not with
 * Save-Data on). A pointer that hovers still fetches it on hover or focus.
 */
function usePreloadWithoutHover() {
  useEffect(() => {
    if (window.matchMedia("(hover: hover)").matches) return
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean }
    }
    if (nav.connection?.saveData) return
    // Safari has no `requestIdleCallback`: a short timer after load instead.
    const idle = typeof window.requestIdleCallback === "function"
    let id = 0
    const schedule = () => {
      id = idle
        ? window.requestIdleCallback(preload, { timeout: 3000 })
        : window.setTimeout(preload, 1200)
    }
    if (document.readyState === "complete") schedule()
    else window.addEventListener("load", schedule, { once: true })
    return () => {
      window.removeEventListener("load", schedule)
      if (idle) window.cancelIdleCallback(id)
      else window.clearTimeout(id)
    }
  }, [])
}

export interface AskButtonProps {
  data: AskClientData
}

/**
 * The 96 x 48 "Ask" button in the top block (PLAN.md §1 "Ask",
 * `Landing.dc.html`'s `.ask-cellbtn`): the `Button` primitive in its
 * `cells` effect, the one button that has it. Square cells fill it bottom-up on
 * hover and keyboard focus, and the label inverts through
 * `mix-blend-mode: difference`. All of that is CSS (`app/styles/ask.css`), so
 * it costs no JavaScript.
 *
 * The panel itself is a separate chunk (`AskDialog`), imported on the first
 * hover, focus or press of the button, or, on a touch screen, once the page
 * is idle. Without JavaScript the button is a link to the footer's contact
 * line (`#contact`).
 *
 * On a phone the button does not fill under the sheet: the sheet's own
 * copy of it, laid exactly over it, makes the plus-to-close move in place.
 */
export function AskButton({ data }: AskButtonProps) {
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
  const [open, setOpen] = useState(false)
  const [requested, setRequested] = useState(false)
  const [variant, setVariant] = useState<AskVariant>("panel")
  usePreloadWithoutHover()
  // The panel's chunk failed to load: fall back to the no-JavaScript link.
  const [failed, setFailed] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const hoverAt = useRef<number | null>(null)
  const focusAt = useRef<number | null>(null)

  /** How long the fill has been playing (hover or keyboard focus), in ms. */
  const fillSince = useCallback(() => {
    const now = performance.now()
    const a = hoverAt.current == null ? 0 : now - hoverAt.current
    const b = focusAt.current == null ? 0 : now - focusAt.current
    return Math.max(a, b)
  }, [])

  const onClosed = useCallback(() => setOpen(false), [])
  const onFailed = useCallback(() => {
    setFailed(true)
    setOpen(false)
    // The reader pressed Ask: take them where the link goes.
    window.location.hash = "contact"
  }, [])

  const face = <AskFace label={data.label} closeLabel={data.closeLabel} />
  const Dialog = loaded ?? LazyDialog

  if (!hydrated || failed) {
    return (
      <Button
        as="a"
        href="#contact"
        effect="cells"
        className="ask-btn"
        aria-label={data.ariaOpen}
      >
        {face}
      </Button>
    )
  }

  return (
    <>
      <Button
        ref={buttonRef}
        effect="cells"
        className="ask-btn"
        data-on={open && variant === "panel" ? "" : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={data.ariaOpen}
        onPointerDown={preload}
        onPointerEnter={(e) => {
          preload()
          if (e.pointerType === "mouse" || e.pointerType === "pen")
            hoverAt.current ??= performance.now()
        }}
        onPointerLeave={() => {
          hoverAt.current = null
        }}
        onFocus={(e) => {
          preload()
          if (e.currentTarget.matches(":focus-visible"))
            focusAt.current ??= performance.now()
        }}
        onBlur={() => {
          focusAt.current = null
        }}
        onClick={() => {
          if (open) return
          const phone = window.matchMedia(PHONE).matches
          setVariant(phone ? "sheet" : "panel")
          setRequested(true)
          setOpen(true)
          // Opening only; closing is the panel's own button or Escape.
          haptic("tap")
        }}
      >
        {face}
      </Button>
      {requested ? (
        <IslandBoundary onError={onFailed}>
          <Suspense fallback={null}>
            <Dialog
              data={data}
              open={open}
              variant={variant}
              onClosed={onClosed}
              buttonRef={buttonRef}
              fillSince={fillSince}
            />
          </Suspense>
        </IslandBoundary>
      ) : null}
    </>
  )
}
