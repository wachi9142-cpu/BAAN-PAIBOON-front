import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  MeshStandardMaterial,
  Object3D,
  type Group,
  type InstancedMesh,
  type Material,
  type Mesh,
} from 'three'
import { tickWind, windU } from '../game/wind'
import { isBlockedForDecor, WORLD_HALF_SIZE } from '../game/content/village'

/** เดินระบบลมทุกเฟรม (วางไว้ใน Canvas ครั้งเดียว) */
export function WindDriver() {
  useFrame(({ clock }, dt) => tickWind(clock.elapsedTime, Math.min(dt, 0.1)))
  return null
}

interface WindOpts {
  /** ความสูงอ้างอิงของวัตถุ (ม.) — ส่วนที่สูงเท่านี้ไหวเต็มที่ โคนแทบไม่ขยับ */
  h: number
  /** ระยะเอนสูงสุดที่ยอด (ม.) เมื่อลมแรงเต็มที่ */
  amp: number
  /** ใบไม้สั่นระริก (0 = ไม่มี) */
  flutter?: number
}

const VERT_HEAD = /* glsl */ `
uniform float uTime;
uniform float uWind;
uniform float uGust;
uniform vec2 uDir;
uniform float uH;
uniform float uAmp;
uniform float uFlut;
`
const VERT_BODY = /* glsl */ `
vec4 wpos = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  wpos = instanceMatrix * wpos;
#endif
wpos = modelMatrix * wpos;
// ส่วนที่สูงขึ้นไหวมากขึ้น (โคนติดพื้น)
float hk = clamp( wpos.y / uH, 0.0, 1.5 );
hk *= hk;
// คลื่นลมวิ่งไปตามทิศลม → ทุ่งหญ้า/ต้นไม้ไหวเป็นระลอก ไม่พร้อมกันทั้งหมด
float wave = dot( wpos.xz, uDir ) * 0.22 - uTime * ( 0.8 + uWind * 1.8 );
float roll = 0.5 + 0.5 * sin( wave ) * sin( wave * 0.37 + 1.7 );
float s = uWind * ( 0.3 + 0.7 * roll ) + uGust * ( 0.55 + 0.45 * sin( wave * 0.5 + 0.9 ) );
// แกว่งไปมาเล็กน้อย (ไม่เอนนิ่งทางเดียว)
float wob = sin( uTime * ( 1.1 + uWind ) + wpos.x * 0.31 + wpos.z * 0.23 ) * ( 0.12 + uWind * 0.3 );
vec2 side = vec2( -uDir.y, uDir.x );
vec2 off = ( uDir * ( s + wob * 0.5 ) + side * wob * 0.35 ) * uAmp * hk;
// ใบไม้สั่นระริก
float fl = uFlut * ( 0.12 + uWind + uGust ) * hk;
off += vec2( sin( uTime * 7.3 + wpos.y * 5.1 + wpos.x * 3.7 ), cos( uTime * 6.1 + wpos.z * 4.3 + wpos.y * 2.9 ) ) * 0.025 * fl;
wpos.xz += off;
wpos.y -= dot( off, off ) * 0.35 / max( uH, 0.2 );
vec4 mvPosition = viewMatrix * wpos;
gl_Position = projectionMatrix * mvPosition;
`

/** ใส่ shader ลมให้ material (ใช้ uniform ร่วมกัน · โปรแกรม shader เดียวกันทั้งหมด) */
export function windify(m: Material, o: WindOpts) {
  const ud = m.userData as { wind?: WindOpts; windLocked?: boolean }
  if (ud.windLocked) return
  if (ud.wind) {
    Object.assign(ud.wind, o)
    return
  }
  const params = { ...o }
  ud.wind = params
  const own = { uH: { value: o.h }, uAmp: { value: o.amp }, uFlut: { value: o.flutter ?? 0 } }
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, windU, own)
    sh.vertexShader = VERT_HEAD + sh.vertexShader.replace('#include <project_vertex>', VERT_BODY)
  }
  m.customProgramCacheKey = () => 'wind-v1'
  // อัปเดตค่าเมื่อเปลี่ยนพารามิเตอร์
  Object.defineProperty(params, 'h', { set: (v: number) => (own.uH.value = v), get: () => own.uH.value })
  Object.defineProperty(params, 'amp', { set: (v: number) => (own.uAmp.value = v), get: () => own.uAmp.value })
  Object.defineProperty(params, 'flutter', { set: (v: number) => (own.uFlut.value = v), get: () => own.uFlut.value })
  m.needsUpdate = true
}

/** ห่อกลุ่มต้นไม้/พืช: ทุกชิ้นข้างในไหวตามลม (ตรวจชิ้นใหม่ซ้ำทุก ~1.5 วิ) */
export function Windy({ h, amp, flutter = 0, children }: WindOpts & { children: React.ReactNode }) {
  const g = useRef<Group>(null)
  const opts = useMemo(() => ({ h, amp, flutter }), [h, amp, flutter])
  const scan = () => {
    g.current?.traverse((ob) => {
      const mesh = ob as Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const m of mats) windify(m, opts)
    })
  }
  useLayoutEffect(scan)
  const tAcc = useRef(0)
  useFrame((_, dt) => {
    tAcc.current += dt
    if (tAcc.current > 1.5) {
      tAcc.current = 0
      scan()
    }
  })
  return <group ref={g}>{children}</group>
}

/* ───────── ทุ่งหญ้าทั่วหมู่บ้าน (กอหญ้าแบบ instancing ไหวเป็นระลอกตามลม) ───────── */

/** กอหญ้า 1 กอ = ใบหญ้าเรียวแหลม 9 ใบ เอนออกรอบทิศ · สีโคนเข้ม ปลายอ่อน (vertex color) */
function tuftGeometry() {
  const pos: number[] = []
  const col: number[] = []
  const base = new Color('#86a852')
  const tip = new Color('#dcec9a')
  const N = 9
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + i * 0.7
    const lean = 0.1 + (i % 3) * 0.07
    const h = 0.6 + ((i * 5) % 4) * 0.14
    const w = 0.075
    const cx = Math.cos(a)
    const cz = Math.sin(a)
    const px = -cz * w
    const pz = cx * w
    const tx = cx * lean
    const tz = cz * lean
    pos.push(cx * 0.04 + px, 0, cz * 0.04 + pz, cx * 0.04 - px, 0, cz * 0.04 - pz, tx, h, tz)
    col.push(base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new Float32BufferAttribute(col, 3))
  g.computeVertexNormals()
  // ให้แสงเหมือนพื้นหญ้า (ชี้ขึ้นฟ้า) ดูนุ่มไม่มีเส้นแข็ง
  const n = g.getAttribute('normal')
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0)
  return g
}

export function GrassField({ count = 7000 }: { count?: number }) {
  const ref = useRef<InstancedMesh>(null)
  const geo = useMemo(tuftGeometry, [])
  const mat = useMemo(() => {
    const m = new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 1 })
    windify(m, { h: 0.7, amp: 0.2, flutter: 0.4 })
    return m
  }, [])
  const spots = useMemo(() => {
    let s = 913
    const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    const out: [number, number, number, number][] = []
    let guard = 0
    while (out.length < count && guard++ < count * 6) {
      const x = (rnd() * 2 - 1) * (WORLD_HALF_SIZE + 6)
      const z = (rnd() * 2 - 1) * (WORLD_HALF_SIZE + 6)
      // แถบว่างนอกรั้วบ้านตาฝั่งตะวันออก (x 15–21) ให้มีหญ้าขึ้นได้ (กรอบห้ามต้นไม้สุ่มยังคงเดิม)
      const strip = x > 15.6 && x < 21.5 && z > 58 && z < 109
      if (isBlockedForDecor([x, z]) && !strip) continue
      out.push([x, z, 0.5 + rnd() * 0.55, rnd() * Math.PI * 2])
    }
    return out
  }, [count])
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const o = new Object3D()
    const c = new Color()
    spots.forEach(([x, z, sc, r], i) => {
      o.position.set(x, 0, z)
      o.rotation.set(0, r, 0)
      o.scale.set(sc * 1.4, sc, sc * 1.4)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      const v = 0.95 + ((i * 37) % 25) / 100
      m.setColorAt(i, c.setRGB(v, v * (0.98 + ((i * 13) % 5) / 100), v * 0.9))
    })
    m.count = spots.length
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [spots])
  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} receiveShadow />
}
