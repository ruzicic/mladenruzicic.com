export interface SkipLinkProps {
  /** Target element id. Must exist on every page. Default `main`. */
  targetId?: string
  children?: string
}

/** First focusable element in `<body>`; visible only while focused. */
export function SkipLink({
  targetId = "main",
  children = "Skip to content",
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-control focus:bg-ink focus:px-4 focus:py-3 focus:text-ui focus:font-medium focus:text-paper focus:no-underline"
    >
      {children}
    </a>
  )
}
