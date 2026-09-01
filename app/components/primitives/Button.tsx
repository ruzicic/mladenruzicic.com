import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-mono uppercase tracking-[0.08em]",
    "rounded-pill border border-transparent",
    "transition-colors duration-fast ease-pill",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-accent text-bg hover:bg-fg hover:text-bg",
        outline: "border-line text-fg hover:border-accent hover:text-accent",
        ghost: "text-muted hover:text-accent",
      },
      size: {
        sm: "h-8 px-3 text-[11px]",
        md: "h-10 px-5 text-[12px]",
        lg: "h-12 px-7 text-[13px]",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

type CommonProps = ButtonVariants & {
  children?: ReactNode
  className?: string
}

export type ButtonProps = CommonProps &
  (
    | ({ href: string } & Omit<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        "href" | "className" | "children"
      >)
    | ({ href?: undefined } & Omit<
        ButtonHTMLAttributes<HTMLButtonElement>,
        "className" | "children"
      >)
  )

/**
 * Renders `next/link` when `href` is present, otherwise a real `<button>`.
 * External `href`s (anything not starting with `/` or `#`) get
 * `target="_blank" rel="noreferrer noopener"` unless overridden.
 *
 * Never throws — a `<button>` with no accessible name is a lint/axe problem,
 * not a runtime crash.
 */
export function Button({
  children,
  variant,
  size,
  className,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className)

  if (typeof props.href === "string") {
    const { href, ...rest } = props as { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>
    const external = /^https?:\/\//.test(href)
    return (
      <Link
        href={href}
        className={classes}
        {...(external
          ? { target: "_blank", rel: "noreferrer noopener" }
          : null)}
        {...rest}
      >
        {children}
      </Link>
    )
  }

  const { type = "button", ...rest } =
    props as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}

export { buttonVariants }
