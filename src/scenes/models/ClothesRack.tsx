import { useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

/**
 * ราวตากผ้าไม้ไผ่ทรง A (ตามภาพอ้างอิงผู้สร้าง 19 พ.ย.): ไม้ไผ่ไขว้กันสองฝั่ง มัดเชือกตรงจุดไขว้
 * คานบนพาดกลาง คานล่างค้ำ · ผ้าขาว ผ้าขาวม้า ผ้าถุง เสื้อ ตากห้อยพลิ้วลม · ตะกร้าผ้าวางข้าง ๆ
 * ยาวตามแกน x 2.8 ม. · สูง ~2.1 ม.
 */
const BAMBOO = '#c8aa6a'
const ROPE = '#a88a5a'

function Pole({ a, b, r = 0.045 }: { a: [number, number, number]; b: [number, number, number]; r?: number }) {
  const [mx, my, mz] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const dz = b[2] - a[2]
  const len = Math.hypot(dx, dy, dz)
  // หมุนแกน y ของทรงกระบอกให้ชี้ตามเส้น a→b
  const yaw = Math.atan2(dx, dz)
  const pitch = Math.acos(dy / len)
  return (
    <group position={[mx, my, mz]} rotation={[0, yaw, 0]}>
      <group rotation={[pitch, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[r, r * 1.1, len, 8]} />
          <meshStandardMaterial color={BAMBOO} roughness={0.6} />
        </mesh>
        {/* ข้อไผ่ */}
        {[-0.3, 0, 0.3].map((t) => (
          <mesh key={t} position={[0, t * len, 0]}>
            <cylinderGeometry args={[r * 1.18, r * 1.18, 0.025, 8]} />
            <meshStandardMaterial color="#a88a48" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Lash({ p }: { p: [number, number, number] }) {
  return (
    <mesh position={p}>
      <torusGeometry args={[0.065, 0.022, 6, 12]} />
      <meshStandardMaterial color={ROPE} roughness={1} />
    </mesh>
  )
}

export function ClothesRack() {
  const L = 1.4 // ครึ่งความยาว
  const H = 2.1
  const spread = 0.75
  const pakaoma = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')!
    g.fillStyle = '#3a7ac8'
    g.fillRect(0, 0, 64, 64)
    g.fillStyle = 'rgba(230,60,60,0.7)'
    for (let i = 0; i < 64; i += 16) {
      g.fillRect(i, 0, 6, 64)
      g.fillRect(0, i, 64, 6)
    }
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    return t
  }, [])
  // ผ้าที่ตาก: [x, กว้าง, ยาว, สี/ลาย]
  const cloths: [number, number, number, string][] = [
    [-1.05, 0.5, 0.95, '#f4f2ea'],
    [-0.5, 0.45, 1.15, '#ece8dc'],
    [0.05, 0.55, 1.0, 'pakaoma'],
    [0.62, 0.42, 1.2, '#7a3a5a'],
    [1.1, 0.4, 0.8, '#f4f2ea'],
  ]
  return (
    <group>
      {/* ขาไม้ไผ่ไขว้ 2 ฝั่ง (หัว-ท้าย) */}
      {[-L, L].map((x) => (
        <group key={x}>
          <Pole a={[x, 0, -spread]} b={[x, H + 0.25, 0.18]} />
          <Pole a={[x, 0, spread]} b={[x, H + 0.25, -0.18]} />
          <Lash p={[x, H, 0]} />
          {/* คานล่างค้ำ */}
          <Pole a={[x, 0.35, -spread + 0.12]} b={[x, 0.35, spread - 0.12]} r={0.035} />
        </group>
      ))}
      {/* คานบนพาดตามยาว (วางบนจุดไขว้) + คานกลาง + คานล่าง */}
      <Pole a={[-L - 0.25, H + 0.02, 0]} b={[L + 0.25, H + 0.02, 0]} r={0.05} />
      <Pole a={[-L, 0.38, 0]} b={[L, 0.38, 0]} r={0.035} />
      {[-L, L].map((x) => (
        <Lash key={'l' + x} p={[x, 0.38, 0]} />
      ))}
      {/* ผ้าตาก: พาดคานบนห้อยลง (โค้งนิด ๆ ตามลม) */}
      {cloths.map(([x, w, h, col], i) => (
        <group key={i} position={[x, H - 0.02, 0]} rotation={[Math.sin(i * 1.7) * 0.08, 0, Math.sin(i) * 0.03]}>
          <mesh position={[0, -h / 2, 0.035]} castShadow>
            <boxGeometry args={[w, h, 0.012]} />
            {col === 'pakaoma' ? <meshStandardMaterial map={pakaoma} roughness={1} side={2} /> : <meshStandardMaterial color={col} roughness={1} side={2} />}
          </mesh>
          <mesh position={[0, -h * 0.35, -0.035]}>
            <boxGeometry args={[w, h * 0.7, 0.012]} />
            {col === 'pakaoma' ? <meshStandardMaterial map={pakaoma} roughness={1} side={2} /> : <meshStandardMaterial color={col} roughness={1} side={2} />}
          </mesh>
          {/* ไม้หนีบผ้า */}
          {[-w / 3, w / 3].map((px) => (
            <mesh key={px} position={[px, 0.04, 0]}>
              <boxGeometry args={[0.025, 0.07, 0.11]} />
              <meshStandardMaterial color="#e8c870" />
            </mesh>
          ))}
        </group>
      ))}
      {/* ตะกร้าผ้าสาน + ผ้าพับ */}
      <group position={[L + 0.7, 0, 0.5]}>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.32, 0.26, 0.34, 14, 1, true]} />
          <meshStandardMaterial color="#c8a468" roughness={1} side={2} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.03, 14]} />
          <meshStandardMaterial color="#b89458" />
        </mesh>
        <mesh position={[0, 0.3, 0]} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[0.27, 10, 8]} />
          <meshStandardMaterial color="#f0ece2" roughness={1} />
        </mesh>
      </group>
    </group>
  )
}
