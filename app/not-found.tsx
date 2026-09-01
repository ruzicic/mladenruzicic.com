import { Button, Display, Eyebrow, Section } from "./components/primitives"

/** SKELETON. The shader background is the shell agent's job. */
export default function NotFound() {
  return (
    <main id="main">
      <Section label="Not found">
        <Eyebrow>404</Eyebrow>
        <Display as="h1" size="hero" className="mt-6">
          {"That page does not {exist}."}
        </Display>
        <p className="mt-6 max-w-[44ch] text-[20px] text-dim">
          It may have moved, or it may never have existed. The work index is a
          good place to start.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/">Home</Button>
          <Button href="/work" variant="outline">
            All work
          </Button>
        </div>
      </Section>
    </main>
  )
}
