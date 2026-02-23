import type { Paddle, Ball, Particle, Shockwave } from "./entities"
import { spawnFx, spawnShockwave } from "./entities"
import type { PongAudioEngine } from "./audio-engine"

export function collideBall(
  ball: Ball,
  paddle: Paddle,
  particles: Particle[],
  shockwaves: Shockwave[],
  audio: PongAudioEngine | null,
  rallyCount: { value: number },
  hitStop: { value: number },
  shakeDecay: { value: number },
  screenFlash: { value: number },
  screenFlashColor: { value: string },
): boolean {
  const r = ball.size / 2
  const cx = ball.x + r
  const cy = ball.y + r
  const pcx = ball.prevX + r
  const pcy = ball.prevY + r
  const px = paddle.x
  const py = paddle.y
  const pw = paddle.w
  const ph = paddle.h
  let hit = false
  let intersectY = cy

  if (!paddle.isAI) {
    const pR = px + pw
    if (ball.dx < 0) {
      if (pcx - r >= pR && cx - r <= pR) {
        const tT = (pR - (pcx - r)) / (cx - pcx)
        const yAC = pcy + tT * (cy - pcy)
        if (yAC >= py - r && yAC <= py + ph + r) { hit = true; intersectY = yAC }
      } else if (cx - r <= pR && cx + r >= px && cy + r >= py && cy - r <= py + ph) {
        hit = true
      }
    }
  } else {
    const pL = px
    if (ball.dx > 0) {
      if (pcx + r <= pL && cx + r >= pL) {
        const tT = (pL - (pcx + r)) / (cx - pcx)
        const yAC = pcy + tT * (cy - pcy)
        if (yAC >= py - r && yAC <= py + ph + r) { hit = true; intersectY = yAC }
      } else if (cx + r >= pL && cx - r <= px + pw && cy + r >= py && cy - r <= py + ph) {
        hit = true
      }
    }
  }

  if (hit) {
    ball.x = paddle.isAI ? px - ball.size : px + pw
    ball.dx *= -1
    const rel = (intersectY - (py + ph / 2)) / (ph / 2)
    ball.dy = rel * 6
    ball.dy += paddle.vy * 0.25
    ball.dy = Math.max(-10, Math.min(10, ball.dy))
    rallyCount.value++

    if (rallyCount.value >= 10) {
      ball.mult += 0.15
      if (!ball.isHyper) ball.color = "#ff7700"
    } else {
      ball.mult = Math.min(ball.mult + 0.1, ball.isHyper ? 4.0 : 3.0)
    }

    if (!paddle.isAI) {
      if (paddle.hyperPressed && paddle.hyperStacks > 0) {
        paddle.hyperStacks--
        paddle.hyperCooldown = 0
        // Hyper effect
        shakeDecay.value = 22
        ball.isHyper = true
        ball.color = "#fff"
        audio?.hyper()
        spawnFx(particles, ball.x, ball.y + 5, "#ff0066", 22)
        spawnShockwave(shockwaves, ball.x, ball.y + 5, "#ff0066")
        screenFlash.value = 0.28
        screenFlashColor.value = "#ff0066"
        hitStop.value = 6
      } else {
        ball.isHyper = false
        if (rallyCount.value < 10) ball.color = "#fff"
        audio?.paddle()
        spawnFx(particles, ball.x, ball.y + 6, paddle.color, 10)
        shakeDecay.value = 5
        hitStop.value = 2
      }
    } else {
      // AI hyper chance
      const aHC = paddle.isBoss && paddle.hyperStacks > 0 ? 0.4 : 0
      if (ball.mult > 1.8 && Math.random() < aHC && paddle.hyperStacks > 0) {
        paddle.hyperStacks--
        paddle.hyperPressed = true
        setTimeout(() => { paddle.hyperPressed = false }, 200)
        shakeDecay.value = 22
        ball.isHyper = true
        ball.color = "#fff"
        audio?.hyper()
        spawnFx(particles, ball.x, ball.y + 5, "#ff0066", 22)
        spawnShockwave(shockwaves, ball.x, ball.y + 5, "#ff0066")
        screenFlash.value = 0.28
        screenFlashColor.value = "#ff0066"
        hitStop.value = 6
      } else {
        ball.isHyper = false
        if (rallyCount.value < 10) ball.color = "#fff"
        audio?.paddle()
        spawnFx(particles, ball.x, ball.y + 6, paddle.color, 8)
        hitStop.value = 1
      }
    }
    return true
  }
  return false
}
