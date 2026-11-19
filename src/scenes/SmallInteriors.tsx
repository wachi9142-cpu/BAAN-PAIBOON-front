import { INTERIOR_ORIGIN } from '../game/interior'
import { F, KitchenInterior, KitchenRoom, useCookTextures } from './CookHouse'
import { Bathhouse, YellowBulb } from './Bathhouse'
import { BATH_DOORS, HomeDoors } from './AutoDoors'
import { ShopInterior } from './BarberShop'

/** ฉากภายในบ้านหลังที่สอง (ครัวบนเรือน): ผนังไม้กระดาน ครัวตามภาพอ้างอิง + เสื่อนอนเล่นกับหมอน */
export function CookInterior() {
  const [ox, oz] = INTERIOR_ORIGIN
  const plank = useCookTextures()
  return (
    <group position={[ox, 0, oz]}>
      {/* พื้นไม้กระดานยกพื้น + ลานรอบ ๆ (มองลงจากกล้อง) */}
      <mesh position={[0, -0.06, -0.75]} receiveShadow>
        <boxGeometry args={[5, 0.12, 2.7]} />
        <meshStandardMaterial color="#7a5e42" roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#6a7a4a" />
      </mesh>
      <group position={[0, -F, 0]}>
        <KitchenRoom plank={plank} />
        <KitchenInterior />
      </group>
      {/* เสื่อกกลายสาน + หมอน (ผู้สร้างชอบมานอนที่นี่) */}
      <mesh position={[-1.35, 0.01, -0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.9, 0.8]} />
        <meshStandardMaterial color="#d8b878" roughness={1} />
      </mesh>
      <mesh position={[-2.05, 0.06, -0.25]} scale={[1, 0.4, 0.7]}>
        <sphereGeometry args={[0.2, 12, 8]} />
        <meshStandardMaterial color="#f0ece2" roughness={1} />
      </mesh>
      <YellowBulb pos={[0, 2.15, -0.75]} glow intensity={3} distance={6} />
      <pointLight position={[0, 2.4, 0.5]} intensity={4} distance={8} color="#fff1d0" />
    </group>
  )
}

/** ฉากภายในห้องน้ำนอกบ้าน: ใช้โมเดลเดียวกับด้านนอก (ซ่อนหลังคา) + ประตูเปิด–ปิดได้ */
export function BathInterior() {
  const [ox, oz] = INTERIOR_ORIGIN
  return (
    <group>
      <Bathhouse x={ox} z={oz} inside />
      <group position={[ox, 0.12, oz]}>
        <HomeDoors set={BATH_DOORS} />
      </group>
      <mesh position={[ox, -0.01, oz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#6a7a4a" />
      </mesh>
      <pointLight position={[ox, 2.6, oz]} intensity={5} distance={10} color="#fff1d0" />
    </group>
  )
}

/** ฉากภายในร้านตัดผมชายหญิง ช่างโรจน์ (ปีกบ้านโมเดิร์น กว้าง 3.2 ลึก 6.8) — เข้าทางประตูกระจกด้านข้าง */
export function BarberInterior() {
  const [ox, oz] = INTERIOR_ORIGIN
  return (
    <group position={[ox, 0, oz]}>
      <ShopInterior H={2.7} side={-1} />
      {/* ผนังไม้ระแนงด้านหน้าร้าน (กระจก) + ประตูกระจกด้านข้าง */}
      <mesh position={[0, 1.35, 3.4]}>
        <boxGeometry args={[3.2, 2.7, 0.06]} />
        <meshStandardMaterial color="#cfe6f2" transparent opacity={0.25} roughness={0.05} />
      </mesh>
      <mesh position={[-1.6, 1.35, 0]}>
        <boxGeometry args={[0.06, 2.7, 6.8]} />
        <meshStandardMaterial color="#cfe6f2" transparent opacity={0.2} roughness={0.05} />
      </mesh>
      {[-1.7, 1.7].map((z) => (
        <mesh key={z} position={[-1.6, 1.35, z]}>
          <boxGeometry args={[0.1, 2.7, 0.1]} />
          <meshStandardMaterial color="#2a2a2e" />
        </mesh>
      ))}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#6a7a4a" />
      </mesh>
      <pointLight position={[0, 2.5, 0]} intensity={6} distance={9} color="#fff6e8" />
    </group>
  )
}
