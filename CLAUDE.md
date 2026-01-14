# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server at localhost:3000
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm format:write # Auto-format with Prettier
pnpm format:check # Check formatting
```

## Architecture

**Next.js 13+ App Router** - Uses `app/` directory, not Pages Router.

### Key Directories
- `app/` - Pages, layouts, and route components
- `app/components/` - Reusable React components
- `lib/constants.ts` - Routes, URLs, static data (projects, mentorship steps)
- `lib/utils.ts` - `cn()` utility for Tailwind class merging
- `docs/` - Design system and website specs

### Patterns
- **CVA (Class Variance Authority)** for component variants - see `Button.tsx`
- **Suspense boundaries** for client components (Header, Analytics)
- **MDX** for content pages (`about/page.mdx`)
- **Static data** - No CMS; content lives in TypeScript constants

### Styling
- Tailwind CSS with custom tokens in `tailwind.config.ts`
- Primary: `#1E1E1E`, Accent: `#F1FE92`
- Use `cn()` from `lib/utils` to merge Tailwind classes safely
- Follow `docs/design-system.md` for spacing, typography, components

## CI/CD

GitHub Actions runs lint, format check, and build on PRs. Deploys to Vercel.

## Environment Variables

See `.env.example`: `SITE_URL`, `NEXT_PUBLIC_FATHOM_SITE_ID`, `CONVERTKIT_API_KEY`
