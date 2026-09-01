import type { ElementType, ReactNode } from "react"

export interface VisuallyHiddenProps {
  children: ReactNode
  as?: ElementType
}

/** Hidden visually, still announced by screen readers. */
export function VisuallyHidden({
  children,
  as: Tag = "span",
}: VisuallyHiddenProps) {
  return <Tag className="sr-only">{children}</Tag>
}
