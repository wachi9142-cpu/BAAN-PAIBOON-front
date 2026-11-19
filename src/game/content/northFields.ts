/**
 * ทุ่งนาเหนือหมู่บ้าน (ผู้สร้าง 19 พ.ย. 2569) — พื้นที่สมมตินอกหมู่บ้าน เดินต่อออกไปได้ (ไม่วาร์ป)
 * ทางดินที่ชาวบ้านเดินจนเป็นทาง · สองข้างทางหญ้าสูงรก · ลอมฟางสูงใหญ่ · ต้นไม้เยอะ · ไกล ๆ มีบ่อน้ำและนาเป็นแปลงสี่เหลี่ยม
 * (ไม่มีภูเขาด้านนี้)
 */
export type V2 = [number, number]

export const NORTH = { minX: -72, maxX: 90, minZ: 119, maxZ: 214 }
export const inNorth = (x: number, z: number) => z > NORTH.minZ - 2 && x > NORTH.minX && x < NORTH.maxX && z < NORTH.maxZ + 2

/** ทางเดินดินจากหมู่บ้านขึ้นเหนือ */
export const NORTH_PATH = { x: -10, z0: 115.5, z1: 206, w: 1.6 }
/** ทางเดินคดเคี้ยวเล็กน้อยแบบทางที่ชาวบ้านเดินจนหญ้าตาย (x ตามระยะ z) */
export const pathX = (z: number) => NORTH_PATH.x + Math.sin((z - 115.5) * 0.09) * 1.6 + Math.sin((z - 115.5) * 0.23) * 0.5

/** ลอมฟาง (กองฟางทรงสูงรอบเสา) */
export const HAYSTACKS: { x: number; z: number; s: number }[] = [
  { x: -17, z: 132, s: 1.1 },
  { x: -21, z: 137, s: 0.9 },
  { x: -3, z: 140, s: 1.2 },
  { x: 2, z: 134, s: 0.95 },
  { x: -24, z: 129, s: 0.8 },
]

/** บ่อน้ำ (กันพื้นที่) */
export const NORTH_POND = { x: 24, z: 146, r: 8 }
/** บ่อเลี้ยงปลาสี่เหลี่ยมแถวนา (ผู้สร้าง 20 พ.ย.) */
export const FISH_PONDS: { x: number; z: number; w: number; d: number }[] = [
  { x: 24, z: 146, w: 15, d: 10 },
  { x: -40, z: 150, w: 12, d: 8 },
]

/** นา: แปลงสี่เหลี่ยมคั่นด้วยคันนา (ไกลออกไป) */
export const PADDIES: { x: number; z: number; w: number; d: number }[] = (() => {
  const out: { x: number; z: number; w: number; d: number }[] = []
  for (const [x0, x1] of [
    [-66, -16],
    [-4, 48],
  ] as [number, number][])
    for (let z = 162; z < 210; z += 11)
      for (let x = x0; x < x1 - 4; x += 12.5) out.push({ x: x + 6, z: z + 5, w: 11.6, d: 10 })
  return out
})()

function rnd(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}
const inPaddy = (x: number, z: number) => [...PADDIES, ...FISH_PONDS.map((p) => ({ ...p, w: p.w + 3, d: p.d + 3 }))].some((p) => Math.abs(x - p.x) < p.w / 2 + 0.5 && Math.abs(z - p.z) < p.d / 2 + 0.5)

/** กอหญ้าสูง (หนาแน่นสองข้างทาง) */
export const TALL_GRASS: { x: number; z: number; s: number; r: number }[] = (() => {
  const r = rnd(2468)
  const out: { x: number; z: number; s: number; r: number }[] = []
  for (let i = 0; i < 4000 && out.length < 900; i++) {
    const near = r() < 0.7
    // เริ่มเลยขอบถนนดินแดงหลังหมู่บ้าน (z 113 กว้าง 4.5) ไม่ให้หญ้าขึ้นบนถนน
    const z = 116.5 + r() * (NORTH.maxZ - 116.5)
    const x = near ? pathX(z) + (r() < 0.5 ? -1 : 1) * (NORTH_PATH.w / 2 + 0.6 + r() * 9) : NORTH.minX + r() * (NORTH.maxX - NORTH.minX)
    // ปากทาง: เว้นลานหญ้าเตี้ยกว้าง ๆ ให้เห็นว่าเป็นทางเข้า
    if (z < 121 && Math.abs(x - NORTH_PATH.x) < 3.2) continue
    if (Math.abs(x - pathX(z)) < NORTH_PATH.w / 2 + 0.5 || Math.abs(x - 72) < 3.6) continue
    if (inPaddy(x, z) || Math.hypot(x - NORTH_POND.x, z - NORTH_POND.z) < NORTH_POND.r + 0.5) continue
    if (HAYSTACKS.some((h) => Math.hypot(h.x - x, h.z - z) < 2.2 * h.s)) continue
    out.push({ x, z, s: 0.8 + r() * 0.9, r: r() * 6.28 })
  }
  return out
})()

/** ต้นไม้ (ไม่บนทาง/นา/บ่อ) */
export const NORTH_TREES: { x: number; z: number; s: number }[] = (() => {
  const r = rnd(1357)
  const out: { x: number; z: number; s: number }[] = []
  for (let i = 0; i < 3000 && out.length < 110; i++) {
    const x = NORTH.minX + r() * (NORTH.maxX - NORTH.minX)
    const z = NORTH.minZ + 3 + r() * (NORTH.maxZ - NORTH.minZ)
    if (Math.abs(x - pathX(z)) < 6 || Math.abs(x - 72) < 6) continue
    if (inPaddy(x, z) || Math.hypot(x - NORTH_POND.x, z - NORTH_POND.z) < NORTH_POND.r + 3) continue
    if (HAYSTACKS.some((h) => Math.hypot(h.x - x, h.z - z) < 4)) continue
    if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 4.5)) continue
    out.push({ x, z, s: 0.8 + r() * 0.7 })
  }
  return out
})()
