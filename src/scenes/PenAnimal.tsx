import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { PetChoice } from '../game/content/pets'
import { Pet } from './models/Pet'
import { useClock } from '../game/clock'
import { lifePhase } from '../game/petCycle'

/**
 * สัตว์ในคอก (ควาย หมู ไก่ในสุ่ม …) ใช้ชีวิตเองในขอบเขตคอก — ผู้สร้าง 19 พ.ย. 2569
 * กิจกรรมสุ่มต่อเนื่อง: เดินเล่น · เดินไปกินน้ำที่ราง (ก้มหัวดื่ม) · เดินไปกินหญ้า/อาหาร (ก้มเคี้ยว) · ลงนอนพัก · ยืน/นั่งเฉย ๆ
 * กลางคืน (ตามวงจรนอนของสัตว์ชนิดนั้น) = เดินไปที่นอนแล้วนอนหลับ · ตัวในคอกเดียวกันไม่เดินทับกัน
 * พิกัดทั้งหมด = พิกัดภายในกลุ่มคอก (ก่อนหมุน)
 */
export interface PenSpots {
  bounds: [number, number, number, number] // x0 x1 z0 z1
  /** ด้านหน้ารางน้ำ/รางอาหาร: [x, z, ทิศหันเข้าราง, ความยาวราง (ตามแกน x)] */
  water?: [number, number, number, number]
  food?: [number, number, number, number]
  /** มุมนอน */
  rest?: [number, number]
}
type Act = 'walk' | 'drink' | 'eat' | 'rest' | 'idle' | 'sleep'

const crowd = new Map<string, Map<number, [number, number]>>()

export function PenAnimal({ pet, s = 1, start, spots, pen, idx, speed = 0.55 }: { pet: PetChoice; s?: number; start: [number, number, number]; spots: PenSpots; pen: string; idx: number; speed?: number }) {
  const g = useRef<Group>(null)
  const motion = useRef(0)
  const pose = useRef(0)
  const rnd = useMemo(() => {
    let x = (idx + 1) * 7919 + pen.length * 131
    return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646
  }, [idx, pen])
  const st = useRef({ x: start[0], z: start[1], h: start[2], act: 'idle' as Act, tx: start[0], tz: start[1], th: start[2], left: 2 + idx * 1.3, t: 0, arrived: true })
  const pick = () => {
    const S = st.current
    const [x0, x1, z0, z1] = spots.bounds
    const night = lifePhase(pet, useClock.getState().minute) === 'sleep'
    const w: [Act, number][] = night
      ? [
          ['sleep', 10],
          ['drink', spots.water ? 0.5 : 0],
          ['idle', 0.5],
        ]
      : [
          ['walk', 3],
          ['drink', spots.water ? 2 : 0],
          ['eat', spots.food ? 3 : 0],
          ['rest', 2],
          ['idle', 2],
        ]
    let r = rnd() * w.reduce((a, b) => a + b[1], 0)
    const act = (w.find(([, k]) => (r -= k) < 0) ?? w[0])[0]
    S.act = act
    S.arrived = false
    const lane = (t: [number, number, number, number]) => {
      S.tx = t[0] + (rnd() - 0.5) * t[3]
      S.tz = t[1]
      S.th = t[2]
    }
    if (act === 'drink' && spots.water) lane(spots.water)
    else if (act === 'eat' && spots.food) lane(spots.food)
    else if ((act === 'sleep' || act === 'rest') && spots.rest && rnd() < 0.6) {
      S.tx = spots.rest[0] + (rnd() - 0.5) * 1.2
      S.tz = spots.rest[1] + (rnd() - 0.5) * 1.0
      S.th = rnd() * Math.PI * 2
    } else {
      S.tx = x0 + rnd() * (x1 - x0)
      S.tz = z0 + rnd() * (z1 - z0)
      S.th = rnd() * Math.PI * 2
    }
    S.left = act === 'sleep' ? 40 + rnd() * 40 : act === 'rest' ? 15 + rnd() * 20 : act === 'eat' ? 7 + rnd() * 8 : act === 'drink' ? 4 + rnd() * 4 : act === 'walk' ? 1 + rnd() * 2 : 3 + rnd() * 4
  }
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const S = st.current
    S.t += dt
    let mates = crowd.get(pen)
    if (!mates) crowd.set(pen, (mates = new Map()))
    let dx = S.tx - S.x
    let dz = S.tz - S.z
    const d = Math.hypot(dx, dz)
    if (!S.arrived && d > 0.1) {
      // หลบตัวอื่นในคอก
      for (const [k, [ox, oz]] of mates) {
        if (k === idx) continue
        const ax = S.x - ox
        const az = S.z - oz
        const dd = Math.hypot(ax, az)
        const min = 0.75 * s
        if (dd < min && dd > 0.001) {
          dx += (ax / dd) * (min - dd) * 3
          dz += (az / dd) * (min - dd) * 3
        }
      }
      const len = Math.hypot(dx, dz) || 1
      const step = Math.min(d, speed * dt)
      S.x += (dx / len) * step
      S.z += (dz / len) * step
      const [x0, x1, z0, z1] = spots.bounds
      S.x = Math.min(x1, Math.max(x0, S.x))
      S.z = Math.min(z1, Math.max(z0, S.z))
      let dh = Math.atan2(dx, dz) - S.h
      dh = Math.atan2(Math.sin(dh), Math.cos(dh))
      S.h += dh * Math.min(1, dt * 4)
      motion.current = 1
      pose.current = 0
      if (d < 0.15) S.arrived = true
      // ติดอยู่นานเกิน = ถือว่าถึงแล้ว
      S.left -= dt * 0.2
      if (S.left < -2) S.arrived = true
    } else {
      S.arrived = true
      motion.current = 0
      let dh = S.th - S.h
      dh = Math.atan2(Math.sin(dh), Math.cos(dh))
      S.h += dh * Math.min(1, dt * 2.5)
      S.left -= dt
      pose.current = S.act === 'rest' || S.act === 'sleep' ? 2 : S.act === 'idle' && S.left > 4 ? 1 : 0
      if (S.left <= 0) pick()
    }
    mates.set(idx, [S.x, S.z])
    if (g.current) {
      g.current.position.set(S.x, 0, S.z)
      g.current.rotation.y = S.h
      // ก้มดื่มน้ำ/เคี้ยวหญ้าเป็นจังหวะ · หลับ = หายใจช้า ๆ
      const eating = S.arrived && (S.act === 'eat' || S.act === 'drink')
      g.current.rotation.x = eating ? 0.22 + Math.sin(S.t * (S.act === 'eat' ? 5 : 3)) * 0.06 : 0
      g.current.scale.set(s, s * (S.act === 'sleep' && S.arrived ? 1 + Math.sin(S.t * 1.3) * 0.02 : 1), s)
    }
  })
  return (
    <group ref={g} position={[start[0], 0, start[1]]} rotation={[0, start[2], 0]} scale={s}>
      <Pet pet={pet} motion={motion} pose={pose} />
    </group>
  )
}
