import { VW, VH, MAX_HYPER_STACKS, SKINS } from "./constants"

export interface Particle {
  x: number; y: number; size: number; dx: number; dy: number; life: number; decay: number; color: string
}
export interface Trail {
  x: number; y: number; size: number; life: number; color: string
}
export interface Shockwave {
  x: number; y: number; radius: number; life: number; color: string
}
export interface OverlayParticle {
  x: number; y: number; size: number; vx: number; vy: number; life: number; decay: number; color: string
}

export class Paddle {
  x: number
  y: number
  w = 14
  h: number
  baseH: number
  isAI: boolean
  score = 0
  skin: string
  color: string
  prevY: number
  vy = 0
  dragTargetY: number
  dpadTargetY: number
  hyperStacks: number
  hyperCooldown = 0
  hyperPressed = false
  isBoss: boolean
  reactionDelay = 0
  wasBallComing = false

  constructor(x: number, isAI = false, stage = 1, mode = "ARCADE", equippedSkin = "BAJA") {
    this.x = x
    this.isAI = isAI
    this.baseH = 95
    this.isBoss = false
    if (isAI && mode === "ARCADE" && stage % 5 === 0) {
      this.baseH = 175
      this.isBoss = true
    }
    this.h = this.baseH
    this.y = VH / 2 - this.baseH / 2
    this.prevY = this.y
    this.dragTargetY = this.y
    this.dpadTargetY = this.y
    this.skin = isAI ? (this.isBoss ? "KIAMAT" : "BAJA") : equippedSkin
    if (!SKINS[this.skin]) this.skin = "BAJA"
    this.color = isAI ? (this.isBoss ? "#ff4400" : "#ff0066") : (SKINS[this.skin]?.clr ?? "#00e5ff")
    this.hyperStacks = isAI ? (this.isBoss ? 3 : 0) : MAX_HYPER_STACKS
  }

  update(targetY: number, stage: number, difficulty: string, mode: string, rallyCount: number, ctrlMode: string) {
    this.prevY = this.y
    if (this.isAI) {
      if (this.reactionDelay > 0) {
        this.reactionDelay--
      } else {
        let maxSpd = 4.5
        let smooth = 0.08
        if (mode === "ARCADE") {
          maxSpd = 3.0 + stage * 0.4
          smooth = 0.05 + stage * 0.01
          if (this.isBoss) { maxSpd *= 0.7; smooth *= 0.8 }
        } else {
          switch (difficulty) {
            case "easy": maxSpd = 2.5; smooth = 0.04; break
            case "normal": maxSpd = 4.5; smooth = 0.08; break
            case "hard": maxSpd = 6.5; smooth = 0.15; break
          }
        }
        if (rallyCount > 8) maxSpd += 3
        const c = this.y + this.h / 2
        const dist = targetY - c
        this.y += dist * smooth
        if (this.y - this.prevY > maxSpd) this.y = this.prevY + maxSpd
        if (this.prevY - this.y > maxSpd) this.y = this.prevY - maxSpd
      }
      this.vy = this.y - this.prevY
    } else {
      if (ctrlMode === "drag") {
        this.y += (this.dragTargetY - this.y) * 0.38
      } else {
        this.y += (this.dpadTargetY - this.y) * 0.45
      }
      this.vy = this.y - this.prevY
    }
    this.y = Math.max(0, Math.min(VH - this.h, this.y))
    this.dragTargetY = Math.max(0, Math.min(VH - this.h, this.dragTargetY))
    this.dpadTargetY = Math.max(0, Math.min(VH - this.h, this.dpadTargetY))
  }

  draw(ctx: CanvasRenderingContext2D, timeTick: number) {
    const isHy = (!this.isAI && this.hyperPressed && this.hyperStacks > 0) || (this.isAI && this.hyperPressed)
    const sk = SKINS[this.skin]
    ctx.save()
    if (isHy) { ctx.shadowBlur = 14; ctx.shadowColor = sk ? sk.glow : "#ff7700" }
    try {
      if (sk && sk.draw) {
        sk.draw(ctx, this.x, this.y, this.w, this.h, timeTick, isHy)
      } else {
        ctx.fillStyle = isHy ? "#ff7700" : (sk ? sk.clr : this.color)
        ctx.fillRect(this.x, this.y, this.w, this.h)
      }
    } catch { /* silence */ }
    ctx.restore()
  }
}

export class Ball {
  size = 12
  x: number
  y: number
  prevX: number
  prevY: number
  dx: number
  dy: number
  mult = 1
  isHyper = false
  color = "#fff"

  constructor(dir = 1) {
    this.x = VW / 2 - 6
    this.y = VH / 2 - 6
    this.prevX = this.x
    this.prevY = this.y
    const angle = Math.random() * 0.45 - 0.225
    const spd = 6.5
    this.dx = Math.cos(angle) * spd * dir
    this.dy = Math.sin(angle) * spd
  }

  update(trails: Trail[]) {
    this.prevX = this.x
    this.prevY = this.y
    this.x += this.dx * this.mult
    this.y += this.dy * this.mult
    if (Math.random() > 0.3) {
      const tc = this.isHyper ? (Math.random() > 0.5 ? "#00e5ff" : "#ff0066") : this.color
      trails.push({ x: this.x + 6, y: this.y + 6, size: this.size, life: 1, color: tc })
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.isHyper ? "#ff0066" : this.color
    ctx.fillRect(this.x, this.y, this.size, this.size)
    ctx.fillStyle = "#fff"
    ctx.fillRect(this.x + 2, this.y + 2, this.size - 4, this.size - 4)
  }
}

export function spawnFx(
  particles: Particle[], x: number, y: number, color: string, n: number,
  type: "normal" | "fast" | "fire" | "float" | "glitch" = "normal",
) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    let s = Math.random() * 6 + 2
    let pdx = Math.cos(a) * s, pdy = Math.sin(a) * s, life = 1, decay = Math.random() * 0.05 + 0.02, sz = Math.random() * 3 + 2
    let c = color
    if (type === "fast") { s *= 2; pdx = Math.cos(a) * s; pdy = Math.sin(a) * s }
    if (type === "fire") { pdy = -Math.abs(pdy) - 2; pdx *= 0.5; life = 1.5; decay *= 0.8; sz *= 1.5 }
    if (type === "float") { pdy *= 0.3; pdx *= 0.3; life = 2; decay *= 0.5 }
    if (type === "glitch") { sz = Math.random() * 8 + 2; c = Math.random() > 0.5 ? color : "#fff" }
    particles.push({ x, y, size: sz, dx: pdx, dy: pdy, life, decay, color: c })
  }
}

export function spawnShockwave(shockwaves: Shockwave[], x: number, y: number, color: string) {
  shockwaves.push({ x, y, radius: 5, life: 1, color })
}

export function spawnCanvasPixels(overlayParticles: OverlayParticle[], color: string, pixels: number, explosion = false) {
  const n = explosion ? pixels * 2 : pixels * 3
  const colors = [color, "#fff", "#ffee00", "#ff7700", "#ff0066", "#00e5ff"]
  for (let i = 0; i < n; i++) {
    overlayParticles.push({
      x: explosion ? VW / 2 : VW * (0.2 + Math.random() * 0.6),
      y: explosion ? VH / 2 : VH * (0.2 + Math.random() * 0.6),
      size: Math.random() * 9 + 3,
      vx: explosion ? (Math.random() - 0.5) * 14 : (Math.random() - 0.5) * 7,
      vy: explosion ? (Math.random() - 0.5) * 14 : (Math.random() - 0.5) * 9 - 2,
      life: 1,
      decay: explosion ? 0.016 + Math.random() * 0.025 : 0.013 + Math.random() * 0.02,
      color: explosion
        ? [color, "#fff", "#ffee00"][Math.floor(Math.random() * 3)]
        : colors[Math.floor(Math.random() * colors.length)],
    })
  }
}
