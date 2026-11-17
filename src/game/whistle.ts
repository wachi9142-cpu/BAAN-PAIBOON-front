/**
 * ผิวปากเรียกสัตว์ (กด Q) — แยกจากระบบลำแสงคฑา ใช้ได้โดยไม่ต้องถือคฑา
 * ตัวละครยกมือป้องปาก ผิวเสียงหวีดคล้ายนก โน้ตลอยขึ้น → สัตว์รอบตัวได้ยินแล้วมีปฏิกิริยาต่างกัน:
 * ระดับง่าย = เดินเข้ามาหา · ปานกลาง = หันมามอง/บางตัวเดินเข้ามาช้า ๆ · ยาก = ตกใจวิ่งหนี · หายากมาก = ไม่สนใจ
 * นก ไก่ เป็ด ห่าน ส่งเสียงตอบ · สัตว์เลี้ยงที่เดินตามอยู่ลุกขึ้นวิ่งมาหาและส่งเสียง
 */
import { useGame } from './store'
import { useSettings } from './settings'
import { wild, wildPos, tierOf } from './catching'
import { playerPose } from '../scenes/Player'
import { WILD_SPAWNS } from './content/wildlife'
import { getSpecies, type PetSpecies } from './content/pets'
import { playPetSound } from './audio/petSounds'

export const WHISTLE_MS = 1900
const HEAR_RANGE = 16
/** เวลา (performance.now) ที่ผิวปากล่าสุด — สัตว์เลี้ยงที่เดินตามอ่านค่านี้ */
export const whistleState = { at: -1e9 }

/** สัตว์ที่ชอบส่งเสียงตอบ */
const REPLIERS: PetSpecies[] = ['bird', 'chicken', 'duck', 'goose', 'dog', 'cat', 'goat', 'cow', 'buffalo']

export function whistle() {
  const g = useGame.getState()
  if (!g.save || g.paused) return
  const now = performance.now()
  if (now - whistleState.at < WHISTLE_MS + 300) return
  if (g.riding) {
    g.toast({ title: 'ลงจากหลังสัตว์ก่อนนะ', body: 'กด R เพื่อลง แล้วค่อยผิวปาก', tone: 'info' })
    return
  }
  whistleState.at = now
  g.doGesture('whistle', WHISTLE_MS)
  playWhistle()

  // สัตว์ได้ยินหลังจากเสียงเริ่มสักครู่
  setTimeout(() => {
    const come: string[] = []
    const look: string[] = []
    const flee: string[] = []
    const reply: PetSpecies[] = []
    const t = Date.now()
    for (const s of WILD_SPAWNS) {
      const r = wild.get(s.id)!
      if (r.status !== 'free') continue
      const p = wildPos.get(s.id) ?? s.home
      if (Math.hypot(p[0] - playerPose.x, p[1] - playerPose.z) > HEAR_RANGE) continue
      const name = getSpecies(s.pet.species).label
      const tier = tierOf(s.id)
      if (tier === 'easy') {
        r.callMode = 'come'
        r.callUntil = t + 7000
        come.push(name)
      } else if (tier === 'medium') {
        // ระวังตัว: ครึ่งหนึ่งค่อย ๆ เดินเข้ามา อีกครึ่งแค่หันมามอง
        r.callMode = Math.random() < 0.5 ? 'come' : 'look'
        r.callUntil = t + (r.callMode === 'come' ? 5000 : 3000)
        ;(r.callMode === 'come' ? come : look).push(name)
      } else if (tier === 'hard') {
        r.scaredUntil = t + 3500
        flee.push(name)
      } else {
        continue // หายากมาก: ไม่สนใจเสียงผิวปาก
      }
      if (REPLIERS.includes(s.pet.species) && !reply.includes(s.pet.species) && tier !== 'hard') reply.push(s.pet.species)
    }
    // ส่งเสียงตอบ (ไม่เกิน 2 ตัว ไม่ให้หนวกหู)
    reply.slice(0, 2).forEach((sp, k) => setTimeout(() => playPetSound({ species: sp, voice: 0 }, 0.45), 450 + k * 650))

    const pet = useGame.getState().save?.player.pet
    const uniq = (a: string[]) => [...new Set(a)]
    const parts = [
      come.length && `${uniq(come).join(' ')} เดินเข้ามาหา`,
      look.length && `${uniq(look).join(' ')} หันมามอง`,
      flee.length && `${uniq(flee).join(' ')} ตกใจวิ่งหนี`,
      pet && `${pet.name}วิ่งมาหา`,
    ].filter(Boolean)
    useGame.getState().toast({
      title: '🎵 ผิวปากเรียกสัตว์',
      body: parts.length ? parts.join(' · ') : 'แถวนี้ไม่มีสัตว์ได้ยิน ลองไปใกล้ทุ่งหญ้าหรือป่าดูนะ',
      tone: 'info',
    })
  }, 650)
}

// ---------- เสียงผิวปาก: หวีดสองช่วงคล้ายนก "ฟิ้ว–ฟิ้ววว" + สั่นปลายเสียง ----------
let ctx: AudioContext | null = null
function playWhistle() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const c = ctx
    const vol = (useSettings.getState().sfxVolume ?? 1) * 0.22
    const t0 = c.currentTime + 0.02
    const note = (start: number, dur: number, f0: number, f1: number, vib = 0) => {
      const o = c.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(f0, start)
      o.frequency.exponentialRampToValueAtTime(f1, start + dur * 0.8)
      const g = c.createGain()
      g.gain.setValueAtTime(0.0001, start)
      g.gain.exponentialRampToValueAtTime(vol, start + 0.04)
      g.gain.setValueAtTime(vol, start + dur - 0.06)
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
      if (vib) {
        const lfo = c.createOscillator()
        lfo.frequency.value = 11
        const lg = c.createGain()
        lg.gain.value = vib
        lfo.connect(lg).connect(o.frequency)
        lfo.start(start)
        lfo.stop(start + dur)
      }
      // ลมหายใจเบา ๆ ปนในเสียง
      const len = Math.floor(c.sampleRate * dur)
      const buf = c.createBuffer(1, len, c.sampleRate)
      const ch = buf.getChannelData(0)
      for (let n = 0; n < len; n++) ch[n] = (Math.random() * 2 - 1) * 0.5
      const air = c.createBufferSource()
      air.buffer = buf
      const bp = c.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = f0
      bp.Q.value = 8
      const ag = c.createGain()
      ag.gain.setValueAtTime(0.0001, start)
      ag.gain.exponentialRampToValueAtTime(vol * 0.25, start + 0.04)
      ag.gain.exponentialRampToValueAtTime(0.0001, start + dur)
      air.connect(bp).connect(ag).connect(c.destination)
      air.start(start)
      o.connect(g).connect(c.destination)
      o.start(start)
      o.stop(start + dur + 0.05)
    }
    note(t0, 0.22, 1500, 2500)
    note(t0 + 0.32, 0.5, 2600, 1800, 40)
    note(t0 + 0.95, 0.18, 1900, 2700)
    note(t0 + 1.18, 0.38, 2700, 2300, 60)
  } catch {
    /* ไม่มีเสียงก็ไม่เป็นไร */
  }
}
