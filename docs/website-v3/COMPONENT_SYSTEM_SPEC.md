# Component system spec

## Component principles

- Server Components by default.
- Client Components only where interaction requires state.
- Typed props.
- Design-token based styling.
- Accessible by default.
- Project evidence should be first-class.
- Do not over-abstract before implementation proves repetition.

## Suggested folder structure

```txt
app/components/
  primitives/
  layout/
  typography/
  navigation/
  work/
  case-study/
  content/
  media/
  machine/
```

## Primitives

```txt
Button
TextLink
Chip
Badge
Card
Surface
Divider
Icon
VisuallyHidden
SkipLink
FocusRing
```

### Button

```ts
type ButtonVariant = "primary" | "secondary" | "ghost" | "link"
type ButtonSize = "sm" | "md" | "lg"

type ButtonProps = {
  href?: string
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  external?: boolean
}
```

## Layout components

```txt
SiteShell
SiteHeader
SiteFooter
PageContainer
Section
SectionHeader
Grid
Stack
Cluster
SidebarLayout
CaseStudyLayout
```

### SectionHeader

```ts
type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
}
```

## Typography components

```txt
Eyebrow
DisplayHeading
Heading
Subheading
Lead
Prose
Metric
Metadata
Caption
Quote
CodeInline
```

## Navigation components

```txt
DesktopNav
MobileNav
Breadcrumbs
TableOfContents
FooterNav
ContactLinks
```

Navigation items:

```txt
Work
Notes
Mentoring
About
Now
Uses
```

Primary header CTA:

```txt
Start a conversation
```

## Work components

```txt
WorkGrid
WorkCard
FeaturedWorkCard
CompanyChapterCard
IndependentProductCard
WorkFilters
WorkStatusBadge
WorkMetricStrip
WorkTechnologyList
RelatedWork
```

### WorkCard

```ts
type WorkCardVariant = "featured" | "compact" | "company" | "product" | "timeline"

type WorkCardProps = {
  entry: WorkEntry
  variant?: WorkCardVariant
  priority?: boolean
}
```

Card must show:

- title
- short description
- kind/status
- role or owner relationship
- period
- key technologies or disciplines
- optional metrics
- optional media preview

## Case-study components

```txt
CaseStudyHeader
CaseStudySummary
RoleScopePanel
ProblemStatement
ContributionList
DecisionLog
OutcomeList
LearningList
ConfidentialityNotice
MediaGallery
ScreenshotFrame
PreviewPlayer
RelatedCaseStudies
```

### CaseStudyHeader

```ts
type CaseStudyHeaderProps = {
  title: string
  subtitle: string
  period: string
  role: string
  status: WorkEntryStatus
  kind: WorkEntryKind
  technologies: string[]
  links: WorkLink[]
}
```

### Metric

```ts
type MetricProps = {
  value: string
  label: string
  description?: string
  source?: string
  confidence?: "verified" | "needs-verification" | "private"
}
```

## AI-native components

```txt
WorkflowDiagram
AgentLoopDiagram
ContextStack
VerificationChecklist
ToolchainStrip
OperatingPrincipleCard
```

Use these to explain real workflows, not decorative AI concepts.

## Content components

```txt
Callout
PrincipleCard
Timeline
LogoCloud
TestimonialCard
ReviewSummary
ArticleCard
NoteList
```

## Media components

```txt
ResponsiveImage
ScreenshotFrame
HoverPreview
TouchPreviewDialog
VideoPreview
MediaCaption
MediaGrid
BeforeAfter
```

### HoverPreview

```ts
type HoverPreviewProps = {
  posterSrc: string
  videoSrc?: string
  fallbackImages?: Array<{
    src: string
    alt: string
  }>
  alt: string
  caption?: string
  disabled?: boolean
}
```

Behaviour:

- static poster initially
- load video on user intent
- play muted loop on hover for fine pointer devices
- keyboard focus shows controls, not hidden motion
- touch uses explicit Preview button
- reduced motion shows still image only

## Machine-readable components

```txt
JsonLdScript
MarkdownRouteLink
LlmIndexLink
StructuredProfileData
StructuredWorkData
```

## Page component maps

### Homepage

```txt
Hero
CurrentFocusSection
CompanyChaptersSection
IndependentProductsSection
AiNativePracticeSection
NotesPreviewSection
MentoringPreviewSection
FinalContactSection
```

### Work index

```txt
WorkPageHeader
WorkFilters
FeaturedWorkGrid
CompanyChapterGrid
IndependentProductGrid
LearningArchiveList
```

### Case study

```txt
CaseStudyHeader
CaseStudySummary
RoleScopePanel
ProblemStatement
ContributionList
DecisionLog
OutcomeList
LearningList
MediaGallery
RelatedWork
```

### Mentoring

```txt
MentoringHero
WhoItIsFor
MentoringTopics
HowItWorks
ReviewSummary
TestimonialsGrid
MentoringCta
```

### About

```txt
AboutHero
ProfessionalNarrative
OperatingPrinciples
Timeline
ToolsAndStack
CurrentFocusLink
```

### Notes

```txt
NotesHeader
FeaturedNote
NoteGrid
TopicFilter
RssLink
```

## Server vs client components

### Server components

- pages
- content-rendered sections
- work cards without media playback
- case studies
- notes
- JSON-LD
- metadata generation
- markdown routes

### Client components

- MobileNav
- WorkFilters if interactive without full route reload
- HoverPreview
- TouchPreviewDialog
- ThemeToggle if added
- CommandPalette if added later

## Mobile requirements

- Work cards readable without hover.
- Project visuals should not dominate at the expense of the headline.
- Long pages need useful table of contents.
- No horizontal scroll.
- Tap targets should be generous.
- Navigation should be boring, fast and reliable.

## Accessibility requirements

- No nested interactive card anti-patterns.
- Card link plus secondary links need valid markup.
- All buttons and links need accessible names.
- Videos need captions or adjacent descriptive captions when needed.
- Decorative images use empty alt.
- Screenshot alt text describes visible product state.
- Focus order matches visual order.

## Implementation preference

Use function declarations for components where practical.

Avoid:

```tsx
const Component = () => {}
```

Prefer:

```tsx
function Component() {}
```

Prefer explicit ternaries in JSX over `thing && <Component />` when rendering optional UI.
