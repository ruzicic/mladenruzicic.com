import Image from "next/image"

import type { Testimonial } from "@/lib/content/schema"
import { cn } from "@/lib/utils"

const SOURCE_LABELS: Record<Testimonial["source"], string> = {
  mentorcruise: "MentorCruise",
  linkedin: "LinkedIn",
  direct: "Direct",
}

export interface TestimonialGridProps {
  testimonials: Testimonial[]
  className?: string
}

/**
 * Masonry-ish grid: CSS multi-column, so cards keep their natural height and
 * reading order stays the DOM order (which `grid-auto-flow: dense` would break).
 * `break-inside: avoid` in `app/styles/pages.css` keeps a quote whole.
 *
 * Every quote is `permission: 'public'` by schema, so there is nothing to gate.
 */
export function TestimonialGrid({
  testimonials,
  className,
}: TestimonialGridProps) {
  return (
    <ul className={cn("testimonial-columns m-0 list-none p-0", className)}>
      {testimonials.map((testimonial) => (
        <li key={testimonial.id}>
          <figure className="m-0 rounded-sm border border-line bg-surface p-6">
            <blockquote className="m-0 text-[16px] leading-[1.6] text-dim">
              {testimonial.quote}
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              {testimonial.avatar ? (
                <Image
                  src={testimonial.avatar}
                  alt=""
                  width={36}
                  height={36}
                  sizes="36px"
                  className="h-9 w-9 shrink-0 rounded-pill object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-pill border border-line font-mono text-[12px] text-muted"
                >
                  {testimonial.author.charAt(0)}
                </span>
              )}
              <span className="min-w-0">
                <cite className="block not-italic text-[14px] leading-tight text-fg">
                  {testimonial.author}
                </cite>
                <span className="mt-1 block font-mono text-[10px] uppercase leading-none tracking-[0.08em] text-muted">
                  {testimonial.sourceUrl ? (
                    <a
                      href={testimonial.sourceUrl}
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      via {SOURCE_LABELS[testimonial.source]} ↗
                    </a>
                  ) : (
                    <>via {SOURCE_LABELS[testimonial.source]}</>
                  )}
                </span>
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  )
}
