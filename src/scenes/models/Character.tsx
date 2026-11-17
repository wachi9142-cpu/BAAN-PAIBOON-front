import { GEMS, type GemColor } from '../../game/wand'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import {
  accessoryColorValue,
  AGE_RULES,
  defaultFaceShape,
  EYE_BROWS,
  CANE_WALK,
  SHAWLS,
  type CaneId,
  type KidItemId,
  bagColorValue,
  byId,
  clothColor,
  eyeColorValue,
  hairColorValue,
  lipColorValue,
  OUTFITS,
  shoeColorValue,
  SKIN_TONES,
  type Appearance,
  type PoseId,
} from '../../game/content/appearance'
import { Shoe } from './Shoe'
import { BodyBag, HandBag } from './Bag'
import { Hair } from './Hair'
import { Eye } from './Eye'
import { Mouth } from './Mouth'
import { SARONG_OUTFITS, sarongAccent, sarongTexture } from '../../game/content/sarong'
import { Accessory } from './Accessory'
import { RBox } from './RBox'

interface Props {
  appearance: Appearance
  /** 0 = ยืน, 1 = เดิน, 2 = วิ่ง */
  motion?: React.RefObject<number>
  /** งานที่ทำอยู่ตอนยืน (ชาวบ้าน): กวาด / ถางหญ้า / คุย */
  action?: CharacterAction
  /** ของในมือขวา */
  tool?: ToolId
  /** ถอดรองเท้า (ในโบสถ์) */
  barefoot?: boolean
  /** จังหวะเหวี่ยงขวาน/ทุบ 0→1 (-1 = ไม่ได้ทำ) */
  chop?: { current: number }
  /** สีอัญมณีบนคฑา */
  wandGem?: GemColor
  /** กำลังชี้คฑายิงลำแสง */
  aim?: { aiming: boolean }
}

export type CharacterAction = 'sweep' | 'hoe' | 'talk'
export type ToolId = 'broom' | 'hoe' | 'pole' | 'axe' | 'axe2' | 'wand' | 'siamsi'

/** ท่าแขนตอนยืน: [ซ้าย x, ซ้าย z, ขวา x, ขวา z] (เรเดียน) — แขนห้อยลงที่ 0,0 */
const POSE_ARMS: Record<PoseId, [number, number, number, number]> = {
  stand: [0, 0.05, 0, -0.05],
  wave: [0, 0.05, 0, 2.7],
  wai: [-1.25, -0.5, -1.25, 0.5],
  shy: [-0.45, -0.35, -0.45, 0.35],
  behind: [0.45, -0.25, 0.45, 0.25],
  cheer: [0, -2.7, 0, 2.7],
  // ท่าในวัด (ใช้ชั่วคราว ไม่อยู่ในตัวเลือกท่าตอนสร้างตัวละคร)
  prostrate: [-1.25, -0.5, -1.25, 0.5],
  shake: [-0.95, -0.35, -0.95, 0.35],
  offer: [-1.5, -0.25, -1.5, 0.25],
  // ขี่: มือจับหลังสัตว์ข้างหน้า
  ride: [-0.7, -0.1, -0.7, 0.1],
  // ผิวปาก: มือขวายกขึ้นป้องปาก มือซ้ายห้อยสบาย ๆ
  whistle: [0, 0.05, -2.3, 1.05],
  // เครื่องเล่น: นั่ง (มือจับข้างหน้า) · ห้อยโหน (แขนชูขึ้น) · ทรงตัว (กางแขน)
  sit: [-0.7, 0.12, -0.7, -0.12],
  hang: [-3.05, 0.12, -3.05, -0.12],
  balance: [0, -1.35, 0, 1.35],
  // ในน้ำ: ว่ายท่ากบ · ตะเกียกตะกายตอนหมดแรง · นั่งพายเรือ (แอนิเมชันอยู่ใน useFrame)
  swim: [-2.8, -0.3, -2.8, 0.3],
  struggle: [-2.6, -0.4, -2.6, 0.4],
  paddle: [-1, -0.2, -1, 0.2],
}

/** กราบสามครั้ง: ช่วงคุกเข่าพนมมือ แล้วกราบลง-ขึ้น 3 รอบ (วินาที) */
export const PROSTRATE = { settle: 1.0, each: 2.0, times: 3 }
/** คืนค่า 0..1 ว่าก้มลงไปแค่ไหน ณ เวลา t (0 = ตั้งตรงพนมมือ, 1 = หน้าผากแตะพื้น) */
function bowAmount(t: number) {
  const x = t - PROSTRATE.settle
  if (x < 0 || x > PROSTRATE.each * PROSTRATE.times) return 0
  const p = (x % PROSTRATE.each) / PROSTRATE.each
  // ลง 40% · ค้าง 20% · ขึ้น 40%
  if (p < 0.4) return Math.sin((p / 0.4) * Math.PI / 2)
  if (p < 0.6) return 1
  return Math.cos(((p - 0.6) / 0.4) * Math.PI / 2)
}

/** เอี๊ยม/เสื้อกั๊ก/แจ็กเก็ตเปิดหน้า */
const OPEN_FRONT = ['varsity', 'cardigan', 'jacket']

/** ตัวละครแบบ low-poly ประกอบจากรูปทรงพื้นฐาน สูงประมาณ 1.7 ม. */
export function Character({ appearance, motion, action, tool, barefoot, chop, wandGem, aim }: Props) {
  const skin = byId(SKIN_TONES, appearance.skin).color
  const hair = hairColorValue(appearance.hairColor)
  const outfit = byId(OUTFITS, appearance.outfit)
  const top = clothColor(appearance.topColor, outfit.top)
  const bottom = clothColor(appearance.bottomColor, outfit.bottom)
  // ผ้าถุง/ผ้าซิ่น: ลายผ้าไหม (ค่าเริ่มต้น = ลายลูกแก้ว ผ้าขึ้นชื่อของบ้านไพบูลย์)
  const sarongTex = SARONG_OUTFITS.includes(outfit.id)
    ? sarongTexture(appearance.sarongPattern ?? 'lukkaew', bottom, sarongAccent(appearance.sarongAccent))
    : null
  const bib = outfit.bib ? (outfit.bib === outfit.bottom ? bottom : outfit.bib) : null
  const female = appearance.gender === 'female'
  const shoes = appearance.shoes ?? 'sandals'
  const shoeColor = shoeColorValue(appearance.shoeColor)
  const bag = appearance.bag ?? 'none'
  const bagColor = bagColorValue(appearance.bagColor)
  const eye = eyeColorValue(appearance.eyeColor)
  const accessory = appearance.accessory ?? 'none'
  const accColor = accessoryColorValue(appearance.accessoryColor)
  const pose = appearance.pose ?? 'stand'
  const age = AGE_RULES[appearance.age ?? 'adult']
  // ไม้เท้าใช้ได้เฉพาะผู้สูงอายุ
  const cane = appearance.age === 'elder' ? (appearance.cane ?? 'none') : 'none'
  const elder = appearance.age === 'elder'
  const child = appearance.age === 'child'
  // ผ้าคลุมไหล่ แว่น หมวกปีกกว้าง ตะกร้า = ของผู้สูงอายุ · ขวดนม ของเล่น เป้เล็ก โบว์/หมวกเด็ก = ของเด็ก
  const shawl = SHAWLS.find((s) => s.id === (elder ? (appearance.shawl ?? 'none') : 'none'))!
  const kidHead = child ? (appearance.kidHead ?? 'none') : 'none'
  const ageHat = (elder && appearance.elderHat) || kidHead === 'hat'
  // ถ้าใส่หมวกตามวัยแล้ว ไม่ซ้อนหมวกจากเครื่องประดับทั่วไป
  const HATS = ['cap', 'beanie', 'beret', 'strawhat', 'widehat']
  const shownAccessory = ageHat && HATS.includes(accessory) ? 'none' : accessory
  // ของถือของเด็กใช้ได้เฉพาะวัยเด็ก
  const kidItem = appearance.age === 'child' ? (appearance.kidItem ?? 'none') : 'none'

  const legL = useRef<Group>(null)
  const legR = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const body = useRef<Group>(null)
  const kidHand = useRef<Group>(null)
  const kidChest = useRef<Group>(null)
  const phase = useRef(0)
  const idle = useRef(0)
  const upper = useRef<Group>(null)
  const poseStart = useRef({ pose: pose as PoseId, t: 0 })

  useFrame((_, dt) => {
    const m = motion?.current ?? 0
    phase.current += dt * (m === 2 ? 13 : 8) * (m > 0 ? 1 : 0) * (m === 2 ? age.runSpeed : age.walkSpeed) * (cane !== 'none' ? CANE_WALK : 1)
    idle.current += dt
    const swing = m > 0 ? Math.sin(phase.current) * (m === 2 ? 0.8 : 0.5) : 0
    const k = Math.min(1, dt * 10)
    const lerp = (cur: number, to: number) => cur + (to - cur) * k
    if (legL.current) legL.current.rotation.x = lerp(legL.current.rotation.x, swing)
    if (legR.current) legR.current.rotation.x = lerp(legR.current.rotation.x, -swing)

    // แขน: เดิน = แกว่ง, ยืน = ตามท่าที่เลือก
    let [lx, lz, rx, rz] = m > 0 ? [-swing * 0.8, 0.05, swing * 0.8, -0.05] : POSE_ARMS[pose]
    if (m === 0 && pose === 'wave') rz += Math.sin(idle.current * 7) * 0.25
    // ผิวปาก: มือขยับเบา ๆ ตามจังหวะเสียง
    if (m === 0 && pose === 'whistle') rx += Math.sin(idle.current * 9) * 0.05
    // งานของชาวบ้าน (ยืนทำอยู่กับที่)
    if (m === 0 && action === 'sweep') {
      // กวาด: แขนสองข้างยื่นไปข้างหน้า แกว่งซ้าย-ขวาพร้อมกัน
      const sw = Math.sin(idle.current * 3.2) * 0.35
      ;[lx, lz, rx, rz] = [-0.6, -0.2 + sw, -0.55, 0.2 + sw]
    } else if (m === 0 && action === 'hoe') {
      // ถางหญ้า: ยกขึ้นช้า ๆ แล้วสับลงเร็ว
      const p = (idle.current * 0.9) % 1
      const up = p < 0.75 ? p / 0.75 : 1 - (p - 0.75) / 0.25
      const x = -0.5 - up * 1.6
      ;[lx, lz, rx, rz] = [x, -0.25, x, 0.25]
    } else if (m === 0 && action === 'talk') {
      // คุย: ยกมือประกอบเป็นพัก ๆ
      const g = Math.max(0, Math.sin(idle.current * 1.3)) * 0.5
      ;[lx, lz, rx, rz] = [0, 0.05, -0.2 - g, -0.1 - g * 0.3]
    }
    // ของเด็ก: ยืนอยู่ = กอด/ประคองด้วยสองมือที่อก · เดิน = ถือมือเดียว
    const hugging = kidItem !== 'none' && m === 0 && !action
    if (hugging) [lx, lz, rx, rz] = kidItem === 'teddy' ? [-1.1, 0.55, -1.1, -0.55] : [-0.95, 0.45, -0.95, -0.45]
    if (kidHand.current) kidHand.current.visible = !hugging
    if (kidChest.current) kidChest.current.visible = hugging
    if (cane !== 'none' && !action) {
      // มือซ้ายจับไม้เท้า: ยื่นไปข้างหน้าเล็กน้อย เดินแล้วจิ้มไม้เท้าไปพร้อมก้าว
      lx = -0.28 + (m > 0 ? Math.sin(phase.current) * 0.18 : 0)
      lz = 0.12
    }
    if (m === 0 && pose === 'cheer') {
      const b = Math.sin(idle.current * 5) * 0.12
      lz -= b
      rz += b
    }
    // ฟันขวาน (สองมือ) / ทุบด้วยมือ (มือขวา): ยกขึ้นเหนือหัวช้า ๆ แล้วฟาดลงเร็ว
    const cp = chop?.current ?? -1
    const axeHeld = tool === 'axe' || tool === 'axe2'
    if (axeHeld && m === 0 && cp < 0) [lx, lz, rx, rz] = [-0.55, 0.35, -0.55, -0.35]
    // ถือคฑา: ยืน = ถือคฑาเอียงขึ้นข้างตัว · ยิงลำแสง = เหยียดแขนชี้ไปข้างหน้า (คฑาสั่นเบา ๆ ตามพลัง)
    if (tool === 'wand' && cp < 0) {
      if (aim?.aiming) {
        rx = -1.5 + Math.sin(idle.current * 30) * 0.03
        rz = -0.05
        if (m === 0) [lx, lz] = [-0.6, -0.15]
      } else if (m === 0) {
        rx = -0.75
        rz = -0.1
      }
    }
    if (cp >= 0) {
      const up = cp < 0.45 ? cp / 0.45 : cp < 0.58 ? 1 - (cp - 0.45) / 0.13 : 0
      const x = -0.45 - up * 2.4
      if (axeHeld) [lx, lz, rx, rz] = [x, 0.3, x, -0.3]
      else [rx, rz] = [x + 0.1, -0.15]
      if (armL.current && axeHeld) {
        armL.current.rotation.x = x
        armL.current.rotation.z = 0.3
      }
      if (armR.current) {
        armR.current.rotation.x = axeHeld ? x : x + 0.1
        armR.current.rotation.z = axeHeld ? -0.3 : -0.15
      }
    }
    if (armL.current) {
      armL.current.rotation.x = lerp(armL.current.rotation.x, lx)
      armL.current.rotation.z = lerp(armL.current.rotation.z, lz)
    }
    if (armR.current) {
      armR.current.rotation.x = lerp(armR.current.rotation.x, rx)
      armR.current.rotation.z = lerp(armR.current.rotation.z, rz)
    }
    // ---------- ท่าในวัด ----------
    if (poseStart.current.pose !== pose) poseStart.current = { pose, t: idle.current }
    const pt = idle.current - poseStart.current.t
    const kneel = m === 0 && (pose === 'prostrate' || pose === 'shake')
    let bow = 0
    if (kneel && pose === 'shake') {
      if (legL.current) legL.current.rotation.x = lerp(legL.current.rotation.x, 1.45)
      if (legR.current) legR.current.rotation.x = lerp(legR.current.rotation.x, 1.45)
    } else if (kneel) {
      // คุกเข่า: ขาพับไปด้านหลังราบกับพื้น ตัวลดต่ำลง
      if (legL.current) legL.current.rotation.x = lerp(legL.current.rotation.x, 1.45)
      if (legR.current) legR.current.rotation.x = lerp(legR.current.rotation.x, 1.45)
      bow = bowAmount(pt)
      // ก้มลง: มือพนมเลื่อนลงไปแตะพื้นข้างหน้า
      ;[lx, lz, rx, rz] = [-1.25 - bow * 0.55, -0.5 + bow * 0.25, -1.25 - bow * 0.55, 0.5 - bow * 0.25]
      if (armL.current) {
        armL.current.rotation.x = lx
        armL.current.rotation.z = lz
      }
      if (armR.current) {
        armR.current.rotation.x = rx
        armR.current.rotation.z = rz
      }
    }
    if (pose === 'sit') {
      // นั่ง: ขาเหยียดไปข้างหน้า (ชิงช้า สไลเดอร์ กระดานหก ม้าหมุน)
      if (legL.current) {
        legL.current.rotation.x = lerp(legL.current.rotation.x, -1.45)
        legL.current.rotation.z = lerp(legL.current.rotation.z, 0)
      }
      if (legR.current) {
        legR.current.rotation.x = lerp(legR.current.rotation.x, -1.45)
        legR.current.rotation.z = lerp(legR.current.rotation.z, 0)
      }
    } else if (pose === 'hang') {
      // ห้อยโหน: ขาแกว่งเบา ๆ
      const sw = Math.sin(idle.current * 5) * 0.3
      if (legL.current) legL.current.rotation.x = lerp(legL.current.rotation.x, sw)
      if (legR.current) legR.current.rotation.x = lerp(legR.current.rotation.x, -sw)
    }
    if (pose === 'ride') {
      // นั่งคร่อมหลังสัตว์: ขากางออกสองข้าง งอไปข้างหน้าเล็กน้อย (ไม่แกว่งตามก้าว)
      if (legL.current) {
        legL.current.rotation.x = lerp(legL.current.rotation.x, -0.35)
        legL.current.rotation.z = lerp(legL.current.rotation.z, -0.5)
      }
      if (legR.current) {
        legR.current.rotation.x = lerp(legR.current.rotation.x, -0.35)
        legR.current.rotation.z = lerp(legR.current.rotation.z, 0.5)
      }
      if (armL.current) armL.current.rotation.x = lerp(armL.current.rotation.x, -0.7)
      if (armR.current) armR.current.rotation.x = lerp(armR.current.rotation.x, -0.7)
    } else {
      if (legL.current) legL.current.rotation.z = lerp(legL.current.rotation.z, 0)
      if (legR.current) legR.current.rotation.z = lerp(legR.current.rotation.z, 0)
    }
    if (pose === 'swim') {
      // ว่ายท่ากบ: แขนเหยียดไปข้างหน้าแล้วกวาดออกข้าง · ขาตีน้ำสลับ (ตัวเอียงไปข้างหน้าจาก Player)
      const st = (idle.current * (m > 0 ? 1.6 : 0.7)) % 1
      const sweep = st < 0.5 ? st / 0.5 : 1 - (st - 0.5) / 0.5
      if (armL.current) {
        armL.current.rotation.x = -2.9 + sweep * 1.3
        armL.current.rotation.z = -0.15 - sweep * 0.9
      }
      if (armR.current) {
        armR.current.rotation.x = -2.9 + sweep * 1.3
        armR.current.rotation.z = 0.15 + sweep * 0.9
      }
      const kick = Math.sin(idle.current * (m > 0 ? 10 : 4)) * 0.35
      if (legL.current) legL.current.rotation.x = kick
      if (legR.current) legR.current.rotation.x = -kick
    } else if (pose === 'struggle') {
      // หมดแรง ตะเกียกตะกาย: แขนตีน้ำสลับเร็ว ๆ
      const f = idle.current * 11
      if (armL.current) {
        armL.current.rotation.x = -2.3 + Math.sin(f) * 0.7
        armL.current.rotation.z = -0.5
      }
      if (armR.current) {
        armR.current.rotation.x = -2.3 - Math.sin(f) * 0.7
        armR.current.rotation.z = 0.5
      }
      if (legL.current) legL.current.rotation.x = Math.sin(f * 0.8) * 0.5
      if (legR.current) legR.current.rotation.x = -Math.sin(f * 0.8) * 0.5
    } else if (pose === 'paddle') {
      // นั่งในเรือ ขาเหยียด · สองมือจับไม้พายจ้วงเป็นวง
      const p = idle.current * (m > 0 ? 4 : 1.2)
      if (armL.current) {
        armL.current.rotation.x = -1 + Math.sin(p) * 0.45
        armL.current.rotation.z = -0.2 + Math.cos(p) * 0.15
      }
      if (armR.current) {
        armR.current.rotation.x = -1 + Math.sin(p) * 0.45
        armR.current.rotation.z = 0.2 + Math.cos(p) * 0.15
      }
      if (legL.current) legL.current.rotation.x = lerp(legL.current.rotation.x, -1.45)
      if (legR.current) legR.current.rotation.x = lerp(legR.current.rotation.x, -1.45)
    }
    if (m === 0 && pose === 'shake') {
      // เขย่ากระบอกเซียมซี: มือสองข้างโยกขึ้นลงเร็ว ๆ
      const sh = Math.sin(idle.current * 18) * 0.18
      if (armL.current) armL.current.rotation.x = -0.95 + sh
      if (armR.current) armR.current.rotation.x = -0.95 + sh
    }
    if (upper.current) upper.current.rotation.x = lerp(upper.current.rotation.x, age.hunch + (kneel ? bow * 1.15 : 0))
    if (body.current) {
      const down = kneel ? -0.62 * age.legScale : (pose === 'sit' && m === 0) || pose === 'paddle' ? -0.42 * age.legScale : 0
      body.current.position.y = m > 0 && pose !== 'ride' && pose !== 'swim' && pose !== 'paddle' && pose !== 'struggle' ? Math.abs(Math.cos(phase.current)) * 0.05 : lerp(body.current.position.y, down)
    }
  })

  // ลักษณะชาย-หญิง: ชายไหล่กว้าง ตัวสูงกว่าเล็กน้อย · หญิงไหล่แคบ เอวคอด
  const shoulder = female ? 0.185 : 0.25
  // ระยะห่างระหว่างตา ≈ ความกว้างตา 1 ดวง
  const eyeX = 0.066 * (age.eyeScale > 1 ? 1.12 : 1)
  // ตำแหน่งตา: ต่ำกว่ากลางหัวเล็กน้อย ให้หน้าสมส่วน และคิ้วโผล่พ้นหน้าม้า
  const eyeY = age.eyeScale > 1 ? 1.55 : 1.563
  const brow = shade(hair, 0.8)
  const face = appearance.faceShape ?? defaultFaceShape(appearance.gender)
  // ขนาดหัวตามรูปหน้า และตำแหน่งผิวหน้า (ให้ตา คิ้ว ปาก แปะพอดีผิว ไม่จมหรือลอย)
  // หน้าเหลี่ยม = หัวกว้างและแบนลงเล็กน้อย (ไม่ใช้ชิ้นกรามแยก จะเกิดรอยต่อใต้ปาก)
  const faceScale: [number, number, number] = face === 'round' ? [1.05, 0.97, 1] : face === 'oval' ? [0.95, 1.04, 0.98] : [1.09, 0.97, 1.02]
  const faceZ = (x: number, y: number) => {
    const ux = x / faceScale[0]
    const uy = (y - 1.57) / faceScale[1]
    return Math.sqrt(Math.max(0, 0.17 * 0.17 - ux * ux - uy * uy)) * faceScale[2]
  }
  const legGap = 0.09
  const skinMat = <meshStandardMaterial color={skin} />
  // สีรอยย่น: สีผิวเข้มลง
  const wrinkle = shade(skin, 0.72)
  const bottomMat = <meshStandardMaterial color={bottom} />

  return (
    <group ref={body} scale={age.bodyScale * (female ? 1 : 1.04)}>
      {/* ---------- ท่อนล่าง (เด็กขาสั้น: ย่อตามแนวตั้ง) ---------- */}
      <group scale={[1, age.legScale, 1]}>
      {outfit.bottomShape === 'skirt' && (
        <>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.24, 0.62, 24]} />
            {sarongTex ? <meshStandardMaterial key={sarongTex.uuid} color="#ffffff" map={sarongTex} /> : bottomMat}
          </mesh>
          {sarongTex && (
            // ขอบผ้าถุงที่พับเหน็บเอว
            <mesh position={[0, 0.85, 0]}>
              <cylinderGeometry args={[0.175, 0.172, 0.045, 24]} />
              <meshStandardMaterial color={bottom} />
            </mesh>
          )}
          {[legL, legR].map((ref, i) => (
            <group key={i} ref={ref} position={[i === 0 ? -legGap : legGap, 0.3, 0]}>
              <mesh position={[0, -0.15, 0]} castShadow>
                <capsuleGeometry args={[0.05, 0.2, 4, 10]} />
                {skinMat}
              </mesh>
              <group position={[0, -0.3, 0]}>
                {barefoot ? <Foot skin={skin} /> : <Shoe style={shoes} color={shoeColor} skin={skin} />}
              </group>
            </group>
          ))}
        </>
      )}

      {outfit.bottomShape === 'mini' && (
        <mesh position={[0, 0.72, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.26, 0.28, 20]} />
          {bottomMat}
        </mesh>
      )}

      {outfit.bottomShape !== 'skirt' &&
        [legL, legR].map((ref, i) => (
          <group key={i} ref={ref} position={[i === 0 ? -legGap : legGap, 0.82, 0]}>
            {outfit.bottomShape === 'pants' && (
              <>
                <mesh position={[0, -0.32, 0]} castShadow>
                  <capsuleGeometry args={[0.08, 0.48, 4, 12]} />
                  {bottomMat}
                </mesh>
                <mesh position={[0, -0.71, 0]} castShadow>
                  <capsuleGeometry args={[0.045, 0.12, 4, 10]} />
                  {skinMat}
                </mesh>
              </>
            )}
            {outfit.bottomShape === 'shorts' && (
              <mesh position={[0, -0.13, 0]} castShadow>
                <capsuleGeometry args={[0.085, 0.14, 4, 12]} />
                {bottomMat}
              </mesh>
            )}
            {(outfit.bottomShape === 'shorts' || outfit.bottomShape === 'mini') && (
              <mesh position={[0, -0.52, 0]} castShadow>
                <capsuleGeometry args={[0.049, 0.5, 4, 10]} />
                {skinMat}
              </mesh>
            )}
            {/* ถุงเท้ายาว */}
            {outfit.socks && outfit.bottomShape !== 'pants' && (
              <mesh position={[0, outfit.bottomShape === 'mini' ? -0.66 : -0.74, 0]}>
                <cylinderGeometry args={[0.054, 0.05, outfit.bottomShape === 'mini' ? 0.32 : 0.16, 14]} />
                <meshStandardMaterial color={outfit.socks} />
              </mesh>
            )}
            <group position={[0, -0.82, 0]}>
              {barefoot ? <Foot skin={skin} /> : <Shoe style={shoes} color={shoeColor} skin={skin} />}
            </group>
          </group>
        ))}

      </group>

      {/* ---------- ท่อนบน (ผู้สูงอายุหลังค่อม หมุนรอบสะโพก) ---------- */}
      <group ref={upper} position={[0, 0.82 * age.legScale, 0]} rotation={[age.hunch, 0, 0]}>
      <group position={[0, -0.82, 0]}>
      {/* ---------- ลำตัว ---------- */}
      <group position={[0, 1.06, 0]} scale={[1, 1, 0.31 / (shoulder * 2)]}>
        <mesh position={[0, -0.02, 0]} castShadow>
          <cylinderGeometry args={[shoulder * 1.0, shoulder * (female ? 0.86 : 0.92), 0.44, 24]} />
          <meshStandardMaterial color={top} />
        </mesh>
        {/* ไหล่โค้งมน (ทรงโดมสูงขึ้น ไม่เป็นมุม) */}
        <mesh position={[0, 0.2, 0]} scale={[1, 0.5, 1]} castShadow>
          <sphereGeometry args={[shoulder * 1.0, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={top} />
        </mesh>
        {/* ชายเสื้อโค้งมน */}
        <mesh position={[0, -0.24, 0]} scale={[1, 0.25, 1]}>
          <sphereGeometry args={[shoulder * (female ? 0.86 : 0.92), 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color={top} />
        </mesh>
      </group>
      {female && (
        // สะโพกผู้หญิง: กว้างกว่าเอวเล็กน้อย
        <mesh position={[0, 0.84, 0]} scale={[1, 0.45, 0.62]} castShadow>
          <sphereGeometry args={[shoulder * 0.98, 18, 10]} />
          <meshStandardMaterial color={outfit.bottomShape === 'pants' || outfit.bottomShape === 'shorts' ? bottom : top} />
        </mesh>
      )}
      {bib &&
        (OPEN_FRONT.includes(outfit.id) ? (
          // เสื้อตัวในที่เห็นตรงกลาง (แจ็กเก็ตเปิดหน้า)
          <mesh position={[0, 1.08, 0.131]}>
            <RBox args={[0.13, 0.54, 0.01]} />
            <meshStandardMaterial color={bib} />
          </mesh>
        ) : outfit.id === 'vest' ? (
          <mesh position={[0, 1.06, 0.002]}>
            <RBox args={[shoulder * 2 + 0.012, 0.5, 0.268]} />
            <meshStandardMaterial color={bib} />
          </mesh>
        ) : (
          // เอี๊ยม: แผ่นหน้า + สายสองข้าง
          <group>
            <mesh position={[0, 0.98, 0.132]}>
              <RBox args={[shoulder * 1.3, 0.32, 0.012]} />
              <meshStandardMaterial color={bib} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * shoulder * 0.55, 1.22, 0.132]}>
                <RBox args={[0.04, 0.2, 0.012]} />
                <meshStandardMaterial color={bib} />
              </mesh>
            ))}
          </group>
        ))}

      {/* ---------- แขน ---------- */}
      {[armL, armR].map((ref, i) => (
        <group key={i} ref={ref} position={[(i === 0 ? -1 : 1) * (shoulder + 0.035), 1.3, 0]}>
          {/* หัวไหล่กลม (ลดความคมของไหล่) */}
          <mesh castShadow>
            <sphereGeometry args={[0.066, 16, 12]} />
            <meshStandardMaterial color={top} />
          </mesh>
          <group scale={[1, age.armScale, 1]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <capsuleGeometry args={[0.058, 0.26, 4, 12]} />
            <meshStandardMaterial color={top} />
          </mesh>
          <mesh position={[0, -0.42, 0]} castShadow>
            <capsuleGeometry args={[0.044, 0.14, 4, 10]} />
            {skinMat}
          </mesh>
          <mesh position={[0, -0.53, 0.005]} castShadow>
            <sphereGeometry args={[0.05, 14, 10]} />
            {skinMat}
          </mesh>
          </group>
          {i === 1 && bag === 'handbag' && <HandBag color={bagColor} />}
          {i === 1 && tool === 'wand' && <WandModel gem={wandGem ?? 'purple'} />}
          {i === 1 && tool && tool !== 'pole' && tool !== 'wand' && <Tool kind={tool} />}
          {i === 0 && cane !== 'none' && <Cane kind={cane} />}
          {i === 1 && elder && appearance.basket && !tool && bag !== 'handbag' && <Basket />}
          {i === 1 && kidItem !== 'none' && !tool && bag !== 'handbag' && (
            <group ref={kidHand}>
              <KidItem kind={kidItem} />
            </group>
          )}
        </group>
      ))}

      <BodyBag bag={bag} color={bagColor} female={female} />
      {tool === 'pole' && <CarryPole />}
      {kidItem !== 'none' && (
        // ของที่กอดไว้หน้าอก (ตำแหน่งเดียวกับมือสองข้างที่ประคอง)
        <group ref={kidChest} position={[0, 1.98, 0.2]} scale={1.5} visible={false}>
          <KidItem kind={kidItem} />
        </group>
      )}
      {child && appearance.kidBag && bag !== 'backpack' && <BodyBag bag="backpack" color="#f0a0b0" female={female} />}
      {shawl.id !== 'none' && <Shawl color={shawl.color} stripe={shawl.stripe} shoulder={shoulder} />}

      {/* ---------- หัว (เด็กหัวใหญ่กว่าตัว) ---------- */}
      {/* หัววางเหนือยอดไหล่ เว้นคอให้เห็นราว 1/3 ของความสูงหัว */}
      <group position={[0, 1.26 + shoulder * 0.5 + NECK_SHOW, 0]} scale={age.headScale * HEAD_BOOST} rotation={[-age.hunch * 0.7, 0, 0]}>
      <group position={[0, -1.4, 0]}>
      <mesh position={[0, 1.37, 0]}>
        <cylinderGeometry args={female ? [0.054, 0.064, 0.2, 16] : [0.072, 0.085, 0.2, 16]} />
        {skinMat}
      </mesh>
      <mesh position={[0, 1.57, 0]} scale={faceScale} castShadow>
        <sphereGeometry args={[0.17, 28, 22]} />
        {skinMat}
      </mesh>
      {/* คิ้ว: รูปทรงมากับแบบตาที่เลือก · หญิงเส้นบาง ชายหนา */}
      {(() => {
        const b = EYE_BROWS[appearance.eyeStyle ?? 'round']
        const thick = female ? 0.0045 : 0.008
        return ([-1, 1] as const).map((s) => (
          <group
            key={'b' + s}
            position={[s * eyeX, eyeY + (0.042 + b.lift) * age.eyeScale, faceZ(eyeX, eyeY + 0.042 * age.eyeScale) - 0.003]}
            rotation={[-0.25, s * 0.3, s * b.tilt]}
            scale={[b.len * age.eyeScale, 1, 1]}
          >
            {b.arch > 0 ? (
              // ส่วนโค้งด้านบนของวงแหวน (หมุนให้กึ่งกลางส่วนโค้งอยู่ด้านบน)
              <mesh position={[0, -0.03 * (1 - b.arch * 0.4), 0]} rotation={[0, 0, Math.PI * 0.19]} scale={[1, 0.35 + b.arch * 0.5, 1]}>
                <torusGeometry args={[0.03, thick, 4, 12, Math.PI * 0.62]} />
                <meshBasicMaterial color={brow} />
              </mesh>
            ) : (
              <mesh>
                <RBox args={[0.052, thick * 2, 0.008]} />
                <meshBasicMaterial color={brow} />
              </mesh>
            )}
          </group>
        ))
      })()}
      {female &&
        // ขนตา: ขีดเล็ก ๆ ที่หางตา
        [-1, 1].map((s) => (
          <mesh key={'l' + s} position={[s * (eyeX + 0.024 * age.eyeScale), eyeY + 0.014 * age.eyeScale, faceZ(eyeX + 0.024, eyeY) - 0.002]} rotation={[0, 0, s * 0.6]}>
            <RBox args={[0.02 * age.eyeScale, 0.006, 0.006]} />
            <meshStandardMaterial color="#1c1714" />
          </mesh>
        ))}
      {/* ตา: ตาดำตามสีที่เลือก + จุดแสงสีขาว */}
      {([-1, 1] as const).map((s) => (
        <group key={s} position={[s * eyeX, eyeY, faceZ(eyeX, eyeY) - 0.006]} scale={age.eyeScale * 1.06}>
          <Eye color={eye} style={appearance.eyeStyle ?? 'round'} side={s} female={female} skin={skin} />
        </group>
      ))}
      {/* ปาก: รูปแบบที่เลือก (ยิ้ม/เขี้ยวใช้จุดเดิม · แบบแผ่นวางต่ำลงมาบนผิวหน้า) */}
      {(() => {
        // ผิวปาก = ห่อปากกลมเล็ก
        const ms = pose === 'whistle' ? 'o' : (appearance.mouthStyle ?? 'smile')
        const arc = ms === 'smile' || ms === 'fang'
        return (
          <group position={arc ? [0, 1.503, faceZ(0, 1.503) - 0.006] : [0, 1.487, faceZ(0, 1.487) - 0.004]} rotation={[arc ? 0.3 : 0.5, 0, 0]}>
            <Mouth style={ms} lip={lipColorValue(appearance.lipColor)} />
          </group>
        )
      })()}
      {/* รอยย่น (ผู้สูงอายุ): เส้นบนหน้าผาก + ตีนกา + ร่องแก้ม */}
      {age.wrinkles && (
        <group>
          {[1.632, 1.652].map((y) => (
            <mesh key={'f' + y} position={[0, y, 0.152]} rotation={[-0.35, 0, 0]}>
              <RBox args={[0.12, 0.006, 0.004]} />
              <meshStandardMaterial color={wrinkle} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <group key={'w' + s}>
              <mesh position={[s * 0.103, 1.573, 0.13]} rotation={[0, s * 0.6, s * 0.4]}>
                <RBox args={[0.03, 0.005, 0.004]} />
                <meshStandardMaterial color={wrinkle} />
              </mesh>
              <mesh position={[s * 0.103, 1.558, 0.13]} rotation={[0, s * 0.6, -s * 0.2]}>
                <RBox args={[0.028, 0.005, 0.004]} />
                <meshStandardMaterial color={wrinkle} />
              </mesh>
              <mesh position={[s * 0.06, 1.5, 0.15]} rotation={[0, s * 0.35, s * 0.5]}>
                <RBox args={[0.005, 0.045, 0.004]} />
                <meshStandardMaterial color={wrinkle} />
              </mesh>
            </group>
          ))}
        </group>
      )}
      {/* แก้ม */}
      {[-0.095, 0.095].map((x) => (
        <mesh key={'c' + x} position={[x, 1.525, 0.137]} rotation={[0, x * 4, 0]} scale={[1, 0.6, 0.3]}>
          <sphereGeometry args={[0.026, 14, 10]} />
          <meshStandardMaterial color="#e48f86" transparent opacity={0.55} />
        </mesh>
      ))}

      {/* ผมกว้างตามรูปหน้า (หน้าเหลี่ยม/กลมกว้างกว่า) ไม่ให้หนังหัวโผล่ */}
      <group position={[0, 1.57, 0]} scale={[Math.max(1, faceScale[0]), 1, Math.max(1, faceScale[2])]}>
        <group position={[0, -1.57, 0]}>
          <Hair style={appearance.hairStyle} color={hair} />
        </group>
      </group>
      {outfit.hat === 'straw' && accessory !== 'cap' && accessory !== 'beanie' && accessory !== 'beret' && <StrawHat />}
      <Accessory kind={shownAccessory} color={accColor} />
      {elder && appearance.elderGlasses && accessory !== 'glasses' && <Accessory kind="glasses" color="#6b5440" />}
      {elder && appearance.elderHat && <Accessory kind="widehat" color="#d8cdb4" />}
      {kidHead === 'bow' && accessory !== 'ribbon' && <Accessory kind="ribbon" color="#e58fa0" />}
      {kidHead === 'hat' && <KidHat />}
      </group>
      </group>
      </group>
      </group>
    </group>
  )
}

/** หมวกงอบ (มากับชุดทำนา) */
function StrawHat() {
  return (
    <mesh position={[0, 1.78, 0]} castShadow>
      <coneGeometry args={[0.38, 0.22, 14]} />
      <meshStandardMaterial color="#d8b56a" />
    </mesh>
  )
}

/** เครื่องมือในมือขวา (จุดกำเนิด = มือ, ด้ามยาวต่อลงไปตามแนวแขน) */
function Tool({ kind }: { kind: ToolId }) {
  if (kind === 'siamsi') {
    // กระบอกเซียมซีสีแดงทรงสูง (ขนาดพอดีมือ) มีไม้สีแดงอยู่ข้างใน — ถือเอียงไปข้างหน้า
    return (
      <group position={[-0.08, -0.55, 0.06]} rotation={[0.9, 0, 0.2]}>
        <mesh>
          <cylinderGeometry args={[0.055, 0.05, 0.26, 16]} />
          <meshStandardMaterial color="#b8323a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.055, 0.007, 6, 16]} />
          <meshStandardMaterial color="#d9a441" metalness={0.6} roughness={0.35} />
        </mesh>
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh key={i} position={[Math.cos(i * 0.7) * 0.03, 0.17, Math.sin(i * 0.7) * 0.03]} rotation={[Math.sin(i) * 0.12, 0, Math.cos(i) * 0.12]}>
            <boxGeometry args={[0.012, 0.16, 0.004]} />
            <meshStandardMaterial color="#c8423a" />
          </mesh>
        ))}
      </group>
    )
  }
  if (kind === 'axe' || kind === 'axe2') {
    // ขวาน: ด้ามไม้ยื่นไปข้างหน้าจากมือ หัวเหล็กที่ปลาย (ขวานเหล็กหัวใหญ่ สีเงินกว่า)
    const big = kind === 'axe2'
    return (
      <group position={[0, -0.55, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.026, 0.72, 10]} />
          <meshStandardMaterial color="#8a5a32" roughness={0.8} />
        </mesh>
        <group position={[0, 0.6, 0]}>
          <mesh position={[0, 0, 0.08]} castShadow>
            <RBox args={[0.05, big ? 0.2 : 0.16, big ? 0.2 : 0.16]} />
            <meshStandardMaterial color={big ? '#b9c0c6' : '#7d8186'} metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.17]} castShadow>
            <boxGeometry args={[0.02, big ? 0.24 : 0.19, 0.03]} />
            <meshStandardMaterial color="#e2e6ea" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      </group>
    )
  }
  if (kind === 'broom') {
    // ไม้กวาดทางมะพร้าวด้ามยาว
    return (
      <group position={[0, -0.52, 0.02]}>
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.95, 12]} />
          <meshStandardMaterial color="#a8824a" />
        </mesh>
        <mesh position={[0, -1.0, 0]}>
          <coneGeometry args={[0.13, 0.32, 8, 1, true]} />
          <meshStandardMaterial color="#c8a85a" side={2} />
        </mesh>
      </group>
    )
  }
  // จอบด้ามยาว
  return (
    <group position={[0, -0.52, 0.02]}>
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.95, 12]} />
        <meshStandardMaterial color="#8a6a42" />
      </mesh>
      <mesh position={[0, -0.93, 0.08]}>
        <RBox args={[0.16, 0.04, 0.18]} />
        <meshStandardMaterial color="#6a6e72" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

/** หัวใหญ่ขึ้นเล็กน้อยทุกวัย (สัดส่วนน่ารักแบบ cozy game) */
const HEAD_BOOST = 1.04
/** ความยาวคอที่เห็น (เหนือไหล่) ≈ 1/3 ของความสูงหัว */
const NECK_SHOW = 0.06

/** ทำให้สี hex เข้มขึ้น (k < 1) */
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.round(Math.min(255, v * k)).toString(16).padStart(2, '0')
  return '#' + c((n >> 16) & 255) + c((n >> 8) & 255) + c(n & 255)
}

/** ไม้เท้า: จับที่มือซ้าย ปลายแตะพื้น (ชดเชยแขนที่ยื่นไปข้างหน้า) */
function Cane({ kind }: { kind: CaneId }) {
  const wood = kind === 'wood' ? '#7a4f2e' : kind === 'flower' ? '#c9a06a' : '#5a4a3c'
  return (
    <group position={[0, -0.53, 0.02]} rotation={[0.3, 0, -0.12]}>
      {/* ด้ามจับโค้ง */}
      <mesh position={[0, 0.02, 0.04]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.045, 0.014, 6, 10, Math.PI]} />
        <meshStandardMaterial color={wood} />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.014, 0.016, 0.82, 12]} />
        <meshStandardMaterial color={wood} />
      </mesh>
      {kind === 'wood' &&
        [-0.15, -0.35, -0.55].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[0.019, 0.019, 0.025, 12]} />
            <meshStandardMaterial color="#4a2f1a" />
          </mesh>
        ))}
      {kind === 'flower' && (
        <group position={[0, -0.06, 0.03]}>
          {['#f2a7b8', '#f6d36b', '#ffffff'].map((c, i) => (
            <mesh key={c} position={[Math.cos(i * 2.1) * 0.025, 0, Math.sin(i * 2.1) * 0.025]}>
              <sphereGeometry args={[0.022, 14, 10]} />
              <meshStandardMaterial color={c} />
            </mesh>
          ))}
        </group>
      )}
      {/* ปลายยาง */}
      <mesh position={[0, -0.82, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.04, 12]} />
        <meshStandardMaterial color="#2b2a2c" />
      </mesh>
    </group>
  )
}

/** ผ้าคลุมไหล่: แผ่นผ้าพาดรอบไหล่ ชายผ้าห้อยด้านหน้า */
function Shawl({ color, stripe, shoulder }: { color: string; stripe?: string; shoulder: number }) {
  const w = shoulder * 2 + 0.05
  return (
    <group>
      <mesh position={[0, 1.31, 0]} castShadow>
        <RBox args={[w, 0.08, 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.2, -0.138]}>
        <RBox args={[w, 0.22, 0.02]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <mesh position={[sx * shoulder * 0.55, 1.12, 0.14]} rotation={[0, 0, sx * 0.08]}>
            <RBox args={[0.1, 0.36, 0.02]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {stripe &&
            [1.2, 1.04].map((y) => (
              <mesh key={y} position={[sx * shoulder * 0.55, y, 0.152]} rotation={[0, 0, sx * 0.08]}>
                <RBox args={[0.102, 0.025, 0.004]} />
                <meshStandardMaterial color={stripe} />
              </mesh>
            ))}
        </group>
      ))}
    </group>
  )
}

/** ของถือของเด็ก: อยู่ในมือขวา */
function KidItem({ kind }: { kind: KidItemId }) {
  if (kind === 'bottle')
    return (
      <group position={[0, -0.56, 0.05]} rotation={[0.3, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.035, 0.035, 0.12, 12]} />
          <meshStandardMaterial color="#fbfaf4" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.036, 0.036, 0.07, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.025, 12]} />
          <meshStandardMaterial color="#8fc4e8" />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <coneGeometry args={[0.02, 0.05, 12]} />
          <meshStandardMaterial color="#e8c48a" />
        </mesh>
      </group>
    )
  if (kind === 'ball')
    return (
      <mesh position={[0, -0.6, 0.06]} castShadow>
        <icosahedronGeometry args={[0.08, 1]} />
        <meshStandardMaterial color="#e8746a" />
      </mesh>
    )
  // ตุ๊กตาหมี
  return (
    <group position={[0, -0.6, 0.07]}>
      <mesh>
        <sphereGeometry args={[0.06, 14, 10]} />
        <meshStandardMaterial color="#b88456" />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.045, 14, 10]} />
        <meshStandardMaterial color="#b88456" />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 0.035, 0.12, 0]}>
          <sphereGeometry args={[0.017, 14, 10]} />
          <meshStandardMaterial color="#8a5a36" />
        </mesh>
      ))}
    </group>
  )
}

/** หมวกเด็ก: หมวกทรงถัง สีสดใส มีดอกไม้เล็ก ๆ */
function KidHat() {
  return (
    <group position={[0, 1.69, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.25, 0.27, 0.02, 18]} />
        <meshStandardMaterial color="#f6d36b" />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.13, 16]} />
        <meshStandardMaterial color="#f6d36b" />
      </mesh>
      <mesh position={[0.13, 0.06, 0.1]}>
        <sphereGeometry args={[0.035, 14, 10]} />
        <meshStandardMaterial color="#e8746a" />
      </mesh>
    </group>
  )
}

/** ตะกร้าสานใบเล็ก หิ้วในมือขวา (ไปวัด/ไปตลาด) */
function Basket() {
  return (
    <group position={[0, -0.66, 0.02]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.11, 0.08, 0.12, 10, 1, true]} />
        <meshStandardMaterial color="#c9a06a" side={2} />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.01, 12]} />
        <meshStandardMaterial color="#a8824a" />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.1, 0.008, 4, 14, Math.PI]} />
        <meshStandardMaterial color="#a8824a" />
      </mesh>
      {/* ดอกไม้/ของใส่บาตรในตะกร้า */}
      {['#f6d36b', '#f2a7b8'].map((c, i) => (
        <mesh key={c} position={[i ? 0.03 : -0.03, 0.06, 0]}>
          <sphereGeometry args={[0.03, 14, 10]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
    </group>
  )
}

/** เท้าเปล่า (ถอดรองเท้าไว้หน้าโบสถ์) */
function Foot({ skin }: { skin: string }) {
  return (
    <mesh position={[0, 0.035, 0.03]}>
      <RBox args={[0.09, 0.07, 0.19]} />
      <meshStandardMaterial color={skin} />
    </mesh>
  )
}

/** ไม้คานหาบบนไหล่ขวา ห้อยตะกร้าผลไม้สองข้าง (หน้า-หลัง) */
function CarryPole() {
  const basket = (z: number, fruit: string) => (
    <group position={[0.2, 0.62, z]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.14, 0.33, sz * 0.14]} rotation={[sz * 0.25, 0, -sx * 0.25]}>
            <cylinderGeometry args={[0.006, 0.006, 0.7, 4]} />
            <meshStandardMaterial color="#8a6a3e" />
          </mesh>
        )),
      )}
      <mesh>
        <cylinderGeometry args={[0.28, 0.2, 0.2, 16, 1, true]} />
        <meshStandardMaterial color="#a8824a" side={2} />
      </mesh>
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 16]} />
        <meshStandardMaterial color="#8a6a3e" />
      </mesh>
      {Array.from({ length: 7 }).map((_, k) => (
        <mesh key={k} position={[Math.cos(k * 0.9) * 0.14 * (k % 2 ? 1 : 0.4), 0.08, Math.sin(k * 0.9) * 0.14 * (k % 2 ? 1 : 0.4)]}>
          <sphereGeometry args={[0.065, 10, 8]} />
          <meshStandardMaterial color={fruit} />
        </mesh>
      ))}
    </group>
  )
  return (
    <group>
      <mesh position={[0.2, 1.38, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 2.1, 8]} />
        <meshStandardMaterial color="#9a7448" />
      </mesh>
      {basket(0.95, '#a8d060')}
      {basket(-0.95, '#e8a040')}
    </group>
  )
}

/**
 * คฑาจับสัตว์ (ชื่อเดียวทุกสี) — ด้ามไม้แกะลาย ปลอกทองเหลือง หัวกรงเล็บทองประคองคริสตัลเรืองแสง
 * แต่ละสีหน้าตาต่างกันเล็กน้อยตามแบบของผู้สร้าง: เหลือง = หัวกลีบบัวไม้ · ม่วง = จี้อัญมณีห้อยปลายด้าม · แดง = เม็ดทับทิมที่ปลอก
 */
function WandModel({ gem }: { gem: GemColor }) {
  const g = GEMS[gem]
  const gemRef = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!gemRef.current) return
    gemRef.current.rotation.y = clock.elapsedTime * 1.2
    const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.06
    gemRef.current.scale.set(s, s, s)
  })
  const WOOD = '#7a4f2e'
  const BRASS = '#c9a24a'
  const lotus = gem === 'yellow'
  return (
    // ถือในมือ ด้ามชี้ไปข้างหน้า (เหมือนขวาน)
    <group position={[0, -0.55, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
      {/* ด้ามไม้: โคนกลม ปลายเรียว */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.032, 0.62, 10]} />
        <meshStandardMaterial color={WOOD} roughness={0.75} />
      </mesh>
      <mesh position={[0, -0.2, 0]} castShadow>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshStandardMaterial color={WOOD} roughness={0.75} />
      </mesh>
      {/* ลายแกะ (วงนูนเล็ก ๆ) */}
      {[-0.08, 0.02].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <torusGeometry args={[0.03, 0.006, 6, 14]} />
          <meshStandardMaterial color="#5e3a20" />
        </mesh>
      ))}
      {/* ปลอกทองเหลือง */}
      {[0.3, 0.4].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.027, 0.009, 6, 16]} />
          <meshStandardMaterial color={lotus ? '#a0703e' : BRASS} metalness={lotus ? 0 : 0.7} roughness={0.35} />
        </mesh>
      ))}
      {gem === 'red' && (
        <mesh position={[0, 0.35, 0.03]}>
          <octahedronGeometry args={[0.014, 0]} />
          <meshStandardMaterial color={g.color} emissive={g.color} emissiveIntensity={0.8} />
        </mesh>
      )}
      {/* หัวคฑา: กรงเล็บทอง 3 แฉก หรือกลีบบัวไม้ 5 กลีบ (สีเหลือง) */}
      <group position={[0, 0.46, 0]}>
        {Array.from({ length: lotus ? 5 : 3 }).map((_, k, arr) => (
          <group key={k} rotation={[0, (k / arr.length) * Math.PI * 2, 0]}>
            <mesh position={[0.035, 0.05, 0]} rotation={[0, 0, -0.45]} castShadow>
              <coneGeometry args={[lotus ? 0.02 : 0.012, lotus ? 0.11 : 0.13, 6]} />
              <meshStandardMaterial color={lotus ? '#a8763f' : BRASS} metalness={lotus ? 0 : 0.7} roughness={0.35} />
            </mesh>
          </group>
        ))}
        {/* คริสตัลเรืองแสง (แท่งยาวปลายแหลม) */}
        <group ref={gemRef} position={[0, 0.1, 0]}>
          <mesh scale={[0.6, 1.5, 0.6]}>
            <octahedronGeometry args={[0.055, 0]} />
            <meshStandardMaterial color={g.color} emissive={g.color} emissiveIntensity={1.4} transparent opacity={0.9} roughness={0.15} />
          </mesh>
          <mesh scale={1.9}>
            <sphereGeometry args={[0.05, 12, 10]} />
            <meshBasicMaterial color={g.glow} transparent opacity={0.18} depthWrite={false} />
          </mesh>
        </group>
      </group>
      {/* สีม่วง: จี้อัญมณีห้อยปลายด้าม */}
      {gem === 'purple' && (
        <group position={[0, -0.26, 0]}>
          <mesh position={[0, -0.02, 0]}>
            <torusGeometry args={[0.012, 0.004, 6, 10]} />
            <meshStandardMaterial color={BRASS} metalness={0.7} />
          </mesh>
          <mesh position={[0, -0.05, 0]} scale={[0.7, 1.2, 0.7]}>
            <octahedronGeometry args={[0.022, 0]} />
            <meshStandardMaterial color={g.color} emissive={g.color} emissiveIntensity={0.9} />
          </mesh>
        </group>
      )}
    </group>
  )
}
