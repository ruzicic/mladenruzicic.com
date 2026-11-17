import { z } from "zod"

import type { TrackEvent } from "@/lib/analytics"

import { hex, href, kebab, publicPath } from "./schema-base"
import {
  linkSchema,
  mediaSchema,
  mediaSlotObject,
  productSlugSchema,
  richTextSchema,
} from "./schema-products"

const seoSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).max(160),
})

/* -------------------------------------------------------------------------- */
/* Site                                                                       */
/* -------------------------------------------------------------------------- */

export const siteSchema = z.object({
  name: z.literal("Mladen Ružičić"),
  domain: z.literal("mladenruzicic.com"),
  url: z.literal("https://mladenruzicic.com"),
  /** The muted line under the name. No employer in it, ever. */
  line: z.string().min(1),
  description: z.string().min(1).max(160),
  location: z.object({
    region: z.literal("Ticino"),
    country: z.literal("CH"),
    /** How every page writes it. */
    label: z.literal("Ticino, Switzerland"),
    timeZone: z.literal("Europe/Zurich"),
  }),
  from: z.string().min(1),
  languages: z.array(z.string().min(1)).min(1),
  /** The year he built his first websites ("building websites since"). */
  buildingSince: z.number().int(),
  /**
   * `YYYY-MM-DD`, the last time the site's copy changed. The mirrors' and the
   * sitemap's date wherever an entry has no `updated` of its own. Move it by
   * hand when copy changes; never derive it from the clock.
   */
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
  links: z.object({
    booking: z.url(),
    email: z.email(),
    x: z.url(),
    linkedin: z.url(),
    github: z.url(),
    mentorcruise: z.url(),
    cv: z.literal("/cv.pdf"),
    /** The name the CV is saved under (`download`): ASCII, his name. */
    cvFilename: z.string().regex(/^[A-Za-z0-9-]+\.pdf$/),
  }),
  headshot: mediaSchema,
  newsletter: z.object({
    /**
     * The sign-up line in the landing footer. It posts to the Server Action
     * in `app/components/site/subscribe.ts`; false renders nothing.
     */
    enabled: z.boolean(),
    line: z.string().min(1),
    inputLabel: z.string().min(1),
    placeholder: z.string().min(1),
    submitLabel: z.string().min(1),
    /** Shown only once the provider has confirmed the sign-up. */
    thanks: z.string().min(1),
    /** Label of the hidden honeypot field (never seen or announced). */
    honeypotLabel: z.string().min(1),
    /** One short line each; the status row has room for one line. */
    errors: z.object({
      /** The address did not pass validation. */
      invalid: z.string().min(1).max(50),
      /** The server has no provider key configured. */
      unavailable: z.string().min(1).max(50),
      /** The provider refused the request, failed or timed out. */
      failed: z.string().min(1).max(50),
    }),
  }),
  /**
   * The one footer, the same on every page (owner, 15 Nov 2026): the ask
   * line, the contact line (`id="contact"`), the newsletter, the links row
   * and the station clock: the dial, the time (named `timeLabel` for screen
   * readers), then the `builtIn` line. A link with `download` is a file
   * (the CV, owner 16 Nov 2026): a plain `<a download>`, as About's button.
   */
  footer: z.object({
    ask: z.string().min(1),
    contact: richTextSchema,
    links: z
      .array(linkSchema.extend({ download: z.boolean().optional() }))
      .min(1),
    builtIn: z.string().min(1),
    timeLabel: z.string().min(1),
  }),
})
export type Site = z.infer<typeof siteSchema>

/* -------------------------------------------------------------------------- */
/* Landing                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A card's product clip: a short, silent loop of the product in use. It takes
 * the desktop still's place in the card. The `.webm` is offered first, the
 * `.mp4` (H.264, `+faststart`) is the fallback; `poster` is the still that
 * paints first, shows without JavaScript, under reduced motion and whenever
 * the clip is not playing, so it must be in `content/media.ts` with the same
 * proportions as the clip. `width` and `height` are the clip's own pixels;
 * the card reserves its frame from them. `alt` names the clip everywhere
 * (the poster's text alternative, the markdown mirror). The files are
 * checked on disk at build time (`lib/content/index.ts`).
 */
const clipFilesSchema = z.object({
  mp4: publicPath.regex(/\.mp4$/, "expected an .mp4 path"),
  webm: publicPath.regex(/\.webm$/, "expected a .webm path"),
  poster: publicPath,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})
export type ClipFiles = z.infer<typeof clipFilesSchema>

const cardClipSchema = clipFilesSchema.extend({
  alt: z.string().min(1),
  /**
   * The take for phones (the strip's `max-width: 720px`, where the stills
   * switch too), with its own proportions; the files above are then used
   * only above that width. A viewport only ever requests one of the two.
   * Same rules as the main take; the `alt` covers both.
   */
  narrow: clipFilesSchema.optional(),
  /**
   * How the clip sits on the card. `window` (default): whole, centred
   * between the pills and the title, for a clip whose action reaches its
   * foot (Zarez's popup). `bleed`: as wide as the card allows, from under
   * the pills down past the card's bottom edge, its lower part under the
   * caption band, as the stills sat; for a website whose page has to be
   * read at a size.
   */
  fit: z.enum(["window", "bleed"]).optional(),
})
export type CardClip = z.infer<typeof cardClipSchema>

/**
 * A project's actions on the landing (owner, 13 Nov 2026: "2 explicit
 * actions: website, case study. nothing else is a link unless very
 * obvious"). Wherever a project appears on `/` (an intro popover, a strip
 * card, a list row) it has at most these two links, both taken from the
 * product (`content/products.ts`): "Case study" when it has a `story`, and
 * "Website" when it has a `url`. Its name, picture, clip, card or row are
 * not links. `{name}` is the product's name and `{domain}` the bare domain,
 * so each link's accessible name says the project and where it goes on its
 * own; the visible word is part of it (WCAG 2.5.3).
 */
const projectActionsSchema = z.object({
  /** "Case study": `/work/<slug>`, in the same tab. */
  caseStudy: z.string().min(1),
  /** "Website": the outside site, in a new tab. */
  website: z.string().min(1),
  /** "{name} case study". */
  caseStudyName: z.string().includes("{name}"),
  /** "{name} website, {domain}, opens in a new tab". */
  websiteName: z.string().includes("{name}").includes("{domain}"),
  /**
   * The names of a list row that is itself the link, on phones (owner, 16
   * Nov 2026): "{name}, case study" and "{name}, website, opens in a new
   * tab". The row shows no word for the link, only an arrow at its end.
   */
  rowCaseStudyName: z.string().includes("{name}"),
  rowWebsiteName: z.string().includes("{name}"),
})
export type ProjectActions = z.infer<typeof projectActionsSchema>

/** One of a project's two links, ready to render (`getProjectLinks`). */
export interface ProjectLink {
  href: string
  /** The visible word, "Case study" or "Website". */
  label: string
  /** The accessible name, "TenderLift case study". */
  name: string
  /** The name of a phone's list row as this link, "TenderLift, case study". */
  rowName: string
}

/** A project's links on `/`: either, both or neither. */
export interface ProjectLinks {
  caseStudy?: ProjectLink
  /** `track`: its Fathom event, `website: <slug>` (`lib/analytics.ts`). */
  website?: ProjectLink & { domain: string; track: TrackEvent }
}

/**
 * The story sheet's copy. Not rendered since the strip lost its sheet
 * (owner, 12 Nov): a card goes straight to its story. Kept as data because
 * the Ask context (`lib/ask/context.ts`) reads the body and facts.
 */
const storySheetSchema = z.object({
  /** The mono path line, "/work/studenti-rs". */
  path: z.string().startsWith("/work/"),
  title: z.string().min(1),
  body: z.string().min(1),
  facts: z.array(z.string().min(1)).min(1),
  links: z.array(linkSchema).min(1),
})

export const workCardSchema = z.object({
  kind: z.literal("work"),
  ref: productSlugSchema,
  title: z.string().min(1),
  caption: z.string().min(1),
  /**
   * Top-left status pill, such as "2021 TO 2023". Optional: none for a
   * project that is simply live, the day job or on autopilot (owner, 16 Nov
   * 2026: "remove \"live\" and \"day job\" from cards on landing page",
   * then "remove \"autopilot\" tags from carousel on homepage"), and those
   * three words are refused.
   */
  pill: z
    .string()
    .min(1)
    .refine(
      (p) => !["LIVE", "DAY JOB", "AUTOPILOT"].includes(p.trim().toUpperCase()),
      {
        message:
          'no "LIVE", "DAY JOB" or "AUTOPILOT" pill on a strip card (owner, 16 Nov 2026): leave `pill` out',
      }
    )
    .optional(),
  // No action fields: the top-right actions come from the product
  // (`projectActionsSchema`).
  bg: hex,
  fg: hex,
  /**
   * Screenshots by viewport: desktop main image, the tablet capture the phone
   * board uses instead, and the phone overlay both use.
   */
  media: z
    .object({
      desktop: mediaSchema.optional(),
      tablet: mediaSchema.optional(),
      phone: mediaSchema.optional(),
      /**
       * Whose artwork it is, shown small under the caption, when the
       * pictures are someone else's (Shop Minis: Shopify's own art).
       */
      credit: z.string().min(1).optional(),
      /** The product clip, in place of the stills (see `cardClipSchema`). */
      clip: cardClipSchema.optional(),
    })
    .refine((m) => !m.clip || (!m.desktop && !m.tablet && !m.phone), {
      message:
        "a card with a `clip` shows it instead of its stills: drop desktop, tablet and phone",
      path: ["clip"],
    })
    .optional(),
  /** Data only, not rendered: see `storySheetSchema`. */
  sheet: storySheetSchema.optional(),
})
export type WorkCard = z.infer<typeof workCardSchema>

/**
 * The last card, the end title of the reel. `title` is the plain sentence
 * that assistive technology and the markdown mirror get; if it holds " not ",
 * the card draws it as the sentence without that word plus an editor's
 * insertion of it (`EndCard` in Strip.tsx). `body` carries `{n}`: the number
 * of `/work` entries with no card in the strip, counted from content
 * (`getStripRest()`), never typed in.
 */
export const moreCardSchema = z.object({
  kind: z.literal("more"),
  title: z.string().min(1),
  body: z.string().includes("{n}"),
  link: linkSchema,
})
export type MoreCard = z.infer<typeof moreCardSchema>

export const listRowSchema = z.object({
  ref: productSlugSchema,
  /** Visible name, where it differs from the product ("FontAlternatives"). */
  name: z.string().min(1),
  year: z.string().min(1).optional(),
  /** "Running. My main product." */
  what: z.string().min(1),
  // No `href`: a row's links come from its product (`story`, `url`), on
  // `/` and `/work` alike (`getProjectLinks`).
  /** The cursor-carried preview card (desktop, hover intent only). */
  preview: z.object({
    caption: z.string().min(1),
    /** A still, or the full-length capture when `scroll` is set. Omitted: the product's mark. */
    image: publicPath.optional(),
    /** The capture glides top to bottom after a short delay; shows the SCROLLING tag. */
    scroll: z.boolean().optional(),
    /** Draw these letters instead of the product's own mark. */
    letters: z.string().min(1).max(2).optional(),
    /**
     * Where the full-length capture stops gliding, as a fraction of its
     * height (studenti.rs: the lower part of its capture is unusable).
     * Omitted: the glide runs to the end.
     */
    stopAt: z.number().gt(0).lte(1).optional(),
  }),
})
export type ListRow = z.infer<typeof listRowSchema>

const listGroupSchema = z.object({
  label: z.string().min(1),
  /** Rows shown before "Show all". */
  visible: z.number().int().positive(),
  rows: z.array(listRowSchema).min(1),
})

export const builtListSchema = z.object({
  id: z.literal("everything"),
  title: z.string().min(1),
  groups: z.array(listGroupSchema).min(1),
  showAllLabel: z.string().min(1),
  showFewerLabel: z.string().min(1),
  scrollingTag: z.string().min(1),
})
export type BuiltList = z.infer<typeof builtListSchema>

const howIWorkSchema = z.object({
  id: z.literal("how-i-work"),
  title: z.string().min(1),
  steps: z
    .array(
      z.object({
        n: z.string().regex(/^\d{2}$/),
        title: z.string().min(1),
        body: z.string().min(1),
      })
    )
    .length(4),
})
export type HowIWork = z.infer<typeof howIWorkSchema>

export const homeSchema = z.object({
  seo: seoSchema,
  headline: z.object({
    /** The whole sentence, for screen readers and for no-JS. */
    srText: z.string().min(1),
    prefix: z.string().min(1),
    phrases: z
      .array(
        z.object({
          ref: productSlugSchema,
          phrase: z.string().min(1),
          /** The product line under the headline, "on TenderLift". */
          on: z.string().min(1),
        })
      )
      .length(5),
    /** All five product lines in one sentence, for screen readers. */
    onSrText: z.string().min(1),
    paceMs: z.number().int().positive(),
    pauseLabel: z.string().min(1),
    playLabel: z.string().min(1),
  }),
  stance: z.string().min(1),
  /** The words of a project's two links, everywhere on `/`. */
  actions: projectActionsSchema,
  paragraphs: z.array(richTextSchema).length(4),
  recentWork: z.object({
    title: z.string().min(1),
    /** `{n}` the card in focus, `{total}` the count. */
    counterFormat: z.string().includes("{n}"),
    prevLabel: z.string().min(1),
    nextLabel: z.string().min(1),
    regionLabel: z.string().min(1),
    regionLabelTouch: z.string().min(1),
    cards: z
      .array(z.discriminatedUnion("kind", [workCardSchema, moreCardSchema]))
      .length(10),
  }),
  list: builtListSchema,
  howIWork: howIWorkSchema,
  /**
   * The pressed paper on `/` (owner, 14 Nov 2026, the lab's "Memory
   * Sheet"): a press dents the page and a drag carves a groove that heals.
   * Desktop with a mouse and WebGPU only (`app/components/landing/dent/`).
   * `false` removes it entirely.
   */
  dent: z.boolean(),
  mentoring: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    testimonial: kebab,
    /** Line under the mentee's name. */
    role: z.string().min(1),
    link: linkSchema,
  }),
})
export type Home = z.infer<typeof homeSchema>

/* -------------------------------------------------------------------------- */
/* Ask: the prepared questions and answers                                    */
/* -------------------------------------------------------------------------- */

export const askCardSchema = z.discriminatedUnion("kind", [
  /** A live product: screenshot, tile, status, its own headline, link out. */
  z.object({
    kind: z.literal("product"),
    ref: productSlugSchema,
    href: z.url(),
    image: mediaSchema,
    title: z.string().min(1),
    status: z.string().min(1),
    quote: z.string().min(1),
    linkLabel: z.string().min(1),
  }),
  /** A row link with a picture, a tile or an icon in front. */
  z.object({
    kind: z.literal("link"),
    href,
    title: z.string().min(1),
    body: z.string().min(1),
    visual: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("image"), image: mediaSchema }),
      z.object({ kind: z.literal("tile"), ref: productSlugSchema }),
      z.object({
        kind: z.literal("icon"),
        icon: z.enum(["mail", "list", "calendar"]),
      }),
    ]),
  }),
  /** The short bio with a copy button; the text is `getPress().shortBio`. */
  z.object({
    kind: z.literal("bio"),
    label: z.string().min(1),
    copyLabel: z.string().min(1),
    copiedLabel: z.string().min(1),
    /** Shown instead of `copiedLabel` when the browser refuses the write. */
    failedLabel: z.string().min(1),
    note: z.string().min(1),
    link: linkSchema,
  }),
])
export type AskCard = z.infer<typeof askCardSchema>

const askQuestionSchema = z.object({
  id: kebab,
  /** The suggestion chip. */
  chip: z.string().min(1),
  /** The question as it appears once asked. */
  question: z.string().min(1),
  answer: z.string().min(1),
  /** Mono source line under the answer. */
  source: z.string().min(1),
  /** The page or section the source line cites; the line links there. */
  sourceHref: href.optional(),
  card: askCardSchema,
  /** Lower-case words a typed question is matched on (simple overlap). */
  keywords: z
    .array(
      z.string().regex(/^[\p{Ll}\p{N}'-]+$/u, "expected one lower-case word")
    )
    .min(3),
})
export type AskQuestion = z.infer<typeof askQuestionSchema>

export const askSchema = z.object({
  label: z.string().min(1),
  closeLabel: z.string().min(1),
  ariaOpen: z.string().min(1),
  dialogLabel: z.string().min(1),
  title: z.string().min(1),
  note: z.string().min(1),
  suggestionsLabel: z.string().min(1),
  inputLabel: z.string().min(1),
  placeholder: z.string().min(1),
  sendLabel: z.string().min(1),
  thinkingVerbs: z.array(z.string().min(1)).min(1),
  footNote: z.string().min(1),
  /** `{n}` the turn, `{max}` the limit. */
  turnFormat: z.string().includes("{n}"),
  maxTurns: z.number().int().positive(),
  /** Prepared questions, answered instantly and without the live model. */
  questions: z.array(askQuestionSchema).min(6).max(10),
  /** How many suggestion chips the panel shows at once (the first ones). */
  chipsShown: z.number().int().min(1).max(10),
  /** A typed question that matches none of them, with no live model. */
  fallback: z.object({
    answer: z.string().min(1),
    source: z.string().min(1),
    card: askCardSchema,
  }),
  /**
   * Copy for the live model (`workers/ask`), used only when both
   * `NEXT_PUBLIC_ASK_ENDPOINT` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` are set.
   * `sourcePrefix` starts the source line ("FROM · ABOUT"). `checking` and
   * `interactive` are shown while the Turnstile check runs. `messages` has
   * one line for every way a typed question can end without an answer
   * (`lib/ask/protocol.ts`); `{wait}` in `rate_limited` becomes a phrase
   * from `wait`. `cutShort` follows an answer whose stream broke off.
   */
  live: z.object({
    footNote: z.string().min(1),
    sourcePrefix: z.string().min(1),
    noSource: z.string().min(1),
    checking: z.string().min(1),
    interactive: z.string().min(1),
    cutShort: z.string().min(1),
    messages: z.object({
      challenge_failed: z.string().min(1),
      rate_limited: z.string().includes("{wait}"),
      daily_limit: z.string().min(1),
      budget_reached: z.string().min(1),
      unavailable: z.string().min(1),
      bad_request: z.string().min(1),
    }),
    wait: z.object({
      moment: z.string().min(1),
      minute: z.string().min(1),
      /** `{n}` the number of minutes. */
      minutes: z.string().includes("{n}"),
    }),
  }),
})
export type Ask = z.infer<typeof askSchema>

/* -------------------------------------------------------------------------- */
/* Mentoring                                                                  */
/* -------------------------------------------------------------------------- */

export const mentoringSchema = z.object({
  seo: seoSchema,
  /** The label beside the name in the header. */
  section: z.string().min(1),
  title: z.string().min(1),
  intro: richTextSchema,
  /**
   * The figures under the intro: a value in Geist Serif and its label. Public
   * figures only; `href` turns the label into a link (external when absolute).
   */
  numbers: z
    .array(
      z.object({
        value: z.string().min(1),
        label: z.string().min(1),
        href: href.optional(),
      })
    )
    .min(1)
    // One row of equal columns at every width (owner, 15 Nov 2026: three).
    .max(3),
  said: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    /** The pile, top card first: testimonial id plus the board's paper tone and tilt. */
    pile: z
      .array(
        z.object({
          testimonial: kebab,
          tone: hex,
          /** Degrees while the card is the top one, and once it has settled. */
          rot: z.number(),
          rest: z.number(),
        })
      )
      .min(1),
    /** The caption's second line: `{duration}` from the testimonial. */
    durationFormat: z.string().includes("{duration}"),
    /** `{n}` of `{total}`. */
    counterFormat: z.string().includes("{n}"),
    nextLabelFormat: z.string().includes("{n}"),
    pauseLabel: z.string().min(1),
    playLabel: z.string().min(1),
  }),
  fit: z.object({
    title: z.string().min(1),
    items: z.array(z.string().min(1)).min(1),
  }),
  notFit: z.object({
    title: z.string().min(1),
    items: z.array(z.string().min(1)).min(1),
  }),
  how: z.object({
    title: z.string().min(1),
    steps: z
      .array(
        z.object({ n: z.string().regex(/^\d{2}$/), text: z.string().min(1) })
      )
      .min(1),
  }),
  /**
   * The closing block after "How it works" (owner, 15 Nov 2026: "include
   * booking link on my mentoring page"): a line, the page's one action, and
   * a quiet second way in.
   */
  cta: z.object({
    line: z.string().min(1),
    action: linkSchema,
    alt: richTextSchema,
  }),
})
export type Mentoring = z.infer<typeof mentoringSchema>

/* -------------------------------------------------------------------------- */
/* About                                                                      */
/* -------------------------------------------------------------------------- */

export const factSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
})
export type Fact = z.infer<typeof factSchema>

export const aboutSchema = z
  .object({
    seo: seoSchema,
    section: z.string().min(1),
    headshot: mediaSchema,
    title: z.string().min(1),
    paragraphs: z.array(richTextSchema).min(2),
    /**
     * The early projects, a carousel inside the story (owner, 15 Nov 2026:
     * layout B, the picture beside the words): it sits after the first
     * `after` paragraphs, which end on the early line, and the story resumes
     * under it. One slide per frame; a frame without `src` stays an empty
     * labelled slot. `caption` is the name and year, `text` its line of
     * context. `label` names the carousel; `counterFormat` and
     * `slideLabelFormat` take `{n}` and `{total}`.
     */
    early: z.object({
      after: z.number().int().min(1),
      label: z.string().min(1),
      counterFormat: z.string().includes("{n}").includes("{total}"),
      slideLabelFormat: z.string().includes("{n}").includes("{total}"),
      prevLabel: z.string().min(1),
      nextLabel: z.string().min(1),
      frames: z
        .array(
          mediaSlotObject.extend({
            caption: z.string().min(1),
            text: z.string().min(1),
          })
        )
        .min(2)
        .max(4),
    }),
    cv: z.object({
      title: z.string().min(1),
      rows: z
        .array(
          z.object({
            ref: productSlugSchema,
            year: z.string().min(1),
            /** The role, after the company's name (owner, 15 Nov 2026). */
            role: z.string().min(1),
            text: z.string().min(1),
          })
        )
        .min(1),
      download: z.object({
        label: z.string().min(1),
        href: z.literal("/cv.pdf"),
      }),
    }),
    /**
     * The postscript after the CV (15 Nov 2026): the sentence with the
     * game's tile and the avatar group of the champions he played, and a
     * button that runs Nocturne's "Paranoia" with its sound. `enabled` turns
     * the whole block off, `effect` only the button (like `HOME.dent`).
     * `cursor`: an optional cursor image, used over the block and across the
     * page during a run.
     */
    postscript: z
      .object({
        enabled: z.boolean(),
        effect: z.boolean(),
        lead: z.string().min(1),
        before: z.string().min(1),
        game: z.object({ name: z.string().min(1), icon: publicPath }),
        champions: z
          .array(z.object({ name: z.string().min(1), src: publicPath }))
          .min(1)
          .max(3),
        after: z.string().min(1),
        cta: z.string().min(1),
        sign: z.string().min(1),
        /** The screen-reader status line while it runs. */
        status: z.string().min(1),
        sound: publicPath,
        cursor: z
          .object({
            src: publicPath,
            /** Hotspot, image px. */
            x: z.number().int().min(0),
            y: z.number().int().min(0),
          })
          .optional(),
      })
      .optional(),
  })
  .refine((a) => a.early.after < a.paragraphs.length, {
    message: "`early.after` must leave a paragraph after the carousel",
    path: ["early", "after"],
  })
export type About = z.infer<typeof aboutSchema>

/* -------------------------------------------------------------------------- */
/* /cv                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * A CV period, as he writes it: "Oct 2023 to present", "Apr 2021 to May
 * 2023", "2021 to present", or one year ("2026"). Never capitals, never a
 * dash (the site's copy rules).
 */
const cvDates = z
  .string()
  .regex(
    /^(?:(?:[A-Z][a-z]{2} )?\d{4} to (?:(?:[A-Z][a-z]{2} )?\d{4}|present)|\d{4})$/,
    'expected "Mon YYYY to Mon YYYY", "YYYY to present" or "YYYY"'
  )

/** One sentence or bullet of his CV, word for word. */
const cvText = z.string().min(1)

const cvRoleSchema = z.object({
  title: z.string().min(1),
  dates: cvDates,
  bullets: z.array(cvText).min(1),
})

/**
 * One job. A job with one role names it (`role`) and has its `bullets`; a
 * job with several (ZF) has the progression `line` and its `roles`, newest
 * first. `ref` ties it to `content/products.ts` and to the About CV row
 * (`checkCv` in `lib/content/index.ts`).
 */
const cvJobSchema = z
  .object({
    ref: productSlugSchema,
    company: z.string().min(1),
    dates: cvDates,
    role: z.string().min(1).optional(),
    line: cvText.optional(),
    bullets: z.array(cvText).min(1).optional(),
    roles: z.array(cvRoleSchema).min(2).optional(),
  })
  .refine(
    (j) =>
      j.role && j.bullets
        ? !j.roles && !j.line
        : Boolean(j.roles && j.line && !j.bullets),
    {
      message:
        "a job has either `role` and `bullets`, or `line` and two or more `roles`",
    }
  )

/** A project or the mentoring entry: name · role · dates · domain, then a sentence. */
const cvProjectSchema = z.object({
  ref: productSlugSchema.optional(),
  name: z.string().min(1),
  role: z.string().min(1).optional(),
  dates: cvDates,
  /** The link's text, as he writes it ("tenderlift.ch", "mentors.to/ruzicic"). */
  domain: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}(?:\/[\w-]+)?$/),
  href: z.url(),
  text: cvText,
})

/**
 * `/cv` and `/cv.pdf` (owner, 17 Nov 2026: "/cv postaje stranica na sajtu,
 * sa opcijom 'download PDF'"). His CV document word for word, except the
 * contact line, which is the site's own (no phone, ever).
 */
export const cvSchema = z.object({
  seo: seoSchema,
  name: z.literal("Mladen Ružičić"),
  /** The two lines under the name: his role, then where he lives. No employer. */
  headline: z.object({
    role: z.string().min(1),
    location: z.literal("Ticino, Switzerland"),
  }),
  headshot: mediaSchema,
  /** The contact line: the site's email, domain and LinkedIn, as text and link. */
  contact: z
    .array(
      z.object({
        text: z.string().min(1),
        href: z.string().regex(/^(mailto:|https:\/\/)/),
      })
    )
    .min(1),
  summary: z.array(cvText).min(1).max(3),
  download: z.object({
    label: z.string().min(1),
    href: z.literal("/cv.pdf"),
  }),
  /** The top row's close control: back where the visitor came from, else `href`. */
  close: z.object({ label: z.string().min(1), href: z.literal("/about") }),
  experience: z.object({
    title: z.string().min(1),
    jobs: z.array(cvJobSchema).min(1),
  }),
  projects: z.object({
    title: z.string().min(1),
    items: z.array(cvProjectSchema).min(1),
  }),
  mentoring: z.object({
    title: z.string().min(1),
    items: z.array(cvProjectSchema).min(1),
  }),
  /** Labelled lines ("Product: …"), one line each. */
  skills: z.object({
    title: z.string().min(1),
    groups: z
      .array(
        z.object({
          label: z.string().min(1),
          items: z.array(z.string().min(1)).min(1),
        })
      )
      .min(1),
  }),
})
export type Cv = z.infer<typeof cvSchema>
export type CvJob = Cv["experience"]["jobs"][number]
export type CvEntry = Cv["projects"]["items"][number]

/* -------------------------------------------------------------------------- */
/* Press                                                                      */
/* -------------------------------------------------------------------------- */

export const pressSchema = z.object({
  seo: seoSchema,
  title: z.string().min(1),
  shortBio: z.object({ label: z.string().min(1), text: z.string().min(1) }),
  /** Absent until he writes or approves one; then the block is not rendered. */
  longBio: z
    .object({ label: z.string().min(1), text: z.string().min(1) })
    .optional(),
  oneLiners: z.object({
    label: z.string().min(1),
    items: z.array(z.string().min(1)).min(1),
  }),
  /** The copy buttons on the page: one-liner label, confirmation, failure. */
  copy: z.object({
    label: z.string().min(1),
    copiedLabel: z.string().min(1),
    failedLabel: z.string().min(1),
  }),
  headshot: z.object({
    label: z.string().min(1),
    image: mediaSchema,
    /** The file the download link serves, and its saved name. */
    download: z.object({ href: publicPath, filename: z.string().min(1) }),
    variants: z.array(publicPath),
  }),
  facts: z.object({
    label: z.string().min(1),
    items: z.array(factSchema).min(1),
  }),
  /** The right-click (long-press on phones) menu on his name. */
  menu: z.object({
    hint: z.string().min(1),
    ariaLabel: z.string().min(1),
    copyLabel: z.string().min(1),
    copiedLabel: z.string().min(1),
    /** Shown instead of `copiedLabel` when the browser refuses the write. */
    failedLabel: z.string().min(1),
    downloadLabel: z.string().min(1),
    pressKitLabel: z.string().min(1),
    pressKitHref: z.literal("/press"),
    foot: z.string().min(1),
  }),
})
export type Press = z.infer<typeof pressSchema>

/* -------------------------------------------------------------------------- */
/* /work index                                                                */
/* -------------------------------------------------------------------------- */

export const workPageSchema = z.object({
  seo: seoSchema,
  title: z.string().min(1),
  intro: z.string().min(1),
  /** Interface words on the `/work/<slug>` story template. */
  story: z.object({
    /** The numbers row's accessible name. */
    numbers: z.string().min(1),
    people: z.string().min(1),
    /** The role timeline's accessible name (a list, no visible heading). */
    roles: z.string().min(1),
    /** The next-story link's landmark name, and the short cue beside it. */
    next: z.string().min(1),
    nextCue: z.string().min(1),
    pause: z.string().min(1),
    play: z.string().min(1),
    /**
     * The bar's accessible name once it leads to the top of the page;
     * `{name}` is the project's name, which the bar then shows.
     */
    toTop: z.string().includes("{name}"),
  }),
})
export type WorkPage = z.infer<typeof workPageSchema>

/* -------------------------------------------------------------------------- */
/* 404 and the error page                                                     */
/* -------------------------------------------------------------------------- */

/** `app/not-found.tsx`: a mono label, one serif line, a sentence, links. */
export const notFoundSchema = z.object({
  seo: seoSchema,
  /** The small mono label above the line ("404"). */
  label: z.string().min(1),
  title: z.string().min(1),
  line: z.string().min(1),
  links: z.array(linkSchema).min(1),
})
export type NotFound = z.infer<typeof notFoundSchema>

/**
 * `app/error.tsx` and the lazy islands' fallback. The error boundary is a
 * client component, so `content/pages/error.ts` is a plain object (type-only
 * import, no zod in the client bundle); `lib/content/index.ts` validates it.
 */
export const errorPageSchema = z.object({
  label: z.string().min(1),
  title: z.string().min(1),
  line: z.string().min(1),
  retryLabel: z.string().min(1),
  links: z.array(linkSchema).min(1),
})
export type ErrorPage = z.infer<typeof errorPageSchema>
