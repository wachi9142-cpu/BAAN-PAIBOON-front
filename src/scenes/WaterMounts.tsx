import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { CAVE_POOL } from '../game/cave'
import { mountPos, useMount, type MountId } from '../game/mounts'
import { playerPose } from '../game/playerPose'
import { hasSaddle } from '../game/saddles'

/**
 * มังกรน้ำ + พญานาค (สัตว์พลังพิเศษ) ว่ายวนในสระน้ำในถ้ำ — ขี่ได้เมื่อมีอานของชนิดนั้น
 * ตัวเป็นปล้องต่อกันเลื้อยเป็นคลื่น · หัวมีเขา/หงอน ครีบ · มีอานบนหลังเมื่อสร้างอานแล้ว
 */
const SEG = 14

function Creature({ id }: { id: MountId }) {
  const root = useRef<Group>(null)
  const segs = useRef<(Group | null)[]>([])
  const dragon = id === 'water-dragon'
  const body = dragon ? '#2ab8a8' : '#3a7a3a'
  const belly = dragon ? '#f0e0a0' : '#e8c860'
  const accent = dragon ? '#f0c040' : '#d8a020'
  const st = useRef({ a: dragon ? 0 : Math.PI, x: 0, z: 0, h: 0, y: -0.2 })
  // ร่องรอยตำแหน่งหัว (ตัวเลื้อยตามหัว)
  const trail = useMemo(() => Array.from({ length: 80 }, () => [0, 0, 0] as [number, number, number]), [])
  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const t = clock.elapsedTime
    const S = st.current
    const riding = useMount.getState().riding === id
    if (riding) {
      S.x = playerPose.x
      S.z = playerPose.z
      S.h = playerPose.heading
      S.y = playerPose.y - 0.45
    } else {
      // ว่ายวนเองบนผิวน้ำ (คนละวงกัน)
      S.a += dt * (dragon ? 0.28 : 0.2)
      const r = dragon ? 3.4 : 5.2
      const [px, pz] = CAVE_POOL.pos
      const nx = px + Math.cos(S.a) * r
      const nz = pz + Math.sin(S.a) * r * 0.7
      S.h = Math.atan2(nx - S.x, nz - S.z)
      S.x = nx
      S.z = nz
      S.y = -0.25 + Math.sin(t * 0.8) * 0.08
    }
    mountPos[id] = [S.x, S.z]
    trail.pop()
    trail.unshift([S.x, S.y, S.z])
    if (root.current) root.current.position.set(0, 0, 0)
    // ปล้องลำตัว: ตามร่องรอยหัว + คลื่นเลื้อย
    segs.current.forEach((g, i) => {
      if (!g) return
      const k = Math.min(trail.length - 1, i * 3)
      const [x, y, z] = trail[k]
      const wave = Math.sin(t * 3 - i * 0.6) * 0.12 * (i / SEG)
      g.position.set(x + Math.cos(S.h) * wave, y + Math.sin(t * 2 - i * 0.5) * 0.05, z - Math.sin(S.h) * wave)
      const [ax, , az] = trail[Math.max(0, k - 2)]
      g.rotation.y = Math.atan2(ax - x, az - z) || S.h
    })
  })
  const saddled = hasSaddle(dragon ? 'saddle_waterdragon' : 'saddle_naga')
  return (
    <group ref={root}>
      {Array.from({ length: SEG }, (_, i) => {
        const r = (dragon ? 0.42 : 0.36) * (1 - (i / SEG) * 0.75)
        return (
          <group key={i} ref={(g) => void (segs.current[i] = g)}>
            <mesh scale={[1, 0.85, 1.25]} castShadow>
              <sphereGeometry args={[r, 12, 10]} />
              <meshStandardMaterial color={body} roughness={0.35} metalness={0.15} />
            </mesh>
            {/* ท้องสีอ่อน */}
            <mesh position={[0, -r * 0.45, 0]} scale={[0.8, 0.4, 1.15]}>
              <sphereGeometry args={[r, 10, 8]} />
              <meshStandardMaterial color={belly} roughness={0.5} />
            </mesh>
            {/* ครีบหลัง */}
            {i % 2 === 0 && i > 0 && (
              <mesh position={[0, r * 0.95, 0]} rotation={[0, 0, 0]}>
                <coneGeometry args={[r * 0.35, r * 0.9, 4]} />
                <meshStandardMaterial color={accent} roughness={0.4} />
              </mesh>
            )}
            {i === 0 && (
              // หัว: ปาก เขา/หงอน ตา หนวด
              <group position={[0, r * 0.2, r * 0.9]}>
                <mesh position={[0, 0, 0.25]} scale={[0.8, 0.6, 1.2]}>
                  <sphereGeometry args={[r * 0.8, 12, 10]} />
                  <meshStandardMaterial color={body} roughness={0.35} />
                </mesh>
                {[-1, 1].map((s) => (
                  <group key={s}>
                    <mesh position={[s * r * 0.35, r * 0.5, -0.05]} rotation={[-0.7, 0, s * 0.3]}>
                      <coneGeometry args={[r * 0.12, r * (dragon ? 1.2 : 0.6), 6]} />
                      <meshStandardMaterial color={accent} />
                    </mesh>
                    <mesh position={[s * r * 0.38, r * 0.2, r * 0.35]}>
                      <sphereGeometry args={[r * 0.13, 10, 8]} />
                      <meshStandardMaterial color="#1a1a1a" emissive={dragon ? '#40e0ff' : '#ffd040'} emissiveIntensity={0.6} />
                    </mesh>
                    {dragon && (
                      <mesh position={[s * r * 0.3, -r * 0.1, r * 0.8]} rotation={[0.4, 0, s * 0.6]}>
                        <cylinderGeometry args={[0.012, 0.006, r * 1.3, 4]} />
                        <meshStandardMaterial color={accent} />
                      </mesh>
                    )}
                  </group>
                ))}
                {!dragon && (
                  // หงอนพญานาค (แผ่เป็นพัด)
                  <mesh position={[0, r * 0.65, -0.1]} rotation={[-0.3, 0, 0]}>
                    <circleGeometry args={[r * 0.7, 10, 0, Math.PI]} />
                    <meshStandardMaterial color={accent} side={2} metalness={0.4} roughness={0.3} />
                  </mesh>
                )}
              </group>
            )}
            {/* อานบนหลัง (เมื่อสร้างอานแล้ว) */}
            {i === 2 && saddled && (
              <group position={[0, r * 0.9, 0]}>
                <mesh scale={[1, 0.35, 1.2]}>
                  <sphereGeometry args={[r * 0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color={dragon ? '#8a4a24' : '#c89a30'} roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.05, r * 0.55]}>
                  <torusGeometry args={[r * 0.18, 0.025, 6, 12]} />
                  <meshStandardMaterial color="#c8a040" metalness={0.5} />
                </mesh>
              </group>
            )}
          </group>
        )
      })}
    </group>
  )
}

export function WaterMounts() {
  return (
    <>
      <Creature id="water-dragon" />
      <Creature id="naga" />
    </>
  )
}
