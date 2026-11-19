import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Object3D, type Group, type InstancedMesh, type Mesh, type Points, type PointsMaterial } from 'three'
import {
  BANYAN_POS,
  CAIRN_POS,
  FOREST,
  FOREST_BUSHES,
  FOREST_TREES,
  HERB_SPOTS,
  SHED_POS,
  SHRINE_POS,
  SPRING_POS,
  THORNS,
  TRAILS,
  type V2,
} from '../game/content/forest'
import { forestTick, hasAmulet, herbReady, isNight, useForest } from '../game/forest'
import { useGame } from '../game/store'
import { useClock } from '../game/clock'
import { playerPose } from '../game/playerPose'

/**
 * ป่าดงลึก (นอกหมู่บ้าน ฝั่งตะวันตก) — เดินต่อจากปลายถนนใหญ่เข้าไปได้เลย
 * ต้นไม้วาดแบบ instanced (ไม่กินเครื่อง) · ทางดินหลัก + ทางแยก · ศาลเก่าใต้ต้นไทรใหญ่ปลายทาง
 * กลางคืน: หิ่งห้อยตามทางลับหลังศาล + แสงวิญญาณลอยรอบศาล
 */
const dummy = new Object3D()

function rnd(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

export function DeepForest() {
  return (
    <group>
      <ForestWatcher />
      <ForestFloor />
      <Trails />
      <ForestTrees />
      <Bushes />
      <TrailSign />
      <Banyan />
      <OldShrine />
      <HunterShed />
      <Spring />
      <Cairn />
      <Herbs />
      <Thorns />
      <Fireflies />
      <Deer />
    </group>
  )
}

function ForestWatcher() {
  const t = useRef(0)
  useFrame((_, dt) => {
    t.current += dt
    if (t.current < 0.2) return
    t.current = 0
    forestTick(playerPose.x, playerPose.z)
  })
  return null
}

function ForestFloor() {
  const w = FOREST.maxX - FOREST.minX + 14
  const cx = (FOREST.maxX + FOREST.minX) / 2 - 3
  return (
    <group>
      <mesh position={[cx, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, FOREST.maxZ * 2 + 14]} />
        <meshStandardMaterial color="#5d7a3e" roughness={1} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {/* ใบไม้ร่วงเป็นหย่อม ๆ */}
      <LeafLitter />
    </group>
  )
}

function LeafLitter() {
  const ref = useRef<InstancedMesh>(null)
  const pts = useMemo(() => {
    const r = rnd(77)
    return Array.from({ length: 220 }, () => ({ x: FOREST.minX + r() * (FOREST.maxX - FOREST.minX), z: -FOREST.maxZ + r() * FOREST.maxZ * 2, s: 1.2 + r() * 2.6, c: r() }))
  }, [])
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const c = new Color()
    pts.forEach((p, i) => {
      dummy.position.set(p.x, 0.02, p.z)
      dummy.rotation.set(-Math.PI / 2, 0, p.c * 6)
      dummy.scale.set(p.s, p.s * 0.7, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      m.setColorAt(i, c.set(p.c < 0.5 ? '#7a6a3a' : '#6a7a36'))
    })
    m.instanceMatrix.needsUpdate = true
  }, [pts])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pts.length]} receiveShadow>
      <circleGeometry args={[1, 9]} />
      <meshStandardMaterial roughness={1} polygonOffset polygonOffsetFactor={-2} />
    </instancedMesh>
  )
}

/** ทางดิน: ต่อเป็นแถบตามจุด (ทางลับเห็นเฉพาะเมื่อมีเครื่องราง) */
function Trails() {
  const amulet = useGame((s) => !!s.save?.forest?.amulet)
  const segs = useMemo(() => {
    const out: { x: number; z: number; len: number; a: number; w: number; hidden: boolean }[] = []
    for (const t of TRAILS)
      for (let i = 0; i < t.pts.length - 1; i++) {
        const [ax, az] = t.pts[i]
        const [bx, bz] = t.pts[i + 1]
        out.push({ x: (ax + bx) / 2, z: (az + bz) / 2, len: Math.hypot(bx - ax, bz - az) + t.width * 0.6, a: Math.atan2(bx - ax, bz - az), w: t.width, hidden: !!t.hidden })
      }
    return out
  }, [])
  return (
    <group>
      {segs.map((s, i) =>
        s.hidden && !amulet ? null : (
          <mesh key={i} position={[s.x, 0.03, s.z]} rotation={[-Math.PI / 2, 0, s.a]} receiveShadow>
            <planeGeometry args={[s.w, s.len]} />
            <meshStandardMaterial color={s.hidden ? '#6a6a48' : '#8a6c48'} roughness={1} polygonOffset polygonOffsetFactor={-3} />
          </mesh>
        ),
      )}
    </group>
  )
}

function ForestTrees() {
  const trunks = useRef<InstancedMesh>(null)
  const crownsA = useRef<InstancedMesh>(null)
  const crownsB = useRef<InstancedMesh>(null)
  const cones = useRef<InstancedMesh>(null)
  const bamboo = useRef<InstancedMesh>(null)
  const broad = FOREST_TREES.filter((t) => t.kind === 0)
  const tall = FOREST_TREES.filter((t) => t.kind === 1)
  const bam = FOREST_TREES.filter((t) => t.kind === 2)
  useLayoutEffect(() => {
    const c = new Color()
    const r = rnd(5)
    // ลำต้น (ไม้ใหญ่ + ไม้สูง)
    const tm = trunks.current!
    ;[...broad, ...tall].forEach((t, i) => {
      const h = t.kind === 0 ? 6.2 * t.s : 7 * t.s
      dummy.position.set(t.x, h / 2, t.z)
      dummy.rotation.set(0, t.rot, 0)
      dummy.scale.set(t.s, h, t.s)
      dummy.updateMatrix()
      tm.setMatrixAt(i, dummy.matrix)
      tm.setColorAt(i, c.set(i % 3 ? '#5a4632' : '#4a3a2a'))
    })
    tm.instanceMatrix.needsUpdate = true
    // พุ่มใบไม้ใหญ่ 2 ก้อนต่อต้น
    const ca = crownsA.current!
    const cb = crownsB.current!
    broad.forEach((t, i) => {
      const h = 6.2 * t.s
      dummy.position.set(t.x, h + 1.5 * t.s, t.z)
      dummy.rotation.set(0, t.rot, 0)
      dummy.scale.set(2.8 * t.s, 2.2 * t.s, 2.8 * t.s)
      dummy.updateMatrix()
      ca.setMatrixAt(i, dummy.matrix)
      ca.setColorAt(i, c.set(['#3f6e2e', '#4a7a34', '#365f28', '#55803a'][i % 4]))
      dummy.position.set(t.x + Math.cos(t.rot) * 1.4 * t.s, h + 2.3 * t.s, t.z + Math.sin(t.rot) * 1.4 * t.s)
      dummy.scale.set(2 * t.s, 1.6 * t.s, 2 * t.s)
      dummy.updateMatrix()
      cb.setMatrixAt(i, dummy.matrix)
      cb.setColorAt(i, c.set(['#4f8238', '#447530', '#5a8a40'][i % 3]))
    })
    ca.instanceMatrix.needsUpdate = true
    cb.instanceMatrix.needsUpdate = true
    // ไม้สูงยอดแหลม (2 ชั้น)
    const cn = cones.current!
    tall.forEach((t, i) => {
      for (let k = 0; k < 2; k++) {
        dummy.position.set(t.x, 7 * t.s - 1 + k * 2.2 * t.s, t.z)
        dummy.rotation.set(0, t.rot + k, 0)
        const s = (2.4 - k * 0.7) * t.s
        dummy.scale.set(s, 3 * t.s, s)
        dummy.updateMatrix()
        cn.setMatrixAt(i * 2 + k, dummy.matrix)
        cn.setColorAt(i * 2 + k, c.set(k ? '#2f5a2a' : '#355f2e'))
      }
    })
    cn.instanceMatrix.needsUpdate = true
    // กอไผ่ (ลำละ 7 ต้น โน้มออก)
    const bm = bamboo.current!
    let n = 0
    bam.forEach((t) => {
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2 + t.rot
        const lean = 0.12 + r() * 0.12
        const h = (6 + r() * 3) * t.s
        dummy.position.set(t.x + Math.cos(a) * (0.3 + (h / 2) * Math.sin(lean)), (h / 2) * Math.cos(lean), t.z + Math.sin(a) * (0.3 + (h / 2) * Math.sin(lean)))
        dummy.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean)
        dummy.scale.set(1, h, 1)
        dummy.updateMatrix()
        bm.setMatrixAt(n, dummy.matrix)
        bm.setColorAt(n, c.set(k % 2 ? '#7a9a3a' : '#8aa848'))
        n++
      }
    })
    bm.instanceMatrix.needsUpdate = true
    // จำตำแหน่งเดิมไว้ (ใช้ซ่อน/คืนต้นที่บังกล้อง)
    const parts: [InstancedMesh, number][][] = []
    const base = new Map<InstancedMesh, Float32Array>()
    for (const m of [tm, ca, cb, cn, bm]) base.set(m, (m.instanceMatrix.array as Float32Array).slice())
    const ordered = [...broad, ...tall]
    ordered.forEach((t, i) => {
      const p: [InstancedMesh, number][] = [[tm, i]]
      if (t.kind === 0) p.push([ca, i], [cb, i])
      else p.push([cn, (i - broad.length) * 2], [cn, (i - broad.length) * 2 + 1])
      parts.push(p)
    })
    bam.forEach((_, j) => parts.push(Array.from({ length: 7 }, (_, k) => [bm, j * 7 + k] as [InstancedMesh, number])))
    occl.current = { trees: [...ordered, ...bam], parts, base, hidden: new Set() }
  }, [broad, tall, bam])
  // ต้นไม้ที่อยู่ใกล้กล้องจะหายไปชั่วคราว (ไม่บังตัวละคร)
  const occl = useRef<{ trees: { x: number; z: number; kind: number; s: number }[]; parts: [InstancedMesh, number][][]; base: Map<InstancedMesh, Float32Array>; hidden: Set<number> } | null>(null)
  const acc = useRef(0)
  useFrame(({ camera }, dt) => {
    acc.current += dt
    const o = occl.current
    if (!o || acc.current < 0.1) return
    acc.current = 0
    const cx = camera.position.x
    const cz = camera.position.z
    const now = new Set<number>()
    if (cx < FOREST.maxX + 8) {
      // ซ่อนต้นที่ใกล้กล้อง หรืออยู่ระหว่างกล้องกับตัวละคร
      const px = playerPose.x
      const pz = playerPose.z
      const vx = px - cx
      const vz = pz - cz
      const len2 = vx * vx + vz * vz || 1
      o.trees.forEach((t, i) => {
        const dx = t.x - cx
        const dz = t.z - cz
        const cr = (t.kind === 0 ? 2.8 : t.kind === 1 ? 2.4 : 1.2) * t.s + 0.8
        if (dx * dx + dz * dz < (cr + 1.5) ** 2) return void now.add(i)
        const k = (dx * vx + dz * vz) / len2
        if (k <= 0 || k >= 1.15) return
        const ex = dx - vx * k
        const ez = dz - vz * k
        if (ex * ex + ez * ez < cr * cr) now.add(i)
      })
    }
    const dirty = new Set<InstancedMesh>()
    const zero = new Float32Array(16)
    for (const i of o.hidden)
      if (!now.has(i))
        for (const [m, idx] of o.parts[i]) {
          ;(m.instanceMatrix.array as Float32Array).set(o.base.get(m)!.subarray(idx * 16, idx * 16 + 16), idx * 16)
          dirty.add(m)
        }
    for (const i of now)
      if (!o.hidden.has(i))
        for (const [m, idx] of o.parts[i]) {
          ;(m.instanceMatrix.array as Float32Array).set(zero, idx * 16)
          dirty.add(m)
        }
    o.hidden = now
    dirty.forEach((m) => (m.instanceMatrix.needsUpdate = true))
  })
  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, broad.length + tall.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.42, 1, 7]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={crownsA} args={[undefined, undefined, broad.length]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.95} flatShading />
      </instancedMesh>
      <instancedMesh ref={crownsB} args={[undefined, undefined, broad.length]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.95} flatShading />
      </instancedMesh>
      <instancedMesh ref={cones} args={[undefined, undefined, tall.length * 2]} castShadow>
        <coneGeometry args={[1, 1, 8]} />
        <meshStandardMaterial roughness={0.95} flatShading />
      </instancedMesh>
      <instancedMesh ref={bamboo} args={[undefined, undefined, bam.length * 7]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 1, 6]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
    </group>
  )
}

function Bushes() {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current!
    const c = new Color()
    FOREST_BUSHES.forEach((b, i) => {
      dummy.position.set(b.x, b.s * 0.45, b.z)
      dummy.rotation.set(0, i, 0)
      dummy.scale.set(b.s * 1.5, b.s, b.s * 1.4)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      m.setColorAt(i, c.set(['#4a7a32', '#5a8a3a', '#3e6a2a', '#668f42'][i % 4]))
    })
    m.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, FOREST_BUSHES.length]} receiveShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={1} flatShading />
    </instancedMesh>
  )
}

/** ป้ายไม้ปากทางเข้าป่า */
function TrailSign() {
  return (
    <group position={[-117, 0, 3.2]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 1.6, 6]} />
        <meshStandardMaterial color="#5a4030" />
      </mesh>
      <mesh position={[0, 1.45, 0.05]} rotation={[0, 0, -0.08]} castShadow>
        <boxGeometry args={[1.3, 0.34, 0.05]} />
        <meshStandardMaterial color="#b89060" />
      </mesh>
      <mesh position={[0.62, 1.45, 0.05]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.24, 0.24, 0.05]} />
        <meshStandardMaterial color="#b89060" />
      </mesh>
    </group>
  )
}

/** ต้นไทรใหญ่ + รากอากาศ + ผ้าแพรสามสีผูกรอบลำต้น */
function Banyan() {
  const roots = useMemo(() => {
    const r = rnd(808)
    return Array.from({ length: 22 }, () => {
      const a = r() * Math.PI * 2
      const d = 2.6 + r() * 3.6
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, h: 5 + r() * 2.5 }
    })
  }, [])
  const [bx, bz] = BANYAN_POS
  return (
    <group position={[bx, 0, bz]}>
      <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.3, 2.1, 6.4, 12]} />
        <meshStandardMaterial color="#6a5a48" roughness={1} />
      </mesh>
      {/* รากแผ่บนพื้น */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[Math.cos(i) * 1.9, 0.25, Math.sin(i) * 1.9]} rotation={[0, -i, Math.PI / 2 - 0.25]} castShadow>
          <cylinderGeometry args={[0.18, 0.32, 2.2, 6]} />
          <meshStandardMaterial color="#6a5a48" roughness={1} />
        </mesh>
      ))}
      {roots.map((k, i) => (
        <mesh key={i} position={[k.x, k.h / 2, k.z]} castShadow>
          <cylinderGeometry args={[0.05, 0.08, k.h, 5]} />
          <meshStandardMaterial color="#7a6a54" roughness={1} />
        </mesh>
      ))}
      {/* เรือนยอดแผ่กว้าง */}
      {[
        [0, 8.2, 0, 7.2, 3],
        [3.6, 7.4, 2, 4.4, 2.4],
        [-3.8, 7.6, -1.2, 4.8, 2.6],
        [1, 7.2, -4, 4.2, 2.2],
        [-1.5, 7, 4, 4.2, 2.2],
      ].map(([x, y, z, s, sy], i) => (
        <mesh key={i} position={[x, y, z]} scale={[s, sy, s]} castShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={i % 2 ? '#2f5e2a' : '#386a30'} roughness={0.95} flatShading />
        </mesh>
      ))}
      {/* ผ้าแพรสามสี (สีซีด) พันรอบลำต้น */}
      {['#d88a8a', '#d8c070', '#8ab0d0'].map((c, i) => (
        <mesh key={c} position={[0, 1.6 + i * 0.22, 0]}>
          <torusGeometry args={[1.86 - i * 0.04, 0.07, 6, 24]} />
          <meshStandardMaterial color={c} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

/** ศาลไม้เก่าบนเสา — สกปรก/เอียงจนกว่าจะทำความสะอาด */
function OldShrine() {
  const cleaned = useGame((s) => !!s.save?.forest?.shrineCleaned)
  const offeredToday = useGame((s) => s.save?.forest?.lastOfferDay) === useClock((s) => s.day)
  const glow = useRef<Mesh>(null)
  const wisps = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const night = isNight()
    const burst = performance.now() - useForest.getState().wisps < 6000
    if (glow.current) {
      const m = glow.current.material as { opacity: number }
      m.opacity = night && cleaned ? 0.35 + Math.sin(t * 1.5) * 0.12 : 0
    }
    if (wisps.current) {
      wisps.current.visible = night || burst
      wisps.current.children.forEach((w, i) => {
        const a = t * (0.4 + i * 0.07) * (burst ? 3 : 1) + i * 1.7
        const rr = burst ? 1.2 + Math.sin(t * 2) * 0.4 : 2.4 + (i % 3) * 0.8
        w.position.set(Math.cos(a) * rr, 1.6 + Math.sin(t * 0.9 + i) * 0.6 + (burst ? 0.6 : 0), Math.sin(a) * rr)
      })
    }
  })
  const wood = cleaned ? '#9a7048' : '#6e665c'
  const roof = cleaned ? '#8a3a2a' : '#5a5048'
  const [sx, sz] = SHRINE_POS
  return (
    <group position={[sx, 0, sz]} rotation={[0, Math.PI / 2, 0]}>
      <group rotation={[0, 0, cleaned ? 0 : 0.09]}>
        {/* เสา */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[0.16, 1.3, 0.16]} />
          <meshStandardMaterial color={wood} roughness={1} />
        </mesh>
        {/* แท่นวางของ */}
        <mesh position={[0, 1.32, 0]} castShadow>
          <boxGeometry args={[1.1, 0.08, 0.9]} />
          <meshStandardMaterial color={wood} roughness={1} />
        </mesh>
        {/* ตัวศาล */}
        <mesh position={[0, 1.66, -0.08]} castShadow>
          <boxGeometry args={[0.62, 0.6, 0.5]} />
          <meshStandardMaterial color={wood} roughness={1} />
        </mesh>
        <mesh position={[0, 1.62, 0.18]}>
          <boxGeometry args={[0.3, 0.42, 0.02]} />
          <meshStandardMaterial color="#2a2018" />
        </mesh>
        {/* หลังคาจั่ว */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.2, 2.08, -0.08]} rotation={[0, 0, s * -0.7]} castShadow>
            <boxGeometry args={[0.56, 0.05, 0.7]} />
            <meshStandardMaterial color={roof} roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 2.32, -0.08]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.05, 0.22, 4]} />
          <meshStandardMaterial color={cleaned ? '#d8b040' : '#7a7060'} metalness={cleaned ? 0.5 : 0} />
        </mesh>
        {/* ตุ๊กตาดินเผาเล็ก ๆ บนแท่น */}
        {[-0.38, 0.38].map((x) => (
          <mesh key={x} position={[x, 1.44, 0.22]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshStandardMaterial color={cleaned ? '#c08860' : '#7a6a5a'} roughness={1} />
          </mesh>
        ))}
        {/* ของถวายวันนี้ */}
        {offeredToday && (
          <group position={[0, 1.38, 0.3]}>
            <mesh>
              <cylinderGeometry args={[0.16, 0.12, 0.04, 12]} />
              <meshStandardMaterial color="#c8a040" metalness={0.4} />
            </mesh>
            {[-0.06, 0.06].map((x) => (
              <mesh key={x} position={[x, 0.07, 0]}>
                <sphereGeometry args={[0.06, 8, 6]} />
                <meshStandardMaterial color="#f0a0c0" />
              </mesh>
            ))}
          </group>
        )}
        {/* แสงนวลจากศาลตอนกลางคืน (หลังทำความสะอาด) */}
        <mesh ref={glow} position={[0, 1.7, 0.1]}>
          <sphereGeometry args={[0.6, 12, 10]} />
          <meshBasicMaterial color="#9affc8" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>
      {/* กองใบไม้และหยากไย่ (ก่อนทำความสะอาด) */}
      {!cleaned &&
        [
          [0.6, 0.4],
          [-0.5, 0.7],
          [0.2, -0.6],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.08, z]} scale={[0.6, 0.18, 0.5]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#7a6438" roughness={1} />
          </mesh>
        ))}
      {/* แสงวิญญาณเจ้าป่า (กลางคืน) */}
      <group ref={wisps}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.09, 8, 6]} />
            <meshBasicMaterial color="#b8ffd8" transparent opacity={0.9} blending={AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** เพิงพักนายพรานเก่า (พังครึ่งหนึ่ง) */
function HunterShed() {
  const [x, z] = SHED_POS
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
      {[
        [-1.4, -1],
        [1.4, -1],
        [-1.4, 1],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 1.1, pz]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 2.2, 6]} />
          <meshStandardMaterial color="#5a4a36" />
        </mesh>
      ))}
      <mesh position={[0.4, 0.9, 1]} rotation={[0, 0, 0.9]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 2.2, 6]} />
        <meshStandardMaterial color="#5a4a36" />
      </mesh>
      {/* หลังคาจากเอียงพัง */}
      <mesh position={[-0.2, 2, -0.1]} rotation={[0.25, 0, -0.18]} castShadow>
        <boxGeometry args={[3.2, 0.1, 2.4]} />
        <meshStandardMaterial color="#9a8458" roughness={1} />
      </mesh>
      {/* แคร่ไม้ไผ่ */}
      <mesh position={[-0.4, 0.45, -0.3]} castShadow>
        <boxGeometry args={[1.8, 0.08, 1]} />
        <meshStandardMaterial color="#b8a060" />
      </mesh>
    </group>
  )
}

/** น้ำซับ: แอ่งน้ำใสล้อมหิน */
function Spring() {
  const water = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (water.current) (water.current.material as { opacity: number }).opacity = 0.75 + Math.sin(clock.elapsedTime * 1.3) * 0.05
  })
  const [x, z] = SPRING_POS
  return (
    <group position={[x, 0, z]}>
      <mesh ref={water} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 20]} />
        <meshStandardMaterial color="#5ab0c0" transparent opacity={0.78} roughness={0.1} metalness={0.2} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 1.75, 0.15, Math.sin(a) * 1.6]} scale={[0.4, 0.28, 0.34]} castShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={i % 2 ? '#7a8078' : '#8a8a80'} roughness={1} flatShading />
          </mesh>
        )
      })}
    </group>
  )
}

/** กองหินเก่าที่มีคนเคยวางดอกไม้ */
function Cairn() {
  const [x, z] = CAIRN_POS
  return (
    <group position={[x, 0, z]}>
      {[0.55, 0.42, 0.3, 0.2].map((s, i) => (
        <mesh key={i} position={[0, 0.25 + i * 0.36, 0]} scale={[s, s * 0.6, s]} rotation={[0, i, 0]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#8a8478" roughness={1} flatShading />
        </mesh>
      ))}
      <mesh position={[0.5, 0.08, 0.3]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color="#9a7a5a" />
      </mesh>
    </group>
  )
}

/** เห็ด/สมุนไพร (หายไปเมื่อเก็บแล้ววันนี้) */
function Herbs() {
  useGame((s) => s.save?.forest?.picked)
  useClock((s) => s.day)
  return (
    <group>
      {HERB_SPOTS.map((h) =>
        !herbReady(h.id) ? null : h.kind === 'mushroom' ? (
          <group key={h.id} position={[h.pos[0], 0, h.pos[1]]}>
            {[
              [0, 0, 1],
              [0.25, 0.15, 0.7],
              [-0.2, 0.2, 0.8],
            ].map(([dx, dz, s], i) => (
              <group key={i} position={[dx, 0, dz]} scale={s}>
                <mesh position={[0, 0.12, 0]}>
                  <cylinderGeometry args={[0.04, 0.05, 0.24, 6]} />
                  <meshStandardMaterial color="#f0e8d8" />
                </mesh>
                <mesh position={[0, 0.26, 0]} scale={[1, 0.55, 1]}>
                  <sphereGeometry args={[0.14, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color="#c89a68" />
                </mesh>
              </group>
            ))}
          </group>
        ) : (
          <group key={h.id} position={[h.pos[0], 0, h.pos[1]]}>
            {Array.from({ length: 6 }, (_, i) => (
              <mesh key={i} position={[Math.cos(i) * 0.12, 0.2, Math.sin(i) * 0.12]} rotation={[Math.cos(i) * 0.5, 0, Math.sin(i) * 0.5]}>
                <coneGeometry args={[0.06, 0.42, 4]} />
                <meshStandardMaterial
                  color={h.kind === 'rareherb' ? '#7ae8b0' : '#3e8a3a'}
                  emissive={h.kind === 'rareherb' ? '#3ac080' : '#000000'}
                  emissiveIntensity={h.kind === 'rareherb' ? 0.7 : 0}
                />
              </mesh>
            ))}
          </group>
        ),
      )}
    </group>
  )
}

/** พุ่มหนามปิดทางลับหลังศาล */
function Thorns() {
  useGame((s) => s.save?.forest?.amulet)
  useGame((s) => s.save?.inventory)
  if (hasAmulet()) return null
  return (
    <group>
      {THORNS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.6, 0]} scale={[1.2, 0.8, 1.1]} castShadow>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#3a4a26" roughness={1} flatShading />
          </mesh>
          {Array.from({ length: 6 }, (_, k) => (
            <mesh key={k} position={[Math.cos(k) * 0.9, 0.7 + (k % 2) * 0.3, Math.sin(k) * 0.8]} rotation={[Math.sin(k), k, Math.cos(k)]}>
              <coneGeometry args={[0.04, 0.4, 4]} />
              <meshStandardMaterial color="#6a5030" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** หิ่งห้อยกลางคืน — หนาตามทางลับหลังศาล (เหมือนชี้ทาง) และในลานหิ่งห้อย */
function Fireflies() {
  const ref = useRef<Points>(null)
  const base = useMemo(() => {
    const r = rnd(4040)
    const out: V2[] = []
    const secret = TRAILS.find((t) => t.id === 'secret')!.pts
    for (let i = 0; i < 70; i++) {
      const k = Math.floor(r() * (secret.length - 1))
      const t = r()
      const a = secret[k]
      const b = secret[k + 1]
      out.push([a[0] + (b[0] - a[0]) * t + (r() - 0.5) * 3, a[1] + (b[1] - a[1]) * t + (r() - 0.5) * 3])
    }
    for (let i = 0; i < 90; i++) out.push([FOREST.minX + r() * (FOREST.maxX - FOREST.minX), -FOREST.maxZ + r() * FOREST.maxZ * 2])
    return out
  }, [])
  const geo = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(base.length * 3), 3))
    return g
  }, [base])
  useFrame(({ clock }) => {
    const p = ref.current
    if (!p) return
    const night = isNight()
    p.visible = night
    if (!night) return
    const t = clock.elapsedTime
    const arr = geo.attributes.position.array as Float32Array
    base.forEach(([x, z], i) => {
      arr[i * 3] = x + Math.sin(t * 0.5 + i) * 0.6
      arr[i * 3 + 1] = 0.6 + Math.sin(t * 0.8 + i * 1.3) * 0.5 + (i % 4) * 0.3
      arr[i * 3 + 2] = z + Math.cos(t * 0.45 + i * 0.7) * 0.6
    })
    geo.attributes.position.needsUpdate = true
    ;(p.material as PointsMaterial).opacity = 0.6 + Math.sin(t * 3) * 0.3
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial color="#d8ff7a" size={0.22} transparent opacity={0.8} blending={AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  )
}

/** เก้ง 2 ตัวเล็มหญ้าแถวทางแยกเหนือ — วิ่งหนีเมื่อเดินเข้าใกล้ */
function Deer() {
  const refs = useRef<(Group | null)[]>([])
  const st = useRef([
    { hx: -133, hz: 20, x: -133, z: 20, h: 0, flee: 0 },
    { hx: -128, hz: -14, x: -128, z: -14, h: 2, flee: 0 },
  ])
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const t = clock.elapsedTime
    st.current.forEach((d, i) => {
      const g = refs.current[i]
      if (!g) return
      const px = playerPose.x
      const pz = playerPose.z
      const dist = Math.hypot(px - d.x, pz - d.z)
      if (dist < 7) d.flee = 2.5
      let vx = 0
      let vz = 0
      if (d.flee > 0) {
        d.flee -= dt
        vx = (d.x - px) / (dist || 1)
        vz = (d.z - pz) / (dist || 1)
        d.x += vx * 6 * dt
        d.z += vz * 6 * dt
      } else {
        // เดินกลับถิ่นช้า ๆ + เล็มหญ้า
        const back = Math.hypot(d.hx - d.x, d.hz - d.z)
        if (back > 1) {
          vx = (d.hx - d.x) / back
          vz = (d.hz - d.z) / back
          d.x += vx * 1.1 * dt
          d.z += vz * 1.1 * dt
        }
      }
      d.x = Math.max(FOREST.minX + 2, Math.min(FOREST.maxX - 1, d.x))
      d.z = Math.max(-FOREST.maxZ + 2, Math.min(FOREST.maxZ - 2, d.z))
      if (vx || vz) d.h = Math.atan2(vx, vz)
      g.position.set(d.x, d.flee > 0 ? Math.abs(Math.sin(t * 9)) * 0.25 : 0, d.z)
      g.rotation.y = d.h
      const head = g.children[1]
      if (head) head.rotation.x = d.flee > 0 || vx || vz ? 0 : 0.6 + Math.sin(t * 2 + i) * 0.15
    })
  })
  return (
    <group>
      {[0, 1].map((i) => (
        <group key={i} ref={(g) => void (refs.current[i] = g)}>
          <mesh position={[0, 0.7, 0]} scale={[0.32, 0.32, 0.62]} castShadow>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#a8683a" />
          </mesh>
          <group position={[0, 0.92, 0.52]}>
            <mesh position={[0, 0.12, 0.12]} scale={[0.14, 0.15, 0.24]}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color="#9a5e34" />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.07, 0.32, 0.06]} rotation={[0, 0, s * -0.25]}>
                <coneGeometry args={[0.02, 0.18, 4]} />
                <meshStandardMaterial color="#4a3a2a" />
              </mesh>
            ))}
          </group>
          {[
            [-0.17, -0.38],
            [0.17, -0.38],
            [-0.17, 0.38],
            [0.17, 0.38],
          ].map(([x, z], k) => (
            <mesh key={k} position={[x, 0.3, z]}>
              <cylinderGeometry args={[0.035, 0.03, 0.6, 5]} />
              <meshStandardMaterial color="#7a4a2a" />
            </mesh>
          ))}
          <mesh position={[0, 0.82, -0.6]}>
            <sphereGeometry args={[0.07, 6, 5]} />
            <meshStandardMaterial color="#f4ece0" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
