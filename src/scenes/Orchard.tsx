import { useLayoutEffect, useMemo, useRef } from 'react'
import { NearLabel } from './NearLabel'
import { Windy } from './Wind'
import { Color, Object3D, SphereGeometry, type InstancedMesh } from 'three'

/* ───────── ต้นมัลเบอร์รี่ (ปลูกลงดิน ไม่มีกระถาง) + สวนมะม่วงหลายพันธุ์ ───────── */

/**
 * ต้นมัลเบอร์รี่แบบพุ่มเตี้ยปลูกลงดิน: กิ่งตั้งหลายกิ่งจากโคน ใบใหญ่ขอบหยักสีเขียวสด
 * ลูกยาวรีเป็นช่อห้อยตามข้อกิ่ง สุกแดงเข้ม-ม่วงดำ
 */
export function MulberryBush({ seed, s = 1 }: { seed: number; s?: number }) {
  const stems = useMemo(
    () =>
      Array.from({ length: 5 }, (_, k) => {
        const a = k * 1.3 + seed
        return { a, tilt: 0.12 + (k % 3) * 0.08, h: 0.85 + ((k * 7 + seed) % 4) * 0.1 }
      }),
    [seed],
  )
  return (
    <group scale={s}>
      {/* ดินพูนโคนต้น */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 18]} />
        <meshStandardMaterial color="#5a4030" roughness={1} />
      </mesh>
      {stems.map(({ a, tilt, h }, k) => (
        <group key={k} rotation={[Math.sin(a) * tilt, 0, -Math.cos(a) * tilt]}>
          <mesh position={[0, h / 2, 0]}>
            <cylinderGeometry args={[0.012, 0.022, h, 5]} />
            <meshStandardMaterial color="#6a8a3a" />
          </mesh>
          {/* ใบใหญ่ตามข้อ หมุนรอบกิ่ง */}
          {Array.from({ length: 6 }, (_, j) => {
            const y = 0.25 + (j / 5) * (h - 0.2)
            const b = j * 2.4 + k
            return (
              <group key={j} position={[0, y, 0]} rotation={[0, b, 0]}>
                <mesh position={[0.15, 0.02, 0]} rotation={[0, 0, 0.35]} scale={[1, 0.12, 0.72]} castShadow>
                  <sphereGeometry args={[0.15, 9, 6]} />
                  <meshStandardMaterial color={j % 2 ? '#6aa83a' : '#7cb844'} roughness={0.8} />
                </mesh>
              </group>
            )
          })}
          {/* ช่อลูกหม่อนห้อยใต้ใบ */}
          {[0.45, 0.7].map((y, j) => (
            <group key={'b' + j} position={[0, y * h, 0]} rotation={[0, k + j * 2, 0]}>
              {[0, 1, 2].map((q) => (
                <mesh key={q} position={[0.07 + q * 0.025, -0.04 - q * 0.03, (q - 1) * 0.035]} scale={[0.7, 1.7, 0.7]}>
                  <sphereGeometry args={[0.035, 8, 6]} />
                  <meshStandardMaterial color={q === 2 ? '#a8203a' : q === 1 ? '#5a1830' : '#2a0e1c'} roughness={0.45} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

export type MangoVariety = 'r2e2' | 'ndm-purple' | 'khiew' | 'ndm-gold' | 'giant' | 'big-green' | 'green'
export const MANGO_NAMES: Record<MangoVariety, string> = {
  r2e2: 'มะม่วงอาร์ทูอีทู',
  'ndm-purple': 'มะม่วงน้ำดอกไม้สีม่วง',
  khiew: 'มะม่วงเขียวเสวย',
  'ndm-gold': 'มะม่วงน้ำดอกไม้สีทอง',
  giant: 'มะม่วงยักษ์',
  'big-green': 'มะม่วงเขียวใหญ่',
  green: 'ต้นมะม่วง',
}
const FRUIT: Record<MangoVariety, { color: string; blush: string; r: number; sc: [number, number, number]; stalk: number; cap?: string }> = {
  giant: { color: '#7a9a44', blush: '#8aa64a', r: 0.23, sc: [0.85, 1.45, 0.8], stalk: 0.4, cap: '#b03a4a' }, // ลูกยักษ์ บนแดง-ล่างเขียว มีจุดขาว
  green: { color: '#6e9e3c', blush: '#7aa844', r: 0.14, sc: [0.82, 1.35, 0.8], stalk: 0.26 }, // มะม่วงบ้านทั่วไป: ลูกเขียวล้วน
  'big-green': { color: '#6a9a3a', blush: '#7aa844', r: 0.21, sc: [0.85, 1.45, 0.8], stalk: 0.3 }, // ลูกใหญ่สีเขียวเข้ม
  r2e2: { color: '#c8d098', blush: '#e8a8b0', r: 0.2, sc: [1, 1.05, 0.95], stalk: 0.22 }, // ลูกใหญ่กลม เขียวอมชมพู
  'ndm-purple': { color: '#9a5a9a', blush: '#c88ac0', r: 0.13, sc: [0.8, 1.3, 0.8], stalk: 0.38 }, // ลูกม่วงรี ห้อยก้านยาว
  khiew: { color: '#6a9a3a', blush: '#8ab04a', r: 0.14, sc: [0.8, 1.35, 0.8], stalk: 0.25 },
  'ndm-gold': { color: '#e8c040', blush: '#f0d060', r: 0.14, sc: [0.8, 1.35, 0.8], stalk: 0.28 },
}

/**
 * ต้นมะม่วง (ปรับให้เป็นธรรมชาติ): ลำต้นหนาเอียงนิด ๆ แตกเป็นกิ่งใหญ่ 3 กิ่ง + กิ่งรอง
 * ทรงพุ่มไม่กลม: ก้อนใบหลายก้อนตามปลายกิ่ง + ใบเรียวแหลมเป็นกระจุกยื่นออกนอกพุ่ม (วาดแบบ instancing ไม่หน่วง)
 * ลูกใหญ่ ห้อยพ้นพุ่มให้เห็นชัด · สีตามพันธุ์ + ลูกสุกเหลือง-ส้มปนราว 1 ใน 3
 */
/** ripe = มีลูกสุกเหลือง-ส้มปน (บ้านฟ่าง บ้านน้าโรจน์ บ้านแม่ฉัตร) · บ้านอื่นลูกเขียวล้วน */
export function MangoTree({ variety, seed, ripe: hasRipe = true }: { variety: MangoVariety; seed: number; ripe?: boolean }) {
  const f = FRUIT[variety]
  const rnd = useMemo(() => {
    let t = Math.floor(seed * 1000) + 7
    return () => {
      t = (t * 16807) % 2147483647
      return (t - 1) / 2147483646
    }
  }, [seed])
  // กิ่งใหญ่ 3 กิ่ง: มุมรอบต้น + ปลายกิ่ง
  const limbs = useMemo(
    () =>
      [0, 1, 2].map((k) => {
        const a = k * 2.1 + seed + rnd() * 0.5
        const tilt = 0.55 + rnd() * 0.25
        const len = 1.8 + rnd() * 0.5
        const base: [number, number, number] = [0, 2.1, 0]
        const tip: [number, number, number] = [Math.sin(a) * Math.sin(tilt) * len, 2.1 + Math.cos(tilt) * len, Math.cos(a) * Math.sin(tilt) * len]
        return { a, tilt, len, base, tip }
      }),
    [seed, rnd],
  )
  // ก้อนใบ: รอบปลายกิ่งแต่ละกิ่ง 2 ก้อน + ยอดกลาง 1
  const blobs = useMemo(() => {
    const out: [number, number, number, number][] = [[0, 4.3, 0, 0.8]]
    for (const l of limbs)
      for (let j = 0; j < 2; j++) out.push([l.tip[0] * (1 + j * 0.25) + (rnd() - 0.5) * 0.5, l.tip[1] + 0.15 + j * 0.25, l.tip[2] * (1 + j * 0.25) + (rnd() - 0.5) * 0.5, 0.6 + rnd() * 0.25])
    return out
  }, [limbs, rnd])
  // กระจุกใบเรียวแหลม (instanced)
  const leafGeo = useMemo(() => {
    const g = new SphereGeometry(0.3, 6, 4)
    g.scale(0.28, 0.07, 1)
    g.translate(0, 0, 0.26)
    return g
  }, [])
  const leaves = useRef<InstancedMesh>(null)
  const LEAF_N = 72
  useLayoutEffect(() => {
    const m = leaves.current
    if (!m) return
    const o = new Object3D()
    const c = new Color()
    for (let i = 0; i < LEAF_N; i++) {
      const b = blobs[i % blobs.length]
      // กระจุกบนผิวก้อนใบ ยื่นออกไปด้านนอก
      const u = rnd() * Math.PI * 2
      const v = rnd() * Math.PI * 0.75
      const r = b[3] * 0.95
      o.position.set(b[0] + Math.sin(v) * Math.cos(u) * r, b[1] + Math.cos(v) * r * 0.7, b[2] + Math.sin(v) * Math.sin(u) * r)
      o.rotation.set(-0.5 + rnd() * 0.6, u + Math.PI / 2 + (rnd() - 0.5) * 0.8, (rnd() - 0.5) * 0.6)
      o.scale.setScalar(0.85 + rnd() * 0.5)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      m.setColorAt(i, c.set(i % 3 === 0 ? '#6aa844' : i % 3 === 1 ? '#4f8f36' : '#5c9c3c'))
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [blobs, rnd])
  // ลูกมะม่วง (instanced): ห้อยใต้/ข้างก้อนใบ ให้พ้นพุ่ม
  const fruitRef = useRef<InstancedMesh>(null)
  const stalkRef = useRef<InstancedMesh>(null)
  const capRef = useRef<InstancedMesh>(null)
  const FRUIT_N = 14
  useLayoutEffect(() => {
    const fm = fruitRef.current
    const sm = stalkRef.current
    const cm = capRef.current
    if (!fm || !sm) return
    const o = new Object3D()
    const c = new Color()
    for (let i = 0; i < FRUIT_N; i++) {
      const b = blobs[1 + (i % (blobs.length - 1))]
      const u = rnd() * Math.PI * 2
      const r = b[3] * (0.75 + rnd() * 0.3)
      const x = b[0] + Math.cos(u) * r
      const z = b[2] + Math.sin(u) * r
      const top = b[1] - b[3] * 0.35
      const ripe = hasRipe && i % 3 === 1
      // ก้าน
      o.position.set(x, top - f.stalk / 2, z)
      o.rotation.set(0, 0, 0)
      o.scale.set(1, f.stalk, 1)
      o.updateMatrix()
      sm.setMatrixAt(i, o.matrix)
      // ลูก
      const fy = top - f.stalk - f.r * f.sc[1] * 0.85
      o.position.set(x, fy, z)
      o.rotation.set((rnd() - 0.5) * 0.25, rnd() * 3, (rnd() - 0.5) * 0.25)
      o.scale.set(f.sc[0] * f.r, f.sc[1] * f.r, f.sc[2] * f.r)
      o.updateMatrix()
      fm.setMatrixAt(i, o.matrix)
      fm.setColorAt(i, c.set(ripe ? (i % 2 ? '#f4b82e' : '#f0a030') : i % 4 === 0 ? f.blush : f.color))
      if (cm) {
        // ครึ่งบนสีแดง (มะม่วงยักษ์) — ลูกสุกไม่มี
        o.scale.set(f.sc[0] * f.r * 1.02, f.sc[1] * f.r * 1.01, f.sc[2] * f.r * 1.02)
        if (ripe) o.scale.setScalar(0)
        o.updateMatrix()
        cm.setMatrixAt(i, o.matrix)
      }
    }
    fm.instanceMatrix.needsUpdate = true
    sm.instanceMatrix.needsUpdate = true
    if (fm.instanceColor) fm.instanceColor.needsUpdate = true
    if (cm) cm.instanceMatrix.needsUpdate = true
  }, [blobs, rnd, f, hasRipe])
  return (
    <group>
      {/* ลำต้นหนา เอียงนิด ๆ */}
      <mesh position={[0, 1.08, 0]} rotation={[0.03, 0, 0.025]} castShadow>
        <cylinderGeometry args={[0.2, 0.32, 2.2, 9]} />
        <meshStandardMaterial color="#6a5040" roughness={0.95} />
      </mesh>
      {/* รากแผ่โคนต้น */}
      {[0, 1.6, 3.3, 4.8].map((a) => (
        <mesh key={a} position={[Math.sin(a + seed) * 0.25, 0.08, Math.cos(a + seed) * 0.25]} rotation={[Math.cos(a + seed) * 1.1, 0, -Math.sin(a + seed) * 1.1]}>
          <cylinderGeometry args={[0.05, 0.1, 0.45, 5]} />
          <meshStandardMaterial color="#5e4636" />
        </mesh>
      ))}
      {/* กิ่งใหญ่ + กิ่งรอง */}
      {limbs.map((l, k) => (
        <group key={k}>
          <mesh position={[(l.base[0] + l.tip[0]) / 2, (l.base[1] + l.tip[1]) / 2, (l.base[2] + l.tip[2]) / 2]} rotation={[Math.cos(l.a) * l.tilt, 0, -Math.sin(l.a) * l.tilt]} castShadow>
            <cylinderGeometry args={[0.07, 0.15, l.len, 7]} />
            <meshStandardMaterial color="#6a5040" roughness={0.95} />
          </mesh>
          <mesh position={[l.tip[0] * 0.75 + Math.cos(l.a) * 0.25, l.tip[1] - 0.1, l.tip[2] * 0.75 - Math.sin(l.a) * 0.25]} rotation={[Math.cos(l.a + 1.2) * 0.9, 0, -Math.sin(l.a + 1.2) * 0.9]}>
            <cylinderGeometry args={[0.03, 0.06, 0.8, 5]} />
            <meshStandardMaterial color="#6a5040" />
          </mesh>
        </group>
      ))}
      {/* ก้อนใบ (เล็ก หลายก้อน ไม่เป็นลูกกลมลูกเดียว) */}
      {blobs.map(([x, y, z, r], k) => (
        <mesh key={k} position={[x, y, z]} scale={[1.15, 0.62, 1.15]} castShadow receiveShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={k % 2 ? '#3c7430' : '#467e34'} roughness={0.9} />
        </mesh>
      ))}
      <instancedMesh ref={leaves} args={[leafGeo, undefined, LEAF_N]} castShadow>
        <meshStandardMaterial roughness={0.8} side={2} />
      </instancedMesh>
      <instancedMesh ref={stalkRef} args={[undefined, undefined, FRUIT_N]}>
        <cylinderGeometry args={[0.008, 0.008, 1, 4]} />
        <meshStandardMaterial color="#8a7a3a" />
      </instancedMesh>
      <instancedMesh ref={fruitRef} args={[undefined, undefined, FRUIT_N]} castShadow>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial roughness={0.45} />
      </instancedMesh>
      {f.cap && (
        <instancedMesh ref={capRef} args={[undefined, undefined, FRUIT_N]}>
          <sphereGeometry args={[1, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          <meshStandardMaterial color={f.cap} roughness={0.45} />
        </instancedMesh>
      )}
    </group>
  )
}

/** สวนมะม่วงหลายพันธุ์ (หลังบ้านน้าโรจน์): 2 แถว × 5 ต้น (อาร์ทูอีทู น้ำดอกไม้ม่วง/ทอง เขียวเสวย มะม่วงยักษ์ เขียวใหญ่) */
export const ORCHARD_LAYOUT: { v: MangoVariety; x: number; z: number }[] = [
  { v: 'r2e2', x: -8, z: -1.7 },
  { v: 'ndm-purple', x: -4, z: -1.7 },
  { v: 'giant', x: 0, z: -1.7 },
  { v: 'big-green', x: 4, z: -1.7 },
  { v: 'ndm-purple', x: 8, z: -1.7 },
  { v: 'khiew', x: -8, z: 1.8 },
  { v: 'giant', x: -4, z: 1.8 },
  { v: 'ndm-gold', x: 0, z: 1.8 },
  { v: 'r2e2', x: 4, z: 1.8 },
  { v: 'big-green', x: 8, z: 1.8 },
]
export function MangoOrchard({ w, d }: { w: number; d: number }) {
  return (
    <group>
      <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#8fa85a" roughness={1} />
      </mesh>
      {ORCHARD_LAYOUT.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} rotation={[0, i * 1.1, 0]}>
          <Windy h={5} amp={0.28} flutter={1}>
            <MangoTree variety={t.v} seed={i * 1.7 + 0.5} />
          </Windy>
          <NearLabel text={MANGO_NAMES[t.v]} y={5.6} r={2.4} height={0.5} />
        </group>
      ))}
    </group>
  )
}
