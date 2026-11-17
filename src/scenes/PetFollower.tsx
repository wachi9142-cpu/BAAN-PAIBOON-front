import { whistleState } from '../game/whistle'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Quaternion, Vector3, type Group, type Mesh } from 'three'
import { getSpecies, type PetChoice } from '../game/content/pets'
import { playPetSound } from '../game/audio/petSounds'
import { useGame } from '../game/store'
import { Pet, petScale } from './models/Pet'
import { PET_ANCHORS } from './models/PetOutfit'
import { playerPose } from './Player'
import { templeGroundY } from '../game/content/temple'

/** รอนานเท่าไรถึงนั่ง / นอน (วินาที) */
const SIT_AFTER = 2.5
const LIE_AFTER = 30
/** ความยาวสายจูง (เมตร) */
const LEASH_LEN = 2.2

/**
 * สัตว์เลี้ยงเดินตามผู้เล่น
 * - ผู้เล่นเดิน → ตามไปอยู่ด้านหลังเยื้องขวา (ห่างมาก/ผู้เล่นวิ่ง = วิ่งตาม)
 * - ผู้เล่นยืนเฉย (เช่นกำลังทำภารกิจ) → นั่งรอ บางครั้งลุกไปวิ่งเล่นรอบ ๆ แล้วกลับมานั่ง รอนานมากจะนอน
 * - ผู้เล่นเดินออกไป → ลุกขึ้นวิ่งตาม (บางครั้งส่งเสียงร้อง)
 * - จูงอยู่ → เดินชิดผู้เล่น มีสายจูงจากมือถึงคอ และวิ่งเล่นได้แค่ในระยะสายจูง
 */
export function PetFollower({ pet, start }: { pet: PetChoice; start: [number, number] }) {
  const info = getSpecies(pet.species)
  const root = useRef<Group>(null)
  const leash = useRef<Mesh>(null)
  const pos = useRef<[number, number]>([start[0] + 1, start[1] + 1])
  const heading = useRef(0)
  const motion = useRef(0)
  const pose = useRef(0)
  const idle = useRef(0)
  const play = useRef({ until: 0, next: 6 + Math.random() * 6, angle: 0, dir: 1 })
  const nextIdleSound = useRef(8 + Math.random() * 15)
  const heardRef = useRef(-1)
  const tmp = useMemo(() => ({ a: new Vector3(), b: new Vector3(), up: new Vector3(0, 1, 0), q: new Quaternion() }), [])
  const anchor = PET_ANCHORS[pet.species]
  const scale = petScale(pet)

  useFrame(({ clock }, rawDt) => {
    const g = useGame.getState()
    const leashed = !!g.save?.petLeashed
    if (g.paused) return
    const dt = Math.min(rawDt, 0.05)
    const { x: px, z: pz, heading: ph, motion: pm } = playerPose
    const back = leashed ? Math.min(info.followDistance, 1.1) : info.followDistance
    const side = leashed ? 0.5 : 0.6
    let tx = px - Math.sin(ph) * back + Math.cos(ph) * side
    let tz = pz - Math.cos(ph) * back - Math.sin(ph) * side

    let [x, z] = pos.current
    // ถูกขี่อยู่: อยู่ใต้ผู้เล่น หันตามผู้เล่น เดิน/วิ่งตามจังหวะผู้เล่น
    if (g.riding) {
      pos.current = [px, pz]
      heading.current = ph
      motion.current = pm
      pose.current = 0
      if (root.current) {
        root.current.position.set(px, templeGroundY(px, pz), pz)
        root.current.rotation.y = ph
      }
      if (leash.current) leash.current.visible = false
      return
    }
    const playerMoving = pm > 0
    const playing = !playerMoving && idle.current < play.current.until

    // วิ่งเล่นวนรอบผู้เล่น
    if (playing) {
      play.current.angle += dt * 2.6 * play.current.dir
      const r = leashed ? 1.3 : 2.2
      tx = px + Math.sin(play.current.angle) * r
      tz = pz + Math.cos(play.current.angle) * r
    }

    const dx = tx - x
    const dz = tz - z
    const dist = Math.hypot(dx, dz)
    // ถ้ากำลังนั่ง/นอน ให้ผู้เล่นเดินห่างออกไปพอสมควรก่อนค่อยลุก (ไม่ลุก ๆ นั่ง ๆ)
    let wakeDist = pose.current > 0 ? 0.9 : 0.25
    // ได้ยินเจ้าของผิวปาก: ลุกขึ้นทันที ส่งเสียงตอบ แล้ววิ่งมาหา
    const heard = performance.now() - whistleState.at
    if (heard > 600 && heard < 5000 && heardRef.current !== whistleState.at) {
      heardRef.current = whistleState.at
      playPetSound(pet, 0.85)
      idle.current = 0
      wakeDist = 0
    }

    if (dist > 25) {
      x = tx
      z = tz
      motion.current = 0
    } else if (playing || dist > wakeDist) {
      if (!playing) {
        if (pose.current > 0 && Math.random() < 0.5) playPetSound(pet, 0.8)
        idle.current = 0
        play.current.until = 0
        play.current.next = 6 + Math.random() * 6
      } else {
        idle.current += dt
      }
      pose.current = 0
      // สายจูงตึง: ถ้าห่างผู้เล่นเกินความยาวสาย ให้รีบตาม
      const fromPlayer = Math.hypot(px - x, pz - z)
      const pulled = leashed && fromPlayer > LEASH_LEN
      const running = playing || pulled || dist > 3 || pm === 2
      const speed = playing ? 5 : Math.min(12, 2.5 + dist * 2.2 + (pm === 2 ? 3 : 0) + (pulled ? 3 : 0))
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
      // ถึงเวลาวิ่งเล่น (ยังไม่ง่วงนอน)
      if (pose.current < 2 && idle.current > play.current.next && !info.flies) {
        play.current.until = idle.current + 3 + Math.random() * 2.5
        play.current.next = play.current.until + 8 + Math.random() * 8
        play.current.angle = Math.atan2(x - px, z - pz)
        play.current.dir = Math.random() < 0.5 ? 1 : -1
        if (Math.random() < 0.4) playPetSound(pet, 0.7)
      }
      // เสียงร้องตอนรอ (ไม่ร้องตอนนอนหลับ)
      if (pose.current < 2 && idle.current > nextIdleSound.current) {
        playPetSound(pet, 0.6)
        nextIdleSound.current = idle.current + 15 + Math.random() * 25
      }
      if (pose.current === 2) nextIdleSound.current = Math.max(nextIdleSound.current, idle.current + 10)
    }
    if (idle.current === 0) nextIdleSound.current = 8 + Math.random() * 15
    pos.current = [x, z]
    if (import.meta.env.DEV) (window as unknown as { __pet: unknown }).__pet = { pose: pose.current, idle: idle.current, dist, motion: motion.current, playing }

    let fly = 0
    if (root.current) {
      // นกบินลอยระดับไหล่ / พอนอนจะลงมาเกาะพื้น
      fly = info.flies ? (pose.current === 2 ? 0.05 : 1.5 + Math.sin(clock.elapsedTime * 2) * 0.12) : 0
      root.current.position.x = x
      root.current.position.z = z
      const ground = templeGroundY(x, z)
      root.current.position.y += (ground + fly - root.current.position.y) * Math.min(1, dt * (fly ? 3 : 10))
      root.current.rotation.y = heading.current
    }

    // ---- สายจูง: จากมือขวาของผู้เล่นถึงคอสัตว์ ----
    if (leash.current) {
      leash.current.visible = leashed
      if (leashed) {
        const hand = tmp.a.set(px + Math.cos(ph) * 0.28, 0.86, pz - Math.sin(ph) * 0.28)
        const [ny, nz] = anchor.neck
        const h = heading.current
        const lift = pose.current === 2 ? -ny * scale * 0.5 : 0
        const neck = tmp.b.set(x + Math.sin(h) * nz * scale, (root.current?.position.y ?? 0) + ny * scale + lift, z + Math.cos(h) * nz * scale)
        const mid = hand.clone().add(neck).multiplyScalar(0.5)
        const len = hand.distanceTo(neck)
        // หย่อนลงเล็กน้อยตรงกลางเมื่อไม่ตึง
        mid.y -= Math.max(0, LEASH_LEN - len) * 0.15
        leash.current.position.copy(mid)
        tmp.q.setFromUnitVectors(tmp.up, neck.clone().sub(hand).normalize())
        leash.current.quaternion.copy(tmp.q)
        leash.current.scale.set(1, len, 1)
      }
    }
  })

  function turnToward(target: number, dt: number) {
    let d = target - heading.current
    d = Math.atan2(Math.sin(d), Math.cos(d))
    heading.current += d * Math.min(1, dt * 8)
  }

  return (
    <>
      <group ref={root}>
        <Pet pet={pet} motion={motion} pose={pose} />
      </group>
      <mesh ref={leash} visible={false}>
        <cylinderGeometry args={[0.012, 0.012, 1, 5]} />
        <meshStandardMaterial color="#c0392b" />
      </mesh>
    </>
  )
}
