import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useGame } from '../game/store'
import { placeAt, placeProblem, snap, structureAt, useBuild } from '../game/building'
import { blockedZones, buildArea, footprint, rectOf, STRUCTURES, type PlacedStructure, type StructureId } from '../game/content/structures'
import type { Rect } from '../game/content/temple'
import { PLOTS } from '../game/content/village'
import { RBox } from './models/RBox'

/** สิ่งปลูกสร้างที่ผู้เล่นวางไว้ + เลเยอร์โหมดสร้าง */
export function Structures() {
  const list = useGame((s) => s.save?.structures)
  const active = useBuild((s) => s.active)
  if (!list) return null
  return (
    <group>
      {list.map((s) => (
        <group key={s.uid} position={[s.x, 0, s.z]} rotation={[0, (s.rot * Math.PI) / 2, 0]}>
          <StructureModel id={s.id} />
        </group>
      ))}
      {active && <BuildLayer placed={list} />}
    </group>
  )
}

// ---------- โหมดสร้าง: พื้นที่เขียว/แดง · เงาของที่จะวาง · คลิกวาง ----------
function BuildLayer({ placed }: { placed: PlacedStructure[] }) {
  const tool = useBuild((s) => s.tool)
  const rot = useBuild((s) => s.rot)
  const hover = useBuild((s) => s.hover)
  const owned = useGame((s) => s.save?.ownedPlotIds ?? [])
  const areas = useMemo(() => buildArea(owned), [owned])
  const blocked = useMemo(() => blockedZones(), [])
  const p = PLOTS[0]

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    const h: [number, number] = [snap(e.point.x), snap(e.point.z)]
    const cur = useBuild.getState().hover
    if (!cur || cur[0] !== h[0] || cur[1] !== h[1]) useBuild.setState({ hover: h })
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    // ลากเมาส์หมุนกล้อง ไม่นับเป็นคลิก
    if (e.delta > 6) return
    placeAt(snap(e.point.x), snap(e.point.z))
  }

  let ghost: React.ReactNode = null
  if (hover && tool && tool !== 'remove') {
    const ok = !placeProblem(tool, hover[0], hover[1], rot)
    const [w, d] = footprint(tool, rot)
    ghost = (
      <group position={[hover[0], 0, hover[1]]}>
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshBasicMaterial color={ok ? '#3fcf6a' : '#e0443a'} transparent opacity={0.55} depthWrite={false} />
        </mesh>
        <group rotation={[0, (rot * Math.PI) / 2, 0]}>
          <StructureModel id={tool} />
        </group>
      </group>
    )
  }
  let removeMark: React.ReactNode = null
  if (hover && tool === 'remove') {
    const hit = structureAt(hover[0], hover[1])
    if (hit) {
      const r = rectOf(hit.id, hit.x, hit.z, hit.rot)
      removeMark = <ZoneRect r={r} color="#e0443a" opacity={0.6} y={0.07} />
    }
  }

  return (
    <group>
      {/* พื้นรับเมาส์ (มองไม่เห็น) รอบที่ดิน */}
      <mesh position={[p.center[0], 0.03, p.center[1]]} rotation={[-Math.PI / 2, 0, 0]} onPointerMove={onMove} onClick={onClick}>
        <planeGeometry args={[p.size[0] + 16, p.size[1] + 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {areas.map((a, i) => (
        <ZoneRect key={'a' + i} r={a} color="#5fd37a" opacity={0.22} y={0.04} />
      ))}
      {blocked.map((b, i) => (
        <ZoneRect key={'b' + i} r={b} color="#e05a4a" opacity={0.28} y={0.045} />
      ))}
      {placed.map((s) => (
        <ZoneRect key={s.uid} r={rectOf(s.id, s.x, s.z, s.rot)} color="#e05a4a" opacity={0.22} y={0.045} />
      ))}
      {ghost}
      {removeMark}
    </group>
  )
}

function ZoneRect({ r, color, opacity, y }: { r: Rect; color: string; opacity: number; y: number }) {
  return (
    <mesh position={[(r.minX + r.maxX) / 2, y, (r.minZ + r.maxZ) / 2]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <planeGeometry args={[r.maxX - r.minX, r.maxZ - r.minZ]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

// ---------- โมเดล ----------
const WOOD = '#9a6b45'
const WOOD_DARK = '#7a5234'
const WOOD_LIGHT = '#c09468'
const BAMBOO = '#c2a560'

const Box = ({ p, s, c, r }: { p: [number, number, number]; s: [number, number, number]; c: string; r?: [number, number, number] }) => (
  <mesh position={p} rotation={r} castShadow receiveShadow>
    <RBox args={s} />
    <meshStandardMaterial color={c} roughness={0.85} />
  </mesh>
)
const Post = ({ p, h, rad = 0.07, c = BAMBOO }: { p: [number, number]; h: number; rad?: number; c?: string }) => (
  <mesh position={[p[0], h / 2, p[1]]} castShadow>
    <cylinderGeometry args={[rad, rad, h, 10]} />
    <meshStandardMaterial color={c} roughness={0.8} />
  </mesh>
)
const Rail = ({ from, to, y, rad = 0.035, c = BAMBOO }: { from: [number, number]; to: [number, number]; y: number; rad?: number; c?: string }) => {
  const len = Math.hypot(to[0] - from[0], to[1] - from[1])
  const ang = Math.atan2(to[1] - from[1], to[0] - from[0])
  return (
    <mesh position={[(from[0] + to[0]) / 2, y, (from[1] + to[1]) / 2]} rotation={[0, -ang, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[rad, rad, len, 8]} />
      <meshStandardMaterial color={c} roughness={0.8} />
    </mesh>
  )
}

export function StructureModel({ id }: { id: StructureId }) {
  switch (id) {
    case 'workbench':
      return <Workbench />
    case 'chest':
      return <Chest />
    case 'fence':
      return <FenceSeg />
    case 'scarecrow':
      return <Scarecrow />
    case 'shed':
      return <Shed />
    case 'pen':
      return <Pen />
    case 'greenhouse':
      return <Greenhouse />
  }
}

function Workbench() {
  const [w, d] = STRUCTURES.workbench.size
  return (
    <group>
      <Box p={[0, 0.85, 0]} s={[w, 0.12, d]} c={WOOD_LIGHT} />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} p={[sx * (w / 2 - 0.1), 0.4, sz * (d / 2 - 0.1)]} s={[0.12, 0.8, 0.12]} c={WOOD} />))}
      <Box p={[0, 0.25, 0]} s={[w - 0.2, 0.06, d - 0.2]} c={WOOD} />
      {/* ไม้ท่อนกับก้อนหินบนชั้นล่าง */}
      <mesh position={[-0.35, 0.36, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.6, 10]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      <mesh position={[0.4, 0.34, 0.05]} castShadow>
        <dodecahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial color="#8d8a84" />
      </mesh>
      {/* ค้อน + เลื่อยบนโต๊ะ */}
      <group position={[0.3, 0.93, 0.05]} rotation={[0, 0.5, 0]}>
        <Box p={[0, 0.02, 0]} s={[0.36, 0.04, 0.05]} c={WOOD_DARK} />
        <Box p={[0.18, 0.04, 0]} s={[0.06, 0.08, 0.14]} c="#6b6e72" />
      </group>
      <mesh position={[-0.35, 0.925, -0.1]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <planeGeometry args={[0.5, 0.14]} />
        <meshStandardMaterial color="#c9ccd0" metalness={0.5} roughness={0.4} side={2} />
      </mesh>
    </group>
  )
}

function Chest() {
  const [w, d] = STRUCTURES.chest.size
  return (
    <group>
      <Box p={[0, 0.25, 0]} s={[w, 0.5, d]} c={WOOD} />
      <Box p={[0, 0.54, 0]} s={[w + 0.04, 0.1, d + 0.04]} c={WOOD_DARK} />
      {[-0.3, 0.3].map((x) => (
        <Box key={x} p={[x, 0.3, 0]} s={[0.06, 0.62, d + 0.06]} c="#5d5a55" />
      ))}
      <Box p={[0, 0.42, d / 2 + 0.03]} s={[0.12, 0.12, 0.03]} c="#d1a64a" />
    </group>
  )
}

function FenceSeg() {
  return (
    <group>
      <Post p={[-0.95, 0]} h={1} />
      <Post p={[0, 0]} h={0.95} rad={0.05} />
      <Post p={[0.95, 0]} h={1} />
      <Rail from={[-1, 0]} to={[1, 0]} y={0.4} />
      <Rail from={[-1, 0]} to={[1, 0]} y={0.75} />
    </group>
  )
}

function Scarecrow() {
  return (
    <group>
      <Post p={[0, 0]} h={1.7} rad={0.04} c={WOOD} />
      <Rail from={[-0.45, 0]} to={[0.45, 0]} y={1.25} rad={0.03} c={WOOD} />
      {/* เสื้อม่อฮ่อม */}
      <Box p={[0, 1.1, 0]} s={[0.42, 0.45, 0.2]} c="#2f4a7a" />
      <Box p={[-0.33, 1.25, 0]} s={[0.26, 0.12, 0.14]} c="#2f4a7a" />
      <Box p={[0.33, 1.25, 0]} s={[0.26, 0.12, 0.14]} c="#2f4a7a" />
      {/* ผ้าขาวม้า */}
      <Box p={[0, 0.92, 0]} s={[0.44, 0.07, 0.22]} c="#d0503e" />
      <mesh position={[0, 1.48, 0]} castShadow>
        <sphereGeometry args={[0.14, 12, 10]} />
        <meshStandardMaterial color="#e2c27a" roughness={1} />
      </mesh>
      {/* งอบ */}
      <mesh position={[0, 1.63, 0]} castShadow>
        <coneGeometry args={[0.3, 0.16, 16]} />
        <meshStandardMaterial color="#cfae6b" roughness={1} />
      </mesh>
    </group>
  )
}

function Shed() {
  const [w, d] = STRUCTURES.shed.size
  const h = 2.1
  return (
    <group>
      <Box p={[0, 0.06, 0]} s={[w, 0.12, d]} c={WOOD_DARK} />
      {/* ผนังหลังและข้าง (หน้าเปิดโล่ง หันไป +z) */}
      <Box p={[0, h / 2, -d / 2 + 0.05]} s={[w, h, 0.1]} c={WOOD} />
      <Box p={[-w / 2 + 0.05, h / 2, 0]} s={[0.1, h, d]} c={WOOD} />
      <Box p={[w / 2 - 0.05, h / 2, 0]} s={[0.1, h, d]} c={WOOD} />
      {/* หลังคาสังกะสีเอียง */}
      <Box p={[0, h + 0.2, 0.1]} s={[w + 0.4, 0.06, d + 0.6]} c="#9aa3a8" r={[0.18, 0, 0]} />
      {/* ฟืนกองกับเครื่องมือ */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.7, 0.25 + i * 0.16, -d / 2 + 0.45]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.9, 8]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      <Box p={[0.8, 0.8, -d / 2 + 0.14]} s={[0.05, 1.2, 0.05]} c={WOOD_LIGHT} r={[0, 0, 0.12]} />
      <Box p={[0.9, 1.35, -d / 2 + 0.14]} s={[0.22, 0.1, 0.04]} c="#6b6e72" />
    </group>
  )
}

function Pen() {
  const [w, d] = STRUCTURES.pen.size
  const gate = 0.7
  const posts: [number, number][] = []
  for (let x = -w / 2; x <= w / 2 + 0.01; x += 1) posts.push([x, -d / 2])
  for (let z = -d / 2 + 1; z <= d / 2 + 0.01; z += 1) posts.push([-w / 2, z], [w / 2, z])
  posts.push([-gate, d / 2], [gate, d / 2], [-w / 2 + 1, d / 2], [w / 2 - 1, d / 2])
  const rails: [[number, number], [number, number]][] = [
    [[-w / 2, -d / 2], [w / 2, -d / 2]],
    [[-w / 2, -d / 2], [-w / 2, d / 2]],
    [[w / 2, -d / 2], [w / 2, d / 2]],
    [[-w / 2, d / 2], [-gate, d / 2]],
    [[gate, d / 2], [w / 2, d / 2]],
  ]
  return (
    <group>
      {posts.map((p, i) => (
        <Post key={i} p={p} h={1.1} rad={0.08} c={WOOD} />
      ))}
      {rails.flatMap(([a, b], i) => [0.45, 0.85].map((y) => <Rail key={`${i}-${y}`} from={a} to={b} y={y} rad={0.045} c={WOOD_LIGHT} />))}
      {/* พื้นดินในคอก + รางน้ำ + กองฟาง */}
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow raycast={() => null}>
        <planeGeometry args={[w - 0.2, d - 0.2]} />
        <meshStandardMaterial color="#b08a5e" roughness={1} />
      </mesh>
      <Box p={[w / 2 - 0.7, 0.18, -d / 2 + 0.5]} s={[1, 0.3, 0.4]} c={WOOD_DARK} />
      <mesh position={[w / 2 - 0.7, 0.32, -d / 2 + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.85, 0.28]} />
        <meshStandardMaterial color="#5c8fb0" roughness={0.2} />
      </mesh>
      <mesh position={[-w / 2 + 0.8, 0.25, -d / 2 + 0.8]} scale={[1.3, 0.6, 1]} castShadow>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshStandardMaterial color="#e2c56a" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

function Greenhouse() {
  const [w, d] = STRUCTURES.greenhouse.size
  const h = 2.3
  const corners: [number, number][] = [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [-w / 2, d / 2],
    [w / 2, d / 2],
    [0, -d / 2],
    [0, d / 2],
  ]
  return (
    <group>
      {corners.map((p, i) => (
        <Post key={i} p={p} h={h} rad={0.06} c={WOOD} />
      ))}
      <Rail from={[-w / 2, -d / 2]} to={[w / 2, -d / 2]} y={h} rad={0.05} c={WOOD} />
      <Rail from={[-w / 2, d / 2]} to={[w / 2, d / 2]} y={h} rad={0.05} c={WOOD} />
      {/* ตาข่ายพรางแสง (สแลน) หลังคา + ผนังด้านหลัง */}
      <mesh position={[0, h + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[w + 0.2, d + 0.2]} />
        <meshStandardMaterial color="#2c3a2e" transparent opacity={0.55} side={2} depthWrite={false} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2]} raycast={() => null}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#2c3a2e" transparent opacity={0.4} side={2} depthWrite={false} />
      </mesh>
      {/* ชั้นวางกระถางต้นกล้า */}
      <Box p={[0, 0.55, -d / 2 + 0.5]} s={[w - 0.6, 0.08, 0.6]} c={WOOD_LIGHT} />
      {[-1.2, -0.4, 0.4, 1.2].map((x) => (
        <group key={x} position={[x, 0.65, -d / 2 + 0.5]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.08, 0.14, 10]} />
            <meshStandardMaterial color="#b4583a" />
          </mesh>
          <mesh position={[0, 0.13, 0]} scale={[1, 0.8, 1]}>
            <icosahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color="#6aa84f" flatShading />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((sx) => (
        <Box key={sx} p={[sx * (w / 2 - 0.45), 0.27, -d / 2 + 0.5]} s={[0.08, 0.5, 0.08]} c={WOOD} />
      ))}
    </group>
  )
}
