"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { VW, VH, WIN_SCORE, MAX_HYPER_STACKS, HYPER_COOLDOWN_MS, DPAD_SPEED, BG_DARK, SKINS, TIERS, TIER_ORDER, ANIM_DEFS } from "./components/constants"
import type { AnimDef } from "./components/constants"
import { Paddle, Ball, spawnFx, spawnShockwave, spawnCanvasPixels } from "./components/entities"
import type { Particle, Trail, Shockwave, OverlayParticle } from "./components/entities"
import { collideBall } from "./components/collision"
import type { GameRefs } from "./components/collision"
import { drawGame, drawGaragePreview } from "./components/renderer"
import { PongAudioEngine, BGM_DEFS } from "./components/audio-engine"

// Save/Load
const SALT = "n30n_x2_"
function saveGameData(coins: number, stage: number, skins: string[], equipped: string) {
  try {
    const data = { coins, stage, skins, equipped }
    localStorage.setItem("neonProg3", btoa(SALT + JSON.stringify(data)))
  } catch { /* */ }
}
function loadGameData(): { coins: number; stage: number; skins: string[]; equipped: string } | null {
  try {
    const v = localStorage.getItem("neonProg3")
    if (!v) return null
    const str = atob(v)
    if (str.startsWith(SALT)) return JSON.parse(str.replace(SALT, ""))
  } catch { /* */ }
  return null
}

type GamePhase = "MENU" | "SETTINGS" | "GARAGE" | "PLAYING" | "PAUSED" | "GAMEOVER" | "ANIM"

export default function NeonPongPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const garageCanvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<PongAudioEngine | null>(null)

  const [phase, setPhase] = useState<GamePhase>("MENU")
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [winner, setWinner] = useState<"PLAYER" | "CPU" | null>(null)
  const [ctrlMode, setCtrlMode] = useState<"drag" | "dpad">("drag")
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal")
  const [bgmIdx, setBgmIdx] = useState(0)

  // Persistent state
  const [coins, setCoins] = useState(999999)
  const [stage, setStage] = useState(1)
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(["BAJA"])
  const [equippedSkin, setEquippedSkin] = useState("BAJA")
  const [selectedGarageSkin, setSelectedGarageSkin] = useState("BAJA")
  const [showGameoverBtns, setShowGameoverBtns] = useState(false)
  const [coinReward, setCoinReward] = useState(0)
  const [newUnlocks, setNewUnlocks] = useState<string[]>([])

  // Load saved data
  useEffect(() => {
    const gd = loadGameData()
    if (gd) {
      setCoins(gd.coins); setStage(gd.stage)
      const sk = gd.skins.includes("BAJA") ? gd.skins : ["BAJA", ...gd.skins]
      setUnlockedSkins(sk)
      setEquippedSkin(SKINS[gd.equipped] ? gd.equipped : "BAJA")
    }
  }, [])

  const gameRef = useRef({
    player: null as Paddle | null,
    ai: null as Paddle | null,
    balls: [] as Ball[],
    particles: [] as Particle[],
    trails: [] as Trail[],
    shockwaves: [] as Shockwave[],
    overlayParticles: [] as OverlayParticle[],
    phase: "MENU" as GamePhase,
    mode: "ARCADE" as "ARCADE" | "QUICK",
    stage: 1,
    difficulty: "normal" as string,
    ctrlMode: "drag" as string,
    equippedSkin: "BAJA",
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
    prevPlayerScore: 0, prevAiScore: 0,
    dpadUp: false, dpadDown: false,
    keys: {} as Record<string, boolean>,
    dragTouchId: null as number | null,
    animGlitchActive: false, glitchColor: "#fff",
    coins: 999999, unlockedSkins: ["BAJA"],
  })

  // Sync refs
  useEffect(() => { gameRef.current.ctrlMode = ctrlMode }, [ctrlMode])
  useEffect(() => { gameRef.current.difficulty = difficulty }, [difficulty])
  useEffect(() => { gameRef.current.stage = stage }, [stage])
  useEffect(() => { gameRef.current.equippedSkin = equippedSkin }, [equippedSkin])
  useEffect(() => { gameRef.current.coins = coins; gameRef.current.unlockedSkins = unlockedSkins }, [coins, unlockedSkins])

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

  // Garage preview animation
  useEffect(() => {
    if (phase !== "GARAGE") return
    const cvs = garageCanvasRef.current
    if (!cvs) return
    const pctx = cvs.getContext("2d")
    if (!pctx) return
    let tick = 0, bounce = 0, bounceDir = 1, animId = 0
    function animate() {
      tick++
      bounce += bounceDir * 0.7
      if (Math.abs(bounce) > 8) bounceDir *= -1
      drawGaragePreview(pctx!, cvs!.width, cvs!.height, selectedGarageSkin, tick, bounce, SKINS, TIERS)
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animId)
  }, [phase, selectedGarageSkin])

  // Canvas idle draw
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d", { alpha: false })
    if (!ctx) return
    ctx.fillStyle = BG_DARK; ctx.fillRect(0, 0, VW, VH)
    ctx.fillStyle = "rgba(0,229,255,0.15)"
    for (let i = 0; i < VH; i += 35) ctx.fillRect(VW / 2 - 2, i, 4, 20)
  }, [])

  // Run animation sequence
  const runAnim = useCallback((defKey: string, callback: () => void) => {
    const cfg: AnimDef | undefined = ANIM_DEFS[defKey]
    if (!cfg) { callback(); return }
    const g = gameRef.current
    spawnCanvasPixels(g.overlayParticles, cfg.color, cfg.pixels)
    const effect = cfg.effect
    if (effect === "glitch" || effect === "explodeGlitch" || effect === "fullChaos") {
      g.animGlitchActive = true; g.glitchColor = cfg.color
    }
    if (effect === "explode" || effect === "explodeGlitch" || effect === "fullChaos") {
      setTimeout(() => spawnCanvasPixels(g.overlayParticles, cfg.color, cfg.pixels, true), 200)
    }
    setTimeout(() => {
      g.animGlitchActive = false
      callback()
    }, cfg.dur)
  }, [])

  const scheduleNewBall = useCallback((dir: number) => {
    const g = gameRef.current
    if (g.spawningBall) return
    g.spawningBall = true; g.rallyCount = 0
    let delay = 400
    if (g.ballSpawnTimer) clearInterval(g.ballSpawnTimer)
    g.ballSpawnTimer = setInterval(() => {
      if (g.phase === "PLAYING" && !g.goalAnimating) delay -= 50
      if (delay <= 0) {
        if (g.ballSpawnTimer) clearInterval(g.ballSpawnTimer)
        g.balls.push(new Ball(dir)); g.spawningBall = false
        spawnShockwave(g.shockwaves, VW / 2, VH / 2, "#fff")
      }
    }, 50)
  }, [])

  const checkUnlocks = useCallback((currentCoins: number, currentStage: number, currentUnlocked: string[]) => {
    const newUl: string[] = []
    const updatedSkins = [...currentUnlocked]
    Object.entries(SKINS).forEach(([id, sk]) => {
      const stageReq = sk.bonusStage || sk.unlockStage
      if (stageReq > 0 && currentStage >= stageReq && !updatedSkins.includes(id)) {
        updatedSkins.push(id)
        newUl.push(`${sk.isRamadan ? "* " : ""}${sk.name} (${TIERS[sk.tier].label})`)
      }
    })
    if (newUl.length) setUnlockedSkins(updatedSkins)
    saveGameData(currentCoins, currentStage, updatedSkins, equippedSkin)
    return newUl
  }, [equippedSkin])

  const endGame = useCallback((who: "PLAYER" | "CPU") => {
    const g = gameRef.current
    g.phase = "GAMEOVER"; g.goalAnimating = false
    setPhase("GAMEOVER"); setWinner(who)
    audioRef.current?.stopBGM()
    if (g.hyperTimer) clearInterval(g.hyperTimer)
    setShowGameoverBtns(false)

    let reward = 0; let unlocks: string[] = []
    if (who === "PLAYER") {
      if (g.mode === "ARCADE") {
        reward = 20 + g.stage * 5
        if (g.ai?.isBoss) reward += 50
        const newStage = g.stage + 1
        g.stage = newStage; setStage(newStage)
        unlocks = checkUnlocks(g.coins + reward, newStage, g.unlockedSkins)
      } else { reward = 15 }
      g.coins += reward; setCoins(g.coins)
      saveGameData(g.coins, g.stage, g.unlockedSkins, g.equippedSkin)
      audioRef.current?.win()
    } else {
      audioRef.current?.lose()
    }
    setCoinReward(reward); setNewUnlocks(unlocks)

    runAnim(who === "PLAYER" ? "win" : "lose", () => {})
    setTimeout(() => setShowGameoverBtns(true), 2500)
  }, [checkUnlocks, runAnim])

  const onGoal = useCallback((who: "player" | "ai") => {
    const g = gameRef.current
    g.goalAnimating = true
    audioRef.current?.stopBGM()
    g.rallyCount = 0; g.rallyBannerTimer = 0
    const isP = who === "player"
    const streak = isP ? g.playerStreak : g.aiStreak

    // Comeback check
    let isCB = false
    if (isP && g.prevPlayerScore < g.prevAiScore && g.player!.score > g.ai!.score) isCB = true
    else if (!isP && g.prevAiScore < g.prevPlayerScore && g.ai!.score > g.player!.score) isCB = true

    const key = isCB ? "comeback" : audioRef.current!.getGoalKey(streak)
    if (isCB) audioRef.current?.comeback()
    else audioRef.current?.goalSFX(streak)

    runAnim(key, () => {
      g.goalAnimating = false
      audioRef.current?.startBGM()
      scheduleNewBall(isP ? -1 : 1)
    })
  }, [runAnim, scheduleNewBall])

  const startGame = useCallback((mode: "ARCADE" | "QUICK") => {
    const g = gameRef.current
    if (g.animId !== null) { cancelAnimationFrame(g.animId); g.animId = null }
    if (g.hyperTimer) clearInterval(g.hyperTimer)
    if (g.ballSpawnTimer) clearInterval(g.ballSpawnTimer)

    g.mode = mode
    g.player = new Paddle(28, false, g.stage, mode, g.equippedSkin)
    g.ai = new Paddle(VW - 28 - 14, true, g.stage, mode)
    g.balls = []; g.particles = []; g.trails = []; g.shockwaves = []; g.overlayParticles = []
    g.spawningBall = false; g.goalAnimating = false; g.hitStop = 0
    g.rallyCount = 0; g.rallyBannerTimer = 0; g.timeTick = 0
    g.shakeDec = 0; g.shakeX = 0; g.shakeY = 0; g.screenFlash = 0
    g.playerStreak = 0; g.aiStreak = 0; g.prevPlayerScore = 0; g.prevAiScore = 0
    g.dpadUp = false; g.dpadDown = false
    g.animGlitchActive = false

    setPlayerScore(0); setAiScore(0)
    g.phase = "PLAYING"; setPhase("PLAYING"); setWinner(null)

    audioRef.current?.init()

    // Hyper regen
    g.hyperTimer = setInterval(() => {
      if (g.phase !== "PLAYING" || g.goalAnimating || !g.player) return
      if (g.player.hyperStacks < MAX_HYPER_STACKS) {
        g.player.hyperCooldown += 100
        if (g.player.hyperCooldown >= HYPER_COOLDOWN_MS) { g.player.hyperStacks++; g.player.hyperCooldown = 0 }
      }
    }, 100)

    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d", { alpha: false })
    if (!ctx) return

    // Boss or normal intro
    const doReady = () => {
      audioRef.current?.ready()
      runAnim("ready", () => {
        audioRef.current?.go()
        runAnim("go", () => { scheduleNewBall(-1) })
      })
    }
    if (g.ai.isBoss) {
      audioRef.current?.bossAppears()
      runAnim("boss", doReady)
    } else {
      doReady()
    }

    audioRef.current?.startBGM()

    function update() {
      if (g.phase !== "PLAYING" || g.goalAnimating) return
      g.timeTick++
      if (g.hitStop > 0) { g.hitStop--; return }
      if (!g.player || !g.ai) return

      if (g.ctrlMode === "dpad") {
        if (g.keys["ArrowUp"] || g.keys["w"] || g.keys["W"] || g.dpadUp) g.player.dpadTargetY -= DPAD_SPEED
        if (g.keys["ArrowDown"] || g.keys["s"] || g.keys["S"] || g.dpadDown) g.player.dpadTargetY += DPAD_SPEED
        g.player.dpadTargetY = Math.max(0, Math.min(VH - g.player.h, g.player.dpadTargetY))
      }

      let aiTarget = VH / 2, ballComingToAI = false
      let predChance = 0, errMargin = 40
      if (mode === "ARCADE") {
        predChance = Math.min(0.9, g.stage * 0.1)
        errMargin = Math.max(5, 40 - g.stage * 3)
        if (g.ai.isBoss) errMargin += 15
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
            while (pY < 0 || pY > VH) { if (pY < 0) pY = Math.abs(pY); if (pY > VH) pY = VH - (pY - VH) }
            aiTarget = pY + (Math.random() * errMargin * 2 - errMargin)
          } else {
            aiTarget = b.y + (Math.random() * errMargin * 2 - errMargin)
          }
        }
      }

      if (ballComingToAI && !g.ai.wasBallComing) {
        let md = 15 - Math.min(10, g.stage)
        if (mode !== "ARCADE") md = g.difficulty === "easy" ? 15 : g.difficulty === "hard" ? 5 : 10
        g.ai.reactionDelay = Math.floor(Math.random() * md)
      }
      g.ai.wasBallComing = ballComingToAI
      if (!ballComingToAI) aiTarget = VH / 2

      g.player.update(0, g.stage, g.difficulty, g.mode, g.rallyCount, g.ctrlMode)
      g.ai.update(aiTarget, g.stage, g.difficulty, g.mode, g.rallyCount, g.ctrlMode)

      const refs: GameRefs = {
        rallyCount: g.rallyCount, hitStop: g.hitStop, shakeDec: g.shakeDec,
        screenFlash: g.screenFlash, screenFlashColor: g.screenFlashColor,
        animGlitchActive: g.animGlitchActive, glitchColor: g.glitchColor,
      }

      for (let i = g.balls.length - 1; i >= 0; i--) {
        const b = g.balls[i]
        b.update(g.trails)
        if (b.y <= 0) { b.y = 0; b.dy = Math.abs(b.dy); audioRef.current?.wall(); spawnFx(g.particles, b.x + 6, 0, "#00e5ff", 5); spawnShockwave(g.shockwaves, b.x + 6, 0, "#00e5ff") }
        if (b.y + b.size >= VH) { b.y = VH - b.size; b.dy = -Math.abs(b.dy); audioRef.current?.wall(); spawnFx(g.particles, b.x + 6, VH, "#00e5ff", 5); spawnShockwave(g.shockwaves, b.x + 6, VH, "#00e5ff") }

        collideBall(b, g.player, g.particles, g.shockwaves, audioRef.current, refs, g.stage, g.mode, g.difficulty)
        collideBall(b, g.ai, g.particles, g.shockwaves, audioRef.current, refs, g.stage, g.mode, g.difficulty)

        g.rallyCount = refs.rallyCount; g.hitStop = refs.hitStop; g.shakeDec = refs.shakeDec
        g.screenFlash = refs.screenFlash; g.screenFlashColor = refs.screenFlashColor
        g.animGlitchActive = refs.animGlitchActive; g.glitchColor = refs.glitchColor

        if (b.x < 0) {
          g.prevPlayerScore = g.player.score; g.prevAiScore = g.ai.score
          g.ai.score++; g.aiStreak++; g.playerStreak = 0
          setAiScore(g.ai.score); audioRef.current?.score(); g.shakeDec = 20; g.balls = []
          spawnShockwave(g.shockwaves, VW / 2, VH / 2, "#ff0066")
          if (g.player.score >= WIN_SCORE || g.ai.score >= WIN_SCORE) { endGame(g.player.score >= WIN_SCORE ? "PLAYER" : "CPU"); return }
          onGoal("ai"); break
        }
        if (b.x > VW) {
          g.prevPlayerScore = g.player.score; g.prevAiScore = g.ai.score
          g.player.score++; g.playerStreak++; g.aiStreak = 0
          setPlayerScore(g.player.score); audioRef.current?.score(); g.shakeDec = 20; g.balls = []
          spawnShockwave(g.shockwaves, VW / 2, VH / 2, "#00e5ff")
          if (g.player.score >= WIN_SCORE || g.ai.score >= WIN_SCORE) { endGame(g.player.score >= WIN_SCORE ? "PLAYER" : "CPU"); return }
          onGoal("player"); break
        }
      }

      // Particle updates
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i]; p.x += p.dx; p.y += p.dy; p.dx *= 0.9; p.dy *= 0.9; p.life -= p.decay
        if (p.life <= 0) g.particles.splice(i, 1)
      }
      for (let i = g.trails.length - 1; i >= 0; i--) {
        g.trails[i].size *= 0.82; g.trails[i].life -= 0.1
        if (g.trails[i].life <= 0) g.trails.splice(i, 1)
      }
      if (g.shakeDec > 0) {
        g.shakeX = (Math.random() - 0.5) * g.shakeDec; g.shakeY = (Math.random() - 0.5) * g.shakeDec
        g.shakeDec = Math.max(0, g.shakeDec - 0.8)
      } else { g.shakeX = 0; g.shakeY = 0 }
      if (g.screenFlash > 0) g.screenFlash = Math.max(0, g.screenFlash - 0.05)
      if (g.rallyBannerTimer > 0) g.rallyBannerTimer--
      if (g.rallyCount === 10) { g.rallyBannerTimer = 60; audioRef.current?.rallyAlert(); g.screenFlash = 0.4; g.screenFlashColor = "#ff7700"; g.shakeDec = 30 }
    }

    function render() {
      if (g.phase === "MENU") return
      g.timeTick++
      drawGame(ctx, g.player, g.ai, g.balls, g.particles, g.trails, g.shockwaves, g.overlayParticles,
        g.timeTick, g.shakeX, g.shakeY, g.screenFlash, g.screenFlashColor,
        g.rallyCount, g.rallyBannerTimer, g.animGlitchActive, g.glitchColor)
    }

    function loop() { update(); render(); g.animId = requestAnimationFrame(loop) }
    g.animId = requestAnimationFrame(loop)
  }, [scheduleNewBall, endGame, onGoal, runAnim])

  // Keyboard
  useEffect(() => {
    const g = gameRef.current
    function onKeyDown(e: KeyboardEvent) {
      g.keys[e.key] = true
      if (["ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault()
      if (g.phase === "PLAYING" && g.ctrlMode === "drag") {
        const speed = 15
        if (e.key === "ArrowUp" || e.key === "w") { if (g.player) g.player.dragTargetY -= speed }
        if (e.key === "ArrowDown" || e.key === "s") { if (g.player) g.player.dragTargetY += speed }
      }
      if (e.code === "Space" && g.player && !g.goalAnimating) g.player.hyperPressed = true
      if ((e.key === "Escape" || e.key === "p") && g.phase === "PLAYING" && !g.goalAnimating) {
        g.phase = "PAUSED"; setPhase("PAUSED"); audioRef.current?.stopBGM()
      } else if ((e.key === "Escape" || e.key === "p") && g.phase === "PAUSED") {
        g.phase = "PLAYING"; setPhase("PLAYING"); audioRef.current?.startBGM()
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      g.keys[e.key] = false
      if (e.code === "Space" && g.player) g.player.hyperPressed = false
    }
    window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp)
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp) }
  }, [])

  // Touch drag
  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const g = gameRef.current
    function handleTS(e: TouchEvent) {
      if (g.phase !== "PLAYING" || g.goalAnimating) return
      for (let i = 0; i < e.changedTouches.length; i++) {
        const tch = e.changedTouches[i]
        if (g.ctrlMode === "drag" && g.dragTouchId === null) {
          g.dragTouchId = tch.identifier
          if (g.player) { const rect = c.getBoundingClientRect(); g.player.dragTargetY = (tch.clientY - rect.top) * (c.height / rect.height) - g.player.h / 2 }
          e.preventDefault()
        }
      }
    }
    function handleTM(e: TouchEvent) {
      if (g.phase !== "PLAYING" || g.goalAnimating) return
      for (let i = 0; i < e.changedTouches.length; i++) {
        const tch = e.changedTouches[i]
        if (g.ctrlMode === "drag" && tch.identifier === g.dragTouchId && g.player) {
          const rect = c.getBoundingClientRect(); g.player.dragTargetY = (tch.clientY - rect.top) * (c.height / rect.height) - g.player.h / 2
          e.preventDefault()
        }
      }
    }
    function handleTE(e: TouchEvent) { for (let i = 0; i < e.changedTouches.length; i++) { if (e.changedTouches[i].identifier === g.dragTouchId) g.dragTouchId = null } }
    c.addEventListener("touchstart", handleTS, { passive: false })
    c.addEventListener("touchmove", handleTM, { passive: false })
    c.addEventListener("touchend", handleTE, { passive: false })
    c.addEventListener("touchcancel", handleTE, { passive: false })
    return () => { c.removeEventListener("touchstart", handleTS); c.removeEventListener("touchmove", handleTM); c.removeEventListener("touchend", handleTE); c.removeEventListener("touchcancel", handleTE) }
  }, [])

  // Visibility
  useEffect(() => {
    function onVis() {
      if (document.hidden) audioRef.current?.kill()
      else if (gameRef.current.phase === "PLAYING") audioRef.current?.revive()
    }
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [])

  const goMenu = useCallback(() => {
    const g = gameRef.current
    if (g.animId !== null) { cancelAnimationFrame(g.animId); g.animId = null }
    if (g.hyperTimer) clearInterval(g.hyperTimer)
    if (g.ballSpawnTimer) clearInterval(g.ballSpawnTimer)
    audioRef.current?.stopBGM(); g.phase = "MENU"; setPhase("MENU"); setWinner(null)
  }, [])

  const togglePause = useCallback(() => {
    const g = gameRef.current
    if (g.phase === "PLAYING") { g.phase = "PAUSED"; setPhase("PAUSED"); audioRef.current?.stopBGM() }
    else if (g.phase === "PAUSED") { g.phase = "PLAYING"; setPhase("PLAYING"); audioRef.current?.startBGM() }
  }, [])

  // Garage actions
  const buySkin = useCallback((id: string) => {
    const sk = SKINS[id]; if (!sk) return
    const newCoins = coins - sk.price
    const newSkins = [...unlockedSkins, id]
    setCoins(newCoins); setUnlockedSkins(newSkins); setEquippedSkin(id); setSelectedGarageSkin(id)
    saveGameData(newCoins, stage, newSkins, id)
  }, [coins, unlockedSkins, stage])

  const equipSkin = useCallback((id: string) => {
    setEquippedSkin(id); setSelectedGarageSkin(id)
    saveGameData(coins, stage, unlockedSkins, id)
  }, [coins, stage, unlockedSkins])

  // Sorted skins
  const sortedSkins = Object.keys(SKINS).sort((a, b) => {
    const ai = TIER_ORDER.indexOf(SKINS[a].tier); const bi = TIER_ORDER.indexOf(SKINS[b].tier)
    if (ai !== bi) return ai - bi; return SKINS[a].price - SKINS[b].price
  })

  const hyperStacks = gameRef.current.player?.hyperStacks ?? MAX_HYPER_STACKS
  const hyperCooldown = gameRef.current.player ? (gameRef.current.player.hyperCooldown / HYPER_COOLDOWN_MS) * 100 : 0

  return (
    <div className="min-h-screen bg-[#000] text-[#fff] flex flex-col items-center justify-center select-none" style={{ fontFamily: "'Orbitron', monospace" }}>
      {/* Back */}
      <div className="w-full max-w-[820px] px-4 mb-2">
        <Link href="/" className="text-[10px] text-[#888] hover:text-[#00ff88] transition-colors" style={{ fontFamily: "inherit" }}>
          {"<"} KEMBALI
        </Link>
      </div>

      {/* HUD */}
      {(phase === "PLAYING" || phase === "PAUSED" || phase === "GAMEOVER") && (
        <div className="w-full max-w-[820px] flex items-center px-4 mb-2 gap-1.5" style={{ fontSize: "clamp(8px, 2vw, 12px)", height: "clamp(38px, 8vh, 55px)", background: "rgba(5,2,10,.96)", borderBottom: "2px solid rgba(0,229,255,.18)" }}>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[#00ff88]" style={{ fontSize: "clamp(16px, 4.5vw, 28px)", fontWeight: 900, textShadow: "0 0 8px #00ff88" }}>{playerScore}</span>
            <div className="flex gap-[3px]">{Array.from({ length: WIN_SCORE }).map((_, i) => <div key={i} className="rounded-full" style={{ width: "clamp(5px, 1.3vw, 9px)", height: "clamp(5px, 1.3vw, 9px)", border: `2px solid ${i < playerScore ? "#00ff88" : "rgba(0,255,136,.3)"}`, background: i < playerScore ? "#00ff88" : "transparent", boxShadow: i < playerScore ? "0 0 4px #00ff88" : "none" }} />)}</div>
          </div>
          <div className="flex flex-col items-center leading-tight">
            <span className="text-[rgba(255,255,255,.38)]" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(6px, 1.3vw, 10px)", fontWeight: 700 }}>VS</span>
            <span style={{ fontSize: "clamp(5px, 1vw, 8px)", color: "#ff7700" }}>{gameRef.current.mode === "ARCADE" ? `STAGE ${stage}` : "QUICK PLAY"}</span>
          </div>
          <div className="flex-1 flex items-center gap-2 flex-row-reverse">
            <span className="text-[#ff0066]" style={{ fontSize: "clamp(16px, 4.5vw, 28px)", fontWeight: 900, textShadow: "0 0 8px #ff0066" }}>{aiScore}</span>
            <div className="flex gap-[3px]">{Array.from({ length: WIN_SCORE }).map((_, i) => <div key={i} className="rounded-full" style={{ width: "clamp(5px, 1.3vw, 9px)", height: "clamp(5px, 1.3vw, 9px)", border: `2px solid ${i < aiScore ? "#ff0066" : "rgba(255,0,102,.3)"}`, background: i < aiScore ? "#ff0066" : "transparent", boxShadow: i < aiScore ? "0 0 4px #ff0066" : "none" }} />)}</div>
          </div>
          <button onClick={togglePause} className="text-[rgba(255,255,255,.6)] border border-[rgba(255,255,255,.2)] px-2 py-1 rounded hover:text-[#fff] transition-colors shrink-0" style={{ fontFamily: "inherit", fontSize: "clamp(10px, 2vw, 14px)" }}>||</button>
        </div>
      )}

      {/* Canvas area */}
      <div className="relative" style={{ width: "min(95vw, 820px)", aspectRatio: `${VW}/${VH}` }}>
        <canvas ref={canvasRef} width={VW} height={VH} className="block w-full h-full rounded-lg" style={{ backgroundColor: BG_DARK, imageRendering: "pixelated" }} />

        {/* CRT scanline */}
        <div className="absolute inset-0 pointer-events-none z-10 rounded-lg" style={{
          background: "linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.18) 50%), linear-gradient(90deg, rgba(255,0,0,0.04), rgba(0,255,0,0.015), rgba(0,0,255,0.04))",
          backgroundSize: "100% 4px, 3px 100%", boxShadow: "inset 0 0 50px rgba(0,0,0,0.7)",
        }} />

        {/* ===== MENU ===== */}
        {phase === "MENU" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 text-center p-4 rounded-lg overflow-y-auto" style={{ background: "rgba(9,5,20,0.97)" }}>
            {/* Grid bg animation */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: "linear-gradient(rgba(0,229,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,.07) 1px, transparent 1px)",
              backgroundSize: "44px 44px", animation: "gd 18s linear infinite",
            }} />
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,.97) 100%)" }} />
            <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-[400px]">
              <h1 className="font-black" style={{ fontSize: "clamp(2.2rem, 9vw, 4rem)", letterSpacing: ".12em", color: "#00ff88", textShadow: "0 0 25px #00ff88", animation: "lp 2s ease-in-out infinite" }}>NEON PONG</h1>
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(.42rem, 1.6vw, .65rem)", letterSpacing: ".28em", color: "#00e5ff", textShadow: "0 0 8px #00e5ff" }}>8-BIT EPIC EDITION</p>
              <div className="flex gap-2">
                <span className="px-3.5 py-1 rounded-md text-[#ffee00] border border-[rgba(255,238,0,.3)]" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(.58rem, 1.8vw, .75rem)", background: "rgba(255,238,0,.1)" }}>COINS: {coins}</span>
                <span className="px-3.5 py-1 rounded-md text-[#ff7700] border border-[#ff7700]" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(.58rem, 1.8vw, .75rem)", background: "rgba(255,119,0,.1)" }}>STAGE: {stage}</span>
              </div>
              <button onClick={() => { audioRef.current?.init(); startGame("ARCADE") }} className="w-full py-3 rounded-lg font-black uppercase" style={{ fontSize: "clamp(.72rem, 2.8vw, 1rem)", letterSpacing: ".18em", background: "rgba(255,119,0,.05)", border: "2px solid #ff7700", color: "#ff7700", boxShadow: "0 0 12px rgba(255,119,0,.18)", cursor: "pointer" }}>
                ARCADE (ST.{stage})
              </button>
              <button onClick={() => { audioRef.current?.init(); startGame("QUICK") }} className="w-full py-3 rounded-lg font-black uppercase" style={{ fontSize: "clamp(.72rem, 2.8vw, 1rem)", letterSpacing: ".18em", background: "rgba(0,255,136,.05)", border: "2px solid #00ff88", color: "#00ff88", boxShadow: "0 0 12px rgba(0,255,136,.18)", cursor: "pointer" }}>
                QUICK PLAY
              </button>
              <div className="flex gap-2 w-full">
                <button onClick={() => { setSelectedGarageSkin(equippedSkin); setPhase("GARAGE") }} className="flex-1 py-2.5 rounded-md font-bold uppercase" style={{ fontSize: "clamp(.5rem, 1.8vw, .66rem)", letterSpacing: ".12em", border: "2px solid #00e5ff", color: "#00e5ff", background: "transparent", boxShadow: "0 0 8px rgba(0,229,255,.18)", cursor: "pointer" }}>
                  GARAGE
                </button>
                <button onClick={() => setPhase("SETTINGS")} className="flex-1 py-2.5 rounded-md font-bold uppercase" style={{ fontSize: "clamp(.5rem, 1.8vw, .66rem)", letterSpacing: ".12em", border: "1px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.7)", background: "transparent", cursor: "pointer" }}>
                  SETTING
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== GARAGE ===== */}
        {phase === "GARAGE" && (
          <div className="absolute inset-0 flex flex-col items-center justify-start z-30 p-3 rounded-lg overflow-y-auto" style={{ background: "rgba(9,5,20,0.97)" }}>
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,229,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,.07) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
            <div className="relative z-10 w-full max-w-[420px] flex flex-col gap-2">
              <div className="p-3 rounded-lg" style={{ background: "rgba(15,10,35,.88)", border: "1px solid rgba(255,0,102,.28)" }}>
                <div className="text-center font-black mb-2" style={{ color: "#ffee00", fontSize: ".9rem", letterSpacing: ".08em", textShadow: "0 0 8px #ffee00" }}>NEON GARAGE</div>
                <div className="text-center mb-2" style={{ fontFamily: "'Share Tech Mono', monospace", color: "#ffee00", fontSize: ".72rem" }}>COINS: {coins}</div>
                <canvas ref={garageCanvasRef} width={340} height={120} className="w-full rounded-lg mb-2" style={{ border: "1px solid rgba(0,229,255,.28)", background: "#030108", height: "120px" }} />
                {/* Skin info */}
                {SKINS[selectedGarageSkin] && (
                  <div className="text-center mb-2">
                    <div className="font-black" style={{ fontSize: ".95rem", letterSpacing: ".1em", color: TIERS[SKINS[selectedGarageSkin].tier].clr }}>{SKINS[selectedGarageSkin].name}</div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: ".65rem", color: TIERS[SKINS[selectedGarageSkin].tier].clr }}>{TIERS[SKINS[selectedGarageSkin].tier].label}</div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: ".55rem", color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>{SKINS[selectedGarageSkin].desc}</div>
                  </div>
                )}
                {/* Skin grid */}
                <div className="grid grid-cols-3 gap-1.5 max-h-[220px] overflow-y-auto mb-3" style={{ scrollbarWidth: "none" }}>
                  {sortedSkins.map(id => {
                    const sk = SKINS[id]; const tr = TIERS[sk.tier]; const isOwned = unlockedSkins.includes(id)
                    const stageOk = sk.unlockStage === 0 || stage >= (sk.bonusStage || sk.unlockStage) || isOwned
                    return (
                      <button key={id} onClick={() => setSelectedGarageSkin(id)} className="p-1.5 rounded-md text-center transition-all" style={{
                        background: selectedGarageSkin === id ? tr.bg : "rgba(255,255,255,.03)",
                        border: `1px solid ${selectedGarageSkin === id ? tr.clr : tr.br}`,
                        boxShadow: selectedGarageSkin === id ? `0 0 10px ${tr.bg}` : "none",
                        opacity: isOwned ? 1 : 0.55, filter: isOwned ? "none" : "grayscale(.6)", cursor: "pointer",
                      }}>
                        <div className="font-black" style={{ fontSize: ".6rem", color: isOwned ? tr.clr : "#888", letterSpacing: ".04em" }}>{sk.name}</div>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: ".5rem", color: tr.clr }}>{tr.label}</div>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: ".52rem", color: "#ffee00" }}>
                          {isOwned ? "OWNED" : !stageOk ? `ST.${sk.bonusStage || sk.unlockStage}` : sk.isRamadan ? `BONUS ST.${sk.bonusStage}` : `${sk.price}`}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {/* Buy/Equip button */}
                {(() => {
                  const sk = SKINS[selectedGarageSkin]; if (!sk) return null
                  const isOwned = unlockedSkins.includes(selectedGarageSkin)
                  const isEquipped = selectedGarageSkin === equippedSkin
                  const stageOk = sk.unlockStage === 0 || stage >= (sk.bonusStage || sk.unlockStage) || isOwned
                  if (isEquipped) return <div className="w-full py-2.5 text-center rounded-lg font-black" style={{ background: "rgba(255,255,255,.08)", border: "2px solid #fff", color: "#fff", fontSize: "clamp(.6rem, 2vw, .85rem)" }}>EQUIPPED</div>
                  if (isOwned) return <button onClick={() => equipSkin(selectedGarageSkin)} className="w-full py-2.5 rounded-lg font-black uppercase" style={{ background: "rgba(0,255,136,.05)", border: "2px solid #00ff88", color: "#00ff88", cursor: "pointer", fontSize: "clamp(.6rem, 2vw, .85rem)" }}>EQUIP</button>
                  if (!stageOk) return <div className="w-full py-2.5 text-center rounded-lg font-black" style={{ background: "rgba(100,100,100,.08)", border: "2px solid #555", color: "#555", fontSize: "clamp(.6rem, 2vw, .85rem)" }}>UNLOCK ST.{sk.bonusStage || sk.unlockStage}</div>
                  if (sk.isRamadan) return <div className="w-full py-2.5 text-center rounded-lg font-black" style={{ border: "2px solid #ffee00", color: "#ffee00", fontSize: "clamp(.6rem, 2vw, .85rem)" }}>BONUS ST.{sk.bonusStage}</div>
                  if (coins >= sk.price) return <button onClick={() => buySkin(selectedGarageSkin)} className="w-full py-2.5 rounded-lg font-black uppercase" style={{ background: "rgba(255,238,0,.08)", border: "2px solid #ffee00", color: "#ffee00", cursor: "pointer", fontSize: "clamp(.6rem, 2vw, .85rem)" }}>BUY ({sk.price})</button>
                  return <div className="w-full py-2.5 text-center rounded-lg font-black" style={{ background: "rgba(255,0,102,.08)", border: "2px solid #ff0066", color: "#ff0066", fontSize: "clamp(.6rem, 2vw, .85rem)" }}>NEED {sk.price}</div>
                })()}
              </div>
              <button onClick={() => setPhase("MENU")} className="w-full py-2.5 rounded-md font-bold uppercase" style={{ fontSize: "clamp(.5rem, 1.8vw, .66rem)", letterSpacing: ".12em", border: "2px solid #00e5ff", color: "#00e5ff", background: "transparent", cursor: "pointer" }}>KEMBALI</button>
            </div>
          </div>
        )}

        {/* ===== SETTINGS ===== */}
        {phase === "SETTINGS" && (
          <div className="absolute inset-0 flex flex-col items-center justify-start z-30 p-3 rounded-lg overflow-y-auto" style={{ background: "rgba(9,5,20,0.97)" }}>
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,229,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,.07) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
            <div className="relative z-10 w-full max-w-[420px] flex flex-col gap-2.5">
              <div className="p-3 rounded-lg" style={{ background: "rgba(15,10,35,.88)", border: "1px solid rgba(255,0,102,.28)" }}>
                <div className="font-black mb-2.5" style={{ color: "#ff0066", fontSize: ".9rem", letterSpacing: ".08em", textShadow: "0 0 8px rgba(255,0,102,.45)" }}>TIPE KONTROL</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {(["dpad", "drag"] as const).map(m => (
                    <button key={m} onClick={() => setCtrlMode(m)} className="px-3 py-1.5 rounded transition-all" style={{
                      fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(.42rem, 1.4vw, .58rem)",
                      border: `1px solid ${ctrlMode === m ? "#00e5ff" : "rgba(255,255,255,.2)"}`,
                      color: ctrlMode === m ? "#00e5ff" : "rgba(255,255,255,.6)",
                      background: ctrlMode === m ? "rgba(0,229,255,.13)" : "transparent", cursor: "pointer",
                    }}>{m.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(15,10,35,.88)", border: "1px solid rgba(255,0,102,.28)" }}>
                <div className="font-black mb-2.5" style={{ color: "#ff0066", fontSize: ".9rem", letterSpacing: ".08em", textShadow: "0 0 8px rgba(255,0,102,.45)" }}>QUICK PLAY AI</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {(["easy", "normal", "hard"] as const).map(d => (
                    <button key={d} onClick={() => setDifficulty(d)} className="px-3 py-1.5 rounded transition-all uppercase" style={{
                      fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(.42rem, 1.4vw, .58rem)",
                      border: `1px solid ${difficulty === d ? "#00e5ff" : "rgba(255,255,255,.2)"}`,
                      color: difficulty === d ? "#00e5ff" : "rgba(255,255,255,.6)",
                      background: difficulty === d ? "rgba(0,229,255,.13)" : "transparent", cursor: "pointer",
                    }}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(15,10,35,.88)", border: "1px solid rgba(255,0,102,.28)" }}>
                <div className="font-black mb-2.5" style={{ color: "#ff0066", fontSize: ".9rem", letterSpacing: ".08em", textShadow: "0 0 8px rgba(255,0,102,.45)" }}>AUDIO</div>
                <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                  {BGM_DEFS.map((tk, i) => (
                    <button key={tk.name} onClick={() => { setBgmIdx(i); audioRef.current?.init(); audioRef.current?.setBGMTrack(i) }} className="px-3 py-1.5 rounded transition-all" style={{
                      fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(.42rem, 1.4vw, .58rem)",
                      border: `1px solid ${bgmIdx === i ? "#00e5ff" : "rgba(255,255,255,.2)"}`,
                      color: bgmIdx === i ? "#00e5ff" : "rgba(255,255,255,.6)",
                      background: bgmIdx === i ? "rgba(0,229,255,.13)" : "transparent", cursor: "pointer",
                    }}>{tk.name}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2.5">
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(.42rem, 1.2vw, .58rem)", color: "rgba(255,255,255,.6)", flexShrink: 0, width: 55, textAlign: "left" }}>VOL</span>
                  <input type="range" min={0} max={100} defaultValue={75} onChange={e => audioRef.current?.setVolume(+e.target.value)} className="flex-1" style={{ accentColor: "#00e5ff" }} />
                </div>
              </div>
              <button onClick={() => setPhase("MENU")} className="w-full py-2.5 rounded-md font-bold uppercase" style={{ fontSize: "clamp(.5rem, 1.8vw, .66rem)", letterSpacing: ".12em", border: "2px solid #00e5ff", color: "#00e5ff", background: "transparent", cursor: "pointer" }}>KEMBALI</button>
            </div>
          </div>
        )}

        {/* ===== PAUSED ===== */}
        {phase === "PAUSED" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 text-center p-5 rounded-lg" style={{ background: "rgba(5,2,10,0.88)" }}>
            <div className="p-8 rounded-lg" style={{ border: "2px solid rgba(0,229,255,.28)", background: "rgba(15,10,30,.96)", width: "min(94%, 370px)" }}>
              <h2 className="font-black mb-2" style={{ fontSize: "clamp(1.4rem, 5.5vw, 2.3rem)", letterSpacing: ".18em", color: "#00e5ff" }}>PAUSE</h2>
              <p className="mb-5" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(.45rem, 1.5vw, .65rem)", letterSpacing: ".18em", color: "rgba(255,255,255,.55)" }}>GAME DIJEDA</p>
              <div className="flex flex-col gap-2.5">
                <button onClick={togglePause} className="w-full py-3 rounded-lg font-black uppercase" style={{ background: "rgba(0,255,136,.05)", border: "2px solid #00ff88", color: "#00ff88", cursor: "pointer", fontSize: "clamp(.72rem, 2.8vw, 1rem)", letterSpacing: ".18em" }}>LANJUTKAN</button>
                <button onClick={() => { audioRef.current?.stopBGM(); startGame(gameRef.current.mode) }} className="w-full py-2.5 rounded-md font-bold uppercase" style={{ border: "1px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.7)", background: "transparent", cursor: "pointer", fontSize: "clamp(.5rem, 1.8vw, .66rem)" }}>MULAI ULANG</button>
                <button onClick={goMenu} className="w-full py-2.5 rounded-md font-bold uppercase" style={{ border: "1px solid #ff0066", color: "#ff0066", background: "transparent", cursor: "pointer", fontSize: "clamp(.5rem, 1.8vw, .66rem)" }}>MENU UTAMA</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== GAMEOVER ===== */}
        {phase === "GAMEOVER" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 text-center p-5 rounded-lg" style={{ background: "rgba(5,2,10,0.88)" }}>
            <div className="p-8 rounded-lg" style={{ border: "2px solid rgba(0,229,255,.28)", background: "rgba(15,10,30,.96)", width: "min(94%, 370px)" }}>
              <div className="font-black mb-1" style={{ fontSize: "clamp(1.4rem, 6.5vw, 2.6rem)", letterSpacing: ".13em", color: winner === "PLAYER" ? "#00ff88" : "#ff0066" }}>
                {winner === "PLAYER" ? "VICTORY" : "DEFEAT"}
              </div>
              <div className="mb-1.5" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(.42rem, 1.4vw, .62rem)", letterSpacing: ".18em", color: winner === "PLAYER" ? "#ffee00" : "rgba(255,255,255,.55)" }}>
                {winner === "PLAYER" ? `+${coinReward} COINS ACQUIRED` : "SYSTEM BLOCKED"}
              </div>
              {newUnlocks.length > 0 && (
                <div className="mb-2" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(.38rem, 1.2vw, .57rem)", color: "#ffee00" }}>
                  UNLOCKED: {newUnlocks.join(" | ")}
                </div>
              )}
              <div className="flex justify-center gap-3 mb-5" style={{ fontSize: "clamp(2rem, 9vw, 3.8rem)", fontWeight: 900 }}>
                <span className="text-[#00ff88]">{playerScore}</span>
                <span className="text-[rgba(255,255,255,.38)]">:</span>
                <span className="text-[#ff0066]">{aiScore}</span>
              </div>
              {showGameoverBtns && (
                <div className="flex flex-col gap-2.5">
                  <button onClick={() => { audioRef.current?.stopBGM(); startGame(gameRef.current.mode) }} className="w-full py-3 rounded-lg font-black uppercase" style={{ background: "rgba(0,255,136,.05)", border: "2px solid #00ff88", color: "#00ff88", cursor: "pointer", fontSize: "clamp(.72rem, 2.8vw, 1rem)", letterSpacing: ".18em" }}>
                    {winner === "PLAYER" && gameRef.current.mode === "ARCADE" ? "NEXT STAGE" : "REPLAY"}
                  </button>
                  <button onClick={goMenu} className="w-full py-2.5 rounded-md font-bold uppercase" style={{ border: "1px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.7)", background: "transparent", cursor: "pointer", fontSize: "clamp(.5rem, 1.8vw, .66rem)" }}>MENU UTAMA</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== MOBILE CONTROLS ===== */}
      {phase === "PLAYING" && (
        <div className="flex md:hidden items-end justify-between w-full max-w-[820px] px-4 mt-3" style={{ paddingBottom: "clamp(16px, 5vw, 32px)" }}>
          {ctrlMode === "dpad" ? (
            <div className="flex flex-col gap-3">
              <button onTouchStart={e => { e.preventDefault(); gameRef.current.dpadUp = true }} onTouchEnd={() => { gameRef.current.dpadUp = false }} className="w-[62px] h-[62px] flex items-center justify-center rounded-full text-[#00e5ff] text-[24px] active:scale-90 active:bg-[rgba(0,229,255,.38)] transition-transform" style={{ background: "rgba(0,229,255,.1)", border: "2px solid rgba(0,229,255,.38)", opacity: 0.7 }} aria-label="Up">{"▲"}</button>
              <button onTouchStart={e => { e.preventDefault(); gameRef.current.dpadDown = true }} onTouchEnd={() => { gameRef.current.dpadDown = false }} className="w-[62px] h-[62px] flex items-center justify-center rounded-full text-[#00e5ff] text-[24px] active:scale-90 active:bg-[rgba(0,229,255,.38)] transition-transform" style={{ background: "rgba(0,229,255,.1)", border: "2px solid rgba(0,229,255,.38)", opacity: 0.7 }} aria-label="Down">{"▼"}</button>
            </div>
          ) : (
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "8px", color: "#555" }}>DRAG CANVAS</div>
          )}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex gap-1.5">
              {Array.from({ length: MAX_HYPER_STACKS }).map((_, i) => (
                <div key={i} className="rounded-sm transition-colors" style={{ width: "clamp(10px, 2.5vw, 16px)", height: 4, background: i < hyperStacks ? "#ff7700" : "rgba(255,255,255,.18)", boxShadow: i < hyperStacks ? "0 0 5px #ff7700" : "none" }} />
              ))}
            </div>
            <div className="w-full h-[3px] rounded-sm overflow-hidden" style={{ background: "rgba(0,0,0,.5)", border: "1px solid rgba(255,255,255,.18)" }}>
              <div className="h-full transition-[width] duration-100" style={{ width: `${hyperStacks >= MAX_HYPER_STACKS ? 100 : hyperCooldown}%`, background: hyperStacks >= MAX_HYPER_STACKS ? "#00ff88" : "#ffee00" }} />
            </div>
            <button
              onTouchStart={e => { e.preventDefault(); if (gameRef.current.player && !gameRef.current.goalAnimating) gameRef.current.player.hyperPressed = true }}
              onTouchEnd={() => { if (gameRef.current.player) gameRef.current.player.hyperPressed = false }}
              className="flex flex-col items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{
                width: "calc(62px * 1.18)", height: "calc(62px * 1.18)",
                background: hyperStacks > 0 ? "rgba(255,119,0,.22)" : "rgba(255,119,0,.14)",
                border: `3px solid ${hyperStacks > 0 ? "#ffee00" : "rgba(255,119,0,.55)"}`,
                color: "#ff7700", opacity: 0.7,
              }}
              aria-label="Hyper Strike"
            >
              <span style={{ fontSize: "calc(62px * .48)", lineHeight: 1 }}>{"⚡"}</span>
              <span style={{ fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: "calc(62px * .13)", letterSpacing: ".08em" }}>HYPER</span>
            </button>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes gd { to { background-position: 44px 44px } }
        @keyframes lp { 0%, 100% { text-shadow: 0 0 18px #00ff88 } 50% { text-shadow: 0 0 38px #00ff88 } }
      `}</style>
    </div>
  )
}
