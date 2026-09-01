/**
 * The shared-element names used by the work morph — docs/v3-redesign-plan.md §5.3.
 *
 * The SAME two names must be used on `/` (the homepage work rows), on `/work`
 * (the cards) and on `/work/[slug]` (the case-study header), or the pair never
 * forms and the navigation degrades to a crossfade.
 *
 * `workArtTransitionName` is re-exported from the primitives so there is exactly
 * one definition; `workTitleTransitionName` is defined here and re-exported from
 * `@/app/components/work-system`.
 */
export { workArtTransitionName } from "../primitives/PageTransition"

/** Stable name for a work item's title, used on `/`, `/work` and `/work/[slug]`. */
export function workTitleTransitionName(slug: string) {
  return `work-title-${slug}`
}

/** The view-transition class both halves of the morph share. */
export const MORPH_CLASS = "vt-morph"
