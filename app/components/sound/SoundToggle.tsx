"use client"

import { cn } from "@/lib/utils"

import { useSound } from "./useSound"

export interface SoundToggleProps {
  /** Full-width variant used inside the mobile pill sheet. */
  block?: boolean
  className?: string
}

/**
 * The one sound control, shared by the header and the mobile pill sheet.
 * `aria-pressed` carries the state; the dot is decoration.
 */
export function SoundToggle({ block = false, className }: SoundToggleProps) {
  const { enabled, toggle } = useSound()

  return (
    <button
      type="button"
      data-hover
      aria-pressed={enabled}
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-2 rounded-pill border px-3 py-[6px]",
        "border-[var(--color-line-strong)] bg-transparent text-fg",
        "font-mono text-[12px] uppercase leading-none tracking-[0.06em]",
        "transition-colors duration-fast ease-pill hover:border-accent hover:text-accent",
        block && "w-full justify-center py-[10px]",
        className
      )}
    >
      <span
        aria-hidden
        className="inline-block h-[6px] w-[6px] flex-none rounded-full"
        style={{
          background: enabled ? "var(--color-accent)" : "var(--color-muted)",
        }}
      />
      {enabled ? "Sound on" : "Sound off"}
    </button>
  )
}
