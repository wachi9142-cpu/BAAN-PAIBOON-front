import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { useRef, type ReactNode } from 'react'
import type { Group } from 'three'
import { StageDecor, useRandomVariant } from './StageDecor'

/**
 * ฉากแสดงตัวอย่าง (ตัวละคร/สัตว์/บ้าน)
 * - กล้องอยู่นิ่ง ไม่หมุนเอง (ผู้สร้างขอ: ฉากเคลื่อนเองทำให้ปวดตา ปวดหัว)
 * - ผู้เล่นลากเมาส์/นิ้วซ้าย-ขวาเพื่อหมุน "ตัวละคร" เอง · ลูกกลิ้งเมาส์ = ซูม
 * ground=false: ไม่วาดพื้นหญ้า (ใช้เมื่อมีภาพพื้นหลังอยู่ด้านหลังแล้ว) เหลือแค่เงาใต้เท้า
 * decor: ใส่ฉากหมู่บ้านแบบสุ่ม 1 ใน 4 (ตัวเลข = ขยายฉาก เช่นฉากบ้านใช้ ~2.6)
 */
export function PreviewStage({
  children,
  camera,
  target,
  minDistance = 2,
  maxDistance = 30,
  ground = true,
  decor,
  hint = 'ลากเพื่อหมุนตัวละคร',
}: {
  children: ReactNode
  camera: [number, number, number]
  target: [number, number, number]
  minDistance?: number
  maxDistance?: number
  ground?: boolean
  decor?: boolean | number
  /** ข้อความบอกวิธีหมุน */
  hint?: string
}) {
  const variant = useRandomVariant()
  const decorScale = typeof decor === 'number' ? decor : 1
  const yaw = useRef(0)
  const drag = useRef<{ x: number; start: number } | null>(null)

  return (
    <div
      className="preview-turn"
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, start: yaw.current }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (drag.current) yaw.current = drag.current.start + (e.clientX - drag.current.x) * 0.012
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <Canvas shadows camera={{ position: camera, fov: 35 }} dpr={[1, 2]} gl={{ alpha: true }}>
        <hemisphereLight args={['#fff6e0', '#7a8a5a', 1.2]} />
        <directionalLight position={[5, 10, 6]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <Turntable yaw={yaw}>{children}</Turntable>
        {decor && <StageDecor variant={variant} scale={decorScale} houses={decorScale < 1.5} />}
        {ground && !decor && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[12, 48]} />
            <meshStandardMaterial color="#a7b77a" />
          </mesh>
        )}
        <ContactShadows position={[0, 0.01, 0]} opacity={ground ? 0.35 : 0.55} scale={14} blur={2.4} far={6} />
        <OrbitControls
          target={target}
          enablePan={false}
          enableRotate={false}
          minDistance={minDistance}
          maxDistance={maxDistance}
        />
      </Canvas>
      <div className="preview-hint" aria-hidden="true">↔ {hint}</div>
    </div>
  )
}

/** หมุนเฉพาะสิ่งที่แสดง (ตัวละคร) ตามที่ผู้เล่นลาก — ฉากรอบ ๆ อยู่นิ่ง */
function Turntable({ yaw, children }: { yaw: React.RefObject<number>; children: ReactNode }) {
  const g = useRef<Group>(null!)
  useFrame((_, dt) => {
    g.current.rotation.y += (yaw.current - g.current.rotation.y) * Math.min(1, dt * 12)
  })
  return <group ref={g}>{children}</group>
}
