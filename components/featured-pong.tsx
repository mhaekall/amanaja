"use client"

import { useEffect, useRef } from "react"
import { useI18n } from "@/lib/i18n-context"

export default function FeaturedPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerScoreRef = useRef<HTMLSpanElement>(null)
  const aiScoreRef = useRef<HTMLSpanElement>(null)
  const rallyRef = useRef<HTMLSpanElement>(null)
  const { t } = useI18n()

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return

    const W = 240
    const H = 160

    const PADDLE_W = 6
    const PADDLE_H = 36
    const BALL_SIZE = 6

    let playerY = H / 2 - PADDLE_H / 2
    let aiY = H / 2 - PADDLE_H / 2
    let ballX = W / 2 - BALL_SIZE / 2
    let ballY = H / 2 - BALL_SIZE / 2
    let ballDX = 2.2
    let ballDY = 1.2
    let playerScore = 0
    let aiScore = 0
    let rally = 0
    let tick = 0

    // Trails for neon effect
    const trails: { x: number; y: number; life: number; color: string }[] = []
    // Particles
    const particles: { x: number; y: number; dx: number; dy: number; life: number; color: string; size: number }[] = []

    function spawnParticles(x: number, y: number, color: string, count: number) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 3 + 1
        particles.push({
          x, y,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          life: 1,
          color,
          size: Math.random() * 3 + 1,
        })
      }
    }

    function resetBall(dir: number) {
      ballX = W / 2 - BALL_SIZE / 2
      ballY = H / 2 - BALL_SIZE / 2
      const angle = (Math.random() * 0.6 - 0.3)
      const speed = 2.2
      ballDX = Math.cos(angle) * speed * dir
      ballDY = Math.sin(angle) * speed
      rally = 0
    }

    function step() {
      tick++

      // AI follows ball with slight smoothness
      const aiCenter = aiY + PADDLE_H / 2
      const target = ballY + BALL_SIZE / 2
      const diff = target - aiCenter
      aiY += diff * 0.07

      // Player follows ball (auto-play with slight delay)
      const playerCenter = playerY + PADDLE_H / 2
      const pTarget = ballY + BALL_SIZE / 2 + Math.sin(tick * 0.04) * 8
      const pDiff = pTarget - playerCenter
      playerY += pDiff * 0.06

      // Clamp paddles
      playerY = Math.max(0, Math.min(H - PADDLE_H, playerY))
      aiY = Math.max(0, Math.min(H - PADDLE_H, aiY))

      // Move ball
      ballX += ballDX
      ballY += ballDY

      // Trail
      if (tick % 2 === 0) {
        trails.push({
          x: ballX + BALL_SIZE / 2,
          y: ballY + BALL_SIZE / 2,
          life: 1,
          color: rally >= 6 ? "#ff7700" : "#ffffff",
        })
      }

      // Wall bounce
      if (ballY <= 0) {
        ballY = 0
        ballDY = Math.abs(ballDY)
        spawnParticles(ballX + BALL_SIZE / 2, 0, "#00e5ff", 3)
      }
      if (ballY + BALL_SIZE >= H) {
        ballY = H - BALL_SIZE
        ballDY = -Math.abs(ballDY)
        spawnParticles(ballX + BALL_SIZE / 2, H, "#00e5ff", 3)
      }

      // Player paddle collision (left)
      if (
        ballDX < 0 &&
        ballX <= 14 + PADDLE_W &&
        ballX >= 14 &&
        ballY + BALL_SIZE >= playerY &&
        ballY <= playerY + PADDLE_H
      ) {
        ballDX = Math.abs(ballDX) * 1.03
        const rel = (ballY + BALL_SIZE / 2 - (playerY + PADDLE_H / 2)) / (PADDLE_H / 2)
        ballDY = rel * 3
        rally++
        spawnParticles(14 + PADDLE_W, ballY + BALL_SIZE / 2, "#00ff88", 5)
      }

      // AI paddle collision (right)
      if (
        ballDX > 0 &&
        ballX + BALL_SIZE >= W - 14 - PADDLE_W &&
        ballX + BALL_SIZE <= W - 14 &&
        ballY + BALL_SIZE >= aiY &&
        ballY <= aiY + PADDLE_H
      ) {
        ballDX = -Math.abs(ballDX) * 1.03
        const rel = (ballY + BALL_SIZE / 2 - (aiY + PADDLE_H / 2)) / (PADDLE_H / 2)
        ballDY = rel * 3
        rally++
        spawnParticles(W - 14 - PADDLE_W, ballY + BALL_SIZE / 2, "#ff0066", 5)
      }

      // Scoring
      if (ballX < 0) {
        aiScore++
        if (aiScoreRef.current) aiScoreRef.current.textContent = String(aiScore)
        if (rallyRef.current) rallyRef.current.textContent = String(rally)
        spawnParticles(0, H / 2, "#ff0066", 10)
        resetBall(-1)
      }
      if (ballX > W) {
        playerScore++
        if (playerScoreRef.current) playerScoreRef.current.textContent = String(playerScore)
        if (rallyRef.current) rallyRef.current.textContent = String(rally)
        spawnParticles(W, H / 2, "#00ff88", 10)
        resetBall(1)
      }

      // Cap speed
      const maxSpd = 4.5
      const currentSpd = Math.sqrt(ballDX * ballDX + ballDY * ballDY)
      if (currentSpd > maxSpd) {
        ballDX = (ballDX / currentSpd) * maxSpd
        ballDY = (ballDY / currentSpd) * maxSpd
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.dx
        p.y += p.dy
        p.dx *= 0.92
        p.dy *= 0.92
        p.life -= 0.04
        if (p.life <= 0) particles.splice(i, 1)
      }

      // Update trails
      for (let i = trails.length - 1; i >= 0; i--) {
        trails[i].life -= 0.08
        if (trails[i].life <= 0) trails.splice(i, 1)
      }
    }

    function draw() {
      // Background
      ctx.fillStyle = "#090514"
      ctx.fillRect(0, 0, W, H)

      // Grid
      ctx.strokeStyle = "rgba(0,229,255,0.04)"
      ctx.lineWidth = 0.5
      for (let i = 0; i <= W; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke()
      }
      for (let i = 0; i <= H; i += 20) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke()
      }

      // Center line
      ctx.fillStyle = rally >= 6 ? "rgba(255,119,0,0.3)" : "rgba(0,229,255,0.2)"
      for (let i = 0; i < H; i += 12) {
        ctx.fillRect(W / 2 - 1, i, 2, 7)
      }

      // Trails
      for (const tr of trails) {
        ctx.globalAlpha = Math.max(0, tr.life * 0.5)
        ctx.fillStyle = tr.color
        ctx.fillRect(tr.x - 2, tr.y - 2, 4, 4)
      }
      ctx.globalAlpha = 1

      // Particles
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      }
      ctx.globalAlpha = 1

      // Player paddle (green neon)
      ctx.shadowBlur = 8
      ctx.shadowColor = "#00ff88"
      ctx.fillStyle = "#00ff88"
      ctx.fillRect(14, playerY, PADDLE_W, PADDLE_H)
      // Highlight
      ctx.fillStyle = "rgba(255,255,255,0.4)"
      ctx.fillRect(14 + PADDLE_W - 1.5, playerY, 1.5, PADDLE_H)

      // AI paddle (pink neon)
      ctx.shadowColor = "#ff0066"
      ctx.fillStyle = "#ff0066"
      ctx.fillRect(W - 14 - PADDLE_W, aiY, PADDLE_W, PADDLE_H)
      ctx.fillStyle = "rgba(255,255,255,0.4)"
      ctx.fillRect(W - 14 - PADDLE_W, aiY, 1.5, PADDLE_H)

      // Ball
      ctx.shadowBlur = 10
      ctx.shadowColor = "#ffffff"
      ctx.fillStyle = rally >= 6 ? "#ff7700" : "#ffffff"
      ctx.fillRect(ballX, ballY, BALL_SIZE, BALL_SIZE)
      ctx.fillStyle = "rgba(255,255,255,0.7)"
      ctx.fillRect(ballX + 1, ballY + 1, BALL_SIZE - 2, BALL_SIZE - 2)

      ctx.shadowBlur = 0

      // Vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.6)
      vg.addColorStop(0, "rgba(0,0,0,0)")
      vg.addColorStop(1, "rgba(0,0,0,0.5)")
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, W, H)
    }

    let animId: number
    function loop() {
      step()
      draw()
      animId = requestAnimationFrame(loop)
    }
    loop()

    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <section className="px-5 md:px-10 pb-20 md:pb-24 bg-background">
      <div className="max-w-[1160px] mx-auto bg-gradient-to-br from-[#0f0520] to-[#1a0a2e] rounded-[40px] p-10 md:p-14 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center relative overflow-hidden">
        {/* Decorative glows */}
        <div className="absolute -top-20 -left-20 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(0,255,136,0.15),transparent_70%)] rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 right-[20%] w-[250px] h-[250px] bg-[radial-gradient(circle,rgba(255,0,102,0.12),transparent_70%)] rounded-full pointer-events-none" />

        <div className="relative z-10 order-2 lg:order-1 flex flex-col items-center gap-4">
          <div className="bg-[#050510] rounded-2xl p-[3px] border border-[rgba(0,255,136,0.12)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <canvas
              ref={canvasRef}
              width={240}
              height={160}
              className="block rounded-[14px] w-[240px] h-[160px]"
            />
          </div>
          <div className="flex gap-5">
            <div className="text-center">
              <span
                ref={playerScoreRef}
                className="font-serif text-[22px] font-extrabold text-[#00ff88] block"
              >
                0
              </span>
              <span className="text-[10px] text-primary-foreground/40 uppercase tracking-widest">
                {String(t("pong_you"))}
              </span>
            </div>
            <div className="text-center">
              <span className="font-serif text-[16px] font-bold text-primary-foreground/30 block mt-1">
                VS
              </span>
            </div>
            <div className="text-center">
              <span
                ref={aiScoreRef}
                className="font-serif text-[22px] font-extrabold text-[#ff0066] block"
              >
                0
              </span>
              <span className="text-[10px] text-primary-foreground/40 uppercase tracking-widest">
                CPU
              </span>
            </div>
            <div className="text-center ml-3 pl-3 border-l border-primary-foreground/10">
              <span
                ref={rallyRef}
                className="font-serif text-[22px] font-extrabold text-[#ff7700] block"
              >
                0
              </span>
              <span className="text-[10px] text-primary-foreground/40 uppercase tracking-widest">
                Rally
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 order-1 lg:order-2">
          <div className="inline-flex items-center gap-1.5 bg-[rgba(0,255,136,0.1)] text-[#00ff88] text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border border-[rgba(0,255,136,0.2)] mb-5">
            {String(t("pong_badge"))}
          </div>

          <h2 className="font-serif text-[clamp(28px,3.5vw,48px)] font-extrabold text-primary-foreground tracking-tight leading-[1.1] mb-4 text-balance">
            {String(t("pong_heading_1"))}<br />
            <span className="text-[#00e5ff]">{String(t("pong_heading_2"))}</span>
          </h2>

          <p className="text-[15px] text-primary-foreground/55 leading-relaxed font-light mb-7">
            {String(t("pong_desc"))}
          </p>

          <ul className="flex flex-col gap-2 mb-8">
            {[
              String(t("pong_feat_1")),
              String(t("pong_feat_2")),
              String(t("pong_feat_3")),
              String(t("pong_feat_4")),
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-2.5 text-[13px] text-primary-foreground/70">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shrink-0" />
                {feat}
              </li>
            ))}
          </ul>

          <a
            href="/games/neon-pong"
            className="relative z-10 inline-flex items-center gap-2.5 bg-[#00ff88] text-[#090514] font-semibold text-[15px] px-7 py-3.5 rounded-xl shadow-[0_4px_20px_rgba(0,255,136,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,255,136,0.5)] transition-all"
          >
            &#x25B6; {String(t("pong_cta"))}
          </a>
        </div>
      </div>
    </section>
  )
}
