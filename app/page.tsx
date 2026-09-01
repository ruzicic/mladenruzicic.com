import {
  getCompanies,
  getFeaturedWork,
  getHeroLogos,
  getHome,
  getPeople,
  getTestimonials,
} from "@/lib/content"

import {
  Chip,
  Container,
  Display,
  Eyebrow,
  PageTransition,
  Section,
  SectionHeader,
  SharedElement,
  TransitionLink,
  workArtTransitionName,
} from "./components/primitives"

/**
 * SKELETON. Real data, primitives, no visual design yet.
 * Owned by the site-shell agent (hero canvas lives in app/components/hero/**).
 */
export default function HomePage() {
  const home = getHome()
  const featured = getFeaturedWork()
  const companies = getCompanies()
  const heroLogos = getHeroLogos()
  const people = getPeople()
  const testimonials = getTestimonials({ featured: true })

  return (
    <PageTransition>
      <main id="main">
        <Section id="top" label="Intro">
          <Eyebrow items={[...home.hero.eyebrow]} />
          <Display as="h1" size="hero" className="mt-7">
            {home.hero.h1}
          </Display>
          <p className="mt-7 max-w-[48ch] text-[20px] leading-[1.45] text-dim">
            {home.hero.lede}
          </p>
          <ul className="mt-7 flex list-none flex-wrap gap-2 p-0">
            {heroLogos.map((logo) => (
              <li key={logo.id}>
                <Chip variant="brand" mark={logo.mark}>
                  {logo.label}
                </Chip>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="work" label="Selected work" divider>
          <SectionHeader
            title={home.work.eyebrow}
            meta={`${featured.length} ${home.work.countLabel}`}
          />
          <div className="grid gap-20">
            {featured.map((work) => (
              <article key={work.slug}>
                <SharedElement name={workArtTransitionName(work.slug)}>
                  <div
                    className="aspect-[16/10] w-full rounded-sm bg-surface"
                    style={{ outline: `1px solid ${work.accent}33` }}
                  />
                </SharedElement>
                <Eyebrow
                  className="mt-5"
                  items={[
                    <span key="p" className="text-accent">
                      {work.period.from}–{work.period.to}
                    </span>,
                    work.status,
                    work.role,
                  ]}
                />
                <Display as="h3" className="mt-4">
                  {work.title}
                </Display>
                <p className="mt-4 max-w-[36ch] text-[22px] leading-[1.4]">
                  {work.line}
                </p>
                <p className="mt-3 max-w-[48ch] text-[17px] leading-[1.55] text-dim-2">
                  {work.detail}
                </p>
                <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
                  {work.tech.map((tech) => (
                    <li key={tech}>
                      <Chip>{tech}</Chip>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  <TransitionLink
                    href={`/work/${work.slug}`}
                    className="font-mono text-[12px] uppercase tracking-[0.08em] text-accent"
                  >
                    Case study →
                  </TransitionLink>
                </p>
              </article>
            ))}
          </div>
          <p className="mt-16 text-right">
            <TransitionLink
              href="/work"
              className="font-display text-[clamp(28px,3vw,44px)]"
            >
              {home.work.allWorkLabel}
            </TransitionLink>
          </p>
        </Section>

        <Section id="history" label="Work history" divider>
          <SectionHeader
            title={home.history.eyebrow}
            meta={home.history.rangeLabel}
          />
          <ol className="m-0 grid list-none gap-6 p-0">
            {companies.map((company) => (
              <li key={company.id} id={`band-${company.id}`}>
                <Eyebrow
                  items={[
                    company.yearsLabel,
                    ...(company.approx ? ["dates approximate"] : []),
                  ]}
                />
                <h3 className="mt-2 flex items-center gap-3 text-[18px] font-semibold">
                  <span
                    aria-hidden
                    className="inline-block h-[18px] w-[18px] rounded-xs"
                    style={{ background: company.color }}
                  />
                  {company.name}
                </h3>
                <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.06em] text-muted">
                  {company.role}
                </p>
                <p className="mt-2 max-w-[68ch] text-dim-2">
                  {company.summary}
                </p>
                {company.workSlug ? (
                  <p className="mt-2">
                    <TransitionLink
                      href={`/work/${company.workSlug}`}
                      className="font-mono text-[12px] uppercase tracking-[0.08em] text-accent"
                    >
                      Case study →
                    </TransitionLink>
                  </p>
                ) : null}
              </li>
            ))}
          </ol>

          {people.length > 0 ? (
            <div className="mt-12">
              <Eyebrow as="h3">{home.history.alongsideLabel}</Eyebrow>
              <ul className="mt-4 flex list-none flex-wrap gap-3 p-0">
                {people.map((person) => (
                  <li key={person.id}>
                    <Chip>{person.name}</Chip>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>

        <Section id="mentoring" label="Mentoring" divider>
          <SectionHeader title={home.mentoring.eyebrow} />
          <Container bleed className="grid gap-10 md:grid-cols-2">
            <div>
              <Display as="h2">{home.mentoring.h2}</Display>
              <p className="mt-5 max-w-[44ch] text-[18px] text-dim">
                {home.mentoring.lede}
              </p>
              <p className="mt-5">
                <TransitionLink
                  href="/mentoring"
                  className="font-mono text-[12px] uppercase tracking-[0.08em] text-accent"
                >
                  {home.mentoring.pageLink} →
                </TransitionLink>
              </p>
            </div>
            <ul className="m-0 grid list-none gap-4 p-0">
              {testimonials.map((testimonial) => (
                <li
                  key={testimonial.id}
                  className="rounded-sm border border-line bg-surface p-5"
                >
                  <p className="m-0 text-[17px] leading-[1.5]">
                    {testimonial.quote}
                  </p>
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                    {testimonial.author}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      </main>
    </PageTransition>
  )
}
