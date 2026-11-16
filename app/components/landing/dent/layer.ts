import { MAX_DPR } from "./settings"

/** The largest canvas side WebGPU is guaranteed to accept. */
const MAX_SIDE = 8192

/**
 * The dent's canvas: part of the page, not of the window. A clipping layer
 * the size of the paper sheet, under everything on it (`z-index: -1` in the
 * sheet's own stacking context), holds a full-width canvas about three
 * viewports tall. The canvas is absolutely positioned, so the compositor
 * scrolls the dents with the text (no frame of lag, no redraw), and it is
 * inside the sheet, so it also follows the sheet's scale as the footer comes
 * in. The page moves the window (`moveTo`) as the reader scrolls. Every
 * position here is in the layer's own CSS px (`toLocal`).
 *
 * Not `position: fixed`: the sheet animates `scale`, which makes it the
 * containing block of fixed descendants, so a fixed layer would scroll away.
 */
export class PageLayer {
  readonly canvas: HTMLCanvasElement
  readonly #sheet: HTMLElement
  readonly #layer: HTMLDivElement
  /** CSS px, the canvas's top inside the layer. */
  #top = 0
  #css: [number, number] = [0, 0]
  #dpr = 0

  constructor(sheet: HTMLElement) {
    this.#sheet = sheet
    this.#layer = document.createElement("div")
    this.#layer.className = "dent-layer"
    this.#layer.setAttribute("aria-hidden", "true")
    this.canvas = document.createElement("canvas")
    this.canvas.className = "dent-canvas"
    this.canvas.width = 1
    this.canvas.height = 1
    this.#layer.append(this.canvas)
  }

  get attached(): boolean {
    return this.#layer.isConnected
  }

  /** Puts the layer on the sheet and sizes the canvas (the first press). */
  attach(): void {
    if (this.attached) return
    this.#sheet.setAttribute("data-dent", "")
    this.#sheet.prepend(this.#layer)
    this.#css = [0, 0]
    this.resize()
  }

  /** Takes the layer off the page and lets the canvas memory go. */
  detach(): void {
    this.#layer.remove()
    this.#sheet.removeAttribute("data-dent")
    this.canvas.width = 1
    this.canvas.height = 1
    this.#css = [0, 0]
    this.#dpr = 0
  }

  /**
   * Sizes the window. A change of a few px (a scrollbar, the URL bar)
   * keeps the canvas as it is, so the dents survive it.
   */
  resize(): void {
    if (!this.attached) return
    const w = Math.max(1, Math.round(this.#layer.clientWidth || innerWidth))
    const tall = Math.ceil((innerHeight * 3) / 2) * 2
    const h = Math.max(
      2,
      Math.min(tall, Math.floor((this.#layer.clientHeight || tall) / 2) * 2)
    )
    const [w0, h0] = this.#css
    const minor =
      w0 > 0 &&
      Math.abs(w - w0) <= 32 &&
      Math.abs(h - h0) <= Math.max(48, 0.1 * h0)
    if (!minor) this.#css = [w, h]
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      MAX_DPR,
      MAX_SIDE / this.#css[0],
      MAX_SIDE / this.#css[1]
    )
    if (minor && Math.abs(dpr - this.#dpr) < 1e-3) return
    this.#dpr = dpr
    this.canvas.style.width = `${this.#css[0]}px`
    this.canvas.style.height = `${this.#css[1]}px`
    this.canvas.width = Math.max(1, Math.round(this.#css[0] * dpr))
    this.canvas.height = Math.max(1, Math.round(this.#css[1] * dpr))
    if (!minor) this.moveTo(this.toLocal(0, 0)[1] - innerHeight)
  }

  /**
   * Client px to the layer's own CSS px. The layer is scaled with the sheet
   * as the footer comes in, so a press is mapped through that scale; the
   * dent then lands under the pointer at any point of the recede.
   */
  toLocal(clientX: number, clientY: number): [number, number] {
    const r = this.#layer.getBoundingClientRect()
    const k = r.width / (this.#layer.offsetWidth || r.width || 1) || 1
    return [(clientX - r.left) / k, (clientY - r.top) / k]
  }

  /** Top-left of the canvas in the layer's CSS px. */
  origin(): [number, number] {
    return [0, this.#top]
  }

  /** CSS size of the canvas. */
  size(): [number, number] {
    return [this.#css[0], this.#css[1]]
  }

  /** The largest y the window's top can take in the layer. */
  maxTop(): number {
    return Math.max(0, this.#layer.clientHeight - this.#css[1])
  }

  /** Moves the window's top to layer y (whole CSS px, clamped to the layer). */
  moveTo(y: number): [number, number] {
    const top = Math.min(this.maxTop(), Math.max(0, Math.round(y)))
    if (top !== this.#top) {
      this.#top = top
      this.canvas.style.top = `${top}px`
    }
    return this.origin()
  }

  /**
   * Keeps the window around the viewport. It moves only when the viewport
   * comes within half a viewport of an edge; the caller shifts the field by
   * the same amount in the same frame.
   */
  follow(): [number, number] {
    const [, viewTop] = this.toLocal(0, 0)
    const [, viewBottom] = this.toLocal(0, innerHeight)
    const h = viewBottom - viewTop
    const origin = this.origin()
    const ch = this.#css[1]
    if (viewTop < origin[1] + h / 2 || viewBottom > origin[1] + ch - h / 2) {
      const want = Math.round(viewTop - (ch - h) / 2)
      if (want !== origin[1]) return this.moveTo(want)
    }
    return origin
  }
}
