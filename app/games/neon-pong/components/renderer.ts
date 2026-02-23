import { VW, VH, BG_DARK } from "./constants"
import type { Paddle, Ball, Particle, Trail, Shockwave } from "./entities"

export function drawGame(
  ctx: CanvasRenderingContext2D,
  player: Paddle | null,
  ai: Paddle | null,
  balls: Ball[],
  particles: Particle[],
  trails: Trail[],
  shockwaves: Shockwave[],
  timeTick: number,
  shakeX: number,
  shakeY: number,
  screenFlash: number,
  screenFlashColor: string,
  rallyCount: number,
  rallyBannerTimer: number,
) {
  ctx.fillStyle = BG_DARK
  ctx.fillRect(0, 0, VW, VH)
  ctx.save()
  ctx.translate(shakeX, shakeY)

  // Shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i]
    sw.radius += 5
    sw.life -= 0.05
    if (sw.life <= 0) { shockwaves.splice(i, 1); continue }
    ctx.globalAlpha = Math.max(0, sw.life)
    ctx.strokeStyle = sw.color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Screen flash
  if (screenFlash > 0) {
    ctx.fillStyle = screenFlashColor
    ctx.globalAlpha = screenFlash
    ctx.fillRect(0, 0, VW, VH)
    ctx.globalAlpha = 1
  }

  // Center dashed line
  ctx.fillStyle = rallyCount >= 10 ? "rgba(255,119,0,0.38)" : "rgba(0,229,255,0.28)"
  for (let i = 0; i < VH; i += 35) {
    ctx.fillRect(VW / 2 - 2, i, 4, 20)
  }

  // Trails
  for (const tr of trails) {
    ctx.globalAlpha = Math.max(0, tr.life)
    ctx.fillStyle = tr.color
    ctx.fillRect(Math.floor(tr.x - tr.size / 2), Math.floor(tr.y - tr.size / 2), tr.size, tr.size)
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life)
    ctx.fillStyle = p.color
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size)
  }
  ctx.globalAlpha = 1

  // Paddles
  if (player) player.draw(ctx, timeTick)
  if (ai) ai.draw(ctx, timeTick)

  // Balls
  for (const b of balls) b.draw(ctx)

  // Rally banner
  if (rallyBannerTimer > 0) {
    ctx.fillStyle = `rgba(255,119,0,${rallyBannerTimer / 60})`
    ctx.font = "900 55px 'Press Start 2P', monospace"
    ctx.textAlign = "center"
    ctx.fillText("RALLY!", VW / 2, VH / 2 - 45)
  }

  ctx.restore()
}
