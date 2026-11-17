/**
 * ระบบเสียงของเกม (Web Audio)
 *
 *   loops/one-shots ─┬─ music bus ── duck ──┐
 *                    ├─ ambience bus ───────┼── master ── ลำโพง
 *                    └─ sfx bus ────────────┘
 *
 * - เพลงถูกตั้งให้เบากว่าเสียงเอฟเฟกต์เสมอ และจะ "หลบ" (duck) ลงชั่วครู่เมื่อมีเสียงเอฟเฟกต์
 * - เปลี่ยนช่วงเวลา → เสียงเก่าค่อย ๆ จางออก เสียงใหม่ค่อย ๆ ดังขึ้น
 * - ไม่มีไฟล์ → ใช้เสียงสังเคราะห์ (ถ้ามี) หรือเงียบ ไม่ error
 */
import type { LoopLayer, OneShotLayer } from '../content/soundscape'
import { createSynth, playCall, type CallKind } from './synth'

const AUDIO_DIR = '/audio/'
const FADE = 2.5 // วินาที
const DUCK_LEVEL = 0.35 // เพลงเหลือกี่ % ตอนมีเสียงเอฟเฟกต์

export interface Volumes {
  musicOn: boolean
  music: number
  ambience: number
  sfx: number
}

interface ActiveLoop {
  gain: GainNode
  stop: () => void
}

class AudioEngine {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private buses!: Record<'music' | 'ambience' | 'sfx', GainNode>
  private duck!: GainNode
  private buffers = new Map<string, Promise<AudioBuffer | null>>()
  private loops = new Map<string, ActiveLoop>()
  private oneShotTimers = new Map<string, number>()
  private wanted: { loops: LoopLayer[]; oneShots: OneShotLayer[] } = { loops: [], oneShots: [] }
  private volumes: Volumes = { musicOn: true, music: 0.6, ambience: 0.8, sfx: 1 }

  /** เบราว์เซอร์ต้องให้ผู้เล่นกด/คลิกก่อน จึงจะเล่นเสียงได้ */
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.connect(this.ctx.destination)
      this.duck = this.ctx.createGain()
      this.duck.connect(this.master)
      this.buses = {
        music: this.ctx.createGain(),
        ambience: this.ctx.createGain(),
        sfx: this.ctx.createGain(),
      }
      this.buses.music.connect(this.duck)
      this.buses.ambience.connect(this.master)
      this.buses.sfx.connect(this.master)
      this.applyVolumes()
      this.sync()
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  get unlocked() {
    return !!this.ctx && this.ctx.state === 'running'
  }

  setVolumes(v: Volumes) {
    this.volumes = v
    this.applyVolumes()
  }

  private applyVolumes() {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const { musicOn, music, ambience, sfx } = this.volumes
    // เพลงคูณ 0.7 เพิ่ม เพื่อให้เบากว่าเสียงธรรมชาติ/เอฟเฟกต์เสมอ
    this.buses.music.gain.setTargetAtTime(musicOn ? music * 0.7 : 0, t, 0.2)
    this.buses.ambience.gain.setTargetAtTime(ambience, t, 0.2)
    this.buses.sfx.gain.setTargetAtTime(sfx, t, 0.2)
  }

  /** กำหนดชุดเสียงที่ควรเล่นตอนนี้ (เรียกซ้ำได้ ระบบจะเทียบแล้วเปลี่ยนเฉพาะที่ต่าง) */
  setScene(loops: LoopLayer[], oneShots: OneShotLayer[]) {
    this.wanted = { loops, oneShots }
    this.sync()
  }

  /** เล่นเสียงเอฟเฟกต์ครั้งเดียว (เพลงหลบลงชั่วครู่) */
  async playSfx(file: string, volume = 1) {
    if (!this.ctx) return
    const buf = await this.load(file)
    if (!buf || !this.ctx) return
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const g = this.ctx.createGain()
    g.gain.value = volume
    src.connect(g).connect(this.buses.sfx)
    src.start()
    this.duckFor(buf.duration)
  }

  /** เสียงร้องสัตว์: ใช้ไฟล์ถ้ามี ไม่งั้นใช้เสียงสังเคราะห์ (ถ้ามี) ไม่งั้นเงียบ */
  async playCallOrFile(file: string, synth: CallKind | undefined, volume = 0.7) {
    if (!this.ctx) return
    const buf = await this.load(file)
    if (buf) {
      void this.playSfx(file, volume)
      return
    }
    if (!synth || !this.ctx) return
    const g = this.ctx.createGain()
    g.gain.value = volume
    g.connect(this.buses.sfx)
    const dur = playCall(this.ctx, g, synth)
    this.duckFor(dur)
    window.setTimeout(() => g.disconnect(), (dur + 0.5) * 1000)
  }

  stopAll() {
    this.setScene([], [])
  }

  // ---------- ภายใน ----------

  private duckFor(seconds: number) {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.duck.gain.cancelScheduledValues(t)
    this.duck.gain.setTargetAtTime(DUCK_LEVEL, t, 0.15)
    this.duck.gain.setTargetAtTime(1, t + seconds, 0.8)
  }

  private load(file: string): Promise<AudioBuffer | null> {
    let p = this.buffers.get(file)
    if (!p) {
      p = fetch(AUDIO_DIR + file)
        .then((r) => {
          const type = r.headers.get('content-type') ?? ''
          if (!r.ok || type.includes('text/html')) return null
          return r.arrayBuffer()
        })
        .then((ab) => (ab && this.ctx ? this.ctx.decodeAudioData(ab) : null))
        .catch(() => null)
      this.buffers.set(file, p)
    }
    return p
  }

  private sync() {
    if (!this.ctx) return
    const wantIds = new Set(this.wanted.loops.map((l) => l.id))

    // จางเสียงที่ไม่ต้องการออก
    for (const [id, loop] of this.loops) {
      if (!wantIds.has(id)) {
        this.fadeOutAndStop(loop)
        this.loops.delete(id)
      }
    }
    // เริ่มเสียงใหม่
    for (const layer of this.wanted.loops) {
      if (!this.loops.has(layer.id)) void this.startLoop(layer)
    }

    // one-shots
    const wantShots = new Set(this.wanted.oneShots.map((s) => s.id))
    for (const [id, timer] of this.oneShotTimers) {
      if (!wantShots.has(id)) {
        window.clearTimeout(timer)
        this.oneShotTimers.delete(id)
      }
    }
    for (const shot of this.wanted.oneShots) {
      if (!this.oneShotTimers.has(shot.id)) this.scheduleShot(shot, true)
    }
  }

  private async startLoop(layer: LoopLayer) {
    const ctx = this.ctx!
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(this.buses[layer.bus])
    // จองที่ไว้ก่อน กันเริ่มซ้ำระหว่างโหลดไฟล์
    const entry: ActiveLoop = { gain, stop: () => {} }
    this.loops.set(layer.id, entry)

    const buf = await this.load(layer.file)
    if (this.loops.get(layer.id) !== entry) return // ถูกยกเลิกระหว่างโหลด
    if (buf) {
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.loop = true
      src.connect(gain)
      src.start(0, Math.random() * buf.duration)
      entry.stop = () => src.stop()
    } else if (layer.synth) {
      const voice = createSynth(ctx, layer.synth)
      voice.output.connect(gain)
      entry.stop = voice.stop
    } else {
      return // ไม่มีไฟล์และไม่มีเสียงสังเคราะห์ → เงียบ
    }
    gain.gain.setTargetAtTime(layer.volume, ctx.currentTime, FADE / 3)
  }

  private fadeOutAndStop(loop: ActiveLoop) {
    const ctx = this.ctx!
    loop.gain.gain.cancelScheduledValues(ctx.currentTime)
    loop.gain.gain.setTargetAtTime(0, ctx.currentTime, FADE / 3)
    window.setTimeout(() => {
      try {
        loop.stop()
      } catch {
        /* หยุดไปแล้ว */
      }
      loop.gain.disconnect()
    }, FADE * 1000 + 500)
  }

  private scheduleShot(shot: OneShotLayer, first = false) {
    const [min, max] = shot.every
    const wait = (first ? Math.random() * min : min + Math.random() * (max - min)) * 1000
    const timer = window.setTimeout(() => {
      if (!this.oneShotTimers.has(shot.id)) return
      void this.playSfx(shot.file, shot.volume)
      this.scheduleShot(shot)
    }, wait)
    this.oneShotTimers.set(shot.id, timer)
  }
}

export const audio = new AudioEngine()

// เปิดระบบเสียงเมื่อผู้เล่นโต้ตอบครั้งแรก (ข้อกำหนดของเบราว์เซอร์)
const unlockOnce = () => audio.unlock()
window.addEventListener('pointerdown', unlockOnce)
window.addEventListener('keydown', unlockOnce)
