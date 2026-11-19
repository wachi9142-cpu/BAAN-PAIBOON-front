import { useMemo } from 'react'
import { ArecaPalmTree } from './models/Palms'
import { NearLabel } from './NearLabel'

/**
 * ต้นหมาก: ลำต้นสูงเรียวตรง สีเทาอมเขียว มีข้อเป็นวง ๆ · ยอดเป็นกาบเขียวสด · ทางใบแผ่ออกเป็นพุ่มฝอย
 * ทะลายหมากห้อยใต้ยอด ลูกสุกสีส้ม ลูกอ่อนสีเขียว
 */
export function ArecaPalm({ h, seed }: { h: number; seed: number }) {
  const fronds = 8
  const lean = useMemo(() => [Math.sin(seed * 3.1) * 0.04, Math.cos(seed * 2.3) * 0.04] as const, [seed])
  const nuts = useMemo(
    () =>
      Array.from({ length: 2 }, (_, b) => ({
        a: seed + b * 2.6,
        ripe: (seed * 7 + b) % 3 !== 0,
      })),
    [seed],
  )
  return (
    <group rotation={[lean[0], 0, lean[1]]}>
      {/* ลำต้นเรียว */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.085, 0.12, h, 8]} />
        <meshStandardMaterial color="#9a9c8c" roughness={0.9} />
      </mesh>
      {/* ข้อวงรอบลำต้น */}
      {Array.from({ length: Math.floor(h / 0.9) }, (_, i) => (
        <mesh key={i} position={[0, 0.6 + i * 0.9, 0]}>
          <cylinderGeometry args={[0.112 - i * 0.003, 0.112 - i * 0.003, 0.04, 8]} />
          <meshStandardMaterial color="#7e8070" roughness={0.9} />
        </mesh>
      ))}
      {/* กาบยอดสีเขียวสด */}
      <mesh position={[0, h + 0.5, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 1.0, 8]} />
        <meshStandardMaterial color="#5f9a3e" roughness={0.6} />
      </mesh>
      {/* ทางใบโค้งแผ่ออก */}
      {Array.from({ length: fronds }, (_, k) => {
        const a = (k / fronds) * Math.PI * 2 + seed
        const tilt = k % 2 ? 0.75 : 1.05
        return (
          <group key={k} position={[0, h + 0.9, 0]} rotation={[0, a, 0]}>
            <group rotation={[tilt, 0, 0]}>
              <mesh position={[0, 0.85, 0]} castShadow>
                <boxGeometry args={[0.5, 1.7, 0.02]} />
                <meshStandardMaterial color={k % 3 ? '#4f8a34' : '#6aa040'} roughness={0.8} side={2} />
              </mesh>
              <mesh position={[0, 1.85, 0]} rotation={[0.35, 0, 0]}>
                <boxGeometry args={[0.32, 0.5, 0.02]} />
                <meshStandardMaterial color="#5a9438" roughness={0.8} side={2} />
              </mesh>
            </group>
          </group>
        )
      })}
      {/* ทะลายหมาก */}
      {nuts.map((n, b) => (
        <group key={b} position={[Math.cos(n.a) * 0.2, h - 0.15, Math.sin(n.a) * 0.2]}>
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[Math.cos(i * 2.4) * 0.09 * ((i % 3) + 1) * 0.6, -(i % 4) * 0.08, Math.sin(i * 2.4) * 0.09 * ((i % 3) + 1) * 0.6]}>
              <sphereGeometry args={[0.055, 8, 6]} />
              <meshStandardMaterial color={n.ripe ? (i % 3 ? '#e8782a' : '#d86020') : i % 2 ? '#7aa040' : '#8ab048'} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** สวนหมากราว 30 ต้นปลูกชิดกันเป็นแถว (หลังบ้านน้องเนย) */
export function ArecaGrove({ w, d }: { w: number; d: number }) {
  const palms = useMemo(() => {
    const cols = 6
    const rows = 5
    const out: [number, number, number][] = []
    let s = 41
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    for (let c = 0; c < cols; c++)
      for (let k = 0; k < rows; k++) {
        const x = -w / 2 + 1 + (c / (cols - 1)) * (w - 2) + (r() - 0.5) * 0.6
        const z = -d / 2 + 1 + (k / (rows - 1)) * (d - 2) + (r() - 0.5) * 0.6
        out.push([x, z, 6.5 + r() * 1.5])
      }
    return out
  }, [w, d])
  return (
    <group>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#8a9a5a" roughness={1} />
      </mesh>
      {palms.map(([x, z, h], i) => (
        <group key={i} position={[x, 0, z]}>
          <ArecaPalmTree h={h} seed={i * 1.37 + 0.4} />
        </group>
      ))}
      <group position={[0, 0, 0]}>
        <NearLabel text="สวนหมาก" y={3} r={Math.max(w, d) / 2 + 3} height={0.6} />
      </group>
    </group>
  )
}
