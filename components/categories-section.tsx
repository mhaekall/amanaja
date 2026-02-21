"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n-context"

const colorMap = {
  blue: {
    iconBg: "bg-blue-light",
    hoverBorder: "hover:border-blue-mid",
    gradient: "bg-[linear-gradient(135deg,var(--blue-light),transparent_60%)]",
    titleHover: "group-hover:text-blue-dark",
    tagHover: "group-hover:bg-blue-light group-hover:text-blue-dark group-hover:border-transparent",
    arrowHover: "group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground",
  },
  pink: {
    iconBg: "bg-pink-light",
    hoverBorder: "hover:border-pink-mid",
    gradient: "bg-[linear-gradient(135deg,var(--pink-light),transparent_60%)]",
    titleHover: "group-hover:text-[#be185d]",
    tagHover: "group-hover:bg-pink-light group-hover:text-[#be185d] group-hover:border-transparent",
    arrowHover: "group-hover:bg-pink-main group-hover:border-pink-main group-hover:text-primary-foreground",
  },
  mint: {
    iconBg: "bg-[#d1fae5]",
    hoverBorder: "hover:border-[#6ee7b7]",
    gradient: "bg-[linear-gradient(135deg,#d1fae5,transparent_60%)]",
    titleHover: "group-hover:text-[#065f46]",
    tagHover: "group-hover:bg-[#d1fae5] group-hover:text-[#065f46] group-hover:border-transparent",
    arrowHover: "group-hover:bg-[#059669] group-hover:border-[#059669] group-hover:text-primary-foreground",
  },
} as const

type ColorKey = keyof typeof colorMap

export default function CategoriesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("opacity-100", "translate-y-0")
        })
      },
      { threshold: 0.12 }
    )
    const els = sectionRef.current?.querySelectorAll(".reveal-item")
    els?.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const categories: { color: ColorKey; icon: string; titleKey: string; descKey: string; tagsKey: string; href: string }[] = [
    {
      color: "blue",
      icon: "\u{1F3AE}",
      titleKey: "cat_games_title",
      descKey: "cat_games_desc",
      tagsKey: "cat_games_tags",
      href: "/games/ular-neo",
    },
    {
      color: "pink",
      icon: "\u{1F4DA}",
      titleKey: "cat_edu_title",
      descKey: "cat_edu_desc",
      tagsKey: "cat_edu_tags",
      href: "#",
    },
    {
      color: "mint",
      icon: "\u{1F6E0}\u{FE0F}",
      titleKey: "cat_tools_title",
      descKey: "cat_tools_desc",
      tagsKey: "cat_tools_tags",
      href: "#",
    },
  ]

  return (
    <section id="kategori" className="py-20 md:py-24 px-5 md:px-10 bg-background" ref={sectionRef}>
      <div className="max-w-[1160px] mx-auto mb-14 reveal-item opacity-0 translate-y-8 transition-all duration-700">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] uppercase text-blue-dark bg-blue-light px-3 py-1.5 rounded-full mb-4">
          <span aria-hidden="true">&#x2726;</span> {String(t("cat_badge"))}
        </div>
        <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-extrabold tracking-tight leading-[1.1] text-foreground mb-3 text-balance">
          {String(t("cat_heading"))}
        </h2>
        <p className="text-base text-text-mid max-w-[480px] leading-relaxed font-light">
          {String(t("cat_desc"))}
        </p>
      </div>

      <div className="max-w-[1160px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat, i) => {
          const c = colorMap[cat.color]
          const tags = t(cat.tagsKey as "cat_games_tags")
          const tagArr = Array.isArray(tags) ? tags : [tags]
          return (
            <a
              key={cat.titleKey}
              href={cat.href}
              className={cn(
                "group relative block border-[1.5px] border-border rounded-[28px] p-7 bg-background overflow-hidden transition-all duration-300 ease-[cubic-bezier(.23,1,.32,1)] hover:-translate-y-1.5 hover:shadow-lg reveal-item opacity-0 translate-y-8",
                c.hoverBorder
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Hover gradient overlay */}
              <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none", c.gradient)} />

              <div className={cn("relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center text-[26px] mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-[5deg]", c.iconBg)}>
                {cat.icon}
              </div>

              <div className={cn("relative z-10 font-serif text-xl font-bold text-foreground mb-2 transition-colors", c.titleHover)}>
                {String(t(cat.titleKey as "cat_games_title"))}
              </div>
              <div className="relative z-10 text-[13px] text-text-soft leading-relaxed mb-5">
                {String(t(cat.descKey as "cat_games_desc"))}
              </div>

              <ul className="relative z-10 flex flex-wrap gap-1.5">
                {tagArr.map((tag) => (
                  <li
                    key={tag}
                    className={cn(
                      "text-[11px] font-semibold px-2.5 py-1 rounded-full bg-off-white text-text-mid border border-border transition-all",
                      c.tagHover
                    )}
                  >
                    {tag}
                  </li>
                ))}
              </ul>

              <div className={cn("absolute bottom-6 right-6 w-9 h-9 rounded-full bg-off-white border border-border flex items-center justify-center text-sm transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 z-10", c.arrowHover)}>
                &rarr;
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
