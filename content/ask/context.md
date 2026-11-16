# What the site says about Mladen Ružičić

Generated from the site's content on 2026-11-16 by scripts/build-ask-context.ts. Do not edit by hand: change content/** or content/ask/notes.md and run the script again.

How to read this: quoted site copy is written by Mladen in the first person, so "I", "my" and "we" there are him. Every fact ends with (source: <path>), the page of https://mladenruzicic.com it comes from.

## Who he is and where

- Mladen Ružičić is a product owner and founder based in Ticino, Switzerland. He has been building websites since 2004. (source: /press)
- The line under his name: "Product + Tech, based in Switzerland." (source: /)
- Based in: Ticino, Switzerland. (source: /press)
- From: Bosnia and Herzegovina, by way of Serbia. (source: /press)
- Languages: Serbian, English, Italian (seven years in, still learning). (source: /press)
- Building since: 2004. (source: /press)
- Longest-running: studenti.rs, online since 2008. (source: /press)
- Mentoring: 5.0 from 51 reviews on MentorCruise, mentoring since 2021. (source: /press)

His own words on the About page:

- I keep ending up at the part of a problem nobody owns: the tool everyone works around, the market with no usable product in it. I like to sit with the people who have the problem, build something they can touch within a week, and stay close after it ships. (source: /about)
- That has looked different every few years. I started while I was still at school: websites for shops, small Windows apps, PHP sites of my own. It earned real money. (source: /about)
- Client sites in a small studio near Novi Sad. An IoT platform. Virtual reality for architects, my first job in Switzerland. Two years on Shopify's Shop app. Since 2023 I have been at ZF, today as a product owner on tools truck drivers use every day. (source: /about)
- Next to the job I build products of my own. TenderLift helps Swiss companies find and win public tenders. studenti.rs went online in 2008 and is still running. Jobs taught me what quality means when millions of people use a thing. My own products taught me what happens when there is nobody to hand the hard half to. I need both. (source: /about)
- I'm from Bosnia and Herzegovina by way of Serbia, I live in Ticino (Switzerland), and I work in Serbian, English and Italian. If you came here to see who is behind one of those products, this is me. Write to me; I answer my own email. (source: /about)

## What he is doing now

- Day job: Global Product Owner at ZF, Driver Experience team. (source: /press)
- Own product: Co-founder of TenderLift. (source: /press)
- I’m working with Swiss bid teams, designers on a budget, students in Serbia, people who write in Serbian and truck drivers. (source: /)
- On TenderLift, on FontAlternatives, on studenti.rs, on Zarez and on Driver Experience at ZF. (source: /)
- I’m most useful between the people with a problem and the technology that can solve it. (source: /)
- By day I’m a global product owner for several products at ZF, tools that truck drivers use every day. Before that I helped build Shop Minis at Shopify. (source: /)
- Outside work hours I run TenderLift, which helps Swiss companies find their way through public procurement and win more tenders. (source: /)
- Next to that I have a few side projects, most of them automated or on a schedule: FontAlternatives, studenti.rs and Zarez. (source: /)
- A few times a year I take on a small freelance project or a mentee, when the fit is really strong. (source: /)
- I've mentored on MentorCruise since 2021, with a 5.0 average from 51 reviews. These days I take someone on only when I can really help. (source: /mentoring)

## Products, jobs and projects

- The work page lists the projects and jobs he put a significant amount of time into, with what happened to each; there is more he has not listed. (source: /work)

### Products

#### TenderLift

- Status: Running. Years: 2025 to now. His own. (source: /work#tenderlift)
- In the list: "Running. My main product." (source: /work#tenderlift)
- What it is: Swiss public tenders, sorted by what you can actually win. (source: /)
- On the home page, about TenderLift: "Swiss public tenders are published every day. TenderLift reads them and tells a company which ones it can actually win. I co-founded it and build the product." (SINCE 2025 · SWITZERLAND · DE FR IT EN) (source: /)
- In "Recent work", TenderLift: Swiss public tenders, sorted by what you can actually win (source: /#recent-work)
- Website (TenderLift): https://tenderlift.ch (source: /work#tenderlift)

Case study page: /work/tenderlift (source: /work/tenderlift)

- Role: Co-founder: product and engineering. (source: /work/tenderlift)
- When: September 2025 to now. (source: /work/tenderlift)
- In one line: Swiss public-procurement intelligence for supplier-side SMEs: find, assess and win relevant tenders. (source: /work/tenderlift)
- TenderLift monitors SIMAP and cantonal procurement notices, ranks them against a company profile, summarises requirements and scores eligibility across Switzerland's official languages. I build the product: ingestion, matching and the application. (source: /work/tenderlift)

#### Summary

TenderLift is a Swiss public-procurement intelligence platform for the supplier side of the market. It watches the places tenders are published, decides which ones are worth a specific company's attention, and does the reading that would otherwise take a person a morning. I co-founded it and build the product. (source: /work/tenderlift)

#### Role and scope

The whole product side: market research, product, the ingestion and enrichment pipeline, the application, infrastructure and operations. Sales has its own people. (source: /work/tenderlift)

#### Context

Swiss public procurement is a large, continuous market that is technically open to everyone and practically opaque. Notices are spread across SIMAP, cantonal portals and below-threshold publications, in German, French and Italian, in formats designed for legal completeness rather than for reading. Large suppliers staff a bid team. An SME has a person who checks portals between other jobs, or does not check them at all. (source: /work/tenderlift)

#### Problem

The problem is not access to the notices. It is relevance and effort. Most published tenders are irrelevant to any given company, and the cost of finding that out is reading a long document. Miss the few that matter and you lose the year's pipeline; read all of them and you have hired someone to do nothing else. (source: /work/tenderlift)

#### Decisions

Relevance is scored against a structured company profile (what a supplier actually does, where, at what size) rather than against keywords. Keyword alerts are the incumbent solution and they fail in both directions. (source: /work/tenderlift)

Language is a first-class part of the domain, not a translation layer bolted on. A Swiss supplier's market is multilingual by default, so ingestion, matching and summarisation are built to work across languages rather than to normalise everything into one. (source: /work/tenderlift)

AI is used where it creates leverage and nowhere else: summarising requirements, classifying and matching notices, and reasoning about eligibility criteria. The scoring is explainable, because a supplier deciding whether to spend two weeks on a bid needs to see why a tender was ranked highly, not just that it was. (source: /work/tenderlift)

Operations run on the same principle. Long-running agents handle ingestion health, internal reporting, support triage and routine maintenance, with a memory layer so that context survives between runs. The judgment (what to build, which segment to serve, when a score is wrong) stays mine. (source: /work/tenderlift)

#### Contribution

Designed and built the ingestion and enrichment pipeline, the matching and scoring system, the application and the operational tooling. Did detailed market and competitor research. (source: /work/tenderlift)

#### Outcome

TenderLift is live and in active development. Its revenue is private for now. (source: /work/tenderlift)

#### Learnings

Ugly markets are good markets. Domains with legal language, fragmented sources and no incumbent product are unpleasant enough to keep most builders out, and the pain inside them is real. (source: /work/tenderlift)

Building the product is the easy half. Distribution, pricing and the conversation with a sceptical SME are the half that decides whether any of it matters, a lesson earlier projects taught me more expensively. (source: /work/tenderlift)

#### Zarez

- Status: Live. Years: 2026. His own. (source: /work#zarez)
- In the list: "The Serbian Grammarly. Live since November 2026." (source: /work#zarez)
- What it is: A spelling checker for Serbian, in Latin and Cyrillic. (source: /)
- On the home page, about Zarez: "A spelling checker for Serbian. It underlines a mistake, explains it in one sentence and waits for you to accept." (LIVE) (source: /)
- In "Recent work", Zarez: A spelling checker for Serbian. (source: /#recent-work)
- Website (Zarez): https://zarez.rs (source: /work#zarez)

Case study page: /work/zarez (source: /work/zarez)

- Role: Founder. (source: /work/zarez)
- When: 2026 to now. (source: /work/zarez)
- In one line: A spelling checker for Serbian, in Latin and Cyrillic. (source: /work/zarez)
- The website and the web app are live. A Chrome extension and an iPhone keyboard are built and coming soon. (source: /work/zarez)

#### Summary

Zarez checks Serbian spelling as you write, in Latin and Cyrillic. It underlines a mistake, explains it in one sentence, and changes nothing until you press Accept. (source: /work/zarez)

The everyday check is rules and a dictionary, not a language model, and it runs on your device. A check has to pass a measurement before it may draw a solid line; otherwise it suggests, or stays silent. (source: /work/zarez)

The website and the web app went live in November 2026. Sign-in is open to everyone. A Chrome extension and an iPhone keyboard are built and coming soon. (source: /work/zarez)

#### FontAlternatives

- Status: Running. Years: 2026. His own. (source: /work#fontalternatives)
- In the list: "Experiment turned product, with serious organic traffic." (source: /work#fontalternatives)
- What it is: Free fonts that look like the expensive ones. (source: /)
- On the home page, about FontAlternatives: "Free fonts that look like the expensive ones. It started as an experiment; now it gets about 16.4K visits a month, all from search (mid-2026)." (2026 · 378 FONTS MATCHED) (source: /)
- In "Recent work", FontAlternatives: Free fonts that look like the expensive ones (source: /#recent-work)
- Website (FontAlternatives): https://fontalternatives.com (source: /work#fontalternatives)

Case study page: /work/fontalternatives (source: /work/fontalternatives)

- Role: Founder and sole maintainer. (source: /work/fontalternatives)
- When: January 2026 to now. (source: /work/fontalternatives)
- In one line: Find free alternatives to expensive typefaces. An experiment that grew into steady organic traffic. (source: /work/fontalternatives)
- A typography discovery tool that pairs commercial typefaces with credible free substitutes. Built in a weekend as an experiment, it found real search demand and now runs on a loop that turns the searches it cannot answer into the content it is missing. (source: /work/fontalternatives)
- Public number: 16.4K monthly visits, mid-2026, all organic. (source: /work/fontalternatives)
- Public number: 28.3K Google search clicks, January to August 2026. (source: /work/fontalternatives)
- Link: FontSwap (Chrome extension), https://chromewebstore.google.com/detail/fontswap/mhkkpbhepfoejcjomclfmopgdabbfmkm (source: /work/fontalternatives)

#### Summary

FontAlternatives answers one question: this typeface costs money or is unavailable to me, what should I use instead? It started as an experiment, found search demand it did not expect, and has since become something I maintain deliberately. (source: /work/fontalternatives)

#### Role and scope

Solo. Product, data model, the site, the automation around it, and the sister Chrome extension, FontSwap. (source: /work/fontalternatives)

#### Context

Typeface substitution is a real and recurring problem for designers and developers (licence cost, availability, web performance, a brand font that cannot be used on a given surface), and the existing answers are scattered across forum threads and personal blog posts of varying quality. The queries are specific, high-intent and long-tail: people search for one font by name. (source: /work/fontalternatives)

#### Problem

A static database of pairings is only as good as its coverage, and coverage is exactly what you cannot know in advance. Every visitor who searches for a typeface that is not in the database is both a failure and, more usefully, a precise piece of information about what is missing. (source: /work/fontalternatives)

#### Decisions

Static site, static data. The whole product is content plus structure, so it renders as HTML and serves from the edge. That keeps it fast, cheap and durable, and long-tail organic traffic rewards exactly those properties. (source: /work/fontalternatives)

The gaps became the roadmap. Searches that return nothing are captured as demand signals in PostHog, and the missing pairings are drafted and added through an automated flow built on GitHub Actions and Claude, with review before anything is published. Demand decides what gets written, not my guess about what is interesting: a self-improving content loop, and the clearest example I have of AI doing the boring middle of a job while the judgment stays where it belongs. (source: /work/fontalternatives)

The pairings are opinionated. Listing five vaguely similar fonts is not an answer; the value is in saying which one to use and being right about the reasoning. (source: /work/fontalternatives)

#### Contribution

Built the product, the data model and the automation. Maintain it, review what the pipeline proposes, and write the pairings that need a human eye. (source: /work/fontalternatives)

#### Outcome

Steady organic traffic with no paid acquisition and no distribution effort beyond existing. It also produced FontSwap, a Chrome extension that applies the same idea directly in the browser. In November 2026 the search learned to read a description: say what you need in plain words and it finds free fonts that fit, and paid ones with their closest free match. (source: /work/fontalternatives)

#### Learnings

An experiment that finds demand deserves to be taken seriously, and taking it seriously mostly means adding structure to something that started without any. (source: /work/fontalternatives)

The most useful automation is not the part that writes. It is the part that decides what to write about, because that is the loop that compounds while you are not looking. (source: /work/fontalternatives)

#### studenti.rs

- Status: Running. Years: 2008 to now. His own. (source: /work#studenti-rs)
- In the list: "A student community in Serbia with 250k sign-ups since 2008." (source: /work#studenti-rs)
- What it is: Where students in Serbia share study materials. Online since 2008. (source: /)
- On the home page, about studenti.rs: "Where students in Serbia share study materials. I built it at my first job, bought it back in January 2022, and it still runs." (SINCE 2008 · 250K+ STUDENTS) (source: /)
- In "Recent work", studenti.rs: Where students in Serbia share study materials. Online since 2008. (source: /#recent-work)
- A place where students in Serbia share study materials. I built it at my first job and seeded it by hand, one paper a day. I bought it back in January 2022 and it still runs, mostly on its own. Facts: Since 2008; 250k+ students; 40k+ documents. (source: /#recent-work)
- Website (studenti.rs): https://studenti.rs (source: /work#studenti-rs)

Case study page: /work/studenti-rs (source: /work/studenti-rs)

- Role: Original developer, later owner and operator. (source: /work/studenti-rs)
- When: 2008 to now. (source: /work/studenti-rs)
- In one line: Serbian student platform, running since 2008. Built it at my first job, bought it back in 2022. (source: /work/studenti-rs)
- A long-running Serbian student community and document library. I built it at Nemestic Studio, my first job in tech, and acquired the platform from them in 2022, then rebuilt it, monetised it with PRO subscriptions, and now run its moderation, payments and operations almost entirely on automation. (source: /work/studenti-rs)
- Public number: 250k registered students. (source: /work/studenti-rs)
- Public number: 40k documents. (source: /work/studenti-rs)
- Public number: 2008 running continuously since. (source: /work/studenti-rs)
- Search, before and now: by his estimate, 1 in 10 searches ended with the student finding what they wanted before the rebuild; 7 in 10 do today. (source: /work/studenti-rs)

#### Summary

studenti.rs is a Serbian student platform I built at my first job. It kept running. In 2022 I bought it back, rebuilt it, and turned it into a small business I operate almost entirely through automation. It is the longest feedback loop I have on any decision I have ever made. (source: /work/studenti-rs)

#### Role and scope

Original developer, while working at Nemestic Studio, my first job in tech. Owner and sole operator since 2022, when I acquired the platform from them: product, rebuild, infrastructure, moderation policy, monetisation, support and the agent systems that run the day-to-day. (source: /work/studenti-rs)

#### Context

Students need material: notes, past exams, documents. The platform accumulated it for well over a decade, along with the search visibility that comes from being the thing that was there first and never went away. That audience is the asset. It is also a moderation liability, because a user-generated document library attracts exactly what you would expect. (source: /work/studenti-rs)

#### Problem

An old platform carries two debts. The technical one is obvious and boring. The operational one is the real constraint: user-generated content needs review, payments need handling, reports need answering, and a single owner with a full-time job cannot be the queue. Before 2022 the site survived on neglect, which caps what it can be. (source: /work/studenti-rs)

#### Decisions

Buying it back was the first decision, and the reasoning was simple: the audience and the archive were real and irreplaceable, and the code was not. So the code got replaced. (source: /work/studenti-rs)

Monetisation went to PRO subscriptions rather than to more advertising. Ads on a student site pay badly and make the product worse for the people using it most. (source: /work/studenti-rs)

Operations were automated rather than staffed. Content approval, triage, scheduling, payments, reimbursements and report handling run through an agent system on infrastructure split between Cloudflare and self-hosted machines at Hetzner. An internal RAG layer with hybrid search gives it the platform's own history to answer from, so decisions are consistent with precedent rather than reinvented each time. (source: /work/studenti-rs)

Automation runs on policy, not on vibes. The rules for what is acceptable are written down, the agent applies them, and edge cases escalate to me. Automating a judgment you have not made yourself only produces a faster wrong answer. (source: /work/studenti-rs)

#### Contribution

Built the original platform at my first job. Bought it, rebuilt it and now run it: architecture, infrastructure, subscriptions, moderation policy, and the operational agents that handle approvals, payments, infrastructure health, dependency updates, bug fixes and analytics. (source: /work/studenti-rs)

#### Outcome

Eighteen years live, a quarter of a million registered users, tens of thousands of documents, and a subscription product, all operated part-time by one person. All of its traffic is organic. Revenue figures stay private. (source: /work/studenti-rs)

#### Learnings

Longevity is a strategy. A product that simply keeps working for a decade accumulates an audience and a search position that money cannot easily buy. (source: /work/studenti-rs)

Operational load, not feature work, is what kills solo products. Every hour of manual review is an hour the product cannot grow, which makes automating operations a product decision rather than an engineering indulgence. (source: /work/studenti-rs)

#### ONA by Alma

- In the list: "My mom's ecommerce business. She crochets, I do the online part." (source: /work#ona)
- Website: https://onatorba.com (source: /work#ona)

#### Villa Amada

- Status: Live. Freelance work for a client. (source: /work#amada)
- In the list: "A farmhouse on the Danish Wadden Sea, and the site that books it." (source: /work#amada)
- In "Recent work", Villa Amada: A farmhouse on the Danish Wadden Sea, and the site that books it (source: /#recent-work)
- Website (Villa Amada): https://stayamada.com (source: /work#amada)

#### Panciona

- Status: Retired. Years: 2019 to 2023. His own. (source: /work#panciona)
- In the list: "Retired. No founder-market fit." (source: /work#panciona)

Case study page: /work/panciona (source: /work/panciona)

- Role: Founder, designer and developer. (source: /work/panciona)
- When: April 2019 to July 2023. (source: /work/panciona)
- In one line: A white-label app for coaches, trainers and nutritionists to give to their own clients, on their own domain. (source: /work/panciona)
- Panciona was a white-label app for coaches, trainers and nutritionists to give to their own clients, on their own domain. It started in 2019 as a freelance job for one nutritionist, became a product with her help, and ran for about a year and a half with four paying customers before I retired it. (source: /work/panciona)
- Public number: 4 paying customers. (source: /work/panciona)
- Public number: ~1.5 years as a product. (source: /work/panciona)
- Public number: 2019 started as a freelance job. (source: /work/panciona)

#### Where it started

It started in 2019 as a freelance job for one nutritionist: a tool to keep her clients, their plans and their check-ins in one place. She then helped me turn it into a product for other people like her. (source: /work/panciona)

#### What it was

Panciona was made for coaches, trainers and nutritionists. Each of them got an app for their own clients, fully white-labelled, on their own domain, where they could share programmes and sell them. The website's headline was "Make a living selling fitness programs online". (source: /work/panciona)

#### The programme board

A programme is a board: one column per week or per day, each a stack of cards for notes, exercises and recipes that you drag into place. The same board makes a four-week strength block or a seven-day meal plan, and a coach can give it to a client for a set period. (source: /work/panciona)

#### Selling a programme

Any programme could have a price and a public page. Someone opens the page, signs up with their email and a six-digit code, and the coach approves them from the dashboard. (source: /work/panciona)

#### What happened

Product-market fit never came. Four customers paid. I underestimated how hard it is to reach fitness influencers, and I was the wrong founder for that market. (source: /work/panciona)

#### Alongside

I ran it for about a year and a half while working at Shopify, which was nothing but supportive. In that time I also finished Innosuisse's Business Creation for Social Entrepreneurs course at Startup Campus. (source: /work/panciona)

#### The website

The website still builds from its repository, so these are its real pages, not a mock-up. (source: /work/panciona)

#### Stack

React and Node.js on Postgres for the app, Next.js and Tailwind for the website. (source: /work/panciona)

#### Hi Fam

- Status: Retired. His own. (source: /work#hi-fam)
- In the list: "Retired." (source: /work#hi-fam)

#### FlexMatch

- Status: Retired. His own. (source: /work#flexmatch)
- In the list: "Retired." (source: /work#flexmatch)

#### Nunium

- Status: Retired. His own. (source: /work#nunium)
- In the list: "Retired. The market was too small." (source: /work#nunium)

### Jobs

#### ZF

- Years: 2023 to now. A job. (source: /work#zf-scalar)
- In the list: "Global Product Owner on several products." (source: /work#zf-scalar)
- What it is: Tools truck drivers use every day. I’m a Global Product Owner. (source: /)
- On the home page, about EVO Touch: "I’m Global Product Owner for several products here, tools truck drivers use every day. I came in as an individual contributor on a product team, became engineering manager of the platform team, then moved to the product side." (SINCE 2023) (source: /)
- In "Recent work", ZF: Tools truck drivers use every day. I’m a Global Product Owner. (source: /#recent-work)
- At ZF I'm Global Product Owner, for the Driver Experience team, working on tools truck drivers use every day. Before that my scope was EVO Touch, the app truck drivers work in, and before that I built and led Velocity, the design system the SCALAR products share. Facts: ZF · since 2023; Product, design and engineering in one loop. (source: /#recent-work)
- EVO Touch: The app truck drivers work in. I was its Global Product Owner until September 2026. (source: /)
- On his CV (2023 to now): Global Product Owner. Driver Experience team since October 2026, EVO Touch before that. Earlier I built and led the Velocity design system. (source: /about)

Case study page: /work/zf-scalar (source: /work/zf-scalar)

- Role: Global Product Owner, Driver Experience team (previously Global Product Owner for EVO Touch, and engineering manager, UI Platform). (source: /work/zf-scalar)
- When: October 2023 to now. (source: /work/zf-scalar)
- In one line: From individual contributor to engineering manager of the platform team, to product owner of several products. (source: /work/zf-scalar)
- Joined as a senior engineer on a platform migration, noticed the UI tooling was the real bottleneck, and built the proof of concept that became Velocity, the SCALAR design system. Led the team that shipped it and drove adoption across product teams, then owned EVO Touch as Global Product Owner until September 2026. Since October 2026 Global Product Owner for the Driver Experience team. (source: /work/zf-scalar)
- This was employed work. The site describes the role and the shape of the contribution only; private metrics, internal screenshots and system details are left out on purpose. (source: /work/zf-scalar)
- Public number: 50% of 300 engineers on Velocity at handover. (source: /work/zf-scalar)

#### Roles, oldest first

- Oct 2023 to Jan 2024: Senior software engineer. (source: /work/zf-scalar)
- What happened: I arrived in the middle of a large platform migration. The migration was not the hard part. Everyday interface work was slow and uneven between teams, and nobody owned that. (source: /work/zf-scalar)
- How I moved on: I researched it and proposed concrete fixes. Management gave me the room to pursue them. (source: /work/zf-scalar)

- Jan to Jun 2024: UI platform engineer. (source: /work/zf-scalar)
- What happened: I built the proof of concept and the foundation of Velocity, a design system the product teams could share, and made the case for it across the organisation until the team's focus moved to it. (source: /work/zf-scalar)
- How I moved on: I was its technical lead and product owner in all but name. The promotion to engineering manager followed. (source: /work/zf-scalar)

- Jun 2024 to May 2025: Engineering manager, UI Platform team. (source: /work/zf-scalar)
- What happened: I led the platform team building Velocity and stayed about half hands-on. We treated adoption as the thing we delivered: about half of the 300 engineers were building with it when I handed it over. (source: /work/zf-scalar)
- How I moved on: Velocity became the default design system proposed for new work, and that opened the product owner role. (source: /work/zf-scalar)

- May 2025 to Sep 2026: Global Product Owner, Multi-platform team. (source: /work/zf-scalar)
- What happened: I owned the vision, the roadmap and the delivery of EVO Touch, the app commercial-vehicle drivers work in, and kept three mobile apps in the group pulling in one direction. (source: /work/zf-scalar)
- How I moved on: EVO Touch was stable and a strong team took it over. I moved to where I fit better: several new projects that need their foundations laid and a delivery date kept. (source: /work/zf-scalar)

- Since Oct 2026: Global Product Owner, Driver Experience (his current role). (source: /work/zf-scalar)
- What I do now: Several new projects, where I help lay the foundations and make sure they ship on time. I work with existing customers to understand what their drivers need and what the law asks of them, and I research the sector, for example the European rules on eco-driving. (source: /work/zf-scalar)

#### Summary

I joined ZF SCALAR in October 2023 as a senior engineer and have moved upstream since: from feature work, to the technical foundation of a design system, to leading the team that built it, to owning a product. Since October 2026 I am Global Product Owner for the Driver Experience team. (source: /work/zf-scalar)

#### Role and scope

Five roles in three years: senior software engineer, UI platform engineer, engineering manager for the UI Platform team, Global Product Owner for EVO Touch (ZF's multi-platform application for commercial vehicle drivers) until September 2026, and now Global Product Owner for the Driver Experience team, where I work with existing customers on what their drivers need and what the law asks of them. (source: /work/zf-scalar)

#### Context

SCALAR is a large organisation with many product teams building on shared web technology. That structure produces a specific failure mode: every team solves the same interface problems slightly differently, and the differences compound into inconsistency for users and duplicated work for engineers. (source: /work/zf-scalar)

#### Problem

Arriving on a complex platform migration, the migration itself was not the hard part. The hard part was that UI development workflow and internal tooling made straightforward work slow, and inconsistently so across teams. Nobody owned it, because it was not anyone's feature. (source: /work/zf-scalar)

#### Decisions

I wrote up the inefficiencies concretely instead of complaining about them, with proposed developer-experience improvements attached. That got the room and the mandate to build a proof of concept. (source: /work/zf-scalar)

The design system, Velocity, was built as a product rather than a library. That meant treating adoption as the actual deliverable: talking to product teams before writing components, shipping the pieces they needed next rather than the ones that were interesting to build, and accepting that a component nobody uses is a liability. Accessibility went into the primitives rather than into a checklist, because it is far cheaper there. (source: /work/zf-scalar)

I stayed roughly half hands-on as lead engineer while managing the team. On a small platform team serving many consumers, distance from the code makes the prioritisation worse, not better. (source: /work/zf-scalar)

#### Contribution

Built the proof of concept and the technical foundation. Championed the initiative across the organisation and secured the team and the mandate to pursue it. Acted as technical lead and de facto product owner in the first phase, then as engineering manager: architecture, component API design, roadmap, cross-team communication and adoption work. Then handed it over cleanly and moved into product ownership, first for EVO Touch. (source: /work/zf-scalar)

#### Outcome

Velocity moved from an unofficial experiment to the go-to UI solution inside SCALAR and became the standard for new development. By the time I handed it over, about half of the 300 engineers were building with it. I have since moved off the platform project, and adoption has kept growing without me, which is the outcome you want from a platform. The clearest outcome, though, was organisational: platform work done as product work created the product-ownership roles I have held since. (source: /work/zf-scalar)

#### Learnings

Design systems do not fail on component quality. They fail on adoption strategy, which is a product problem wearing an engineering costume. The teams that had to migrate needed a reason that was true for them this quarter, not an argument about long-term consistency. (source: /work/zf-scalar)

Developer experience is product work. It has users, a roadmap, competitors (the copy-pasted local component) and a retention problem. Framing it that way is what made it fundable. (source: /work/zf-scalar)

#### Shopify

- Years: 2021 to 2023. A job. (source: /work#shopify)
- In the list: "Shipped Shop Minis from 0." (source: /work#shopify)
- What it is: Built Shop Minis from zero. (source: /)
- On the home page, about Shopify: "Two years on the Shop app. I helped build Shop Minis from zero, with the best product people I ever worked with." (SHOP APP · 30M+ MONTHLY USERS) (source: /)
- In "Recent work", Shop Minis: Small apps inside Shopify's Shop app, built from zero with ten partners (2021 to 2023) (source: /#recent-work)
- Two years on Shopify's Shop app. I helped build Shop Minis from zero, with the first ten partners, alongside the best product people I ever worked with. Facts: 2021 to 2023; Shop app · 30M+ monthly users. (source: /#recent-work)
- Shop Minis: Small apps inside Shopify's Shop app, built from zero with ten partners (source: /)
- On his CV (2021 to 2023): Senior Software Engineer. Shop app. Helped build Shop Minis from zero. (source: /about)

Case study page: /work/shopify (source: /work/shopify)

- Role: Senior Software Engineer, Shop Minis. (source: /work/shopify)
- When: April 2021 to June 2023. (source: /work/shopify)
- In one line: Shop Minis from zero: mini React Native apps inside Shop.app, plus the SDK and partner ecosystem. (source: /work/shopify)
- Worked on Shop Minis from the first prototype: a system for embedding third-party mini apps inside Shop.app, with the SDK, review pipeline and partner tooling that had to exist around it. Forward-deployed with the earliest partner builders, and contributed to Shopify checkout. (source: /work/shopify)
- This was employed work. The site describes the role and the shape of the contribution only; private metrics, internal screenshots and system details are left out on purpose. (source: /work/shopify)
- Public number: 30M+ monthly active users on Shop.app. (source: /work/shopify)
- Public number: 10 first building partners on Shop Minis. (source: /work/shopify)
- Link: Shop Minis, https://shop.app/minis (source: /work/shopify)
- Link: Shop.app, https://shop.app (source: /work/shopify)

#### Summary

I spent a little over two years at Shopify, most of it on Shop Minis: an exploration that became a mini-app ecosystem embedded inside Shop.app. It started as a prototype with a small team and ended as a platform with an SDK, a submission pipeline and outside developers building on it. (source: /work/shopify)

#### Role and scope

Senior software engineer, working from zero on Shop Minis: the runtime for embedding mini React Native apps inside the main Shop application, the SDK and building blocks partners used, and the ecosystem around submission, upload, maintenance and promotion. I worked directly with the first partner builders in a forward-deployed style: their bug reports were my backlog. I also contributed to Shopify checkout, a surface that renders across a very large number of stores, and spent six months interviewing. (source: /work/shopify)

#### Context

Shopify runs on high agency: work is self-directed and the quality bar is assumed rather than enforced by process. A prototype has to earn its way into the product, and once it is in the product it inherits consumer-scale expectations immediately. (source: /work/shopify)

#### Problem

A super-app model breaks most of the assumptions a normal app is built on. Third-party code renders inside your surface, so the platform owns their performance problems and their failure modes. Partners need an SDK that is small enough to learn in an afternoon and complete enough to build something real. And every feature has to work on a low-end device on a slow connection, because a meaningful share of commerce happens there. (source: /work/shopify)

#### Decisions

The SDK was designed around the components partners actually needed to build a shoppable experience, not around exposing the platform's internals. Fewer, higher-level building blocks meant less support surface and fewer ways to render something that looked broken inside Shop. (source: /work/shopify)

For the live-streaming work, the safety mechanics were part of the feature definition rather than a follow-up: kill switches, spam controls, moderation and takedown paths shipped with it. At that scale, the question is not whether something will be abused but how quickly it can be turned off. (source: /work/shopify)

Performance targets were set against the slowest realistic device and network rather than the average, because the average hides the users you are actually losing. (source: /work/shopify)

#### Contribution

Built and shipped parts of the Minis runtime and SDK, worked on the partner-facing developer experience end to end, and helped take the system from a prototype to something the first cohort of external builders shipped on. Contributed to checkout. Interviewed candidates for over six months. (source: /work/shopify)

#### Outcome

Shop Minis went from zero to a working partner ecosystem, with the first ten building partners shipping into an app that has more than 30 million monthly active users. My role ended in the May 2023 layoffs, along with roughly three thousand other people. (source: /work/shopify)

#### Learnings

Consumer scale is a different discipline, not a bigger version of the same one. Kill switches, staged rollouts and takedown flows are product features with real design cost, and they are cheapest when designed with the thing they protect. (source: /work/shopify)

Building a platform means your users are developers, and developer trust is slow to earn and fast to lose. One breaking change in an SDK costs more goodwill than three good releases earn. (source: /work/shopify)

#### HEGIAS

- Years: 2020 to 2021. A job. (source: /work#hegias)
- In the list: "Team lead of six, VR for architects." (source: /work#hegias)
- On his CV (2020 to 2021): Senior Full Stack Developer. Led a team of six building VR and AR for architecture. (source: /about)

Case study page: /work/hegias (source: /work/hegias)

- Role: Senior Full Stack Developer. (source: /work/hegias)
- When: July 2020 to April 2021. (source: /work/hegias)
- In one line: Moving an AR/VR MVP toward production: 3D pipelines, microservices on AWS, in-app voice. (source: /work/hegias)
- HEGIAS made browser-based VR for architecture and real estate: upload a building model, walk through it in a browser or a headset. From July 2020 to April 2021 I led the full-stack work on the HEGIAS CMS, the web app where all of that happened. (source: /work/hegias)
- Link: HEGIAS, https://hegias.com (source: /work/hegias)

#### Summary

HEGIAS is a Zurich company that makes browser-based 3D and VR for architecture and real estate. When I was there, from July 2020 to April 2021, it sold one product, HEGIAS VR: upload a building model, then walk through it with others in a browser or a headset. The product existed as an MVP, and my job was to help make it something a paying customer could depend on. It was also the job that brought me to Switzerland. (source: /work/hegias)

#### What I was responsible for

I reported to the CTO and was responsible across the stack: the frontend and CMS, the backend, infrastructure, internal tooling, the component library and integrations. My job was to get the teams aligned and working together, not in silos. (source: /work/hegias)

I started the web app and the component library it is built from, and worked with the 3D developers on the layer that draws the scenes. (source: /work/hegias)

#### What the product looked like

Work is organised as organisation, then project, then scene, and three switchers in the header let you jump between them from anywhere. A scene opens as a docked workspace: the 3D editor with its toolbar, a library of furniture and materials beside it, and tabs for the details, the uploaded files with their processing status, and share links. Behind that sit the parts a paid product needs: sign-in and registration, members with five roles, organisation settings, subscriptions and payment, all in four languages. (source: /work/hegias)

The pictures here were recreated in 2026 with invented data. Every organisation, person, building and piece of furniture on screen is made up. (source: /work/hegias)

#### How it was built

- Web app: React and TypeScript, Ant Design and styled-components, forms with react-hook-form, translations with i18next in German, English, French and Italian. (source: /work/hegias)

- Component library: our own React components and icon set, documented in Storybook, so every screen of the app is built from the same cards, chips, inputs and buttons. (source: /work/hegias)

- 3D: A-Frame on three.js, with a multiuser layer so people could walk through a scene together. (source: /work/hegias)

- Backend: microservices on AWS, with heavy model processing moved out of the request path into background jobs, in-app voice, and integrations with third-party 3D model libraries. (source: /work/hegias)

#### Internxt

- Years: 2019. Freelance work for a client. (source: /work#internxt)
- In the list: "Freelance. Built their first mobile app, then handed it on." (source: /work#internxt)
- Website (Internxt): https://internxt.com (source: /work#internxt)

#### WolkAbout

- Years: 2017 to 2020. A job. (source: /work#wolkabout)
- In the list: "Led the core of an IoT platform." (source: /work#wolkabout)
- On his CV (2017 to 2020): Senior Frontend Engineer. Led the core of an IoT platform, as team lead by the end. (source: /about)

Case study page: /work/wolkabout (source: /work/wolkabout)

- Role: Frontend engineer, junior to senior, then team lead. (source: /work/wolkabout)
- When: July 2017 to June 2020. (source: /work/wolkabout)
- In one line: Junior to senior in three years: Angular frontends for an IoT platform moving large volumes of live data. (source: /work/wolkabout)
- WolkAbout made an IoT platform: backend software that connects devices and keeps their data, and WolkReact, the web and mobile apps on top of it. From 2017 to 2020 I built its modular Angular front end from the ground up, and the REST client and component library around it. (source: /work/wolkabout)
- Link: @wolkabout/wolk-rest on npm, https://www.npmjs.com/package/@wolkabout/wolk-rest (source: /work/wolkabout)
- Link: wolkabout.com (Web Archive), https://web.archive.org/web/20210616143417/https://wolkabout.com/ (source: /work/wolkabout)

#### Summary

WolkAbout made an IoT platform: backend software that connects devices, stores and processes what they send, and WolkReact, the web and mobile apps on top of it for device management, dashboards, rules, messages and reports. Its engineering was in Novi Sad. I came over from Execom in July 2017 and stayed until June 2020, growing from a junior developer into a senior one and, for the last months, a team lead. (source: /work/wolkabout)

#### What I was responsible for

Everything frontend, research and development, the marketing website, customer relationships, automations, and the CI/CD and infrastructure tooling. (source: /work/wolkabout)

- I built a modular, micro-frontend Angular application from the ground up, with a focus on performance, scalability and extensibility. (source: /work/wolkabout)

- I built a set of tools to speed up development on the WolkAbout Platform: a Node.js TypeScript REST client and a UI component library in Angular. (source: /work/wolkabout)

- I was the solo developer on the company website. (source: /work/wolkabout)

#### What the product looked like

WolkReact opens on a launcher. Each tile is a separate application with its own menu: platform management, administration, devices, data, rules, and visualisation and monitoring. Dashboards are grids of typed widgets, each loading its own data. The same table, filters and detail panel run through devices, points, rules and users, so the modules feel like one product although each one ships on its own. (source: /work/wolkabout)

The pictures were recreated in 2026 with invented data: no campus, building, device or person on screen is real. They were made from a build of April 2021, ten months after I left, so they show the product a little further on than I last saw it, on the same architecture. The 2019 screenshot is the company's own, from its website. (source: /work/wolkabout)

#### How it was built

- One Nx monorepo for the whole web front end, with every application module and every shared library its own package under @wolkabout/, so modules could be composed per installation and teams could ship without blocking each other. (source: /work/wolkabout)

- Angular and TypeScript, RxJS, NgRx for state, Angular Material, Storybook and Jest. (source: /work/wolkabout)

- Live data arrived as streams over MQTT on a WebSocket. We treated it as streams, throttled and batched at the edge of the app instead of inside components, so a busy device did not redraw a whole dashboard. (source: /work/wolkabout)

- Every screen talks to the platform through the same REST client, @wolkabout/wolk-rest, which is still on npm. (source: /work/wolkabout)

#### Execom

- Years: 2016 to 2017. A job. (source: /work#execom)
- In the list: "Many client projects at a fast pace. I loved it." (source: /work#execom)
- On his CV (2016 to 2017): Frontend Engineer. Many client projects at once, something new to learn and pressure every day. I loved the pace. (source: /about)

#### Nemestic Studio

- Years: 2010 to 2011. A job. (source: /work#nemestic)
- In the list: "Dozens of client projects." (source: /work#nemestic)
- On his CV (2010 to 2011): Web Developer. Dozens of client projects in a small studio. (source: /about)

## The early sites

- Building since: 2004. (source: /press)
- Baby Robin, a baby shop's website, 2005. Caption: Baby Robin, 2005. My early Photoshop and Dreamweaver days. A static website for a kids' store in Belgrade. (source: /about)
- Sara Trade, a phone accessories and fishing shop's website, 2009. Caption: Sara Trade, 2009. A custom inventory app in PHP and a website with a shop, for a local business. (source: /about)
- iglica.rs, a news magazine, 2011. Caption: iglica.rs, 2011. A digital magazine I ran for more than a year. (source: /about)
- otompotom.com, a humour site, 2012. Caption: otompotom.com, 2012. Co-founded with the owners of a huge Facebook community. It made money, and we never met in person. (source: /about)

## Mentoring

- I've mentored on MentorCruise since 2021, with a 5.0 average from 51 reviews. These days I take someone on only when I can really help. (source: /mentoring)
- 5.0 from 51 reviews on MentorCruise, mentoring since 2021. These days I take someone on only when I can really help. (source: /#mentoring)
- Public figures from his MentorCruise profile: average rating 5.0; reviews on MentorCruise 51; longest mentorship 2 years. (source: /mentoring)

### We may be a good fit if…

- you are switching into frontend or product engineering and want accountability, not hand-holding. (source: /mentoring)
- you are a senior engineer moving toward product ownership, or leading a platform team for the first time. (source: /mentoring)
- you are building your own product next to a full-time job. (source: /mentoring)

### We're probably not a good fit if…

- you want someone to do the work for you. (source: /mentoring)
- you want interview answers to memorise. (source: /mentoring)

### How it works

- 01. A short intro call. No pitch. (source: /mentoring)
- 02. If it fits, we set goals you can measure. (source: /mentoring)
- 03. Tests, exercises and projects. I tell you honestly where you stand. (source: /mentoring)

### How to start

- Think it's a fit? Book a 15-minute call (https://cal.com/ruzicic/15m-discovery-session). (source: /mentoring)
- Or write to me. (write to me: me@mladenruzicic.com) (source: /mentoring)

### What mentees said

- People I have mentored on MentorCruise since 2021, in their own words. (source: /mentoring)
- "What I liked most was that his guidance was not only insightful, but also very human. He listened well, understood where I was coming from, and gave advice that felt relevant and actionable." (Maximilian, via MentorCruise, mentee for 1 month, 2026) (source: /mentoring)
- "No hand-holding. He is a great accountability partner who will show you where you are in development through tests, exercises, and projects." (Monikka Edgeston, via MentorCruise, mentee for 2 months, 2022) (source: /mentoring)
- "Don't get me wrong, he will tell you what you need to hear many times, and that can sometimes not be what you want to hear, but I think that's one of the biggest benefits of having a mentor." (Juan, via MentorCruise, mentee for 2 months, 2025) (source: /mentoring)
- "Having Mladen as a mentor gave me the last push I needed in my career switch journey. He helped me achieve my goals even earlier than expected." (Juliana Scapucin, via MentorCruise, mentee for 1 month, 2022) (source: /mentoring)
- "He was checking in daily, following my progress, and making sure I stay on track with my goals. That kind of consistency really helped me stay focused." (Aleksandar, via MentorCruise, mentee for 3 months, 2025) (source: /mentoring)
- "Mladen knows how to take control of the conversation and keep it focused on progress and results. Great dude that knows his stuff." (Jobany Aguilar, via MentorCruise, mentee for 1 month, 2022) (source: /mentoring)
- "I reached out to Mladen to help evaluate career growth in the new era of AI-enhanced development, and he did an honest job to identify opportunities to grow and what really matters in today's workplace." (Martynas, via MentorCruise, mentee for 2 months, 2026) (source: /mentoring)
- "Mladen gives me work to do before our next call — this helps me focus on my goals and prepare well for our meetings." (Maciek Sitkowski, via MentorCruise, mentee for 3 months, 2023) (source: /mentoring)
- "Mladen has been a great help in launching my product, providing invaluable insights on structuring my project and optimizing it for SEO." (Kristian August, via MentorCruise, mentee for 1 month, 2025) (source: /mentoring)
- "An exceptional mentor with a unique approach to peer programming, enhancing coding styles, and excellent technical decision-making." (Bruno Krauss, via MentorCruise, mentee for 2 months, 2023) (source: /mentoring)
- "As a senior software engineer, I truly appreciate this incredible guidance and advice." (Luis, via MentorCruise, mentee for 2 years, 2024) (source: /mentoring)
- "He helps me grasp many important technologies, concepts and techniques. I highly recommend Mladen if you want to become a great front-end dev." (Eyal Fisher, via MentorCruise, mentee for 8 months, 2022) (source: /mentoring)
- "With his support, I successfully built an app which I have already succeed to publish on both the App Store and Google Play." (Ivan, via MentorCruise, mentee for 6 months, 2023) (source: /mentoring)
- "Mladen has consistently provided great insight and guidance to support my tech career growth from both a professional and personal perspective. He's empathetic, insightful, and relatable, making him an ideal mentor for the industry." (Richard Esquivel, via MentorCruise, mentee for 1.5 years, 2023) (source: /mentoring)
- "He becomes a mentor as much as a friend. He truly wants to bring value during the 60 minutes together, whether that's links to check out, a pitch deck to listen through or feedback on your work." (Roki, via MentorCruise, mentee for 3 months, 2025) (source: /mentoring)
- "Mladen's guidance in code reviews and side project ideation has significantly improved my skills and portfolio. The collaborative atmosphere he fosters makes the learning process enjoyable." (Adam Gornas, via MentorCruise, mentee for 1 month, 2023) (source: /mentoring)
- "He provides valuable insights during every session and helps me focus on my goals." (Andy Yudin, via MentorCruise, mentee for 4 months, 2023) (source: /mentoring)

## How to work with him and how to reach him

- Happy to connect and meet new people. (source: /#contact)
- If you're building something and need help or advice, or you're based in Ticino and want to meet, shoot me a message on X or LinkedIn, or book us a 15-minute call. (source: /#contact)
- A few times a year I take on a small freelance project or a mentee, when the fit is really strong. (source: /)

### How I work (the home page)

- Listen: I sit with the people who have the problem until I can say it back. (source: /#how-i-work)
- Prototype: They get something they can touch within a week, then we throw away the parts that were wrong. (source: /#how-i-work)
- Ship: We ship that, not a second version of the prototype. (source: /#how-i-work)
- Stay close: I watch how people actually use it, and I stay on it after launch. (source: /#how-i-work)

### Contact

- Book a 15-minute discovery call: https://cal.com/ruzicic/15m-discovery-session. The fastest way in. (source: /#contact)
- Email: me@mladenruzicic.com. The second way to reach him. (source: /#contact)
- LinkedIn: https://www.linkedin.com/in/ruzicic/ (source: /#contact)
- X: https://x.com/ruzicic (source: /#contact)
- GitHub: https://github.com/ruzicic (source: /#contact)
- MentorCruise: https://mentors.to/ruzicic (source: /mentoring)
- CV as a PDF: /cv.pdf (source: /about)

### Press

- Short bio, ready to paste: "Mladen Ružičić is a product owner and founder based in Ticino, Switzerland. By day he is Global Product Owner at ZF, for the Driver Experience team, working on tools truck drivers use every day. Outside work he runs TenderLift, which helps Swiss companies win public tenders. He also keeps a few products running on autopilot, among them studenti.rs, online since 2008. At Shopify he helped build Shop Minis from zero." (source: /press)
- One-liner: "Product + Tech, based in Switzerland." (source: /press)
- The press kit has the short bio, one-liners, the facts and a headshot to download. For press and event organisers. (source: /press)

## A postscript on the About page

- P.S. Deep down, I believe playing League of Legends until I hit Diamond must have helped somehow. Right!? (source: /about)
- His favourite League of Legends champions: Nocturne and Morgana. (source: /about)

## Notes from Mladen

- Public notes he keeps for this assistant. (source: /about)

### What I am available for

- Happy to connect and meet new people. If you're building something and need help or advice, or you're based in Ticino and want to meet, shoot me a message on X or LinkedIn, or book us a 15-minute call. (source: /#contact)
- A few times a year I take on a project or a mentee, when the fit is strong. (source: /)
- Mentoring is for a strong fit only: these days I take someone on only when I can really help. (source: /mentoring)

### What I am not available for

- Mentoring is not a fit if you want someone to do the work for you, or interview answers to memorise. (source: /mentoring)

### Languages

- I work in Serbian, English and Italian. The Italian is seven years in and still improving. (source: /about)

### Where and when

- I live in Ticino, Switzerland, so I work on Swiss time. (source: /about)

### How to reach me

- You can reach me on X or LinkedIn, or book a 15-minute call. (source: /#contact)
- Write to me; I answer my own email: me@mladenruzicic.com. (source: /about)
- For press and event organisers, the short bio, one-liners and a headshot are on the press page. (source: /press)

### About this site

- This site was last updated on 16 November 2026. (source: /)

## Site map

The only links an answer may point to, one per line: `- <href> | <label> | <what it is>`.

- / | Home | Product + Tech, based in Switzerland. Global Product Owner by day, co-founder of TenderLift, and a few side projects that run themselves.
- /#recent-work | Recent work | The strip of recent work on the home page.
- /#everything | The list of work he has put real time into | Stuff I've put real time into
- /#how-i-work | How he works | The four steps on the home page.
- /#mentoring | Mentoring on the home page | 5.0 from 51 reviews on MentorCruise, mentoring since 2021. These days I take someone on only when I can really help.
- /#contact | Contact | Happy to connect and meet new people.
- /work | All work | Below is a list of projects I put a fairly significant chunk of time into. There's a lot more, but it would make the list too noisy.
- /about | About | From engineering to product owner and founder: the longer story, the early work and the CV.
- /mentoring | Mentoring | Mentoring, for a strong fit.
- /press | Press kit | Short bio, one-liners, facts and a headshot, ready to copy.
- /cv.pdf | CV (PDF) | Download my CV
- https://cal.com/ruzicic/15m-discovery-session | Book a 15-minute call | A 15-minute discovery call with him.
- mailto:me@mladenruzicic.com | Email Mladen | me@mladenruzicic.com
- https://www.linkedin.com/in/ruzicic/ | LinkedIn | His LinkedIn profile.
- https://x.com/ruzicic | X | His X profile.
- https://github.com/ruzicic | GitHub | His GitHub profile.
- https://mentors.to/ruzicic | MentorCruise profile | His mentor profile on MentorCruise.
- /work#tenderlift | TenderLift in the list | Its row in the list of work he has put real time into.
- https://tenderlift.ch | tenderlift.ch | TenderLift's own website
- /work/tenderlift | TenderLift case study | Swiss public-procurement intelligence for supplier-side SMEs: find, assess and win relevant tenders.
- /work#zarez | Zarez in the list | Its row in the list of work he has put real time into.
- https://zarez.rs | zarez.rs | Zarez's own website
- /work/zarez | Zarez case study | A spelling checker for Serbian, in Latin and Cyrillic.
- /work#fontalternatives | FontAlternatives in the list | Its row in the list of work he has put real time into.
- https://fontalternatives.com | fontalternatives.com | FontAlternatives's own website
- /work/fontalternatives | FontAlternatives case study | Find free alternatives to expensive typefaces. An experiment that grew into steady organic traffic.
- https://chromewebstore.google.com/detail/fontswap/mhkkpbhepfoejcjomclfmopgdabbfmkm | FontSwap (Chrome extension) | Linked from the FontAlternatives case study
- /work#studenti-rs | studenti.rs in the list | Its row in the list of work he has put real time into.
- https://studenti.rs | studenti.rs | studenti.rs's own website
- /work/studenti-rs | studenti.rs case study | Serbian student platform, running since 2008. Built it at my first job, bought it back in 2022.
- /work#ona | ONA by Alma in the list | Its row in the list of work he has put real time into.
- https://onatorba.com | ONA by Alma | Website
- /work#amada | Villa Amada in the list | Its row in the list of work he has put real time into.
- https://stayamada.com | stayamada.com | Villa Amada's own website
- /work#panciona | Panciona in the list | Its row in the list of work he has put real time into.
- /work/panciona | Panciona case study | A white-label app for coaches, trainers and nutritionists to give to their own clients, on their own domain.
- /work#hi-fam | Hi Fam in the list | Its row in the list of work he has put real time into.
- /work#flexmatch | FlexMatch in the list | Its row in the list of work he has put real time into.
- /work#nunium | Nunium in the list | Its row in the list of work he has put real time into.
- /work#zf-scalar | ZF in the list | Its row in the list of work he has put real time into.
- /work/zf-scalar | ZF SCALAR case study | From individual contributor to engineering manager of the platform team, to product owner of several products.
- /work#shopify | Shopify in the list | Its row in the list of work he has put real time into.
- /work/shopify | Shopify case study | Shop Minis from zero: mini React Native apps inside Shop.app, plus the SDK and partner ecosystem.
- https://shop.app/minis | Shop Minis | Linked from the Shopify case study
- https://shop.app | Shop.app | Linked from the Shopify case study
- /work#hegias | HEGIAS in the list | Its row in the list of work he has put real time into.
- /work/hegias | HEGIAS case study | Moving an AR/VR MVP toward production: 3D pipelines, microservices on AWS, in-app voice.
- https://hegias.com | HEGIAS | Linked from the HEGIAS case study
- /work#internxt | Internxt in the list | Its row in the list of work he has put real time into.
- https://internxt.com | internxt.com | Internxt's own website
- /work#wolkabout | WolkAbout in the list | Its row in the list of work he has put real time into.
- /work/wolkabout | WolkAbout case study | Junior to senior in three years: Angular frontends for an IoT platform moving large volumes of live data.
- https://www.npmjs.com/package/@wolkabout/wolk-rest | @wolkabout/wolk-rest on npm | Linked from the WolkAbout case study
- https://web.archive.org/web/20210616143417/https://wolkabout.com/ | wolkabout.com (Web Archive) | Linked from the WolkAbout case study
- /work#execom | Execom in the list | Its row in the list of work he has put real time into.
- /work#nemestic | Nemestic Studio in the list | Its row in the list of work he has put real time into.
