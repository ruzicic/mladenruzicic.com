import Image from "next/image"

import { getHome, getMedia, getTestimonial } from "@/lib/content"

import { Container } from "../primitives/Container"
import { Icon } from "../primitives/Icon"
import { TransitionLink } from "../primitives/TransitionLink"

/**
 * Mentoring on the landing (`Landing.dc.html`, the section after "How I
 * work"): the line about MentorCruise, one mentee's words in Geist Serif with
 * her portrait and name, and the way through to `/mentoring`.
 */
export function MentoringBlock() {
  const { mentoring } = getHome()
  const quote = getTestimonial(mentoring.testimonial)
  const avatar = quote?.avatar ? getMedia(quote.avatar) : undefined

  return (
    <section
      id="mentoring"
      aria-labelledby="mentoring-title"
      className="mt-(--section-gap)"
    >
      <Container className="flex flex-col">
        <h2
          id="mentoring-title"
          className="m-0 text-(length:--text-page) leading-[1.45] font-medium text-ink"
        >
          {mentoring.title}
        </h2>
        <p className="m-0 mt-3 text-(length:--text-page) leading-[1.45] text-pretty text-ink-soft min-[721px]:mt-4">
          {mentoring.body}
        </p>

        {quote ? (
          <figure className="m-0 mt-7 flex flex-col gap-4 min-[721px]:mt-8 min-[721px]:gap-5">
            <blockquote className="m-0 p-0 font-display text-(length:--fs-22) leading-[1.3] text-pretty text-ink min-[721px]:text-quote">
              <p className="m-0">&ldquo;{quote.quote}&rdquo;</p>
            </blockquote>
            <figcaption className="flex items-center gap-3">
              {quote.avatar ? (
                <Image
                  src={quote.avatar}
                  alt=""
                  width={40}
                  height={40}
                  sizes="40px"
                  placeholder={avatar?.blurDataURL ? "blur" : "empty"}
                  blurDataURL={avatar?.blurDataURL}
                  className="size-10 flex-none rounded-full bg-tile object-cover"
                />
              ) : null}
              <span className="flex flex-col text-(length:--fs-15) leading-[1.3] min-[721px]:text-ui min-[721px]:leading-[1.3]">
                <span className="text-ink">{quote.author}</span>
                <span className="text-muted">{mentoring.role}</span>
              </span>
            </figcaption>
          </figure>
        ) : null}

        <TransitionLink
          href={mentoring.link.href}
          className="group/ml mt-5 inline-flex min-h-11 items-center gap-1.5 self-start text-ui text-ink underline decoration-underline decoration-1 underline-offset-4 transition-[text-decoration-color] duration-(--duration-fast) hover:decoration-current min-[721px]:mt-7"
        >
          {mentoring.link.label}
          <Icon name="arrow-right" />
        </TransitionLink>
      </Container>
    </section>
  )
}
