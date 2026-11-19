import { HOME_BACK_GATE, HOME_BOX, HOME_CORNER_GAP, HOME_GATE, HOME_SIDE_GAP, homeSolids } from '../scenes/GrandHome'
import { CHEST_SPOTS } from './content/treasure'
import { structureColliders, type PlacedStructure } from './content/structures'
import { PLACES, PLOTS, ROCKS, WORLD_WALK_LIMIT, type Vec2 } from './content/village'
import { getHouse } from './content/houses'
import { NOEY_VEHICLES } from './content/noeyYard'
import { ROT_WALLS, WALL_T } from './content/rotWalls'
import { templeWalls, type Rect } from './content/temple'

export interface Circle {
  x: number
  z: number
  r: number
  /** ของเตี้ย (ก้อนหิน ฯลฯ) กระโดดข้ามได้ */
  low?: boolean
}

/** วงชนของสิ่งปลูกสร้าง (คำนวณจากข้อมูลหมู่บ้าน) */
export function buildColliders(playerHouseId?: string, structures: PlacedStructure[] = []): (Circle | Rect)[] {
  const out: (Circle | Rect)[] = PLACES.filter((p) => (p.solidRadius ?? 0) > 0).map((p) => ({
    x: p.pos[0],
    z: p.pos[1],
    r: p.solidRadius!,
  }))
  if (playerHouseId) {
    const plot = PLOTS[0]
    const [w, d] = getHouse(playerHouseId).footprint
    out.push({ x: plot.center[0] + plot.houseOffset[0], z: plot.center[1] + plot.houseOffset[1], r: Math.max(w, d) * 0.62 })
    // บ้านแม่ฉัตร: รถที่จอด (2 วง) + ห้องน้ำนอกบ้าน
    out.push({ x: plot.center[0] - 0.5, z: plot.center[1] + 4.4, r: 1 }, { x: plot.center[0] - 0.5, z: plot.center[1] + 6.6, r: 1 }, { x: plot.center[0] - 7, z: plot.center[1] - 1.5, r: 1.5 }, { x: plot.center[0] + 3.4, z: plot.center[1] + 4.9, r: 0.9 }, { x: plot.center[0] + 3.4, z: plot.center[1] + 5.9, r: 0.9 })
  }
  // ลานจอดรถหน้าบ้านน้องเนย: ที่ดินหมุน → แปลงพิกัดภายในเป็นพิกัดโลก
  const lot = PLACES.find((p) => p.id === 'lot-noey')
  if (lot) {
    const r = lot.rotation ?? 0
    const c = Math.cos(r)
    const s = Math.sin(r)
    for (const v of NOEY_VEHICLES)
      for (const k of v.solid ?? []) {
        const lx = v.x
        const lz = v.z + k.dz
        out.push({ x: lot.pos[0] + lx * c + lz * s, z: lot.pos[1] - lx * s + lz * c, r: k.r })
      }
  }
  // ลานจอดบ้านน้าโรจน์: รถเก๋ง 2 คัน (คันละ 2 วง)
  const rp = PLACES.find((p) => p.id === 'rot-park')
  if (rp) for (const x of [-1.75, 0.35]) for (const dz of [-2.2, 0.6]) out.push({ x: rp.pos[0] + x, z: rp.pos[1] + dz, r: 0.95 })
  // กำแพงขาวบ้านน้าโรจน์
  for (const w of ROT_WALLS) out.push({ minX: Math.min(w.x0, w.x1) - WALL_T, maxX: Math.max(w.x0, w.x1) + WALL_T, minZ: Math.min(w.z0, w.z1) - WALL_T, maxZ: Math.max(w.z0, w.z1) + WALL_T })
  out.push(...templeWalls())
  out.push(...campusWalls())
  out.push(...homeWalls())
  for (const s of structures) out.push(...structureColliders(s))
  // หีบสมบัติ: ชนเป็นวงกลมเล็ก ๆ
  for (const ch of CHEST_SPOTS) out.push({ x: ch.pos[0], z: ch.pos[1], r: 0.55 })
  // กองหินริมทาง: เดินชน แต่กระโดดข้ามได้ (สูงไม่ถึงครึ่งเมตร)
  for (const [x, z] of ROCKS) out.push({ x, z, r: 0.55, low: true })
  return out
}

const PLAYER_R = 0.4

/** ขยับตำแหน่งแล้วดันออกจากวงชน + จำกัดขอบโลก */
/**
 * ดันผู้เล่นออกจากสิ่งกีดขวาง
 * jumping = กำลังลอยตัวจากการกระโดด → ข้ามของเตี้ยบาง ๆ ได้ (รั้ว ราว ขอบ: ด้านแคบ ≤ 0.5 ม.) แต่ไม่ทะลุตึก/ผนังหนา
 */
export function resolveMove(pos: Vec2, colliders: (Circle | Rect)[], clamp = true, jumping = false): Vec2 {
  let [x, z] = pos
  for (const c of colliders) {
    if (!('r' in c)) {
      if (jumping && Math.min(c.maxX - c.minX, c.maxZ - c.minZ) <= 0.5) continue
      // สี่เหลี่ยม: ดันออกตามด้านที่ลึกน้อยที่สุด
      const px = Math.max(c.minX, Math.min(x, c.maxX))
      const pz = Math.max(c.minZ, Math.min(z, c.maxZ))
      const dx = x - px
      const dz = z - pz
      const d = Math.hypot(dx, dz)
      if (d < PLAYER_R) {
        if (d > 1e-4) {
          x = px + (dx / d) * PLAYER_R
          z = pz + (dz / d) * PLAYER_R
        } else {
          const opts = [
            [c.minX - PLAYER_R - x, 0],
            [c.maxX + PLAYER_R - x, 0],
            [0, c.minZ - PLAYER_R - z],
            [0, c.maxZ + PLAYER_R - z],
          ].sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]))[0]
          x += opts[0]
          z += opts[1]
        }
      }
      continue
    }
    if (jumping && c.low) continue
    const dx = x - c.x
    const dz = z - c.z
    const dist = Math.hypot(dx, dz)
    const min = c.r + PLAYER_R
    if (dist < min && dist > 1e-4) {
      x = c.x + (dx / dist) * min
      z = c.z + (dz / dist) * min
    }
  }
  if (!clamp) return [x, z]
  const lim = WORLD_WALK_LIMIT - 1
  return [Math.max(-lim, Math.min(lim, x)), Math.max(-lim, Math.min(lim, z))]
}

/** โรงเรียนวัดบ้านไพบูลย์ + บ่อน้ำ: รั้วรอบโรงเรียน (เว้นประตูเหนือและตะวันออก) · อาคาร · บ่อน้ำเดินไม่ได้ ยกเว้นสะพานไม้ */
export function campusWalls(): Rect[] {
  const out: Rect[] = []
  const sc = PLACES.find((p) => p.id === 'school')
  if (sc) {
    const [cx, cz] = sc.pos
    const h = sc.size[0] / 2
    const t = 0.25
    const R = (x0: number, x1: number, z0: number, z1: number) => out.push({ minX: cx + x0, maxX: cx + x1, minZ: cz + z0, maxZ: cz + z1 })
    R(-h, h, -h - t, -h + t) // รั้วใต้
    R(-h - t, -h + t, -h, h) // รั้วตะวันตก
    R(-h, -2.5, h - t, h + t) // รั้วเหนือ ซ้ายประตู
    R(2.5, h, h - t, h + t) // รั้วเหนือ ขวาประตู
    R(h - t, h + t, -h, -3.5) // รั้วตะวันออก ใต้ประตูสะพาน
    R(h - t, h + t, -0.5, h) // รั้วตะวันออก เหนือประตูสะพาน
    R(-12, 12, -15, -8.5) // อาคารเรียนหลัก
    R(13.2, 16.4, -6.6, -3.4) // ห้องน้ำ
    R(4.6, 11.4, -6.4, -3.6) // เวที
  }
  const lk = PLACES.find((p) => p.id === 'school-pond')
  if (lk) {
    const [cx, cz] = lk.pos
    const [w] = lk.size
    // บ่อลงไปเล่นน้ำได้แล้ว (ระบบน้ำ) · เหลือแค่ราวสะพานสองข้าง (สะพานที่ z = cz - 2 กว้าง 2.6 ม.)
    out.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - 3.35, maxZ: cz - 3.15 })
    out.push({ minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - 0.85, maxZ: cz - 0.65 })
  }
  return out
}

/** บ้านตารัง–ยายเลียน: สิ่งปลูกสร้างทึบ + รั้วรอบบ้าน (เว้นประตูหน้าบ้าน) */
export function homeWalls(): Rect[] {
  const hp = PLACES.find((p) => p.id === 'home-tarang')
  if (!hp) return []
  const [cx, cz] = hp.pos
  const out: Rect[] = homeSolids().map(([x, z, w, d]) => ({ minX: cx + x - w / 2, maxX: cx + x + w / 2, minZ: cz + z - d / 2, maxZ: cz + z + d / 2 }))
  const { x0, x1, z0, z1 } = HOME_BOX
  const t = 0.2
  const gx = HOME_GATE[0]
  out.push({ minX: cx + x0, maxX: cx + gx - 2, minZ: cz + z0 - t, maxZ: cz + z0 + t })
  out.push({ minX: cx + gx + 2, maxX: cx + x1, minZ: cz + z0 - t, maxZ: cz + z0 + t })
  // รั้วเหนือ เว้นช่องทางรถ
  // มุม (x0, z1) เว้นเป็นทางลัดไม่มีรั้ว
  out.push({ minX: cx + x0 + HOME_CORNER_GAP, maxX: cx + HOME_BACK_GATE.x - HOME_BACK_GATE.half, minZ: cz + z1 - t, maxZ: cz + z1 + t })
  out.push({ minX: cx + HOME_BACK_GATE.x + HOME_BACK_GATE.half, maxX: cx + x1, minZ: cz + z1 - t, maxZ: cz + z1 + t })
  // ฝั่งซอย 2: เว้นช่องทางเข้าออกข้างรถ
  out.push({ minX: cx + x0 - t, maxX: cx + x0 + t, minZ: cz + z0, maxZ: cz + HOME_SIDE_GAP.z - HOME_SIDE_GAP.half })
  out.push({ minX: cx + x0 - t, maxX: cx + x0 + t, minZ: cz + HOME_SIDE_GAP.z + HOME_SIDE_GAP.half, maxZ: cz + z1 - HOME_CORNER_GAP })
  out.push({ minX: cx + x1 - t, maxX: cx + x1 + t, minZ: cz + z0, maxZ: cz + z1 })
  return out
}
