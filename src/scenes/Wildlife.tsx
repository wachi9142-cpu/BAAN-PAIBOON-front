import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type Group, type Mesh } from 'three'
import { useGame } from '../game/store'
import { PULL_DURATION, refreshWild, tierOf, wild, wildPos } from '../game/catching'
import { TIERS, WILD_SPAWNS, type WildSpawn } from '../game/content/wildlife'
import { playerPose } from './Player'
import { Pet } from './models/Pet'

const CATCH_RANGE = 2.8
const SCARE_RANGE = 5

/** สัตว์ที่เก็บได้ ใช้ชีวิตอยู่ในหมู่บ้านและรอบ ๆ */
export function Wildlife() {
  const setWildTarget = useGame((s) => s.setWildTarget)
  const tick = useRef(0)
  useFrame((_, dt) => {
    tick.current += dt
    if (tick.current < 0.2) return
    tick.current = 0
    refreshWild()
    // หาสัตว์ที่ใกล้พอจะเก็บ
    let best: string | null = null
    let bd = CATCH_RANGE
    for (const s of WILD_SPAWNS) {
      if (wild.get(s.id)!.status !== 'free') continue
      const p = wildPos.get(s.id)
      if (!p) continue
      const d = Math.hypot(p[0] - playerPose.x, p[1] - playerPose.z)
      if (d < bd) {
        bd = d
        best = s.id
      }
    }
    setWildTarget(best)
  })
  return (
    <group>
      {WILD_SPAWNS.map((s, i) => (
        <WildAnimal key={s.id} spawn={s} seed={i} />
      ))}
    </group>
  )
}

function WildAnimal({ spawn, seed }: { spawn: WildSpawn; seed: number }) {
  const root = useRef<Group>(null!)
  const body = useRef<Group>(null!)
  const marker = useRef<Mesh>(null!)
  const beam = useRef<Mesh>(null!)
  const motion = useRef(0)
  const pose = useRef(0)
  const st = useRef({
    x: spawn.home[0],
    z: spawn.home[1],
    tx: spawn.home[0],
    tz: spawn.home[1],
    wait: seed % 3,
    t: seed,
  })
  const tier = tierOf(spawn.id)
  const color = TIERS[tier].color
  const tmp = new Vector3()

  useFrame((_, raw) => {
    const r = wild.get(spawn.id)!
    const visible = r.status === 'free' || r.status === 'pulling'
    root.current.visible = visible
    if (!visible) return
    if (useGame.getState().paused) return
    const dt = Math.min(raw, 0.05)
    const s = st.current
    s.t += dt
    const px = playerPose.x
    const pz = playerPose.z
    const dPlayer = Math.hypot(s.x - px, s.z - pz)

    if (r.status === 'pulling') {
      // ถูกดึงเข้าหาผู้เล่นอย่างนุ่มนวล ค่อย ๆ ลอยและเล็กลง
      const k = Math.min(1, (performance.now() - r.pullStart) / PULL_DURATION)
      s.x += (px - s.x) * dt * 3
      s.z += (pz - s.z) * dt * 3
      root.current.position.set(s.x, Math.sin(k * Math.PI) * 0.6, s.z)
      body.current.scale.setScalar(1 - k * 0.85)
      motion.current = 0
      beam.current.visible = r.beam
      if (r.beam) {
        // ลำแสงจากมือผู้เล่นไปที่สัตว์
        const dx = px - s.x
        const dz = pz - s.z
        const len = Math.hypot(dx, dz)
        beam.current.position.set(dx / 2, 0.9, dz / 2)
        beam.current.scale.set(1, len, 1)
        beam.current.rotation.set(Math.PI / 2, 0, 0)
        beam.current.lookAt(tmp.set(px, 0.9 + root.current.position.y, pz))
        beam.current.rotateX(Math.PI / 2)
      }
      wildPos.set(spawn.id, [s.x, s.z])
      return
    }
    beam.current.visible = false
    body.current.scale.setScalar(1)
    root.current.position.y = 0

    // สัตว์ระดับปานกลางขึ้นไปตกใจถ้าวิ่งเข้าใส่ (หรือเพิ่งจับพลาด)
    const scared = (tier !== 'easy' && dPlayer < SCARE_RANGE && playerPose.motion === 2) || performance.now() < 0 || Date.now() < r.scaredUntil
    let speed = tier === 'hard' ? 0.9 : 0.7
    if (scared && dPlayer < SCARE_RANGE * 1.6) {
      // วิ่งหนีออกจากผู้เล่น แต่ไม่ออกนอกบริเวณบ้านของมันไกลเกินไป
      const ax = s.x - px
      const az = s.z - pz
      const l = Math.hypot(ax, az) || 1
      s.tx = s.x + (ax / l) * 4
      s.tz = s.z + (az / l) * 4
      const hx = s.tx - spawn.home[0]
      const hz = s.tz - spawn.home[1]
      const hl = Math.hypot(hx, hz)
      if (hl > spawn.roam * 2.2) {
        s.tx = spawn.home[0] + (hx / hl) * spawn.roam * 2.2
        s.tz = spawn.home[1] + (hz / hl) * spawn.roam * 2.2
      }
      s.wait = 0
      speed = 3.2
    } else if (s.wait > 0) {
      s.wait -= dt
    }

    const dx = s.tx - s.x
    const dz = s.tz - s.z
    const d = Math.hypot(dx, dz)
    if (s.wait <= 0 && d > 0.15) {
      const step = Math.min(d, speed * dt)
      s.x += (dx / d) * step
      s.z += (dz / d) * step
      const target = Math.atan2(dx, dz)
      const diff = Math.atan2(Math.sin(target - root.current.rotation.y), Math.cos(target - root.current.rotation.y))
      root.current.rotation.y += diff * Math.min(1, dt * 6)
      motion.current = speed > 2 ? 2 : 1
      pose.current = 0
    } else {
      motion.current = 0
      if (s.wait <= 0) {
        // พักสักครู่ แล้วสุ่มจุดเดินเล่นใหม่
        s.wait = 2 + ((seed * 7 + Math.floor(s.t)) % 5)
        const a = Math.random() * Math.PI * 2
        const rr = Math.random() * spawn.roam
        s.tx = spawn.home[0] + Math.cos(a) * rr
        s.tz = spawn.home[1] + Math.sin(a) * rr
      }
      pose.current = s.wait > 3 ? 1 : 0
    }
    root.current.position.x = s.x
    root.current.position.z = s.z
    wildPos.set(spawn.id, [s.x, s.z])

    // ป้ายสีบอกความยาก ลอยขึ้นลงเบา ๆ (เห็นชัดเมื่ออยู่ใกล้)
    marker.current.position.y = 1.15 + Math.sin(s.t * 2.2) * 0.07
    marker.current.rotation.y += dt * 1.5
    marker.current.visible = dPlayer < 14
  })

  const scale = spawn.pet.species === 'buffalo' || spawn.pet.species === 'cow' ? 0.8 : 1
  const markerY = spawn.pet.species === 'buffalo' || spawn.pet.species === 'cow' ? 1.6 : 1.15
  return (
    <group ref={root} position={[spawn.home[0], 0, spawn.home[1]]}>
      <group ref={body} scale={scale}>
        <Pet pet={spawn.pet} motion={motion} pose={pose} />
      </group>
      <mesh ref={marker} position={[0, markerY, 0]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      <mesh ref={beam} visible={false}>
        <cylinderGeometry args={[0.035, 0.035, 1, 10, 1, true]} />
        <meshBasicMaterial color="#fff2a8" transparent opacity={0.75} />
      </mesh>
    </group>
  )
}
