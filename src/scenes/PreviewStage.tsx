import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import type { ReactNode } from 'react'

/** ฉากแสดงตัวอย่าง (ตัวละคร/บ้าน) หมุนดูรอบได้ด้วยเมาส์ */
export function PreviewStage({
  children,
  camera,
  target,
  minDistance = 2,
  maxDistance = 30,
}: {
  children: ReactNode
  camera: [number, number, number]
  target: [number, number, number]
  minDistance?: number
  maxDistance?: number
}) {
  return (
    <Canvas shadows camera={{ position: camera, fov: 35 }} dpr={[1, 2]}>
      <hemisphereLight args={['#fff6e0', '#7a8a5a', 1.2]} />
      <directionalLight position={[5, 10, 6]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      {children}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[12, 48]} />
        <meshStandardMaterial color="#a7b77a" />
      </mesh>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={14} blur={2.4} far={6} />
      <OrbitControls
        target={target}
        enablePan={false}
        minDistance={minDistance}
        maxDistance={maxDistance}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.8}
      />
    </Canvas>
  )
}
