"use client"

import {
  Fragment,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react"
import Image from "next/image"

import { track } from "@/lib/analytics"
import type { AskCard } from "@/lib/content/schema"

import { Button } from "../primitives/Button"
import { Icon } from "../primitives/Icon"
import { ProductTile } from "../primitives/ProductTile"
import { lockScroll } from "../primitives/scroll-lock"
import { TransitionLink } from "../primitives/TransitionLink"
import { holdHeadline } from "../site/hold-headline"
import { answer, providePrepared } from "./answer"
import { AskFace, SendIcon } from "./AskFace"
import { seeded } from "./cells"
import type { AskAnswer, AskClientData, AskSource } from "./types"

/**
 * The Ask island (PLAN.md §1 "Ask"), loaded lazily by `AskButton`.
 *
 * One native modal `<dialog>` in two shapes, picked when it opens:
 * - `panel` (desktop): absolutely positioned in the top layer over the top
 *   block, so it scrolls with the page as the board's panel does. It holds a
 *   copy of the name block and a "Close" twin of the button (both above the
 *   glass, as on the board), then the panel across the 540px column.
 * - `sheet` (phones, owner 16 Nov 2026: "button at the top -> bottom sheet
 *   is confusing"): a side sheet, the full height of the visible screen,
 *   that slides in from the right edge, the side the button is on. A copy of
 *   the Ask button sits exactly where the button is and makes its
 *   plus-to-close move there, so the thumb that opened it closes it.
 * The rest of the page sits behind `::backdrop` (the frosted glass on
 * desktop, a dim veil behind the sheet) and does not scroll while it is open
 * (`lockScroll`).
 *
 * The motion: the panel's square cells wipe in from the top right, the
 * surface and content fade in behind them, and the reverse on close (the
 * board's). The sheet moves as one sheet of paper, transform only, 240ms in
 * and 200ms out, its content riding on it; under reduced motion it fades.
 * Then the question, a short "thinking" pause with the dithering cells and
 * three verbs, the answer word by word, its source line and its card.
 *
 * A typed question with the live model configured may first run the
 * Turnstile check (`answer.ts`, `turnstile.ts`): a status line says so, and
 * the widget, which only shows itself when it needs a tick, renders into
 * `.ask-challenge` under the question field, inside the dialog so it stays
 * reachable by keyboard and screen reader while the rest of the page is
 * inert.
 */

type Phase = "closed" | "in" | "open" | "outa" | "out"
type Step = "idle" | "sent" | "thinking" | "answer" | "done"
export type AskVariant = "panel" | "sheet"

/** One question's answer as it comes in: streamed text, then the result. */
interface Feed {
  text: string
  final: AskAnswer | null
}

interface Exchange {
  step: Step
  question: string
  flip: boolean
  turns: number
  asked: string[]
  shown: AskAnswer | null
  words: string[]
  revealed: number
  cardOn: boolean
  verb: number
  /** The bio card's copy button: `false` idle, then the result. */
  copied: false | "ok" | "failed"
  /** The Turnstile check, while it runs. */
  check: "checking" | "interactive" | null
}

const EMPTY: Exchange = {
  step: "idle",
  question: "",
  flip: false,
  turns: 0,
  asked: [],
  shown: null,
  words: [],
  revealed: 0,
  cardOn: false,
  verb: 0,
  copied: false,
  check: null,
}

/** The pause between question and answer. It is a prepared answer: brief. */
const SENT_MS = 200
const VERB_MS = 300
const WORD_MS = 40

/**
 * Questions asked today in this browser, kept across closing the panel and
 * reloading the page (a friend's report, 2026-11-20: the count reset on
 * close). Only a date and a number, never a question; the Worker's
 * per-visitor cap is the real limit, this keeps the panel honest about it.
 */
const USED_KEY = "ask:used"
const today = () => new Date().toISOString().slice(0, 10)

function readUsed(): number {
  try {
    const v = JSON.parse(localStorage.getItem(USED_KEY) ?? "null") as {
      d?: unknown
      n?: unknown
    } | null
    return v?.d === today() && typeof v.n === "number" ? v.n : 0
  } catch {
    return 0
  }
}

function writeUsed(n: number) {
  try {
    localStorage.setItem(USED_KEY, JSON.stringify({ d: today(), n }))
  } catch {
    // Storage off (private mode, a policy): the count lives for this visit.
  }
}

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

/* -------------------------------------------------------------------------- */
/* Cell geometry for the panel and sheet wipes (board: askBuildGeometry)       */
/* -------------------------------------------------------------------------- */

interface WipeCell {
  open: number
  close: number
}

/** 27 x 35 cells of 20px, counted from the panel's top-right corner. */
function buildPanelCells(): WipeCell[] {
  const rnd = seeded(20261111 + 1)
  const cells: WipeCell[] = []
  for (let r = 0; r < 35; r++) {
    for (let c = 0; c < 27; c++) {
      const base = r * 8 + (26 - c) * 2.3
      const j = rnd() * 30
      cells.push({
        open: Math.round(base * 0.85 + j),
        close: Math.round(40 + Math.max(0, 210 - base) + j),
      })
    }
  }
  return cells
}

/** The sheet's slide in and out (ask.css), and the plain fade instead. */
const SHEET_IN_MS = 240
const SHEET_OUT_MS = 220
const FADE_MS = 160

/** The 5 x 3 dithering "thinking" cells. */
function buildThinkCells(): number[] {
  const rnd = seeded(20261111 + 3)
  const out: number[] = []
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 5; c++)
      out.push(Math.round((2 - r) * 150 + rnd() * 170))
  return out
}

const PANEL_CELLS = buildPanelCells()
const THINK_CELLS = buildThinkCells()

/* -------------------------------------------------------------------------- */

export interface AskDialogProps {
  data: AskClientData
  /** True from the button's press until `onClosed`. */
  open: boolean
  variant: AskVariant
  onClosed: () => void
  buttonRef: RefObject<HTMLButtonElement | null>
  /** How long the button's fill has been playing, in ms. */
  fillSince: () => number
}

export default function AskDialog({
  data,
  open,
  variant,
  onClosed,
  buttonRef,
  fillSince,
}: AskDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const echoRef = useRef<HTMLDivElement>(null)
  const challengeRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  /** Lets the page scroll again (`lockScroll`). */
  const unlock = useRef<(() => void) | null>(null)
  const shown = useRef(false)
  const timers = useRef<number[]>([])
  const wordTimer = useRef<number | null>(null)
  /** The current question's live request, so closing the panel ends it. */
  const request = useRef<AbortController | null>(null)
  const pressedOutside = useRef(false)
  const [phase, setPhase] = useState<Phase>("closed")
  const [ex, setEx] = useState<Exchange>(EMPTY)
  const [draft, setDraft] = useState("")
  const [used, setUsed] = useState(0)

  useEffect(() => {
    providePrepared(data)
  }, [data])

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((x) => x !== id)
      fn()
    }, ms)
    timers.current.push(id)
  }

  const clearAll = () => {
    for (const id of timers.current) window.clearTimeout(id)
    timers.current = []
    if (wordTimer.current != null) {
      window.clearInterval(wordTimer.current)
      wordTimer.current = null
    }
    request.current?.abort()
    request.current = null
  }

  const announce = (isOpen: boolean) => {
    const root = document.documentElement
    if (isOpen) root.setAttribute("data-ask-open", "")
    else root.removeAttribute("data-ask-open")
    document.dispatchEvent(
      new CustomEvent("ask:toggle", { detail: { open: isOpen } })
    )
    holdHeadline("ask", isOpen)
  }

  /**
   * The panel: laid over the top block, with a copy of the name block above
   * it, and no taller than the room under it (it scrolls inside after that,
   * the page being held). The sheet: the twin of the button over the button,
   * and the sheet the height of what is visible of the screen.
   */
  const place = () => {
    const el = dialogRef.current
    const button = buttonRef.current
    const header = button?.closest("header")
    if (!el || !header) return
    if (variant === "sheet") {
      const b = button!.getBoundingClientRect()
      // Where the button is; at the top block's place if it has scrolled
      // out of view.
      const top =
        b.top >= 0 && b.bottom <= window.innerHeight
          ? b.top
          : parseFloat(
              getComputedStyle(document.documentElement).getPropertyValue(
                "--page-pad-top"
              )
            ) || 32
      el.style.setProperty("--ask-top", `${Math.round(top)}px`)
      el.style.setProperty("--ask-left", `${Math.round(b.left)}px`)
      fitViewport()
      return
    }
    const r = header.getBoundingClientRect()
    el.style.top = `${r.top + window.scrollY}px`
    el.style.left = `${r.left + window.scrollX}px`
    el.style.width = `${r.width}px`
    const id = header.querySelector("[data-top-id]")
    const echo = echoRef.current
    if (id && echo) {
      const copy = id.cloneNode(true) as HTMLElement
      for (const n of [copy, ...copy.querySelectorAll("[id]")])
        n.removeAttribute("id")
      copy.setAttribute("inert", "")
      echo.replaceChildren(copy)
    }
    const scroller = scrollRef.current
    if (el.open && scroller) {
      const top = scroller.getBoundingClientRect().top
      const room = Math.max(240, window.innerHeight - Math.max(0, top) - 24)
      el.style.setProperty("--ask-room", `${Math.round(room)}px`)
    }
  }

  /**
   * The sheet follows the visual viewport: when the on-screen keyboard
   * comes up it ends at the keyboard's edge, so the field (at the sheet's
   * foot) stays in view, and the focused field is brought back into view.
   */
  const fitViewport = () => {
    const el = dialogRef.current
    const vv = window.visualViewport
    if (!el || !vv || variant !== "sheet") return
    const before = parseFloat(el.style.getPropertyValue("--ask-vvh")) || 0
    el.style.setProperty("--ask-vvh", `${Math.round(vv.height)}px`)
    el.style.setProperty("--ask-vvt", `${Math.round(vv.offsetTop)}px`)
    const active = document.activeElement
    if (before && vv.height < before && active instanceof HTMLInputElement)
      active.scrollIntoView({ block: "nearest" })
  }

  const frameId = useRef(0)

  const show = useEffectEvent(() => {
    const el = dialogRef.current
    if (!el || el.open) return
    setUsed(readUsed())
    shown.current = true
    place()
    el.showModal()
    unlock.current?.()
    unlock.current = lockScroll({ allow: () => scrollRef.current })
    announce(true)
    if (variant === "sheet") {
      // One frame at rest first (the sheet off screen, the twin as the
      // button it covers), so both move from there.
      frameId.current = requestAnimationFrame(() => {
        setPhase("in")
        later(() => setPhase("open"), reducedMotion() ? FADE_MS : SHEET_IN_MS)
      })
      return
    }
    setPhase("in")
    place() // the room under the panel, now that it is laid out
    later(() => setPhase("open"), reducedMotion() ? 160 : 420)
  })

  // Open. The panel waits for the button's fill to finish (520ms from the
  // start of the hover or keyboard focus); the sheet opens at once, its twin
  // of the button making the move in place.
  useEffect(() => {
    if (!open) return
    if (variant === "sheet") {
      // A microtask, not a timer: no wait, and an effect that is set up
      // twice (React's development check) still shows once.
      let live = true
      queueMicrotask(() => {
        if (live) show()
      })
      return () => {
        live = false
      }
    }
    let wait = 0
    if (!reducedMotion()) {
      const since = fillSince()
      wait = since >= 520 ? 40 : 520 - since
    }
    const id = window.setTimeout(() => show(), wait)
    return () => window.clearTimeout(id)
  }, [open, variant, fillSince])

  const onResize = useEffectEvent(() => {
    if (dialogRef.current?.open) place()
  })

  useEffect(() => {
    const handler = () => onResize()
    window.addEventListener("resize", handler)
    const vv = window.visualViewport
    vv?.addEventListener("resize", handler)
    vv?.addEventListener("scroll", handler)
    return () => {
      window.removeEventListener("resize", handler)
      vv?.removeEventListener("resize", handler)
      vv?.removeEventListener("scroll", handler)
    }
  }, [])

  // Leaving the page with the panel open (a card link): clean up.
  useEffect(
    () => () => {
      for (const id of timers.current) window.clearTimeout(id)
      if (wordTimer.current != null) window.clearInterval(wordTimer.current)
      cancelAnimationFrame(frameId.current)
      request.current?.abort()
      unlock.current?.()
      unlock.current = null
      if (document.documentElement.hasAttribute("data-ask-open"))
        announce(false)
    },
    []
  )

  const finish = () => {
    if (!shown.current) return
    shown.current = false
    clearAll()
    cancelAnimationFrame(frameId.current)
    const el = dialogRef.current
    if (el?.open) el.close()
    unlock.current?.()
    unlock.current = null
    setPhase("closed")
    setEx(EMPTY)
    setDraft("")
    announce(false)
    onClosed()
    const button = buttonRef.current
    if (button && document.activeElement !== button)
      button.focus({ preventScroll: true })
  }

  // Closed without our animation (a repeated Escape the browser would not
  // let us cancel): tidy up. A native listener, because React's `onClose`
  // did not fire for the top-layer dialog in testing.
  const onNativeClose = useEffectEvent(() => finish())
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const handler = () => onNativeClose()
    el.addEventListener("close", handler)
    return () => el.removeEventListener("close", handler)
  }, [])

  const close = () => {
    if (phase === "closed" || phase === "outa" || phase === "out") return
    clearAll()
    cancelAnimationFrame(frameId.current)
    if (reducedMotion()) {
      setPhase("out")
      later(finish, FADE_MS)
      return
    }
    if (variant === "sheet") {
      setPhase("out")
      later(finish, SHEET_OUT_MS)
      return
    }
    setPhase("outa")
    later(() => {
      setPhase("out")
      later(finish, 400)
    }, 120)
  }

  /* ---------------------------------------------------------------------- */
  /* Questions and answers                                                  */
  /* ---------------------------------------------------------------------- */

  const busy =
    ex.step === "sent" || ex.step === "thinking" || ex.step === "answer"
  const limitReached = used >= data.maxTurns

  /**
   * The answer, word by word, as it arrives. A prepared answer is complete at
   * once; a live one streams in and the reveal follows it, holding the last
   * word back until the next arrives. If the final answer is not what
   * streamed (the stream broke and the fallback took over), the reveal
   * starts again from its first word.
   */
  const reveal = (feed: Feed) => {
    let words: string[] = []
    let revealed = 0
    let finished = false
    const stop = () => {
      finished = true
      if (wordTimer.current != null) window.clearInterval(wordTimer.current)
      wordTimer.current = null
    }
    const tick = () => {
      const res = feed.final
      const text = res ? res.answer : feed.text
      if (!text) return // still thinking
      const shownSoFar = words.slice(0, revealed).join(" ")
      words = text.split(" ")
      if (!text.startsWith(shownSoFar)) revealed = 0
      const limit = res ? words.length : words.length - 1
      revealed = reducedMotion()
        ? Math.max(revealed, limit)
        : Math.min(limit, revealed + 1)
      if (revealed < 1) return
      const current = words
      const count = revealed
      setEx((e) => ({
        ...e,
        step: "answer",
        words: current,
        revealed: count,
      }))
      if (!res || revealed < words.length) return
      stop()
      setEx((e) => ({
        ...e,
        shown: res,
        asked:
          res.id && !e.asked.includes(res.id) ? [...e.asked, res.id] : e.asked,
      }))
      if (reducedMotion()) {
        setEx((e) => ({ ...e, cardOn: true }))
        later(() => setEx((e) => ({ ...e, step: "done" })), 160)
      } else {
        later(() => setEx((e) => ({ ...e, cardOn: true })), 220)
        later(() => setEx((e) => ({ ...e, step: "done" })), 520)
      }
    }
    tick()
    if (!finished) wordTimer.current = window.setInterval(tick, WORD_MS)
  }

  /** `prepared`: one of the question chips; `typed`: the field. */
  const ask = (text: string, from: "prepared" | "typed") => {
    if (phase !== "open" && phase !== "in") return
    if (busy || limitReached) return
    // Which kind of question, never its text (`lib/analytics.ts`).
    track(
      from === "prepared" ? "ask: prepared question" : "ask: typed question"
    )
    clearAll()
    const feed: Feed = { text: "", final: null }
    const controller = new AbortController()
    request.current = controller
    void answer(text, {
      onText: (t) => {
        feed.text = t
      },
      onStatus: (status) => {
        if (controller.signal.aborted) return
        setEx((e) => ({ ...e, check: status === "answering" ? null : status }))
      },
      challengeHost: () => challengeRef.current,
      signal: controller.signal,
    })
      .then((res) => {
        if (controller.signal.aborted) return
        feed.final = res
        if (res.exhausted) {
          setUsed(data.maxTurns)
          writeUsed(data.maxTurns)
        }
      })
      .catch(() => {
        // Only an abort rejects; anything else still ends the wait.
        if (!controller.signal.aborted)
          feed.final = {
            id: null,
            answer: data.live.messages.unavailable,
            source: "",
            card: data.fallback.card,
          }
      })
    const t0 = reducedMotion() ? 0 : SENT_MS
    const next = Math.max(used, readUsed()) + 1
    setUsed(next)
    writeUsed(next)
    setDraft("")
    setEx((e) => ({
      ...e,
      step: "sent",
      question: text,
      flip: !e.flip,
      turns: e.turns + 1,
      cardOn: false,
      verb: 0,
      copied: false,
      check: null,
    }))
    later(() => setEx((e) => ({ ...e, step: "thinking", verb: 0 })), t0)
    for (let v = 1; v < data.thinkingVerbs.length; v++)
      later(() => setEx((e) => ({ ...e, verb: v })), t0 + v * VERB_MS)
    later(() => reveal(feed), t0 + data.thinkingVerbs.length * VERB_MS)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const v = draft.trim()
    if (v) ask(v, "typed")
  }

  const copyBio = async () => {
    let ok = true
    try {
      // Rejects without permission or a secure context; the text is on
      // screen to copy by hand, and the label says the copy failed.
      await navigator.clipboard.writeText(data.bio)
    } catch {
      ok = false
    }
    setEx((e) => ({ ...e, copied: ok ? "ok" : "failed" }))
    later(() => setEx((e) => ({ ...e, copied: false })), ok ? 1600 : 2400)
  }

  /* ---------------------------------------------------------------------- */
  /* Dismissal                                                              */
  /* ---------------------------------------------------------------------- */

  // A press on the dialog's own box, not on anything in it: the backdrop,
  // or (on a case study, where the dialog spans the wide top block and the
  // panel sits at its right) the empty part beside the panel.
  const outside = (e: ReactPointerEvent<HTMLDialogElement>) => {
    const el = dialogRef.current
    if (!el || e.target !== el) return false
    const panel = el.querySelector(".ask-panel")?.getBoundingClientRect()
    if (!panel) return true
    return (
      e.clientX < panel.left ||
      e.clientX > panel.right ||
      e.clientY < panel.top ||
      e.clientY > panel.bottom
    )
  }

  /* ---------------------------------------------------------------------- */

  const remaining = data.questions
    .filter((q) => !ex.asked.includes(q.id))
    .slice(0, data.chipsShown)
  const showChips =
    (ex.step === "idle" || ex.step === "done") &&
    remaining.length > 0 &&
    !limitReached
  const answering = ex.step === "answer" || ex.step === "done"
  const showDone = limitReached && (ex.step === "idle" || ex.step === "done")
  const titleId = "ask-title"
  const head = (
    <div className="ask-head">
      <h2 id={titleId} className="ask-title">
        {data.title}
      </h2>
    </div>
  )

  return (
    <dialog
      ref={dialogRef}
      className="ask-dialog"
      data-variant={variant}
      data-phase={phase}
      aria-labelledby={titleId}
      closedby="closerequest"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onPointerDown={(e) => {
        pressedOutside.current = outside(e)
      }}
      onPointerUp={(e) => {
        if (pressedOutside.current && outside(e)) close()
        pressedOutside.current = false
      }}
    >
      {variant === "panel" ? (
        <div className="ask-echo">
          <div ref={echoRef} className="ask-echo__id" aria-hidden="true" />
          <Button
            effect="cells"
            className="ask-btn"
            data-on=""
            aria-label={data.closeLabel}
            onClick={close}
          >
            <AskFace label={data.label} closeLabel={data.closeLabel} />
          </Button>
        </div>
      ) : (
        // The sheet's twin of the Ask button, over the button: it fills and
        // turns its plus into the close while the sheet slides in under it,
        // and turns back as the sheet leaves.
        <Button
          effect="cells"
          className="ask-btn ask-twin"
          data-on={phase === "in" || phase === "open" ? "" : undefined}
          aria-label={data.closeLabel}
          onClick={close}
        >
          <AskFace label={data.label} closeLabel={data.closeLabel} />
        </Button>
      )}

      <div className="ask-panel">
        {variant === "panel" ? (
          <>
            <div className="ask-pcells" aria-hidden="true">
              {phase === "closed"
                ? null
                : PANEL_CELLS.map((c, i) => (
                    <span
                      key={i}
                      className="ask-pc"
                      style={
                        {
                          "--do": `${c.open}ms`,
                          "--dc": `${c.close}ms`,
                        } as CSSProperties
                      }
                    />
                  ))}
            </div>
            <div className="ask-psurf" aria-hidden="true" />
          </>
        ) : null}

        <div className="ask-pcontent">
          {variant === "sheet" ? head : null}
          <div ref={scrollRef} className="ask-scroll">
            {variant === "panel" ? head : null}
            <p className="ask-note">{data.note}</p>

            <Expand open={ex.turns > 0}>
              <div className="ask-exchange">
                <p key={ex.flip ? "a" : "b"} className="ask-q">
                  {ex.question}
                </p>
                <div className="ask-reply">
                  <div
                    className="ask-trow"
                    data-on={ex.step === "thinking" ? "" : undefined}
                  >
                    <span className="ask-tcells" aria-hidden="true">
                      {THINK_CELLS.map((d, i) => (
                        <span
                          key={i}
                          className="ask-tc"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </span>
                    <span className="ask-verbs" role="status">
                      {data.thinkingVerbs.map((v, i) => {
                        const current = ex.step === "thinking" && i === ex.verb
                        return (
                          <span
                            key={v}
                            className="ask-vb"
                            aria-hidden={current ? undefined : true}
                            data-state={
                              current
                                ? "on"
                                : ex.step === "thinking" && i < ex.verb
                                  ? "gone"
                                  : undefined
                            }
                          >
                            {v}
                          </span>
                        )
                      })}
                    </span>
                  </div>
                  {ex.check ? (
                    <p className="ask-check" role="status">
                      {ex.check === "interactive"
                        ? data.live.interactive
                        : data.live.checking}
                    </p>
                  ) : null}
                  <Expand open={answering} className="ask-ans">
                    <p className="ask-words" aria-live="polite">
                      {ex.words.map((w, i) => (
                        <Fragment key={`${ex.flip}-${i}`}>
                          <span
                            className="ask-w"
                            data-on={i < ex.revealed ? "" : undefined}
                          >
                            {w}
                          </span>{" "}
                        </Fragment>
                      ))}
                    </p>
                  </Expand>
                </div>

                <Expand open={ex.cardOn} rise>
                  {ex.shown ? (
                    <>
                      {ex.shown.notice ? (
                        <p className="ask-notice">{ex.shown.notice}</p>
                      ) : null}
                      <SourceLine
                        text={ex.shown.source}
                        href={ex.shown.sourceHref}
                        sources={ex.shown.sources}
                        prefix={data.live.sourcePrefix}
                        onNavigate={finish}
                      />
                      {ex.shown.card ? (
                        <div className="ask-cardwrap">
                          <Card
                            card={ex.shown.card}
                            data={data}
                            copied={ex.copied}
                            onCopy={copyBio}
                            onNavigate={finish}
                          />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </Expand>
              </div>
            </Expand>

            <Expand open={showChips}>
              <div
                className="ask-chips"
                role="group"
                aria-label={data.suggestionsLabel}
              >
                {remaining.map((q) => (
                  <Button
                    key={q.id}
                    size="compact"
                    className="ask-chip"
                    onClick={() => ask(q.question, "prepared")}
                  >
                    <span className="ask-chip__t">{q.chip}</span>
                  </Button>
                ))}
              </div>
            </Expand>

            <Expand open={showDone}>
              <div className="ask-done">
                <p className="ask-done__line">{data.done.line}</p>
                <div className="ask-cardwrap">
                  <Card
                    card={data.done.card}
                    data={data}
                    copied={ex.copied}
                    onCopy={copyBio}
                    onNavigate={finish}
                  />
                </div>
              </div>
            </Expand>

            {limitReached ? null : (
              <form className="ask-form" onSubmit={onSubmit}>
                <label htmlFor="ask-q" className="ask-label">
                  {data.inputLabel}
                </label>
                <div className="ask-inputrow">
                  <input
                    id="ask-q"
                    className="ask-qin"
                    type="text"
                    autoComplete="off"
                    enterKeyHint="send"
                    placeholder={data.placeholder}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="ask-send"
                    aria-label={data.sendLabel}
                    aria-disabled={busy || limitReached ? true : undefined}
                  >
                    <SendIcon />
                  </Button>
                </div>
              </form>
            )}
            <div
              ref={challengeRef}
              className="ask-challenge"
              data-on={ex.check === "interactive" ? "" : undefined}
            />

            <div className="ask-foot">
              <span>{data.footNote}</span>
              <span className="ask-ft">{data.savedNote}</span>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}

/* -------------------------------------------------------------------------- */

/** Height 0 to auto through `grid-template-rows`, with a fade. */
function Expand({
  open,
  children,
  className,
  rise = false,
}: {
  open: boolean
  children: ReactNode
  className?: string
  rise?: boolean
}) {
  return (
    <div
      className={className ? `ask-xp ${className}` : "ask-xp"}
      data-open={open ? "" : undefined}
      inert={!open}
    >
      <div className="ask-xpi">
        {rise ? <div className="ask-rise">{children}</div> : children}
      </div>
    </div>
  )
}

function isInternal(href: string) {
  return href.startsWith("/") || href.startsWith("#")
}

function SmartLink({
  href,
  className,
  children,
  onNavigate,
  external,
}: {
  href: string
  className?: string
  children: ReactNode
  onNavigate: () => void
  external?: boolean
}) {
  if (isInternal(href)) {
    return (
      <TransitionLink href={href} className={className} onClick={onNavigate}>
        {children}
      </TransitionLink>
    )
  }
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener" className={className}>
        {children}
      </a>
    )
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

function SourceLine({
  text,
  href,
  sources,
  prefix,
  onNavigate,
}: {
  text: string
  href?: string
  /** A live answer's links: "FROM · ABOUT · MENTORING", each one a link. */
  sources?: AskSource[]
  prefix: string
  onNavigate: () => void
}) {
  if (!text && !sources?.length) return null
  if (sources && sources.length > 1) {
    return (
      <p className="ask-src">
        {prefix}
        {sources.map((s) => (
          <Fragment key={s.href}>
            {" · "}
            <SmartLink
              href={s.href}
              className="ask-src__link"
              onNavigate={onNavigate}
              external={/^https:/.test(s.href)}
            >
              {s.label.toUpperCase()}
            </SmartLink>
          </Fragment>
        ))}
      </p>
    )
  }
  return (
    <p className="ask-src">
      {href ? (
        <SmartLink
          href={href}
          className="ask-src__link"
          onNavigate={onNavigate}
        >
          {text}
        </SmartLink>
      ) : (
        text
      )}
    </p>
  )
}

const ArrowRight = () => (
  <Icon name="arrow-right" size={16} className="ask-card__go" />
)

function Card({
  card,
  data,
  copied,
  onCopy,
  onNavigate,
}: {
  card: AskCard
  data: AskClientData
  copied: Exchange["copied"]
  onCopy: () => void
  onNavigate: () => void
}) {
  if (card.kind === "product") {
    const mark = data.marks[card.ref]
    const meta = data.images[card.image.src]
    return (
      <a
        href={card.href}
        target="_blank"
        rel="noopener"
        className="ask-acard ask-acard--product"
      >
        <Image
          src={card.image.src}
          alt={card.image.alt}
          width={104}
          height={72}
          sizes="104px"
          placeholder={meta ? "blur" : "empty"}
          blurDataURL={meta?.blurDataURL}
          className="ask-acard__shot"
        />
        <span className="ask-acard__body">
          <span className="ask-acard__row">
            {mark ? (
              <span className="ask-acard__tile">
                <ProductTile mark={mark} />
              </span>
            ) : null}
            <span className="ask-acard__title">{card.title}</span>
            <span className="ask-acard__status">
              <span aria-hidden="true" className="ask-acard__dot" />
              {card.status}
            </span>
          </span>
          <span className="ask-acard__text">{card.quote}</span>
          <span className="ask-acard__cta">
            {card.linkLabel}
            <Icon name="arrow-up-right" />
          </span>
        </span>
      </a>
    )
  }

  if (card.kind === "link") {
    const v = card.visual
    let visual: ReactNode
    if (v.kind === "image") {
      visual = (
        <Image
          src={v.image.src}
          alt={v.image.alt}
          width={48}
          height={48}
          sizes="48px"
          className="ask-acard__photo"
        />
      )
    } else if (v.kind === "tile") {
      const mark = data.marks[v.ref]
      visual = mark ? (
        <span className="ask-acard__bigtile">
          <ProductTile mark={mark} />
        </span>
      ) : null
    } else {
      visual = (
        <span className="ask-acard__icon" data-icon={v.icon} aria-hidden="true">
          <Icon name={v.icon} size={22} />
        </span>
      )
    }
    return (
      <SmartLink
        href={card.href}
        className="ask-acard ask-acard--link"
        onNavigate={onNavigate}
        external={/^https:/.test(card.href)}
      >
        {visual}
        <span className="ask-acard__stack">
          <span className="ask-acard__title">{card.title}</span>
          <span className="ask-acard__text">{card.body}</span>
        </span>
        <ArrowRight />
      </SmartLink>
    )
  }

  // The short bio. The card's language note ("Ask in Serbian or Italian…")
  // is deliberately not rendered: prepared answers are English only.
  return (
    <>
      <div className="ask-bio">
        <span className="ask-bio__label">{card.label}</span>
        <p className="ask-bio__text">{data.bio}</p>
        <Button size="compact" className="ask-ghost" onClick={onCopy}>
          <Icon name="copy-check" size={14} on={copied === "ok"} />
          <span aria-live="polite">
            {copied === "ok"
              ? card.copiedLabel
              : copied === "failed"
                ? card.failedLabel
                : card.copyLabel}
          </span>
        </Button>
      </div>
      <div className="ask-bio__after">
        <SmartLink
          href={card.link.href}
          className="ask-bio__link"
          onNavigate={onNavigate}
        >
          {card.link.label}
          <Icon name="arrow-right" />
        </SmartLink>
      </div>
    </>
  )
}
