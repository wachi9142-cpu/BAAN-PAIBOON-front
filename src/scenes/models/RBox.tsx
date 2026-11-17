import { useEffect, useMemo } from 'react'
import { RoundedBoxGeometry } from 'three-stdlib'

/**
 * กล่องมุมมน — ใช้แทน <boxGeometry> ให้โมเดลดูละมุน ไม่เป็นเหลี่ยมคม
 * รัศมีมุม = 32% ของด้านที่สั้นที่สุด
 */
export function RBox({ args, round = 0.32 }: { args: [number, number, number]; round?: number }) {
  const [w, h, d] = args
  const geom = useMemo(() => new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * round), [w, h, d, round])
  useEffect(() => () => geom.dispose(), [geom])
  return <primitive object={geom} attach="geometry" />
}
