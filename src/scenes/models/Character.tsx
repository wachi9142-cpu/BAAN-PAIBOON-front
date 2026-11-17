import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import {
  accessoryColorValue,
  AGE_RULES,
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
import { Accessory } from './Accessory'

interface Props {
  appearance: Appearance
  /** 0 = ยืน, 1 = เดิน, 2 = วิ่ง */
  motion?: React.RefObject<number>
  /** งานที่ทำอยู่ตอนยืน (ชาวบ้าน): กวาด / ถางหญ้า / คุย */
  action?: CharacterAction
  /** ของในมือขวา */
  tool?: ToolId
}

export type CharacterAction = 'sweep' | 'hoe' | 'talk'
export type ToolId = 'broom' | 'hoe'

/** ท่าแขนตอนยืน: [ซ้าย x, ซ้าย z, ขวา x, ขวา z] (เรเดียน) — แขนห้อยลงที่ 0,0 */
const POSE_ARMS: Record<PoseId, [number, number, number, number]> = {
  stand: [0, 0.05, 0, -0.05],
  wave: [0, 0.05, 0, 2.7],
  wai: [-1.25, -0.5, -1.25, 0.5],
  shy: [-0.45, -0.35, -0.45, 0.35],
  behind: [0.45, -0.25, 0.45, 0.25],
  cheer: [0, -2.7, 0, 2.7],
}

/** เอี๊ยม/เสื้อกั๊ก/แจ็กเก็ตเปิดหน้า */
const OPEN_FRONT = ['varsity', 'cardigan', 'jacket']

/** ตัวละครแบบ low-poly ประกอบจากรูปทรงพื้นฐาน สูงประมาณ 1.7 ม. */
export function Character({ appearance, motion, action, tool }: Props) {
  const skin = byId(SKIN_TONES, appearance.skin).color
  const hair = hairColorValue(appearance.hairColor)
  const outfit = byId(OUTFITS, appearance.outfit)
  const top = clothColor(appearance.topColor, outfit.top)
  const bottom = clothColor(appearance.bottomColor, outfit.bottom)
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

  const legL = useRef<Group>(null)
  const legR = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const body = useRef<Group>(null)
  const phase = useRef(0)
  const idle = useRef(0)

  useFrame((_, dt) => {
    const m = motion?.current ?? 0
    phase.current += dt * (m === 2 ? 13 : 8) * (m > 0 ? 1 : 0)
    idle.current += dt
    const swing = m > 0 ? Math.sin(phase.current) * (m === 2 ? 0.8 : 0.5) : 0
    const k = Math.min(1, dt * 10)
    const lerp = (cur: number, to: number) => cur + (to - cur) * k
    if (legL.current) legL.current.rotation.x = lerp(legL.current.rotation.x, swing)
    if (legR.current) legR.current.rotation.x = lerp(legR.current.rotation.x, -swing)

    // แขน: เดิน = แกว่ง, ยืน = ตามท่าที่เลือก
    let [lx, lz, rx, rz] = m > 0 ? [-swing * 0.8, 0.05, swing * 0.8, -0.05] : POSE_ARMS[pose]
    if (m === 0 && pose === 'wave') rz += Math.sin(idle.current * 7) * 0.25
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
    if (m === 0 && pose === 'cheer') {
      const b = Math.sin(idle.current * 5) * 0.12
      lz -= b
      rz += b
    }
    if (armL.current) {
      armL.current.rotation.x = lerp(armL.current.rotation.x, lx)
      armL.current.rotation.z = lerp(armL.current.rotation.z, lz)
    }
    if (armR.current) {
      armR.current.rotation.x = lerp(armR.current.rotation.x, rx)
      armR.current.rotation.z = lerp(armR.current.rotation.z, rz)
    }
    if (body.current) body.current.position.y = m > 0 ? Math.abs(Math.cos(phase.current)) * 0.05 : 0
  })

  const shoulder = female ? 0.2 : 0.23
  const legGap = 0.09
  const skinMat = <meshStandardMaterial color={skin} flatShading />
  const bottomMat = <meshStandardMaterial color={bottom} flatShading />

  return (
    <group ref={body} scale={age.bodyScale}>
      {/* ---------- ท่อนล่าง ---------- */}
      {outfit.bottomShape === 'skirt' && (
        <>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.24, 0.62, 10]} />
            {bottomMat}
          </mesh>
          {[legL, legR].map((ref, i) => (
            <group key={i} ref={ref} position={[i === 0 ? -legGap : legGap, 0.3, 0]}>
              <mesh position={[0, -0.15, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 0.3, 6]} />
                {skinMat}
              </mesh>
              <group position={[0, -0.3, 0]}>
                <Shoe style={shoes} color={shoeColor} skin={skin} />
              </group>
            </group>
          ))}
        </>
      )}

      {outfit.bottomShape === 'mini' && (
        <mesh position={[0, 0.72, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.26, 0.28, 12]} />
          {bottomMat}
        </mesh>
      )}

      {outfit.bottomShape !== 'skirt' &&
        [legL, legR].map((ref, i) => (
          <group key={i} ref={ref} position={[i === 0 ? -legGap : legGap, 0.82, 0]}>
            {outfit.bottomShape === 'pants' && (
              <>
                <mesh position={[0, -0.32, 0]} castShadow>
                  <boxGeometry args={[0.15, 0.62, 0.17]} />
                  {bottomMat}
                </mesh>
                <mesh position={[0, -0.71, 0]} castShadow>
                  <cylinderGeometry args={[0.045, 0.045, 0.2, 6]} />
                  {skinMat}
                </mesh>
              </>
            )}
            {outfit.bottomShape === 'shorts' && (
              <mesh position={[0, -0.13, 0]} castShadow>
                <boxGeometry args={[0.16, 0.28, 0.18]} />
                {bottomMat}
              </mesh>
            )}
            {(outfit.bottomShape === 'shorts' || outfit.bottomShape === 'mini') && (
              <mesh position={[0, -0.52, 0]} castShadow>
                <cylinderGeometry args={[0.052, 0.046, 0.6, 7]} />
                {skinMat}
              </mesh>
            )}
            {/* ถุงเท้ายาว */}
            {outfit.socks && outfit.bottomShape !== 'pants' && (
              <mesh position={[0, outfit.bottomShape === 'mini' ? -0.66 : -0.74, 0]}>
                <cylinderGeometry args={[0.054, 0.05, outfit.bottomShape === 'mini' ? 0.32 : 0.16, 7]} />
                <meshStandardMaterial color={outfit.socks} flatShading />
              </mesh>
            )}
            <group position={[0, -0.82, 0]}>
              <Shoe style={shoes} color={shoeColor} skin={skin} />
            </group>
          </group>
        ))}

      {/* ---------- ท่อนบน (ผู้สูงอายุหลังค่อมเล็กน้อย หมุนรอบสะโพก) ---------- */}
      <group position={[0, 0.82, 0]} rotation={[age.hunch, 0, 0]}>
      <group position={[0, -0.82, 0]}>
      {/* ---------- ลำตัว ---------- */}
      <mesh position={[0, 1.08, 0]} castShadow>
        <boxGeometry args={[shoulder * 2, 0.55, 0.26]} />
        <meshStandardMaterial color={top} flatShading />
      </mesh>
      {bib &&
        (OPEN_FRONT.includes(outfit.id) ? (
          // เสื้อตัวในที่เห็นตรงกลาง (แจ็กเก็ตเปิดหน้า)
          <mesh position={[0, 1.08, 0.131]}>
            <boxGeometry args={[0.13, 0.54, 0.01]} />
            <meshStandardMaterial color={bib} flatShading />
          </mesh>
        ) : outfit.id === 'vest' ? (
          <mesh position={[0, 1.06, 0.002]}>
            <boxGeometry args={[shoulder * 2 + 0.012, 0.5, 0.268]} />
            <meshStandardMaterial color={bib} flatShading />
          </mesh>
        ) : (
          // เอี๊ยม: แผ่นหน้า + สายสองข้าง
          <group>
            <mesh position={[0, 0.98, 0.132]}>
              <boxGeometry args={[shoulder * 1.3, 0.32, 0.012]} />
              <meshStandardMaterial color={bib} flatShading />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * shoulder * 0.55, 1.22, 0.132]}>
                <boxGeometry args={[0.04, 0.2, 0.012]} />
                <meshStandardMaterial color={bib} flatShading />
              </mesh>
            ))}
          </group>
        ))}

      {/* ---------- แขน ---------- */}
      {[armL, armR].map((ref, i) => (
        <group key={i} ref={ref} position={[(i === 0 ? -1 : 1) * (shoulder + 0.06), 1.32, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <boxGeometry args={[0.11, 0.36, 0.13]} />
            <meshStandardMaterial color={top} flatShading />
          </mesh>
          <mesh position={[0, -0.45, 0]} castShadow>
            <boxGeometry args={[0.09, 0.2, 0.1]} />
            {skinMat}
          </mesh>
          {i === 1 && bag === 'handbag' && <HandBag color={bagColor} />}
          {i === 1 && tool && <Tool kind={tool} />}
        </group>
      ))}

      <BodyBag bag={bag} color={bagColor} female={female} />

      {/* ---------- หัว (เด็กหัวใหญ่กว่าตัว) ---------- */}
      <group position={[0, 1.4, 0]} scale={age.headScale}>
      <group position={[0, -1.4, 0]}>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.1, 8]} />
        {skinMat}
      </mesh>
      <mesh position={[0, 1.57, 0]} castShadow>
        <sphereGeometry args={[0.17, 12, 10]} />
        {skinMat}
      </mesh>
      {/* ตา: ตาดำตามสีที่เลือก + จุดแสงสีขาว */}
      {[-0.06, 0.06].map((x) => (
        <group key={x} position={[x, 1.59, 0.152]}>
          <mesh>
            <sphereGeometry args={[0.024, 8, 8]} />
            <meshStandardMaterial color={eye} roughness={0.3} />
          </mesh>
          <mesh position={[0.008, 0.009, 0.019]}>
            <sphereGeometry args={[0.0065, 5, 5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
      {/* ปาก: ยิ้มเล็ก ๆ */}
      <mesh position={[0, 1.515, 0.158]} rotation={[0.25, 0, Math.PI]}>
        <torusGeometry args={[0.032, 0.009, 6, 14, Math.PI]} />
        <meshStandardMaterial color={lipColorValue(appearance.lipColor)} />
      </mesh>
      {/* แก้ม */}
      {[-0.095, 0.095].map((x) => (
        <mesh key={'c' + x} position={[x, 1.545, 0.135]} rotation={[0, x * 4, 0]} scale={[1, 0.6, 0.3]}>
          <sphereGeometry args={[0.026, 8, 6]} />
          <meshStandardMaterial color="#e48f86" transparent opacity={0.55} />
        </mesh>
      ))}

      <Hair style={appearance.hairStyle} color={hair} />
      {outfit.hat === 'straw' && accessory !== 'cap' && accessory !== 'beanie' && accessory !== 'beret' && <StrawHat />}
      <Accessory kind={accessory} color={accColor} />
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
      <meshStandardMaterial color="#d8b56a" flatShading />
    </mesh>
  )
}

/** เครื่องมือในมือขวา (จุดกำเนิด = มือ, ด้ามยาวต่อลงไปตามแนวแขน) */
function Tool({ kind }: { kind: ToolId }) {
  if (kind === 'broom') {
    // ไม้กวาดทางมะพร้าวด้ามยาว
    return (
      <group position={[0, -0.52, 0.02]}>
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.95, 6]} />
          <meshStandardMaterial color="#a8824a" flatShading />
        </mesh>
        <mesh position={[0, -1.0, 0]}>
          <coneGeometry args={[0.13, 0.32, 8, 1, true]} />
          <meshStandardMaterial color="#c8a85a" flatShading side={2} />
        </mesh>
      </group>
    )
  }
  // จอบด้ามยาว
  return (
    <group position={[0, -0.52, 0.02]}>
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.95, 6]} />
        <meshStandardMaterial color="#8a6a42" flatShading />
      </mesh>
      <mesh position={[0, -0.93, 0.08]}>
        <boxGeometry args={[0.16, 0.04, 0.18]} />
        <meshStandardMaterial color="#6a6e72" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}
