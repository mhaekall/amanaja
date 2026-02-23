// Canvas virtual dimensions
export const VW = 820
export const VH = 461
export const WIN_SCORE = 5
export const MAX_HYPER_STACKS = 3
export const HYPER_COOLDOWN_MS = 5000
export const DPAD_SPEED = 7

// Colors
export const NEON_GREEN = "#00ff88"
export const NEON_PINK = "#ff0066"
export const NEON_CYAN = "#00e5ff"
export const NEON_YELLOW = "#ffee00"
export const NEON_ORANGE = "#ff7700"
export const BG_DARK = "#090514"

// ========== TIERS ==========
export interface TierDef {
  label: string; clr: string; bg: string; br: string
}
export const TIERS: Record<string, TierDef> = {
  BIASA:     { label: "BIASA",     clr: "#aaaaaa", bg: "rgba(160,160,160,.12)", br: "rgba(160,160,160,.28)" },
  ANDAL:     { label: "ANDAL",     clr: "#00e5ff", bg: "rgba(0,229,255,.1)",    br: "rgba(0,229,255,.36)" },
  LANGKA:    { label: "LANGKA",    clr: "#00ff88", bg: "rgba(0,255,136,.1)",    br: "rgba(0,255,136,.36)" },
  SAKTI:     { label: "SAKTI",     clr: "#ff7700", bg: "rgba(255,119,0,.12)",   br: "rgba(255,119,0,.4)" },
  MAHAKUASA: { label: "MAHAKUASA", clr: "#ff0066", bg: "rgba(255,0,102,.12)",   br: "rgba(255,0,102,.42)" },
  DEWA:      { label: "DEWA",      clr: "#cc00ff", bg: "rgba(204,0,255,.14)",   br: "rgba(204,0,255,.48)" },
  RAMADAN:   { label: "RAMADAN",   clr: "#ffd700", bg: "rgba(255,215,0,.14)",   br: "rgba(255,215,0,.55)" },
}

// ========== SHAPES ==========
export type ShapeType = "rect" | "rounded" | "hexagon" | "diamond" | "arrow" | "shield" | "pill"

export function drawShape(
  c: CanvasRenderingContext2D, shape: ShapeType,
  x: number, y: number, w: number, h: number, fillFn: () => void,
) {
  c.save()
  c.beginPath()
  switch (shape) {
    case "rounded": {
      const r = Math.min(w, h) * 0.3
      c.roundRect(x, y, w, h, r)
      break
    }
    case "hexagon": {
      const cx2 = x + w / 2, cy2 = y + h / 2, rx = w / 2, ry = h / 2
      c.moveTo(cx2, cy2 - ry)
      c.lineTo(cx2 + rx * 0.8, cy2 - ry * 0.5)
      c.lineTo(cx2 + rx * 0.8, cy2 + ry * 0.5)
      c.lineTo(cx2, cy2 + ry)
      c.lineTo(cx2 - rx * 0.8, cy2 + ry * 0.5)
      c.lineTo(cx2 - rx * 0.8, cy2 - ry * 0.5)
      c.closePath()
      break
    }
    case "diamond": {
      const cx2 = x + w / 2, cy2 = y + h / 2
      c.moveTo(cx2, y); c.lineTo(x + w, cy2); c.lineTo(cx2, y + h); c.lineTo(x, cy2)
      c.closePath()
      break
    }
    case "arrow": {
      const cx2 = x + w / 2
      c.moveTo(x, y + h * 0.2); c.lineTo(cx2, y); c.lineTo(x + w, y + h * 0.2)
      c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath()
      break
    }
    case "shield": {
      const cx2 = x + w / 2
      c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h * 0.6)
      c.quadraticCurveTo(cx2, y + h + h * 0.12, x, y + h * 0.6)
      c.closePath()
      break
    }
    case "pill": {
      const r2 = w / 2
      c.arc(x + r2, y + r2, r2, Math.PI, 0)
      c.lineTo(x + w, y + h - r2)
      c.arc(x + r2, y + h - r2, r2, 0, Math.PI)
      c.closePath()
      break
    }
    default:
      c.rect(x, y, w, h)
  }
  c.clip()
  fillFn()
  c.restore()
}

// ========== SKIN DATABASE ==========
export interface SkinDef {
  name: string; tier: string; price: number; unlockStage: number; shape: ShapeType
  clr: string; glow: string; desc: string; isRamadan?: boolean; bonusStage?: number
  draw: (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, hy: boolean) => void
}

export const SKINS: Record<string, SkinDef> = {
  BAJA: {
    name: "BAJA", tier: "BIASA", price: 0, unlockStage: 0, shape: "rect",
    clr: "#00e5ff", glow: "#00e5ff", desc: "Baja murni siber. Bersih, tajam, presisi tempur.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = hy ? "#ff7700" : this.clr; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        c.fillStyle = "rgba(255,255,255,.55)"; c.fillRect(x + w - 3, y, 3, h)
        c.fillStyle = "rgba(255,255,255,.15)"; c.fillRect(x, y, w, 4)
      })
    },
  },
  PASIR: {
    name: "PASIR", tier: "BIASA", price: 40, unlockStage: 0, shape: "rect",
    clr: "#c8a060", glow: "#c8a060", desc: "Kamuflase gurun. Menyatu dengan medan.",
    draw(c, x, y, w, h, _t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        const cols = ["#a07840", "#c8a060", "#e0b870"]
        for (let i = 0; i < 3; i++) { c.fillStyle = cols[i]; c.fillRect(x, y + i * (h / 3), w, h / 3 + 1) }
        for (let i = 0; i < 5; i++) { const sy = y + Math.random() * h; c.fillStyle = "rgba(160,120,60,.2)"; c.fillRect(x, sy, w, 2) }
        if (hy) { c.fillStyle = "rgba(255,119,0,.35)"; c.fillRect(x, y, w, h) }
      })
    },
  },
  BAYANG: {
    name: "BAYANG", tier: "ANDAL", price: 150, unlockStage: 0, shape: "pill",
    clr: "#8855ff", glow: "#aa77ff", desc: "Bayangan hidup. Melayang di antara dua dunia.",
    draw(c, x, y, w, h, t, hy) {
      const a = hy ? 0.92 : 0.45 + Math.sin(t * 0.09) * 0.28
      drawShape(c, this.shape, x, y, w, h, () => {
        c.globalAlpha = a; c.fillStyle = "#8855ff"; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let i = 0; i < 2; i++) { c.fillStyle = `rgba(180,130,255,${0.18 + Math.sin(t * 0.07 + i) * 0.1})`; c.fillRect(x, y + ((t * 1.5 + i * 30) % h), w, 2) }
        c.globalAlpha = 1
        c.strokeStyle = `rgba(200,160,255,${a})`; c.lineWidth = 1.5; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
      })
    },
  },
  PETIR: {
    name: "PETIR", tier: "ANDAL", price: 200, unlockStage: 0, shape: "arrow",
    clr: "#ffee00", glow: "#ffee00", desc: "Kilat statis dari badai sistem.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = "#ccaa00"; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        if (t % 5 < 2) { c.fillStyle = "rgba(255,255,200,.75)"; c.fillRect(x + 1, y + Math.floor(Math.random() * h * 0.6), w - 2, 2) }
        c.fillStyle = hy ? "#fff" : "#ffee00"; c.fillRect(x + w - 2, y, 2, h)
        c.strokeStyle = `rgba(255,238,0,${0.35 + Math.sin(t * 0.12) * 0.25})`; c.lineWidth = 1; c.strokeRect(x, y, w, h)
      })
    },
  },
  LAUTAN: {
    name: "LAUTAN", tier: "ANDAL", price: 220, unlockStage: 0, shape: "rounded",
    clr: "#0099ff", glow: "#00ccff", desc: "Tenang di permukaan. Mematikan di kedalaman.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        const g2 = c.createLinearGradient(x, y, x, y + h)
        g2.addColorStop(0, "#004488"); g2.addColorStop(0.5 + Math.sin(t * 0.04) * 0.22, "#0099ff"); g2.addColorStop(1, "#002255")
        c.fillStyle = g2; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        const wv = Math.sin(t * 0.06) * 3
        c.fillStyle = "rgba(100,200,255,.3)"; c.fillRect(x, y + h * 0.32 + wv, w, 2)
        c.fillStyle = "rgba(255,255,255,.1)"; c.fillRect(x, y + h * 0.62 + wv * 0.7, w, 2)
        if (hy) { c.globalAlpha = 0.28; c.fillStyle = "#ffffff"; c.fillRect(x, y, w, h); c.globalAlpha = 1 }
      })
    },
  },
  NAGA: {
    name: "NAGA", tier: "LANGKA", price: 400, unlockStage: 0, shape: "shield",
    clr: "#ff4400", glow: "#ff6600", desc: "Api naga purba menyala dalam jalur data.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = "#880800"; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let i = 0; i < 5; i++) {
          const fy = y + ((t * 1.8 + i * 22) % h); const fh = 3 + Math.abs(Math.sin(t * 0.08 + i)) * 5
          c.fillStyle = i % 2 === 0 ? "#ff4400" : "#ff8800"; c.fillRect(x + 1, fy, w - 2, fh)
        }
        if (hy) { c.fillStyle = "rgba(255,200,0,.32)"; c.fillRect(x, y, w, h) }
        c.strokeStyle = `rgba(255,${60 + Math.sin(t * 0.1) * 40},0,.55)`; c.lineWidth = 1.5; c.strokeRect(x, y, w, h)
      })
    },
  },
  RACUN: {
    name: "RACUN", tier: "LANGKA", price: 450, unlockStage: 0, shape: "hexagon",
    clr: "#44ff44", glow: "#88ff00", desc: "Zat toksik dari server yang terinfeksi.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = "#113311"; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let i = 0; i < 3; i++) {
          const dy = ((t * 2 + i * 35) % h)
          c.fillStyle = "rgba(50,255,0,.5)"
          c.beginPath(); c.ellipse(x + w * 0.3 + i * 3, y + dy, 2, 4, 0, 0, Math.PI * 2); c.fill()
        }
        c.strokeStyle = `rgba(80,255,50,${0.4 + Math.sin(t * 0.08) * 0.25})`; c.lineWidth = 1.5; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
        if (hy) { c.globalAlpha = 0.28; c.fillStyle = "#00ff00"; c.fillRect(x, y, w, h); c.globalAlpha = 1 }
      })
    },
  },
  HANTU: {
    name: "HANTU", tier: "LANGKA", price: 500, unlockStage: 10, shape: "pill",
    clr: "#ccccff", glow: "#aaaaff", desc: "Entitas dari dimensi terlarang. Tidak bisa disentuh.",
    draw(c, x, y, w, h, t, hy) {
      const a = hy ? 0.88 : 0.22 + Math.abs(Math.sin(t * 0.055)) * 0.5
      drawShape(c, this.shape, x, y, w, h, () => {
        c.globalAlpha = a
        const g2 = c.createLinearGradient(x, y, x + w, y + h)
        g2.addColorStop(0, "#9999cc"); g2.addColorStop(0.5, "#ffffff"); g2.addColorStop(1, "#7777aa")
        c.fillStyle = g2; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.globalAlpha = 1
        c.strokeStyle = `rgba(180,180,255,${a * 0.8})`; c.lineWidth = 1; c.strokeRect(x, y, w, h)
      })
    },
  },
  JALA: {
    name: "JALA", tier: "LANGKA", price: 520, unlockStage: 11, shape: "diamond",
    clr: "#ff00aa", glow: "#ff66cc", desc: "Perangkap data berduri.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = "#440022"; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let r = 0; r < Math.ceil(h / 6); r++) { c.fillStyle = `rgba(255,0,150,${0.15 + Math.sin(t * 0.05 + r) * 0.1})`; c.fillRect(x, y + r * 6, w, 1) }
        if (hy) { c.fillStyle = "rgba(255,0,200,.32)"; c.fillRect(x, y, w, h) }
        c.strokeStyle = `rgba(255,50,180,${0.4 + Math.sin(t * 0.1) * 0.3})`; c.lineWidth = 1.5; c.strokeRect(x, y, w, h)
      })
    },
  },
  PLASMA: {
    name: "PLASMA", tier: "SAKTI", price: 900, unlockStage: 14, shape: "rounded",
    clr: "#ff00ff", glow: "#ff44ff", desc: "Energi plasma tak stabil. Bergetar pada frekuensi kematian.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        const g2 = c.createLinearGradient(x, y, x, y + h)
        g2.addColorStop(0, "#cc00ff"); g2.addColorStop(0.5 + Math.sin(t * 0.06) * 0.25, "#00e5ff"); g2.addColorStop(1, "#cc00ff")
        c.fillStyle = g2; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let i = 0; i < 4; i++) {
          const ry = y + ((t * 3 + i * 25) % h)
          c.strokeStyle = `rgba(255,255,255,${0.15 + Math.sin(t * 0.09 + i) * 0.12})`; c.lineWidth = 1.2
          c.beginPath(); c.moveTo(x, ry); c.lineTo(x + w, ry + Math.sin(t * 0.07 + i) * 3); c.stroke()
        }
        if (hy) { c.globalAlpha = 0.32; c.fillStyle = "#ffffff"; c.fillRect(x, y, w, h); c.globalAlpha = 1 }
      })
    },
  },
  VULKAN: {
    name: "VULKAN", tier: "SAKTI", price: 1000, unlockStage: 15, shape: "shield",
    clr: "#ff3300", glow: "#ff6600", desc: "Magma mengalir dari inti dunia digital yang terbakar.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = "#661100"; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let i = 0; i < 5; i++) {
          const bx = x + w * 0.08 + i * (w * 0.17); const by = y + ((t * 1.4 + i * 18) % h); const br = 1.5 + Math.sin(t * 0.07 + i) * 1.2
          c.fillStyle = i % 2 === 0 ? "#ff4400" : "#ff9900"; c.beginPath(); c.ellipse(bx, by, br, br * 1.8, 0, 0, Math.PI * 2); c.fill()
        }
        if (hy) { c.globalAlpha = 0.38; c.fillStyle = "#ffee00"; c.fillRect(x, y, w, h); c.globalAlpha = 1 }
      })
    },
  },
  KUANTUM: {
    name: "KUANTUM", tier: "SAKTI", price: 1100, unlockStage: 16, shape: "hexagon",
    clr: "#00ffcc", glow: "#00ffcc", desc: "Superposisi tak terhingga. Hadir di semua tempat sekaligus.",
    draw(c, x, y, w, h, t, hy) {
      const ph = Math.sin(t * 0.07)
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = `rgba(0,220,180,${0.38 + ph * 0.28})`; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let i = 0; i < 6; i++) { const lx = x + ((t * 1.5 + i * 12) % w); c.fillStyle = `rgba(255,255,255,${0.1 + Math.sin(t * 0.05 + i) * 0.08})`; c.fillRect(lx, y, 1, h) }
        c.strokeStyle = `rgba(0,255,200,${0.5 + ph * 0.35})`; c.lineWidth = 2; c.strokeRect(x, y, w, h)
        if (hy) { c.globalAlpha = 0.38; c.fillStyle = "#ffffff"; c.fillRect(x, y, w, h); c.globalAlpha = 1 }
      })
    },
  },
  BADAI: {
    name: "BADAI", tier: "SAKTI", price: 1300, unlockStage: 17, shape: "arrow",
    clr: "#4488ff", glow: "#88aaff", desc: "Badai petir kosmik tanpa ujung.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        const g2 = c.createLinearGradient(x, y, x, y + h)
        g2.addColorStop(0, "#0a1a3a"); g2.addColorStop(0.5, "#1a3888"); g2.addColorStop(1, "#0a1a3a")
        c.fillStyle = g2; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        if (t % 5 < 2) {
          c.strokeStyle = "rgba(150,180,255,.72)"; c.lineWidth = 1; c.beginPath()
          const by2 = y + Math.random() * h * 0.6
          c.moveTo(x, by2); c.lineTo(x + w * 0.35, by2 + 12); c.lineTo(x + w * 0.2, by2 + 22); c.lineTo(x + w, by2 + 32); c.stroke()
        }
        if (hy) { c.globalAlpha = 0.28; c.fillStyle = "#aaccff"; c.fillRect(x, y, w, h); c.globalAlpha = 1 }
      })
    },
  },
  KRIPTON: {
    name: "KRIPTON", tier: "MAHAKUASA", price: 2000, unlockStage: 20, shape: "rounded",
    clr: "#00ffaa", glow: "#00ff88", desc: "Material alien radioaktif dari inti server terkutuk.",
    draw(c, x, y, w, h, t, hy) {
      const pulse = 0.35 + Math.sin(t * 0.08) * 0.38
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = "#002211"; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        c.shadowBlur = hy ? 16 : 8; c.shadowColor = "#00ff88"
        c.fillStyle = `rgba(0,255,140,${pulse})`; c.fillRect(x + 1, y + 1, w - 2, h - 2)
        c.shadowBlur = 0
        for (let i = 0; i < h; i += 5) { c.fillStyle = "rgba(0,0,0,.32)"; c.fillRect(x, y + i, w, 2) }
        c.strokeStyle = `rgba(0,255,140,${0.5 + pulse * 0.5})`; c.lineWidth = 1.5; c.strokeRect(x, y, w, h)
      })
    },
  },
  ABADI: {
    name: "ABADI", tier: "MAHAKUASA", price: 2500, unlockStage: 22, shape: "diamond",
    clr: "#ffaa00", glow: "#ffee00", desc: "Emas immortal dari era kejayaan peradaban digital.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        const g2 = c.createLinearGradient(x, y, x + w, y + h)
        g2.addColorStop(0, "#886600"); g2.addColorStop(0.22 + Math.sin(t * 0.04) * 0.12, "#ffcc00")
        g2.addColorStop(0.5, "#ffffaa"); g2.addColorStop(0.78, "#ffcc00"); g2.addColorStop(1, "#886600")
        c.fillStyle = g2; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        const sx = x + ((t * 2.2) % w); c.fillStyle = "rgba(255,255,200,.36)"; c.fillRect(sx, y, 3, h)
        c.strokeStyle = "rgba(255,238,120,.48)"; c.lineWidth = 1.5; c.strokeRect(x, y, w, h)
        if (hy) { c.globalAlpha = 0.38; c.fillStyle = "#fff"; c.fillRect(x, y, w, h); c.globalAlpha = 1 }
      })
    },
  },
  KEGELAPAN: {
    name: "KEGELAPAN", tier: "MAHAKUASA", price: 2800, unlockStage: 24, shape: "pill",
    clr: "#440066", glow: "#880088", desc: "Kekosongan absolut. Menyerap semua cahaya.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = "#000000"; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let i = 0; i < 4; i++) {
          const vy = y + ((t * 0.8 + i * 28) % h); const va = 0.12 + Math.sin(t * 0.06 + i) * 0.1
          c.fillStyle = `rgba(100,0,140,${va})`; c.fillRect(x, vy, w, 3 + Math.sin(t * 0.05 + i) * 2)
        }
        c.strokeStyle = `rgba(160,0,200,${0.3 + Math.sin(t * 0.09) * 0.28})`; c.lineWidth = 2; c.strokeRect(x, y, w, h)
        if (hy) { c.strokeStyle = "rgba(255,100,255,.8)"; c.lineWidth = 3; c.strokeRect(x - 1, y - 1, w + 2, h + 2) }
      })
    },
  },
  GALAKSI: {
    name: "GALAKSI", tier: "MAHAKUASA", price: 3200, unlockStage: 26, shape: "hexagon",
    clr: "#0044ff", glow: "#4488ff", desc: "Nebula biru raksasa. Bintang lahir dari setiap pukulannya.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        const g2 = c.createLinearGradient(x, y, x, y + h)
        g2.addColorStop(0, "#000022"); g2.addColorStop(0.4, "#001155"); g2.addColorStop(0.7, "#0033aa"); g2.addColorStop(1, "#000022")
        c.fillStyle = g2; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let i = 0; i < 5; i++) {
          const sx2 = x + ((t * 0.3 + i * 17) % w); const sy2 = y + ((t * 0.5 + i * 23) % h); const sa = 0.4 + Math.sin(t * 0.08 + i) * 0.38
          c.fillStyle = `rgba(200,220,255,${sa})`; c.fillRect(sx2, sy2, 2, 2)
        }
        c.strokeStyle = `rgba(50,130,255,${0.45 + Math.sin(t * 0.1) * 0.3})`; c.lineWidth = 1.5; c.strokeRect(x, y, w, h)
        if (hy) { c.globalAlpha = 0.32; c.fillStyle = "#aaccff"; c.fillRect(x, y, w, h); c.globalAlpha = 1 }
      })
    },
  },
  SINGULARITAS: {
    name: "SINGULARITAS", tier: "DEWA", price: 5000, unlockStage: 30, shape: "rounded",
    clr: "#ff00ff", glow: "#ffffff", desc: "Titik awal alam semesta digital. Energi murni tak terbatas.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = "#000000"; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let i = 0; i < 6; i++) {
          const pr = ((t * 2.5 + i * 16) % h) / h; const ry = y + pr * h
          const rw = w * (0.2 + Math.abs(Math.sin(pr * Math.PI)) * 0.72); const rx = x + (w - rw) / 2
          const hue = (t * 4 + i * 55) % 360
          c.fillStyle = `hsla(${hue},100%,65%,${0.35 + Math.sin(t * 0.06 + i) * 0.25})`; c.fillRect(rx, ry, rw, 2.5)
        }
        c.strokeStyle = `rgba(255,255,255,${0.55 + Math.sin(t * 0.07) * 0.4})`; c.lineWidth = 2; c.strokeRect(x, y, w, h)
        if (hy) { for (let i = 0; i < 3; i++) { c.strokeStyle = `hsla(${(t * 5 + i * 120) % 360},100%,80%,.6)`; c.lineWidth = 1.5; c.strokeRect(x - i, y - i, w + i * 2, h + i * 2) } }
      })
    },
  },
  KIAMAT: {
    name: "KIAMAT", tier: "DEWA", price: 7777, unlockStage: 35, shape: "shield",
    clr: "#ff0000", glow: "#ff4400", desc: "Kehancuran mutlak dari semua sistem.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = "#0a0000"; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let i = 0; i < w; i += 3) {
          const fh = Math.abs(Math.sin(t * 0.06 + i * 0.25)) * h * 0.85; const hue = t * 0.06 * 3
          c.fillStyle = `hsl(${hue}deg,100%,35%)`; c.fillRect(x + i, y + h - fh, 2.5, fh)
        }
        if (t % 3 < 1) { c.fillStyle = `rgba(255,${Math.random() * 40},0,.52)`; c.fillRect(x, y + Math.random() * h, w, 3 + Math.random() * 7) }
        c.strokeStyle = `rgba(255,40,0,${0.42 + Math.sin(t * 0.1) * 0.42})`; c.lineWidth = 2.5; c.strokeRect(x, y, w, h)
        if (hy) { c.globalAlpha = 0.38; c.fillStyle = "#ff8800"; c.fillRect(x, y, w, h); c.globalAlpha = 1; c.strokeStyle = "#ffffff"; c.lineWidth = 3; c.strokeRect(x - 1, y - 1, w + 2, h + 2) }
      })
    },
  },
  CAHAYA: {
    name: "CAHAYA", tier: "DEWA", price: 9999, unlockStage: 40, shape: "diamond",
    clr: "#ffffff", glow: "#ffffff", desc: "Cahaya absolut dari sang pencipta semesta digital.",
    draw(c, x, y, w, h, t, hy) {
      const pulse = 0.65 + Math.sin(t * 0.06) * 0.32
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = `rgba(255,255,255,${pulse})`; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        const clrs2 = ["#ff0000", "#ff7700", "#ffee00", "#00ff00", "#0000ff", "#cc00ff"]
        clrs2.forEach((cl, i) => { c.globalAlpha = 0.12 + Math.sin(t * 0.04 + i) * 0.08; c.fillStyle = cl; c.fillRect(x, y + i * (h / clrs2.length), w, h / clrs2.length) })
        c.globalAlpha = 1
        for (let i = 0; i < 4; i++) { const ry = y + ((t * 1.8 + i * 28) % h); c.fillStyle = "rgba(255,255,255,.52)"; c.fillRect(x, ry, w, 2) }
        c.strokeStyle = `rgba(255,255,200,${0.72 + Math.sin(t * 0.08) * 0.22})`; c.lineWidth = 2; c.strokeRect(x, y, w, h)
        if (hy) { for (let i = 0; i < 4; i++) { const hue = (t * 6 + i * 90) % 360; c.strokeStyle = `hsla(${hue},100%,80%,.48)`; c.lineWidth = 1.5; c.strokeRect(x - i, y - i, w + i * 2, h + i * 2) } }
      })
    },
  },
  // RAMADAN SPECIAL
  HILAL: {
    name: "HILAL", tier: "RAMADAN", price: 0, unlockStage: 0, bonusStage: 1, isRamadan: true, shape: "pill",
    clr: "#ffd700", glow: "#fff9a0", desc: "Bulan sabit pertama malam Ramadan. Cahaya harapan.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        const g2 = c.createLinearGradient(x, y, x, y + h)
        g2.addColorStop(0, "#0a0520"); g2.addColorStop(1, "#1a0a40")
        c.fillStyle = g2; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        const cx2 = x + w / 2, cy2 = y + h / 2, r = Math.min(w, h) * 0.42
        c.fillStyle = `rgba(255,215,0,${0.35 + Math.sin(t * 0.06) * 0.2})`
        c.beginPath(); c.arc(cx2, cy2, r, 0, Math.PI * 2); c.fill()
        c.fillStyle = "#0a0520"
        c.beginPath(); c.arc(cx2 - r * 0.28, cy2 - r * 0.1, r * 0.75, 0, Math.PI * 2); c.fill()
        for (let i = 0; i < 4; i++) {
          const sx = x + w * 0.15 + ((t * 0.4 + i * 22) % w) * 0.55; const sy = y + h * 0.1 + i * (h * 0.18)
          const sa = 0.5 + Math.sin(t * 0.08 + i) * 0.45; const ss = 1 + Math.sin(t * 0.05 + i) * 0.5
          c.fillStyle = `rgba(255,249,160,${sa})`; c.fillRect(sx, sy, ss, ss)
        }
      })
      if (hy) { c.strokeStyle = "rgba(255,249,160,.7)"; c.lineWidth = 2; c.beginPath(); c.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.55, 0, Math.PI * 2); c.stroke() }
    },
  },
  TAKBIR: {
    name: "TAKBIR", tier: "RAMADAN", price: 0, unlockStage: 0, bonusStage: 3, isRamadan: true, shape: "rounded",
    clr: "#00cc66", glow: "#00ff88", desc: "Gema takbir mengguncang arena digital.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        const g2 = c.createLinearGradient(x, y, x, y + h)
        g2.addColorStop(0, "#004422"); g2.addColorStop(0.5, "#006633"); g2.addColorStop(1, "#002211")
        c.fillStyle = g2; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        const wave = Math.sin(t * 0.06) * 3
        for (let i = 0; i < 3; i++) { c.fillStyle = `rgba(0,255,100,${0.18 + Math.sin(t * 0.05 + i) * 0.1})`; c.fillRect(x, y + h * 0.25 * i + wave + h * 0.08, w, 1.5) }
        c.strokeStyle = `rgba(0,255,100,${0.5 + Math.sin(t * 0.08) * 0.3})`; c.lineWidth = 1.5; c.strokeRect(x, y, w, h)
        c.fillStyle = `rgba(0,255,136,${0.2 + Math.sin(t * 0.07) * 0.18})`; c.fillRect(x + w * 0.3, y + h * 0.2, w * 0.4, h * 0.6)
        if (hy) { c.globalAlpha = 0.3; c.fillStyle = "#aaffcc"; c.fillRect(x, y, w, h); c.globalAlpha = 1 }
      })
    },
  },
  KETUPAT: {
    name: "KETUPAT", tier: "RAMADAN", price: 0, unlockStage: 0, bonusStage: 5, isRamadan: true, shape: "diamond",
    clr: "#88cc44", glow: "#aaee66", desc: "Ketupat Lebaran! Simbol kemenangan dan kesucian.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = "#2a5510"; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let i = 0; i < h; i += 4) { c.fillStyle = i % 8 < 4 ? "rgba(100,200,50,.5)" : "rgba(60,140,30,.5)"; c.fillRect(x, y + i, w, 4) }
        for (let i = 0; i < w; i += 4) { c.fillStyle = i % 8 < 4 ? "rgba(120,220,60,.3)" : "rgba(80,160,40,.3)"; c.fillRect(x + i, y, 4, h) }
        c.strokeStyle = `rgba(160,255,80,${0.55 + Math.sin(t * 0.08) * 0.3})`; c.lineWidth = 2
        c.beginPath(); const cx2 = x + w / 2, cy2 = y + h / 2
        c.moveTo(cx2, y); c.lineTo(x + w, cy2); c.lineTo(cx2, y + h); c.lineTo(x, cy2); c.closePath(); c.stroke()
        if (hy) { c.globalAlpha = 0.3; c.fillStyle = "#eeffaa"; c.fillRect(x, y, w, h); c.globalAlpha = 1 }
      })
    },
  },
  SAHUR: {
    name: "SAHUR", tier: "RAMADAN", price: 0, unlockStage: 0, bonusStage: 7, isRamadan: true, shape: "pill",
    clr: "#ff8844", glow: "#ffbb66", desc: "Energi sahur sebelum fajar. Api yang menjaga.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        const g2 = c.createLinearGradient(x, y, x, y + h)
        g2.addColorStop(0, "#2a1000"); g2.addColorStop(0.5, "#5a2200"); g2.addColorStop(1, "#2a1000")
        c.fillStyle = g2; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let i = 0; i < 4; i++) {
          const fy = y + ((t * 2 + i * 20) % h); const fw = 2 + Math.abs(Math.sin(t * 0.07 + i)) * 3
          c.fillStyle = i % 2 === 0 ? "#ff6600" : "#ffaa00"; c.fillRect(x + (w - fw) / 2, fy, fw, 5)
        }
        c.strokeStyle = `rgba(255,150,50,${0.45 + Math.sin(t * 0.1) * 0.3})`; c.lineWidth = 1.5; c.strokeRect(x, y, w, h)
        if (hy) { c.globalAlpha = 0.35; c.fillStyle = "#ffdd99"; c.fillRect(x, y, w, h); c.globalAlpha = 1 }
      })
    },
  },
  LAILAH: {
    name: "LAILAH", tier: "RAMADAN", price: 0, unlockStage: 0, bonusStage: 10, isRamadan: true, shape: "hexagon",
    clr: "#9944ff", glow: "#cc88ff", desc: "Malam Lailatul Qadar. Seribu bulan bersinar.",
    draw(c, x, y, w, h, t, hy) {
      drawShape(c, this.shape, x, y, w, h, () => {
        c.fillStyle = "#080018"; c.fillRect(x - 1, y - 1, w + 2, h + 2)
        for (let i = 0; i < 8; i++) {
          const sx = x + ((t * 0.2 + i * 17) % w); const sy = y + ((t * 0.15 + i * 13) % h)
          const sa = 0.3 + Math.sin(t * 0.06 + i) * 0.28; const ss = 1 + Math.sin(t * 0.04 + i) * 0.8
          const hue = (t + i * 45) % 360
          c.fillStyle = `hsla(${hue},80%,70%,${sa})`; c.fillRect(sx, sy, ss, ss)
        }
        c.strokeStyle = `rgba(180,80,255,${0.5 + Math.sin(t * 0.08) * 0.35})`; c.lineWidth = 2; c.strokeRect(x, y, w, h)
        if (hy) { for (let i = 0; i < 3; i++) { c.strokeStyle = `hsla(${(t * 5 + i * 120) % 360},100%,75%,.55)`; c.lineWidth = 1.5; c.strokeRect(x - i, y - i, w + i * 2, h + i * 2) } }
      })
    },
  },
}

// Tier sort order
export const TIER_ORDER = ["BIASA", "ANDAL", "LANGKA", "SAKTI", "MAHAKUASA", "DEWA", "RAMADAN"]

// Boss AI nerf tracking — reduces boss difficulty by 20% per player loss (max 50% after 2 losses)
export const BOSS_NERF_PER_LOSS = 0.20
export const BOSS_NERF_MAX = 0.50

// Animation definitions
export interface AnimDef {
  text: string; sub: string; color: string; glow: string; bgColor: string; size: string
  dur: number; effect: string; pixels: number
}
export const ANIM_DEFS: Record<string, AnimDef> = {
  ready:    { text: "READY",          sub: "",                    color: "#00e5ff", glow: "#00e5ff", bgColor: "rgba(0,50,80,.55)",  size: "clamp(3.2rem,11vw,6.5rem)", dur: 1000, effect: "zoom",          pixels: 8 },
  go:       { text: "GO!!!",          sub: "",                    color: "#00ff88", glow: "#00ff88", bgColor: "rgba(0,60,30,.55)",  size: "clamp(3.5rem,13vw,7.5rem)", dur: 700,  effect: "shake",         pixels: 12 },
  goal1:    { text: "GOAL!",          sub: "",                    color: "#00ff88", glow: "#00ff88", bgColor: "rgba(0,40,20,.5)",   size: "clamp(2.6rem,8.5vw,5rem)",  dur: 1600, effect: "flash",         pixels: 10 },
  goal2:    { text: "BRACE!",         sub: "2x IN A ROW!",       color: "#00e5ff", glow: "#00e5ff", bgColor: "rgba(0,40,70,.55)",  size: "clamp(2.8rem,9.5vw,5.8rem)",dur: 2000, effect: "glitch",        pixels: 16 },
  goal3:    { text: "HAT-TRICK!",     sub: "INCREDIBLE! x3",     color: "#ffee00", glow: "#ffee00", bgColor: "rgba(60,50,0,.55)",  size: "clamp(2.8rem,9.5vw,5.8rem)",dur: 2400, effect: "explode",       pixels: 24 },
  goal4:    { text: "POKER!",         sub: "UNSTOPPABLE! x4",    color: "#ff7700", glow: "#ff7700", bgColor: "rgba(60,25,0,.6)",   size: "clamp(3rem,10.5vw,6.5rem)", dur: 2700, effect: "explodeGlitch", pixels: 35 },
  goal5:    { text: "MANITA!",        sub: "LEGENDARY! x5",      color: "#ff0066", glow: "#ff0066", bgColor: "rgba(60,0,25,.65)",  size: "clamp(3.2rem,11.5vw,7rem)", dur: 3000, effect: "fullChaos",     pixels: 50 },
  goalHigh: { text: "SUPERNATURAL!",  sub: "BEYOND LEGEND!",     color: "#ffffff", glow: "#ffffff", bgColor: "rgba(40,40,40,.7)",  size: "clamp(2.2rem,8vw,5rem)",    dur: 3200, effect: "fullChaos",     pixels: 70 },
  comeback: { text: "COMEBACK!",      sub: "FROM THE ASHES!",    color: "#ff7700", glow: "#ff7700", bgColor: "rgba(60,25,0,.65)",  size: "clamp(2.6rem,9vw,5.5rem)",  dur: 2800, effect: "explodeGlitch", pixels: 40 },
  win:      { text: "VICTORY",        sub: "SYSTEM BREACHED",    color: "#00ff88", glow: "#00ff88", bgColor: "rgba(0,50,20,.6)",   size: "clamp(2.2rem,7.5vw,4.8rem)",dur: 2500, effect: "explode",       pixels: 60 },
  lose:     { text: "DEFEAT",         sub: "ACCESS DENIED",      color: "#ff0066", glow: "#ff0066", bgColor: "rgba(50,0,20,.6)",   size: "clamp(2.2rem,7.5vw,4.8rem)",dur: 2500, effect: "glitch",        pixels: 30 },
  boss:     { text: "WARNING",        sub: "TITAN DETECTED",     color: "#ff0066", glow: "#ff0066", bgColor: "rgba(80,0,0,.7)",    size: "clamp(2.6rem,9vw,5.5rem)",  dur: 3000, effect: "explodeGlitch", pixels: 50 },
}
