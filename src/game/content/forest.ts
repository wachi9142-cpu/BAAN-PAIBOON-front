/**
 * ป่าดงลึก (ผู้สร้าง 19 พ.ย. 2569) — พื้นที่สมมตินอกหมู่บ้าน (ไม่อิงแผนที่จริง)
 * เดินต่อจากปลายถนนใหญ่ฝั่งตะวันตกเข้าป่าได้เลย (ไม่วาร์ป) · มีทางหลัก + ทางแยก + ทางลับ
 *
 *  ปลายถนน ─► ชายป่า ─► ทางแยกเหนือ (ลานสมุนไพร + เพิงนายพราน)
 *                    └─► ทางแยกใต้ (กองหินเก่า + น้ำซับ)
 *                    └─► ปลายทาง: ศาลเก่าใต้ต้นไทรใหญ่ ─(พุ่มหนาม: ผ่านได้เมื่อมีเครื่องรางเจ้าป่า)─► ลานหิ่งห้อย
 * ข้อมูลล้วน (ไม่มี import ของ store) — collision.ts ใช้ได้โดยไม่วนกัน
 */
export type V2 = [number, number]

/** ขอบเขตป่า (นอกเขตหมู่บ้าน ±119 ฝั่งตะวันตก) */
export const FOREST = { minX: -206, maxX: -119, maxZ: 58 }
export const inForest = (x: number, z: number) => x < FOREST.maxX + 2 && x > FOREST.minX - 2 && Math.abs(z) < FOREST.maxZ + 2

/** ทางเดิน (เส้นหลัก + ทางแยก) — ใช้วาดทางดิน และกันไม่ให้ต้นไม้ขึ้นกลางทาง */
export const TRAILS: { id: string; pts: V2[]; width: number; hidden?: boolean }[] = [
  { id: 'main', width: 2.6, pts: [[-88, 0], [-104, 1.5], [-121, -2.5], [-138, 4], [-152, -5], [-167, -1.5], [-181, 6], [-190, 8]] },
  { id: 'north', width: 1.8, pts: [[-138, 4], [-141, 17], [-139, 29], [-141, 35]] },
  { id: 'south', width: 1.8, pts: [[-152, -5], [-150, -20], [-157, -33], [-160, -39]] },
  { id: 'secret', width: 1.4, hidden: true, pts: [[-190, 8], [-195, 19], [-193, 31], [-190, 42]] },
]

/** ลานโล่ง (ไม่มีต้นไม้) */
export const CLEARINGS: { id: string; pos: V2; r: number }[] = [
  { id: 'shrine', pos: [-191, 8], r: 8.5 },
  { id: 'grove', pos: [-141, 37], r: 7.5 },
  { id: 'spring', pos: [-161, -41], r: 6.5 },
  { id: 'glade', pos: [-190, 45], r: 8 },
]

/** จุดค้นพบ (เดินเข้าใกล้ครั้งแรก = ขึ้นข้อความค้นพบ) */
export const FOREST_FINDS: { id: string; pos: V2; r: number; title: string; body: string }[] = [
  { id: 'edge', pos: [-121, -2], r: 6, title: '🌳 ค้นพบ: ป่าดงลึก', body: 'ป่ารกนอกหมู่บ้าน เดินตามทางดินไปเรื่อย ๆ จะเจอทางแยก · ระวังหลงทางนะ' },
  { id: 'grove', pos: [-141, 35], r: 7, title: '🌿 ค้นพบ: ลานสมุนไพร', body: 'มีเห็ดป่าและสมุนไพรขึ้นเต็ม เก็บได้ทุกวัน · ข้าง ๆ มีเพิงพักนายพรานเก่า' },
  { id: 'spring', pos: [-160, -39], r: 6, title: '💧 ค้นพบ: น้ำซับกลางป่า', body: 'น้ำใสไหลซึมจากใต้ดิน ดื่มแก้กระหายได้ · มีกองหินเก่าวางดอกไม้แห้งไว้' },
  { id: 'shrine', pos: [-188, 8], r: 9, title: '⛩️ ค้นพบ: ศาลเก่าใต้ต้นไทร', body: 'ศาลไม้เก่าที่ไม่มีใครดูแลมานาน ผ้าแพรสีซีดผูกไว้รอบต้นไทร… ลองกด E ที่ศาลดู' },
  { id: 'glade', pos: [-190, 43], r: 7, title: '✨ ค้นพบ: ลานหิ่งห้อย', body: 'ที่ลับหลังศาล — ไม่ใช่ทุกคนจะมาถึงที่นี่ได้' },
]

/** จุดเก็บของ (เห็ด/สมุนไพร) — มีใหม่ทุกวันในเกม */
export const HERB_SPOTS: { id: string; pos: V2; kind: 'mushroom' | 'herb' | 'rareherb' }[] = [
  { id: 'h1', pos: [-138, 37], kind: 'mushroom' },
  { id: 'h2', pos: [-144, 39], kind: 'herb' },
  { id: 'h3', pos: [-143, 33], kind: 'mushroom' },
  { id: 'h4', pos: [-137.5, 32], kind: 'herb' },
  { id: 'h5', pos: [-129, 3.5], kind: 'mushroom' },
  { id: 'h6', pos: [-171, 2.5], kind: 'herb' },
  { id: 'h7', pos: [-155, -27], kind: 'mushroom' },
  { id: 'h8', pos: [-187, 47], kind: 'rareherb' },
  { id: 'h9', pos: [-193, 46], kind: 'rareherb' },
]

export const SHRINE_POS: V2 = [-193.5, 8.5]
/** ต้นไทรใหญ่หลังศาล */
export const BANYAN_POS: V2 = [-198, 10]
export const SPRING_POS: V2 = [-163, -42]
export const CAIRN_POS: V2 = [-157.5, -37]
export const SHED_POS: V2 = [-146.5, 36]
/** พุ่มหนามปิดทางลับ (หายไปเมื่อมีเครื่องรางเจ้าป่า) */
export const THORNS: V2[] = [[-194.2, 16], [-195.8, 17.2], [-192.6, 17], [-194.8, 18.6]]

function rnd(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}
function segDist(p: V2, a: V2, b: V2) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t)
}
export function trailDist(p: V2, includeHidden = true) {
  let d = Infinity
  for (const t of TRAILS) {
    if (t.hidden && !includeHidden) continue
    for (let i = 0; i < t.pts.length - 1; i++) d = Math.min(d, segDist(p, t.pts[i], t.pts[i + 1]) - t.width / 2)
  }
  return d
}

export interface ForestTree {
  x: number
  z: number
  /** 0 = ไม้ใหญ่ทรงพุ่มกลม · 1 = ไม้สูงยอดแหลม · 2 = ไผ่ */
  kind: 0 | 1 | 2
  s: number
  rot: number
}

/** ต้นไม้ในป่า (สุ่มแบบคงที่) — หนาแน่นแต่เว้นทางเดินและลานโล่ง */
export const FOREST_TREES: ForestTree[] = (() => {
  const r = rnd(9157)
  const out: ForestTree[] = []
  let tries = 0
  while (out.length < 430 && tries++ < 9000) {
    const x = FOREST.minX + 1 + r() * (FOREST.maxX - FOREST.minX - 1)
    const z = -FOREST.maxZ + r() * FOREST.maxZ * 2
    const p: V2 = [x, z]
    if (trailDist(p) < 3.6) continue
    if (CLEARINGS.some((c) => Math.hypot(c.pos[0] - x, c.pos[1] - z) < c.r)) continue
    if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 3.1)) continue
    const k = r()
    out.push({ x, z, kind: k < 0.55 ? 0 : k < 0.88 ? 1 : 2, s: 0.8 + r() * 0.6, rot: r() * 6.28 })
  }
  return out
})()

/** พุ่มไม้เตี้ย/เฟิร์น (เดินผ่านได้) */
export const FOREST_BUSHES: { x: number; z: number; s: number }[] = (() => {
  const r = rnd(331)
  const out: { x: number; z: number; s: number }[] = []
  for (let i = 0; i < 2600 && out.length < 360; i++) {
    const x = FOREST.minX + r() * (FOREST.maxX - FOREST.minX)
    const z = -FOREST.maxZ + r() * FOREST.maxZ * 2
    if (trailDist([x, z]) < 1.2) continue
    out.push({ x, z, s: 0.35 + r() * 0.55 })
  }
  return out
})()

/** ชนต้นไม้ (เฉพาะลำต้น) — แบ่งตาราง 10 ม. ให้หาเร็ว */
const GRID = 10
const grid = new Map<string, { x: number; z: number; r: number }[]>()
for (const t of FOREST_TREES) {
  const k = `${Math.floor(t.x / GRID)},${Math.floor(t.z / GRID)}`
  const arr = grid.get(k) ?? []
  arr.push({ x: t.x, z: t.z, r: t.kind === 2 ? 0.7 : 0.45 * t.s })
  grid.set(k, arr)
}
export function forestTreeColliders(x: number, z: number) {
  const out: { x: number; z: number; r: number }[] = []
  const gx = Math.floor(x / GRID)
  const gz = Math.floor(z / GRID)
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) out.push(...(grid.get(`${gx + i},${gz + j}`) ?? []))
  return out
}

/** สถานะที่ฉาก/ระบบอัปเดต (collision อ่านได้โดยไม่ต้อง import store) */
export const forestFlags = { thornsOpen: false }

/** ของแข็งในป่าที่อยู่ใกล้ (ลำต้นไม้ + ต้นไทร + ศาล + เพิง + พุ่มหนามถ้ายังปิด) */
export function forestSolidsNear(x: number, z: number) {
  const out = forestTreeColliders(x, z)
  out.push({ x: BANYAN_POS[0], z: BANYAN_POS[1], r: 1.9 })
  out.push({ x: SHRINE_POS[0], z: SHRINE_POS[1], r: 0.9 })
  out.push({ x: SHED_POS[0] - 1.6, z: SHED_POS[1], r: 0.6 })
  out.push({ x: SPRING_POS[0], z: SPRING_POS[1], r: 1.6 })
  if (!forestFlags.thornsOpen) for (const t of THORNS) out.push({ x: t[0], z: t[1], r: 1.05 })
  return out
}
