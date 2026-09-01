import { ACCENT } from "./types"

/**
 * The zero-cost stand-in that paints while three.js is still being fetched,
 * and the permanent fallback when WebGL2 is unavailable — §5.1 "Fallbacks".
 * Two radial gradients, exactly the poster from `docs/v3-design/hero-shards.js`.
 */
export function Poster({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      data-testid="hero-poster"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(60% 50% at 70% 30%, ${ACCENT}22, transparent 60%), radial-gradient(40% 40% at 20% 70%, #3a4a8a33, transparent 70%)`,
      }}
    />
  )
}
