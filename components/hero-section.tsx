"use client"

import { useI18n } from "@/lib/i18n-context"

export default function HeroSection() {
  const { t } = useI18n()

  return (
    <section className="relative min-h-screen flex items-center px-5 md:px-10 pt-24 pb-16 overflow-hidden bg-background">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full blur-[60px] pointer-events-none bg-[radial-gradient(circle,rgba(219,238,255,0.7),transparent_70%)] animate-blob-float" />
      <div className="absolute -bottom-12 left-[10%] w-[400px] h-[400px] rounded-full blur-[60px] pointer-events-none bg-[radial-gradient(circle,rgba(252,231,243,0.5),transparent_70%)] animate-blob-float [animation-delay:3s]" />
      <div className="absolute top-[30%] left-[50%] w-[250px] h-[250px] rounded-full blur-[60px] pointer-events-none bg-[radial-gradient(circle,rgba(147,197,253,0.3),transparent_70%)] animate-blob-float [animation-delay:5s]" />

      <div className="relative z-10 w-full max-w-[1160px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left: Copy */}
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-light text-blue-dark text-xs font-semibold px-3.5 py-1.5 rounded-full tracking-wide mb-6 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-blink-dot" />
            {String(t("hero_badge"))}
          </div>

          <h1 className="font-serif font-extrabold text-[clamp(40px,5.5vw,72px)] leading-[1.05] tracking-tight mb-5 animate-fade-up-1 text-balance">
            {String(t("hero_h1_line1"))}<br />
            <span className="text-primary">{String(t("hero_h1_line2"))}</span><br />
            <span className="relative inline-block text-pink-main">
              {String(t("hero_h1_line3"))}
              <span className="absolute bottom-0.5 left-0 right-0 h-1 bg-pink-light rounded-sm -z-10" />
            </span>
          </h1>

          <p className="text-[17px] leading-relaxed text-text-mid font-light mb-9 max-w-[420px] animate-fade-up-2">
            {String(t("hero_desc"))}
          </p>

          <div className="flex flex-wrap gap-3 animate-fade-up-3">
            <a
              href="#kategori"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-[15px] px-7 py-3.5 rounded-xl shadow-[0_4px_16px_rgba(59,158,255,0.3)] hover:shadow-[0_8px_24px_rgba(59,158,255,0.4)] hover:-translate-y-0.5 hover:bg-blue-dark transition-all"
            >
              {String(t("hero_cta_primary"))}
              <span aria-hidden="true">&rarr;</span>
            </a>
            <a
              href="/games/ular-neo"
              className="inline-flex items-center gap-2 bg-transparent text-foreground font-medium text-[15px] px-6 py-3.5 rounded-xl border-[1.5px] border-border-dark hover:border-blue-mid hover:text-blue-dark hover:bg-blue-light transition-all"
            >
              {String(t("hero_cta_secondary"))}
            </a>
          </div>
        </div>

        {/* Right: Floating Cards */}
        <div className="relative h-[360px] lg:h-[480px] animate-fade-up-4">
          {/* Dot grid background */}
          <div className="absolute -inset-5 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-[length:24px_24px] opacity-60 -z-10 rounded-3xl" />

          {/* Game card */}
          <div
            className="absolute top-5 left-2.5 w-[180px] bg-background border border-border rounded-2xl p-5 shadow-lg animate-float-card border-t-[3px] border-t-primary"
            style={{ "--dur": "5s", "--delay": "0s", "--rot-from": "-2deg", "--rot-to": "1deg" } as React.CSSProperties}
          >
            <div className="text-[10px] font-bold tracking-widest uppercase text-text-soft mb-2">
              Game
            </div>
            <div className="font-serif text-base font-bold text-foreground mb-1">Ular Neo</div>
            <div className="text-[11px] text-text-soft">{"Arcade \u00B7 Pixel Art"}</div>
            <div className="grid grid-cols-4 gap-[3px] mt-2.5">
              <div className="h-3 rounded-sm bg-blue-light" />
              <div className="h-3 rounded-sm bg-[#39ff14]" />
              <div className="h-3 rounded-sm bg-[#39ff14]" />
              <div className="h-3 rounded-sm bg-blue-light" />
              <div className="h-3 rounded-sm bg-blue-light" />
              <div className="h-3 rounded-sm bg-[#39ff14]" />
              <div className="h-3 rounded-sm bg-blue-light" />
              <div className="h-3 rounded-sm bg-blue-light" />
              <div className="h-3 rounded-sm bg-primary" />
              <div className="h-3 rounded-sm bg-[#39ff14]" />
              <div className="h-3 rounded-sm bg-blue-light" />
              <div className="h-3 rounded-sm bg-blue-light" />
              <div className="h-3 rounded-sm bg-blue-light" />
              <div className="h-3 rounded-sm bg-blue-light" />
              <div className="h-3 rounded-sm bg-blue-light" />
              <div className="h-3 rounded-sm bg-blue-light" />
            </div>
          </div>

          {/* Score card */}
          <div
            className="absolute top-[60px] right-0 w-[160px] bg-background border border-border rounded-2xl p-5 shadow-lg animate-float-card border-t-[3px] border-t-pink-main"
            style={{ "--dur": "6s", "--delay": "1s", "--rot-from": "1deg", "--rot-to": "-1.5deg" } as React.CSSProperties}
          >
            <div className="text-[10px] font-bold tracking-widest uppercase text-text-soft mb-2">
              {String(t("fg_score"))}
            </div>
            <div className="font-serif text-4xl font-extrabold text-pink-main leading-none my-2">2.840</div>
            <div className="text-[11px] text-text-soft">{"Level 6 \u00B7 Top 12%"}</div>
            <div className="h-1.5 rounded-full bg-border mt-2 overflow-hidden">
              <div className="h-full rounded-full bg-primary w-[72%]" />
            </div>
          </div>

          {/* Education card */}
          <div
            className="absolute bottom-24 left-[30px] w-[170px] bg-background border border-border rounded-2xl p-5 shadow-lg animate-float-card border-t-[3px] border-t-blue-mid"
            style={{ "--dur": "7s", "--delay": "0.5s", "--rot-from": "-1deg", "--rot-to": "2deg" } as React.CSSProperties}
          >
            <div className="text-[10px] font-bold tracking-widest uppercase text-text-soft mb-2">
              {String(t("cat_edu_title"))}
            </div>
            <div className="text-[32px] text-center my-1.5">&#x1F4DA;</div>
            <div className="bg-off-white rounded-md px-2 py-1 text-[10px] text-center font-semibold text-foreground mt-1.5">
              {"Quiz \u00B7 Flashcard"}
            </div>
          </div>

          {/* Tool card */}
          <div
            className="absolute bottom-[30px] right-5 w-[165px] bg-background border border-border rounded-2xl p-5 shadow-lg animate-float-card border-t-[3px] border-t-[#059669]"
            style={{ "--dur": "5.5s", "--delay": "1.5s", "--rot-from": "0deg", "--rot-to": "-2deg" } as React.CSSProperties}
          >
            <div className="text-[10px] font-bold tracking-widest uppercase text-text-soft mb-2">
              {String(t("cat_tools_title"))}
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <div className="font-serif text-[22px] font-extrabold text-[#059669]">9.234</div>
                <div className="text-[10px] text-text-soft">hari hidup</div>
              </div>
              <span className="text-[28px]">&#x1F382;</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
