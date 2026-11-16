"use client"

import { useEffect, useRef, type ReactNode } from "react"

/** False until the first page of this document has mounted. */
let navigated = false

/**
 * `<main id="main" tabIndex={-1}>`, plus focus management for client
 * navigations. Next's App Router announces the new page (its route
 * announcer reads the title) but leaves focus where it was (Next 16.4: "the
 * new handler leaves focus unchanged"). The link that was clicked is gone,
 * so the browser's sequential-focus start stays at a node that no longer
 * exists, and in Chrome the next Tab leaves the document.
 *
 * So when a page mounts after a client navigation (not on the first load,
 * where the browser's own start is already right), focus starts over at the
 * top of the document, as it does after a full page load: the next Tab
 * reaches the skip link, which offers `#main`. `preventScroll` leaves
 * scrolling to the router.
 *
 * A page kept alive by route retention (`<Activity>`) re-runs this effect
 * when it is shown again, so Back is covered too.
 */
export function PageMain({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!navigated) {
      navigated = true
      return
    }
    const main = ref.current
    if (!main) return
    // Something on the new page already took focus on purpose: keep it.
    if (main.contains(document.activeElement)) return
    if (document.querySelector("dialog[open]")) return
    // `<body>` is not focusable; a temporary `tabindex` lets it take focus
    // (and the sequential-focus start) without painting anything.
    const body = document.body
    const had = body.getAttribute("tabindex")
    body.setAttribute("tabindex", "-1")
    body.focus({ preventScroll: true })
    if (had == null) body.removeAttribute("tabindex")
    else body.setAttribute("tabindex", had)
  }, [])

  return (
    <main ref={ref} id="main" tabIndex={-1} data-page-main="">
      {children}
    </main>
  )
}
