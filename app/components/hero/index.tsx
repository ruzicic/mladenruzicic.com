import { getHome, getWorkBySlug } from "@/lib/content"

import { Container } from "../primitives/Container"
import { Display } from "../primitives/Display"
import { Eyebrow } from "../primitives/Eyebrow"

/**
 * STUB owned by the site-shell agent — replaced by the hero agent at merge
 * (three.js glass shards, poster crossfade, logo→band highlighting).
 *
 * It renders exactly what the real hero must keep as server HTML: the eyebrow,
 * the H1 (the LCP element), the lede and the scroll cue, over a CSS gradient
 * poster. Nothing here depends on JavaScript.
 */

/** `[[slug]]` tokens in the lede become the work item's title. */
function renderLede(lede: string) {
  return lede.split(/(\[\[[a-z0-9-]+\]\])/g).map((part, i) => {
    const match = /^\[\[([a-z0-9-]+)\]\]$/.exec(part)
    if (!match) return <span key={i}>{part}</span>
    const entry = getWorkBySlug(match[1])
    return (
      <strong key={i} className="font-normal text-fg">
        {entry?.title ?? match[1]}
      </strong>
    )
  })
}

export function Hero() {
  const { hero } = getHome()

  return (
    <section
      id="top"
      data-section="Intro"
      data-testid="hero"
      aria-labelledby="hero-heading"
      className="relative flex h-dvh min-h-[640px] items-end overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-bg"
        style={{
          background:
            "radial-gradient(60% 45% at 22% 18%, rgba(245,223,77,0.10), transparent 62%)," +
            "radial-gradient(70% 55% at 82% 28%, rgba(0,87,184,0.16), transparent 66%)," +
            "radial-gradient(80% 60% at 50% 100%, rgba(11,11,12,0.9), rgba(11,11,12,0) 70%)",
        }}
      />

      <Container className="relative z-2 grid gap-7 pb-14">
        <Eyebrow items={[...hero.eyebrow]} />
        <Display as="h1" size="hero" id="hero-heading">
          {hero.h1}
        </Display>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <p className="m-0 max-w-[48ch] text-[20px] leading-[1.45] text-dim">
            {renderLede(hero.lede)}
          </p>
          <p className="m-0 flex items-center gap-[10px] font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
            <span aria-hidden className="inline-block h-px w-8 bg-accent" />
            {hero.scrollCue}
          </p>
        </div>
      </Container>
    </section>
  )
}
