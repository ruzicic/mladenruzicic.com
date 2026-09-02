import type { Metadata } from "next"

import { Button, Container, Display, Eyebrow } from "./components/primitives"
import { GrainSurface } from "./components/shaders"

/**
 * Every 404 goes through here — unmatched URLs and the `/work/<unknown>`
 * rewrite the proxy points at `/404` (deliberately not a route, so Next's own
 * not-found handling answers and this metadata resolves).
 *
 * Without it the response has no `<title>` at all: the visitor sees the raw URL
 * in the tab and in their history, and a shared dead link previews as a URL
 * string. `canonical: null` clears the root layout's
 * `alternates.canonical: "/"` — a dead URL must not claim to be the homepage.
 * `robots` has to be restated: Next emits its own
 * `<meta name="robots" content="noindex">` on a not-found render, but the root
 * layout's `index, follow` is emitted too, and leaving the two contradicting
 * each other is not something to rely on a crawler resolving.
 */
export const metadata: Metadata = {
  title: "Not found",
  description: "That page does not exist.",
  alternates: { canonical: null },
  robots: { index: false, follow: true },
}

/**
 * 404 — docs/v3-redesign-plan.md §5.2 (`GrainSurface`, very slow).
 *
 * No `PageTransition` wrapper: `not-found` renders inside whichever route
 * missed, and pairing it with a page transition would double-animate.
 */
export default function NotFound() {
  return (
    <div className="relative isolate overflow-hidden">
      <GrainSurface />
      <div aria-hidden className="scrim-header" />
      <Container className="relative z-[2] flex min-h-[60dvh] flex-col justify-center py-[96px] md:py-[128px]">
        <Eyebrow items={["404", "Not found"]} />

        <p
          aria-hidden
          className="m-0 mt-6 font-display text-[clamp(96px,22vw,260px)] leading-[0.85] tracking-[-0.04em] text-fg"
        >
          404
        </p>

        <Display as="h1" size="sub" className="mt-8 max-w-[18ch]">
          {"That page does not {exist}."}
        </Display>

        <p className="mt-6 mb-0 max-w-[46ch] text-[18px] leading-[1.5] text-dim">
          It may have moved, or it may never have existed. The work index is a
          good place to start.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button href="/">Home</Button>
          <Button href="/work" variant="outline">
            All work
          </Button>
        </div>
      </Container>
    </div>
  )
}
