# Website v3 planning

This folder is the implementation brief for the next version of `mladenruzicic.com`.

## Goal

Rebuild the site as a modern personal brand surface for:

- senior IC and member of technical staff opportunities
- staff or principal engineering roles
- technical product leadership
- founder-in-residence, cofounder and startup conversations
- selected consulting and advisory work
- selective mentoring as proof of leadership, not the primary conversion goal

## Read order

1. `WEBSITE_V3_STRATEGY.md`
2. `CLAUDE_DESIGN_BRIEF.md`
3. `DESIGN_SYSTEM_SPEC.md`
4. `COMPONENT_SYSTEM_SPEC.md`
5. `PAGE_SPECS.md`
6. `COPY_DECK.md`
7. `CONTENT_MODEL_SPEC.md`
8. `PROJECT_CASE_STUDY_TEMPLATE.md`
9. `ASSET_SHOT_LIST.md`
10. `IMPLEMENTATION_PLAN.md`
11. `GITHUB_ISSUES.md`
12. `QA_ACCEPTANCE_CRITERIA.md`
13. `OPEN_QUESTIONS.md`

## Repository facts this plan is grounded in

- Current app is Next.js with App Router, MDX, Tailwind, Framer Motion and Fathom.
- Current homepage still leads with generic positioning, family imagery and a mentorship-heavy funnel.
- Current work page is a hard-coded list rather than a typed content system.
- Current metadata still says `Software developer, mentor, and entrepreneur`, which undersells the intended positioning.

## Implementation stance

Keep Next.js. The problem is not framework choice. The problem is positioning, content architecture, design system, media system and execution discipline.

## Claude Design handoff

Use `CLAUDE_DESIGN_BRIEF.md` as the main input. It asks Claude Design for three visual directions and a production convergence:

1. Editorial technical
2. Operating system / command center
3. Product lab / case-study driven

Then use Claude Code to implement the selected direction from the other specs.
