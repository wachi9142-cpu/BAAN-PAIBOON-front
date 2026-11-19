import { Motorcycle } from './models/Motorcycle'
import { SignBoard } from './SignBoard'

/**
 * อู่ซ่อมรถมอเตอร์ไซค์ของน้ารงณ์ (ตามภาพอ้างอิงของผู้สร้าง 19 พ.ย.)
 * เพิงโครงไม้ หลังคาจั่วสังกะสี + กันสาดหน้าร้าน · ผนังไม้กระดาน 3 ด้าน หน้าเปิดโล่ง
 * ป้ายใหญ่ "อู่ซ่อมรถมอเตอร์ไซค์ รับซ่อม - เปลี่ยนอะไหล่ - สั่งน้ำมัน" · ป้ายแขวน "ตรวจเช็คฟรี" · ป้าย "เปิดทุกวัน 08:00-18:00"
 * ในร้าน: แผงแขวนประแจ · ตู้เครื่องมือแดง · ถังน้ำมันน้ำเงิน · แท่นยกรถสีแดงมีรถจอดซ่อม · ชั้นวางน้ำมันเครื่อง · ลังน้ำมันเครื่อง
 * ธงชาติไทยบนเสา · กระถางต้นไม้ · โอ่งดินเผา · พื้นปูนหน้าร้าน
 * แกน: หน้าร้าน = +z · กว้าง 5 (x) × ลึก 3.6 (z)
 */
const W = 5
const D = 3.6
const H = 2.6
const WOOD = '#8a6a4a'
const POST = '#6a4a30'
const ZINC = '#8e9496'

export function RepairShop() {
  return (
    <group>
      {/* พื้นปูนในร้าน + ลานหน้าร้าน */}
      <mesh position={[0, 0.04, 0.6]} receiveShadow>
        <boxGeometry args={[W + 0.4, 0.08, D + 1.6]} />
        <meshStandardMaterial color="#b9b4a8" roughness={1} />
      </mesh>
      {/* เสามุม 4 ต้น + เสากลางหน้า */}
      {[-W / 2, W / 2].flatMap((x) =>
        [-D / 2, D / 2].map((z) => (
          <mesh key={x + ':' + z} position={[x, H / 2, z]} castShadow>
            <boxGeometry args={[0.16, H, 0.16]} />
            <meshStandardMaterial color={POST} />
          </mesh>
        )),
      )}
      {/* ผนังไม้กระดาน: หลัง + ข้าง 2 ด้าน */}
      <mesh position={[0, H / 2, -D / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, H, 0.08]} />
        <meshStandardMaterial color="#7d6650" roughness={0.9} />
      </mesh>
      {[-W / 2, W / 2].map((x) => (
        <mesh key={'sw' + x} position={[x, H / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.08, H, D]} />
          <meshStandardMaterial color="#7d6650" roughness={0.9} />
        </mesh>
      ))}
      {/* ลายไม้กระดานตั้งบนผนังหลัง */}
      {Array.from({ length: 12 }, (_, i) => -W / 2 + 0.2 + i * 0.42).map((x) => (
        <mesh key={'pl' + x} position={[x, H / 2, -D / 2 + 0.05]}>
          <boxGeometry args={[0.02, H, 0.01]} />
          <meshStandardMaterial color="#5a4632" />
        </mesh>
      ))}
      {/* โครงหลังคา: คานหน้า + หลังคาจั่วสังกะสี (สันขนานแกน x) */}
      <mesh position={[0, H, D / 2]}>
        <boxGeometry args={[W + 0.2, 0.16, 0.16]} />
        <meshStandardMaterial color={POST} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={'r' + s} position={[0, H + 0.5, (s * (D / 2 + 0.4)) / 2]} rotation={[s * 0.48, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[W + 0.6, 0.05, D / 2 + 0.75]} />
          <meshStandardMaterial color={ZINC} metalness={0.4} roughness={0.45} side={2} />
        </mesh>
      ))}
      {/* หน้าจั่วไม้ + ค้ำยันไม้ทแยง */}
      <mesh position={[0, H + 0.42, D / 2 + 0.02]}>
        <boxGeometry args={[W, 0.8, 0.05]} />
        <meshStandardMaterial color="#7d6650" />
      </mesh>
      {[-1.6, 1.6].map((x) => (
        <mesh key={'br' + x} position={[x, H - 0.3, D / 2 + 0.05]} rotation={[0, 0, x > 0 ? 0.7 : -0.7]}>
          <boxGeometry args={[0.08, 0.8, 0.08]} />
          <meshStandardMaterial color={POST} />
        </mesh>
      ))}
      {/* ป้ายใหญ่ */}
      <group position={[0, H + 0.42, D / 2 + 0.07]}>
        <SignBoard lines={['อู่ซ่อมรถมอเตอร์ไซค์', 'รับซ่อม - เปลี่ยนอะไหล่ - สั่งน้ำมัน']} width={3.4} height={0.72} bg="#2e2e30" ink="#f4ecd8" frame="#5a4632" />
      </group>
      {/* กันสาดสังกะสีหน้าร้าน */}
      <mesh position={[0, H - 0.1, D / 2 + 0.55]} rotation={[0.28, 0, 0]} castShadow>
        <boxGeometry args={[W + 0.3, 0.04, 1.1]} />
        <meshStandardMaterial color={ZINC} metalness={0.4} roughness={0.45} side={2} />
      </mesh>
      {/* แผงแขวนประแจบนผนังหลัง */}
      <group position={[-1.3, 1.45, -D / 2 + 0.08]}>
        <mesh>
          <boxGeometry args={[1.3, 0.75, 0.04]} />
          <meshStandardMaterial color="#9a7a52" />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[-0.52 + i * 0.15, -0.05 - (i % 3) * 0.05, 0.04]}>
            <boxGeometry args={[0.03, 0.32 + (i % 3) * 0.08, 0.02]} />
            <meshStandardMaterial color="#c8ccd0" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* ตู้เครื่องมือแดง (ลิ้นชัก) */}
      <group position={[-1.6, 0, -D / 2 + 0.45]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.9, 0.92, 0.5]} />
          <meshStandardMaterial color="#c0322a" roughness={0.5} />
        </mesh>
        {[0.25, 0.45, 0.65, 0.85].map((y) => (
          <mesh key={y} position={[0, y, 0.255]}>
            <boxGeometry args={[0.8, 0.015, 0.01]} />
            <meshStandardMaterial color="#6a1a14" />
          </mesh>
        ))}
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[0.6, 0.14, 0.32]} />
          <meshStandardMaterial color="#2a2a2e" />
        </mesh>
      </group>
      {/* ถังน้ำมันสีน้ำเงิน 2 ใบ */}
      {[-0.8, -0.35].map((x) => (
        <mesh key={'d' + x} position={[x, 0.42, -D / 2 + 0.4]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.76, 14]} />
          <meshStandardMaterial color="#2a5a9a" roughness={0.5} />
        </mesh>
      ))}
      {/* ชั้นวางน้ำมันเครื่อง */}
      <group position={[0.9, 0, -D / 2 + 0.25]}>
        {[0.5, 1.0, 1.5].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[1.0, 0.04, 0.32]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
        ))}
        {[0.5, 1.0, 1.5].flatMap((y) =>
          [-0.35, -0.12, 0.12, 0.35].map((x, k) => (
            <mesh key={y + ':' + x} position={[x, y + 0.12, 0]}>
              <boxGeometry args={[0.12, 0.2, 0.08]} />
              <meshStandardMaterial color={['#e8b63a', '#3a6ac9', '#c0322a', '#2a8a4a'][k]} />
            </mesh>
          )),
        )}
      </group>
      {/* แท่นยกรถสีแดง + รถที่กำลังซ่อม */}
      <group position={[0.4, 0, 0.2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.7, 0.08, 2.0]} />
          <meshStandardMaterial color="#c8322a" />
        </mesh>
        {[-0.7, 0.7].map((z) => (
          <mesh key={z} position={[0, 0.2, z]} rotation={[0, 0, 0.5]}>
            <boxGeometry args={[0.08, 0.48, 0.08]} />
            <meshStandardMaterial color="#a8281e" />
          </mesh>
        ))}
        <group position={[0, 0.46, 0]} rotation={[0, Math.PI / 2, 0]}>
          <Motorcycle color="#2a2a2e" kind="sport" lean={0} />
        </group>
      </group>
      {/* ลังน้ำมันเครื่อง + ลังพลาสติกฟ้า (มุมหน้าขวา) */}
      <mesh position={[W / 2 - 0.5, 0.25, D / 2 - 0.3]} castShadow>
        <boxGeometry args={[0.6, 0.5, 0.45]} />
        <meshStandardMaterial color="#8a6a44" />
      </mesh>
      <mesh position={[W / 2 - 0.5, 0.64, D / 2 - 0.3]}>
        <boxGeometry args={[0.45, 0.28, 0.3]} />
        <meshStandardMaterial color="#2a5aa8" />
      </mesh>
      <mesh position={[W / 2 - 1.1, 0.16, D / 2 - 0.2]}>
        <boxGeometry args={[0.45, 0.3, 0.35]} />
        <meshStandardMaterial color="#3a6ac9" />
      </mesh>
      {/* ป้าย "เปิดทุกวัน" บนเสาหน้าขวา */}
      <group position={[W / 2 + 0.1, 1.5, D / 2 + 0.1]} rotation={[0, 0.2, 0]}>
        <SignBoard lines={['เปิดทุกวัน', '08:00-18:00']} width={0.8} height={0.5} />
      </group>
      {/* ป้ายแขวน "ตรวจเช็คฟรี" ด้านซ้าย */}
      <group position={[-W / 2 - 0.6, 1.5, D / 2 + 0.2]}>
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.42, 0]} rotation={[0, 0, x > 0 ? -0.5 : 0.5]}>
            <cylinderGeometry args={[0.008, 0.008, 0.5, 4]} />
            <meshStandardMaterial color="#5a4632" />
          </mesh>
        ))}
        <SignBoard lines={['ตรวจเช็คฟรี', 'เช็คเบรก-ลมยาง']} width={0.85} height={0.45} />
      </group>
      <mesh position={[-W / 2 - 0.6, 1.0, D / 2 + 0.2]}>
        <boxGeometry args={[0.08, 2.0, 0.08]} />
        <meshStandardMaterial color={POST} />
      </mesh>
      {/* ธงชาติไทยบนเสา */}
      <group position={[W / 2 + 0.35, 0, D / 2 + 0.3]}>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 3.2, 8]} />
          <meshStandardMaterial color="#d8d4ca" />
        </mesh>
        {[
          ['#a51931', 0.36],
          ['#f4f5f8', 0.27],
          ['#2d2a4a', 0.18],
          ['#f4f5f8', 0.09],
          ['#a51931', 0.0],
        ].map(([c, y], i) => (
          <mesh key={i} position={[0.45, 2.6 + (y as number), 0]}>
            <boxGeometry args={[0.85, i === 2 ? 0.18 : 0.09, 0.01]} />
            <meshStandardMaterial color={c as string} side={2} />
          </mesh>
        ))}
      </group>
      {/* กระถางต้นไม้ + โอ่งดินเผาหน้าร้าน */}
      <group position={[W / 2 - 0.2, 0, D / 2 + 1.1]}>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.22, 0.16, 0.36, 12]} />
          <meshStandardMaterial color="#b0643a" />
        </mesh>
        <mesh position={[0, 0.55, 0]} scale={[1, 0.8, 1]}>
          <icosahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color="#4a8a34" flatShading />
        </mesh>
      </group>
      <mesh position={[-W / 2 - 0.3, 0.32, D / 2 + 1.2]} scale={[1, 1.1, 1]} castShadow>
        <sphereGeometry args={[0.32, 14, 10]} />
        <meshStandardMaterial color="#9a5a34" roughness={0.6} />
      </mesh>
    </group>
  )
}
