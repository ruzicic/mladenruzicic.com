# Open questions

Everything in `content/` that is flagged `needs-verification`, deliberately left out, or guessed — grouped by file. Nothing here blocks the build; all of it blocks a confident launch.

Rule applied throughout: no placeholder strings, no private metrics, and no invented facts. Where a required field had no source, it carries `approx: true` and appears below.

---

## content/companies.ts

**Dates.** Five of six bands are `approx: true`, copied from `docs/v3-design/site-data.js` and flagged as unverified in the dossier. Need real start and end months for: Shopify (`~2021 – 2023`), HEGIAS (`~2019 – 2021`), WolkAbout / Execom (`~2016 – 2019`), Freelance (`~2011 – 2016`), Nemestic (`~2008 – 2011`). ZF SCALAR (Oct 2023) is the only one set as verified.

**Direct conflict with the current about page.** `app/about/page.mdx` lists first-job years as Nemestic 2010, Execom 2015, WolkAbout 2017, HEGIAS 2020. The design data and dossier say Nemestic 2008, Execom/WolkAbout 2016, HEGIAS 2019. These cannot both be right. I used the design/dossier numbers. Which set is correct?

**Execom vs WolkAbout.** They share one band (`wolkabout`, named "WolkAbout / Execom") and two hero shards. Were you at Execom before WolkAbout started, i.e. does the band actually begin earlier than the WolkAbout dates?

**Logos.** `public/static/logos/` does not exist yet in the repo. `content/companies.ts` references `/static/logos/hegias.svg` and `/static/logos/wolkabout.svg` per the brief; every other company falls back to a text `mark`. Those two SVGs need to be created before launch or the `logo` fields must be removed. Decide which employer trademarks you want etched on the hero shards at all (ZF, Shopify, Execom, Nemestic currently show letter marks).

**Shopify colour.** Set to `#96BF48` with a comment saying it is sampled from the official bag asset. Confirm the sample, or replace with the exact value from the mark you end up shipping.

**ZF end date.** Band `to` is `'now'`. `site-data.js` had `2026.7`; confirm the timeline should run to the present.

---

## content/people.ts

- **LinkedIn URLs omitted for all five people.** The design data had `https://www.linkedin.com/` placeholders. Send real profile URLs, or the section ships without links.
- **`note` omitted for all five.** The design data had "Add 1–2 paragraphs on why X matters to you." Write them, or the popovers show only `why`.
- **Milena and Tamara have no surnames** in any source. Full names needed.
- **`why` lines are minimal** — they say where you worked together and roughly when, because that is all the sources support. Worth replacing with something specific to each person.
- Only Radovan's line carries a date range (2016–2019), which inherits the unverified WolkAbout dates above.

---

## content/work/zf-scalar.mdx

- `11 of 25` product teams on Velocity — `needs-verification`. Dossier §12 explicitly asks "whether ZF adoption metrics can be public". **Needs ZF's sign-off before this ships in any form.**
- `~50` components at full adoption — same question, same flag.
- `5` engineers on the UI Platform team — `needs-verification`; low risk but unconfirmed.
- Confidentiality is `limited`: no screenshots, no internal tooling names, no roadmap detail. Dossier §12 asks which ZF visuals can be shown — currently none are referenced.
- No `links`. Is there a public ZF SCALAR or Velocity page worth linking to?

## content/work/shopify.mdx

- `30M+` monthly active users on Shop.app — `needs-verification`. Public-ish but sourced only from the dossier.
- `10` first building partners — `needs-verification`.
- **Left out entirely:** "hundreds of thousands of customers saw Minis inside Shop.app" (abstracted to "a large number of Shop customers" in prose).
- Dossier §12 asks whether the **Shopify checkout contribution should be mentioned prominently**. Currently it is one clause in "Role and scope" and one line in the company summary — deliberately understated. Raise or remove?
- The entry mentions the **May 2023 layoff** in "Outcome", framed neutrally, matching what the current about page already says publicly. Say so if you would rather it were dropped.
- Period is `2021 – 2023`, `approx: true`.

## content/work/hegias.mdx

- Dates `approx: true` (`~2019 – 2021`).
- Dossier flags "exact title" as unverified — currently "Full-stack team lead".
- Dossier flags "names of the 3D model websites integrated" — deliberately left generic ("popular third-party 3D model libraries"). Name them if they can be named.
- No metrics at all; the Outcome section says so explicitly. Anything HEGIAS is happy to have published?
- Links to `hegias.com` — confirm the company and that URL are still live.

## content/work/wolkabout.mdx

- Dates `approx: true` (`~2016 – 2019`).
- `5–6` engineers led — `needs-verification`.
- Links to the npm package `@wolkabout/wolk-rest` and the Web Archive snapshot of wolkabout.com. Confirm the npm package is still published and that linking it is fine.
- "Micro frontends" and "Nx monorepo" come from the current `app/work/page.tsx`; the dossier only says Angular/RxJS. Confirm.

## content/work/tenderlift.mdx

- **No metrics at all**, by design. Users, traffic and revenue are private per the dossier. If you want anything public (e.g. cantons covered, sources monitored, languages), say which.
- Period `2024 – now`, `approx: true`. The dossier says "launched around October of last year", which conflicts with the design data's `2024 – now`. **Need the real start and launch dates.**
- The AI section names ARGUS and Graphiti in the dossier; both are described generically here ("long-running agents", "a memory layer") to avoid exposing internals. Name them publicly?
- Nothing about ingestion or scraping mechanics is described, per the dossier's instruction.
- No screenshots. Dossier §12 asks for them; none exist in the repo.

## content/work/studenti-rs.mdx

- `250k` registered users — marked `verified`, because the current live about page already publishes it. Confirm.
- `45k` documents — `needs-verification`. **The sources conflict:** the dossier says 45k, the brand brief says 40k documents and 38k posts. Which number is right, and can it be published?
- Revenue is stated as private in the body and no figure appears anywhere.
- The 2008 build date and the 2022 buy-back are treated as verified (both appear on the current site).
- No screenshots.

## content/work/fontalternatives.mdx

- `16.4K` monthly visits, all organic — `needs-verification`. The dossier says public metrics are allowed but §12 also says "verify FontAlternatives monthly traffic". Confirm the figure and its date; traffic numbers go stale fast.
- Start year `2023`, `approx: true` — from the design data, not the dossier.
- The dossier mentions an article documenting the content flywheel. **Reference removed** because `/notes` is deferred and there is nowhere to link. Where is it published?

## content/work/fontswap.mdx

- `162` Chrome Web Store users — `needs-verification`. The dossier permits publishing it, but it is a live counter and will be wrong by launch. Confirm or drop; a stale small number reads worse than no number.
- Period `2024 – now`, `approx: true` — **no source for the start date at all.** Guessed from its relationship to FontAlternatives.

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

- `3,000+` active users — `needs-verification`; the figure is from the 2023 version of the work page and is almost certainly stale.
- **The Chrome Web Store link was dropped.** The old URL is on the retired `chrome.google.com/webstore` domain. Only the Mozilla Add-ons link is included. Supply a current Chrome listing URL if the extension is still published.
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

- **"Eighteen years of shipping"** (2008 → 2026) is in the hero lede, replacing the old site's "twelve years". The plan asks you to confirm it.
- The lede claims you own product for a driver-facing app at ZF and build TenderLift end to end. Both are supported by the dossier; confirm the phrasing is safe to publish with ZF's name attached.
- `work.countLabel` is `"Five of twenty"` — the contract did not say what this label is for. If it is meant to be a numeric count it will need updating whenever a work entry is added.
- `footer.copyright` hardcodes 2026.
- Mentoring lede says "thirty-plus engineers", which matches the current about page ("over 30 mentees"). Still accurate?

## content/pages/mentoring.ts

- **No pricing anywhere.** The current homepage says "$120 per session"; the dossier does not state a public price, so the brief's rule leaves it out. The CTA points at `mentors.to/ruzicic` and says availability and plans live there. Add a price here only if you want it public and stable.
- The free 15-minute discovery call is described but **not linked**. The v2 site booked it at <https://calendar.app.google/dETpNdfdug4LF81j7> (`DISCOVERY_SESSION_URL` in `lib/constants.ts`, a file v3 deleted — recover it with `git show main:lib/constants.ts`). Should the mentoring CTA use that link instead of, or alongside, MentorCruise?
- `whoFor`, `topics` and `expectations` are written from the mentee testimonials and your background (React/React Native, design systems, code review, career switchers). They are plausible but not sourced from anything you wrote. **Read them and correct anything you would not say.**
- "I take a handful of people at a time" — reflects the dossier's "no high-volume mentoring" goal, but is not a sourced fact. Confirm.
- `h1` is plain text, not `{ship}` braces. The contract only specifies the brace syntax for the homepage hero `h1` and mentoring `h2`; if the mentoring page reuses the same accent renderer, add the braces back.

## content/pages/about.mdx

- 612 words. Timeline is not repeated — it renders from `COMPANIES`.
- "From Bosnia and Herzegovina, by way of Serbia" is kept as market/domain context, per the dossier's allowance. Remove if you would rather not.
- **Languages listed as English, Serbian and Bosnian.** French was not claimed, since nothing sources it. Add it if it is true.
- "Mentored more than thirty engineers" — from the current about page. Still accurate?
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
- **Serbian orthography**: "Ružičić", "Skendžić", "Šćekić", "Kozić" all carry diacritics. The font subset must include latin-ext (the plan already specifies this).
- **The word "tokenmaxing" does not appear anywhere** in this content, per the dossier's instruction to keep it to notes and essays.
