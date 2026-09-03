# Open questions

Everything in `content/` that is flagged `needs-verification`, deliberately left out, or guessed — grouped by file. Nothing here blocks the build; all of it blocks a confident launch.

Rule applied throughout: no placeholder strings, no private metrics, and no invented facts. Where a required field had no source, it carries `approx: true` and appears below.

**Last closed:** 2026-09-03, on the owner's own answers. That pass settled the Boxium domain (`boxium.ch`, live, with a mark and screenshots), Nunium (screenshots taken before the site comes down, the live link replaced with a Wayback capture), the FontAlternatives start date (January 2026), the three Serbian surnames, the ZF adoption percentages, Josip Kozić's profile and photo, and studenti.rs's attribution (his own product, not Nemestic's). The 2026-09-02 pass before it settled the employment dates, the ZF / Shopify / studenti.rs / FontAlternatives / FontSwap metrics and the "worked alongside" entries against LinkedIn, the live listings and Search Console. What is left below is what neither pass could settle.

---

## content/companies.ts

**studenti.rs predates the Nemestic band by two years.** Nemestic now runs Feb 2010 – Jul 2011, but studenti.rs went live in 2008 and the case study calls you its original developer. The band summary says so plainly ("it went live in 2008; the contract dates on this band start later, in 2010"), and `SITE.yearsShipping` is anchored on the product rather than on employment. Confirm that is the right story — were you building for the studio before you were formally on its books, or did studenti.rs start somewhere else?

**Logos.** `public/static/logos/mono/` now holds all six employer marks (ZF SCALAR, Shopify, HEGIAS, WolkAbout, Execom, Nemestic), and `public/static/logos/work/` holds eighteen project marks — see the provenance and licensing notes in each directory's `SOURCES.md`. `content/companies.ts` and every `content/work/*.mdx` `logo` field point at real files. Decide only whether you are comfortable with third-party trademarks (ZF, Shopify, HEGIAS, WolkAbout, Trello, Internxt) being etched on the hero shards under nominative fair use — the sourcing notes lay out the reasoning.

**Shopify colour, resolved.** The band is `#95BF47`, sampled from the official bag asset (`shopify_glyph.svg` in Shopify's own brand-assets zip). `content/companies.ts` and `content/work/shopify.mdx` both carry it now; the old `#96BF48` placeholder is gone.

---

## content/people.ts

- **All five now have a LinkedIn URL, a photo, a `why` and a `note`.** Josip Kozić came to parity on 2026-09-03, on the owner's supplied profile link. Nothing structural is missing from this file any more.
- **The `note` lines are mine, not yours.** Each one is assembled from the person's own public profile — current role, shared employers, overlap years — because that is all a profile supports. They read as accurate rather than as warm. **Replace all five with your own sentences before launch;** this is the one place on the site where a generic line is worse than none.
- **Photos are LinkedIn screenshots.** `public/static/people/*.webp` are 320×320 crops of 570px profile images, captured 2026-09-02 (Josip's on 2026-09-03), not originals. They are fine at the sizes the popover uses. Worth asking the five of them whether they mind their photo being here at all.

---

## content/work/zf-scalar.mdx

- Confidentiality is `limited`: no screenshots, no internal tooling names, no roadmap detail. Dossier §12 asks which ZF visuals can be shown — currently none are referenced.
- No `links`. Is there a public ZF SCALAR or Velocity page worth linking to?

## content/work/shopify.mdx

- `30M+` Shop.app monthly active users and the `10` first building partners are now `verified` and both appear in the outcome paragraph. If either is a number Shopify would rather you did not publish, this is the place to say so.
- Dossier §12 asks whether the **Shopify checkout contribution should be mentioned prominently**. Currently it is one clause in "Role and scope" and one line in the company summary — deliberately understated. Raise or remove?
- The entry mentions the **May 2023 layoff** in "Outcome", framed neutrally, matching what the current about page already says publicly. Say so if you would rather it were dropped.

## content/work/hegias.mdx

- Dossier flags "exact title" as unverified — currently "Full-stack team lead".
- Dossier flags "names of the 3D model websites integrated" — deliberately left generic ("popular third-party 3D model libraries"). Name them if they can be named.
- No metrics at all; the Outcome section says so explicitly. Anything HEGIAS is happy to have published?
- Links to `hegias.com` — confirm the company and that URL are still live.

## content/work/wolkabout.mdx

- `5–6` engineers led — `needs-verification`.
- Links to the npm package `@wolkabout/wolk-rest` and the Web Archive snapshot of wolkabout.com. Confirm the npm package is still published and that linking it is fine.
- "Micro frontends" and "Nx monorepo" come from the current `app/work/page.tsx`; the dossier only says Angular/RxJS. Confirm.

## content/work/tenderlift.mdx

- **No metrics at all**, by design. Users, traffic and revenue are private per the dossier. If you want anything public (e.g. cantons covered, sources monitored, languages), say which.
- The AI section names ARGUS and Graphiti in the dossier; both are described generically here ("long-running agents", "a memory layer") to avoid exposing internals. Name them publicly?
- Nothing about ingestion or scraping mechanics is described, per the dossier's instruction.

## content/work/studenti-rs.mdx

- `45k` documents is now `verified` on your confirmation, alongside `250k` registered users. Note the live homepage badges round to **40.000+** and **250.000+**, so a visitor who clicks through sees a smaller document number than the case study claims. Worth reconciling one way or the other.
- Revenue is stated as private in the body and no figure appears anywhere.
- The 2008 build date and the 2022 buy-back are treated as verified (both appear on the current site).
- **`company: "nemestic"` is gone** (2026-09-03, your call): studenti.rs is your product, not the employer's. The Nemestic connection now lives in `detail` and in "Role and scope", which links to the Nemestic band on the homepage timeline, and the band's own summary and `fact` still carry it. Nothing else read `company` for this entry except the case-study and card chips, which now show the role instead.

## content/work/fontalternatives.mdx

- **Start date settled:** `2026-01`, confirmed by you on 2026-09-03, and `approx` is gone. It matches your LinkedIn project entry (Jan 2026 – Present) and the Search Console chart, which starts flat in January 2026. The homepage timeline's independent row now prints 2026 next to the marker.
- Traffic metrics are `verified` and dated: `16.4K` monthly visits (mid-2026) and `28.3K` Google search clicks over the 16-month Search Console window. Both go stale — decide how often you want to refresh them, or drop the monthly-visits figure and keep only the chart. Note the window now starts before the project does: it is the property's 16 months to August 2026, and the chart shows why the first eight are flat.
- The dossier mentions an article documenting the content flywheel. **Reference removed** because `/notes` is deferred and there is nowhere to link. Where is it published?

## content/work/fontswap.mdx

- `309` Chrome Web Store users, read from the live listing on 2026-09-02 and dated in the label so it ages honestly. It is still a live counter; re-read it at launch.
- Period `2024 – now`, `approx: true` — **no source for the start date at all.** Guessed from its relationship to FontAlternatives, which is now dated January 2026, so a 2024 FontSwap cannot be right either. Give it a real date.

## content/work/avataurus.mdx

- `1.67K` unique visitors and `50.41K` requests per month — both `needs-verification` (dossier §12 asks to verify Avataurus traffic).
- Period `2025 – now`, `approx: true` — **no source for the start date.**
- "Built almost entirely from a phone" is kept because it is a genuine detail; confirm you are happy having it public.

## content/work/montepop.mdx

- Period `2025 – now`, `approx: true` — **no source.**
- Kids/family context is deliberately absent per the hard constraint; the entry is framed purely as an educational-product interest.
- No metrics, nothing claimed — it is pre-MVP.

## content/work/boxium.mdx

- Period `2024 – 2025`, `approx: true` — **no source.**
- Framed as "paused because of time constraints", per the failure-framing rules. The body says TenderLift took the hours; confirm that is the reason you want in public.
- **Domain settled:** the product is at `boxium.ch` (2026-09-03, your answer); `boxium.com` is parked and belongs to someone else. `url`, `links`, three screenshots and a mark derived from the site's own favicon all ship now.
- **`status` stays `paused` while boxium.ch is live and selling.** That is your call and it is recorded here, but a reader who clicks through sees a working service with a phone number and a price. Say if "paused" should become something else.
- The `tech` list says Next.js / TypeScript / Postgres; boxium.ch is served as a static Astro build. If the shipped site is not the product you built, the list needs revisiting.

## content/work/panciona.mdx

- Period `2021`, `approx: true` — taken from the year on the current work page.
- **`url` omitted.** The dossier lists `panciona.com`, but the product is stopped and I cannot confirm the domain is still yours or still resolving. Add the link if it is.
- Framed as "did not find product-market fit" and "founder-market fit was weak"; the word "failed" is not used.

## content/work/hi-fam.mdx

- Period `2023`, `approx: true` — **no source at all.** Guessed.
- `10+` letters of intent — `needs-verification`.
- **No URL** — none in the dossier.
- The cofounder is not named, not described beyond "a music-industry expert", and not criticised. Framing is "stopped after founder alignment broke down".

## content/work/flexmatch.mdx

- Period `2024`, `approx: true` — **no source.** Guessed.
- **`url` omitted.** The dossier lists `flexmatch.com`, but that is a generic domain likely to belong to someone else now. Confirm before linking.
- LOIs mentioned in prose without a count (the dossier gives none).
- Cofounder unnamed and framing kept professional.

## content/work/nunium.mdx

- Period `2022`, `approx: true` — **no source.** Guessed.
- **`url` deliberately omitted, and it stays that way.** nunium.com still resolves, but you are taking it down, so a live link would rot. The entry links the Wayback capture of 2025-02-21 instead — the only 200-status snapshot of the domain the Archive holds, and it renders with its CSS. If the site goes down before the Archive takes another copy, that snapshot is all that will be left; consider saving a fresh one at <https://web.archive.org/save/https://nunium.com/> before it disappears.
- `status: "archived"` is confirmed and the three screenshots were taken on 2026-09-03, with each caption saying so.
- Cofounders described as "two friends in Germany" per the dossier, unnamed.

## content/work/internxt.mdx

- Period `2019`, `approx: true` — from the current work page.
- **"web3" and "secure wallet" deliberately dropped.** The old work page tagged this project web3; the brand brief bans crypto/web3 framing. The entry is described purely as file management and cloud storage. Confirm.
- Links to `internxt.com/products#mobile` — confirm the anchor still exists.

## content/work/trello-boosted-boards.mdx

- **`3,000+` active users is gone.** Mozilla Add-ons reports a couple of dozen daily users (checked 2026-09-02) and there is no Chrome listing left, so the entry ships with no number. If you have a screenshot or an old dashboard export showing the peak, it can come back as a dated historical figure — nothing in hand supports one today.
- **No Chrome Web Store link.** The listing is gone, not merely moved off `chrome.google.com/webstore`. Only Mozilla Add-ons remains.
- The dossier says "do not emphasise" — this is the shortest entry on the site and is explicitly labelled historical.

## content/work/mladenruzicic-com.mdx

- Period `2023 – now` — from the year on the current work page. Should it start earlier (first version of the site)?

## All work entries

- **Screenshots landed for five entries.** TenderLift, studenti.rs, FontAlternatives, Boxium and Nunium each ship three viewport shots (1440×1000, 834×1112, 390×844) with `blurDataURL`s in `public/static/work/`; FontAlternatives also carries a Search Console traffic chart (`search-console-16m.webp`). The shader header still stands in everywhere else.
- **Hi Fam, Panciona and FlexMatch: you are supplying these yourself, from your GitHub repos at <https://github.com/ruzicic>.** None of the three has a live site or a usable Wayback capture to shoot from, so they have to be run locally. Nothing else is blocking those entries; drop the images in `public/static/work/<slug>/` and add the `media` block. FontSwap's mark is traced from its 128 px Chrome Web Store icon — see `public/static/logos/work/SOURCES.md` — rather than a real screenshot.
- **`evo-touch` is `confidentiality: limited`** even though it is `kind: product`, because it is ZF work. The contract only says companies default to `limited`. Confirm that is right; if EVO Touch is a fully public product, it could be `public` — but the metrics and screenshots would still be ZF's call.
- **Length interpretation.** The brief specified 250–600 words for "featured and company entries" and 80–150 for "experiments". Non-featured products (FontSwap, Boxium, Panciona, Hi Fam, FlexMatch, Nunium, Internxt, mladenruzicic.com) were not covered by either bracket; I put them all in the short bracket, which keeps the work index scannable. Say if any of them deserve full case studies — Panciona and FlexMatch have the most substance available.
- **Accents** for entries the brief did not specify: FontSwap `#CFCAC0`, Avataurus `#7B5CD6`, MontePop `#3FB68B`, Boxium `#8A9BA8`, Panciona `#A8574B`, Hi Fam `#D45D79`, FlexMatch `#4B9CD3`, Nunium `#5E8B7E`, Internxt `#4B6FE0`, Trello Boosted Boards `#0079BF`, mladenruzicic.com `#939597`.

---

## content/pages/home.ts

- The lede claims you own product for a driver-facing app at ZF and build TenderLift end to end. Both are supported by the dossier; confirm the phrasing is safe to publish with ZF's name attached.
- `footer.copyright` hardcodes 2026.

## content/pages/mentoring.ts

- **The MentorCruise proof points live in the lede.** Top 2% of 5,500+ mentors, 40+ mentees, 5/5 rating — there is no structured slot for facts on this page, so they are prose. If you want them as a designed row of figures, the schema needs a `proof` array and `app/mentoring/page.tsx` a block to render it.
- **No pricing anywhere.** The current homepage says "$120 per session"; the dossier does not state a public price, so the brief's rule leaves it out. The CTA points at `mentors.to/ruzicic` and says availability and plans live there. Add a price here only if you want it public and stable.
- The free 15-minute discovery call is described but **not linked**. The v2 site booked it at <https://calendar.app.google/dETpNdfdug4LF81j7> (`DISCOVERY_SESSION_URL` in `lib/constants.ts`, a file v3 deleted — recover it with `git show main:lib/constants.ts`). Should the mentoring CTA use that link instead of, or alongside, MentorCruise?
- `whoFor`, `topics` and `expectations` are written from the mentee testimonials and your background (React/React Native, design systems, code review, career switchers). They are plausible but not sourced from anything you wrote. **Read them and correct anything you would not say.**
- "I take a handful of people at a time" — reflects the dossier's "no high-volume mentoring" goal, but is not a sourced fact. Confirm.
- `h1` is plain text, not `{ship}` braces. The contract only specifies the brace syntax for the homepage hero `h1` and mentoring `h2`; if the mentoring page reuses the same accent renderer, add the braces back.

## content/pages/about.mdx

- 612 words. Timeline is not repeated — it renders from `COMPANIES`.
- "From Bosnia and Herzegovina, by way of Serbia" is kept as market/domain context, per the dossier's allowance. Remove if you would rather not.
- **Languages listed as English, Serbian and Bosnian.** French was not claimed, since nothing sources it. Add it if it is true.
- Links block includes email, LinkedIn, GitHub, MentorCruise, CV. **Twitter/X was dropped** — the old about page linked `twitter.com/ruzicic` and the content contract's `Site.links` does not include it. Add it back if the account is active.
- No family mentions, no relocation-through-marriage line, no "software developer, mentor and entrepreneur".

## content/pages/uses.mdx

- **The hardware list is unchanged from the July 2023 page** (M1 MacBook Pro, Dell U2415, MX Keys Mini, MX Master 3, Anker dock, Brio, Aputure MC). Three years on, at least some of this is likely wrong. Please review.
- **Editor changed** from "VS Code with Default Dark+" to Cursor plus Claude Code, with VS Code as the fallback — sourced from the dossier's daily-workflow section, not from you directly. Correct?
- Added sections that were not on the old page: Building, Running things, AI workflow. Everything in them comes from the dossier (Cloudflare, Hetzner, Vercel, GitHub Actions, PostHog, Stripe, local models, Slack/WhatsApp/Telegram assistants).
- Stripe is listed under "Running things" because the dossier mentions Stripe payments on studenti.rs. Confirm.
- "Multiple maxed Claude subscriptions" from the dossier was **left out** — it reads as posturing rather than as a tool choice.
- The old "Last update: Jul 6, 2023" line is now frontmatter `updated: 2026-09-02`, which is the date this file was written, not the date the list was last verified.

---

## Cross-cutting

- **Not owned by this file:** `content/site.ts` and `content/testimonials.ts` belong to the other agent. The contact email, LinkedIn, GitHub, MentorCruise and calendar URLs used in `about.mdx` and `mentoring.ts` should match whatever lands in `SITE.links`.
- **Spelling** is British-leaning ("summarise", "optimisation", "monetised") except where a proper noun or an existing published string says otherwise. Switch the whole content directory to US spelling if you prefer; it should be consistent either way.
- **Serbian orthography**: "Ružičić", "Radić", "Pajić", "Skendžić", "Šćekić", "Kozić" all carry diacritics. The font subset must include latin-ext (the plan already specifies this). Every spelling is confirmed by the owner (2026-09-03), including the three LinkedIn prints stripped.
- **The word "tokenmaxing" does not appear anywhere** in this content, per the dossier's instruction to keep it to notes and essays.
