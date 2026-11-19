// แหล่งน้ำที่ลงไปได้: ความลึก · กิจกรรมของแต่ละแหล่ง · จุดดอกบัว — ข้อมูลล้วน (ตำแหน่งอ้างอิงจากสถานที่ในหมู่บ้าน)
import { PLACES, type Vec2 } from './village'
import { CAVE_POOL } from '../cave'

export type WaterActivity = 'fish' | 'swim' | 'vest' | 'boat' | 'lotus'

export const ACTIVITY_INFO: Record<WaterActivity, { icon: string; name: string; note: string }> = {
  fish: { icon: '🎣', name: 'ตกปลา', note: 'ต้องมีเบ็ดตกปลา (ร้านเครื่องมือช่าง/ร้านใหญ่)' },
  swim: { icon: '🌊', name: 'เล่นน้ำ', note: 'ริมตลิ่งตื้นเดินลุยได้ · กลางบ่อลึกต้องว่าย (ใส่เสื้อชูชีพปลอดภัยกว่า)' },
  vest: { icon: '🦺', name: 'เสื้อชูชีพ', note: 'สวมก่อนทำกิจกรรมทางน้ำ ว่ายได้ไม่เหนื่อย ไม่จม' },
  boat: { icon: '🚣', name: 'พายเรือ', note: 'ขึ้นเรือที่ท่าน้ำ ใช้ไม้พายพายสำรวจ' },
  lotus: { icon: '🌸', name: 'เก็บดอกบัว', note: 'เดินลุยน้ำหรือพายเรือเข้าไปเก็บ' },
}

export interface WaterBody {
  id: string
  name: string
  shape: 'ellipse' | 'rect'
  pos: Vec2
  size: Vec2
  /** ลึกสุด (ม.) */
  maxDepth: number
  activities: WaterActivity[]
  /** ท่าน้ำ/จุดขึ้นเรือ (พิกัดโลก) */
  dock: Vec2
  /** สะพานข้าม (z กลางสะพาน, ความกว้าง) — บนสะพานไม่ใช่น้ำ */
  bridge?: { z: number; half: number }
  /** ดอกบัว (พิกัดภายใน: สัดส่วน −1..1 ของครึ่งกว้าง/ลึก) */
  lotus: { at: Vec2; white?: boolean }[]
}

function place(id: string) {
  return PLACES.find((p) => p.id === id)
}

export function waterBodies(): WaterBody[] {
  const out: WaterBody[] = []
  const fp = place('pond')
  if (fp)
    out.push({
      id: 'pond',
      name: fp.name,
      shape: 'ellipse',
      pos: fp.pos,
      size: fp.size,
      maxDepth: 1.7,
      activities: ['fish', 'swim', 'vest', 'boat', 'lotus'],
      dock: [fp.pos[0] + fp.size[0] / 2 + 0.6, fp.pos[1]],
      lotus: [
        { at: [-0.4, 0.45] },
        { at: [-0.55, -0.2], white: true },
        { at: [0.15, -0.5] },
        { at: [-0.1, 0.62], white: true },
      ],
    })
  const sp = place('school-pond')
  if (sp)
    out.push({
      id: 'school-pond',
      name: sp.name,
      shape: 'rect',
      pos: sp.pos,
      size: sp.size,
      maxDepth: 1.9,
      activities: ['swim', 'vest', 'boat', 'lotus'],
      dock: [sp.pos[0] + sp.size[0] / 2 + 0.8, sp.pos[1] + 6],
      bridge: { z: sp.pos[1] - 2, half: 1.3 },
      lotus: [
        { at: [-0.5, 0.55] },
        { at: [-0.35, 0.68], white: true },
        { at: [0.45, -0.6] },
        { at: [0.6, 0.4] },
        { at: [-0.62, -0.5], white: true },
        { at: [0.15, 0.82] },
      ],
    })
  // สระน้ำลึกในถ้ำ (ผู้สร้าง 19 พ.ย.) — ว่ายและดำน้ำได้ ลึก 6 ม.
  out.push({ id: 'cave-pool', name: 'สระน้ำในถ้ำ', shape: 'ellipse', pos: CAVE_POOL.pos, size: CAVE_POOL.size, maxDepth: CAVE_POOL.maxDepth, activities: ['swim', 'vest'], dock: [CAVE_POOL.pos[0] - CAVE_POOL.size[0] / 2 - 0.8, CAVE_POOL.pos[1]], lotus: [] })
  return out
}
export const WATER = waterBodies()

/** ความลึกของน้ำที่จุดนี้ (0 = บนบก) + แหล่งน้ำ */
export function waterAt(x: number, z: number): { depth: number; body: WaterBody | null } {
  for (const b of WATER) {
    const dx = x - b.pos[0]
    const dz = z - b.pos[1]
    const hw = b.size[0] / 2
    const hd = b.size[1] / 2
    if (b.bridge && Math.abs(z - b.bridge.z) < b.bridge.half && Math.abs(dx) < hw + 2) return { depth: 0, body: null }
    if (b.shape === 'ellipse') {
      const r2 = (dx / hw) ** 2 + (dz / hd) ** 2
      if (r2 < 1) return { depth: b.maxDepth * Math.pow(1 - r2, 0.6), body: b }
    } else if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
      const edge = Math.min(hw - Math.abs(dx), hd - Math.abs(dz))
      return { depth: Math.min(b.maxDepth, edge * 0.45), body: b }
    }
  }
  return { depth: 0, body: null }
}

/** จุดดอกบัว (พิกัดโลก) */
export function lotusSpots() {
  return WATER.flatMap((b) =>
    b.lotus.map((l, i) => ({ id: `${b.id}-lotus-${i}`, white: !!l.white, x: b.pos[0] + l.at[0] * (b.size[0] / 2), z: b.pos[1] + l.at[1] * (b.size[1] / 2) })),
  )
}
export const LOTUS = lotusSpots()

/** ระดับน้ำ: ลุยน้ำได้ถึงความลึกนี้ · ลึกกว่านี้ต้องว่าย */
export const WADE_MAX = 0.8
