"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { VW, VH, WIN_SCORE, MAX_HYPER_STACKS, HYPER_COOLDOWN_MS, DPAD_SPEED, BG_DARK } from "./components/constants"
import { Paddle, Ball, spawnFx, spawnShockwave } from "./components/entities"
import type { Particle, Trail, Shockwave } from "./components/entities"
import { collideBall } from "./components/collision"
import { drawGame } from "./components/renderer"
import { PongAudioEngine } from "./components/audio-engine"

const I18N = {
  id: {
    title: "NEON PONG",
    subtitle: "ULTIMATE EDITION",
    arcade: "ARCADE MODE",
    quick: "QUICK PLAY",
    easy: "MUDAH",
    normal: "NORMAL",
    hard: "SULIT",
    start: "Mulai",
    resume: "Lanjutkan",
    restart: "Mulai Ulang",
    menu: "Menu",
    paused: "JEDA",
    victory: "MENANG!",
    defeat: "KALAH!",
    nextStage: "Stage Berikutnya",
    tryAgain: "Coba Lagi",
    playAgain: "Main Lagi",
    back: "Kembali",
    stage: "STAGE",
    vs: "VS",
    player: "KAMU",
    cpu: "CPU",
    hyperLabel: "HYPER",
    ctrlDrag: "DRAG",
    ctrlDpad: "D-PAD",
    ctrl: "Kontrol",
    diff: "Kesulitan AI",
  },
  en: {
    title: "NEON PONG",
    subtitle: "ULTIMATE EDITION",
    arcade: "ARCADE MODE",
    quick: "QUICK PLAY",
    easy: "EASY",
    normal: "NORMAL",
    hard: "HARD",
    start: "Start",
    resume: "Resume",
    restart: "Restart",
    menu: "Menu",
    paused: "PAUSED",
    victory: "VICTORY!",
    defeat: "DEFEAT!",
    nextStage: "Next Stage",
    tryAgain: "Try Again",
    playAgain: "Play Again",
    back: "Back",
    stage: "STAGE",
    vs: "VS",
    player: "YOU",
    cpu: "CPU",
    hyperLabel: "HYPER",
    ctrlDrag: "DRAG",
    ctrlDpad: "D-PAD",
    ctrl: "Controls",
    diff: "AI Difficulty",
  },
} as const

type LangKey = keyof typeof I18N
type GamePhase = "MENU" | "PLAYING" | "PAUSED" | "GAMEOVER"

export default function NeonPongPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [lang, setLang] = useState<LangKey>("id")
  const [phase, setPhase] = useState<GamePhase>("MENU")
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [stage, setStage] = useState(1)
  const [winner, setWinner] = useState<"PLAYER" | "CPU" | null>(null)
  const [ctrlMode, setCtrlMode] = useState<"drag" | "dpad">("drag")
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal")

  const audioRef = useRef<PongAudioEngine | null>(null)
  const gameRef = useRef({
    player: null as Paddle | null,
    ai: null as Paddle | null,
    balls: [] as Ball[],
    particles: [] as Particle[],
    trails: [] as Trail[],
    shockwaves: [] as Shockwave[],
    phase: "MENU" as GamePhase,
    mode: "ARCADE" as "ARCADE" | "QUICK",
    stage: 1,
    difficulty: "normal" as string,
    ctrlMode: "drag" as string,
    timeTick: 0,
    shakeX: 0, shakeY: 0, shakeDec: 0,
    screenFlash: 0, screenFlashColor: "",
    rallyCount: 0, rallyBannerTimer: 0,
    hitStop: 0,
    goalAnimating: false,
    spawningBall: false,
    ballSpawnTimer: null as ReturnType<typeof setInterval> | null,
    hyperTimer: null as ReturnType<typeof setInterval> | null,
    animId: null as number | null,
    playerStreak: 0, aiStreak: 0,
    dpadUp: false, dpadDown: false,
    keys: {} as Record<string, boolean>,
    dragTouchId: null as number | null,
  })

  // Init audio
  useEffect(() => {
    audioRef.current = new PongAudioEngine()
    return () => {
      audioRef.current?.kill()
      const g = gameRef.current
      if (g.animId !== null) cancelAnimationFrame(g.animId)
      if (g.hyperTimer) clearInterval(g.hyperTimer)
      if (g.ballSpawnTimer) clearInterval(g.ballSpawnTimer)
    }
  }, [])

  // Draw idle screen
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d", { alpha: false })
    if (!ctx) return
    ctx.fillStyle = BG_DARK
    ctx.fillRect(0, 0, VW, VH)
    // Center dashed line
    ctx.fillStyle = "rgba(0,229,255,0.15)"
    for (let i = 0; i < VH; i += 35) ctx.fillRect(VW / 2 - 2, i, 4, 20)
  }, [])

  const scheduleNewBall = useCallback((dir: number) => {
    const g = gameRef.current
    if (g.spawningBall) return
    g.spawningBall = true
    g.rallyCount = 0
    let delay = 400
    if (g.ballSpawnTimer) clearInterval(g.ballSpawnTimer)
    g.ballSpawnTimer = setInterval(() => {
      if (g.phase === "PLAYING" && !g.goalAnimating) delay -= 50
      if (delay <= 0) {
        if (g.ballSpawnTimer) clearInterval(g.ballSpawnTimer)
        g.balls.push(new Ball(dir))
        g.spawningBall = false
        spawnShockwave(g.shockwaves, VW / 2, VH / 2, "#fff")
      }
    }, 50)
  }, [])

  const endGame = useCallback((who: "PLAYER" | "CPU") => {
    const g = gameRef.current
    g.phase = "GAMEOVER"
    setPhase("GAMEOVER")
    setWinner(who)
    audioRef.current?.stopBGM()
    if (g.hyperTimer) clearInterval(g.hyperTimer)
    if (who === "PLAYER") {
      audioRef.current?.win()
      if (g.mode === "ARCADE") {
        g.stage++
        setStage(g.stage)
      }
    } else {
      audioRef.current?.lose()
    }
  }, [])

  const startGame = useCallback((mode: "ARCADE" | "QUICK") => {
    const g = gameRef.current
    if (g.animId !== null) { cancelAnimationFrame(g.animId); g.animId = null }
    if (g.hyperTimer) clearInterval(g.hyperTimer)
    if (g.ballSpawnTimer) clearInterval(g.ballSpawnTimer)

    g.mode = mode
    g.player = new Paddle(28, false)
    g.ai = new Paddle(VW - 28 - 14, true, g.stage, mode)
    g.balls = []
    g.particles = []
    g.trails = []
    g.shockwaves = []
    g.spawningBall = false
    g.goalAnimating = false
    g.hitStop = 0
    g.rallyCount = 0
    g.rallyBannerTimer = 0
    g.timeTick = 0
    g.shakeDec = 0; g.shakeX = 0; g.shakeY = 0
    g.screenFlash = 0
    g.playerStreak = 0; g.aiStreak = 0
    g.dpadUp = false; g.dpadDown = false

    setPlayerScore(0)
    setAiScore(0)
    g.phase = "PLAYING"
    setPhase("PLAYING")
    setWinner(null)

    audioRef.current?.init()
    audioRef.current?.startBGM()

    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d", { alpha: false })
    if (!ctx) return

    // Hyper regen timer
    g.hyperTimer = setInterval(() => {
      if (g.phase !== "PLAYING" || g.goalAnimating || !g.player) return
      if (g.player.hyperStacks < MAX_HYPER_STACKS) {
        g.player.hyperCooldown += 100
        if (g.player.hyperCooldown >= HYPER_COOLDOWN_MS) {
          g.player.hyperStacks++
          g.player.hyperCooldown = 0
        }
      }
    }, 100)

    // Audio cues
    audioRef.current?.ready()
    setTimeout(() => audioRef.current?.go(), 500)

    // Delay ball spawn
    setTimeout(() => scheduleNewBall(-1), 1200)

    function update() {
      if (g.phase !== "PLAYING" || g.goalAnimating) return
      g.timeTick++
      if (g.hitStop > 0) { g.hitStop--; return }
      if (!g.player || !g.ai) return

      // D-pad input
      if (g.ctrlMode === "dpad") {
        if (g.keys["ArrowUp"] || g.keys["w"] || g.keys["W"] || g.dpadUp)
          g.player.dpadTargetY -= DPAD_SPEED
        if (g.keys["ArrowDown"] || g.keys["s"] || g.keys["S"] || g.dpadDown)
          g.player.dpadTargetY += DPAD_SPEED
        g.player.dpadTargetY = Math.max(0, Math.min(VH - g.player.h, g.player.dpadTargetY))
      }

      // AI targeting
      let aiTarget = VH / 2
      let ballComingToAI = false
      let predChance = 0
      let errMargin = 40
      if (mode === "ARCADE") {
        predChance = Math.min(0.9, g.stage * 0.1)
        errMargin = Math.max(5, 40 - g.stage * 3)
      } else {
        switch (g.difficulty) {
          case "easy": predChance = 0; errMargin = 40; break
          case "normal": predChance = 0.5; errMargin = 25; break
          case "hard": predChance = 0.85; errMargin = 10; break
        }
      }

      for (const b of g.balls) {
        if (b.dx > 0) {
          ballComingToAI = true
          if (Math.random() < predChance) {
            const tR = (g.ai.x - b.x) / (b.dx * b.mult)
            let pY = b.y + (b.dy * b.mult) * tR
            while (pY < 0 || pY > VH) {
              if (pY < 0) pY = Math.abs(pY)
              if (pY > VH) pY = VH - (pY - VH)
            }
            aiTarget = pY + (Math.random() * errMargin * 2 - errMargin)
          } else {
            aiTarget = b.y + (Math.random() * errMargin * 2 - errMargin)
          }
        }
      }

      if (ballComingToAI && !g.ai.wasBallComing) {
        const md = mode === "ARCADE" ? Math.max(5, 15 - g.stage) : (g.difficulty === "easy" ? 15 : g.difficulty === "hard" ? 5 : 10)
        g.ai.reactionDelay = Math.floor(Math.random() * md)
      }
      g.ai.wasBallComing = ballComingToAI
      if (!ballComingToAI) aiTarget = VH / 2

      g.player.update(0, g.stage, g.difficulty, g.mode, g.rallyCount, g.ctrlMode)
      g.ai.update(aiTarget, g.stage, g.difficulty, g.mode, g.rallyCount, g.ctrlMode)

      // Ball updates and collisions
      const rally = { value: g.rallyCount }
      const hs = { value: g.hitStop }
      const sd = { value: g.shakeDec }
      const sf = { value: g.screenFlash }
      const sfc = { value: g.screenFlashColor }

      for (let i = g.balls.length - 1; i >= 0; i--) {
        const b = g.balls[i]
        b.update(g.trails)

        // Wall bounce
        if (b.y <= 0) { b.y = 0; b.dy = Math.abs(b.dy); audioRef.current?.wall(); spawnFx(g.particles, b.x + 6, 0, "#00e5ff", 5); spawnShockwave(g.shockwaves, b.x + 6, 0, "#00e5ff") }
        if (b.y + b.size >= VH) { b.y = VH - b.size; b.dy = -Math.abs(b.dy); audioRef.current?.wall(); spawnFx(g.particles, b.x + 6, VH, "#00e5ff", 5); spawnShockwave(g.shockwaves, b.x + 6, VH, "#00e5ff") }

        collideBall(b, g.player, g.particles, g.shockwaves, audioRef.current, rally, hs, sd, sf, sfc)
        collideBall(b, g.ai, g.particles, g.shockwaves, audioRef.current, rally, hs, sd, sf, sfc)

        g.rallyCount = rally.value
        g.hitStop = hs.value
        g.shakeDec = sd.value
        g.screenFlash = sf.value
        g.screenFlashColor = sfc.value

        // Scoring
        if (b.x < 0) {
          g.ai.score++
          g.aiStreak++
          g.playerStreak = 0
          setAiScore(g.ai.score)
          audioRef.current?.score()
          audioRef.current?.goalSFX(g.aiStreak)
          g.shakeDec = 20
          g.balls = []
          spawnShockwave(g.shockwaves, VW / 2, VH / 2, "#ff0066")
          g.rallyCount = 0
          if (g.player.score >= WIN_SCORE) { endGame("PLAYER"); return }
          if (g.ai.score >= WIN_SCORE) { endGame("CPU"); return }
          g.goalAnimating = true
          setTimeout(() => { g.goalAnimating = false; scheduleNewBall(1) }, 1000)
          break
        }
        if (b.x > VW) {
          g.player.score++
          g.playerStreak++
          g.aiStreak = 0
          setPlayerScore(g.player.score)
          audioRef.current?.score()
          audioRef.current?.goalSFX(g.playerStreak)
          g.shakeDec = 20
          g.balls = []
          spawnShockwave(g.shockwaves, VW / 2, VH / 2, "#00e5ff")
          g.rallyCount = 0
          if (g.player.score >= WIN_SCORE) { endGame("PLAYER"); return }
          if (g.ai.score >= WIN_SCORE) { endGame("CPU"); return }
          g.goalAnimating = true
          setTimeout(() => { g.goalAnimating = false; scheduleNewBall(-1) }, 1000)
          break
        }
      }

      // Update particles & trails
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i]
        p.x += p.dx; p.y += p.dy; p.dx *= 0.9; p.dy *= 0.9; p.life -= p.decay
        if (p.life <= 0) g.particles.splice(i, 1)
      }
      for (let i = g.trails.length - 1; i >= 0; i--) {
        g.trails[i].size *= 0.82; g.trails[i].life -= 0.1
        if (g.trails[i].life <= 0) g.trails.splice(i, 1)
      }

      // Shake
      if (g.shakeDec > 0) {
        g.shakeX = (Math.random() - 0.5) * g.shakeDec
        g.shakeY = (Math.random() - 0.5) * g.shakeDec
        g.shakeDec = Math.max(0, g.shakeDec - 0.8)
      } else {
        g.shakeX = 0; g.shakeY = 0
      }

      // Screen flash decay
      if (g.screenFlash > 0) g.screenFlash = Math.max(0, g.screenFlash - 0.05)

      if (g.rallyBannerTimer > 0) g.rallyBannerTimer--
      if (g.rallyCount === 10) { g.rallyBannerTimer = 60; g.screenFlash = 0.4; g.screenFlashColor = "#ff7700"; g.shakeDec = 30 }
    }

    function render() {
      if (g.phase === "MENU") return
      g.timeTick++
      drawGame(
        ctx, g.player, g.ai, g.balls, g.particles, g.trails, g.shockwaves,
        g.timeTick, g.shakeX, g.shakeY, g.screenFlash, g.screenFlashColor,
        g.rallyCount, g.rallyBannerTimer,
      )
    }

    function loop() {
      update()
      render()
      g.animId = requestAnimationFrame(loop)
    }
    g.animId = requestAnimationFrame(loop)
  }, [scheduleNewBall, endGame])

  // Keyboard input
  useEffect(() => {
    const g = gameRef.current
    function onKeyDown(e: KeyboardEvent) {
      g.keys[e.key] = true
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault()
      if (g.phase !== "PLAYING") return
      if (g.ctrlMode === "drag") {
        const speed = 15
        if (e.key === "ArrowUp" || e.key === "w") {
          if (g.player) g.player.dragTargetY -= speed
        }
        if (e.key === "ArrowDown" || e.key === "s") {
          if (g.player) g.player.dragTargetY += speed
        }
      }
      if (e.code === "Space" && g.player && !g.goalAnimating) g.player.hyperPressed = true
    }
    function onKeyUp(e: KeyboardEvent) {
      g.keys[e.key] = false
      if (e.code === "Space" && g.player) g.player.hyperPressed = false
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp) }
  }, [])

  // Touch drag
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const g = gameRef.current

    function handleTouchStart(e: TouchEvent) {
      if (g.phase !== "PLAYING" || g.goalAnimating) return
      for (let i = 0; i < e.changedTouches.length; i++) {
        const tch = e.changedTouches[i]
        if (g.ctrlMode === "drag" && g.dragTouchId === null) {
          g.dragTouchId = tch.identifier
          if (g.player) {
            const rect = c.getBoundingClientRect()
            const scaleY = c.height / rect.height
            g.player.dragTargetY = (tch.clientY - rect.top) * scaleY - g.player.h / 2
          }
          e.preventDefault()
        }
      }
    }
    function handleTouchMove(e: TouchEvent) {
      if (g.phase !== "PLAYING" || g.goalAnimating) return
      for (let i = 0; i < e.changedTouches.length; i++) {
        const tch = e.changedTouches[i]
        if (g.ctrlMode === "drag" && tch.identifier === g.dragTouchId && g.player) {
          const rect = c.getBoundingClientRect()
          const scaleY = c.height / rect.height
          g.player.dragTargetY = (tch.clientY - rect.top) * scaleY - g.player.h / 2
          e.preventDefault()
        }
      }
    }
    function handleTouchEnd(e: TouchEvent) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === g.dragTouchId) g.dragTouchId = null
      }
    }
    c.addEventListener("touchstart", handleTouchStart, { passive: false })
    c.addEventListener("touchmove", handleTouchMove, { passive: false })
    c.addEventListener("touchend", handleTouchEnd, { passive: false })
    c.addEventListener("touchcancel", handleTouchEnd, { passive: false })
    return () => {
      c.removeEventListener("touchstart", handleTouchStart)
      c.removeEventListener("touchmove", handleTouchMove)
      c.removeEventListener("touchend", handleTouchEnd)
      c.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [])

  const goMenu = useCallback(() => {
    const g = gameRef.current
    if (g.animId !== null) { cancelAnimationFrame(g.animId); g.animId = null }
    if (g.hyperTimer) clearInterval(g.hyperTimer)
    if (g.ballSpawnTimer) clearInterval(g.ballSpawnTimer)
    audioRef.current?.stopBGM()
    g.phase = "MENU"
    setPhase("MENU")
    setWinner(null)
  }, [])

  const togglePause = useCallback(() => {
    const g = gameRef.current
    if (g.phase === "PLAYING") {
      g.phase = "PAUSED"
      setPhase("PAUSED")
      audioRef.current?.stopBGM()
    } else if (g.phase === "PAUSED") {
      g.phase = "PLAYING"
      setPhase("PLAYING")
      audioRef.current?.startBGM()
    }
  }, [])

  // Sync ctrlMode and difficulty
  useEffect(() => { gameRef.current.ctrlMode = ctrlMode }, [ctrlMode])
  useEffect(() => { gameRef.current.difficulty = difficulty }, [difficulty])

  const t = I18N[lang]
  const hyperStacks = gameRef.current.player?.hyperStacks ?? MAX_HYPER_STACKS

  return (
    <div
      className="min-h-screen bg-[#000] text-[#fff] flex flex-col items-center justify-center"
      style={{ fontFamily: "var(--font-press-start), 'Press Start 2P', monospace" }}
    >
      {/* Back */}
      <div className="w-full max-w-[820px] px-4 mb-2">
        <Link href="/" className="text-[10px] text-[#888] hover:text-[#00ff88] transition-colors" style={{ fontFamily: "inherit" }}>
          {"<"} {t.back}
        </Link>
      </div>

      {/* HUD */}
      {phase !== "MENU" && (
        <div className="w-full max-w-[820px] flex items-center justify-between px-4 mb-2" style={{ fontSize: "clamp(8px, 2vw, 12px)" }}>
          <div className="flex items-center gap-3">
            <span className="text-[#00ff88]" style={{ fontSize: "clamp(16px, 4vw, 28px)", fontWeight: 900 }}>{playerScore}</span>
            <span className="text-[#444]">{t.player}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[#555]">{t.vs}</span>
            <span className="text-[#ff7700]" style={{ fontSize: "clamp(6px, 1.5vw, 9px)" }}>
              {gameRef.current.mode === "ARCADE" ? `${t.stage} ${stage}` : "QUICK PLAY"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#444]">{t.cpu}</span>
            <span className="text-[#ff0066]" style={{ fontSize: "clamp(16px, 4vw, 28px)", fontWeight: 900 }}>{aiScore}</span>
          </div>
          <button onClick={togglePause} className="text-[#888] border border-[#333] px-2 py-1 hover:border-[#fff] hover:text-[#fff] transition-colors" style={{ fontFamily: "inherit", fontSize: "clamp(6px, 1.5vw, 10px)" }}>
            ||
          </button>
        </div>
      )}

      {/* Canvas */}
      <div className="relative" style={{ width: "min(95vw, 820px)", aspectRatio: `${VW}/${VH}` }}>
        <canvas
          ref={canvasRef}
          width={VW}
          height={VH}
          className="block w-full h-full rounded-lg"
          style={{ backgroundColor: BG_DARK, imageRendering: "pixelated" }}
        />

        {/* CRT overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-lg"
          style={{
            background: "linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.18) 50%), linear-gradient(90deg, rgba(255,0,0,0.04), rgba(0,255,0,0.015), rgba(0,0,255,0.04))",
            backgroundSize: "100% 4px, 3px 100%",
            boxShadow: "inset 0 0 50px rgba(0,0,0,0.7)",
          }}
        />

        {/* MENU overlay */}
        {phase === "MENU" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 text-center p-5 rounded-lg" style={{ background: "rgba(9,5,20,0.95)" }}>
            {/* Lang switch */}
            <div className="flex gap-2 mb-6">
              {(["id", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="px-3 py-1.5 border transition-all uppercase"
                  style={{
                    fontFamily: "inherit", fontSize: "clamp(6px, 1.5vw, 9px)",
                    background: lang === l ? "#00ff88" : "transparent",
                    color: lang === l ? "#000" : "#555",
                    borderColor: lang === l ? "#00ff88" : "#333",
                    cursor: "pointer",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            <h1 className="mb-1" style={{ color: "#00ff88", fontSize: "clamp(18px, 5vw, 32px)", textShadow: "0 0 18px #00ff88, 0 0 36px rgba(0,255,136,0.25)", lineHeight: 1.3 }}>
              {t.title}
            </h1>
            <p className="mb-6" style={{ color: "#00e5ff", fontSize: "clamp(5px, 1.4vw, 8px)", letterSpacing: "0.28em", textShadow: "0 0 8px #00e5ff" }}>
              {t.subtitle}
            </p>

            {/* Settings row */}
            <div className="flex flex-wrap gap-3 justify-center mb-6" style={{ fontSize: "clamp(5px, 1.3vw, 8px)" }}>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[#888]">{t.ctrl}</span>
                <div className="flex gap-1.5">
                  {(["drag", "dpad"] as const).map((m) => (
                    <button key={m} onClick={() => setCtrlMode(m)} className="px-2 py-1 border transition-all uppercase" style={{
                      fontFamily: "inherit", fontSize: "inherit", cursor: "pointer",
                      background: ctrlMode === m ? "rgba(0,229,255,0.2)" : "transparent",
                      color: ctrlMode === m ? "#00e5ff" : "#555",
                      borderColor: ctrlMode === m ? "#00e5ff" : "#333",
                    }}>
                      {m === "drag" ? t.ctrlDrag : t.ctrlDpad}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[#888]">{t.diff}</span>
                <div className="flex gap-1.5">
                  {(["easy", "normal", "hard"] as const).map((d) => (
                    <button key={d} onClick={() => setDifficulty(d)} className="px-2 py-1 border transition-all uppercase" style={{
                      fontFamily: "inherit", fontSize: "inherit", cursor: "pointer",
                      background: difficulty === d ? "rgba(255,238,0,0.15)" : "transparent",
                      color: difficulty === d ? "#ffee00" : "#555",
                      borderColor: difficulty === d ? "#ffee00" : "#333",
                    }}>
                      {t[d]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-[260px]">
              <button
                onClick={() => startGame("ARCADE")}
                className="uppercase"
                style={{
                  fontFamily: "inherit", background: "rgba(255,119,0,0.1)", color: "#ff7700",
                  border: "2px solid #ff7700", padding: "12px", fontSize: "clamp(8px, 2vw, 12px)",
                  cursor: "pointer", boxShadow: "0 0 12px rgba(255,119,0,0.18)", letterSpacing: "0.12em",
                }}
              >
                {t.arcade} (ST.{stage})
              </button>
              <button
                onClick={() => startGame("QUICK")}
                className="uppercase"
                style={{
                  fontFamily: "inherit", background: "rgba(0,255,136,0.05)", color: "#00ff88",
                  border: "2px solid #00ff88", padding: "12px", fontSize: "clamp(8px, 2vw, 12px)",
                  cursor: "pointer", boxShadow: "0 0 12px rgba(0,255,136,0.18)", letterSpacing: "0.12em",
                }}
              >
                {t.quick}
              </button>
            </div>
          </div>
        )}

        {/* PAUSED overlay */}
        {phase === "PAUSED" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 text-center p-5 rounded-lg" style={{ background: "rgba(5,2,10,0.88)" }}>
            <h2 className="mb-6" style={{ color: "#00e5ff", fontSize: "clamp(18px, 5vw, 28px)", letterSpacing: "0.18em" }}>{t.paused}</h2>
            <div className="flex flex-col gap-3 w-full max-w-[220px]">
              <button onClick={togglePause} className="uppercase" style={{ fontFamily: "inherit", background: "#00ff88", color: "#000", border: "none", padding: "12px", fontSize: "clamp(8px, 2vw, 12px)", cursor: "pointer", letterSpacing: "0.12em" }}>
                {t.resume}
              </button>
              <button onClick={() => { goMenu(); }} className="uppercase" style={{ fontFamily: "inherit", background: "transparent", color: "#ff0066", border: "1px solid #ff0066", padding: "10px", fontSize: "clamp(6px, 1.5vw, 9px)", cursor: "pointer" }}>
                {t.menu}
              </button>
            </div>
          </div>
        )}

        {/* GAMEOVER overlay */}
        {phase === "GAMEOVER" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 text-center p-5 rounded-lg" style={{ background: "rgba(5,2,10,0.92)" }}>
            <h2 className="mb-3" style={{
              color: winner === "PLAYER" ? "#00ff88" : "#ff0066",
              fontSize: "clamp(20px, 6vw, 36px)",
              textShadow: `0 0 18px ${winner === "PLAYER" ? "#00ff88" : "#ff0066"}`,
              letterSpacing: "0.12em",
            }}>
              {winner === "PLAYER" ? t.victory : t.defeat}
            </h2>
            <div className="flex gap-4 mb-6" style={{ fontSize: "clamp(24px, 8vw, 48px)", fontWeight: 900 }}>
              <span className="text-[#00ff88]">{playerScore}</span>
              <span className="text-[rgba(255,255,255,0.3)]">:</span>
              <span className="text-[#ff0066]">{aiScore}</span>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-[240px]">
              <button
                onClick={() => startGame(gameRef.current.mode)}
                className="uppercase"
                style={{
                  fontFamily: "inherit", background: "#00ff88", color: "#000", border: "none", padding: "12px",
                  fontSize: "clamp(8px, 2vw, 12px)", cursor: "pointer", letterSpacing: "0.12em",
                }}
              >
                {winner === "PLAYER" && gameRef.current.mode === "ARCADE" ? t.nextStage : winner === "PLAYER" ? t.playAgain : t.tryAgain}
              </button>
              <button onClick={goMenu} className="uppercase" style={{ fontFamily: "inherit", background: "transparent", color: "#aaa", border: "1px solid #333", padding: "10px", fontSize: "clamp(6px, 1.5vw, 9px)", cursor: "pointer" }}>
                {t.menu}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      {phase === "PLAYING" && (
        <div className="flex md:hidden items-center justify-between w-full max-w-[820px] px-4 mt-4">
          {/* D-pad / drag label */}
          {ctrlMode === "dpad" ? (
            <div className="flex flex-col gap-2">
              <button
                onTouchStart={(e) => { e.preventDefault(); gameRef.current.dpadUp = true }}
                onTouchEnd={() => { gameRef.current.dpadUp = false }}
                className="w-14 h-14 flex items-center justify-center border border-[rgba(0,229,255,0.3)] bg-[rgba(0,229,255,0.08)] rounded-lg text-[#00e5ff] text-lg active:bg-[rgba(0,229,255,0.3)] select-none"
                aria-label="Up"
              >
                {"▲"}
              </button>
              <button
                onTouchStart={(e) => { e.preventDefault(); gameRef.current.dpadDown = true }}
                onTouchEnd={() => { gameRef.current.dpadDown = false }}
                className="w-14 h-14 flex items-center justify-center border border-[rgba(0,229,255,0.3)] bg-[rgba(0,229,255,0.08)] rounded-lg text-[#00e5ff] text-lg active:bg-[rgba(0,229,255,0.3)] select-none"
                aria-label="Down"
              >
                {"▼"}
              </button>
            </div>
          ) : (
            <div className="text-[8px] text-[#555]" style={{ fontFamily: "inherit" }}>DRAG CANVAS</div>
          )}

          {/* Hyper button */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: MAX_HYPER_STACKS }).map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-colors"
                  style={{
                    width: "clamp(12px, 3vw, 18px)",
                    background: i < hyperStacks ? "#ff7700" : "rgba(255,255,255,0.15)",
                    boxShadow: i < hyperStacks ? "0 0 5px #ff7700" : "none",
                  }}
                />
              ))}
            </div>
            <button
              onTouchStart={(e) => { e.preventDefault(); if (gameRef.current.player && !gameRef.current.goalAnimating) gameRef.current.player.hyperPressed = true }}
              onTouchEnd={() => { if (gameRef.current.player) gameRef.current.player.hyperPressed = false }}
              className="w-16 h-16 flex flex-col items-center justify-center rounded-full border-[3px] select-none active:scale-90 transition-transform"
              style={{
                borderColor: hyperStacks > 0 ? "#ff7700" : "#333",
                background: hyperStacks > 0 ? "rgba(255,119,0,0.15)" : "rgba(255,255,255,0.03)",
                color: hyperStacks > 0 ? "#ff7700" : "#555",
              }}
              aria-label="Hyper Strike"
            >
              <span style={{ fontSize: "20px", lineHeight: 1 }}>{"⚡"}</span>
              <span style={{ fontFamily: "inherit", fontSize: "6px", letterSpacing: "0.08em" }}>{t.hyperLabel}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
