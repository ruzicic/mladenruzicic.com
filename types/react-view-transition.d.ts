/**
 * `<ViewTransition>` ships in the React build that Next 16.3 bundles
 * (`next/dist/compiled/react`, which `react` is aliased to at build time), but
 * it is not yet declared in `@types/react@19.2`. This augmentation adds the
 * types so `import { ViewTransition } from 'react'` typechecks.
 *
 * Delete this file once @types/react declares ViewTransition.
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
