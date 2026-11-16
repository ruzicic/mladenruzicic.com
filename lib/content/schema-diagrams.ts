import { z } from "zod"

/**
 * Case-study diagrams (docs/v4-build/DIAGRAMS.md). The words and numbers of
 * every diagram live in `content/diagrams/<story>.ts` and are validated here
 * when that module loads, so a bad entry fails `next build` with the file
 * path. The drawings (geometry, marks, motion) live in
 * `app/components/diagram/`.
 *
 * Every string is checked for the two things the site never prints: a
 * square bracket (an open question; leave the fact out instead) and an em
 * dash.
 */

const text = z
  .string()
  .min(1)
  .refine((s) => !/[[\]]/.test(s), {
    message:
      "contains a square bracket. Open questions are never rendered: leave the fact out and note it in PLACEHOLDERS.md",
  })
  .refine((s) => !s.includes("—"), { message: "contains an em dash" })

const base = {
  /** `<story>/<name>`, the id the page passes to `<Diagram>`. */
  id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/),
  /** The mono label at the top of the square. */
  title: text,
  /** The point, in plain words (DIAGRAMS.md, "Lead with the point"). */
  lead: text,
  /**
   * A shorter lead for the phone square, where the full one would push the
   * drawing out of the square. Shown instead of `lead` at the narrow size;
   * the full lead stays in the markup for assistive technology.
   */
  leadShort: text.optional(),
  /** The one line under the square. */
  caption: text,
  /** A full-sentence text alternative for the whole drawing. */
  alt: text,
}

/** Who does a step: drives the box style and the screen-reader prefix. */
const ACTORS = ["person", "model", "auto", "me"] as const
const actor = z.enum(ACTORS)

/* Loop -------------------------------------------------------------------- */

const loopSchema = z.object({
  ...base,
  form: z.literal("loop"),
  /** Five stations, clockwise from the top left. */
  stations: z
    .array(
      z.object({
        who: z.enum(["person", "model", "auto"]),
        whoLabel: text,
        title: text,
        note: text.optional(),
      })
    )
    .length(5),
  /** The muted line under the lead, inside the loop. */
  leadNote: text,
  aside: z.object({ label: text, text }),
})

/* Flow (swimlane flowchart) ----------------------------------------------- */

const flowSchema = z.object({
  ...base,
  form: z.literal("flow"),
  lanes: z.object({ person: text, system: text, me: text }),
  steps: z
    .array(
      z.object({
        id: z.string().min(1),
        kind: z.enum(["box", "decision", "end"]),
        actor,
        title: text,
        /** Why the step exists (muted, beside the node). */
        reason: text.optional(),
        /** Read after the title by assistive technology: where it goes next. */
        next: text.optional(),
        /** Decision outcomes, in the order they are read out. */
        branches: z.array(z.object({ label: text, says: text })).optional(),
      })
    )
    .min(3)
    .max(9),
  /** Dashed boxes at the edge: ways out of the flow. */
  exits: z.array(z.object({ id: z.string().min(1), label: text })),
  key: z.array(z.object({ actor, label: text })).max(3),
})

/* Pipeline ---------------------------------------------------------------- */

export const FILE_TYPES = [
  "doc",
  "ppt",
  "xls",
  "pdf",
  "md",
  "txt",
  "page",
  "plain",
] as const
const tab = z.object({ label: text, type: z.enum(FILE_TYPES) })

const chainItem = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("stack"),
    /** Front-most last. At most four marks, overlapping by a third. */
    tabs: z.array(tab).min(2).max(4),
    /** One more untabbed sheet behind (dropped at the narrow size). */
    back: z.boolean().default(false),
    label: text,
  }),
  z.object({ kind: z.literal("arrow"), verb: text }),
  z.object({ kind: z.literal("file"), tab, page: z.boolean().default(false) }),
  z.object({ kind: z.literal("cell"), label: text, sub: text.optional() }),
  z.object({ kind: z.literal("window"), label: text }),
  z.object({ kind: z.literal("headset"), label: text }),
])

/**
 * A ledger line: stage name and what happens there. `short` is the one-line
 * version for the phone square (the full note stays in the markup for
 * assistive technology).
 */
const ledgerLine = z.object({ name: text, note: text, short: text.optional() })

const pipelineSchema = z.object({
  ...base,
  form: z.literal("pipeline"),
  /** Show the lead as a line above the drawing (the title already says it otherwise). */
  showLead: z.boolean().default(true),
  chain: z.array(chainItem).min(3).max(11),
  /** One branch at most (DIAGRAMS.md, file-mark amendment). */
  branch: z
    .object({
      /** Index into `chain` of the item it leaves from. */
      at: z.number().int().nonnegative(),
      kind: z.enum(["index", "together"]),
      label: text,
      verb: text.optional(),
    })
    .optional(),
  ledger: z.array(ledgerLine).min(3).max(6),
})

/* Search, before and now -------------------------------------------------- */

const searchSchema = z.object({
  ...base,
  form: z.literal("search"),
  query: z.object({ text, lang: z.string().min(2) }),
  before: z.object({
    label: text,
    note: text,
    searched: text,
    unsearched: text,
  }),
  now: z.object({ label: text, note: text, searched: text, match: text }),
  /**
   * The pair of figures under the drawing (studenti.rs: his own estimate,
   * shown since 15 Nov 2026, see content/diagrams/studenti-rs.ts).
   * Rendered only when present.
   */
  figures: z
    .object({
      /** A small mono line under the pair; optional. */
      label: text.optional(),
      before: z.object({ figure: text, note: text }),
      now: z.object({ figure: text, note: text }),
    })
    .optional(),
})

/* Count ------------------------------------------------------------------- */

const countSchema = z.object({
  ...base,
  form: z.literal("count"),
  figure: z.number().int().positive(),
  figureLabel: text,
  /** Up to six rows; the one that matters carries the accent. */
  bars: z
    .array(
      z.object({
        label: text,
        value: z.number().int().nonnegative(),
        accent: z.boolean().default(false),
      })
    )
    .min(2)
    .max(6),
})

/* Before and after -------------------------------------------------------- */

const beforeAfterSchema = z.object({
  ...base,
  form: z.literal("before-after"),
  pair: z.tuple([
    z.object({ label: text, figure: text }),
    z.object({ label: text, figure: text }),
  ]),
  line: text,
  sub: z.object({
    label: text,
    pair: z.tuple([
      z.object({ value: text, note: text.optional() }),
      z.object({ value: text, note: text.optional() }),
    ]),
  }),
})

/* Confluence: many sources, one feed -------------------------------------- */

const confluenceSchema = z.object({
  ...base,
  form: z.literal("confluence"),
  /** Up to six rows. `main` draws the heavier line; `read` is dashed and joins no feed. */
  sources: z
    .array(
      z.object({
        label: text,
        example: text.optional(),
        role: z.enum(["main", "source", "read"]),
        tabs: z.array(tab).max(4).optional(),
      })
    )
    .min(3)
    .max(6),
  readNote: text,
  feed: z.array(text).min(1).max(3),
  card: z.object({ deadline: text, badge: z.string().length(1) }),
})

/* Track: stations on a line ----------------------------------------------- */

const trackSchema = z.object({
  ...base,
  form: z.literal("track"),
  stations: z
    .array(z.object({ name: text, kind: z.enum(["plain", "model", "accent"]) }))
    .min(3)
    .max(6),
  /** Index of the station the card hangs from. */
  cardAt: z.number().int().nonnegative(),
  card: z.object({ deadline: text, badge: z.string().length(1) }),
  reasonsLabel: text,
  reasons: z.array(text).min(1).max(3),
  ledger: z.array(ledgerLine).min(3).max(6),
})

export const diagramSchema = z.discriminatedUnion("form", [
  loopSchema,
  flowSchema,
  pipelineSchema,
  searchSchema,
  countSchema,
  beforeAfterSchema,
  confluenceSchema,
  trackSchema,
])

export type DiagramData = z.infer<typeof diagramSchema>
export type DiagramInput = z.input<typeof diagramSchema>
export type DiagramOf<F extends DiagramData["form"]> = Extract<
  DiagramData,
  { form: F }
>
export type FlowStep = DiagramOf<"flow">["steps"][number]
export type ChainItem = DiagramOf<"pipeline">["chain"][number]
export type LedgerLine = z.infer<typeof ledgerLine>
export type FileType = (typeof FILE_TYPES)[number]
export type Actor = (typeof ACTORS)[number]

/**
 * Validates one story's diagrams. Throws with the file path and the failing
 * field, which fails `next build` (the content modules load at build time).
 */
export function defineDiagrams(
  source: string,
  entries: DiagramInput[]
): DiagramData[] {
  return entries.map((entry, i) => {
    const result = diagramSchema.safeParse(entry)
    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ")
      throw new Error(
        `Invalid content in ${source}: diagram ${entry.id ?? `#${i}`}: ${issues}`
      )
    }
    const d = result.data
    if (d.form === "flow") {
      const ids = new Set([
        ...d.steps.map((s) => s.id),
        ...d.exits.map((x) => x.id),
      ])
      if (ids.size !== d.steps.length + d.exits.length) {
        throw new Error(
          `Invalid content in ${source}: diagram ${d.id}: duplicate step or exit id`
        )
      }
    }
    if (d.form === "pipeline" && d.branch && d.branch.at >= d.chain.length) {
      throw new Error(
        `Invalid content in ${source}: diagram ${d.id}: branch.at is past the chain`
      )
    }
    if (d.form === "track" && d.cardAt >= d.stations.length) {
      throw new Error(
        `Invalid content in ${source}: diagram ${d.id}: cardAt is past the stations`
      )
    }
    return d
  })
}
