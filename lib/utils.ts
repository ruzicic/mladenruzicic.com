import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * tailwind-merge has to know the custom `--text-*` size tokens from
 * `app/globals.css`. Without this it reads `text-label` as a text COLOUR, and
 * `cn("text-label text-muted")` silently drops the size; and two radius or
 * easing tokens would not override each other. Keep these lists in step with
 * the `--text-*`, `--radius-*` and `--ease-*` keys in `@theme`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "label",
        "meta",
        "small",
        "ui",
        "body",
        "quote",
        "title",
        "headline",
      ],
      radius: ["control", "panel", "field", "card", "sheet", "page", "pill"],
      ease: ["out", "standard", "in"],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
