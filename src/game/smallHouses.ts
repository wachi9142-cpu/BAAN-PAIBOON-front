/**
 * อาคารเล็กในบ้านตารัง–ยายเลียนที่เดินเข้าไปใช้งานได้ (ผู้สร้าง 19 พ.ย. 2569)
 * - 'cookhouse' บ้านหลังที่สอง: ครัวบนเรือนใต้ถุนสูง (ขึ้นบันไดแล้วกด E ที่ตีนบันได)
 * - 'bathhouse' ห้องน้ำนอกบ้าน: ห้องส้วม · อ่างล้างหน้า · ห้องอาบน้ำ
 * ใช้ฉากภายในชุดเดียวกับบ้านอื่น (วางไว้ไกลที่ INTERIOR_ORIGIN แล้ววาร์ปผู้เล่นเข้าไป)
 * พิกัดภายใน = พิกัดของตัวอาคาร (ก่อนหมุน) · ประตูหน้า = +z
 */
import type { Rect } from './content/temple'
import { LIVE } from './layoutEdit'
import { PLACES } from './content/village'

export type SmallHouseId = 'cookhouse' | 'bathhouse' | 'barber'
export const isSmallHouse = (h: string): h is SmallHouseId => h === 'cookhouse' || h === 'bathhouse' || h === 'barber'

interface SmallDef {
  name: string
  /** Editable id ในบ้าน + ตำแหน่ง/การหมุนตั้งต้น (พิกัดในบริเวณบ้าน) — หรือ place = อยู่ในตัวบ้านชาวบ้าน (pos/rot เทียบกับบ้านนั้น) */
  editId?: string
  place?: string
  /** ทิศหันออกจากประตู เทียบกับแกนอาคาร (0 = หันไป +z) */
  exitFace?: number
  pos: [number, number]
  rot: number
  /** จุดยืนนอกอาคาร (พิกัดตัวอาคาร) — กด E เข้า / ออกมายืนตรงนี้ */
  outside: [number, number]
  /** จุดยืนในอาคารหลังเข้า + จุดกด E ออก */
  inside: [number, number]
  /** กล่องชนภายใน [x0, x1, z0, z1] */
  walls: [number, number, number, number][]
}

export const SMALL: Record<SmallHouseId, SmallDef> = {
  cookhouse: {
    name: 'บ้านหลังที่สอง (ครัว)',
    editId: 'home:cookhouse3',
    pos: [10.6, 3.6],
    rot: -Math.PI / 2,
    outside: [-1.2, 4.3],
    inside: [0.5, -0.15],
    walls: [
      [-2.6, 2.6, -2.15, -2.0], // ผนังหลัง
      [-2.6, -2.45, -2.1, 0.6], // ผนังซ้าย
      [2.45, 2.6, -2.1, 0.6], // ผนังขวา
      [-2.6, 0.0, 0.45, 0.6], // ผนังหน้า (ซ้ายประตู)
      [1.0, 2.6, 0.45, 0.6], // ผนังหน้า (ขวาประตู)
      [-2.1, 1.3, -2.0, -1.3], // โต๊ะไม้ยาว
      [1.4, 2.4, -2.0, -1.3], // โต๊ะเตาแก๊ส
      [-2.45, -1.9, -1.2, 0.2], // ชั้นวางหม้อดิน
    ],
  },
  barber: {
    name: 'ร้านตัดผมชายหญิง ช่างโรจน์',
    place: 'house-rot',
    pos: [-3.9, 0],
    rot: 0,
    exitFace: -Math.PI / 2,
    outside: [-2.6, 0],
    inside: [-1.0, 0],
    walls: [
      [-1.6, 1.6, -3.5, -3.3], // ผนังหลัง
      [-1.6, 1.6, 3.3, 3.5], // กระจกหน้าร้าน
      [1.45, 1.6, -3.4, 3.4], // ผนังเทา (กระจกเงา)
      [-1.7, -1.55, -3.4, 3.4], // ประตูกระจก (ออกด้วยปุ่ม E)
      [0.3, 0.8, -1.75, -1.25], // เก้าอี้ตัดผม 1
      [0.3, 0.8, 0.95, 1.45], // เก้าอี้ตัดผม 2
      [-1.3, -0.6, -3.1, -2.8], // ชั้นวางสินค้า
      [0.9, 1.4, -0.45, 0.05], // ต้นมอนสเตอร่า
      [0.85, 1.45, 2.4, 3.0],
    ],
  },
  bathhouse: {
    name: 'ห้องน้ำนอกบ้าน',
    editId: 'home:toilets3',
    pos: [9.8, 17],
    rot: -Math.PI / 2,
    outside: [0, 3.2],
    inside: [0, 1.9],
    walls: [
      [-3.3, 3.3, -2.65, -2.45], // ผนังหลัง
      [-3.35, -3.15, -2.6, 2.6], // ผนังซ้าย
      [3.15, 3.35, -2.6, 2.6], // ผนังขวา
      [-0.66, -0.54, -2.5, 0.7], // ผนังกั้นห้องส้วม
      [0.54, 0.66, -2.5, 0.7], // ผนังกั้นห้องอาบน้ำ
      [-3.2, -1.6, 0.66, 0.76], // ผนังหน้าห้องส้วม
      [-0.75, -0.6, 0.66, 0.76],
      [0.6, 0.75, 0.66, 0.76], // ผนังหน้าห้องอาบน้ำ
      [1.6, 3.2, 0.66, 0.76],
      [-2.15, -1.65, -2.45, -1.35], // ชักโครก
      [-0.52, 0.52, -2.45, -1.65], // อ่างล้างหน้า
      [0.75, 1.55, -2.45, -1.55], // โอ่งในห้องอาบน้ำ
      [-3.3, 3.3, 2.6, 2.8], // ขอบชาน (ทางออกใช้กด E)
    ],
  },
}

/** ตำแหน่ง/การหมุนปัจจุบันของอาคาร (ตามที่ผู้สร้างลากย้ายในเกม) ในพิกัดโลก */
function placeOf(id: SmallHouseId): { x: number; z: number; rot: number } {
  const home = PLACES.find((p) => p.id === 'home-tarang')!
  const d = SMALL[id]
  if (d.place) {
    const pl = PLACES.find((p) => p.id === d.place)!
    const m = LIVE.map['place:' + d.place]
    const [px, pz] = m ? [m.x, m.z] : pl.pos
    const pr = m ? m.rot : pl.rotation ?? 0
    const c = Math.cos(pr)
    const sn = Math.sin(pr)
    return { x: px + d.pos[0] * c + d.pos[1] * sn, z: pz - d.pos[0] * sn + d.pos[1] * c, rot: pr + d.rot }
  }
  const m = LIVE.map[d.editId!]
  // Editable: rot ที่บันทึก = การหมุนเพิ่มจากตั้งต้น (ตามระบบย้ายที่)
  const x = m ? m.x : d.pos[0]
  const z = m ? m.z : d.pos[1]
  const rot = d.rot + (m ? m.rot : 0)
  return { x: home.pos[0] + x, z: home.pos[1] + z, rot }
}

/** แปลงพิกัดตัวอาคาร → พิกัดโลก */
export function smallToWorld(id: SmallHouseId, lx: number, lz: number): [number, number] {
  const p = placeOf(id)
  const c = Math.cos(p.rot)
  const s = Math.sin(p.rot)
  return [p.x + lx * c + lz * s, p.z - lx * s + lz * c]
}
/** ทิศหันหน้าออกจากอาคาร (หันหลังให้ประตู) */
export const smallExitHeading = (id: SmallHouseId) => placeOf(id).rot + (SMALL[id].exitFace ?? 0)

/** ใกล้ประตูอาคารไหน (ด้านนอก) */
export function nearSmallDoor(x: number, z: number): SmallHouseId | null {
  for (const id of Object.keys(SMALL) as SmallHouseId[]) {
    const [dx, dz] = smallToWorld(id, ...SMALL[id].outside)
    if (Math.hypot(dx - x, dz - z) < 1.6) return id
  }
  return null
}

export function smallColliders(id: SmallHouseId, R: (x0: number, x1: number, z0: number, z1: number) => Rect): Rect[] {
  return SMALL[id].walls.map(([x0, x1, z0, z1]) => R(x0, x1, z0, z1))
}
