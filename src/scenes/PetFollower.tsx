import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { getSpecies, type PetChoice } from '../game/content/pets'
import { playPetSound } from '../game/audio/petSounds'
import { Pet } from './models/Pet'
import { playerPose } from './Player'

/** รอนานเท่าไรถึงนั่ง / นอน (วินาที) */
const SIT_AFTER = 2.5
const LIE_AFTER = 12

/**
 * สัตว์เลี้ยงเดินตามผู้เล่น
 * - ผู้เล่นเดิน → เดินตามไปอยู่ด้านหลังเยื้องขวา (ห่างมาก = วิ่ง)
 * - ผู้เล่นยืนเฉย → สัตว์เลี้ยงหันมาหา นั่งรอ แล้วนอนลงถ้ารอนาน
 * - ผู้เล่นเดินออกไป → ลุกขึ้นวิ่งตาม (บางครั้งส่งเสียงร้อง)
 * - นั่งรออยู่ → ส่งเสียงร้องเป็นครั้งคราว
 */
export function PetFollower({ pet, start }: { pet: PetChoice; start: [number, number] }) {
  const info = getSpecies(pet.species)
  const root = useRef<Group>(null)
  const pos = useRef<[number, number]>([start[0] + 1, start[1] + 1])
  const heading = useRef(0)
  const motion = useRef(0)
  const pose = useRef(0)
  const idle = useRef(0)
  const nextIdleSound = useRef(8 + Math.random() * 15)

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const { x: px, z: pz, heading: ph, motion: pm } = playerPose
    const back = info.followDistance
    const side = 0.6
    const tx = px - Math.sin(ph) * back + Math.cos(ph) * side
    const tz = pz - Math.cos(ph) * back - Math.sin(ph) * side

    let [x, z] = pos.current
    const dx = tx - x
    const dz = tz - z
    const dist = Math.hypot(dx, dz)
    // ระยะที่ต้องลุกขึ้น: ถ้ากำลังนั่ง/นอนอยู่ ให้ผู้เล่นเดินห่างออกไปพอสมควรก่อน (ไม่ลุก ๆ นั่ง ๆ)
    const wakeDist = pose.current > 0 ? 0.9 : 0.25

    if (dist > 25) {
      x = tx
      z = tz
      motion.current = 0
    } else if (dist > wakeDist) {
      if (pose.current > 0 && Math.random() < 0.5) playPetSound(pet.species, 0.8)
      pose.current = 0
      idle.current = 0
      const running = dist > 3 || pm === 2
      const speed = Math.min(12, 2.5 + dist * 2.2 + (pm === 2 ? 3 : 0))
      const step = Math.min(dist, speed * dt)
      x += (dx / dist) * step
      z += (dz / dist) * step
      turnToward(Math.atan2(dx, dz), dt)
      motion.current = running ? 2 : 1
    } else {
      motion.current = 0
      idle.current += dt
      turnToward(Math.atan2(px - x, pz - z), dt * 0.5)
      pose.current = idle.current > LIE_AFTER ? 2 : idle.current > SIT_AFTER ? 1 : 0
      // เสียงร้องตอนรอ (ไม่ร้องตอนนอนหลับ)
      if (pose.current < 2 && idle.current > nextIdleSound.current) {
        playPetSound(pet.species, 0.6)
        nextIdleSound.current = idle.current + 15 + Math.random() * 25
      }
      if (pose.current === 2) nextIdleSound.current = Math.max(nextIdleSound.current, idle.current + 10)
    }
    if (idle.current === 0) nextIdleSound.current = 8 + Math.random() * 15
    pos.current = [x, z]

    if (root.current) {
      // นกบินลอยระดับไหล่ / พอนอนจะลงมาเกาะพื้น
      const fly = info.flies ? (pose.current === 2 ? 0.05 : 1.5 + Math.sin(clock.elapsedTime * 2) * 0.12) : 0
      root.current.position.x = x
      root.current.position.z = z
      root.current.position.y += (fly - root.current.position.y) * Math.min(1, dt * 3)
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
      <Pet pet={pet} motion={motion} pose={pose} />
    </group>
  )
}
