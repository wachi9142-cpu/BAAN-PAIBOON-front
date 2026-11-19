import { useMemo } from 'react'
import { Windy } from './Wind'

/** ที่รกร้าง: หญ้าสูงขึ้นรก ไม้พุ่ม ต้นไม้เล็กขึ้นแซม ขอนไม้ล้ม เถาวัลย์ (ที่เดิมของบ้านฟ่างหลังเก่า) */
export function OvergrownLot({ w, d }: { w: number; d: number }) {
  const items = useMemo(() => {
    let k = 777
    const r = () => ((k = (k * 9301 + 49297) % 233280) / 233280)
    const grass = Array.from({ length: 170 }, () => [(r() - 0.5) * w, (r() - 0.5) * d, 0.5 + r() * 0.9, r()] as const)
    const bush = Array.from({ length: 16 }, () => [(r() - 0.5) * (w - 2), (r() - 0.5) * (d - 2), 0.5 + r() * 0.6] as const)
    const trees = Array.from({ length: 7 }, () => [(r() - 0.5) * (w - 3), (r() - 0.5) * (d - 3), 1.8 + r() * 1.6] as const)
    return { grass, bush, trees }
  }, [w, d])
  return (
    <Windy h={1.4} amp={0.3} flutter={1}>
    <group>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#8a9a58" roughness={1} />
        </mesh>
        {items.grass.map(([x, z, h, c], i) => (
          <mesh key={'g' + i} position={[x, h / 2, z]} rotation={[(c - 0.5) * 0.4, c * 3, (c - 0.5) * 0.3]}>
            <coneGeometry args={[0.14, h, 4]} />
            <meshStandardMaterial color={c < 0.33 ? '#7a8f44' : c < 0.66 ? '#6c8a3c' : '#a0a058'} flatShading />
          </mesh>
        ))}
        {items.bush.map(([x, z, s], i) => (
          <mesh key={'b' + i} position={[x, s * 0.6, z]} scale={[1.3, 0.9, 1.1]} castShadow>
            <icosahedronGeometry args={[s, 0]} />
            <meshStandardMaterial color={i % 2 ? '#5f7f3a' : '#6e8a40'} flatShading />
          </mesh>
        ))}
        {items.trees.map(([x, z, h], i) => (
          <group key={'t' + i} position={[x, 0, z]}>
            <mesh position={[0, h / 2, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.13, h, 6]} />
              <meshStandardMaterial color="#6b5440" />
            </mesh>
            <mesh position={[0, h + 0.4, 0]} castShadow>
              <icosahedronGeometry args={[0.9 + (i % 3) * 0.2, 0]} />
              <meshStandardMaterial color="#557a34" flatShading />
            </mesh>
          </group>
        ))}
        {/* ขอนไม้ล้ม มีเถาวัลย์พัน */}
        <mesh position={[2, 0.22, -2]} rotation={[0, 0.7, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 3.2, 8]} />
          <meshStandardMaterial color="#6a5038" />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[2 + Math.cos(0.7) * (i - 1) * 0.9, 0.24, -2 - Math.sin(0.7) * (i - 1) * 0.9]} rotation={[0, 0.7, Math.PI / 2]}>
            <torusGeometry args={[0.27, 0.035, 5, 12]} />
            <meshStandardMaterial color="#4f7a2e" />
          </mesh>
        ))}
      </group>
    </Windy>
  )
}
