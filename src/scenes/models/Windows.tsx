/**
 * หน้าต่างบ้านตารัง ผนังชั้นล่างด้านตะวันตก (ตามภาพอ้างอิงของผู้สร้าง) — ด้านหน้า = +z · ฐานหน้าต่างที่ y = 0
 * - LaceWindow: หน้าต่างกรอบขาว แบ่งช่องกระจก ม่านลูกไม้ขาวรวบไว้ข้างหนึ่ง (ห้องน้ารงณ์)
 * - CurtainWindow: หน้าต่างไม้บานคู่ มือจับเงิน ม่านโปร่งขาวระบายรวบสองข้าง (ตรงเตียงตายาย)
 * - GlassBlockWindow: บล็อกแก้วฝ้าลายน้ำ กรอบขาว (ห้องอาบน้ำ)
 */
const GLASS = { color: '#bcd6e4', transparent: true, opacity: 0.45, roughness: 0.05, metalness: 0.2 } as const

export function LaceWindow({ w = 1.25, h = 1.5 }: { w?: number; h?: number }) {
  const bar = 0.045
  return (
    <group>
      {/* กรอบขาวหนา + ขอบบัวล่าง */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w + 0.16, h + 0.16, 0.06]} />
        <meshStandardMaterial color="#f6f4ee" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.06, 0.06]}>
        <boxGeometry args={[w + 0.28, 0.06, 0.16]} />
        <meshStandardMaterial color="#f6f4ee" roughness={0.6} />
      </mesh>
      {/* ม่านลูกไม้ (อยู่หลังกระจก) รวบไปด้านขวา */}
      <mesh position={[w * 0.18, h / 2, 0.005]}>
        <planeGeometry args={[w * 0.55, h - 0.08]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.8} roughness={0.9} />
      </mesh>
      <mesh position={[w * 0.4, h * 0.45, 0.01]} scale={[1, 1.6, 1]}>
        <cylinderGeometry args={[0.06, 0.09, h * 0.5, 10]} />
        <meshStandardMaterial color="#fbfbf8" transparent opacity={0.85} roughness={0.9} />
      </mesh>
      {/* กระจก */}
      <mesh position={[0, h / 2, 0.035]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial {...GLASS} />
      </mesh>
      {/* ไม้ระแนงแบ่งช่อง: เสากลางใหญ่ + เส้นตั้ง/นอนของแต่ละบาน */}
      <mesh position={[0, h / 2, 0.045]}>
        <boxGeometry args={[bar * 1.6, h, 0.04]} />
        <meshStandardMaterial color="#f6f4ee" />
      </mesh>
      {[-w / 4, w / 4].map((x) => (
        <mesh key={x} position={[x, h / 2, 0.045]}>
          <boxGeometry args={[bar * 0.7, h, 0.03]} />
          <meshStandardMaterial color="#f6f4ee" />
        </mesh>
      ))}
      {[h / 3, (2 * h) / 3].map((y) => (
        <mesh key={y} position={[0, y, 0.045]}>
          <boxGeometry args={[w, bar * 0.7, 0.03]} />
          <meshStandardMaterial color="#f6f4ee" />
        </mesh>
      ))}
    </group>
  )
}

export function CurtainWindow({ w = 1.1, h = 1.3 }: { w?: number; h?: number }) {
  return (
    <group>
      {/* วงกบไม้ + ขอบหน้าต่างไม้ */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w + 0.14, h + 0.14, 0.06]} />
        <meshStandardMaterial color="#9a5e2c" roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.05, 0.07]}>
        <boxGeometry args={[w + 0.3, 0.05, 0.18]} />
        <meshStandardMaterial color="#a8682e" roughness={0.5} />
      </mesh>
      {/* ม่านโปร่งขาวระบาย รวบสองข้าง (หลังกระจก) + ราวม่าน */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * w * 0.36, h / 2, 0.005]} scale={[1, 1, 0.4]}>
            <cylinderGeometry args={[0.11, 0.17, h - 0.05, 12]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.85} roughness={0.9} />
          </mesh>
          <mesh position={[s * w * 0.18, h - 0.2, 0.004]} rotation={[0, 0, s * 0.6]}>
            <planeGeometry args={[w * 0.5, 0.45]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* กระจกสองบาน + กรอบไม้แบ่งกลาง */}
      <mesh position={[0, h / 2, 0.035]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial {...GLASS} />
      </mesh>
      <mesh position={[0, h / 2, 0.045]}>
        <boxGeometry args={[0.08, h, 0.04]} />
        <meshStandardMaterial color="#9a5e2c" />
      </mesh>
      <mesh position={[0, h * 0.72, 0.045]}>
        <boxGeometry args={[w, 0.05, 0.03]} />
        <meshStandardMaterial color="#9a5e2c" />
      </mesh>
      {/* มือจับเงินคู่ */}
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, h * 0.5, 0.075]}>
          <boxGeometry args={[0.02, 0.16, 0.03]} />
          <meshStandardMaterial color="#c8ccd0" metalness={0.75} roughness={0.25} />
        </mesh>
      ))}
    </group>
  )
}

export function GlassBlockWindow({ cols = 3, rows = 5, size = 0.2 }: { cols?: number; rows?: number; size?: number }) {
  const w = cols * size
  const h = rows * size
  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w + 0.12, h + 0.12, 0.05]} />
        <meshStandardMaterial color="#f6f4ee" roughness={0.6} />
      </mesh>
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = i % cols
        const r = Math.floor(i / cols)
        return (
          <mesh key={i} position={[-w / 2 + size / 2 + c * size, size / 2 + r * size, 0.035]}>
            <boxGeometry args={[size - 0.015, size - 0.015, 0.03]} />
            <meshStandardMaterial color={(c + r) % 3 ? '#dfeaf0' : '#cfe0ea'} transparent opacity={0.85} roughness={0.15} metalness={0.1} />
          </mesh>
        )
      })}
    </group>
  )
}
