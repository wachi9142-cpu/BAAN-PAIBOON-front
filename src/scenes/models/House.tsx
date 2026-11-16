import { Shape } from 'three'
import type { HouseDesign } from '../../game/content/houses'

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
          <boxGeometry args={[width + overhang * 2, 0.12, slope]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      ))}
      {/* หน้าจั่ว */}
      {[1, -1].map((s) => (
        <mesh key={'g' + s} position={[(s * width) / 2, 0, 0]} rotation={[0, (s * Math.PI) / 2, 0]}>
          <shapeGeometry args={[triangle(depth / 2, height)]} />
          <meshStandardMaterial color={color} flatShading side={2} />
        </mesh>
      ))}
    </group>
  )
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
      <boxGeometry args={[0.9, 1.9, 0.08]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function Window({ x, y, z, frame }: { x: number; y: number; z: number; frame: string }) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[1, 0.8, 0.06]} />
        <meshStandardMaterial color={frame} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.8, 0.62, 0.06]} />
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
                <boxGeometry args={[0.25, floorY, 0.25]} />
                <meshStandardMaterial color="#5a3b26" flatShading />
              </mesh>
            )),
          )}
          {/* แคร่ใต้ถุน */}
          <mesh position={[-1.2, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.1, 1.2]} />
            <meshStandardMaterial color="#b88a55" flatShading />
          </mesh>
          {/* พื้น */}
          <mesh position={[0, floorY, 0.4]} castShadow receiveShadow>
            <boxGeometry args={[w + 0.2, 0.2, d + 0.8]} />
            <meshStandardMaterial color="#6e4a30" flatShading />
          </mesh>
          {/* ผนัง */}
          <mesh position={[0, floorY + wallH / 2, -0.2]} castShadow receiveShadow>
            <boxGeometry args={[w, wallH, d - 0.8]} />
            <meshStandardMaterial color={design.wall} flatShading />
          </mesh>
          <Door y={floorY + 1.05} z={(d - 0.8) / 2 - 0.2 + 0.03} />
          <Window x={-1.8} y={floorY + 1.4} z={(d - 0.8) / 2 - 0.2 + 0.03} frame={design.trim} />
          <Window x={1.8} y={floorY + 1.4} z={(d - 0.8) / 2 - 0.2 + 0.03} frame={design.trim} />
          {/* บันได */}
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[2.2, 0.2 + i * 0.36, d / 2 + 1.9 - i * 0.28]} castShadow>
              <boxGeometry args={[1, 0.08, 0.32]} />
              <meshStandardMaterial color="#6e4a30" flatShading />
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
            <boxGeometry args={[w + 0.6, 0.3, d + 1.6]} />
            <meshStandardMaterial color="#a9a196" flatShading />
          </mesh>
          <mesh position={[0, 0.3 + wallH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, wallH, d]} />
            <meshStandardMaterial color={design.wall} flatShading />
          </mesh>
          <Door y={1.25} z={d / 2 + 0.03} color="#6b4a2e" />
          <Window x={-1.8} y={1.7} z={d / 2 + 0.03} frame={design.trim} />
          <Window x={1.8} y={1.7} z={d / 2 + 0.03} frame={design.trim} />
          {/* ระเบียง + เสา */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (w / 2 - 0.2), 0.3 + wallH / 2, d / 2 + 1.2]} castShadow>
              <boxGeometry args={[0.2, wallH, 0.2]} />
              <meshStandardMaterial color={design.trim} flatShading />
            </mesh>
          ))}
          <mesh position={[0, 0.3 + wallH + 0.05, d / 2 + 0.7]} castShadow>
            <boxGeometry args={[w + 0.4, 0.12, 1.6]} />
            <meshStandardMaterial color={design.roof} flatShading />
          </mesh>
          <GableRoof width={w} depth={d} height={1.5} y={0.3 + wallH} color={design.roof} overhang={0.4} />
        </group>
      )
    }
    case 'halfhalf': {
      const lowH = 2.6
      const upH = 2.4
      return (
        <group>
          <mesh position={[0, lowH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, lowH, d]} />
            <meshStandardMaterial color={design.wall} flatShading />
          </mesh>
          <mesh position={[0, lowH + 0.08, 0.2]} castShadow>
            <boxGeometry args={[w + 0.3, 0.16, d + 0.7]} />
            <meshStandardMaterial color={design.trim} flatShading />
          </mesh>
          <mesh position={[0, lowH + 0.16 + upH / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w - 0.2, upH, d - 0.2]} />
            <meshStandardMaterial color="#9a6a42" flatShading />
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
export function VillagerHouse({ color }: { color: string }) {
  return (
    <House
      design={{
        id: 'npc',
        name: '',
        description: '',
        style: 'stilt',
        footprint: [6, 5],
        wall: color,
        roof: '#6b3a2a',
        trim: '#d9c29a',
        perks: [],
      }}
    />
  )
}
