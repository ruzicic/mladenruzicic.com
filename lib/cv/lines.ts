/**
 * The CV's running text as the browser has laid it out: for each paragraph
 * and bullet, its lines as rendered. Run in the page (`page.evaluate`), so
 * it is self-contained: no imports, no closures.
 *
 * The screen page is the A4 sheet enlarged (owner, 17 Nov 2026), so these
 * lines at 1440 wide must equal the print rendering's, and the PDF's
 * (`tests/cv.spec.ts`, `scripts/cv-pdf.ts`).
 */
export function cvRenderedLines(): string[][] {
  const root = document.querySelector("[data-cv]")
  if (!root) return []
  const blocks = root.querySelectorAll(
    ".cv-contact, .cv-summary p, .cv-line, .cv-text, .cv-list li, .cv-skills p"
  )
  return [...blocks].map((el) => {
    const lines: { top: number; text: string }[] = []
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let node: Node | null
    while ((node = walker.nextNode())) {
      const text = node.textContent ?? ""
      for (let i = 0; i < text.length; i++) {
        const range = document.createRange()
        range.setStart(node, i)
        range.setEnd(node, i + 1)
        const rect = range.getClientRects()[0]
        // A collapsed space has no box; it joins the words around it.
        if (!rect || rect.width === 0) {
          if (lines.length) lines[lines.length - 1].text += " "
          continue
        }
        const last = lines[lines.length - 1]
        if (!last || Math.abs(rect.top - last.top) > rect.height / 2)
          lines.push({ top: rect.top, text: text[i] })
        else last.text += text[i]
      }
    }
    return lines.map((l) => l.text.replace(/\s+/g, " ").trim())
  })
}

/**
 * Every bullet's drawn disc (`.cv-list li::before`), as the distance from
 * its list's left edge and from the CV's left edge, in CSS px. A disc that
 * starts left of either is cut off (owner, 17 Nov 2026: "bullet points cut
 * off by 1-2px"). Run in the page; self-contained.
 */
export function cvBulletGaps(): { list: number; page: number }[] {
  const cv = document.querySelector("[data-cv]")
  if (!cv) return []
  const cvLeft = cv.getBoundingClientRect().left
  return [...cv.querySelectorAll(".cv-list > li")].map((li) => {
    const list = li.parentElement!.getBoundingClientRect()
    const box = li.getBoundingClientRect()
    const item = getComputedStyle(li)
    const disc = getComputedStyle(li, "::before")
    const left =
      box.left +
      parseFloat(item.borderLeftWidth) +
      parseFloat(item.paddingLeft) +
      parseFloat(disc.left) +
      parseFloat(disc.marginLeft)
    return { list: left - list.left, page: left - cvLeft }
  })
}
