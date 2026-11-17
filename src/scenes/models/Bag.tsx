import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { BagId } from '../../game/content/appearance'

/**
 * กระเป๋าที่ติดกับลำตัว (พิกัดเดียวกับ Character: ลำตัวกลางที่ y≈1.08, หน้าไปทาง +z, ไหล่ซ้ายที่ x ลบ)
 * กระเป๋าถือจะวาดแยกในมือ (HandBag)
 */

const M = ({ c }: { c: string }) => <meshStandardMaterial color={c} flatShading />

/** สายกระเป๋าจากจุด a ไป b (กล่องบาง ๆ) */
function Strap({ a, b, w = 0.03, color }: { a: [number, number, number]; b: [number, number, number]; w?: number; color: string }) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const dz = b[2] - a[2]
  const len = Math.hypot(dx, dy, dz)
  const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
  // หมุนแกน y ของกล่องให้ชี้จาก a ไป b (สายอยู่ในระนาบ xy เป็นหลัก)
  const rz = -Math.atan2(dx, dy)
  const rx = Math.atan2(dz, Math.hypot(dx, dy))
  return (
    <mesh position={mid} rotation={[rx, 0, rz]}>
      <boxGeometry args={[w, len, 0.012]} />
      <M c={color} />
    </mesh>
  )
}

/** ลายผ้าทอแนวนอนสำหรับย่าม */
function useYaamTexture(color: string) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 16
    c.height = 64
    const g = c.getContext('2d')!
    g.fillStyle = color
    g.fillRect(0, 0, 16, 64)
    const bands = ['#c9a23a', '#a83a32', '#f1e6cc', '#c9a23a']
    bands.forEach((b, i) => {
      g.fillStyle = b
      g.fillRect(0, 10 + i * 12, 16, 4)
    })
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    return t
  }, [color])
}

export function BodyBag({ bag, color, female }: { bag: BagId; color: string; female: boolean }) {
  const sx = female ? 0.2 : 0.23 // ความกว้างไหล่ครึ่งหนึ่ง
  const yaamTex = useYaamTexture(color)
  const dark = '#3a2a1e'
  switch (bag) {
    case 'none':
    case 'handbag':
      return null
    case 'backpack':
      return (
        <group>
          <mesh position={[0, 1.08, -0.21]} castShadow>
            <boxGeometry args={[0.32, 0.4, 0.14]} />
            <M c={color} />
          </mesh>
          <mesh position={[0, 1.0, -0.29]} castShadow>
            <boxGeometry args={[0.24, 0.18, 0.05]} />
            <M c={color} />
          </mesh>
          <mesh position={[0, 1.27, -0.21]}>
            <boxGeometry args={[0.32, 0.04, 0.145]} />
            <M c={dark} />
          </mesh>
          {[-1, 1].map((s) => (
            <Strap key={s} a={[s * 0.1, 1.33, 0.0]} b={[s * 0.12, 0.88, 0.135]} color={dark} />
          ))}
        </group>
      )
    case 'yaam':
      // ย่าม: ผ้าทอลายขวาง สายยาวพาดไหล่ซ้าย ตัวกระเป๋าอยู่สะโพกขวา
      return (
        <group>
          <Strap a={[-sx + 0.04, 1.36, 0]} b={[sx + 0.07, 0.86, 0.06]} w={0.04} color={color} />
          <mesh position={[sx + 0.08, 0.72, 0.04]} rotation={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.26, 0.3, 0.05]} />
            <meshStandardMaterial map={yaamTex} flatShading />
          </mesh>
          {/* พู่ด้านล่าง */}
          {[-0.08, 0, 0.08].map((x) => (
            <mesh key={x} position={[sx + 0.08 + x, 0.54, 0.05]}>
              <cylinderGeometry args={[0.006, 0.01, 0.06, 4]} />
              <M c="#c9a23a" />
            </mesh>
          ))}
        </group>
      )
    case 'tote':
      // กระเป๋าผ้า: หิ้วบนไหล่ขวา ตัวกระเป๋าห้อยข้างลำตัว
      return (
        <group>
          <mesh position={[sx + 0.17, 0.92, 0]} castShadow>
            <boxGeometry args={[0.05, 0.34, 0.3]} />
            <M c={color} />
          </mesh>
          <mesh position={[sx + 0.17, 0.82, 0]}>
            <boxGeometry args={[0.052, 0.04, 0.3]} />
            <M c="#e8dcc0" />
          </mesh>
          {[-0.08, 0.08].map((z) => (
            <Strap key={z} a={[sx + 0.15, 1.36, z * 0.5]} b={[sx + 0.17, 1.08, z]} w={0.025} color={color} />
          ))}
        </group>
      )
    case 'shoulder':
      return (
        <group>
          <Strap a={[sx - 0.02, 1.36, 0]} b={[sx + 0.17, 0.98, 0.0]} color={dark} />
          <mesh position={[sx + 0.17, 0.9, 0.02]} rotation={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.08, 0.2, 0.28]} />
            <M c={color} />
          </mesh>
          <mesh position={[sx + 0.215, 0.93, 0.02]}>
            <boxGeometry args={[0.01, 0.1, 0.27]} />
            <M c={dark} />
          </mesh>
        </group>
      )
    case 'crossbody':
      // คาดลำตัว: สายพาดจากไหล่ซ้ายลงสะโพกขวา กระเป๋าเล็กด้านหน้า
      return (
        <group>
          <Strap a={[-sx + 0.03, 1.36, 0.135]} b={[sx - 0.04, 0.86, 0.15]} color={dark} />
          <Strap a={[-sx + 0.03, 1.36, -0.135]} b={[sx - 0.02, 0.86, -0.13]} color={dark} />
          <mesh position={[sx - 0.02, 0.8, 0.16]} castShadow>
            <boxGeometry args={[0.18, 0.14, 0.06]} />
            <M c={color} />
          </mesh>
          <mesh position={[sx - 0.02, 0.84, 0.192]}>
            <boxGeometry args={[0.18, 0.06, 0.008]} />
            <M c={dark} />
          </mesh>
        </group>
      )
    case 'waist':
      return (
        <group>
          <mesh position={[0, 0.84, 0]}>
            <cylinderGeometry args={[0.215, 0.215, 0.04, 12, 1, true]} />
            <meshStandardMaterial color={dark} side={2} />
          </mesh>
          <mesh position={[0, 0.84, 0.19]} scale={[1, 0.7, 0.6]} castShadow>
            <sphereGeometry args={[0.11, 8, 6]} />
            <M c={color} />
          </mesh>
        </group>
      )
  }
}

/** กระเป๋าถือ: ติดกับปลายแขนขวา (พิกัดของกลุ่มแขน — มืออยู่ที่ y≈-0.5) */
export function HandBag({ color }: { color: string }) {
  return (
    <group position={[0, -0.6, 0.02]}>
      <mesh position={[0, -0.1, 0]} castShadow>
        <boxGeometry args={[0.1, 0.18, 0.24]} />
        <M c={color} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.06, 0.012, 5, 10, Math.PI]} />
        <M c="#3a2a1e" />
      </mesh>
      <mesh position={[0.052, -0.04, 0]}>
        <boxGeometry args={[0.01, 0.025, 0.05]} />
        <meshStandardMaterial color="#d9b65a" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}
