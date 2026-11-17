/**
 * เล่นเครื่องเล่นในสนามเด็กเล่นโรงเรียน: เดินไปใกล้แล้วกด E → ตัวละครเล่นจริง (ชิงช้าแกว่ง ไถลสไลเดอร์ ฯลฯ)
 * เดิน (WASD) เพื่อเลิกเล่นได้ทุกเมื่อ
 */
import { create } from 'zustand'
import { useGame, type Gesture } from './store'
import { PLACES } from './content/village'

export type ToyKind = 'swing' | 'slide' | 'seesaw' | 'merry' | 'dome' | 'bars' | 'spring' | 'sandbox' | 'tunnel' | 'tires' | 'beam'

export interface ToySpot {
  id: string
  kind: ToyKind
  name: string
  /** จุดยืนกด E (พิกัดโลก) */
  x: number
  z: number
}

/** ตำแหน่งสนามเด็กเล่นในโรงเรียน (พิกัดภายใน Campus) — ต้องตรงกับ VillageLayout.tsx */
export const PLAYGROUND_LOCAL: [number, number] = [-10.5, 9.5]
/** เครื่องเล่นแต่ละชิ้น (พิกัดภายในสนามเด็กเล่น) */
export const TOYS: { id: string; kind: ToyKind; name: string; at: [number, number] }[] = [
  { id: 'swing-0', kind: 'swing', name: 'ชิงช้า', at: [-4.7, -3] },
  { id: 'swing-1', kind: 'swing', name: 'ชิงช้า', at: [-3.5, -3] },
  { id: 'swing-2', kind: 'swing', name: 'ชิงช้า', at: [-2.3, -3] },
  { id: 'slide', kind: 'slide', name: 'สไลเดอร์', at: [2.5, -3] },
  { id: 'seesaw', kind: 'seesaw', name: 'กระดานหก', at: [5, -3] },
  { id: 'merry', kind: 'merry', name: 'ม้าหมุน', at: [-4, 1] },
  { id: 'dome', kind: 'dome', name: 'โดมปีนป่าย', at: [-0.8, 1] },
  { id: 'bars', kind: 'bars', name: 'บาร์โหน', at: [2.2, 1] },
  { id: 'spring-0', kind: 'spring', name: 'ม้าโยกสปริง', at: [4.4, 1] },
  { id: 'spring-1', kind: 'spring', name: 'ม้าโยกสปริง', at: [5.4, 1] },
  { id: 'sandbox', kind: 'sandbox', name: 'บ่อทราย', at: [-4, 3.8] },
  { id: 'tunnel', kind: 'tunnel', name: 'อุโมงค์มุด', at: [-0.5, 3.8] },
  { id: 'tires', kind: 'tires', name: 'ยางรถกระโดด', at: [2.8, 3.8] },
  { id: 'beam', kind: 'beam', name: 'คานทรงตัว', at: [4.6, 3.8] },
]

export function toySpots(): ToySpot[] {
  const sc = PLACES.find((p) => p.id === 'school')
  if (!sc) return []
  const ox = sc.pos[0] + PLAYGROUND_LOCAL[0]
  const oz = sc.pos[1] + PLAYGROUND_LOCAL[1]
  return TOYS.map((t) => ({ id: t.id, kind: t.kind, name: t.name, x: ox + t.at[0], z: oz + t.at[1] }))
}
const SPOTS = toySpots()

/** ระยะเวลาเล่นหนึ่งรอบ (วินาที) */
const DURATION: Record<ToyKind, number> = { swing: 8, slide: 4.5, seesaw: 6, merry: 6, dome: 4, bars: 4, spring: 5, sandbox: 6, tunnel: 3.5, tires: 3, beam: 3.5 }
/** ท่าตัวละครระหว่างเล่น */
export const TOY_POSE: Record<ToyKind, Gesture> = {
  swing: 'sit',
  slide: 'sit',
  seesaw: 'sit',
  merry: 'sit',
  dome: 'hang',
  bars: 'hang',
  spring: 'sit',
  sandbox: 'sit',
  tunnel: 'prostrate',
  tires: 'balance',
  beam: 'balance',
}

interface PlayState {
  near: string | null
  /** กำลังเล่นอยู่ */
  playing: { spot: ToySpot; t0: number; dur: number } | null
}
export const usePlay = create<PlayState>(() => ({ near: null, playing: null }))

export function findToy(x: number, z: number): string | null {
  let best: string | null = null
  let bd = 1.6
  for (const s of SPOTS) {
    const d = Math.hypot(s.x - x, s.z - z)
    if (d < bd) {
      bd = d
      best = s.id
    }
  }
  return best
}

export const toyHint = (id: string) => {
  const s = SPOTS.find((t) => t.id === id)
  return s ? `🛝 เล่น${s.name}` : ''
}

export function startPlay(id: string) {
  const spot = SPOTS.find((t) => t.id === id)
  const g = useGame.getState()
  if (!spot || !g.save || usePlay.getState().playing) return
  if (g.riding) {
    g.toast({ title: 'ลงจากหลังสัตว์ก่อนนะ', tone: 'info' })
    return
  }
  const dur = DURATION[spot.kind]
  usePlay.setState({ playing: { spot, t0: performance.now(), dur } })
  g.doGesture(TOY_POSE[spot.kind], dur * 1000)
  window.setTimeout(() => {
    const p = usePlay.getState().playing
    if (p && p.spot.id === spot.id) stopPlay(true)
  }, dur * 1000)
}

export function stopPlay(finished = false) {
  const p = usePlay.getState().playing
  if (!p) return
  usePlay.setState({ playing: null })
  const g = useGame.getState()
  if (g.gesture) useGame.setState({ gesture: null })
  if (finished) {
    g.changeStats({ fun: 6, hunger: -0.5, thirst: -0.8 })
    g.toast({ title: `😄 สนุกจัง! (${p.spot.name})`, body: 'สนุก +6 · กด E เล่นอีกรอบได้', tone: 'success' })
  }
}

/**
 * ตำแหน่ง/ท่าทางผู้เล่นระหว่างเล่น (คำนวณจากเวลาที่ผ่านไป) — พิกัดโลก + ทิศหัน
 * คืน null ถ้าไม่ได้เล่น
 */
export function playPose(now: number): { x: number; y: number; z: number; heading: number; tilt: number } | null {
  const p = usePlay.getState().playing
  if (!p) return null
  const t = (now - p.t0) / 1000
  const { x, z, kind } = p.spot
  switch (kind) {
    case 'swing': {
      // แกว่งไปหน้า–หลังรอบคานบนสูง 2.6 ม. แรงขึ้นช่วงแรกแล้วค่อยแผ่วลง
      const amp = Math.min(1, t / 2) * Math.max(0.2, 1 - Math.max(0, t - 5) / 3) * 0.75
      const a = Math.sin(t * 2.3) * amp
      return { x, y: 2.6 - 1.75 * Math.cos(a) - 0.4, z: z + Math.sin(a) * 1.75, heading: 0, tilt: -a }
    }
    case 'slide': {
      // ปีนบันได (0–1.2 วิ) → นั่งบนแท่น → ไถลลง (เร็ว) → ยืนขึ้น
      if (t < 1.2) return { x, y: (t / 1.2) * 1.4, z: z - 0.9 + (t / 1.2) * 0.4, heading: 0, tilt: 0 }
      if (t < 1.8) return { x, y: 1.4, z: z - 0.5, heading: 0, tilt: 0 }
      const k = Math.min(1, (t - 1.8) / 1.1)
      return { x, y: 1.4 * (1 - k) * (1 - k * 0.15), z: z - 0.5 + k * 2.6, heading: 0, tilt: k < 1 ? 0.35 : 0 }
    }
    case 'seesaw': {
      const b = Math.sin(t * 2.2)
      return { x: x + 1.25, y: 0.35 + b * 0.32, z, heading: -Math.PI / 2, tilt: 0 }
    }
    case 'merry': {
      const a = t * 1.8
      return { x: x + Math.cos(a) * 0.85, y: 0.2, z: z + Math.sin(a) * 0.85, heading: -a, tilt: 0 }
    }
    case 'dome': {
      const k = Math.min(1, t / 2)
      return { x, y: 0.15 + k * 0.85 + Math.sin(t * 6) * 0.03, z: z + 1.1 * (1 - k), heading: Math.PI, tilt: 0 }
    }
    case 'bars': {
      // ห้อยโหนจากปลายด้านหนึ่งไปอีกด้าน
      const k = Math.min(1, t / 3.5)
      return { x: x - 0.85 + k * 1.7, y: 0.35 + Math.abs(Math.sin(t * 5)) * 0.06, z, heading: Math.PI / 2, tilt: 0 }
    }
    case 'spring':
      return { x, y: 0.15 + Math.abs(Math.sin(t * 4)) * 0.08, z, heading: 0, tilt: Math.sin(t * 4) * 0.18 }
    case 'sandbox':
      return { x, y: 0.05, z, heading: Math.PI, tilt: 0 }
    case 'tunnel': {
      const k = Math.min(1, t / 3)
      return { x: x - 1.3 + k * 2.6, y: 0.05, z, heading: Math.PI / 2, tilt: 0 }
    }
    case 'tires': {
      const k = Math.min(1, t / 2.6)
      return { x: x - 0.8 + k * 1.6, y: Math.abs(Math.sin(k * Math.PI * 3)) * 0.35 + 0.1, z, heading: Math.PI / 2, tilt: 0 }
    }
    case 'beam': {
      const k = Math.min(1, t / 3.2)
      return { x: x + Math.sin(t * 3) * 0.04, y: 0.38, z: z - 0.9 + k * 1.8, heading: 0, tilt: Math.sin(t * 3.5) * 0.08 }
    }
  }
}
