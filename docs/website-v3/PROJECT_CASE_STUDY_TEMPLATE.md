# Project case study template

## Purpose

Every meaningful company chapter or product should have a structured case study. The goal is to show judgment, not only output.

## Template

```md
# [Project name]

## Summary

One paragraph explaining what this is, why it mattered and what Mladen owned.

## Metadata

- Status:
- Kind:
- Period:
- Role:
- Company:
- Confidentiality:
- Technologies:
- Disciplines:
- Links:

## Context

What environment did this happen in?

## Problem

What problem existed before the work?

## Constraints

- technical constraints
- product constraints
- team constraints
- market constraints
- confidentiality constraints

## Role and ownership

What did Mladen personally own?

## Contribution

Concrete work shipped or led.

## Decisions

Important product, technical or process decisions.

## System design

Architecture, data flow, platform, component system or operational model when relevant.

## Product judgment

What tradeoffs were made and why?

## Outcomes

Metrics and results with confidence labels.

## Learnings

What this changed about how Mladen builds.

## Media plan

Screenshots, previews, diagrams and safe visual assets.

## Related work

Links to related case studies or notes.
```

## Filled example: TenderLift

### Summary

TenderLift is an active Swiss public-procurement intelligence platform for supplier-side companies, especially SMEs. It helps companies find, assess and act on relevant public tenders using AI-assisted matching, summaries, eligibility reasoning, alerts and buyer/competitor intelligence.

### Metadata

- Status: active-flagship
- Kind: product
- Period: 2025 to present, exact public launch date needs verification
- Role: founder/operator, product, engineering, AI workflows, sales discovery
- Confidentiality: public plus some private/internal metrics
- Technologies: needs verification from repo/source, likely TypeScript, React/Next.js, Node.js, AI services, local AI processing, messaging integrations
- Disciplines: B2B SaaS, public procurement, AI workflows, data ingestion, multilingual UX, alerts, relevance scoring

### Context

Swiss public procurement is fragmented across SIMAP, cantonal sources and below-threshold notices. Suppliers need signal, not a generic tender firehose. TenderLift targets supplier-side companies and helps them understand which tenders are worth attention.

### Problem

SMEs often miss relevant tenders or waste time reviewing irrelevant ones. Standard search is keyword-heavy, language-sensitive and poor at understanding company fit.

### Constraints

- multilingual Swiss market
- fragmented sources
- relevance requires company profile understanding
- public and semi-public data sources
- high trust requirements
- small team and solo-founder constraints
- customer onboarding and sales required alongside product work

### Role and ownership

Mladen owns product strategy, technical architecture, data workflows, AI matching, alerts, customer conversations, sales learning, operations and iteration.

### Contribution

- built tender monitoring and enrichment workflows
- designed company-profile based relevance scoring
- added AI summaries and eligibility reasoning
- built alerting across channels
- explored bid preparation and bid document review
- created agent workflows for support, sales and operations
- built assistants for Slack, WhatsApp and Telegram
- used local AI data processing and long-term agent memory patterns

### Decisions

- focus on supplier side, not buyer side
- prioritize relevance and explanation over raw search volume
- use AI for summarization, matching and operations where it creates leverage
- treat onboarding/profile quality as a product primitive
- build for Swiss multilingual procurement reality

### Outcomes

Private metrics exist but should not be published unless explicitly approved.

Public-safe outcome framing:

- active product with real users
- active sales and onboarding learning
- strongest proof of B2B SaaS founder/operator execution
- main proof of AI-native product building

### Learnings

- B2B trust requires explanation, not only ranking
- AI is useful when tied to a concrete workflow and verification loop
- procurement is a messy but valuable market
- product, sales, onboarding and data quality are inseparable

### Media plan

Use sanitized screenshots:

- Today ranked tenders
- tender detail summary
- fit score and eligibility
- company profile matching
- alerts/digest
- bid preparation if public-safe
- buyer/competitor intelligence if public-safe

Avoid:

- private customer data
- private tender strategies
- sensitive ingestion details

## Filled example: Shopify Shop Minis

### Summary

Shop Minis was a zero-to-one exploration inside Shop.app, building a mini-app ecosystem embedded in a high-scale mobile commerce product. Mladen worked across React Native, SDKs, partner workflows, automation and product engineering with early building partners.

### Metadata

- Status: completed
- Kind: company
- Period: needs verification
- Role: product engineer / frontend deployed style partner engineer
- Company: Shopify
- Confidentiality: limited
- Technologies: React Native, React, Remix, Node.js, GitHub automations, Buildkite, GCP
- Disciplines: mobile apps, SDKs, developer experience, partner ecosystem, high-scale product quality

### Context

Shop.app served tens of millions of monthly active users. Shop Minis explored mini React Native apps embedded inside the main Shop app, with a partner ecosystem around building, submitting, maintaining and promoting those minis.

### Problem

The team needed to prove whether an embedded app ecosystem could work inside Shop.app while supporting external partners and preserving high product quality.

### Constraints

- high-volume mobile surface
- low-end devices and slower-internet markets
- safety, spam, takedown and kill-switch needs for live features
- partner developer experience
- Shopify quality bar
- small team and high autonomy

### Role and ownership

Mladen worked on Shop Minis from zero, contributed to SDK and building blocks, worked directly with early partners, and operated in a high-agency self-directed environment.

### Contribution

- helped build the mini app system inside Shop.app
- helped build SDK and partner-facing building blocks
- worked on partner workflows around submission, upload and maintenance
- contributed to high-scale product surfaces, including Shopify checkout
- participated in interviewing and hiring for 6+ months

### Outcomes

Public-safe outcomes:

- small team shipped from zero to first 10 building partners
- hundreds of thousands of customers saw Minis inside Shop.app
- learned high-scale customer-facing product quality from a strong environment

### Learnings

- platform quality is product quality
- partner ecosystems need both SDKs and operational workflows
- safety systems and kill switches are product primitives at scale
- high-end UX has to survive low-end devices and slow networks

### Media plan

Use only public-safe assets:

- public Shop Minis page
- public Shop.app visuals
- public app-store or marketing screenshots
- no internal tools
- no private partner data
