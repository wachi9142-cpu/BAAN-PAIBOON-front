import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { Character } from './Character'
import { TextSprite } from '../TextSprite'
import { DEFAULT_APPEARANCE, type Appearance } from '../../game/content/appearance'
/**
 * บ้านตาปิ่น (ตามภาพอ้างอิงของผู้สร้าง 20 พ.ย.): บ้านไม้ยกพื้นเตี้ยบนตอม่อปูน
 * ผนังไม้ระแนงตั้งสีส้มอิฐ · หลังคาปั้นหยาสีเทา + จั่วเล็กด้านหน้า · หน้าต่างกรอบดำ
 * ชานไม้หน้าบ้าน (ปีกขวา) มีราวลูกกรง บันได 3 ขั้น เก้าอี้ไม้ · กระถางดอกไม้หน้าบ้าน
 * หน้าบ้านหัน +z
 */
const WALL = '#c8743a'
const WALL_D = '#a85a28'
const ROOF = '#7a7e80'
const TRIM = '#8a4a20'

export function Cottage() {
  const W = 8
  const D = 5.2
  const floor = 0.6
  const wallH = 2.5
  return (
    <group>
      {/* ต้นไม้ทรงพุ่มรอบบ้าน (ผู้สร้าง 20 พ.ย.) */}
      {([[-5.5, 5.5, 1.1], [6, -1.5, 1.2], [7.5, 8.5, 1]] as [number, number, number][]).map(([x, z, sc]) => (
        <group key={x + ':' + z} position={[x, 0, z]}>
          <BushyTree s={sc} />
        </group>
      ))}
      {/* แผงขายตะกร้าที่ตาสาน (หน้าบ้านฝั่งซ้าย) — ซื้อได้ที่ร้าน shop-pinbasket */}
      <group position={[-3.8, 0, 7.8]} rotation={[0, 0, 0]}>
        <BasketStall />
      </group>
      {/* รถสามล้อไฟฟ้าจอดหน้าชาน */}
      <group position={[W / 4 + 1.8, 0, D / 2 + 2.4]} rotation={[0, -0.4, 0]}>
        <ETricycle />
      </group>
      {/* ตาปิ่นสานตะกร้าบนแคร่หน้าบ้าน */}
      <group position={[-W / 4, 0, D / 2 + 1.9]}>
        <BasketWeaver />
      </group>
      {/* ตอม่อปูน */}
      {[-1, 0, 1].flatMap((i) =>
        [-1, 1].map((j) => (
          <mesh key={`${i}${j}`} position={[i * (W / 2 - 0.3), floor / 2, j * (D / 2 - 0.3)]} castShadow>
            <cylinderGeometry args={[0.16, 0.18, floor, 10]} />
            <meshStandardMaterial color="#d6d0c4" />
          </mesh>
        )),
      )}
      {/* พื้นไม้ */}
      <mesh position={[0, floor, 0.35]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.2, 0.14, D + 0.7]} />
        <meshStandardMaterial color={TRIM} />
      </mesh>
      {/* ตัวบ้าน: ห้องซ้ายเต็ม · ห้องขวาร่นเข้าไปเป็นชาน */}
      <mesh position={[-W / 4, floor + wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W / 2, wallH, D]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      <mesh position={[W / 4, floor + wallH / 2, -0.6]} castShadow receiveShadow>
        <boxGeometry args={[W / 2, wallH, D - 1.2]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      {/* ร่องไม้ระแนงตั้ง (ด้านหน้า) */}
      {Array.from({ length: 18 }, (_, k) => (
        <mesh key={'l' + k} position={[-W / 2 + 0.11 + k * 0.215, floor + wallH / 2, D / 2 + 0.01]}>
          <boxGeometry args={[0.02, wallH - 0.05, 0.01]} />
          <meshStandardMaterial color={WALL_D} />
        </mesh>
      ))}
      {Array.from({ length: 18 }, (_, k) => (
        <mesh key={'r' + k} position={[0.11 + k * 0.215, floor + wallH / 2, D / 2 - 1.2 + 0.01]}>
          <boxGeometry args={[0.02, wallH - 0.05, 0.01]} />
          <meshStandardMaterial color={WALL_D} />
        </mesh>
      ))}
      {/* หน้าต่างห้องซ้าย + ประตูกระจกบานใหญ่ห้องขวา */}
      <mesh position={[-W / 4, floor + 1.45, D / 2 + 0.03]}>
        <boxGeometry args={[1.2, 1, 0.05]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[-W / 4, floor + 1.45, D / 2 + 0.06]}>
        <boxGeometry args={[1.05, 0.85, 0.02]} />
        <meshStandardMaterial color="#9ab8c8" metalness={0.4} roughness={0.15} />
      </mesh>
      <mesh position={[W / 4, floor + 1.15, D / 2 - 1.2 + 0.03]}>
        <boxGeometry args={[1.5, 2, 0.05]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[W / 4, floor + 1.15, D / 2 - 1.2 + 0.06]}>
        <boxGeometry args={[1.35, 1.85, 0.02]} />
        <meshStandardMaterial color="#7a9aa8" metalness={0.4} roughness={0.15} />
      </mesh>
      {/* ชานหน้าบ้าน: ราวลูกกรง เว้นช่องบันไดตรงกลาง */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <mesh position={[W / 4 + sx * 0.85, floor + 0.85, D / 2 + 0.25]}>
            <boxGeometry args={[0.9, 0.07, 0.07]} />
            <meshStandardMaterial color={TRIM} />
          </mesh>
          {Array.from({ length: 5 }, (_, k) => (
            <mesh key={k} position={[W / 4 + sx * (0.45 + k * 0.2), floor + 0.45, D / 2 + 0.25]}>
              <boxGeometry args={[0.05, 0.8, 0.05]} />
              <meshStandardMaterial color={TRIM} />
            </mesh>
          ))}
        </group>
      ))}
      {/* บันได 3 ขั้น */}
      {[0, 1, 2].map((k) => (
        <mesh key={'s' + k} position={[W / 4, floor - 0.1 - k * 0.17, D / 2 + 0.45 + k * 0.28]} castShadow>
          <boxGeometry args={[0.8, 0.08, 0.3]} />
          <meshStandardMaterial color={TRIM} />
        </mesh>
      ))}
      {/* เก้าอี้ไม้บนชาน */}
      {[-0.6, 0.6].map((dx) => (
        <mesh key={dx} position={[W / 4 + dx, floor + 0.3, D / 2 - 0.5]}>
          <boxGeometry args={[0.45, 0.45, 0.45]} />
          <meshStandardMaterial color="#a8703a" />
        </mesh>
      ))}
      {/* หลังคาปั้นหยา (สองผืน) + จั่วเล็กด้านหน้า */}
      {[-1, 1].map((sz) => (
        <mesh key={sz} position={[0, floor + wallH + 0.55, sz * 0.95]} rotation={[sz * 0.55, 0, 0]} castShadow>
          <boxGeometry args={[W + 0.9, 0.08, 2.6]} />
          <meshStandardMaterial color={ROOF} roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[-W / 4, floor + wallH + 0.55, D / 2 + 0.2]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.25, 0.9, 4]} />
        <meshStandardMaterial color={WALL_D} />
      </mesh>
      {/* กระถางดอกไม้หน้าบ้าน */}
      {[-W / 2 + 0.6, -W / 2 + 1.5].map((x) => (
        <group key={x} position={[x, 0, D / 2 + 1]}>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.7, 0.3, 0.35]} />
            <meshStandardMaterial color="#b8683a" />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <sphereGeometry args={[0.3, 8, 6]} />
            <meshStandardMaterial color="#d84a6a" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** ตาปิ่นนั่งขัดสมาธิบนแคร่ไม้ไผ่หน้าบ้าน สานตะกร้า (ตามภาพอ้างอิงผู้สร้าง 20 พ.ย.) */
const PIN_LOOK: Appearance = { ...DEFAULT_APPEARANCE.male, age: 'elder', hairColor: 'gray', outfit: 'mohom', pose: 'sit' }
export function BasketWeaver() {
  const hands = useRef<Group>(null)
  const strips = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (hands.current) hands.current.position.y = Math.abs(Math.sin(t * 2.2)) * 0.04
    if (strips.current) strips.current.rotation.y = Math.sin(t * 0.7) * 0.15
  })
  return (
    <group>
      {/* แคร่ไม้ไผ่ */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.08, 1.1]} />
        <meshStandardMaterial color="#c8b078" />
      </mesh>
      {[-0.9, 0.9].flatMap((x) =>
        [-0.45, 0.45].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.2, z]}>
            <boxGeometry args={[0.07, 0.4, 0.07]} />
            <meshStandardMaterial color="#8a6a3a" />
          </mesh>
        )),
      )}
      {/* คุณตานั่งบนแคร่ หันหน้าเข้าหางานสาน */}
      <group position={[0.35, 0.46, -0.1]} rotation={[0, -Math.PI / 2 + 0.3, 0]} scale={0.95}>
        <Character appearance={PIN_LOOK} />
      </group>
      {/* ตอกไม้ไผ่แผ่เป็นรัศมี (กำลังขึ้นก้นตะกร้า) */}
      <group ref={strips} position={[-0.35, 0.47, 0.05]}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} rotation={[0, (i / 12) * Math.PI, 0]}>
            <boxGeometry args={[0.7, 0.01, 0.025]} />
            <meshStandardMaterial color="#e2c888" />
          </mesh>
        ))}
        <group ref={hands}>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.06, 0.16, 16]} />
            <meshStandardMaterial color="#d8b870" side={2} />
          </mesh>
        </group>
      </group>
      {/* ตะกร้าที่สานเสร็จแล้ว */}
      <group position={[-0.75, 0.46, -0.3]}>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.28, 0.2, 0.36, 14, 1, true]} />
          <meshStandardMaterial color="#d8b870" side={2} />
        </mesh>
        <mesh position={[0, 0.38, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.2, 0.015, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#c8a860" />
        </mesh>
      </group>
      {/* มัดตอกวางข้างแคร่ */}
      <mesh position={[0.2, 0.06, 0.75]} rotation={[0, 0.3, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 1.4, 8]} />
        <meshStandardMaterial color="#d8c080" />
      </mesh>
    </group>
  )
}

/** ต้นไม้ทรงพุ่ม (ลำต้นสั้น พุ่มกลมหลายก้อน) รอบบ้านตาปิ่น */
export function BushyTree({ s = 1 }: { s?: number }) {
  return (
    <group scale={s}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.4, 7]} />
        <meshStandardMaterial color="#6a4a30" />
      </mesh>
      {[
        [0, 1.9, 0, 1],
        [0.6, 1.6, 0.2, 0.75],
        [-0.55, 1.65, -0.15, 0.8],
        [0.1, 1.55, -0.6, 0.7],
        [-0.1, 2.5, 0.1, 0.65],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={i % 2 ? '#4a8a38' : '#5a9a42'} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  )
}

/** รถสามล้อไฟฟ้าสีเขียวมิ้นต์ (ตามภาพผู้สร้าง): เบาะหน้า + เบาะหลังสองตอน ตะกร้าหน้า ไฟหน้ากลม · หันหน้า +z */
export function ETricycle({ color = '#bcd8b0' }: { color?: string }) {
  const seat = '#8aa890'
  return (
    <group>
      {/* พื้นรถ */}
      <mesh position={[0, 0.32, -0.2]} castShadow>
        <boxGeometry args={[0.95, 0.12, 1.5]} />
        <meshStandardMaterial color="#9aa0a4" />
      </mesh>
      {/* กล่องใต้เบาะหลัง + เบาะ 2 ตอน + พนักพิง */}
      <mesh position={[0, 0.6, -0.55]} castShadow>
        <boxGeometry args={[0.9, 0.5, 0.8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {[-0.35, -0.85].map((z, i) => (
        <group key={z}>
          <mesh position={[0, 0.9 + i * 0.12, z]}>
            <boxGeometry args={[0.85, 0.12, 0.42]} />
            <meshStandardMaterial color={seat} />
          </mesh>
          <mesh position={[0, 1.15 + i * 0.12, z - 0.2]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.8, 0.4, 0.08]} />
            <meshStandardMaterial color={seat} />
          </mesh>
        </group>
      ))}
      {/* เบาะคนขับ */}
      <mesh position={[0, 0.85, 0.15]}>
        <boxGeometry args={[0.45, 0.12, 0.45]} />
        <meshStandardMaterial color={seat} />
      </mesh>
      {/* บังลมหน้า + คอ + แฮนด์ + ไฟหน้า + ตะกร้า */}
      <mesh position={[0, 0.65, 0.6]} rotation={[0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.5, 0.9, 0.12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.15, 0.72]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.7, 6]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0, 1.08, 0.82]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.06, 14]} />
        <meshStandardMaterial color="#f4f4f0" emissive="#fff6d8" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.85, 0.95]}>
        <boxGeometry args={[0.4, 0.25, 0.3]} />
        <meshStandardMaterial color="#d8dcdc" wireframe />
      </mesh>
      {/* ล้อหน้า 1 + ล้อหลัง 2 */}
      {([[0, 0.8], [-0.5, -0.7], [0.5, -0.7]] as [number, number][]).map(([x, z]) => (
        <mesh key={x + ':' + z} position={[x, 0.22, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.12, 14]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
    </group>
  )
}

/** ตะกร้าสาน 1 ใบ (ทรงกลม/ทรงสูง/กระเป๋า/ใบเตี้ย) */
function Basket({ kind, color = '#c8904a' }: { kind: 'round' | 'tote' | 'bag' | 'tray'; color?: string }) {
  const h = kind === 'tote' ? 0.42 : kind === 'bag' ? 0.3 : kind === 'tray' ? 0.16 : 0.28
  const r = kind === 'bag' ? 0.16 : kind === 'tray' ? 0.3 : kind === 'tote' ? 0.2 : 0.28
  return (
    <group>
      <mesh position={[0, h / 2, 0]} scale={kind === 'bag' ? [1.4, 1, 0.6] : [1, 1, 1]} castShadow>
        <cylinderGeometry args={[r, r * 0.78, h, 14, 1, true]} />
        <meshStandardMaterial color={color} side={2} roughness={1} />
      </mesh>
      <mesh position={[0, 0.01, 0]} scale={kind === 'bag' ? [1.4, 1, 0.6] : [1, 1, 1]}>
        <cylinderGeometry args={[r * 0.78, r * 0.78, 0.02, 14]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* ลายสานเป็นวง */}
      {[0.3, 0.6, 0.9].map((k) => (
        <mesh key={k} position={[0, h * k, 0]} rotation={[Math.PI / 2, 0, 0]} scale={kind === 'bag' ? [1.4, 0.6, 1] : [1, 1, 1]}>
          <torusGeometry args={[r * (0.78 + 0.22 * k), 0.008, 4, 18]} />
          <meshStandardMaterial color="#8a5a28" />
        </mesh>
      ))}
      {/* หูหิ้ว */}
      {kind === 'round' || kind === 'tray' ? (
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * r * 1.02, h, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.06, 0.012, 5, 10, Math.PI]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))
      ) : (
        <mesh position={[0, h, 0]}>
          <torusGeometry args={[r * 0.75, 0.014, 5, 14, Math.PI]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
    </group>
  )
}

/** แผงขายตะกร้าที่ตาปิ่นสาน: โต๊ะไม้ + แคร่ไม้ไผ่ วางตะกร้าหลายแบบ + ป้าย "350.- ทุกแบบ" */
export function BasketStall() {
  return (
    <group>
      {/* โต๊ะไม้ */}
      <mesh position={[0, 0.75, -0.4]} castShadow>
        <boxGeometry args={[2, 0.08, 0.9]} />
        <meshStandardMaterial color="#9a7a4a" />
      </mesh>
      {[-0.9, 0.9].flatMap((x) =>
        [-0.8, 0].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.37, z]}>
            <boxGeometry args={[0.07, 0.74, 0.07]} />
            <meshStandardMaterial color="#6a4a2a" />
          </mesh>
        )),
      )}
      {/* แคร่ไม้ไผ่เตี้ยข้างหน้า */}
      <mesh position={[0, 0.4, 0.75]} castShadow>
        <boxGeometry args={[2.2, 0.08, 0.9]} />
        <meshStandardMaterial color="#c8b078" />
      </mesh>
      {[-1, 1].flatMap((x) =>
        [0.35, 1.15].map((z) => (
          <mesh key={'k' + x + z} position={[x, 0.2, z]}>
            <boxGeometry args={[0.07, 0.4, 0.07]} />
            <meshStandardMaterial color="#8a6a3a" />
          </mesh>
        )),
      )}
      {/* ตะกร้าบนโต๊ะ (ซ้อนกัน) */}
      <group position={[-0.6, 0.79, -0.4]}>
        <Basket kind="round" />
        <group position={[0, 0.2, 0]} scale={0.92}>
          <Basket kind="round" color="#d09a52" />
        </group>
      </group>
      <group position={[0.15, 0.79, -0.4]}>
        <Basket kind="tote" color="#d8b070" />
      </group>
      <group position={[0.7, 0.79, -0.4]}>
        <Basket kind="bag" color="#b8803a" />
      </group>
      {/* ตะกร้าบนแคร่ */}
      {([[-0.75, 'tray', '#d8b070'], [-0.1, 'bag', '#e0c080'], [0.45, 'bag', '#d8b070'], [0.9, 'tote', '#c8904a']] as [number, 'tray' | 'bag' | 'tote', string][]).map(([x, k, c]) => (
        <group key={x} position={[x, 0.44, 0.8]}>
          <Basket kind={k} color={c} />
        </group>
      ))}
      {/* ป้ายราคา */}
      <group position={[1.15, 0, -0.9]}>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.05, 1.4, 0.05]} />
          <meshStandardMaterial color="#6a4a2a" />
        </mesh>
        <mesh position={[0, 1.35, 0.03]}>
          <boxGeometry args={[0.7, 0.4, 0.03]} />
          <meshStandardMaterial color="#f4ead0" />
        </mesh>
        <TextSprite text="350.- ทุกแบบ" position={[0, 1.35, 0.06]} height={0.18} color="#b8282a" />
      </group>
    </group>
  )
}
