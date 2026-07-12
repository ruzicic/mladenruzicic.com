# Page specs

## Global page rules

Every public page needs:

- unique title
- meta description
- canonical URL
- Open Graph image
- semantic HTML
- JSON-LD where relevant
- markdown mirror where useful
- mobile-first layout
- no-JS readable content

## Homepage

### Goal

Make the positioning clear within 10 seconds and move the right visitors toward selected work or contact.

### Audience

- senior technical hiring managers
- founders
- technical product leaders
- startup operators
- serious collaborators

### Sections

1. Hero
2. Current focus
3. Selected company chapters
4. Independent products
5. AI-native practice
6. Notes and learnings
7. Mentoring proof
8. Final contact CTA

### Primary CTA

```txt
See selected work
```

### Secondary CTA

```txt
Start a conversation
```

### Acceptance criteria

- no family mention
- no family image
- no mentorship pricing
- positioning is clear above the fold
- ZF, Shopify, TenderLift and studenti.rs are visible without deep navigation
- mobile layout reads naturally

## Work index

### Goal

Present the body of work as a coherent system: company chapters, independent products and learning archive.

### Sections

1. Page intro
2. Featured active work
3. Company chapters
4. Independent products
5. Stopped, paused and historical work
6. Closing CTA

### Primary CTA

```txt
Open a case study
```

### Design notes

Use status taxonomy rather than `featured/archive` labels:

- active flagship
- active maintained
- active experiment
- paused
- stopped
- historical

### Acceptance criteria

- ZF SCALAR, Shopify, HEGIAS and WolkAbout appear as company chapters
- TenderLift, studenti.rs and FontAlternatives appear as high-priority independent products
- stopped products are framed as learning, not failure theater
- work cards are readable without hover

## Work case-study page

### Goal

Make a single project or company chapter credible, specific and safe.

### Sections

1. Header
2. Summary
3. Role and scope
4. Context
5. Problem
6. Constraints
7. Contribution
8. Key decisions
9. Outcome
10. Learnings
11. Media
12. Related work

### Content requirements

- period
- role
- ownership
- constraints
- public-safe metrics
- confidence state for metrics
- technologies
- links
- confidentiality mode

### Acceptance criteria

- no confidential claims leak
- private metrics are excluded or marked private
- every case study has a clear learning section
- screenshot and preview content has alt text

## Notes index

### Goal

Show thinking around product engineering, AI-native workflows, developer experience and product lessons.

### Sections

1. Intro
2. Featured note
3. Topic filters
4. Note list
5. RSS or feed link

### Initial note topics

- Building with agents without outsourcing judgment
- Tokenmaxing, context and verification
- Developer experience is product work
- Why design systems fail without adoption strategy
- What Shopify taught me about high-scale product quality
- What ZF taught me about turning platform work into product leadership
- What TenderLift taught me about ugly B2B markets
- Vibe coding that accidentally becomes real

## Note detail

### Goal

Readable, linkable, quote-friendly long-form writing.

### Requirements

- article metadata
- reading time optional
- topic chips
- table of contents for long pieces
- markdown mirror
- related notes
- accessible prose

## Mentoring page

### Goal

Make mentoring available without making it the main site identity.

### Audience

- experienced junior to senior engineers
- engineers needing architectural or career direction
- founders needing technical product feedback

### Sections

1. Mentoring hero
2. Who it is for
3. Topics
4. How it works
5. Reviews and testimonials
6. Availability note
7. CTA

### Copy stance

Mention that new mentorships are rare because time is limited.

### Acceptance criteria

- homepage is not mentorship-first
- mentoring page is complete enough for qualified people
- pricing is not needed on homepage

## About page

### Goal

Professional narrative, not biography dump.

### Sections

1. Short professional bio
2. Timeline
3. How I work
4. Operating principles
5. Skills and domains
6. Links

### Acceptance criteria

- professional only
- no family content
- timeline is scannable
- company work and independent work connect into one story

## Now page

### Goal

Current focus and availability snapshot.

### Sections

1. Current role
2. Active products
3. Current AI-native workflow exploration
4. What I am open to
5. What I am not open to

### Acceptance criteria

- clear availability signal
- no generic life update
- easy to update manually

## Uses page

### Goal

Refresh existing uses page into a working-style page, not a gadget list.

### Sections

1. Daily tools
2. AI workflow
3. Development stack
4. Hardware and local AI
5. Principles

### Acceptance criteria

- supports professional positioning
- avoids becoming lifestyle content

## Machine-readable routes

### Routes

```txt
/llms.txt
/llms-full.txt
/about.md
/work.md
/work/[slug].md
/notes/[slug].md
/mentoring.md
```

### Goal

Make content easy for LLMs, search engines and agents to parse.

### Acceptance criteria

- generated from same content source
- canonical links included
- last updated date included
- no private claims
- no divergent copy from HTML pages

## Contact path

### Goal

Make serious contact easy.

### Primary options

- email
- LinkedIn
- CV
- GitHub

### Copy

```txt
I am open to senior IC, staff/principal, technical product leadership, founder-in-residence, selected startup and advisory conversations.
```

### Negative filter

```txt
Not looking for corporate in-office roles, agency work, crypto projects or people-management-heavy roles.
```
