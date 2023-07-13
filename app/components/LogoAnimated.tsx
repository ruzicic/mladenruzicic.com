"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"

import { Button } from "./Button"
import { Icons } from "./icons"

const logoVariants = ["mladen ruzicic", "mladen ružičić", "младен ружичић"]

export const LogoAnimated = () => {
  const [currentLogoVariant, setCurrentLogoVariant] = useState(0)
  const nextLogoVariant = () =>
    setCurrentLogoVariant((currentLogoVariant + 1) % logoVariants.length)

  return (
    <Link href="/" className="flex flex-nowrap items-center gap-4">
      <Button
        variant="link"
        size="icon"
        renderAs="button"
        onClick={nextLogoVariant}
        aria-label="Mladen Ruzicic Logo"
      >
        <Icons.logo className=" h-8 w-8 transition-all duration-150 ease-in-out hover:scale-110 active:scale-90" />
      </Button>
      <AnimatedText text={logoVariants[currentLogoVariant]} />
    </Link>
  )
}

const AnimatedText = ({ text }: { text: string }) => {
  return (
    <motion.span
      key={text}
      initial={{ y: -20, opacity: 0.5 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0.5 }}
      transition={{
        type: "spring",
        duration: 0.2,
      }}
      className="text-xl tracking-wide"
    >
      {text}
    </motion.span>
  )
}
