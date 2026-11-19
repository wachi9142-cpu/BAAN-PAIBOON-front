/**
 * ถ้ำน้ำลึก (ผู้สร้าง 19 พ.ย. 2569) — สถานที่สมมติ (ไม่ใช่สถานที่จริงของหมู่บ้าน)
 * ปากถ้ำอยู่มุมตะวันออกเฉียงเหนือนอกหมู่บ้าน → กด E เข้าถ้ำ (วาร์ปไปฉากถ้ำที่วางไว้ไกล ๆ)
 * ในถ้ำ: โถงหิน แสงลอดจากเพดาน คริสตัลเรืองแสง ประตูหินโบราณ · สระน้ำลึก 6 ม. ว่ายได้ ดำน้ำลงไปสำรวจใต้น้ำได้
 */
import { PLACES } from './content/village'

/** ปากถ้ำ (โลก) + ทิศหันเข้าหมู่บ้าน */
export const CAVE_MOUTH: [number, number] = [82, -80]
/** ฉากถ้ำ (โลก) — ห่างหมู่บ้านและฉากในบ้าน */
export const CAVE_ORIGIN: [number, number] = [0, 470]
/** ขอบเขตโถงถ้ำ (วงรี รัศมี x, z) */
export const CAVE_R: [number, number] = [17, 13]
/** สระน้ำในถ้ำ (พิกัดโลก) */
export const CAVE_POOL = { pos: [CAVE_ORIGIN[0] + 2, CAVE_ORIGIN[1] - 2] as [number, number], size: [18, 13] as [number, number], maxDepth: 6 }
/** จุดเกิดในถ้ำ / จุดกด E ออกจากถ้ำ (ใกล้ทางเข้าด้านใต้) */
export const CAVE_DOOR: [number, number] = [CAVE_ORIGIN[0] - 4, CAVE_ORIGIN[1] + 10.5]

export const inCave = (x: number, z: number) => Math.abs(x - CAVE_ORIGIN[0]) < 30 && Math.abs(z - CAVE_ORIGIN[1]) < 30

/** กันเดินทะลุผนังถ้ำ */
export function clampCave(p: [number, number], k = 1): [number, number] {
  if (!inCave(p[0], p[1])) return p
  const dx = (p[0] - CAVE_ORIGIN[0]) / (CAVE_R[0] * k)
  const dz = (p[1] - CAVE_ORIGIN[1]) / (CAVE_R[1] * k)
  const d = Math.hypot(dx, dz)
  if (d <= 1) return p
  return [CAVE_ORIGIN[0] + (dx / d) * CAVE_R[0] * k, CAVE_ORIGIN[1] + (dz / d) * CAVE_R[1] * k]
}

export function nearCaveMouth(x: number, z: number) {
  return Math.hypot(x - CAVE_MOUTH[0], z - CAVE_MOUTH[1]) < 3.2
}
export function nearCaveDoor(x: number, z: number) {
  return Math.hypot(x - CAVE_DOOR[0], z - CAVE_DOOR[1]) < 2.2
}
/** จุดยืนหน้าปากถ้ำ (ฝั่งหมู่บ้าน) หลังออกจากถ้ำ */
export function outsideMouth(): [number, number, number] {
  const home = PLACES.find((p) => p.id === 'home-tarang')
  const tx = home ? home.pos[0] : 0
  const tz = home ? home.pos[1] : 0
  const a = Math.atan2(tx - CAVE_MOUTH[0], tz - CAVE_MOUTH[1])
  return [CAVE_MOUTH[0] + Math.sin(a) * 4, CAVE_MOUTH[1] + Math.cos(a) * 4, a]
}
