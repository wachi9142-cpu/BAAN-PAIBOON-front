import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { useRef, type ReactNode } from 'react'
import type { Group } from 'three'
import { StageDecor, useRandomVariant } from './StageDecor'
import { takePhoto } from '../game/photo'

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
      <Canvas shadows="soft" camera={{ position: camera, fov: 35 }} dpr={[1, 2]} gl={{ alpha: true, preserveDrawingBuffer: true }}>
        {/* แสงนุ่มโทนอุ่น เงาจาง */}
        <hemisphereLight args={['#fff6e0', '#9aa676', 1.5]} />
        <ambientLight color="#ffe9c8" intensity={0.35} />
        <directionalLight
          position={[5, 10, 6]}
          color="#ffe4bc"
          intensity={1.15}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-intensity={0.5}
          shadow-bias={-0.0005}
        />
        <Turntable yaw={yaw}>{children}</Turntable>
        {decor && <StageDecor variant={variant} scale={decorScale} houses={decorScale < 1.5} />}
        {ground && !decor && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[12, 48]} />
            <meshStandardMaterial color="#a7b77a" />
          </mesh>
        )}
        <ContactShadows position={[0, 0.01, 0]} opacity={ground ? 0.28 : 0.4} scale={14} blur={3.2} far={6} />
        <OrbitControls
          target={target}
          enablePan={false}
          enableRotate={false}
          minDistance={minDistance}
          maxDistance={maxDistance}
        />
      </Canvas>
      <div className="preview-hint" aria-hidden="true">↔ {hint}</div>
      <button
        type="button"
        className="preview-snap"
        title="ถ่ายภาพ"
        aria-label="ถ่ายภาพตัวละคร"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => takePhoto(e.currentTarget.parentElement?.querySelector('canvas'), 'baan-paiboon-character')}
      >
        📷 ถ่ายภาพ
      </button>
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
