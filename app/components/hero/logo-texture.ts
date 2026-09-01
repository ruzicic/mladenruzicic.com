import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter } from "three"

/**
 * Rasterises a monochrome SVG mark to a 512² canvas and wraps it as a
 * `CanvasTexture` used as the shard's `alphaMap` — §5.1 "Logos".
 *
 * `alphaMap` samples the green channel, so the mark is drawn white on black:
 * glyph → alpha 1, background → alpha 0.
 *
 * Deliberately generic. The marks under `public/static/logos/mono/` are
 * placeholders (see the README note in the report); dropping a real mark at the
 * same path is the entire migration. If the SVG is missing, fails to decode, or
 * rasterises to nothing (a mark whose glyphs need a webfont the SVG image
 * sandbox will not load), we fall back to drawing the 1–2 letter `text`.
 */

const SIZE = 512

export interface MarkRequest {
  src?: string
  /** 1–2 letter fallback, always provided by the content layer. */
  text: string
}

const cache = new Map<string, Promise<CanvasTexture | null>>()

function makeCanvas(): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null
  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  return canvas
}

function drawText(ctx: CanvasRenderingContext2D, text: string) {
  const chars = text.trim().length || 1
  ctx.fillStyle = "#ffffff"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  const size = chars <= 1 ? 300 : chars === 2 ? 230 : 420 / chars
  ctx.font = `700 ${size}px "Helvetica Neue", Helvetica, Arial, sans-serif`
  ctx.fillText(text.toUpperCase(), SIZE / 2, SIZE / 2 + size * 0.02)
}

/** True when at least one pixel got painted (guards silent SVG font failures). */
function hasInk(ctx: CanvasRenderingContext2D): boolean {
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE)
  // Sample on a coarse grid — a full scan of 262k pixels is wasted work here.
  for (let i = 0; i < data.length; i += 4 * 37) {
    if (data[i + 1] > 24) return true
  }
  return false
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = "async"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`mark not found: ${src}`))
    img.src = src
  })
}

async function rasterise({
  src,
  text,
}: MarkRequest): Promise<CanvasTexture | null> {
  const canvas = makeCanvas()
  const ctx = canvas?.getContext("2d", { willReadFrequently: true })
  if (!canvas || !ctx) return null

  ctx.fillStyle = "#000000"
  ctx.fillRect(0, 0, SIZE, SIZE)

  let painted = false
  if (src) {
    try {
      const img = await loadImage(src)
      const w = img.naturalWidth || SIZE
      const h = img.naturalHeight || SIZE
      // contain, with a 12% margin so the mark never touches the shard bevel
      const scale = (SIZE * 0.76) / Math.max(w, h)
      const dw = w * scale
      const dh = h * scale
      ctx.drawImage(img, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh)
      painted = hasInk(ctx)
    } catch {
      painted = false
    }
  }

  if (!painted) {
    ctx.fillStyle = "#000000"
    ctx.fillRect(0, 0, SIZE, SIZE)
    drawText(ctx, text)
  }

  const texture = new CanvasTexture(canvas)
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

/** Memoised per `src|text`, so a remount never re-rasterises. */
export function loadMarkTexture(
  request: MarkRequest
): Promise<CanvasTexture | null> {
  const key = `${request.src ?? ""}|${request.text}`
  let entry = cache.get(key)
  if (!entry) {
    entry = rasterise(request)
    cache.set(key, entry)
  }
  return entry
}
