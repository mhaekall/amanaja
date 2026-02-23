import { VW, VH, MAX_HYPER_STACKS, NEON_GREEN, NEON_PINK } from "./constants"

export interface Particle {
  x: number; y: number; size: number; dx: number; dy: number; life: number; decay: number; color: string
}
export interface Trail {
  x: number; y: number; size: number; life: number; color: string
}
export interface Shockwave {
  x: number; y: number; radius: number; life: number; color: string
}

export class Paddle {
  x: number
  y: number
  w = 14
  h: number
  baseH: number
  isAI: boolean
  score = 0
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

  constructor(x: number, isAI = false, stage = 1, mode = "ARCADE") {
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
    this.color = isAI ? (this.isBoss ? "#ff4400" : NEON_PINK) : NEON_GREEN
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
    ctx.save()
    if (isHy) { ctx.shadowBlur = 14; ctx.shadowColor = "#ff7700" }
    else { ctx.shadowBlur = 8; ctx.shadowColor = this.color }
    ctx.fillStyle = isHy ? "#ff7700" : this.color
    ctx.fillRect(this.x, this.y, this.w, this.h)
    // Highlight edge
    ctx.fillStyle = "rgba(255,255,255,0.35)"
    ctx.fillRect(this.x + this.w - 2, this.y, 2, this.h)
    // Animated pulse line
    const pulseY = (timeTick * 2) % this.h
    ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.sin(timeTick * 0.08) * 0.1})`
    ctx.fillRect(this.x, this.y + pulseY, this.w, 2)
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

export function spawnFx(particles: Particle[], x: number, y: number, color: string, n: number) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const s = Math.random() * 6 + 2
    particles.push({
      x, y,
      size: Math.random() * 3 + 2,
      dx: Math.cos(a) * s,
      dy: Math.sin(a) * s,
      life: 1,
      decay: Math.random() * 0.05 + 0.02,
      color,
    })
  }
}

export function spawnShockwave(shockwaves: Shockwave[], x: number, y: number, color: string) {
  shockwaves.push({ x, y, radius: 5, life: 1, color })
}
