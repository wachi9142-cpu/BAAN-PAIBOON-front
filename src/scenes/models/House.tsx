import { useMemo } from 'react'
import { ExtrudeGeometry, Shape } from 'three'
import type { HouseDesign } from '../../game/content/houses'
import { RBox } from './RBox'

/** หลังคาจั่ว: สองแผ่นเอียงเข้าหากัน สันหลังคาวางตามแกน x */
export function GableRoof({
  width,
  depth,
  height,
  y,
  color,
  overhang = 0.5,
}: {
  width: number
  depth: number
  height: number
  y: number
  color: string
  overhang?: number
}) {
  const half = depth / 2 + overhang
  const slope = Math.hypot(half, height)
  const angle = Math.atan2(height, half)
  return (
    <group position={[0, y, 0]}>
      {[1, -1].map((s) => (
        <mesh
          key={s}
          position={[0, height / 2, (s * half) / 2]}
          rotation={[s * angle, 0, 0]}
          castShadow
          receiveShadow
        >
          <RBox args={[width + overhang * 2, 0.22, slope + 0.1]} radius={0.1} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      ))}
      {/* อกไก่ (สันหลังคา) กลมมน */}
      <mesh position={[0, height + 0.06, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.13, width + overhang * 2 - 0.2, 4, 12]} />
        <meshStandardMaterial color={shadeHex(color, 0.82)} roughness={0.85} />
      </mesh>
      {/* หน้าจั่ว: ขอบโค้งมน ไม่เป็นแผ่นบางคม */}
      {[1, -1].map((s) => (
        <mesh key={'g' + s} position={[(s * width) / 2 - s * 0.06, 0, 0]} rotation={[0, (s * Math.PI) / 2, 0]} castShadow>
          <Gable half={depth / 2} h={height} />
          <meshStandardMaterial color={shadeHex(color, 1.12)} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Gable({ half, h }: { half: number; h: number }) {
  const geom = useMemo(() => {
    const g = new ExtrudeGeometry(triangle(half - 0.08, h - 0.08), { depth: 0.04, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.06, bevelSegments: 4, steps: 1 })
    g.translate(0, 0.02, -0.02)
    return g
  }, [half, h])
  return <primitive object={geom} attach="geometry" />
}

/** ทำสีอ่อน/เข้มขึ้น (k > 1 = อ่อน) */
function shadeHex(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.round(Math.min(255, k > 1 ? v + (255 - v) * (k - 1) : v * k)).toString(16).padStart(2, '0')
  return '#' + c((n >> 16) & 255) + c((n >> 8) & 255) + c(n & 255)
}

function triangle(half: number, h: number) {
  const s = new Shape()
  s.moveTo(-half, 0)
  s.lineTo(half, 0)
  s.lineTo(0, h)
  s.closePath()
  return s
}

function Door({ x = 0, y, z, color = '#4a3020' }: { x?: number; y: number; z: number; color?: string }) {
  return (
    <mesh position={[x, y, z]}>
      <RBox args={[0.9, 1.9, 0.08]} radius={0.035} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function Window({ x, y, z, frame }: { x: number; y: number; z: number; frame: string }) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <RBox args={[1, 0.8, 0.08]} radius={0.035} />
        <meshStandardMaterial color={frame} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <RBox args={[0.8, 0.62, 0.06]} />
        <meshStandardMaterial color="#2f3d45" emissive="#ffcf7a" emissiveIntensity={0} />
      </mesh>
    </group>
  )
}

export function House({ design }: { design: HouseDesign }) {
  const [w, d] = design.footprint
  switch (design.style) {
    case 'stilt': {
      const floorY = 2.2
      const wallH = 2.4
      return (
        <group>
          {/* เสาใต้ถุน */}
          {[-1, 0, 1].flatMap((ix) =>
            [-1, 1].map((iz) => (
              <mesh key={`${ix}${iz}`} position={[(ix * (w - 0.4)) / 2, floorY / 2, (iz * (d - 0.4)) / 2]} castShadow>
                <RBox args={[0.25, floorY, 0.25]} radius={0.1} />
                <meshStandardMaterial color="#5a3b26" />
              </mesh>
            )),
          )}
          {/* แคร่ใต้ถุน */}
          <mesh position={[-1.2, 0.45, 0]} castShadow receiveShadow>
            <RBox args={[1.8, 0.1, 1.2]} />
            <meshStandardMaterial color="#b88a55" />
          </mesh>
          {/* พื้น */}
          <mesh position={[0, floorY, 0.4]} castShadow receiveShadow>
            <RBox args={[w + 0.2, 0.2, d + 0.8]} radius={0.09} />
            <meshStandardMaterial color="#6e4a30" />
          </mesh>
          {/* ผนัง */}
          <mesh position={[0, floorY + wallH / 2, -0.2]} castShadow receiveShadow>
            <RBox args={[w, wallH, d - 0.8]} radius={0.28} />
            <meshStandardMaterial color={design.wall} />
          </mesh>
          <Door y={floorY + 1.05} z={(d - 0.8) / 2 - 0.2 + 0.03} />
          <Window x={-1.8} y={floorY + 1.4} z={(d - 0.8) / 2 - 0.2 + 0.03} frame={design.trim} />
          <Window x={1.8} y={floorY + 1.4} z={(d - 0.8) / 2 - 0.2 + 0.03} frame={design.trim} />
          {/* บันได */}
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[2.2, 0.2 + i * 0.36, d / 2 + 1.9 - i * 0.28]} castShadow>
              <RBox args={[1, 0.08, 0.32]} />
              <meshStandardMaterial color="#6e4a30" />
            </mesh>
          ))}
          <GableRoof width={w} depth={d - 0.8} height={1.8} y={floorY + wallH} color={design.roof} overhang={0.7} />
        </group>
      )
    }
    case 'concrete': {
      const wallH = 2.8
      return (
        <group>
          <mesh position={[0, 0.15, 0.6]} receiveShadow>
            <RBox args={[w + 0.6, 0.3, d + 1.6]} radius={0.14} />
            <meshStandardMaterial color="#a9a196" />
          </mesh>
          <mesh position={[0, 0.3 + wallH / 2, 0]} castShadow receiveShadow>
            <RBox args={[w, wallH, d]} radius={0.3} />
            <meshStandardMaterial color={design.wall} />
          </mesh>
          <Door y={1.25} z={d / 2 + 0.03} color="#6b4a2e" />
          <Window x={-1.8} y={1.7} z={d / 2 + 0.03} frame={design.trim} />
          <Window x={1.8} y={1.7} z={d / 2 + 0.03} frame={design.trim} />
          {/* ระเบียง + เสา */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (w / 2 - 0.2), 0.3 + wallH / 2, d / 2 + 1.2]} castShadow>
              <RBox args={[0.2, wallH, 0.2]} />
              <meshStandardMaterial color={design.trim} />
            </mesh>
          ))}
          <mesh position={[0, 0.3 + wallH + 0.05, d / 2 + 0.7]} castShadow>
            <RBox args={[w + 0.4, 0.18, 1.6]} radius={0.08} />
            <meshStandardMaterial color={design.roof} />
          </mesh>
          <GableRoof width={w} depth={d} height={1.5} y={0.3 + wallH} color={design.roof} overhang={0.4} />
        </group>
      )
    }
    case 'wood2': {
      // บ้านไม้สองชั้น (แบบที่พบมากในหมู่บ้าน): ชั้นล่างไม้มีประตูหน้าบ้าน · ชั้นบนไม้มีระเบียงยื่น หน้าต่างบานเปิด
      const lowH = 2.5
      const upH = 2.4
      const z0 = d / 2 + 0.03
      return (
        <group>
          <mesh position={[0, 0.08, 0.3]} receiveShadow>
            <RBox args={[w + 0.4, 0.16, d + 0.8]} radius={0.06} />
            <meshStandardMaterial color="#b3ab9c" />
          </mesh>
          <mesh position={[0, 0.16 + lowH / 2, 0]} castShadow receiveShadow>
            <RBox args={[w, lowH, d]} radius={0.24} />
            <meshStandardMaterial color={design.wall} />
          </mesh>
          {/* แนวตีไม้ฝาชั้นล่าง */}
          {[0.7, 1.3, 1.9].map((y) => (
            <mesh key={y} position={[0, y, z0 + 0.001]}>
              <planeGeometry args={[w - 0.4, 0.03]} />
              <meshBasicMaterial color="#00000033" transparent opacity={0.2} />
            </mesh>
          ))}
          <Door x={-0.9} y={1.1} z={z0} color="#4a3020" />
          <Window x={1.6} y={1.5} z={z0} frame={design.trim} />
          <Window x={-2.4} y={1.5} z={z0} frame={design.trim} />
          {/* พื้นชั้นสอง + ระเบียงยื่น */}
          <mesh position={[0, 0.16 + lowH + 0.08, 0.35]} castShadow>
            <RBox args={[w + 0.3, 0.16, d + 0.7]} radius={0.06} />
            <meshStandardMaterial color="#6e4a30" />
          </mesh>
          {[-w / 2 + 0.1, w / 2 - 0.1].map((x) => (
            <mesh key={x} position={[x, 0.16 + lowH + 0.55, d / 2 + 0.6]}>
              <RBox args={[0.1, 0.9, 0.1]} radius={0.03} />
              <meshStandardMaterial color="#5a3b26" />
            </mesh>
          ))}
          <mesh position={[0, 0.16 + lowH + 0.95, d / 2 + 0.62]}>
            <RBox args={[w + 0.1, 0.08, 0.08]} radius={0.03} />
            <meshStandardMaterial color="#5a3b26" />
          </mesh>
          <mesh position={[0, 0.32 + lowH + upH / 2, 0]} castShadow receiveShadow>
            <RBox args={[w - 0.2, upH, d - 0.2]} radius={0.22} />
            <meshStandardMaterial color={shadeHex(design.wall, 0.86)} />
          </mesh>
          <Door x={1.6} y={0.32 + lowH + 1} z={(d - 0.2) / 2 + 0.03} color="#5a3b26" />
          <Window x={-1.2} y={0.32 + lowH + 1.3} z={(d - 0.2) / 2 + 0.03} frame={design.trim} />
          <Window x={-2.5} y={0.32 + lowH + 1.3} z={(d - 0.2) / 2 + 0.03} frame={design.trim} />
          {/* บันไดนอกบ้านขึ้นชั้นสอง (ด้านข้าง) */}
          {Array.from({ length: 7 }).map((_, i) => (
            <mesh key={'st' + i} position={[w / 2 + 0.55, 0.25 + i * 0.36, -1.4 + i * 0.4]} castShadow>
              <RBox args={[0.9, 0.08, 0.34]} radius={0.03} />
              <meshStandardMaterial color="#6e4a30" />
            </mesh>
          ))}
          <GableRoof width={w - 0.2} depth={d - 0.2} height={1.7} y={0.32 + lowH + upH} color={design.roof} overhang={0.65} />
        </group>
      )
    }
    case 'halfhalf': {
      const lowH = 2.6
      const upH = 2.4
      return (
        <group>
          <mesh position={[0, lowH / 2, 0]} castShadow receiveShadow>
            <RBox args={[w, lowH, d]} radius={0.3} />
            <meshStandardMaterial color={design.wall} />
          </mesh>
          <mesh position={[0, lowH + 0.08, 0.2]} castShadow>
            <RBox args={[w + 0.3, 0.18, d + 0.7]} radius={0.08} />
            <meshStandardMaterial color={design.trim} />
          </mesh>
          <mesh position={[0, lowH + 0.16 + upH / 2, 0]} castShadow receiveShadow>
            <RBox args={[w - 0.2, upH, d - 0.2]} radius={0.26} />
            <meshStandardMaterial color="#9a6a42" />
          </mesh>
          <Door y={1.0} z={d / 2 + 0.03} color="#5a3b26" />
          <Window x={-1.8} y={1.5} z={d / 2 + 0.03} frame={design.trim} />
          <Window x={-1.5} y={lowH + 1.4} z={(d - 0.2) / 2 + 0.03} frame="#e8dcc0" />
          <Window x={1.5} y={lowH + 1.4} z={(d - 0.2) / 2 + 0.03} frame="#e8dcc0" />
          <GableRoof width={w - 0.2} depth={d - 0.2} height={1.7} y={lowH + 0.16 + upH} color={design.roof} overhang={0.6} />
        </group>
      )
    }
  }
}

/** บ้านชาวบ้าน (ใช้แบบใต้ถุนสูงเรียบง่าย สีต่างกัน) */
export function VillagerHouse({ color, seed = 0, style: forced, roof }: { color: string; seed?: number; style?: 'stilt' | 'concrete' | 'halfhalf' | 'wood2'; roof?: string }) {
  // บ้านไม้สองชั้นมีมากที่สุด · แซมด้วยครึ่งตึกครึ่งไม้ และใต้ถุนสูง
  const styles = ['wood2', 'wood2', 'halfhalf', 'wood2', 'stilt', 'wood2', 'halfhalf'] as const
  const style = forced ?? styles[seed % styles.length]
  return (
    <House
      design={{
        id: 'npc',
        name: '',
        description: '',
        style,
        footprint: [6, 5],
        wall: style === 'halfhalf' ? '#d8cbb3' : color,
        roof: roof ?? ['#6b3a2a', '#7a4a2e', '#8b8f86', '#a24a2c'][seed % 4],
        trim: '#d9c29a',
        perks: [],
      }}
    />
  )
}

/** พุ่มไม้กลมนุ่ม + ดอกไม้หลากสี (แต่งรอบบ้าน/อาคารให้ละมุน) */
export function Bush({ x, z, s = 1, flowers = '#f29ab8' }: { x: number; z: number; s?: number; flowers?: string | null }) {
  const blobs: [number, number, number, number][] = [
    [0, 0.32, 0, 0.42],
    [0.34, 0.26, 0.1, 0.32],
    [-0.3, 0.24, -0.08, 0.3],
    [0.05, 0.5, -0.12, 0.28],
  ]
  return (
    <group position={[x, 0, z]} scale={s}>
      {blobs.map(([bx, by, bz, r], i) => (
        <mesh key={i} position={[bx, by, bz]} castShadow receiveShadow>
          <icosahedronGeometry args={[r, 2]} />
          <meshStandardMaterial color={i % 2 ? '#5e9a48' : '#4f8a3e'} roughness={0.95} />
        </mesh>
      ))}
      {flowers &&
        [0, 1, 2, 3, 4, 5].map((k) => (
          <mesh key={'f' + k} position={[Math.cos(k * 1.1) * 0.38, 0.42 + (k % 3) * 0.1, Math.sin(k * 1.1) * 0.32]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshStandardMaterial color={k % 2 ? flowers : '#fff3c4'} roughness={0.6} />
          </mesh>
        ))}
    </group>
  )
}

/** รั้วไม้เตี้ยหัวมน (ยาว len ตามแกน x) */
export function PicketFence({ x, z, len, rot = 0 }: { x: number; z: number; len: number; rot?: number }) {
  const n = Math.max(2, Math.round(len / 0.45))
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {Array.from({ length: n }).map((_, i) => {
        const px = -len / 2 + (i / (n - 1)) * len
        return (
          <mesh key={i} position={[px, 0.36, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.6, 4, 8]} />
            <meshStandardMaterial color="#d8c39a" roughness={0.9} />
          </mesh>
        )
      })}
      {[0.25, 0.5].map((y) => (
        <mesh key={y} position={[0, y, -0.05]} castShadow>
          <RBox args={[len + 0.1, 0.07, 0.05]} radius={0.025} />
          <meshStandardMaterial color="#c8b088" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/** สวนหน้าบ้านชาวบ้าน: พุ่มดอกไม้ กระถาง รั้วไม้เตี้ยสองข้างทางเข้า */
export function HouseYard({ seed = 0 }: { seed?: number }) {
  const colors = ['#f29ab8', '#f6c445', '#e86a5a', '#c99af0', '#ffffff']
  const c = (k: number) => colors[(seed + k) % colors.length]
  return (
    <group>
      <Bush x={-3.6} z={3.4} s={1.1} flowers={c(0)} />
      <Bush x={3.7} z={2.6} s={0.9} flowers={c(1)} />
      <Bush x={-3.8} z={-2.2} s={0.8} flowers={null} />
      <Bush x={3.6} z={-2.4} s={1} flowers={c(2)} />
      <PicketFence x={-2.3} z={4.6} len={2.6} />
      <PicketFence x={3.9} z={4.6} len={1.6} />
      {/* กระถางดอกไม้ข้างบันได */}
      {[1.2, 3.2].map((px, i) => (
        <group key={px} position={[px, 0, 4.2]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.17, 0.36, 14]} />
            <meshStandardMaterial color="#b4583a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <icosahedronGeometry args={[0.24, 2]} />
            <meshStandardMaterial color="#5e9a48" roughness={0.95} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[Math.cos(k * 2.1) * 0.15, 0.6, Math.sin(k * 2.1) * 0.15]}>
              <sphereGeometry args={[0.055, 10, 8]} />
              <meshStandardMaterial color={c(3 + i + k)} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
