import { HOME_GATE, HOME_D, HOME_SOLIDS, HOME_W } from '../scenes/GrandHome'
import { CHEST_SPOTS } from './content/treasure'
import { structureColliders, type PlacedStructure } from './content/structures'
import { PLACES, PLOTS, WORLD_HALF_SIZE, type Vec2 } from './content/village'
import { getHouse } from './content/houses'
import { templeWalls, type Rect } from './content/temple'

export interface Circle {
  x: number
  z: number
  r: number
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
  }
  out.push(...templeWalls())
  out.push(...campusWalls())
  out.push(...homeWalls())
  for (const s of structures) out.push(...structureColliders(s))
  // หีบสมบัติ: ชนเป็นวงกลมเล็ก ๆ
  for (const ch of CHEST_SPOTS) out.push({ x: ch.pos[0], z: ch.pos[1], r: 0.55 })
  return out
}

const PLAYER_R = 0.4

/** ขยับตำแหน่งแล้วดันออกจากวงชน + จำกัดขอบโลก */
export function resolveMove(pos: Vec2, colliders: (Circle | Rect)[], clamp = true): Vec2 {
  let [x, z] = pos
  for (const c of colliders) {
    if (!('r' in c)) {
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
  const lim = WORLD_HALF_SIZE - 1
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
  const out: Rect[] = HOME_SOLIDS.map(([x, z, w, d]) => ({ minX: cx + x - w / 2, maxX: cx + x + w / 2, minZ: cz + z - d / 2, maxZ: cz + z + d / 2 }))
  const h = HOME_W / 2
  const d = HOME_D / 2
  const t = 0.2
  const gx = HOME_GATE[0]
  out.push({ minX: cx - h, maxX: cx + gx - 2, minZ: cz - d - t, maxZ: cz - d + t })
  out.push({ minX: cx + gx + 2, maxX: cx + h, minZ: cz - d - t, maxZ: cz - d + t })
  out.push({ minX: cx - h, maxX: cx + h, minZ: cz + d - t, maxZ: cz + d + t })
  out.push({ minX: cx - h - t, maxX: cx - h + t, minZ: cz - d, maxZ: cz + d })
  out.push({ minX: cx + h - t, maxX: cx + h + t, minZ: cz - d, maxZ: cz + d })
  return out
}
