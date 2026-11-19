import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { FLOOR2, INTERIOR_ORIGIN, useInterior } from '../game/interior'
import { playerPose } from '../game/playerPose'
import { useActivity } from '../game/houseLife'
import { playDoor } from '../game/audio/houseSfx'

/**
 * ประตูห้องในบ้าน (เปิด–ปิดได้จริง): เดินเข้าใกล้ = บานเปิดเข้าห้อง · เดินออกห่าง = ปิดเอง (มีเสียงบานพับ/ปิดปึก)
 * ระหว่างใช้ห้องน้ำ/อาบน้ำ = ประตูห้องน้ำปิดสนิท
 * hinge = มุมบานพับ (พิกัดภายใน) · w = ความกว้างบาน (บานปิดวางตามแกน +x)
 */
interface DoorDef {
  id: string
  hinge: [number, number]
  w: number
  upper: boolean
  room?: string
  color: string
}
export const HOME_DOORS: DoorDef[] = [
  { id: 'bath', hinge: [2.8, 1.875], w: 1, upper: false, room: 'bath', color: '#e8eef2' },
  { id: 'rong', hinge: [-7.6, 1.675], w: 1, upper: false, color: '#8a5a34' },
  { id: 'bed3', hinge: [-6.2, 0.075], w: 1.4, upper: true, color: '#8a5a34' },
  { id: 'bed2', hinge: [-0.6, 0.075], w: 1.4, upper: true, color: '#8a5a34' },
  { id: 'bed1', hinge: [4.2, 0.075], w: 1.4, upper: true, color: '#8a5a34' },
]

function Door({ d }: { d: DoorDef }) {
  const leaf = useRef<Group>(null)
  const open = useRef(false)
  const ang = useRef(0)
  useFrame((_, dt) => {
    const lx = playerPose.x - INTERIOR_ORIGIN[0]
    const lz = playerPose.z - INTERIOR_ORIGIN[1]
    const cx = d.hinge[0] + d.w / 2
    const cz = d.hinge[1]
    const sameFloor = useInterior.getState().upper === d.upper
    const act = useActivity.getState().cur
    const inUse = !!act && !!d.room && act.spot.room === d.room
    const want = !inUse && sameFloor && Math.hypot(lx - cx, lz - cz) < 1.7
    if (want !== open.current) {
      open.current = want
      if (useInterior.getState().inside && useInterior.getState().house === 'home') playDoor(want)
    }
    const target = want ? -Math.PI / 2 + 0.08 : 0
    ang.current += (target - ang.current) * Math.min(1, dt * 7)
    if (leaf.current) leaf.current.rotation.y = ang.current
  })
  const h = 2.0
  return (
    <group position={[d.hinge[0], d.upper ? FLOOR2 : 0, d.hinge[1]]}>
      <group ref={leaf}>
        <mesh position={[d.w / 2 - 0.02, h / 2, 0]} castShadow>
          <boxGeometry args={[d.w - 0.06, h, 0.05]} />
          <meshStandardMaterial color={d.color} roughness={0.7} />
        </mesh>
        {/* ลูกฟักบนบาน + ลูกบิด */}
        {[0.55, 1.45].map((y) => (
          <mesh key={y} position={[d.w / 2 - 0.02, y, 0.03]}>
            <boxGeometry args={[d.w - 0.3, 0.6, 0.015]} />
            <meshStandardMaterial color={d.color} roughness={0.5} />
          </mesh>
        ))}
        {[-0.04, 0.04].map((s) => (
          <mesh key={s} position={[d.w - 0.16, 1.0, s]}>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial color="#c8a040" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function HomeDoors() {
  return (
    <>
      {HOME_DOORS.map((d) => (
        <Door key={d.id} d={d} />
      ))}
    </>
  )
}
