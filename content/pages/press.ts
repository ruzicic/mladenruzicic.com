import { parseOrThrow, pressSchema, type Press } from "@/lib/content/schema"
import { ABOUT } from "@/content/pages/about"
import { MENTORING } from "@/content/pages/mentoring"
import { PRODUCTS } from "@/content/products"
import { SITE } from "@/content/site"

/**
 * `/press`. No board exists for the page, so it is assembled only from copy
 * that is already on the boards: the short bio from the press menu on his
 * name (`SHORT_BIO` in Landing.dc.html, the same text the Ask bio card
 * copies), the one-liners from the landing (the line under the name), the
 * facts (from About until 15 Nov 2026, when that page dropped them; they
 * live here now), and the headshot. No new prose: a longer bio appears only
 * once he writes or approves one (`longBio`, optional; not set).
 *
 * Derived, never retyped (owner, 16 Nov 2026: "ensure PRESS page is always
 * updated when changing about/work pages!"). Every fact that already exists
 * elsewhere in `content/` is read from there: where he lives, where he is
 * from, his languages and first year (`content/site.ts`), the one-liner
 * (`SITE.line`), the headshot (`SITE.headshot`), the day job's role (the
 * first CV row in `content/pages/about.ts`), product names and years
 * (`content/products.ts`), the mentoring figures (`content/pages/mentoring.ts`).
 *
 * Hand-written, and checked against their sources when the content loads
 * (`checkPress` in `lib/content/index.ts`, which fails the build), because
 * no field holds them on their own: the short bio, the day job's team
 * (`DAY_JOB_TEAM`, against the CV line and the ZF case study's role) and the
 * TenderLift role (`OWN_PRODUCT_ROLE`, against the TenderLift case study's
 * role). `tests/press.spec.ts` checks the served page against the same
 * sources.
 */

function product(slug: string) {
  const p = PRODUCTS.find((x) => x.slug === slug)
  if (!p) throw new Error(`content/pages/press.ts: no product "${slug}".`)
  return p
}

/** "2008" from "2008 to now". */
function firstYear(year: string | undefined, slug: string) {
  const y = year?.match(/\b\d{4}\b/)?.[0]
  if (!y) throw new Error(`content/pages/press.ts: "${slug}" has no year.`)
  return y
}

function mentoringNumber(test: (label: string) => boolean, what: string) {
  const n = MENTORING.numbers.find((x) => test(x.label))
  if (!n) throw new Error(`content/pages/press.ts: no mentoring ${what}.`)
  return n.value
}

const ZF = product("zf-scalar")
const TENDERLIFT = product("tenderlift")
const STUDENTI = product("studenti-rs")
const DAY_JOB = ABOUT.cv.rows.find((r) => r.ref === ZF.slug)
if (!DAY_JOB) throw new Error("content/pages/press.ts: ZF is not in the CV.")

/** The team at ZF, as the CV line and the ZF case study's role name it. */
export const DAY_JOB_TEAM = "Driver Experience team"
/** His role at TenderLift, as the TenderLift case study's `role` starts. */
export const OWN_PRODUCT_ROLE: string = "Co-founder"

const MENTORING_SINCE = MENTORING.seo.description.match(/since (\d{4})/)?.[1]
if (!MENTORING_SINCE)
  throw new Error(
    "content/pages/press.ts: the mentoring description no longer says since when."
  )

export const PRESS: Press = parseOrThrow(
  pressSchema,
  {
    seo: {
      title: "Press",
      description: "Short bio, one-liners, facts and a headshot.",
    },
    title: "Press",
    shortBio: {
      label: "SHORT BIO · ENGLISH",
      text: "Mladen Ružičić is a product owner and founder based in Ticino, Switzerland. By day he is Global Product Owner at ZF, for the Driver Experience team, working on tools truck drivers use every day. Outside work he runs TenderLift, which helps Swiss companies win public tenders. He also keeps a few products running on autopilot, among them studenti.rs, online since 2008. At Shopify he helped build Shop Minis from zero.",
    },
    oneLiners: {
      label: "ONE-LINERS",
      items: [SITE.line],
    },
    headshot: {
      label: "HEADSHOT",
      image: {
        src: "/static/press/mladen-ruzicic-1024.webp",
        alt: SITE.headshot.alt,
      },
      download: {
        href: SITE.headshot.src,
        filename: SITE.headshot.src.split("/").pop()!,
      },
      variants: [
        SITE.headshot.src,
        "/static/press/mladen-ruzicic-1024.webp",
        "/static/press/mladen-ruzicic-512.webp",
      ],
      // The owner's choice, 2026-11-17: open use, with credit.
      terms: `Free to use in articles, talks and event listings about me, with credit to ${SITE.name}.`,
    },
    copy: { label: "Copy", copiedLabel: "Copied", failedLabel: "Copy failed" },
    facts: {
      label: "FACTS",
      items: [
        { label: "BASED IN", value: SITE.location.label },
        { label: "FROM", value: SITE.from },
        {
          label: "LANGUAGES",
          // The note is about the last of them, Italian.
          value: `${SITE.languages.join(", ")} (seven years in, still learning)`,
        },
        { label: "BUILDING SINCE", value: String(SITE.buildingSince) },
        {
          label: "LONGEST-RUNNING",
          value: `${STUDENTI.name}, online since ${firstYear(STUDENTI.year, STUDENTI.slug)}`,
        },
        {
          label: "DAY JOB",
          value: `${DAY_JOB.role} at ${ZF.name}, ${DAY_JOB_TEAM}`,
        },
        {
          label: "OWN PRODUCT",
          value: `${OWN_PRODUCT_ROLE} of ${TENDERLIFT.name}`,
        },
        {
          label: "MENTORING",
          value: `${mentoringNumber((l) => l === "average rating", "rating")} from ${mentoringNumber((l) => l.startsWith("reviews"), "review count")} reviews on MentorCruise, mentoring since ${MENTORING_SINCE}`,
        },
      ],
    },
    menu: {
      hint: "Right-click for bio and photo",
      ariaLabel: "Press",
      copyLabel: "Copy short bio",
      copiedLabel: "Copied",
      failedLabel: "Copy failed",
      downloadLabel: "Download headshot",
      pressKitLabel: "Open the press kit",
      pressKitHref: "/press",
      foot: "FOR PRESS AND EVENT ORGANISERS",
    },
  },
  "content/pages/press.ts"
)
