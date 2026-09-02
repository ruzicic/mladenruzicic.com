"use client"

import {
  startTransition,
  useEffect,
  useState,
  ViewTransition,
  type ReactNode,
} from "react"

import { Eyebrow } from "../primitives/Eyebrow"
import {
  isFilterId,
  matchesFilter,
  type FilterId,
  type GroupId,
} from "./taxonomy"
import { WorkFilters } from "./WorkFilters"

export interface ExplorerItem {
  slug: string
  /** Filter ids this entry belongs to. Derived on the server. */
  topics: FilterId[]
  /** The server-rendered `<WorkCard>`. Passed through as an RSC payload. */
  card: ReactNode
}

export interface ExplorerGroup {
  id: GroupId
  label: string
  blurb: string
  items: ExplorerItem[]
}

export interface WorkExplorerProps {
  groups: ExplorerGroup[]
  counts: Record<FilterId, number>
}

/**
 * The client island on `/work` — docs/v3-redesign-plan.md §5.3.
 *
 * The cards themselves stay Server Components: they arrive as `card` nodes and
 * are only re-parented here, so filtering ships no case-study data to the
 * browser beyond the slug and its topics.
 *
 * Filtering runs inside `startTransition`, and every card sits in a
 * `<ViewTransition>`, so React drives a real view transition: leaving cards fade
 * out, arriving cards fade up, and surviving cards slide to their new position.
 * URL state goes through `history.replaceState` (the documented Next escape
 * hatch) rather than `router.replace`, so a filter click never round-trips to
 * the server and never stacks history entries; `?filter=` is still read on load
 * and is still shareable.
 *
 * The initial filter is deliberately *not* read with `useSearchParams`: under
 * Cache Components that hook makes this subtree dynamic, so the static shell
 * emits only the Suspense fallback and all twenty server-rendered cards end up
 * in the flight payload instead of the HTML document — the index then ships zero
 * card markup to a crawler or a reader without JS. `?filter=` is read once from
 * `window.location` after mount instead: the document carries the unfiltered
 * list, and a deep link narrows it a frame later.
 */
export function WorkExplorer({ groups, counts }: WorkExplorerProps) {
  const [filter, setFilter] = useState<FilterId>("all")

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("filter")
    if (isFilterId(fromUrl) && fromUrl !== "all") setFilter(fromUrl)
  }, [])

  function select(next: FilterId) {
    if (next === filter) return
    startTransition(() => {
      setFilter(next)
      const url = new URL(window.location.href)
      if (next === "all") url.searchParams.delete("filter")
      else url.searchParams.set("filter", next)
      window.history.replaceState(null, "", url)
    })
  }

  const visible = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => matchesFilter(item.topics, filter)),
    }))
    .filter((group) => group.items.length > 0)

  const total = visible.reduce((sum, group) => sum + group.items.length, 0)

  return (
    <>
      <WorkFilters value={filter} onChange={select} counts={counts} />

      <p aria-live="polite" className="sr-only">
        {total} {total === 1 ? "entry" : "entries"} shown.
      </p>

      <ViewTransition default="none">
        <div className="mt-14 grid gap-[88px]">
          {visible.map((group) => (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-line pt-5">
                <Eyebrow as="h2" id={`group-${group.id}`} className="text-fg">
                  {group.label}
                </Eyebrow>
                <Eyebrow className="hidden justify-end text-right sm:flex">
                  {group.blurb}
                </Eyebrow>
              </div>

              <ul className="mt-10 grid list-none grid-cols-1 gap-x-10 gap-y-16 p-0 md:grid-cols-2">
                {group.items.map((item) => (
                  <ViewTransition key={item.slug} default="vt-card">
                    <li>{item.card}</li>
                  </ViewTransition>
                ))}
              </ul>
            </section>
          ))}

          {total === 0 ? (
            <p className="m-0 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">
              Nothing under this filter yet.
            </p>
          ) : null}
        </div>
      </ViewTransition>
    </>
  )
}
