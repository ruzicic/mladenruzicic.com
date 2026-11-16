import { defineDiagrams } from "@/lib/content/schema-diagrams"

/**
 * The TenderLift diagrams. TenderLift is in the product-market fit stage, so
 * these never carry a factor count, grade bands, weights, percentages, a
 * model name, or the words "official", "verified", "complete" or "every"
 * (enforced in tests/diagram.spec.ts). The fit grade appears only as an
 * outcome: the badge on the card and three plain reasons. Open items are
 * listed in docs/v4-build/PLACEHOLDERS.md under "Diagrams: waiting for the
 * owner".
 */
export const TENDERLIFT_DIAGRAMS = defineDiagrams(
  "content/diagrams/tenderlift.ts",
  [
    {
      id: "tenderlift/sources",
      form: "confluence",
      title: "Many sources, one feed",
      lead: "Tenders are published in many places. A company reads one feed.",
      // The owner, 14 Nov 2026: "not exact count. 20+ is fine though".
      caption:
        "20+ sources, from the national platform to cantonal gazettes and company registers, in one place.",
      alt: "Tenders are published in more than 20 places: the national tender platform simap.ch and its archive since 2007, the EU journal TED, cantonal gazettes, published award lists and company registers. Their lines merge into one feed, de-duplicated and in your language, that ends in one tender with a fit grade. Tender documents are read, not a source.",
      sources: [
        {
          label: "National tender platform",
          example: "simap.ch, and its archive since 2007",
          role: "main",
        },
        { label: "EU journal", example: "TED", role: "source" },
        // No cantons are named (the owner, 14 Nov 2026: "irrelevant").
        { label: "Cantonal gazettes", role: "source" },
        // No other publishers are named either ("irrelevant").
        {
          label: "Published award lists",
          example: "the federal list",
          role: "source",
        },
        {
          label: "Company registers",
          example: "the commercial register, the Gazette of Commerce",
          role: "source",
        },
        {
          label: "Tender documents",
          role: "read",
          tabs: [
            { label: "PDF", type: "pdf" },
            { label: "DOC", type: "doc" },
            { label: "XLS", type: "xls" },
            { label: "Scan", type: "plain" },
          ],
        },
      ],
      readNote: "Read, not a source",
      feed: ["One feed", "de-duplicated", "in your language"],
      card: { deadline: "Deadline", badge: "B" },
    },
    {
      id: "tenderlift/notice-to-decision",
      form: "track",
      title: "From a notice to a decision",
      lead: "From a notice published somewhere to a decision on your desk.",
      caption:
        "Six steps between a published notice and a decision; a person makes the last one.",
      alt: "Six steps from a published notice to a decision: collect, clean up, read, rank, tell and pursue. A model reads the documents and ranks each tender. The rank is a fit grade with its reasons, such as your categories, your cantons and a buyer you know. A person makes the last decision.",
      stations: [
        { name: "Collect", kind: "plain" },
        { name: "Clean up", kind: "plain" },
        { name: "Read", kind: "model" },
        { name: "Rank", kind: "accent" },
        { name: "Tell", kind: "plain" },
        { name: "Pursue", kind: "plain" },
      ],
      cardAt: 3,
      card: { deadline: "Deadline", badge: "B" },
      reasonsLabel: "Why a tender fits",
      reasons: ["your categories", "your cantons", "a buyer you know"],
      ledger: [
        {
          name: "Collect",
          note: "New notices and document changes, picked up as they appear.",
          short: "New notices, as they appear.",
        },
        {
          name: "Clean up",
          note: "One tender, not four copies, whatever language it came in.",
          short: "One tender, not four copies.",
        },
        {
          name: "Read",
          note: "The documents read for you, with the passage behind each point.",
          short: "The documents, read for you.",
        },
        {
          name: "Rank",
          note: "A fit grade with its reasons, before you open a PDF.",
          short: "A fit grade with its reasons.",
        },
        {
          name: "Tell",
          note: "One morning email, and alerts when something changes.",
          short: "One morning email, and alerts.",
        },
        // Buyer forms are live (the owner, 14 Nov 2026).
        {
          name: "Pursue",
          note: "Owners, deadlines and tasks in one dossier.",
          short: "Owners, deadlines and tasks.",
        },
      ],
    },
  ]
)
