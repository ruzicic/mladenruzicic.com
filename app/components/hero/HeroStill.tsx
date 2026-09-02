import {
  createShards,
  DESKTOP_SHARD_COUNT,
  fogFactor,
  projectShards,
} from "./shards"
import { ACCENT } from "./types"
import type { HeroLogoShard } from "./types"

const VIEW_W = 1600
const VIEW_H = 1000

/**
 * The reduced-motion hero — §5.1 "Fallbacks".
 *
 * A frame-zero render of the *same* seeded layout the WebGL scene uses, drawn
 * as inline SVG: no three.js request, no canvas, no animation. Purely
 * decorative, so it is `aria-hidden`; every company here is also a real button
 * in the timeline.
 *
 * It really does render on the server: `app/components/hero/index.tsx` renders
 * it and hands it to `HeroCanvas` as a node, because `HeroCanvas` is a client
 * component and anything it constructed itself would only exist after
 * hydration. `app/styles/hero.css` hides it until the reduced-motion query
 * matches.
 */
export function HeroStill({
  logos,
  className,
}: {
  logos: HeroLogoShard[]
  className?: string
}) {
  const shards = createShards(DESKTOP_SHARD_COUNT, logos.length)
  const projected = projectShards(shards, VIEW_W, VIEW_H)

  return (
    <svg
      aria-hidden
      data-testid="hero-still"
      className={className}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <defs>
        <radialGradient id="hero-still-glow" cx="70%" cy="30%" r="60%">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.07" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-still-cool" cx="20%" cy="70%" r="55%">
          <stop offset="0%" stopColor="#5B6CFF" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#5B6CFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={VIEW_W} height={VIEW_H} fill="url(#hero-still-glow)" />
      <rect width={VIEW_W} height={VIEW_H} fill="url(#hero-still-cool)" />

      {projected.map(({ spec, points, cx, cy, size, distance }) => {
        const fog = fogFactor(distance)
        const logo = spec.logoIndex === null ? null : logos[spec.logoIndex]
        return (
          <g key={spec.index}>
            <polygon
              points={points}
              fill="#B9C6E8"
              fillOpacity={0.11 * fog}
              stroke={ACCENT}
              strokeOpacity={(spec.bright ? 0.9 : 0.35) * fog}
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
            {logo ? (
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#F2F0EA"
                fillOpacity={0.75 * fog}
                fontFamily="var(--font-mono), ui-monospace, monospace"
                fontSize={Math.max(11, size * 0.18)}
                letterSpacing="0.08em"
              >
                {logo.mark}
              </text>
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
