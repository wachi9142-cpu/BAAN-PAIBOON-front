import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh, MeshBasicMaterial } from 'three'
import { useGame } from '../game/store'
import { useClock } from '../game/clock'
import { chestFx, isEmpty } from '../game/treasure'
import { CHEST_SPOTS, type ChestKind, type ChestSpot } from '../game/content/treasure'
import { RBox } from './models/RBox'
import { Bush } from './models/House'

/** หีบสมบัติทั้งหมู่บ้าน */
export function Treasures() {
  useGame((s) => s.save?.chestsOpened)
  useClock((s) => s.day)
  return (
    <group>
      {CHEST_SPOTS.map((c) => (
        <Chest key={c.id} spot={c} empty={isEmpty(c)} />
      ))}
    </group>
  )
}

const W = 1.1
const H = 0.55
const D = 0.72

interface Style {
  wood: string
  band: string
  metal: number
  lock: string
  gem?: string
}
const STYLES: Record<ChestKind, Style> = {
  wood: { wood: '#8a5a34', band: '#4d4d52', metal: 0.5, lock: '#5b5c60' },
  iron: { wood: '#55595f', band: '#2f3236', metal: 0.75, lock: '#3a3c40' },
  magic: { wood: '#8a5a34', band: '#d4a843', metal: 0.8, lock: '#d4a843', gem: '#b46bff' },
  ancient: { wood: '#4e3424', band: '#8a7a4a', metal: 0.6, lock: '#9a8a52' },
  secret: { wood: '#6e5a3a', band: '#6a6a48', metal: 0.3, lock: '#7a7050' },
}

function Chest({ spot, empty }: { spot: ChestSpot; empty: boolean }) {
  const st = STYLES[spot.kind]
  const lid = useRef<Group>(null)
  const sparks = useRef<Group>(null)
  const glow = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    const t0 = chestFx.get(spot.id)
    const e = t0 ? (performance.now() - t0) / 1000 : 99
    // ฝาเปิด: เด้งขึ้นเร็วแล้วค้างไว้ (หีบว่าง = เปิดค้าง)
    const target = empty ? -1.85 : 0
    if (lid.current) {
      if (e < 0.6) lid.current.rotation.x = -1.85 * Math.sin((e / 0.6) * (Math.PI / 2)) * (1 + 0.15 * Math.sin(e * 12) * (1 - e / 0.6))
      else lid.current.rotation.x += (target - lid.current.rotation.x) * 0.1
    }
    // ประกายพุ่งขึ้นจากหีบตอนเปิด
    if (sparks.current) {
      sparks.current.visible = e < 2
      sparks.current.children.forEach((m, i) => {
        const a = (i / sparks.current!.children.length) * Math.PI * 2
        const r = 0.15 + e * 0.5
        m.position.set(Math.cos(a) * r * 0.6, 0.6 + e * (1.1 + (i % 3) * 0.3), Math.sin(a) * r * 0.6)
        ;((m as Mesh).material as MeshBasicMaterial).opacity = Math.max(0, 1 - e / 2)
      })
    }
    // หีบเวทมนตร์: แสงม่วงเรืองตรงร่องฝา
    if (glow.current) {
      const mat = glow.current.material as MeshBasicMaterial
      mat.opacity = empty ? 0.15 : 0.55 + Math.sin(clock.elapsedTime * 3) * 0.25
    }
  })

  return (
    <group position={[spot.pos[0], 0, spot.pos[1]]} rotation={[0, spot.rot, 0]}>
      {spot.kind === 'secret' && (
        <>
          <Bush x={-0.9} z={-0.3} s={1.1} flowers={null} />
          <Bush x={0.85} z={-0.45} s={0.9} flowers="#c99af0" />
        </>
      )}
      {/* ตัวหีบ */}
      <mesh position={[0, H / 2 + (spot.kind === 'iron' ? 0.08 : 0), 0]} castShadow receiveShadow>
        <RBox args={[W, H, D]} radius={0.05} />
        <meshStandardMaterial color={st.wood} roughness={spot.kind === 'iron' ? 0.45 : 0.85} metalness={spot.kind === 'iron' ? 0.5 : 0} />
      </mesh>
      {/* ร่องไม้แนวนอน */}
      {spot.kind !== 'iron' &&
        [0.18, 0.36].map((y) => (
          <mesh key={y} position={[0, y, D / 2 + 0.003]}>
            <planeGeometry args={[W - 0.06, 0.012]} />
            <meshBasicMaterial color="#3a2414" transparent opacity={0.5} />
          </mesh>
        ))}
      {/* สายรัดโลหะแนวตั้ง + มุม */}
      {[-0.38, 0.38].map((x) => (
        <mesh key={x} position={[x, H / 2 + (spot.kind === 'iron' ? 0.08 : 0), 0]} castShadow>
          <RBox args={[0.09, H + 0.02, D + 0.03]} radius={0.02} />
          <meshStandardMaterial color={st.band} metalness={st.metal} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.06 + (spot.kind === 'iron' ? 0.08 : 0), 0]}>
        <RBox args={[W + 0.03, 0.07, D + 0.03]} radius={0.02} />
        <meshStandardMaterial color={st.band} metalness={st.metal} roughness={0.4} />
      </mesh>
      {/* ขาหีบเหล็ก + หมุดย้ำ */}
      {spot.kind === 'iron' && (
        <>
          {[-1, 1].flatMap((sx) =>
            [-1, 1].map((sz) => (
              <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.08), 0.05, sz * (D / 2 - 0.08)]} castShadow>
                <RBox args={[0.16, 0.1, 0.16]} radius={0.03} />
                <meshStandardMaterial color="#2a2c30" metalness={0.7} roughness={0.4} />
              </mesh>
            )),
          )}
          {[-0.45, -0.22, 0.22, 0.45].flatMap((x) =>
            [0.2, 0.45].map((y) => (
              <mesh key={`${x}${y}`} position={[x, y + 0.08, D / 2 + 0.01]}>
                <sphereGeometry args={[0.018, 8, 6]} />
                <meshStandardMaterial color="#8a8d92" metalness={0.8} roughness={0.3} />
              </mesh>
            )),
          )}
        </>
      )}
      {/* ลายแกะไทย (หีบโบราณ): ลายกนกนูนทองเหลืองหม่น */}
      {spot.kind === 'ancient' &&
        [-0.2, 0.2].map((x) => (
          <group key={x} position={[x, 0.28, D / 2 + 0.02]}>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <RBox args={[0.12, 0.12, 0.02]} radius={0.01} />
              <meshStandardMaterial color={st.band} metalness={0.6} roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <coneGeometry args={[0.04, 0.1, 6]} />
              <meshStandardMaterial color={st.band} metalness={0.6} roughness={0.45} />
            </mesh>
          </group>
        ))}
      {/* แผ่นกุญแจ + แม่กุญแจ */}
      <group position={[0, H - 0.04 + (spot.kind === 'iron' ? 0.08 : 0), D / 2 + 0.03]}>
        <mesh>
          <RBox args={[0.2, 0.22, 0.03]} radius={0.012} />
          <meshStandardMaterial color={st.lock} metalness={st.metal} roughness={0.35} />
        </mesh>
        {!empty && (
          <mesh position={[0, -0.14, 0.03]}>
            <RBox args={[0.13, 0.12, 0.05]} radius={0.02} />
            <meshStandardMaterial color={st.lock} metalness={st.metal} roughness={0.35} />
          </mesh>
        )}
        {st.gem && (
          <mesh position={[0, 0.02, 0.03]} scale={[0.7, 1, 0.5]}>
            <octahedronGeometry args={[0.06, 0]} />
            <meshStandardMaterial color={st.gem} emissive={st.gem} emissiveIntensity={1.2} />
          </mesh>
        )}
      </group>
      {/* ฝาโค้ง (บานพับด้านหลัง) */}
      <group ref={lid} position={[0, H + (spot.kind === 'iron' ? 0.08 : 0), -D / 2]}>
        <group position={[0, 0, D / 2]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[D / 2, D / 2, W, 20, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color={st.wood} roughness={spot.kind === 'iron' ? 0.45 : 0.85} metalness={spot.kind === 'iron' ? 0.5 : 0} side={2} />
          </mesh>
          {[-0.38, 0.38].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <torusGeometry args={[D / 2 + 0.012, 0.03, 6, 20, Math.PI]} />
              <meshStandardMaterial color={st.band} metalness={st.metal} roughness={0.4} />
            </mesh>
          ))}
          {spot.kind === 'secret' &&
            [-0.25, 0.1, 0.35].map((x, i) => (
              <mesh key={x} position={[x, 0.08, 0]} rotation={[0, Math.PI / 2, i * 0.2]}>
                <torusGeometry args={[D / 2 + 0.03, 0.022, 5, 16, Math.PI * 0.9]} />
                <meshStandardMaterial color={i % 2 ? '#5e9a48' : '#4a7d3a'} roughness={0.9} />
              </mesh>
            ))}
        </group>
      </group>
      {/* หีบเวทมนตร์: แสงม่วงลอดร่องฝา */}
      {spot.kind === 'magic' && (
        <mesh ref={glow} position={[0, H + 0.005, 0]}>
          <boxGeometry args={[W + 0.02, 0.03, D + 0.02]} />
          <meshBasicMaterial color="#c58bff" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      )}
      {/* มอสบนหีบลับ */}
      {spot.kind === 'secret' && (
        <mesh position={[-0.3, 0.06, D / 2 - 0.05]} scale={[1.4, 0.4, 0.6]}>
          <icosahedronGeometry args={[0.16, 1]} />
          <meshStandardMaterial color="#5e8a3a" roughness={1} flatShading />
        </mesh>
      )}
      {/* ประกายตอนเปิด */}
      <group ref={sparks} visible={false}>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i}>
            <octahedronGeometry args={[0.05, 0]} />
            <meshBasicMaterial color={i % 3 === 0 ? '#ffe27a' : spot.kind === 'magic' ? '#d6b0ff' : '#fff6c8'} transparent opacity={1} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
