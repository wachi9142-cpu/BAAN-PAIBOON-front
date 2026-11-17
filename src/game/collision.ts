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
  for (const s of structures) out.push(...structureColliders(s))
  // หีบสมบัติ: ชนเป็นวงกลมเล็ก ๆ
  for (const ch of CHEST_SPOTS) out.push({ x: ch.pos[0], z: ch.pos[1], r: 0.55 })
  return out
}

const PLAYER_R = 0.4

/** ขยับตำแหน่งแล้วดันออกจากวงชน + จำกัดขอบโลก */
export function resolveMove(pos: Vec2, colliders: (Circle | Rect)[]): Vec2 {
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
  const lim = WORLD_HALF_SIZE - 1
  return [Math.max(-lim, Math.min(lim, x)), Math.max(-lim, Math.min(lim, z))]
}
