// สิ่งปลูกสร้างที่ผู้เล่นวางเองได้ในที่ดินของตัวเอง (โหมดสร้าง กด B) — ข้อมูลล้วน เพิ่มชนิดใหม่ได้ที่นี่
// แล้วเพิ่มโมเดลใน src/scenes/Structures.tsx
import type { Cost } from './items'
import type { Rect } from './temple'
import { GARDEN_BEDS, GARDEN_JAR, BED_SIZE } from './garden'
import { PLACES, PLOTS, type Vec2 } from './village'
import { HOME_BOX, HOME_SOLIDS } from '../../scenes/GrandHome'

export type StructureId = 'workbench' | 'chest' | 'fence' | 'scarecrow' | 'shed' | 'pen' | 'greenhouse'

export interface StructureDef {
  id: StructureId
  name: string
  icon: string
  /** ขนาดฐาน กว้าง (แกน x) × ลึก (แกน z) ตอนยังไม่หมุน */
  size: [number, number]
  cost: Cost
  /** ชน: box = ทึบทั้งก้อน · ring = รั้วรอบ (เว้นช่องประตูด้านหน้า) · none = เดินผ่าน/เข้าไปได้ */
  solid: 'box' | 'ring' | 'none'
  /** กด E ใกล้ ๆ ทำอะไร */
  use?: 'craft' | 'storage'
  note: string
}

export const STRUCTURES: Record<StructureId, StructureDef> = {
  workbench: { id: 'workbench', name: 'โต๊ะประดิษฐ์', icon: '🛠️', size: [1.6, 0.8], cost: { log: 2, branch: 4 }, solid: 'box', use: 'craft', note: 'กด E ที่โต๊ะเพื่อประดิษฐ์ของ' },
  chest: { id: 'chest', name: 'กล่องเก็บของ', icon: '📦', size: [0.9, 0.6], cost: { log: 2, vine: 2 }, solid: 'box', use: 'storage', note: 'ฝากของไว้ที่บ้าน กระเป๋าจะได้ไม่เต็ม (กล่องละ 20 ช่อง)' },
  fence: { id: 'fence', name: 'รั้วไม้ไผ่ (2 เมตร)', icon: '🎋', size: [2, 0.25], cost: { branch: 3, vine: 1 }, solid: 'box', note: 'กั้นแนวเขต แบ่งพื้นที่ในบ้าน' },
  scarecrow: { id: 'scarecrow', name: 'หุ่นไล่กา', icon: '👒', size: [0.6, 0.6], cost: { branch: 3, vine: 2 }, solid: 'box', note: 'ไล่นกไม่ให้มากินผักในแปลง (ของประดับ)' },
  shed: { id: 'shed', name: 'โรงเก็บของ', icon: '🏚️', size: [3, 2.4], cost: { log: 6, plank: 4, stone: 4 }, solid: 'box', note: 'เก็บเครื่องมือและฟืน (ระบบเก็บเครื่องมือเร็ว ๆ นี้)' },
  pen: { id: 'pen', name: 'คอกสัตว์', icon: '🐄', size: [4, 4], cost: { log: 4, branch: 8, vine: 4 }, solid: 'ring', note: 'คอกล้อมรั้ว มีประตูด้านหน้า (เลี้ยงสัตว์ในคอกเร็ว ๆ นี้)' },
  greenhouse: { id: 'greenhouse', name: 'โรงเรือนเพาะชำ', icon: '🌿', size: [4, 3], cost: { log: 4, plank: 4, vine: 6 }, solid: 'none', note: 'หลังคาตาข่ายพรางแสง เดินเข้าไปได้ (ปลูกต้นกล้าเร็ว ๆ นี้)' },
}
export const STRUCTURE_LIST = Object.values(STRUCTURES)

export interface PlacedStructure {
  uid: string
  id: StructureId
  x: number
  z: number
  /** หมุนทีละ 90° (0–3) */
  rot: number
}

/** ขนาดฐานหลังหมุน */
export function footprint(id: StructureId, rot: number): [number, number] {
  const [w, d] = STRUCTURES[id].size
  return rot % 2 ? [d, w] : [w, d]
}

export function rectOf(id: StructureId, x: number, z: number, rot: number): Rect {
  const [w, d] = footprint(id, rot)
  return { minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 }
}

/** หมุนจุด (local) ทีละ 90° ตามแกน y แบบเดียวกับ three.js rotation.y = rot·π/2 */
function rotLocal(lx: number, lz: number, rot: number): Vec2 {
  const r = ((rot % 4) + 4) % 4
  if (r === 0) return [lx, lz]
  if (r === 1) return [lz, -lx]
  if (r === 2) return [-lx, -lz]
  return [-lz, lx]
}

/** กล่องชนของสิ่งปลูกสร้าง (ในพิกัดโลก) */
export function structureColliders(s: PlacedStructure): Rect[] {
  const def = STRUCTURES[s.id]
  if (def.solid === 'none') return []
  if (def.solid === 'box') return [rectOf(s.id, s.x, s.z, s.rot)]
  // ring: รั้ว 4 ด้าน เว้นประตูกว้าง 1.4 ม. ด้านหน้า (+z)
  const [w, d] = def.size
  const t = 0.2
  const gate = 1.4
  const locals: [number, number, number, number][] = [
    [-w / 2, w / 2, -d / 2 - t / 2, -d / 2 + t / 2], // หลัง
    [-w / 2 - t / 2, -w / 2 + t / 2, -d / 2, d / 2], // ซ้าย
    [w / 2 - t / 2, w / 2 + t / 2, -d / 2, d / 2], // ขวา
    [-w / 2, -gate / 2, d / 2 - t / 2, d / 2 + t / 2], // หน้าซ้าย
    [gate / 2, w / 2, d / 2 - t / 2, d / 2 + t / 2], // หน้าขวา
  ]
  return locals.map(([x0, x1, z0, z1]) => {
    const a = rotLocal(x0, z0, s.rot)
    const b = rotLocal(x1, z1, s.rot)
    return { minX: s.x + Math.min(a[0], b[0]), maxX: s.x + Math.max(a[0], b[0]), minZ: s.z + Math.min(a[1], b[1]), maxZ: s.z + Math.max(a[1], b[1]) }
  })
}

// ---------- พื้นที่สร้างได้ / สร้างไม่ได้ ----------
/** ห่างรั้วที่ดินอย่างน้อยเท่านี้ */
const FENCE_GAP = 0.5

/** เขตที่ดินที่วางของได้ (ที่ดินของฉัน ลบระยะห่างจากรั้ว) */
export function buildArea(ownedPlotIds: string[]): Rect[] {
  const out: Rect[] = PLOTS.filter((p) => ownedPlotIds.includes(p.id)).map((p) => ({
    minX: p.center[0] - p.size[0] / 2 + FENCE_GAP,
    maxX: p.center[0] + p.size[0] / 2 - FENCE_GAP,
    minZ: p.center[1] - p.size[1] / 2 + FENCE_GAP,
    maxZ: p.center[1] + p.size[1] / 2 - FENCE_GAP,
  }))
  // บ้านตารัง–ยายเลียน (บ้านฟ่าง) เป็นอาณาเขตของตัวเองด้วย
  const hp = PLACES.find((p) => p.id === 'home-tarang')
  if (hp) out.push({ minX: hp.pos[0] + HOME_BOX.x0 + FENCE_GAP, maxX: hp.pos[0] + HOME_BOX.x1 - FENCE_GAP, minZ: hp.pos[1] + HOME_BOX.z0 + FENCE_GAP, maxZ: hp.pos[1] + HOME_BOX.z1 - FENCE_GAP })
  return out
}

/** อยู่ในอาณาเขตของตัวเองไหม */
export function inTerritory(x: number, z: number, ownedPlotIds: string[]) {
  return buildArea(ownedPlotIds).some((a) => x >= a.minX && x <= a.maxX && z >= a.minZ && z <= a.maxZ)
}

/** เขตห้ามสร้างในที่ดิน: ตัวบ้าน (+ทางเดินหน้าบ้าน) · ทางเข้าประตูรั้ว · แปลงผัก */
export function blockedZones(): Rect[] {
  const p = PLOTS[0]
  const hx = p.center[0] + p.houseOffset[0]
  const hz = p.center[1] + p.houseOffset[1]
  const out: Rect[] = [
    // บ้าน 6×5 หันหน้าไปทางตะวันตก (ประตูรั้ว) + เผื่อรอบตัวบ้าน
    { minX: hx - 4.6, maxX: hx + 3.6, minZ: hz - 3.8, maxZ: hz + 3.8 },
    // ทางเดินจากประตูรั้วถึงหน้าบ้าน
    { minX: p.center[0] - p.size[0] / 2, maxX: hx - 3, minZ: p.center[1] - 1.6, maxZ: p.center[1] + 1.6 },
  ]
  out.push({ minX: GARDEN_JAR[0] - 0.6, maxX: GARDEN_JAR[0] + 0.6, minZ: GARDEN_JAR[1] - 0.6, maxZ: GARDEN_JAR[1] + 0.6 })
  // บ้านตา: ตัวบ้าน ครัว ยุ้ง เล้า คอก (เผื่อทางเดินรอบ 0.6 ม.)
  const hp = PLACES.find((pl) => pl.id === 'home-tarang')
  if (hp) for (const [x, z, w, d] of HOME_SOLIDS) out.push({ minX: hp.pos[0] + x - w / 2 - 0.6, maxX: hp.pos[0] + x + w / 2 + 0.6, minZ: hp.pos[1] + z - d / 2 - 0.6, maxZ: hp.pos[1] + z + d / 2 + 0.6 })
  for (const [bx, bz] of GARDEN_BEDS) {
    const h = BED_SIZE / 2 + 0.25
    out.push({ minX: bx - h, maxX: bx + h, minZ: bz - h, maxZ: bz + h })
  }
  return out
}

export const overlaps = (a: Rect, b: Rect) => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ
const inside = (a: Rect, b: Rect) => a.minX >= b.minX && a.maxX <= b.maxX && a.minZ >= b.minZ && a.maxZ <= b.maxZ

/** ตรวจว่าวางตรงนี้ได้ไหม — คืนเหตุผลถ้าวางไม่ได้ */
export function canPlace(id: StructureId, x: number, z: number, rot: number, placed: PlacedStructure[], ownedPlotIds: string[]): string | null {
  const r = rectOf(id, x, z, rot)
  if (!buildArea(ownedPlotIds).some((a) => inside(r, a))) return 'ต้องวางในรั้วที่ดินของคุณ'
  if (blockedZones().some((b) => overlaps(r, b))) return 'ตรงนี้เป็นตัวบ้าน ทางเดิน หรือแปลงผัก'
  // เว้นช่องเดินระหว่างสิ่งปลูกสร้างนิดหน่อย (ยกเว้นรั้วต่อรั้ว)
  for (const s of placed) {
    const pad = id === 'fence' && s.id === 'fence' ? 0 : 0.2
    const o = rectOf(s.id, s.x, s.z, s.rot)
    if (overlaps(r, { minX: o.minX - pad, maxX: o.maxX + pad, minZ: o.minZ - pad, maxZ: o.maxZ + pad })) return `ชนกับ${STRUCTURES[s.id].name}`
  }
  return null
}

/** กล่องเก็บของ: จำนวนช่อง */
export const CHEST_SLOTS = 20
