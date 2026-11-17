import { useMemo, useRef } from 'react'
import { RBox } from './models/RBox'
import { Bush, GableRoof, PicketFence } from './models/House'
import { BananaTree } from './models/BananaTree'
import { Pet } from './models/Pet'
import { SignBoard } from './SignBoard'
import type { PetChoice } from '../game/content/pets'

/**
 * บ้านตารัง–ยายเลียน (บ้านฟ่าง) — อ้างอิง docs/HOME_TARANG_YAILIAN.md
 * พิกัดภายในบริเวณบ้าน (x = ตะวันออก, z = เหนือ) ขอบใต้ (z = −13) ติดถนนดินแดงที่ตัดเข้ากลุ่มบ้าน
 */
export const HOME_W = 30
export const HOME_D = 26
/** ประตูรั้วหน้าบ้าน (พิกัดภายใน) */
export const HOME_GATE: [number, number] = [-6.5, -13]

/** ตำแหน่งสิ่งปลูกสร้างทึบ (ใช้ทำกล่องชน) — [x, z, กว้าง, ลึก] */
export const HOME_SOLIDS: [number, number, number, number][] = [
  [-8, -5, 9, 7], // บ้านไม้สองชั้น
  [-12, 9, 3, 3], // ยุ้งข้าว
  [-6.5, 9, 5, 4], // บ้านหลังที่สอง (ครัว)
  [-2, 10.2, 3, 2], // ห้องน้ำนอกบ้าน 2 ห้อง
  [8, 10.5, 2.5, 2], // เล้าไก่
  [11, 10.5, 2.5, 2.5], // คอกหมู
  [13.5, 7, 2, 3], // ยุ้งฟาง
  [2.5, -9, 4, 3], // เรือนกล้วยไม้
]

export function GrandHome() {
  const h = HOME_W / 2
  const d = HOME_D / 2
  return (
    <group>
      {/* พื้นดินบริเวณบ้าน + ลานปูนหน้าบ้าน */}
      <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HOME_W, HOME_D]} />
        <meshStandardMaterial color="#93ad62" />
      </mesh>
      <mesh position={[-6.5, 0.03, -10.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11, 5]} />
        <meshStandardMaterial color="#c9c3b5" />
      </mesh>
      <MainHouse />
      {/* แคร่หน้าประตู = ที่นอนของน้องหมา + แคร่ใหญ่ 2 ตัวข้างครัว */}
      <Bench x={-8} z={-9.6} w={2.2} d={1.2} />
      <Bench x={-3.3} z={-2} w={1.8} d={1.1} />
      <Bench x={-3.3} z={-3.4} w={1.8} d={1.1} />
      <HousePets />
      <Car x={-1.6} z={-10.2} />
      <WaterFilter x={-12.5} z={-10.5} />
      {/* โอ่งใหญ่ใส่น้ำ + โอ่งรองน้ำฝน หลังครัว */}
      {[
        [-2.2, -0.4, 0.55],
        [-2.2, 0.8, 0.45],
      ].map(([x, z, r]) => (
        <group key={z} position={[x, 0, z]}>
          <mesh position={[0, r, 0]} castShadow>
            <sphereGeometry args={[r, 16, 12]} />
            <meshStandardMaterial color="#7a4a2c" roughness={0.6} />
          </mesh>
          <mesh position={[0, r * 1.95, 0]}>
            <cylinderGeometry args={[r * 0.55, r * 0.6, 0.08, 16]} />
            <meshStandardMaterial color="#6a3f24" />
          </mesh>
        </group>
      ))}
      <VegFlowerGarden x={2.2} z={2.5} />
      <OrchidHouse x={2.5} z={-9} />
      <RiceBarn x={-12} z={9} />
      <CookHouse x={-6.5} z={9} />
      <OutdoorToilets x={-2} z={10.2} />
      <BuffaloPen x={3} z={8.8} />
      <ChickenCoop x={8} z={10.5} />
      <PigPen x={11} z={10.5} />
      <StrawBarn x={13.5} z={7} />
      <Orchard />
      <Surroundings />
      {/* รั้วไม้รอบบ้าน (เว้นประตูหน้าบ้าน) */}
      <PicketFence x={(-h + HOME_GATE[0] - 2) / 2} z={-d} len={HOME_GATE[0] - 2 + h} />
      <PicketFence x={(HOME_GATE[0] + 2 + h) / 2} z={-d} len={h - HOME_GATE[0] - 2} />
      <PicketFence x={0} z={d} len={HOME_W} />
      <PicketFence x={-h} z={0} len={HOME_D} rot={Math.PI / 2} />
      <PicketFence x={h} z={0} len={HOME_D} rot={Math.PI / 2} />
      {/* ป้ายหน้าบ้าน */}
      <group position={[HOME_GATE[0] + 2.6, 0, -d - 0.3]}>
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, 0.55, 0]}>
            <RBox args={[0.08, 1.1, 0.08]} radius={0.03} />
            <meshStandardMaterial color="#6e4a2e" />
          </mesh>
        ))}
        <group position={[0, 1.15, 0.05]} rotation={[0, Math.PI, 0]}>
          <SignBoard lines={['บ้านตารัง–ยายเลียน']} width={1.6} height={0.4} />
        </group>
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
/** บ้านไม้สองชั้น พื้นปูน: ชั้นล่างก่อปูน หน้าต่างสแตนเลสมุ้งลวดยาว ประตูบ้านสีน้ำเงินบานใหญ่ · ชั้นบนไม้ หน้าต่างคู่ 8 บาน */
function MainHouse() {
  const W = 9
  const D = 7
  const low = 2.8
  const up = 2.6
  return (
    <group position={[-8, 0, -5]}>
      {/* พื้นปูน */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <RBox args={[W + 0.6, 0.2, D + 0.6]} radius={0.08} />
        <meshStandardMaterial color="#bdb7aa" />
      </mesh>
      {/* ชั้น 1 ผนังปูนสีครีม */}
      <mesh position={[0, 0.2 + low / 2, 0]} castShadow receiveShadow>
        <RBox args={[W, low, D]} radius={0.25} />
        <meshStandardMaterial color="#eadfc8" />
      </mesh>
      {/* ประตูบ้านสีน้ำเงินบานใหญ่ (หน้าบ้าน) */}
      <mesh position={[1.4, 1.25, -D / 2 - 0.03]}>
        <RBox args={[1.6, 2.1, 0.08]} radius={0.04} />
        <meshStandardMaterial color="#2f5f9a" />
      </mesh>
      {/* หน้าต่างสแตนเลสมุ้งลวดยาวครึ่งบ้าน (ด้านหน้า) */}
      <mesh position={[-2.2, 1.6, -D / 2 - 0.03]}>
        <RBox args={[3.8, 1.1, 0.06]} radius={0.03} />
        <meshStandardMaterial color="#a8b2b8" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* หน้าต่างบานใหญ่ 2 บาน ผ้าม่านสีขาว (ด้านตะวันตก) */}
      {[-1.2, 1.2].map((z) => (
        <group key={z} position={[-W / 2 - 0.03, 1.6, z]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <RBox args={[1.4, 1.3, 0.06]} radius={0.03} />
            <meshStandardMaterial color="#6d8fa8" />
          </mesh>
          <mesh position={[-0.02, -0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[1.2, 1.1]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.8} side={2} />
          </mesh>
        </group>
      ))}
      {/* ประตูครัว (ด้านตะวันออก) */}
      <mesh position={[W / 2 + 0.03, 1.15, 1.6]} rotation={[0, Math.PI / 2, 0]}>
        <RBox args={[1, 1.9, 0.06]} radius={0.03} />
        <meshStandardMaterial color="#6b4a2e" />
      </mesh>
      {/* ชายคาระหว่างชั้น */}
      <mesh position={[0, 0.2 + low + 0.08, -0.2]} castShadow>
        <RBox args={[W + 0.6, 0.16, D + 1]} radius={0.06} />
        <meshStandardMaterial color="#8a5a34" />
      </mesh>
      {/* ชั้น 2 ไม้ */}
      <mesh position={[0, 0.36 + low + up / 2, 0]} castShadow receiveShadow>
        <RBox args={[W - 0.3, up, D - 0.3]} radius={0.22} />
        <meshStandardMaterial color="#8f5e38" />
      </mesh>
      {/* แนวตีไม้ฝา */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, 0.5 + low + i * 0.5, -(D - 0.3) / 2 - 0.02]}>
          <planeGeometry args={[W - 0.5, 0.03]} />
          <meshBasicMaterial color="#6a4226" />
        </mesh>
      ))}
      {/* หน้าต่างคู่ชั้นบน 8 บาน (ด้านซ้าย = หน้าบ้าน) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <group key={i} position={[-W / 2 + 0.85 + i * 1.05, 0.36 + low + up * 0.55, -(D - 0.3) / 2 - 0.04]}>
          {[-0.2, 0.2].map((dx) => (
            <mesh key={dx} position={[dx, 0, 0]}>
              <RBox args={[0.36, 0.9, 0.05]} radius={0.02} />
              <meshStandardMaterial color="#c9a46c" />
            </mesh>
          ))}
        </group>
      ))}
      {/* บันไดขึ้นชั้นบน (ข้างบ้าน) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={'s' + i} position={[W / 2 + 0.7, 0.25 + i * 0.36, -1.5 + i * 0.35]} castShadow>
          <RBox args={[1, 0.08, 0.32]} radius={0.03} />
          <meshStandardMaterial color="#6e4a30" />
        </mesh>
      ))}
      <GableRoof width={W} depth={D - 0.3} height={2} y={0.36 + low + up} color="#7a3a2a" overhang={0.7} />
      {/* เปลนั่งชมวิวของตารัง (ระเบียงข้างบ้าน) */}
      <group position={[-W / 2 - 1.1, 0, -2.6]}>
        {[-0.8, 0.8].map((z) => (
          <mesh key={z} position={[0, 1.1, z]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 2.2, 8]} />
            <meshStandardMaterial color="#6e4a2e" />
          </mesh>
        ))}
        <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.35]}>
          <torusGeometry args={[0.7, 0.05, 6, 18, Math.PI]} />
          <meshStandardMaterial color="#d0503e" />
        </mesh>
      </group>
    </group>
  )
}

function Bench({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <RBox args={[w, 0.08, d]} radius={0.03} />
        <meshStandardMaterial color="#c8a468" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.1), 0.22, sz * (d / 2 - 0.1)]}>
            <RBox args={[0.08, 0.44, 0.08]} radius={0.02} />
            <meshStandardMaterial color="#8a6a3e" />
          </mesh>
        )),
      )}
    </group>
  )
}

/** หมา 6 ตัวนอนที่แคร่หน้าประตู + แมวแต้ม (นอนนิ่ง ๆ) */
const HOME_PETS: { pet: PetChoice; pos: [number, number, number]; rot: number }[] = [
  { pet: { species: 'dog', name: 'ถุงเงิน', color: '#c99a4a', pattern: 'patches', patternColor: '#f3ead8', fur: 'long', size: 'large' } as PetChoice, pos: [-8.6, 0.5, -9.6], rot: 0.4 },
  { pet: { species: 'dog', name: 'โซดา', color: '#f4efe6', pattern: 'plain', patternColor: '#ffffff', fur: 'long' } as PetChoice, pos: [-7.4, 0.5, -9.5], rot: -0.6 },
  { pet: { species: 'dog', name: 'เสือ', color: '#8a5a32', pattern: 'stripes', patternColor: '#2b2a2c' } as PetChoice, pos: [-9.6, 0, -10.6], rot: 1.2 },
  { pet: { species: 'dog', name: 'เบอร์ดี้', color: '#9a6a3e', pattern: 'blacktan', patternColor: '#2b2a2c' } as PetChoice, pos: [-6.4, 0, -10.9], rot: -1.4 },
  { pet: { species: 'dog', name: 'ฟีโน่', color: '#2b2a2c', pattern: 'tuxedo', patternColor: '#f4efe6' } as PetChoice, pos: [-5.6, 0, -9.2], rot: 2.4 },
  { pet: { species: 'dog', name: 'ตัวที่ 5', color: '#c99a4a', pattern: 'plain', patternColor: '#f3ead8' } as PetChoice, pos: [-10.4, 0, -9.4], rot: -0.2 },
  { pet: { species: 'cat', name: 'แต้ม', color: '#2b2a2c', pattern: 'tuxedo', patternColor: '#f4efe6' } as PetChoice, pos: [-3.3, 0.5, -2.2], rot: 0.8 },
]

function HousePets() {
  return (
    <group>
      {HOME_PETS.map((p, i) => (
        <RestingPet key={i} pet={p.pet} pos={p.pos} rot={p.rot} />
      ))}
    </group>
  )
}

function RestingPet({ pet, pos, rot }: { pet: PetChoice; pos: [number, number, number]; rot: number }) {
  const motion = useRef(0)
  const pose = useRef(2)
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Pet pet={pet} motion={motion} pose={pose} />
    </group>
  )
}

function Car({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <RBox args={[3.6, 0.8, 1.6]} radius={0.3} />
        <meshStandardMaterial color="#c8ccd2" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[-0.2, 1.25, 0]} castShadow>
        <RBox args={[2, 0.6, 1.45]} radius={0.25} />
        <meshStandardMaterial color="#4a6278" metalness={0.3} roughness={0.2} />
      </mesh>
      {[-1.2, 1.2].flatMap((wx) =>
        [-0.75, 0.75].map((wz) => (
          <mesh key={`${wx}${wz}`} position={[wx, 0.32, wz]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.22, 16]} />
            <meshStandardMaterial color="#2a2a2c" />
          </mesh>
        )),
      )}
    </group>
  )
}

/** เครื่องกรองน้ำบาดาลหน้าบ้าน */
function WaterFilter({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.15, 0]}>
        <RBox args={[1.2, 0.3, 0.8]} radius={0.06} />
        <meshStandardMaterial color="#bdb7aa" />
      </mesh>
      {[-0.3, 0.3].map((dx) => (
        <mesh key={dx} position={[dx, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 1.1, 14]} />
          <meshStandardMaterial color={dx < 0 ? '#5f9fd8' : '#e8e8e8'} />
        </mesh>
      ))}
      <mesh position={[0, 0.6, 0.35]}>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
        <meshStandardMaterial color="#6b6e72" metalness={0.5} />
      </mesh>
    </group>
  )
}

/** สวนผักสวนครัว + สวนดอกไม้ของยายเลียน (มีรั้วไม้เตี้ย) */
function VegFlowerGarden({ x, z }: { x: number; z: number }) {
  const flowers = ['#f29ab8', '#f6c445', '#e86a5a', '#ffffff', '#c99af0']
  return (
    <group position={[x, 0, z]}>
      {[-1.6, 0, 1.6].map((dx) => (
        <group key={dx} position={[dx - 1.2, 0, 0]}>
          <mesh position={[0, 0.12, 0]} receiveShadow>
            <RBox args={[1.2, 0.24, 3.6]} radius={0.05} />
            <meshStandardMaterial color="#6a4630" />
          </mesh>
          {[-1.2, -0.4, 0.4, 1.2].map((dz) => (
            <mesh key={dz} position={[0, 0.36, dz]}>
              <icosahedronGeometry args={[0.22, 1]} />
              <meshStandardMaterial color={dx === 0 ? '#7cbf4e' : '#5f9e47'} flatShading />
            </mesh>
          ))}
        </group>
      ))}
      {/* สวนดอกไม้ */}
      {[0, 1, 2, 3].map((i) => (
        <Bush key={i} x={2.6} z={-1.6 + i * 1.1} s={0.6} flowers={flowers[i % flowers.length]} />
      ))}
      <PicketFence x={0} z={2.3} len={6} />
      <PicketFence x={0} z={-2.3} len={6} />
    </group>
  )
}

/** เรือนกล้วยไม้ (หน้าบ้านฝั่งครัว) + แก้วมังกร 3 ต้น */
function OrchidHouse({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 1.9, 1.1, sz * 1.4]}>
            <cylinderGeometry args={[0.05, 0.05, 2.2, 8]} />
            <meshStandardMaterial color="#7a5236" />
          </mesh>
        )),
      )}
      <mesh position={[0, 2.22, 0]}>
        <planeGeometry args={[4.2, 3.2]} />
        <meshStandardMaterial color="#2c3a2e" transparent opacity={0.45} side={2} depthWrite={false} />
      </mesh>
      <mesh position={[0, 2.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.2, 3.2]} />
        <meshStandardMaterial color="#2c3a2e" transparent opacity={0.45} side={2} depthWrite={false} />
      </mesh>
      {/* กล้วยไม้ 10 ต้น แขวนเป็นแถว */}
      {Array.from({ length: 10 }).map((_, i) => (
        <group key={i} position={[-1.6 + (i % 5) * 0.8, 1.4, i < 5 ? -0.6 : 0.6]}>
          <mesh>
            <cylinderGeometry args={[0.1, 0.08, 0.12, 8]} />
            <meshStandardMaterial color="#8a6a3e" />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <icosahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color="#5f9e47" flatShading />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[0.08 * (k - 1), 0.28 + k * 0.05, 0.05]}>
              <sphereGeometry args={[0.05, 8, 6]} />
              <meshStandardMaterial color={i % 3 === 0 ? '#c99af0' : i % 3 === 1 ? '#f29ab8' : '#ffffff'} />
            </mesh>
          ))}
        </group>
      ))}
      {/* แก้วมังกร 3 ต้น ขึ้นค้างเสาปูน */}
      {[-1.5, 0, 1.5].map((dx) => (
        <group key={dx} position={[dx, 0, 2.3]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.4, 8]} />
            <meshStandardMaterial color="#bdb7aa" />
          </mesh>
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} position={[Math.cos(k * 1.6) * 0.25, 1.35, Math.sin(k * 1.6) * 0.25]} rotation={[Math.cos(k) * 0.9, k, Math.sin(k) * 0.9]}>
              <cylinderGeometry args={[0.05, 0.05, 0.6, 3]} />
              <meshStandardMaterial color="#6aa84f" flatShading />
            </mesh>
          ))}
          <mesh position={[0.2, 1.2, 0.1]} scale={[1, 1.2, 1]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshStandardMaterial color="#e0407a" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** ยุ้งข้าวโบราณ: เรือนไม้ยกพื้นเตี้ย หลังคาจั่วสูง */
function RiceBarn({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 1.2, 0.5, sz * 1.2]} castShadow>
            <cylinderGeometry args={[0.12, 0.14, 1, 8]} />
            <meshStandardMaterial color="#5a3b26" />
          </mesh>
        )),
      )}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <RBox args={[3, 1.8, 3]} radius={0.12} />
        <meshStandardMaterial color="#8a5a34" />
      </mesh>
      <GableRoof width={3} depth={3} height={1.6} y={2.7} color="#6a4a2e" overhang={0.5} />
      <group position={[0, 3.2, 1.55]}>
        <SignBoard lines={['ยุ้งข้าว']} width={1} height={0.3} />
      </group>
    </group>
  )
}

/** บ้านหลังที่สอง (ทำกับข้าว · ผู้สร้างชอบมานอน) ใต้ถุนเก็บเครื่องมือทำสวนและซ่อมรถ */
function CookHouse({ x, z }: { x: number; z: number }) {
  const floorY = 1.7
  return (
    <group position={[x, 0, z]}>
      {[-1, 0, 1].flatMap((ix) =>
        [-1, 1].map((iz) => (
          <mesh key={`${ix}${iz}`} position={[ix * 2.2, floorY / 2, iz * 1.7]} castShadow>
            <RBox args={[0.22, floorY, 0.22]} radius={0.08} />
            <meshStandardMaterial color="#5a3b26" />
          </mesh>
        )),
      )}
      <mesh position={[0, floorY, 0]} castShadow receiveShadow>
        <RBox args={[5, 0.16, 4]} radius={0.06} />
        <meshStandardMaterial color="#6e4a30" />
      </mesh>
      <mesh position={[0, floorY + 1.1, -0.2]} castShadow receiveShadow>
        <RBox args={[5, 2.2, 3.4]} radius={0.2} />
        <meshStandardMaterial color="#9a6a42" />
      </mesh>
      <GableRoof width={5} depth={3.4} height={1.3} y={floorY + 2.2} color="#7a3a2a" overhang={0.5} />
      {/* ใต้ถุน: เครื่องมือทำสวน รถมอเตอร์ไซค์ */}
      {[-1.6, -1.2, -0.8].map((dx, i) => (
        <mesh key={dx} position={[dx, 0.7, -1.4]} rotation={[0, 0, 0.12 * (i - 1)]}>
          <cylinderGeometry args={[0.025, 0.025, 1.4, 6]} />
          <meshStandardMaterial color="#a0784a" />
        </mesh>
      ))}
      <group position={[1, 0, 0.2]}>
        <mesh position={[0, 0.55, 0]}>
          <RBox args={[1.4, 0.3, 0.3]} radius={0.1} />
          <meshStandardMaterial color="#c2412d" />
        </mesh>
        {[-0.6, 0.6].map((wx) => (
          <mesh key={wx} position={[wx, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.28, 0.07, 8, 16]} />
            <meshStandardMaterial color="#2a2a2c" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function OutdoorToilets({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <RBox args={[3, 2.2, 2]} radius={0.18} />
        <meshStandardMaterial color="#d8d2c4" />
      </mesh>
      {[-0.7, 0.7].map((dx) => (
        <mesh key={dx} position={[dx, 0.95, -1.02]}>
          <RBox args={[0.7, 1.7, 0.05]} radius={0.03} />
          <meshStandardMaterial color="#5a7a8a" />
        </mesh>
      ))}
      <GableRoof width={3} depth={2} height={0.6} y={2.2} color="#8fa0a8" overhang={0.2} />
    </group>
  )
}

/** คอกควาย 5 ตัว: แม่ควาย 2 · ลูกผู้ตัวโต 1 · ลูกเมียตัวเล็ก 1 · ลูกเมียเพิ่งคลอด 2 เดือน 1 */
function BuffaloPen({ x, z }: { x: number; z: number }) {
  const herd = useMemo(
    () =>
      [
        { s: 1, p: [-1.6, -0.8], r: 0.3 },
        { s: 1, p: [1.2, -1], r: -0.5 },
        { s: 0.85, p: [-0.4, 1], r: 1.4 },
        { s: 0.65, p: [1.6, 1.2], r: 2.2 },
        { s: 0.45, p: [0.4, 0.1], r: -1.8 },
      ].map((b) => ({ ...b, pet: { species: 'buffalo', name: 'ควาย', color: '#4a4a52', pattern: 'plain', patternColor: '#6a6a72' } as PetChoice })),
    [],
  )
  return (
    <group position={[x, 0, z]}>
      {/* หลังคาเล้าควาย + รังแม่ไก่ตามมุมเสา */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[sx * 2.9, 0, sz * 2.4]}>
            <mesh position={[0, 1.4, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.12, 2.8, 8]} />
              <meshStandardMaterial color="#5a3b26" />
            </mesh>
            <mesh position={[-sx * 0.15, 2.5, -sz * 0.15]} scale={[1, 0.5, 1]}>
              <sphereGeometry args={[0.2, 10, 8]} />
              <meshStandardMaterial color="#c8a468" roughness={1} />
            </mesh>
          </group>
        )),
      )}
      <mesh position={[0, 2.9, 0]} castShadow>
        <RBox args={[6.4, 0.1, 5.4]} radius={0.04} />
        <meshStandardMaterial color="#8a7a5a" />
      </mesh>
      {/* ราวคอก */}
      {[
        [0, -2.5, 6, 0],
        [0, 2.5, 6, 0],
        [-3, 0, 5, Math.PI / 2],
        [3, 0, 5, Math.PI / 2],
      ].map(([px, pz, len, r], i) => (
        <group key={i} position={[px, 0, pz]} rotation={[0, r, 0]}>
          {[0.5, 1].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <RBox args={[len, 0.1, 0.1]} radius={0.04} />
              <meshStandardMaterial color="#8a6040" />
            </mesh>
          ))}
        </group>
      ))}
      {herd.map((b, i) => (
        <group key={i} position={[b.p[0], 0, b.p[1]]} rotation={[0, b.r, 0]} scale={b.s * 0.8}>
          <RestingPet pet={b.pet} pos={[0, 0, 0]} rot={0} />
        </group>
      ))}
    </group>
  )
}

function ChickenCoop({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <RBox args={[2.5, 1.6, 2]} radius={0.1} />
        <meshStandardMaterial color="#a8805a" />
      </mesh>
      <GableRoof width={2.5} depth={2} height={0.7} y={1.7} color="#8fa0a8" overhang={0.2} />
      <mesh position={[0, 0.6, -1.02]}>
        <planeGeometry args={[1.8, 0.9]} />
        <meshStandardMaterial color="#d8d2c4" wireframe />
      </mesh>
    </group>
  )
}

function PigPen({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <RBox args={[2.5, 0.8, 2.5]} radius={0.1} />
        <meshStandardMaterial color="#bdb7aa" />
      </mesh>
      <mesh position={[0, 0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.1, 2.1]} />
        <meshStandardMaterial color="#7a5a3e" />
      </mesh>
      <mesh position={[0, 1.8, 0.4]} castShadow>
        <RBox args={[2.8, 0.08, 1.8]} radius={0.03} />
        <meshStandardMaterial color="#8fa0a8" />
      </mesh>
    </group>
  )
}

function StrawBarn({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.9, 1.2, sz * 1.4]}>
            <cylinderGeometry args={[0.07, 0.07, 2.4, 8]} />
            <meshStandardMaterial color="#5a3b26" />
          </mesh>
        )),
      )}
      <GableRoof width={2} depth={3} height={0.8} y={2.4} color="#6a4a2e" overhang={0.25} />
      <mesh position={[0, 0.7, 0]} scale={[1, 0.8, 1.4]} castShadow>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial color="#e2c56a" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// ต้นไม้ในบ้าน (สวนผลไม้ + รอบบ้าน)
const TrunkTree = ({ x, z, h = 2.2, r = 1.2, color = '#4f8640', trunk = '#6b5440', fruit, fruitColor = '#e0402f', fruitR = 0.08 }: { x: number; z: number; h?: number; r?: number; color?: string; trunk?: string; fruit?: number; fruitColor?: string; fruitR?: number }) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, h / 2, 0]} castShadow>
      <cylinderGeometry args={[0.1 + r * 0.06, 0.14 + r * 0.08, h, 10]} />
      <meshStandardMaterial color={trunk} roughness={0.9} />
    </mesh>
    <mesh position={[0, h + r * 0.55, 0]} castShadow>
      <icosahedronGeometry args={[r, 2]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
    {fruit &&
      Array.from({ length: fruit }).map((_, i) => (
        <mesh key={i} position={[Math.cos(i * 2.4) * r * 0.85, h + r * 0.2 + (i % 3) * 0.25, Math.sin(i * 2.4) * r * 0.85]}>
          <sphereGeometry args={[fruitR, 8, 6]} />
          <meshStandardMaterial color={fruitColor} />
        </mesh>
      ))}
  </group>
)

const Palm = ({ x, z, h = 5, areca = false }: { x: number; z: number; h?: number; areca?: boolean }) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, h / 2, 0]} castShadow>
      <cylinderGeometry args={[areca ? 0.07 : 0.13, areca ? 0.09 : 0.2, h, 8]} />
      <meshStandardMaterial color={areca ? '#9a9a7a' : '#8a7058'} roughness={0.9} />
    </mesh>
    {Array.from({ length: areca ? 5 : 7 }).map((_, k) => (
      <group key={k} position={[0, h, 0]} rotation={[0, (k / (areca ? 5 : 7)) * Math.PI * 2, 0]}>
        <mesh position={[0, -0.2, areca ? 0.55 : 0.9]} rotation={[0.5, 0, 0]} scale={[areca ? 0.18 : 0.28, 0.04, areca ? 0.7 : 1.1]} castShadow>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color={k % 2 ? '#5a9a42' : '#4f8a3a'} />
        </mesh>
      </group>
    ))}
    {!areca &&
      [0, 1, 2].map((k) => (
        <mesh key={'c' + k} position={[Math.cos(k * 2.1) * 0.22, h - 0.25, Math.sin(k * 2.1) * 0.22]}>
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshStandardMaterial color="#6a8a3a" />
        </mesh>
      ))}
    {areca &&
      [0, 1].map((k) => (
        <mesh key={'a' + k} position={[0.1 * (k ? 1 : -1), h - 0.35, 0.05]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshStandardMaterial color="#e08a2e" />
        </mesh>
      ))}
  </group>
)

const Bamboo = ({ x, z }: { x: number; z: number }) => (
  <group position={[x, 0, z]}>
    {Array.from({ length: 9 }).map((_, i) => {
      const a = i * 0.7
      const h = 5 + (i % 3)
      return (
        <group key={i} position={[Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4]} rotation={[Math.sin(a) * 0.12, 0, Math.cos(a) * 0.12]}>
          <mesh position={[0, h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, h, 6]} />
            <meshStandardMaterial color="#8db35a" />
          </mesh>
          <mesh position={[0, h - 0.3, 0]} scale={[0.7, 1.2, 0.7]}>
            <icosahedronGeometry args={[0.5, 1]} />
            <meshStandardMaterial color="#6aa84f" flatShading />
          </mesh>
        </group>
      )
    })}
  </group>
)

const Pandan = ({ x, z }: { x: number; z: number }) => (
  <group position={[x, 0, z]}>
    {Array.from({ length: 8 }).map((_, i) => (
      <mesh key={i} position={[0, 0.35, 0]} rotation={[0.5, (i / 8) * Math.PI * 2, 0]}>
        <coneGeometry args={[0.05, 0.8, 4]} />
        <meshStandardMaterial color="#4f9a3a" />
      </mesh>
    ))}
  </group>
)

/** สวนผลไม้ (ตายายปลูกร่วมกัน) — ฝั่งตะวันออกของบ้าน หน้ารั้วสวนผัก */
function Orchard() {
  return (
    <group>
      {/* มะม่วงต้นใหญ่ 3 ต้น (ผูกเปล) */}
      <TrunkTree x={8} z={-9} h={2.6} r={1.7} color="#3f6e33" fruit={6} fruitColor="#e8c040" fruitR={0.1} />
      <TrunkTree x={12.5} z={-9.5} h={2.6} r={1.6} color="#467a37" fruit={5} fruitColor="#e8c040" fruitR={0.1} />
      <TrunkTree x={12.5} z={-3} h={2.5} r={1.6} color="#3f6e33" />
      {/* เปลผูกระหว่างมะม่วง */}
      <mesh position={[10.25, 1.2, -9.25]} rotation={[0, -0.11, 0]}>
        <RBox args={[3.8, 0.06, 0.7]} radius={0.03} />
        <meshStandardMaterial color="#d0503e" />
      </mesh>
      {/* มะม่วงแคระ 2 ต้น (ปีนเล่นได้) */}
      <TrunkTree x={8.5} z={-3.5} h={1.2} r={1.1} color="#4f8640" fruit={4} fruitColor="#9ac040" />
      <TrunkTree x={6} z={-6} h={1.2} r={1} color="#4f8640" fruit={3} fruitColor="#9ac040" />
      {/* ชมพู่แคระ 4 ต้น */}
      {[
        [6, 0.5],
        [8.5, 0.8],
        [11, 0.5],
        [13.5, 1],
      ].map(([x, z]) => (
        <TrunkTree key={x} x={x} z={z} h={1} r={0.8} color="#5a9a48" fruit={6} fruitColor="#ef6a7a" fruitR={0.07} />
      ))}
      {/* น้อยหน่า 3 ต้น */}
      {[
        [5.5, 4],
        [7.5, 4.6],
        [5, -11],
      ].map(([x, z]) => (
        <TrunkTree key={'n' + x + z} x={x} z={z} h={1} r={0.75} color="#6a9a4a" fruit={4} fruitColor="#9ab86a" fruitR={0.09} />
      ))}
      {/* ขนุน 2 ต้น (ผลใหญ่ติดลำต้น) */}
      {[
        [13.5, 4],
        [10.5, 4.5],
      ].map(([x, z]) => (
        <group key={'j' + x}>
          <TrunkTree x={x} z={z} h={2.4} r={1.3} color="#3f6e33" />
          {[0, 1].map((k) => (
            <mesh key={k} position={[x + (k ? 0.22 : -0.22), 1.1 + k * 0.4, z + 0.12]} scale={[1, 1.4, 1]}>
              <sphereGeometry args={[0.2, 10, 8]} />
              <meshStandardMaterial color="#9ab040" flatShading />
            </mesh>
          ))}
        </group>
      ))}
      {/* ใบเตย 5–6 กอ */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Pandan key={i} x={4.6 + i * 0.7} z={-1.6} />
      ))}
      {/* กล้วย 10 ต้น (แถวริมรั้วตะวันออก) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <group key={i} position={[14.2, 0, -11 + i * 2.2]} scale={0.75}>
          <BananaTree seed={i * 7 + 3} />
        </group>
      ))}
      {/* ยอ 4 ต้น */}
      {[
        [3.5, -5],
        [4.5, -3.2],
        [-13.5, 3],
        [-13.5, 0.5],
      ].map(([x, z]) => (
        <TrunkTree key={'y' + x + z} x={x} z={z} h={1.2} r={0.7} color="#3f7a3a" fruit={3} fruitColor="#e8ecd0" fruitR={0.08} />
      ))}
    </group>
  )
}

/** รอบบ้าน: มะพร้าว หมาก ไผ่ ลำไย มะม่วงเขียวใหญ่ พื้นที่หญ้า */
function Surroundings() {
  const h = HOME_W / 2 - 0.9
  const d = HOME_D / 2 - 0.9
  return (
    <group>
      {/* แนวมะพร้าวรอบบ้าน (หลังแนวมะพร้าวคือรั้วไม้) */}
      {[-13, -9, -5, -1, 3, 7, 11].map((x, i) => (
        <Palm key={'cn' + x} x={x} z={d} h={5 + (i % 3) * 0.6} />
      ))}
      {[-8, -3, 2].map((z, i) => (
        <Palm key={'cw' + z} x={-h} z={z} h={5.4 + (i % 2) * 0.5} />
      ))}
      {/* หมาก: พื้นที่หญ้าฝั่งตะวันตก-เหนือ */}
      {Array.from({ length: 14 }).map((_, i) => (
        <Palm key={'ar' + i} x={-13.6 + (i % 2) * 1.1} z={-11 + Math.floor(i / 2) * 1.6} h={4.2 + (i % 3) * 0.4} areca />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <Palm key={'ar2' + i} x={0.5 + i * 1.6} z={12} h={4 + (i % 2) * 0.5} areca />
      ))}
      {/* ไผ่กอใหญ่ */}
      <Bamboo x={-14} z={12} />
      <Bamboo x={14} z={12} />
      {/* ลำไย: กลางรั้วบ้าน 1 ต้น + หลังห้องน้ำ 2 ต้น */}
      <TrunkTree x={0} z={-11.8} h={1.8} r={1.3} color="#3f6e33" fruit={8} fruitColor="#c8a468" fruitR={0.07} />
      <TrunkTree x={-3.5} z={11.8} h={1.8} r={1.1} color="#3f6e33" fruit={6} fruitColor="#c8a468" fruitR={0.07} />
      <TrunkTree x={-0.5} z={11.8} h={1.8} r={1.1} color="#3f6e33" fruit={6} fruitColor="#c8a468" fruitR={0.07} />
      {/* มะม่วงเขียวใหญ่ */}
      <TrunkTree x={-13} z={6} h={2.6} r={1.5} color="#3f6e33" fruit={5} fruitColor="#8ac040" fruitR={0.1} />
    </group>
  )
}
