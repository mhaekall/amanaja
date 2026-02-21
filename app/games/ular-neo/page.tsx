"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"

/* =====================================================
   i18n for the game page
   ===================================================== */
const I18N = {
  id: {
    title: "ULAR NEO 8-BIT",
    score: "SKOR",
    hiscore: "TERTINGGI",
    energy: "ENERGI",
    level: "LVL",
    desc1: "Makan makanan pink untuk tumbuh.\nMakan emas untuk bonus besar!",
    desc2: "[SPASI] atau DASH untuk lari cepat \u2014 memakan Energi.",
    desc3: "Kecepatan meningkat tiap 50 skor.",
    startBtn: "Mulai Game",
    gameOver: "SISTEM RUSAK",
    newRecord: "\u2605 REKOR BARU! \u2605",
    finalScore: "SKOR AKHIR",
    finalLevel: "LEVEL",
    foodEaten: "MAKANAN",
    restartBtn: "Main Lagi",
    menuBtn: "Menu Utama",
    backHome: "\u2190 Kembali",
  },
  en: {
    title: "NEO 8-BIT SNAKE",
    score: "SCORE",
    hiscore: "BEST",
    energy: "ENERGY",
    level: "LVL",
    desc1: "Eat pink food to grow.\nEat gold for a big bonus!",
    desc2: "[SPACE] or DASH to sprint \u2014 costs Energy.",
    desc3: "Speed increases every 50 score.",
    startBtn: "Start Game",
    gameOver: "SYSTEM FAILURE",
    newRecord: "\u2605 NEW RECORD! \u2605",
    finalScore: "FINAL SCORE",
    finalLevel: "LEVEL",
    foodEaten: "FOOD",
    restartBtn: "Play Again",
    menuBtn: "Main Menu",
    backHome: "\u2190 Back",
  },
} as const

type LangKey = keyof typeof I18N

/* =====================================================
   GAME CONSTANTS
   ===================================================== */
const CANVAS_SIZE = 400
const TILE_SIZE = 20
const GRID = CANVAS_SIZE / TILE_SIZE
const BASE_SPEED = 130
const DASH_SPEED = 42
const MIN_SPEED = 55
const ENERGY_MAX = 100
const ENERGY_DRAIN = 0.14
const ENERGY_RESTORE = 15
const SPECIAL_DURATION = 10000

/* =====================================================
   AUDIO ENGINE
   ===================================================== */
class AudioEngine {
  ctx: AudioContext | null = null
  bgmInterval: ReturnType<typeof setInterval> | null = null
  notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63]
  noteIndex = 0

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (this.ctx.state === "suspended") this.ctx.resume()
  }

  playTone(freq: number, type: OscillatorType = "square", duration = 0.1, vol = 0.1) {
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
      gain.gain.setValueAtTime(vol, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + duration)
    } catch { /* silence */ }
  }

  playEat() { this.playTone(880, "square", 0.08, 0.1); this.playTone(1200, "square", 0.12, 0.08) }
  playSpecial() { [1200, 1600, 2000].forEach((f, i) => setTimeout(() => this.playTone(f, "sine", 0.2, 0.15), i * 60)) }
  playDie() { this.playTone(180, "sawtooth", 0.4, 0.2); setTimeout(() => this.playTone(100, "sawtooth", 0.6, 0.25), 150) }
  playDash() { this.playTone(500, "triangle", 0.06, 0.04) }
  playLevelUp() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => setTimeout(() => this.playTone(f, "sine", 0.15, 0.12), i * 80)) }

  startBGM() {
    this.stopBGM()
    this.bgmInterval = setInterval(() => {
      if (!this.ctx) return
      const freq = this.notes[this.noteIndex] / 2
      this.playTone(freq, "square", 0.12, 0.025)
      this.noteIndex = (this.noteIndex + 1) % this.notes.length
    }, 190)
  }

  stopBGM() {
    if (this.bgmInterval) { clearInterval(this.bgmInterval); this.bgmInterval = null }
  }
}

/* =====================================================
   TYPES
   ===================================================== */
interface Pos { x: number; y: number }
interface Food extends Pos { type: "normal" | "special" }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }
interface Trail { x: number; y: number; life: number; color: string }

type GameState = "START" | "PLAYING" | "GAMEOVER"

export default function SnakeGamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [lang, setLang] = useState<LangKey>("id")
  const [gameState, setGameState] = useState<GameState>("START")
  const [score, setScore] = useState(0)
  const [hiScore, setHiScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [energy, setEnergy] = useState(ENERGY_MAX)
  const [isDashing, setIsDashing] = useState(false)
  const [foodCount, setFoodCount] = useState(0)
  const [isNewRecord, setIsNewRecord] = useState(false)

  // Refs for game loop (mutable state that doesn't need re-renders)
  const gameRef = useRef({
    snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }] as Pos[],
    dir: { x: 1, y: 0 } as Pos,
    nextDir: { x: 1, y: 0 } as Pos,
    food: { x: 15, y: 7, type: "normal" as const } as Food,
    particles: [] as Particle[],
    trails: [] as Trail[],
    score: 0,
    hiScore: 0,
    level: 1,
    energy: ENERGY_MAX,
    isDashing: false,
    foodCount: 0,
    gameState: "START" as GameState,
    moveTimer: 0,
    lastTime: 0,
    flashOverlay: 0,
    specialFoodTimer: 0,
    animFrameId: null as number | null,
  })

  const audioRef = useRef<AudioEngine | null>(null)

  // Initialize hi-score from localStorage
  useEffect(() => {
    const saved = parseInt(localStorage.getItem("snakeNeoHiScore") || "0", 10)
    setHiScore(saved)
    gameRef.current.hiScore = saved
    audioRef.current = new AudioEngine()
    return () => {
      audioRef.current?.stopBGM()
      if (gameRef.current.animFrameId !== null) {
        cancelAnimationFrame(gameRef.current.animFrameId)
      }
    }
  }, [])

  // Draw initial grid
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#050510"
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ctx.strokeStyle = "rgba(255,255,255,0.04)"
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * TILE_SIZE, 0); ctx.lineTo(i * TILE_SIZE, CANVAS_SIZE); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i * TILE_SIZE); ctx.lineTo(CANVAS_SIZE, i * TILE_SIZE); ctx.stroke()
    }
  }, [])

  const spawnFood = useCallback(() => {
    const g = gameRef.current
    let valid = false
    let attempts = 0
    while (!valid && attempts < 200) {
      g.food = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID), type: "normal" }
      valid = !g.snake.some(s => s.x === g.food.x && s.y === g.food.y)
      attempts++
    }
    if (g.score >= 50 && Math.random() < 0.15) {
      g.food.type = "special"
      g.specialFoodTimer = SPECIAL_DURATION
    }
  }, [])

  const createParticles = useCallback((x: number, y: number, color: string, amount: number) => {
    const g = gameRef.current
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 6
      g.particles.push({
        x: x * TILE_SIZE + TILE_SIZE / 2,
        y: y * TILE_SIZE + TILE_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color,
        size: 2 + Math.random() * 3,
      })
    }
  }, [])

  const getBaseSpeed = useCallback(() => {
    return Math.max(MIN_SPEED, BASE_SPEED - (gameRef.current.level - 1) * 10)
  }, [])

  const showGameOverScreen = useCallback(() => {
    const g = gameRef.current
    const newRec = g.score > g.hiScore
    if (newRec) {
      g.hiScore = g.score
      localStorage.setItem("snakeNeoHiScore", String(g.hiScore))
      setHiScore(g.hiScore)
    }
    setIsNewRecord(newRec)
    setScore(g.score)
    setLevel(g.level)
    setFoodCount(g.foodCount)
    g.gameState = "GAMEOVER"
    setGameState("GAMEOVER")
  }, [])

  const gameOver = useCallback(() => {
    const g = gameRef.current
    if (g.gameState !== "PLAYING") return
    g.gameState = "GAMEOVER"

    if (g.animFrameId !== null) {
      cancelAnimationFrame(g.animFrameId)
      g.animFrameId = null
    }

    audioRef.current?.stopBGM()
    audioRef.current?.playDie()

    const c = canvasRef.current
    if (!c) { showGameOverScreen(); return }
    const ctx = c.getContext("2d")
    if (!ctx) { showGameOverScreen(); return }

    const shakeStart = performance.now()
    const shakeDur = 500

    function drawGameInner(dt: number) {
      ctx!.fillStyle = "#050510"
      ctx!.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      // Grid
      ctx!.strokeStyle = "rgba(255,255,255,0.04)"
      ctx!.lineWidth = 0.5
      for (let i = 0; i <= GRID; i++) {
        ctx!.beginPath(); ctx!.moveTo(i * TILE_SIZE, 0); ctx!.lineTo(i * TILE_SIZE, CANVAS_SIZE); ctx!.stroke()
        ctx!.beginPath(); ctx!.moveTo(0, i * TILE_SIZE); ctx!.lineTo(CANVAS_SIZE, i * TILE_SIZE); ctx!.stroke()
      }

      // Flash
      if (g.flashOverlay > 0) {
        g.flashOverlay -= dt
        const alpha = (g.flashOverlay / 300) * 0.25
        ctx!.fillStyle = `rgba(57,255,20,${alpha})`
        ctx!.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      }

      // Trails
      ctx!.save()
      for (const t of g.trails) {
        ctx!.fillStyle = t.color
        ctx!.globalAlpha = Math.max(0, t.life * 0.45)
        ctx!.fillRect(t.x * TILE_SIZE + 2, t.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4)
      }
      ctx!.globalAlpha = 1
      ctx!.restore()

      // Food
      ctx!.save()
      const now = Date.now()
      if (g.food.type === "normal") {
        const pulse = Math.sin(now / 140) * 1.5
        ctx!.shadowBlur = 18
        ctx!.shadowColor = "#ff007f"
        ctx!.fillStyle = "#ff007f"
        ctx!.fillRect(g.food.x * TILE_SIZE + 3 - pulse / 2, g.food.y * TILE_SIZE + 3 - pulse / 2, TILE_SIZE - 6 + pulse, TILE_SIZE - 6 + pulse)
      } else {
        ctx!.shadowBlur = 22
        ctx!.shadowColor = "#ffd700"
        ctx!.fillStyle = Math.floor(now / 90) % 2 === 0 ? "#ffd700" : "#ffffff"
        ctx!.beginPath()
        ctx!.arc(g.food.x * TILE_SIZE + TILE_SIZE / 2, g.food.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.restore()

      // Snake
      ctx!.save()
      g.snake.forEach((seg, index) => {
        const isHead = index === 0
        ctx!.shadowBlur = g.isDashing ? 16 : 10
        ctx!.shadowColor = g.isDashing ? "#00ffff" : "#39ff14"
        ctx!.fillStyle = g.isDashing ? "#00ffff" : isHead ? "#ffffff" : `hsl(${110 - index * 1.5}, 100%, ${60 - index * 0.5}%)`
        ctx!.fillRect(seg.x * TILE_SIZE + 1, seg.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2)
        if (isHead) {
          ctx!.shadowBlur = 0
          ctx!.fillStyle = "#000"
          const ex = g.dir.x === 1 ? 13 : g.dir.x === -1 ? 4 : 7
          const ey = g.dir.y === 1 ? 13 : g.dir.y === -1 ? 4 : 7
          ctx!.fillRect(seg.x * TILE_SIZE + ex, seg.y * TILE_SIZE + ey, 3, 3)
        }
      })
      ctx!.shadowBlur = 0
      ctx!.restore()

      // Particles
      ctx!.save()
      ctx!.globalCompositeOperation = "lighter"
      for (const p of g.particles) {
        ctx!.globalAlpha = Math.max(0, p.life)
        ctx!.fillStyle = p.color
        ctx!.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      }
      ctx!.globalAlpha = 1
      ctx!.globalCompositeOperation = "source-over"
      ctx!.restore()
    }

    function shakeFrame(time: number) {
      const elapsed = time - shakeStart
      if (elapsed < shakeDur) {
        const mag = ((shakeDur - elapsed) / shakeDur) * 10
        ctx!.save()
        ctx!.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag)
        drawGameInner(0)
        ctx!.restore()
        requestAnimationFrame(shakeFrame)
      } else {
        drawGameInner(0)
        showGameOverScreen()
      }
    }
    requestAnimationFrame(shakeFrame)
  }, [showGameOverScreen])

  const startGame = useCallback(() => {
    const g = gameRef.current
    if (g.animFrameId !== null) {
      cancelAnimationFrame(g.animFrameId)
      g.animFrameId = null
    }

    g.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]
    g.dir = { x: 1, y: 0 }
    g.nextDir = { x: 1, y: 0 }
    g.score = 0
    g.level = 1
    g.foodCount = 0
    g.energy = ENERGY_MAX
    g.isDashing = false
    g.particles = []
    g.trails = []
    g.flashOverlay = 0
    g.moveTimer = 0

    setScore(0)
    setLevel(1)
    setFoodCount(0)
    setEnergy(ENERGY_MAX)
    setIsDashing(false)

    spawnFood()
    g.gameState = "PLAYING"
    setGameState("PLAYING")

    audioRef.current?.init()
    audioRef.current?.startBGM()

    g.lastTime = performance.now()

    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return

    function updateSnake() {
      g.dir = { ...g.nextDir }
      const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y }

      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) { gameOver(); return }
      if (g.snake.some(seg => seg.x === head.x && seg.y === head.y)) { gameOver(); return }

      g.snake.unshift(head)

      if (head.x === g.food.x && head.y === g.food.y) {
        g.foodCount++
        if (g.food.type === "normal") {
          g.score += 10
          g.energy = Math.min(ENERGY_MAX, g.energy + ENERGY_RESTORE)
          createParticles(g.food.x, g.food.y, "#ff007f", 14)
          audioRef.current?.playEat()
        } else {
          g.score += 50
          g.energy = ENERGY_MAX
          createParticles(g.food.x, g.food.y, "#ffd700", 40)
          createParticles(g.food.x, g.food.y, "#ffffff", 15)
          audioRef.current?.playSpecial()
        }

        setScore(g.score)
        setFoodCount(g.foodCount)

        const newLevel = Math.floor(g.score / 50) + 1
        if (newLevel > g.level) {
          g.level = newLevel
          setLevel(g.level)
          g.flashOverlay = 300
          audioRef.current?.playLevelUp()
        }

        spawnFood()
      } else {
        g.snake.pop()
      }

      if (g.isDashing && g.snake.length > 1) {
        g.trails.push({ x: g.snake[1].x, y: g.snake[1].y, life: 1.0, color: "#00ffff" })
      }
    }

    function updateParticles(dt: number) {
      const dtNorm = dt / 16
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i]
        p.x += p.vx * dtNorm
        p.y += p.vy * dtNorm
        p.vx *= 0.93
        p.vy *= 0.93
        p.life -= dt / 450
        if (p.life <= 0) g.particles.splice(i, 1)
      }
      for (let i = g.trails.length - 1; i >= 0; i--) {
        g.trails[i].life -= dt / 250
        if (g.trails[i].life <= 0) g.trails.splice(i, 1)
      }
    }

    function drawGame(dt: number) {
      ctx!.fillStyle = "#050510"
      ctx!.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      // Grid
      ctx!.strokeStyle = "rgba(255,255,255,0.04)"
      ctx!.lineWidth = 0.5
      for (let i = 0; i <= GRID; i++) {
        ctx!.beginPath(); ctx!.moveTo(i * TILE_SIZE, 0); ctx!.lineTo(i * TILE_SIZE, CANVAS_SIZE); ctx!.stroke()
        ctx!.beginPath(); ctx!.moveTo(0, i * TILE_SIZE); ctx!.lineTo(CANVAS_SIZE, i * TILE_SIZE); ctx!.stroke()
      }

      // Flash overlay
      if (g.flashOverlay > 0) {
        g.flashOverlay -= dt
        const alpha = (g.flashOverlay / 300) * 0.25
        ctx!.fillStyle = `rgba(57,255,20,${alpha})`
        ctx!.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      }

      // Trails
      ctx!.save()
      for (const trail of g.trails) {
        ctx!.fillStyle = trail.color
        ctx!.globalAlpha = Math.max(0, trail.life * 0.45)
        ctx!.fillRect(trail.x * TILE_SIZE + 2, trail.y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4)
      }
      ctx!.globalAlpha = 1
      ctx!.restore()

      // Food
      ctx!.save()
      const now = Date.now()
      if (g.food.type === "normal") {
        const pulse = Math.sin(now / 140) * 1.5
        ctx!.shadowBlur = 18
        ctx!.shadowColor = "#ff007f"
        ctx!.fillStyle = "#ff007f"
        ctx!.fillRect(g.food.x * TILE_SIZE + 3 - pulse / 2, g.food.y * TILE_SIZE + 3 - pulse / 2, TILE_SIZE - 6 + pulse, TILE_SIZE - 6 + pulse)
      } else {
        ctx!.shadowBlur = 22
        ctx!.shadowColor = "#ffd700"
        ctx!.fillStyle = Math.floor(now / 90) % 2 === 0 ? "#ffd700" : "#ffffff"
        ctx!.beginPath()
        ctx!.arc(g.food.x * TILE_SIZE + TILE_SIZE / 2, g.food.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0, Math.PI * 2)
        ctx!.fill()

        const progress = g.specialFoodTimer / SPECIAL_DURATION
        ctx!.shadowBlur = 0
        ctx!.strokeStyle = progress > 0.3 ? "#ffd700" : "#ff0044"
        ctx!.lineWidth = 2
        ctx!.beginPath()
        ctx!.arc(g.food.x * TILE_SIZE + TILE_SIZE / 2, g.food.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2 + 1, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
        ctx!.stroke()
      }
      ctx!.restore()

      // Snake
      ctx!.save()
      g.snake.forEach((seg, index) => {
        const isHead = index === 0
        ctx!.shadowBlur = g.isDashing ? 16 : 10
        ctx!.shadowColor = g.isDashing ? "#00ffff" : "#39ff14"
        ctx!.fillStyle = g.isDashing ? "#00ffff" : isHead ? "#ffffff" : `hsl(${110 - index * 1.5}, 100%, ${60 - index * 0.5}%)`
        ctx!.fillRect(seg.x * TILE_SIZE + 1, seg.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2)

        if (isHead) {
          ctx!.shadowBlur = 0
          ctx!.fillStyle = "#000"
          const ex = g.dir.x === 1 ? 13 : g.dir.x === -1 ? 4 : 7
          const ey = g.dir.y === 1 ? 13 : g.dir.y === -1 ? 4 : 7
          ctx!.fillRect(seg.x * TILE_SIZE + ex, seg.y * TILE_SIZE + ey, 3, 3)
        }
      })
      ctx!.shadowBlur = 0
      ctx!.restore()

      // Particles
      ctx!.save()
      ctx!.globalCompositeOperation = "lighter"
      for (const p of g.particles) {
        ctx!.globalAlpha = Math.max(0, p.life)
        ctx!.fillStyle = p.color
        ctx!.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      }
      ctx!.globalAlpha = 1
      ctx!.globalCompositeOperation = "source-over"
      ctx!.restore()
    }

    function gameLoop(time: number) {
      if (g.gameState !== "PLAYING") return
      const dt = Math.min(time - g.lastTime, 100)
      g.lastTime = time

      updateParticles(dt)

      // Energy
      if (g.isDashing && g.energy > 0) {
        g.energy -= dt * ENERGY_DRAIN
        if (g.energy <= 0) { g.energy = 0; g.isDashing = false }
      }
      if (!g.isDashing && g.energy < ENERGY_MAX) {
        g.energy = Math.min(ENERGY_MAX, g.energy + dt * 0.012)
      }
      setEnergy(g.energy)
      setIsDashing(g.isDashing)

      // Special food timeout
      if (g.food.type === "special") {
        g.specialFoodTimer -= dt
        if (g.specialFoodTimer <= 0) { g.specialFoodTimer = 0; spawnFood() }
      }

      // Snake movement
      g.moveTimer += dt
      const currentSpeed = g.isDashing ? DASH_SPEED : getBaseSpeed()
      if (g.moveTimer >= currentSpeed) {
        g.moveTimer = 0
        updateSnake()
        if (g.isDashing && g.gameState === "PLAYING") audioRef.current?.playDash()
      }

      ctx!.save()
      drawGame(dt)
      ctx!.restore()

      g.animFrameId = requestAnimationFrame(gameLoop)
    }

    g.animFrameId = requestAnimationFrame(gameLoop)
  }, [spawnFood, createParticles, getBaseSpeed, gameOver])

  // Keyboard input
  useEffect(() => {
    const g = gameRef.current

    const keyMap: Record<string, () => void> = {
      ArrowUp: () => { if (g.dir.y !== 1) g.nextDir = { x: 0, y: -1 } },
      ArrowDown: () => { if (g.dir.y !== -1) g.nextDir = { x: 0, y: 1 } },
      ArrowLeft: () => { if (g.dir.x !== 1) g.nextDir = { x: -1, y: 0 } },
      ArrowRight: () => { if (g.dir.x !== -1) g.nextDir = { x: 1, y: 0 } },
      w: () => { if (g.dir.y !== 1) g.nextDir = { x: 0, y: -1 } },
      s: () => { if (g.dir.y !== -1) g.nextDir = { x: 0, y: 1 } },
      a: () => { if (g.dir.x !== 1) g.nextDir = { x: -1, y: 0 } },
      d: () => { if (g.dir.x !== -1) g.nextDir = { x: 1, y: 0 } },
      " ": () => { if (g.energy > 10) g.isDashing = true },
    }

    const preventKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "])

    function onKeyDown(e: KeyboardEvent) {
      if (preventKeys.has(e.key)) e.preventDefault()
      if (g.gameState !== "PLAYING") return
      keyMap[e.key]?.()
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key === " ") g.isDashing = false
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
    }
  }, [])

  // Touch swipe on canvas
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const g = gameRef.current
    let startX = 0, startY = 0

    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    function onTouchEnd(e: TouchEvent) {
      if (g.gameState !== "PLAYING") return
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && g.dir.x !== -1) g.nextDir = { x: 1, y: 0 }
        else if (dx < 0 && g.dir.x !== 1) g.nextDir = { x: -1, y: 0 }
      } else {
        if (dy > 0 && g.dir.y !== -1) g.nextDir = { x: 0, y: 1 }
        else if (dy < 0 && g.dir.y !== 1) g.nextDir = { x: 0, y: -1 }
      }
    }

    c.addEventListener("touchstart", onTouchStart, { passive: true })
    c.addEventListener("touchend", onTouchEnd)
    return () => {
      c.removeEventListener("touchstart", onTouchStart)
      c.removeEventListener("touchend", onTouchEnd)
    }
  }, [])

  const showStartScreen = useCallback(() => {
    const g = gameRef.current
    if (g.animFrameId !== null) {
      cancelAnimationFrame(g.animFrameId)
      g.animFrameId = null
    }
    audioRef.current?.stopBGM()
    g.gameState = "START"
    setGameState("START")
  }, [])

  const t = I18N[lang]

  // D-pad handler helper
  const dpadAction = useCallback((action: () => void) => {
    const g = gameRef.current
    if (g.gameState === "PLAYING") action()
  }, [])

  const energyPercent = Math.max(0, Math.min(100, energy))
  const energyColor = isDashing ? "#00ffff" : energy > 40 ? "#39ff14" : energy > 15 ? "#ffaa00" : "#ff0044"

  return (
    <div className="min-h-screen bg-[#000] text-[#fff] flex flex-col items-center justify-center" style={{ fontFamily: "var(--font-press-start), 'Press Start 2P', monospace" }}>
      {/* Back button */}
      <div className="w-full max-w-[560px] px-4 mb-3">
        <Link
          href="/"
          className="text-[10px] text-[#888] hover:text-[#39ff14] transition-colors"
          style={{ fontFamily: "var(--font-press-start), 'Press Start 2P', monospace" }}
        >
          {t.backHome}
        </Link>
      </div>

      {/* Game wrapper */}
      <div className="relative" style={{ width: "min(90vw, 90vh, 560px)", aspectRatio: "1/1", boxShadow: "0 0 40px rgba(57,255,20,0.15), 0 0 80px rgba(57,255,20,0.05)" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="block w-full h-full"
          style={{ backgroundColor: "#050510", imageRendering: "pixelated" }}
        />

        {/* CRT overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: "linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.22) 50%), linear-gradient(90deg, rgba(255,0,0,0.05), rgba(0,255,0,0.02), rgba(0,0,255,0.05))",
            backgroundSize: "100% 4px, 3px 100%",
            boxShadow: "inset 0 0 60px rgba(0,0,0,0.75)",
          }}
        />

        {/* UI layer: score, energy, level */}
        {gameState === "PLAYING" && (
          <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3">
            <div className="flex justify-between items-start" style={{ fontSize: "clamp(7px, 1.8vw, 11px)", textShadow: "2px 2px 0 #000" }}>
              <div className="flex flex-col gap-1.5">
                <div>{t.score}: {score}</div>
                <div style={{ fontSize: "clamp(5px, 1.4vw, 8px)", color: "#aaa" }}>{t.energy}</div>
                <div className="relative border border-[rgba(255,255,255,0.4)] bg-[rgba(0,0,0,0.4)]" style={{ width: "clamp(70px, 18vw, 110px)", height: "8px" }}>
                  <div style={{ height: "100%", width: `${energyPercent}%`, backgroundColor: energyColor, transition: "width 0.08s linear, background-color 0.2s" }} />
                </div>
                <div style={{ fontSize: "clamp(5px, 1.4vw, 8px)", color: "#888" }}>{t.level}: {level}</div>
              </div>
              <div className="text-right">
                <div>{t.hiscore}</div>
                <div style={{ marginTop: "4px", color: "#ffd700" }}>{hiScore}</div>
              </div>
            </div>
          </div>
        )}

        {/* Start screen */}
        {gameState === "START" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 text-center p-5" style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(2px)" }}>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setLang("id")}
                className="px-3 py-1.5 border transition-all"
                style={{
                  fontFamily: "inherit",
                  fontSize: "clamp(6px, 1.5vw, 9px)",
                  background: lang === "id" ? "#39ff14" : "transparent",
                  color: lang === "id" ? "#000" : "#555",
                  borderColor: lang === "id" ? "#39ff14" : "#333",
                  cursor: "pointer",
                }}
              >
                ID
              </button>
              <button
                onClick={() => setLang("en")}
                className="px-3 py-1.5 border transition-all"
                style={{
                  fontFamily: "inherit",
                  fontSize: "clamp(6px, 1.5vw, 9px)",
                  background: lang === "en" ? "#39ff14" : "transparent",
                  color: lang === "en" ? "#000" : "#555",
                  borderColor: lang === "en" ? "#39ff14" : "#333",
                  cursor: "pointer",
                }}
              >
                EN
              </button>
            </div>

            <h1
              className="mb-4"
              style={{
                color: "#39ff14",
                fontSize: "clamp(14px, 4vw, 22px)",
                textShadow: "0 0 12px #39ff14, 0 0 24px rgba(57,255,20,0.3)",
                lineHeight: 1.4,
              }}
            >
              {t.title}
            </h1>

            <p style={{ fontSize: "clamp(6px, 1.8vw, 10px)", lineHeight: 1.8, color: "#ccc", maxWidth: "85%", marginBottom: "12px", whiteSpace: "pre-line" }}>
              {t.desc1}
            </p>
            <p style={{ fontSize: "clamp(6px, 1.8vw, 10px)", lineHeight: 1.8, color: "#00ffff", maxWidth: "85%", marginBottom: "12px" }}>
              {t.desc2}
            </p>
            <p style={{ fontSize: "clamp(5px, 1.4vw, 8px)", color: "#777", marginBottom: "12px" }}>
              {t.desc3}
            </p>

            <button
              onClick={startGame}
              className="uppercase"
              style={{
                fontFamily: "inherit",
                background: "#39ff14",
                color: "#000",
                border: "none",
                padding: "12px 22px",
                fontSize: "clamp(8px, 2vw, 12px)",
                cursor: "pointer",
                boxShadow: "4px 4px 0 #fff",
              }}
            >
              {t.startBtn}
            </button>
          </div>
        )}

        {/* Game Over screen */}
        {gameState === "GAMEOVER" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 text-center p-5" style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(2px)" }}>
            <h1
              className="mb-4"
              style={{ color: "#ff0044", fontSize: "clamp(14px, 4vw, 22px)", textShadow: "0 0 12px #ff0044", lineHeight: 1.4 }}
            >
              {t.gameOver}
            </h1>

            {isNewRecord && (
              <div className="mb-2.5 animate-blink-dot" style={{ color: "#ffd700", fontSize: "clamp(8px, 2vw, 11px)" }}>
                {t.newRecord}
              </div>
            )}

            <div className="mb-4 border border-[rgba(57,255,20,0.3)] px-5 py-2.5" style={{ fontSize: "clamp(7px, 1.8vw, 10px)", lineHeight: 2 }}>
              <div>{t.finalScore}: {score}</div>
              <div>{t.finalLevel}: {level}</div>
              <div>{t.foodEaten}: {foodCount}</div>
            </div>

            <button
              onClick={startGame}
              className="uppercase"
              style={{
                fontFamily: "inherit",
                background: "#39ff14",
                color: "#000",
                border: "none",
                padding: "12px 22px",
                fontSize: "clamp(8px, 2vw, 12px)",
                cursor: "pointer",
                boxShadow: "4px 4px 0 #fff",
              }}
            >
              {t.restartBtn}
            </button>
            <button
              onClick={showStartScreen}
              className="uppercase mt-2"
              style={{
                fontFamily: "inherit",
                background: "transparent",
                color: "#aaa",
                border: "1px solid #333",
                padding: "12px 22px",
                fontSize: "clamp(6px, 1.5vw, 9px)",
                cursor: "pointer",
              }}
            >
              {t.menuBtn}
            </button>
          </div>
        )}
      </div>

      {/* Mobile D-pad controls */}
      <div className="flex md:hidden flex-col items-center gap-2 mt-4" style={{ width: "min(90vw, 560px)" }}>
        <div className="flex justify-center gap-4">
          <button
            onTouchStart={(e) => { e.preventDefault(); dpadAction(() => { gameRef.current.nextDir = { x: 0, y: -1 } }) }}
            onMouseDown={() => dpadAction(() => { gameRef.current.nextDir = { x: 0, y: -1 } })}
            className="w-14 h-14 flex items-center justify-center border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.07)] rounded-lg text-[rgba(255,255,255,0.7)] text-lg active:bg-[rgba(255,255,255,0.2)] select-none"
            aria-label="Up"
          >
            {"▲"}
          </button>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onTouchStart={(e) => { e.preventDefault(); dpadAction(() => { gameRef.current.nextDir = { x: -1, y: 0 } }) }}
            onMouseDown={() => dpadAction(() => { gameRef.current.nextDir = { x: -1, y: 0 } })}
            className="w-14 h-14 flex items-center justify-center border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.07)] rounded-lg text-[rgba(255,255,255,0.7)] text-lg active:bg-[rgba(255,255,255,0.2)] select-none"
            aria-label="Left"
          >
            {"◀"}
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); dpadAction(() => { gameRef.current.isDashing = true }) }}
            onTouchEnd={(e) => { e.preventDefault(); gameRef.current.isDashing = false }}
            onMouseDown={() => dpadAction(() => { gameRef.current.isDashing = true })}
            onMouseUp={() => { gameRef.current.isDashing = false }}
            className="w-16 h-14 flex items-center justify-center border border-[rgba(0,255,255,0.3)] bg-[rgba(0,255,255,0.08)] rounded-lg text-[#00ffff] text-[10px] active:bg-[rgba(0,255,255,0.25)] select-none"
            style={{ fontFamily: "inherit" }}
            aria-label="Dash"
          >
            DASH
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); dpadAction(() => { gameRef.current.nextDir = { x: 1, y: 0 } }) }}
            onMouseDown={() => dpadAction(() => { gameRef.current.nextDir = { x: 1, y: 0 } })}
            className="w-14 h-14 flex items-center justify-center border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.07)] rounded-lg text-[rgba(255,255,255,0.7)] text-lg active:bg-[rgba(255,255,255,0.2)] select-none"
            aria-label="Right"
          >
            {"▶"}
          </button>
        </div>
        <div className="flex justify-center gap-4">
          <button
            onTouchStart={(e) => { e.preventDefault(); dpadAction(() => { gameRef.current.nextDir = { x: 0, y: 1 } }) }}
            onMouseDown={() => dpadAction(() => { gameRef.current.nextDir = { x: 0, y: 1 } })}
            className="w-14 h-14 flex items-center justify-center border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.07)] rounded-lg text-[rgba(255,255,255,0.7)] text-lg active:bg-[rgba(255,255,255,0.2)] select-none"
            aria-label="Down"
          >
            {"▼"}
          </button>
        </div>
      </div>
    </div>
  )
}
