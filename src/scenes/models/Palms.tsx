import { useMemo } from 'react'
import { BufferGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, Matrix4, MeshStandardMaterial, Quaternion, SphereGeometry, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { windify } from '../Wind'

/**
 * ต้นมะพร้าว / ต้นหมาก แบบใหม่ (ตามภาพอ้างอิงของผู้สร้าง)
 * - มะพร้าว: ลำต้นยาวโค้งเล็กน้อย มีข้อเป็นวง · ทางใบยาวโค้งปลายตก มีใบย่อยเรียวห้อยสองข้างก้าน · ทะลายมะพร้าวเขียวใต้ยอด
 * - หมาก: ลำต้นเรียวตรง สีเทามีข้อ · กาบยอดเขียวสด · ทางใบสั้นกว่า ใบย่อยฝอย · ทะลายหมากส้ม-เขียว
 * ประกอบเรขาคณิตครั้งเดียวแล้วรวมเป็นก้อนเดียวต่อส่วน (ใช้ซ้ำทุกต้น) → ต้นละ 3–4 ชิ้นเท่านั้น ไม่หน่วง
 */

interface FrondOpts {
  len: number
  rise: number
  droop: number
  leaflets: number
  leafLen: number
  leafW: number
  leafDrop: number
  base: string
  tip: string
}

/** ทางใบ 1 ทาง (ก้านโค้ง + ใบย่อยสองข้าง) ชี้ไปทาง +z เริ่มที่จุดกำเนิด */
function frondGeometry(o: FrondOpts) {
  const pos: number[] = []
  const col: number[] = []
  const cb = new Color(o.base)
  const ct = new Color(o.tip)
  const rib = (t: number) => new Vector3(0, o.rise * t - o.droop * t * t, o.len * t)
  const push = (v: Vector3, c: Color) => {
    pos.push(v.x, v.y, v.z)
    col.push(c.r, c.g, c.b)
  }
  // ก้านใบ (แถบแคบ)
  const N = 10
  for (let i = 0; i < N; i++) {
    const a = rib(i / N)
    const b = rib((i + 1) / N)
    const w = 0.035 * (1 - i / N) + 0.01
    const c = new Color('#c8b878')
    push(new Vector3(a.x - w, a.y, a.z), c)
    push(new Vector3(a.x + w, a.y, a.z), c)
    push(new Vector3(b.x + w, b.y, b.z), c)
    push(new Vector3(a.x - w, a.y, a.z), c)
    push(new Vector3(b.x + w, b.y, b.z), c)
    push(new Vector3(b.x - w, b.y, b.z), c)
  }
  // ใบย่อย: เรียวแหลม ห้อยลงและเฉียงไปทางปลายทาง
  for (let i = 0; i < o.leaflets; i++) {
    const t = 0.12 + (i / (o.leaflets - 1)) * 0.86
    const p = rib(t)
    const next = rib(Math.min(1, t + 0.02))
    const dir = next.clone().sub(p).normalize()
    const L = o.leafLen * (1 - Math.abs(t - 0.45) * 0.9)
    const c = cb.clone().lerp(ct, t)
    for (const s of [-1, 1]) {
      const side = new Vector3(s, 0, 0)
      const tipV = p
        .clone()
        .add(side.clone().multiplyScalar(L * 0.82))
        .add(dir.clone().multiplyScalar(L * 0.45))
        .add(new Vector3(0, -L * o.leafDrop, 0))
      const w = o.leafW
      const b0 = p.clone().add(dir.clone().multiplyScalar(-w))
      const b1 = p.clone().add(dir.clone().multiplyScalar(w))
      push(b0, c)
      push(b1, c)
      push(tipV, ct)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new Float32BufferAttribute(col, 3))
  g.computeVertexNormals()
  return g
}

/** ยอดทั้งยอด = ทางใบหลายทางเรียงรอบ (ทางอ่อนชี้ขึ้น ทางแก่โค้งตก) รวมเป็นก้อนเดียว */
function crownGeometry(count: number, o: FrondOpts, seed: number) {
  const parts: BufferGeometry[] = []
  const m = new Matrix4()
  for (let k = 0; k < count; k++) {
    const yaw = (k / count) * Math.PI * 2 + Math.sin(k * 2.3 + seed) * 0.2
    // ทางกลาง (อ่อน) ตั้งชันกว่า ทางรอบนอกเอนลง
    const pitch = k % 3 === 0 ? -0.75 : k % 3 === 1 ? -0.25 : 0.12
    const sc = k % 3 === 0 ? 0.8 : 1 + (k % 2) * 0.08
    const g = frondGeometry({ ...o, len: o.len * sc })
    m.makeRotationX(pitch)
    g.applyMatrix4(m)
    m.makeRotationY(yaw)
    g.applyMatrix4(m)
    parts.push(g)
  }
  return mergeGeometries(parts)!
}

/** ลำต้นโค้ง (ต่อท่อนทรงกระบอก) มีข้อเป็นวงด้วยสีสลับ · รวมเป็นก้อนเดียว · คืนตำแหน่งยอด */
function trunkGeometry(h: number, r0: number, r1: number, bend: number, c1: string, c2: string, rings: number) {
  const parts: BufferGeometry[] = []
  const seg = Math.max(6, Math.round(rings))
  const ca = new Color(c1)
  const cb = new Color(c2)
  const pt = (t: number) => new Vector3(Math.sin(t * 1.6) * bend, t * h, 0)
  for (let i = 0; i < seg; i++) {
    const a = pt(i / seg)
    const b = pt((i + 1) / seg)
    const len = a.distanceTo(b)
    const ra = r0 + (r1 - r0) * (i / seg)
    const rb = r0 + (r1 - r0) * ((i + 1) / seg)
    const g = new CylinderGeometry(rb, ra, len * 1.02, 9, 1)
    const c = i % 2 ? ca : cb
    const n = g.getAttribute('position').count
    const cols = new Float32Array(n * 3)
    for (let k = 0; k < n; k++) cols.set([c.r, c.g, c.b], k * 3)
    g.setAttribute('color', new Float32BufferAttribute(cols, 3))
    const dir = b.clone().sub(a).normalize()
    const m = new Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir), new Vector3(1, 1, 1))
    g.applyMatrix4(m)
    parts.push(g.toNonIndexed())
  }
  return { geo: mergeGeometries(parts)!, top: pt(1) }
}

/** ทะลายผล (ลูกกลมหลายลูก) รวมเป็นก้อนเดียว */
function bunchGeometry(n: number, r: number, spread: number, colors: string[], seed: number) {
  const parts: BufferGeometry[] = []
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + seed
    const ring = Math.floor(i / 6)
    const g = new SphereGeometry(r * (0.9 + ((i * 7) % 3) * 0.06), 10, 8).toNonIndexed()
    const c = new Color(colors[(i + seed * 3) % colors.length | 0])
    const cnt = g.getAttribute('position').count
    const cols = new Float32Array(cnt * 3)
    for (let k = 0; k < cnt; k++) cols.set([c.r, c.g, c.b], k * 3)
    g.setAttribute('color', new Float32BufferAttribute(cols, 3))
    g.translate(Math.cos(a) * spread * (0.6 + ring * 0.35), -ring * r * 1.4 - (i % 2) * r * 0.4, Math.sin(a) * spread * (0.6 + ring * 0.35))
    parts.push(g)
  }
  return mergeGeometries(parts)!
}

// วัสดุใช้ร่วมทุกต้น (สีมาจาก vertex color) · ใส่ลมไว้เลย (ล็อกค่า ไม่ให้ Windy อื่นเปลี่ยน)
const mat = (o: ConstructorParameters<typeof MeshStandardMaterial>[0], h: number, amp: number, flutter: number) => {
  const m = new MeshStandardMaterial(o)
  windify(m, { h, amp, flutter })
  m.userData.windLocked = true
  return m
}
const cocoLeaf = mat({ vertexColors: true, side: DoubleSide, roughness: 0.75 }, 11, 0.45, 1.8)
const cocoBark = mat({ vertexColors: true, roughness: 0.92 }, 11, 0.35, 0)
const cocoNut = mat({ vertexColors: true, roughness: 0.45 }, 11, 0.35, 0)
const arecaLeaf = mat({ vertexColors: true, side: DoubleSide, roughness: 0.75 }, 7.5, 0.45, 1.8)
const arecaBark = mat({ vertexColors: true, roughness: 0.92 }, 7.5, 0.35, 0)
const arecaNut = mat({ vertexColors: true, roughness: 0.45 }, 7.5, 0.35, 0)

const cache = new Map<string, unknown>()
function cached<T>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key) as T
}

/** ต้นมะพร้าว (h = ความสูงลำต้น ม.) */
export function CoconutPalm({ h = 6, seed = 0 }: { h?: number; seed?: number }) {
  const v = Math.abs(Math.round(seed * 7)) % 3 // แบบยอด 3 แบบ (ใช้ซ้ำ)
  const hk = Math.round(h * 2) / 2
  const crown = cached('coco-crown-' + v, () =>
    crownGeometry(14, { len: 3.3, rise: 1.1, droop: 2.6, leaflets: 22, leafLen: 0.85, leafW: 0.05, leafDrop: 0.55, base: '#4c8a2e', tip: '#9cc65a' }, v * 1.7),
  )
  const trunk = cached('coco-trunk-' + hk + '-' + v, () => trunkGeometry(hk, 0.22, 0.14, 0.35 + v * 0.15, '#8a7a62', '#9e8e74', hk * 2.5))
  const nuts = cached('coco-nuts-' + v, () => bunchGeometry(14, 0.13, 0.22, ['#6a9a32', '#7aa83a', '#5e8c2c', '#9a8a3a'], v))
  const rotY = useMemo(() => seed * 2.1, [seed])
  const top = trunk.top
  return (
    <group rotation={[0, rotY, 0]}>
      <mesh geometry={trunk.geo} material={cocoBark} castShadow />
      <group position={[top.x, top.y, top.z]}>
        <mesh geometry={crown} material={cocoLeaf} castShadow />
        <mesh geometry={nuts} material={cocoNut} position={[0, -0.25, 0]} castShadow />
      </group>
    </group>
  )
}

/** ต้นหมาก (h = ความสูงลำต้น ม.) */
export function ArecaPalmTree({ h = 8, seed = 0 }: { h?: number; seed?: number }) {
  const v = Math.abs(Math.round(seed * 5)) % 3
  const hk = Math.round(h * 2) / 2
  const crown = cached('areca-crown-' + v, () =>
    crownGeometry(9, { len: 2.1, rise: 1.3, droop: 1.9, leaflets: 26, leafLen: 0.6, leafW: 0.035, leafDrop: 0.75, base: '#3f7a2a', tip: '#7ab04a' }, v * 2.3),
  )
  const trunk = cached('areca-trunk-' + hk + '-' + v, () => trunkGeometry(hk, 0.11, 0.08, 0.08 + v * 0.05, '#9a9c8c', '#86887a', hk * 1.6))
  const ripe = cached('areca-nuts-r', () => bunchGeometry(16, 0.055, 0.12, ['#e8782a', '#f08a30', '#d86020', '#e8a040'], 1))
  const green = cached('areca-nuts-g', () => bunchGeometry(14, 0.055, 0.11, ['#7aa040', '#8ab048', '#6a9038'], 2))
  const top = trunk.top
  return (
    <group rotation={[0, seed * 2.7, 0]}>
      <mesh geometry={trunk.geo} material={arecaBark} castShadow />
      <group position={[top.x, top.y, top.z]}>
        {/* กาบยอดสีเขียวสด */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.065, 0.09, 1.0, 8]} />
          <meshStandardMaterial color="#5f9a3e" roughness={0.6} />
        </mesh>
        <mesh geometry={crown} material={arecaLeaf} position={[0, 0.95, 0]} castShadow />
        <mesh geometry={ripe} material={arecaNut} position={[0.14, -0.1, 0.05]} />
        <mesh geometry={green} material={arecaNut} position={[-0.12, -0.05, -0.08]} />
      </group>
    </group>
  )
}
