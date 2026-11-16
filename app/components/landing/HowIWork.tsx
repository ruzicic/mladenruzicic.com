import { getHome } from "@/lib/content"

import { Container } from "../primitives/Container"

/**
 * "How I work" (`Landing.dc.html` `#how-i-work`): the owner's four steps,
 * numbered, with no rules between them (owner, 13 Nov). Two columns of steps on the 540px column
 * (`auto-fit, minmax(220px, 1fr)`), one column on phones. Nothing under them:
 * he removed the paragraph that used to follow.
 */
export function HowIWork() {
  const { howIWork } = getHome()
  const titleId = `${howIWork.id}-title`

  return (
    <section
      id={howIWork.id}
      aria-labelledby={titleId}
      className="mt-(--section-gap)"
    >
      <Container>
        <h2
          id={titleId}
          className="m-0 text-(length:--text-page) leading-[1.45] font-medium text-ink"
        >
          {howIWork.title}
        </h2>
        <ol className="m-0 mt-4 grid list-none grid-cols-1 gap-7 p-0 min-[721px]:mt-5 min-[721px]:grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] min-[721px]:gap-x-8 min-[721px]:gap-y-8">
          {howIWork.steps.map((step) => (
            <li key={step.n} className="flex flex-col gap-1">
              <span
                aria-hidden="true"
                className="font-mono text-meta leading-[calc(18px*var(--type-scale))] tracking-[0.02em] text-muted tabular-nums"
              >
                {step.n}
              </span>
              <span className="text-(length:--text-page) leading-[1.45] text-ink">
                {step.title}
              </span>
              <span className="text-(length:--fs-15) leading-[1.45] text-pretty text-muted min-[721px]:text-ui">
                {step.body}
              </span>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
