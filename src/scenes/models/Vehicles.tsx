import { Text } from '@react-three/drei'
import { RBox } from './RBox'
import { ContactShadow } from './Motorcycle'

const TIRE = '#1e1e20'
const CHROME = '#c8ccd0'

function Wheel({ x, y, z, r, w }: { x: number; y: number; z: number; r: number; w: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r, r, w, 18]} />
        <meshStandardMaterial color={TIRE} roughness={0.9} />
      </mesh>
      <mesh position={[Math.sign(x) * (w / 2 + 0.005), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r * 0.55, r * 0.55, 0.02, 14]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.5} roughness={0.35} />
      </mesh>
    </group>
  )
}

/** รถกระบะ 4 ประตู (หัวไปทาง +z) · ยี่ห้อสมมติ "SIAMOTO" (หลบลิขสิทธิ์) */
export function Pickup({ color = '#17181b' }: { color?: string }) {
  const paint = <meshStandardMaterial color={color} metalness={0.45} roughness={0.28} />
  return (
    <group>
      {/* ตัวถังล่าง */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <RBox args={[1.85, 0.62, 5.1]} radius={0.12} />
        {paint}
      </mesh>
      {/* ห้องโดยสาร */}
      <mesh position={[0, 1.33, 0.55]} castShadow>
        <RBox args={[1.75, 0.66, 2.35]} radius={0.16} />
        {paint}
      </mesh>
      {/* กระจกรอบคัน */}
      <mesh position={[0, 1.36, 0.55]}>
        <RBox args={[1.77, 0.42, 2.2]} radius={0.12} />
        <meshStandardMaterial color="#2a3a48" metalness={0.3} roughness={0.12} />
      </mesh>
      {/* กระบะท้ายเปิดโล่ง */}
      <mesh position={[0, 1.04, -1.6]}>
        <boxGeometry args={[1.62, 0.05, 1.75]} />
        <meshStandardMaterial color="#222326" roughness={0.8} />
      </mesh>
      {/* กระจังหน้า + ไฟหน้า */}
      <mesh position={[0, 0.82, 2.56]}>
        <boxGeometry args={[1.2, 0.28, 0.04]} />
        <meshStandardMaterial color="#3a3c40" metalness={0.6} roughness={0.3} />
      </mesh>
      {[-0.72, 0.72].map((x) => (
        <mesh key={x} position={[x, 0.86, 2.55]}>
          <boxGeometry args={[0.3, 0.16, 0.04]} />
          <meshStandardMaterial color="#fff6d8" emissive="#fff0c0" emissiveIntensity={0.2} />
        </mesh>
      ))}
      {[-0.78, 0.78].map((x) => (
        <mesh key={'t' + x} position={[x, 0.86, -2.56]}>
          <boxGeometry args={[0.18, 0.3, 0.04]} />
          <meshStandardMaterial color="#c8281e" emissive="#801810" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* กันชน */}
      {[2.6, -2.6].map((z) => (
        <mesh key={z} position={[0, 0.48, z]}>
          <RBox args={[1.9, 0.18, 0.12]} radius={0.05} />
          <meshStandardMaterial color={CHROME} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      <Text position={[0, 0.98, -2.575]} rotation={[0, Math.PI, 0]} fontSize={0.14} color="#d8dade" anchorX="center" anchorY="middle">
        SIAMOTO
      </Text>
      {[1.65, -1.65].flatMap((z) => [-0.86, 0.86].map((x) => <Wheel key={x + ':' + z} x={x} y={0.38} z={z} r={0.38} w={0.28} />))}
    </group>
  )
}

/** รถไถคันเล็กสีส้ม (หัวไปทาง +z): ล้อหลังใหญ่ ล้อหน้าเล็ก ฝากระโปรง ท่อไอเสียตั้ง เบาะ พวงมาลัย */
export function Tractor({ color = '#e0702a' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.85, 0.55]} castShadow>
        <RBox args={[0.8, 0.62, 1.5]} radius={0.12} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.62, -0.45]} castShadow>
        <RBox args={[0.9, 0.36, 0.9]} radius={0.08} />
        <meshStandardMaterial color="#3c3e42" />
      </mesh>
      {/* บังโคลนล้อหลัง */}
      {[-0.68, 0.68].map((x) => (
        <mesh key={x} position={[x, 1.2, -0.65]}>
          <RBox args={[0.42, 0.06, 1.05]} radius={0.03} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      {/* เบาะ + พวงมาลัย */}
      <mesh position={[0, 1.18, -0.75]} castShadow>
        <RBox args={[0.46, 0.12, 0.42]} radius={0.05} />
        <meshStandardMaterial color="#1c1c1e" />
      </mesh>
      <mesh position={[0, 1.42, -0.2]} rotation={[-0.7, 0, 0]}>
        <torusGeometry args={[0.17, 0.025, 6, 18]} />
        <meshStandardMaterial color="#1c1c1e" />
      </mesh>
      <mesh position={[0, 1.25, -0.27]} rotation={[0.8, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.35, 6]} />
        <meshStandardMaterial color="#3a3a3c" />
      </mesh>
      {/* ท่อไอเสีย */}
      <mesh position={[0.25, 1.5, 0.95]}>
        <cylinderGeometry args={[0.045, 0.05, 0.75, 8]} />
        <meshStandardMaterial color="#3a3a3c" metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.95, 1.31]}>
        <boxGeometry args={[0.6, 0.35, 0.04]} />
        <meshStandardMaterial color="#2a2a2c" />
      </mesh>
      {[-0.68, 0.68].map((x) => (
        <Wheel key={'r' + x} x={x} y={0.62} z={-0.65} r={0.62} w={0.36} />
      ))}
      {[-0.5, 0.5].map((x) => (
        <Wheel key={'f' + x} x={x} y={0.34} z={0.95} r={0.34} w={0.2} />
      ))}
    </group>
  )
}

/** จักรยานผู้ใหญ่ (หัวไปทาง +z) มีตะกร้าหน้า และ "ที่ซ้อน" (ตะแกรงท้าย) */
export function Bicycle({ color = '#2f6a9a' }: { color?: string }) {
  const tube = (p: [number, number, number], rx: number, len: number, c = color) => (
    <mesh position={p} rotation={[rx, 0, 0]}>
      <cylinderGeometry args={[0.022, 0.022, len, 6]} />
      <meshStandardMaterial color={c} />
    </mesh>
  )
  return (
    <group rotation={[0, 0, 0.1]}>
      {[0.55, -0.55].map((z) => (
        <group key={z} position={[0, 0.34, z]}>
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[0.32, 0.03, 6, 22]} />
            <meshStandardMaterial color={TIRE} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.08, 8]} />
            <meshStandardMaterial color={CHROME} metalness={0.5} />
          </mesh>
        </group>
      ))}
      {/* โครงรถ */}
      {tube([0, 0.62, 0.05], Math.PI / 2 + 0.15, 0.95)}
      {tube([0, 0.48, 0.25], 0.95, 0.75)}
      {tube([0, 0.55, -0.3], -0.5, 0.6)}
      {tube([0, 0.5, 0.52], 0.25, 0.4, CHROME)}
      {/* เบาะ + แฮนด์ */}
      <mesh position={[0, 0.86, -0.32]}>
        <RBox args={[0.14, 0.06, 0.24]} radius={0.03} />
        <meshStandardMaterial color="#2a2220" />
      </mesh>
      <mesh position={[0, 0.92, 0.48]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.55, 6]} />
        <meshStandardMaterial color={CHROME} metalness={0.5} />
      </mesh>
      {/* ตะกร้าหน้า */}
      <mesh position={[0, 0.82, 0.72]}>
        <boxGeometry args={[0.32, 0.2, 0.24]} />
        <meshStandardMaterial color="#c8ccd0" metalness={0.4} roughness={0.5} wireframe />
      </mesh>
      {/* ที่ซ้อนท้าย (ตะแกรงเหล็ก + เบาะนุ่ม) */}
      <mesh position={[0, 0.74, -0.62]}>
        <boxGeometry args={[0.26, 0.03, 0.42]} />
        <meshStandardMaterial color="#3a3a3c" metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.79, -0.62]}>
        <RBox args={[0.24, 0.06, 0.36]} radius={0.025} />
        <meshStandardMaterial color="#6a3a2a" />
      </mesh>
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} position={[x, 0.55, -0.6]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.42, 5]} />
          <meshStandardMaterial color="#3a3a3c" />
        </mesh>
      ))}
    </group>
  )
}

/** รถเก๋ง 4 ประตู (หัวไปทาง +z) ยาว ~4.2 ม. */
export function Sedan({ color = '#f2f2f0' }: { color?: string }) {
  const paint = <meshStandardMaterial color={color} metalness={0.4} roughness={0.25} />
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow>
        <RBox args={[1.72, 0.55, 4.2]} radius={0.18} />
        {paint}
      </mesh>
      <mesh position={[0, 1.02, -0.2]} castShadow>
        <RBox args={[1.56, 0.5, 2.1]} radius={0.2} />
        {paint}
      </mesh>
      <mesh position={[0, 1.04, -0.2]}>
        <RBox args={[1.58, 0.34, 1.95]} radius={0.14} />
        <meshStandardMaterial color="#2a3a48" metalness={0.3} roughness={0.12} />
      </mesh>
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.66, 2.1]}>
          <boxGeometry args={[0.36, 0.12, 0.04]} />
          <meshStandardMaterial color="#fff6d8" emissive="#fff0c0" emissiveIntensity={0.2} />
        </mesh>
      ))}
      {[-0.62, 0.62].map((x) => (
        <mesh key={'t' + x} position={[x, 0.68, -2.1]}>
          <boxGeometry args={[0.32, 0.12, 0.04]} />
          <meshStandardMaterial color="#c8281e" emissive="#801810" emissiveIntensity={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 0.42, 2.12]}>
        <boxGeometry args={[0.9, 0.16, 0.04]} />
        <meshStandardMaterial color="#3a3c40" />
      </mesh>
      {[1.35, -1.35].flatMap((z) => [-0.8, 0.8].map((x) => <Wheel key={x + ':' + z} x={x} y={0.32} z={z} r={0.32} w={0.22} />))}
    </group>
  )
}

/** รถเก๋งแฮทช์แบ็ก 5 ประตูคันเล็ก (หัวไปทาง +z) ยาว ~3.85 ม. · ท้ายสั้นตัด หลังคาดำลอย ไฟหน้าเฉียงกวาด ล้ออัลลอย (ไม่มียี่ห้อ) */
export function Hatchback({ color = '#f4f4f2' }: { color?: string }) {
  const paint = <meshStandardMaterial color={color} metalness={0.35} roughness={0.22} />
  return (
    <group>
      {/* ตัวถังล่างโค้งมน */}
      <mesh position={[0, 0.58, 0.05]} castShadow>
        <RBox args={[1.72, 0.6, 3.8]} radius={0.26} />
        {paint}
      </mesh>
      {/* ฝากระโปรงหน้าลาด */}
      <mesh position={[0, 0.86, 1.2]} rotation={[0.16, 0, 0]} castShadow>
        <RBox args={[1.6, 0.16, 1.3]} radius={0.08} />
        {paint}
      </mesh>
      {/* ห้องโดยสารสูง ท้ายตัด */}
      <mesh position={[0, 1.13, -0.42]} castShadow>
        <RBox args={[1.6, 0.6, 2.2]} radius={0.24} />
        {paint}
      </mesh>
      {/* กระจกรอบคัน + เสาดำ (หลังคาลอย) */}
      <mesh position={[0, 1.16, -0.42]}>
        <RBox args={[1.62, 0.4, 2.05]} radius={0.16} />
        <meshStandardMaterial color="#1e2630" metalness={0.3} roughness={0.1} />
      </mesh>
      <mesh position={[0, 1.44, -0.48]} castShadow>
        <RBox args={[1.5, 0.08, 1.95]} radius={0.04} />
        <meshStandardMaterial color="#141416" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* ไฟหน้าเฉียงกวาดขึ้นข้าง */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.6, 0.8, 1.9]} rotation={[0, s * 0.35, s * -0.12]}>
          <boxGeometry args={[0.42, 0.12, 0.08]} />
          <meshStandardMaterial color="#dfe8f0" emissive="#ffffff" emissiveIntensity={0.2} metalness={0.5} roughness={0.15} />
        </mesh>
      ))}
      {/* กระจังหน้าหกเหลี่ยมดำ + ไฟตัดหมอก */}
      <mesh position={[0, 0.58, 1.95]} rotation={[Math.PI / 2, 0, 0]} scale={[1.6, 1, 0.55]}>
        <cylinderGeometry args={[0.28, 0.28, 0.06, 6]} />
        <meshStandardMaterial color="#1a1a1c" />
      </mesh>
      {[-0.62, 0.62].map((x) => (
        <mesh key={'f' + x} position={[x, 0.42, 1.92]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 10]} />
          <meshStandardMaterial color="#1a1a1c" />
        </mesh>
      ))}
      {/* ไฟท้ายตั้ง */}
      {[-0.7, 0.7].map((x) => (
        <mesh key={'t' + x} position={[x, 0.95, -1.86]}>
          <boxGeometry args={[0.2, 0.3, 0.05]} />
          <meshStandardMaterial color="#c8281e" emissive="#801810" emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* กระจกมองข้างดำ */}
      {[-1, 1].map((s) => (
        <mesh key={'m' + s} position={[s * 0.9, 1.0, 0.55]}>
          <RBox args={[0.14, 0.1, 0.18]} radius={0.03} />
          <meshStandardMaterial color="#141416" />
        </mesh>
      ))}
      {[1.2, -1.15].flatMap((z) => [-0.79, 0.79].map((x) => <Wheel key={x + ':' + z} x={x} y={0.32} z={z} r={0.32} w={0.22} />))}
    </group>
  )
}

/** เก๋งสปอร์ตทรงฟาสต์แบ็ก (หัวไปทาง +z) ยาว ~4.55 ม. เตี้ย กว้าง หลังคาลาดยาวถึงท้าย ไฟหน้า LED เรียวคม กระจังดำกว้าง สปอยเลอร์ท้าย ล้อแม็กดำ (ไม่มียี่ห้อ) */
export function Fastback({ color = '#4f8fd0' }: { color?: string }) {
  const paint = <meshStandardMaterial color={color} metalness={0.5} roughness={0.18} />
  return (
    <group>
      <ContactShadow w={2.1} l={4.9} o={0.36} />
      {/* ตัวถังล่างเตี้ย */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <RBox args={[1.8, 0.5, 4.5]} radius={0.2} />
        {paint}
      </mesh>
      {/* ฝากระโปรงยาวลาดต่ำ */}
      <mesh position={[0, 0.73, 1.45]} rotation={[0.1, 0, 0]} castShadow>
        <RBox args={[1.7, 0.12, 1.45]} radius={0.06} />
        {paint}
      </mesh>
      {/* ห้องโดยสาร + หลังคาลาดยาวแบบฟาสต์แบ็ก */}
      <mesh position={[0, 0.98, -0.15]} castShadow>
        <RBox args={[1.58, 0.44, 1.7]} radius={0.2} />
        {paint}
      </mesh>
      <mesh position={[0, 0.88, -1.35]} rotation={[-0.32, 0, 0]} castShadow>
        <RBox args={[1.56, 0.12, 1.25]} radius={0.06} />
        {paint}
      </mesh>
      {/* กระจกรอบคัน (สีชาดำ) */}
      <mesh position={[0, 1.0, -0.15]}>
        <RBox args={[1.6, 0.3, 1.6]} radius={0.12} />
        <meshStandardMaterial color="#141a22" metalness={0.4} roughness={0.08} />
      </mesh>
      <mesh position={[0, 0.89, -1.28]} rotation={[-0.32, 0, 0]}>
        <RBox args={[1.4, 0.13, 1.0]} radius={0.05} />
        <meshStandardMaterial color="#141a22" metalness={0.4} roughness={0.08} />
      </mesh>
      {/* กระจังหน้าดำกว้าง + ช่องลมกันชน */}
      <mesh position={[0, 0.55, 2.23]}>
        <RBox args={[1.1, 0.2, 0.06]} radius={0.04} />
        <meshStandardMaterial color="#121214" roughness={0.6} />
      </mesh>
      {[-0.65, 0.65].map((x) => (
        <mesh key={'v' + x} position={[x, 0.36, 2.22]}>
          <RBox args={[0.32, 0.12, 0.05]} radius={0.03} />
          <meshStandardMaterial color="#121214" roughness={0.6} />
        </mesh>
      ))}
      {/* ไฟหน้า LED เรียวคม */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.62, 0.68, 2.2]} rotation={[0, s * 0.3, s * 0.08]}>
          <boxGeometry args={[0.46, 0.07, 0.06]} />
          <meshStandardMaterial color="#eaf4ff" emissive="#ffffff" emissiveIntensity={0.3} metalness={0.5} roughness={0.1} />
        </mesh>
      ))}
      {/* ไฟท้ายแถบยาว + สปอยเลอร์ */}
      <mesh position={[0, 0.74, -2.24]}>
        <boxGeometry args={[1.55, 0.07, 0.05]} />
        <meshStandardMaterial color="#c8281e" emissive="#801810" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.83, -2.08]} castShadow>
        <RBox args={[1.5, 0.05, 0.25]} radius={0.02} />
        <meshStandardMaterial color="#121214" roughness={0.4} />
      </mesh>
      {/* สเกิร์ตข้าง + กระจกมองข้างดำ */}
      {[-1, 1].map((s) => (
        <group key={'sk' + s}>
          <mesh position={[s * 0.88, 0.27, 0]}>
            <boxGeometry args={[0.06, 0.08, 2.6]} />
            <meshStandardMaterial color="#121214" roughness={0.6} />
          </mesh>
          <mesh position={[s * 0.92, 0.9, 0.62]}>
            <RBox args={[0.14, 0.09, 0.18]} radius={0.03} />
            <meshStandardMaterial color="#121214" roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* ท่อไอเสียคู่ */}
      {[-0.5, 0.5].map((x) => (
        <mesh key={'e' + x} position={[x, 0.3, -2.24]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.08, 12]} />
          <meshStandardMaterial color="#c8ccd0" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}
      {[1.42, -1.38].flatMap((z) => [-0.82, 0.82].map((x) => <AlloyWheel key={x + ':' + z} x={x} z={z} />))}
    </group>
  )
}

/** ล้อแม็กดำ 5 ก้านคู่ + ยางแก้มเตี้ย + คาลิปเปอร์แดง */
function AlloyWheel({ x, z }: { x: number; z: number }) {
  const R = 0.34
  const s = Math.sign(x)
  return (
    <group position={[x, R, z]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[R, R, 0.24, 24]} />
        <meshStandardMaterial color="#1a1a1c" roughness={0.95} />
      </mesh>
      <mesh position={[s * 0.121, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[R * 0.72, R * 0.72, 0.01, 24]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.3} metalness={0.7} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[s * 0.128, 0, 0]} rotation={[(i / 5) * Math.PI * 2, 0, 0]}>
          <boxGeometry args={[0.012, R * 1.3, 0.05]} />
          <meshStandardMaterial color="#3a3a3e" roughness={0.25} metalness={0.8} />
        </mesh>
      ))}
      <mesh position={[s * 0.1, R * 0.35, -R * 0.3]}>
        <boxGeometry args={[0.04, 0.12, 0.09]} />
        <meshStandardMaterial color="#c0322a" roughness={0.4} />
      </mesh>
    </group>
  )
}
