"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

const categories = [
  {
    color: "blue" as const,
    icon: "\u{1F3AE}",
    title: "Games",
    desc: "Game arcade seru yang bisa kamu main kapan saja dan bagikan skormu ke teman.",
    tags: ["Snake Neo", "Flappy Bird", "2048", "+ lainnya"],
  },
  {
    color: "pink" as const,
    icon: "\u{1F4DA}",
    title: "Edukasi",
    desc: "Quiz interaktif dan flashcard yang bikin belajar terasa menyenangkan dan tidak membosankan.",
    tags: ["Kuis Sejarah", "Sains", "Bahasa", "+ lainnya"],
  },
  {
    color: "purple" as const,
    icon: "\u{1F602}",
    title: "Meme Generator",
    desc: "Buat meme kocak dari template populer atau foto kamu sendiri, langsung download.",
    tags: ["Template Viral", "AI Caption", "Custom Upload"],
  },
  {
    color: "mint" as const,
    icon: "\u{1F6E0}\u{FE0F}",
    title: "Tools",
    desc: "Kalkulator dan tools seru yang hasilnya bisa kamu share sebagai kartu yang keren.",
    tags: ["Kalk. Usia", "BMI", "Zodiak", "+ lainnya"],
  },
]

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
  purple: {
    iconBg: "bg-[#ede9fe]",
    hoverBorder: "hover:border-[#c4b5fd]",
    gradient: "bg-[linear-gradient(135deg,#ede9fe,transparent_60%)]",
    titleHover: "group-hover:text-[#5b21b6]",
    tagHover: "group-hover:bg-[#ede9fe] group-hover:text-[#5b21b6] group-hover:border-transparent",
    arrowHover: "group-hover:bg-[#7c3aed] group-hover:border-[#7c3aed] group-hover:text-primary-foreground",
  },
  mint: {
    iconBg: "bg-[#d1fae5]",
    hoverBorder: "hover:border-[#6ee7b7]",
    gradient: "bg-[linear-gradient(135deg,#d1fae5,transparent_60%)]",
    titleHover: "group-hover:text-[#065f46]",
    tagHover: "group-hover:bg-[#d1fae5] group-hover:text-[#065f46] group-hover:border-transparent",
    arrowHover: "group-hover:bg-[#059669] group-hover:border-[#059669] group-hover:text-primary-foreground",
  },
}

export default function CategoriesSection() {
  const sectionRef = useRef<HTMLDivElement>(null)

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

  return (
    <section id="kategori" className="py-20 md:py-24 px-5 md:px-10 bg-background" ref={sectionRef}>
      <div className="max-w-[1160px] mx-auto mb-14 reveal-item opacity-0 translate-y-8 transition-all duration-700">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] uppercase text-blue-dark bg-blue-light px-3 py-1.5 rounded-full mb-4">
          <span aria-hidden="true">&#x2726;</span> Semua Kategori
        </div>
        <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-extrabold tracking-tight leading-[1.1] text-foreground mb-3 text-balance">
          Mau ngapain hari ini?
        </h2>
        <p className="text-base text-text-mid max-w-[480px] leading-relaxed font-light">
          Pilih sesukamu. Semuanya gratis, semuanya seru, dan hasilnya bisa langsung kamu share.
        </p>
      </div>

      <div className="max-w-[1160px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((cat, i) => {
          const c = colorMap[cat.color]
          return (
            <a
              key={cat.title}
              href="#"
              className={cn(
                "group relative block border-[1.5px] border-border rounded-[28px] p-7 bg-background overflow-hidden transition-all duration-300 ease-[cubic-bezier(.23,1,.32,1)] hover:-translate-y-1.5 hover:shadow-lg reveal-item opacity-0 translate-y-8 transition-all",
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
                {cat.title}
              </div>
              <div className="relative z-10 text-[13px] text-text-soft leading-relaxed mb-5">
                {cat.desc}
              </div>

              <ul className="relative z-10 flex flex-wrap gap-1.5">
                {cat.tags.map((tag) => (
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
