/**
 * Pause the landing's cycling headline while an overlay from the shell is
 * open (the board's `wBlocked`: the Ask panel and the press menu hold it).
 * The store is imported only on pages that have the headline, and only when
 * an overlay opens, so other pages pay nothing.
 */
const held = new Set<string>()

export function holdHeadline(key: "ask" | "menu", on: boolean) {
  if (on) {
    if (!document.getElementById("headline")) return
    held.add(key)
  } else if (!held.delete(key)) return
  void import("../landing/headline-store")
    .then((m) => m.holdHeadline(key, on))
    .catch(() => {})
}
