# Open questions

Everything in `content/` that is flagged `needs-verification`, deliberately left out, or guessed — grouped by file. Nothing here blocks the build; all of it blocks a confident launch.

Rule applied throughout: no placeholder strings, no private metrics, and no invented facts. Where a required field had no source, it carries `approx: true` and appears below.

**Last closed:** 2026-09-02, against the owner's LinkedIn profile, the live studenti.rs / Chrome Web Store / Mozilla Add-ons listings and Google Search Console. Every employment date, the ZF, Shopify, studenti.rs, FontAlternatives and FontSwap metrics, and the "worked alongside" entries came out of that pass; what is left below is what those sources could not settle.

---

## content/companies.ts

**studenti.rs predates the Nemestic band by two years.** Nemestic now runs Feb 2010 – Jul 2011, but studenti.rs went live in 2008 and the case study calls you its original developer. The band summary says so plainly ("it went live in 2008; the contract dates on this band start later, in 2010"), and `SITE.yearsShipping` is anchored on the product rather than on employment. Confirm that is the right story — were you building for the studio before you were formally on its books, or did studenti.rs start somewhere else?

**Logos.** `public/static/logos/` does not exist yet in the repo. `content/companies.ts` references `/static/logos/hegias.svg` and `/static/logos/wolkabout.svg` per the brief; every other company falls back to a text `mark`. Those two SVGs need to be created before launch or the `logo` fields must be removed. Decide which employer trademarks you want etched on the hero shards at all (ZF, Shopify, Execom, Nemestic currently show letter marks).

**Shopify colour, two values.** The band is `#95BF47`, sampled from the official bag asset. `content/work/shopify.mdx` still carries `accent: "#96BF48"`, the older placeholder. One of them should move.

---

## content/people.ts

- **The `note` lines are mine, not yours.** Each one is assembled from the person's own public profile — current role, shared employers, overlap years — because that is all a profile supports. They read as accurate rather than as warm. **Replace them with your own sentences before launch;** this is the one place on the site where a generic line is worse than none.
- **Diacritics on three surnames.** LinkedIn prints "Tamara Radic", "Milena Pajic" and "Radovan Skendzic" stripped. The site ships Radić, Pajić and Skendžić, consistent with its own spelling of Ružičić and Šćekić. Confirm with each of them, or drop the diacritics — spelling somebody's name for them is a choice worth being sure about.
- **Josip Kozić has no profile URL and no `note`.** He ships with `why` alone, which is the intended fallback. Send a URL and a sentence if you want him at parity with the other four.
- **Photos are LinkedIn screenshots.** `public/static/people/*.webp` are 320×320 crops of 570px profile images, captured 2026-09-02, not originals. They are fine at the sizes the popover uses. Worth asking the four of them whether they mind their photo being here at all.

---

## content/work/zf-scalar.mdx

- **ZF sign-off.** The adoption numbers are back as deliberately coarse public shapes — `~45%` of product teams at handover and `~50` components at full adoption, both `verified` on your say-so. Team headcount is dropped for good. If ZF has actually cleared these, say so here; if nobody has been asked, that is the last thing standing between this page and launch.
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
- No screenshots. Dossier §12 asks for them; none exist in the repo.

## content/work/studenti-rs.mdx

- `45k` documents is now `verified` on your confirmation, alongside `250k` registered users. Note the live homepage badges round to **40.000+** and **250.000+**, so a visitor who clicks through sees a smaller document number than the case study claims. Worth reconciling one way or the other.
- Revenue is stated as private in the body and no figure appears anywhere.
- The 2008 build date and the 2022 buy-back are treated as verified (both appear on the current site).
- No screenshots.

## content/work/fontalternatives.mdx

- **Start year `2023` looks wrong.** It is still `approx: true`, and two independent sources say 2026: your own LinkedIn project entry dates FontAlternatives **Jan 2026 – Present**, and Search Console shows the property with no data at all before January 2026. The new chart on the page makes that visible — it starts flat in January 2026. Left untouched because you did not ask for it, but a reader will notice. Confirm 2026-01, or explain what shipped in 2023.
- Traffic metrics are `verified` and dated: `16.4K` monthly visits (mid-2026) and `28.3K` Google search clicks over the 16-month Search Console window. Both go stale — decide how often you want to refresh them, or drop the monthly-visits figure and keep only the chart.
- The dossier mentions an article documenting the content flywheel. **Reference removed** because `/notes` is deferred and there is nowhere to link. Where is it published?

## content/work/fontswap.mdx

- `309` Chrome Web Store users, read from the live listing on 2026-09-02 and dated in the label so it ages honestly. It is still a live counter; re-read it at launch.
- Period `2024 – now`, `approx: true` — **no source for the start date at all.** Guessed from its relationship to FontAlternatives, and suspect for the same reason FontAlternatives' 2023 is.

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
- Links to `boxium.com` — confirm the domain still resolves and shows something reasonable.

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
- **`url` omitted** for the same reason as FlexMatch; the dossier lists `nunium.com`.
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

- **No `media` on any entry.** No screenshots exist in the repo. The shader header stands in until artwork lands. Priority order for shots, per the plan: TenderLift, studenti.rs, FontAlternatives, Amada, EVO Touch.
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
- **Serbian orthography**: "Ružičić", "Radić", "Pajić", "Skendžić", "Šćekić", "Kozić" all carry diacritics. The font subset must include latin-ext (the plan already specifies this). Three of those spellings are the site's choice rather than the person's own — see `content/people.ts` above.
- **The word "tokenmaxing" does not appear anywhere** in this content, per the dossier's instruction to keep it to notes and essays.
