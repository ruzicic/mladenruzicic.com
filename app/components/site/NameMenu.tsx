"use client"

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ToggleEvent as ReactToggleEvent,
} from "react"

import { Icon } from "../primitives/Icon"
import { useScrollLock } from "../primitives/scroll-lock"
import { TransitionLink } from "../primitives/TransitionLink"
import { holdHeadline } from "./hold-headline"

export interface PressMenuCopy {
  hint: string
  ariaLabel: string
  copyLabel: string
  copiedLabel: string
  failedLabel: string
  downloadLabel: string
  pressKitLabel: string
  pressKitHref: string
  foot: string
}

export interface NameMenuProps {
  /**
   * On `/` the name is a button (the page's identity); elsewhere a link home.
   * Passed down from the page (`PageFrame home`), not read with
   * `usePathname()`: that needed a Suspense boundary, and on a production
   * build its fallback (a plain, unhydrated `<a href="/">`) stayed on screen
   * until React revealed the boundary, so an early click reloaded the page.
   */
  home: boolean
  name: string
  menu: PressMenuCopy
  bio: string
  headshot: { href: string; filename: string }
}

const MENU_WIDTH = 240
const LONG_PRESS_MS = 500

type FocusOptionsWithVisible = FocusOptions & { focusVisible?: boolean }

/**
 * His name in the top block, with the small press menu the owner asked for
 * ("available on right click on my avatar/name"): right-click on desktop, a
 * long press on touch, Shift+F10 or the context-menu key on the focused name.
 * The menu copies the short bio (confirming in place), downloads the
 * headshot, or opens `/press`. Only the name's own context menu is replaced;
 * the browser's stays everywhere else.
 *
 * On `/` the name is the page's identity, a button with no pointer action
 * (Enter or Space opens the menu); everywhere else it links home with the
 * back arrow, whose tip sits on the column's edge (`.site-top__name[data-back]`
 * in site.css, shared with a case study's bar).
 *
 * The menu is a `popover="auto"` (top layer, Escape, light dismiss) placed at
 * the pointer with fixed coordinates, as a native context menu is. Like a
 * native one, it holds the page still while it is open: placed in the
 * viewport, it would otherwise stay put while the name scrolled away.
 */
export function NameMenu({ name, menu, bio, headshot, home }: NameMenuProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const menuId = `press-menu-${uid}`
  const footId = `press-menu-foot-${uid}`
  const nameRef = useRef<HTMLElement | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const pressTimer = useRef<number | null>(null)
  const pressAt = useRef({ x: 0, y: 0 })
  const longPressed = useRef(false)
  const refocus = useRef<"keyboard" | "pointer" | null>(null)
  const copyTimer = useRef<number | null>(null)
  const hintTimer = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState<"ok" | "failed" | null>(null)
  const [hint, setHint] = useState(false)
  useScrollLock(open)

  useEffect(
    () => () => {
      if (pressTimer.current != null) window.clearTimeout(pressTimer.current)
      if (copyTimer.current != null) window.clearTimeout(copyTimer.current)
      if (hintTimer.current != null) window.clearTimeout(hintTimer.current)
    },
    []
  )

  const items = () =>
    Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    )

  const openAt = (x: number, y: number, keyboard: boolean) => {
    const el = menuRef.current
    if (!el) return
    if (hintTimer.current != null) window.clearTimeout(hintTimer.current)
    setHint(false)
    setCopied(null)
    const vw = document.documentElement.clientWidth
    el.style.left = `${Math.round(Math.max(8, Math.min(x, vw - MENU_WIDTH - 8)))}px`
    el.style.top = `${Math.round(Math.max(8, y))}px`
    if (!el.matches(":popover-open")) el.showPopover()
    // Keep it inside the viewport vertically: flip above the point if needed.
    const h = el.offsetHeight
    const vh = window.innerHeight
    if (y + h + 8 > vh)
      el.style.top = `${Math.round(Math.max(8, y - h, vh - h - 8))}px`
    const first = items()[0]
    first?.focus({ focusVisible: keyboard } as FocusOptionsWithVisible)
    refocus.current = keyboard ? "keyboard" : "pointer"
  }

  const openUnderName = () => {
    const n = nameRef.current?.getBoundingClientRect()
    if (!n) return
    openAt(n.left, n.bottom + 8, true)
  }

  const closeMenu = (restoreFocus: boolean) => {
    const el = menuRef.current
    if (copyTimer.current != null) window.clearTimeout(copyTimer.current)
    if (!restoreFocus) refocus.current = null
    if (el?.matches(":popover-open")) el.hidePopover()
  }

  /* --- the name ---------------------------------------------------------- */

  const onContextMenu = (e: ReactMouseEvent<HTMLElement>) => {
    e.preventDefault()
    // The context-menu key and Shift+F10 report no pointer position.
    if (e.clientX === 0 && e.clientY === 0) openUnderName()
    else openAt(e.clientX, e.clientY, false)
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
      e.preventDefault()
      openUnderName()
    }
  }

  const clearPress = () => {
    if (pressTimer.current != null) window.clearTimeout(pressTimer.current)
    pressTimer.current = null
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    longPressed.current = false
    if (e.pointerType !== "touch") return
    pressAt.current = { x: e.clientX, y: e.clientY }
    const { clientX, clientY } = e
    clearPress()
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null
      longPressed.current = true
      openAt(clientX, clientY, false)
    }, LONG_PRESS_MS)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (pressTimer.current == null) return
    if (
      Math.abs(e.clientX - pressAt.current.x) > 10 ||
      Math.abs(e.clientY - pressAt.current.y) > 10
    )
      clearPress()
  }

  const onClick = (e: ReactMouseEvent<HTMLElement>) => {
    // The click that ends a long press must not follow the link.
    if (longPressed.current) {
      e.preventDefault()
      longPressed.current = false
      return
    }
    // On `/` a pointer click does nothing; Enter or Space opens the menu.
    if (home && e.detail === 0) {
      if (menuRef.current?.matches(":popover-open")) closeMenu(true)
      else openUnderName()
    }
  }

  const onPointerEnter = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return
    if (hintTimer.current != null) window.clearTimeout(hintTimer.current)
    hintTimer.current = window.setTimeout(() => {
      if (!menuRef.current?.matches(":popover-open")) setHint(true)
    }, 700)
  }

  const onPointerLeave = () => {
    clearPress()
    if (hintTimer.current != null) window.clearTimeout(hintTimer.current)
    setHint(false)
  }

  const nameHandlers = {
    onContextMenu,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp: clearPress,
    onPointerCancel: clearPress,
    onPointerEnter,
    onPointerLeave,
    onClick,
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    "aria-controls": menuId,
    "aria-keyshortcuts": "Shift+F10",
  }

  /* --- the menu ---------------------------------------------------------- */

  const onMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const list = items()
    const i = list.indexOf(document.activeElement as HTMLElement)
    let next = -1
    if (e.key === "ArrowDown") next = (i + 1) % list.length
    else if (e.key === "ArrowUp") next = i <= 0 ? list.length - 1 : i - 1
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = list.length - 1
    else if (e.key === "Escape") {
      e.preventDefault()
      closeMenu(true)
      return
    } else if (e.key === "Tab") {
      closeMenu(false)
      return
    }
    if (next >= 0) {
      e.preventDefault()
      list[next]?.focus()
    }
  }

  const onToggle = (e: ReactToggleEvent<HTMLDivElement>) => {
    const isOpen = e.newState === "open"
    setOpen(isOpen)
    holdHeadline("menu", isOpen)
    if (isOpen) return
    setCopied(null)
    const how = refocus.current
    refocus.current = null
    if (how)
      nameRef.current?.focus({
        preventScroll: true,
        focusVisible: how === "keyboard",
      } as FocusOptionsWithVisible)
  }

  const copy = async () => {
    let ok = true
    try {
      // `writeText` rejects (permission, insecure context); a missing API
      // throws here too. Either way the reader is told, and the bio is
      // also on /press.
      await navigator.clipboard.writeText(bio)
    } catch {
      ok = false
    }
    setCopied(ok ? "ok" : "failed")
    if (copyTimer.current != null) window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(
      () => closeMenu(true),
      ok ? 1500 : 2500
    )
  }

  const nameEl = home ? (
    <button
      ref={(el) => {
        nameRef.current = el
      }}
      type="button"
      className="site-top__name"
      {...nameHandlers}
    >
      {name}
    </button>
  ) : (
    <TransitionLink
      ref={(el: HTMLAnchorElement | null) => {
        nameRef.current = el
      }}
      href="/"
      className="site-top__name"
      data-home-link=""
      data-back=""
      {...nameHandlers}
    >
      <Icon name="arrow-left" className="site-top__arrow" />
      <span>{name}</span>
    </TransitionLink>
  )

  return (
    <div className="site-top__namewrap">
      {nameEl}
      {hint && !open ? (
        <span className="site-top__hint" aria-hidden="true">
          {menu.hint}
        </span>
      ) : null}
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        aria-label={menu.ariaLabel}
        aria-describedby={footId}
        className="press-menu"
        onKeyDown={onMenuKeyDown}
        onToggle={onToggle}
      >
        <button
          type="button"
          role="menuitem"
          className="press-menu__item"
          onClick={copy}
        >
          <Icon name="copy-check" size={15} on={copied === "ok"} />
          <span aria-live="polite">
            {copied === "ok"
              ? menu.copiedLabel
              : copied === "failed"
                ? menu.failedLabel
                : menu.copyLabel}
          </span>
        </button>
        <a
          role="menuitem"
          className="press-menu__item"
          href={headshot.href}
          download={headshot.filename}
          onClick={() => closeMenu(false)}
        >
          <Icon name="download" size={15} />
          {menu.downloadLabel}
        </a>
        <TransitionLink
          role="menuitem"
          className="press-menu__item"
          href={menu.pressKitHref}
          onClick={() => closeMenu(false)}
        >
          <Icon name="arrow-right" size={15} />
          {menu.pressKitLabel}
        </TransitionLink>
        <hr className="press-menu__sep" />
        <span id={footId} className="press-menu__foot">
          {menu.foot}
        </span>
      </div>
    </div>
  )
}
