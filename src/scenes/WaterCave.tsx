import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, type Group, type Mesh } from 'three'
import { create } from 'zustand'
import { CAVE_DOOR, CAVE_MOUTH, CAVE_ORIGIN, CAVE_POOL, CAVE_R, inCave } from '../game/cave'
import { playerPose } from '../game/playerPose'
import { WaterMounts } from './WaterMounts'

/**
 * ถ้ำน้ำลึก (ตามภาพอ้างอิงของผู้สร้าง 19 พ.ย.) — สถานที่สมมติ
 * ปากถ้ำ: กองหินใหญ่มีช่องมืดด้านหน้า มุมนอกหมู่บ้าน
 * ในถ้ำ: โถงหินสีฟ้าอมเขียว ผนังหินซ้อนชั้น · ลำแสงลอดรูเพดานลงผิวน้ำ · คริสตัลเรืองแสง · ประตูหินโบราณมีคบเพลิง
 * สระน้ำลึก 6 ม. (ใสสีฟ้า) · ใต้น้ำมีหินก้อนใหญ่ ปะการัง สาหร่าย ฝูงปลาเล็ก และซุ้มหินโค้งให้ดำลอด
 * ฉากในถ้ำวาดเฉพาะตอนผู้เล่นอยู่ในถ้ำ (ไม่กินเครื่อง)
 */
export const useCave = create<{ inside: boolean }>(() => ({ inside: false }))

function rnd(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

/** ปากถ้ำในหมู่บ้าน */
export function CaveMouth() {
  const rocks = useMemo(() => {
    const r = rnd(77)
    return Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 1.25 - Math.PI * 1.12
      const rad = 3.2 + r() * 0.8
      return { x: Math.cos(a) * rad, z: Math.sin(a) * rad * 0.6 - 0.6, s: 1.3 + r() * 1.2, y: r() * 0.6, rot: r() * 3 }
    })
  }, [])
  return (
    <group position={[CAVE_MOUTH[0], 0, CAVE_MOUTH[1]]} rotation={[0, Math.atan2(-CAVE_MOUTH[0], -CAVE_MOUTH[1] + 71), 0]}>
      {rocks.map((k, i) => (
        <mesh key={i} position={[k.x, k.s * 0.6 + k.y, k.z]} rotation={[k.rot, k.rot * 2, 0]} scale={[k.s, k.s * 1.2, k.s]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 2 ? '#5f6a6e' : '#6e787a'} roughness={1} flatShading />
        </mesh>
      ))}
      {/* หลังคาหินเหนือช่องทางเข้า */}
      <mesh position={[0, 3.6, -0.8]} scale={[3.4, 1.4, 2.4]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#5a6468" roughness={1} flatShading />
      </mesh>
      {/* ช่องมืดทางเข้าถ้ำ */}
      <mesh position={[0, 1.4, -0.9]}>
        <circleGeometry args={[1.6, 18]} />
        <meshBasicMaterial color="#0a1418" />
      </mesh>
      <mesh position={[0, 0.02, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.2, 16]} />
        <meshStandardMaterial color="#7a7266" roughness={1} />
      </mesh>
      {/* ป้ายไม้ */}
      <group position={[2.4, 0, 1.4]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.08, 1.2, 0.08]} />
          <meshStandardMaterial color="#6a4a30" />
        </mesh>
        <mesh position={[0, 1.15, 0.02]}>
          <boxGeometry args={[0.9, 0.36, 0.04]} />
          <meshStandardMaterial color="#c8a468" />
        </mesh>
      </group>
    </group>
  )
}

/** ติดตามว่าผู้เล่นอยู่ในถ้ำไหม (เปิด/ปิดการวาดฉากถ้ำ) */
export function CaveWatcher() {
  useFrame(() => {
    const ins = inCave(playerPose.x, playerPose.z)
    if (useCave.getState().inside !== ins) useCave.setState({ inside: ins })
  })
  return null
}

export function WaterCaveScene() {
  const inside = useCave((s) => s.inside)
  if (!inside) return null
  return <CaveHall />
}

function CaveHall() {
  const [ox, oz] = CAVE_ORIGIN
  const [px, pz] = CAVE_POOL.pos
  const [pw, pd] = CAVE_POOL.size
  const walls = useMemo(() => {
    const r = rnd(4242)
    return Array.from({ length: 44 }, (_, i) => {
      const a = (i / 44) * Math.PI * 2
      const layer = i % 2
      return { a, s: 2.2 + r() * 1.6, y: layer ? 4.5 + r() * 2 : 1.4 + r() * 1.2, k: 1 + r() * 0.15, rot: r() * 6 }
    })
  }, [])
  const under = useMemo(() => {
    const r = rnd(99)
    return Array.from({ length: 16 }, () => {
      const a = r() * Math.PI * 2
      const rr = Math.sqrt(r()) * 0.75
      return { x: px + Math.cos(a) * (pw / 2) * rr, z: pz + Math.sin(a) * (pd / 2) * rr, s: 0.4 + r() * 0.9, kind: r() }
    })
  }, [px, pz, pw, pd])
  const fish = useRef<Group>(null)
  const shafts = useRef<Mesh[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (fish.current) {
      fish.current.children.forEach((f, i) => {
        const a = t * (0.35 + (i % 3) * 0.08) + i * 1.3
        f.position.set(px + Math.cos(a) * (2 + (i % 4)), -1.6 - (i % 5) * 0.7, pz + Math.sin(a) * (1.6 + (i % 3)))
        f.rotation.y = -a
      })
    }
    shafts.current.forEach((m, i) => {
      const mat = m.material as { opacity: number }
      mat.opacity = 0.16 + Math.sin(t * 0.6 + i) * 0.05
    })
  })
  return (
    <group>
      {/* พื้นถ้ำ (หินเรียบชื้น) */}
      <mesh position={[ox, 0.01, oz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[CAVE_R[0] + 7, 40]} />
        <meshStandardMaterial color="#5c7074" roughness={0.95} />
      </mesh>
      {/* ผนังหินรอบโถง 2 ชั้น + เพดาน */}
      {walls.map((w, i) => (
        <mesh
          key={i}
          position={[ox + Math.cos(w.a) * (CAVE_R[0] + w.s * 0.9 + 1) * w.k, w.y, oz + Math.sin(w.a) * (CAVE_R[1] + w.s * 0.9 + 1) * w.k]}
          rotation={[w.rot, w.rot * 0.7, 0]}
          scale={[w.s, w.s * 1.3, w.s]}
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 3 ? '#466a72' : '#557a80'} roughness={1} flatShading />
        </mesh>
      ))}
      <mesh position={[ox, 8.5, oz]} scale={[CAVE_R[0] + 6, 4, CAVE_R[1] + 6]}>
        <sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1e3036" roughness={1} side={DoubleSide} />
      </mesh>
      {/* สระน้ำ: แอ่งหิน (ก้นสระลึก 6 ม.) */}
      <mesh position={[px, -CAVE_POOL.maxDepth / 2, pz]} scale={[pw / 2, CAVE_POOL.maxDepth / 2, pd / 2]}>
        <sphereGeometry args={[1, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#1f5a62" roughness={0.9} side={DoubleSide} />
      </mesh>
      {/* ผิวน้ำใสสีฟ้าอมเขียว */}
      <mesh position={[px, -0.05, pz]} rotation={[-Math.PI / 2, 0, 0]} scale={[pw / 2, pd / 2, 1]}>
        <circleGeometry args={[1, 40]} />
        <meshStandardMaterial color="#3ac8d8" transparent opacity={0.6} roughness={0.05} metalness={0.2} side={DoubleSide} emissive="#1a8a98" emissiveIntensity={0.9} />
      </mesh>
      {/* ใต้น้ำ: หินก้อนใหญ่ ปะการัง สาหร่าย */}
      {under.map((u, i) => (
        <group key={i} position={[u.x, -CAVE_POOL.maxDepth * (0.55 + (1 - Math.hypot((u.x - px) / (pw / 2), (u.z - pz) / (pd / 2))) * 0.4), u.z]}>
          {u.kind < 0.45 ? (
            <mesh scale={[u.s * 1.4, u.s, u.s * 1.2]}>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#2a4e56" flatShading />
            </mesh>
          ) : u.kind < 0.75 ? (
            [0, 1, 2].map((k) => (
              <mesh key={k} position={[k * 0.2 - 0.2, 0.4 + k * 0.15, 0]} rotation={[0, 0, (k - 1) * 0.3]}>
                <coneGeometry args={[0.08, 0.9 + k * 0.3, 5]} />
                <meshStandardMaterial color={k % 2 ? '#e88a6a' : '#f0a07a'} emissive="#5a2010" emissiveIntensity={0.3} />
              </mesh>
            ))
          ) : (
            [0, 1, 2, 3].map((k) => (
              <mesh key={k} position={[Math.cos(k * 1.6) * 0.15, 0.5, Math.sin(k * 1.6) * 0.15]} rotation={[0.1 * k, 0, 0.12 * (k - 2)]}>
                <boxGeometry args={[0.06, 1.1 + k * 0.2, 0.02]} />
                <meshStandardMaterial color="#3a8a4a" side={DoubleSide} />
              </mesh>
            ))
          )}
        </group>
      ))}
      {/* ซุ้มหินโค้งใต้น้ำ ให้ดำลอด */}
      <group position={[px + 3.5, -4.2, pz - 1]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 1.2, 0.6, 0]} scale={[0.6, 1.6, 0.8]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#2a4a52" flatShading />
          </mesh>
        ))}
        <mesh position={[0, 2.1, 0]} scale={[1.9, 0.5, 0.8]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#2f525a" flatShading />
        </mesh>
      </group>
      {/* ฝูงปลาเล็กใต้น้ำ */}
      <group ref={fish}>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} scale={[0.6, 0.35, 1]}>
            <coneGeometry args={[0.12, 0.42, 6]} />
            <meshStandardMaterial color={i % 3 ? '#f0c060' : '#8ad8f0'} emissive={i % 3 ? '#5a3a00' : '#0a4a6a'} emissiveIntensity={0.4} />
          </mesh>
        ))}
      </group>
      {/* ลำแสงลอดรูเพดานลงผิวน้ำ */}
      {[
        [px - 2, pz + 1, 0.15],
        [px + 2.5, pz - 2, -0.1],
        [px - 5, pz - 3, 0.05],
      ].map(([x, z, tilt], i) => (
        <mesh key={'sh' + i} ref={(m) => void (m && (shafts.current[i] = m))} position={[x, 4.4, z]} rotation={[0, 0, tilt]}>
          <cylinderGeometry args={[0.6, 1.8, 9, 16, 1, true]} />
          <meshBasicMaterial color="#bff4ff" transparent opacity={0.18} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} />
        </mesh>
      ))}
      {/* คริสตัลเรืองแสงตามผนัง */}
      {[0.4, 1.3, 2.2, 3.5, 4.4, 5.6].map((a, i) => (
        <mesh key={'cr' + i} position={[ox + Math.cos(a) * (CAVE_R[0] - 0.6), 0.5 + (i % 2) * 0.6, oz + Math.sin(a) * (CAVE_R[1] - 0.6)]} rotation={[0.3, a, 0.2]}>
          <octahedronGeometry args={[0.35 + (i % 3) * 0.1, 0]} />
          <meshStandardMaterial color="#8af0ff" emissive="#3ac8e8" emissiveIntensity={1.4} />
        </mesh>
      ))}
      {/* ประตูหินโบราณ + คบเพลิง (ผนังตะวันตก) */}
      <group position={[ox - CAVE_R[0] + 1.2, 0, oz - 2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 1.8, -0.2]}>
          <boxGeometry args={[3.2, 3.6, 0.5]} />
          <meshStandardMaterial color="#3a4e52" roughness={1} />
        </mesh>
        <mesh position={[0, 1.5, 0.06]}>
          <planeGeometry args={[1.4, 2.6]} />
          <meshStandardMaterial color="#e8f4f0" emissive="#bfe8e0" emissiveIntensity={0.8} />
        </mesh>
        {[-1.2, 1.2].map((x) => (
          <mesh key={x} position={[x, 1.1, 0.4]}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color="#ffb040" emissive="#ff8a20" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* ทางออก (ทิศใต้) */}
      <mesh position={[CAVE_DOOR[0], 1.4, CAVE_DOOR[1] + 1.6]}>
        <circleGeometry args={[1.5, 18]} />
        <meshBasicMaterial color="#e8f0d8" />
      </mesh>
      {/* มังกรน้ำ + พญานาค ว่ายวนในสระ (ขี่ได้เมื่อมีอาน) */}
      <WaterMounts />
      {/* แสงในถ้ำ: เพียง 2 ดวง (ฉากถ้ำวาดเฉพาะตอนอยู่ในถ้ำ) */}
      <pointLight position={[px, 6, pz]} color="#9ae8ff" intensity={60} distance={34} decay={1.2} />
      <ambientLight color="#7ab8c8" intensity={0.7} />
      <pointLight position={[ox - CAVE_R[0] + 2, 2, oz - 2]} color="#ffb060" intensity={6} distance={9} decay={1.6} />
      <hemisphereLight args={['#6ac8d8', '#1a2a30', 0.6]} position={[ox, 10, oz]} />
    </group>
  )
}
