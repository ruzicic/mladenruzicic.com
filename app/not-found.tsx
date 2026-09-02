import { Button, Container, Display, Eyebrow } from "./components/primitives"
import { GrainSurface } from "./components/shaders"


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
