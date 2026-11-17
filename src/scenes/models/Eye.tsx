import type { EyeStyleId } from '../../game/content/appearance'

/**
 * ดวงตาแบบการ์ตูนนุ่ม ๆ (แผ่นซ้อนกันบนหน้า):
 * ตาขาว → ม่านตา → ไล่สีอ่อนด้านล่าง → ตาดำ → จุดแสง 2 จุด → ขอบตาบน
 * จุดกำเนิด = กลางตา บนผิวหน้า หันไปทาง +z
 */
export function Eye({
  color,
  style,
  side,
  female,
  skin,
}: {
  color: string
  style: EyeStyleId
  side: 1 | -1
  female: boolean
  skin: string
}) {
  if (style === 'classic') {
    // แบบเดิม: เม็ดกลมเรียบ + จุดแสง
    return (
      <group>
        <mesh>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.3} />
        </mesh>
        <mesh position={[0.008, 0.009, 0.019]}>
          <sphereGeometry args={[0.0065, 5, 5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    )
  }
  const light = mix(color, '#ffffff', 0.5)
  const pupil = mix(color, '#120c0a', 0.75)
  const z = (i: number) => 0.004 + i * 0.0012
  const disc = (r: number, c: string, pos: [number, number], i: number, sy = 1.18) => (
    <mesh position={[pos[0], pos[1], z(i)]} scale={[1, sy, 1]}>
      <circleGeometry args={[r, 20]} />
      <meshBasicMaterial color={c} />
    </mesh>
  )
  return (
    // หันออกตามความโค้งของหน้า
    <group rotation={[-0.08, side * 0.36, 0]}>
      {disc(0.033, '#fffdf8', [0, 0], 0)}
      {disc(0.0285, color, [0, -0.001], 1)}
      {disc(0.022, light, [0, -0.01], 2, 0.8)}
      {style === 'sparkle' ? (
        // ตาเป็นประกาย: ตาดำเป็นรูปดาว 4 แฉก
        <group position={[0, -0.001, z(3)]}>
          {[0, Math.PI / 2].map((r) => (
            <mesh key={r} rotation={[0, 0, r]}>
              <planeGeometry args={[0.006, 0.03]} />
              <meshBasicMaterial color="#fffdf8" />
            </mesh>
          ))}
          <mesh>
            <circleGeometry args={[0.008, 12]} />
            <meshBasicMaterial color={pupil} />
          </mesh>
        </group>
      ) : style === 'star' ? (
        // ตาดาว: ดาว 5 แฉกกลางตา
        <mesh position={[0, -0.002, z(3)]} rotation={[0, 0, Math.PI / 2]}>
          <circleGeometry args={[0.012, 5]} />
          <meshBasicMaterial color="#fff3b0" />
        </mesh>
      ) : (
        disc(0.0135, pupil, [0, 0.001], 3)
      )}
      {/* จุดแสง */}
      {disc(0.0095, '#ffffff', [side * -0.01, 0.012], 4, 1)}
      {disc(0.0048, '#ffffff', [side * 0.009, -0.011], 4, 1)}
      {/* ประกายเล็ก ๆ เพิ่มความมีชีวิตชีวา */}
      {disc(0.0028, '#ffffff', [side * 0.013, 0.006], 4, 1)}
      {disc(0.0022, '#ffffff', [side * -0.004, -0.016], 4, 1)}
      {(style === 'gentle' || style === 'sharp') && (
        // ตาหวาน: เปลือกตา (สีผิว) ลดลงมาปิดด้านบนเล็กน้อย
        <mesh position={[0, style === 'sharp' ? 0.022 : 0.012, z(5)]} scale={[1.06, style === 'sharp' ? 0.6 : 0.75, 1]}>
          <circleGeometry args={[0.036, 20, 0, Math.PI]} />
          <meshBasicMaterial color={skin} />
        </mesh>
      )}
      {/* ขอบตาล่าง: เส้นบางกว่าขอบบน */}
      <mesh position={[0, -0.004, z(6)]} rotation={[0, 0, Math.PI * 1.2]} scale={[0.85, 1.1, 1]}>
        <torusGeometry args={[0.033, 0.0014, 3, 14, Math.PI * 0.6]} />
        <meshBasicMaterial color="#5a3a32" />
      </mesh>
      {/* ขอบตาบน (ผู้หญิงหนากว่า) */}
      <mesh position={[0, style === 'sharp' ? 0.02 : style === 'gentle' ? 0.012 : 0.006, z(6)]} scale={[1, (style === 'gentle' || style === 'sharp') ? 0.5 : 1.25, 1]}>
        <torusGeometry args={[0.033, female ? 0.0045 : 0.0034, 4, 16, Math.PI]} />
        <meshBasicMaterial color="#2a1c18" />
      </mesh>
    </group>
  )
}

/** ผสมสี hex สองสี (t = สัดส่วนของสีที่สอง) */
function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t)
  return '#' + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')
}
