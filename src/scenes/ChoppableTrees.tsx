import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useGame } from '../game/store'
import { useClock } from '../game/clock'
import { saplingGrowth, treeFx, treePhase } from '../game/trees'
import { TREES, type TreeSpot } from '../game/content/village'
import { TREE_RULES } from '../game/content/trees'
import type { GroundDrop, TreeState } from '../game/treeTypes'
import type { ItemId } from '../game/content/items'

/** ต้นไม้ทั้งหมู่บ้าน: ยืนต้น (สั่นเมื่อโดนฟัน มีรอยฟัน) · กำลังล้ม · ตอไม้ · ต้นกล้า + ของที่ร่วงบนพื้น */
export function ChoppableTrees({ Tree }: { Tree: (p: { tree: TreeSpot }) => React.ReactNode }) {
  const trees = useGame((s) => s.save?.trees)
  const drops = useGame((s) => s.save?.drops)
  const day = useClock((s) => s.day)
  const minute = useClock((s) => s.minute)
  const now = day * 1440 + minute
  return (
    <group>
      {TREES.map((t, i) => (
        <OneTree key={i} index={i} tree={t} st={trees?.[String(i)]} now={now} Tree={Tree} />
      ))}
      {drops?.map((d) => <Drop key={d.id} d={d} />)}
    </group>
  )
}

function OneTree({ index, tree, st, now, Tree }: { index: number; tree: TreeSpot; st?: TreeState; now: number; Tree: (p: { tree: TreeSpot }) => React.ReactNode }) {
  const phase = treePhase(st, now)
  const swayRef = useRef<Group>(null)
  const fallRef = useRef<Group>(null)
  const [x, z] = tree.pos

  useFrame(() => {
    const fx = treeFx.get(index)
    if (!fx) return
    const t = performance.now()
    // สั่นเมื่อโดนฟัน (0.4 วินาที)
    if (swayRef.current) {
      const e = fx.shakeAt ? (t - fx.shakeAt) / 1000 : 9
      const amp = e < 0.4 ? (1 - e / 0.4) * 0.05 : 0
      swayRef.current.rotation.z = Math.sin(e * 45) * amp
      swayRef.current.rotation.x = Math.cos(e * 38) * amp * 0.6
    }
    // ล้ม: ค่อย ๆ เอียงแล้วเร่งลงพื้น (1.4 วินาที) แล้วจมหายไป
    if (fallRef.current && fx.fallAt) {
      const e = (t - fx.fallAt) / 1000
      const p = Math.min(1, e / 1.4)
      fallRef.current.rotation.x = p * p * (Math.PI / 2 - 0.08)
      fallRef.current.position.y = e > 2.6 ? -(e - 2.6) * 1.5 : 0
      fallRef.current.visible = e < 3.6
    }
  })

  if (phase === 'standing') {
    const fresh = st && !st.felledAt ? st : undefined
    return (
      <group position={[x, 0, z]}>
        <group ref={swayRef}>
          <group position={[-x, 0, -z]}>
            <Tree tree={tree} />
          </group>
          {fresh && fresh.dmg > 0 && <ChopMarks st={fresh} tree={tree} />}
        </group>
      </group>
    )
  }
  const fx = treeFx.get(index)
  const falling = fx?.fallAt && performance.now() - fx.fallAt < 3600
  return (
    <group position={[x, 0, z]}>
      <Stump tree={tree} />
      {falling && (
        // หมุนรอบโคนต้นไปทางทิศที่ล้ม
        <group rotation={[0, st?.fallDir ?? 0, 0]}>
          <group ref={fallRef}>
            <group rotation={[0, -(st?.fallDir ?? 0), 0]} position={[-x, 0, -z]}>
              <Tree tree={tree} />
            </group>
          </group>
        </group>
      )}
      {phase === 'sapling' && st && <Sapling grow={saplingGrowth(st, now)} kind={tree.kind} />}
    </group>
  )
}

/** รอยฟันสีเนื้อไม้ที่โคนต้น (เพิ่มตามจำนวนครั้ง) ด้านที่ผู้เล่นยืน */
function ChopMarks({ st, tree }: { st: TreeState; tree: TreeSpot }) {
  const rule = TREE_RULES[tree.kind]
  const n = Math.min(4, Math.ceil((st.dmg / rule.hp) * 4))
  const r = (tree.kind === 'mango' ? 0.34 : tree.kind === 'coconut' ? 0.23 : 0.22) * tree.scale
  return (
    <group rotation={[0, st.mark, 0]}>
      {Array.from({ length: n }).map((_, k) => (
        <mesh key={k} position={[(k % 2 ? 0.05 : -0.05) * tree.scale, (0.45 + k * 0.07) * tree.scale, r]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.22 * tree.scale, 0.05, 0.08]} />
          <meshStandardMaterial color="#e8cf9e" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Stump({ tree }: { tree: TreeSpot }) {
  const s = tree.scale
  const r = tree.kind === 'mango' ? 0.36 : tree.kind === 'coconut' ? 0.25 : 0.23
  const bark = tree.kind === 'banana' ? '#8aa055' : tree.kind === 'coconut' ? '#8a7058' : '#6b5440'
  return (
    <group scale={s}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r * 0.95, r * 1.1, 0.44, 14]} />
        <meshStandardMaterial color={bark} roughness={0.9} />
      </mesh>
      {/* หน้าตัดไม้ + วงปี */}
      <mesh position={[0, 0.445, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r * 0.9, 18]} />
        <meshStandardMaterial color={tree.kind === 'banana' ? '#dfe8b0' : '#e2c58e'} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.447, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 0.45, r * 0.5, 18]} />
        <meshStandardMaterial color="#c9a46c" />
      </mesh>
    </group>
  )
}

function Sapling({ grow, kind }: { grow: number; kind: TreeSpot['kind'] }) {
  const s = 0.35 + grow * 0.9
  return (
    <group position={[0.45, 0, 0.2]} scale={s}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.6, 8]} />
        <meshStandardMaterial color={kind === 'banana' ? '#8aa055' : '#6b5440'} />
      </mesh>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[Math.cos(k * 2.1) * 0.1, 0.62, Math.sin(k * 2.1) * 0.1]} rotation={[0.6, k * 2.1, 0]} scale={[1, 0.3, 1.6]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshStandardMaterial color="#6fb04e" />
        </mesh>
      ))}
    </group>
  )
}

// ---------- ของที่ร่วงบนพื้น ----------
function Drop({ d }: { d: GroundDrop }) {
  const ref = useRef<Group>(null)
  const born = useRef(performance.now())
  const spin = useRef((d.id.charCodeAt(0) % 7) * 0.9)
  useFrame(() => {
    if (!ref.current) return
    const e = (performance.now() - born.current) / 1000
    // เด้งตกลงพื้นตอนเกิด แล้วลอยกระเพื่อมเบา ๆ ให้มองเห็นง่าย
    const fall = e < 0.5 ? (1 - e / 0.5) * 1.6 * Math.abs(Math.cos(e * 6)) : 0
    ref.current.position.y = fall + 0.02 + Math.max(0, Math.sin(e * 2.2 + spin.current)) * 0.03
  })
  return (
    <group position={[d.x, 0, d.z]} rotation={[0, spin.current, 0]}>
      <group ref={ref}>
        <DropModel item={d.item} />
      </group>
    </group>
  )
}

function DropModel({ item }: { item: ItemId }) {
  switch (item) {
    case 'log':
    case 'hardwood':
      return (
        <group>
          <mesh position={[0, 0.13, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.7, 12]} />
            <meshStandardMaterial color={item === 'hardwood' ? '#5a3a24' : '#8a5a36'} roughness={0.9} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.351, 0.13, 0]} rotation={[0, 0, (s * Math.PI) / 2]}>
              <circleGeometry args={[0.12, 12]} />
              <meshStandardMaterial color={item === 'hardwood' ? '#a8744a' : '#e2c08a'} />
            </mesh>
          ))}
        </group>
      )
    case 'branch':
      return (
        <group>
          <mesh position={[0, 0.04, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 0.8, 6]} />
            <meshStandardMaterial color="#7a5234" />
          </mesh>
          <mesh position={[0.15, 0.05, 0.08]} rotation={[0, 0.7, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.025, 0.35, 6]} />
            <meshStandardMaterial color="#7a5234" />
          </mesh>
        </group>
      )
    case 'leaf':
      return (
        <group>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[Math.cos(k * 2.1) * 0.12, 0.03 + k * 0.01, Math.sin(k * 2.1) * 0.12]} rotation={[-Math.PI / 2, 0, k * 1.3]} scale={[1, 1.8, 1]}>
              <circleGeometry args={[0.1, 10]} />
              <meshStandardMaterial color={k === 1 ? '#8aa83a' : '#5f9e47'} side={2} />
            </mesh>
          ))}
        </group>
      )
    case 'vine':
      return (
        <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.14, 0.04, 6, 14]} />
          <meshStandardMaterial color="#b9a46a" />
        </mesh>
      )
    case 'treat':
      return (
        <mesh position={[0, 0.07, 0]} rotation={[0, 0, 0.9]} castShadow>
          <capsuleGeometry args={[0.05, 0.2, 4, 8]} />
          <meshStandardMaterial color="#f2d24a" />
        </mesh>
      )
    case 'sapling':
      return (
        <group>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.08, 0.06, 0.12, 10]} />
            <meshStandardMaterial color="#7a5434" />
          </mesh>
          <mesh position={[0, 0.22, 0]} scale={[1, 0.6, 1]}>
            <icosahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color="#6fb04e" flatShading />
          </mesh>
        </group>
      )
    default:
      return (
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.18, 0.18, 0.18]} />
          <meshStandardMaterial color="#c9a46c" />
        </mesh>
      )
  }
}
