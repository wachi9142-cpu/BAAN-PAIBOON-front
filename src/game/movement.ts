/**
 * ระบบเดิน/ความเร็ว: เดินช้า · เดินเร็ว · วิ่ง + เสียงฝีเท้าตามความเร็วและพื้น + จอยสติกบนจอสัมผัส
 * - เดินช้า = ค่าเริ่มต้น · กด V สลับเป็นเดินเร็ว (ค้างโหมดไว้) · Shift ค้าง = วิ่ง
 * - จอสัมผัส: ดันจอยสติกนิดเดียว = เดินช้า · ดันสุด = เดินเร็ว · ปุ่มวิ่ง/กระโดดข้างจอ
 */
import { create } from 'zustand'
import { useSettings } from './settings'
import { ROADS } from './content/village'
import { PLACES } from './content/village'
import { templeGroundY } from './content/temple'

export type Gait = 'stand' | 'slow' | 'fast' | 'run'

/** ความเร็ว (ม./วิ) ของแต่ละท่า (ก่อนคูณวัย/ไม้เท้า) */
export const GAIT_SPEED: Record<Exclude<Gait, 'stand'>, number> = { slow: 3.7, fast: 5.4, run: 8.6 }
/** ค่า motion ที่ส่งให้โมเดลตัวละคร/สัตว์ (0 ยืน · 1 เดินช้า · 1.5 เดินเร็ว · 2 วิ่ง) */
export const GAIT_MOTION: Record<Gait, number> = { stand: 0, slow: 1, fast: 1.5, run: 2 }
/** ระยะก้าว (ม.) ใช้จับจังหวะเสียงฝีเท้า */
const STRIDE: Record<Exclude<Gait, 'stand'>, number> = { slow: 0.6, fast: 0.72, run: 1.05 }

interface MoveUi {
  /** โหมดเดินเร็วค้างไว้ (กด V) */
  fastWalk: boolean
  gait: Gait
}
export const useMove = create<MoveUi>(() => ({ fastWalk: false, gait: 'stand' }))

export function toggleFastWalk() {
  useMove.setState((s) => ({ fastWalk: !s.fastWalk }))
}

/** คำขอกระโดด (Enter หรือปุ่มกระโดดบนจอสัมผัส) — Player ใช้ในเฟรมถัดไป */
export const jumpReq = { at: -1e9 }
export const requestJump = () => {
  jumpReq.at = performance.now()
}

/** จอยสติกบนจอสัมผัส (อ่านทุกเฟรมจาก Player) */
export const stick = { active: false, x: 0, y: 0, run: false }

// ---------- พื้นใต้เท้า ----------
export type Surface = 'grass' | 'dirt' | 'concrete' | 'wood'

function distToSeg(px: number, pz: number, a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz || 1)))
  return Math.hypot(a[0] + dx * t - px, a[1] + dz * t - pz)
}
const lake = () => PLACES.find((p) => p.id === 'school-pond')

export function surfaceAt(x: number, z: number, inside: boolean): Surface {
  if (inside) return 'wood'
  if (templeGroundY(x, z) > 0.05) return 'wood'
  const lk = lake()
  if (lk && Math.abs(x - lk.pos[0]) < lk.size[0] / 2 + 4 && Math.abs(z - (lk.pos[1] - 2)) < 1.3) return 'wood'
  for (const r of ROADS) if (distToSeg(x, z, r.from, r.to) < r.width / 2) return r.surface === 'concrete' ? 'concrete' : 'dirt'
  return 'grass'
}

// ---------- เสียงฝีเท้า (สังเคราะห์) ----------
let ctx: AudioContext | null = null
function audio() {
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}
function burst(dur: number, type: BiquadFilterType, freq: number, q: number, gain: number) {
  const c = audio()
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const ch = buf.getChannelData(0)
  for (let n = 0; n < len; n++) ch[n] = (Math.random() * 2 - 1) * (1 - n / len) ** 3
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  const g = c.createGain()
  g.gain.value = gain
  src.connect(f).connect(g).connect(c.destination)
  src.start()
}
function knock(freq: number, gain: number) {
  const c = audio()
  const t = c.currentTime
  const o = c.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(freq, t)
  o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.08)
  const g = c.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
  o.connect(g).connect(c.destination)
  o.start(t)
  o.stop(t + 0.12)
}

/** เสียงฝีเท้า 1 ก้าว: ดังและหนักขึ้นตามความเร็ว · เปลี่ยนตามพื้น */
export function playFootstep(surface: Surface, gait: Gait) {
  try {
    const v = (useSettings.getState().sfxVolume ?? 1) * (gait === 'run' ? 1 : gait === 'fast' ? 0.75 : 0.55)
    const vary = 0.85 + Math.random() * 0.3
    if (surface === 'grass') burst(0.09, 'highpass', 2600 * vary, 0.7, 0.09 * v)
    else if (surface === 'dirt') burst(0.08, 'lowpass', 900 * vary, 0.8, 0.16 * v)
    else if (surface === 'concrete') {
      burst(0.04, 'bandpass', 2200 * vary, 1.4, 0.16 * v)
      knock(320 * vary, 0.05 * v)
    } else {
      knock(170 * vary, 0.16 * v)
      burst(0.05, 'bandpass', 700, 1, 0.06 * v)
    }
  } catch {
    /* ไม่มีเสียงก็ไม่เป็นไร */
  }
}

/** ตัวนับจังหวะก้าว (เรียกทุกเฟรมตอนเดิน) */
export const stepRt = { dist: 0 }
export function stepTick(moved: number, gait: Gait, surface: Surface) {
  if (gait === 'stand') {
    stepRt.dist = 0
    return
  }
  stepRt.dist += moved
  const stride = STRIDE[gait]
  if (stepRt.dist >= stride) {
    stepRt.dist -= stride
    playFootstep(surface, gait)
  }
}
