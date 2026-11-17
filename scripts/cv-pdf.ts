/**
 * Writes `public/cv.pdf`: the `/cv` page printed by Chromium (its print
 * stylesheet, `app/styles/cv.css`), so the PDF and the page are one
 * markup. The PDF is committed: Vercel's build has no Chromium.
 *
 *   pnpm cv:pdf                          # next start on a production build (built first if missing), print, stop
 *   pnpm cv:pdf --base http://localhost:3313   # print from a production server that is already up
 *   pnpm cv:pdf --check                  # fail when public/cv.pdf is stale; with poppler, also check its text
 *   pnpm cv:pdf --check --show           # the same, and print the raw text extraction
 *
 * Freshness: the PDF's Keywords carry a hash of its sources
 * (`lib/cv/fingerprint.ts`: the CV content, the markup, the stylesheet, the
 * portrait). `--check` recomputes it; a mismatch means the content or the
 * design changed and the PDF was not regenerated.
 *
 * The text check reads the PDF as an applicant-tracking parser would
 * (poppler's `pdftotext -raw`, `pdffonts`, `pdfinfo`): two pages, tagged,
 * every font embedded, the name with its diacritics, every title line
 * followed by its date on the same line, every sentence in reading order
 * with nothing glued across a line or the page break, no zero-width
 * characters, and every link a real link. Without poppler (CI) it is
 * skipped with a note; the hash is still checked.
 */
import { execFileSync, spawn, type ChildProcess } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
// The content loaders resolve `content/` against the working directory.
process.chdir(ROOT)

const { CV } = await import("../content/pages/cv")
const { cvBulletGaps, cvRenderedLines } = await import("../lib/cv/lines")
const { CV_HASH_PREFIX, cvFingerprint, pdfFingerprint } =
  await import("../lib/cv/fingerprint")

const OUT = join("public", "cv.pdf")
const TITLE = `${CV.name}, ${CV.seo.title}`
const PORT = 3319

const args = process.argv.slice(2)
const check = args.includes("--check")
const show = args.includes("--show")
const baseArg = args.includes("--base")
  ? args[args.indexOf("--base") + 1]
  : process.env.CV_PDF_BASE

/* -------------------------------------------------------------------------- */
/* Expected text, from content                                                */
/* -------------------------------------------------------------------------- */

/** A project's or the mentoring entry's row: "TenderLift · Co-founder · tenderlift.ch Sep 2025 to present". */
const entryRow = (i: (typeof CV.projects.items)[number]) =>
  `${[i.name, i.role, i.domain].filter(Boolean).join(" · ")} ${i.dates}`

/**
 * Every dated row as one extracted line, its title then its date:
 * "ZF Oct 2023 to present", "Shopify · Senior Software Engineer Apr 2021
 * to May 2023", "Global Product Owner May 2025 to present".
 */
function titleLines(): string[] {
  return [
    ...CV.experience.jobs.flatMap((job) => [
      `${job.role ? `${job.company} · ${job.role}` : job.company} ${job.dates}`,
      ...(job.roles ?? []).map((r) => `${r.title} ${r.dates}`),
    ]),
    ...CV.projects.items.map(entryRow),
    ...CV.mentoring.items.map(entryRow),
  ]
}

/** Every piece of text in reading order, as the page has it. */
function readingOrder(): string[] {
  const entry = (i: (typeof CV.projects.items)[number]) => [entryRow(i), i.text]
  return [
    CV.name,
    CV.headline.role,
    CV.headline.location,
    CV.contact.map((c) => c.text).join(" · "),
    ...CV.summary,
    CV.experience.title,
    ...CV.experience.jobs.flatMap((job) => [
      `${job.role ? `${job.company} · ${job.role}` : job.company} ${job.dates}`,
      ...(job.line ? [job.line] : []),
      ...(job.bullets ?? []),
      ...(job.roles ?? []).flatMap((r) => [
        `${r.title} ${r.dates}`,
        ...r.bullets,
      ]),
    ]),
    CV.projects.title,
    ...CV.projects.items.flatMap(entry),
    CV.mentoring.title,
    ...CV.mentoring.items.flatMap(entry),
    CV.skills.title,
    CV.skills.items.join(" · "),
  ]
}

/** Every link the PDF must carry. */
function expectedLinks(): string[] {
  return [
    ...CV.contact.map((c) => c.href),
    ...CV.projects.items.map((i) => i.href),
    ...CV.mentoring.items.map((i) => i.href),
  ]
}

/* -------------------------------------------------------------------------- */
/* PDF metadata: an incremental update with a new Info dictionary             */
/* -------------------------------------------------------------------------- */

/** A PDF text string: literal when ASCII, else UTF-16BE with a BOM. */
function pdfString(value: string): string {
  if (/^[\x20-\x7e]*$/.test(value))
    return `(${value.replace(/[\\()]/g, (c) => `\\${c}`)})`
  let hex = "FEFF"
  for (const ch of value) {
    const code = ch.codePointAt(0)!
    if (code > 0xffff) throw new Error(`no surrogate pairs in "${value}"`)
    hex += code.toString(16).toUpperCase().padStart(4, "0")
  }
  return `<${hex}>`
}

/**
 * Appends a new Info dictionary (title, author, subject, the source hash in
 * Keywords) to Chromium's output as an incremental update: a new object, a
 * one-entry xref section and a trailer that points back at the original
 * (`/Prev`). Chromium writes only the title from the page; the rest has no
 * HTML source it reads. Skia writes a classic xref table, which this needs.
 */
function withInfo(pdf: Buffer, info: Record<string, string>): Buffer {
  const text = pdf.toString("latin1")
  const startxref = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(text)?.[1]
  const trailer = text.slice(text.lastIndexOf("trailer"))
  const size = /\/Size (\d+)/.exec(trailer)?.[1]
  const root = /\/Root (\d+ \d+ R)/.exec(trailer)?.[1]
  if (!startxref || !size || !root || /\/XRefStm|\/Type\s*\/XRef/.test(text))
    throw new Error("unexpected PDF structure (no classic xref trailer)")
  // Keep what Chromium wrote that is not replaced (Creator, Producer, dates).
  const infoRef = /\/Info (\d+) 0 R/.exec(trailer)?.[1]
  const old = infoRef
    ? new RegExp(
        `(?:^|\\n)${infoRef} 0 obj\\s*<<([\\s\\S]*?)>>\\s*endobj`
      ).exec(text)?.[1]
    : undefined
  const kept = ["Creator", "Producer", "CreationDate", "ModDate"]
    .map((key) =>
      new RegExp(`/${key} (\\([^)]*\\)|<[0-9A-Fa-f]*>)`).exec(old ?? "")
    )
    .filter((m): m is RegExpExecArray => Boolean(m))
    .map((m) => m[0])
  const n = Number(size)
  const dict = [
    ...Object.entries(info).map(([k, v]) => `/${k} ${pdfString(v)}`),
    ...kept,
  ].join("\n")
  const head = text.endsWith("\n") ? "" : "\n"
  const objOffset = pdf.length + head.length
  const obj = `${n} 0 obj\n<<${dict}>>\nendobj\n`
  const xrefOffset = objOffset + Buffer.byteLength(obj, "latin1")
  const tail = [
    "xref",
    `${n} 1`,
    `${String(objOffset).padStart(10, "0")} 00000 n `,
    "trailer",
    `<</Size ${n + 1}`,
    `/Root ${root}`,
    `/Info ${n} 0 R`,
    `/Prev ${startxref}>>`,
    "startxref",
    String(xrefOffset),
    "%%EOF",
    "",
  ].join("\n")
  return Buffer.concat([pdf, Buffer.from(head + obj + tail, "latin1")])
}

/* -------------------------------------------------------------------------- */
/* Rendering                                                                  */
/* -------------------------------------------------------------------------- */

async function waitFor(url: string, ms: number) {
  const until = Date.now() + ms
  while (Date.now() < until) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error(`${url} did not answer within ${ms / 1000}s`)
}

async function startServer(): Promise<{ base: string; stop: () => void }> {
  if (!existsSync(join(".next", "BUILD_ID"))) {
    console.log("No production build: running `pnpm build` first.")
    execFileSync("pnpm", ["build"], { stdio: "inherit" })
  }
  const base = `http://localhost:${PORT}`
  const server: ChildProcess = spawn(
    join("node_modules", ".bin", "next"),
    ["start", "-p", String(PORT)],
    { stdio: "ignore", detached: true }
  )
  const stop = () => {
    try {
      process.kill(-server.pid!, "SIGTERM")
    } catch {
      // already gone
    }
  }
  try {
    await waitFor(`${base}/cv`, 60_000)
  } catch (error) {
    stop()
    throw error
  }
  return { base, stop }
}

/** The print rendering's lines, per paragraph and bullet (`render`). */
let printedLines: string[][] = []

async function render(base: string): Promise<Buffer> {
  const { chromium } = await import("@playwright/test")
  const browser = await chromium.launch()
  try {
    // Twice the pixels for the portrait's `srcset`: 34mm at about 290 dpi.
    const context = await browser.newContext({ deviceScaleFactor: 2 })
    const page = await context.newPage()
    const res = await page.goto(`${base}/cv`, { waitUntil: "networkidle" })
    if (!res?.ok()) throw new Error(`${base}/cv answered ${res?.status()}`)
    await page.emulateMedia({ media: "print" })
    await page.evaluate(async () => {
      // The print faces load only once print styles ask for them.
      await document.fonts.load('400 10pt "Geist CV Print"')
      await document.fonts.load('600 10pt "Geist CV Print"')
      await document.fonts.ready
      await Promise.all(
        [...document.images].map((img) => (img.complete ? null : img.decode()))
      )
    })
    // A server built before the last content change prints an old CV.
    const shown = (await page.locator("[data-cv]").innerText()).replace(
      /\s+/g,
      " "
    )
    for (const text of readingOrder().slice(1))
      if (!shown.includes(text.replace(/\s+/g, " ")))
        throw new Error(
          `${base}/cv does not show "${text}": rebuild (pnpm build) and run again.`
        )
    // Every bullet's disc lies inside its list and the text area, with at
    // least 1pt to spare on the left (a cut-off disc, 17 Nov 2026).
    const ONE_PT = 4 / 3
    const cut = (await page.evaluate(cvBulletGaps)).filter(
      (g) => g.list < ONE_PT || g.page < ONE_PT
    )
    if (cut.length)
      throw new Error(
        `${cut.length} bullet disc(s) closer than 1pt to the list's or the page's left edge: ${JSON.stringify(cut)}`
      )
    // The screen page is the sheet enlarged: at 1440 wide every paragraph
    // and bullet breaks where the print rendering does.
    printedLines = await page.evaluate(cvRenderedLines)
    const screen = await (
      await browser.newContext({ viewport: { width: 1440, height: 900 } })
    ).newPage()
    await screen.goto(`${base}/cv`, { waitUntil: "networkidle" })
    await screen.evaluate(() => document.fonts.ready)
    const onScreen = await screen.evaluate(cvRenderedLines)
    const differ = printedLines.flatMap((lines, i) =>
      JSON.stringify(lines) === JSON.stringify(onScreen[i])
        ? []
        : [
            `print ${JSON.stringify(lines)}\n    1440 ${JSON.stringify(onScreen[i])}`,
          ]
    )
    if (differ.length)
      throw new Error(
        `/cv at 1440 breaks lines unlike the print:\n  ${differ.join("\n  ")}`
      )
    await page.evaluate((title) => {
      document.title = title
    }, TITLE)
    return await page.pdf({
      format: "A4",
      printBackground: false,
      tagged: true,
      preferCSSPageSize: true,
    })
  } finally {
    await browser.close()
  }
}

/* -------------------------------------------------------------------------- */
/* The text check (poppler)                                                   */
/* -------------------------------------------------------------------------- */

function hasPoppler(): boolean {
  try {
    execFileSync("pdftotext", ["-v"], { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

const run = (cmd: string, args: string[]) =>
  execFileSync(cmd, args, { encoding: "utf8" })

/** Every problem an applicant-tracking parser would trip on; empty when none. */
function verify(file: string, raw: string): string[] {
  const problems: string[] = []
  const info = run("pdfinfo", ["-enc", "UTF-8", file])
  const field = (name: string) =>
    new RegExp(`^${name}:\\s*(.*)$`, "m").exec(info)?.[1]?.trim()
  if (field("Pages") !== "2") problems.push(`${field("Pages")} pages, not 2`)
  if (field("Tagged") !== "yes") problems.push("not tagged")
  if (field("Title") !== TITLE)
    problems.push(`title is "${field("Title")}", not "${TITLE}"`)
  if (!field("Keywords")?.startsWith(CV_HASH_PREFIX))
    problems.push("no source hash in the Keywords")

  const fonts = run("pdffonts", [file]).split("\n").slice(2).filter(Boolean)
  if (fonts.length === 0) problems.push("no fonts")
  for (const row of fonts) {
    // name, type (one or two words), encoding, emb, sub, uni, object, ID
    const cols = row.trim().split(/\s+/)
    const [emb, , uni] = cols.slice(-5, -2)
    if (emb !== "yes") problems.push(`font not embedded: ${row.trim()}`)
    if (uni !== "yes")
      problems.push(`font without a Unicode map: ${row.trim()}`)
    // A Type 3 font (Chromium's way with a variable font) has no real word
    // spaces and is unreadable to many parsers.
    if (/Type 3/.test(row)) problems.push(`a Type 3 font: ${row.trim()}`)
  }

  if (/[\u00AD\u200B-\u200F\u2060\uFEFF]/.test(raw))
    problems.push("a zero-width or soft-hyphen character in the text")
  const lines = raw.split(/\n|\f/).map((l) => l.trim())
  if (lines[0] !== CV.name.normalize("NFC"))
    problems.push(`first line is "${lines[0]}", not the name "${CV.name}"`)
  // Then the two headline lines (his role, where he lives), then the
  // contact line, each a line of its own.
  const first = [
    CV.headline.role,
    CV.headline.location,
    CV.contact.map((c) => c.text).join(" · "),
  ]
  first.forEach((want, i) => {
    if (lines[i + 1] !== want)
      problems.push(`line ${i + 2} is "${lines[i + 1]}", not "${want}"`)
  })
  for (const title of titleLines())
    if (!lines.includes(title))
      problems.push(`no line "${title}" (a title and its date on one line)`)

  // Reading order, nothing glued: line ends joined with a space (or with
  // nothing after a hyphen that broke a word such as "in-vehicle"), the
  // list markers dropped.
  const flat = raw
    .replace(/\f/g, "\n")
    .split("\n")
    .map((l) => l.replace(/^\s*[•●]\s*/, "").trim())
    .filter(Boolean)
    .reduce(
      (acc, l) => (acc.endsWith("-") ? `${acc}${l}` : acc ? `${acc} ${l}` : l),
      ""
    )
  let at = 0
  for (const text of readingOrder()) {
    const want = text.replace(/\s+/g, " ")
    const i = flat.indexOf(want, at)
    if (i < 0) {
      problems.push(`not found in order: "${want}"`)
      continue
    }
    const next = flat[i + want.length]
    if (next !== undefined && next !== " ")
      problems.push(
        `glued: "${want}" runs into "${flat.slice(i + want.length, i + want.length + 20)}"`
      )
    at = i + want.length
  }

  const bytes = readFileSync(file).toString("latin1")
  const uris = [...bytes.matchAll(/\/URI \(([^)]*)\)/g)].map((m) => m[1])
  const norm = (u: string) => u.replace(/\/$/, "")
  for (const href of expectedLinks())
    if (!uris.some((u) => norm(u) === norm(href)))
      problems.push(`no link to ${href}`)
  // The PDF breaks every paragraph and bullet where the print rendering
  // (and so the 1440 page) does: each of its lines is a line of the text.
  for (const line of printedLines.flat())
    if (!lines.includes(line))
      problems.push(`the PDF does not break as the page does: "${line}"`)
  for (const u of uris)
    if (!/^(https:|mailto:)/.test(u)) problems.push(`a link to "${u}"`)
  return problems
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

const want = cvFingerprint(ROOT)

if (!check) {
  const server = baseArg
    ? { base: baseArg.replace(/\/$/, ""), stop: () => {} }
    : await startServer()
  try {
    const pdf = await render(server.base)
    writeFileSync(
      OUT,
      withInfo(pdf, {
        Title: TITLE,
        Author: CV.name,
        Subject: CV.seo.description,
        Keywords: `${CV_HASH_PREFIX}${want}`,
      })
    )
  } finally {
    server.stop()
  }
  console.log(
    `Wrote ${OUT} from ${server.base}/cv (${Math.round(readFileSync(OUT).length / 1024)} KB).`
  )
}

if (!existsSync(OUT)) {
  console.error(`${OUT} is missing. Run: pnpm cv:pdf`)
  process.exit(1)
}
const have = pdfFingerprint(readFileSync(OUT))
if (have !== want) {
  console.error(
    `${OUT} is out of date with the CV (content/pages/cv.ts, app/components/cv/, app/styles/cv.css or the portrait changed). Run: pnpm build && pnpm cv:pdf`
  )
  process.exit(1)
}
if (check) console.log(`${OUT} is up to date (sources ${want.slice(0, 12)}).`)

if (hasPoppler()) {
  const raw = run("pdftotext", ["-raw", "-enc", "UTF-8", OUT, "-"])
  if (show || !check) console.log(`\n${raw}`)
  const problems = verify(OUT, raw)
  if (problems.length) {
    console.error(`\n${OUT} fails the text check:\n  ${problems.join("\n  ")}`)
    process.exit(1)
  }
  console.log(
    `${OUT} passes the text check: 2 pages, tagged, fonts embedded, reading order, title lines with their dates, links.`
  )
} else {
  console.log(
    "Note: poppler (pdftotext, pdffonts, pdfinfo) is not installed; the text check is skipped. The hash was checked."
  )
}
