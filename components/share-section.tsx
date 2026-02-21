"use client"

import { useEffect, useRef } from "react"
import { useI18n } from "@/lib/i18n-context"

const sharePointKeys = [
  { icon: "\u{1F3AE}", titleKey: "share_game_title", descKey: "share_game_desc" },
  { icon: "\u{1F6E0}\u{FE0F}", titleKey: "share_tools_title", descKey: "share_tools_desc" },
  { icon: "\u{1F4DA}", titleKey: "share_quiz_title", descKey: "share_quiz_desc" },
] as const

export default function ShareSection() {
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

  return (
    <section id="share" className="py-20 md:py-24 px-5 md:px-10 bg-off-white border-t border-border" ref={sectionRef}>
      <div className="max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <div className="reveal-item opacity-0 translate-y-8 transition-all duration-700">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] uppercase text-blue-dark bg-blue-light px-3 py-1.5 rounded-full mb-4">
            {String(t("share_badge"))}
          </div>
          <h2 className="font-serif text-[clamp(28px,4vw,44px)] font-extrabold tracking-tight leading-[1.1] text-foreground mb-3 text-balance">
            {String(t("share_heading_1"))}<br />{String(t("share_heading_2"))}
          </h2>
          <p className="text-base text-text-mid max-w-[480px] leading-relaxed font-light">
            {String(t("share_desc"))}
          </p>

          <ul className="mt-7">
            {sharePointKeys.map((sp, i) => (
              <li
                key={sp.titleKey}
                className={`flex gap-4 items-start py-4 ${i < sharePointKeys.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-lg shrink-0 shadow-sm">
                  {sp.icon}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground mb-0.5">
                    {String(t(sp.titleKey as "share_game_title"))}
                  </div>
                  <div className="text-[13px] text-text-soft leading-relaxed font-light">
                    {String(t(sp.descKey as "share_game_desc"))}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center gap-4 flex-wrap reveal-item opacity-0 translate-y-8 transition-all duration-700 [transition-delay:200ms]">
          {/* Blue card */}
          <div className="w-[200px] rounded-[20px] p-5 text-center shadow-lg bg-gradient-to-br from-blue-light to-[#c7e8ff] border-[1.5px] border-blue-mid animate-float-card" style={{ "--dur": "5s", "--delay": "0s" } as React.CSSProperties}>
            <div className="text-4xl mb-2">&#x1F3AE;</div>
            <div className="font-serif text-xl font-extrabold text-foreground">2.840</div>
            <div className="text-[11px] text-text-mid mt-1">{String(t("share_card_level"))}</div>
            <div className="mt-3 text-[10px] font-bold text-text-soft tracking-widest uppercase">amanaja.id</div>
          </div>
          {/* Pink card */}
          <div
            className="w-[200px] rounded-[20px] p-5 text-center shadow-lg bg-gradient-to-br from-pink-light to-[#fdd6ee] border-[1.5px] border-pink-mid animate-float-card mt-8"
            style={{ "--dur": "5s", "--delay": "1.5s" } as React.CSSProperties}
          >
            <div className="text-4xl mb-2">&#x1F382;</div>
            <div className="font-serif text-xl font-extrabold text-foreground">9.234</div>
            <div className="text-[11px] text-text-mid mt-1">{String(t("share_card_days"))}</div>
            <div className="mt-3 text-[10px] font-bold text-text-soft tracking-widest uppercase">amanaja.id</div>
          </div>
        </div>
      </div>
    </section>
  )
}
