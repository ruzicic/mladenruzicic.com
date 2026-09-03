import { Hero } from "./components/hero"
import { MentoringSection } from "./components/mentoring/MentoringSection"
import { PageTransition } from "./components/primitives/PageTransition"
import { Timeline } from "./components/timeline"
import { WorkRows } from "./components/work/WorkRows"

/**
 * Homepage. `<main id="main">` lives in `app/layout.tsx`, so every page body is
 * just its sections; `PageTransition` wraps the body of the page (never the
 * layout) as required by docs/v3-redesign-plan.md §5.3.
 *
 * Section order is the design's: Hero → Selected work → Work history →
 * Mentoring. Each component owns its own `<section>` so it can carry the
 * `id`, `data-section` (read by the mobile pill's IntersectionObserver) and
 * `data-testid` the tests use.
 */
export default function HomePage() {
  return (
    <PageTransition>
      <Hero />
      <WorkRows />
      <Timeline />
      <MentoringSection />
    </PageTransition>
  )
}
