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
  const leaves = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => ({
        yaw: (i / 7) * Math.PI * 2 + r(i) * 0.6,
        len: 1.7 + r(i + 10) * 0.6,
        lift: 0.35 + r(i + 20) * 0.45,
        droop: 0.5 + r(i + 30) * 0.7,
        color: i % 3 === 0 ? '#7cbf4e' : i % 3 === 1 ? '#6aae45' : '#5d9e3e',
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  )
  const hasBunch = r(99) > 0.4
  const H = 2.3
  return (
    <group>
      {/* ลำต้นเทียม: กาบใบซ้อนกัน โคนป่อง */}
      <mesh position={[0, H / 2, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.22, H, 14]} />
        <meshStandardMaterial color="#8db35a" roughness={0.85} />
      </mesh>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[0, 0.5 + k * 0.45, 0]} rotation={[0, k * 2.1, 0]} castShadow>
          <cylinderGeometry args={[0.2 - k * 0.025, 0.235 - k * 0.025, 0.9, 14, 1, true, 0, Math.PI * 1.1]} />
          <meshStandardMaterial color={k === 0 ? '#7a8a48' : '#9cbf68'} roughness={0.9} side={2} />
        </mesh>
      ))}
      {/* กาบแห้งสีน้ำตาลที่โคน */}
      <mesh position={[0.05, 0.35, 0.02]} rotation={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.235, 0.25, 0.6, 12, 1, true, 0, Math.PI * 0.7]} />
        <meshStandardMaterial color="#8a6a3e" roughness={1} side={2} />
      </mesh>
      {/* ใบ */}
      {leaves.map((l, i) => (
        <group key={i} position={[0, H - 0.05, 0]} rotation={[0, l.yaw, 0]}>
          <mesh castShadow>
            <BananaLeafGeo len={l.len} width={0.42} lift={l.lift} droop={l.droop} color={l.color} />
            <meshStandardMaterial vertexColors roughness={0.75} side={2} />
          </mesh>
        </group>
      ))}
      {/* ใบอ่อนม้วนตั้งตรงกลางยอด */}
      <mesh position={[0, H + 0.35, 0]} rotation={[0.1, 0, 0.05]}>
        <cylinderGeometry args={[0.025, 0.05, 0.75, 8]} />
        <meshStandardMaterial color="#a8d36a" roughness={0.7} />
      </mesh>
      {/* ใบแก่แห้งห้อยลงข้างต้น */}
      <group position={[0, H - 0.25, 0]} rotation={[0, r(50) * 6, 0]}>
        <mesh>
          <BananaLeafGeo len={1.2} width={0.28} lift={-0.2} droop={1.6} color="#9a7a46" />
          <meshStandardMaterial vertexColors roughness={1} side={2} />
        </mesh>
      </group>
      {/* เครือกล้วย + หัวปลี */}
      {hasBunch && <Bunch yaw={r(60) * 6} ripe={r(61) > 0.6} topY={H - 0.1} />}
      {/* หน่อกล้วยที่โคน */}
      {[0, 1].map((k) => (
        <group key={k} position={[Math.cos(k * 2.6 + r(70)) * 0.45, 0, Math.sin(k * 2.6 + r(70)) * 0.45]} scale={0.32 + k * 0.08}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.1, 0.17, 0.9, 10]} />
            <meshStandardMaterial color="#8db35a" roughness={0.85} />
          </mesh>
          {[0, 1, 2].map((j) => (
            <group key={j} position={[0, 0.85, 0]} rotation={[0, j * 2.1, 0]}>
              <mesh>
                <BananaLeafGeo len={0.9} width={0.3} lift={0.5} droop={0.3} color="#7cbf4e" />
                <meshStandardMaterial vertexColors roughness={0.75} side={2} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

/** เครือกล้วย: ก้านเครือโค้งลง หวีกล้วยเรียงเป็นชั้น ปลายมีหัวปลีสีม่วงแดง */
function Bunch({ yaw, ripe, topY }: { yaw: number; ripe: boolean; topY: number }) {
  const fruit = ripe ? '#f2cf45' : '#8cbf4a'
  return (
    <group position={[0, topY, 0]} rotation={[0, yaw, 0]}>
      {/* ก้านเครือ */}
      <mesh position={[0, -0.05, 0.28]} rotation={[0.9, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.035, 0.6, 8]} />
        <meshStandardMaterial color="#6a8a3a" />
      </mesh>
      <group position={[0, -0.25, 0.48]}>
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
          <meshStandardMaterial color="#6a8a3a" />
        </mesh>
        {/* หวีกล้วย 4 ชั้น */}
        {[0, 1, 2, 3].map((h) => (
          <group key={h} position={[0, -0.05 - h * 0.17, 0]} rotation={[0, h * 0.6, 0]}>
            {Array.from({ length: 7 }).map((_, k) => (
              <group key={k} rotation={[0, (k / 7) * Math.PI * 2, 0]}>
                <mesh position={[0, 0.02, 0.1]} rotation={[-0.75, 0, 0]} castShadow>
                  <capsuleGeometry args={[0.028 - h * 0.002, 0.14 - h * 0.012, 3, 6]} />
                  <meshStandardMaterial color={fruit} roughness={0.6} />
                </mesh>
              </group>
            ))}
          </group>
        ))}
        {/* หัวปลี */}
        <mesh position={[0, -0.9, 0]} scale={[1, 1.6, 1]} castShadow>
          <sphereGeometry args={[0.085, 12, 10]} />
          <meshStandardMaterial color="#7a2a48" roughness={0.6} />
        </mesh>
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
