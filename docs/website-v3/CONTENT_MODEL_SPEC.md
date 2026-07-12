# Content model spec

## Goal

Move from hard-coded page arrays to a typed content layer that powers:

- homepage sections
- work index
- case-study pages
- notes
- mentoring page
- metadata
- JSON-LD
- markdown mirrors
- `llms.txt`

## Content directory

```txt
content/
  work/
  notes/
  mentoring/
```

## Work taxonomy

Use status, not `featured/archive`, as the main taxonomy.

```ts
export type WorkEntryKind = "company" | "product" | "experiment" | "client" | "meta"

export type WorkEntryStatus =
  | "active-flagship"
  | "active-maintained"
  | "active-experiment"
  | "paused"
  | "stopped"
  | "historical"

export type WorkConfidentiality = "public" | "limited" | "high"

export type WorkMetricConfidence = "verified" | "needs-verification" | "private"
```

## Work types

```ts
export type WorkLink = {
  label: string
  href: string
  kind?: "website" | "github" | "article" | "archive" | "demo" | "store" | "case-study"
}

export type WorkMetric = {
  value: string
  label: string
  description?: string
  source?: string
  confidence: WorkMetricConfidence
}

export type WorkMedia = {
  type: "image" | "video"
  src: string
  poster?: string
  alt: string
  caption?: string
  width?: number
  height?: number
}

export type WorkEntry = {
  slug: string
  title: string
  shortTitle?: string
  kind: WorkEntryKind
  status: WorkEntryStatus
  featured: boolean
  highlightRank?: number

  company?: string
  period: string
  role: string
  location?: string

  summary: string
  positioning: string
  problem?: string
  contribution: string[]

  responsibilities: string[]
  decisions: string[]
  outcomes: WorkMetric[]
  learnings: string[]

  technologies: string[]
  disciplines: string[]

  links: WorkLink[]
  media: WorkMedia[]

  confidentiality: WorkConfidentiality

  seo: {
    title: string
    description: string
    image?: string
  }
}
```

## Work entry mapping

```txt
TenderLift: active-flagship
studenti.rs: active-maintained
FontAlternatives: active-maintained
FontSwap: active-maintained
Avataurus: active-experiment
Boxium: paused
MontePop: active-experiment
Amada: active-maintained or client
Panciona: stopped
Hi Fam: stopped
FlexMatch: stopped
Nunium: stopped
Trello Boosted Boards: historical, mostly omit
mladenruzicic.com: meta
Internxt: historical
ZF SCALAR: company, current, limited confidentiality
Shopify: company, completed, limited confidentiality
HEGIAS: company, completed, limited confidentiality
WolkAbout: company, completed, public or limited
```

## Note type

```ts
export type NoteStatus = "draft" | "published" | "archived"

export type Note = {
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  status: NoteStatus
  topics: string[]
  featured: boolean
  readingTime?: string
  seo: {
    title: string
    description: string
    image?: string
  }
}
```

## Testimonial type

```ts
export type Testimonial = {
  author: string
  role?: string
  company?: string
  quote: string
  sourceLabel?: string
  sourceUrl?: string
  rating?: number
  publishedAt?: string
  permission: "public" | "anonymous" | "private"
}
```

## Page metadata type

```ts
export type PageMetadata = {
  title: string
  description: string
  canonicalPath: string
  image?: string
  noindex?: boolean
  updatedAt?: string
}
```

## Content loading functions

```txt
lib/content/get-work.ts
lib/content/get-notes.ts
lib/content/get-page-markdown.ts
lib/metadata/json-ld.ts
lib/metadata/metadata.ts
```

Functions:

```ts
export function getAllWorkEntries(): WorkEntry[]
export function getFeaturedWorkEntries(): WorkEntry[]
export function getWorkEntryBySlug(slug: string): WorkEntry
export function getAllNotes(): Note[]
export function getNoteBySlug(slug: string): Note
export function getMarkdownForRoute(path: string): string
```

## LLM-readable outputs

Generate:

```txt
/llms.txt
/llms-full.txt
/about.md
/work.md
/work/[slug].md
/notes/[slug].md
/mentoring.md
```

Rules:

- generated from the same source content
- include canonical URL
- include last updated date
- exclude private metrics
- mark uncertain claims as needs verification or omit them
- no divergent positioning from HTML pages

## Structured data

Generate JSON-LD for:

- Person
- WebSite
- ProfilePage
- Article
- CreativeWork
- BreadcrumbList

## Claim confidence

Metrics need confidence states:

```txt
verified
needs-verification
private
```

Do not publish private metrics. Do not present uncertain metrics as facts.

## Confidentiality modes

### Public

Allowed:

- screenshots
- links
- metrics
- product details
- technical decisions

### Limited

Allowed:

- role
- public domain context
- abstracted contribution
- public screenshots only
- no private metrics

### High

Allowed:

- generic role framing
- no screenshots
- no sensitive system details
- no private company claims

## Initial content files

```txt
content/work/zf-scalar.mdx
content/work/shopify-shop-minis.mdx
content/work/hegias.mdx
content/work/wolkabout.mdx
content/work/tenderlift.mdx
content/work/studenti-rs.mdx
content/work/fontalternatives.mdx
content/work/fontswap.mdx
content/work/avataurus.mdx
content/work/boxium.mdx
content/work/montepop.mdx
content/work/amada.mdx
content/work/panciona.mdx
content/work/hi-fam.mdx
content/work/flexmatch.mdx
content/work/nunium.mdx
```
