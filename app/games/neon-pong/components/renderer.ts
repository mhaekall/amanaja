import { VW, VH, BG_DARK, ANIM_DEFS } from "./constants"
import type { AnimDef } from "./constants"
import type { Paddle, Ball, Particle, Trail, Shockwave, OverlayParticle } from "./entities"

// ===== GOAL ANIMATION STATE =====
export interface GoalAnim {
  active: boolean
  key: string
  startTime: number
  dur: number
  cfg: AnimDef | null
}

export function createGoalAnim(): GoalAnim {
  return { active: false, key: "", startTime: 0, dur: 0, cfg: null }
}

export function triggerGoalAnim(anim: GoalAnim, key: string) {
  const cfg = ANIM_DEFS[key]
  if (!cfg) return
  anim.active = true
  anim.key = key
  anim.startTime = performance.now()
  anim.dur = cfg.dur
  anim.cfg = cfg
}

function drawGoalAnimation(ctx: CanvasRenderingContext2D, anim: GoalAnim, timeTick: number) {
  if (!anim.active || !anim.cfg) return
  const elapsed = performance.now() - anim.startTime
  const progress = Math.min(1, elapsed / anim.dur)
  const cfg = anim.cfg

  // Fade phases
  const enterPhase = Math.min(1, elapsed / 300) // 0-300ms enter
  const exitStart = anim.dur - 380
  const exitPhase = elapsed > exitStart ? Math.min(1, (elapsed - exitStart) / 380) : 0

  if (progress >= 1) {
    anim.active = false
    return
  }

  const alpha = enterPhase * (1 - exitPhase)

  ctx.save()

  // Background overlay
  ctx.globalAlpha = alpha * 0.6
  ctx.fillStyle = cfg.bgColor.split(",").slice(0, 3).join(",") + ",0.6)"
  ctx.fillRect(0, 0, VW, VH)

  // Glitch effect
  const effect = cfg.effect
  if ((effect === "glitch" || effect === "explodeGlitch" || effect === "fullChaos") && alpha > 0.3) {
    ctx.globalCompositeOperation = "screen"
    const glitchIntensity = effect === "fullChaos" ? 8 : 4
    for (let i = 0; i < Math.floor(Math.random() * glitchIntensity + 2); i++) {
      const gy = Math.random() * VH
      const gh = Math.random() * 30 + 5
      const shift = (Math.random() - 0.5) * 50
      ctx.fillStyle = cfg.color
      ctx.globalAlpha = (Math.random() * 0.15 + 0.03) * alpha
      ctx.fillRect(shift, gy, VW, gh)
    }
    ctx.globalCompositeOperation = "source-over"
  }

  // Main text
  const scale = effect === "shake"
    ? 1 + Math.sin(elapsed * 0.02) * 0.05 * (1 - exitPhase)
    : enterPhase < 1
      ? 0.3 + enterPhase * 0.7 + (enterPhase < 0.5 ? 0 : Math.sin((enterPhase - 0.5) * Math.PI) * 0.3)
      : 1 + exitPhase * 0.4

  ctx.globalAlpha = alpha
  ctx.save()
  ctx.translate(VW / 2, VH / 2 - 10)
  ctx.scale(scale, scale)

  // Text shadow (pixel art style)
  const fontSize = Math.min(VW * 0.12, 80)
  ctx.font = `900 ${fontSize}px Orbitron, monospace`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  // Drop shadow
  ctx.fillStyle = "#000"
  ctx.fillText(cfg.text, 3, 3)
  ctx.fillText(cfg.text, -2, -2)

  // Glow
  ctx.shadowColor = cfg.glow
  ctx.shadowBlur = 20 + Math.sin(timeTick * 0.1) * 10
  ctx.fillStyle = cfg.color
  ctx.fillText(cfg.text, 0, 0)
  ctx.shadowBlur = 0

  ctx.restore()

  // Sub text
  if (cfg.sub) {
    const subAlpha = elapsed > 200 ? Math.min(1, (elapsed - 200) / 300) * (1 - exitPhase) : 0
    ctx.globalAlpha = subAlpha
    ctx.font = `700 ${Math.min(VW * 0.025, 18)}px 'Share Tech Mono', monospace`
    ctx.textAlign = "center"
    ctx.fillStyle = "#fff"
    ctx.shadowColor = "#000"
    ctx.shadowBlur = 4
    ctx.fillText(cfg.sub, VW / 2, VH / 2 + 35)
    ctx.shadowBlur = 0
  }

  // Flash effect on enter
  if (effect === "flash" && elapsed < 200) {
    ctx.globalAlpha = (1 - elapsed / 200) * 0.4
    ctx.fillStyle = cfg.color
    ctx.fillRect(0, 0, VW, VH)
  }

  ctx.restore()
}

export function drawGame(
  ctx: CanvasRenderingContext2D,
  player: Paddle | null,
  ai: Paddle | null,
  balls: Ball[],
  particles: Particle[],
  trails: Trail[],
  shockwaves: Shockwave[],
  overlayParticles: OverlayParticle[],
  timeTick: number,
  shakeX: number, shakeY: number,
  screenFlash: number, screenFlashColor: string,
  rallyCount: number, rallyBannerTimer: number,
  animGlitchActive: boolean, glitchColor: string,
  goalAnim?: GoalAnim,
) {
  ctx.fillStyle = BG_DARK
  ctx.fillRect(0, 0, VW, VH)
  ctx.save()
  ctx.translate(shakeX, shakeY)

  // Shockwaves
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i]
    sw.radius += 5; sw.life -= 0.05
    if (sw.life <= 0) { shockwaves.splice(i, 1); continue }
    ctx.globalAlpha = Math.max(0, sw.life)
    ctx.strokeStyle = sw.color; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2); ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Screen flash
  if (screenFlash > 0) {
    ctx.fillStyle = screenFlashColor; ctx.globalAlpha = screenFlash
    ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1
  }

  // Center dashed line
  ctx.fillStyle = rallyCount >= 10 ? "rgba(255,119,0,.38)" : "rgba(0,229,255,.28)"
  for (let i = 0; i < VH; i += 35) ctx.fillRect(VW / 2 - 2, i, 4, 20)

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

  // Paddles & Balls
  if (player) player.draw(ctx, timeTick)
  if (ai) ai.draw(ctx, timeTick)
  for (const b of balls) b.draw(ctx)

  // Rally banner (subtle)
  if (rallyBannerTimer > 0) {
    ctx.fillStyle = `rgba(255,119,0,${Math.min(0.5, rallyBannerTimer / 30)})`
    ctx.font = "700 28px Orbitron, monospace"
    ctx.textAlign = "center"
    ctx.fillText("RALLY!", VW / 2, 30)
  }

  // Overlay particles (animation effects)
  for (let i = overlayParticles.length - 1; i >= 0; i--) {
    const p = overlayParticles[i]
    p.vx += (Math.random() - 0.5) * 0.4; p.vy += 0.28
    p.x += p.vx; p.y += p.vy; p.life -= p.decay
    ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    if (p.life <= 0) overlayParticles.splice(i, 1)
  }
  ctx.globalAlpha = 1

  // Glitch effect
  if (animGlitchActive) {
    ctx.globalCompositeOperation = "screen"
    for (let i = 0; i < Math.floor(Math.random() * 5 + 2); i++) {
      const gy = Math.random() * (VH - 20); const gh = Math.random() * 24 + 4
      const shift = (Math.random() - 0.5) * 38
      ctx.fillStyle = Math.random() < 0.5 ? glitchColor : "rgba(255,255,255,.13)"
      ctx.globalAlpha = Math.random() * 0.14 + 0.03
      ctx.fillRect(shift, gy, VW, gh)
    }
    ctx.globalCompositeOperation = "source-over"
    ctx.globalAlpha = 1
  }

  // Goal / streak animation overlay
  if (goalAnim && goalAnim.active) {
    drawGoalAnimation(ctx, goalAnim, timeTick)
  }

  ctx.restore()
}

// Garage preview renderer (Pokemon-style)
export function drawGaragePreview(
  pctx: CanvasRenderingContext2D, W: number, H: number,
  skinId: string, tick: number, bounce: number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SKINS_MAP: Record<string, { name: string; clr: string; glow: string; tier: string; isRamadan?: boolean; draw: (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, hy: boolean) => void }>,
  TIERS_MAP: Record<string, { label: string; clr: string; bg: string }>,
) {
  const sk = SKINS_MAP[skinId]
  const tr = sk ? TIERS_MAP[sk.tier] : { clr: "#00e5ff", bg: "rgba(0,229,255,.1)", label: "?" }

  pctx.fillStyle = "#06020f"; pctx.fillRect(0, 0, W, H)

  // Grid floor
  pctx.strokeStyle = "rgba(255,255,255,.06)"; pctx.lineWidth = 1
  for (let i = 0; i < W; i += 20) pctx.strokeRect(i, 0, 20, H)
  for (let i = 0; i < H; i += 20) pctx.strokeRect(0, i, W, 20)

  // Radial glow
  const rdg = pctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 70)
  rdg.addColorStop(0, tr.bg.replace(/[\d.]+\)$/, ".22)"))
  rdg.addColorStop(1, "rgba(0,0,0,0)")
  pctx.fillStyle = rdg; pctx.fillRect(0, 0, W, H)

  // Shadow
  pctx.fillStyle = `rgba(0,0,0,${0.35 - bounce * 0.015})`
  const shadowW = 38 + bounce * 1.5
  pctx.beginPath(); pctx.ellipse(W / 2, H * 0.8 + 4, shadowW / 2, 5, 0, 0, Math.PI * 2); pctx.fill()

  if (!sk) return

  const pw = 24, ph = 80
  const py = H / 2 - ph / 2 - bounce
  const scl = 1 + Math.sin(tick * 0.05) * 0.04

  pctx.save()
  pctx.translate(W / 2, py + ph / 2)
  pctx.scale(scl, scl)
  pctx.translate(-pw / 2, -ph / 2)
  try { sk.draw(pctx, 0, 0, pw, ph, tick, Math.sin(tick * 0.08) > 0.5) } catch { /* */ }
  pctx.restore()

  // Name + tier
  pctx.textAlign = "center"
  pctx.font = "bold 11px Orbitron, monospace"
  pctx.fillStyle = tr.clr
  pctx.shadowColor = tr.clr; pctx.shadowBlur = 8
  pctx.fillText(sk.name, W / 2, H * 0.88)
  pctx.shadowBlur = 0
  pctx.font = "8px 'Share Tech Mono', monospace"
  pctx.fillStyle = "rgba(255,255,255,.45)"
  pctx.fillText(tr.label, W / 2, H * 0.95)
}
