// แปลงผักสวนครัวในที่ดินบ้านผู้เล่น — ข้อมูลล้วน เพิ่มผักชนิดใหม่ได้ที่นี่
// เวลาโตนับเป็น "ชั่วโมงในเกม" (1 นาทีจริง = 15 นาทีในเกม) และโตเฉพาะตอนดินยังชื้น (รดน้ำแล้ว)
import type { ItemId } from './items'
import type { Vec2 } from './village'

export type CropId = 'morningglory' | 'scallion' | 'basil' | 'chili' | 'eggplant' | 'tomato' | 'lemongrass' | 'pumpkin'

export interface CropDef {
  id: CropId
  name: string
  seed: ItemId
  produce: ItemId
  /** ปลูกจนเก็บได้ (ชั่วโมงในเกม ตอนดินชื้น) */
  growHours: number
  /** เก็บแล้วแตกยอด/ออกผลใหม่ได้อีก (ชั่วโมง) — ไม่มี = เก็บแล้วแปลงว่าง */
  regrowHours?: number
  /** ได้ผลผลิตต่อครั้ง [น้อยสุด, มากสุด] */
  yield: [number, number]
}

export const CROPS: Record<CropId, CropDef> = {
  morningglory: { id: 'morningglory', name: 'ผักบุ้ง', seed: 'seed_morningglory', produce: 'morningglory', growHours: 6, regrowHours: 4, yield: [2, 3] },
  scallion: { id: 'scallion', name: 'ต้นหอม', seed: 'seed_scallion', produce: 'scallion', growHours: 8, regrowHours: 6, yield: [2, 3] },
  basil: { id: 'basil', name: 'กะเพรา', seed: 'seed_basil', produce: 'basil', growHours: 10, regrowHours: 6, yield: [2, 3] },
  lemongrass: { id: 'lemongrass', name: 'ตะไคร้', seed: 'seed_lemongrass', produce: 'lemongrass', growHours: 12, regrowHours: 8, yield: [2, 3] },
  chili: { id: 'chili', name: 'พริก', seed: 'seed_chili', produce: 'chili', growHours: 14, regrowHours: 8, yield: [3, 5] },
  eggplant: { id: 'eggplant', name: 'มะเขือ', seed: 'seed_eggplant', produce: 'eggplant', growHours: 16, regrowHours: 8, yield: [2, 4] },
  tomato: { id: 'tomato', name: 'มะเขือเทศ', seed: 'seed_tomato', produce: 'tomato', growHours: 18, regrowHours: 10, yield: [2, 4] },
  pumpkin: { id: 'pumpkin', name: 'ฟักทอง', seed: 'seed_pumpkin', produce: 'pumpkin', growHours: 30, yield: [1, 2] },
}
export const CROP_LIST = Object.values(CROPS)
export const cropBySeed = (seed: ItemId) => CROP_LIST.find((c) => c.seed === seed)

/** รดน้ำหนึ่งครั้ง ดินชื้นอยู่กี่ชั่วโมงในเกม */
export const WATER_HOURS = 12

/** แปลงผักหน้าบ้าน (พิกัดโลก) — อยู่ในรั้วที่ดินของฉัน ด้านใต้ของตัวบ้าน 4 × 2 แปลง */
export const BED_SIZE = 1.8
/** แปลงผักข้างบ้านแม่ฉัตร (ฝั่งตะวันออก · หน้าบ้านเป็นที่จอดรถ — ผู้สร้าง 19 พ.ย. 2569) */
export const GARDEN_BEDS: Vec2[] = [29.4, 31.8, 34.2, 36.6].flatMap((z) => [61.6, 64.0].map((x): Vec2 => [x, z]))
/** โอ่งน้ำข้างแปลงผัก (ของประดับ) */
export const GARDEN_JAR: Vec2 = [64.6, 39.2]

/** สถานะแปลงในเซฟ — เวลานับเป็น "นาทีสัมบูรณ์" = วัน × 1440 + นาทีของวัน */
export interface BedState {
  crop: CropId | null
  /** นาทีที่โตสะสมแล้ว (ถึงเวลา settled) */
  grow: number
  /** คำนวณการโตถึงเวลานี้แล้ว */
  settled: number
  /** ดินชื้นถึงเวลานี้ */
  wetUntil: number
}

export const emptyBed = (): BedState => ({ crop: null, grow: 0, settled: 0, wetUntil: 0 })

/** การโตรวม (นาที) ณ เวลา now — โตเฉพาะช่วงที่ดินชื้น */
export function grownMinutes(b: BedState, now: number) {
  return b.grow + Math.max(0, Math.min(now, b.wetUntil) - b.settled)
}

/** 0–1 */
export function bedProgress(b: BedState, now: number) {
  if (!b.crop) return 0
  return Math.min(1, grownMinutes(b, now) / (CROPS[b.crop].growHours * 60))
}

/** 0 เมล็ด · 1 งอก · 2 ต้นอ่อน · 3 พร้อมเก็บ */
export function bedStage(b: BedState, now: number): 0 | 1 | 2 | 3 {
  const p = bedProgress(b, now)
  if (p >= 1) return 3
  if (p >= 0.5) return 2
  if (p >= 0.15) return 1
  return 0
}

export const isWet = (b: BedState, now: number) => now < b.wetUntil
