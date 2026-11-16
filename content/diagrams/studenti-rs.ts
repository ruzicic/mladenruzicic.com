import { defineDiagrams } from "@/lib/content/schema-diagrams"

/**
 * The studenti.rs diagrams. Steps and numbers come from the studenti-platform
 * repository (its docs/ and git history) as read for docs/v4-build/DIAGRAMS.md;
 * only what is safe to publish. Open questions stay out of the rendered
 * diagram and are listed in docs/v4-build/PLACEHOLDERS.md under "Diagrams:
 * waiting for the owner".
 */
export const STUDENTI_RS_DIAGRAMS = defineDiagrams(
  "content/diagrams/studenti-rs.ts",
  [
    {
      id: "studenti-rs/loop",
      form: "loop",
      title: "The whole picture",
      lead: "The library grows and stays clean",
      leadNote: "without anyone reading uploads by hand.",
      caption: "The whole loop. The next squares show each part.",
      alt: "A loop in five steps: a student uploads notes, it is checked and sorted, it becomes a page, search finds it, and another student opens it, which leads back to the first step. The library grows and stays clean without anyone reading uploads by hand. What still reaches me: uploads the final check is unsure about, held until I look; lifting a flag from an account; an alert when an upload gets stuck.",
      stations: [
        {
          who: "person",
          whoLabel: "Student",
          title: "A student uploads notes",
        },
        { who: "model", whoLabel: "Our AI", title: "It is checked and sorted" },
        { who: "auto", whoLabel: "Automatic", title: "It becomes a page" },
        {
          who: "auto",
          whoLabel: "Automatic",
          title: "Search finds it",
          note: "Google + site search",
        },
        {
          who: "person",
          whoLabel: "Student",
          title: "Another student opens it",
        },
      ],
      aside: {
        label: "What still reaches me:",
        text: "uploads the final check is unsure about, held until I look; lifting a flag from an account; an alert when an upload gets stuck.",
      },
    },
    {
      id: "studenti-rs/submission",
      form: "flow",
      title: "From upload to published",
      lead: "Every upload is checked, sorted and published without waiting for a person.",
      caption: "What happens to one upload, and why each check is there.",
      alt: "A flowchart in three lanes: the student, the system and me. The student uploads a file. A model asks if it is study material; if not, it is refused on the spot. The student confirms the details. An automatic check asks if it is a copy; if so, it is binned, and a strike. A model asks if it is good enough: if not, it is binned; if it is not sure, I decide; if yes, it is published now or on a future date. Published, the student is rewarded and told.",
      lanes: { person: "Student", system: "The system", me: "Me" },
      steps: [
        {
          id: "upload",
          kind: "box",
          actor: "person",
          title: "Uploads a file",
          reason: "Any office format. Nothing is public yet.",
        },
        {
          id: "material",
          kind: "decision",
          actor: "model",
          title: "Study material?",
          reason: "Junk and spam stop here.",
          branches: [
            { label: "No", says: "it is refused on the spot" },
            { label: "Yes", says: "it goes back to the student" },
          ],
        },
        {
          id: "confirm",
          kind: "box",
          actor: "person",
          title: "Confirms the details",
          reason: "Title, subject and summary are written for them.",
        },
        {
          id: "copy",
          kind: "decision",
          actor: "auto",
          title: "A copy?",
          reason: "The same notes cannot be uploaded twice.",
          branches: [
            { label: "Yes", says: "it is binned, and a strike" },
            { label: "No", says: "it goes on" },
          ],
        },
        {
          id: "good",
          kind: "decision",
          actor: "model",
          title: "Good enough?",
          reason: "Clear cases never need me.",
          branches: [
            { label: "Yes", says: "it goes on" },
            { label: "Not sure", says: "it comes to me" },
            { label: "No", says: "it is binned" },
          ],
        },
        {
          id: "me",
          kind: "box",
          actor: "me",
          title: "I decide",
          next: "Held until I look.",
        },
        {
          id: "publish",
          kind: "box",
          actor: "auto",
          title: "Publishes now, or on a future date",
          reason: "The library grows a little every day.",
        },
        {
          id: "end",
          kind: "end",
          actor: "auto",
          title: "Published. The student is rewarded and told.",
        },
      ],
      exits: [
        { id: "refused", label: "Refused on the spot" },
        { id: "strike", label: "Binned, and a strike" },
        { id: "binned", label: "Binned" },
      ],
      key: [
        { actor: "model", label: "= a model decides" },
        { actor: "auto", label: "= automatic" },
        { actor: "person", label: "= a person" },
      ],
    },
    {
      id: "studenti-rs/pipeline",
      form: "pipeline",
      title: "From upload to web page",
      lead: "One upload becomes a page anyone can find.",
      caption:
        "Any file a student uploads becomes a readable web page on its own, and its text feeds the site’s search.",
      alt: "A pipeline. A student uploads any office file: Word, PowerPoint, PDF or another format. It is converted to a PDF, its words are extracted as Markdown, and a web page is published. One branch sends the Markdown to the site’s search index. All 45,000+ older documents were re-run. 7,000+ were removed: duplicates, low quality, or material that should never have been public.",
      chain: [
        {
          kind: "stack",
          label: "Any office format",
          back: true,
          tabs: [
            { label: "PDF", type: "pdf" },
            { label: "PPT", type: "ppt" },
            { label: "DOC", type: "doc" },
          ],
        },
        { kind: "arrow", verb: "Convert" },
        { kind: "file", tab: { label: "PDF", type: "pdf" } },
        { kind: "arrow", verb: "Extract" },
        { kind: "file", tab: { label: "MD", type: "md" } },
        { kind: "arrow", verb: "Publish" },
        { kind: "file", tab: { label: "Page", type: "page" }, page: true },
      ],
      branch: { at: 4, kind: "index", label: "Search index" },
      ledger: [
        {
          name: "Any file",
          note: "Word, PowerPoint, OpenDocument, RTF or PDF: whatever the student has.",
          short: "Word, PowerPoint, PDF and more.",
        },
        {
          name: "PDF",
          note: "Every file is turned into a PDF, so each one is handled the same way.",
          short: "Every file is turned into a PDF.",
        },
        {
          name: "Markdown",
          note: "The words are read out as plain text. A model writes the title, summary and keywords from it.",
          short: "The words, as plain text.",
        },
        {
          name: "Page",
          note: "The free pages become a real web page that search engines and AI assistants can read and quote.",
          short: "A page search engines can read.",
        },
        {
          name: "Search index",
          note: "The site’s own search reads the Markdown copy, so students can search by meaning, not only by exact words. About 37,500 Markdown files.",
          short: "Site search reads this copy.",
        },
        // The owner, 14 Nov 2026: "all - 45k+ ... we removed 7k+".
        {
          // One line each at the phone size: the full sentence is the note.
          name: "Re-run",
          note: "All 45,000+ older documents were re-run. 7,000+ were removed: duplicates, low quality, or material that should never have been public.",
          short: "45,000+ re-run, 7,000+ removed.",
        },
      ],
    },
    {
      id: "studenti-rs/search",
      form: "search",
      title: "Search, before and now",
      lead: "Search now looks inside the whole document, not only at its title.",
      leadShort: "Search now reads the whole document.",
      caption:
        "What search could see before the rebuild, and what it sees now.",
      alt: "Search, before and now. Before the rebuild, search matched titles and page text; the rest of a document was not searched. Now search reads whole documents and understands meaning, so a query can find a passage that says the same thing in other words. Before, 1 in 10 searches ended with the student finding what they wanted; 7 in 10 do today.",
      query: { text: "ugovor o radu", lang: "sr" },
      before: {
        label: "Before",
        note: "Search matched titles and page text.",
        searched: "Searched",
        unsearched: "Not searched",
      },
      now: {
        label: "Now",
        note: "Search reads whole documents and understands meaning.",
        searched: "Searched",
        match: "Same meaning, different words",
      },
      // The owner's own estimate (decided 15 Nov 2026, canvas card 42:
      // 'show "1 in 10 before, 7 in 10 today" then'), shown without a label
      // (his note the same day: the label is pointless, though true).
      figures: {
        before: {
          figure: "1 in 10",
          note: "searches ended with the student finding what they wanted.",
        },
        now: { figure: "7 in 10", note: "do today." },
      },
    },
    {
      id: "studenti-rs/classification-count",
      form: "count",
      title: "Sorting the library",
      lead: "The old library was a mess: badly written titles, missing tags, a catch-all subject, and documents filed under the wrong institution.",
      leadShort: "The old library was a mess.",
      caption:
        "In five days 20,773 documents were linked to their institution; the rest were left blank instead of wrongly filled.",
      alt: "A count. The old library was a mess: badly written titles, missing tags, a catch-all subject and documents under the wrong institution. Then 38,263 documents were sorted by institution in January 2026. 20,672 matched from the text, 101 by reading the whole PDF, 57 still ambiguous, 15,367 with no institution named in the text, 2,066 with none confirmed from the PDF.",
      figure: 38263,
      figureLabel: "Documents sorted by institution, Jan 2026",
      bars: [
        { label: "Matched from the text", value: 20672, accent: true },
        { label: "Matched by reading the whole PDF", value: 101 },
        { label: "Still ambiguous", value: 57 },
        { label: "No institution named in the text", value: 15367 },
        { label: "No institution, confirmed from the PDF", value: 2066 },
      ],
    },
    {
      id: "studenti-rs/classification-before-after",
      form: "before-after",
      title: "Filed under the wrong institution",
      lead: "No document is filed under the wrong institution any more.",
      caption:
        "About four in ten documents were filed under the wrong institution. Now none are.",
      alt: "Before and after. Before the clean-up about 40% of documents were filed under the wrong institution; on 21 January 2026 none were, after 15,237 wrong links were removed. Filed under the right one: 35.7% before, 54% after. The other 46% never name an institution in their text and are left blank, not guessed.",
      pair: [
        { label: "Before the clean-up", figure: "about 40%" },
        { label: "After, 21 Jan 2026", figure: "0" },
      ],
      line: "15,237 wrong links removed.",
      sub: {
        label: "Filed under the right one",
        pair: [
          { value: "35.7%" },
          {
            value: "54%",
            note: "The other 46% never name an institution in their text. They are left blank, not guessed.",
          },
        ],
      },
    },
    {
      id: "studenti-rs/support",
      form: "flow",
      title: "Customer service, done by Grok bot",
      lead: "Simple questions get an answer without waiting for me.",
      caption:
        "A Grok bot answers questions and reviews payments every day, without me.",
      alt: "A flowchart in three lanes: the student, the Grok bot and me. Every day a student writes to info@: questions, payment reviews. The bot reads and sorts the mail and asks if it is simple. If yes, it checks the facts and replies in the site’s own voice, and the answer is sent without me. If not, I answer what it hands me: refunds, goodwill, billing disputes and legal.",
      lanes: { person: "Student", system: "Grok bot", me: "Me" },
      steps: [
        // The owner, 14 Nov 2026: "say "daily" addresses questions, payment reviews".
        {
          id: "write",
          kind: "box",
          actor: "person",
          title: "Writes to info@",
          reason: "Questions, payment reviews",
        },
        {
          id: "sort",
          kind: "box",
          actor: "model",
          title: "Reads it and sorts it",
        },
        {
          id: "simple",
          kind: "decision",
          actor: "model",
          title: "Simple?",
          reason: "Cancelling, deletion, “we’re checking”",
          branches: [
            { label: "Yes", says: "it answers on its own" },
            { label: "No", says: "it hands the mail to me" },
          ],
        },
        {
          id: "me",
          kind: "box",
          actor: "me",
          title: "I answer what it hands me",
          reason: "Refunds, goodwill, billing disputes and legal",
        },
        // Open: what the bot can see when it checks the facts (prototype
        // reason 4). No reason shown until the owner confirms it.
        {
          id: "facts",
          kind: "box",
          actor: "model",
          title: "Checks the facts before it writes",
        },
        {
          id: "reply",
          kind: "box",
          actor: "model",
          title: "Replies in the site’s own voice",
          reason: "Short paragraphs, the informal “ti”",
        },
        // No count (the owner, 14 Nov 2026): the end box says the reply is sent.
        {
          id: "end",
          kind: "end",
          actor: "model",
          title: "Answered and sent, without me.",
        },
      ],
      exits: [],
      key: [
        { actor: "model", label: "= a model" },
        { actor: "person", label: "= a person" },
      ],
    },
  ]
)
