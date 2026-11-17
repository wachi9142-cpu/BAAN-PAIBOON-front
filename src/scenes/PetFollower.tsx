import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { getSpecies, type PetChoice } from '../game/content/pets'
import { Pet } from './models/Pet'
import { playerPose } from './Player'

/**
 * สัตว์เลี้ยงเดินตามผู้เล่น: ไปยังจุดด้านหลังเยื้องขวาของผู้เล่น
 * ถ้าอยู่ใกล้พอแล้วจะหยุด หันหน้าเข้าหาผู้เล่น ถ้าห่างเกินไป (เช่นโหลดเซฟ) จะวาร์ปมาใกล้ ๆ
 */
export function PetFollower({ pet, start }: { pet: PetChoice; start: [number, number] }) {
  const info = getSpecies(pet.species)
  const root = useRef<Group>(null)
  const pos = useRef<[number, number]>([start[0] + 1, start[1] + 1])
  const heading = useRef(0)
  const motion = useRef(0)

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const { x: px, z: pz, heading: ph, motion: pm } = playerPose
    // จุดเป้าหมาย: หลังผู้เล่น เยื้องไปทางขวา
    const back = info.followDistance
    const side = 0.6
    const tx = px - Math.sin(ph) * back + Math.cos(ph) * side
    const tz = pz - Math.cos(ph) * back - Math.sin(ph) * side

    let [x, z] = pos.current
    const dx = tx - x
    const dz = tz - z
    const dist = Math.hypot(dx, dz)

    if (dist > 25) {
      // ห่างมาก (เพิ่งโหลด/วาร์ป) → มาอยู่ข้างผู้เล่นทันที
      x = tx
      z = tz
      motion.current = 0
    } else if (dist > 0.25) {
      // ยิ่งห่างยิ่งเร็ว ตามทันแม้ผู้เล่นวิ่ง
      const speed = Math.min(11, 2.5 + dist * 2.2 + (pm === 2 ? 3 : 0))
      const step = Math.min(dist, speed * dt)
      x += (dx / dist) * step
      z += (dz / dist) * step
      turnToward(Math.atan2(dx, dz), dt)
      motion.current = 1
    } else {
      // หยุดแล้ว หันไปทางผู้เล่น
      turnToward(Math.atan2(px - x, pz - z), dt * 0.5)
      motion.current = 0
    }
    pos.current = [x, z]

    if (root.current) {
      const fly = info.flies ? 1.5 + Math.sin(clock.elapsedTime * 2) * 0.12 : 0
      root.current.position.set(x, fly, z)
      root.current.rotation.y = heading.current
    }
  })

  function turnToward(target: number, dt: number) {
    let d = target - heading.current
    d = Math.atan2(Math.sin(d), Math.cos(d))
    heading.current += d * Math.min(1, dt * 8)
  }

  return (
    <group ref={root}>
      <Pet pet={pet} motion={motion} />
    </group>
  )
}
