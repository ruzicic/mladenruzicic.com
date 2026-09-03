import Image from "next/image"

import { getHome, getSite, getTestimonials } from "@/lib/content"
import { cn } from "@/lib/utils"

import { Container } from "../primitives/Container"
import { Display } from "../primitives/Display"
import { Eyebrow } from "../primitives/Eyebrow"
import { NavPending } from "../primitives/NavPending"
import { TransitionLink } from "../primitives/TransitionLink"
import { initialsOf } from "../timeline/span"

/**
 * "On the side" — the sticky column plus the six featured testimonials as
 * alternating chat bubbles, exactly as in the design.
 *
 * The bubble on the left carries its 4px corner at the bottom-left and the one
 * on the right at the bottom-right, so each radius points at its own speaker.
 */
export function MentoringSection() {
  const home = getHome()
  const site = getSite()
  const testimonials = getTestimonials({ featured: true })

  return (
    <section
      id="mentoring"
      data-section="Mentoring"
      data-testid="mentoring"
      aria-labelledby="mentoring-heading"
      // scroll-mt: clears the 70px fixed header when #mentoring is followed.
      className="relative scroll-mt-[80px] border-t border-line-soft py-24"
    >
      <Container>
        <div className="mr-mentoring-grid">
          <div className="grid gap-5 md:sticky md:top-[120px]">
            <Eyebrow>{home.mentoring.eyebrow}</Eyebrow>
            <Display
              as="h2"
              id="mentoring-heading"
              className="text-[clamp(36px,4vw,64px)] leading-none tracking-[-0.02em]"
            >
              {home.mentoring.h2}
            </Display>
            <p className="m-0 max-w-[40ch] text-[17px] leading-[1.55] text-dim-2">
              {home.mentoring.lede}
            </p>
            <div className="flex flex-wrap gap-6 font-mono text-[12px] uppercase tracking-[0.08em]">
              <TransitionLink
                href="/mentoring"
                data-hover
                className="text-accent"
              >
                Mentoring →
                <NavPending />
              </TransitionLink>
              <a
                href={site.links.mentorcruise}
                target="_blank"
                rel="noreferrer noopener"
                data-hover
                className="text-muted"
              >
                mentors.to ↗
              </a>
            </div>
          </div>

          <div className="grid gap-7">
            <ol role="list" className="m-0 grid list-none gap-[22px] p-0">
              {testimonials.map((testimonial, index) => {
                const mirrored = index % 2 === 1
                return (
                  <li
                    key={testimonial.id}
                    className={cn(
                      "flex items-end gap-3",
                      mirrored && "flex-row-reverse"
                    )}
                  >
                    {testimonial.avatar ? (
                      <Image
                        src={testimonial.avatar}
                        alt=""
                        width={36}
                        height={36}
                        sizes="36px"
                        className="h-9 w-9 flex-none rounded-full border border-line object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="grid h-9 w-9 flex-none place-items-center rounded-full border border-line bg-surface-2 text-[11px] font-semibold text-dim"
                      >
                        {initialsOf(testimonial.author)}
                      </span>
                    )}

                    <div className="grid max-w-[520px] gap-[6px]">
                      <blockquote
                        className={cn(
                          "m-0 px-5 py-4 text-[16.5px] leading-[1.5]",
                          mirrored
                            ? "rounded-[16px_16px_4px_16px] bg-accent text-bg"
                            : "rounded-[16px_16px_16px_4px] bg-surface-2 text-fg"
                        )}
                      >
                        {testimonial.quote}
                      </blockquote>
                      <cite
                        className={cn(
                          "font-mono text-[10px] uppercase not-italic tracking-[0.08em] text-muted",
                          mirrored ? "text-right" : "text-left"
                        )}
                      >
                        {testimonial.author} · mentors.to
                      </cite>
                    </div>
                  </li>
                )
              })}
            </ol>

            {home.mentoring.proof ? (
              <p
                data-testid="mentoring-proof"
                className="m-0 font-mono text-[11px] uppercase leading-none tracking-[0.08em] text-muted"
              >
                <a
                  href={home.mentoring.proof.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-hover
                  className="text-fg"
                >
                  {`${home.mentoring.proof.label}\u00A0`}
                  <span aria-hidden>↗</span>
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  )
}
