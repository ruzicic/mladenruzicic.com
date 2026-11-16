"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react"

import { Button } from "@/app/components/primitives/Button"
import { Icon } from "@/app/components/primitives/Icon"
import { lockScroll } from "@/app/components/primitives/scroll-lock"

import type { Run } from "./paranoia/effect"

export interface PostscriptProps {
  lead: string
  before: string
  game: { name: string; icon: string }
  champions: { name: string; src: string }[]
  after: string
  /** Absent when the effect is switched off: the sentence alone. */
  effect?: {
    cta: string
    sign: string
    status: string
    sound: string
    cursor?: { src: string; x: number; y: number }
  }
}

type Modules = [
  typeof import("./paranoia/effect"),
  typeof import("./paranoia/sound"),
]

/**
 * The About page's postscript (15 Nov 2026), ported from the paper lab's
 * `/paranoia`: the sentence with the game's tile and the champions' avatar
 * group (a quiet tooltip with the name on hover, keyboard focus and tap;
 * they trigger nothing), and the button that runs Nocturne's "Paranoia" from
 * the enemy team's side, with its sign "Sound on. Mandatory.".
 *
 * Nothing of the effect is in the page's JavaScript: the effect and sound
 * modules, and the cast file, are fetched on the first intent to press the
 * button (pointer over it, focus, a touch), so the press itself is instant.
 * While a run is on (cast, hold, release) the page holds still: no touch,
 * wheel or key scrolls it, and a finger only moves the circle (owner,
 * 16 Nov 2026: "disable scroll while paranoia is active"). It scrolls again
 * the moment the run ends, however it ends: its time is up, Escape, a mouse
 * click, a double tap, the tab is hidden, or the page is left. The run does
 * not move focus; a status line tells screen readers what happens.
 */
export function Postscript({
  lead,
  before,
  game,
  champions,
  after,
  effect,
}: PostscriptProps) {
  const tipId = useId()
  // Which avatar's tooltip is showing. Each tooltip sits inside its own
  // avatar's box (CSS, `.ab-ps__tip`), so nothing is measured: it follows
  // the avatar wherever the page puts it, the sheet's end-of-page scale
  // included.
  const [tip, setTip] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState("")
  const modules = useRef<Promise<Modules> | null>(null)
  const run = useRef<Run | null>(null)
  /** Lets the page scroll again (`lockScroll`). */
  const unlock = useRef<(() => void) | null>(null)
  const starting = useRef(false)
  const lastPointer = useRef<[number, number] | null>(null)

  /* ------------------------------------------------------------- tooltips */

  const showTip = (index: number) => setTip(index)
  const hideTip = (index?: number) =>
    setTip((t) => (index === undefined || t === index ? null : t))

  useEffect(() => {
    if (tip === null) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hideTip()
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest("[data-ps-av]")) hideTip()
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown, {
      capture: true,
      passive: true,
    })
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown, { capture: true })
    }
  }, [tip])

  /* --------------------------------------------------------------- effect */

  const load = (): Promise<Modules> => {
    modules.current ??= Promise.all([
      import("./paranoia/effect"),
      import("./paranoia/sound"),
    ]).then((m) => {
      // Fetch the cast now, so the press does not wait for it.
      if (effect) void m[1].probeCastFile(effect.sound)
      return m
    })
    return modules.current
  }

  useEffect(() => {
    if (!effect) return
    const onMove = (e: PointerEvent) => {
      lastPointer.current = [e.clientX, e.clientY]
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      run.current?.stop()
      unlock.current?.()
      unlock.current = null
    }
  }, [effect])

  // `--ps-cursor` is the image and its hotspot only; about.css adds the
  // normal cursor after it (`auto`, or `pointer` on the button).
  const setCursor = (on: boolean) => {
    const root = document.documentElement
    if (!effect?.cursor) return
    if (on) {
      const { src, x, y } = effect.cursor
      root.style.setProperty("--ps-cursor", `url("${src}") ${x} ${y}`)
    } else root.style.removeProperty("--ps-cursor")
  }

  const start = async (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (!effect || run.current || starting.current) return
    const button = e.currentTarget
    const keyboard = e.detail === 0
    const point: [number, number] = [e.clientX, e.clientY]
    starting.current = true
    const [fx, snd] = await load()
    starting.current = false
    // The sound starts from the press and never delays the darkness.
    const sound = new snd.ParanoiaSound(effect.sound)
    void sound.prepare().then(() => sound.cast())
    const rect = button.getBoundingClientRect()
    const origin: [number, number] =
      !keyboard && point[0] + point[1] > 0
        ? point
        : lastPointer.current && !keyboard
          ? lastPointer.current
          : [rect.left + rect.width / 2, rect.top + rect.height / 2]
    setRunning(true)
    unlock.current?.()
    unlock.current = lockScroll({ touch: "none" })
    setCursor(true)
    document.documentElement.setAttribute("data-paranoia-run", "")
    setStatus(effect.status)
    const settings = fx.paranoiaSettings()
    run.current = fx.runParanoia({
      settings: () => settings,
      origin,
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      onRelease: (ms, early) => {
        document.documentElement.removeAttribute("data-paranoia-run")
        setCursor(false)
        if (early) sound.stopNow()
        else sound.release(ms)
      },
      onEnd: () => {
        run.current = null
        unlock.current?.()
        unlock.current = null
        setRunning(false)
        setStatus("")
        document.documentElement.removeAttribute("data-paranoia-run")
        setCursor(false)
      },
    })
  }

  const cursorStyle = effect?.cursor
    ? ({
        "--ps-cursor": `url("${effect.cursor.src}") ${effect.cursor.x} ${effect.cursor.y}`,
      } as CSSProperties)
    : undefined

  return (
    <section
      aria-label="Postscript"
      className="ab-col ab-ps"
      data-cursor={effect?.cursor ? "" : undefined}
      style={cursorStyle}
    >
      <p className="ab-ps__text">
        <span className="ab-ps__lead">{lead}</span> {before}{" "}
        <span className="ab-ps__game">
          <span className="ab-ps__tile" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={game.icon} alt="" width={14} height={14} />
          </span>
          {game.name}
          <span className="ab-ps__avatars">
            {champions.map((c, i) => (
              <span
                key={c.name}
                className="ab-ps__avw"
                data-ps-av=""
                data-on={tip === i ? "" : undefined}
              >
                <span
                  className="ab-ps__av"
                  tabIndex={0}
                  role="img"
                  aria-label={c.name}
                  aria-describedby={tip === i ? `${tipId}-${i}` : undefined}
                  onPointerEnter={(e) =>
                    e.pointerType !== "touch" && showTip(i)
                  }
                  onPointerLeave={(e) =>
                    e.pointerType !== "touch" && hideTip(i)
                  }
                  onPointerDown={(e) => {
                    if (e.pointerType !== "touch") return
                    if (tip === i) hideTip()
                    else showTip(i)
                  }}
                  onFocus={() => showTip(i)}
                  onBlur={() => hideTip(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.src} alt="" width={18} height={18} />
                </span>
                {/* Centred above its own avatar, in the avatar's box. */}
                <span
                  data-surface="night"
                  id={`${tipId}-${i}`}
                  role="tooltip"
                  className="ab-ps__tip"
                >
                  {c.name}
                </span>
              </span>
            ))}
          </span>
        </span>{" "}
        {after}
      </p>
      {effect ? (
        <div className="ab-ps__cta">
          <Button
            size="compact"
            aria-disabled={running ? "true" : "false"}
            onPointerEnter={() => void load()}
            onFocus={() => void load()}
            onTouchStart={() => void load()}
            onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
              if (running) return
              void start(e)
            }}
          >
            {effect.cta}
          </Button>
          <span className="ab-ps__sign">
            <Icon name="sound" />
            {effect.sign}
          </span>
        </div>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  )
}
