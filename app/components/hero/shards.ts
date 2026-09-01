/**
 * Deterministic shard layout — docs/v3-redesign-plan.md §5.1, ported from
 * `docs/v3-design/hero-shards.js`.
 *
 * The same generator feeds the WebGL scene (`Scene.tsx`) and the
 * reduced-motion SVG still (`HeroStill.tsx`), so the still is a genuine
 * frame-zero render of the scene rather than a different picture. It has no
 * three.js import and runs on the server.
 */

/** Camera in `hero-shards.js`: PerspectiveCamera(42, aspect, 0.1, 100) at z 11. */
export const CAMERA = { z: 11, fovDeg: 42 } as const

/** Extrusion the shard quad is given in three (also used to place the mark). */
export const EXTRUDE = {
  depth: 0.06,
  bevelThickness: 0.02,
  bevelSize: 0.02,
  bevelSegments: 2,
} as const

/** Front face of the extruded shard, in local z. The mark sits 0.02 behind it. */
export const FRONT_FACE_Z = EXTRUDE.depth + EXTRUDE.bevelThickness
export const MARK_Z = FRONT_FACE_Z - 0.02

export const DESKTOP_SHARD_COUNT = 13
export const MOBILE_SHARD_COUNT = 8

export interface ShardSpec {
  index: number
  /** Quad half-extents and the horizontal skew from the reference scene. */
  w: number
  h: number
  skew: number
  /** Rest position; the frame loop bobs around it. */
  x: number
  y: number
  z: number
  rx: number
  ry: number
  rz: number
  /** Bob parameters — `phase`, `speed`, `amp` in the reference. */
  phase: number
  speed: number
  amp: number
  /** Every third shard gets the bright yellow outline. */
  bright: boolean
  /** Index into the caller's logo list, or `null` for a blank shard. */
  logoIndex: number | null
}

/** mulberry32 — 32-bit, no dependencies, identical on server and client. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Builds `count` shards. The `logoCount` frontmost, largest shards become logo
 * shards, ordered left to right so the six marks read as a row rather than a
 * pile. Same `seed` ⇒ same layout, always.
 */
export function createShards(
  count: number,
  logoCount = 6,
  seed = 0x5eed_1e55
): ShardSpec[] {
  const rnd = mulberry32(seed)
  const r = (a: number, b: number) => a + rnd() * (b - a)

  const shards: ShardSpec[] = []
  for (let i = 0; i < count; i++) {
    const w = r(1.2, 3.2)
    shards.push({
      index: i,
      w,
      h: w * r(0.55, 0.72),
      skew: r(-0.25, 0.25) * w,
      x: r(-7, 7),
      y: r(-4, 4),
      z: r(-9, 2),
      rx: r(-0.6, 0.6),
      ry: r(-0.9, 0.9),
      rz: r(-0.3, 0.3),
      phase: r(0, Math.PI * 2),
      speed: r(0.15, 0.4),
      amp: r(0.15, 0.45),
      bright: i % 3 === 0,
      logoIndex: null,
    })
  }

  const candidates = [...shards]
    .sort((a, b) => b.z + b.w * 0.6 - (a.z + a.w * 0.6))
    .slice(0, Math.min(logoCount, shards.length))
    .sort((a, b) => a.x - b.x)

  candidates.forEach((shard, i) => {
    shards[shard.index].logoIndex = i
  })

  return shards
}

/* -------------------------------------------------------------------------- */
/* Projection — used by the SVG still only                                    */
/* -------------------------------------------------------------------------- */

type Vec3 = [number, number, number]

/** three's default Euler order is XYZ; good enough for a decorative still. */
function rotate([x, y, z]: Vec3, rx: number, ry: number, rz: number): Vec3 {
  let a = x
  let b = y
  let c = z
  // Z
  const cz = Math.cos(rz)
  const sz = Math.sin(rz)
  ;[a, b] = [a * cz - b * sz, a * sz + b * cz]
  // Y
  const cy = Math.cos(ry)
  const sy = Math.sin(ry)
  ;[a, c] = [a * cy + c * sy, -a * sy + c * cy]
  // X
  const cx = Math.cos(rx)
  const sx = Math.sin(rx)
  ;[b, c] = [b * cx - c * sx, b * sx + c * cx]
  return [a, b, c]
}

/** The four corners of a shard quad in local space, matching the reference. */
export function shardCorners(s: ShardSpec): Vec3[] {
  const { w, h, skew } = s
  return [
    [-w / 2, -h / 2, 0],
    [w / 2 + skew, -h / 2, 0],
    [w / 2, h / 2, 0],
    [-w / 2 - skew, h / 2, 0],
  ]
}

export interface ProjectedShard {
  spec: ShardSpec
  /** SVG `points` attribute for a `<polygon>`. */
  points: string
  /** Screen-space centre, for the mark glyph. */
  cx: number
  cy: number
  /** Screen-space width of the shard, for sizing the mark. */
  size: number
  /** Distance from the camera; drives the fog fade and the paint order. */
  distance: number
}

/**
 * Perspective-projects the resting shard layout into an SVG viewBox.
 * Mirrors the three camera so poster → scene is coherent.
 */
export function projectShards(
  shards: ShardSpec[],
  viewWidth: number,
  viewHeight: number
): ProjectedShard[] {
  const halfFov = ((CAMERA.fovDeg / 2) * Math.PI) / 180
  const tan = Math.tan(halfFov)

  const project = (p: Vec3, s: ShardSpec): [number, number] => {
    const [rxp, ryp, rzp] = rotate(p, s.rx, s.ry, s.rz)
    const wx = rxp + s.x
    const wy = ryp + s.y
    const wz = rzp + s.z
    const d = Math.max(CAMERA.z - wz, 0.2)
    const halfH = d * tan
    const k = viewHeight / 2 / halfH
    return [viewWidth / 2 + wx * k, viewHeight / 2 - wy * k]
  }

  return shards
    .map((spec) => {
      const pts = shardCorners(spec).map((p) => project(p, spec))
      const xs = pts.map((p) => p[0])
      const ys = pts.map((p) => p[1])
      return {
        spec,
        points: pts
          .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
          .join(" "),
        cx: (Math.min(...xs) + Math.max(...xs)) / 2,
        cy: (Math.min(...ys) + Math.max(...ys)) / 2,
        size: Math.max(...xs) - Math.min(...xs),
        distance: CAMERA.z - spec.z,
      }
    })
    .sort((a, b) => b.distance - a.distance)
}

/** `FogExp2(0x0b0b0c, 0.055)` from the reference, as a 0–1 opacity factor. */
export function fogFactor(distance: number, density = 0.055): number {
  const f = Math.exp(-Math.pow(density * distance, 2))
  return Math.max(0, Math.min(1, f))
}
