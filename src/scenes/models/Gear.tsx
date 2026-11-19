import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { RBox } from './RBox'

/**
 * อาวุธและไอเทมติดตัว (GAME_DESIGN §2.65) — โมเดล 3 มิติจริง (ไม่ใช้อีโมจิ)
 * ทุกชิ้นวางแบบ "ด้ามจับอยู่ที่จุดกำเนิด ตัวอาวุธชี้ขึ้น +y" เพื่อใช้ทั้งในมือและในรูปไอคอน
 */
export type GearKind = 'weapon' | 'item'
export interface GearDef {
  id: string
  name: string
  kind: GearKind
  /** ความยาวโดยประมาณ (ม.) ใช้จัดกล้องถ่ายไอคอน */
  len: number
}
export const GEAR: GearDef[] = [
  { id: 'hoe', name: 'จอบ', kind: 'weapon', len: 1.1 },
  { id: 'axe', name: 'ขวาน', kind: 'weapon', len: 0.75 },
  { id: 'sword', name: 'ดาบ', kind: 'weapon', len: 0.95 },
  { id: 'hammer', name: 'ค้อน', kind: 'weapon', len: 0.55 },
  { id: 'katana', name: 'ดาบซามูไร', kind: 'weapon', len: 1.05 },
  { id: 'dagger', name: 'มีดสั้น', kind: 'weapon', len: 0.32 },
  { id: 'machete', name: 'มีดยาว', kind: 'weapon', len: 0.65 },
  { id: 'bomb', name: 'ระเบิด', kind: 'weapon', len: 0.32 },
  { id: 'bow', name: 'ธนู', kind: 'weapon', len: 1.1 },
  { id: 'yant', name: 'ยันต์กันผี', kind: 'item', len: 0.3 },
  { id: 'saisin', name: 'สายสิญจน์', kind: 'item', len: 0.26 },
  { id: 'rice', name: 'ข้าวสารเสก', kind: 'item', len: 0.26 },
  { id: 'shield', name: 'โล่', kind: 'item', len: 0.6 },
]
export const gearById = (id: string) => GEAR.find((g) => g.id === id)

const WOOD = '#8a5a32'
const WOOD_D = '#6a4426'
const STEEL = { color: '#c8ced4', metalness: 0.75, roughness: 0.22 }
const IRON = { color: '#7d8389', metalness: 0.6, roughness: 0.4 }
const BRASS = { color: '#c9a040', metalness: 0.7, roughness: 0.3 }

function Grip({ len, r = 0.022, color = WOOD }: { len: number; r?: number; color?: string }) {
  return (
    <mesh position={[0, len / 2 - 0.08, 0]} castShadow>
      <cylinderGeometry args={[r, r * 1.1, len, 10]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  )
}

function Hoe() {
  return (
    <group>
      <Grip len={1.05} r={0.02} />
      {/* ใบจอบตั้งฉากกับด้าม */}
      <group position={[0, 0.94, 0]}>
        <mesh position={[0, 0, 0.03]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.08, 10]} />
          <meshStandardMaterial {...IRON} />
        </mesh>
        <mesh position={[0, -0.09, 0.09]} rotation={[0.25, 0, 0]} castShadow>
          <RBox args={[0.2, 0.2, 0.02]} radius={0.01} />
          <meshStandardMaterial {...IRON} />
        </mesh>
        <mesh position={[0, -0.19, 0.115]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[0.2, 0.025, 0.022]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
      </group>
    </group>
  )
}

function Axe() {
  return (
    <group>
      <Grip len={0.75} r={0.022} />
      <group position={[0, 0.6, 0]}>
        <mesh position={[0, 0, 0.07]} castShadow>
          <RBox args={[0.05, 0.16, 0.15]} radius={0.015} />
          <meshStandardMaterial {...IRON} />
        </mesh>
        <mesh position={[0, 0, 0.16]} castShadow>
          <boxGeometry args={[0.022, 0.2, 0.04]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
      </group>
    </group>
  )
}

/** ดาบตรงสองคม มีโกร่งทองเหลือง */
function Sword() {
  return (
    <group>
      <Grip len={0.2} r={0.02} color="#3a2a22" />
      <mesh position={[0, -0.13, 0]}>
        <sphereGeometry args={[0.035, 10, 8]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, 0.07, 0]} castShadow>
        <RBox args={[0.2, 0.035, 0.05]} radius={0.012} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.055, 0.72, 0.012]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      <mesh position={[0, 0.84, 0]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 0.22]}>
        <boxGeometry args={[0.039, 0.039, 0.05]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      <mesh position={[0, 0.45, 0.007]}>
        <boxGeometry args={[0.008, 0.68, 0.002]} />
        <meshStandardMaterial color="#9aa2aa" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

function Hammer() {
  return (
    <group>
      <Grip len={0.5} r={0.02} />
      <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.2, 14]} />
        <meshStandardMaterial {...IRON} />
      </mesh>
      <mesh position={[0, 0.42, 0.105]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 14]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
    </group>
  )
}

/** ดาบซามูไร: ใบโค้งยาว ด้ามพันเชือกสลับลาย โกร่งกลม */
function Katana() {
  const wrap = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 16
    c.height = 64
    const x = c.getContext('2d')!
    x.fillStyle = '#1a1a22'
    x.fillRect(0, 0, 16, 64)
    x.fillStyle = '#e8e0d0'
    for (let i = 0; i < 8; i++) {
      x.beginPath()
      x.moveTo(0, i * 8)
      x.lineTo(8, i * 8 + 4)
      x.lineTo(16, i * 8)
      x.lineTo(8, i * 8 + 3)
      x.fill()
    }
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    return t
  }, [])
  return (
    <group>
      <mesh position={[0, 0.0, 0]} castShadow>
        <cylinderGeometry args={[0.019, 0.019, 0.28, 10]} />
        <meshStandardMaterial map={wrap} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.012, 16]} />
        <meshStandardMaterial color="#2a2420" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* ใบดาบโค้ง: ต่อเป็นท่อน ๆ ไล่เอียง */}
      {Array.from({ length: 7 }, (_, i) => {
        const t = i / 6
        const y = 0.22 + t * 0.7
        const bend = t * t * 0.07
        return (
          <mesh key={i} position={[0, y, bend]} rotation={[-0.06 - t * 0.12, 0, 0]} castShadow>
            <boxGeometry args={[0.01, 0.105, 0.032 - t * 0.008]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
        )
      })}
    </group>
  )
}

function Dagger() {
  return (
    <group>
      <Grip len={0.12} r={0.016} color="#4a2e1e" />
      <mesh position={[0, 0.03, 0]}>
        <RBox args={[0.08, 0.02, 0.03]} radius={0.008} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.035, 0.2, 0.008]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 0.2]}>
        <boxGeometry args={[0.025, 0.025, 0.04]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
    </group>
  )
}

/** มีดยาว (มีดอีโต้/พร้า) ใบกว้างปลายงุ้ม ด้ามไม้ */
function Machete() {
  return (
    <group>
      <Grip len={0.18} r={0.02} />
      <mesh position={[0, 0.32, 0.01]} castShadow>
        <boxGeometry args={[0.012, 0.42, 0.07]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      <mesh position={[0, 0.54, 0.025]} rotation={[0.5, 0, 0]} castShadow>
        <boxGeometry args={[0.012, 0.08, 0.075]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      <mesh position={[0, 0.32, -0.024]}>
        <boxGeometry args={[0.014, 0.42, 0.012]} />
        <meshStandardMaterial color="#3a3c40" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  )
}

/** ระเบิดลูกกลมสีดำ มีชนวนเชือก */
function Bomb() {
  return (
    <group position={[0, 0.12, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.11, 18, 14]} />
        <meshStandardMaterial color="#26262a" metalness={0.3} roughness={0.35} />
      </mesh>
      <mesh position={[0.04, 0.05, 0.08]} scale={[1, 0.6, 1]}>
        <sphereGeometry args={[0.025, 8, 6]} />
        <meshStandardMaterial color="#8a8e96" roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.115, 0]}>
        <cylinderGeometry args={[0.03, 0.035, 0.035, 10]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0.02, 0.16, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.006, 0.006, 0.08, 5]} />
        <meshStandardMaterial color="#c8a878" />
      </mesh>
      <mesh position={[0.045, 0.195, 0]}>
        <sphereGeometry args={[0.014, 8, 6]} />
        <meshStandardMaterial color="#ffb040" emissive="#ff8020" emissiveIntensity={1.2} />
      </mesh>
    </group>
  )
}

/** ธนูไม้โค้ง + สายธนู + ลูกศรพาด */
function Bow() {
  const seg = 9
  return (
    <group position={[0, 0.0, 0]}>
      {Array.from({ length: seg }, (_, i) => {
        const t = (i / (seg - 1)) * 2 - 1
        const y = t * 0.5
        const z = (1 - t * t) * 0.13
        return (
          <mesh key={i} position={[0, y, -z]} rotation={[-t * 0.55, 0, 0]} castShadow>
            <boxGeometry args={[0.022, 0.13, 0.03]} />
            <meshStandardMaterial color={Math.abs(t) < 0.2 ? '#3a2a22' : WOOD_D} roughness={0.7} />
          </mesh>
        )
      })}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 1.0, 4]} />
        <meshStandardMaterial color="#f0ead8" />
      </mesh>
      {/* ลูกศร */}
      <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.4, 5]} />
        <meshStandardMaterial color="#c8a878" />
      </mesh>
      <mesh position={[0, 0, -0.27]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.016, 0.05, 6]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
    </group>
  )
}

/** ยันต์กันผี: ผ้า/กระดาษสีเหลืองนวล ลายยันต์สีแดง */
function Yant() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 96
    const x = c.getContext('2d')!
    x.fillStyle = '#f2dc9a'
    x.fillRect(0, 0, 64, 96)
    x.strokeStyle = '#b8282a'
    x.lineWidth = 2.5
    x.strokeRect(5, 5, 54, 86)
    // เส้นยันต์: วงกลม + ตาราง + อักขระขด
    x.beginPath()
    x.arc(32, 30, 14, 0, Math.PI * 2)
    x.stroke()
    x.beginPath()
    x.moveTo(18, 30)
    x.lineTo(46, 30)
    x.moveTo(32, 16)
    x.lineTo(32, 44)
    x.stroke()
    for (let r = 0; r < 3; r++)
      for (let k = 0; k < 4; k++) {
        x.beginPath()
        x.arc(15 + k * 11, 58 + r * 10, 3, 0.3, Math.PI * 1.7)
        x.stroke()
      }
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    return t
  }, [])
  return (
    <group position={[0, 0.14, 0]} rotation={[0, 0, 0.08]}>
      <mesh castShadow>
        <boxGeometry args={[0.16, 0.24, 0.004]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, -0.003]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.16, 0.24]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
    </group>
  )
}

/** สายสิญจน์: ม้วนด้ายดิบสีขาวขด + ปลายด้ายห้อย */
function SaiSin() {
  return (
    <group position={[0, 0.08, 0]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, i * 0.018 - 0.035, 0]} rotation={[Math.PI / 2, 0, i * 0.4]} castShadow>
          <torusGeometry args={[0.07 - i * 0.004, 0.009, 6, 24]} />
          <meshStandardMaterial color={i % 2 ? '#f6f2e8' : '#ece6d8'} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0.07, -0.08, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.004, 0.004, 0.12, 4]} />
        <meshStandardMaterial color="#f6f2e8" />
      </mesh>
    </group>
  )
}

/** ข้าวสารเสก: ถุงผ้าแดงมัดปาก มีเม็ดข้าวขาวล้นปากถุง */
function RiceBag() {
  const grains = useMemo(() => Array.from({ length: 14 }, (_, i) => [Math.cos(i * 2.4) * 0.03 * ((i % 3) + 1) / 2, 0.145 + (i % 4) * 0.006, Math.sin(i * 2.4) * 0.03 * ((i % 3) + 1) / 2, i] as const), [])
  return (
    <group position={[0, 0.07, 0]}>
      <mesh scale={[1, 0.95, 1]} castShadow>
        <sphereGeometry args={[0.085, 16, 12]} />
        <meshStandardMaterial color="#b8323a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.04, 0.03, 0.05, 12]} />
        <meshStandardMaterial color="#b8323a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.085, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.034, 0.008, 6, 16]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, 0.12, 0]} scale={[1, 0.45, 1]}>
        <sphereGeometry args={[0.045, 12, 8]} />
        <meshStandardMaterial color="#f4f0e4" roughness={0.6} />
      </mesh>
      {grains.map(([x, y, z, i]) => (
        <mesh key={i} position={[x, y, z]} rotation={[i, i * 2, 0]} scale={[0.5, 1, 0.5]}>
          <sphereGeometry args={[0.007, 5, 4]} />
          <meshStandardMaterial color="#fffaf0" />
        </mesh>
      ))}
    </group>
  )
}

/** โล่ไม้กลม ขอบเหล็ก ปุ่มกลางทองเหลือง (หน้าโล่หัน +z) */
function Shield() {
  return (
    <group position={[0, 0.3, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.04, 28]} />
        <meshStandardMaterial color="#9a6a3e" roughness={0.75} />
      </mesh>
      {[-0.14, 0, 0.14].map((x) => (
        <mesh key={x} position={[x, 0, 0.021]}>
          <boxGeometry args={[0.006, 0.5, 0.002]} />
          <meshStandardMaterial color="#6a4426" />
        </mesh>
      ))}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.28, 0.022, 8, 32]} />
        <meshStandardMaterial {...IRON} />
      </mesh>
      <mesh position={[0, 0, 0.03]} scale={[1, 1, 0.55]}>
        <sphereGeometry args={[0.065, 16, 12]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
    </group>
  )
}

export function GearModel({ id }: { id: string }) {
  switch (id) {
    case 'hoe':
      return <Hoe />
    case 'axe':
      return <Axe />
    case 'sword':
      return <Sword />
    case 'hammer':
      return <Hammer />
    case 'katana':
      return <Katana />
    case 'dagger':
      return <Dagger />
    case 'machete':
      return <Machete />
    case 'bomb':
      return <Bomb />
    case 'bow':
      return <Bow />
    case 'yant':
      return <Yant />
    case 'saisin':
      return <SaiSin />
    case 'rice':
      return <RiceBag />
    case 'shield':
      return <Shield />
  }
  return null
}

/** วางของในมือตัวละคร (มือขวา = อาวุธ ชี้ไปข้างหน้า · มือซ้าย = ไอเทม) */
export function GearInHand({ id, left }: { id: string; left?: boolean }) {
  const d = gearById(id)
  if (!d) return null
  if (id === 'shield') {
    return (
      <group position={[0.04, -0.42, 0.06]} rotation={[0, -Math.PI / 2 + 0.3, 0]} scale={0.85}>
        <group position={[0, -0.3, 0]}>
          <GearModel id={id} />
        </group>
      </group>
    )
  }
  if (id === 'bow') {
    return (
      <group position={[0, -0.55, 0.05]} rotation={[0, 0, 0]} scale={0.9}>
        <GearModel id={id} />
      </group>
    )
  }
  if (d.kind === 'item' || id === 'bomb') {
    // ถือของชิ้นเล็กไว้ในฝ่ามือ
    return (
      <group position={[0, -0.6, 0.05]} rotation={[0.3, left ? 0.4 : -0.4, 0]}>
        <GearModel id={id} />
      </group>
    )
  }
  // อาวุธด้ามยาว: ด้ามอยู่ในมือ ตัวอาวุธชี้ไปข้างหน้า-ขึ้นเล็กน้อย
  return (
    <group position={[0, -0.55, 0.02]} rotation={[Math.PI / 2 - 0.35, 0, 0]}>
      <GearModel id={id} />
    </group>
  )
}
