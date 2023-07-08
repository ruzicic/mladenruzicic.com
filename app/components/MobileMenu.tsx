'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from 'styles/mobile-menu.module.css'

export default function MobileMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  function toggleMenu() {
    if (isMenuOpen) {
      setIsMenuOpen(false)
      document.body.style.overflow = ''
    } else {
      setIsMenuOpen(true)
      document.body.style.overflow = 'hidden'
    }
  }

  useEffect(() => {
    return function cleanup() {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="visible md:hidden">
      <button
        className={[styles.burger, 'visible md:hidden'].join(' ')}
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
            'flex flex-col absolute left-14 sm:left-16 w-[calc(100%-6rem)] bg-white',
            styles.menuRendered,
          ].join(' ')}
        >
          <li
            className="border-b border-gray-300 text-gray-900 text-sm font-semibold"
            style={{ transitionDelay: '150ms' }}
          >
            <Link href="/" className="flex w-auto pb-4">
              Home
            </Link>
          </li>
          <li
            className="border-b border-gray-300  text-gray-900 text-sm font-semibold"
            style={{ transitionDelay: '175ms' }}
          >
            <Link href="/about" className="flex w-auto pb-4">
              About
            </Link>
          </li>
          <li
            className="border-b border-gray-300  text-gray-900 text-sm font-semibold"
            style={{ transitionDelay: '175ms' }}
          >
            <Link href="/projects" className="flex w-auto pb-4">
              Projects
            </Link>
          </li>
          <li
            className="border-b border-gray-300  text-gray-900 text-sm font-semibold"
            style={{ transitionDelay: '200ms' }}
          >
            <Link href="/uses" className="flex w-auto pb-4">
              Uses
            </Link>
          </li>
        </ul>
      ) : null}
    </div>
  )
}

function MenuIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg
      className="h-5 w-5 absolute text-gray-900 "
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

function CrossIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg
      className="h-5 w-5 absolute text-gray-900 "
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
