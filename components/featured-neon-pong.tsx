"use client"

import { useEffect, useRef } from "react"
import { useI18n } from "@/lib/i18n-context"

export default function FeaturedNeonPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerScoreRef = useRef<HTMLSpanElement>(null)
  const aiScoreRef = useRef<HTMLSpanElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return

    const W = 240
    const H = 160

    // Game state
    let playerY = H / 2 - 24
    let aiY = H / 2 - 24
    const paddleW = 6
    const paddleH = 48
    let ballX = W / 2
    let ballY = H / 2
    let ballDX = 2.2
    let ballDY = 1.5
    const ballSize = 6
    let playerScore = 0
    let aiScore = 0
    let tick = 0

    // Trails for ball
    const trails: { x: number; y: number; life: number }[] = []

    function resetBall(dir: number) {
      ballX = W / 2
      ballY = H / 2
      const angle = (Math.random() * 0.6 - 0.3)
      ballDX = Math.cos(angle) * 2.2 * dir
      ballDY = Math.sin(angle) * 2.2
    }

    function step() {
      tick++

      // AI movement - follow ball
      const aiCenter = aiY + paddleH / 2
      const diff = ballY - aiCenter
      aiY += diff * 0.06

      // Simple auto-player
      const playerCenter = playerY + paddleH / 2
      const pDiff = ballY - playerCenter
      playerY += pDiff * 0.05

      // Clamp paddles
      playerY = Math.max(0, Math.min(H - paddleH, playerY))
      aiY = Math.max(0, Math.min(H - paddleH, aiY))

      // Ball trail
      if (tick % 2 === 0) {
        trails.push({ x: ballX, y: ballY, life: 1 })
      }

      // Update trails
      for (let i = trails.length - 1; i >= 0; i--) {
        trails[i].life -= 0.08
        if (trails[i].life <= 0) trails.splice(i, 1)
      }

      // Move ball
      ballX += ballDX
      ballY += ballDY

      // Wall bounce
      if (ballY <= 0 || ballY + ballSize >= H) {
        ballDY *= -1
        ballY = ballY <= 0 ? 0 : H - ballSize
      }

      // Player paddle collision
      if (
        ballDX < 0 &&
        ballX <= 16 + paddleW &&
        ballX >= 16 &&
        ballY + ballSize >= playerY &&
        ballY <= playerY + paddleH
      ) {
        ballDX = Math.abs(ballDX) * 1.02
        const rel = (ballY - (playerY + paddleH / 2)) / (paddleH / 2)
        ballDY = rel * 3
      }

      // AI paddle collision
      if (
        ballDX > 0 &&
        ballX + ballSize >= W - 16 - paddleW &&
        ballX + ballSize <= W - 16 &&
        ballY + ballSize >= aiY &&
        ballY <= aiY + paddleH
      ) {
        ballDX = -Math.abs(ballDX) * 1.02
        const rel = (ballY - (aiY + paddleH / 2)) / (paddleH / 2)
        ballDY = rel * 3
      }

      // Scoring
      if (ballX < 0) {
        aiScore++
        if (aiScoreRef.current) aiScoreRef.current.textContent = String(aiScore)
        resetBall(-1)
      }
      if (ballX > W) {
        playerScore++
        if (playerScoreRef.current) playerScoreRef.current.textContent = String(playerScore)
        resetBall(1)
      }

      // Reset scores at 5
      if (playerScore >= 5 || aiScore >= 5) {
        playerScore = 0
        aiScore = 0
        if (playerScoreRef.current) playerScoreRef.current.textContent = "0"
        if (aiScoreRef.current) aiScoreRef.current.textContent = "0"
      }
    }

    function draw() {
      // BG
      ctx.fillStyle = "#090514"
      ctx.fillRect(0, 0, W, H)

      // Grid
      ctx.strokeStyle = "rgba(0,229,255,0.05)"
      ctx.lineWidth = 0.5
      for (let i = 0; i < W; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke()
      }
      for (let i = 0; i < H; i += 20) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke()
      }

      // Center line
      ctx.fillStyle = "rgba(0,229,255,0.15)"
      for (let i = 0; i < H; i += 12) {
        ctx.fillRect(W / 2 - 1, i, 2, 7)
      }

      // Trails
      ctx.save()
      for (const tr of trails) {
        ctx.globalAlpha = Math.max(0, tr.life * 0.4)
        ctx.fillStyle = "#00e5ff"
        ctx.fillRect(tr.x, tr.y, ballSize * tr.life, ballSize * tr.life)
      }
      ctx.globalAlpha = 1
      ctx.restore()

      // Player paddle (neon green)
      ctx.save()
      ctx.shadowBlur = 12
      ctx.shadowColor = "#00ff88"
      ctx.fillStyle = "#00ff88"
      ctx.fillRect(16, playerY, paddleW, paddleH)
      ctx.restore()

      // AI paddle (neon pink)
      ctx.save()
      ctx.shadowBlur = 12
      ctx.shadowColor = "#ff0066"
      ctx.fillStyle = "#ff0066"
      ctx.fillRect(W - 16 - paddleW, aiY, paddleW, paddleH)
      ctx.restore()

      // Ball
      ctx.save()
      ctx.shadowBlur = 10
      ctx.shadowColor = "#ffffff"
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(ballX, ballY, ballSize, ballSize)
      ctx.restore()

      // Scanline effect
      ctx.fillStyle = "rgba(0,255,136,0.015)"
      const scanY = (tick * 2) % H
      ctx.fillRect(0, scanY, W, 3)
    }

    let animId: number
    function loop() {
      if (tick % 3 === 0) step()
      draw()
      animId = requestAnimationFrame(loop)
    }
    loop()

    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <section className="px-5 md:px-10 pb-20 md:pb-24 bg-background">
      <div className="max-w-[1160px] mx-auto bg-gradient-to-br from-[#0f0524] to-[#1a0a2e] rounded-[40px] p-10 md:p-14 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(255,0,102,0.15),transparent_70%)] rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 left-[30%] w-[200px] h-[200px] bg-[radial-gradient(circle,rgba(0,255,136,0.12),transparent_70%)] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-[rgba(255,0,102,0.15)] text-pink-mid text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border border-[rgba(255,0,102,0.2)] mb-5">
            {String(t("fp_badge"))}
          </div>

          <h2 className="font-serif text-[clamp(28px,3.5vw,48px)] font-extrabold text-primary-foreground tracking-tight leading-[1.1] mb-4 text-balance">
            {String(t("fp_heading_1"))}<br />
            <span className="text-pink-mid">{String(t("fp_heading_2"))}</span>
          </h2>

          <p className="text-[15px] text-primary-foreground/55 leading-relaxed font-light mb-7">
            {String(t("fp_desc"))}
          </p>

          <ul className="flex flex-col gap-2 mb-8">
            {[
              String(t("fp_feat_1")),
              String(t("fp_feat_2")),
              String(t("fp_feat_3")),
              String(t("fp_feat_4")),
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-2.5 text-[13px] text-primary-foreground/70">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-mid shrink-0" />
                {feat}
              </li>
            ))}
          </ul>

          <a
            href="/games/neon-pong"
            className="relative z-10 inline-flex items-center gap-2.5 bg-pink-main text-primary-foreground font-semibold text-[15px] px-7 py-3.5 rounded-xl shadow-[0_4px_20px_rgba(244,114,182,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(244,114,182,0.5)] transition-all"
          >
            &#x25B6; {String(t("fp_cta"))}
          </a>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="bg-[#090514] rounded-2xl p-[3px] border border-primary-foreground/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <canvas ref={canvasRef} width={240} height={160} className="block rounded-[14px]" style={{ width: "240px", height: "160px" }} />
          </div>
          <div className="flex gap-5">
            <div className="text-center">
              <span ref={playerScoreRef} className="font-serif text-[22px] font-extrabold text-[#00ff88] block">
                0
              </span>
              <span className="text-[10px] text-primary-foreground/40 uppercase tracking-widest">
                {String(t("fp_player"))}
              </span>
            </div>
            <div className="text-[22px] text-primary-foreground/20 font-bold">:</div>
            <div className="text-center">
              <span ref={aiScoreRef} className="font-serif text-[22px] font-extrabold text-[#ff0066] block">
                0
              </span>
              <span className="text-[10px] text-primary-foreground/40 uppercase tracking-widest">
                CPU
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
