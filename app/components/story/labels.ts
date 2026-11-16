import { getWorkPage } from "@/lib/content"

/**
 * Interface words on the case-study template, from content
 * (`content/pages/work.ts`, `getWorkPage().story`). Server-only: the story
 * components that use it are Server Components.
 */
export const STORY_LABELS = getWorkPage().story
