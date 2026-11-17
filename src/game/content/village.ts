// แผนที่หมู่บ้าน (ผังสมมุติ ไม่ใช่ผังจริง — ดูกฎความเป็นส่วนตัวใน docs/VILLAGE_MAP.md) — ข้อมูลล้วน เพิ่มสถานที่/แปลงที่ดินใหม่ได้ที่นี่
// พิกัด: x = ตะวันออก(+)/ตะวันตก(-), z = ใต้(+)/เหนือ(-), หน่วยเมตร

export type Vec2 = [number, number]

export type PlaceKind =
  | 'temple'
  | 'pond'
  | 'ricefield'
  | 'questboard'
  | 'shop'
  | 'sala'
  | 'training'
  | 'npchouse'

export interface Place {
  id: string
  name: string
  kind: PlaceKind
  pos: Vec2
  /** ขนาดพื้นที่ (กว้าง x ลึก) */
  size: Vec2
  rotation?: number
  /** ข้อความเมื่อผู้เล่นเดินมาถึง */
  arriveText?: string
  /** ระบบที่จะเปิดใช้ในอนาคต (แสดงเป็น "เร็ว ๆ นี้") */
  comingSoon?: string
  /** ทาสีบ้านชาวบ้าน */
  color?: string
  /** วงชนสำหรับกันเดินทะลุ (0 = เดินผ่านได้) */
  solidRadius?: number
}

export interface Plot {
  id: string
  name: string
  center: Vec2
  size: Vec2
  /** ราคาซื้อ (0 = แปลงเริ่มต้นฟรี) */
  price: number
  /** ตำแหน่งบ้านภายในแปลง (relative to center) */
  houseOffset: Vec2
}

export interface Road {
  from: Vec2
  to: Vec2
  width: number
}

export const WORLD_HALF_SIZE = 90

export const SPAWN: Vec2 = [0, 8]

export const ROADS: Road[] = [
  { from: [-80, 0], to: [80, 0], width: 5 }, // ถนนสายหลักกลางหมู่บ้าน
  { from: [0, -70], to: [0, 0], width: 4 }, // ถนนไปวัด
  { from: [30, 0], to: [30, 60], width: 3.5 }, // ซอยไปบ้านผู้เล่น
  { from: [-35, 0], to: [-35, 45], width: 3.5 }, // ทางไปบ่อปลา
]

export const PLACES: Place[] = [
  {
    id: 'temple',
    name: 'วัด',
    kind: 'temple',
    pos: [0, -62],
    size: [16, 12],
    arriveText: 'ทุกเช้าชาวบ้านจะมาใส่บาตรที่นี่',
    comingSoon: 'ใส่บาตรตอนเช้า (Part 2)',
    solidRadius: 8,
  },
  {
    id: 'sala',
    name: 'ศาลาประชาคม',
    kind: 'sala',
    pos: [-14, -14],
    size: [10, 7],
    arriveText: 'ที่ประชุมหมู่บ้านและงานเทศกาล',
    comingSoon: 'ประชุมหมู่บ้านและเทศกาล (Part 7)',
    solidRadius: 0,
  },
  {
    id: 'questboard',
    name: 'บอร์ดประกาศหมู่บ้าน',
    kind: 'questboard',
    pos: [6, -6],
    size: [3, 1],
    arriveText: 'ชาวบ้านมาติดประกาศหาคนช่วยงานที่นี่',
    comingSoon: 'รับงานจ้างและภารกิจ (Part 3)',
    solidRadius: 1.2,
  },
  {
    id: 'shop',
    name: 'ร้านค้าป้าศรี',
    kind: 'shop',
    pos: [14, -10],
    size: [7, 6],
    arriveText: 'ร้านขายของชำประจำหมู่บ้าน',
    comingSoon: 'ซื้อขายของ (Part 3)',
    solidRadius: 4,
  },
  {
    id: 'training',
    name: 'ศูนย์ฝึกอาชีพ',
    kind: 'training',
    pos: [-48, -18],
    size: [12, 8],
    arriveText: 'เรียนเลี้ยงหนอนไหม ทอผ้า และอาชีพอื่น ๆ',
    comingSoon: 'ฝึกอาชีพ (Part 4)',
    solidRadius: 6,
  },
  {
    id: 'pond',
    name: 'บ่อปลาลุงเขียว',
    kind: 'pond',
    pos: [-50, 38],
    size: [20, 14],
    arriveText: 'บ่อปลาดุกของลุงเขียว ชาวประมงของหมู่บ้าน',
    comingSoon: 'ตกปลา (Part 2–3)',
    solidRadius: 0,
  },
  {
    id: 'ricefield',
    name: 'ทุ่งนา',
    kind: 'ricefield',
    pos: [-5, 42],
    size: [36, 28],
    arriveText: 'ทุ่งนากว้างสุดลูกหูลูกตา',
    comingSoon: 'ปลูกข้าวและต้อนเป็ด (Part 4)',
    solidRadius: 0,
  },
  // บ้านชาวบ้าน (Part 6 จะใส่ชาวบ้านและกิจวัตร)
  { id: 'house-khiao', name: 'บ้านลุงเขียว', kind: 'npchouse', pos: [-30, 18], size: [6, 5], color: '#7d5a3c', solidRadius: 4.2 },
  { id: 'house-si', name: 'บ้านป้าศรี', kind: 'npchouse', pos: [22, -18], size: [6, 5], color: '#c9b79a', solidRadius: 4.2 },
  { id: 'house-mai', name: 'บ้านยายไหม', kind: 'npchouse', pos: [-46, -34], size: [6, 5], color: '#8f6a46', solidRadius: 4.2 },
  { id: 'house-thong', name: 'บ้านตาทอง', kind: 'npchouse', pos: [46, -14], size: [6, 5], color: '#a8805a', solidRadius: 4.2 },
  { id: 'house-kaew', name: 'บ้านน้าแก้ว', kind: 'npchouse', pos: [-20, 10], size: [6, 5], color: '#d4c4a8', solidRadius: 4.2 },
  { id: 'house-dam', name: 'บ้านพี่ดำ', kind: 'npchouse', pos: [58, 14], size: [6, 5], color: '#6e4f37', solidRadius: 4.2 },
]

export const PLOTS: Plot[] = [
  { id: 'start-plot', name: 'ที่ดินของฉัน', center: [44, 36], size: [20, 18], price: 0, houseOffset: [0, -3] },
]

export const STARTING_PLOT_ID = 'start-plot'

/** ต้นไม้ประดับ — สุ่มแบบคงที่ (seed) เพื่อให้หมู่บ้านหน้าตาเหมือนเดิมทุกครั้ง */
export type TreeKind = 'coconut' | 'banana' | 'mango'
export interface TreeSpot {
  pos: Vec2
  kind: TreeKind
  scale: number
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function distToSegment(p: Vec2, a: Vec2, b: Vec2) {
  const [px, pz] = p
  const [ax, az] = a
  const [bx, bz] = b
  const dx = bx - ax
  const dz = bz - az
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz))
}

function inRect(p: Vec2, c: Vec2, s: Vec2, pad: number) {
  return Math.abs(p[0] - c[0]) < s[0] / 2 + pad && Math.abs(p[1] - c[1]) < s[1] / 2 + pad
}

export function isBlockedForDecor(p: Vec2) {
  if (ROADS.some((r) => distToSegment(p, r.from, r.to) < r.width / 2 + 2)) return true
  if (PLACES.some((pl) => inRect(p, pl.pos, pl.size, 3))) return true
  if (PLOTS.some((pl) => inRect(p, pl.center, pl.size, 2))) return true
  if (Math.hypot(p[0] - SPAWN[0], p[1] - SPAWN[1]) < 6) return true
  return false
}

export const TREES: TreeSpot[] = (() => {
  const rand = mulberry32(2565)
  const kinds: TreeKind[] = ['coconut', 'banana', 'mango']
  const out: TreeSpot[] = []
  let guard = 0
  while (out.length < 140 && guard++ < 4000) {
    const p: Vec2 = [(rand() * 2 - 1) * (WORLD_HALF_SIZE - 4), (rand() * 2 - 1) * (WORLD_HALF_SIZE - 4)]
    if (isBlockedForDecor(p)) continue
    if (out.some((t) => Math.hypot(t.pos[0] - p[0], t.pos[1] - p[1]) < 4)) continue
    out.push({ pos: p, kind: kinds[Math.floor(rand() * kinds.length)], scale: 0.8 + rand() * 0.5 })
  }
  return out
})()
