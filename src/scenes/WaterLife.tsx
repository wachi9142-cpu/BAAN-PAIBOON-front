import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { LOTUS, WATER, type WaterBody } from '../game/content/water'
import { useGame } from '../game/store'
import { useClock } from '../game/clock'
import { lotusPicked, useWater, waterRt } from '../game/water'
import { playerPose } from '../game/playerPose'
import { RBox } from './models/RBox'

/** ของในแหล่งน้ำ: ดอกบัว (เก็บได้) · เรือพายที่ท่าน้ำ · ราวเสื้อชูชีพ · วงน้ำกระเพื่อมรอบตัวผู้เล่น */
export function WaterLife() {
  useGame((s) => s.save?.lotusPicked)
  useClock((s) => Math.floor(s.minute / 30))
  return (
    <group>
      {LOTUS.map((l, i) => (
        <Lotus key={l.id} x={l.x} z={l.z} white={l.white} seed={i} picked={lotusPicked(l.id)} />
      ))}
      {WATER.filter((b) => b.activities.includes('boat')).map((b) => (
        <Boat key={b.id} body={b} />
      ))}
      {WATER.filter((b) => b.activities.includes('vest')).map((b) => (
        <VestRack key={b.id} body={b} />
      ))}
      <Ripples />
    </group>
  )
}

/** ใบบัวหลายขนาด + ดอกชมพู/ขาว บนก้านสูง (เก็บแล้วเหลือแต่ใบ) */
function Lotus({ x, z, white, seed, picked }: { x: number; z: number; white: boolean; seed: number; picked: boolean }) {
  const petal = white ? '#f7f3ee' : '#f29bbb'
  const inner = white ? '#fffaf2' : '#f7c3d6'
  const pads: [number, number, number, number][] = [
    [0, 0, 0.62, 0.06],
    [0.75, 0.35, 0.45, 0.05],
    [-0.6, 0.5, 0.38, 0.055],
    [0.2, -0.7, 0.5, 0.05],
    [-0.4, -0.45, 0.3, 0.2],
  ]
  return (
    <group position={[x, 0, z]} rotation={[0, seed * 1.7, 0]}>
      {pads.map(([px, pz, r, y], i) => (
        <mesh key={i} position={[px, y, pz]} rotation={[-Math.PI / 2 + (y > 0.1 ? 0.35 : 0), 0, i]}>
          <circleGeometry args={[r, 14, 0.25, Math.PI * 1.85]} />
          <meshStandardMaterial color={i % 2 ? '#4f8f45' : '#5a9a4c'} side={2} />
        </mesh>
      ))}
      {!picked && (
        <group position={[0.15, 0, 0.15]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.02, 0.025, 0.5, 6]} />
            <meshStandardMaterial color="#5f8c48" />
          </mesh>
          <group position={[0, 0.52, 0]}>
            {Array.from({ length: 8 }).map((_, i) => (
              <mesh key={i} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
                <mesh position={[0, 0.07, 0.07]} rotation={[0.55, 0, 0]}>
                  <coneGeometry args={[0.06, 0.2, 6]} />
                  <meshStandardMaterial color={petal} />
                </mesh>
              </mesh>
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <mesh key={'in' + i} rotation={[0, (i / 5) * Math.PI * 2 + 0.3, 0]}>
                <mesh position={[0, 0.09, 0.035]} rotation={[0.25, 0, 0]}>
                  <coneGeometry args={[0.045, 0.17, 6]} />
                  <meshStandardMaterial color={inner} />
                </mesh>
              </mesh>
            ))}
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.04, 0.035, 0.04, 10]} />
              <meshStandardMaterial color="#e6c84a" />
            </mesh>
          </group>
        </group>
      )}
    </group>
  )
}

/** เรือพายไม้ จอดที่ท่า · ตอนผู้เล่นพายอยู่ เรือตามตัวผู้เล่นและโยกตามคลื่น */
function Boat({ body }: { body: WaterBody }) {
  const g = useRef<Group>(null)
  const paddle = useRef<Group>(null)
  const dx = body.pos[0] - body.dock[0]
  const dz = body.pos[1] - body.dock[1]
  const l = Math.hypot(dx, dz) || 1
  const moor: [number, number] = [body.dock[0] + (dx / l) * 2.6, body.dock[1] + (dz / l) * 2.6]
  const moorHeading = Math.atan2(dx, dz) + Math.PI / 2
  useFrame(({ clock }) => {
    if (!g.current) return
    const t = clock.elapsedTime
    const using = waterRt.boatBody?.id === body.id && useWater.getState().mode === 'boat'
    if (using) {
      g.current.position.set(playerPose.x, 0.02 + Math.sin(t * 1.7) * 0.03, playerPose.z)
      g.current.rotation.set(Math.sin(t * 1.1) * 0.03, playerPose.heading, Math.sin(t * 1.4) * 0.04)
    } else {
      g.current.position.set(moor[0], 0.02 + Math.sin(t * 1.3) * 0.02, moor[1])
      g.current.rotation.set(0, moorHeading, Math.sin(t * 1.2) * 0.025)
    }
    if (paddle.current) {
      paddle.current.visible = using
      const p = t * (playerPose.motion ? 4 : 1.2)
      paddle.current.rotation.set(Math.sin(p) * 0.5, 0, 0.9 + Math.cos(p) * 0.2)
    }
  })
  const wood = '#8a5a34'
  return (
    <group ref={g}>
      {/* ตัวเรือ: ท้องเรือ + กราบสองข้าง + หัว/ท้ายเรียว */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <RBox args={[0.95, 0.16, 2.8]} radius={0.07} />
        <meshStandardMaterial color="#6e4426" />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * 0.46, 0.32, 0]} castShadow>
          <RBox args={[0.08, 0.32, 2.7]} radius={0.03} />
          <meshStandardMaterial color={wood} />
        </mesh>
      ))}
      {[-1, 1].map((sz) => (
        <mesh key={sz} position={[0, 0.3, sz * 1.5]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <RBox args={[0.6, 0.34, 0.6]} radius={0.05} />
          <meshStandardMaterial color={wood} />
        </mesh>
      ))}
      {/* ที่นั่ง */}
      {[-0.6, 0.7].map((z) => (
        <mesh key={z} position={[0, 0.34, z]}>
          <RBox args={[0.86, 0.06, 0.28]} radius={0.02} />
          <meshStandardMaterial color="#a8774a" />
        </mesh>
      ))}
      {/* ไม้พาย (เห็นตอนพาย) */}
      <group ref={paddle} position={[0.15, 0.95, 0.15]}>
        <mesh>
          <cylinderGeometry args={[0.025, 0.025, 1.7, 6]} />
          <meshStandardMaterial color="#b08050" />
        </mesh>
        <mesh position={[0, -0.9, 0]}>
          <RBox args={[0.18, 0.4, 0.04]} radius={0.02} />
          <meshStandardMaterial color="#b08050" />
        </mesh>
      </group>
    </group>
  )
}

/** ราวแขวนเสื้อชูชีพหลายสีข้างท่าน้ำ */
function VestRack({ body }: { body: WaterBody }) {
  const dx = body.dock[0] - body.pos[0]
  const dz = body.dock[1] - body.pos[1]
  const l = Math.hypot(dx, dz) || 1
  // อยู่บนตลิ่งหลังท่าน้ำ เยื้องไปข้างหนึ่ง
  const x = body.dock[0] + (dx / l) * 1.6 + (-dz / l) * 2
  const z = body.dock[1] + (dz / l) * 1.6 + (dx / l) * 2
  const colors = ['#f07a1e', '#e8c02a', '#d84a3a', '#2f7fd0', '#f07a1e']
  return (
    <group position={[x, 0, z]} rotation={[0, Math.atan2(dx, dz) + Math.PI / 2, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.2, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 1.7, 8]} />
          <meshStandardMaterial color="#5a3b26" />
        </mesh>
      ))}
      <mesh position={[0, 1.65, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 2.5, 8]} />
        <meshStandardMaterial color="#6a4a2e" />
      </mesh>
      {colors.map((c, i) => (
        <group key={i} position={[-0.9 + i * 0.45, 1.25, 0]}>
          <mesh>
            <RBox args={[0.34, 0.5, 0.12]} radius={0.05} />
            <meshStandardMaterial color={c} />
          </mesh>
          <mesh position={[0, 0.06, 0.065]}>
            <boxGeometry args={[0.3, 0.035, 0.01]} />
            <meshStandardMaterial color="#f2f2f2" />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <torusGeometry args={[0.05, 0.012, 5, 10]} />
            <meshStandardMaterial color="#444" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** วงน้ำกระเพื่อมรอบตัวผู้เล่นตอนอยู่ในน้ำ (ขยายแล้วจางหาย) */
function Ripples() {
  const rings = useRef<(Mesh | null)[]>([])
  useFrame(({ clock }) => {
    const mode = useWater.getState().mode
    const inWater = mode !== 'land' && waterRt.depth > 0
    const t = clock.elapsedTime
    rings.current.forEach((m, i) => {
      if (!m) return
      m.visible = inWater
      if (!inWater) return
      const p = (t * (playerPose.motion ? 0.9 : 0.5) + i / 3) % 1
      m.position.set(playerPose.x, 0.05, playerPose.z)
      const r = 0.4 + p * (mode === 'boat' ? 2.2 : 1.4)
      m.scale.set(r, r, r)
      const mat = m.material as { opacity: number }
      mat.opacity = (1 - p) * 0.55
    })
  })
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => (rings.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.92, 1, 32]} />
          <meshBasicMaterial color="#e8f6f8" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
