import { RBox } from './RBox'

/**
 * รถจักรยานยนต์ (หัวไปทาง +z) — 4 แบบ รูปทรงต่างกันจริง ไม่ใช่แค่เปลี่ยนสี
 *  - classic : คลาสสิก ถังกลม เบาะแบน ไฟกลม ซี่ลวด ท่อโครเมียม
 *  - scooter : สกู๊ตเตอร์ออโตเมติก ล้อเล็กแม็ก บังลมหน้า พื้นวางเท้าเรียบ ตัวถังหลังป่อง
 *  - family  : รถครอบครัวแบบบ้านเรา (อันเดอร์โบน) บังลมพลาสติก โครงเหล็กโค้ง ตะกร้าหน้า ตะแกรงท้าย
 *  - sport   : สปอร์ต แฟริ่งหน้า ไฟคู่ ชิลด์ใส ถังเหลี่ยม เบาะสองชั้น ท้ายเชิด ดิสก์เบรกหน้า-หลัง
 * ทุกคัน: ยางแตะพื้นพอดี (ไม่ลอย/ไม่จม) · เงาทาบพื้นใต้รถ · โลหะ/พลาสติก/ยาง/เบาะ/กระจก แยกวัสดุชัด
 * lean = เอียงพิงขาตั้งข้าง (หมุนรอบจุดที่ล้อแตะพื้น)
 */
export type MotoKind = 'classic' | 'scooter' | 'family' | 'sport'

const RUBBER = '#1d1d1f'
const CHROME = '#d4d8dc'
const STEEL = '#8e949a'
const BLACK = '#232326'

const Rubber = () => <meshStandardMaterial color={RUBBER} roughness={0.95} metalness={0} />
const Chrome = () => <meshStandardMaterial color={CHROME} roughness={0.18} metalness={0.85} />
const Steel = () => <meshStandardMaterial color={STEEL} roughness={0.4} metalness={0.6} />
const Plastic = ({ c }: { c: string }) => <meshStandardMaterial color={c} roughness={0.38} metalness={0.05} />
const Paint = ({ c }: { c: string }) => <meshStandardMaterial color={c} roughness={0.22} metalness={0.35} />
const Seat = ({ c = '#1a1a1c' }: { c?: string }) => <meshStandardMaterial color={c} roughness={0.75} metalness={0} />

/** เงาทาบพื้นนุ่ม ๆ ใต้รถ (ช่วยให้รถดูวางอยู่บนพื้นจริง) */
export function ContactShadow({ w, l, o = 0.32 }: { w: number; l: number; o?: number }) {
  return (
    <group>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[w, l, 1]} renderOrder={1}>
        <circleGeometry args={[0.5, 28]} />
        <meshBasicMaterial color="#000000" transparent opacity={o * 0.55} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.013, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[w * 0.6, l * 0.8, 1]} renderOrder={2}>
        <circleGeometry args={[0.5, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={o * 0.6} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** ล้อ: ยาง (หนา มีดอก) + ขอบล้อ + ซี่ลวด/ก้านแม็ก + ดุม + จานดิสก์/ดรัมเบรก · วางให้ยางแตะพื้นพอดี */
function Wheel({ z, R = 0.3, tube = 0.065, alloy = false, disc = false, rim = CHROME, spokes = 5 }: { z: number; R?: number; tube?: number; alloy?: boolean; disc?: boolean; rim?: string; spokes?: number }) {
  const r = R - tube // รัศมีกลางยาง
  return (
    <group position={[0, R, z]}>
      {/* ยาง */}
      <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[r, tube, 12, 30]} />
        <Rubber />
      </mesh>
      {/* ขอบล้อ */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[r - tube * 0.85, 0.018, 8, 30]} />
        <meshStandardMaterial color={rim} roughness={alloy ? 0.3 : 0.18} metalness={0.8} />
      </mesh>
      {/* ก้านล้อ */}
      {alloy
        ? Array.from({ length: spokes }, (_, i) => (
            <mesh key={'s' + i} rotation={[(i / spokes) * Math.PI * 2, 0, 0]} position={[0, 0, 0]}>
              <boxGeometry args={[0.03, r * 1.7, 0.035]} />
              <meshStandardMaterial color={rim} roughness={0.3} metalness={0.75} />
            </mesh>
          ))
        : Array.from({ length: 9 }, (_, i) => (
            <mesh key={'s' + i} rotation={[(i / 9) * Math.PI + 0.1, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.005, (r - tube * 0.85) * 2, 4]} />
              <Chrome />
            </mesh>
          ))}
      {/* ดุมล้อ */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 0.13, 14]} />
        <Steel />
      </mesh>
      {/* เบรก: จานดิสก์ + คาลิปเปอร์ หรือ ดรัมเบรก */}
      {disc ? (
        <group position={[0.075, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[r * 0.62, r * 0.62, 0.008, 24]} />
            <meshStandardMaterial color="#b8bcc0" roughness={0.25} metalness={0.9} />
          </mesh>
          <mesh position={[0.012, r * 0.45, -r * 0.3]}>
            <RBox args={[0.035, 0.09, 0.06]} radius={0.012} />
            <meshStandardMaterial color="#c0322a" roughness={0.4} metalness={0.3} />
          </mesh>
        </group>
      ) : (
        <mesh position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
          <Steel />
        </mesh>
      )}
    </group>
  )
}

/** แฮนด์ + มือเบรก + ปลอกแฮนด์ + กระจกมองข้าง */
function Handlebar({ y, z, w = 0.62, mirrors = true }: { y: number; z: number; w?: number; mirrors?: boolean }) {
  return (
    <group position={[0, y, z]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.014, 0.014, w, 8]} />
        <Chrome />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[(s * w) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.11, 8]} />
            <Rubber />
          </mesh>
          {/* มือเบรก/คลัตช์ */}
          <mesh position={[s * (w / 2 - 0.06), -0.015, 0.06]} rotation={[0, s * 0.25, 0]}>
            <boxGeometry args={[0.12, 0.012, 0.02]} />
            <Steel />
          </mesh>
          {mirrors && (
            <group position={[s * (w / 2 - 0.1), 0, 0]}>
              <mesh position={[s * 0.04, 0.14, 0]} rotation={[0, 0, -s * 0.35]}>
                <cylinderGeometry args={[0.007, 0.007, 0.28, 5]} />
                <meshStandardMaterial color={BLACK} roughness={0.5} />
              </mesh>
              <mesh position={[s * 0.09, 0.28, 0]} rotation={[0.1, 0, 0]} scale={[1.3, 0.8, 0.4]}>
                <sphereGeometry args={[0.055, 12, 8]} />
                <meshStandardMaterial color={BLACK} roughness={0.4} />
              </mesh>
              <mesh position={[s * 0.09, 0.28, -0.022]} rotation={[0, Math.PI, 0]} scale={[1.2, 0.72, 1]}>
                <circleGeometry args={[0.05, 14]} />
                <meshStandardMaterial color="#cfe0ea" roughness={0.05} metalness={0.9} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  )
}

/** ไฟหน้า (เลนส์ใส + โคมโครเมียม) */
function HeadLamp({ r = 0.08 }: { r?: number }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r * 1.1, r, r * 1.2, 18]} />
        <Chrome />
      </mesh>
      <mesh position={[0, 0, r * 0.62]} scale={[1, 1, 0.45]}>
        <sphereGeometry args={[r, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#fff8e0" emissive="#fff0c0" emissiveIntensity={0.35} transparent opacity={0.92} roughness={0.05} />
      </mesh>
    </group>
  )
}

/** ไฟท้าย + ไฟเลี้ยวส้ม */
function TailLight({ y, z, w = 0.12 }: { y: number; z: number; w?: number }) {
  return (
    <group position={[0, y, z]}>
      <mesh>
        <RBox args={[w, 0.06, 0.05]} radius={0.015} />
        <meshStandardMaterial color="#d8281c" emissive="#a01810" emissiveIntensity={0.35} roughness={0.15} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 + 0.08), 0.02, 0.02]}>
          <RBox args={[0.05, 0.035, 0.05]} radius={0.012} />
          <meshStandardMaterial color="#f0a020" emissive="#c07010" emissiveIntensity={0.25} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

/** โช้คหน้าคู่ */
function Fork({ z, R, top, rake = 0.32, color = CHROME }: { z: number; R: number; top: number; rake?: number; color?: string }) {
  const len = (top - R) / Math.cos(rake)
  return (
    <>
      {[-0.08, 0.08].map((x) => (
        <group key={x} position={[x, (R + top) / 2, z + (Math.tan(rake) * (top - R)) / 2]} rotation={[-rake, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.022, 0.022, len, 10]} />
            <meshStandardMaterial color={color} roughness={0.2} metalness={0.85} />
          </mesh>
          <mesh position={[0, -len * 0.25, 0]}>
            <cylinderGeometry args={[0.03, 0.03, len * 0.45, 10]} />
            <Steel />
          </mesh>
        </group>
      ))}
    </>
  )
}

/** โช้คหลัง (สปริง) */
function RearShock({ x, z, y0, y1 }: { x: number; z: number; y0: number; y1: number }) {
  return (
    <group position={[x, (y0 + y1) / 2, z]} rotation={[0.35, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.018, 0.018, y1 - y0, 8]} />
        <Chrome />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0, -(y1 - y0) / 2 + 0.06 + i * ((y1 - y0 - 0.12) / 5), 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.03, 0.007, 6, 12]} />
          <meshStandardMaterial color="#c8322a" roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

/** ขาตั้งข้าง (ด้านซ้าย −x) แตะพื้น */
function SideStand() {
  return (
    <mesh position={[-0.13, 0.13, -0.05]} rotation={[0.25, 0, -0.45]}>
      <cylinderGeometry args={[0.012, 0.014, 0.32, 6]} />
      <Steel />
    </mesh>
  )
}

/* ───────── แต่ละแบบ ───────── */

function Classic({ color }: { color: string }) {
  const R = 0.32
  return (
    <group>
      <Wheel z={0.64} R={R} disc />
      <Wheel z={-0.62} R={R} />
      <Fork z={0.64} R={R} top={0.95} />
      <RearShock x={-0.12} z={-0.5} y0={0.35} y1={0.72} />
      <RearShock x={0.12} z={-0.5} y0={0.35} y1={0.72} />
      {/* โครงเหล็ก + สวิงอาร์ม */}
      <mesh position={[0, 0.66, 0.15]} rotation={[0.55, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
        <meshStandardMaterial color={BLACK} roughness={0.5} metalness={0.4} />
      </mesh>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, R, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.62, 6]} />
          <meshStandardMaterial color={BLACK} roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      {/* เครื่องยนต์: ฝาสูบครีบระบายความร้อน */}
      <mesh position={[0, 0.42, 0.06]} castShadow>
        <RBox args={[0.26, 0.24, 0.38]} radius={0.06} />
        <Steel />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.58 + i * 0.035, 0.18]}>
          <boxGeometry args={[0.24, 0.015, 0.16]} />
          <meshStandardMaterial color="#a0a6ac" roughness={0.35} metalness={0.7} />
        </mesh>
      ))}
      {/* ถังน้ำมันกลม + แถบโครเมียม */}
      <mesh position={[0, 0.82, 0.2]} scale={[0.85, 0.62, 1.3]} castShadow>
        <sphereGeometry args={[0.2, 22, 14]} />
        <Paint c={color} />
      </mesh>
      <mesh position={[0, 0.83, 0.2]} scale={[0.87, 0.2, 1.31]}>
        <sphereGeometry args={[0.2, 22, 8]} />
        <Chrome />
      </mesh>
      {/* เบาะแบนหนา + ขอบ */}
      <mesh position={[0, 0.8, -0.25]} castShadow>
        <RBox args={[0.26, 0.1, 0.56]} radius={0.045} />
        <Seat c="#2a2420" />
      </mesh>
      {/* บังโคลนหน้า/หลัง */}
      <mesh position={[0, R + 0.05, 0.64]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[R + 0.03, 0.05, 6, 16, Math.PI * 0.7]} />
        <Paint c={color} />
      </mesh>
      <mesh position={[0, R + 0.05, -0.62]} rotation={[Math.PI, Math.PI / 2, 0]}>
        <torusGeometry args={[R + 0.03, 0.055, 6, 16, Math.PI * 0.75]} />
        <Paint c={color} />
      </mesh>
      <TailLight y={0.76} z={-0.86} />
      {/* ท่อไอเสียโครเมียมยาว */}
      <mesh position={[0.17, 0.3, -0.35]} rotation={[Math.PI / 2 - 0.08, 0, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.05, 0.8, 14]} />
        <Chrome />
      </mesh>
      <mesh position={[0.14, 0.36, 0.12]} rotation={[0.9, 0, 0.15]}>
        <cylinderGeometry args={[0.022, 0.022, 0.4, 8]} />
        <Chrome />
      </mesh>
      <group position={[0, 0.98, 0.78]}>
        <HeadLamp r={0.085} />
      </group>
      <Handlebar y={1.08} z={0.58} />
      <SideStand />
    </group>
  )
}

function Scooter({ color }: { color: string }) {
  const R = 0.25
  return (
    <group>
      <Wheel z={0.6} R={R} tube={0.07} alloy disc rim="#2a2a2e" spokes={5} />
      <Wheel z={-0.55} R={R} tube={0.07} alloy rim="#2a2a2e" spokes={5} />
      <Fork z={0.6} R={R} top={0.72} rake={0.4} color="#2a2a2e" />
      {/* พื้นวางเท้าเรียบ */}
      <mesh position={[0, 0.3, 0.12]} castShadow>
        <RBox args={[0.34, 0.08, 0.6]} radius={0.03} />
        <Plastic c="#2a2a2e" />
      </mesh>
      {/* บังลมหน้าโค้ง */}
      <mesh position={[0, 0.66, 0.5]} rotation={[-0.3, 0, 0]} castShadow>
        <RBox args={[0.42, 0.72, 0.14]} radius={0.07} />
        <Paint c={color} />
      </mesh>
      {/* ตัวถังหลังป่อง (ใต้เบาะเก็บของ) */}
      <mesh position={[0, 0.55, -0.32]} castShadow>
        <RBox args={[0.4, 0.42, 0.78]} radius={0.16} />
        <Paint c={color} />
      </mesh>
      <mesh position={[0, 0.42, -0.32]}>
        <RBox args={[0.42, 0.06, 0.8]} radius={0.03} />
        <Plastic c="#2a2a2e" />
      </mesh>
      {/* เบาะยาวสองตอน */}
      <mesh position={[0, 0.8, -0.3]} castShadow>
        <RBox args={[0.3, 0.1, 0.68]} radius={0.05} />
        <Seat />
      </mesh>
      {/* มือจับท้าย */}
      <mesh position={[0, 0.8, -0.72]}>
        <RBox args={[0.32, 0.04, 0.1]} radius={0.02} />
        <Steel />
      </mesh>
      <TailLight y={0.66} z={-0.73} w={0.16} />
      {/* ครอบแฮนด์ + ไฟหน้าในตัว */}
      <mesh position={[0, 1.02, 0.56]} castShadow>
        <RBox args={[0.42, 0.13, 0.2]} radius={0.06} />
        <Paint c={color} />
      </mesh>
      <mesh position={[0, 1.0, 0.67]}>
        <RBox args={[0.2, 0.06, 0.03]} radius={0.015} />
        <meshStandardMaterial color="#fff8e0" emissive="#fff0c0" emissiveIntensity={0.35} roughness={0.05} />
      </mesh>
      <Handlebar y={1.05} z={0.52} w={0.58} />
      {/* ห้องเครื่อง + ท่อสั้นดำปลายโครเมียม */}
      <mesh position={[0.1, 0.3, -0.45]} castShadow>
        <RBox args={[0.14, 0.16, 0.36]} radius={0.04} />
        <Steel />
      </mesh>
      <mesh position={[0.18, 0.3, -0.62]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 12]} />
        <meshStandardMaterial color={BLACK} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0.18, 0.3, -0.78]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.04, 12]} />
        <Chrome />
      </mesh>
      <SideStand />
    </group>
  )
}

function Family({ color }: { color: string }) {
  const R = 0.3
  return (
    <group>
      <Wheel z={0.62} R={R} tube={0.055} />
      <Wheel z={-0.6} R={R} tube={0.06} />
      <Fork z={0.62} R={R} top={0.9} rake={0.33} />
      <RearShock x={-0.12} z={-0.46} y0={0.33} y1={0.7} />
      <RearShock x={0.12} z={-0.46} y0={0.33} y1={0.7} />
      {/* โครงอันเดอร์โบนโค้งต่ำ (ก้าวข้ามง่าย) */}
      <mesh position={[0, 0.58, 0.1]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.32, 0.03, 8, 16, Math.PI * 0.55]} />
        <meshStandardMaterial color={BLACK} roughness={0.5} metalness={0.4} />
      </mesh>
      {/* บังลมขาพลาสติก */}
      <mesh position={[0, 0.6, 0.42]} rotation={[-0.25, 0, 0]} castShadow>
        <RBox args={[0.46, 0.5, 0.08]} radius={0.05} />
        <Plastic c={color} />
      </mesh>
      {/* ครอบตัวกลาง */}
      <mesh position={[0, 0.66, -0.05]} castShadow>
        <RBox args={[0.24, 0.16, 0.42]} radius={0.06} />
        <Plastic c={color} />
      </mesh>
      {/* เครื่องยนต์เล็กกลางรถ */}
      <mesh position={[0, 0.34, 0.05]} castShadow>
        <RBox args={[0.22, 0.2, 0.3]} radius={0.05} />
        <Steel />
      </mesh>
      {/* ฝาข้างหลัง + เบาะยาว */}
      <mesh position={[0, 0.66, -0.36]} castShadow>
        <RBox args={[0.3, 0.2, 0.5]} radius={0.07} />
        <Plastic c={color} />
      </mesh>
      <mesh position={[0, 0.8, -0.3]} castShadow>
        <RBox args={[0.28, 0.1, 0.64]} radius={0.05} />
        <Seat />
      </mesh>
      {/* ตะแกรงท้าย (ไว้ซ้อนของ) */}
      <mesh position={[0, 0.82, -0.72]}>
        <RBox args={[0.26, 0.025, 0.22]} radius={0.01} />
        <Chrome />
      </mesh>
      <TailLight y={0.72} z={-0.78} />
      {/* ตะกร้าหน้า (ลวด) */}
      <group position={[0, 0.98, 0.72]}>
        <mesh>
          <boxGeometry args={[0.36, 0.22, 0.26]} />
          <meshStandardMaterial color="#c8ccd0" roughness={0.3} metalness={0.7} wireframe />
        </mesh>
        <mesh position={[0, -0.11, 0]}>
          <boxGeometry args={[0.36, 0.01, 0.26]} />
          <Steel />
        </mesh>
      </group>
      {/* ครอบไฟหน้า + แฮนด์ */}
      <mesh position={[0, 1.08, 0.56]} castShadow>
        <RBox args={[0.36, 0.12, 0.18]} radius={0.05} />
        <Plastic c={color} />
      </mesh>
      <group position={[0, 1.08, 0.66]} scale={[1.3, 0.7, 1]}>
        <HeadLamp r={0.06} />
      </group>
      <Handlebar y={1.12} z={0.5} w={0.6} />
      {/* ท่อไอเสียทรงเรียว */}
      <mesh position={[0.16, 0.28, -0.32]} rotation={[Math.PI / 2 - 0.12, 0, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 0.62, 12]} />
        <Chrome />
      </mesh>
      <mesh position={[0.17, 0.33, -0.3]} rotation={[Math.PI / 2 - 0.12, 0, 0]}>
        <boxGeometry args={[0.02, 0.34, 0.06]} />
        <meshStandardMaterial color={BLACK} roughness={0.5} />
      </mesh>
      <SideStand />
    </group>
  )
}

function Sport({ color }: { color: string }) {
  const R = 0.31
  return (
    <group>
      <Wheel z={0.68} R={R} tube={0.075} alloy disc rim="#1e1e20" spokes={6} />
      <Wheel z={-0.64} R={R} tube={0.085} alloy disc rim="#1e1e20" spokes={6} />
      <Fork z={0.68} R={R} top={0.98} rake={0.42} color="#c8a040" />
      {/* สวิงอาร์มอะลูมิเนียม */}
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} position={[x, R + 0.04, -0.32]} rotation={[Math.PI / 2 + 0.08, 0, 0]}>
          <boxGeometry args={[0.04, 0.62, 0.07]} />
          <meshStandardMaterial color="#9aa0a6" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}
      {/* แฟริ่งข้าง (ตัวถังเหลี่ยมหักมุม) */}
      <mesh position={[0, 0.6, 0.22]} rotation={[-0.15, 0, 0]} castShadow>
        <RBox args={[0.38, 0.4, 0.82]} radius={0.08} />
        <Paint c={color} />
      </mesh>
      <mesh position={[0, 0.48, 0.22]} rotation={[-0.15, 0, 0]}>
        <RBox args={[0.4, 0.06, 0.7]} radius={0.02} />
        <Plastic c="#1e1e20" />
      </mesh>
      {/* หน้ากากแฟริ่ง + ไฟคู่ + ชิลด์ใส */}
      <mesh position={[0, 0.88, 0.66]} rotation={[0.55, 0, 0]} castShadow>
        <RBox args={[0.36, 0.3, 0.26]} radius={0.08} />
        <Paint c={color} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.08, 0.86, 0.8]} rotation={[0.5, s * 0.25, 0]}>
          <RBox args={[0.1, 0.05, 0.03]} radius={0.012} />
          <meshStandardMaterial color="#eaf4ff" emissive="#ffffff" emissiveIntensity={0.35} roughness={0.05} />
        </mesh>
      ))}
      <mesh position={[0, 1.06, 0.6]} rotation={[-0.7, 0, 0]}>
        <RBox args={[0.28, 0.26, 0.015]} radius={0.01} />
        <meshStandardMaterial color="#7a9ab0" transparent opacity={0.45} roughness={0.05} metalness={0.2} />
      </mesh>
      {/* ถังน้ำมันเหลี่ยม */}
      <mesh position={[0, 0.9, 0.18]} rotation={[-0.12, 0, 0]} castShadow>
        <RBox args={[0.32, 0.2, 0.42]} radius={0.08} />
        <Paint c={color} />
      </mesh>
      {/* เบาะสองชั้น + ท้ายเชิด */}
      <mesh position={[0, 0.88, -0.18]} castShadow>
        <RBox args={[0.26, 0.08, 0.34]} radius={0.04} />
        <Seat />
      </mesh>
      <mesh position={[0, 0.96, -0.5]} rotation={[0.25, 0, 0]} castShadow>
        <RBox args={[0.22, 0.12, 0.4]} radius={0.05} />
        <Paint c={color} />
      </mesh>
      <mesh position={[0, 1.0, -0.47]} rotation={[0.25, 0, 0]}>
        <RBox args={[0.18, 0.04, 0.2]} radius={0.02} />
        <Seat />
      </mesh>
      <TailLight y={0.96} z={-0.72} w={0.1} />
      {/* ท่อใต้ท้อง + ปลายท่อข้าง */}
      <mesh position={[0, 0.25, 0.05]} castShadow>
        <RBox args={[0.22, 0.12, 0.4]} radius={0.05} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0.16, 0.5, -0.5]} rotation={[Math.PI / 2 - 0.35, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.32, 6]} />
        <meshStandardMaterial color="#b8bcc0" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* แฮนด์จับโช้ค (ต่ำ) */}
      <Handlebar y={0.98} z={0.5} w={0.5} />
      {/* ที่พักเท้า */}
      {[-1, 1].map((s) => (
        <mesh key={'p' + s} position={[s * 0.2, 0.42, -0.12]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.1, 6]} />
          <Steel />
        </mesh>
      ))}
      <SideStand />
    </group>
  )
}

export function Motorcycle({ color = '#2f5fa8', lean = 0.08, kind = 'classic' }: { color?: string; lean?: number; kind?: MotoKind }) {
  return (
    <group>
      <ContactShadow w={0.62} l={1.9} />
      {/* จอดเอียงพิงขาตั้งข้าง (ขาตั้งด้านซ้าย −x) หมุนรอบจุดที่ล้อแตะพื้น */}
      <group rotation={[0, 0, -lean]}>
        {kind === 'scooter' ? <Scooter color={color} /> : kind === 'family' ? <Family color={color} /> : kind === 'sport' ? <Sport color={color} /> : <Classic color={color} />}
      </group>
    </group>
  )
}
