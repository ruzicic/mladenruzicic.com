import type { ErrorPage } from "@/lib/content/schema"

/**
 * `app/error.tsx`: what a reader sees when a page fails to render. A plain
 * object, not `parseOrThrow`: the error boundary is a client component and
 * must not pull zod into the browser. `lib/content/index.ts` validates it at
 * build time like every other file.
 */
export const ERROR_PAGE = {
  label: "Error",
  title: "Something broke.",
  line: "This page failed to load. Try again, or start from the top.",
  retryLabel: "Try again",
  links: [
    { label: "Home", href: "/" },
    { label: "Everything I've built", href: "/work" },
  ],
} satisfies ErrorPage
