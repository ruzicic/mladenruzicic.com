import {
  getAbout,
  getBuiltList,
  getCv,
  getHome,
  getMedia,
  getMentoring,
  getPress,
  getProduct,
  getSite,
  getStory,
  getWorkPage,
} from "@/lib/content"
import {
  columnStills,
  type Product,
  type WorkEntry,
} from "@/lib/content/schema"

import {
  canonical,
  identity,
  ownProducts,
  productDescription,
} from "./markdown"
import { dateTime } from "./metadata"

/**
 * JSON-LD: one connected graph per page, with stable `@id`s, built from
 * `lib/content` so the structured data says what the page says and nothing
 * more.
 *
 * The entity core (Person, WebSite, the organisations in his history and the
 * products he made) is on every page, so each page's graph is self-contained
 * and every `@id` it references resolves inside the same script. Page nodes
 * (ProfilePage, CollectionPage + ItemList, Article + BreadcrumbList, Service)
 * sit on top and point into the core.
 *
 * Cross-linking (the owner's "cross-link my projects to and from me"): every
 * product he made names the Person as `creator` (a product from a job names
 * him as `contributor`), and TenderLift the company names him as `founder`
 * and appears in his `worksFor`. The Person carries no `@reverse` block: it
 * only restated those links, and validators read it as the Person's own
 * `creator`/`contributor` (Ahrefs Site Audit, 2026-11-27: 11 schema.org errors
 * on every page).
 *
 * Deliberately absent:
 *   · Employers in the identity. `description` and `jobTitle` are generic;
 *     employers appear only as `worksFor` / `alumniOf`.
 *   · Reviews. The mentee testimonials are first-party (hosted on his own
 *     site, about his own service); Google's review-snippet policy treats
 *     those as self-serving and ineligible, so they are not marked up as
 *     `Review`s. They stay visible on `/mentoring` and in its markdown twin.
 *   · Metrics of any kind, and anything not in `content/`.
 *
 * `@id` scheme: `<origin>/#person`, `/#website`, `/#headshot`,
 * `/#org-tenderlift`; every list row's entity is `/work#<slug>`, the URL of
 * that row on `/work`; page nodes are `<page url>#webpage`, `#breadcrumb`,
 * `#article`, `#list`, `#service`.
 */

const site = getSite()
const ORIGIN = site.url

const nodeBase = (path: string) =>
  path === "/" ? `${ORIGIN}/` : canonical(path)

const ID = {
  person: `${ORIGIN}/#person`,
  website: `${ORIGIN}/#website`,
  headshot: `${ORIGIN}/#headshot`,
  tenderliftOrg: `${ORIGIN}/#org-tenderlift`,
  entity: (slug: string) => `${ORIGIN}/work#${slug}`,
  // `/` is `<origin>/#webpage`, like `/#person`: `canonical("/")` has no
  // trailing slash, so it cannot be the base here.
  page: (path: string) => `${nodeBase(path)}#webpage`,
  breadcrumb: (path: string) => `${nodeBase(path)}#breadcrumb`,
} as const

type Node = Record<string, unknown>
const ref = (id: string) => ({ "@id": id })

/** Without diacritics, for searches typed on an English keyboard. */
const ASCII_NAME = site.name.normalize("NFD").replace(/\p{Diacritic}/gu, "")

const LANGUAGE_CODES: Record<string, string> = {
  Serbian: "sr",
  English: "en",
  Italian: "it",
}

/* -------------------------------------------------------------------------- */
/* Entities                                                                   */
/* -------------------------------------------------------------------------- */

/** Employers, newest first: the first is current (`worksFor`), the rest `alumniOf`. */
const EMPLOYERS = [
  "zf-scalar",
  "shopify",
  "hegias",
  "wolkabout",
  "execom",
  "nemestic",
]

/**
 * Companies on the list that he did freelance work for (Internxt). Neither an
 * employer (`worksFor` / `alumniOf`) nor a product he made (`creator`): a
 * plain Organization, so the list row's `item` resolves.
 */
const CLIENTS = ["internxt"]

/** Products he worked on inside a job: he contributed, the employer published. */
const EMPLOYER_PRODUCTS: Record<string, string> = {
  "evo-touch": "zf-scalar",
  "shop-minis": "shopify",
}

/**
 * schema.org type and `applicationCategory` per own product. An SEO judgement,
 * not copy, so it lives here rather than in content. Retired products are
 * plain `CreativeWork`s: there is nothing left to install or visit.
 *
 * No plain `SoftwareApplication` (2026-11-27): Google's Software App check
 * wants `offers` and a rating on one, and nothing here has a price or a
 * rating the site can state. Zarez runs in the browser, so it is a
 * `WebApplication` like TenderLift; the products from a job (EVO Touch, Shop
 * Minis) are `CreativeWork`s, since the app is the employer's to describe.
 */
const PRODUCT_TYPES: Record<string, { type: string; category?: string }> = {
  tenderlift: { type: "WebApplication", category: "BusinessApplication" },
  zarez: { type: "WebApplication", category: "UtilitiesApplication" },
  fontalternatives: { type: "WebSite" },
  "studenti-rs": { type: "WebSite" },
  ona: { type: "Organization" },
  "evo-touch": { type: "CreativeWork" },
  "shop-minis": { type: "CreativeWork" },
}

const IN_LANGUAGE: Record<string, string> = { "studenti-rs": "sr", zarez: "sr" }

/** `YYYY` or `YYYY-MM` the product started, only where content confirms one. */
function dateCreated(p: Product): string | undefined {
  const story = p.story && p.story === p.slug ? getStory(p.story) : undefined
  if (story) return story.period.from
  return p.year?.match(/^\d{4}/)?.[0]
}

/** A story or list URL for a product: its story if it has one, else its row. */
function entityPage(p: Product): string {
  return p.story ? canonical(`/work/${p.story}`) : ID.entity(p.slug)
}

/** The story about a product, inline, so the `@id` resolves on every page. */
function storyStub(slug: string): Node | undefined {
  const story = getStory(slug)
  if (!story) return undefined
  const url = canonical(`/work/${slug}`)
  return {
    "@type": "Article",
    "@id": `${url}#article`,
    url,
    headline: story.title,
  }
}

/** Where content says what it runs on. Everything else is left unsaid. */
const OPERATING_SYSTEM: Record<string, string> = {
  tenderlift: "Web",
  zarez: "Web",
}

function productNode(p: Product): Node {
  const typing = PRODUCT_TYPES[p.slug]
  const retired = p.status === "Retired"
  const type = retired ? "CreativeWork" : (typing?.type ?? "CreativeWork")
  const employer = EMPLOYER_PRODUCTS[p.slug]

  const node: Node = {
    "@type": type,
    "@id": ID.entity(p.slug),
    name: p.name,
    ...(productDescription(p) ? { description: productDescription(p) } : null),
    ...(p.url ? { url: p.url } : null),
    ...(p.story ? { subjectOf: storyStub(p.story) } : null),
  }

  if (type === "Organization") {
    // ONA: he runs it, the bags are someone else's work; no founder claim.
    node.member = ref(ID.person)
    return node
  }

  if (typing?.category && !retired) node.applicationCategory = typing.category
  if (OPERATING_SYSTEM[p.slug]) node.operatingSystem = OPERATING_SYSTEM[p.slug]
  // "Day job" describes his role, not the product's state.
  if (p.status && !employer) node.creativeWorkStatus = p.status
  const created = dateCreated(p)
  if (created) node.dateCreated = created
  if (IN_LANGUAGE[p.slug]) node.inLanguage = IN_LANGUAGE[p.slug]

  if (employer) {
    node.contributor = ref(ID.person)
    node.publisher = ref(ID.entity(employer))
  } else {
    node.creator = ref(ID.person)
    node.author = ref(ID.person)
    if (p.slug === "tenderlift") node.publisher = ref(ID.tenderliftOrg)
  }
  if (!p.url) node.mainEntityOfPage = entityPage(p)
  return node
}

function employerNode(slug: string): Node {
  const p = getProduct(slug)!
  return {
    "@type": "Organization",
    "@id": ID.entity(slug),
    name: p.name,
  }
}

function clientNode(slug: string): Node {
  const p = getProduct(slug)!
  return {
    "@type": "Organization",
    "@id": ID.entity(slug),
    name: p.name,
    ...(p.url ? { url: p.url } : null),
  }
}

function tenderliftOrgNode(): Node {
  const p = getProduct("tenderlift")!
  return {
    "@type": "Organization",
    "@id": ID.tenderliftOrg,
    name: p.name,
    url: p.url,
    founder: ref(ID.person),
    ...(dateCreated(p) ? { foundingDate: dateCreated(p) } : null),
    location: { "@type": "Country", name: "Switzerland" },
  }
}

function headshotNode(): Node {
  const media = getMedia(site.headshot.src)
  return {
    "@type": "ImageObject",
    "@id": ID.headshot,
    url: `${ORIGIN}${site.headshot.src}`,
    contentUrl: `${ORIGIN}${site.headshot.src}`,
    ...(media ? { width: media.width, height: media.height } : null),
    caption: site.headshot.alt,
    // Google's image metadata (Search Console, 2026-11-17): his own picture,
    // offered for download on the press kit, which is where it is licensed.
    creator: ref(ID.person),
    creditText: site.name,
    copyrightNotice: `© ${site.name}`,
    license: canonical("/press"),
    acquireLicensePage: canonical("/press"),
  }
}

function personNode(): Node {
  const [current, ...past] = EMPLOYERS
  return {
    "@type": "Person",
    "@id": ID.person,
    name: site.name,
    alternateName: ASCII_NAME,
    givenName: site.name.split(" ")[0],
    familyName: site.name.split(" ").slice(1).join(" "),
    url: ORIGIN,
    email: `mailto:${site.links.email}`,
    image: ref(ID.headshot),
    description: identity(),
    // Generic roles, never tied to an employer.
    jobTitle: ["Global Product Owner", "Founder", "Mentor"],
    knowsLanguage: site.languages.map((name) => ({
      "@type": "Language",
      name,
      ...(LANGUAGE_CODES[name]
        ? { alternateName: LANGUAGE_CODES[name] }
        : null),
    })),
    homeLocation: {
      "@type": "Place",
      name: site.location.label,
      address: {
        "@type": "PostalAddress",
        addressRegion: site.location.region,
        addressCountry: site.location.country,
      },
    },
    knowsAbout: [
      "Product ownership",
      "Building products with AI agents",
      "Design systems",
      "Frontend engineering",
      "Swiss public procurement",
      "Mentoring",
    ],
    worksFor: [ref(ID.entity(current)), ref(ID.tenderliftOrg)],
    alumniOf: past.map((slug) => ref(ID.entity(slug))),
    memberOf: ownProducts()
      .filter((p) => PRODUCT_TYPES[p.slug]?.type === "Organization")
      .map((p) => ref(ID.entity(p.slug))),
    sameAs: [
      site.links.x,
      site.links.linkedin,
      site.links.github,
      site.links.mentorcruise,
    ],
  }
}

function websiteNode(): Node {
  return {
    "@type": "WebSite",
    "@id": ID.website,
    name: site.name,
    alternateName: ASCII_NAME,
    url: ORIGIN,
    description: getHome().seo.description,
    inLanguage: "en",
    publisher: ref(ID.person),
    author: ref(ID.person),
    about: ref(ID.person),
  }
}

/** Person, WebSite, headshot, organisations and products: on every page. */
function core(): Node[] {
  return [
    personNode(),
    headshotNode(),
    websiteNode(),
    tenderliftOrgNode(),
    ...EMPLOYERS.map(employerNode),
    ...CLIENTS.map(clientNode),
    ...ownProducts().map(productNode),
    ...Object.keys(EMPLOYER_PRODUCTS).map((slug) =>
      productNode(getProduct(slug)!)
    ),
  ]
}

/* -------------------------------------------------------------------------- */
/* Page nodes                                                                 */
/* -------------------------------------------------------------------------- */

interface Crumb {
  name: string
  path: string
}

function breadcrumbNode(path: string, crumbs: Crumb[]): Node {
  return {
    "@type": "BreadcrumbList",
    "@id": ID.breadcrumb(path),
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: canonical(c.path),
    })),
  }
}

function webPageNode(
  type: string,
  path: string,
  name: string,
  description: string,
  extra: Node = {}
): Node {
  return {
    "@type": type,
    "@id": ID.page(path),
    url: canonical(path),
    name,
    description,
    inLanguage: "en",
    isPartOf: ref(ID.website),
    dateModified: dateTime(site.updated),
    ...(path === "/" ? null : { breadcrumb: ref(ID.breadcrumb(path)) }),
    ...extra,
  }
}

const HOME_CRUMB: Crumb = { name: "Home", path: "/" }

function graph(nodes: Node[]) {
  return { "@context": "https://schema.org", "@graph": nodes }
}

export function homeJsonLd() {
  const home = getHome()
  return graph([
    webPageNode("ProfilePage", "/", home.seo.title, home.seo.description, {
      mainEntity: ref(ID.person),
      about: ref(ID.person),
      primaryImageOfPage: ref(ID.headshot),
    }),
    ...core(),
  ])
}

export function aboutJsonLd() {
  const about = getAbout()
  return graph([
    webPageNode(
      "ProfilePage",
      "/about",
      about.seo.title,
      about.seo.description,
      {
        mainEntity: ref(ID.person),
        about: ref(ID.person),
        primaryImageOfPage: ref(ID.headshot),
      }
    ),
    breadcrumbNode("/about", [
      HOME_CRUMB,
      { name: about.seo.title, path: "/about" },
    ]),
    ...core(),
  ])
}

/**
 * `/cv`: a ProfilePage about the same Person node every page carries; the
 * CV's facts are the page's text, not repeated here. The PDF is the page
 * printed, named as the page's associated file.
 */
export function cvJsonLd() {
  const cv = getCv()
  return graph([
    webPageNode("ProfilePage", "/cv", cv.seo.title, cv.seo.description, {
      mainEntity: ref(ID.person),
      about: ref(ID.person),
      primaryImageOfPage: ref(ID.headshot),
      associatedMedia: {
        "@type": "MediaObject",
        contentUrl: `${ORIGIN}${cv.download.href}`,
        encodingFormat: "application/pdf",
        name: `${site.name}, ${cv.seo.title}`,
      },
    }),
    breadcrumbNode("/cv", [HOME_CRUMB, { name: cv.seo.title, path: "/cv" }]),
    ...core(),
  ])
}

export function pressJsonLd() {
  const press = getPress()
  return graph([
    webPageNode("WebPage", "/press", press.seo.title, press.seo.description, {
      about: ref(ID.person),
      primaryImageOfPage: ref(ID.headshot),
    }),
    breadcrumbNode("/press", [
      HOME_CRUMB,
      { name: press.seo.title, path: "/press" },
    ]),
    ...core(),
  ])
}

export function workJsonLd() {
  const copy = getWorkPage()
  const rows = getBuiltList().groups.flatMap((g) => g.rows)
  const listId = `${canonical("/work")}#list`
  return graph([
    webPageNode(
      "CollectionPage",
      "/work",
      copy.seo.title,
      copy.seo.description,
      {
        mainEntity: ref(listId),
        about: ref(ID.person),
      }
    ),
    {
      "@type": "ItemList",
      "@id": listId,
      name: copy.title,
      numberOfItems: rows.length,
      itemListOrder: "https://schema.org/ItemListUnordered",
      itemListElement: rows.map((row, i) => {
        const p = getProduct(row.ref)
        return {
          "@type": "ListItem",
          position: i + 1,
          name: row.name,
          description: row.what,
          url: p?.story ? canonical(`/work/${p.story}`) : ID.entity(row.ref),
          item: ref(ID.entity(row.ref)),
        }
      }),
    },
    breadcrumbNode("/work", [
      HOME_CRUMB,
      { name: copy.seo.title, path: "/work" },
    ]),
    ...core(),
  ])
}

export function mentoringJsonLd() {
  const copy = getMentoring()
  const serviceId = `${canonical("/mentoring")}#service`
  return graph([
    webPageNode("WebPage", "/mentoring", copy.seo.title, copy.seo.description, {
      mainEntity: ref(serviceId),
      about: ref(ID.person),
    }),
    {
      "@type": "Service",
      "@id": serviceId,
      name: copy.section,
      serviceType: "Mentoring",
      description: copy.seo.description,
      url: canonical("/mentoring"),
      provider: ref(ID.person),
      availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: site.links.mentorcruise,
        name: "MentorCruise",
      },
    },
    breadcrumbNode("/mentoring", [
      HOME_CRUMB,
      { name: copy.section, path: "/mentoring" },
    ]),
    ...core(),
  ])
}

/** What a story is about: its product, or the employer and the product inside it. */
function storyAbout(entry: WorkEntry): { "@id": string }[] {
  if (entry.slug === "zf-scalar")
    return [ref(ID.entity("zf-scalar")), ref(ID.entity("evo-touch"))]
  if (entry.slug === "shopify")
    return [ref(ID.entity("shopify")), ref(ID.entity("shop-minis"))]
  return [ref(ID.entity(entry.slug))]
}

export function storyJsonLd(slug: string) {
  const entry = getStory(slug)
  if (!entry) return undefined
  const path = `/work/${entry.slug}`
  const url = canonical(path)
  const image = columnStills(entry.column)[0]?.src
  const workPage = getWorkPage()
  return graph([
    webPageNode(
      "WebPage",
      path,
      entry.seo.title ?? entry.title,
      entry.seo.description,
      {
        mainEntity: ref(`${url}#article`),
        about: storyAbout(entry),
        dateModified: dateTime(entry.updated ?? site.updated),
      }
    ),
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: entry.title,
      alternativeHeadline: entry.line,
      description: entry.seo.description,
      url,
      mainEntityOfPage: ref(ID.page(path)),
      isPartOf: ref(ID.website),
      author: ref(ID.person),
      publisher: ref(ID.person),
      about: storyAbout(entry),
      dateModified: dateTime(entry.updated ?? site.updated),
      inLanguage: "en",
      image: image ? `${ORIGIN}${image}` : `${url}/opengraph-image`,
      ...(entry.tech.length ? { keywords: entry.tech.join(", ") } : null),
    },
    breadcrumbNode(path, [
      HOME_CRUMB,
      { name: workPage.seo.title, path: "/work" },
      { name: entry.title, path },
    ]),
    ...core(),
  ])
}

/* -------------------------------------------------------------------------- */
/* Serialisation                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Serialise for a `<script type="application/ld+json">`. `<` is escaped so no
 * string in content can close the script element; U+2028/2029 are escaped
 * because they end a line in some JavaScript parsers.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replaceAll(String.fromCharCode(0x2028), "\\u2028")
    .replaceAll(String.fromCharCode(0x2029), "\\u2029")
}
