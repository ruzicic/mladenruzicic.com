import Image from "next/image"

import { getPeopleForCompany } from "@/lib/content"
import type { WorkEntry } from "@/lib/content/schema"

import { Eyebrow } from "../primitives"
import { hueFromId, initialsOf } from "../timeline/span"

export interface WorkedAlongsideProps {
  entry: WorkEntry
}

/**
 * "Worked alongside" on a case study — the same block the expanded timeline
 * band renders, with room to breathe.
 *
 * People belong to a chapter, so they belong on that chapter's page: the rail's
 * band and this section read from the same `Company.people`, resolved through
 * the entry's own `company` field. A server component, and deliberately not a
 * popover — the page has the width for `note` inline, which is the sentence
 * worth reading.
 *
 * Renders nothing when the entry has no company, or when that company has no
 * people yet (ZF SCALAR, Shopify and Nemestic today).
 */
export function WorkedAlongside({ entry }: WorkedAlongsideProps) {
  const people = getPeopleForCompany(entry.company)
  if (people.length === 0) return null

  return (
    <section aria-labelledby="worked-alongside">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-line pt-5">
        <Eyebrow as="h2" id="worked-alongside" className="text-fg">
          Worked alongside
        </Eyebrow>
        <Eyebrow className="justify-end text-right">
          Same years, same rooms
        </Eyebrow>
      </div>

      {/* role="list": Safari/VoiceOver drops list semantics on
          `list-style: none`. */}
      <ul
        role="list"
        className="mt-10 grid list-none grid-cols-1 gap-10 p-0 sm:grid-cols-2"
      >
        {people.map((person) => {
          const hue = hueFromId(person.id)
          return (
            <li key={person.id} className="flex items-start gap-4">
              {/* `alt=""` and `aria-hidden` on the initials: the name is the
                  next thing in the reading order, so the portrait has nothing
                  of its own to say. */}
              <span
                aria-hidden
                className="grid h-12 w-12 flex-none place-items-center overflow-hidden rounded-full text-[13px] font-semibold"
                style={{ background: `hsl(${hue} 35% 32%)` }}
              >
                {person.avatar ? (
                  <Image
                    src={person.avatar}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initialsOf(person.name)
                )}
              </span>

              <div className="grid min-w-0 gap-2">
                <p className="m-0 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <strong className="font-display text-[22px] font-normal leading-none tracking-[-0.02em]">
                    {person.name}
                  </strong>
                  {person.linkedin ? (
                    <a
                      href={person.linkedin}
                      target="_blank"
                      rel="noreferrer noopener"
                      data-hover
                      className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent"
                    >
                      LinkedIn ↗
                    </a>
                  ) : null}
                </p>
                <p className="m-0 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  {person.where}
                </p>
                <p className="m-0 text-[15px] leading-[1.5] text-dim">
                  {person.why}
                </p>
                {person.note ? (
                  <p className="m-0 font-serif-italic text-[17px] italic leading-[1.35] text-muted">
                    {person.note}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
