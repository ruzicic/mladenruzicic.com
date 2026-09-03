import type { ReactNode } from "react"

import type { PolymorphicTag } from "./polymorphic"

export interface VisuallyHiddenProps {
  children: ReactNode
  as?: PolymorphicTag
}

/** Hidden visually, still announced by screen readers. */
export function VisuallyHidden({
  children,
  as: Tag = "span",
}: VisuallyHiddenProps) {
  return <Tag className="sr-only">{children}</Tag>
}
