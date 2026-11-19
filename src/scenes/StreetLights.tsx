import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, Object3D, type InstancedMesh, type MeshBasicMaterial, type MeshStandardMaterial } from 'three'
import { PLACES, ROADS, type Vec2 } from '../game/content/village'
import { exactMinute } from '../game/clock'

/**
 * เสาไฟฟ้าคอนกรีตริมถนน + สายไฟ + โคมไฟถนน (§2.60)
 * - เสาคอนกรีตสีเทาแบบถนนไทย: คานบนมีลูกถ้วย 3 ลูก (สายไฟฟ้า) · คานล่างสายสื่อสารสีดำ · แขนโคมไฟถนนยื่นเข้าหาถนน
 * - วางเรียงฝั่งเดียวตามแนวถนนจริงทุกเส้น ระยะ ~20 ม. · เว้นกลางทางแยก/ไม่ทับบ้าน · สายต่อเนื่องตามแนวเสา
 * - สายไฟหย่อนโค้งเป็นธรรมชาติ (สายสื่อสารหย่อนมากกว่า) · บางต้นมีสายม้วนเก็บ/กล่องอุปกรณ์ ไม่รกจนบังวิว
 * - โคมไฟเปิดเองตอนค่ำ ปิดตอนเช้า · แสงนุ่มเป็นวงบนพื้นถนน (ไม่ใช้ไฟจริงทุกต้น)
 */
const SPACING = 20
const H = 8 // ความสูงเสา

function segDist(p: Vec2, a: Vec2, b: Vec2) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz)
}

export interface Pole {
  x: number
  z: number
  /** ทิศตามแนวถนน (เรเดียน) */
  yaw: number
  /** ทิศเข้าหาถนน: +1/−1 (ฝั่งของเสา) */
  side: number
  road: number
  idx: number
}

export function poleSpots(): Pole[] {
  const out: Pole[] = []
  const blocked = (x: number, z: number, self: number) => {
    for (let j = 0; j < ROADS.length; j++) {
      if (j === self) continue
      const r = ROADS[j]
      if (segDist([x, z], r.from, r.to) < r.width / 2 + 1) return true
    }
    for (const p of PLACES) {
      const pad = p.kind === 'pond' || p.kind === 'lake' ? 1 : 0.5
      if (Math.abs(x - p.pos[0]) < p.size[0] / 2 + pad && Math.abs(z - p.pos[1]) < p.size[1] / 2 + pad) return true
    }
    return out.some((q) => Math.hypot(q.x - x, q.z - z) < 6)
  }
  ROADS.forEach((r, i) => {
    const dx = r.to[0] - r.from[0]
    const dz = r.to[1] - r.from[1]
    const len = Math.hypot(dx, dz)
    const ux = dx / len
    const uz = dz / len
    const nx = -uz
    const nz = ux
    const off = r.width / 2 + 0.6
    const n = Math.max(1, Math.round((len - 6) / SPACING))
    // เลือกฝั่งที่วางได้มากกว่า (สายจะได้ต่อเนื่องฝั่งเดียว)
    let best: Pole[] = []
    for (const side of [1, -1]) {
      const list: Pole[] = []
      for (let k = 0; k <= n; k++) {
        const t = 3 / len + (k / n) * (1 - 6 / len)
        const x = r.from[0] + dx * t + nx * off * side
        const z = r.from[1] + dz * t + nz * off * side
        if (!blocked(x, z, i)) list.push({ x, z, yaw: Math.atan2(ux, uz), side, road: i, idx: k })
      }
      if (list.length > best.length) best = list
    }
    out.push(...best)
  })
  return out
}

/** สายไฟหย่อนโค้งระหว่างเสาที่อยู่ติดกันบนถนนเส้นเดียวกัน */
function wireGeometry(poles: Pole[]) {
  const pts: number[] = []
  const attach = (p: Pole) => {
    // จุดยึดในพิกัดโลก: [ข้ามถนน, สูง] → ตามแนวตั้งฉากกับถนน
    const px = Math.cos(p.yaw)
    const pz = -Math.sin(p.yaw)
    const a: [number, number, number, number][] = [
      [-0.65, H - 0.42, 0.45, 0], // สายไฟฟ้า (ลูกถ้วย)
      [0, H - 0.42, 0.45, 0],
      [0.65, H - 0.42, 0.45, 0],
      [-0.35, H - 1.55, 0.9, 1], // สายสื่อสาร (หย่อนมาก)
      [0.35, H - 1.6, 1.1, 1],
    ]
    return a.map(([o, y, sag, kind]) => ({ x: p.x + px * o, y, z: p.z + pz * o, sag, kind }))
  }
  for (let i = 1; i < poles.length; i++) {
    const a = poles[i - 1]
    const b = poles[i]
    if (a.road !== b.road) continue
    const d = Math.hypot(a.x - b.x, a.z - b.z)
    if (d > SPACING * 2.4) continue
    const A = attach(a)
    const B = attach(b)
    for (let w = 0; w < A.length; w++) {
      const sag = A[w].sag + d * 0.018
      const N = 12
      for (let s = 0; s < N; s++) {
        for (const tt of [s / N, (s + 1) / N]) {
          pts.push(A[w].x + (B[w].x - A[w].x) * tt, A[w].y + (B[w].y - A[w].y) * tt - sag * 4 * tt * (1 - tt), A[w].z + (B[w].z - A[w].z) * tt)
        }
      }
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pts, 3))
  return g
}

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,220,160,0.85)')
  grd.addColorStop(0.45, 'rgba(255,200,130,0.32)')
  grd.addColorStop(1, 'rgba(255,180,110,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  return new CanvasTexture(c)
}

const dummy = new Object3D()
const OFF = new Color('#dcd8cc')
const ON = new Color('#ffd28f')

function lampLevel(m: number) {
  if (m >= 1110 || m < 330) return 1
  if (m < 375) return 1 - (m - 330) / 45
  if (m >= 1065) return (m - 1065) / 45
  return 0
}

export function StreetLights() {
  const poles = useMemo(poleSpots, [])
  const wires = useMemo(() => wireGeometry(poles), [poles])
  const tex = useMemo(glowTexture, [])
  const shaft = useRef<InstancedMesh>(null)
  const arm1 = useRef<InstancedMesh>(null)
  const arm2 = useRef<InstancedMesh>(null)
  const insul = useRef<InstancedMesh>(null)
  const lampArm = useRef<InstancedMesh>(null)
  const lampHead = useRef<InstancedMesh>(null)
  const bulbs = useRef<InstancedMesh>(null)
  const pools = useRef<InstancedMesh>(null)
  const coils = useRef<InstancedMesh>(null)
  const boxes = useRef<InstancedMesh>(null)
  const extras = useMemo(() => ({ coils: poles.filter((_, i) => i % 3 === 1), boxes: poles.filter((_, i) => i % 5 === 2) }), [poles])
  useLayoutEffect(() => {
    const set = (m: InstancedMesh | null, i: number, x: number, y: number, z: number, ry: number, rx = 0, rz = 0) => {
      if (!m) return
      dummy.position.set(x, y, z)
      dummy.rotation.set(rx, ry, rz)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    poles.forEach((p, i) => {
      // ทิศเข้าหาถนน (ตั้งฉากกับแนวถนน ฝั่งตรงข้ามกับที่เสาอยู่)
      const tx = -Math.cos(p.yaw) * p.side
      const tz = Math.sin(p.yaw) * p.side
      set(shaft.current, i, p.x, H / 2, p.z, p.yaw)
      set(arm1.current, i, p.x, H - 0.55, p.z, p.yaw)
      set(arm2.current, i, p.x, H - 1.55, p.z, p.yaw)
      const cx = Math.cos(p.yaw)
      const cz = -Math.sin(p.yaw)
      for (let k = 0; k < 3; k++) set(insul.current, i * 3 + k, p.x + cx * (k - 1) * 0.65, H - 0.45, p.z + cz * (k - 1) * 0.65, 0)
      // แขนโคมไฟถนน (ยื่นเข้าหาถนน เอียงขึ้นเล็กน้อย)
      set(lampArm.current, i, p.x + tx * 0.8, H - 2.3, p.z + tz * 0.8, Math.atan2(tx, tz), -0.12)
      set(lampHead.current, i, p.x + tx * 1.55, H - 2.25, p.z + tz * 1.55, Math.atan2(tx, tz))
      set(bulbs.current, i, p.x + tx * 1.55, H - 2.38, p.z + tz * 1.55, 0)
      set(pools.current, i, p.x + tx * 2.4, 0.05, p.z + tz * 2.4, 0, -Math.PI / 2)
    })
    extras.coils.forEach((p, i) => set(coils.current, i, p.x + Math.sin(p.yaw) * 0.18, H - 3.4, p.z + Math.cos(p.yaw) * 0.18, p.yaw))
    extras.boxes.forEach((p, i) => set(boxes.current, i, p.x - Math.cos(p.yaw) * p.side * -0.2, H - 4.2, p.z + Math.sin(p.yaw) * p.side * -0.2, p.yaw))
    for (const m of [shaft, arm1, arm2, insul, lampArm, lampHead, bulbs, pools, coils, boxes]) if (m.current) m.current.instanceMatrix.needsUpdate = true
  }, [poles, extras])
  const last = useRef(-1)
  useFrame(() => {
    const lv = Math.round(lampLevel(exactMinute()) * 50) / 50
    if (lv === last.current) return
    last.current = lv
    const bm = bulbs.current?.material as MeshStandardMaterial | undefined
    if (bm) {
      bm.color.copy(OFF).lerp(ON, lv)
      bm.emissiveIntensity = lv * 1.5
    }
    const pm = pools.current?.material as MeshBasicMaterial | undefined
    if (pm) pm.opacity = lv * 0.5
    if (pools.current) pools.current.visible = lv > 0.01
  })
  const n = poles.length
  const CONCRETE = '#a8a6a0'
  return (
    <group>
      {/* เสาคอนกรีตเหลี่ยม เรียวขึ้นด้านบน */}
      <instancedMesh ref={shaft} args={[undefined, undefined, n]} castShadow>
        <cylinderGeometry args={[0.11, 0.17, H, 4]} />
        <meshStandardMaterial color={CONCRETE} roughness={0.95} />
      </instancedMesh>
      {/* คานบน (สายไฟฟ้า) และคานล่าง (สายสื่อสาร) — ขวางแนวถนน */}
      <instancedMesh ref={arm1} args={[undefined, undefined, n]}>
        <boxGeometry args={[1.7, 0.12, 0.12]} />
        <meshStandardMaterial color="#8f8d88" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={arm2} args={[undefined, undefined, n]}>
        <boxGeometry args={[1, 0.09, 0.09]} />
        <meshStandardMaterial color="#6f6d68" roughness={0.9} />
      </instancedMesh>
      {/* ลูกถ้วยกระเบื้องสีขาว */}
      <instancedMesh ref={insul} args={[undefined, undefined, n * 3]}>
        <cylinderGeometry args={[0.05, 0.07, 0.16, 8]} />
        <meshStandardMaterial color="#ecebe4" roughness={0.6} />
      </instancedMesh>
      {/* โคมไฟถนน */}
      <instancedMesh ref={lampArm} args={[undefined, undefined, n]}>
        <boxGeometry args={[0.06, 0.06, 1.6]} />
        <meshStandardMaterial color="#8f8d88" />
      </instancedMesh>
      <instancedMesh ref={lampHead} args={[undefined, undefined, n]}>
        <boxGeometry args={[0.28, 0.12, 0.5]} />
        <meshStandardMaterial color="#9a9890" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={bulbs} args={[undefined, undefined, n]}>
        <boxGeometry args={[0.22, 0.05, 0.4]} />
        <meshStandardMaterial color="#dcd8cc" emissive="#ffd28f" emissiveIntensity={0} />
      </instancedMesh>
      <instancedMesh ref={pools} args={[undefined, undefined, n]} visible={false} renderOrder={2}>
        <planeGeometry args={[7, 7]} />
        <meshBasicMaterial map={tex} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
      </instancedMesh>
      {/* สายสื่อสารม้วนเก็บ + กล่องอุปกรณ์ (บางต้น) */}
      <instancedMesh ref={coils} args={[undefined, undefined, Math.max(1, extras.coils.length)]}>
        <torusGeometry args={[0.32, 0.05, 6, 16]} />
        <meshStandardMaterial color="#2a2a2c" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={boxes} args={[undefined, undefined, Math.max(1, extras.boxes.length)]}>
        <boxGeometry args={[0.35, 0.45, 0.2]} />
        <meshStandardMaterial color="#5a5c58" roughness={0.8} />
      </instancedMesh>
      {/* สายไฟหย่อนโค้งระหว่างเสา */}
      <lineSegments geometry={wires}>
        <lineBasicMaterial color="#2b2b2e" transparent opacity={0.85} />
      </lineSegments>
    </group>
  )
}
