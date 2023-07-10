"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DISCOVERY_SESSION_URL, ROUTES } from "lib/constants"
import styles from "styles/mobile-menu.module.css"

import { Button } from "./Button"

export default function MobileMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  function toggleMenu() {
    if (isMenuOpen) {
      setIsMenuOpen(false)
      document.body.style.overflow = ""
    } else {
      setIsMenuOpen(true)
      document.body.style.overflow = "hidden"
    }
  }

  useEffect(() => {
    return function cleanup() {
      document.body.style.overflow = ""
    }
  }, [])

  return (
    <div className="visible md:hidden">
      <button
        className={[styles.burger, "visible md:hidden"].join(" ")}
        aria-label="Toggle menu"
        type="button"
        onClick={toggleMenu}
      >
        <MenuIcon data-hide={isMenuOpen} />
        <CrossIcon data-hide={!isMenuOpen} />
      </button>
      {isMenuOpen ? (
        <ul
          className={[
            styles.menu,
            "flex flex-col absolute left-0 w-full px-4 sm:px-8 bg-white",
            styles.menuRendered,
          ].join(" ")}
        >
          {Object.entries(ROUTES).map(([path, { name }]) => {
            return (
              <li
                key={path}
                className="border-b border-gray-300 text-sm font-semibold text-gray-900"
                style={{ transitionDelay: "150ms" }}
              >
                <Button href={path} variant="link">
                  {name}
                </Button>
              </li>
            )
          })}
          <li className="pl-4" style={{ transitionDelay: "200ms" }}>
            <Button
              target="_blank"
              href={DISCOVERY_SESSION_URL}
              variant="default"
            >
              Schedule a Discovery Session
            </Button>
          </li>
        </ul>
      ) : null}
    </div>
  )
}

function MenuIcon(props: JSX.IntrinsicElements["svg"]) {
  return (
    <svg
      className="absolute h-5 w-5 text-gray-900 "
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      {...props}
    >
      <path
        d="M2.5 7.5H17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 12.5H17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CrossIcon(props: JSX.IntrinsicElements["svg"]) {
  return (
    <svg
      className="absolute h-5 w-5 text-gray-900 "
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      shapeRendering="geometricPrecision"
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  )
}
