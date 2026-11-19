import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { MeshStandardMaterial, type Group, type Material, type Mesh } from 'three'

/** วัสดุสีเทาของ "กำลังย้าย" (ใช้ร่วมกันทุกชิ้น) */
const GRAY = new MeshStandardMaterial({ color: '#a4a4a4', roughness: 0.85, metalness: 0, transparent: true, opacity: 0.92 })

/**
 * ห่อวัตถุ: on = เปลี่ยนเป็นสีเทาทั้งชิ้น (เฉพาะชิ้นนี้ ฉากอื่นสีปกติ) · ปิดแล้วคืนสีและพื้นผิวเดิม
 */
export function GrayOut({ on, children }: { on: boolean; children: ReactNode }) {
  const g = useRef<Group>(null)
  useLayoutEffect(() => {
    const root = g.current
    if (!root || !on) return
    const saved: [Mesh, Material | Material[]][] = []
    root.traverse((o) => {
      const m = o as Mesh
      if (!m.isMesh || !m.material) return
      saved.push([m, m.material])
      m.material = GRAY
    })
    return () => {
      for (const [m, mat] of saved) m.material = mat
    }
  }, [on])
  return <group ref={g}>{children}</group>
}
