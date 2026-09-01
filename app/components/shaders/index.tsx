"use client"

import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

/**
 * STUB — replaced at merge by the hero/shader agent's Paper Shaders
 * implementation (docs/v3-redesign-plan.md §5.2). The API here is the contract:
 * keep the prop names and the "absolutely positioned, `aria-hidden`, decorative"
 * behaviour identical so pages do not change when the real shaders land.
 *
 * Everything below is CSS gradients only — no WebGL, no JS animation loop, no
 * dependency. That means it is also the graceful fallback when `webgl2` is
 * unavailable, so the visual language survives either way.
 */

function mix(accent: string, pct: number) {
  return `color-mix(in oklab, ${accent} ${pct}%, var(--color-bg))`
}

const BASE = "pointer-events-none absolute inset-0 -z-10"

export interface AccentGradientProps {
  /** Project accent, a 6-digit hex from the work frontmatter. */
  accent: string
  className?: string
  /** Animation speed. `0` (or reduced motion) freezes it. Stub honours 0 only. */
  speed?: number
}

/**
 * The one animated surface allowed per screen. Used as the full-bleed
 * `/work/[slug]` header background.
 */
export function AccentGradient({
  accent,
  className,
  speed = 0.2,
}: AccentGradientProps) {
  const style: CSSProperties = {
    background: [
      `radial-gradient(120% 90% at 12% 0%, ${mix(accent, 34)} 0%, transparent 62%)`,
      `radial-gradient(90% 80% at 88% 18%, ${mix(accent, 16)} 0%, transparent 70%)`,
      `radial-gradient(140% 120% at 50% 120%, ${mix(accent, 8)} 0%, transparent 60%)`,
      "var(--color-bg)",
    ].join(","),
    animationDuration: speed > 0 ? `${Math.round(24 / speed)}s` : undefined,
  }

  return (
    <div
      aria-hidden
      data-shader="accent-gradient"
      className={cn(BASE, speed > 0 && "shader-drift", className)}
      style={style}
    />
  )
}

export interface StaticAccentGradientProps {
  accent: string
  className?: string
}

/** Static, cheap. One per `/work` card art tile. Never animated. */
export function StaticAccentGradient({
  accent,
  className,
}: StaticAccentGradientProps) {
  return (
    <div
      aria-hidden
      data-shader="static-accent-gradient"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        background: [
          `radial-gradient(110% 100% at 22% 8%, ${mix(accent, 40)} 0%, transparent 64%)`,
          `radial-gradient(80% 90% at 92% 96%, ${mix(accent, 14)} 0%, transparent 68%)`,
          `repeating-linear-gradient(135deg, rgba(242,240,234,.05) 0 14px, transparent 14px 28px)`,
          "var(--color-surface)",
        ].join(","),
      }}
    />
  )
}

export interface GrainSurfaceProps {
  /** Optional tint. Defaults to the site accent. */
  accent?: string
  className?: string
}

/** Slow grain field. `/mentoring` and `/404` headers. */
export function GrainSurface({ accent, className }: GrainSurfaceProps) {
  const tint = accent ?? "var(--color-accent)"
  return (
    <div
      aria-hidden
      data-shader="grain-surface"
      className={cn(BASE, "grain", className)}
      style={{
        position: "absolute",
        background: [
          `radial-gradient(90% 70% at 8% 0%, ${mix(tint, 18)} 0%, transparent 66%)`,
          `radial-gradient(70% 70% at 96% 10%, ${mix(tint, 9)} 0%, transparent 70%)`,
          "var(--color-bg)",
        ].join(","),
      }}
    />
  )
}

/** The grain overlay itself — `.grain` from `app/globals.css`, as an overlay. */
export function Grain({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("grain", className)}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    />
  )
}
