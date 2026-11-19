import { useMemo, useReducer, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { Character, type CharacterAction, type ToolId } from './models/Character'
import { Motorcycle, type MotoKind } from './models/Motorcycle'
import { TalkMark } from './Villagers'
import { RepairShop } from './RepairShop'
import { PLACES, type Vec2 } from '../game/content/village'
import type { Appearance, PoseId } from '../game/content/appearance'
import { exactMinute } from '../game/clock'
import { npcPos, useTalk } from '../game/talk'
import { weatherRt } from '../game/weather'

/**
 * คนในครอบครัวบ้านฟ่าง: มีกิจวัตรของตัวเอง เดินไปทำงานตามจุดต่าง ๆ ไม่ยืนนิ่งที่เดิม
 * - น้ารงณ์ (น้าชายคนกลาง ~39 ปี ช่างซ่อมรถจักรยานยนต์): คุกเข่าซ่อมรถทีละคัน · ไปหยิบเครื่องมือที่ตู้ · ไปนั่งพักที่แคร่หน้าประตู
 * - น้ายศ (น้าชายคนเล็ก วิศวกรไฟฟ้า): ตรวจเสาไฟฟ้าหน้าบ้านทีละต้น · ยืนจดงานที่หน้าประตูรั้ว
 * เลือกงานถัดไปแบบสุ่มถ่วงน้ำหนัก (ไม่วนซ้ำเป็นจังหวะเดิม) · เดินเร็วช้าไม่เท่ากัน หันตัวนุ่ม ๆ · ค่ำ/ฝนหนักเข้าบ้าน
 */

interface Station {
  id: string
  /** เส้นทางจากจุดกลาง (hub) ไปถึงจุดนี้ — จุดสุดท้าย = ที่ยืนทำงาน */
  path: Vec2[]
  face: number
  action?: CharacterAction
  pose?: PoseId
  dur: [number, number]
  weight: number
}

interface Routine {
  id: string
  appearance: Appearance
  tool?: ToolId
  hub: Vec2
  stations: Station[]
  /** จุดเข้าบ้านตอนค่ำ */
  home: string
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

function RoutineNPC({ r }: { r: Routine }) {
  const g = useRef<Group>(null)
  const motion = useRef(0)
  const st = useRef({
    at: r.stations[0],
    route: [] as Vec2[],
    x: r.stations[0].path[r.stations[0].path.length - 1][0],
    z: r.stations[0].path[r.stations[0].path.length - 1][1],
    h: r.stations[0].face,
    timer: rnd(...r.stations[0].dur),
    walking: false,
    speed: 1,
    action: r.stations[0].action as CharacterAction | undefined,
    pose: r.stations[0].pose as PoseId | undefined,
  })
  const look = useRef<Appearance>({ ...r.appearance })
  const visible = useRef(true)
  const pickNext = () => {
    const s = st.current
    const night = (() => {
      const m = exactMinute()
      return m > 1170 || m < 345
    })()
    const goHome = night || weatherRt.rain > 0.75
    let next: Station
    if (goHome) next = r.stations.find((x) => x.id === r.home)!
    else {
      const list = r.stations.filter((x) => x.id !== s.at.id)
      const tot = list.reduce((a, b) => a + b.weight, 0)
      let k = Math.random() * tot
      next = list.find((x) => (k -= x.weight) < 0) ?? list[0]
    }
    // ถอยกลับทางเดิมไปจุดกลาง แล้วเดินไปจุดใหม่
    s.route = [...s.at.path.slice(0, -1).reverse(), r.hub, ...next.path]
    s.at = next
    s.walking = true
    s.speed = rnd(0.95, 1.35)
    s.action = undefined
    s.pose = undefined
  }
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const s = st.current
    const m = exactMinute()
    const inside = (m > 1170 || m < 345 || weatherRt.rain > 0.75) && !s.walking && s.at.id === r.home
    visible.current = !inside
    if (useTalk.getState().talking === r.id) {
      // ผู้เล่นคุยด้วย: หยุดเดิน ยืนคุย
      motion.current = 0
    } else if (s.walking) {
      const tgt = s.route[0]
      if (!tgt) {
        s.walking = false
        s.timer = rnd(...s.at.dur)
        s.action = s.at.action
        s.pose = s.at.pose
      } else {
        const dx = tgt[0] - s.x
        const dz = tgt[1] - s.z
        const d = Math.hypot(dx, dz)
        if (d < 0.08) s.route.shift()
        else {
          const v = Math.min(d, s.speed * (0.9 + Math.sin(clock.elapsedTime * 1.3) * 0.1) * dt)
          s.x += (dx / d) * v
          s.z += (dz / d) * v
          turn(s, Math.atan2(dx, dz), dt * 6)
        }
      }
      motion.current = s.walking ? 1 : 0
    } else {
      motion.current = 0
      turn(s, s.at.face, dt * 4)
      s.timer -= dt
      if (s.timer <= 0) pickNext()
    }
    // ท่าทาง: เปลี่ยนเฉพาะตอนต่างจากเดิม (ไม่ render ใหม่ทุกเฟรม)
    const want = s.pose ?? 'stand'
    if (look.current.pose !== want) look.current = { ...look.current, pose: want }
    if (g.current) {
      g.current.visible = visible.current
      g.current.position.set(s.x, 0, s.z)
      g.current.rotation.y = s.h
    }
    if (visible.current) npcPos.set(r.id, [s.x, s.z])
    else npcPos.delete(r.id)
  })
  return (
    <group ref={g}>
      <Body st={st} look={look} motion={motion} tool={r.tool} />
      <TalkMark id={r.id} />
    </group>
  )
}

function turn(s: { h: number }, want: number, k: number) {
  let dh = want - s.h
  while (dh > Math.PI) dh -= Math.PI * 2
  while (dh < -Math.PI) dh += Math.PI * 2
  s.h += dh * Math.min(1, k)
}

/** ตัวละคร: อัปเดตท่า/การกระทำ ~4 ครั้งต่อวินาที (ไม่ต้อง render ใหม่ทุกเฟรม) */
function Body({ st, look, motion, tool }: { st: React.MutableRefObject<{ action?: CharacterAction }>; look: React.MutableRefObject<Appearance>; motion: React.MutableRefObject<number>; tool?: ToolId }) {
  const [, force] = useForce()
  const last = useRef({ a: st.current.action, p: look.current.pose })
  useFrame(() => {
    const a = st.current.action
    const p = look.current.pose
    if (a !== last.current.a || p !== last.current.p) {
      last.current = { a, p }
      force()
    }
  })
  return <Character appearance={look.current} motion={motion} action={st.current.action} tool={tool} />
}
const useForce = () => useReducer((x: number) => x + 1, 0)

/* ───────── ที่จอดมอเตอร์ไซค์ + มุมช่าง (พิกัดภายในบ้านตา) ───────── */
export const MOTO_BIKES: [number, number, string, MotoKind][] = [
  [-11.3, 14.4, '#3f86c8', 'scooter'],
  [-11.3, 16.6, '#c0322a', 'family'],
  [-11.3, 18.8, '#2a2a2e', 'sport'],
]

/** อู่ซ่อมรถมอเตอร์ไซค์ (ตามภาพอ้างอิง) หันหน้าไปทางตะวันออก หลังร้านชิดรั้วตะวันตก · รถรอซ่อม 3 คันจอดหน้าร้าน */
export const SHOP_AT: [number, number] = [-14.6, 16.6]
function MotoYard({ o }: { o: Vec2 }) {
  return (
    <group position={[o[0], 0, o[1]]}>
      <group position={[SHOP_AT[0], 0, SHOP_AT[1]]} rotation={[0, Math.PI / 2, 0]}>
        <RepairShop />
      </group>
      {MOTO_BIKES.map(([x, z, c, k], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, 0.25 - i * 0.2, 0]}>
          <Motorcycle color={c} kind={k} lean={0.09} />
        </group>
      ))}
    </group>
  )
}

export function FamilyLife() {
  const hp = PLACES.find((p) => p.id === 'home-tarang')
  const o: Vec2 = hp ? [hp.pos[0], hp.pos[1]] : [-18, 71]
  const routines = useMemo<Routine[]>(() => {
    const L = (x: number, z: number): Vec2 => [o[0] + x, o[1] + z]
    const bike = (i: number): Station => ({
      id: 'bike' + i,
      path: [L(MOTO_BIKES[i][0] + 1.4, MOTO_BIKES[i][1]), L(MOTO_BIKES[i][0] + 0.7, MOTO_BIKES[i][1])],
      face: -Math.PI / 2,
      action: 'repair',
      dur: [14, 32],
      weight: 3,
    })
    const rong: Routine = {
      id: 'rong',
      appearance: { gender: 'male', skin: 'tan', hairStyle: 'short', hairColor: 'black', outfit: 'mohom', topColor: '#2b3a5a', bottomColor: '#4a4c50', shoes: 'boots' } as Appearance,
      tool: 'toolbelt',
      hub: L(-10.2, 16.6),
      home: 'door',
      stations: [
        bike(2),
        bike(0),
        bike(1),
        { id: 'tools', path: [L(-12.4, 18.2), L(-15.3, 18.2)], face: -Math.PI / 2, action: 'inspect', dur: [4, 9], weight: 2 },
        { id: 'bench', path: [L(-12.4, 16.2), L(-13.6, 16.2)], face: -Math.PI / 2, action: 'talk', dur: [5, 10], weight: 1.5 },
        { id: 'rest', path: [L(-9.6, 12.0), L(-9.4, 6.0), L(-7.6, 4.2), L(-3.9, 1.4), L(-3.9, 0.7)], face: 0, pose: 'sit', dur: [12, 25], weight: 1 },
        { id: 'door', path: [L(-9.6, 12.0), L(-9.4, 6.0), L(-7.6, 4.2), L(-6.1, 0.4)], face: Math.PI, dur: [3, 6], weight: 0.6 },
      ],
    }
    const yot: Routine = {
      id: 'yot',
      appearance: { gender: 'male', skin: 'tan', hairStyle: 'short', hairColor: 'black', outfit: 'mohom', topColor: '#cbbd96', bottomColor: '#4a4c50', shoes: 'boots', accessory: 'hardhat', accessoryColor: 'yellow' } as Appearance,
      tool: 'toolbelt',
      hub: [-20, 55.6],
      home: 'gate',
      stations: [
        { id: 'pole1', path: [[-13.3, 55.6], [-13.3, 56.55]], face: 0, action: 'inspect', dur: [18, 40], weight: 3 },
        { id: 'pole2', path: [[-32.3, 55.6], [-32.3, 56.55]], face: 0, action: 'inspect', dur: [15, 35], weight: 2.5 },
        { id: 'gate', path: [[-24.5, 56.6]], face: Math.PI, action: 'talk', dur: [6, 14], weight: 1.5 },
      ],
    }
    return [rong, yot]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <group>
      <MotoYard o={o} />
      {routines.map((r) => (
        <RoutineNPC key={r.id} r={r} />
      ))}
    </group>
  )
}
