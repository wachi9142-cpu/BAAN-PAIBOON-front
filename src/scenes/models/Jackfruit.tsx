import { useLayoutEffect, useMemo, useRef } from 'react'
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, IcosahedronGeometry, Object3D, Quaternion, Vector3, type InstancedMesh } from 'three'

/**
 * ต้นขนุน (ตามภาพอ้างอิงของผู้สร้าง 19 พ.ย.) สูง ~6 ม.
 * - ลำต้นตรงใหญ่ สีน้ำตาลเทามีด่าง โคนมีรากแผ่ (พูพอน) · แตกกิ่งใหญ่ 3–4 กิ่งช่วงบน
 * - ใบรีใหญ่ เขียวเข้มมัน ขึ้นเป็นพุ่มหนาตามปลายกิ่ง (low-poly เหลี่ยม)
 * - ผลขนุนใหญ่ทรงรียาว สีเขียวอมเหลือง ผิวหนามปุ่ม ห้อยด้วยขั้วจาก "ลำต้น" และโคนกิ่งใหญ่
 * ใบวาดแบบ instancing (ต้นละ 1 ชิ้น)
 */
let leafGeo: BufferGeometry | null = null
function jackLeaf() {
  if (leafGeo) return leafGeo
  // ใบรีปลายมน: โปรไฟล์ [y, ครึ่งกว้าง] + สันกลางยก
  const prof: [number, number][] = [
    [0, 0],
    [0.06, 0.06],
    [0.18, 0.1],
    [0.3, 0.09],
    [0.4, 0.05],
    [0.46, 0],
  ]
  const v: number[] = []
  for (let i = 0; i < prof.length - 1; i++) {
    const [y0, w0] = prof[i]
    const [y1, w1] = prof[i + 1]
    for (const s of [-1, 1]) {
      v.push(0, y0, 0.018, s * w0, y0, 0, s * w1, y1, 0)
      v.push(0, y0, 0.018, s * w1, y1, 0, 0, y1, 0.018)
    }
  }
  leafGeo = new BufferGeometry()
  leafGeo.setAttribute('position', new Float32BufferAttribute(v, 3))
  leafGeo.computeVertexNormals()
  return leafGeo
}

let fruitGeo: IcosahedronGeometry | null = null
const jackFruitGeo = () => (fruitGeo ??= new IcosahedronGeometry(0.2, 2))

type Seg = { a: Vector3; b: Vector3; r0: number; r1: number }

export function JackfruitTree({ seed = 1, s = 1 }: { seed?: number; s?: number }) {
  const leaves = useRef<InstancedMesh>(null)
  const { segs, tips, fruits } = useMemo(() => {
    let st = Math.floor(seed * 6151) + 29
    const rnd = () => ((st = (st * 16807) % 2147483647) - 1) / 2147483646
    const segs: Seg[] = []
    const tips: Vector3[] = []
    const top = new Vector3(0, 3.3, 0)
    segs.push({ a: new Vector3(0, 0, 0), b: top, r0: 0.24, r1: 0.17 })
    // ยอดลำต้นต่อขึ้นไปอีกนิด
    const crown = new Vector3(0.05, 4.6, -0.03)
    segs.push({ a: top, b: crown, r0: 0.17, r1: 0.09 })
    tips.push(crown.clone().add(new Vector3(0, 0.6, 0)))
    const grow = (from: Vector3, dir: Vector3, len: number, r: number, depth: number) => {
      const to = from.clone().addScaledVector(dir, len)
      segs.push({ a: from, b: to, r0: r, r1: r * 0.7 })
      tips.push(to)
      if (depth === 0) return
      for (let k = 0; k < 2; k++) {
        const yaw = rnd() * Math.PI * 2
        const d = dir.clone().add(new Vector3(Math.cos(yaw) * 0.5, 0.25 + rnd() * 0.2, Math.sin(yaw) * 0.5)).normalize()
        grow(to, d, len * 0.62, r * 0.65, depth - 1)
      }
    }
    // กิ่งใหญ่ 4 กิ่งจากช่วงบนลำต้น
    for (let k = 0; k < 4; k++) {
      const yaw = (k / 4) * Math.PI * 2 + seed * 1.7 + rnd() * 0.4
      const y = 2.7 + k * 0.35
      const from = new Vector3(0, y, 0)
      const d = new Vector3(Math.cos(yaw) * 0.85, 0.75, Math.sin(yaw) * 0.85).normalize()
      grow(from, d, 1.5 + rnd() * 0.3, 0.1, 2)
    }
    // ผลขนุน: ติดลำต้น (ส่วนใหญ่) + โคนกิ่งใหญ่
    const fruits: { p: Vector3; s: number; tint: number }[] = []
    for (let k = 0; k < 7; k++) {
      const yaw = k * 2.2 + seed
      const y = 0.9 + ((k * 0.37) % 1) * 1.9
      const r = 0.24 + 0.17
      fruits.push({ p: new Vector3(Math.cos(yaw) * r, y, Math.sin(yaw) * r), s: 0.8 + ((k * 5) % 4) * 0.12, tint: k % 3 })
    }
    for (let k = 0; k < 3; k++) {
      const yaw = k * 2.1 + seed * 1.7 + 0.3
      fruits.push({ p: new Vector3(Math.cos(yaw) * 0.6, 2.75 + k * 0.3, Math.sin(yaw) * 0.6), s: 0.75, tint: (k + 1) % 3 })
    }
    return { segs, tips, fruits }
  }, [seed])

  const PER_TIP = 28
  const count = tips.length * PER_TIP
  useLayoutEffect(() => {
    const m = leaves.current
    if (!m) return
    let st = Math.floor(seed * 3307) + 3
    const rnd = () => ((st = (st * 16807) % 2147483647) - 1) / 2147483646
    const o = new Object3D()
    const c = new Color()
    const greens = ['#3f7a2c', '#4a8a34', '#356a26', '#5a9a3c', '#2f6224']
    let i = 0
    for (const t of tips) {
      for (let k = 0; k < PER_TIP; k++) {
        const yaw = rnd() * Math.PI * 2
        const rad = 0.1 + rnd() * 0.55
        o.position.set(t.x + Math.cos(yaw) * rad, t.y + (rnd() - 0.35) * 0.5, t.z + Math.sin(yaw) * rad)
        const out = new Vector3(o.position.x, 0.5, o.position.z).normalize()
        const dir = out.add(new Vector3(Math.cos(yaw), rnd() * 0.6 - 0.2, Math.sin(yaw)).multiplyScalar(0.9)).normalize()
        o.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir))
        o.rotateY(rnd() * Math.PI)
        o.scale.setScalar(1.25 + rnd() * 0.55)
        o.updateMatrix()
        m.setMatrixAt(i, o.matrix)
        m.setColorAt(i, c.set(greens[Math.floor(rnd() * greens.length)]))
        i++
      }
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [tips, seed])

  return (
    <group scale={s}>
      {/* รากแผ่ที่โคน (พูพอน) */}
      {[0, 1, 2, 3, 4].map((k) => {
        const a = k * 1.256 + seed
        return (
          <mesh key={k} position={[Math.cos(a) * 0.26, 0.2, Math.sin(a) * 0.26]} rotation={[0, -a, 0]} castShadow>
            <coneGeometry args={[0.16, 0.5, 4]} />
            <meshStandardMaterial color="#6a5440" roughness={0.95} flatShading />
          </mesh>
        )
      })}
      {/* ลำต้น + กิ่ง */}
      {segs.map((g, i) => {
        const mid = g.a.clone().add(g.b).multiplyScalar(0.5)
        const d = g.b.clone().sub(g.a)
        const len = d.length()
        const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), d.normalize())
        return (
          <mesh key={i} position={mid} quaternion={q} castShadow receiveShadow>
            <cylinderGeometry args={[g.r1, g.r0, len, 7]} />
            <meshStandardMaterial color={i === 0 ? '#7a6a58' : '#6e5a46'} roughness={0.9} flatShading />
          </mesh>
        )
      })}
      {/* ด่างบนลำต้น */}
      {[0.7, 1.6, 2.4].map((y, k) => (
        <mesh key={'sp' + k} position={[Math.cos(k * 2.4) * 0.215, y, Math.sin(k * 2.4) * 0.215]} rotation={[0, -k * 2.4 + Math.PI / 2, 0]}>
          <circleGeometry args={[0.07, 6]} />
          <meshStandardMaterial color="#a89a84" roughness={1} side={DoubleSide} />
        </mesh>
      ))}
      {/* ใบ */}
      <instancedMesh ref={leaves} args={[jackLeaf(), undefined, count]} castShadow receiveShadow>
        <meshStandardMaterial side={DoubleSide} roughness={0.45} flatShading />
      </instancedMesh>
      {/* ผลขนุน: ขั้วสั้นติดลำต้น ห้อยลง ทรงรียาว ผิวปุ่มหนาม */}
      {fruits.map((f, k) => (
        <group key={'f' + k} position={f.p} scale={f.s}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.025, 0.03, 0.18, 5]} />
            <meshStandardMaterial color="#6a8a3a" />
          </mesh>
          <mesh geometry={jackFruitGeo()} position={[0, -0.3, 0]} scale={[1, 1.55, 1]} castShadow>
            <meshStandardMaterial color={f.tint === 0 ? '#9cb048' : f.tint === 1 ? '#8aa440' : '#a8b85a'} roughness={0.85} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}
