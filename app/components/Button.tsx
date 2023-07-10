import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90",
        outline: "border border-gray-800 hover:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-5 py-3",
        small: "h-8 px-4",
        icon: "h-10 w-10 p-2",
        auto: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  VariantProps<typeof buttonVariants> & {
    renderAs?: React.ElementType
    href?: string
  }

export const Button = ({
  children,
  variant,
  size,
  renderAs = Link,
  className,
  ...props
}: ButtonProps) => {
  // if `renderAs` is provided, use it
  // if `href` is provided, use `Link` component
  // if `onClick` is provided, use `button` element
  // otherwise, throw an error
  const Component = renderAs
    ? renderAs
    : props.href
    ? Link
    : props.onClick
    ? "button"
    : (() => {
        throw new Error(
          "Button component must have either `renderAs`, `href`, or `onClick` prop"
        )
      })()

  return (
    <Component
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </Component>
  )
}
