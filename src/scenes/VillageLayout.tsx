import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { usePlay } from '../game/play'
import type { Road } from '../game/content/village'
import { useGame } from '../game/store'
import { seasonOf } from '../game/content/noticeboard'
import { RBox } from './models/RBox'
import { Bush, GableRoof, PicketFence } from './models/House'
import { SignBoard } from './SignBoard'

// ======================================================================
// ถนน: ถนนใหญ่ = คอนกรีต (เรียบ มีรอยต่อแผ่น เส้นกลางสีเหลือง) · ถนนซอย = ดินแดง (รอยล้อ ฝุ่น หน้าฝนมีแอ่งน้ำ/โคลน)
// ======================================================================
export function RoadSurface({ road, index }: { road: Road; index: number }) {
  const [ax, az] = road.from
  const [bx, bz] = road.to
  const len = Math.hypot(bx - ax, bz - az)
  const angle = Math.atan2(bx - ax, bz - az)
  const day = useGame((s) => s.save?.day ?? 1)
  const rainy = seasonOf(day) === 'rain'
  const concrete = road.surface === 'concrete'
  return (
    <group position={[(ax + bx) / 2, 0, (az + bz) / 2]} rotation={[0, angle, 0]}>
      {concrete ? <Concrete w={road.width} len={len} /> : <Dirt w={road.width} len={len} seed={index} rainy={rainy} />}
    </group>
  )
}

/** แถบพื้น (วางราบ แกนยาวตาม z ของถนน) */
const Strip = ({ x = 0, z = 0, w, l, y, color, opacity = 1 }: { x?: number; z?: number; w: number; l: number; y: number; color: string; opacity?: number }) => (
  <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[w, l]} />
    <meshStandardMaterial color={color} roughness={0.95} transparent={opacity < 1} opacity={opacity} depthWrite={opacity >= 1} />
  </mesh>
)

function Concrete({ w, len }: { w: number; len: number }) {
  const joints = Math.floor(len / 4)
  return (
    <group>
      {/* ไหล่ทางดิน */}
      <Strip w={w + 1.2} l={len} y={0.028} color="#b69a6a" />
      <Strip w={w} l={len} y={0.034} color="#cfccc3" />
      {/* รอยต่อแผ่นคอนกรีต */}
      {Array.from({ length: joints }).map((_, i) => (
        <Strip key={i} z={-len / 2 + (i + 1) * 4} w={w} l={0.05} y={0.037} color="#a9a59b" />
      ))}
      <Strip w={0.05} l={len} y={0.037} color="#b3afa5" />
      {[-1, 1].map((s) => (
        <Strip key={'e' + s} x={s * (w / 2 - 0.3)} w={0.12} l={len} y={0.038} color="#f4f2ea" />
      ))}
      {/* เส้นกลางถนนสีเหลืองแบบประ (แบ่ง 2 เลน) */}
      {Array.from({ length: Math.floor(len / 6) }).map((_, i) => (
        <Strip key={'y' + i} x={0.18} z={-len / 2 + 3 + i * 6} w={0.16} l={2.6} y={0.038} color="#e8c23a" />
      ))}
      {/* คราบล้อรถจาง ๆ */}
      {[-1, 1].map((s) => (
        <Strip key={'t' + s} x={s * w * 0.27} w={0.55} l={len} y={0.036} color="#bdb9af" opacity={0.6} />
      ))}
    </group>
  )
}

function Dirt({ w, len, seed, rainy }: { w: number; len: number; seed: number; rainy: boolean }) {
  const spots = useMemo(() => {
    let s = seed * 9301 + 49297
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
    const n = Math.max(3, Math.floor(len / 5))
    return Array.from({ length: n }).map(() => ({ x: (r() - 0.5) * w * 0.7, z: (r() - 0.5) * len * 0.92, sx: 0.6 + r() * 1.2, sz: 0.8 + r() * 1.8, kind: r() }))
  }, [w, len, seed])
  return (
    <group>
      {/* ขอบทางหญ้าปนดิน */}
      <Strip w={w + 0.9} l={len} y={0.02} color="#a8925e" />
      {/* ดินแดงลูกรัง */}
      <Strip w={w} l={len} y={0.026} color="#b8673f" />
      {/* รอยล้อรถสองแนว */}
      {[-1, 1].map((s) => (
        <Strip key={s} x={s * w * 0.22} w={w * 0.09} l={len} y={0.029} color="#a65c3a" opacity={0.75} />
      ))}
      {/* หญ้าแซมกลางทาง */}
      <Strip w={w * 0.07} l={len} y={0.028} color="#a8804c" opacity={0.5} />
      {spots.map((p, i) =>
        p.kind < 0.45 ? (
          // ฝุ่นดินสีอ่อน / พื้นไม่เรียบ
          <mesh key={i} position={[p.x, 0.031, p.z]} rotation={[-Math.PI / 2, 0, p.sx]} scale={[p.sx, p.sz, 1]}>
            <circleGeometry args={[0.5, 14]} />
            <meshStandardMaterial color="#d08a5c" roughness={1} transparent opacity={0.55} depthWrite={false} />
          </mesh>
        ) : p.kind < 0.75 ? (
          // หินกรวดเล็ก ๆ
          <mesh key={i} position={[p.x, 0.05, p.z]} scale={[1, 0.5, 1]} castShadow>
            <dodecahedronGeometry args={[0.07 + p.sx * 0.03, 0]} />
            <meshStandardMaterial color="#8a6a52" roughness={1} />
          </mesh>
        ) : rainy ? (
          // หน้าฝน: แอ่งน้ำ + โคลนรอบ ๆ
          <group key={i} position={[p.x, 0, p.z]} scale={[p.sx, 1, p.sz]}>
            <mesh position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.75, 18]} />
              <meshStandardMaterial color="#6e4130" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.034, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.55, 18]} />
              <meshStandardMaterial color="#8fa3a8" roughness={0.08} metalness={0.2} />
            </mesh>
          </group>
        ) : (
          // หน้าแล้ง: รอยแตกดินแห้ง
          <mesh key={i} position={[p.x, 0.031, p.z]} rotation={[-Math.PI / 2, 0, p.sz]} scale={[p.sx, p.sz * 0.6, 1]}>
            <circleGeometry args={[0.45, 6]} />
            <meshStandardMaterial color="#a65a36" roughness={1} />
          </mesh>
        ),
      )}
    </group>
  )
}

// ======================================================================
// ร้านค้า
// ======================================================================
/** ร้านค้าขนาดใหญ่ริมถนนใหญ่ (ป้าศรี) */
export function BigStore({ w, d }: { w: number; d: number }) {
  return (
    <group>
      <mesh position={[0, 0.08, d / 2 + 1.4]} receiveShadow>
        <RBox args={[w + 1, 0.16, 2.8]} radius={0.06} />
        <meshStandardMaterial color="#d6cfc0" />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <RBox args={[w, 3.6, d]} radius={0.32} />
        <meshStandardMaterial color="#efe3c8" />
      </mesh>
      {/* หน้าร้านเปิดโล่ง */}
      <mesh position={[0, 1.4, d / 2 + 0.03]}>
        <RBox args={[w * 0.7, 2.6, 0.08]} radius={0.04} />
        <meshStandardMaterial color="#3e3226" />
      </mesh>
      {/* กันสาดยาวหน้าร้าน */}
      <mesh position={[0, 3.25, d / 2 + 1.3]} rotation={[0.2, 0, 0]} castShadow>
        <RBox args={[w + 0.6, 0.16, 2.6]} radius={0.07} />
        <meshStandardMaterial color="#3f7a8c" />
      </mesh>
      {[-w / 2 + 0.3, w / 2 - 0.3].map((x) => (
        <mesh key={x} position={[x, 1.5, d / 2 + 2.4]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 3, 10]} />
          <meshStandardMaterial color="#8a8f86" />
        </mesh>
      ))}
      {/* ป้ายชื่อร้าน */}
      <group position={[0, 4.05, d / 2 + 0.08]}>
        <SignBoard lines={['ร้านค้าป้าศรี']} width={4.2} height={0.7} bg="#c2412d" ink="#fff6d8" frame="#8a2a1e" />
      </group>
      {/* ลังน้ำ ตู้แช่ ชั้นวางหน้าร้าน */}
      {[-4.3, -3.2, 3.4, 4.4].map((x, i) => (
        <mesh key={x} position={[x, 0.55, d / 2 + 1]} castShadow>
          <RBox args={[0.9, 0.95, 0.7]} radius={0.12} />
          <meshStandardMaterial color={['#c2412d', '#3f7a8c', '#d9a441', '#5f9e47'][i]} />
        </mesh>
      ))}
      <GableRoof width={w} depth={d} height={1.4} y={3.6} color="#8b8f86" overhang={0.4} />
      <Bush x={-w / 2 - 0.8} z={d / 2 + 0.4} s={1} flowers="#f6c445" />
      <Bush x={w / 2 + 0.2} z={-d / 2 - 0.6} s={0.9} flowers={null} />
    </group>
  )
}

/** ร้านประจำซอย: เรือนไม้เล็ก มีกันสาดสีประจำร้าน แผงของหน้าร้าน */
export function Stall({ w, d, color, name }: { w: number; d: number; color: string; name: string }) {
  return (
    <group>
      <mesh position={[0, 1.3, -0.5]} castShadow receiveShadow>
        <RBox args={[w, 2.6, d - 1]} radius={0.26} />
        <meshStandardMaterial color="#a8805a" />
      </mesh>
      <GableRoof width={w} depth={d - 1} height={1.1} y={2.6} color="#7a4a2e" overhang={0.35} />
      {/* ประตูร้าน */}
      <mesh position={[-w / 2 + 1.1, 1.05, (d - 1) / 2 - 0.5 + 0.03]}>
        <RBox args={[0.9, 1.9, 0.06]} radius={0.03} />
        <meshStandardMaterial color="#4a3020" />
      </mesh>
      {/* กันสาดผ้าใบลายทาง */}
      <mesh position={[0, 2.3, d / 2 - 0.2]} rotation={[0.3, 0, 0]} castShadow>
        <RBox args={[w + 0.2, 0.08, 1.6]} radius={0.03} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* แผงขายของ */}
      <mesh position={[0, 0.5, d / 2 - 0.3]} castShadow>
        <RBox args={[w - 0.8, 0.9, 0.8]} radius={0.1} />
        <meshStandardMaterial color="#c9a46c" />
      </mesh>
      {[-1.6, -0.6, 0.4, 1.4].map((x, i) => (
        <mesh key={x} position={[x, 1.05, d / 2 - 0.3]}>
          <icosahedronGeometry args={[0.2, 1]} />
          <meshStandardMaterial color={[color, '#f2cf45', '#e86a5a', '#7cbf4e'][i]} flatShading />
        </mesh>
      ))}
      <group position={[0, 3.55, -0.5 + (d - 1) / 2 + 0.08]}>
        <SignBoard lines={[name]} width={Math.min(4.6, w)} height={0.55} />
      </group>
      <Bush x={w / 2 + 0.5} z={d / 2 - 0.5} s={0.7} flowers="#f29ab8" />
    </group>
  )
}

/** อู่ซ่อมรถ (ติดร้านค้าใหญ่): โรงเปิดหน้า กองยาง ถังน้ำมัน รถไถเดินตาม จักรยาน */
export function Garage({ w, d }: { w: number; d: number }) {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <RBox args={[w, 0.1, d]} radius={0.04} />
        <meshStandardMaterial color="#9a958a" />
      </mesh>
      <mesh position={[0, 1.5, -d / 2 + 0.15]} castShadow>
        <RBox args={[w, 3, 0.3]} radius={0.1} />
        <meshStandardMaterial color="#c9c0ae" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.15), 1.5, 0]} castShadow>
          <RBox args={[0.3, 3, d]} radius={0.1} />
          <meshStandardMaterial color="#c9c0ae" />
        </mesh>
      ))}
      <mesh position={[0, 3.15, 0.3]} rotation={[0.08, 0, 0]} castShadow>
        <RBox args={[w + 0.6, 0.12, d + 1]} radius={0.05} />
        <meshStandardMaterial color="#8fa0a8" />
      </mesh>
      <group position={[0, 3.6, d / 2 + 0.6]}>
        <SignBoard lines={['อู่ซ่อมรถ']} width={2.6} height={0.6} bg="#2f5f8a" ink="#ffffff" frame="#1f3f5a" />
      </group>
      {/* กองยางรถ */}
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[-w / 2 + 1.2, 0.18 + k * 0.24, d / 2 - 1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.38, 0.13, 8, 18]} />
          <meshStandardMaterial color="#2a2a2c" roughness={0.9} />
        </mesh>
      ))}
      {/* ถังน้ำมัน */}
      {[0, 1].map((k) => (
        <mesh key={k} position={[w / 2 - 0.9 - k * 0.7, 0.45, -d / 2 + 0.9]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.9, 14]} />
          <meshStandardMaterial color={k ? '#3f7a8c' : '#c2412d'} />
        </mesh>
      ))}
      {/* รถไถเดินตาม (ควายเหล็ก) */}
      <group position={[0.4, 0, 0]}>
        <mesh position={[0, 0.65, 0]} castShadow>
          <RBox args={[0.9, 0.6, 0.7]} radius={0.12} />
          <meshStandardMaterial color="#c2412d" />
        </mesh>
        {[-0.5, 0.5].map((x) => (
          <mesh key={x} position={[x, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.18, 16]} />
            <meshStandardMaterial color="#2a2a2c" />
          </mesh>
        ))}
        {[-0.25, 0.25].map((x) => (
          <mesh key={'h' + x} position={[x, 0.9, 1.1]} rotation={[-0.9, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
            <meshStandardMaterial color="#6b6e72" metalness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** ลานกิจกรรมหมู่บ้าน: ลานดินอัด เวทีมีหลังคา ธงราว ซุ้มไฟ ม้านั่ง */
export function EventGround({ w, d }: { w: number; d: number }) {
  const flags = ['#d0503e', '#f6c445', '#3f7a8c', '#5f9e47', '#c99af0', '#ffffff']
  return (
    <group>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#d6bf92" roughness={1} />
      </mesh>
      {/* เวที */}
      <group position={[0, 0, -d / 2 + 2.6]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <RBox args={[8, 0.9, 4]} radius={0.12} />
          <meshStandardMaterial color="#8a5a34" />
        </mesh>
        {[-3.7, 3.7].map((x) => (
          <mesh key={x} position={[x, 2.4, -1.7]} castShadow>
            <RBox args={[0.25, 3.2, 0.25]} radius={0.08} />
            <meshStandardMaterial color="#6e4a2e" />
          </mesh>
        ))}
        <mesh position={[0, 2.2, -1.85]}>
          <RBox args={[7.2, 2.6, 0.08]} radius={0.03} />
          <meshStandardMaterial color="#b8323a" />
        </mesh>
        <GableRoof width={8} depth={4} height={1.2} y={4} color="#c0703c" overhang={0.4} />
      </group>
      {/* ธงราวหลากสีรอบลาน */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * (d / 2 - 0.4)]}>
          {[-w / 2 + 0.5, w / 2 - 0.5].map((x) => (
            <mesh key={x} position={[x, 1.6, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 3.2, 8]} />
              <meshStandardMaterial color="#c9b48c" />
            </mesh>
          ))}
          {Array.from({ length: 18 }).map((_, i) => {
            const t = i / 17
            const x = -w / 2 + 0.5 + t * (w - 1)
            const y = 3.05 - Math.sin(t * Math.PI) * 0.5
            return (
              <mesh key={i} position={[x, y, 0]} rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.16, 0.32, 3]} />
                <meshStandardMaterial color={flags[i % flags.length]} side={2} />
              </mesh>
            )
          })}
        </group>
      ))}
      {/* ม้านั่งยาว */}
      {[-4, 0, 4].map((x) => (
        <mesh key={x} position={[x, 0.4, 2.5]} castShadow>
          <RBox args={[3, 0.12, 0.5]} radius={0.05} />
          <meshStandardMaterial color="#7a5236" />
        </mesh>
      ))}
      <Bush x={-w / 2 - 0.4} z={0} s={1} flowers="#f6c445" />
      <Bush x={w / 2 + 0.4} z={1} s={1} flowers="#e86a5a" />
    </group>
  )
}

// ======================================================================
// บ่อน้ำใหญ่ระหว่างโรงเรียนกับวัด + สะพานไม้ทางเดินเดิม
// ======================================================================
export function Lake({ w, d }: { w: number; d: number }) {
  const bridgeZ = -2
  const span = w + 8
  return (
    <group>
      {/* ตลิ่ง */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w + 1.6, d + 1.6]} />
        <meshStandardMaterial color="#7a6a4a" roughness={1} />
      </mesh>
      {/* น้ำ */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#4f8a7c" roughness={0.12} metalness={0.15} />
      </mesh>
      {/* บัวและพืชน้ำ */}
      {[
        [-6, 8],
        [-4, 10],
        [5, -9],
        [7, 6],
        [-7, -7],
        [2, 11],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.045, z]} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[0.7, 12, 0, Math.PI * 1.8]} />
          <meshStandardMaterial color="#4f8a46" />
        </mesh>
      ))}
      {[
        [-6.3, 8.2],
        [5.2, -8.8],
      ].map(([x, z], i) => (
        <mesh key={'f' + i} position={[x, 0.15, z]}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshStandardMaterial color="#f2a7c0" />
        </mesh>
      ))}
      {/* สะพานไม้ทางเดิน: พื้นกระดาน ราวไม้สีเข้ม เสาหัวเม็ด */}
      <group position={[0, 0, bridgeZ]}>
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <RBox args={[span, 0.14, 2.6]} radius={0.04} />
          <meshStandardMaterial color="#8a6040" roughness={0.9} />
        </mesh>
        {Array.from({ length: Math.floor(span / 0.6) }).map((_, i) => (
          <mesh key={i} position={[-span / 2 + 0.3 + i * 0.6, 0.175, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.04, 2.5]} />
            <meshBasicMaterial color="#5e3e26" />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <group key={s} position={[0, 0, s * 1.25]}>
            {Array.from({ length: Math.floor(span / 2.4) + 1 }).map((_, i) => (
              <group key={i} position={[-span / 2 + i * 2.4, 0, 0]}>
                <mesh position={[0, 0.65, 0]} castShadow>
                  <RBox args={[0.18, 1.1, 0.18]} radius={0.05} />
                  <meshStandardMaterial color="#4a3020" />
                </mesh>
                <mesh position={[0, 1.3, 0]}>
                  <sphereGeometry args={[0.12, 10, 8]} />
                  <meshStandardMaterial color="#4a3020" />
                </mesh>
              </group>
            ))}
            {[0.55, 1.05].map((y) => (
              <mesh key={y} position={[0, y, 0]}>
                <RBox args={[span, 0.08, 0.08]} radius={0.03} />
                <meshStandardMaterial color="#5a3a24" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
      <Bush x={w / 2 + 1.5} z={d / 2 - 2} s={1.1} flowers="#f29ab8" />
      <Bush x={-w / 2 - 1.5} z={-d / 2 + 3} s={1} flowers="#ffffff" />
      <Bush x={w / 2 + 1.2} z={-d / 2 + 2} s={0.9} flowers={null} />
    </group>
  )
}

// ======================================================================
// โรงเรียนวัดบ้านไพบูลย์ (โรงเรียนขนาดใหญ่มาก)
// ======================================================================
export function Campus({ size }: { size: number }) {
  const h = size / 2
  return (
    <group>
      {/* พื้นในรั้ว */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#9ab468" />
      </mesh>
      {/* ลานหน้าเสาธง + ทางเดินจากประตูเหนือ และทางไปประตูสะพาน */}
      <mesh position={[0, 0.03, 4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 26]} />
        <meshStandardMaterial color="#d8c39a" />
      </mesh>
      <mesh position={[8, 0.032, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 3]} />
        <meshStandardMaterial color="#d8c39a" />
      </mesh>
      <MainBuilding z={-11.8} />
      <Flagpole z={-2} />
      <Dome x={-10} z={-2} />
      <Stage x={8} z={-5} />
      <Toilets x={14.8} z={-5} />
      <Playground x={-10.5} z={9.5} />
      <Canteen x={8.5} z={9.5} />
      <SchoolGarden x={14} z={-13} />
      {/* ลานเล่นโล่ง: ต้นไม้ร่ม ม้านั่ง */}
      {[-2.5, 2.5].map((x) => (
        <mesh key={x} position={[x, 0.4, 13]} castShadow>
          <RBox args={[1.6, 0.12, 0.45]} radius={0.05} />
          <meshStandardMaterial color="#7a5236" />
        </mesh>
      ))}
      {/* รั้วรอบโรงเรียน (เว้นประตูเหนือ + ประตูตะวันออกไปสะพาน) */}
      <PicketFence x={0} z={-h} len={size} />
      <PicketFence x={-h} z={0} len={size} rot={Math.PI / 2} />
      <PicketFence x={(-h - 2.5) / 2} z={h} len={h - 2.5} />
      <PicketFence x={(h + 2.5) / 2} z={h} len={h - 2.5} />
      <PicketFence x={h} z={(-h - 3.5) / 2} len={h - 3.5} rot={Math.PI / 2} />
      <PicketFence x={h} z={(h - 0.5) / 2} len={h + 0.5} rot={Math.PI / 2} />
      {/* ซุ้มประตูหน้าโรงเรียน + ป้ายชื่อ */}
      <group position={[0, 0, h]}>
        {[-2.6, 2.6].map((x) => (
          <mesh key={x} position={[x, 1.3, 0]} castShadow>
            <RBox args={[0.6, 2.6, 0.6]} radius={0.12} />
            <meshStandardMaterial color="#e9e1cf" />
          </mesh>
        ))}
        <mesh position={[0, 2.85, 0]} castShadow>
          <RBox args={[6.2, 0.5, 0.7]} radius={0.1} />
          <meshStandardMaterial color="#2f5f8a" />
        </mesh>
        <group position={[0, 2.85, 0.37]}>
          <SignBoard lines={['โรงเรียนวัดบ้านไพบูลย์']} width={5.6} height={0.42} bg="#2f5f8a" ink="#ffffff" frame="#2f5f8a" />
        </group>
      </group>
      {/* ต้นไม้ร่มรื่นในโรงเรียน */}
      <Bush x={-h + 1.5} z={h - 1.5} s={1.3} flowers="#f6c445" />
      <Bush x={h - 1.5} z={h - 1.5} s={1.3} flowers="#e86a5a" />
      <Bush x={-h + 1.5} z={-h + 1.5} s={1.2} flowers={null} />
    </group>
  )
}

/** อาคารเรียนหลัก 3 ชั้น ระเบียงทางเดินยาว หลังคาสีส้ม */
function MainBuilding({ z }: { z: number }) {
  const W = 24
  const D = 6
  const floors = 3
  const fh = 3
  return (
    <group position={[0, 0, z]}>
      {Array.from({ length: floors }).map((_, f) => (
        <group key={f} position={[0, f * fh, 0]}>
          <mesh position={[0, fh / 2, 0]} castShadow receiveShadow>
            <RBox args={[W, fh, D]} radius={0.3} />
            <meshStandardMaterial color={f % 2 ? '#f6edd8' : '#f1e6cc'} />
          </mesh>
          {/* ระเบียงทางเดิน + ราวกันตก */}
          <mesh position={[0, 0.06, D / 2 + 0.7]} castShadow>
            <RBox args={[W, 0.14, 1.4]} radius={0.05} />
            <meshStandardMaterial color="#c9b48c" />
          </mesh>
          {f > 0 && (
            <mesh position={[0, 0.6, D / 2 + 1.35]}>
              <RBox args={[W, 0.9, 0.1]} radius={0.04} />
              <meshStandardMaterial color="#e9dfc6" />
            </mesh>
          )}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={i} position={[-W / 2 + 1.6 + i * 2.95, fh * 0.55, D / 2 + 0.03]}>
              <RBox args={[1.6, 1.2, 0.08]} radius={0.04} />
              <meshStandardMaterial color="#6d8fa8" />
            </mesh>
          ))}
        </group>
      ))}
      {[-W / 2 + 0.2, -W / 4, 0, W / 4, W / 2 - 0.2].map((x) => (
        <mesh key={x} position={[x, (floors * fh) / 2, D / 2 + 1.35]} castShadow>
          <RBox args={[0.25, floors * fh, 0.25]} radius={0.08} />
          <meshStandardMaterial color="#e9dfc6" />
        </mesh>
      ))}
      <GableRoof width={W} depth={D + 1.6} height={2.2} y={floors * fh} color="#d0703c" overhang={0.7} />
      <group position={[0, floors * fh - 0.6, D / 2 + 1.42]}>
        <SignBoard lines={['อาคารเรียน 1']} width={3} height={0.5} bg="#2f5f8a" ink="#ffffff" frame="#2f5f8a" />
      </group>
    </group>
  )
}

function Flagpole({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <cylinderGeometry args={[1, 1.1, 0.4, 20]} />
        <meshStandardMaterial color="#e2dccd" />
      </mesh>
      <mesh position={[0, 4.2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 8, 10]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* ธงชาติไทย (แดง ขาว น้ำเงิน ขาว แดง) */}
      {(
        [
          ['#a51931', 0, 1],
          ['#f4f5f8', 1, 1],
          ['#2d2a4a', 2, 2],
          ['#f4f5f8', 4, 1],
          ['#a51931', 5, 1],
        ] as const
      ).map(([c, row, hh]) => (
        <mesh key={row} position={[0.66, 7.9 - (row + hh / 2) * 0.12, 0]}>
          <planeGeometry args={[1.2, 0.12 * hh]} />
          <meshStandardMaterial color={c} side={2} />
        </mesh>
      ))}
    </group>
  )
}

/** โดมกีฬา: หลังคาโค้งบนเสาเหล็ก สนามเอนกประสงค์ แป้นบาส */
function Dome({ x, z }: { x: number; z: number }) {
  const W = 12
  const D = 9
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#5f8fa8" />
      </mesh>
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.2, 28]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 0, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2), 2.2, sz * (D / 2 - 0.3)]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 4.4, 10]} />
            <meshStandardMaterial color="#8a9aa8" metalness={0.4} />
          </mesh>
        )),
      )}
      {/* หลังคาโค้ง */}
      <mesh position={[0, 4.4, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]} scale={[1, 1, 0.45]} castShadow>
        <cylinderGeometry args={[W / 2 + 0.4, W / 2 + 0.4, D + 0.6, 24, 1, true, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color="#c8d4dc" side={2} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* แป้นบาส 2 ฝั่ง */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (W / 2 - 0.8), 0, 0]}>
          <mesh position={[0, 1.6, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 3.2, 8]} />
            <meshStandardMaterial color="#6b6e72" />
          </mesh>
          <mesh position={[-s * 0.25, 3.1, 0]} rotation={[0, Math.PI / 2, 0]}>
            <RBox args={[1.2, 0.8, 0.06]} radius={0.02} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-s * 0.5, 2.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.02, 6, 16]} />
            <meshStandardMaterial color="#e0602e" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** เวทีกิจกรรมโรงเรียน */
function Stage({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <RBox args={[6.6, 1, 2.6]} radius={0.1} />
        <meshStandardMaterial color="#8a5a34" />
      </mesh>
      <mesh position={[0, 2.2, -1.2]}>
        <RBox args={[6.4, 2.4, 0.12]} radius={0.04} />
        <meshStandardMaterial color="#2f5f8a" />
      </mesh>
      <GableRoof width={6.6} depth={2.8} height={0.9} y={3.5} color="#d0703c" overhang={0.3} />
      {[-3.1, 3.1].map((sx) => (
        <mesh key={sx} position={[sx, 2, 1]} castShadow>
          <RBox args={[0.2, 3, 0.2]} radius={0.06} />
          <meshStandardMaterial color="#6e4a2e" />
        </mesh>
      ))}
    </group>
  )
}

function Toilets({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <RBox args={[3, 2.4, 3]} radius={0.22} />
        <meshStandardMaterial color="#e6eef0" />
      </mesh>
      <GableRoof width={3} depth={3} height={0.8} y={2.4} color="#3f7a8c" overhang={0.25} />
      {[-0.7, 0.7].map((dx, i) => (
        <mesh key={dx} position={[dx, 1, 1.52]}>
          <RBox args={[0.7, 1.7, 0.05]} radius={0.03} />
          <meshStandardMaterial color={i ? '#e88aa8' : '#5f9fd8'} />
        </mesh>
      ))}
      <group position={[0, 2.05, 1.56]}>
        <SignBoard lines={['ห้องน้ำ']} width={1.3} height={0.32} />
      </group>
    </group>
  )
}

/** โรงอาหาร: เพิงหลังคาโล่ง โต๊ะยาวม้านั่ง เคาน์เตอร์ตักอาหาร */
function Canteen({ x, z }: { x: number; z: number }) {
  const W = 9
  const D = 6
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <RBox args={[W, 0.1, D]} radius={0.04} />
        <meshStandardMaterial color="#cfc8b8" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.2), 1.4, sz * (D / 2 - 0.2)]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 2.8, 10]} />
            <meshStandardMaterial color="#8a9aa8" />
          </mesh>
        )),
      )}
      <GableRoof width={W} depth={D} height={1} y={2.8} color="#5f9e47" overhang={0.4} />
      <group position={[0, 3.1, D / 2 + 0.45]}>
        <SignBoard lines={['โรงอาหาร']} width={1.8} height={0.36} />
      </group>
      {[-2.4, 0, 2.4].map((tx) => (
        <group key={tx} position={[tx, 0, 0.6]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <RBox args={[1.2, 0.08, 3]} radius={0.03} />
            <meshStandardMaterial color="#e8d6b0" />
          </mesh>
          {[-0.85, 0.85].map((bx) => (
            <mesh key={bx} position={[bx, 0.42, 0]} castShadow>
              <RBox args={[0.3, 0.08, 3]} radius={0.03} />
              <meshStandardMaterial color="#7a5236" />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.5, -D / 2 + 0.6]} castShadow>
        <RBox args={[W - 1.5, 1, 0.8]} radius={0.12} />
        <meshStandardMaterial color="#c9b48c" />
      </mesh>
      {[-2.5, -0.8, 0.9, 2.6].map((px) => (
        <mesh key={px} position={[px, 1.1, -D / 2 + 0.6]}>
          <cylinderGeometry args={[0.3, 0.25, 0.25, 14]} />
          <meshStandardMaterial color="#b9c0c6" metalness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

/** สนามเด็กเล่น: ชิงช้า + เครื่องเล่นอีก 10 อย่าง — เล่นได้จริง (เครื่องเล่นขยับตามผู้เล่น) */
function Playground({ x, z }: { x: number; z: number }) {
  const col = ['#e0503a', '#f2c230', '#4a90d8', '#5fbf4a', '#c99af0']
  const seats = useRef<(Group | null)[]>([])
  const plank = useRef<Group>(null)
  const merry = useRef<Group>(null)
  const riders = useRef<(Group | null)[]>([])
  useFrame(() => {
    const p = usePlay.getState().playing
    const t = p ? (performance.now() - p.t0) / 1000 : 0
    seats.current.forEach((g, i) => {
      if (!g) return
      if (p?.spot.id === 'swing-' + i) {
        const amp = Math.min(1, t / 2) * Math.max(0.2, 1 - Math.max(0, t - 5) / 3) * 0.75
        g.rotation.x = -Math.sin(t * 2.3) * amp
      } else g.rotation.x *= 0.92
    })
    if (plank.current) plank.current.rotation.z = p?.spot.kind === 'seesaw' ? Math.sin(t * 2.2) * 0.25 : plank.current.rotation.z * 0.92
    if (merry.current && p?.spot.kind === 'merry') merry.current.rotation.y = -t * 1.8
    riders.current.forEach((g, i) => {
      if (!g) return
      g.rotation.x = p?.spot.id === 'spring-' + i ? Math.sin(t * 4) * 0.18 : g.rotation.x * 0.9
    })
  })
  const Pole = ({ p, h, r = 0.06, c = '#4a90d8' }: { p: [number, number]; h: number; r?: number; c?: string }) => (
    <mesh position={[p[0], h / 2, p[1]]} castShadow>
      <cylinderGeometry args={[r, r, h, 10]} />
      <meshStandardMaterial color={c} />
    </mesh>
  )
  return (
    <group position={[x, 0, z]}>
      {/* พื้นทราย */}
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#e6d3a2" roughness={1} />
      </mesh>
      {/* 0) ชิงช้า 3 ที่นั่ง (ที่นั่งแกว่งตามผู้เล่น) */}
      <group position={[-3.5, 0, -3]}>
        <Pole p={[-2, 0]} h={2.6} c={col[0]} />
        <Pole p={[2, 0]} h={2.6} c={col[0]} />
        <mesh position={[0, 2.6, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 4.1, 10]} />
          <meshStandardMaterial color={col[0]} />
        </mesh>
        {[-1.2, 0, 1.2].map((sx, i) => (
          <group key={sx} ref={(el) => (seats.current[i] = el)} position={[sx, 2.6, 0]}>
            {[-0.2, 0.2].map((cx) => (
              <mesh key={cx} position={[cx, -0.85, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 1.7, 5]} />
                <meshStandardMaterial color="#8a8d92" />
              </mesh>
            ))}
            <mesh position={[0, -1.7, 0]} castShadow>
              <RBox args={[0.55, 0.06, 0.25]} radius={0.02} />
              <meshStandardMaterial color={col[(i + 2) % 5]} />
            </mesh>
          </group>
        ))}
      </group>
      {/* 1) สไลเดอร์: แท่นมีบันไดด้านหลัง รางไถลลาดลงด้านหน้า */}
      <group position={[2.5, 0, -3]}>
        <mesh position={[0, 1.45, -0.5]} castShadow>
          <RBox args={[1, 0.12, 1]} radius={0.04} />
          <meshStandardMaterial color={col[1]} />
        </mesh>
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => <Pole key={`${sx}${sz}`} p={[sx * 0.45, -0.5 + sz * 0.45]} h={2.2} r={0.05} c={col[2]} />),
        )}
        {/* บันไดปีน */}
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} position={[0, 0.3 + k * 0.33, -1.05]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 6]} />
            <meshStandardMaterial color="#8a8d92" />
          </mesh>
        ))}
        {/* รางไถล */}
        <group position={[0, 0.8, 1.15]} rotation={[0.514, 0, 0]}>
          <mesh castShadow receiveShadow>
            <RBox args={[0.75, 0.06, 2.65]} radius={0.02} />
            <meshStandardMaterial color={col[0]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.38, 0.1, 0]}>
              <RBox args={[0.06, 0.2, 2.65]} radius={0.02} />
              <meshStandardMaterial color={col[1]} />
            </mesh>
          ))}
        </group>
      </group>
      {/* 2) กระดานหก (เอียงตามจังหวะ) */}
      <group position={[5, 0, -3]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.08, 0.14, 0.5, 10]} />
          <meshStandardMaterial color="#6b6e72" />
        </mesh>
        <group ref={plank} position={[0, 0.52, 0]}>
          <mesh castShadow>
            <RBox args={[3, 0.1, 0.3]} radius={0.04} />
            <meshStandardMaterial color={col[3]} />
          </mesh>
          {[-1.25, 1.25].map((hx) => (
            <mesh key={hx} position={[hx, 0.2, 0]}>
              <RBox args={[0.06, 0.3, 0.3]} radius={0.02} />
              <meshStandardMaterial color={col[0]} />
            </mesh>
          ))}
        </group>
      </group>
      {/* 3) ม้าหมุน (หมุนตามผู้เล่น) */}
      <group position={[-4, 0, 1]}>
        <group ref={merry}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[1.1, 1.1, 0.12, 20]} />
            <meshStandardMaterial color={col[4]} />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.9, 8]} />
            <meshStandardMaterial color="#8a8d92" />
          </mesh>
          <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.6, 0.04, 6, 18]} />
            <meshStandardMaterial color={col[0]} />
          </mesh>
        </group>
      </group>
      {/* 4) โดมปีนป่าย */}
      <mesh position={[-0.8, 0, 1]} castShadow>
        <sphereGeometry args={[1.1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={col[2]} wireframe />
      </mesh>
      {/* 5) บาร์โหน */}
      <group position={[2.2, 0, 1]}>
        <Pole p={[-1, -0.4]} h={1.9} c={col[1]} />
        <Pole p={[-1, 0.4]} h={1.9} c={col[1]} />
        <Pole p={[1, -0.4]} h={1.9} c={col[1]} />
        <Pole p={[1, 0.4]} h={1.9} c={col[1]} />
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[-0.85 + i * 0.34, 1.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 6]} />
            <meshStandardMaterial color="#8a8d92" />
          </mesh>
        ))}
      </group>
      {/* 6–7) ม้าโยกสปริง 2 ตัว (โยกตามผู้เล่น) */}
      {[4.4, 5.4].map((sx, i) => (
        <group key={sx} position={[sx, 0, 1]}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} />
            <meshStandardMaterial color="#6b6e72" />
          </mesh>
          <group ref={(el) => (riders.current[i] = el)} position={[0, 0.3, 0]}>
            <mesh position={[0, 0.25, 0]} castShadow>
              <capsuleGeometry args={[0.16, 0.4, 4, 10]} />
              <meshStandardMaterial color={col[i ? 3 : 0]} />
            </mesh>
            <mesh position={[0, 0.55, 0.22]}>
              <sphereGeometry args={[0.13, 10, 8]} />
              <meshStandardMaterial color={col[i ? 3 : 0]} />
            </mesh>
          </group>
        </group>
      ))}
      {/* 8) บ่อทราย */}
      <group position={[-4, 0, 3.8]}>
        <mesh position={[0, 0.12, 0]}>
          <RBox args={[2.2, 0.24, 2.2]} radius={0.08} />
          <meshStandardMaterial color="#c9a46c" />
        </mesh>
        <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.9, 1.9]} />
          <meshStandardMaterial color="#f0dfb0" />
        </mesh>
      </group>
      {/* 9) อุโมงค์มุด */}
      <mesh position={[-0.5, 0.55, 3.8]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 2.2, 16, 1, true]} />
        <meshStandardMaterial color={col[1]} side={2} transparent opacity={0.85} />
      </mesh>
      {/* 10) ยางรถกระโดด + คานทรงตัว */}
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[2 + k * 0.8, 0.1, 3.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.32, 0.12, 8, 16]} />
          <meshStandardMaterial color={col[k + 2]} />
        </mesh>
      ))}
      <mesh position={[4.6, 0.3, 3.8]} castShadow>
        <RBox args={[0.2, 0.15, 2]} radius={0.05} />
        <meshStandardMaterial color={col[0]} />
      </mesh>
      <group position={[0, 0, -4.8]}>
        <SignBoard lines={['สนามเด็กเล่น · กด E เล่นได้']} width={2.6} height={0.36} />
      </group>
    </group>
  )
}

/** แปลงเพาะปลูกของโรงเรียน */
function SchoolGarden({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[-1.4, 1.4].flatMap((dx) =>
        [-1.4, 1.4].map((dz) => (
          <group key={`${dx}${dz}`} position={[dx, 0, dz]}>
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
              <RBox args={[2, 0.24, 2]} radius={0.06} />
              <meshStandardMaterial color="#8a6440" />
            </mesh>
            <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.8, 1.8]} />
              <meshStandardMaterial color="#6a4630" />
            </mesh>
            {[-0.45, 0.45].flatMap((px) =>
              [-0.45, 0.45].map((pz) => (
                <mesh key={`${px}${pz}`} position={[px, 0.38, pz]}>
                  <icosahedronGeometry args={[0.18, 1]} />
                  <meshStandardMaterial color="#5f9e47" flatShading />
                </mesh>
              )),
            )}
          </group>
        )),
      )}
      <group position={[0, 0, 3]}>
        <SignBoard lines={['แปลงผักโรงเรียน']} width={1.9} height={0.34} />
      </group>
    </group>
  )
}
