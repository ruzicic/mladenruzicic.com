import { getMedia, getMentoring, getTestimonialPile } from "@/lib/content"

import { TestimonialPile, type PileCard } from "./TestimonialPile"

/**
 * "What mentees said" (`Landing-Mentoring.dc.html`, `#mt-said`): the title
 * and line in the text column, then the pile in its wider 680px frame. The
 * data is resolved here, on the server, so the client island only receives
 * the cards it draws (all seventeen).
 */
export function MenteesSaid() {
  const { said } = getMentoring()
  const cards: PileCard[] = getTestimonialPile().map((t) => ({
    id: t.id,
    quote: t.quote,
    author: t.author,
    initials: initialsOf(t.author),
    avatar: t.avatar,
    blurDataURL: t.avatar ? getMedia(t.avatar)?.blurDataURL : undefined,
    meta: metaOf(t.duration, t.year, said.durationFormat),
    tone: t.tone,
    rot: t.rot,
    rest: t.rest,
  }))

  return (
    // Unnamed on purpose: the pile below is the named region ("carousel"),
    // so a screen reader does not list two landmarks with the same name.
    <section className="ment-said">
      <div className="ment-col">
        <h2 id="ment-said" className="ment-h2">
          {said.title}
        </h2>
        <p className="ment-said-body">{said.body}</p>
      </div>
      <TestimonialPile
        cards={cards}
        label={said.title}
        counterFormat={said.counterFormat}
        nextLabelFormat={said.nextLabelFormat}
        pauseLabel={said.pauseLabel}
        playLabel={said.playLabel}
      />
    </section>
  )
}

/** "Mentee for 2 years · 2024"; either half alone; nothing if both are missing. */
function metaOf(
  duration: string | undefined,
  year: number | undefined,
  format: string
) {
  const parts = [
    duration ? format.replace("{duration}", duration) : undefined,
    year ? String(year) : undefined,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : undefined
}

/** "Adam Gornas" → "AG", for the two mentees without a portrait. */
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase())
    .slice(0, 2)
    .join("")
}
