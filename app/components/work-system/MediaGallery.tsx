"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"

import type { WorkEntry } from "@/lib/content/schema"
import { cn } from "@/lib/utils"

import { Dialog } from "../primitives/Dialog"

type Media = NonNullable<WorkEntry["media"]>[number] & { blurDataURL?: string }

export interface MediaGalleryProps {
  media: WorkEntry["media"]
  /** Used for the lightbox accessible name. */
  title: string
  className?: string
}

const THUMB_SIZES = "(min-width: 1080px) 30vw, (min-width: 720px) 45vw, 92vw"

/**
 * Screenshot grid with a lightbox built on the `Dialog` primitive (§5.6).
 *
 * `media` is empty for every entry today, so this renders nothing — by design.
 * The moment screenshots land it lights up with no other change. `limited` and
 * `high` entries simply never get `media` in the first place, which is why there
 * is no confidentiality check here.
 */
export function MediaGallery({ media, title, className }: MediaGalleryProps) {
  const items = (media ?? []) as Media[]
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const open = openIndex !== null
  const active = open ? items[openIndex] : undefined

  const close = useCallback(() => setOpenIndex(null), [])

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) =>
        current === null
          ? current
          : (current + delta + items.length) % items.length
      )
    },
    [items.length]
  )

  useEffect(() => {
    if (!open || items.length < 2) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") step(1)
      if (event.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, items.length, step])

  if (items.length === 0) return null

  return (
    <div className={className}>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <li key={item.src}>
            <figure className="m-0">
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                className={cn(
                  "block w-full overflow-hidden rounded-sm border border-line bg-surface p-0",
                  "transition-colors duration-fast ease-pill hover:border-accent"
                )}
              >
                <span className="sr-only">Open {item.alt} full size</span>
                {item.kind === "video" ? (
                  <video
                    src={item.src}
                    width={item.width}
                    height={item.height}
                    muted
                    playsInline
                    loop
                    autoPlay
                    aria-label={item.alt}
                    className="block h-auto w-full"
                  />
                ) : (
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    sizes={THUMB_SIZES}
                    placeholder={item.blurDataURL ? "blur" : "empty"}
                    blurDataURL={item.blurDataURL}
                    className="block h-auto w-full"
                  />
                )}
              </button>
              {item.caption ? (
                <figcaption className="mt-2 font-mono text-[11px] leading-[1.5] tracking-[0.04em] text-muted">
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          </li>
        ))}
      </ul>

      <Dialog
        open={open}
        onClose={close}
        title={`${title} — media`}
        className="w-[min(96vw,1400px)] bg-bg"
        bodyClassName="p-4"
      >
        {active ? (
          <figure className="m-0">
            {active.kind === "video" ? (
              <video
                src={active.src}
                controls
                muted
                playsInline
                loop
                aria-label={active.alt}
                className="mx-auto block h-auto max-h-[70dvh] w-auto max-w-full"
              />
            ) : (
              <Image
                src={active.src}
                alt={active.alt}
                width={active.width}
                height={active.height}
                sizes="96vw"
                className="mx-auto block h-auto max-h-[70dvh] w-auto max-w-full object-contain"
              />
            )}
            <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
              <span className="normal-case tracking-normal">
                {active.caption ?? active.alt}
              </span>
              {items.length > 1 ? (
                <span className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    className="rounded-pill border border-line px-3 py-2 hover:border-accent hover:text-accent"
                  >
                    ← Prev
                  </button>
                  <span className="tabular-nums">
                    {(openIndex ?? 0) + 1} / {items.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    className="rounded-pill border border-line px-3 py-2 hover:border-accent hover:text-accent"
                  >
                    Next →
                  </button>
                </span>
              ) : null}
            </figcaption>
          </figure>
        ) : null}
      </Dialog>
    </div>
  )
}
