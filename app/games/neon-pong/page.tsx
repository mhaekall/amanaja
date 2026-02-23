// app/games/neon-pong/page.tsx
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import Head from "next/head"

/* =====================================================
   CONSTANTS & CONFIG
   ===================================================== */
const VW = 820
const VH = 461
const WIN_SCORE = 5
const MAX_HYPER_STACKS = 3
const HYPER_COOLDOWN_MS = 5000

/* =====================================================
   AUDIO ENGINE
   ===================================================== */
class AudioEngine {
  ctx: AudioContext | null = null
  masterGain: GainNode | null = null
  muted = false
  bgmPlaying = false

  init() {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.5
    this.masterGain.connect(this.ctx.destination)
    if (this.ctx.state === "suspended") this.ctx.resume()
  }

  rawTone(freq: number, type: OscillatorType, start: number, dur: number, vol: number) {
    if (!this.ctx || this.muted || !this.masterGain) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, start)
    g.gain.setValueAtTime(0, start)
    g.gain.linearRampToValueAtTime(vol, start + 0.005)
    g.gain.setValueAtTime(vol, start + dur * 0.7)
    g.gain.exponentialRampToValueAtTime(0.001, start + dur)
    o.connect(g)
    g.connect(this.masterGain)
    o.start(start)
    o.stop(start + dur)
  }

  playTone(freq: number, type: OscillatorType = "square", dur = 0.1, vol = 0.25) {
    if (!this.ctx || this.muted) return
    this.rawTone(freq, type, this.ctx.currentTime, dur, vol)
  }

  sfx = {
    paddle: () => { this.playTone(300, 'square', 0.04, 0.3); this.playTone(600, 'square', 0.03, 0.2) },
    wall: () => { this.playTone(150, 'square', 0.06, 0.3) },
    score: () => { this.playTone(300, 'square', 0.06, 0.4); this.playTone(500, 'square', 0.06, 0.35) },
    hyper: () => { this.playTone(80, 'sawtooth', 0.08, 0.5); this.playTone(500, 'square', 0.1, 0.3) },
    win: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.playTone(f, 'square', 0.15, 0.35), i * 100)) },
    lose: () => { [440, 330, 262, 196].forEach((f, i) => setTimeout(() => this.playTone(f, 'sawtooth', 0.2, 0.3), i * 100)) },
  }
}

/* =====================================================
   TYPES & GAME ENTITIES
   ===================================================== */
type GameState = "MENU" | "PLAYING" | "PAUSED" | "GAMEOVER" | "GARAGE" | "SETTINGS"

export default function NeonPongPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>("MENU")
  const [playerScore, setPlayerScore] = useState(0)
  const [aiScore, setAiScore] = useState(0)
  const [hyperStacks, setHyperStacks] = useState(3)
  const [hyperCooldown, setHyperCooldown] = useState(0)
  const [currentStage, setCurrentStage] = useState(1)
  const [coins, setCoins] = useState(0)
  
  const [goverMsg, setGoverMsg] = useState({ title: "", sub: "" })

  const gameRef = useRef({
    player: { y: VH / 2 - 45, vy: 0, score: 0, h: 90 },
    ai: { y: VH / 2 - 45, vy: 0, score: 0, h: 90 },
    ball: { x: VW / 2, y: VH / 2, dx: 0, dy: 0, speed: 6.5, mult: 1, isHyper: false },
    particles: [] as any[],
    shake: 0,
    hyperPressed: false,
    animFrameId: null as number | null,
    timeTick: 0,
  })

  const audioRef = useRef<AudioEngine | null>(null)

  useEffect(() => {
    audioRef.current = new AudioEngine()
    setCoins(parseInt(localStorage.getItem('neonProgCoins') || '0', 10))
    return () => {
      if (gameRef.current.animFrameId) cancelAnimationFrame(gameRef.current.animFrameId)
    }
  }, [])

  const spawnParticles = useCallback((x: number, y: number, color: string, amount: number) => {
    const g = gameRef.current
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 6 + 2
      g.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0, decay: Math.random() * 0.05 + 0.02, color, size: Math.random() * 4 + 2
      })
    }
  }, [])

  const resetBall = useCallback((dir: number) => {
    const b = gameRef.current.ball
    b.x = VW / 2; b.y = VH / 2
    b.mult = 1; b.isHyper = false
    const angle = (Math.random() * 0.5 - 0.25)
    b.dx = Math.cos(angle) * b.speed * dir
    b.dy = Math.sin(angle) * b.speed
  }, [])

  const startGame = useCallback(() => {
    const g = gameRef.current
    if (g.animFrameId !== null) cancelAnimationFrame(g.animFrameId)
    
    g.player.score = 0; g.ai.score = 0; g.player.y = VH/2 - 45; g.ai.y = VH/2 - 45;
    g.particles = []; g.shake = 0;
    setPlayerScore(0); setAiScore(0); setHyperStacks(3); setHyperCooldown(0);
    
    audioRef.current?.init()
    resetBall(-1)
    setGameState("PLAYING")

    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return

    function gameLoop() {
      if (gameState === "PAUSED" || gameState === "GAMEOVER") return
      g.timeTick++
      
      // Update Physics
      const p = g.player; const ai = g.ai; const b = g.ball

      // AI Logic
      const aiCenter = ai.y + ai.h / 2
      if (b.dx > 0) {
        ai.y += (b.y - aiCenter) * 0.08
      } else {
        ai.y += (VH / 2 - aiCenter) * 0.04
      }
      ai.y = Math.max(0, Math.min(VH - ai.h, ai.y))

      // Ball Update
      b.x += b.dx * b.mult
      b.y += b.dy * b.mult

      if (b.y <= 0 || b.y >= VH - 12) {
        b.dy *= -1; audioRef.current?.sfx.wall(); g.shake = 5
      }

      // Collisions
      const hitPaddle = (paddle: any, isPlayer: boolean) => {
        if (b.y + 12 >= paddle.y && b.y <= paddle.y + paddle.h) {
          b.dx *= -1
          b.mult = Math.min(b.mult + 0.1, 3.5)
          let rel = ((b.y + 6) - (paddle.y + paddle.h / 2)) / (paddle.h / 2)
          b.dy = rel * 6
          
          if (isPlayer && g.hyperPressed) {
             setHyperStacks(prev => {
                if (prev > 0) {
                   b.isHyper = true; b.mult = 4; audioRef.current?.sfx.hyper(); g.shake = 15;
                   spawnParticles(b.x, b.y, "#ff0066", 20)
                   return prev - 1
                }
                return prev
             })
             g.hyperPressed = false
          } else {
             audioRef.current?.sfx.paddle()
             spawnParticles(b.x, b.y, isPlayer ? "#00e5ff" : "#ff0066", 10)
          }
          if (isPlayer) b.x = 28 + 14 // push outside
          else b.x = VW - 28 - 14 - 12
        }
      }

      if (b.x <= 28 + 14 && b.dx < 0) hitPaddle(p, true)
      if (b.x + 12 >= VW - 28 - 14 && b.dx > 0) hitPaddle(ai, false)

      // Scoring
      if (b.x < 0) {
        ai.score++; setAiScore(ai.score); audioRef.current?.sfx.score()
        if (ai.score >= WIN_SCORE) return endMatch(false)
        resetBall(1)
      } else if (b.x > VW) {
        p.score++; setPlayerScore(p.score); audioRef.current?.sfx.score()
        if (p.score >= WIN_SCORE) return endMatch(true)
        resetBall(-1)
      }

      // Particles Update
      g.particles.forEach(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.life -= pt.decay })
      g.particles = g.particles.filter(pt => pt.life > 0)

      // Draw
      ctx.fillStyle = "#090514"; ctx.fillRect(0, 0, VW, VH)
      ctx.save()
      if (g.shake > 0) {
        ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake)
        g.shake -= 0.5
      }

      // Center Line
      ctx.fillStyle = 'rgba(0, 229, 255, 0.2)'
      for (let i = 0; i < VH; i += 35) ctx.fillRect(VW / 2 - 2, i, 4, 20)

      // Paddles
      ctx.fillStyle = "#00e5ff"; ctx.fillRect(28, p.y, 14, p.h)
      ctx.fillStyle = "#ff0066"; ctx.fillRect(VW - 28 - 14, ai.y, 14, ai.h)

      // Ball
      ctx.fillStyle = b.isHyper ? "#ff0066" : "#fff"; ctx.fillRect(b.x, b.y, 12, 12)

      // Particles
      g.particles.forEach(pt => {
        ctx.globalAlpha = Math.max(0, pt.life)
        ctx.fillStyle = pt.color
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size)
      })
      ctx.globalAlpha = 1
      ctx.restore()

      g.animFrameId = requestAnimationFrame(gameLoop)
    }

    g.animFrameId = requestAnimationFrame(gameLoop)
  }, [spawnParticles, resetBall])

  const endMatch = (win: boolean) => {
    setGameState("GAMEOVER")
    if (win) {
       audioRef.current?.sfx.win()
       const reward = 20 + currentStage * 5
       setCoins(c => {
         const nc = c + reward
         localStorage.setItem('neonProgCoins', String(nc))
         return nc
       })
       setCurrentStage(s => s + 1)
       setGoverMsg({ title: "VICTORY", sub: `+${reward} COINS ACQUIRED` })
    } else {
       audioRef.current?.sfx.lose()
       setGoverMsg({ title: "DEFEAT", sub: "SYSTEM BLOCKED" })
    }
  }

  // Pointer Events (Touch/Mouse)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const handleMove = (e: PointerEvent) => {
      if (gameState !== "PLAYING") return
      const rect = c.getBoundingClientRect()
      const scaleY = c.height / rect.height
      const y = (e.clientY - rect.top) * scaleY
      gameRef.current.player.y = Math.max(0, Math.min(VH - 90, y - 45))
    }
    c.addEventListener("pointermove", handleMove)
    return () => c.removeEventListener("pointermove", handleMove)
  }, [gameState])

  // Keyboard Space for Hyper
  useEffect(() => {
     const onDown = (e: KeyboardEvent) => { if (e.code === 'Space') gameRef.current.hyperPressed = true }
     window.addEventListener('keydown', onDown)
     return () => window.removeEventListener('keydown', onDown)
  }, [])

  return (
    <div className="min-h-screen bg-[#000] text-[#fff] flex flex-col items-center justify-center font-mono select-none" style={{ fontFamily: "'Orbitron', monospace" }}>
      <Head><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet" /></Head>
      
      <div className="w-full max-w-[820px] px-4 mb-3 flex justify-between items-end">
        <Link href="/" className="text-[12px] text-gray-500 hover:text-[#00e5ff] transition-colors font-['Share_Tech_Mono']">
          &larr; KEMBALI
        </Link>
        <div className="text-[#ffee00] text-sm font-['Share_Tech_Mono']">💰 COINS: {coins}</div>
      </div>

      <div className="relative w-full max-w-[820px] aspect-video bg-[#090514] border-2 border-[#00e5ff]/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,229,255,0.15)]">
        
        {/* HUD Layer */}
        {gameState === "PLAYING" && (
          <div className="absolute top-0 inset-x-0 h-12 bg-black/60 border-b border-[#00e5ff]/20 flex items-center justify-between px-6 z-20">
             <div className="flex items-center gap-4">
                <span className="text-3xl font-black text-[#00e5ff] drop-shadow-[0_0_8px_#00e5ff]">{playerScore}</span>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[#ffee00] text-xs font-['Share_Tech_Mono'] tracking-widest">STAGE {currentStage}</span>
                <span className="text-white/40 text-[10px]">VS</span>
             </div>
             <div className="flex items-center gap-4">
                <span className="text-3xl font-black text-[#ff0066] drop-shadow-[0_0_8px_#ff0066]">{aiScore}</span>
             </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={VW}
          height={VH}
          className="block w-full h-full touch-none"
        />

        {/* Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] mix-blend-screen" />

        {/* MENU */}
        {gameState === "MENU" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-5">
            <h1 className="text-5xl md:text-7xl font-black text-[#00ff88] drop-shadow-[0_0_20px_#00ff88] mb-2 tracking-widest text-center">NEON PONG</h1>
            <p className="text-[#00e5ff] font-['Share_Tech_Mono'] tracking-[0.3em] mb-10 text-sm">8-BIT EPIC EDITION</p>
            
            <button onClick={startGame} className="w-64 py-4 bg-[#00ff88]/10 border-2 border-[#00ff88] text-[#00ff88] font-bold text-lg rounded-lg hover:bg-[#00ff88]/20 hover:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,136,0.3)] mb-4">
              ▶ ARCADE MODE
            </button>
            <button onClick={startGame} className="w-64 py-4 bg-[#00e5ff]/10 border border-[#00e5ff]/50 text-[#00e5ff] font-bold rounded-lg hover:bg-[#00e5ff]/20 transition-all">
              ▶ QUICK PLAY
            </button>
          </div>
        )}

        {/* GAMEOVER */}
        {gameState === "GAMEOVER" && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-30 p-5">
            <div className={`text-5xl font-black mb-2 ${goverMsg.title === 'VICTORY' ? 'text-[#00ff88] drop-shadow-[0_0_15px_#00ff88]' : 'text-[#ff0066] drop-shadow-[0_0_15px_#ff0066]'}`}>
               {goverMsg.title}
            </div>
            <div className="text-[#ffee00] font-['Share_Tech_Mono'] mb-8 tracking-widest">{goverMsg.sub}</div>
            
            <div className="text-4xl font-bold mb-10">
               <span className="text-[#00e5ff]">{playerScore}</span> <span className="text-white/30">:</span> <span className="text-[#ff0066]">{aiScore}</span>
            </div>

            <button onClick={startGame} className="w-64 py-4 bg-[#00ff88]/10 border-2 border-[#00ff88] text-[#00ff88] font-bold rounded-lg hover:bg-[#00ff88]/20 transition-all mb-3">
              ▶ {goverMsg.title === 'VICTORY' ? 'NEXT STAGE' : 'COBA LAGI'}
            </button>
            <button onClick={() => setGameState("MENU")} className="w-64 py-3 bg-transparent border border-white/20 text-white/50 font-bold rounded-lg hover:bg-white/5 transition-all">
              ⌂ MENU UTAMA
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="w-full max-w-[820px] mt-4 flex justify-between px-4">
         <div className="text-white/30 text-xs max-w-[200px] leading-relaxed">
            <strong className="text-white/60">Kontrol:</strong> Sentuh dan geser layar untuk memindahkan paddle.
         </div>
         <button 
           onTouchStart={(e) => { e.preventDefault(); gameRef.current.hyperPressed = true }}
           onMouseDown={() => gameRef.current.hyperPressed = true}
           className="w-20 h-20 rounded-full border-4 border-[#ff7700] bg-[#ff7700]/20 flex flex-col items-center justify-center text-[#ff7700] active:bg-[#ff7700]/50 active:scale-90 transition-all"
         >
            <span className="text-2xl">⚡</span>
            <span className="text-[10px] font-black mt-1">HYPER</span>
         </button>
      </div>
    </div>
  )
}
