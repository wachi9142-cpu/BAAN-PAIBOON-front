import { useEffect, type ReactNode } from 'react'
import { editables, useLayoutEdit } from '../game/layoutEdit'
import { useHold } from './HoldInteract'
import { GrayOut } from './GrayOut'

/**
 * ห่อสิ่งที่ย้ายได้ในโหมด "ย้ายที่": ลูกข้างในเขียนด้วยพิกัดเดิม (x, z) ไม่ต้องแก้
 * ตำแหน่งใหม่/มุมหมุนมาจากค่าที่ผู้สร้างย้าย (หมุนรอบจุด x, z เดิม)
 * origin = จุดอ้างอิงในพิกัดโลก (ของในบ้านตา = จุดกลางบ้าน)
 */
export function Editable({ id, name, x, z, rot = 0, r = 2.5, origin, children }: { id: string; name: string; x: number; z: number; rot?: number; r?: number; origin?: [number, number]; children: ReactNode }) {
  const m = useLayoutEdit((s) => s.draft[id])
  const p = m ?? { x, z, rot }
  // กำลังย้าย: ยกลอยขึ้นเล็กน้อย ให้เห็นชัดว่าเป็นของที่เลือก
  const lifted = useHold((s) => s.moving?.kind === 'layout' && s.moving.id === id)
  const ox = origin?.[0] ?? 0
  const oz = origin?.[1] ?? 0
  useEffect(() => {
    editables.set(id, { id, name, wx: ox + p.x, wz: oz + p.z, rot: p.rot, origin, r })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, name, ox, oz, p.x, p.z, p.rot, r])
  useEffect(() => () => void editables.delete(id), [id])
  return (
    <group position={[p.x, lifted ? 0.35 : 0, p.z]} rotation={[0, p.rot - rot, 0]}>
      <group position={[-x, 0, -z]}>
        <GrayOut on={lifted}>{children}</GrayOut>
      </group>
    </group>
  )
}
