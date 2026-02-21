"use client"

import { useEffect, useRef } from "react"
import { useI18n } from "@/lib/i18n-context"

export default function FeaturedGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scoreRef = useRef<HTMLSpanElement>(null)
  const lengthRef = useRef<HTMLSpanElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return

    const T = 10
    const G = 20
    let snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
      { x: 7, y: 10 },
    ]
    let dir = { x: 1, y: 0 }
    let food = { x: 15, y: 7 }
    let score = 0
    let frameCount = 0

    const AUTO = [
      { x: 1, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 1 },
      { x: -1, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 0 }, { x: -1, y: 0 },
      { x: 0, y: -1 }, { x: 0, y: -1 }, { x: 0, y: -1 },
      { x: 1, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: 1 },
      { x: 1, y: 0 }, { x: 1, y: 0 },
    ]
    let autoIdx = 0

    function spawnFood() {
      food = {
        x: Math.floor(Math.random() * G),
        y: Math.floor(Math.random() * G),
      }
    }

    function step() {
      dir = AUTO[autoIdx % AUTO.length]
      autoIdx++
      const head = {
        x: (snake[0].x + dir.x + G) % G,
        y: (snake[0].y + dir.y + G) % G,
      }
      snake.unshift(head)
      if (head.x === food.x && head.y === food.y) {
        score += 10
        if (scoreRef.current) scoreRef.current.textContent = String(score)
        if (lengthRef.current) lengthRef.current.textContent = String(snake.length)
        spawnFood()
      } else {
        snake.pop()
      }
    }

    function draw() {
      ctx.fillStyle = "#050510"
      ctx.fillRect(0, 0, c.width, c.height)

      ctx.strokeStyle = "rgba(255,255,255,0.03)"
      ctx.lineWidth = 0.5
      for (let i = 0; i <= G; i++) {
        ctx.beginPath(); ctx.moveTo(i * T, 0); ctx.lineTo(i * T, c.height); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, i * T); ctx.lineTo(c.width, i * T); ctx.stroke()
      }

      ctx.shadowBlur = 10
      ctx.shadowColor = "#ff007f"
      ctx.fillStyle = "#ff007f"
      ctx.fillRect(food.x * T + 1, food.y * T + 1, T - 2, T - 2)

      snake.forEach((seg, i) => {
        ctx.shadowBlur = 8
        ctx.shadowColor = "#39ff14"
        ctx.fillStyle = i === 0 ? "#fff" : `hsl(110,100%,${60 - i * 2}%)`
        ctx.fillRect(seg.x * T + 1, seg.y * T + 1, T - 2, T - 2)
      })
      ctx.shadowBlur = 0
    }

    let animId: number
    function loop() {
      frameCount++
      if (frameCount % 8 === 0) step()
      draw()
      animId = requestAnimationFrame(loop)
    }
    loop()

    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <section id="games" className="px-5 md:px-10 pb-20 md:pb-24 bg-background">
      <div className="max-w-[1160px] mx-auto bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-[40px] p-10 md:p-14 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(59,158,255,0.2),transparent_70%)] rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 left-[30%] w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(244,114,182,0.15),transparent_70%)] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-primary/15 text-blue-mid text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border border-primary/20 mb-5">
            {String(t("fg_badge"))}
          </div>

          <h2 className="font-serif text-[clamp(28px,3.5vw,48px)] font-extrabold text-primary-foreground tracking-tight leading-[1.1] mb-4 text-balance">
            {String(t("fg_heading_1"))}<br />
            <span className="text-blue-mid">{String(t("fg_heading_2"))}</span>
          </h2>

          <p className="text-[15px] text-primary-foreground/55 leading-relaxed font-light mb-7">
            {String(t("fg_desc"))}
          </p>

          <ul className="flex flex-col gap-2 mb-8">
            {[
              String(t("fg_feat_1")),
              String(t("fg_feat_2")),
              String(t("fg_feat_3")),
              String(t("fg_feat_4")),
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-2.5 text-[13px] text-primary-foreground/70">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-mid shrink-0" />
                {feat}
              </li>
            ))}
          </ul>

          <a
            href="/games/ular-neo"
            className="relative z-10 inline-flex items-center gap-2.5 bg-primary text-primary-foreground font-semibold text-[15px] px-7 py-3.5 rounded-xl shadow-[0_4px_20px_rgba(59,158,255,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(59,158,255,0.5)] transition-all"
          >
            &#x25B6; {String(t("fg_cta"))}
          </a>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="bg-[#050510] rounded-2xl p-[3px] border border-primary-foreground/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <canvas ref={canvasRef} width={200} height={200} className="block rounded-[14px]" />
          </div>
          <div className="flex gap-5">
            <div className="text-center">
              <span ref={scoreRef} className="font-serif text-[22px] font-extrabold text-primary-foreground block">
                0
              </span>
              <span className="text-[10px] text-primary-foreground/40 uppercase tracking-widest">
                {String(t("fg_score"))}
              </span>
            </div>
            <div className="text-center">
              <span ref={lengthRef} className="font-serif text-[22px] font-extrabold text-primary-foreground block">
                3
              </span>
              <span className="text-[10px] text-primary-foreground/40 uppercase tracking-widest">
                {String(t("fg_length"))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
