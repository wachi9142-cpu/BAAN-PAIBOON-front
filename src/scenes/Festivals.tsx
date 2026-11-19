import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh, PointLight } from 'three'
import { FEST_POS, findFestSpot, refreshFestivals, useFestival } from '../game/festival'
import { exactMinute } from '../game/clock'
import { PLACES } from '../game/content/village'
import { playerPose } from '../game/playerPose'
import { RBox } from './models/RBox'

const night = () => {
  const m = exactMinute()
  return m < 6 * 60 || m > 18 * 60
}

/**
 * ของตกแต่งหมู่บ้านตามเทศกาล (เปลี่ยนเองตามปฏิทิน) + ตรวจจุดกิจกรรมใกล้ผู้เล่น
 */
export function Festivals() {
  const active = useFestival((s) => s.active)
  const tick = useRef(0)
  useEffect(() => refreshFestivals(), [])
  useFrame((_, dt) => {
    tick.current += dt
    if (tick.current < 0.25) return
    tick.current = 0
    refreshFestivals()
    const s = findFestSpot(playerPose.x, playerPose.z)
    const cur = useFestival.getState().near
    if (s?.id !== cur?.id) useFestival.setState({ near: s })
  })
  const has = (id: string) => active.includes(id as never)
  return (
    <group>
      {(has('newyear') || has('templefair') || has('loykrathong')) && <RoadLights />}
      {has('loykrathong') && <LoyKrathong />}
      {has('songkran') && <Songkran />}
      {has('harvest') && <Harvest />}
      {has('planting') && <Planting />}
      {has('templefair') && <TempleFair />}
      {has('newyear') && <Fireworks />}
    </group>
  )
}

/* ---------- ไฟประดับตามถนนใหญ่ ---------- */
function RoadLights() {
  const bulbs = useRef<Mesh[]>([])
  const cols = ['#ff5a5a', '#ffd23a', '#5ad06a', '#4aa8ff', '#ff8ad8']
  const poles = useMemo(() => Array.from({ length: 13 }, (_, i) => -48 + i * 8), [])
  useFrame(() => {
    const on = night()
    bulbs.current.forEach((b) => {
      if (!b) return
      const m = b.material as unknown as { emissiveIntensity: number }
      m.emissiveIntensity = on ? 0.9 : 0.1
    })
  })
  let k = 0
  return (
    <group>
      {[-4.2, 4.2].map((z) =>
        poles.map((x, i) => (
          <group key={z + ':' + x}>
            <mesh position={[x, 1.6, z]}>
              <cylinderGeometry args={[0.05, 0.06, 3.2, 6]} />
              <meshStandardMaterial color="#6b5440" />
            </mesh>
            {i < poles.length - 1 &&
              Array.from({ length: 7 }, (_, j) => {
                const t = (j + 1) / 8
                const sag = Math.sin(t * Math.PI) * 0.5
                const idx = k++
                return (
                  <mesh key={j} ref={(el) => void (el && (bulbs.current[idx] = el))} position={[x + t * 8, 3.1 - sag, z]}>
                    <sphereGeometry args={[0.09, 8, 6]} />
                    <meshStandardMaterial color={cols[idx % cols.length]} emissive={cols[idx % cols.length]} emissiveIntensity={0.15} />
                  </mesh>
                )
              })}
          </group>
        )),
      )}
    </group>
  )
}

/* ---------- ลอยกระทง ---------- */
function Krathong({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.32, 0.26, 0.14, 12]} />
        <meshStandardMaterial color="#5a8a3a" />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 0.24, 0.2, Math.sin((i / 8) * Math.PI * 2) * 0.24]} rotation={[0, -(i / 8) * Math.PI * 2, 0.5]}>
          <coneGeometry args={[0.07, 0.18, 4]} />
          <meshStandardMaterial color="#6fa040" />
        </mesh>
      ))}
      <mesh position={[0, 0.24, 0]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshStandardMaterial color="#f28ab0" />
      </mesh>
      <mesh position={[0.06, 0.4, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.22, 6]} />
        <meshStandardMaterial color="#f6efe0" />
      </mesh>
      <mesh position={[0.06, 0.53, 0]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshStandardMaterial color="#ffcc66" emissive="#ffaa33" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

function LoyKrathong() {
  const p = PLACES.find((q) => q.id === 'pond')!
  const [sx, sz] = FEST_POS.krathongStall()
  const [dx, dz] = FEST_POS.floatDock()
  const floated = useFestival((s) => s.floated)
  const ambient = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({ x: p.pos[0] + (Math.random() - 0.5) * (p.size[0] - 5), z: p.pos[1] + (Math.random() - 0.5) * (p.size[1] - 4), ph: i })),
    [p],
  )
  const amb = useRef<Group>(null)
  const mine = useRef<Group>(null)
  const light = useRef<PointLight>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const n = night()
    if (amb.current) {
      amb.current.visible = n
      amb.current.children.forEach((c, i) => {
        c.position.y = 0.02 + Math.sin(t * 1.3 + i) * 0.03
        c.position.x = ambient[i].x + Math.sin(t * 0.1 + i) * 1.2
      })
    }
    // กระทงของผู้เล่น: ค่อย ๆ ลอยออกกลางบ่อ
    if (mine.current)
      mine.current.children.forEach((c, i) => {
        const f = floated[i]
        if (!f) return
        const age = (performance.now() - f.t) / 1000
        c.position.set(f.x + Math.sin(age * 0.2 + i) * 2, 0.02 + Math.sin(age * 1.4) * 0.03, Math.min(p.pos[1] + 2, f.z + age * 0.25))
      })
    if (light.current) light.current.intensity = n ? 6 : 0
  })
  const lanterns = useMemo(() => Array.from({ length: 12 }, (_, i) => [p.pos[0] + Math.cos((i / 12) * Math.PI * 2) * (p.size[0] / 2 + 1.5), p.pos[1] + Math.sin((i / 12) * Math.PI * 2) * (p.size[1] / 2 + 1.5)] as const), [p])
  return (
    <group>
      {/* โคมไฟรอบบ่อ */}
      {lanterns.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
            <meshStandardMaterial color="#6b5440" />
          </mesh>
          <mesh position={[0, 1.9, 0]}>
            <sphereGeometry args={[0.22, 10, 8]} />
            <meshStandardMaterial color={i % 2 ? '#ffb347' : '#ff7a5a'} emissive={i % 2 ? '#ff9a2a' : '#ff5a3a'} emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
      <pointLight ref={light} position={[p.pos[0], 3, p.pos[1]]} color="#ffb060" distance={22} intensity={0} />
      {/* ซุ้มทำกระทง */}
      <group position={[sx, 0, sz]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <RBox args={[2.4, 0.9, 1]} radius={0.06} />
          <meshStandardMaterial color="#8a5a32" />
        </mesh>
        {[-1.1, 1.1].map((x) => (
          <mesh key={x} position={[x, 1.3, -0.4]}>
            <cylinderGeometry args={[0.05, 0.05, 2.6, 6]} />
            <meshStandardMaterial color="#6b4a2e" />
          </mesh>
        ))}
        <mesh position={[0, 2.6, -0.2]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[2.8, 0.06, 1.4]} />
          <meshStandardMaterial color="#c94a3a" />
        </mesh>
        {[-0.7, 0, 0.7].map((x) => (
          <Krathong key={x} x={x} z={0} scale={0.9} />
        ))}
      </group>
      {/* ท่าน้ำลอยกระทง */}
      <mesh position={[dx, 0.12, dz + 0.3]}>
        <boxGeometry args={[1.8, 0.12, 1.4]} />
        <meshStandardMaterial color="#9a7448" />
      </mesh>
      <group ref={amb}>
        {ambient.map((a, i) => (
          <Krathong key={i} x={a.x} z={a.z} scale={0.8} />
        ))}
      </group>
      <group ref={mine}>
        {floated.map((f, i) => (
          <Krathong key={i} x={f.x} z={f.z} />
        ))}
      </group>
    </group>
  )
}

/* ---------- สงกรานต์ ---------- */
function Songkran() {
  const [bx, bz] = FEST_POS.barrels()
  const ver = useFestival((s) => s.ver)
  const splash = useRef<Group>(null)
  const born = useRef(0)
  useEffect(() => {
    born.current = performance.now()
  }, [ver])
  useFrame(() => {
    const g = splash.current
    if (!g) return
    const age = (performance.now() - born.current) / 1000
    g.visible = age < 1.2
    g.position.set(playerPose.x, 0, playerPose.z)
    g.children.forEach((c, i) => {
      const a = (i / g.children.length) * Math.PI * 2
      c.position.set(Math.cos(a) * age * 1.6, 1.2 + age * 2.2 - age * age * 4, Math.sin(a) * age * 1.6)
    })
  })
  return (
    <group>
      {[0, 1.4, 2.8].map((o, i) => (
        <group key={i} position={[bx, 0, bz - o]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.34, 0.9, 16]} />
            <meshStandardMaterial color={['#2f7ac9', '#e85a5a', '#3aa65a'][i]} />
          </mesh>
          <mesh position={[0, 0.91, 0]}>
            <cylinderGeometry args={[0.34, 0.34, 0.02, 16]} />
            <meshStandardMaterial color="#9ad4f0" transparent opacity={0.85} />
          </mesh>
          <mesh position={[0.3, 0.95, 0]}>
            <cylinderGeometry args={[0.13, 0.09, 0.08, 12]} />
            <meshStandardMaterial color="#d8d8d0" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* เจดีย์ทรายหน้าวัด */}
      {[-5, 5].map((x) => (
        <group key={x} position={[x, 0, -37.5]}>
          <mesh position={[0, 0.35, 0]}>
            <coneGeometry args={[0.7, 1.2, 8]} />
            <meshStandardMaterial color="#e2cf9a" />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <boxGeometry args={[0.03, 0.4, 0.2]} />
            <meshStandardMaterial color="#e85a5a" />
          </mesh>
        </group>
      ))}
      <group ref={splash} visible={false}>
        {Array.from({ length: 14 }, (_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.07, 6, 5]} />
            <meshStandardMaterial color="#bfe6ff" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/* ---------- ฟ่อนข้าว ลานตากข้าว ---------- */
function Sheaf({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <coneGeometry args={[0.32, 0.9, 7]} />
        <meshStandardMaterial color="#d8b04a" flatShading />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <torusGeometry args={[0.18, 0.03, 5, 10]} />
        <meshStandardMaterial color="#8a6a2a" />
      </mesh>
    </group>
  )
}
function Harvest() {
  const f = PLACES.find((p) => p.id === 'farm-soi2')!
  const home = PLACES.find((p) => p.id === 'home-tarang')!
  // เสื่อตากข้าวในบ้านฟ่างเอาออกแล้ว (ผู้สร้าง 19 พ.ย.) · กองฟ่อนข้าวยังอยู่
  const mats: [number, number][] = [[f.pos[0] - 6, f.pos[1] + 6]]
  const sheafSpots: [number, number][] = [...mats, [home.pos[0] + 6, home.pos[1] + 2]]
  const sheaves = useMemo(() => {
    const out: [number, number][] = []
    for (const [cx, cz] of sheafSpots) for (let i = 0; i < 6; i++) out.push([cx + 3 + (i % 3) * 0.8, cz - 1 + Math.floor(i / 3) * 0.9])
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <group>
      {mats.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.6, 2.4]} />
            <meshStandardMaterial color="#c9a46a" />
          </mesh>
          <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.2, 2]} />
            <meshStandardMaterial color="#e8c860" roughness={1} />
          </mesh>
        </group>
      ))}
      {sheaves.map(([x, z], i) => (
        <Sheaf key={i} x={x} z={z} />
      ))}
    </group>
  )
}
function Planting() {
  const f = PLACES.find((p) => p.id === 'farm-soi2')!
  return (
    <group position={[f.pos[0] + 6, 0, f.pos[1] + 6]}>
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i} position={[(i % 4) * 0.7, 0, Math.floor(i / 4) * 0.7]}>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[Math.cos(k * 2) * 0.06, 0.2, Math.sin(k * 2) * 0.06]} rotation={[Math.cos(k * 2) * 0.2, 0, Math.sin(k * 2) * 0.2]}>
              <coneGeometry args={[0.05, 0.4, 4]} />
              <meshStandardMaterial color="#7cc24a" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/* ---------- งานวัด ---------- */
function TempleFair() {
  const wheel = useRef<Group>(null)
  const [bx, bz] = FEST_POS.fairBooth()
  useFrame((_, dt) => {
    if (wheel.current) wheel.current.rotation.z += dt * 0.25
  })
  return (
    <group>
      {/* ซุ้มปาลูกโป่ง */}
      <group position={[bx, 0, bz]}>
        <mesh position={[0, 1.4, -0.6]}>
          <boxGeometry args={[2.4, 2.2, 0.1]} />
          <meshStandardMaterial color="#3a5a9a" />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} position={[-0.9 + (i % 4) * 0.6, 0.8 + Math.floor(i / 4) * 0.55, -0.5]}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshStandardMaterial color={['#ff5a5a', '#ffd23a', '#5ad06a', '#ff8ad8'][i % 4]} />
          </mesh>
        ))}
        <mesh position={[0, 0.5, 0.4]}>
          <RBox args={[2.4, 1, 0.5]} radius={0.05} />
          <meshStandardMaterial color="#c94a3a" />
        </mesh>
      </group>
      {/* ชิงช้าสวรรค์เล็ก */}
      <group position={[-14, 0, -36]}>
        {[-0.6, 0.6].map((z) => (
          <mesh key={z} position={[0, 2.4, z]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.12, 4.8, 0.12]} />
            <meshStandardMaterial color="#c0c4c8" metalness={0.5} />
          </mesh>
        ))}
        <group ref={wheel} position={[0, 4.4, 0]}>
          <mesh>
            <torusGeometry args={[2.6, 0.06, 6, 32]} />
            <meshStandardMaterial color="#f2c94c" emissive="#f2a94c" emissiveIntensity={0.4} />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <group key={i} rotation={[0, 0, (i / 8) * Math.PI * 2]}>
              <mesh position={[0, 1.3, 0]}>
                <boxGeometry args={[0.05, 2.6, 0.05]} />
                <meshStandardMaterial color="#c0c4c8" />
              </mesh>
              <mesh position={[0, 2.6, 0]}>
                <boxGeometry args={[0.5, 0.45, 0.5]} />
                <meshStandardMaterial color={['#e85a5a', '#4aa8ff', '#5ad06a', '#ffd23a'][i % 4]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
      {/* ธงทิว */}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} position={[-15 + i * 2, 3.2 - Math.sin((i % 8) / 8 * Math.PI) * 0.3, -38.5]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.25, 0.45, 3]} />
          <meshStandardMaterial color={['#e85a5a', '#ffd23a', '#4aa8ff', '#5ad06a'][i % 4]} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- พลุปีใหม่ (กลางคืน) ---------- */
function Fireworks() {
  const g = useRef<Group>(null)
  const st = useRef({ t: 0, x: 0, z: -40, c: 0 })
  const cols = ['#ff5a5a', '#ffd23a', '#5ad06a', '#4aa8ff', '#ff8ad8']
  useFrame((_, dt) => {
    const grp = g.current
    if (!grp) return
    grp.visible = night()
    if (!grp.visible) return
    const s = st.current
    s.t += dt
    if (s.t > 2.2) {
      s.t = 0
      s.x = (Math.random() - 0.5) * 50
      s.z = -40 + (Math.random() - 0.5) * 30
      s.c = Math.floor(Math.random() * cols.length)
      grp.children.forEach((c) => (((c as Mesh).material as unknown as { color: { set: (v: string) => void } }).color.set(cols[s.c])))
    }
    const r = Math.min(1, s.t / 0.8) * 6
    grp.children.forEach((c, i) => {
      const a = (i / grp.children.length) * Math.PI * 2
      const b = ((i * 7) % grp.children.length) / grp.children.length * Math.PI - Math.PI / 2
      c.position.set(s.x + Math.cos(a) * Math.cos(b) * r, 28 + Math.sin(b) * r - s.t * s.t * 1.2, s.z + Math.sin(a) * Math.cos(b) * r)
      c.scale.setScalar(Math.max(0.01, 1 - s.t / 2.2))
    })
  })
  return (
    <group ref={g}>
      {Array.from({ length: 40 }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.25, 6, 5]} />
          <meshBasicMaterial color="#ffd23a" fog={false} />
        </mesh>
      ))}
    </group>
  )
}
