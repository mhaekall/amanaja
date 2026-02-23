// components/neon-pong-preview.tsx
"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

export default function NeonPongPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext("2d")
    if (!ctx) return

    let animId: number
    const W = 300, H = 200
    
    let p1 = { y: H / 2 - 25, targetY: H / 2 }
    let p2 = { y: H / 2 - 25, targetY: H / 2 }
    let ball = { x: W / 2, y: H / 2, dx: 3, dy: 2 }

    function loop() {
      // Basic AI
      if (ball.dx < 0) p1.targetY = ball.y - 25
      else p1.targetY = H / 2 - 25

      if (ball.dx > 0) p2.targetY = ball.y - 25
      else p2.targetY = H / 2 - 25

      p1.y += (p1.targetY - p1.y) * 0.1
      p2.y += (p2.targetY - p2.y) * 0.1

      // Ball physics
      ball.x += ball.dx
      ball.y += ball.dy

      if (ball.y <= 0 || ball.y >= H - 6) ball.dy *= -1
      
      // Paddle Collision
      if (ball.x <= 15 && ball.y >= p1.y && ball.y <= p1.y + 50) ball.dx *= -1
      if (ball.x >= W - 20 && ball.y >= p2.y && ball.y <= p2.y + 50) ball.dx *= -1
      
      // Reset
      if (ball.x < 0 || ball.x > W) {
        ball.x = W / 2; ball.y = H / 2
        ball.dx *= -1
      }

      // Draw
      ctx!.fillStyle = "#090514"
      ctx!.fillRect(0, 0, W, H)

      ctx!.fillStyle = "rgba(0, 229, 255, 0.2)"
      for (let i = 0; i < H; i += 20) ctx!.fillRect(W / 2 - 1, i, 2, 10)

      ctx!.fillStyle = "#00e5ff"
      ctx!.fillRect(5, p1.y, 10, 50)
      
      ctx!.fillStyle = "#ff0066"
      ctx!.fillRect(W - 15, p2.y, 10, 50)

      ctx!.fillStyle = "#fff"
      ctx!.fillRect(ball.x, ball.y, 6, 6)

      animId = requestAnimationFrame(loop)
    }
    
    loop()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div className="bg-[#090514] border border-[#00e5ff]/20 rounded-2xl p-4 flex flex-col items-center gap-4 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-[#00e5ff]/5 to-transparent pointer-events-none" />
      <h3 className="text-xl font-black tracking-widest text-[#00e5ff] font-['Orbitron',_sans-serif]">NEON PONG</h3>
      <div className="bg-black rounded-xl border border-[#00e5ff]/30 shadow-[0_0_15px_rgba(0,229,255,0.15)] overflow-hidden">
        <canvas ref={canvasRef} width={300} height={200} className="block w-full" />
      </div>
      <Link href="/games/neon-pong" className="mt-2 w-full py-2.5 text-center bg-[#00e5ff]/10 text-[#00e5ff] font-bold rounded-lg border border-[#00e5ff]/40 hover:bg-[#00e5ff]/20 transition-all font-['Share_Tech_Mono']">
        MAIN SEKARANG
      </Link>
    </div>
  )
}
