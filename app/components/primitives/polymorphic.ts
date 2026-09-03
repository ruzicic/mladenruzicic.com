import type { CSSProperties, ElementType, ReactNode } from "react"

/**
 * The `as` prop type for polymorphic primitives.
 *
 * Why not plain `ElementType`: `@react-three/fiber` widens
 * `React.JSX.IntrinsicElements` with every three.js export (see its
 * `three-types.d.ts`), and non-constructor exports map to `never`. Once the
 * hero canvas is anywhere in the program, bare `ElementType` therefore includes
 * tags whose attributes are `never`, and TypeScript stops letting a polymorphic
 * component pass `children`, `className`, `id` or `style`.
 *
 * Constraining `ElementType<P>` filters those out — `never` accepts no `P` —
 * while still allowing every host tag and component these primitives are used
 * with. Runtime behaviour is unchanged.
 */
export type PolymorphicTag = ElementType<{
  children?: ReactNode
  className?: string
  id?: string
  style?: CSSProperties
}>
