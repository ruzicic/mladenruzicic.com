import type { Confidentiality } from "@/lib/content/schema"
import { cn } from "@/lib/utils"

const NOTICES: Record<Exclude<Confidentiality, "public">, string> = {
  limited:
    "Public surfaces only. This was employed work, so this page describes the role, the domain and the shape of the contribution. Private metrics, internal screenshots and system details are left out.",
  high: "Public surfaces only. This work is sensitive, so the description stays generic: no screenshots, no system details, and no company claims that are not already public.",
}

export interface ConfidentialityNoticeProps {
  confidentiality: Confidentiality
  className?: string
}

/**
 * The `limited` / `high` disclosure — docs/v3-fable-pack/06 "Case-study
 * confidentiality modes". Renders nothing for `public`, so it can be dropped in
 * unconditionally.
 */
export function ConfidentialityNotice({
  confidentiality,
  className,
}: ConfidentialityNoticeProps) {
  if (confidentiality === "public") return null

  return (
    <aside
      aria-label="Confidentiality"
      className={cn(
        "max-w-[68ch] rounded-sm border border-line-soft bg-surface-3 p-5",
        className
      )}
    >
      <p className="m-0 mb-2 font-mono text-[10px] uppercase leading-none tracking-[0.1em] text-accent">
        Confidentiality · {confidentiality}
      </p>
      <p className="m-0 text-[15px] leading-[1.55] text-dim-2">
        {NOTICES[confidentiality]}
      </p>
    </aside>
  )
}
