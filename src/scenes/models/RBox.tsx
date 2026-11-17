import { useEffect, useMemo } from 'react'
import { RoundedBoxGeometry } from 'three-stdlib'

/**
 * กล่องมุมมน — ใช้แทน <boxGeometry> ให้โมเดลดูละมุน ไม่เป็นเหลี่ยมคม
 * รัศมีมุม = 32% ของด้านที่สั้นที่สุด (สูงสุด 12 ซม.)
 */
export function RBox({ args, round = 0.32 }: { args: [number, number, number]; round?: number }) {
  const [w, h, d] = args
  // มุมมนตามด้านที่สั้นที่สุด แต่ไม่เกิน 12 ซม. (ของชิ้นใหญ่อย่างผนังจะได้ไม่บวมเป็นหมอน)
  const geom = useMemo(() => new RoundedBoxGeometry(w, h, d, 3, Math.min(Math.min(w, h, d) * round, 0.12)), [w, h, d, round])
  useEffect(() => () => geom.dispose(), [geom])
  return <primitive object={geom} attach="geometry" />
}
