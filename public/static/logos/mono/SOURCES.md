# Employer marks — sources and provenance

The six SVGs in this directory are the monochrome marks of Mladen's former
employers. They are consumed by:

- `app/components/hero/logo-texture.ts` — rasterised to a 512² canvas and used
  as a shard `alphaMap`, loaded through `new Image()` from
  `/static/logos/mono/<hero-logo-id>.svg`;
- `app/components/timeline/Timeline.tsx` (`BandMark`) — a CSS
  `background-image` on an 18 px and a 52 px square, `background-size: cover`.

Both consumers load the file as an **isolated image document**, so
`currentColor` would resolve to black and paint nothing. Every mark therefore
ships with a literal `fill="#fff"` on a single wrapping `<g>`.

House rules applied to all six:

- geometry only — `<path>`, `<polygon>`, `<circle>`; no `<text>`, no `<image>`,
  no embedded raster, no editor metadata, no `<style>`/class indirection;
- a **square** `viewBox` with the mark centred, so `background-size: cover` in
  the timeline crops nothing and the hero's `contain` fit behaves;
- per-mark padding tuned by eye so all six carry the same optical weight at
  18 px (see "Optical sizing" below);
- every file is well under 20 KB (largest is 2.0 KB).

**Nominative use.** Each mark is a registered trademark of its owner and is
reproduced here solely to identify a former employer on a personal CV site —
nominative fair use. No mark is used as a logo for this site, no affiliation,
sponsorship or endorsement is implied, and the marks are not altered beyond
being flattened to a single colour and re-cropped. Any owner who would prefer
their mark removed can have it removed: delete the file and the `logo` field in
`content/companies.ts`, and the `mark` text fallback takes over automatically.

Retrieval date for everything below: **2026-09-02**.

---

## zf-scalar.svg — ZF

- **Source:** `https://upload.wikimedia.org/wikipedia/commons/9/94/ZF_logo_STD_Blue_3CC.svg`
  (Wikimedia Commons, `File:ZF logo STD Blue 3CC.svg` — the ZF Friedrichshafen AG
  corporate logo as distributed by ZF, Illustrator-exported, single path).
  zf.com serves its press assets behind a brand portal; this file is the same
  artwork, unmodified.
- **Changed:** dropped the wrapping `<g transform="matrix(1.5 …)">`, the
  `<style>` block and the `.st0` class, replaced the `#0057B7` fill with `#fff`,
  recomputed a tight square `viewBox` (5 % padding). One `<path>`, 631 B.
- The mark is the ZF ring with "ZF" cut through it, so it reads as an outline
  rather than a solid disc — good at 18 px.

## shopify.svg — Shopify (the Shopping Bag glyph, no wordmark)

- **Source:** `https://cdn.shopify.com/static/brand-assets/shopify-shopping-bag.zip`
  → `02 - Glyph/svg/shopify_glyph_white.svg`. The zip is the official download
  linked from `https://www.shopify.com/brand-assets`.
- **Changed:** removed the Illustrator comment, `<style>` and `.st0` class,
  replaced the `#FFFFFF` class fill with a `fill="#fff"` group, recomputed a
  tight square `viewBox` (10 % padding). Two `<path>`s, 1.3 KB. Geometry is
  byte-for-byte the official artwork.
- Decision 8 in `CLAUDE.md` asks for the bag and not the wordmark; this is the
  bag only.
- **Shopify green:** `#95BF47`, read out of `02 - Glyph/svg/shopify_glyph.svg`
  in the same zip (`.st0`; the darker side face of the bag is `.st1` `#5E8E3E`).
  `content/companies.ts` was `#96BF48`, one step off on each channel.

## hegias.svg — HEGIAS

- **Source:** the mark already in this repo at
  `public/static/logos/mono/hegias.svg`, which is a vector of the HEGIAS
  brandmark. Verified against the current official logo at
  `https://hegias.com/wp-content/uploads/2024/05/logo.png` (hegias.com, HTTP 200)
  — same four-facet "open room" symbol above the HEGIAS wordmark.
- **Changed:** the old file was a 128 px tile whose `<clipPath id="clip0_216:71">`
  was **empty**, so the whole thing clipped to nothing and rendered blank. Kept
  only the four symbol facets, dropped the "HEGIAS" wordmark and the "building
  imagination" tagline (19 tiny glyph outlines), dropped the empty clip path,
  recomputed a tight square `viewBox` (2 % padding). Four `<path>`s, 481 B.
- **Why symbol-only:** the symbol + wordmark lockup is more identifiable at hero
  size but turns into a grey smear at the timeline's 18 px. The symbol holds at
  every size and matches the other five marks' register; the band already prints
  "HEGIAS" in text next to it.

## wolkabout.svg — WolkAbout

- **Source:** the mark already in this repo at
  `public/static/logos/mono/wolkabout.svg` — a vector of the WolkAbout logo
  (cloud enclosing an `@`, followed by the "wolkabout" wordmark). wolkabout.com
  no longer resolves; the logo is corroborated by the Web Archive snapshot
  `http://web.archive.org/web/20210616143417/https://wolkabout.com/`
  (HTTP 200, same mark in the header).
- **Changed:** kept only the cloud-`@` symbol (path index 9), dropped the nine
  wordmark letterform paths, dropped the 128 px tile wrapper and the `fill="none"`
  root attribute, recomputed a tight square `viewBox` (5 % padding). One `<path>`,
  2.0 KB.
- **Why symbol-only:** the "wolkabout" wordmark is 6.6 : 1 — unusable in a
  square, and `background-size: cover` in the timeline would crop it to "olkab".

## execom.svg — Execom

- **Source:** `https://web.archive.org/web/20170620233633id_/https://www.execom.eu/images/execom-logo-e.cc399192.svg`
  — the file execom.eu itself served in 2017 (`<title>execom-logo-mobile</title>`,
  fill `#FB4B4F`), i.e. Execom's own asset from the years Mladen worked there.
  The companion wordmark from the same capture is
  `.../images/execom-logo.e4e3ad28.svg`.
- **Do not use the live execom.eu.** As of 2026-09-02 the domain serves an
  unrelated gambling-affiliate template that reuses Execom's meta description;
  its `/images/logo.webp` is generic clipart, not the Execom mark. Execom was
  acquired by HTEC Group and folded in. Third-party copies of the same mark
  (worldvectorlogo `execom` / `execom-1`, seeklogo, and the Vojvodina ICT Cluster
  member directory's `Execom-logo-red.png`) all agree with the Wayback asset.
- **Changed:** dropped `<title>` and `fill-rule="evenodd"` on the group (the two
  sub-paths do not overlap), replaced `#FB4B4F` with `#fff`, recomputed a tight
  square `viewBox` (15 % padding — the arrow is the heaviest of the six, so it
  gets the most). Two `<path>`s, 559 B.

## nemestic.svg — Nemestic

- **Sources (both from the live nemestic.com, HTTP 200):**
  - `https://nemestic.com/2017/wp-content/themes/nemestic/img/Nemestic_Logo.svg`
    — the official "Nemestic." wordmark, clean vector;
  - `https://nemestic.com/2017/wp-content/themes/nemestic/img/N.png`
    — the official "N." symbol, but only as a 100 × 87 PNG.
- **Changed:** the symbol is the one shape needed (the wordmark is 6 : 1 and
  unusable in a square), and no vector of it is published. Rather than trace the
  PNG, the two `<polygon>`s that draw the N in the **official wordmark SVG** were
  lifted verbatim, and the trailing dot was drawn as a `<circle>` positioned and
  sized by measuring the official `N.png` (dot centre at 92/100 × 79/87 of the
  bitmap, radius 7.5 px, scaled by the N's own width). The result overlays
  `N.png` exactly. Fill `#231f20` → `#fff`, tight square `viewBox` (12 %
  padding). Two `<polygon>`s + one `<circle>`, 363 B.
- nemestic.com has been the same domain continuously since 2008 (Web Archive
  captures include a `studenti.rs` header image under `/wp-content/uploads/2010/`).

---

## Optical sizing

`background-size: cover` and the hero's `contain` fit both scale a mark to fill
its square, so a mark's apparent size is set entirely by the padding baked into
its `viewBox`. The paddings below were tuned by rendering all six at 18 / 28 /
52 / 120 px on the site's dark ground and levelling them by eye:

| mark | padding (fraction of the long side) | why |
|---|---|---|
| zf-scalar | 0.05 | thin ring, needs the size |
| shopify | 0.10 | solid, tall silhouette |
| hegias | 0.02 | widest aspect (1.7 : 1), loses the most height in a square |
| wolkabout | 0.05 | thin stroke |
| execom | 0.15 | heaviest solid of the six |
| nemestic | 0.12 | heavy slab letterform |

## Legacy paths

`public/static/logos/hegias.svg` and `public/static/logos/wolkabout.svg` were
128 px white tiles with editor metadata. They now hold byte-identical copies of
the cleaned marks so the old paths keep resolving; `content/companies.ts` points
at this `mono/` directory, which is the canonical set.
