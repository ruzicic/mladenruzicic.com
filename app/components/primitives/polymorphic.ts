import type { CSSProperties, ElementType, ReactNode } from "react"

/**
 * The `as` prop type for polymorphic primitives: any host tag or component
 * that accepts `children`, `className`, `id` and `style`.
 */
export type PolymorphicTag = ElementType<{
  children?: ReactNode
  className?: string
  id?: string
  style?: CSSProperties
}>
