import type { ComponentPropsWithRef, ElementType, ReactNode } from "react"
// clsx, not `cn`: this renders inside client islands, and `cn` pulls
// tailwind-merge (about 8 KB gzipped) into their chunks.
import { clsx } from "clsx"

import "../../styles/button.css"

export type ButtonSize = "regular" | "compact" | "icon"
export type ButtonTone = "light" | "dark"
export type ButtonEffect = "sweep" | "cells"

interface ButtonOwnProps<C extends ElementType> {
  /**
   * The element: `button` (default, `type="button"` unless given), `"a"`, or
   * a link component (`TransitionLink`). A control that navigates stays a
   * link.
   */
  as?: C
  /** `regular`: the Ask size (48px). `compact`: 36px. `icon`: a 36px square. Phones: 44px. */
  size?: ButtonSize
  /** `dark` on the night footer. Same shape. */
  tone?: ButtonTone
  /**
   * `sweep` (default): the fill rising from the bottom edge with the label
   * inverting. `cells`: the Ask button's own fill, drawn by its children
   * (`AskFace`, `app/styles/ask.css`); nothing else uses it.
   */
  effect?: ButtonEffect
  className?: string
  children?: ReactNode
}

export type ButtonProps<C extends ElementType = "button"> = ButtonOwnProps<C> &
  Omit<ComponentPropsWithRef<C>, keyof ButtonOwnProps<C>>

/**
 * Every button on the site, in the Ask button's shape (`app/styles/button.css`
 * has the shape, the effect and the reasoning). No client code: it renders in
 * Server and Client Components alike.
 *
 * ```tsx
 * <Button onClick={copy}>Copy</Button>
 * <Button size="icon" aria-label="Pause"><PauseIcon /></Button>
 * <Button as="a" href="/cv.pdf" download="">Download CV</Button>
 * <Button tone="dark" type="submit" disabled={pending} aria-busy={pending}>Subscribe</Button>
 * ```
 */
export function Button<C extends ElementType = "button">({
  as,
  size = "regular",
  tone = "light",
  effect = "sweep",
  className,
  ...rest
}: ButtonProps<C>) {
  const Tag: ElementType = as ?? "button"
  const props = rest as Record<string, unknown>
  return (
    <Tag
      type={Tag === "button" && props.type === undefined ? "button" : undefined}
      {...props}
      className={clsx("btn", className)}
      data-size={size === "regular" ? undefined : size}
      data-tone={tone === "light" ? undefined : tone}
      data-effect={effect === "sweep" ? undefined : effect}
    />
  )
}
