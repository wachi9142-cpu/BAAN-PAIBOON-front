import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { RBox } from './models/RBox'
import { SignBoard } from './SignBoard'
import { HomeDoors } from './AutoDoors'
import { onBedClick } from '../ui/bedWheel'
import { BarberInterior, BathInterior, CookInterior } from './SmallInteriors'
import { FLOOR2, ID, INTERIOR_ORIGIN, IW, STAIRS, WALLS_GROUND, WALLS_UPPER, useInterior } from '../game/interior'
import { useHomeTv } from '../game/homeActions'
import { NpcInterior } from './NpcInterior'

/**
 * ภายในบ้านตารัง–ยายเลียน — ตามผังใน docs/HOME_TARANG_YAILIAN.md ข้อ 1
 * ชั้นล่าง: ตู้เสื้อผ้ายาย · ห้องน้ำ (ผนังลายฟ้า-ขาว เครื่องซักผ้า 2 ตู้) · หน้าต่างบานใหญ่ม่านขาว · เตียงตายายมีผนังกั้น
 *          ห้องน้ารง + ตู้เสื้อผ้า 3 ประตู (หลังตู้ = ที่เลี้ยงหนอนไหม) · หน้าต่างสแตนเลสมุ้งลวด · เปลนั่งนอน + เครื่องจักรทำผ้าไหม
 *          ห้องครัว · กลางบ้าน (ทีวีจอใหญ่ ลำโพงซ้าย-ขวา โซฟาไม้ขัดเงา เก้าอี้ไม้สัก 2 ตัว โต๊ะขนม ตู้ DVD/CD) · แคร่ใหญ่ 2 ตัว · ประตูสีน้ำเงินบานใหญ่
 * ชั้นบน: ห้องนอน 3 ห้องฝั่งขวา · หน้าต่างคู่ 8 บานฝั่งซ้าย · ทีวีกลางบ้าน
 * (ของที่ผู้พัฒนาเสนอเพิ่ม: หิ้งพระ พัดลม มุ้ง ปฏิทิน ตู้กับข้าวมุ้งลวด หม้อหุงข้าว กระติกน้ำ เสื่อ — ตัดออกได้)
 */
export function HomeInterior() {
  const house = useInterior((s) => s.house)
  // ฉากภายในวาดเฉพาะตอนอยู่ในบ้าน (ลดภาระเครื่อง — แก้เกมอืด 19 พ.ย.)
  const inside = useInterior((s) => s.inside)
  if (!inside) return null
  if (house === 'cookhouse') return <CookInterior />
  if (house === 'bathhouse') return <BathInterior />
  if (house === 'barber') return <BarberInterior />
  return house === 'home' ? <GrandInterior /> : <NpcInterior />
}

function GrandInterior() {
  const [ox, oz] = INTERIOR_ORIGIN
  const floorTex = useMemo(() => tileTexture('#d8d2c4', '#c9c2b2', 64), [])
  const woodTex = useMemo(() => plankTexture(), [])
  const upper = useInterior((s) => s.upper)
  return (
    <group position={[ox, 0, oz]}>
      {/* ---------- โครงบ้าน ---------- */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[IW, ID]} />
        <meshStandardMaterial map={floorTex} />
      </mesh>
      <OuterWalls upper={upper} />
      {/* ประตูห้องเปิด–ปิดได้ (ห้องน้ำ ห้องน้ารง ห้องนอนชั้นบน 3 ห้อง) */}
      <HomeDoors />
      {/* พื้นชั้นสอง (เว้นช่องบันได) = เพดานชั้นล่าง — แสดงเฉพาะตอนอยู่ชั้นบน */}
      <mesh visible={upper} position={[(-IW / 2 + STAIRS.x0) / 2, FLOOR2 - 0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[STAIRS.x0 + IW / 2, 0.12, ID]} />
        <meshStandardMaterial map={woodTex} />
      </mesh>
      <mesh visible={upper} position={[(STAIRS.x0 + IW / 2) / 2, FLOOR2 - 0.06, -4.25]} receiveShadow>
        <boxGeometry args={[IW / 2 - STAIRS.x0, 0.12, 1.5]} />
        <meshStandardMaterial map={woodTex} />
      </mesh>
      {/* เพดานชั้นบน */}
      <mesh visible={false} position={[0, FLOOR2 * 2 - 0.05, 0]}>
        <boxGeometry args={[IW, 0.1, ID]} />
        <meshStandardMaterial color="#c9a46c" />
      </mesh>
      <Stairs />
      {/* ผนังกั้นห้อง (สูง 2.4 ม. กล้องมองข้ามได้) */}
      {WALLS_GROUND.map(([x0, x1, z0, z1], i) => (
        <mesh key={'g' + i} position={[(x0 + x1) / 2, 1.2, (z0 + z1) / 2]} castShadow receiveShadow>
          <boxGeometry args={[x1 - x0, 2.4, z1 - z0]} />
          <meshStandardMaterial color={x0 >= 2 && x1 <= 4.8 ? '#cfe2f2' : '#efe6d2'} />
        </mesh>
      ))}
      {upper && WALLS_UPPER.map(([x0, x1, z0, z1], i) => (
        <mesh key={'u' + i} position={[(x0 + x1) / 2, FLOOR2 + (i === WALLS_UPPER.length - 1 ? 0.45 : 1.2), (z0 + z1) / 2]} castShadow>
          <boxGeometry args={[x1 - x0, i === WALLS_UPPER.length - 1 ? 0.9 : 2.4, z1 - z0]} />
          <meshStandardMaterial color={i === WALLS_UPPER.length - 1 ? '#6e4a2e' : '#a8784a'} />
        </mesh>
      ))}
      <GroundFloor />
      {upper && <UpperFloor />}
      {/* ไฟเพดาน */}
      {[
        [-3, 2.85],
        [3.5, 2.85],
        [-4, 5.85],
        [3, 5.85],
      ].map(([x, y], i) => (
        <group key={i} position={[x, y, 0]}>
          <mesh>
            <cylinderGeometry args={[0.18, 0.22, 0.08, 14]} />
            <meshStandardMaterial color="#fff6dc" emissive="#ffe8b0" emissiveIntensity={0.8} />
          </mesh>
          <pointLight intensity={6} distance={9} decay={1.6} color="#ffe9c6" position={[0, -0.3, 0]} />
        </group>
      ))}
    </group>
  )
}

function OuterWalls({ upper }: { upper: boolean }) {
  const h = IW / 2
  const d = ID / 2
  return (
    <group>
      {/* ชั้นล่าง: ผนังปูนสีครีม · ชั้นบน: ไม้ */}
      {[
        [0, -d - 0.1, IW + 0.4, 0.2],
        [0, d + 0.1, IW + 0.4, 0.2],
        [-h - 0.1, 0, 0.2, ID],
        [h + 0.1, 0, 0.2, ID],
      ].map(([x, z, w, dd], i) => (
        <group key={i}>
          <mesh position={[x, FLOOR2 / 2, z]} receiveShadow>
            <boxGeometry args={[w, FLOOR2, dd]} />
            <meshStandardMaterial color="#efe6d2" />
          </mesh>
          <mesh visible={upper} position={[x, FLOOR2 + FLOOR2 / 2, z]} receiveShadow>
            <boxGeometry args={[w, FLOOR2, dd]} />
            <meshStandardMaterial color="#9a6a42" />
          </mesh>
        </group>
      ))}
      {/* ประตูบ้านสีน้ำเงินบานใหญ่ + มุ้งลวด (หน้าบ้าน) */}
      <mesh position={[-3, 1.15, -d + 0.02]}>
        <RBox args={[1.6, 2.2, 0.06]} radius={0.03} />
        <meshStandardMaterial color="#2f5f9a" />
      </mesh>
      <mesh position={[-3, 1.5, -d + 0.06]}>
        <planeGeometry args={[1.2, 1]} />
        <meshStandardMaterial color="#b9c2c8" metalness={0.5} roughness={0.4} transparent opacity={0.6} />
      </mesh>
      <group position={[-3, 2.45, -d + 0.08]}>
        <SignBoard lines={['ประตูหน้าบ้าน · กด E ออกจากบ้าน']} width={1.9} height={0.24} />
      </group>
      {/* หน้าต่างสแตนเลสมุ้งลวดยาวครึ่งบ้าน (ด้านหน้า ต่อเนื่องไปถึงครัว) */}
      {[
        [2.8, 6],
        [-6.7, 2.4],
      ].map(([x, w]) => (
        <mesh key={x} position={[x, 1.6, -d + 0.03]}>
          <planeGeometry args={[w, 1.2]} />
          <meshStandardMaterial color="#9fb8c4" metalness={0.5} roughness={0.3} transparent opacity={0.55} />
        </mesh>
      ))}
      {/* ประตูออกไปนั่งชมวิว (ผนังตะวันออก ชั้นล่าง) */}
      <mesh position={[h - 0.02, 1.1, -3.6]} rotation={[0, -Math.PI / 2, 0]}>
        <RBox args={[1, 2, 0.06]} radius={0.03} />
        <meshStandardMaterial color="#6b4a2e" />
      </mesh>
      {/* หน้าต่างบานใหญ่ 2 บาน ผ้าม่านสีขาวปลิว (ผนังหลัง ข้างห้องน้ำ) */}
      {[0.4, 1.4].map((x) => (
        <group key={x} position={[x, 1.6, d - 0.03]}>
          <mesh>
            <planeGeometry args={[0.9, 1.3]} />
            <meshStandardMaterial color="#a8c8e0" emissive="#cfe6ff" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, -0.05, -0.05]} rotation={[0.08, 0, 0]}>
            <planeGeometry args={[0.95, 1.3]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.75} side={2} />
          </mesh>
        </group>
      ))}
      {/* ชั้นบน: หน้าต่างคู่ 8 บานฝั่งซ้าย (ด้านหน้า) */}
      {upper && Array.from({ length: 8 }).map((_, i) => (
        <group key={'w' + i} position={[-7 + i * 1.75, FLOOR2 + 1.5, -d + 0.03]}>
          {[-0.25, 0.25].map((dx) => (
            <mesh key={dx} position={[dx, 0, 0]}>
              <planeGeometry args={[0.45, 1.1]} />
              <meshStandardMaterial color="#a8c8e0" emissive="#cfe6ff" emissiveIntensity={0.35} />
            </mesh>
          ))}
        </group>
      ))}
      {/* หน้าต่างที่หัวนอน ห้องนอนชั้นบน (ผนังหลัง) */}
      {upper && Array.from({ length: 12 }).map((_, i) => (
        <mesh key={'b' + i} position={[-7.5 + i * 1.3, FLOOR2 + 1.6, d - 0.03]}>
          <planeGeometry args={[0.5, 0.9]} />
          <meshStandardMaterial color="#a8c8e0" emissive="#cfe6ff" emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  )
}

/** บันไดไม้ 30 ขั้น ชิดผนังตะวันออก */
function Stairs() {
  const { x0, x1, zBottom, zTop } = STAIRS
  const n = 30
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => {
        const k = (i + 0.5) / n
        return (
          <mesh key={i} position={[(x0 + x1) / 2, k * FLOOR2 - 0.05, zBottom + (zTop - zBottom) * k]} castShadow receiveShadow>
            <boxGeometry args={[x1 - x0, 0.1, (zBottom - zTop) / n + 0.02]} />
            <meshStandardMaterial color={i % 2 ? '#7a5234' : '#8a5e3a'} />
          </mesh>
        )
      })}
      {/* ราวบันได */}
      <mesh position={[x0 + 0.05, FLOOR2 / 2 + 0.9, (zBottom + zTop) / 2]} rotation={[-Math.atan2(FLOOR2, zBottom - zTop), 0, 0]}>
        <boxGeometry args={[0.06, 0.06, Math.hypot(FLOOR2, zBottom - zTop)]} />
        <meshStandardMaterial color="#5a3a24" />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
function GroundFloor() {
  const tvOn = useHomeTv((s) => s.on)
  return (
    <group>
      {/* ตู้เสื้อผ้ายายเลียน (ลงบันไดมาแล้วหันซ้าย) */}
      <Box p={[5.5, 1, 4.6]} s={[1.4, 2, 0.8]} c="#7a5234" />
      {/* ---------- ห้องน้ำ (ผนังลายฟ้า-ขาว) ---------- */}
      <group position={[3.4, 0, 3.4]}>
        <Box p={[-0.8, 0.35, 1.1]} s={[0.45, 0.7, 0.6]} c="#ffffff" />
        <Box p={[-0.8, 0.75, 1.35]} s={[0.4, 0.4, 0.15]} c="#f4f4f4" />
        {/* กระจก */}
        <mesh position={[0.2, 1.5, 1.55]}>
          <planeGeometry args={[0.6, 0.7]} />
          <meshStandardMaterial color="#cfe6f4" metalness={0.8} roughness={0.08} />
        </mesh>
        {/* ฝักบัว */}
        <mesh position={[1, 2, 1.45]}>
          <cylinderGeometry args={[0.1, 0.06, 0.06, 12]} />
          <meshStandardMaterial color="#b9c0c6" metalness={0.7} />
        </mesh>
        {/* เครื่องซักผ้า 2 ตู้ */}
        {[-0.65, 0.15].map((x) => (
          <group key={x} position={[x + 0.4, 0, -0.9]}>
            <Box p={[0, 0.45, 0]} s={[0.6, 0.9, 0.6]} c="#f2f2f2" />
            <mesh position={[0, 0.5, -0.31]}>
              <circleGeometry args={[0.18, 18]} />
              <meshStandardMaterial color="#6d8fa8" />
            </mesh>
          </group>
        ))}
        {/* ราวแขวน + ชั้นวางสบู่ แชมพู แก้วแปรงสีฟัน */}
        <Box p={[1, 1.3, 0]} s={[0.05, 0.05, 1]} c="#b9c0c6" />
        <Box p={[0.2, 1.1, 1.45]} s={[0.6, 0.04, 0.15]} c="#ffffff" />
        {['#f29ab8', '#5fbf4a', '#4a90d8'].map((c, i) => (
          <mesh key={c} position={[0 + i * 0.18, 1.2, 1.45]}>
            <cylinderGeometry args={[0.035, 0.035, 0.16, 8]} />
            <meshStandardMaterial color={c} />
          </mesh>
        ))}
      </group>
      {/* ---------- เตียงตารังกับยายเลียน (มีผนังกั้น) ---------- */}
      <Bed x={-0.35} z={4.1} w={3} d={1.8} sheet="#e8d0d8" net />
      {/* ตู้เสื้อผ้าหันหน้าเข้าเตียงตา */}
      <Box p={[1.6, 1, 2.6]} s={[0.7, 2, 1.2]} c="#7a5234" />
      {/* ---------- ห้องน้ารง ---------- */}
      <Bed x={-4.6} z={4} w={2.2} d={1.6} sheet="#b8c8e0" net />
      {/* ตู้เสื้อผ้าใหญ่ 3 ประตู มีลิ้นชัก มีกระจก (หน้าห้อง) */}
      <group position={[-4.75, 0, 1.2]}>
        <Box p={[0, 1.05, 0]} s={[3.1, 2.1, 0.55]} c="#6e4a2e" />
        {[-1.1, 0, 1.1].map((x) => (
          <mesh key={x} position={[x, 1.2, -0.28]}>
            <planeGeometry args={[0.95, 1.5]} />
            <meshStandardMaterial color={x === 0 ? '#cfe6f4' : '#7a5234'} metalness={x === 0 ? 0.8 : 0} roughness={x === 0 ? 0.1 : 0.8} />
          </mesh>
        ))}
        <Box p={[0, 0.25, -0.29]} s={[3.1, 0.3, 0.02]} c="#5a3a24" />
      </group>
      {/* หลังตู้ = ที่เลี้ยงหนอนไหมของยายเลียน (กระด้งไม้ไผ่ซ้อนชั้น) */}
      <group position={[-5.6, 0, 2.5]}>
        {[0.4, 0.9, 1.4].map((y) => (
          <group key={y}>
            <mesh position={[0, y, 0]}>
              <cylinderGeometry args={[0.42, 0.42, 0.06, 20]} />
              <meshStandardMaterial color="#c8a468" />
            </mesh>
            {Array.from({ length: 6 }).map((_, k) => (
              <mesh key={k} position={[Math.cos(k) * 0.22, y + 0.05, Math.sin(k) * 0.22]} rotation={[0, k, Math.PI / 2]}>
                <capsuleGeometry args={[0.025, 0.08, 3, 6]} />
                <meshStandardMaterial color="#f4f0e2" />
              </mesh>
            ))}
          </group>
        ))}
        <mesh position={[0.6, 1.6, 0]}>
          <boxGeometry args={[0.02, 0.4, 0.3]} />
          <meshStandardMaterial color="#e8f0b8" />
        </mesh>
      </group>
      {/* ---------- เปลนั่งนอน (ตาชอบนั่งชมวิว) + เครื่องจักรทำผ้าไหมของยาย ---------- */}
      <group position={[4.3, 0, -3.3]}>
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 1.1, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 2.2, 8]} />
            <meshStandardMaterial color="#6e4a2e" />
          </mesh>
        ))}
        <mesh position={[0, 0.65, 0]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.55, 0.06, 6, 18, Math.PI]} />
          <meshStandardMaterial color="#d0503e" />
        </mesh>
      </group>
      <SilkLoom x={2.2} z={-3.6} />
      {/* ---------- ห้องครัว ---------- */}
      <group position={[-7, 0, -3]}>
        <Box p={[0, 0.45, -1.1]} s={[1.8, 0.9, 0.8]} c="#c9b48c" />
        <mesh position={[-0.4, 0.95, -1.1]}>
          <cylinderGeometry args={[0.18, 0.16, 0.22, 14]} />
          <meshStandardMaterial color="#e8e8e8" />
        </mesh>
        {/* ตู้กับข้าวมุ้งลวด (เสนอเพิ่ม) */}
        <Box p={[-0.5, 0.8, 1.6]} s={[1, 1.6, 0.6]} c="#8a6040" />
        {/* โอ่ง + กระติกน้ำ (เสนอเพิ่ม) */}
        <mesh position={[-0.5, 0.4, 3.5]}>
          <sphereGeometry args={[0.4, 14, 12]} />
          <meshStandardMaterial color="#7a4a2c" />
        </mesh>
        <mesh position={[0.4, 1, -1.1]}>
          <cylinderGeometry args={[0.12, 0.12, 0.26, 12]} />
          <meshStandardMaterial color="#d0503e" />
        </mesh>
      </group>
      {/* ประตูครัวออกไปด้านนอก (ผนังตะวันตก) */}
      <mesh position={[-IW / 2 + 0.03, 1.1, -1]} rotation={[0, Math.PI / 2, 0]}>
        <RBox args={[1, 2, 0.06]} radius={0.03} />
        <meshStandardMaterial color="#6b4a2e" />
      </mesh>
      {/* แคร่ขนาดใหญ่ 2 ตัววางติดกัน (ไว้วางของ) */}
      {[-5.1, -4.3].map((x) => (
        <group key={x} position={[x, 0, -4.1]}>
          <Box p={[0, 0.45, 0]} s={[0.78, 0.08, 1.6]} c="#c8a468" />
          <Box p={[0, 0.22, 0]} s={[0.7, 0.44, 1.5]} c="#8a6a3e" />
        </group>
      ))}
      {/* ---------- กลางบ้าน ---------- */}
      <group position={[-1.5, 0, -1]}>
        {/* เสื่อ (เสนอเพิ่ม) */}
        <mesh position={[0, 0.02, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3, 2.2]} />
          <meshStandardMaterial color="#d8b878" />
        </mesh>
        {/* โซฟาไม้ขัดเงาสีน้ำตาล (เด็ก ๆ ชอบแย่งกันนั่ง) */}
        <group position={[0, 0, 0]}>
          <Box p={[0, 0.42, 0]} s={[2.6, 0.12, 0.8]} c="#7a4220" shiny />
          <Box p={[0, 0.85, -0.38]} s={[2.6, 0.75, 0.1]} c="#7a4220" shiny />
          {[-1.25, 1.25].map((x) => (
            <Box key={x} p={[x, 0.55, 0]} s={[0.12, 0.5, 0.8]} c="#6a361a" shiny />
          ))}
        </group>
        {/* เก้าอี้ไม้สัก 2 ตัว */}
        {[-2, 2].map((x) => (
          <group key={x} position={[x, 0, 1]} rotation={[0, x > 0 ? -1.2 : 1.2, 0]}>
            <Box p={[0, 0.42, 0]} s={[0.7, 0.1, 0.7]} c="#9a6a3e" shiny />
            <Box p={[0, 0.8, -0.33]} s={[0.7, 0.7, 0.08]} c="#9a6a3e" shiny />
          </group>
        ))}
        {/* โต๊ะวางของและขนม */}
        <Box p={[0, 0.3, 1.1]} s={[1.2, 0.08, 0.6]} c="#8a5a34" shiny />
        {['#e86a5a', '#f2cf45', '#c99af0'].map((c, i) => (
          <mesh key={c} position={[-0.35 + i * 0.35, 0.38, 1.1]}>
            <boxGeometry args={[0.18, 0.08, 0.14]} />
            <meshStandardMaterial color={c} />
          </mesh>
        ))}
        {/* ทีวีจอใหญ่ + ลำโพงประกบซ้าย-ขวา + ตู้ DVD/CD */}
        <group position={[0, 0, 2.4]}>
          <Box p={[0, 0.35, 0]} s={[2.4, 0.7, 0.5]} c="#5a3a24" />
          <mesh position={[0, 1.25, 0]}>
            <boxGeometry args={[1.8, 1.05, 0.08]} />
            <meshStandardMaterial color="#1a1c20" />
          </mesh>
          <mesh position={[0, 1.25, -0.045]}>
            <planeGeometry args={[1.7, 0.95]} />
            <meshStandardMaterial color={tvOn ? '#8ac8f0' : '#0a0c10'} emissive={tvOn ? '#6ab0e8' : '#000000'} emissiveIntensity={tvOn ? 0.9 : 0} />
          </mesh>
          {[-1.3, 1.3].map((x) => (
            <Box key={x} p={[x, 0.7, 0]} s={[0.4, 1.4, 0.4]} c="#2a2a2c" />
          ))}
          {[0, 1, 2, 3, 4].map((k) => (
            <mesh key={k} position={[-0.8 + k * 0.12, 0.35, -0.26]}>
              <boxGeometry args={[0.08, 0.3, 0.02]} />
              <meshStandardMaterial color={['#c2412d', '#3f7a8c', '#d9a441', '#5f9e47', '#8a5aa8'][k]} />
            </mesh>
          ))}
        </group>
      </group>
      {/* หิ้งพระ (เสนอเพิ่ม) */}
      <group position={[-1, 2, -4.85]}>
        <Box p={[0, 0, 0]} s={[1, 0.06, 0.3]} c="#c9a24a" />
        <mesh position={[0, 0.18, 0]}>
          <coneGeometry args={[0.1, 0.3, 10]} />
          <meshStandardMaterial color="#e2b84a" metalness={0.6} roughness={0.3} />
        </mesh>
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.1, 0.05]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshStandardMaterial color="#f6c445" />
          </mesh>
        ))}
      </group>
      {/* ปฏิทินบนผนัง + พัดลมตั้งพื้น (เสนอเพิ่ม) */}
      <mesh position={[-5.95, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.45, 0.6]} />
        <meshStandardMaterial color="#fffaf0" />
      </mesh>
      <Fan x={-0.5} z={-3.6} />
    </group>
  )
}

function UpperFloor() {
  const tvOn = useHomeTv((s) => s.on2)
  const y = FLOOR2
  return (
    <group position={[0, y, 0]}>
      {/* ห้องนอน 1 (ห้องแรกที่ขึ้นบันไดมาถึง) · 2 · 3 */}
      <Bed x={5} z={3.7} w={1.7} d={2.2} sheet="#f2c8c0" net rot />
      <Bed x={0.95} z={3.7} w={2.7} d={2.2} sheet="#c8e0c8" net />
      <Bed x={-6.5} z={3.7} w={2.6} d={2.2} sheet="#d8d0f0" net />
      {/* ป้ายห้อง */}
      {[
        [4.9, 'ห้องนอน 1'],
        [0.1, 'ห้องนอน 2'],
        [-5.5, 'ห้องนอน 3'],
      ].map(([x, t]) => (
        <group key={t as string} position={[x as number, 2.2, -0.02]} rotation={[0, Math.PI, 0]}>
          <SignBoard lines={[t as string]} width={0.9} height={0.22} />
        </group>
      ))}
      {/* กลางบ้านชั้น 2: โทรทัศน์ */}
      <group position={[0, 0, -2]}>
        <Box p={[0, 0.3, 0]} s={[1.4, 0.6, 0.45]} c="#5a3a24" />
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[1.2, 0.72, 0.08]} />
          <meshStandardMaterial color="#1a1c20" />
        </mesh>
        <mesh position={[0, 0.95, -0.045]}>
          <planeGeometry args={[1.1, 0.64]} />
          <meshStandardMaterial color={tvOn ? '#f0c88a' : '#0a0c10'} emissive={tvOn ? '#e8b06a' : '#000000'} emissiveIntensity={tvOn ? 0.9 : 0} />
        </mesh>
      </group>
      <mesh position={[0, 0.02, -3.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 1.6]} />
        <meshStandardMaterial color="#d8b878" />
      </mesh>
      <Fan x={-3} z={-3.8} />
    </group>
  )
}

// ---------------------------------------------------------------------------
function Box({ p, s, c, shiny }: { p: [number, number, number]; s: [number, number, number]; c: string; shiny?: boolean }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <RBox args={s} radius={Math.min(0.05, Math.min(...s) * 0.3)} />
      <meshStandardMaterial color={c} roughness={shiny ? 0.3 : 0.8} metalness={shiny ? 0.1 : 0} />
    </mesh>
  )
}

/** เตียง + มุ้ง (มุ้ง = ผู้พัฒนาเสนอเพิ่ม) */
function Bed({ x, z, w, d, sheet, net, rot }: { x: number; z: number; w: number; d: number; sheet: string; net?: boolean; rot?: boolean }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot ? Math.PI / 2 : 0, 0]} onClick={onBedClick} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
      <Box p={[0, 0.2, 0]} s={[w, 0.4, d]} c="#7a5234" />
      <Box p={[0, 0.48, 0]} s={[w - 0.1, 0.16, d - 0.1]} c={sheet} />
      <Box p={[0, 0.62, d / 2 - 0.35]} s={[w * 0.6, 0.12, 0.4]} c="#ffffff" />
      {net && (
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[w, 1.6, d]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.12} depthWrite={false} side={2} />
        </mesh>
      )}
    </group>
  )
}

/** เครื่องจักรทำผ้าไหมของยายเลียน (กี่ทอผ้า) */
function SilkLoom({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[-0.7, 0.7].flatMap((dx) =>
        [-0.5, 0.5].map((dz) => (
          <mesh key={`${dx}${dz}`} position={[dx, 0.7, dz]}>
            <boxGeometry args={[0.08, 1.4, 0.08]} />
            <meshStandardMaterial color="#6e4a2e" />
          </mesh>
        )),
      )}
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[1.5, 0.08, 1.05]} />
        <meshStandardMaterial color="#6e4a2e" />
      </mesh>
      <mesh position={[0, 0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#b0304a" side={2} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[-0.55 + i * 0.1, 1.1, -0.2]}>
          <boxGeometry args={[0.01, 0.5, 0.01]} />
          <meshStandardMaterial color="#f4e6c0" />
        </mesh>
      ))}
    </group>
  )
}

function Fan({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.08, 14]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.1, 8]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
      <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.015, 6, 20]} />
        <meshStandardMaterial color="#5f9fd8" />
      </mesh>
    </group>
  )
}

function tileTexture(a: string, b: string, px: number) {
  const c = document.createElement('canvas')
  c.width = c.height = px * 2
  const g = c.getContext('2d')!
  g.fillStyle = a
  g.fillRect(0, 0, px * 2, px * 2)
  g.fillStyle = b
  g.fillRect(0, 0, px, px)
  g.fillRect(px, px, px, px)
  const t = new CanvasTexture(c)
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(IW / 1.2, ID / 1.2)
  t.colorSpace = SRGBColorSpace
  return t
}

function plankTexture() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const g = c.getContext('2d')!
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#9a6a42' : '#8a5e3a'
    g.fillRect(0, i * 16, 128, 16)
    g.fillStyle = '#5a3a24'
    g.fillRect(0, i * 16, 128, 1)
  }
  const t = new CanvasTexture(c)
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(4, 3)
  t.colorSpace = SRGBColorSpace
  return t
}
