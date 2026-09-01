"use client"

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { cn } from "@/lib/utils"

export interface DialogProps {
  /** Controlled open state. */
  open: boolean
  /** Called whenever the dialog closes (Escape, backdrop, close button). */
  onClose: () => void
  children: ReactNode
  /** Accessible name. Rendered visually hidden if `hideTitle`. */
  title: string
  hideTitle?: boolean
  className?: string
  /** Extra classes for the inner scroll container. */
  bodyClassName?: string
}

type DialogWithRequestClose = HTMLDialogElement & {
  requestClose?: (returnValue?: string) => void
}

/**
 * Native `<dialog>` modal — docs/v3-redesign-plan.md §5.6.
 *
 * - `showModal()` / `requestClose()` (cancellable) with a `close()` fallback.
 * - `closedby="any"` for light dismissal, plus a backdrop-click handler because
 *   Safari does not ship `closedby` yet.
 * - Enter/exit animate via `@starting-style` + `transition-behavior: allow-discrete`
 *   (see the inline `<style>` block; scoped to `[data-dialog]`).
 * - Focus returns to whatever was focused when the dialog opened.
 * - Body scroll lock via `:has(dialog[open])`, `overscroll-behavior: contain`.
 */
export function Dialog({
  open,
  onClose,
  children,
  title,
  hideTitle = true,
  className,
  bodyClassName,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const invokerRef = useRef<Element | null>(null)
  const titleId = useId()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      invokerRef.current = document.activeElement
      el.showModal()
    } else if (!open && el.open) {
      el.close()
    }
  }, [open])

  // Return focus to the invoker.
  useEffect(() => {
    if (open) return
    const invoker = invokerRef.current
    if (invoker instanceof HTMLElement) invoker.focus()
  }, [open])

  const requestClose = useCallback(() => {
    const el = ref.current as DialogWithRequestClose | null
    if (el?.requestClose) el.requestClose()
    else onClose()
  }, [onClose])

  return (
    <dialog
      ref={ref}
      data-dialog=""
      aria-labelledby={titleId}
      // `closedby="any"` gives native light dismissal where supported.
      closedby="any"
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        // Backdrop-click fallback for browsers without `closedby`.
        if (event.target === ref.current) requestClose()
      }}
      className={cn(
        "m-auto max-h-[85dvh] w-[min(92vw,900px)] overscroll-contain",
        "rounded-sm border border-line bg-surface p-0 text-fg",
        className
      )}
    >
      <div className={cn("max-h-[85dvh] overflow-y-auto p-6", bodyClassName)}>
        <h2
          id={titleId}
          className={cn(
            "m-0 mb-4 font-mono text-[12px] uppercase tracking-[0.08em] text-muted",
            hideTitle && "sr-only"
          )}
        >
          {title}
        </h2>
        {children}
      </div>
      <style>{DIALOG_CSS}</style>
    </dialog>
  )
}

const DIALOG_CSS = `
dialog[data-dialog] {
  opacity: 0;
  translate: 0 8px;
  transition:
    opacity var(--duration-base) var(--ease-reveal),
    translate var(--duration-base) var(--ease-reveal),
    overlay var(--duration-base) allow-discrete,
    display var(--duration-base) allow-discrete;
}
dialog[data-dialog][open] { opacity: 1; translate: 0 0; }
@starting-style { dialog[data-dialog][open] { opacity: 0; translate: 0 8px; } }
dialog[data-dialog]::backdrop {
  background: color-mix(in srgb, #0B0B0C 70%, transparent);
  backdrop-filter: blur(8px);
  opacity: 0;
  transition: opacity var(--duration-base) var(--ease-reveal), display var(--duration-base) allow-discrete, overlay var(--duration-base) allow-discrete;
}
dialog[data-dialog][open]::backdrop { opacity: 1; }
@starting-style { dialog[data-dialog][open]::backdrop { opacity: 0; } }
html:has(dialog[data-dialog][open]) { overflow: hidden; }
@media (prefers-reduced-motion: reduce) {
  dialog[data-dialog], dialog[data-dialog]::backdrop { transition-duration: 1ms; }
}
`

export interface UseDialog {
  open: boolean
  show: () => void
  close: () => void
  toggle: () => void
  /** Spread onto `<Dialog {...dialog.props} />`. */
  props: { open: boolean; onClose: () => void }
}

/** Small state helper so callers never wire `open`/`onClose` by hand. */
export function useDialog(initial = false): UseDialog {
  const [open, setOpen] = useState(initial)
  const show = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((v) => !v), [])
  return { open, show, close, toggle, props: { open, onClose: close } }
}
