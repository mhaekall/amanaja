import { SKINS } from "./constants"
import type { Paddle, Ball, Particle, Shockwave } from "./entities"
import { spawnFx, spawnShockwave } from "./entities"
import type { PongAudioEngine } from "./audio-engine"

export interface GameRefs {
  rallyCount: number; hitStop: number; shakeDec: number
  screenFlash: number; screenFlashColor: string
  animGlitchActive: boolean; glitchColor: string
}

function triggerHyperEffect(
  ball: Ball, paddle: Paddle,
  particles: Particle[], shockwaves: Shockwave[],
  audio: PongAudioEngine | null, refs: GameRefs,
) {
  refs.shakeDec = 22; refs.hitStop = 6
  ball.isHyper = true; ball.color = "#fff"
  audio?.hyper()

  const sx = ball.x, sy = ball.y + 5
  const sk = SKINS[paddle.skin]
  const tier = sk ? sk.tier : "BIASA"

  switch (tier) {
    case "BIASA":
      spawnFx(particles, sx, sy, "#ff0066", 22)
      spawnShockwave(shockwaves, sx, sy, "#ff0066")
      refs.screenFlash = 0.28; refs.screenFlashColor = "#ff0066"
      break
    case "ANDAL":
      spawnFx(particles, sx, sy, sk!.clr, 32, "fast")
      spawnShockwave(shockwaves, sx, sy, sk!.glow)
      refs.screenFlash = 0.3; refs.screenFlashColor = sk!.clr
      break
    case "LANGKA":
      spawnFx(particles, sx, sy, sk!.clr, 42, "fire")
      spawnShockwave(shockwaves, sx, sy, sk!.glow)
      spawnShockwave(shockwaves, sx, sy, "#fff")
      refs.screenFlash = 0.36; refs.screenFlashColor = sk!.clr
      refs.shakeDec = 28
      break
    case "SAKTI":
      spawnFx(particles, sx, sy, sk!.clr, 58, "fast")
      for (let i = 0; i < 3; i++) spawnShockwave(shockwaves, sx, sy, [sk!.clr, "#fff", sk!.glow][i])
      refs.screenFlash = 0.44; refs.screenFlashColor = sk!.clr
      refs.shakeDec = 34; refs.hitStop = 8
      break
    case "MAHAKUASA":
      spawnFx(particles, sx, sy, sk!.clr, 75, "fast")
      for (let i = 0; i < 4; i++) spawnShockwave(shockwaves, sx, sy, ["#ff7700", "#fff", sk!.clr, sk!.glow][i])
      refs.screenFlash = 0.52; refs.screenFlashColor = sk!.clr
      refs.shakeDec = 40; refs.hitStop = 10
      refs.animGlitchActive = true; refs.glitchColor = sk!.clr
      setTimeout(() => { refs.animGlitchActive = false }, 275)
      break
    case "DEWA": case "RAMADAN":
      spawnFx(particles, sx, sy, "#fff", 95, "fast")
      for (let i = 0; i < 5; i++) setTimeout(() => spawnShockwave(shockwaves, sx, sy, ["#fff", "#ff00ff", "#00ffff", "#ffee00", sk!.clr][i]), i * 38)
      refs.screenFlash = 0.65; refs.screenFlashColor = "#fff"
      refs.shakeDec = 48; refs.hitStop = 12
      refs.animGlitchActive = true; refs.glitchColor = "#fff"
      setTimeout(() => { refs.animGlitchActive = false }, 400)
      break
    default:
      spawnFx(particles, sx, sy, "#ff0066", 22)
      spawnShockwave(shockwaves, sx, sy, "#ff0066")
      refs.screenFlash = 0.28; refs.screenFlashColor = "#ff0066"
  }
}

export function collideBall(
  ball: Ball, paddle: Paddle,
  particles: Particle[], shockwaves: Shockwave[],
  audio: PongAudioEngine | null,
  refs: GameRefs,
  currentStage: number, gameMode: string, aiDifficulty: string,
): boolean {
  const r = ball.size / 2
  const cx = ball.x + r, cy = ball.y + r
  const pcx = ball.prevX + r, pcy = ball.prevY + r
  const px = paddle.x, py = paddle.y, pw = paddle.w, ph = paddle.h
  let hit = false, intersectY = cy

  if (!paddle.isAI) {
    if (ball.dx < 0) {
      const pR = px + pw
      if (pcx - r >= pR && cx - r <= pR) {
        const tT = (pR - (pcx - r)) / (cx - pcx)
        const yAC = pcy + tT * (cy - pcy)
        if (yAC >= py - r && yAC <= py + ph + r) { hit = true; intersectY = yAC }
      } else if (cx - r <= pR && cx + r >= px && cy + r >= py && cy - r <= py + ph) { hit = true }
    }
  } else {
    if (ball.dx > 0) {
      const pL = px
      if (pcx + r <= pL && cx + r >= pL) {
        const tT = (pL - (pcx + r)) / (cx - pcx)
        const yAC = pcy + tT * (cy - pcy)
        if (yAC >= py - r && yAC <= py + ph + r) { hit = true; intersectY = yAC }
      } else if (cx + r >= pL && cx - r <= px + pw && cy + r >= py && cy - r <= py + ph) { hit = true }
    }
  }

  if (hit) {
    ball.x = paddle.isAI ? px - ball.size : px + pw
    ball.dx *= -1
    const rel = (intersectY - (py + ph / 2)) / (ph / 2)
    ball.dy = rel * 6
    ball.dy += paddle.vy * 0.25
    ball.dy = Math.max(-10, Math.min(10, ball.dy))
    refs.rallyCount++

    if (refs.rallyCount === 10) {
      audio?.rallyAlert()
      refs.screenFlash = 0.4; refs.screenFlashColor = "#ff7700"; refs.shakeDec = 30
    }
    if (refs.rallyCount >= 10) {
      ball.mult += 0.15
      if (!ball.isHyper) ball.color = "#ff7700"
    } else {
      ball.mult = Math.min(ball.mult + 0.1, ball.isHyper ? 4.0 : 3.0)
    }

    if (!paddle.isAI) {
      if (paddle.hyperPressed && paddle.hyperStacks > 0) {
        paddle.hyperStacks--; paddle.hyperCooldown = 0
        triggerHyperEffect(ball, paddle, particles, shockwaves, audio, refs)
      } else {
        ball.isHyper = false
        if (refs.rallyCount < 10) ball.color = "#fff"
        audio?.paddleHard()
        spawnFx(particles, ball.x, ball.y + 6, paddle.color, 10)
        refs.shakeDec = 5; refs.hitStop = 2
      }
    } else {
      let aHC = 0
      if (paddle.isBoss && paddle.hyperStacks > 0) aHC = 0.4
      else if (gameMode === "ARCADE") aHC = currentStage * 0.05
      else { switch (aiDifficulty) { case "normal": aHC = 0.2; break; case "hard": aHC = 0.5; break } }

      if (ball.mult > 1.8 && Math.random() < aHC && paddle.hyperStacks > 0) {
        paddle.hyperStacks--
        paddle.hyperPressed = true
        setTimeout(() => { paddle.hyperPressed = false }, 200)
        triggerHyperEffect(ball, paddle, particles, shockwaves, audio, refs)
      } else {
        ball.isHyper = false
        if (refs.rallyCount < 10) ball.color = "#fff"
        audio?.paddle()
        spawnFx(particles, ball.x, ball.y + 6, paddle.color, 8)
        refs.hitStop = 1
      }
    }
    return true
  }
  return false
}
