/**
 * `<ViewTransition>` ships in the React build that Next 16.3 bundles
 * (`next/dist/compiled/react`, which `react` is aliased to at build time), but
 * it is not usable from `@types/react@19.2`: the package declares
 * `ViewTransition` only in `canary.d.ts`, which nothing here opts into. This
 * augmentation adds the types so `import { ViewTransition } from 'react'`
 * typechecks.
 *
 * DELETE THIS FILE once `ViewTransition` moves out of
 * `@types/react/canary.d.ts` into `index.d.ts` — "once the types ship
 * upstream" is not the condition; they have shipped, just not on the stable
 * entry point. Check with:
 *
 *   grep -l ViewTransition node_modules/@types/react/index.d.ts
 *
 * See docs/v3-redesign-plan.md §5.3.
 */
import "react"

declare module "react" {
  type ViewTransitionClass = string | "none" | "auto"

  type ViewTransitionClassPerType =
    | ViewTransitionClass
    | { [transitionType: string]: ViewTransitionClass }

  interface ViewTransitionInstance {
    group: Animatable
    imagePair: Animatable
    old: Animatable
    new: Animatable
  }

  interface ViewTransitionProps {
    children?: ReactNode
    /** Pairs old/new elements across commits. */
    name?: string
    default?: ViewTransitionClassPerType
    enter?: ViewTransitionClassPerType
    exit?: ViewTransitionClassPerType
    update?: ViewTransitionClassPerType
    share?: ViewTransitionClassPerType
    onEnter?: (instance: ViewTransitionInstance, types: string[]) => void
    onExit?: (instance: ViewTransitionInstance, types: string[]) => void
    onShare?: (instance: ViewTransitionInstance, types: string[]) => void
    onUpdate?: (instance: ViewTransitionInstance, types: string[]) => void
    ref?: Ref<ViewTransitionInstance>
  }

  export const ViewTransition: ExoticComponent<ViewTransitionProps>
}
