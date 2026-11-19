import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { Pet } from './models/Pet'
import { TextSprite } from './TextSprite'
import { Character } from './models/Character'
import type { PetChoice } from '../game/content/pets'
import type { Appearance } from '../game/content/appearance'
import { DEFAULT_APPEARANCE } from '../game/content/appearance'
import { exactMinute, useClock } from '../game/clock'
import { PLACES, type Vec2 } from '../game/content/village'
import { playerPose } from '../game/playerPose'
import { useGame } from '../game/store'
import { weatherRt } from '../game/weather'
import { audio } from '../game/audio/engine'
import { playCall, type CallKind } from '../game/audio/synth'

/**
 * ชีวิตในหมู่บ้าน (§2.54): โลกเดินของมันเอง ไม่ต้องรอผู้เล่น
 * - คนเลี้ยงควาย: เช้าพาควายออกจากคอกไปทุ่งหญ้า ควายเดินตามหลวม ๆ · กลางวันเล็มหญ้า พัก นอน · ก่อน 6 โมงเย็นพากลับคอก
 * - หมาประจำบ้าน: เดินเล่น ดมพื้น นอนใต้ร่ม เดินออกหน้าบ้านแล้วกลับ · เห่าคนแปลกหน้า · หมาบ้านเราวิ่งมาหาเจ้าของ
 * - ครอบครัวไก่: พ่อไก่ตรวจพื้นที่ คุ้ยเขี่ย ขันตอนเช้า · แม่ไก่จิกหาอาหาร · ลูกไก่ตามแม่ วิ่งกลับเมื่อห่าง · ค่ำเข้าเล้า
 * ทุกตัวความเร็วไม่คงที่ หยุด หันมอง เปลี่ยนทิศ และสุ่มจังหวะไม่ซ้ำกัน · ตารางเวลาต่างกันเล็กน้อยทุกวัน
 */

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
/** สุ่มแบบคงที่ต่อวัน (ตารางแต่ละวันต่างกันนิดหน่อย) */
const dayRand = (day: number, k: number) => {
  const x = Math.sin(day * 127.1 + k * 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function callSound(kind: CallKind, x: number, z: number, vol = 0.5): number {
  const o = audio.outputs()
  if (!o) return 0
  const d = Math.hypot(playerPose.x - x, playerPose.z - z)
  if (d > 30) return 0
  const g = o.ctx.createGain()
  g.gain.value = vol * Math.max(0.1, 1 - d / 30)
  g.connect(o.sfx)
  const dur = playCall(o.ctx, g, kind, rnd(0.9, 1.1), 1 + Math.floor(Math.random() * 2))
  window.setTimeout(() => g.disconnect(), (dur + 0.5) * 1000)
  return dur
}

/** สมองการเดินแบบธรรมชาติ: เดิน (ความเร็วแกว่ง) → หยุด/ดม/หันมอง → นั่งหรือนอนพัก */
interface Mover {
  x: number
  z: number
  h: number
  tx: number
  tz: number
  speed: number
  wait: number
  pose: number
  act: 'walk' | 'idle' | 'rest'
}
const mover = (x: number, z: number): Mover => ({ x, z, h: Math.random() * 6.28, tx: x, tz: z, speed: 1, wait: rnd(0, 3), pose: 0, act: 'idle' })

/** เดินเข้าหาเป้า คืน true ถ้าถึงแล้ว (หมุนหัวนุ่ม ๆ ความเร็วไม่คงที่) */
function step(m: Mover, dt: number, t: number) {
  const dx = m.tx - m.x
  const dz = m.tz - m.z
  const d = Math.hypot(dx, dz)
  if (d < 0.15) return true
  const v = Math.min(d, m.speed * (0.8 + Math.sin(t * 1.7 + m.x) * 0.2) * dt)
  m.x += (dx / d) * v
  m.z += (dz / d) * v
  const want = Math.atan2(dx, dz)
  let dh = want - m.h
  while (dh > Math.PI) dh -= Math.PI * 2
  while (dh < -Math.PI) dh += Math.PI * 2
  m.h += dh * Math.min(1, dt * 4)
  return false
}

const lookAt = (m: Mover, x: number, z: number, dt: number) => {
  let dh = Math.atan2(x - m.x, z - m.z) - m.h
  while (dh > Math.PI) dh -= Math.PI * 2
  while (dh < -Math.PI) dh += Math.PI * 2
  m.h += dh * Math.min(1, dt * 3)
}

export function VillageLife() {
  return (
    <group>
      <BuffaloHerd />
      <HouseDogs />
      <ChickenFamilies />
    </group>
  )
}

/* ═════════════ คนเลี้ยงควาย ═════════════ */
const BUFFALO: PetChoice = { species: 'buffalo', name: 'ควาย', color: '#4a4a52', pattern: 'plain', patternColor: '#6a6a72' }
const HERDER: Appearance = { ...(DEFAULT_APPEARANCE as unknown as { male: Appearance }).male, gender: 'male', age: 'elder', skin: 'tan', hairColor: 'gray', outfit: 'farmer', topColor: '#5b7c99', bottomColor: '#3d3a36', shoes: 'sandals' } as unknown as Appearance
const TRAVEL = 35 // นาทีในเกมต่อเที่ยว

function herdPlan() {
  const farm = PLACES.find((p) => p.id === 'farm-soi2')!
  const [fx, fz] = farm.pos
  const pen: Vec2 = [fx - 4, fz - 3.5]
  // ทางเดิน: คอก → ประตูคอกฝั่งซอย 2 → ขึ้นซอย 2 → ถนนหน้าบ้านตา (ผ่านประตูบ้านเรา) → ลงซอยกลาง → ทุ่งหญ้าริมซอย
  const path: Vec2[] = [pen, [fx - 10, fz], [fx - farm.size[0] / 2 - 2, fz], [-36, fz], [-36, 54.5], [-1.5, 54.5], [-1.5, 36], [6, 30], [12, 28]]
  const pasture = { cx: 12, cz: 28, hw: 6, hd: 4 }
  return { pen, path, pasture }
}
function along(path: Vec2[], p: number): Vec2 {
  const seg: number[] = []
  let total = 0
  for (let i = 1; i < path.length; i++) {
    const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1])
    seg.push(l)
    total += l
  }
  let d = Math.max(0, Math.min(1, p)) * total
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const k = d / seg[i]
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k]
    }
    d -= seg[i]
  }
  return path[path.length - 1]
}

function BuffaloHerd() {
  const plan = useMemo(herdPlan, [])
  const herder = useRef<Group>(null)
  const hMotion = useRef(0)
  const bufs = useMemo(() => [0, 1, 2].map((i) => ({ m: mover(plan.pen[0] + (i - 1) * 1.6, plan.pen[1] + rnd(-1, 1)), motion: { current: 0 }, pose: { current: 0 }, ref: { current: null as Group | null }, lag: rnd(1.6, 3.4), side: (i - 1) * 1.4 })), [plan])
  const hm = useRef(mover(plan.path[plan.path.length - 1][0], plan.path[plan.path.length - 1][1]))
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const t = clock.elapsedTime
    const day = useClock.getState().day
    const min = exactMinute()
    const leave = 300 + dayRand(day, 1) * 90
    const back = 1000 + dayRand(day, 2) * 30
    const storm = weatherRt.rain > 0.75
    let phase: 'pen' | 'go' | 'graze' | 'back' = 'pen'
    let p = 0
    if (min >= leave && min < leave + TRAVEL) ((phase = 'go'), (p = (min - leave) / TRAVEL))
    else if (min >= leave + TRAVEL && min < back) phase = 'graze'
    else if (min >= back && min < back + TRAVEL) ((phase = 'back'), (p = 1 - (min - back) / TRAVEL))
    // ฝนหนัก: คนเลี้ยงพาควายรีบกลับคอก
    if (storm && phase === 'graze') phase = 'pen'
    if (import.meta.env.DEV) (window as unknown as { __herd: unknown }).__herd = { phase, leave, back, herder: [hm.current.x, hm.current.z], bufs: bufs.map((b) => [b.m.x, b.m.z]) }
    // ---- คนเลี้ยง ----
    const H = hm.current
    const hg = herder.current
    if (hg) {
      hg.visible = phase !== 'pen'
      if (phase === 'go' || phase === 'back') {
        const [x, z] = along(plan.path, p)
        const [nx, nz] = along(plan.path, phase === 'go' ? p + 0.01 : p - 0.01)
        H.x = x
        H.z = z
        H.h = Math.atan2(nx - x, nz - z)
        hMotion.current = 1
      } else if (phase === 'graze') {
        // ยืนคุมฝูง เดินเปลี่ยนที่ช้า ๆ เป็นพัก ๆ หันมองควาย
        H.speed = 0.6
        if (step(H, dt, t)) {
          hMotion.current = 0
          H.wait -= dt
          lookAt(H, bufs[Math.floor(t / 7) % 3].m.x, bufs[Math.floor(t / 7) % 3].m.z, dt)
          if (H.wait <= 0) {
            H.tx = plan.pasture.cx + rnd(-plan.pasture.hw, plan.pasture.hw) * 0.6
            H.tz = plan.pasture.cz + plan.pasture.hd + 0.5
            H.wait = rnd(15, 40)
          }
        } else hMotion.current = 1
      }
      hg.position.set(H.x, 0, H.z)
      hg.rotation.y = H.h
    }
    // ---- ควาย ----
    bufs.forEach((b, i) => {
      const m = b.m
      if (phase === 'go' || phase === 'back') {
        // เดินตามคนเลี้ยงแบบหลวม ๆ ไม่เรียงแถว
        const behind = along(plan.path, phase === 'go' ? p - b.lag / 60 : p + b.lag / 60)
        m.tx = behind[0] + Math.sin(t * 0.3 + i) * 0.8 + b.side * 0.4
        m.tz = behind[1] + Math.cos(t * 0.25 + i * 2) * 0.8
        m.speed = 1.4
        const done = step(m, dt, t)
        b.motion.current = done ? 0 : 1
        b.pose.current = 0
        m.act = 'walk'
      } else if (phase === 'graze') {
        if (Math.hypot(m.x - plan.pasture.cx, m.z - plan.pasture.cz) > 20) ((m.x = plan.pasture.cx + (i - 1) * 2), (m.z = plan.pasture.cz), (m.act = 'idle'))
        wander(m, b, dt, t, plan.pasture.cx, plan.pasture.cz, plan.pasture.hw, plan.pasture.hd, 0.5, true)
      } else {
        // ในคอก: ยืนเคี้ยวเอื้อง เดินไปมานิดหน่อย กลางคืนนอน
        const nightRest = min < 300 || min > 1110
        if (Math.hypot(m.x - plan.pen[0], m.z - plan.pen[1]) > 20) ((m.x = plan.pen[0] + (i - 1) * 1.6), (m.z = plan.pen[1]), (m.act = 'idle'))
        wander(m, b, dt, t, plan.pen[0], plan.pen[1], 2.2, 1.6, 0.35, nightRest)
      }
      const g = b.ref.current
      if (g) {
        g.position.set(m.x, 0, m.z)
        g.rotation.y = m.h
      }
    })
  })
  return (
    <group>
      <Pasture cx={plan.pasture.cx} cz={plan.pasture.cz} w={plan.pasture.hw * 2 + 2} d={plan.pasture.hd * 2 + 2} />
      <group ref={herder}>
        <Character appearance={HERDER} motion={hMotion} tool="pole" />
      </group>
      {bufs.map((b, i) => (
        <group key={i} ref={(el) => void (b.ref.current = el)}>
          <Pet pet={BUFFALO} motion={b.motion} pose={b.pose} />
        </group>
      ))}
    </group>
  )
}

/** เดินเล่นในกรอบ: เดิน → หยุดเล็ม/ดม → บางทีนอนพัก (restful = นอนบ่อยขึ้น) */
function wander(m: Mover, b: { motion: { current: number }; pose: { current: number } }, dt: number, t: number, cx: number, cz: number, hw: number, hd: number, speed: number, restful = false) {
  // ไม่ให้หลุดกรอบมากเกินไป (เช่นตอนเพิ่งกลับคอก)
  const out = Math.abs(m.x - cx) > hw + 1 || Math.abs(m.z - cz) > hd + 1
  if (out && m.act !== 'walk') {
    m.act = 'walk'
    m.tx = cx + rnd(-hw, hw) * 0.7
    m.tz = cz + rnd(-hd, hd) * 0.7
  }
  if (m.act === 'walk') {
    m.speed = out ? 1.4 : speed * rnd(0.85, 1.15)
    b.pose.current = 0
    if (step(m, dt, t)) {
      m.act = restful && Math.random() < 0.35 ? 'rest' : 'idle'
      m.wait = m.act === 'rest' ? rnd(15, 40) : rnd(2, 9)
    }
    b.motion.current = 1
    return
  }
  b.motion.current = 0
  b.pose.current = m.act === 'rest' ? 2 : 0
  // ยืนเฉย ๆ: ส่ายหัวหันมองช้า ๆ
  if (m.act === 'idle') m.h += Math.sin(t * 0.6 + m.x) * dt * 0.3
  m.wait -= dt
  if (m.wait <= 0) {
    m.act = 'walk'
    m.tx = cx + rnd(-hw, hw)
    m.tz = cz + rnd(-hd, hd)
  }
}

/* ═════════════ หมาประจำบ้าน ═════════════ */
interface DogSpec {
  home: string
  pet: PetChoice
  owner?: boolean
}
const DOGS: DogSpec[] = [
  { home: 'home-tarang', owner: true, pet: { species: 'dog', name: 'เจ้าแดง', color: '#b8743a', pattern: 'plain', patternColor: '#f0e0c8', breed: 'หมาไทยบ้าน' } as PetChoice },
  { home: 'house-kaew', pet: { species: 'dog', name: 'ด่างน้อย', color: '#f0e8d8', pattern: 'patches', patternColor: '#3a2e26' } as PetChoice },
  { home: 'house-namfon', pet: { species: 'dog', name: 'ดำ', color: '#2a2622', pattern: 'blacktan', patternColor: '#a8642a' } as PetChoice },
  { home: 'house-firewood', pet: { species: 'dog', name: 'โม่ง', color: '#c89a5a', pattern: 'plain', patternColor: '#e8d0a8' } as PetChoice },
  { home: 'house-rot', pet: { species: 'dog', name: 'ประยุทธ', sex: 'm', breed: 'หมาพันธุ์ทาง', color: '#d8b48a', pattern: 'patches', patternColor: '#5a4030' } as PetChoice },
  { home: 'house-daeng', pet: { species: 'dog', name: 'ขาว', color: '#ece6da', pattern: 'plain', patternColor: '#d8cbb3' } as PetChoice },
]

function HouseDogs() {
  return (
    <group>
      {DOGS.map((d) => (
        <HouseDog key={d.home} spec={d} />
      ))}
    </group>
  )
}

function HouseDog({ spec }: { spec: DogSpec }) {
  const place = PLACES.find((p) => p.id === spec.home)
  const g = useRef<Group>(null)
  const motion = useRef(0)
  const pose = useRef(0)
  // ลานบ้าน: หน้าบ้าน (บ้านตา = ลานกลางบ้าน)
  const yard = useMemo(() => {
    if (!place) return { cx: 0, cz: 0, r: 0, fx: 0, fz: 0 }
    if (spec.owner) return { cx: place.pos[0] - 2, cz: place.pos[1] - 4, r: 7, fx: place.pos[0] - 6.5, fz: place.pos[1] - 12 }
    const r = place.rotation ?? 0
    const off = place.size[1] / 2 + 3
    return { cx: place.pos[0] + Math.sin(r) * off, cz: place.pos[1] + Math.cos(r) * off, r: 3.5, fx: place.pos[0] + Math.sin(r) * (off + 3.5), fz: place.pos[1] + Math.cos(r) * (off + 3.5) }
  }, [place, spec.owner])
  const m = useRef(mover(yard.cx, yard.cz))
  const tag = useRef<Group>(null)
  const st = useRef({ bark: 0, barks: 0, calm: 0, greet: 0, sniff: 0 })
  useFrame(({ clock }, rawDt) => {
    if (!place || !g.current) return
    const dt = Math.min(rawDt, 0.1)
    const t = clock.elapsedTime
    const M = m.current
    const S = st.current
    const min = exactMinute()
    const pd = Math.hypot(playerPose.x - M.x, playerPose.z - M.z)
    const hot = min > 690 && min < 900
    const night = min < 330 || min > 1200
    // หมาบ้านเรา: เห็นเจ้าของเดินเข้ามา วิ่งมาหาแล้วเดินตามสักพัก
    if (spec.owner && pd < 14 && pd > 2.2 && S.greet <= 0 && S.calm <= 0 && !useGame.getState().paused) S.greet = rnd(6, 10)
    if (S.greet > 0) {
      S.greet -= dt
      if (S.greet <= 0) S.calm = rnd(25, 50)
      M.tx = playerPose.x + 1.2
      M.tz = playerPose.z + 1.2
      M.speed = pd > 5 ? 4.5 : 1.8
      pose.current = 0
      motion.current = step(M, dt, t) ? 0 : pd > 5 ? 2 : 1
      if (S.greet > 0 && Math.random() < dt * 0.15) callSound('bark', M.x, M.z, 0.25)
    } else if (!spec.owner && pd < 7 && S.calm <= 0) {
      // คนแปลกหน้าเข้ามาใกล้: ลุกขึ้นหันไปเห่า (ไม่ไล่กัด)
      motion.current = 0
      pose.current = 0
      lookAt(M, playerPose.x, playerPose.z, dt)
      S.bark -= dt
      if (S.bark <= 0) {
        S.bark = rnd(0.9, 1.6)
        S.barks++
        callSound('bark', M.x, M.z, 0.55)
        if (S.barks >= 3 + Math.floor(Math.random() * 3)) {
          S.barks = 0
          S.calm = rnd(20, 40)
        }
      }
    } else {
      S.calm -= dt
      const rainy = weatherRt.rain > 0.5
      // เดินเล่น: บางครั้งเดินออกไปหน้าบ้าน (ริมถนน) แล้วกลับเข้ามาเอง · ร้อน/กลางคืน/ฝนตก = นอนบ่อย
      if (M.act === 'walk') {
        M.speed = rnd(0.9, 1.4)
        pose.current = 0
        motion.current = 1
        if (step(M, dt, t)) {
          const r = Math.random()
          M.act = hot || night || rainy ? (r < 0.6 ? 'rest' : 'idle') : r < 0.2 ? 'rest' : 'idle'
          M.wait = M.act === 'rest' ? rnd(15, 45) : rnd(1.5, 5)
          S.sniff = Math.random() < 0.6 ? M.wait : 0
        }
      } else {
        motion.current = 0
        pose.current = M.act === 'rest' ? 2 : S.sniff > 0 ? 0 : Math.random() < 0.002 ? 1 : pose.current
        // ดมพื้น: หันหัวไปมาเร็ว ๆ
        if (S.sniff > 0) {
          S.sniff -= dt
          M.h += Math.sin(t * 6) * dt * 0.8
        }
        M.wait -= dt
        if (M.wait <= 0) {
          M.act = 'walk'
          if (!rainy && Math.random() < 0.15) {
            M.tx = yard.fx + rnd(-1, 1)
            M.tz = yard.fz + rnd(-1, 1)
          } else {
            const a = rnd(0, Math.PI * 2)
            const rr = rnd(0.5, yard.r)
            M.tx = yard.cx + Math.cos(a) * rr
            M.tz = yard.cz + Math.sin(a) * rr
          }
        }
      }
    }
    g.current.position.set(M.x, 0, M.z)
    g.current.rotation.y = M.h
    // ป้ายชื่อหมา (มีสัญลักษณ์เพศ) ขึ้นเมื่อผู้เล่นเดินเข้ามาใกล้
    if (tag.current) tag.current.visible = pd < 7
  })
  if (!place) return null
  return (
    <group ref={g}>
      <Pet pet={spec.pet} motion={motion} pose={pose} />
      {spec.pet.sex && (
        <group ref={tag} position={[0, 1.15, 0]} visible={false}>
          <TextSprite text={spec.pet.name + (spec.pet.sex === 'm' ? ' ♂' : ' ♀')} color={spec.pet.sex === 'm' ? '#2f5fa8' : '#c8487a'} height={0.26} position={[0, 0, 0]} />
        </group>
      )}
    </group>
  )
}

/* ═════════════ ครอบครัวไก่ ═════════════ */
const ROOSTER: PetChoice = { species: 'chicken', name: 'พ่อไก่', color: '#a83a1e', pattern: 'plain', patternColor: '#1e3a2a', size: 'large' } as PetChoice
const HEN: PetChoice = { species: 'chicken', name: 'แม่ไก่', color: '#c8935a', pattern: 'plain', patternColor: '#8a5a32' } as PetChoice
const CHICK: PetChoice = { species: 'chicken', name: 'ลูกไก่', color: '#f2d65a', pattern: 'plain', patternColor: '#e8c040', size: 'small' } as PetChoice

function ChickenFamilies() {
  const home = PLACES.find((p) => p.id === 'home-tarang')
  const noi = PLACES.find((p) => p.id === 'house-noi')
  const fams: { coop: Vec2; r: number }[] = []
  if (home) fams.push({ coop: [home.pos[0] + 8, home.pos[1] + 10.5], r: 6 })
  if (noi) fams.push({ coop: [noi.pos[0] + 5.5, noi.pos[1] + 1], r: 4 })
  return (
    <group>
      {fams.map((f, i) => (
        <ChickenFamily key={i} coop={f.coop} r={f.r} hens={i === 0 ? 2 : 1} chicks={i === 0 ? 4 : 3} />
      ))}
    </group>
  )
}

interface Bird {
  m: Mover
  role: 'rooster' | 'hen' | 'chick'
  mom: number
  motion: { current: number }
  pose: { current: number }
  ref: { current: Group | null }
  peck: number
  scale: number
}

function ChickenFamily({ coop, r, hens, chicks }: { coop: Vec2; r: number; hens: number; chicks: number }) {
  const birds = useMemo<Bird[]>(() => {
    const mk = (role: Bird['role'], mom = -1): Bird => ({ m: mover(coop[0] + rnd(-r, r) * 0.5, coop[1] + rnd(-r, r) * 0.5), role, mom, motion: { current: 0 }, pose: { current: 0 }, ref: { current: null }, peck: 0, scale: role === 'chick' ? 0.45 : role === 'rooster' ? 1.15 : 1 })
    const list: Bird[] = [mk('rooster')]
    for (let i = 0; i < hens; i++) list.push(mk('hen'))
    for (let i = 0; i < chicks; i++) list.push(mk('chick', 1 + (i % hens)))
    return list
  }, [coop, r, hens, chicks])
  const crow = useRef(rnd(5, 30))
  const henCall = useRef(rnd(6, 20))
  const peeps = useRef(rnd(3, 10))
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const t = clock.elapsedTime
    const min = exactMinute()
    const roost = min < 330 || min > 1110 || weatherRt.rain > 0.6
    const dawn = min > 290 && min < 420
    // พ่อไก่ขัน: ตอนเช้ามืด–เช้าบ่อย · กลางวันนาน ๆ ที
    crow.current -= dt
    if (crow.current <= 0) {
      crow.current = dawn ? rnd(12, 30) : rnd(90, 200)
      if (!roost || dawn) callSound('crow', birds[0].m.x, birds[0].m.z, 0.4)
    }
    // ลูกเจี๊ยบร้องเจี๊ยบ ๆ เบา ๆ เป็นระยะ (กลางวัน)
    peeps.current -= dt
    if (peeps.current <= 0) {
      peeps.current = rnd(8, 20)
      const chick = birds.find((b) => b.role === 'chick')
      if (chick && !roost) callSound('chickPeep', chick.m.x, chick.m.z, 0.22)
    }
    // แม่ไก่ร้องเรียกลูก (กลางวัน) แล้วลูกเจี๊ยบร้องตอบ
    henCall.current -= dt
    if (henCall.current <= 0) {
      henCall.current = rnd(18, 45)
      const hen = birds.find((b) => b.role === 'hen')
      if (hen && !roost) {
        const d = callSound('henCall', hen.m.x, hen.m.z, 0.45)
        const chick = birds.find((b) => b.role === 'chick')
        if (chick) setTimeout(() => callSound('chickPeep', chick.m.x, chick.m.z, 0.3), ((d || 1.2) * 0.6) * 1000)
      }
    }
    birds.forEach((b) => {
      const m = b.m
      if (roost) {
        // ค่ำแล้ว/ฝนตก: เข้าเล้า นั่งรวมกัน
        m.tx = coop[0] + Math.sin(b.scale * 9 + b.mom) * 0.8
        m.tz = coop[1] + Math.cos(b.scale * 7 + b.mom) * 0.6
        m.speed = 1.2
        const done = step(m, dt, t)
        b.motion.current = done ? 0 : 1
        b.pose.current = done ? 1 : 0
      } else if (b.role === 'chick') {
        // ลูกไก่: วนตามแม่ ห่างเกิน = วิ่งกลับ · ใกล้แม่ = จิกตาม
        const mom = birds[b.mom].m
        const d = Math.hypot(mom.x - m.x, mom.z - m.z)
        if (d > 1.1 || m.act === 'walk') {
          m.tx = mom.x + Math.sin(t * 0.7 + b.scale * 13) * 0.6
          m.tz = mom.z + Math.cos(t * 0.6 + b.scale * 11) * 0.6
          m.speed = d > 2 ? 2.4 : 0.8
          m.act = step(m, dt, t) ? 'idle' : 'walk'
          b.motion.current = m.act === 'walk' ? (d > 2 ? 2 : 1) : 0
        } else b.motion.current = 0
        b.peck = birds[b.mom].peck
        b.pose.current = 0
      } else {
        // พ่อไก่เดินตรวจพื้นที่กว้าง · แม่ไก่คุ้ยเขี่ยจิกหาอาหาร (แยกกันนิดหน่อยแล้วกลับมารวม)
        const rr = b.role === 'rooster' ? r : r * 0.7
        if (m.act === 'walk') {
          m.speed = rnd(0.5, 0.9)
          b.motion.current = 1
          b.peck = 0
          if (step(m, dt, t)) {
            m.act = 'idle'
            m.wait = rnd(2, 7)
            b.peck = Math.random() < 0.8 ? m.wait : 0
          }
        } else {
          b.motion.current = 0
          m.wait -= dt
          if (b.peck > 0) b.peck -= dt
          if (m.wait <= 0) {
            m.act = 'walk'
            m.tx = coop[0] + rnd(-rr, rr)
            m.tz = coop[1] + rnd(-rr, rr)
          }
        }
        b.pose.current = 0
      }
      const g = b.ref.current
      if (g) {
        // จิก/คุ้ยเขี่ย: ก้มตัวขึ้นลงถี่ ๆ
        const pk = b.peck > 0 && b.motion.current === 0 ? Math.max(0, Math.sin(t * 9 + b.scale * 5)) * 0.35 : 0
        g.position.set(m.x, 0, m.z)
        g.rotation.set(pk, m.h, 0)
      }
    })
  })
  return (
    <group>
      {birds.map((b, i) => (
        <group key={i} ref={(el) => void (b.ref.current = el)} scale={b.scale}>
          <Pet pet={b.role === 'rooster' ? ROOSTER : b.role === 'hen' ? HEN : CHICK} motion={b.motion} pose={b.pose} />
        </group>
      ))}
    </group>
  )
}

/** ทุ่งหญ้าเลี้ยงควาย: หญ้าเขียวเป็นกอ ๆ */
function Pasture({ cx, cz, w, d }: { cx: number; cz: number; w: number; d: number }) {
  const tufts = useMemo(() => {
    let k = 99
    const r = () => ((k = (k * 9301 + 49297) % 233280) / 233280)
    return Array.from({ length: 60 }, () => [cx + (r() - 0.5) * w, cz + (r() - 0.5) * d, 0.3 + r() * 0.4] as const)
  }, [cx, cz, w, d])
  return (
    <group>
      <mesh position={[cx, 0.022, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#8fb552" />
      </mesh>
      {tufts.map(([x, z, h], i) => (
        <mesh key={i} position={[x, h / 2, z]}>
          <coneGeometry args={[0.12, h, 4]} />
          <meshStandardMaterial color={i % 3 ? '#6f9a3a' : '#86b04a'} flatShading />
        </mesh>
      ))}
    </group>
  )
}
