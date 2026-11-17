import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { CV } from "@/content/pages/cv"

/**
 * What `/cv.pdf` is made from, as one hash: the CV's content
 * (`content/pages/cv.ts`, resolved), its markup, its stylesheet (the print
 * rules are there) and the portrait. `scripts/cv-pdf.ts` writes it into the
 * PDF's Keywords; `pnpm cv:pdf --check` (CI) and `tests/cv.spec.ts` fail
 * while the committed PDF carries another one. BUILD/TEST ONLY: it reads
 * the filesystem.
 *
 * Not a hash of the PDF itself: Chromium's output is not byte-for-byte
 * repeatable (dates, font subsets), the sources are.
 */
export const CV_SOURCES = [
  "content/pages/cv.ts",
  "app/components/cv/CvPage.tsx",
  "app/styles/cv.css",
] as const

/** The prefix of the PDF's Keywords entry that carries the hash. */
export const CV_HASH_PREFIX = "cv-source-sha256:"

export function cvFingerprint(root: string = process.cwd()): string {
  const hash = createHash("sha256")
  hash.update("cv-pdf/1\n")
  // The resolved content: what the page renders, whichever file it came
  // from (`content/site.ts` gives the name, the contact line, the portrait).
  hash.update(JSON.stringify(CV))
  for (const file of CV_SOURCES) {
    hash.update(`\n${file}\n`)
    hash.update(readFileSync(join(root, file)))
  }
  hash.update(readFileSync(join(root, "public", CV.headshot.src)))
  return hash.digest("hex")
}

/**
 * The hash a PDF carries, from its last Keywords entry (an incremental
 * update appends a newer Info dictionary), or `undefined`. Plain bytes, no
 * PDF library and no poppler, so it runs on CI.
 */
export function pdfFingerprint(pdf: Uint8Array): string | undefined {
  const text = Buffer.from(pdf).toString("latin1")
  const all = [
    ...text.matchAll(
      new RegExp(`/Keywords \\(${CV_HASH_PREFIX}([0-9a-f]{64})\\)`, "g")
    ),
  ]
  return all.at(-1)?.[1]
}
