import { expect, test } from "@playwright/test"

import { cvFingerprint, pdfFingerprint } from "@/lib/cv/fingerprint"
import { cvBulletGaps, cvRenderedLines } from "@/lib/cv/lines"
import { CV } from "@/content/pages/cv"
import { SITE } from "@/content/site"

import { gotoReady } from "./helpers"

/**
 * `/cv` (owner, 17 Nov 2026): his CV as a page in the site's frame, with
 * "Download PDF", and `/cv.pdf` printed from it (`pnpm cv:pdf`). Reading
 * order is what a text extractor needs: every title before its date, in
 * one row; bullets as list items. The print rendering is the same page
 * with the site's chrome hidden. The committed PDF carries the hash of the
 * sources it was printed from (`lib/cv/fingerprint.ts`).
 */

test("one h1, the name; the four sections in order", async ({ page }) => {
  await gotoReady(page, "/cv")
  const main = page.getByRole("main")
  await expect(main.getByRole("heading", { level: 1 })).toHaveText(CV.name)
  await expect(main.getByRole("heading", { level: 2 })).toHaveText([
    CV.experience.title,
    CV.projects.title,
    CV.mentoring.title,
    CV.skills.title,
  ])
  await expect(main.getByRole("img", { name: CV.headshot.alt })).toBeVisible()
})

for (const width of [1440, 390])
  test(`at ${width}: under the name, his role, then where he lives, two lines, no dot`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await gotoReady(page, "/cv")
    const head = page.locator(".cv-headline")
    await expect(head.locator("span")).toHaveText([
      CV.headline.role,
      SITE.location.label,
    ])
    await expect(head).not.toContainText("·")
    const [role, place] = await head
      .locator("span")
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect()))
    expect(place.top).toBeGreaterThanOrEqual(role.bottom - 1)
    // On a wide page each is one line.
    if (width > 820) expect(role.height).toBeLessThan(place.height * 1.5)
    await expect(head.locator(".cv-headline__place")).toHaveCSS(
      "color",
      "rgb(105, 105, 100)"
    )
  })

test("the contact line is the site's: its email, domain and LinkedIn, no phone", async ({
  page,
}) => {
  await gotoReady(page, "/cv")
  const contact = page.locator(".cv-contact")
  await expect(contact).toHaveText(
    `${SITE.links.email} · ${SITE.domain} · linkedin.com/in/ruzicic`
  )
  await expect(contact.locator("a")).toHaveCount(3)
  await expect(contact.locator("a").nth(0)).toHaveAttribute(
    "href",
    `mailto:${SITE.links.email}`
  )
  await expect(contact.locator("a").nth(2)).toHaveAttribute(
    "href",
    SITE.links.linkedin
  )
  const text = await page.locator("[data-cv]").innerText()
  expect(text).not.toMatch(/\+\d|\b\d{3}[ .-]\d{3}[ .-]\d{2,4}\b|tel:/)
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0)
  expect(text).not.toContain("gmail")
})

/** Every dated row's title and date, in page order, from content. */
function datedRows(): [string, string][] {
  const entry = (i: (typeof CV.projects.items)[number]): [string, string] => [
    `${[i.name, i.role].filter(Boolean).join(" · ")} · ${i.domain}`,
    i.dates,
  ]
  return [
    ...CV.experience.jobs.flatMap((job): [string, string][] => [
      [job.role ? `${job.company} · ${job.role}` : job.company, job.dates],
      ...(job.roles ?? []).map((r): [string, string] => [r.title, r.dates]),
    ]),
    ...CV.projects.items.map(entry),
    ...CV.mentoring.items.map(entry),
  ]
}

test("every dated line is one row: title, then its date, the dates in one column", async ({
  page,
}) => {
  await gotoReady(page, "/cv")
  const rows = page.locator("[data-cv] .cv-row")
  const want = datedRows()
  await expect(rows).toHaveCount(want.length)
  const got = await rows.evaluateAll((els) =>
    els.map((el) => {
      const [title, date] = [...el.children]
      const t = title.getBoundingClientRect()
      const d = date.getBoundingClientRect()
      return {
        order: [...el.children].map((c) => c.tagName),
        title: title.textContent,
        date: date.textContent,
        mono: getComputedStyle(date).fontFamily,
        nowrap: getComputedStyle(date).whiteSpace,
        sameLine: Math.abs(t.bottom - d.bottom) < 6 && d.left > t.right,
        right: Math.round(d.right),
      }
    })
  )
  for (const [i, [title, date]] of want.entries()) {
    expect(got[i].order[1]).toBe("P")
    expect(got[i].order[0]).toMatch(/^H[34]$/)
    expect(got[i].title).toBe(title)
    expect(got[i].date).toBe(date)
    expect(got[i].mono).toMatch(/mono/i)
    expect(got[i].nowrap).toBe("nowrap")
    expect(got[i].sameLine, `${title}: date on the title's line`).toBe(true)
  }
  // One right edge for every date.
  expect(new Set(got.map((r) => r.right)).size).toBe(1)
  // Bullets are list items, every one of them.
  const bullets = CV.experience.jobs.flatMap((j) => [
    ...(j.bullets ?? []),
    ...(j.roles ?? []).flatMap((r) => r.bullets),
  ])
  await expect(page.locator(".cv-list > li")).toHaveText(bullets)
  // Projects and mentoring: the domain a regular-weight link.
  for (const item of [...CV.projects.items, ...CV.mentoring.items]) {
    const link = page.locator(".cv-row a", { hasText: item.domain })
    await expect(link).toHaveAttribute("href", item.href)
    await expect(link).toHaveCSS("font-weight", "400")
  }
})

for (const width of [360, 390, 768, 820]) {
  test(`at ${width}: a date that does not fit drops under its title, whole`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await gotoReady(page, "/cv")
    const rows = await page.locator("[data-cv] .cv-row").evaluateAll((els) =>
      els.map((el) => {
        const [title, date] = [...el.children]
        const t = title.getBoundingClientRect()
        const d = date.getBoundingClientRect()
        const lh = parseFloat(getComputedStyle(date).lineHeight) || d.height
        return {
          title: title.textContent,
          oneLine: d.height < lh * 1.5,
          beside: Math.abs(t.bottom - d.bottom) < 6 && d.left > t.right,
          under: d.top >= t.bottom - 1 && Math.abs(d.left - t.left) < 1,
        }
      })
    )
    for (const r of rows) {
      expect(r.oneLine, `${r.title}: the date is whole`).toBe(true)
      expect(r.beside || r.under, `${r.title}: beside or under`).toBe(true)
    }
  })
}

test("the 1440 page is the PDF's sheet: every line breaks where print does", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await gotoReady(page, "/cv")
  const screen = await page.evaluate(cvRenderedLines)
  await page.emulateMedia({ media: "print" })
  await page.evaluate(async () => {
    await document.fonts.load('400 10pt "Geist CV Print"')
    await document.fonts.load('600 10pt "Geist CV Print"')
    await document.fonts.ready
  })
  const print = await page.evaluate(cvRenderedLines)
  expect(screen.length).toBeGreaterThan(20)
  expect(screen).toEqual(print)
})

test("wider than 820: the top row and the sheet share two edges", async ({
  page,
}) => {
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await gotoReady(page, "/cv")
    const edges = await page.evaluate(() =>
      [".site-top", "[data-cv]"].map((sel) => {
        const r = document.querySelector(sel)!.getBoundingClientRect()
        return [Math.round(r.left), Math.round(r.right)]
      })
    )
    expect(edges[1], `${width}: the sheet`).toEqual(edges[0])
    // 169.8mm at 16px / 11pt: about 700px, centred.
    expect(edges[1][1] - edges[1][0]).toBeGreaterThan(695)
    expect(edges[1][1] - edges[1][0]).toBeLessThan(705)
    expect(Math.abs(edges[1][0] - (width - edges[1][1]))).toBeLessThanOrEqual(1)
  }
})

/*
 * The page is only the CV (owner, 17 Nov 2026: "download replaces 'ask' ·
 * my header becomes just 'x' · everything below this is actually my cv").
 */
test("the top row: Close CV at the left, Download PDF where Ask is; no Ask, no footer", async ({
  page,
}) => {
  await gotoReady(page, "/cv")
  const top = page.locator("header#top")
  const close = top.getByRole("link", { name: CV.close.label })
  await expect(close).toHaveAttribute("href", CV.close.href)
  const download = top.getByRole("link", { name: CV.download.label })
  await expect(download).toHaveAttribute("href", "/cv.pdf")
  // The saved file names him (17 Nov 2026); the path stays /cv.pdf.
  await expect(download).toHaveAttribute("download", SITE.links.cvFilename)
  await expect(download).toHaveAttribute("data-track", "cv: download")
  // No name, no line, no Ask, no footer; nothing to press in the CV but its links.
  await expect(top.locator(".site-top__name, .site-top__line")).toHaveCount(0)
  await expect(page.locator(".ask-btn")).toHaveCount(0)
  await expect(page.locator("footer[data-site-footer]")).toHaveCount(0)
  await expect(page.getByRole("main").locator(".btn")).toHaveCount(0)
  // Ask's code is not loaded here.
  const scripts = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((e) => e.name)
  )
  expect(scripts.filter((u) => /ask/i.test(u))).toEqual([])
  // The row's height and top are the site header's.
  const box = await download.boundingBox()
  expect(Math.round(box!.y)).toBe(64)
  expect(Math.round(box!.height)).toBe(48)
})

test("keyboard: the skip link, Close CV, Download PDF, then the CV's links", async ({
  page,
}) => {
  await gotoReady(page, "/cv")
  const names: string[] = []
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Tab")
    names.push(
      await page.evaluate(
        () =>
          document.activeElement?.getAttribute("aria-label") ??
          document.activeElement?.textContent?.trim() ??
          ""
      )
    )
  }
  expect(names).toEqual([
    "Skip to content",
    CV.close.label,
    CV.download.label,
    CV.contact[0].text,
  ])
})

test("Close CV goes back to the page the visitor came from on the site, else to About", async ({
  page,
}) => {
  await gotoReady(page, "/work")
  await page.getByRole("contentinfo").getByRole("link", { name: "CV" }).click()
  await expect(page).toHaveURL(/\/cv$/)
  await page.getByRole("link", { name: CV.close.label }).click()
  await expect(page).toHaveURL(/\/work$/)

  await page.goto("about:blank")
  await gotoReady(page, "/cv")
  await page.getByRole("link", { name: CV.close.label }).click()
  await expect(page).toHaveURL(/\/about$/)
})

test("ZF's roles are a tree: indented, a spine and a node per role, no extra text", async ({
  page,
}) => {
  await gotoReady(page, "/cv")
  const job = CV.experience.jobs.find((j) => j.roles)!
  const roles = page.locator(".cv-roles > li.cv-role")
  await expect(roles).toHaveCount(job.roles!.length)
  await expect(roles.locator("h4")).toHaveText(job.roles!.map((r) => r.title))
  const tree = await page.evaluate(() => {
    const cv = document.querySelector("[data-cv]")!.getBoundingClientRect()
    const group = document.querySelector(".cv-roles")!
    const first = group.querySelector("h4")!.getBoundingClientRect()
    const zf = document.querySelector(".cv-job--roles > .cv-row h3")!
    const node = getComputedStyle(group.querySelector("li")!, "::before")
    return {
      indent: first.left - cv.left,
      zfLeft: zf.getBoundingClientRect().left - cv.left,
      spine: getComputedStyle(group.querySelector("li")!).backgroundImage,
      node: [node.content, node.width, node.borderRadius],
      text: group.textContent,
    }
  })
  expect(tree.zfLeft).toBeCloseTo(0, 0)
  // 14pt at 16px / 11pt.
  expect(tree.indent).toBeGreaterThan(19)
  expect(tree.indent).toBeLessThan(22)
  expect(tree.spine).toContain("linear-gradient")
  expect(tree.node[0]).toBe('""')
  expect(tree.node[2]).toBe("50%")
  // Nothing but the roles' own words.
  const words = job
    .roles!.flatMap((r) => [r.title, r.dates, ...r.bullets])
    .join("")
  expect(tree.text?.replace(/\s+/g, "")).toBe(words.replace(/\s+/g, ""))
  // The dates keep the one column.
  const rights = await page
    .locator("[data-cv] .cv-date")
    .evaluateAll((els) =>
      els.map((e) => Math.round(e.getBoundingClientRect().right))
    )
  expect(new Set(rights).size).toBe(1)
})

for (const [media, width] of [
  ["screen", 1440],
  ["screen", 390],
  ["print", 1440],
] as const)
  test(`${media} at ${width}: the spine joins the nodes, first to last, and stops`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await gotoReady(page, "/cv")
    await page.emulateMedia({ media })
    const m = await page.evaluate(() => {
      const roles = [...document.querySelectorAll(".cv-roles > li")]
      // Each role's stretch of spine (its background), in page terms.
      const stretches = roles.map((li) => {
        const box = li.getBoundingClientRect()
        const cs = getComputedStyle(li)
        if (cs.backgroundImage === "none") return null
        const y = parseFloat(cs.backgroundPositionY)
        const sizeY = cs.backgroundSize.split(" ").slice(1).join(" ")
        // `calc(100% - y)`, `100%` or a length.
        const h = /calc\(100% - /.test(sizeY)
          ? box.height - y
          : sizeY === "100%"
            ? box.height
            : parseFloat(sizeY)
        return [box.top + y, box.top + y + h]
      })
      const nodes = roles.map((li) => {
        const box = li.getBoundingClientRect()
        const cs = getComputedStyle(li)
        const n = getComputedStyle(li, "::before")
        return (
          box.top +
          parseFloat(cs.paddingTop) +
          parseFloat(n.top) +
          parseFloat(n.height) / 2
        )
      })
      return { stretches, nodes }
    })
    const s = m.stretches
    expect(s.every(Boolean)).toBe(true)
    // From the first node's centre to the last node's centre.
    expect(Math.abs(s[0]![0] - m.nodes[0])).toBeLessThanOrEqual(1)
    expect(
      Math.abs(s[s.length - 1]![1] - m.nodes[m.nodes.length - 1])
    ).toBeLessThanOrEqual(1)
    // One continuous line: each stretch starts where the last one ended.
    for (let i = 1; i < s.length; i++)
      expect(Math.abs(s[i]![0] - s[i - 1]![1])).toBeLessThanOrEqual(0.5)
  })

for (const media of ["screen", "print"] as const)
  for (const width of media === "print" ? [1440] : [1440, 390])
    test(`${media} at ${width}: every bullet's disc is inside its list, 1pt clear`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await gotoReady(page, "/cv")
      await page.emulateMedia({ media })
      const gaps = await page.evaluate(cvBulletGaps)
      expect(gaps.length).toBeGreaterThan(10)
      for (const g of gaps) {
        expect(g.list).toBeGreaterThanOrEqual(4 / 3)
        expect(g.page).toBeGreaterThanOrEqual(4 / 3)
      }
    })

for (const width of [360, 390, 768, 820, 1024, 1440]) {
  test(`no horizontal overflow at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await gotoReady(page, "/cv")
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    )
    expect(over).toBeLessThanOrEqual(0)
  })
}

test("phones: the portrait comes under the name", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await gotoReady(page, "/cv")
  const name = await page.locator(".cv-name").boundingBox()
  const photo = await page.locator(".cv-photo").boundingBox()
  const contact = await page.locator(".cv-contact").boundingBox()
  expect(photo!.y).toBeGreaterThanOrEqual(name!.y + name!.height - 1)
  expect(contact!.y).toBeGreaterThanOrEqual(photo!.y + photo!.height - 1)
})

test("print: only the CV, no top row", async ({ page }) => {
  await gotoReady(page, "/cv")
  await page.emulateMedia({ media: "print" })
  await expect(page.locator("header#top")).toBeHidden()
  await expect(page.locator("[data-cv]")).toBeVisible()
  await expect(page.locator(".cv-name")).toHaveCSS("font-size", /^37\.3/)
  // The static print faces, not the variable Geist (Type 3 in a PDF).
  await expect(page.locator(".cv-list li").first()).toHaveCSS(
    "font-family",
    /^"Geist CV Print"/
  )
})

test("the markdown twin carries every line of the CV", async ({ request }) => {
  const res = await request.get("/cv.md")
  expect(res.status()).toBe(200)
  const body = await res.text()
  for (const job of CV.experience.jobs)
    for (const b of [
      ...(job.bullets ?? []),
      ...(job.roles ?? []).flatMap((r) => r.bullets),
    ])
      expect(body).toContain(`- ${b}`)
  for (const item of CV.projects.items) expect(body).toContain(item.text)
  expect(body).toContain(`${SITE.url}/cv.pdf`)
  // The MentorCruise sentence without the year the row already has.
  expect(body).toContain("\n5.0 average from 51 reviews.\n")
})

test("JSON-LD: a ProfilePage about the site's one Person", async ({ page }) => {
  await page.goto("/cv")
  const graph = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((els) =>
      els.flatMap((e) => JSON.parse(e.textContent ?? "{}")["@graph"] ?? [])
    )
  const profile = graph.find(
    (n: { "@type"?: string }) => n["@type"] === "ProfilePage"
  )
  expect(profile?.url).toBe(`${SITE.url}/cv`)
  expect(profile?.mainEntity?.["@id"]).toBe(`${SITE.url}/#person`)
  expect(
    graph.filter((n: { "@type"?: string }) => n["@type"] === "Person")
  ).toHaveLength(1)
})

test("the PDF served is the one printed from today's sources", async ({
  request,
}) => {
  const res = await request.get("/cv.pdf")
  expect(res.status()).toBe(200)
  expect(res.headers()["content-type"]).toContain("application/pdf")
  const pdf = await res.body()
  expect(
    pdfFingerprint(pdf),
    "public/cv.pdf is stale: pnpm build && pnpm cv:pdf"
  ).toBe(cvFingerprint())
})
