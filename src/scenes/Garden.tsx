import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useGame } from '../game/store'
import { useClock } from '../game/clock'
import { BED_SIZE, bedStage, GARDEN_BEDS, GARDEN_JAR, isWet, type BedState, type CropId } from '../game/content/garden'
import { RBox } from './models/RBox'
import { Windy } from './Wind'

/** แปลงผักสวนครัวหน้าบ้านผู้เล่น — ดินแห้ง/ชื้น · ต้นผักโตตามระยะ · ดาวเล็ก ๆ ลอยเหนือแปลงที่เก็บได้ */
export function Garden() {
  const garden = useGame((s) => s.save?.garden)
  const day = useClock((s) => s.day)
  const minute = useClock((s) => s.minute)
  if (!garden) return null
  const now = day * 1440 + minute
  return (
    <group>
      {GARDEN_BEDS.map(([x, z], i) => (
        <Bed key={i} x={x} z={z} bed={garden[i]} now={now} />
      ))}
      <WaterJar />
    </group>
  )
}

const SOIL_DRY = '#a77a52'
const SOIL_WET = '#6a4630'
const OFFS: [number, number][] = [
  [-0.42, -0.42],
  [0.42, -0.42],
  [-0.42, 0.42],
  [0.42, 0.42],
]

function Bed({ x, z, bed, now }: { x: number; z: number; bed?: BedState; now: number }) {
  const wet = bed ? isWet(bed, now) : false
  const stage = bed?.crop ? bedStage(bed, now) : -1
  const s = BED_SIZE
  return (
    <group position={[x, 0, z]}>
      {/* ขอบไม้รอบแปลง */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <RBox args={[s + 0.16, 0.2, s + 0.16]} />
        <meshStandardMaterial color="#8a6440" roughness={0.9} />
      </mesh>
      {/* ดินในแปลง (ชื้น = สีเข้ม) */}
      <mesh position={[0, 0.215, 0]} receiveShadow>
        <RBox args={[s - 0.06, 0.06, s - 0.06]} round={0.5} />
        <meshStandardMaterial color={wet ? SOIL_WET : SOIL_DRY} roughness={1} />
      </mesh>
      {/* ร่องดิน */}
      {[-0.42, 0.42].map((rz) => (
        <mesh key={rz} position={[0, 0.245, rz]} rotation={[0, 0, Math.PI / 2]} scale={[0.5, 1, 1]} receiveShadow>
          <capsuleGeometry args={[0.13, s - 0.5, 4, 8]} />
          <meshStandardMaterial color={wet ? '#5c3c28' : '#9a6e48'} roughness={1} />
        </mesh>
      ))}
      {bed?.crop &&
        OFFS.map(([ox, oz], k) => (
          <group key={k} position={[ox, 0.26, oz]} rotation={[0, k * 1.9, 0]}>
            <Windy h={0.8} amp={0.1} flutter={1.5}>
              <Plant crop={bed.crop!} stage={stage as 0 | 1 | 2 | 3} />
            </Windy>
          </group>
        ))}
      {stage === 3 && <ReadyStar />}
    </group>
  )
}

function ReadyStar() {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = 1.35 + Math.sin(clock.elapsedTime * 2) * 0.08
    ref.current.rotation.y = clock.elapsedTime
  })
  return (
    <group ref={ref}>
      <mesh>
        <octahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial color="#ffd95a" emissive="#ffcc33" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

const LEAF = '#5f9e47'
const LEAF_DARK = '#3f7a34'

/** ต้นผักหนึ่งต้น ตามชนิดและระยะ (0 เมล็ด · 1 งอก · 2 ต้นอ่อน · 3 พร้อมเก็บ) */
function Plant({ crop, stage }: { crop: CropId; stage: 0 | 1 | 2 | 3 }) {
  if (stage === 0) {
    return (
      <mesh position={[0, 0.02, 0]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color="#7a5434" roughness={1} />
      </mesh>
    )
  }
  if (stage === 1) {
    // ต้นงอก: ใบเลี้ยงสองใบ
    return (
      <group>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.012, 0.015, 0.12, 6]} />
          <meshStandardMaterial color={LEAF} />
        </mesh>
        {[-1, 1].map((d) => (
          <mesh key={d} position={[d * 0.05, 0.12, 0]} rotation={[0, 0, d * -0.5]} scale={[1, 0.35, 0.6]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshStandardMaterial color="#7cc25a" />
          </mesh>
        ))}
      </group>
    )
  }
  const ripe = stage === 3
  const k = ripe ? 1 : 0.65
  return <group scale={k}>{CROP_MODEL[crop](ripe)}</group>
}

const leafBall = (pos: [number, number, number], r: number, color = LEAF, sy = 0.8) => (
  <mesh position={pos} scale={[1, sy, 1]} castShadow>
    <icosahedronGeometry args={[r, 1]} />
    <meshStandardMaterial color={color} roughness={0.85} flatShading />
  </mesh>
)

const blade = (key: number, h: number, tilt: number, rotY: number, color: string, r = 0.025) => (
  <group key={key} rotation={[0, rotY, 0]}>
    <mesh position={[Math.sin(tilt) * h * 0.5, h / 2, 0]} rotation={[0, 0, -tilt]} castShadow>
      <coneGeometry args={[r, h, 6]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  </group>
)

const fruit = (key: number, pos: [number, number, number], r: number, color: string, scale: [number, number, number] = [1, 1, 1]) => (
  <mesh key={key} position={pos} scale={scale} castShadow>
    <sphereGeometry args={[r, 12, 10]} />
    <meshStandardMaterial color={color} roughness={0.45} />
  </mesh>
)

const CROP_MODEL: Record<CropId, (ripe: boolean) => React.ReactNode> = {
  // ผักบุ้ง: ยอดยาวเรียว ใบรูปหอก
  morningglory: () => <group>{[0, 1, 2, 3, 4, 5].map((i) => blade(i, 0.42, 0.35, i * 1.05, i % 2 ? LEAF : '#74b552', 0.04))}</group>,
  // ต้นหอม: หลอดตั้งตรงสีเขียวสด
  scallion: () => (
    <group>
      {[0, 1, 2, 3, 4].map((i) => blade(i, 0.45, 0.12, i * 1.26, '#6fbf4f', 0.02))}
      {fruit(9, [0, 0.03, 0], 0.045, '#f1efe2', [1, 0.8, 1])}
    </group>
  ),
  // กะเพรา: พุ่มใบเขียวเข้ม ยอดม่วงอมแดง
  basil: (ripe) => (
    <group>
      {leafBall([0, 0.2, 0], 0.17, LEAF_DARK)}
      {leafBall([0.08, 0.3, 0.04], 0.1, '#4a8a3a')}
      {ripe && [0, 1, 2].map((i) => fruit(i, [Math.cos(i * 2.1) * 0.1, 0.38, Math.sin(i * 2.1) * 0.1], 0.035, '#8a3a6a', [1, 1.8, 1]))}
    </group>
  ),
  // ตะไคร้: กอใบยาวสีเขียวอ่อน โคนขาว
  lemongrass: () => (
    <group>
      {fruit(9, [0, 0.06, 0], 0.07, '#e8e4c8', [1, 1.4, 1])}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => blade(i, 0.62, 0.3, i * 0.9, '#a6c96a', 0.03))}
    </group>
  ),
  // พริก: พุ่มเล็ก เม็ดพริกแดงห้อย
  chili: (ripe) => (
    <group>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.24, 6]} />
        <meshStandardMaterial color="#4c7a35" />
      </mesh>
      {leafBall([0, 0.3, 0], 0.16, LEAF)}
      {ripe &&
        [0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} position={[Math.cos(i * 1.3) * 0.15, 0.22, Math.sin(i * 1.3) * 0.15]} rotation={[Math.PI, 0, 0.3]} castShadow>
            <coneGeometry args={[0.022, 0.11, 8]} />
            <meshStandardMaterial color={i % 3 ? '#d6322a' : '#e8662a'} roughness={0.4} />
          </mesh>
        ))}
    </group>
  ),
  // มะเขือ (มะเขือเปราะ): พุ่มใบใหญ่ ผลกลมเขียวขาว
  eggplant: (ripe) => (
    <group>
      {leafBall([0, 0.22, 0], 0.2, '#5a8f4a')}
      {ripe && [0, 1, 2].map((i) => fruit(i, [Math.cos(i * 2.2) * 0.17, 0.14, Math.sin(i * 2.2) * 0.17], 0.06, '#d7e8b4'))}
    </group>
  ),
  // มะเขือเทศ: มีหลักไม้ค้ำ ผลแดงกลม
  tomato: (ripe) => (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.6, 6]} />
        <meshStandardMaterial color="#b08a5a" />
      </mesh>
      {leafBall([0, 0.22, 0], 0.17, LEAF)}
      {leafBall([0, 0.42, 0], 0.12, '#6aa84f')}
      {ripe && [0, 1, 2, 3].map((i) => fruit(i, [Math.cos(i * 1.6) * 0.14, 0.18 + (i % 2) * 0.18, Math.sin(i * 1.6) * 0.14], 0.055, '#e0402f'))}
    </group>
  ),
  // ฟักทอง: ใบกว้างแผ่ราบ ผลส้มลูกโต (ต้นเดียวแผ่ทั้งมุม)
  pumpkin: (ripe) => (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos(i * 2.1) * 0.14, 0.08, Math.sin(i * 2.1) * 0.14]} rotation={[-0.3, i * 2.1, 0]} scale={[1, 0.25, 1]} castShadow>
          <icosahedronGeometry args={[0.16, 1]} />
          <meshStandardMaterial color={i ? LEAF : '#4f8a3e'} flatShading />
        </mesh>
      ))}
      {ripe && (
        <group position={[0.02, 0.11, -0.02]}>
          {fruit(0, [0, 0, 0], 0.15, '#e8892e', [1, 0.72, 1])}
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.015, 0.02, 0.07, 6]} />
            <meshStandardMaterial color="#5a6a2a" />
          </mesh>
        </group>
      )}
    </group>
  ),
}

/** โอ่งน้ำข้างแปลงผัก */
function WaterJar() {
  return (
    <group position={[GARDEN_JAR[0], 0, GARDEN_JAR[1]]}>
      <mesh position={[0, 0.42, 0]} scale={[1, 1.05, 1]} castShadow receiveShadow>
        <sphereGeometry args={[0.42, 18, 14]} />
        <meshStandardMaterial color="#7a4a2c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.84, 0]}>
        <cylinderGeometry args={[0.24, 0.28, 0.1, 18]} />
        <meshStandardMaterial color="#6a3f24" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.875, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 18]} />
        <meshStandardMaterial color="#4a7a9a" roughness={0.15} />
      </mesh>
      {/* ขันตักน้ำ */}
      <mesh position={[0.2, 0.92, 0.05]} rotation={[0.2, 0, 0.3]}>
        <cylinderGeometry args={[0.09, 0.06, 0.07, 14]} />
        <meshStandardMaterial color="#c9a34a" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  )
}
