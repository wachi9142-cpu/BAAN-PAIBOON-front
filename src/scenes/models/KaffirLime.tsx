import { useLayoutEffect, useMemo, useRef } from 'react'
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Object3D, Quaternion, Vector3, type InstancedMesh } from 'three'

/**
 * ต้นมะกรูด (ตามภาพอ้างอิงของผู้สร้าง 19 พ.ย.): ทรงพุ่มแบบต้นมะนาว สูง ~2.6 ม.
 * - ลำต้นสั้นแตกเป็น 3–4 กิ่งหลักตั้งแต่โคน กิ่งเรียวสีน้ำตาลเทา แตกกิ่งย่อยขึ้นไปเป็นทรงพุ่มรี
 * - ใบมะกรูด "ใบคู่" (ใบล่างเล็ก + ใบบนใหญ่ต่อกันเป็นเลขแปด) เขียวสดมันเงา แบบเหลี่ยม low-poly
 *   ขึ้นเป็นกลุ่มตามปลายกิ่ง เห็นกิ่งลอดช่องใบ
 * - ลูกมะกรูดเขียว ผิวปุ่มขรุขระ ทรงกลมป่องปลาย ห้อยอยู่ในพุ่ม ~9 ลูก
 * ใบวาดแบบ instancing ทั้งต้น (ต้นละ 1 ชิ้น ไม่หน่วง)
 */
let leafGeo: BufferGeometry | null = null
function kaffirLeaf() {
  if (leafGeo) return leafGeo
  // โปรไฟล์ตามแกน y: [y, ครึ่งกว้าง] · มีสันกลางยกขึ้นเล็กน้อย (z) ให้ใบพับเป็นเหลี่ยม
  const prof: [number, number][] = [
    [0, 0],
    [0.07, 0.045],
    [0.12, 0.008], // คอกิ่วระหว่างใบคู่
    [0.24, 0.075],
    [0.36, 0.06],
    [0.46, 0],
  ]
  const v: number[] = []
  const tri = (a: number[], b: number[], c: number[]) => v.push(...a, ...b, ...c)
  for (let i = 0; i < prof.length - 1; i++) {
    const [y0, w0] = prof[i]
    const [y1, w1] = prof[i + 1]
    const c0 = [0, y0, 0.012]
    const c1 = [0, y1, 0.012]
    for (const s of [-1, 1]) {
      const e0 = [s * w0, y0, 0]
      const e1 = [s * w1, y1, 0]
      tri(c0, e0, e1)
      tri(c0, e1, c1)
    }
  }
  leafGeo = new BufferGeometry()
  leafGeo.setAttribute('position', new Float32BufferAttribute(v, 3))
  leafGeo.computeVertexNormals()
  return leafGeo
}

type Seg = { a: Vector3; b: Vector3; r0: number; r1: number }

export function KaffirLimeTree({ seed = 1, s = 1 }: { seed?: number; s?: number }) {
  const leaves = useRef<InstancedMesh>(null)
  const { segs, tips, fruits } = useMemo(() => {
    let st = Math.floor(seed * 7919) + 17
    const rnd = () => ((st = (st * 16807) % 2147483647) - 1) / 2147483646
    const segs: Seg[] = []
    const tips: Vector3[] = []
    // ลำต้นสั้น
    const base = new Vector3(0, 0.45, 0)
    segs.push({ a: new Vector3(0, 0, 0), b: base, r0: 0.075, r1: 0.06 })
    const grow = (from: Vector3, dir: Vector3, len: number, r: number, depth: number) => {
      const to = from.clone().addScaledVector(dir, len)
      segs.push({ a: from, b: to, r0: r, r1: r * 0.72 })
      if (depth === 0) {
        tips.push(to)
        return
      }
      tips.push(from.clone().lerp(to, 0.6))
      const n = depth === 2 ? 3 : 2
      for (let k = 0; k < n; k++) {
        const yaw = rnd() * Math.PI * 2
        const d = dir.clone().add(new Vector3(Math.cos(yaw) * 0.55, 0.15 + rnd() * 0.25, Math.sin(yaw) * 0.55)).normalize()
        grow(to, d, len * (0.62 + rnd() * 0.15), r * 0.7, depth - 1)
      }
    }
    // กิ่งหลัก 4 กิ่งแผ่ออกเป็นรูปแจกัน
    for (let k = 0; k < 4; k++) {
      const yaw = (k / 4) * Math.PI * 2 + seed + rnd() * 0.5
      const d = new Vector3(Math.cos(yaw) * 0.38, 1, Math.sin(yaw) * 0.38).normalize()
      grow(base, d, 0.62 + rnd() * 0.15, 0.05, 2)
    }
    // ลูกมะกรูด: ห้อยใต้ปลายกิ่งช่วงกลางพุ่ม
    const fruits = tips
      .filter((_, i) => i % 3 === 1)
      .slice(0, 9)
      .map((t) => new Vector3(t.x * 1.08, t.y - 0.14, t.z * 1.08))
    return { segs, tips, fruits }
  }, [seed])

  const PER_TIP = 30
  const count = tips.length * PER_TIP
  useLayoutEffect(() => {
    const m = leaves.current
    if (!m) return
    let st = Math.floor(seed * 4271) + 5
    const rnd = () => ((st = (st * 16807) % 2147483647) - 1) / 2147483646
    const o = new Object3D()
    const c = new Color()
    const greens = ['#5f9a3a', '#6fae44', '#4f8a32', '#7cba4e', '#58923a']
    let i = 0
    for (const t of tips) {
      for (let k = 0; k < PER_TIP; k++) {
        // กลุ่มใบรอบปลายกิ่ง เอนออกนอกพุ่ม
        const yaw = rnd() * Math.PI * 2
        const rad = 0.08 + rnd() * 0.32
        o.position.set(t.x + Math.cos(yaw) * rad, t.y + (rnd() - 0.4) * 0.34, t.z + Math.sin(yaw) * rad)
        const out = new Vector3(o.position.x, 0.6, o.position.z).normalize()
        const dir = out.add(new Vector3(Math.cos(yaw), rnd() * 0.8 - 0.1, Math.sin(yaw)).multiplyScalar(0.8)).normalize()
        o.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir))
        o.rotateY(rnd() * Math.PI)
        o.scale.setScalar(1.0 + rnd() * 0.5)
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
      {/* โคนต้น: ดินพูน + หินก้อน */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.75, 14]} />
        <meshStandardMaterial color="#8a6a46" roughness={1} />
      </mesh>
      <mesh position={[0.45, 0.08, 0.3]} scale={[1.2, 0.7, 1]} castShadow>
        <dodecahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color="#7a6250" roughness={1} flatShading />
      </mesh>
      {/* ลำต้น + กิ่ง */}
      {segs.map((g, i) => {
        const mid = g.a.clone().add(g.b).multiplyScalar(0.5)
        const d = g.b.clone().sub(g.a)
        const len = d.length()
        const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), d.normalize())
        return (
          <mesh key={i} position={mid} quaternion={q} castShadow>
            <cylinderGeometry args={[g.r1, g.r0, len, 6]} />
            <meshStandardMaterial color="#6e5a46" roughness={0.9} flatShading />
          </mesh>
        )
      })}
      {/* ใบคู่ */}
      <instancedMesh ref={leaves} args={[kaffirLeaf(), undefined, count]} castShadow receiveShadow>
        <meshStandardMaterial side={DoubleSide} roughness={0.42} flatShading />
      </instancedMesh>
      {/* ลูกมะกรูด ผิวปุ่มขรุขระ */}
      {fruits.map((f, k) => (
        <group key={'f' + k} position={f}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.1, 4]} />
            <meshStandardMaterial color="#4a6a2a" />
          </mesh>
          <mesh position={[0, -0.02, 0]} scale={[1, 1.1, 1]} castShadow>
            <icosahedronGeometry args={[0.1, 1]} />
            <meshStandardMaterial color={k % 3 === 0 ? '#6a9a3a' : '#5a8e34'} roughness={0.7} flatShading />
          </mesh>
          <mesh position={[0, 0.07, 0]} scale={[0.6, 0.45, 0.6]}>
            <icosahedronGeometry args={[0.09, 0]} />
            <meshStandardMaterial color="#5a8e34" roughness={0.7} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}
