// Full audio engine matching original: 5 BGM tracks, all SFX including goal streaks, boss, rally, comeback

type BGMNote = [number, number, number, OscillatorType] // [freq, dur, vol, type]

export interface BGMDef { name: string; notes: BGMNote[] | null; bpm: number }

const T_CYBORG: BGMNote[] = [[523,.1,.3,"square"],[523,.1,.3,"square"],[523,.1,.28,"square"],[440,.2,.32,"square"],[523,.1,.3,"square"],[587,.1,.28,"square"],[659,.2,.32,"square"],[494,.1,.25,"square"],[494,.1,.25,"square"],[440,.1,.28,"square"]]
const T_STRIKE: BGMNote[] = [[987,.08,.32,"sawtooth"],[987,.08,.32,"sawtooth"],[1174,.08,.3,"sawtooth"],[987,.08,.32,"sawtooth"],[880,.08,.28,"sawtooth"],[784,.16,.3,"sawtooth"],[784,.08,.28,"sawtooth"],[880,.08,.28,"sawtooth"],[987,.16,.32,"sawtooth"]]
const T_BLOCKY: BGMNote[] = [[698,.15,.28,"square"],[523,.075,.22,"square"],[587,.075,.22,"square"],[659,.15,.28,"square"],[587,.075,.22,"square"],[523,.075,.22,"square"],[494,.15,.28,"square"],[494,.075,.22,"square"],[587,.075,.22,"square"],[698,.15,.28,"square"],[659,.075,.22,"square"],[587,.075,.22,"square"],[523,.15,.25,"square"]]
const T_KNIGHT: BGMNote[] = [[440,.12,.28,"square"],[587,.06,.25,"square"],[740,.12,.3,"square"],[659,.06,.25,"square"],[587,.12,.28,"square"],[494,.12,.25,"square"],[440,.24,.3,"square"]]
const T_RAMADAN: BGMNote[] = [[523,.15,.3,"sine"],[659,.1,.28,"sine"],[784,.15,.32,"sine"],[880,.1,.28,"sine"],[784,.1,.25,"sine"],[659,.15,.3,"sine"],[523,.2,.32,"sine"]]

export const BGM_DEFS: BGMDef[] = [
  { name: "CYBORG", notes: T_CYBORG, bpm: 200 },
  { name: "STRIKE", notes: T_STRIKE, bpm: 260 },
  { name: "BLOCKY", notes: T_BLOCKY, bpm: 280 },
  { name: "KNIGHT", notes: T_KNIGHT, bpm: 220 },
  { name: "RAMADAN", notes: T_RAMADAN, bpm: 160 },
  { name: "OFF", notes: null, bpm: 0 },
]

export class PongAudioEngine {
  ctx: AudioContext | null = null
  masterGain: GainNode | null = null
  muted = false
  bgmPlaying = false
  bgmTimer: ReturnType<typeof setTimeout> | null = null
  bgmNoteI = 0
  bgmIdx = 4

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.75
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === "suspended") this.ctx.resume()
  }

  setVolume(v: number) { if (this.masterGain) this.masterGain.gain.value = v * 0.01 * 0.88 }
  setBGMTrack(idx: number) { this.bgmIdx = idx; this.stopBGM(); if (BGM_DEFS[idx].notes) this.startBGM() }

  rawTone(freq: number, type: OscillatorType, dur: number, vol: number, fEnd?: number) {
    if (!this.ctx || !this.masterGain || this.muted) return
    try {
      const start = this.ctx.currentTime
      const o = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      o.type = type
      o.frequency.setValueAtTime(freq, start)
      if (fEnd) o.frequency.linearRampToValueAtTime(fEnd, start + dur)
      g.gain.setValueAtTime(0, start)
      g.gain.linearRampToValueAtTime(vol, start + 0.005)
      g.gain.setValueAtTime(vol, start + dur * 0.7)
      g.gain.exponentialRampToValueAtTime(0.001, start + dur)
      o.connect(g); g.connect(this.masterGain)
      o.start(start); o.stop(start + dur)
    } catch { /* silence */ }
  }

  t(freq: number, type: OscillatorType, dur: number, vol = 0.25, fEnd?: number) {
    if (!this.muted && this.ctx) this.rawTone(freq, type, dur, vol, fEnd)
  }

  // SFX
  paddle() { this.t(300, "square", 0.04, 0.3); this.t(600, "square", 0.03, 0.2) }
  paddleHard() { this.t(200, "square", 0.05, 0.5); this.t(800, "sawtooth", 0.05, 0.35) }
  wall() { this.t(150, "square", 0.06, 0.3, 80) }
  hyper() { this.t(80, "sawtooth", 0.08, 0.5); this.t(200, "sawtooth", 0.1, 0.4); this.t(500, "square", 0.1, 0.3); this.t(1200, "square", 0.08, 0.2) }
  score() { this.t(300, "square", 0.06, 0.4); this.t(500, "square", 0.06, 0.35) }
  ready() { [262, 330, 392, 523].forEach((f, i) => setTimeout(() => this.t(f, "square", 0.15, 0.3), i * 120)); setTimeout(() => this.t(659, "square", 0.3, 0.35), 480) }
  go() { this.t(523, "square", 0.05, 0.4); this.t(659, "square", 0.05, 0.4); this.t(784, "square", 0.05, 0.4); setTimeout(() => this.t(1047, "square", 0.4, 0.5), 120) }
  win() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => setTimeout(() => this.t(f, "square", 0.15, 0.35), i * 100)) }
  lose() { [440, 330, 262, 196].forEach((f, i) => setTimeout(() => this.t(f, "sawtooth", 0.2, 0.3), i * 100)) }
  rallyAlert() { this.t(800, "sawtooth", 0.1, 0.4); this.t(1200, "sawtooth", 0.15, 0.45) }
  bossAppears() { this.t(100, "sawtooth", 1.0, 0.6); this.t(80, "square", 1.5, 0.5) }
  comeback() { for (let i = 0; i < 6; i++) setTimeout(() => this.t(110 * Math.pow(1.3, i), "sawtooth", 0.1, 0.35), i * 80) }

  // Goal streak SFX
  goal1() { [440, 550, 660].forEach((f, i) => setTimeout(() => this.t(f, "square", 0.12, 0.3), i * 80)) }
  goal2() { [330, 415, 523, 659].forEach((f, i) => setTimeout(() => { this.t(f, "square", 0.1, 0.32); this.t(f * 2, "triangle", 0.08, 0.15) }, i * 70)) }
  goal3() { [262, 330, 392, 494, 659, 784].forEach((f, i) => setTimeout(() => { this.t(f, "square", 0.09, 0.35); this.t(f * 1.5, "sawtooth", 0.07, 0.15) }, i * 60)); setTimeout(() => { this.t(1047, "square", 0.3, 0.4); this.t(784, "square", 0.3, 0.35) }, 360) }
  goal4() { for (let i = 0; i < 8; i++) setTimeout(() => { const f = 200 + Math.random() * 800; this.t(f, "square", 0.08, 0.3); this.t(f * 2, "sawtooth", 0.06, 0.2) }, i * 50); setTimeout(() => { this.t(1047, "square", 0.5, 0.5); this.t(784, "square", 0.5, 0.4); this.t(523, "square", 0.5, 0.35) }, 400) }
  goal5() { for (let i = 0; i < 12; i++) setTimeout(() => { this.t(100 + i * 120, "sawtooth", 0.07, 0.3 + i * 0.02); this.t(200 + i * 80, "square", 0.06, 0.2) }, i * 40); setTimeout(() => { this.t(1047, "square", 0.6, 0.55); this.t(1319, "square", 0.6, 0.5); this.t(1568, "square", 0.6, 0.45) }, 480) }
  goalHigh() { for (let i = 0; i < 20; i++) setTimeout(() => { this.t(100 + Math.random() * 2000, "square", 0.05, 0.25 + Math.random() * 0.15) }, i * 30) }

  goalSFX(streak: number) {
    if (streak >= 6) this.goalHigh()
    else if (streak >= 5) this.goal5()
    else if (streak >= 4) this.goal4()
    else if (streak >= 3) this.goal3()
    else if (streak >= 2) this.goal2()
    else this.goal1()
  }

  getGoalKey(s: number): string {
    if (s >= 6) return "goalHigh"
    if (s >= 5) return "goal5"
    if (s >= 4) return "goal4"
    if (s >= 3) return "goal3"
    if (s >= 2) return "goal2"
    return "goal1"
  }

  // BGM
  startBGM() {
    if (this.bgmPlaying || this.muted || !this.ctx) return
    const def = BGM_DEFS[this.bgmIdx]
    if (!def.notes) return
    this.bgmPlaying = true; this.bgmNoteI = 0; this.scheduleBGM()
  }

  private scheduleBGM() {
    if (!this.bgmPlaying || this.muted || !this.ctx) return
    const def = BGM_DEFS[this.bgmIdx]
    if (!def.notes) return
    const n = def.notes[this.bgmNoteI]
    const mspb = 60000 / def.bpm
    const dur = (n[1] * mspb / 100) || 0.1
    if (n[0] > 0) this.rawTone(n[0], n[3], dur, n[2])
    this.bgmNoteI = (this.bgmNoteI + 1) % def.notes.length
    this.bgmTimer = setTimeout(() => this.scheduleBGM(), dur * 1000)
  }

  stopBGM() { this.bgmPlaying = false; if (this.bgmTimer) { clearTimeout(this.bgmTimer); this.bgmTimer = null } }
  kill() { this.stopBGM(); if (this.ctx?.state === "running") this.ctx.suspend() }
  revive() { if (this.ctx?.state === "suspended") this.ctx.resume(); if (!this.bgmPlaying) this.startBGM() }
}
