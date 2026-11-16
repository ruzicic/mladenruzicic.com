import { readFileSync } from "node:fs"

import { TILE_ART_ID } from "./tile-art-id"

/**
 * Reads and checks one complete tile file (`public/static/logos/tiles/*.svg`)
 * and returns its inner markup for `ProductTile` to inline. Server-only: the
 * loader calls it once per file at module init, so a bad file fails
 * `next build` with its path, the same way a zod failure does.
 *
 * The contract the artwork is held to (also in the private notes,
 * docs/v4-build/sources/logos/tiles/SOURCES.md):
 * - `viewBox="0 0 64 64"`, and the first element a full-size background
 *   `<rect width="64" height="64">` (a `bare` product has none);
 * - geometry only: no text, raster, styles, scripts, `<use>`, external
 *   references or editor metadata;
 * - at most 6 KB.
 *
 * Ids (a gradient's) are rewritten to carry `TILE_ART_ID`, so each tile on a
 * page can give them a prefix of its own.
 */

const MAX_BYTES = 6 * 1024

const ALLOWED = new Set([
  "svg",
  "g",
  "path",
  "rect",
  "circle",
  "ellipse",
  "polygon",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
])

export interface TileArtFile {
  /** Inner markup, ids carrying `TILE_ART_ID`. */
  body: string
  /** The background rect's fill, upper-case `#RRGGBB`. */
  background: string
}

/**
 * Light enough that the tile would lose its edge on the paper (`#FCFCFA`):
 * relative luminance above 0.7 (white, the creams, the near-whites).
 */
export function isLightTile(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.7
}

export function readTileArt(
  file: string,
  source: string,
  bare = false
): TileArtFile {
  const fail = (message: string): never => {
    throw new Error(`Invalid tile artwork ${source}: ${message}`)
  }
  let raw: string
  try {
    raw = readFileSync(file, "utf8")
  } catch {
    return fail("file not found (content/products.ts points at it).")
  }
  if (Buffer.byteLength(raw) > MAX_BYTES)
    fail(`${Buffer.byteLength(raw)} bytes; the limit is ${MAX_BYTES}.`)

  const svg = raw.trim()
  const open = /^<svg\b[^>]*>/.exec(svg)
  if (!open || !svg.endsWith("</svg>"))
    fail("expected a single <svg> root element.")
  if (!/\sviewBox="0 0 64 64"/.test(open![0]))
    fail('expected viewBox="0 0 64 64".')

  const body = svg.slice(open![0].length, -"</svg>".length).trim()
  if (/<!--|<\?|<!\[CDATA|<!DOCTYPE/i.test(body))
    fail("comments, processing instructions and CDATA are not allowed.")
  for (const [, name] of body.matchAll(/<\/?([A-Za-z][\w:-]*)/g)) {
    if (!ALLOWED.has(name)) fail(`<${name}> is not allowed.`)
  }
  if (/\s(on\w+|style|href|xlink:href|class)\s*=/i.test(body))
    fail("event handlers, style, class and href attributes are not allowed.")
  for (const [, ref] of body.matchAll(/url\(([^)]*)\)/g)) {
    if (!/^#[\w-]+$/.test(ref)) fail(`url(${ref}): only local references.`)
  }
  const rect =
    /^<rect\s+width="64"\s+height="64"\s+fill="(#[0-9A-Fa-f]{6})"\s*\/>/.exec(
      body
    )
  if (bare) {
    if (/^<rect\b/.test(body)) fail("a bare tile has no background <rect>.")
  } else if (!rect)
    fail(
      'the first element must be <rect width="64" height="64" fill="#RRGGBB"/>.'
    )

  const ids = [...body.matchAll(/\sid="([\w-]+)"/g)].map((m) => m[1])
  let out = body
  for (const id of ids) {
    out = out
      .replaceAll(`id="${id}"`, `id="${TILE_ART_ID}${id}"`)
      .replaceAll(`url(#${id})`, `url(#${TILE_ART_ID}${id})`)
  }
  return { body: out, background: rect ? rect[1].toUpperCase() : "" }
}
