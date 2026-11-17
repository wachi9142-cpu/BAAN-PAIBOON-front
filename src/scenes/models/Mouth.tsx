import type { MouthStyleId } from '../../game/content/appearance'

const INSIDE = '#b8404a'
const TONGUE = '#ef8a8a'
const TEETH = '#fffdf8'

/**
 * รูปปากแบบการ์ตูน — แผ่นแบนวางบนหน้า (จุดกำเนิด = กลางปาก หันไปทาง +z)
 * lip = สีปากที่ผู้เล่นเลือก ใช้เป็นสีเส้น/ริมฝีปาก
 */
export function Mouth({ style, lip }: { style: MouthStyleId; lip: string }) {
  const line = (w: number, y = 0, rot = 0) => (
    <mesh position={[0, y, 0.003]} rotation={[0, 0, rot]}>
      <planeGeometry args={[w, 0.008]} />
      <meshBasicMaterial color={lip} />
    </mesh>
  )
  const smileArc = (r = 0.03, tube = 0.0065) => (
    <mesh rotation={[0, 0, Math.PI]}>
      <torusGeometry args={[r, tube, 6, 14, Math.PI]} />
      <meshStandardMaterial color={lip} />
    </mesh>
  )
  switch (style) {
    case 'flat':
      // ปากเฉย ๆ เส้นตรง
      return line(0.05)
    case 'cat':
      // ปากแมว ω
      return (
        <group position={[0, 0.004, 0.002]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.015, 0, 0]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.015, 0.005, 5, 10, Math.PI]} />
              <meshBasicMaterial color={lip} />
            </mesh>
          ))}
        </group>
      )
    case 'open':
      // ยิ้มอ้าปาก: ครึ่งวงกลม ด้านในมีลิ้น
      return (
        <group position={[0, 0.008, 0.002]}>
          <mesh rotation={[0, 0, Math.PI]}>
            <circleGeometry args={[0.03, 20, 0, Math.PI]} />
            <meshBasicMaterial color={INSIDE} />
          </mesh>
          <mesh position={[0, -0.018, 0.001]} scale={[1, 0.55, 1]}>
            <circleGeometry args={[0.016, 16]} />
            <meshBasicMaterial color={TONGUE} />
          </mesh>
          <mesh position={[0, -0.002, 0.001]}>
            <planeGeometry args={[0.04, 0.007]} />
            <meshBasicMaterial color={TEETH} />
          </mesh>
        </group>
      )
    case 'o':
      // ปากจู๋ / ตกใจ ๆ
      return (
        <group>
          <mesh scale={[1, 0.8, 1]}>
            <circleGeometry args={[0.016, 16]} />
            <meshBasicMaterial color={lip} />
          </mesh>
          <mesh position={[0, -0.002, 0.001]} scale={[1, 0.75, 1]}>
            <circleGeometry args={[0.01, 14]} />
            <meshBasicMaterial color={INSIDE} />
          </mesh>
        </group>
      )
    case 'tongue':
      // แลบลิ้น
      return (
        <group>
          {line(0.05, 0.004)}
          <mesh position={[0, -0.01, 0.002]} scale={[1, 1.25, 1]}>
            <circleGeometry args={[0.012, 14]} />
            <meshBasicMaterial color={TONGUE} />
          </mesh>
          <mesh position={[0, -0.009, 0.003]}>
            <planeGeometry args={[0.002, 0.012]} />
            <meshBasicMaterial color={INSIDE} />
          </mesh>
        </group>
      )
    case 'fang':
      // ยิ้มมีเขี้ยว
      return (
        <group>
          {smileArc(0.03, 0.007)}
          <mesh position={[0.016, -0.03, 0.006]} rotation={[0, 0, Math.PI]}>
            <circleGeometry args={[0.007, 3]} />
            <meshBasicMaterial color={TEETH} />
          </mesh>
        </group>
      )
    case 'grin':
      // ยิ้มเห็นฟัน
      return (
        <group position={[0, -0.004, 0.002]}>
          <mesh>
            <planeGeometry args={[0.06, 0.024]} />
            <meshBasicMaterial color={lip} />
          </mesh>
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.05, 0.015]} />
            <meshBasicMaterial color={TEETH} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <planeGeometry args={[0.05, 0.002]} />
            <meshBasicMaterial color="#d8c8c0" />
          </mesh>
        </group>
      )
    case 'small':
      // ปากจิ๋ว
      return (
        <mesh position={[0, 0, 0.002]} scale={[1.4, 0.7, 1]}>
          <circleGeometry args={[0.009, 14]} />
          <meshBasicMaterial color={lip} />
        </mesh>
      )
    default:
      // ยิ้มเล็ก ๆ (แบบเดิม)
      return smileArc()
  }
}
