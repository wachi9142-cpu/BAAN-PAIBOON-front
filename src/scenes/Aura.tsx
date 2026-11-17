import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, type Group, type Mesh, type MeshBasicMaterial } from 'three'
import { useMerit } from '../game/templeActions'

/** ออร่าสีทองอ่อนรอบตัวหลังทำบุญ — ค่อย ๆ จางหายไปเอง */
export function Aura() {
  const g = useRef<Group>(null!)
  const glow = useRef<Mesh>(null!)
  const sparks = useRef<Group>(null!)
  useFrame((st) => {
    const { auraUntil, auraLevel } = useMerit.getState()
    const left = auraUntil - Date.now()
    const on = left > 0
    g.current.visible = on
    if (!on) return
    const k = Math.min(1, left / 15000) // 15 วินาทีสุดท้ายค่อย ๆ จาง
    const t = st.clock.elapsedTime
    ;(glow.current.material as MeshBasicMaterial).opacity = (0.1 + auraLevel * 0.14 + Math.sin(t * 2) * 0.04) * k
    glow.current.scale.set(0.7 + auraLevel * 0.15, 1.1 + auraLevel * 0.15, 0.7 + auraLevel * 0.15)
    sparks.current.rotation.y = t * 0.8
    sparks.current.children.forEach((c, i) => {
      c.position.y = 0.3 + ((t * 0.35 + i * 0.17) % 1.6)
      ;((c as Mesh).material as MeshBasicMaterial).opacity = 0.8 * k * (1 - (c.position.y - 0.3) / 1.6)
    })
  })
  return (
    <group ref={g} visible={false}>
      <mesh ref={glow} position={[0, 0.95, 0]} scale={[0.75, 1.15, 0.75]}>
        <sphereGeometry args={[0.9, 24, 16]} />
        <meshBasicMaterial color="#ffe9a8" transparent opacity={0.16} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      <group ref={sparks}>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[Math.cos(i * 2.1) * 0.55, 0.5, Math.sin(i * 2.1) * 0.55]}>
            <sphereGeometry args={[0.03, 6, 5]} />
            <meshBasicMaterial color="#fff6c8" transparent opacity={0.8} depthWrite={false} blending={AdditiveBlending} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
