import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useGame } from '../game/store'
import { AGE_RULES } from '../game/content/appearance'
import { VILLAGERS, VILLAGE_DOGS, type Villager } from '../game/content/villagers'
import type { Vec2 } from '../game/content/village'
import { Character } from './models/Character'
import { Pet } from './models/Pet'

const WALK_SPEED = 1.3

/** เดินตามจุดไปกลับ (ping-pong) แวะพักที่ปลายทาง — คืนค่า motion (0 = หยุด) */
function usePathWalker(path: Vec2[], speed: number, pauseSec: number, offset: number) {
  const st = useRef({ seg: 0, dir: 1, t: (offset % 1) * 0.9, wait: 0 })
  return (g: Group, dt: number) => {
    const s = st.current
    if (path.length < 2) return 0
    if (s.wait > 0) {
      s.wait -= dt
      return 0
    }
    const a = path[s.seg]
    const b = path[s.seg + s.dir]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    s.t += (speed * dt) / len
    if (s.t >= 1) {
      s.t = 0
      s.seg += s.dir
      if (s.seg + s.dir < 0 || s.seg + s.dir >= path.length) {
        s.dir *= -1
        s.wait = pauseSec * (0.6 + Math.random() * 0.8)
      } else if (Math.random() < 0.3) s.wait = 1 + Math.random() * 2
      return 0
    }
    g.position.set(a[0] + (b[0] - a[0]) * s.t, 0, a[1] + (b[1] - a[1]) * s.t)
    const target = Math.atan2(b[0] - a[0], b[1] - a[1])
    const diff = Math.atan2(Math.sin(target - g.rotation.y), Math.cos(target - g.rotation.y))
    g.rotation.y += diff * Math.min(1, dt * 6)
    return 1
  }
}

function VillagerActor({ v, index }: { v: Villager; index: number }) {
  const root = useRef<Group>(null!)
  const motion = useRef(0)
  const b = v.behavior
  const age = AGE_RULES[v.appearance.age ?? 'adult']
  const walk = usePathWalker(
    b.kind === 'walk' ? b.path : [],
    WALK_SPEED * age.walkSpeed,
    b.kind === 'walk' ? (b.pauseSec ?? 4) : 0,
    index * 0.37,
  )
  const clock = useRef(index * 1.7)

  useFrame((_, raw) => {
    if (useGame.getState().paused) return
    const dt = Math.min(raw, 0.05)
    clock.current += dt
    const g = root.current
    if (b.kind === 'walk') {
      motion.current = walk(g, dt)
    } else if (b.kind === 'work') {
      // ทำงานพลางค่อย ๆ ขยับไปด้านข้างตามแนวถนน
      const off = Math.sin(clock.current * 0.08) * (b.drift ?? 0)
      g.position.set(b.pos[0] + Math.cos(b.heading) * off, 0, b.pos[1] - Math.sin(b.heading) * off)
      g.rotation.y = b.heading + Math.sin(clock.current * 0.5) * 0.15
    }
  })

  const init: [number, number, number] = b.kind === 'walk' ? [b.path[0][0], 0, b.path[0][1]] : [b.pos[0], 0, b.pos[1]]
  const rotY =
    b.kind === 'stand' ? Math.atan2(b.faceTo[0] - b.pos[0], b.faceTo[1] - b.pos[1]) : b.kind === 'work' ? b.heading : 0
  const action = b.kind === 'work' ? b.action : b.kind === 'stand' && b.talk ? 'talk' : undefined
  return (
    <group ref={root} position={init} rotation-y={rotY}>
      <Character appearance={v.appearance} motion={motion} action={action} tool={v.tool} />
    </group>
  )
}

function VillageDog({ dog, index }: { dog: (typeof VILLAGE_DOGS)[number]; index: number }) {
  const root = useRef<Group>(null!)
  const motion = useRef(0)
  const pose = useRef(0)
  const idle = useRef(0)
  const walk = usePathWalker(dog.path, 1.5, 5, index * 0.5)
  useFrame((_, raw) => {
    if (useGame.getState().paused) return
    const dt = Math.min(raw, 0.05)
    motion.current = walk(root.current, dt)
    // หยุดนานหน่อยก็นั่งลง
    idle.current = motion.current ? 0 : idle.current + dt
    pose.current = idle.current > 2 ? 1 : 0
  })
  return (
    <group ref={root} position={[dog.path[0][0], 0, dog.path[0][1]]}>
      <Pet pet={dog.pet} motion={motion} pose={pose} />
    </group>
  )
}

/** ชาวบ้านและหมาที่ใช้ชีวิตอยู่ในหมู่บ้าน (บรรยากาศ) */
export function Villagers() {
  return (
    <group>
      {VILLAGERS.map((v, i) => (
        <VillagerActor key={v.id} v={v} index={i} />
      ))}
      {VILLAGE_DOGS.map((d, i) => (
        <VillageDog key={d.id} dog={d} index={i} />
      ))}
    </group>
  )
}
