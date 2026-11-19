import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import { WaterJar } from './models/WaterJar'

/**
 * ห้องน้ำนอกบ้าน (ตามภาพอ้างอิงของผู้สร้าง 19 พ.ย.) — ขนาดพอ ๆ กับคอกควาย
 * - ห้องที่ 1 (ซ้าย): ห้องส้วม ชักโครกสีขาว สายฉีดชำระ
 * - ตรงกลาง: อ่างล้างหน้าปูนเปลือย อ่างเซรามิกขาว ก๊อกน้ำ กระจกเงา
 * - ห้องที่ 2 (ขวา): ห้องอาบน้ำ โอ่งดินเผามีฝาไม้ ฝักบัวสีดำ ชั้นวางไม้ ขันน้ำ
 * ผนังด้านข้าง/หลังเป็นอิฐบล็อกเปลือย · ผนังหน้าเป็นสังกะสีลอนในกรอบไม้ · ประตูไม้กรุสังกะสีเปิดอ้าออกด้านนอก
 * หลังคาสังกะสีลอน มีหลอดไฟสีเหลือง (ไล่ยุง/แมลง) · ชานหน้าพื้นปูน
 * แกน: หน้า (ประตู) = +z · กว้าง 6.4 (x) × ลึก 5 (z)
 */
const W = 6.4
const BACK = -2.5
const FRONT = 0.7 // แนวผนังหน้า (ประตู)
const PORCH = 2.5 // ขอบชานหน้า
const H = 2.4
const ROOM: [number, number][] = [
  [-3.2, -0.6],
  [0.6, 3.2],
]

function useTex(draw: (g: CanvasRenderingContext2D) => void, rx: number, ry: number) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    draw(c.getContext('2d')!)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(rx, ry)
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rx, ry])
}

export function Bathhouse({ x, z, rot = 0, inside = false }: { x: number; z: number; rot?: number; inside?: boolean }) {
  // อิฐบล็อกเปลือย (ก้อนใหญ่ เหลื่อมแถว)
  const block = useTex((g) => {
    g.fillStyle = '#a8a59c'
    g.fillRect(0, 0, 128, 128)
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 3; c++) {
        const off = r % 2 ? 21 : 0
        g.fillStyle = (r + c) % 3 === 0 ? '#b2afa6' : (r + c) % 3 === 1 ? '#a19e95' : '#aaa79e'
        g.fillRect(c * 43 + off - 43 + 2, r * 32 + 2, 39, 28)
        g.fillRect(c * 43 + off + 2, r * 32 + 2, 39, 28)
      }
  }, 3, 2)
  // สังกะสีลอน
  const zinc = useTex((g) => {
    for (let i = 0; i < 16; i++) {
      const grd = g.createLinearGradient(i * 8, 0, i * 8 + 8, 0)
      grd.addColorStop(0, '#8e9498')
      grd.addColorStop(0.5, '#d4d8da')
      grd.addColorStop(1, '#7e8488')
      g.fillStyle = grd
      g.fillRect(i * 8, 0, 8, 128)
    }
  }, 2, 1)
  const cz = (BACK + FRONT) / 2
  const D = FRONT - BACK
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* พื้นปูนทั้งหลัง + ชานหน้า */}
      <mesh position={[0, 0.06, (BACK + PORCH) / 2]} receiveShadow>
        <boxGeometry args={[W + 0.3, 0.12, PORCH - BACK + 0.2]} />
        <meshStandardMaterial color="#b9b6ae" roughness={1} />
      </mesh>
      {/* ผนังหลัง + ผนังข้าง 2 ด้าน + ผนังกั้นห้อง (อิฐบล็อก) */}
      <BlockWall tex={block} pos={[0, 0, BACK]} size={[W, H, 0.14]} />
      <BlockWall tex={block} pos={[-W / 2, 0, cz]} size={[0.14, H, D]} />
      <BlockWall tex={block} pos={[W / 2, 0, cz]} size={[0.14, H, D]} />
      <BlockWall tex={block} pos={[-0.6, 0, cz]} size={[0.12, H, D]} />
      <BlockWall tex={block} pos={[0.6, 0, cz]} size={[0.12, H, D]} />
      {/* ผนังหน้าแต่ละห้อง: สังกะสีในกรอบไม้ + ช่องประตู */}
      {ROOM.map(([a, b], i) => (
        <group key={i}>
          <FrontWall zinc={zinc} a={a} b={b} hingeLeft={i === 0} leaf={!inside} />
        </group>
      ))}
      {/* หลังคาสังกะสีลาดไปด้านหลัง + คานไม้ (ฉากภายในซ่อนหลังคา ให้กล้องมองลงมาได้) */}
      <mesh visible={!inside} position={[0, H + 0.28, (BACK + PORCH) / 2]} rotation={[-0.07, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.6, 0.04, PORCH - BACK + 0.5]} />
        <meshStandardMaterial map={zinc} metalness={0.4} roughness={0.45} side={2} />
      </mesh>
      {[BACK + 0.1, FRONT, PORCH - 0.1].map((bz) => (
        <mesh key={bz} position={[0, H + 0.12, bz]}>
          <boxGeometry args={[W + 0.2, 0.12, 0.1]} />
          <meshStandardMaterial color="#8a5a34" />
        </mesh>
      ))}
      {/* เสาไม้รับชายคาหน้า */}
      {[-W / 2, W / 2].map((px) => (
        <mesh key={px} position={[px, (H + 0.2) / 2, PORCH - 0.1]} castShadow>
          <boxGeometry args={[0.12, H + 0.2, 0.12]} />
          <meshStandardMaterial color="#7a4e2e" />
        </mesh>
      ))}
      {/* ---- ห้อง 1: ชักโครก ---- */}
      <group position={[(ROOM[0][0] + ROOM[0][1]) / 2, 0, BACK + 0.55]}>
        <Toilet />
      </group>
      {/* ---- ตรงกลาง: อ่างล้างหน้า + กระจก ---- */}
      <group position={[0, 0, BACK + 0.35]}>
        <WashBasin />
      </group>
      {/* ---- ห้อง 2: ห้องอาบน้ำ ---- */}
      <group position={[(ROOM[1][0] + ROOM[1][1]) / 2, 0, cz]}>
        <ShowerRoom />
      </group>
      {/* หลอดไฟสีเหลือง (ไล่ยุง/แมลง) ใต้ชายคาหน้า + กลางห้องละดวง */}
      {[
        [0, PORCH - 0.6],
        [-1.9, cz],
        [1.9, cz],
      ].map(([lx, lz], i) => (
        <YellowBulb key={i} pos={[lx, H + 0.05, lz]} glow={i === 0} />
      ))}
    </group>
  )
}

function BlockWall({ tex, pos, size }: { tex: Texture; pos: [number, number, number]; size: [number, number, number] }) {
  return (
    <mesh position={[pos[0], pos[1] + size[1] / 2 + 0.12, pos[2]]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  )
}

/** ผนังหน้าห้อง: สังกะสีลอนในกรอบไม้ + ประตูไม้กรุสังกะสี เปิดอ้าออกด้านนอก (+z) */
function FrontWall({ zinc, a, b, hingeLeft, leaf = true }: { zinc: Texture; a: number; b: number; hingeLeft: boolean; leaf?: boolean }) {
  const doorW = 0.85
  // ช่องประตูชิดผนังกั้นกลาง (ฝั่งอ่างล้างหน้า)
  const d0 = hingeLeft ? b - 0.15 - doorW : a + 0.15
  const d1 = d0 + doorW
  const panels: [number, number][] = [
    [a, d0],
    [d1, b],
  ].filter(([p, q]) => q - p > 0.05) as [number, number][]
  const wood = '#9a5e34'
  const hinge = hingeLeft ? d0 : d1
  const sign = hingeLeft ? 1 : -1
  return (
    <group position={[0, 0.12, FRONT]}>
      {panels.map(([p, q], i) => (
        <mesh key={i} position={[(p + q) / 2, H / 2, 0]} castShadow>
          <boxGeometry args={[q - p, H, 0.04]} />
          <meshStandardMaterial map={zinc} metalness={0.4} roughness={0.45} />
        </mesh>
      ))}
      {/* เหนือประตู */}
      <mesh position={[(d0 + d1) / 2, (H + 2.0) / 2, 0]}>
        <boxGeometry args={[doorW, H - 2.0, 0.04]} />
        <meshStandardMaterial map={zinc} metalness={0.4} roughness={0.45} />
      </mesh>
      {/* กรอบไม้: วงกบประตู + คานกลาง */}
      {[d0, d1].map((px) => (
        <mesh key={px} position={[px, H / 2, 0.03]} castShadow>
          <boxGeometry args={[0.09, H, 0.09]} />
          <meshStandardMaterial color={wood} />
        </mesh>
      ))}
      <mesh position={[(d0 + d1) / 2, 2.0, 0.03]}>
        <boxGeometry args={[doorW + 0.1, 0.09, 0.09]} />
        <meshStandardMaterial color={wood} />
      </mesh>
      <mesh position={[(a + b) / 2, 1.1, 0.03]}>
        <boxGeometry args={[b - a, 0.07, 0.06]} />
        <meshStandardMaterial color={wood} />
      </mesh>
      {/* บานประตู: เปิดอ้าออกด้านนอก ~70° (ฉากภายใน: ใช้ประตูเปิด–ปิดได้แทน) */}
      <group visible={leaf} position={[hinge, 0, 0.05]} rotation={[0, sign * 1.2, 0]}>
        <group position={[(sign * doorW) / 2, 0, 0]}>
          <mesh position={[0, 1.0, 0]} castShadow>
            <boxGeometry args={[doorW - 0.04, 1.96, 0.035]} />
            <meshStandardMaterial map={zinc} metalness={0.4} roughness={0.45} />
          </mesh>
          {[0.15, 1.0, 1.85].map((y) => (
            <mesh key={y} position={[0, y, 0.03]}>
              <boxGeometry args={[doorW - 0.02, 0.08, 0.04]} />
              <meshStandardMaterial color={wood} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[(s * (doorW - 0.06)) / 2, 1.0, 0.03]}>
              <boxGeometry args={[0.07, 1.96, 0.04]} />
              <meshStandardMaterial color={wood} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

function Toilet() {
  const white = <meshStandardMaterial color="#f4f4f2" roughness={0.25} />
  return (
    <group>
      {/* ถังพักน้ำชิดผนัง */}
      <mesh position={[0, 0.72, -0.05]} castShadow>
        <boxGeometry args={[0.46, 0.4, 0.2]} />
        {white}
      </mesh>
      <mesh position={[0, 0.94, -0.05]}>
        <boxGeometry args={[0.5, 0.04, 0.22]} />
        {white}
      </mesh>
      {/* ฐาน + โถ + ฝารองนั่ง */}
      <mesh position={[0, 0.3, 0.3]} castShadow>
        <cylinderGeometry args={[0.15, 0.13, 0.36, 16]} />
        {white}
      </mesh>
      <mesh position={[0, 0.45, 0.33]} scale={[1, 1, 1.25]} castShadow>
        <cylinderGeometry args={[0.2, 0.17, 0.14, 20]} />
        {white}
      </mesh>
      <mesh position={[0, 0.53, 0.33]} scale={[1, 1, 1.25]}>
        <torusGeometry args={[0.17, 0.035, 8, 20]} />
        <meshStandardMaterial color="#ececea" roughness={0.3} />
      </mesh>
      {/* สายฉีดชำระ */}
      <mesh position={[0.32, 0.55, 0]}>
        <boxGeometry args={[0.05, 0.12, 0.04]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0.32, 0.35, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.012, 6, 16]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {/* ถังขยะเล็ก */}
      <mesh position={[-0.45, 0.32, 0.2]}>
        <cylinderGeometry args={[0.12, 0.1, 0.28, 12]} />
        <meshStandardMaterial color="#5a8ab8" roughness={0.6} />
      </mesh>
    </group>
  )
}

function WashBasin() {
  return (
    <group>
      {/* เคาน์เตอร์ปูนเปลือย */}
      <mesh position={[0, 0.5, 0.15]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.76, 0.5]} />
        <meshStandardMaterial color="#9c9a92" roughness={0.9} />
      </mesh>
      {/* อ่างเซรามิกขาว (วางบนเคาน์เตอร์) */}
      <mesh position={[0, 0.96, 0.17]}>
        <cylinderGeometry args={[0.22, 0.15, 0.14, 20]} />
        <meshStandardMaterial color="#f6f6f4" roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.035, 0.17]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.18, 20]} />
        <meshStandardMaterial color="#dfe4e6" roughness={0.1} />
      </mesh>
      {/* ก๊อกน้ำ */}
      <mesh position={[0, 1.08, -0.04]}>
        <cylinderGeometry args={[0.02, 0.02, 0.22, 8]} />
        <meshStandardMaterial color="#c8ccd0" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.18, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.14, 8]} />
        <meshStandardMaterial color="#c8ccd0" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* กระจกเงาบนผนัง + กรอบไม้ */}
      <mesh position={[0, 1.65, -0.07]}>
        <boxGeometry args={[0.6, 0.75, 0.03]} />
        <meshStandardMaterial color="#8a5a34" />
      </mesh>
      <mesh position={[0, 1.65, -0.05]}>
        <planeGeometry args={[0.5, 0.65]} />
        <meshStandardMaterial color="#c8dce4" metalness={0.6} roughness={0.05} />
      </mesh>
      {/* แก้วแปรงฟัน + สบู่ */}
      <mesh position={[0.36, 0.95, 0.25]}>
        <cylinderGeometry args={[0.04, 0.035, 0.1, 10]} />
        <meshStandardMaterial color="#e86a8a" />
      </mesh>
      <mesh position={[-0.36, 0.9, 0.25]}>
        <boxGeometry args={[0.1, 0.04, 0.07]} />
        <meshStandardMaterial color="#f0e090" />
      </mesh>
    </group>
  )
}

function ShowerRoom() {
  return (
    <group>
      {/* โอ่งดินเผามีฝาไม้ (มุมซ้ายหลัง) */}
      <group position={[-0.75, 0.12, -1.05]} scale={0.6}>
        <WaterJar kind="rain" h={1.4} r={0.68} />
      </group>
      <mesh position={[-0.75, 0.98, -1.05]}>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 20]} />
        <meshStandardMaterial color="#b08050" roughness={0.8} />
      </mesh>
      {/* ฝักบัวดำ: ท่อตั้งบนเสาไม้กลางผนังหลัง */}
      <mesh position={[0.25, 1.3, -1.52]}>
        <boxGeometry args={[0.12, 2.3, 0.06]} />
        <meshStandardMaterial color="#8a5a34" />
      </mesh>
      <mesh position={[0.25, 1.35, -1.46]}>
        <cylinderGeometry args={[0.018, 0.018, 1.6, 8]} />
        <meshStandardMaterial color="#1e1e1e" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.25, 2.15, -1.32]}>
        <cylinderGeometry args={[0.13, 0.1, 0.04, 16]} />
        <meshStandardMaterial color="#1e1e1e" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.25, 2.17, -1.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.16, 6]} />
        <meshStandardMaterial color="#1e1e1e" />
      </mesh>
      {/* ชั้นวางไม้ + ขันน้ำ/ตะกร้า */}
      <mesh position={[0.8, 1.15, -1.45]}>
        <boxGeometry args={[0.5, 0.04, 0.16]} />
        <meshStandardMaterial color="#8a5a34" />
      </mesh>
      <mesh position={[0.8, 1.24, -1.45]}>
        <sphereGeometry args={[0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c8a468" roughness={1} side={2} />
      </mesh>
      {/* เครื่องทำน้ำอุ่น */}
      <mesh position={[1.22, 1.55, -0.9]}>
        <boxGeometry args={[0.08, 0.36, 0.22]} />
        <meshStandardMaterial color="#1e1e1e" roughness={0.4} />
      </mesh>
      {/* ราวแขวนผ้าเช็ดตัว */}
      <mesh position={[-1.22, 1.5, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.7, 6]} />
        <meshStandardMaterial color="#6a4428" />
      </mesh>
      <mesh position={[-1.19, 1.28, -0.2]}>
        <boxGeometry args={[0.03, 0.45, 0.5]} />
        <meshStandardMaterial color="#6aa8d8" roughness={1} />
      </mesh>
      {/* ท่อระบายน้ำที่พื้น */}
      <mesh position={[0.25, 0.125, -0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.06, 12]} />
        <meshStandardMaterial color="#5a5a58" metalness={0.6} />
      </mesh>
    </group>
  )
}

/** หลอดไฟสีเหลือง (ไล่ยุงไล่แมลง) ห้อยจากคาน · glow = ให้แสงจริงด้วย */
export function YellowBulb({ pos, glow = false, intensity = 2.2, distance = 6, inLight = false }: { pos: [number, number, number]; glow?: boolean; intensity?: number; distance?: number; inLight?: boolean }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.2, 4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.05, 8]} />
        <meshStandardMaterial color="#d8d8d8" metalness={0.6} />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <sphereGeometry args={[0.055, 12, 10]} />
        <meshStandardMaterial color="#ffd040" emissive="#ffb820" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      {/* ไฟส่องจริงเฉพาะในฉากภายใน (inLight) — ข้างนอกใช้หลอดเรืองแสงอย่างเดียว ไม่เพิ่มจำนวนไฟในฉาก (แก้เกมอืด) */}
      {glow && inLight && <pointLight position={[0, -0.15, 0]} color="#ffbe40" intensity={intensity} distance={distance} decay={1.6} />}
    </group>
  )
}
