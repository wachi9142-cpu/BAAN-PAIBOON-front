/**
 * หอถังน้ำ (แท่นถังน้ำเหล็ก): ฐานปูน · เสาเหล็กชุบ 4 ต้น + ค้ำไขว้ · แท่นตะแกรง + ราวกันตก
 * ถังน้ำสีน้ำเงิน 2 ใบ · หลังคาสังกะสีลาดเอียง · บันไดเหล็ก · เพิงปั๊มน้ำหลังคาสีฟ้า + ถังแรงดัน + ท่อขึ้นถัง
 */
const STEEL = '#b9bec2'
const STEEL_D = '#8e959b'
const BLUE = '#1f5fb8'
const ROOF = '#9aa3aa'

function Beam({ a, b, t = 0.07, color = STEEL }: { a: [number, number, number]; b: [number, number, number]; t?: number; color?: string }) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const dz = b[2] - a[2]
  const len = Math.hypot(dx, dy, dz)
  const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
  // หมุนแกน y ของกล่องให้ชี้จาก a ไป b
  const yaw = Math.atan2(dx, dz)
  const pitch = Math.acos(Math.max(-1, Math.min(1, dy / len)))
  return (
    <group position={mid} rotation={[0, yaw, 0]}>
      <mesh rotation={[pitch, 0, 0]} castShadow>
        <boxGeometry args={[t, len, t]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.45} />
      </mesh>
    </group>
  )
}

export function WaterTower() {
  const H = 3 // ความสูงแท่น
  const P = 1.4 // ครึ่งระยะเสา
  const posts: [number, number][] = [
    [-P, -P],
    [P, -P],
    [P, P],
    [-P, P],
  ]
  return (
    <group>
      {/* ฐานปูน */}
      <mesh position={[0.6, 0.08, 0.2]} receiveShadow castShadow>
        <boxGeometry args={[4.8, 0.16, 3.8]} />
        <meshStandardMaterial color="#c9c4b8" roughness={0.95} />
      </mesh>
      {/* เสา 4 ต้น (ยาวถึงหลังคา) */}
      {posts.map(([x, z]) => (
        <mesh key={x + ':' + z} position={[x, 2.35, z]} castShadow>
          <boxGeometry args={[0.12, 4.4, 0.12]} />
          <meshStandardMaterial color={STEEL} metalness={0.55} roughness={0.4} />
        </mesh>
      ))}
      {/* ค้ำไขว้ 4 ด้าน */}
      {posts.map(([x, z], i) => {
        const [nx, nz] = posts[(i + 1) % 4]
        return (
          <group key={'b' + i}>
            <Beam a={[x, 0.2, z]} b={[nx, H - 0.1, nz]} />
            <Beam a={[nx, 0.2, nz]} b={[x, H - 0.1, z]} />
            <Beam a={[x, 1.5, z]} b={[nx, 1.5, nz]} t={0.06} />
          </group>
        )
      })}
      {/* แท่นตะแกรง */}
      <mesh position={[0, H, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.3, 0.1, 3.3]} />
        <meshStandardMaterial color={STEEL_D} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* ราวกันตก */}
      {posts.map(([x, z], i) => {
        const [nx, nz] = posts[(i + 1) % 4]
        return (
          <group key={'r' + i}>
            <Beam a={[x, H + 0.95, z]} b={[nx, H + 0.95, nz]} t={0.05} />
            <Beam a={[x, H + 0.5, z]} b={[nx, H + 0.5, nz]} t={0.04} />
          </group>
        )
      })}
      {/* ถังน้ำสีน้ำเงิน 2 ใบ */}
      {[-0.68, 0.68].map((x) => (
        <group key={x} position={[x, H + 0.05, 0]}>
          <mesh position={[0, 0.66, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.6, 1.32, 28]} />
            <meshStandardMaterial color={BLUE} roughness={0.4} />
          </mesh>
          {/* ร่องรอบถัง */}
          {[0.35, 0.7, 1.05].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <torusGeometry args={[0.605, 0.02, 6, 28]} />
              <meshStandardMaterial color="#174a92" />
            </mesh>
          ))}
          <mesh position={[0, 1.38, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.6, 0.14, 28]} />
            <meshStandardMaterial color={BLUE} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.49, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.08, 20]} />
            <meshStandardMaterial color="#174a92" />
          </mesh>
        </group>
      ))}
      {/* หลังคาสังกะสีลาดเอียง */}
      <mesh position={[0, 4.62, 0]} rotation={[0.1, 0, 0]} castShadow>
        <boxGeometry args={[3.9, 0.06, 3.9]} />
        <meshStandardMaterial color={ROOF} metalness={0.45} roughness={0.5} />
      </mesh>
      {[-1.5, -0.75, 0, 0.75, 1.5].map((x) => (
        <mesh key={'rb' + x} position={[x, 4.66, 0]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.04, 0.03, 3.9]} />
          <meshStandardMaterial color="#c4cbd0" metalness={0.5} />
        </mesh>
      ))}
      {/* บันไดเหล็กด้านหน้า */}
      <group position={[-0.6, 0, P + 0.55]} rotation={[-0.18, 0, 0]}>
        {[-0.25, 0.25].map((x) => (
          <mesh key={x} position={[x, H / 2 + 0.1, 0]} castShadow>
            <boxGeometry args={[0.05, H + 0.3, 0.05]} />
            <meshStandardMaterial color={STEEL} metalness={0.55} roughness={0.4} />
          </mesh>
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[0, 0.3 + i * 0.33, 0]}>
            <boxGeometry args={[0.5, 0.035, 0.035]} />
            <meshStandardMaterial color={STEEL} metalness={0.55} roughness={0.4} />
          </mesh>
        ))}
      </group>
      {/* ท่อน้ำขึ้นถัง */}
      <mesh position={[1.55, H / 2 + 0.5, 0.55]}>
        <cylinderGeometry args={[0.035, 0.035, H + 1, 8]} />
        <meshStandardMaterial color="#e8e8e2" />
      </mesh>
      {/* เพิงปั๊มน้ำ (หลังคาสีฟ้า) */}
      <group position={[2.35, 0, 0.9]}>
        {[
          [0.75, 0.55],
          [0.75, -0.55],
        ].map(([x, z]) => (
          <mesh key={x + ':' + z} position={[x, 0.95, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 1.9, 8]} />
            <meshStandardMaterial color={STEEL} metalness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 1.95, 0]} rotation={[0, 0, -0.12]} castShadow>
          <boxGeometry args={[1.9, 0.05, 1.5]} />
          <meshStandardMaterial color="#2f8fd8" roughness={0.45} metalness={0.2} />
        </mesh>
        {/* ถังแรงดันสีฟ้า + ปั๊ม */}
        <mesh position={[0.15, 0.5, 0.2]} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.75, 16]} />
          <meshStandardMaterial color="#2f8fd8" roughness={0.35} />
        </mesh>
        <mesh position={[-0.25, 0.32, 0.2]} castShadow>
          <boxGeometry args={[0.3, 0.32, 0.26]} />
          <meshStandardMaterial color="#f2f2ee" roughness={0.6} />
        </mesh>
        <mesh position={[-0.25, 0.55, 0.2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.18, 12]} />
          <meshStandardMaterial color="#d8d8d0" />
        </mesh>
        {/* ท่อจากบ่อบาดาล */}
        <mesh position={[-0.55, 0.3, 0.2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 10]} />
          <meshStandardMaterial color="#5a6a78" />
        </mesh>
      </group>
    </group>
  )
}
