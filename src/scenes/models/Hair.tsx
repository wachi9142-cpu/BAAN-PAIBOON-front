import { useEffect, useMemo } from 'react'
import { CatmullRomCurve3, Quaternion, TubeGeometry, Vector3 } from 'three'
import type { Appearance } from '../../game/content/appearance'

/** ทรงผม — พิกัดเดียวกับหัวของ Character (หัวกลางที่ y 1.57, รัศมี 0.17, หน้าไปทาง +z) */
export function Hair({ style, color }: { style: Appearance['hairStyle']; color: string }) {
  const mat = <meshStandardMaterial color={color} />
  const cap = (
    <mesh position={[0, 1.62, -0.01]} castShadow>
      {/* ขอบผมด้านหน้าสูงกว่าคิ้ว (คิ้วโผล่ทุกทรง) */}
      <sphereGeometry args={[0.18, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2.12]} />
      {mat}
    </mesh>
  )
  /** หน้าม้า */
  const bangs = (
    <mesh position={[0, 1.62, -0.01]}>
      <sphereGeometry args={[0.188, 28, 10, Math.PI / 2 - 0.75, 1.5, Math.PI * 0.28, Math.PI * 0.19]} />
      <meshStandardMaterial color={color} side={2} />
    </mesh>
  )
  /** ผมยาวด้านหลัง */
  const longBack = (h = 0.46) => (
    <group>
      <mesh position={[0, 1.67 - h / 2, -0.015]} castShadow>
        <cylinderGeometry args={[0.183, 0.2, h, 28, 1, true, Math.PI * 0.3, Math.PI * 1.4]} />
        <meshStandardMaterial color={color} side={2} />
      </mesh>
      {/* ชั้นใน ให้ผมดูหนา ไม่เห็นเป็นแผ่นบาง */}
      <mesh position={[0, 1.67 - h / 2, -0.015]}>
        <cylinderGeometry args={[0.17, 0.185, h, 28, 1, true, Math.PI * 0.3, Math.PI * 1.4]} />
        <meshStandardMaterial color={color} side={2} />
      </mesh>
    </group>
  )
  switch (style) {
    case 'buzz':
      return (
        <mesh position={[0, 1.6, -0.01]}>
          <sphereGeometry args={[0.175, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
          {mat}
        </mesh>
      )
    case 'short':
      return (
        <group>
          {cap}
          <mesh position={[0, 1.6, -0.06]}>
            <boxGeometry args={[0.34, 0.16, 0.24]} />
            {mat}
          </mesh>
        </group>
      )
    case 'curly':
      // หยิกสั้น: ก้อนกลมหลายก้อนรอบหัว
      return (
        <group>
          {cap}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.sin(a) * 0.16, 1.66 + (i % 2) * 0.04, Math.cos(a) * 0.14 - 0.02]} castShadow>
                <sphereGeometry args={[0.06, 14, 10]} />
                {mat}
              </mesh>
            )
          })}
        </group>
      )
    case 'bob':
      return (
        <group>
          {cap}
          <mesh position={[0, 1.53, -0.04]} castShadow>
            <cylinderGeometry args={[0.2, 0.21, 0.2, 12, 1, true, Math.PI * 0.15, Math.PI * 1.7]} />
            <meshStandardMaterial color={color} side={2} />
          </mesh>
        </group>
      )
    case 'long':
      return (
        <group>
          {cap}
          {longBack()}
        </group>
      )
    case 'longbangs':
      return (
        <group>
          {cap}
          {bangs}
          {longBack(0.52)}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.16, 1.5, 0.02]}>
              <boxGeometry args={[0.05, 0.3, 0.1]} />
              {mat}
            </mesh>
          ))}
        </group>
      )
    case 'wavy':
      // ยาวลอน: เส้นผมหยักเป็นลอนทีละเส้น (แบบเส้นมาม่า) รอบหลังและข้างหัว
      return (
        <group>
          {cap}
          {/* ชั้นในสีเข้มกว่า ไม่ให้มองทะลุช่องระหว่างเส้น */}
          <mesh position={[0, 1.67 - 0.24, -0.015]}>
            <cylinderGeometry args={[0.172, 0.19, 0.48, 28, 1, true, Math.PI * 0.3, Math.PI * 1.4]} />
            <meshStandardMaterial color={darken(color)} side={2} />
          </mesh>
          <WavyStrands color={color} />
        </group>
      )
    case 'bun':
      return (
        <group>
          {cap}
          <mesh position={[0, 1.72, -0.14]} castShadow>
            <sphereGeometry args={[0.09, 14, 10]} />
            {mat}
          </mesh>
        </group>
      )
    case 'sidebuns':
      return (
        <group>
          {cap}
          {bangs}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.14, 1.75, -0.05]} castShadow>
              <sphereGeometry args={[0.075, 14, 10]} />
              {mat}
            </mesh>
          ))}
        </group>
      )
    case 'halfup':
      return (
        <group>
          {cap}
          {longBack(0.4)}
          <mesh position={[0, 1.66, -0.19]} castShadow>
            <sphereGeometry args={[0.06, 14, 10]} />
            {mat}
          </mesh>
        </group>
      )
    case 'ponytail':
      // หางม้า: รวบสูงด้านหลัง ยางรัด แล้วทิ้งตัวโค้งลงมา ปลายเรียว
      return (
        <group>
          {cap}
          <Lock color={color} tie="#e58fa0" r0={0.062} r1={0.022} points={[[0, 1.66, -0.17], [0, 1.65, -0.24], [0, 1.54, -0.26], [0, 1.4, -0.23], [0, 1.3, -0.2]]} />
        </group>
      )
    case 'twintails':
      return (
        <group>
          {cap}
          {bangs}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.2, 1.5, -0.06]} rotation={[0.1, 0, s * 0.25]} castShadow>
              <coneGeometry args={[0.06, 0.38, 14]} />
              {mat}
            </mesh>
          ))}
        </group>
      )
    case 'braid':
      // เปียหลัง: ถักกลางหลัง
      return (
        <group>
          {cap}
          <Lock color={color} braided tie="#c0392b" r0={0.05} r1={0.03} points={[[0, 1.6, -0.16], [0, 1.5, -0.21], [0, 1.36, -0.21], [0, 1.2, -0.19]]} />
        </group>
      )
    case 'sidebraid':
      // เปียข้างเดียว: รวบข้างขวา พาดไหล่ลงมาด้านหน้า
      return (
        <group>
          {cap}
          {bangs}
          <Lock color={color} braided tie="#e58fa0" r0={0.052} r1={0.03} points={[[0.13, 1.56, -0.08], [0.17, 1.44, 0.0], [0.17, 1.32, 0.12], [0.15, 1.2, 0.17]]} />
        </group>
      )
    case 'topknot':
      // ผมจุก: ผมสั้นเกรียน + จุกกลมบนกลางหัว มัดด้วยดอกไม้
      return (
        <group>
          <mesh position={[0, 1.6, -0.01]}>
            <sphereGeometry args={[0.176, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
            {mat}
          </mesh>
          <mesh position={[0, 1.79, -0.01]} castShadow>
            <sphereGeometry args={[0.065, 14, 10]} />
            {mat}
          </mesh>
          <mesh position={[0, 1.745, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.045, 0.014, 6, 12]} />
            <meshStandardMaterial color="#f2f0e6" />
          </mesh>
        </group>
      )
    case 'highbun':
      // มวยสูงกลางหัว + ยางรัดผมสีชมพู
      return (
        <group>
          {cap}
          {bangs}
          <mesh position={[0, 1.82, -0.03]} castShadow>
            <sphereGeometry args={[0.085, 14, 10]} />
            {mat}
          </mesh>
          <mesh position={[0, 1.76, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.05, 0.016, 6, 12]} />
            <meshStandardMaterial color="#e58fa0" />
          </mesh>
        </group>
      )
    case 'bobbles':
      // แกละสองข้าง ผูกลูกบอลสีแดง ปลายผมยาวลอน
      return (
        <group>
          {cap}
          {bangs}
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.15, 1.7, -0.02]}>
                <sphereGeometry args={[0.035, 14, 10]} />
                <meshStandardMaterial color="#d9473a" />
              </mesh>
              {[0, 1, 2, 3].map((j) => (
                <mesh key={j} position={[s * (0.2 + (j % 2) * 0.025), 1.64 - j * 0.08, -0.02]} castShadow>
                  <sphereGeometry args={[0.055 - j * 0.004, 14, 10]} />
                  {mat}
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )
    case 'shaggy':
      // ผมสั้นซอยยุ่ง ๆ: ปอยแหลมรอบหัว
      return (
        <group>
          {cap}
          {Array.from({ length: 11 }).map((_, i) => {
            const a = (i / 11) * Math.PI * 2
            return (
              <mesh
                key={i}
                position={[Math.sin(a) * 0.15, 1.7 + Math.cos(i * 1.7) * 0.03, Math.cos(a) * 0.15 - 0.01]}
                rotation={[Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9]}
              >
                <coneGeometry args={[0.04, 0.12, 4]} />
                {mat}
              </mesh>
            )
          })}
          <mesh position={[0.03, 1.7, 0.14]} rotation={[0.6, 0, -0.4]}>
            <coneGeometry args={[0.04, 0.14, 4]} />
            {mat}
          </mesh>
        </group>
      )
    case 'fluffy':
      // ผมหยิกฟูยาวประบ่า: ก้อนกลมใหญ่รอบหัว
      return (
        <group>
          {cap}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2
            if (Math.cos(a) > 0.75) return null
            return (
              <mesh key={i} position={[Math.sin(a) * 0.19, 1.62, Math.cos(a) * 0.17 - 0.03]} castShadow>
                <sphereGeometry args={[0.075, 14, 10]} />
                {mat}
              </mesh>
            )
          })}
          {[-1, 0, 1].flatMap((x) =>
            [0, 1].map((j) => (
              <mesh key={x + 's' + j} position={[x * 0.12, 1.47 - j * 0.09, -0.12 + Math.abs(x) * 0.05]} castShadow>
                <sphereGeometry args={[0.07, 14, 10]} />
                {mat}
              </mesh>
            )),
          )}
        </group>
      )
    case 'crownbraid':
      // เปียมงกุฎ: เปียวงรอบหัว + โบว์แดงด้านบน
      return (
        <group>
          {cap}
          {bangs}
          {Array.from({ length: 14 }).map((_, i) => {
            const a = (i / 14) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.sin(a) * 0.165, 1.69, Math.cos(a) * 0.155 - 0.01]}>
                <sphereGeometry args={[0.038, 14, 10]} />
                {mat}
              </mesh>
            )
          })}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.05, 1.79, 0.02]} rotation={[0, 0, s * 0.5]}>
              <boxGeometry args={[0.07, 0.045, 0.03]} />
              <meshStandardMaterial color="#c0392b" />
            </mesh>
          ))}
        </group>
      )
    case 'hime':
      // ผมยาวตรง หน้าม้าตรง + ปอยข้างแก้มตัดเสมอ
      return (
        <group>
          {cap}
          <mesh position={[0, 1.68, 0.13]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[0.32, 0.09, 0.06]} />
            {mat}
          </mesh>
          {longBack(0.6)}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.165, 1.5, 0.05]}>
              <boxGeometry args={[0.05, 0.24, 0.08]} />
              {mat}
            </mesh>
          ))}
        </group>
      )
    case 'sideponytail':
      // หางม้าข้าง: ปัดผมไปข้างหนึ่ง รวบต่ำข้างหู ทิ้งลงมาด้านหน้าไหล่
      return (
        <group>
          {cap}
          <Lock color={color} tie="#f6d36b" r0={0.056} r1={0.02} points={[[0.14, 1.54, -0.06], [0.18, 1.46, 0.0], [0.18, 1.34, 0.11], [0.16, 1.22, 0.17]]} />
        </group>
      )
    case 'twinbraids':
      // เปียสองข้าง: ถักจากหลังหูทั้งสองข้าง พาดไหล่ลงมาด้านหน้า
      return (
        <group>
          {cap}
          {bangs}
          {([-1, 1] as const).map((k) => (
            <Lock
              key={k}
              color={color}
              braided
              tie="#e58fa0"
              r0={0.046}
              r1={0.028}
              points={[[k * 0.13, 1.56, -0.08], [k * 0.17, 1.45, -0.01], [k * 0.17, 1.33, 0.11], [k * 0.155, 1.21, 0.16]]}
            />
          ))}
        </group>
      )
  }
}

/** เส้นผมหยักทีละเส้น: ไล่จากใต้ขอบผมด้านบนลงไปถึงกลางหลัง ปลายบานออกเล็กน้อย */
function WavyStrands({ color }: { color: string }) {
  const geoms = useMemo(() => {
    const out: TubeGeometry[] = []
    const n = 30
    for (let k = 0; k < n; k++) {
      // มุมรอบหัว: เว้นด้านหน้าไว้ให้เห็นหน้า (0 = หน้า, π = หลัง)
      const a = Math.PI * 0.36 + (k / (n - 1)) * Math.PI * 1.28
      const back = Math.abs(Math.cos(a)) * (Math.cos(a) < 0 ? 1 : 0)
      const len = 0.36 + back * 0.16
      const phase = k * 1.3
      const pts: Vector3[] = []
      for (let t = 0; t <= 1.0001; t += 1 / 20) {
        const wave = Math.sin(t * Math.PI * 7 + phase) * 0.016 * (0.3 + t)
        const r = 0.184 + t * 0.03 + wave
        const aa = a + Math.cos(t * Math.PI * 7 + phase) * 0.05 * t
        pts.push(new Vector3(Math.sin(aa) * r, 1.66 - t * len, Math.cos(aa) * r - 0.015))
      }
      out.push(new TubeGeometry(new CatmullRomCurve3(pts), 48, 0.015, 6, false))
    }
    return out
  }, [])
  // คืนหน่วยความจำเมื่อเปลี่ยนทรงผม
  useEffect(() => () => geoms.forEach((g) => g.dispose()), [geoms])
  return (
    <group>
      {geoms.map((g, k) => (
        <mesh key={k} geometry={g} castShadow>
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

/** สีผมชั้นใน: เข้มกว่าเล็กน้อย */
function darken(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.round(v * 0.75).toString(16).padStart(2, '0')
  return '#' + c((n >> 16) & 255) + c((n >> 8) & 255) + c(n & 255)
}

/**
 * ปอยผมโค้งต่อเนื่อง (หางม้า / เปีย): วางทรงรีเรียงตามเส้นโค้ง ค่อย ๆ เรียวลง
 * braided = ทำเป็นลอนถักสลับซ้าย-ขวา · tie = สียางรัดผมที่ต้นปอย (และปลายเปีย)
 */
function Lock({
  points,
  color,
  r0,
  r1,
  braided = false,
  tie,
}: {
  points: [number, number, number][]
  color: string
  r0: number
  r1: number
  braided?: boolean
  tie?: string
}) {
  const key = JSON.stringify(points)
  const parts = useMemo(() => {
    const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)))
    const n = braided ? 9 : 14
    const up = new Vector3(0, 1, 0)
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1)
      const p = curve.getPointAt(t)
      const tan = curve.getTangentAt(t)
      const q = new Quaternion().setFromUnitVectors(up, tan)
      const r = r0 + (r1 - r0) * t
      return { p: p.toArray() as [number, number, number], q: q.toArray() as [number, number, number, number], r, side: i % 2 ? 1 : -1 }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, r0, r1, braided])
  const first = parts[0]
  const last = parts[parts.length - 1]
  return (
    <group>
      {parts.map((pt, i) => (
        <group key={i} position={pt.p} quaternion={pt.q}>
          {braided ? (
            // ลอนถัก: ทรงรีเอียงสลับข้าง
            <mesh position={[pt.side * pt.r * 0.25, 0, 0]} rotation={[0, 0, pt.side * 0.45]} scale={[1.15, 1.35, 0.9]} castShadow>
              <sphereGeometry args={[pt.r, 14, 10]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ) : (
            <mesh scale={[1, 1.6, 1]} castShadow>
              <sphereGeometry args={[pt.r, 14, 10]} />
              <meshStandardMaterial color={color} />
            </mesh>
          )}
        </group>
      ))}
      {tie && (
        <group position={first.p} quaternion={first.q}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[first.r * 0.85, 0.012, 8, 16]} />
            <meshStandardMaterial color={tie} />
          </mesh>
        </group>
      )}
      {braided && (
        <group position={last.p} quaternion={last.q}>
          {tie && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[last.r * 0.9, 0.01, 8, 14]} />
              <meshStandardMaterial color={tie} />
            </mesh>
          )}
          {/* ปลายเปียบานเล็กน้อย */}
          <mesh position={[0, -last.r * 1.6, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[last.r * 1.1, last.r * 2.4, 14]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      )}
    </group>
  )
}
