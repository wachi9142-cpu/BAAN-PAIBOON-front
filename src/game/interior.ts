import { LIVE } from './layoutEdit'
/**
 * ภายในบ้านตารัง–ยายเลียน (เดินเข้าไปสำรวจได้)
 * ตัวบ้านภายในวางไว้ไกลจากหมู่บ้าน (z = +400) แล้ว "วาร์ป" ผู้เล่นตอนเปิดประตู — ฉากหมู่บ้านถูกหมอกบังหมด
 * พิกัดภายใน: x −8..8 (ตะวันตก→ตะวันออก) · z −5..5 (หน้าบ้าน→หลังบ้าน) · ชั้นล่าง y 0 · ชั้นบน y 3
 */
import { create } from 'zustand'
import type { Rect } from './content/temple'
import { PLACES } from './content/village'

export const INTERIOR_ORIGIN: [number, number] = [0, 400]
export const IW = 16
export const ID = 10
export const FLOOR2 = 3
/** บันได 30 ขั้นชิดผนังตะวันออก: ล่าง (z = 3.5) → บน (z = −3.5) */
export const STAIRS = { x0: 6.4, x1: 8, zBottom: 3.5, zTop: -3.5 }

export const isInterior = (x: number, z: number) => Math.abs(x - INTERIOR_ORIGIN[0]) < 20 && Math.abs(z - INTERIOR_ORIGIN[1]) < 20

interface InteriorState {
  inside: boolean
  /** ยืนใกล้ประตู/ของในบ้าน: 'enter' = ประตูหน้าบ้านด้านนอก */
  near: string | null
  /** อยู่ชั้นบน (ซ่อนเพดาน/ชั้นบนตอนอยู่ชั้นล่าง ให้มองจากด้านบนแบบบ้านตุ๊กตา) */
  upper: boolean
}
export const useInterior = create<InteriorState>(() => ({ inside: false, near: null, upper: false }))

/** ประตูหน้าบ้าน (ด้านนอก) ในพิกัดโลก */
export function outsideDoor(): [number, number] {
  const hp = PLACES.find((p) => p.id === 'home-tarang')!
  // บ้านไม้สองชั้นอยู่ที่ (−8, −5) ภายในบริเวณบ้าน · ประตูสีน้ำเงินที่ x +1.4 ด้านเหนือ (+z) หันเข้าลานในบ้าน
  const m = LIVE.map['home:main'] ?? { x: -7.5, z: -6, rot: 0 }
  // ประตูอยู่ที่ (+1.4, +5.6) จากกลางบ้าน (บ้านลึก 9 ม.) หมุนตามที่ย้าย
  const c = Math.cos(m.rot)
  const s = Math.sin(m.rot)
  return [hp.pos[0] + m.x + 1.4 * c + 5.6 * s, hp.pos[1] + m.z - 1.4 * s + 5.6 * c]
}
/** ประตูหน้าบ้าน (ด้านใน) พิกัดภายใน */
export const INSIDE_DOOR: [number, number] = [-3, -4.3]

export const toWorld = (lx: number, lz: number): [number, number] => [INTERIOR_ORIGIN[0] + lx, INTERIOR_ORIGIN[1] + lz]

/** ความสูงพื้นใต้เท้า (พิกัดภายใน) — ขึ้นบันไดได้ ชั้นบนเป็นพื้นไม้ */
export function interiorGround(lx: number, lz: number, curY: number) {
  const { x0, x1, zBottom, zTop } = STAIRS
  if (lx > x0 - 0.1 && lx < x1 && lz < zBottom + 0.4 && lz > zTop - 0.6) {
    const k = Math.min(1, Math.max(0, (zBottom - lz) / (zBottom - zTop)))
    return k * FLOOR2
  }
  return curY > FLOOR2 * 0.5 ? FLOOR2 : 0
}

const R = (x0: number, x1: number, z0: number, z1: number): Rect => ({ minX: INTERIOR_ORIGIN[0] + x0, maxX: INTERIOR_ORIGIN[0] + x1, minZ: INTERIOR_ORIGIN[1] + z0, maxZ: INTERIOR_ORIGIN[1] + z1 })

/** ผนังกั้นห้อง (ใช้ทั้งชนและวาดโมเดล) — [x0, x1, z0, z1] */
export const WALLS_GROUND: [number, number, number, number][] = [
  // ห้องน้ำ (ประตูด้านใต้)
  [2, 2.15, 1.8, 5],
  [4.6, 4.75, 1.8, 5],
  [2, 2.8, 1.8, 1.95],
  [3.8, 4.75, 1.8, 1.95],
  // ผนังกั้นเตียงตายาย
  [-2.3, -2.15, 2.2, 5],
  // ห้องน้ารง (ประตูด้านใต้ฝั่งตะวันตก)
  [-8, -7.6, 1.6, 1.75],
  [-6.6, -2.3, 1.6, 1.75],
  // ผนังครัว (ประตูกลาง)
  [-6, -5.85, -5, -2.6],
  [-6, -5.85, -1, 1],
]
export const WALLS_UPPER: [number, number, number, number][] = [
  // ห้องนอน 3 ห้องฝั่งขวา (เหนือ) มีประตูเข้าทีละห้อง
  [-8, -6.2, 0, 0.15],
  [-4.8, -2.7, 0, 0.15],
  [-2.55, -2.4, 0, 5],
  [-2.4, -0.6, 0, 0.15],
  [0.8, 2.6, 0, 0.15],
  [2.6, 2.75, 0, 5],
  [2.75, 4.2, 0, 0.15],
  [5.6, 6.3, 0, 0.15],
  // ราวกันตกรอบช่องบันได
  [6.25, 6.4, -2.6, 5],
]

/** กล่องชนภายในตามชั้น */
export function interiorColliders(upper: boolean): Rect[] {
  const h = IW / 2
  const d = ID / 2
  const t = 0.2
  const outer = [R(-h - t, h + t, -d - t, -d), R(-h - t, h + t, d, d + t), R(-h - t, -h, -d, d), R(h, h + t, -d, d)]
  const walls = (upper ? WALLS_UPPER : WALLS_GROUND).map(([x0, x1, z0, z1]) => R(x0, x1, z0, z1))
  const furniture = upper
    ? [R(3.9, 6.1, 2.85, 4.55), R(-0.4, 2.3, 2.6, 4.8), R(-7.8, -5.2, 2.6, 4.8)] // เตียง 3 ห้อง
    : [
        R(4.8, 6.2, 4.2, 5), // ตู้เสื้อผ้ายาย (ลงบันไดมาแล้วหันซ้าย)
        R(-1.9, 1.2, 3.2, 5), // เตียงตายาย
        R(-6.3, -3.2, 0.9, 1.5), // ตู้เสื้อผ้า 3 ประตู หน้าห้องน้ารง
        R(-8, -6.1, -4.9, -3.3), // เคาน์เตอร์ครัว
        R(-2.8, -0.2, -1.4, -0.6), // โซฟาไม้
        R(-2.9, -0.1, 1.15, 1.7), // ทีวี + ตู้ DVD
        R(1.25, 1.95, 2, 3.2), // ตู้เสื้อผ้าหันหน้าเข้าเตียงตา
        R(1.45, 2.95, -4.15, -3.05), // เครื่องจักรทำผ้าไหม
        R(-5.5, -3.9, -4.9, -3.3), // แคร่ใหญ่ 2 ตัวข้างครัว
        R(-5.8, -4.6, 3.2, 4.8), // เตียงน้ารง
      ]
  // ชั้นล่าง: ผนังข้างบันได (ไม่ให้เดินลอดใต้บันได)
  const stairSide = upper ? [] : [R(STAIRS.x0 - 0.2, STAIRS.x0 - 0.05, STAIRS.zTop, STAIRS.zBottom - 1.2)]
  return [...outer, ...walls, ...furniture, ...stairSide]
}

/** กล้องต้องอยู่ในตัวบ้าน (ไม่ทะลุผนัง/เพดาน) */
export function interiorCameraBox(upper: boolean) {
  const [ox, oz] = INTERIOR_ORIGIN
  return { minX: ox - IW / 2 + 0.4, maxX: ox + IW / 2 - 0.4, minZ: oz - ID / 2 + 0.4, maxZ: oz + ID / 2 - 0.4, maxY: (upper ? FLOOR2 : 0) + 8 }
}
