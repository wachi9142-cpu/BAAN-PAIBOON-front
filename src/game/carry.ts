/**
 * ระบบอุ้มและเคลื่อนย้ายสัตว์ (ผู้สร้าง 19 พ.ย. 2569)
 * - คลิกสัตว์ → วงล้อคำสั่ง → "อุ้ม" → ตัวละครก้มลงอุ้มสัตว์ขึ้นมาไว้ในอ้อมแขน แล้วเดินพาไปไหนก็ได้ (ผู้เล่นเดินเอง ไม่วาร์ป)
 * - สัตว์ตัวเล็ก = อุ้มแนบอก · ตัวกลาง/ใหญ่ = สองมือประคองยกไว้ข้างหน้า · ควาย วัว = อุ้มไม่ได้
 * - เดินไปใกล้ชามอาหาร / ฟูกสัตว์ / เตียง / บ้านสัตว์ แล้วกด E = วางลงให้กิน / นอน / เข้าบ้าน · ที่อื่น = วางลงข้างหน้า
 * - สัตว์ที่ถูกวางให้กิน/นอน จะอยู่ตรงนั้นสักพัก แล้วค่อยลุกเดินตามผู้เล่นต่อ
 */
import { create } from 'zustand'
import { useGame } from './store'
import { playerPose } from './playerPose'
import { PLACES } from './content/village'
import { type PetChoice, type PetSpecies } from './content/pets'
import { careOf, feedPet } from './petCare'
import { playPetSound } from './audio/petSounds'
import { useInterior, INTERIOR_ORIGIN } from './interior'
import { HOME_ACTS, NPC_ACTS, COOK_ACTS } from './houseLife'

export type CarryHold = 'chest' | 'arms'
/** อุ้มไม่ได้ (ตัวใหญ่เกินไป) */
const TOO_BIG: PetSpecies[] = ['buffalo', 'cow']
const SMALL: PetSpecies[] = ['cat', 'rabbit', 'squirrel', 'mouse', 'bird', 'chicken', 'duck', 'turtle', 'monkey']

export const canCarry = (pet: PetChoice) => !TOO_BIG.includes(pet.species)
export function holdOf(pet: PetChoice): CarryHold {
  if (SMALL.includes(pet.species)) return 'chest'
  if (pet.species === 'dog' && pet.size === 'small') return 'chest'
  return 'arms'
}

interface CarryState {
  /** สัตว์ที่อุ้มอยู่ (กุญแจทีม) */
  key: string | null
  pet: PetChoice | null
  hold: CarryHold
  /** เวลาที่เริ่มอุ้ม / เริ่มวาง (ใช้ทำแอนิเมชันก้มอุ้ม–วางลง) */
  t0: number
  putting: { x: number; z: number; y: number; t0: number } | null
  /** สัตว์ที่ถูกวางให้ทำอะไรอยู่กับที่ (กิน/นอน/อยู่ในบ้านสัตว์) */
  stays: Record<string, { x: number; z: number; y: number; heading: number; pose: 0 | 1 | 2; until: number; eat?: boolean }>
  /** จุดวางที่อยู่ใกล้ (ไว้แสดงปุ่ม E) */
  near: CarrySpot | null
}
export const useCarry = create<CarryState>(() => ({ key: null, pet: null, hold: 'chest', t0: 0, putting: null, stays: {}, near: null }))

export interface CarrySpot {
  kind: 'bowl' | 'petbed' | 'bed' | 'pethouse' | 'ground'
  label: string
  x: number
  z: number
  y: number
  heading: number
}

/** จุดวางสัตว์ในบ้านตารัง–ยายเลียน (พิกัดในบริเวณบ้าน → โลก) */
export const HOME_PET_SPOTS: { kind: CarrySpot['kind']; label: string; at: [number, number]; y: number; heading: number }[] = [
  { kind: 'bowl', label: 'ชามข้าวสัตว์เลี้ยง', at: [-4.6, 0.6], y: 0, heading: Math.PI },
  { kind: 'petbed', label: 'ฟูกนอนสัตว์เลี้ยง', at: [-10.6, 0.7], y: 0.08, heading: 0 },
  { kind: 'pethouse', label: 'บ้านหมาไม้', at: [-12.9, 1.9], y: 0, heading: 0 },
]

export function carrySpots(): CarrySpot[] {
  const ins = useInterior.getState()
  if (ins.inside) {
    // ในบ้าน: เตียง/ฟูก/เสื่อของคนก็วางสัตว์ให้นอนได้
    const acts = ins.house === 'home' ? HOME_ACTS : ins.house === 'cookhouse' ? COOK_ACTS : NPC_ACTS
    return acts
      .filter((a) => a.kind === 'sleep')
      .map((a) => ({ kind: 'bed' as const, label: 'เตียง', x: INTERIOR_ORIGIN[0] + a.at.x - Math.sin(a.at.heading) * 0.8, z: INTERIOR_ORIGIN[1] + a.at.z - Math.cos(a.at.heading) * 0.8, y: a.at.y + (a.upper ? 3 : 0), heading: a.at.heading }))
  }
  const home = PLACES.find((p) => p.id === 'home-tarang')!
  return HOME_PET_SPOTS.map((s) => ({ kind: s.kind, label: s.label, x: home.pos[0] + s.at[0], z: home.pos[1] + s.at[1], y: s.y, heading: s.heading }))
}

export function findCarrySpot(x: number, z: number): CarrySpot | null {
  let best: CarrySpot | null = null
  let bd = 1.6
  for (const s of carrySpots()) {
    const d = Math.hypot(s.x - x, s.z - z)
    if (d < bd) {
      bd = d
      best = s
    }
  }
  return best
}

export function startCarry(key: string, pet: PetChoice, intent?: 'bed') {
  const g = useGame.getState()
  if (!canCarry(pet)) return g.toast({ title: `${pet.name} ตัวใหญ่เกินไป อุ้มไม่ไหว`, tone: 'warn' })
  if (g.riding) return g.toast({ title: 'ลงจากหลังสัตว์ก่อนนะ', tone: 'info' })
  const stays = { ...useCarry.getState().stays }
  delete stays[key]
  useCarry.setState({ key, pet, hold: holdOf(pet), t0: performance.now(), putting: null, stays })
  playPetSound(pet, 0.45)
  g.toast({
    title: `🤲 อุ้ม${pet.name}ขึ้นมาแล้ว`,
    body: intent === 'bed' ? 'เดินพาไปที่ฟูกสัตว์/เตียง แล้วกด E วางให้นอน' : 'เดินพาไปที่ชามอาหาร ฟูก หรือบ้านสัตว์ แล้วกด E วางลง · กด E ที่อื่น = วางลงตรงนั้น',
    tone: 'info',
  })
}

/** วางสัตว์ลง (ตามจุดที่อยู่ใกล้) */
export function putDown() {
  const s = useCarry.getState()
  if (!s.key || !s.pet || s.putting) return
  const g = useGame.getState()
  const spot = findCarrySpot(playerPose.x, playerPose.z)
  const ph = playerPose.heading
  const tx = spot ? spot.x : playerPose.x + Math.sin(ph) * 0.7
  const tz = spot ? spot.z : playerPose.z + Math.cos(ph) * 0.7
  const ty = spot ? spot.y : playerPose.y
  useCarry.setState({ putting: { x: tx, z: tz, y: ty, t0: performance.now() } })
  const key = s.key
  const pet = s.pet
  window.setTimeout(() => {
    const now = performance.now()
    const stays = { ...useCarry.getState().stays }
    if (spot?.kind === 'bowl') {
      stays[key] = { x: tx, z: tz, y: ty, heading: spot.heading, pose: 0, until: now + 7000, eat: true }
      feedPet(key)
    } else if (spot && (spot.kind === 'petbed' || spot.kind === 'bed' || spot.kind === 'pethouse')) {
      stays[key] = { x: tx, z: tz, y: ty, heading: spot.heading, pose: 2, until: now + (spot.kind === 'pethouse' ? 40000 : 25000) }
      const c = careOf(key)
      g.toast({ title: `😴 ${pet.name}${spot.kind === 'pethouse' ? 'เข้าไปนอนในบ้านสัตว์' : 'จัดท่านอนแล้วหลับไป'}`, body: `พลังงาน ${Math.round(c.energy)} → ค่อย ๆ ฟื้นขึ้น · เดินออกไปไกล ๆ แล้วเดี๋ยวจะลุกตามมาเอง`, tone: 'success' })
    } else {
      stays[key] = { x: tx, z: tz, y: ty, heading: ph, pose: 1, until: now + 1500 }
    }
    useCarry.setState({ key: null, pet: null, putting: null, stays })
    playPetSound(pet, 0.35)
  }, 550)
}

/** ตำแหน่งสัตว์ระหว่างอุ้ม/วางลง (พิกัดโลก) — null = ไม่ได้อุ้มตัวนี้ */
export function carryPose(key: string, now: number, from: [number, number, number]): { x: number; y: number; z: number; heading: number; sway: number } | null {
  const s = useCarry.getState()
  if (s.key !== key) return null
  const ph = playerPose.heading
  const chest = s.hold === 'chest'
  // ในอ้อมแขน: หน้าอก (ตัวเล็ก) / ยกไว้ข้างหน้าสองมือ (ตัวใหญ่)
  const fwd = chest ? 0.3 : 0.42
  const hx = playerPose.x + Math.sin(ph) * fwd
  const hz = playerPose.z + Math.cos(ph) * fwd
  const hy = playerPose.y + (chest ? 0.92 : 0.62) + Math.abs(Math.sin(now / 160)) * 0.03 * playerPose.motion
  const heading = chest ? ph + Math.PI / 2 : ph
  const sway = Math.sin(now / 180) * 0.12 * Math.min(1, playerPose.motion)
  if (s.putting) {
    const k = Math.min(1, (now - s.putting.t0) / 500)
    return { x: hx + (s.putting.x - hx) * k, y: hy + (s.putting.y - hy) * k, z: hz + (s.putting.z - hz) * k, heading, sway: 0 }
  }
  // ก้มลงอุ้มขึ้นจากพื้น 0.55 วิแรก
  const k = Math.min(1, (now - s.t0) / 550)
  const e = k * k * (3 - 2 * k)
  return { x: from[0] + (hx - from[0]) * e, y: from[1] + (hy - from[1]) * e, z: from[2] + (hz - from[2]) * e, heading, sway }
}

/** ท่าแขนตัวละครตอนอุ้ม: 0..1 ก้มตัวตอนอุ้มขึ้น/วางลง */
export function carryBend(now: number) {
  const s = useCarry.getState()
  if (!s.key) return 0
  if (s.putting) return Math.sin(Math.min(1, (now - s.putting.t0) / 550) * Math.PI) * 0.6
  const k = (now - s.t0) / 550
  return k < 1 ? Math.sin(k * Math.PI) * 0.6 : 0
}
