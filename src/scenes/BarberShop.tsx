import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { RBox } from './models/RBox'

/** ป้ายร้าน (แผ่นเรียบ วาดตัวหนังสือไทยด้วยฟอนต์เบราว์เซอร์) */
function SignBoard({ w, h }: { w: number; h: number }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 640
    c.height = Math.round((640 * h) / w)
    const x = c.getContext('2d')!
    x.fillStyle = '#f6efe1'
    x.fillRect(0, 0, c.width, c.height)
    // แถบสีเสาร้านตัดผม แดง-ขาว-น้ำเงิน ขอบล่าง
    const cols = ['#d23a2a', '#ffffff', '#2a55b8']
    for (let i = 0; i < 32; i++) {
      x.fillStyle = cols[i % 3]
      x.fillRect(i * 20, c.height - 14, 20, 14)
    }
    x.fillStyle = '#2b2b2e'
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.font = `600 ${Math.round(c.height * 0.36)}px Mitr, Sarabun, sans-serif`
    x.fillText('✂ ร้านตัดผมชาย-หญิง', c.width / 2, c.height * 0.32)
    x.fillStyle = '#b8322a'
    x.font = `600 ${Math.round(c.height * 0.3)}px Mitr, Sarabun, sans-serif`
    x.fillText('ช่างโรจน์', c.width / 2, c.height * 0.7)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    return t
  }, [w, h])
  return (
    <group>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.05]} />
        <meshStandardMaterial color="#2c2c2e" />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.7} />
      </mesh>
    </group>
  )
}

/** เสาหมุนหน้าร้านตัดผม (ลายเกลียว แดง-ขาว-น้ำเงิน หมุนตลอด) */
function BarberPole() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 64
    const x = c.getContext('2d')!
    x.fillStyle = '#ffffff'
    x.fillRect(0, 0, 64, 64)
    const band = (color: string, off: number) => {
      x.fillStyle = color
      for (let k = -2; k < 3; k++) {
        x.beginPath()
        x.moveTo(k * 64 + off, 64)
        x.lineTo(k * 64 + off + 64, 0)
        x.lineTo(k * 64 + off + 64 + 14, 0)
        x.lineTo(k * 64 + off + 14, 64)
        x.fill()
      }
    }
    band('#d23a2a', 0)
    band('#2a55b8', 32)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(1, 2)
    return t
  }, [])
  useFrame((_, dt) => {
    tex.offset.y -= dt * 0.5
  })
  return (
    <group>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.12, 0.25, 0.12]} />
        <meshStandardMaterial color="#c8ccd0" metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.75, 16]} />
        <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.25} />
      </mesh>
      {[1.02, 1.78].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
          <meshStandardMaterial color="#c8ccd0" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 1.86, 0]}>
        <sphereGeometry args={[0.1, 14, 10]} />
        <meshStandardMaterial color="#c8ccd0" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

/** เก้าอี้ตัดผม (หันไปทาง −z = หันเข้ากระจก) */
function BarberChair({ color = '#8a1e1e' }: { color?: string }) {
  return (
    <group>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.08, 16]} />
        <meshStandardMaterial color="#c8ccd0" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
        <meshStandardMaterial color="#c8ccd0" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <RBox args={[0.55, 0.14, 0.52]} radius={0.06} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.92, 0.24]} rotation={[0.15, 0, 0]} castShadow>
        <RBox args={[0.5, 0.65, 0.1]} radius={0.05} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.33, 0.29]}>
        <RBox args={[0.24, 0.14, 0.08]} radius={0.03} />
        <meshStandardMaterial color="#1c1c1e" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.3, 0.72, 0.02]}>
          <RBox args={[0.07, 0.06, 0.45]} radius={0.02} />
          <meshStandardMaterial color="#1c1c1e" />
        </mesh>
      ))}
      <mesh position={[0, 0.2, -0.38]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.36, 0.03, 0.22]} />
        <meshStandardMaterial color="#c8ccd0" metalness={0.6} />
      </mesh>
    </group>
  )
}

/**
 * ร้านตัดผมชาย-หญิง ช่างโรจน์ (อยู่ในปีกบ้าน กว้าง 3.2 × ลึก 6.8 · หน้าร้าน = +z ที่ z = 3.4)
 * ป้ายร้านบนหน้าจั่ว · เสาหมุนสามสี · ข้างในมีกระจกบานยาว เคาน์เตอร์ เก้าอี้ตัดผม 2 ตัว · ม้านั่งรอคิวหน้าร้าน
 */
export function BarberShopFront({ H, side }: { H: number; side: number }) {
  return (
    <group>
      {/* ป้ายร้านบนหน้าจั่ว */}
      <group position={[0, H + 0.42, 3.99]}>
        <SignBoard w={2.5} h={0.62} />
      </group>
      {/* เสาหมุนหน้าร้าน (มุมนอกของปีก) */}
      <group position={[-side * 1.45, 0, 3.75]}>
        <BarberPole />
      </group>
      {/* ป้าย "เปิด" ที่กระจก */}
      <mesh position={[side * 0.7, 1.5, 3.52]}>
        <planeGeometry args={[0.42, 0.2]} />
        <meshStandardMaterial color="#2a8a4a" emissive="#2a8a4a" emissiveIntensity={0.5} />
      </mesh>
      <ShopInterior H={H} side={side} />
      {/* ม้านั่งรอคิวหน้าร้าน */}
      <group position={[-side * 0.4, 0, 4.35]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <RBox args={[1.6, 0.08, 0.42]} radius={0.03} />
          <meshStandardMaterial color="#8a5a34" />
        </mesh>
        {[-0.7, 0.7].map((x) => (
          <mesh key={x} position={[x, 0.21, 0]}>
            <boxGeometry args={[0.08, 0.42, 0.36]} />
            <meshStandardMaterial color="#6b4428" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** ผ้าคลุมตัดผมลายทางขาว-ดำ */
function useStripeTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 8
    const x = c.getContext('2d')!
    x.fillStyle = '#f4f4f2'
    x.fillRect(0, 0, 64, 8)
    x.fillStyle = '#2a2a2e'
    for (let i = 0; i < 8; i++) x.fillRect(i * 8, 0, 3, 8)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(2, 1)
    return t
  }, [])
}

/** ต้นมอนสเตอร่าในกระถางขาว */
function Monstera({ s = 1 }: { s?: number }) {
  return (
    <group scale={s}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.4, 14]} />
        <meshStandardMaterial color="#f2f0ea" />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => {
        const a = i * 0.9
        const r = 0.18 + (i % 3) * 0.08
        return (
          <group key={i} position={[Math.cos(a) * r, 0.55 + (i % 3) * 0.17, Math.sin(a) * r]} rotation={[0.5 * Math.sin(a), a, 0.6 * Math.cos(a)]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.2, 9, 0.3, Math.PI * 2 - 0.6]} />
              <meshStandardMaterial color={i % 2 ? '#3f7a3a' : '#2f6a32'} side={2} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/**
 * ภายในร้านตัดผม (ปีกบ้าน กว้าง 3.2 ลึก 6.8) — มองเห็นผ่านประตูกระจกด้านข้าง (ฝั่ง side)
 * ผนังด้านในทาสีเทา: กระจกเงา 2 บาน ชั้นวางน้ำยา โปสเตอร์ทรงผม ไฟผนัง · เก้าอี้ตัดผมหันเข้ากระจก มีผ้าคลุมลายทาง
 * พื้นปาร์เกต์ไม้ · ต้นมอนสเตอร่า · ชั้นวางสินค้า
 */
export function ShopInterior({ H, side }: { H: number; side: number }) {
  const stripe = useStripeTexture()
  const wx = -side * 1.5 // ผนังเทาด้านใน (ฝั่งตรงข้ามประตูกระจก)
  const face = (side * Math.PI) / 2 // ให้ระนาบหันไปทางประตูกระจก
  const spots = [-1.5, 1.2]
  return (
    <group>
      {/* พื้นปาร์เกต์ */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.0, 6.6]} />
        <meshStandardMaterial color="#9a5e36" roughness={0.7} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={'fl' + i} position={[0, 0.014, -3.2 + i * 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.0, 0.03]} />
          <meshStandardMaterial color="#7a4628" />
        </mesh>
      ))}
      {/* ผนังเทาด้านใน + ผนังหลัง */}
      <mesh position={[wx, H / 2, 0]} rotation={[0, face, 0]}>
        <planeGeometry args={[6.7, H]} />
        <meshStandardMaterial color="#6f7478" roughness={0.9} />
      </mesh>
      <mesh position={[0, H / 2, -3.3]}>
        <planeGeometry args={[3.1, H]} />
        <meshStandardMaterial color="#7a7f83" roughness={0.9} />
      </mesh>
      {/* ของบนผนังเทา: กระจกเงา + ชั้นวาง + ไฟผนัง ตรงกับเก้าอี้แต่ละตัว */}
      {spots.map((z, i) => (
        <group key={z} position={[wx, 0, z]} rotation={[0, face, 0]}>
          <mesh position={[0, 1.55, 0.02]}>
            <boxGeometry args={[0.95, 1.15, 0.03]} />
            <meshStandardMaterial color="#2a2a2e" />
          </mesh>
          <mesh position={[0, 1.55, 0.04]}>
            <planeGeometry args={[0.85, 1.05]} />
            <meshStandardMaterial color="#d8e8f0" metalness={0.85} roughness={0.06} />
          </mesh>
          <mesh position={[0, 0.92, 0.14]}>
            <boxGeometry args={[0.9, 0.04, 0.24]} />
            <meshStandardMaterial color="#f2f0ea" />
          </mesh>
          {[-0.3, -0.15, 0.1, 0.28].map((x, k) => (
            <mesh key={k} position={[x, 1.0, 0.14]}>
              <cylinderGeometry args={[0.035, 0.035, 0.13 + (k % 2) * 0.05, 8]} />
              <meshStandardMaterial color={['#2a2a2e', '#d8d4ca', '#3a6ac9', '#c8a040'][(k + i) % 4]} />
            </mesh>
          ))}
          <mesh position={[0, 2.25, 0.08]}>
            <boxGeometry args={[0.3, 0.06, 0.1]} />
            <meshStandardMaterial color="#fff2d0" emissive="#ffe0a0" emissiveIntensity={0.8} />
          </mesh>
          {/* โปสเตอร์ทรงผมข้างกระจก */}
          <mesh position={[i ? -0.85 : 0.85, 1.7, 0.02]}>
            <planeGeometry args={[0.42, 0.56]} />
            <meshStandardMaterial color={i ? '#c89a5a' : '#8a5a3a'} />
          </mesh>
          <mesh position={[i ? -0.85 : 0.85, 1.72, 0.025]}>
            <circleGeometry args={[0.12, 12]} />
            <meshStandardMaterial color="#3a2a22" />
          </mesh>
        </group>
      ))}
      {/* เก้าอี้ตัดผมหันเข้ากระจก */}
      {spots.map((z, i) => (
        <group key={'c' + z} position={[wx + side * 0.95, 0, z]} rotation={[0, face, 0]}>
          <BarberChair color={i ? '#2a2a2e' : '#8a1e1e'} />
          {i === 0 && (
            // ผ้าคลุมลายทางพาดเก้าอี้
            <mesh position={[0, 0.78, 0.02]} scale={[1, 1, 0.9]} castShadow>
              <cylinderGeometry args={[0.24, 0.4, 0.75, 14, 1, true]} />
              <meshStandardMaterial map={stripe} side={2} roughness={0.8} />
            </mesh>
          )}
        </group>
      ))}
      {/* ชั้นวางสินค้าดำ มุมหลังร้าน */}
      <group position={[side * 0.95, 0, -2.95]}>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.7, 1.8, 0.3]} />
          <meshStandardMaterial color="#2a2a2e" />
        </mesh>
        {[0.45, 0.9, 1.35].map((y) =>
          [-0.2, 0, 0.2].map((x, k) => (
            <mesh key={y + ':' + x} position={[x, y + 0.1, 0.12]}>
              <boxGeometry args={[0.12, 0.18, 0.08]} />
              <meshStandardMaterial color={['#e8e4dc', '#3a6ac9', '#d8a040'][(k + Math.round(y * 2)) % 3]} />
            </mesh>
          )),
        )}
      </group>
      {/* ต้นมอนสเตอร่า */}
      <group position={[wx + side * 0.35, 0, -0.2]}>
        <Monstera />
      </group>
      <group position={[wx + side * 0.35, 0, 2.7]}>
        <Monstera s={1.2} />
      </group>
      {/* ไฟเพดาน */}
      {[-1.5, 1.2].map((z) => (
        <mesh key={'l' + z} position={[0, H - 0.05, z]}>
          <boxGeometry args={[0.8, 0.04, 0.25]} />
          <meshStandardMaterial color="#ffffff" emissive="#fff6e0" emissiveIntensity={0.9} />
        </mesh>
      ))}
    </group>
  )
}
