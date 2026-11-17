import { useEffect, useMemo } from 'react'
import { RoundedBoxGeometry } from 'three-stdlib'

/**
 * กล่องมุมมน — ใช้แทน <boxGeometry> ให้โมเดลดูละมุน ไม่เป็นเหลี่ยมคม
 * รัศมีมุม = 32% ของด้านที่สั้นที่สุด (สูงสุด 12 ซม.)
 */
export function RBox({ args, round = 0.32, radius }: { args: [number, number, number]; round?: number; radius?: number }) {
  const [w, h, d] = args
  // มุมมนตามด้านที่สั้นที่สุด แต่ไม่เกิน 12 ซม. (ของชิ้นใหญ่อย่างผนังจะได้ไม่บวมเป็นหมอน)
  // radius = กำหนดเอง (ผนังบ้าน/อาคาร ให้มนชัดขึ้นแต่ไม่เกินครึ่งด้านที่สั้นที่สุด)
  const r = radius !== undefined ? Math.min(radius, Math.min(w, h, d) * 0.48) : Math.min(Math.min(w, h, d) * round, 0.12)
  const geom = useMemo(() => new RoundedBoxGeometry(w, h, d, radius !== undefined ? 4 : 3, r), [w, h, d, r, radius])
  useEffect(() => () => geom.dispose(), [geom])
  return <primitive object={geom} attach="geometry" />
}
