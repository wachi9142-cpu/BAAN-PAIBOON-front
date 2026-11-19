import { useMemo } from 'react'
import { ExtrudeGeometry, Shape } from 'three'
import { RBox } from './models/RBox'
import { BarberShopFront } from './BarberShop'

/** หลังคาจั่ว (ปริซึมสามเหลี่ยม) สันหลังคาตามแกน z · w = กว้าง, h = สูงจั่ว, len = ยาว */
function Gable({ w, h, len, color }: { w: number; h: number; len: number; color: string }) {
  const geo = useMemo(() => {
    const s = new Shape()
    s.moveTo(-w / 2, 0)
    s.lineTo(w / 2, 0)
    s.lineTo(0, h)
    s.closePath()
    const g = new ExtrudeGeometry(s, { depth: len, bevelEnabled: false })
    g.translate(0, 0, -len / 2)
    return g
  }, [w, h, len])
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
    </mesh>
  )
}

const WOOD = '#b98252'
const WOOD_D = '#94643c'
const FRAME = '#2c2c2e'

/** ผนังไม้ระแนงแนวตั้ง (ด้านหน้าหันไป +z) */
function SlatWall({ w, h }: { w: number; h: number }) {
  const n = Math.round(w / 0.16)
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.12]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[-w / 2 + (i + 0.5) * (w / n), h / 2, 0.065]}>
          <boxGeometry args={[0.025, h, 0.01]} />
          <meshStandardMaterial color={WOOD_D} />
        </mesh>
      ))}
    </group>
  )
}

/** กระจกบานใหญ่กรอบดำ มีม่านขาว ไฟในห้องสีอุ่น */
function GlassPanel({ w, h, clear }: { w: number; h: number; clear?: boolean }) {
  const cols = Math.max(2, Math.round(w / 0.9))
  return (
    <group>
      <mesh position={[0, h / 2, 0.07]}>
        <boxGeometry args={[w, h, 0.03]} />
        {clear ? (
          <meshStandardMaterial color="#cfe4ee" transparent opacity={0.28} roughness={0.05} metalness={0.3} depthWrite={false} />
        ) : (
          <meshStandardMaterial color="#e8c890" emissive="#f0b860" emissiveIntensity={0.25} roughness={0.15} metalness={0.2} />
        )}
      </mesh>
      {!clear && [-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.18), h / 2, 0.09]}>
          <boxGeometry args={[0.3, h - 0.1, 0.02]} />
          <meshStandardMaterial color="#f6f2ea" />
        </mesh>
      ))}
      {Array.from({ length: cols + 1 }, (_, i) => (
        <mesh key={'v' + i} position={[-w / 2 + (i * w) / cols, h / 2, 0.1]}>
          <boxGeometry args={[0.06, h, 0.05]} />
          <meshStandardMaterial color={FRAME} />
        </mesh>
      ))}
      {[0, h].map((y) => (
        <mesh key={'h' + y} position={[0, y, 0.1]}>
          <boxGeometry args={[w + 0.06, 0.07, 0.05]} />
          <meshStandardMaterial color={FRAME} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * บ้านชั้นเดียวสไตล์โมเดิร์น ผังตัว U (บ้านน้าโรจน์)
 * ปีกซ้าย-ขวายื่นมาข้างหน้า หน้าจั่วกรอบดำ กระจกบานใหญ่ · กลางบ้านเป็นระเบียงหน้าประตูกระจก มีบันไดขึ้น
 * ผนังไม้ระแนงตั้ง · หลังคาเมทัลชีทสีเทาเข้ม (ด้านหน้า = +z) · กว้าง ~11 ม. ลึก ~7 ม.
 */
/** shopWing = ปีกที่เป็นร้านตัดผม (−1 / 1) */
export function ModernHouse({ shopWing }: { shopWing?: number } = {}) {
  const H = 2.7
  const B = 0.45
  const ROOF = '#3e4248'
  const wing = (s: number) => (
    <group key={s} position={[s * 3.9, B, 0]}>
      <group position={[0, 0, -3.4]} rotation={[0, Math.PI, 0]}>
        <SlatWall w={3.2} h={H} />
      </group>
      <group position={[s * 1.6, 0, 0]} rotation={[0, (s * Math.PI) / 2, 0]}>
        {s === shopWing ? (
          // ร้านตัดผม: ผนังข้างเจาะเป็นประตูกระจกใสบานใหญ่ มองเข้าไปเห็นในร้าน
          <group>
            {[-1, 1].map((k) => (
              <group key={k} position={[k * 2.55, 0, 0]}>
                <SlatWall w={1.7} h={H} />
              </group>
            ))}
            <group position={[0, 2.35, 0]}>
              <SlatWall w={3.4} h={H - 2.35} />
            </group>
            <group position={[0, 0.02, -0.07]}>
              <GlassPanel w={3.4} h={2.33} clear />
            </group>
            {/* มือจับประตูกระจก */}
            {[-0.12, 0.12].map((x) => (
              <mesh key={x} position={[x, 1.1, 0.1]}>
                <boxGeometry args={[0.03, 0.5, 0.04]} />
                <meshStandardMaterial color="#c8ccd0" metalness={0.6} roughness={0.3} />
              </mesh>
            ))}
          </group>
        ) : (
          <SlatWall w={6.8} h={H} />
        )}
      </group>
      <group position={[0, 0, 3.4]}>
        <SlatWall w={3.2} h={H} />
        <group position={[0, 0.25, 0]}>
          <GlassPanel w={2.5} h={2.15} clear={s === shopWing} />
        </group>
      </group>
      <group position={[0, H, 0.15]}>
        <Gable w={3.9} h={0.95} len={7.6} color={ROOF} />
      </group>
      {s === shopWing && <BarberShopFront H={H} side={s} />}
      <mesh position={[0, H - 0.05, 3.92]}>
        <boxGeometry args={[3.9, 0.14, 0.12]} />
        <meshStandardMaterial color={FRAME} />
      </mesh>
      {s !== shopWing && [-1, 1].map((k) => (
        <mesh key={k} position={[k * 0.98, H + 0.45, 3.96]} rotation={[0, 0, -k * 0.45]}>
          <boxGeometry args={[2.15, 0.12, 0.12]} />
          <meshStandardMaterial color={FRAME} />
        </mesh>
      ))}
    </group>
  )
  return (
    <group>
      <mesh position={[0, B / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[11.2, B, 7.2]} />
        <meshStandardMaterial color="#c9c5bc" roughness={0.95} />
      </mesh>
      {wing(-1)}
      {wing(1)}
      <group position={[0, B, 0]}>
        <group position={[0, 0, -3.4]} rotation={[0, Math.PI, 0]}>
          <SlatWall w={4.6} h={H} />
        </group>
        {/* ประตูหลังบ้าน (ด้านหลังตัวบ้านกลาง) */}
        <group position={[0.6, 0, -3.47]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 1.05, 0]}>
            <boxGeometry args={[1.08, 2.18, 0.06]} />
            <meshStandardMaterial color={FRAME} />
          </mesh>
          <mesh position={[0, 1.03, 0.035]} castShadow>
            <boxGeometry args={[0.92, 2.06, 0.05]} />
            <meshStandardMaterial color="#6e4428" roughness={0.7} />
          </mesh>
          {[0.55, 1.5].map((y) => (
            <mesh key={y} position={[0, y, 0.065]}>
              <boxGeometry args={[0.74, 0.7, 0.015]} />
              <meshStandardMaterial color="#5c381f" roughness={0.75} />
            </mesh>
          ))}
          <mesh position={[-0.35, 1.02, 0.09]}>
            <boxGeometry args={[0.03, 0.2, 0.04]} />
            <meshStandardMaterial color="#c8ccd0" metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh position={[0, 2.25, 0.25]} castShadow>
            <boxGeometry args={[1.4, 0.05, 0.6]} />
            <meshStandardMaterial color={FRAME} />
          </mesh>
          <mesh position={[0, -B + 0.12, 0.4]} receiveShadow>
            <boxGeometry args={[1.3, 0.24, 0.55]} />
            <meshStandardMaterial color="#b8b4aa" />
          </mesh>
        </group>
        <group position={[0, 0, 0.6]}>
          <SlatWall w={4.6} h={H} />
          <group position={[0, 0, 0.01]}>
            <GlassPanel w={3.4} h={2.3} />
          </group>
        </group>
        <group position={[0, H, -1.2]} rotation={[0, Math.PI / 2, 0]}>
          <Gable w={5.6} h={1.15} len={4.8} color={ROOF} />
        </group>
        <mesh position={[0, H + 0.02, 2.1]} castShadow>
          <boxGeometry args={[4.6, 0.1, 3.1]} />
          <meshStandardMaterial color={ROOF} />
        </mesh>
        <mesh position={[0, H - 0.02, 3.62]}>
          <boxGeometry args={[4.6, 0.16, 0.08]} />
          <meshStandardMaterial color={FRAME} />
        </mesh>
        <mesh position={[0, 0.02, 2.1]} receiveShadow>
          <boxGeometry args={[4.6, 0.05, 3]} />
          <meshStandardMaterial color="#a8764a" />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 1.75, 0.5, 3.45]}>
              <boxGeometry args={[1.1, 0.06, 0.06]} />
              <meshStandardMaterial color={FRAME} />
            </mesh>
            {[1.25, 2.25].map((x) => (
              <mesh key={x} position={[s * x, 0.25, 3.45]}>
                <boxGeometry args={[0.05, 0.5, 0.05]} />
                <meshStandardMaterial color={FRAME} />
              </mesh>
            ))}
            <group position={[s * 1.4, 0, 1.7]} rotation={[0, s * -0.3, 0]}>
              <mesh position={[0, 0.4, 0]} castShadow>
                <RBox args={[0.62, 0.14, 0.6]} radius={0.05} />
                <meshStandardMaterial color="#e8e2d6" />
              </mesh>
              <mesh position={[0, 0.7, -0.26]}>
                <RBox args={[0.62, 0.5, 0.1]} radius={0.04} />
                <meshStandardMaterial color="#e8e2d6" />
              </mesh>
            </group>
          </group>
        ))}
      </group>
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, 0.11 + i * 0.08, 3.95 - i * 0.3]} receiveShadow>
          <boxGeometry args={[1.8, 0.22 + i * 0.16, 0.35]} />
          <meshStandardMaterial color="#b8b4aa" />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={'p' + i} position={[i % 2 ? 0.25 : -0.2, 0.035, 4.6 + i * 0.75]} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[0.3, 7]} />
          <meshStandardMaterial color="#c8c4ba" />
        </mesh>
      ))}
      {[-5, -4.1, -2.6, 2.6, 4.1, 5].filter((x) => !shopWing || Math.sign(x) !== shopWing).map((x, i) => (
        <mesh key={'b' + i} position={[x, 0.3, 4.0]} scale={[1.2, 0.8, 1]} castShadow>
          <icosahedronGeometry args={[0.38, 1]} />
          <meshStandardMaterial color={i % 2 ? '#5f9e47' : '#4f8a3c'} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}
