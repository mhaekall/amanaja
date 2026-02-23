export class PongAudioEngine {
  ctx: AudioContext | null = null
  masterGain: GainNode | null = null
  muted = false
  bgmPlaying = false
  bgmTimer: ReturnType<typeof setTimeout> | null = null
  bgmNoteI = 0

  readonly BGM_NOTES: [number, number, number, OscillatorType][] = [
    [523, 0.1, 0.3, "square"], [523, 0.1, 0.3, "square"], [523, 0.1, 0.28, "square"],
    [440, 0.2, 0.32, "square"], [523, 0.1, 0.3, "square"], [587, 0.1, 0.28, "square"],
    [659, 0.2, 0.32, "square"], [494, 0.1, 0.25, "square"], [494, 0.1, 0.25, "square"],
    [440, 0.1, 0.28, "square"],
  ]

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.6
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === "suspended") this.ctx.resume()
  }

  rawTone(freq: number, type: OscillatorType, dur: number, vol: number) {
    if (!this.ctx || !this.masterGain || this.muted) return
    try {
      const t = this.ctx.currentTime
      const o = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      o.type = type
      o.frequency.setValueAtTime(freq, t)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(vol, t + 0.005)
      g.gain.setValueAtTime(vol, t + dur * 0.7)
      g.gain.exponentialRampToValueAtTime(0.001, t + dur)
      o.connect(g)
      g.connect(this.masterGain)
      o.start(t)
      o.stop(t + dur)
    } catch { /* silence */ }
  }

  paddle() { this.rawTone(300, "square", 0.04, 0.3); this.rawTone(600, "square", 0.03, 0.2) }
  wall() { this.rawTone(150, "square", 0.06, 0.3) }
  hyper() { this.rawTone(80, "sawtooth", 0.08, 0.5); this.rawTone(200, "sawtooth", 0.1, 0.4); this.rawTone(500, "square", 0.1, 0.3) }
  score() { this.rawTone(300, "square", 0.06, 0.4); this.rawTone(500, "square", 0.06, 0.35) }
  ready() { [262, 330, 392, 523].forEach((f, i) => setTimeout(() => this.rawTone(f, "square", 0.15, 0.3), i * 120)) }
  go() { this.rawTone(523, "square", 0.05, 0.4); this.rawTone(659, "square", 0.05, 0.4); setTimeout(() => this.rawTone(1047, "square", 0.4, 0.5), 120) }
  win() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => setTimeout(() => this.rawTone(f, "square", 0.15, 0.35), i * 100)) }
  lose() { [440, 330, 262, 196].forEach((f, i) => setTimeout(() => this.rawTone(f, "sawtooth", 0.2, 0.3), i * 100)) }

  goalSFX(streak: number) {
    const tones: [number, OscillatorType, number, number][][] = [
      [[440, "square", 0.12, 0.3], [550, "square", 0.12, 0.3], [660, "square", 0.12, 0.3]],
      [[330, "square", 0.1, 0.32], [415, "square", 0.1, 0.32], [523, "square", 0.1, 0.32], [659, "square", 0.1, 0.32]],
      [[262, "square", 0.09, 0.35], [330, "square", 0.09, 0.35], [392, "square", 0.09, 0.35], [494, "square", 0.09, 0.35]],
    ]
    const idx = Math.min(streak, tones.length - 1)
    tones[idx].forEach(([f, tp, d, v], i) => setTimeout(() => this.rawTone(f, tp, d, v), i * 80))
  }

  startBGM() {
    if (this.bgmPlaying || this.muted || !this.ctx) return
    this.bgmPlaying = true
    this.bgmNoteI = 0
    this.scheduleBGM()
  }

  private scheduleBGM() {
    if (!this.bgmPlaying || this.muted || !this.ctx) return
    const n = this.BGM_NOTES[this.bgmNoteI]
    const dur = n[1]
    if (n[0] > 0) this.rawTone(n[0], n[3], dur, n[2])
    this.bgmNoteI = (this.bgmNoteI + 1) % this.BGM_NOTES.length
    this.bgmTimer = setTimeout(() => this.scheduleBGM(), dur * 1000)
  }

  stopBGM() {
    this.bgmPlaying = false
    if (this.bgmTimer) { clearTimeout(this.bgmTimer); this.bgmTimer = null }
  }

  kill() { this.stopBGM(); if (this.ctx?.state === "running") this.ctx.suspend() }
  revive() { if (this.ctx?.state === "suspended") this.ctx.resume() }
}
