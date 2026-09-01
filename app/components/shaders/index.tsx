"use client"

import { useSyncExternalStore, type CSSProperties, type ReactNode } from "react"
import {
  GrainGradient,
  MeshGradient,
  StaticMeshGradient,
} from "@paper-design/shaders-react"

import { cn } from "@/lib/utils"

/**
 * Paper Shaders surfaces — docs/v3-redesign-plan.md §5.2.
 *
 * One animated surface per screen, tinted with the page's accent. Never on the
 * homepage: the hero already owns the GPU.
 *
 * Three things the library does not do for us and we do here:
 *   1. WebGL2 is required and undetectable by `CSS.supports`, so we probe once
 *      per document and fall back to a CSS gradient in the same colours.
 *   2. It ignores `prefers-reduced-motion`, so we pass `speed={0}`.
 *   3. It defaults to `minPixelRatio: 2` and a 4K pixel cap, both of which are
 *      wasteful for a background; we pin 1 and 1920×1080.
 *
 * It already pauses itself when offscreen and when the tab is hidden.
 */

/* -------------------------------------------------------------------------- */
/* Capability probes — evaluated once, lazily, per document                    */
/* -------------------------------------------------------------------------- */

let webgl2: boolean | null = null

/** One-shot WebGL2 probe. The context is released immediately after. */
function hasWebGL2(): boolean {
  if (webgl2 !== null) return webgl2
  if (typeof document === "undefined") return false
  try {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl2")
    webgl2 = Boolean(gl)
    gl?.getExtension("WEBGL_lose_context")?.loseContext()
  } catch {
    webgl2 = false
  }
  return webgl2
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  const media = window.matchMedia(REDUCED_QUERY)
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}

/**
 * Reduced motion as a store rather than an effect, so the very first client
 * render already knows — a shader that animates for one frame then stops is
 * worse than one that never moved.
 */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false
  )
}

const noopSubscribe = () => () => {}

/** Mirrors the WebGL2 probe through the same render-safe path. */
function useWebGL2(): boolean {
  return useSyncExternalStore(noopSubscribe, hasWebGL2, () => false)
}

/* -------------------------------------------------------------------------- */
/* Palette                                                                     */
/* -------------------------------------------------------------------------- */

const NEAR_BLACK = "#0B0B0C"
const SURFACE = "#141416"

/** `accent` at ~45% toward the page background — the fourth palette stop. */
function dim(accent: string, amount = 0.55): string {
  const hex = accent.replace("#", "")
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex
  const value = Number.parseInt(full, 16)
  if (!Number.isFinite(value) || full.length !== 6) return SURFACE
  const r = Math.round(((value >> 16) & 255) * (1 - amount) + 0x0b * amount)
  const g = Math.round(((value >> 8) & 255) * (1 - amount) + 0x0b * amount)
  const b = Math.round((value & 255) * (1 - amount) + 0x0c * amount)
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`
}

function palette(accent: string): string[] {
  return [accent, NEAR_BLACK, SURFACE, dim(accent)]
}

const BASE_STYLE: CSSProperties = { position: "absolute", inset: 0 }

const MAX_PIXELS = 1920 * 1080

/* -------------------------------------------------------------------------- */
/* Fallback                                                                    */
/* -------------------------------------------------------------------------- */

/** The no-WebGL2 surface. Same four colours, zero JS, zero GPU. */
function GradientFallback({
  accent,
  className,
  variant = "mesh",
}: {
  accent: string
  className?: string
  variant?: "mesh" | "grain"
}) {
  const dimmed = dim(accent)
  const background =
    variant === "grain"
      ? `linear-gradient(160deg, ${NEAR_BLACK} 0%, ${dimmed} 55%, ${SURFACE} 100%)`
      : `radial-gradient(70% 55% at 72% 22%, ${accent}33, transparent 62%),
         radial-gradient(55% 50% at 18% 78%, ${dimmed}66, transparent 70%),
         linear-gradient(180deg, ${SURFACE} 0%, ${NEAR_BLACK} 100%)`

  return (
    <div
      aria-hidden
      data-shader-fallback={variant}
      className={cn(className)}
      style={{ ...BASE_STYLE, background }}
    />
  )
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export interface AccentGradientProps {
  /** Hex from the work entry / page accent. */
  accent: string
  className?: string
  /** Default `0.2`; forced to `0` under reduced motion. */
  speed?: number
}

/** Animated case-study header surface. One per screen. */
export function AccentGradient({
  accent,
  className,
  speed = 0.2,
}: AccentGradientProps) {
  const reduced = usePrefersReducedMotion()
  const supported = useWebGL2()
  if (!supported) {
    return <GradientFallback accent={accent} className={className} />
  }
  return (
    <MeshGradient
      aria-hidden
      className={className}
      style={BASE_STYLE}
      colors={palette(accent)}
      speed={reduced ? 0 : speed}
      distortion={0.85}
      swirl={0.55}
      grainMixer={0.25}
      grainOverlay={0.12}
      minPixelRatio={1}
      maxPixelCount={MAX_PIXELS}
    />
  )
}

export interface StaticAccentGradientProps {
  accent: string
  className?: string
}

/** The still version, for `/work` cards. Cheap enough to mount many. */
export function StaticAccentGradient({
  accent,
  className,
}: StaticAccentGradientProps) {
  const supported = useWebGL2()
  if (!supported) {
    return <GradientFallback accent={accent} className={className} />
  }
  return (
    <StaticMeshGradient
      aria-hidden
      className={className}
      style={BASE_STYLE}
      colors={palette(accent)}
      positions={4}
      waveX={0.4}
      waveY={0.3}
      mixing={0.6}
      grainMixer={0.2}
      grainOverlay={0.1}
      minPixelRatio={1}
      maxPixelCount={MAX_PIXELS}
    />
  )
}

export interface GrainSurfaceProps {
  /** Defaults to the site accent. */
  accent?: string
  className?: string
}

/** Very slow grain field — `/mentoring` and `/404`. */
export function GrainSurface({
  accent = "#F5DF4D",
  className,
}: GrainSurfaceProps) {
  const reduced = usePrefersReducedMotion()
  const supported = useWebGL2()
  if (!supported) {
    return (
      <GradientFallback accent={accent} className={className} variant="grain" />
    )
  }
  return (
    <GrainGradient
      aria-hidden
      className={className}
      style={BASE_STYLE}
      colorBack={NEAR_BLACK}
      colors={[accent, dim(accent), SURFACE]}
      shape="wave"
      softness={0.85}
      intensity={0.2}
      noise={0.35}
      speed={reduced ? 0 : 0.06}
      minPixelRatio={1}
      maxPixelCount={MAX_PIXELS}
    />
  )
}

/**
 * The CSS-only grain overlay (`feTurbulence` data URI, zero JS, zero network).
 * The `.grain` class lives in `app/globals.css`; this is just the wrapper so
 * callers do not have to remember the class name.
 */
export function Grain({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return <div className={cn("grain", className)}>{children}</div>
}
