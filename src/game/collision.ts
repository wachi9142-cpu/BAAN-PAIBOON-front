import { PLACES, PLOTS, WORLD_HALF_SIZE, type Vec2 } from './content/village'
import { getHouse } from './content/houses'

export interface Circle {
  x: number
  z: number
  r: number
}

/** วงชนของสิ่งปลูกสร้าง (คำนวณจากข้อมูลหมู่บ้าน) */
export function buildColliders(playerHouseId?: string): Circle[] {
  const out: Circle[] = PLACES.filter((p) => (p.solidRadius ?? 0) > 0).map((p) => ({
    x: p.pos[0],
    z: p.pos[1],
    r: p.solidRadius!,
  }))
  if (playerHouseId) {
    const plot = PLOTS[0]
    const [w, d] = getHouse(playerHouseId).footprint
    out.push({ x: plot.center[0] + plot.houseOffset[0], z: plot.center[1] + plot.houseOffset[1], r: Math.max(w, d) * 0.62 })
  }
  return out
}

const PLAYER_R = 0.4

/** ขยับตำแหน่งแล้วดันออกจากวงชน + จำกัดขอบโลก */
export function resolveMove(pos: Vec2, colliders: Circle[]): Vec2 {
  let [x, z] = pos
  for (const c of colliders) {
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
