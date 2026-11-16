/**
 * The homepage dent, loaded on demand by `DentGate` (owner, 14 Nov 2026:
 * the paper lab's "Memory Sheet"). Everything WebGPU lives behind this
 * module, so a visitor the gate turns away never downloads any of it.
 *
 * Memory is spent only when used: `startDent` builds the device and the
 * pipelines (in idle time after the first mouse move), the first press puts
 * the layer on the page and sizes the canvas and the field, and after
 * `RELEASE_AFTER_MS` with nothing pressed and every dent healed both are
 * given back. Nothing renders at rest.
 */
import "@/app/styles/dent.css"

import { init, surface, type Gpu, type Surface } from "vgpu"

import { PageLayer } from "./layer"
import { DENT, RELEASE_AFTER_MS } from "./settings"
import { Sheet } from "./sheet"

/**
 * A press here behaves as it does today: things to use, the Ask panel,
 * dialogs and popovers, and opaque media that would hide the dent anyway
 * (strip cards and their clips, pictures, product tiles).
 */
const NO_DENT = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "summary",
  "label",
  '[role="button"]',
  "[contenteditable]",
  "dialog",
  "[popover]",
  ".ask-dialog",
  "[data-card]",
  // The strip between and around its cards: a press there may be a drag.
  "[data-strip]",
  "[data-tile]",
  "img",
  "picture",
  "video",
  "canvas",
].join(", ")

/** The paper token as sRGB 0..1, read from the page's own CSS. */
function paperColour(): [number, number, number] {
  const probe = document.createElement("span")
  probe.style.color = "var(--color-paper)"
  probe.hidden = true
  document.body.append(probe)
  const rgb = getComputedStyle(probe)
    .color.match(/[\d.]+/g)
    ?.map(Number)
  probe.remove()
  if (!rgb || rgb.length < 3) return [1, 1, 1]
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255]
}

/**
 * Prepares the dent on the page's paper sheet and starts listening for
 * presses. Rejects when WebGPU cannot start (the gate then stays off).
 * Resolves with the teardown, which releases every GPU resource.
 */
export async function startDent(sheetEl: HTMLElement): Promise<() => void> {
  const gpu: Gpu = await init({ powerPreference: "high-performance" })
  // Until the effect runs, a GPU error only marks it failed (vgpu would
  // otherwise print it); once running it ends the effect (`quit` below).
  let onGpuError: (why: string) => void = () => {}
  gpu.onError((err) => onGpuError(err.message || "gpu error"))
  const layer = new PageLayer(sheetEl)
  let output: Surface
  let sheet: Sheet
  try {
    output = surface(gpu, layer.canvas, {
      size: [1, 1],
      alphaMode: "premultiplied",
      clearColor: [0, 0, 0, 0],
    })
    sheet = new Sheet(gpu)
    await sheet.compile(output)
  } catch (err) {
    gpu.dispose()
    throw err
  }
  const look = { paper: paperColour() }

  let stopped = false
  let raf = 0
  let releaseTimer = 0
  let alive = false
  let pressing = false
  let pointerId = -1
  let blockSelect = false
  let lastClient: [number, number] = [0, 0]

  const fit = () => {
    const w = Math.max(1, layer.canvas.width)
    const h = Math.max(1, layer.canvas.height)
    if (output.size[0] !== w || output.size[1] !== h) output.resize([w, h])
  }

  /** After a quiet spell, give the canvas and the field back. */
  const scheduleRelease = () => {
    window.clearTimeout(releaseTimer)
    releaseTimer = window.setTimeout(() => {
      if (stopped || pressing || alive || !layer.attached) return
      layer.detach()
      fit()
      sheet.resize([1, 1])
    }, RELEASE_AFTER_MS)
  }

  const tick = (t: number) => {
    raf = 0
    if (stopped) return
    if (!layer.attached) {
      if (!pressing) return
      layer.attach()
    }
    fit()
    const origin = layer.follow()
    sheet.resize(layer.size())
    if (!sheet.alive(t, DENT)) {
      alive = false
      sheet.clear(output)
      sheet.reset()
      scheduleRelease()
      return
    }
    alive = true
    sheet.render(output, t, origin, DENT, look)
    raf = requestAnimationFrame(tick)
  }

  const requestFrame = () => {
    if (!raf && !stopped && !document.hidden) raf = requestAnimationFrame(tick)
  }

  const release = (t: number) => {
    if (!pressing) return
    pressing = false
    pointerId = -1
    sheet.release(t)
    requestFrame()
  }

  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !e.isPrimary) return
    if (pressing) return
    if (document.documentElement.hasAttribute("data-ask-open")) return
    const target = e.target instanceof Element ? e.target : null
    if (!target || target.closest(NO_DENT)) return
    if (!sheetEl.contains(target)) return
    pressing = true
    pointerId = e.pointerId
    blockSelect = true
    lastClient = [e.clientX, e.clientY]
    window.clearTimeout(releaseTimer)
    if (!layer.attached) {
      layer.attach()
      fit()
    }
    const [x, y] = layer.toLocal(e.clientX, e.clientY)
    sheet.press(x, y, e.timeStamp || performance.now())
    requestFrame()
  }

  /** Runs after pointerdown: a double or triple click may select words. */
  const onMouseDown = (e: MouseEvent) => {
    if (!pressing) return
    if (e.detail >= 2) {
      blockSelect = false
      return
    }
    // A plain press on the paper clears an old selection, as a click would.
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) selection.removeAllRanges()
  }

  const onSelectStart = (e: Event) => {
    if (pressing && blockSelect) e.preventDefault()
  }

  const onMove = (e: PointerEvent) => {
    if (!pressing || e.pointerId !== pointerId) return
    lastClient = [e.clientX, e.clientY]
    const [x, y] = layer.toLocal(e.clientX, e.clientY)
    sheet.move(x, y, e.timeStamp || performance.now())
    requestFrame()
  }

  const onUp = (e: PointerEvent) => {
    if (e.pointerId === pointerId) release(e.timeStamp || performance.now())
  }

  const onScroll = () => {
    // A wheel scroll while holding moves the paper under a still pointer.
    if (pressing) {
      const [x, y] = layer.toLocal(lastClient[0], lastClient[1])
      sheet.move(x, y, performance.now())
    }
    if (pressing || alive) requestFrame()
  }

  const onResize = () => {
    layer.resize()
    if (alive) requestFrame()
  }

  const onBlur = () => release(performance.now())

  const onVisibility = () => {
    if (document.hidden) {
      release(performance.now())
      cancelAnimationFrame(raf)
      raf = 0
    } else if (alive) {
      requestFrame()
    }
  }

  const capture = { capture: true } as const
  const passive = { capture: true, passive: true } as const
  window.addEventListener("pointerdown", onDown, passive)
  window.addEventListener("pointermove", onMove, passive)
  window.addEventListener("pointerup", onUp, passive)
  window.addEventListener("pointercancel", onUp, passive)
  window.addEventListener("mousedown", onMouseDown, passive)
  document.addEventListener("selectstart", onSelectStart, capture)
  window.addEventListener("blur", onBlur)
  window.addEventListener("scroll", onScroll, { passive: true })
  window.addEventListener("resize", onResize, { passive: true })
  document.addEventListener("visibilitychange", onVisibility)

  const stop = () => {
    if (stopped) return
    stopped = true
    window.removeEventListener("pointerdown", onDown, passive)
    window.removeEventListener("pointermove", onMove, passive)
    window.removeEventListener("pointerup", onUp, passive)
    window.removeEventListener("pointercancel", onUp, passive)
    window.removeEventListener("mousedown", onMouseDown, passive)
    document.removeEventListener("selectstart", onSelectStart, capture)
    window.removeEventListener("blur", onBlur)
    window.removeEventListener("scroll", onScroll)
    window.removeEventListener("resize", onResize)
    document.removeEventListener("visibilitychange", onVisibility)
    cancelAnimationFrame(raf)
    window.clearTimeout(releaseTimer)
    layer.detach()
    try {
      sheet.dispose()
    } finally {
      gpu.dispose()
    }
  }

  // A lost device or a GPU error ends the effect for this visit, quietly.
  const quit = (why: string) => {
    if (stopped) return
    console.debug(`dent: off (${why})`)
    stop()
  }
  onGpuError = quit
  void gpu.lost.then((info) => quit(info.message || "device lost"))

  return stop
}
