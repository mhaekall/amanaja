"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const TEXTS = {
  id: { cat: "Kategori", games: "Games", share: "Share" },
  en: { cat: "Categories", games: "Games", share: "Share" },
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [lang, setLang] = useState<"id" | "en">("id")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const t = TEXTS[lang]

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-5 md:px-10 bg-background/85 backdrop-blur-xl border-b border-border/80 transition-shadow duration-300",
        scrolled && "shadow-sm"
      )}
    >
      <a href="#" className="font-serif font-extrabold text-[22px] text-foreground tracking-tight flex items-center gap-2">
        Amanaja
        <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
      </a>

      <ul className="hidden md:flex items-center gap-8">
        {[
          { href: "#kategori", label: t.cat },
          { href: "#games", label: t.games },
          { href: "#share", label: t.share },
        ].map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="relative text-sm font-medium text-text-mid hover:text-blue-dark transition-colors after:absolute after:bottom-[-2px] after:left-0 after:right-0 after:h-[1.5px] after:bg-primary after:scale-x-0 after:origin-left after:transition-transform hover:after:scale-x-100"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-1 bg-off-white border border-border rounded-lg p-[3px]">
        <button
          onClick={() => setLang("id")}
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-md transition-all font-sans",
            lang === "id"
              ? "bg-background text-foreground shadow-sm"
              : "text-text-soft bg-transparent"
          )}
        >
          ID
        </button>
        <button
          onClick={() => setLang("en")}
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-md transition-all font-sans",
            lang === "en"
              ? "bg-background text-foreground shadow-sm"
              : "text-text-soft bg-transparent"
          )}
        >
          EN
        </button>
      </div>
    </nav>
  )
}
