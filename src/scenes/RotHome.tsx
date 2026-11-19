import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, RepeatWrapping, type Group, type Mesh } from 'three'
import { RBox } from './models/RBox'
import { Motorcycle } from './models/Motorcycle'
import { Fastback, Hatchback } from './models/Vehicles'
import { Windy } from './Wind'
import { ROT_GATE, ROT_PATH, ROT_WALLS, WALL_T } from '../game/content/rotWalls'

/* ───────── บ้านน้าโรจน์: บ่อปลาคาร์ฟ + น้ำตกจำลอง · ลานจอดรถ · สวนมะนาว ───────── */

const KOI = [
  { body: '#f4f1ea', spot: '#e0452a' }, // โคฮากุ ขาวแดง
  { body: '#f08a24', spot: '#ffffff' }, // ส้มขาว
  { body: '#f2c23a', spot: '#f2c23a' }, // ทอง
  { body: '#222224', spot: '#f07a24' }, // ดำส้ม
  { body: '#ffffff', spot: '#1e1e20' }, // ขาวดำ
]

function Koi({ i, rx, rz }: { i: number; rx: number; rz: number }) {
  const g = useRef<Group>(null)
  const tail = useRef<Mesh>(null)
  const k = KOI[i % KOI.length]
  const sp = 0.32 + i * 0.05
  const ph = i * 1.7
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * sp + ph
    // ว่ายเป็นวงรีกลับไปกลับมา ความเร็วแต่ละตัวไม่เท่ากัน
    const x = Math.cos(t) * rx * (0.55 + 0.3 * Math.sin(t * 0.37 + i))
    const z = Math.sin(t) * rz * (0.6 + 0.25 * Math.cos(t * 0.29 + i))
    if (g.current) {
      const dx = -Math.sin(t) * rx
      const dz = Math.cos(t) * rz
      g.current.position.set(x, -0.12 + Math.sin(t * 2) * 0.02, z)
      g.current.rotation.y = Math.atan2(dx, dz)
    }
    if (tail.current) tail.current.rotation.y = Math.sin(clock.elapsedTime * 6 + ph) * 0.5
  })
  return (
    <group ref={g}>
      <mesh scale={[0.55, 0.4, 1.6]}>
        <sphereGeometry args={[0.1, 12, 8]} />
        <meshStandardMaterial color={k.body} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.03, 0.03]} scale={[0.45, 0.25, 0.7]}>
        <sphereGeometry args={[0.1, 10, 6]} />
        <meshStandardMaterial color={k.spot} roughness={0.4} />
      </mesh>
      <group position={[0, 0, -0.15]}>
        <mesh ref={tail} position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.06, 0.12, 4]} />
          <meshStandardMaterial color={k.spot} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}

/** ลายน้ำไหลสำหรับน้ำตก (เลื่อนลงตลอด) */
function useFallTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 32
    c.height = 128
    const x = c.getContext('2d')!
    x.fillStyle = 'rgba(200,232,255,0.55)'
    x.fillRect(0, 0, 32, 128)
    for (let i = 0; i < 26; i++) {
      x.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.5})`
      x.fillRect(Math.random() * 32, Math.random() * 128, 1 + Math.random() * 2, 8 + Math.random() * 20)
    }
    const t = new CanvasTexture(c)
    t.wrapS = t.wrapT = RepeatWrapping
    return t
  }, [])
}

/** บ่อปลาคาร์ฟ (หลากสี 5 ตัว) ขอบหิน มีน้ำตกจำลองไหลลงจากกองหินด้านหลัง */
export function KoiPond({ w, d }: { w: number; d: number }) {
  const rx = w / 2 - 0.7
  const rz = d / 2 - 0.9
  const fall = useFallTexture()
  const ripple = useRef<Mesh>(null)
  useFrame(({ clock }, dt) => {
    fall.offset.y += dt * 1.4
    if (ripple.current) {
      const p = (clock.elapsedTime * 0.8) % 1
      ripple.current.scale.setScalar(0.4 + p * 1.4)
      ;(ripple.current.material as { opacity: number }).opacity = 0.6 * (1 - p)
    }
  })
  const rim = useMemo(() => {
    const out: [number, number, number][] = []
    const n = 22
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      out.push([Math.cos(a) * (rx + 0.45), Math.sin(a) * (rz + 0.45), 0.22 + ((i * 7) % 5) * 0.03])
    }
    return out
  }, [rx, rz])
  const fx = 0
  const fz = rz + 0.55 // น้ำตกอยู่ขอบด้านหลังบ่อ (+z)
  return (
    <group>
      {/* สนามหญ้ารอบบ่อ */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#98b85e" roughness={1} />
      </mesh>
      {/* ก้นบ่อ + ผิวน้ำ */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[rx + 0.2, rz + 0.2, 1]}>
        <circleGeometry args={[1, 36]} />
        <meshStandardMaterial color="#2d5a5a" roughness={1} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[rx + 0.2, rz + 0.2, 1]}>
        <circleGeometry args={[1, 36]} />
        <meshStandardMaterial color="#5aa6b8" transparent opacity={0.55} roughness={0.08} metalness={0.1} depthWrite={false} />
      </mesh>
      {KOI.map((_, i) => (
        <group key={i} position={[0, 0.1, 0]}>
          <Koi i={i} rx={rx} rz={rz} />
        </group>
      ))}
      {/* ใบบัว */}
      {[[-rx * 0.5, -rz * 0.4], [rx * 0.45, rz * 0.1], [-rx * 0.2, rz * 0.45]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.115, z]} rotation={[-Math.PI / 2, 0, i * 2]}>
          <circleGeometry args={[0.22, 14, 0.4, Math.PI * 2 - 0.4]} />
          <meshStandardMaterial color="#4f8f3a" />
        </mesh>
      ))}
      {/* ขอบหินรอบบ่อ */}
      {rim.map(([x, z, s], i) => (
        <mesh key={i} position={[x, s * 0.5, z]} scale={[s * 2.2, s * 1.4, s * 1.8]} rotation={[0, i, 0]} castShadow>
          <icosahedronGeometry args={[0.3, 1]} />
          <meshStandardMaterial color={i % 3 ? '#9a958a' : '#837d72'} roughness={0.95} />
        </mesh>
      ))}
      {/* กองหินน้ำตก (3 ชั้น) */}
      <group position={[fx, 0, fz]}>
        {[
          [0, 0.35, 0.35, 1.0],
          [-0.75, 0.3, 0.2, 0.75],
          [0.75, 0.28, 0.25, 0.7],
          [0, 0.95, 0.5, 0.75],
          [-0.45, 0.85, 0.55, 0.55],
          [0.45, 0.9, 0.55, 0.5],
          [0, 1.45, 0.65, 0.55],
        ].map(([x, y, z, s], i) => (
          <mesh key={i} position={[x, y, z]} scale={[s * 1.25, s * 0.85, s]} rotation={[0, i * 1.3, 0]} castShadow receiveShadow>
            <icosahedronGeometry args={[0.55, 1]} />
            <meshStandardMaterial color={i % 2 ? '#8d887c' : '#a39e92'} roughness={0.95} />
          </mesh>
        ))}
        {/* ม่านน้ำไหลลงสองช่วง */}
        <mesh position={[0, 1.18, 0.02]} rotation={[0.12, 0, 0]}>
          <planeGeometry args={[0.42, 0.7]} />
          <meshStandardMaterial map={fall} transparent opacity={0.85} depthWrite={false} side={2} />
        </mesh>
        <mesh position={[0, 0.5, -0.38]} rotation={[0.18, 0, 0]}>
          <planeGeometry args={[0.55, 0.85]} />
          <meshStandardMaterial map={fall} transparent opacity={0.85} depthWrite={false} side={2} />
        </mesh>
        {/* ระลอกน้ำตรงจุดที่น้ำตกกระทบ */}
        <mesh ref={ripple} position={[0, 0.12, -0.7]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.32, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
        </mesh>
        {/* ไม้ประดับข้างน้ำตก */}
        {[-1.2, 1.2].map((x) => (
          <mesh key={x} position={[x, 0.45, 0.6]} castShadow>
            <icosahedronGeometry args={[0.45, 1]} />
            <meshStandardMaterial color="#5f9e47" roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** สวนมะนาวน้าโรจน์ (15 ต้น): ต้นมะนาวพุ่มเตี้ยเป็นแถว ลูกเขียวอมเหลือง · โคนต้นมีวงดินพูน */
export function LemonGarden({ w, d }: { w: number; d: number }) {
  const trees = useMemo(() => {
    const out: [number, number, number][] = []
    // มะนาว 15 ต้น: 3 แถว × 5 ต้น
    const cols = 3
    const rows = 5
    const sx = (w - 1) / cols
    const sz = (d - 1) / rows
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++) out.push([(c - (cols - 1) / 2) * sx, (r - (rows - 1) / 2) * sz, 0.85 + ((c * 3 + r * 5) % 4) * 0.08])
    return out
  }, [w, d])
  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#9c9a92" roughness={1} />
      </mesh>
      {trees.map(([x, z, s], i) => (
        <Windy key={i} h={1.6} amp={0.14} flutter={1}>
          <LimeTree x={x} z={z} s={s} seed={i} />
        </Windy>
      ))}
      {/* ป้ายไม้เล็ก ๆ หน้าสวน */}
      <group position={[0, 0, -d / 2 + 0.5]}>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.06, 0.8, 0.06]} />
          <meshStandardMaterial color="#6b4a2e" />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <RBox args={[0.7, 0.3, 0.04]} radius={0.02} />
          <meshStandardMaterial color="#c89a5a" />
        </mesh>
      </group>
    </group>
  )
}

/** ลานจอดรถหน้าบ้าน (พื้นปูน) + รถเก๋ง 2 คัน (ขาว ฟ้า) + มอเตอร์ไซค์ 1 คัน · กำแพงอิฐแดงเตี้ยขอบปูนขาว กั้นระหว่างสวนมะนาว (ด้าน −x) */
export function ParkPad({ w, d }: { w: number; d: number }) {
  return (
    <group>
      <group position={[-w / 2 - 0.35, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <BrickWall len={d + 0.4} />
      </group>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#cfc9bb" roughness={0.95} />
      </mesh>
      <group position={[w / 2 - 0.55, 0, 0.6]} rotation={[0, Math.PI, 0]}>
        <Motorcycle color="#3a8a4a" lean={0.09} />
      </group>
      {/* รถเก๋งแฮทช์แบ็กสีขาว + เก๋งสปอร์ตฟาสต์แบ็กสีฟ้า จอดหันหัวเข้าบ้าน */}
      <group position={[-1.75, 0, -0.8]}>
        <Hatchback color="#f4f4f2" />
      </group>
      <group position={[0.35, 0, -0.8]}>
        <Fastback color="#4f8fd0" />
      </group>
    </group>
  )
}

/** ต้นมะนาวปลูกในวงบ่อซีเมนต์ (แบบสวนมะนาวบ้านเรา): ลำต้นเล็ก แตกกิ่ง ทรงพุ่มกว้าง ใบเขียวสด ลูกเขียวกลมดกทั่วพุ่ม */
function LimeTree({ x, z, s, seed }: { x: number; z: number; s: number; seed: number }) {
  const leaves = useMemo(() => {
    const out: [number, number, number, number][] = []
    for (let k = 0; k < 9; k++) {
      const a = k * 2.4 + seed
      const r = k === 0 ? 0 : 0.42 + ((k * 37 + seed * 11) % 10) * 0.025
      out.push([Math.cos(a) * r, 1.15 + ((k * 13 + seed) % 5) * 0.09 - (r > 0.5 ? 0.12 : 0), Math.sin(a) * r, 0.38 + ((k + seed) % 3) * 0.06])
    }
    return out
  }, [seed])
  const fruits = useMemo(() => {
    const out: [number, number, number][] = []
    for (let k = 0; k < 12; k++) {
      const a = k * 2.39996 * 1.3 + seed
      const r = 0.55 + ((k * 7) % 5) * 0.06
      out.push([Math.cos(a) * r, 0.78 + ((k * 5) % 7) * 0.09, Math.sin(a) * r])
    }
    return out
  }, [seed])
  return (
    <group position={[x, 0, z]} scale={s}>
      {/* วงบ่อซีเมนต์ */}
      <mesh position={[0, 0.17, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.58, 0.58, 0.34, 24, 1, true]} />
        <meshStandardMaterial color="#bdb8ae" roughness={0.95} side={2} />
      </mesh>
      <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.58, 24]} />
        <meshStandardMaterial color="#cbc6bc" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 24]} />
        <meshStandardMaterial color="#3e3128" roughness={1} />
      </mesh>
      {/* ลำต้น + กิ่ง */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.7, 6]} />
        <meshStandardMaterial color="#6b5a48" />
      </mesh>
      {[0, 2.1, 4.2].map((a) => (
        <mesh key={a} position={[Math.cos(a + seed) * 0.15, 0.98, Math.sin(a + seed) * 0.15]} rotation={[Math.sin(a + seed) * 0.6, 0, -Math.cos(a + seed) * 0.6]}>
          <cylinderGeometry args={[0.02, 0.03, 0.4, 5]} />
          <meshStandardMaterial color="#6b5a48" />
        </mesh>
      ))}
      {/* พุ่มใบ (หลายก้อนทับกัน ทรงกว้าง) */}
      {leaves.map(([lx, ly, lz, r], k) => (
        <mesh key={k} position={[lx, ly, lz]} scale={[1, 0.82, 1]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={k % 3 === 0 ? '#5a9a32' : k % 3 === 1 ? '#4a8a2a' : '#6aaa3a'} roughness={0.85} />
        </mesh>
      ))}
      {/* ลูกมะนาวเขียว ดกทั่วพุ่ม */}
      {fruits.map(([fx, fy, fz], k) => (
        <mesh key={'f' + k} position={[fx, fy, fz]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial color={k % 5 === 0 ? '#a8c83a' : '#8cbf3a'} roughness={0.45} />
        </mesh>
      ))}
    </group>
  )
}

/** ลายอิฐแดงก่อแบบสลับแนว */
function useBrickTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 128
    c.height = 64
    const x = c.getContext('2d')!
    x.fillStyle = '#e4d8c4'
    x.fillRect(0, 0, 128, 64)
    const bh = 16
    for (let r = 0; r < 4; r++) {
      const off = r % 2 ? 16 : 0
      for (let i = -1; i < 5; i++) {
        const shade = 150 + ((r * 7 + i * 13) % 5) * 9
        x.fillStyle = `rgb(${shade + 30},${Math.round(shade * 0.48)},${Math.round(shade * 0.3)})`
        x.fillRect(i * 32 + off + 1.5, r * bh + 1.5, 29, bh - 3)
      }
    }
    const t = new CanvasTexture(c)
    t.wrapS = t.wrapT = RepeatWrapping
    return t
  }, [])
}

/** กำแพงอิฐแดงเตี้ย (สูง ~0.8 ม.) มีบัวปูนขาวด้านบน และเสาอิฐทุก ๆ 3 ม. · วางตามแกน x */
export function BrickWall({ len, h = 0.8 }: { len: number; h?: number }) {
  const tex = useBrickTexture()
  const t = useMemo(() => {
    const c = tex.clone()
    c.repeat.set(len / 0.9, h / 0.45)
    c.needsUpdate = true
    return c
  }, [tex, len, h])
  const posts = Math.max(1, Math.round(len / 3))
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[len, h, 0.26]} />
        <meshStandardMaterial map={t} roughness={0.95} />
      </mesh>
      <mesh position={[0, h + 0.04, 0]} castShadow>
        <RBox args={[len + 0.06, 0.08, 0.34]} radius={0.02} />
        <meshStandardMaterial color="#f2ece2" roughness={0.9} />
      </mesh>
      {Array.from({ length: posts + 1 }, (_, i) => (
        <mesh key={i} position={[-len / 2 + (i * len) / posts, (h + 0.15) / 2, 0]} castShadow>
          <boxGeometry args={[0.36, h + 0.15, 0.36]} />
          <meshStandardMaterial color="#b4583a" roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

/** กำแพงปูนฉาบสีขาว (สูง 1.3 ม.) มีบัวด้านบน เสาทุก ๆ 2.5 ม. + ทางเดินแผ่นปูนข้างบ่อปลา — วางด้วยพิกัดโลก */
export function RotWalls() {
  const p = ROT_PATH
  const H = 1.3
  return (
    <group>
      {ROT_WALLS.map((w, i) => {
        const len = Math.hypot(w.x1 - w.x0, w.z1 - w.z0)
        const rot = Math.atan2(w.x1 - w.x0, w.z1 - w.z0)
        const n = Math.max(1, Math.round(len / 2.5))
        return (
          <group key={i} position={[(w.x0 + w.x1) / 2, 0, (w.z0 + w.z1) / 2]} rotation={[0, rot, 0]}>
            <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[WALL_T, H, len]} />
              <meshStandardMaterial color="#f4f1ea" roughness={0.9} />
            </mesh>
            <mesh position={[0, H + 0.04, 0]}>
              <boxGeometry args={[WALL_T + 0.1, 0.08, len + 0.1]} />
              <meshStandardMaterial color="#d8d4ca" roughness={0.9} />
            </mesh>
            {Array.from({ length: n + 1 }, (_, k) => (
              <mesh key={k} position={[0, (H + 0.15) / 2, -len / 2 + (k * len) / n]} castShadow>
                <boxGeometry args={[WALL_T + 0.14, H + 0.15, 0.34]} />
                <meshStandardMaterial color="#ffffff" roughness={0.85} />
              </mesh>
            ))}
            {/* ขอบล่างสีเทากันดินกระเด็น */}
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[WALL_T + 0.03, 0.2, len]} />
              <meshStandardMaterial color="#a8a49a" />
            </mesh>
          </group>
        )
      })}
      <RoseArchGate />
      {/* ทางเดินแผ่นปูนข้างบ่อ */}
      {Array.from({ length: Math.floor((p.z1 - p.z0) / 0.9) }, (_, k) => (
        <mesh key={'s' + k} position={[(p.x0 + p.x1) / 2, 0.035, p.z0 + 0.45 + k * 0.9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[p.x1 - p.x0 - 0.2, 0.75]} />
          <meshStandardMaterial color="#d2cdc2" roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

/** ใบประตูบานขาวหัวโค้ง (ระแนงตั้ง) · บานพับอยู่ที่ x=0 ตัวบานยื่นไปทาง +x */
function GateLeaf({ w, flip }: { w: number; flip: number }) {
  const n = 7
  return (
    <group scale={[flip, 1, 1]}>
      {Array.from({ length: n }, (_, i) => {
        const x = 0.08 + (i / (n - 1)) * (w - 0.16)
        // หัวโค้งสูงขึ้นไปทางกลางประตู (ปลายบาน)
        const h = 1.25 + Math.sin(((x / w) * Math.PI) / 2) * 0.35
        return (
          <mesh key={i} position={[x, h / 2 + 0.05, 0]} castShadow>
            <boxGeometry args={[0.07, h, 0.04]} />
            <meshStandardMaterial color="#f8f8f4" roughness={0.6} />
          </mesh>
        )
      })}
      {[0.3, 1.05].map((y) => (
        <mesh key={y} position={[w / 2, y, 0.03]}>
          <boxGeometry args={[w, 0.09, 0.04]} />
          <meshStandardMaterial color="#f8f8f4" roughness={0.6} />
        </mesh>
      ))}
      {/* กรอบข้างบาน + มือจับดำ */}
      <mesh position={[0.03, 0.75, 0]}>
        <boxGeometry args={[0.08, 1.45, 0.06]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[w - 0.12, 0.95, 0.05]}>
        <boxGeometry args={[0.03, 0.14, 0.03]} />
        <meshStandardMaterial color="#222" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  )
}

/** ซุ้มประตูโค้งสีขาว กุหลาบเลื้อยคลุม (ขาว-ชมพู) + ประตูบานคู่สีขาวหัวโค้ง เปิดแง้มออกด้านนอก · ทางเดินอิฐ */
function RoseArchGate() {
  const g = ROT_GATE
  const w = g.x1 - g.x0
  const cx = (g.x0 + g.x1) / 2
  const roses = useMemo(() => {
    const out: [number, number, number, number][] = []
    let s = 77
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    // ตามแนวโค้ง
    for (let i = 0; i < 46; i++) {
      const a = r() * Math.PI
      const R = w / 2 + 0.1 + (r() - 0.5) * 0.25
      out.push([Math.cos(a) * R, 2.3 + Math.sin(a) * R * 0.55, (r() - 0.5) * 0.45, r() < 0.7 ? 0 : 1])
    }
    // ไหลลงตามเสา
    for (let i = 0; i < 30; i++) {
      const side = i % 2 ? 1 : -1
      out.push([side * (w / 2 + 0.12 + (r() - 0.5) * 0.25), 0.4 + r() * 1.9, (r() - 0.5) * 0.4, r() < 0.65 ? 0 : 1])
    }
    return out
  }, [w])
  return (
    <group position={[cx, 0, g.z]}>
      {/* เสาซุ้ม 4 ต้น (หน้า-หลัง) */}
      {[-1, 1].flatMap((sx) =>
        [-0.2, 0.2].map((dz) => (
          <mesh key={sx + ':' + dz} position={[sx * (w / 2 + 0.05), 1.15, dz]} castShadow>
            <boxGeometry args={[0.16, 2.3, 0.16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
        )),
      )}
      {/* โค้งซุ้ม (สองแนว) + คานขวาง */}
      {[-0.2, 0.2].map((dz) => (
        <mesh key={dz} position={[0, 2.3, dz]} scale={[1, 0.55, 1]}>
          <torusGeometry args={[w / 2 + 0.05, 0.07, 8, 28, Math.PI]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 6) * Math.PI
        return (
          <mesh key={'c' + i} position={[Math.cos(a) * (w / 2 + 0.05), 2.3 + Math.sin(a) * (w / 2 + 0.05) * 0.55, 0]}>
            <boxGeometry args={[0.07, 0.07, 0.5]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} />
          </mesh>
        )
      })}
      {/* ใบกุหลาบเลื้อย + ดอก */}
      {roses.map(([x, y, z], i) =>
        i % 2 === 0 ? (
          <mesh key={'l' + i} position={[x * 0.98, y - 0.05, z]} scale={[1, 0.8, 1]}>
            <icosahedronGeometry args={[0.16, 1]} />
            <meshStandardMaterial color={i % 4 ? '#4f8a3c' : '#5e9a48'} roughness={0.9} />
          </mesh>
        ) : null,
      )}
      {roses.map(([x, y, z, c], i) => (
        <mesh key={'r' + i} position={[x, y, z + 0.06]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshStandardMaterial color={c ? '#f2a0b8' : '#fbf6ec'} roughness={0.6} />
        </mesh>
      ))}
      {/* ประตูบานคู่: บานพับที่เสาสองข้าง เปิดแง้มออกด้านนอก (+z) */}
      <group position={[-w / 2 + 0.05, 0, 0]} rotation={[0, -0.95, 0]}>
        <GateLeaf w={w / 2 - 0.05} flip={1} />
      </group>
      <group position={[w / 2 - 0.05, 0, 0]} rotation={[0, 0.95, 0]}>
        <GateLeaf w={w / 2 - 0.05} flip={-1} />
      </group>
      {/* ทางเดินอิฐหน้าประตู */}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={'p' + i} position={[0, 0.03, -1.2 + i * 0.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w - 0.4, 0.7]} />
          <meshStandardMaterial color={i % 2 ? '#c8a888' : '#bc9c7c'} roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}
