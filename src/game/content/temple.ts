// ขนาดโบสถ์วัด (เดินเข้าไปกราบพระได้) — ใช้ร่วมกันทั้งโมเดลและกำแพงชน
import type { Vec2 } from './village'

export const TEMPLE = {
  /** ตำแหน่งกลางโบสถ์ในหมู่บ้าน */
  pos: [0, -60] as Vec2,
  /** ความกว้าง (แกน x) และความยาว (แกน z) ของตัวโบสถ์ */
  hallW: 12,
  hallD: 20,
  wallH: 4.6,
  /** ความกว้างประตูหน้า */
  door: 3.2,
  /** ตำแหน่งพระประธาน (z ภายในโบสถ์ ใกล้ผนังหลัง) */
  altarZ: -6.2,
  /** ระยะจากผนังหลังโบสถ์ถึงกลางเจดีย์ */
  chediGap: 9,
  /** ความสูงฐานยกพื้น (เมตร) */
  floorY: 1.0,
  /** ระเบียงหน้าโบสถ์ยื่นจากผนังหน้า */
  porch: 3.4,
  /** ความยาวบันไดหน้า */
  stairLen: 2.4,
}

/** ความสูงพื้นที่ยืน (ในโบสถ์/บนระเบียง/บนบันได) — นอกวัด = 0 */
export function templeGroundY(x: number, z: number) {
  const lx = x - TEMPLE.pos[0]
  const lz = z - TEMPLE.pos[1]
  const hd = TEMPLE.hallD / 2
  const front = hd + TEMPLE.porch
  if (Math.abs(lx) <= TEMPLE.hallW / 2 + 1 && lz >= -hd - 1 && lz <= front) return TEMPLE.floorY
  if (Math.abs(lx) <= TEMPLE.door / 2 + 0.9 && lz > front && lz < front + TEMPLE.stairLen)
    return TEMPLE.floorY * (1 - (lz - front) / TEMPLE.stairLen)
  return 0
}

/** จุดยืนกราบพระ (พิกัดโลก) */
export const WORSHIP_SPOT: Vec2 = [TEMPLE.pos[0], TEMPLE.pos[1] + TEMPLE.altarZ + 3.2]

export interface Rect {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/** กำแพงโบสถ์ (สี่เหลี่ยมชน) — เว้นช่องประตูด้านหน้าให้เดินเข้าได้ */
export function templeWalls(): Rect[] {
  const [cx, cz] = TEMPLE.pos
  const hw = TEMPLE.hallW / 2
  const hd = TEMPLE.hallD / 2
  const t = 0.3
  const dh = TEMPLE.door / 2
  const altarZ = cz + TEMPLE.altarZ
  return [
    { minX: cx - hw - t, maxX: cx - hw + t, minZ: cz - hd, maxZ: cz + hd }, // ซ้าย
    { minX: cx + hw - t, maxX: cx + hw + t, minZ: cz - hd, maxZ: cz + hd }, // ขวา
    { minX: cx - hw, maxX: cx + hw, minZ: cz - hd - t, maxZ: cz - hd + t }, // หลัง
    { minX: cx - hw, maxX: cx - dh, minZ: cz + hd - t, maxZ: cz + hd + t }, // หน้าซ้าย
    { minX: cx + dh, maxX: cx + hw, minZ: cz + hd - t, maxZ: cz + hd + t }, // หน้าขวา
    // ฐานพระประธาน + โต๊ะหมู่บูชา (ไม่ให้เดินทะลุ)
    { minX: cx - 3.4, maxX: cx + 3.4, minZ: altarZ - 2, maxZ: altarZ + 1.4 },
    // ฐานเจดีย์
    { minX: cx - 6.6, maxX: cx + 6.6, minZ: cz - hd - TEMPLE.chediGap - 6.6, maxZ: cz - hd - TEMPLE.chediGap + 6.6 },
    // ระฆัง + แท่นธูปเทียน
    ...SPOT_LOCAL.bells.map(([x, z]) => ({ minX: cx + x - 0.3, maxX: cx + x + 0.3, minZ: cz + z - 0.7, maxZ: cz + z + 0.7 })),
    { minX: cx + SPOT_LOCAL.incense[0] - 0.7, maxX: cx + SPOT_LOCAL.incense[0] + 2.1, minZ: cz + SPOT_LOCAL.incense[1] - 0.45, maxZ: cz + SPOT_LOCAL.incense[1] + 0.45 },
    // ตู้ใบเซียมซี
    { minX: cx + SPOT_LOCAL.slips[0] - 0.9, maxX: cx + SPOT_LOCAL.slips[0] + 2.4, minZ: cz + SPOT_LOCAL.slips[1] - 0.35, maxZ: cz + SPOT_LOCAL.slips[1] + 0.35 },
    // พระเจดีย์องค์ใหญ่ข้างวัด (ฐานองค์ระฆัง)
    { minX: 30 - 9.1, maxX: 30 + 9.1, minZ: -62 - 9.1, maxZ: -62 + 9.1 },
    // เสามุขหน้า
    ...[-3.2, -1.3, 1.3, 3.2].map((x) => ({ minX: cx + x - 0.3, maxX: cx + x + 0.3, minZ: cz + hd + 1.3, maxZ: cz + hd + 1.9 })),
  ]
}

/** ถ้าอยู่ในตัวโบสถ์ คืนขอบเขตที่กล้องอยู่ได้ (ไม่ให้กล้องทะลุผนัง) */
export function insideTempleBox(x: number, z: number) {
  const [cx, cz] = TEMPLE.pos
  const hw = TEMPLE.hallW / 2
  const hd = TEMPLE.hallD / 2
  if (Math.abs(x - cx) > hw || z < cz - hd || z > cz + hd) return null
  const m = 0.6
  return { minX: cx - hw + m, maxX: cx + hw - m, minZ: cz - hd + m, maxZ: cz + hd - m }
}

// ---------- จุดทำบุญรอบโบสถ์ ----------
export type TempleSpotKind = 'donate' | 'birthday' | 'incense' | 'bell' | 'water' | 'shoes' | 'slips'
export interface TempleSpot {
  id: string
  kind: TempleSpotKind
  /** พิกัดโลก */
  x: number
  z: number
}

/** ตำแหน่งภายในโบสถ์ (สัมพัทธ์กับกลางโบสถ์) — ใช้ทั้งโมเดลและการเช็กระยะ */
export const SPOT_LOCAL = {
  donate: [-4.6, TEMPLE.hallD / 2 + 2.4] as const,
  birthday: [4.6, TEMPLE.hallD / 2 + 2.4] as const,
  incense: [-4.2, TEMPLE.hallD / 2 + TEMPLE.porch + TEMPLE.stairLen + 3.2] as const,
  /** ลานถอดรองเท้า ข้างตีนบันได */
  shoes: [3.4, TEMPLE.hallD / 2 + TEMPLE.porch + TEMPLE.stairLen + 0.9] as const,
  /** คนโทกรวดน้ำ (บนระเบียงหน้าประตู) */
  water: [-2.2, TEMPLE.hallD / 2 + 1.4] as const,
  /** ป้ายลำดับการทำบุญ */
  sign: [-5.6, TEMPLE.hallD / 2 + TEMPLE.porch + TEMPLE.stairLen + 6.5] as const,
  /** ตู้ใบคำทำนายเซียมซี + ป้ายวิธีใช้ (ลานหน้าโบสถ์ ฝั่งขวา) */
  slips: [5.4, TEMPLE.hallD / 2 + TEMPLE.porch + TEMPLE.stairLen + 3.6] as const,
  /** ระฆังสองข้างโบสถ์ */
  bells: [-1, 1].flatMap((sx) => [-6, -2, 2, 6].map((z) => [sx * (TEMPLE.hallW / 2 + 2.8), z] as const)),
}

export function templeSpots(): TempleSpot[] {
  const [cx, cz] = TEMPLE.pos
  return [
    { id: 'donate', kind: 'donate', x: cx + SPOT_LOCAL.donate[0], z: cz + SPOT_LOCAL.donate[1] },
    { id: 'birthday', kind: 'birthday', x: cx + SPOT_LOCAL.birthday[0], z: cz + SPOT_LOCAL.birthday[1] },
    { id: 'incense', kind: 'incense', x: cx + SPOT_LOCAL.incense[0], z: cz + SPOT_LOCAL.incense[1] },
    { id: 'water', kind: 'water', x: cx + SPOT_LOCAL.water[0], z: cz + SPOT_LOCAL.water[1] },
    { id: 'shoes', kind: 'shoes', x: cx + SPOT_LOCAL.shoes[0], z: cz + SPOT_LOCAL.shoes[1] },
    { id: 'slips', kind: 'slips', x: cx + SPOT_LOCAL.slips[0], z: cz + SPOT_LOCAL.slips[1] + 0.9 },
    ...SPOT_LOCAL.bells.map(([x, z], i) => ({ id: 'bell' + i, kind: 'bell' as const, x: cx + x, z: cz + z })),
  ]
}

/** หยอดเหรียญประจำวันเกิด: สีประจำวันและคำอวยพร */
export const BIRTH_DAYS = [
  { id: 'sun', label: 'อาทิตย์', color: '#d9473a', wish: 'ขอให้มีพลัง สดใสเหมือนแสงอาทิตย์' },
  { id: 'mon', label: 'จันทร์', color: '#f2c230', wish: 'ขอให้จิตใจสงบเย็น มีคนรักใคร่' },
  { id: 'tue', label: 'อังคาร', color: '#e88aa8', wish: 'ขอให้กล้าหาญ ทำสิ่งใดก็สำเร็จ' },
  { id: 'wed', label: 'พุธ', color: '#4f9a4a', wish: 'ขอให้พูดจามีเสน่ห์ ค้าขายรุ่งเรือง' },
  { id: 'thu', label: 'พฤหัสบดี', color: '#e0802e', wish: 'ขอให้มีปัญญา เรียนรู้ได้รวดเร็ว' },
  { id: 'fri', label: 'ศุกร์', color: '#5fa0d8', wish: 'ขอให้มีความสุข ครอบครัวอบอุ่น' },
  { id: 'sat', label: 'เสาร์', color: '#8a5aa8', wish: 'ขอให้อดทน มั่นคง ผ่านพ้นอุปสรรค' },
]
