import { getSite } from "@/lib/content"
import type { RichText, Site } from "@/lib/content/schema"
import { newsletterTurnstileSiteKey } from "@/lib/newsletter/turnstile"

import { ExternalLink } from "../primitives/ExternalLink"
import { TransitionLink } from "../primitives/TransitionLink"
import { getBuiltAt } from "./built-at"
import { NewsletterForm, type NewsletterFormProps } from "./NewsletterForm"
import { StationClock } from "./StationClock"

/**
 * The dark footer, one and the same on every page (owner, 15 Nov 2026: "make
 * footer consistent across pages"): the ask line, the contact line, the
 * newsletter sign-up while it is enabled, the links row and the station
 * clock with the Swiss time and "Built in Switzerland". Content: `footer` in
 * `content/site.ts`. The
 * paper sheet above it lifts as it comes into view (`app/styles/shell.css`).
 *
 * The contact line carries `id="contact"`: it is where the Ask button points
 * without JavaScript.
 */
export async function SiteFooter() {
  const site = getSite()
  const { footer } = site
  // Only the moment the dial is drawn at in the prerendered markup; the
  // clock jumps to the time in Switzerland as soon as it mounts.
  const builtAt = await getBuiltAt()

  return (
    <footer data-site-footer="" data-surface="night" className="site-foot">
      <div className="site-foot__col site-foot__ask">
        <p className="site-foot__open">{footer.ask}</p>
        <p id="contact" className="site-foot__contact">
          <Rich text={footer.contact} />
        </p>
      </div>

      <FooterNewsletter newsletter={site.newsletter} />

      <div className="site-foot__col site-foot__base">
        <FooterNav links={footer.links} />
        <StationClock
          builtAt={builtAt}
          timeLabel={footer.timeLabel}
          line={footer.builtIn}
        />
      </div>
    </footer>
  )
}

/**
 * The newsletter sign-up (owner, 13 Nov 2026: "keep newsletter in footer on
 * all pages"). It posts to the `subscribe` Server Action; while `enabled` is
 * false in content/site.ts nothing renders. Its ids come from `useId`, so
 * two on one page never clash. The Turnstile check is on only while both of
 * its variables are set (`lib/newsletter/turnstile.ts`).
 */
function FooterNewsletter({ newsletter }: { newsletter: Site["newsletter"] }) {
  if (!newsletter.enabled) return null
  return (
    <div className="site-foot__col site-foot__news">
      <NewsletterForm
        copy={newsletterCopy(newsletter)}
        // The site key only, and only while the secret is also set.
        turnstileSiteKey={newsletterTurnstileSiteKey()}
      />
    </div>
  )
}

/** The sign-up's copy, without the switch that decides whether it shows. */
function newsletterCopy({
  enabled: _enabled,
  ...copy
}: Site["newsletter"]): NewsletterFormProps["copy"] {
  return copy
}

function FooterNav({ links }: { links: Site["footer"]["links"] }) {
  return (
    <nav aria-label="Site" className="site-foot__nav">
      {links.map((l) =>
        l.download ? (
          // A file, not a page: no client navigation, downloaded as About's
          // CV button is.
          <a
            key={l.href}
            href={l.href}
            download=""
            className="site-foot__navlink"
          >
            {l.label}
          </a>
        ) : isExternal(l) ? (
          <ExternalLink
            key={l.href}
            href={l.href}
            rel={l.me ? "me" : undefined}
            className="site-foot__navlink"
            hideArrow
          >
            {l.label}
          </ExternalLink>
        ) : (
          <TransitionLink
            key={l.href}
            href={l.href}
            className="site-foot__navlink"
          >
            {l.label}
          </TransitionLink>
        )
      )}
    </nav>
  )
}

/**
 * A link leaves the site when content says so (`external: true`) or its href
 * is `http(s):`. `mailto:` and site paths are not external. Footer links
 * show no arrow either way (owner, 12 Nov); external ones open a new tab.
 */
function isExternal(link: { href: string; external?: boolean }): boolean {
  return Boolean(link.external) || /^https?:/.test(link.href)
}

/** Footer rich text: words and links (product tiles do not occur here). */
function Rich({ text }: { text: RichText }) {
  return (
    <>
      {text.map((seg, i) => {
        if (seg.kind === "text") return seg.text
        if (seg.kind === "product") return seg.text
        if (isExternal(seg)) {
          // No arrow in the footer (owner, 12 Nov): it still opens in a new
          // tab, and says so to screen readers.
          return (
            <ExternalLink
              key={i}
              href={seg.href}
              rel={seg.me ? "me" : undefined}
              className="site-foot__link"
              hideArrow
            >
              {seg.text}
            </ExternalLink>
          )
        }
        if (seg.href.startsWith("/")) {
          return (
            <TransitionLink key={i} href={seg.href} className="site-foot__link">
              {seg.text}
            </TransitionLink>
          )
        }
        return (
          <a key={i} href={seg.href} className="site-foot__link">
            {seg.text}
          </a>
        )
      })}
    </>
  )
}
