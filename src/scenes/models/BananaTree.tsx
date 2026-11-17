import { useMemo } from 'react'
import { BufferGeometry, Color, Float32BufferAttribute } from 'three'

/**
 * ต้นกล้วย (สมจริงขึ้น แบบ low-poly นุ่ม ๆ)
 * ลำต้นเทียมเป็นกาบซ้อนกัน · ใบยาวรีโค้งขึ้นแล้วปลายตก มีก้านกลางใบสีอ่อน พับเป็นรูปตัว V เล็กน้อย
 * ใบแก่สีน้ำตาลห้อยลงข้างลำต้น · บางต้นมีเครือกล้วยห้อยพร้อมหัวปลีสีม่วง · หน่อเล็ก ๆ ที่โคน
 */
export function BananaTree({ seed = 0 }: { seed?: number }) {
  const r = (k: number) => {
    const x = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  // ใบใหญ่กว้าง ชูขึ้นแล้วโค้งออก (ตามภาพตัวอย่างของผู้สร้าง) · ใบล่างปลายตกมากกว่าใบบน
  const leaves = useMemo(
    () =>
      Array.from({ length: 9 }).map((_, i) => {
        const low = i % 3 === 0
        return {
          yaw: (i / 9) * Math.PI * 2 + r(i) * 0.5,
          tilt: low ? 0.25 : 0,
          len: 2 + r(i + 10) * 0.6,
          lift: low ? 0.45 + r(i + 20) * 0.2 : 0.8 + r(i + 20) * 0.4,
          droop: low ? 0.9 + r(i + 30) * 0.5 : 0.35 + r(i + 30) * 0.45,
          color: i % 3 === 0 ? '#5f9e3a' : i % 3 === 1 ? '#6fb043' : '#4f8f33',
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  )
  const hasBunch = r(99) > 0.2
  const H = 2.7
  return (
    <group>
      {/* ลำต้นเทียม: โคนป่องสีน้ำตาล ไล่เป็นเขียวอมน้ำตาลขึ้นไปด้านบน มีลายกาบตามยาว */}
      {[
        [0, 0.9, 0.2, 0.27, '#8a6a42'],
        [0.9, 0.95, 0.17, 0.2, '#8f7e4a'],
        [1.85, 0.9, 0.14, 0.17, '#7f9a4c'],
      ].map(([y, h, rt, rb, c], k) => (
        <mesh key={k} position={[0, (y as number) + (h as number) / 2, 0]} castShadow>
          <cylinderGeometry args={[rt as number, rb as number, h as number, 14]} />
          <meshStandardMaterial color={c as string} roughness={0.9} />
        </mesh>
      ))}
      {Array.from({ length: 7 }).map((_, k) => {
        const a = (k / 7) * Math.PI * 2 + r(80)
        return (
          <mesh key={'st' + k} position={[Math.cos(a) * 0.205, 0.95, Math.sin(a) * 0.205]} rotation={[0, -a, 0.06]}>
            <boxGeometry args={[0.025, 1.7, 0.03]} />
            <meshStandardMaterial color={k % 2 ? '#5e4428' : '#6e7a3a'} roughness={1} />
          </mesh>
        )
      })}
      {/* กาบแห้งสีน้ำตาลห่อโคน */}
      {[0, 1].map((k) => (
        <mesh key={'dry' + k} position={[0, 0.3 + k * 0.35, 0]} rotation={[0, 0.8 + k * 2.4, 0]}>
          <cylinderGeometry args={[0.25 - k * 0.03, 0.28 - k * 0.03, 0.55, 12, 1, true, 0, Math.PI * 0.8]} />
          <meshStandardMaterial color={k ? '#9a7a48' : '#7a5a34'} roughness={1} side={2} />
        </mesh>
      ))}
      {/* ใบ */}
      {leaves.map((l, i) => (
        <group key={i} position={[0, H - 0.05, 0]} rotation={[0, l.yaw, 0]}>
          <group rotation={[l.tilt, 0, 0]}>
            <mesh castShadow>
              <BananaLeafGeo len={l.len} width={0.66} lift={l.lift} droop={l.droop} color={l.color} />
              <meshStandardMaterial vertexColors roughness={0.7} side={2} />
            </mesh>
          </group>
        </group>
      ))}
      {/* ใบอ่อนม้วนตั้งตรงกลางยอด */}
      <mesh position={[0, H + 0.45, 0]} rotation={[0.08, 0, 0.05]}>
        <cylinderGeometry args={[0.03, 0.06, 0.95, 8]} />
        <meshStandardMaterial color="#9fd060" roughness={0.7} />
      </mesh>
      {/* ใบแก่แห้งห้อยลงข้างต้น */}
      <group position={[0, H - 0.3, 0]} rotation={[0, r(50) * 6, 0]}>
        <mesh>
          <BananaLeafGeo len={1.3} width={0.34} lift={-0.2} droop={1.7} color="#9a7a46" />
          <meshStandardMaterial vertexColors roughness={1} side={2} />
        </mesh>
      </group>
      {/* เครือกล้วยสุกสีเหลือง + หัวปลีสีแดง */}
      {hasBunch && <Bunch yaw={r(60) * 6} ripe={r(61) > 0.25} topY={H - 0.15} />}
      {/* หน่อกล้วยที่โคน: ใบชี้ขึ้น */}
      {[0, 1, 2].map((k) => (
        <group key={k} position={[Math.cos(k * 2.3 + r(70)) * 0.5, 0, Math.sin(k * 2.3 + r(70)) * 0.5]} scale={0.3 + k * 0.1}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.1, 0.17, 1, 10]} />
            <meshStandardMaterial color="#7fa84e" roughness={0.85} />
          </mesh>
          {[0, 1, 2].map((j) => (
            <group key={j} position={[0, 0.95, 0]} rotation={[0, j * 2.1 + k, 0]}>
              <mesh>
                <BananaLeafGeo len={1.1} width={0.4} lift={1.1} droop={0.15} color="#6fb043" />
                <meshStandardMaterial vertexColors roughness={0.75} side={2} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

/** เครือกล้วย: ก้านเครือโค้งออกแล้วห้อยลง หวีกล้วยผลงอนขึ้นเรียงเป็นชั้น ปลายก้านยาวมีหัวปลีสีแดงรูปหัวใจ กาบเปิดเล็กน้อย */
function Bunch({ yaw, ripe, topY }: { yaw: number; ripe: boolean; topY: number }) {
  const fruit = ripe ? '#f4cf3a' : '#9cc44a'
  const tip = ripe ? '#7a8a3a' : '#5a7a2a'
  return (
    <group position={[0, topY, 0]} rotation={[0, yaw, 0]}>
      {/* ก้านเครือโค้งออก */}
      <mesh position={[0, 0.02, 0.3]} rotation={[1.05, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.62, 8]} />
        <meshStandardMaterial color="#6a8a3a" />
      </mesh>
      <group position={[0, -0.18, 0.55]}>
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.03, 0.035, 1.1, 8]} />
          <meshStandardMaterial color="#6a8a3a" />
        </mesh>
        {/* หวีกล้วย 5 ชั้น ผลงอนชี้ขึ้น */}
        {[0, 1, 2, 3, 4].map((h) => (
          <group key={h} position={[0, -0.04 - h * 0.15, 0]} rotation={[0, h * 0.55, 0]}>
            {Array.from({ length: 9 }).map((_, k) => (
              <group key={k} rotation={[0, (k / 9) * Math.PI * 2, 0]}>
                <group position={[0, 0, 0.07]} rotation={[0.55, 0, 0]}>
                  <mesh position={[0, 0.08, 0]} castShadow>
                    <capsuleGeometry args={[0.034 - h * 0.003, 0.15 - h * 0.012, 3, 6]} />
                    <meshStandardMaterial color={fruit} roughness={0.55} />
                  </mesh>
                  <mesh position={[0, 0.18 - h * 0.006, 0.01]}>
                    <sphereGeometry args={[0.012, 5, 4]} />
                    <meshStandardMaterial color={tip} />
                  </mesh>
                </group>
              </group>
            ))}
          </group>
        ))}
        {/* หัวปลี: ทรงหัวใจปลายแหลมชี้ลง สีแดงเข้ม + กาบเปิด 2 กาบ */}
        <group position={[0, -1.12, 0]}>
          <mesh position={[0, 0.02, 0]} scale={[1, 1.15, 1]} castShadow>
            <sphereGeometry args={[0.1, 12, 10]} />
            <meshStandardMaterial color="#a8203a" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.12, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.095, 0.2, 12]} />
            <meshStandardMaterial color="#a8203a" roughness={0.5} />
          </mesh>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[sd * 0.07, 0.06, 0.02]} rotation={[0, 0, sd * 0.7]}>
              <sphereGeometry args={[0.08, 8, 6, 0, Math.PI, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#6e1e3a" roughness={0.6} side={2} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

/**
 * ใบกล้วยแบบโค้ง: ยาวตามแกน +z ยกขึ้นแล้วปลายตกลง (droop) พับตรงกลางเป็นรูปตัว V
 * ใช้สีตามจุดยอด: ก้านกลางใบสีอ่อน ขอบใบเข้มขึ้น
 */
function BananaLeafGeo({ len, width, lift, droop, color }: { len: number; width: number; lift: number; droop: number; color: string }) {
  const geom = useMemo(() => {
    const N = 12
    const pos: number[] = []
    const col: number[] = []
    const idx: number[] = []
    const base = new Color(color)
    const mid = base.clone().lerp(new Color('#e8f0b8'), 0.45)
    const edge = base.clone().multiplyScalar(0.82)
    // ก้านใบ (ส่วนแรก) แคบ แล้วแผ่นใบรียาว
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const z = t * len
      const y = Math.sin(t * Math.PI * 0.6) * lift * len * 0.5 - droop * t * t * len * 0.35
      const blade = t < 0.12 ? 0.08 : Math.pow(Math.sin(((t - 0.12) / 0.88) * Math.PI), 0.55)
      const w = width * Math.max(0.06, blade)
      const fold = w * 0.18
      // ซ้าย · กลาง · ขวา
      pos.push(-w, y + fold, z, 0, y, z, w, y + fold, z)
      col.push(edge.r, edge.g, edge.b, mid.r, mid.g, mid.b, edge.r, edge.g, edge.b)
      if (i < N) {
        const a = i * 3
        const b = a + 3
        idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2)
      }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    g.setAttribute('color', new Float32BufferAttribute(col, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [len, width, lift, droop, color])
  return <primitive object={geom} attach="geometry" />
}
