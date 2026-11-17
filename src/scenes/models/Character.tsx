import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { byId, hairColorValue, lipColorValue, shoeColorValue, bagColorValue, OUTFITS, SKIN_TONES, type Appearance } from '../../game/content/appearance'
import { Shoe } from './Shoe'
import { BodyBag, HandBag } from './Bag'

interface Props {
  appearance: Appearance
  /** 0 = ยืน, 1 = เดิน, 2 = วิ่ง */
  motion?: React.RefObject<number>
}

/** ตัวละครแบบ low-poly ประกอบจากรูปทรงพื้นฐาน สูงประมาณ 1.7 ม. */
export function Character({ appearance, motion }: Props) {
  const skin = byId(SKIN_TONES, appearance.skin).color
  const hair = hairColorValue(appearance.hairColor)
  const outfit = byId(OUTFITS, appearance.outfit)
  const female = appearance.gender === 'female'
  const shoes = appearance.shoes ?? 'sandals'
  const shoeColor = shoeColorValue(appearance.shoeColor)
  const bag = appearance.bag ?? 'none'
  const bagColor = bagColorValue(appearance.bagColor)

  const legL = useRef<Group>(null)
  const legR = useRef<Group>(null)
  const armL = useRef<Group>(null)
  const armR = useRef<Group>(null)
  const body = useRef<Group>(null)
  const phase = useRef(0)

  useFrame((_, dt) => {
    const m = motion?.current ?? 0
    phase.current += dt * (m === 2 ? 13 : 8) * (m > 0 ? 1 : 0)
    const swing = m > 0 ? Math.sin(phase.current) * (m === 2 ? 0.8 : 0.5) : 0
    const lerp = (cur: number, to: number) => cur + (to - cur) * Math.min(1, dt * 12)
    if (legL.current) legL.current.rotation.x = lerp(legL.current.rotation.x, swing)
    if (legR.current) legR.current.rotation.x = lerp(legR.current.rotation.x, -swing)
    if (armL.current) armL.current.rotation.x = lerp(armL.current.rotation.x, -swing * 0.8)
    if (armR.current) armR.current.rotation.x = lerp(armR.current.rotation.x, swing * 0.8)
    if (body.current) body.current.position.y = m > 0 ? Math.abs(Math.cos(phase.current)) * 0.05 : 0
  })

  const shoulder = female ? 0.2 : 0.23
  const legGap = 0.09

  return (
    <group ref={body}>
      {/* ขา / ผ้าถุง */}
      {outfit.bottomShape === 'skirt' ? (
        <>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.24, 0.62, 10]} />
            <meshStandardMaterial color={outfit.bottom} flatShading />
          </mesh>
          {[legL, legR].map((ref, i) => (
            <group key={i} ref={ref} position={[i === 0 ? -legGap : legGap, 0.3, 0]}>
              <mesh position={[0, -0.15, 0]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 0.3, 6]} />
                <meshStandardMaterial color={skin} flatShading />
              </mesh>
              <group position={[0, -0.3, 0]}>
                <Shoe style={shoes} color={shoeColor} skin={skin} />
              </group>
            </group>
          ))}
        </>
      ) : (
        [legL, legR].map((ref, i) => (
          <group key={i} ref={ref} position={[i === 0 ? -legGap : legGap, 0.82, 0]}>
            <mesh position={[0, -0.32, 0]} castShadow>
              <boxGeometry args={[0.15, 0.62, 0.17]} />
              <meshStandardMaterial color={outfit.bottom} flatShading />
            </mesh>
            {/* ข้อเท้า (ระหว่างขากางเกงกับรองเท้า) */}
            <mesh position={[0, -0.71, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.045, 0.2, 6]} />
              <meshStandardMaterial color={skin} flatShading />
            </mesh>
            <group position={[0, -0.82, 0]}>
              <Shoe style={shoes} color={shoeColor} skin={skin} />
            </group>
          </group>
        ))
      )}

      {/* ลำตัว */}
      <mesh position={[0, 1.08, 0]} castShadow>
        <boxGeometry args={[shoulder * 2, 0.55, 0.26]} />
        <meshStandardMaterial color={outfit.top} flatShading />
      </mesh>

      {/* แขน */}
      {[armL, armR].map((ref, i) => (
        <group key={i} ref={ref} position={[(i === 0 ? -1 : 1) * (shoulder + 0.06), 1.32, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <boxGeometry args={[0.11, 0.36, 0.13]} />
            <meshStandardMaterial color={outfit.top} flatShading />
          </mesh>
          <mesh position={[0, -0.45, 0]} castShadow>
            <boxGeometry args={[0.09, 0.2, 0.1]} />
            <meshStandardMaterial color={skin} flatShading />
          </mesh>
          {i === 1 && bag === 'handbag' && <HandBag color={bagColor} />}
        </group>
      ))}

      <BodyBag bag={bag} color={bagColor} female={female} />

      {/* คอ + หัว */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.1, 8]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
      <mesh position={[0, 1.57, 0]} castShadow>
        <sphereGeometry args={[0.17, 12, 10]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
      {/* ตา */}
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 1.59, 0.155]}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshStandardMaterial color="#1a1410" />
        </mesh>
      ))}

      {/* ปาก: ยิ้มเล็ก ๆ (ครึ่งวงแหวนหงายขึ้น) */}
      <mesh position={[0, 1.515, 0.158]} rotation={[0.25, 0, Math.PI]}>
        <torusGeometry args={[0.032, 0.009, 6, 14, Math.PI]} />
        <meshStandardMaterial color={lipColorValue(appearance.lipColor)} />
      </mesh>
      {/* แก้มอมชมพูจาง ๆ */}
      {[-0.095, 0.095].map((x) => (
        <mesh key={'c' + x} position={[x, 1.545, 0.135]} rotation={[0, x * 4, 0]} scale={[1, 0.6, 0.3]}>
          <sphereGeometry args={[0.026, 8, 6]} />
          <meshStandardMaterial color="#e48f86" transparent opacity={0.55} />
        </mesh>
      ))}

      <Hair style={appearance.hairStyle} color={hair} />
      {outfit.hat === 'straw' && <StrawHat />}
    </group>
  )
}

function Hair({ style, color }: { style: Appearance['hairStyle']; color: string }) {
  const mat = <meshStandardMaterial color={color} flatShading />
  const cap = (
    <mesh position={[0, 1.62, -0.01]} castShadow>
      <sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
      {mat}
    </mesh>
  )
  switch (style) {
    case 'buzz':
      return (
        <mesh position={[0, 1.6, -0.01]}>
          <sphereGeometry args={[0.175, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
          {mat}
        </mesh>
      )
    case 'short':
      return (
        <group>
          {cap}
          <mesh position={[0, 1.6, -0.06]}>
            <boxGeometry args={[0.34, 0.16, 0.24]} />
            {mat}
          </mesh>
        </group>
      )
    case 'bob':
      return (
        <group>
          {cap}
          <mesh position={[0, 1.53, -0.04]} castShadow>
            <cylinderGeometry args={[0.2, 0.21, 0.2, 12, 1, true, Math.PI * 0.15, Math.PI * 1.7]} />
            <meshStandardMaterial color={color} flatShading side={2} />
          </mesh>
        </group>
      )
    case 'long':
      return (
        <group>
          {cap}
          <mesh position={[0, 1.42, -0.15]} castShadow>
            <boxGeometry args={[0.34, 0.46, 0.08]} />
            {mat}
          </mesh>
        </group>
      )
    case 'bun':
      return (
        <group>
          {cap}
          <mesh position={[0, 1.72, -0.14]} castShadow>
            <sphereGeometry args={[0.09, 10, 8]} />
            {mat}
          </mesh>
        </group>
      )
    case 'ponytail':
      return (
        <group>
          {cap}
          <mesh position={[0, 1.52, -0.2]} rotation={[0.35, 0, 0]} castShadow>
            <coneGeometry args={[0.07, 0.4, 8]} />
            {mat}
          </mesh>
        </group>
      )
  }
}

/** หมวกงอบ */
function StrawHat() {
  return (
    <mesh position={[0, 1.78, 0]} castShadow>
      <coneGeometry args={[0.38, 0.22, 14]} />
      <meshStandardMaterial color="#d8b56a" flatShading />
    </mesh>
  )
}
