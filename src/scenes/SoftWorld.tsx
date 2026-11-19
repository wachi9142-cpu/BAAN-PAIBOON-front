import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BackSide, Color, IcosahedronGeometry, Mesh, MeshStandardMaterial, ShaderMaterial, SphereGeometry, type BufferGeometry, type Group } from 'three'
import { EffectComposer, Bloom, N8AO, Vignette } from '@react-three/postprocessing'
import { exactMinute } from '../game/clock'
import { weatherRt } from '../game/weather'
import { useSettings } from '../game/settings'

/**
 * ภาพแนว Soft 3D Cartoon ขั้นที่ 1 (§2.59)
 * - ท้องฟ้าไล่สี (ฟ้าสด → ขอบฟ้าสีอ่อน · เช้า/เย็นโทนส้มชมพู · กลางคืนน้ำเงินเข้ม) + เมฆก้อนฟูลอยช้า ๆ
 * - เนินเขาเขียวกลมมนรอบหมู่บ้าน (แทนภูเขาทรงกรวยสีเทา)
 * - ทำให้ทุกอย่างโค้งมน: พุ่มไม้/ก้อนกลมเหลี่ยม ๆ ถูกเปลี่ยนเป็นทรงกลมเนียน · ปิด flat shading
 * - เอฟเฟกต์: เงาฟุ้งตามซอกมุม (AO) · แสงเรืองนุ่ม (Bloom) · ขอบภาพมืดเล็กน้อย — ปิดได้ในตั้งค่า (เครื่องไม่แรง)
 */

/* ---------------- ท้องฟ้าไล่สี ---------------- */
const SKY_KEYS: { h: number; top: string; bottom: string }[] = [
  { h: 0, top: '#0d1430', bottom: '#2b3560' },
  { h: 4.5, top: '#141c40', bottom: '#3a3f6a' },
  { h: 5.8, top: '#6f86c8', bottom: '#ffc3a0' },
  { h: 7, top: '#6fb2ee', bottom: '#e6f2f8' },
  { h: 12, top: '#5aa6ec', bottom: '#dcf0fa' },
  { h: 16.5, top: '#68aee8', bottom: '#eef3e6' },
  { h: 18, top: '#7a86c4', bottom: '#ffb98e' },
  { h: 19.2, top: '#28305e', bottom: '#6a5a86' },
  { h: 20.5, top: '#0f1634', bottom: '#2b3560' },
  { h: 24, top: '#0d1430', bottom: '#2b3560' },
]
const ca = new Color()
const cb = new Color()
export function skyAt(min: number, top: Color, bottom: Color) {
  const h = min / 60
  let i = 0
  while (i < SKY_KEYS.length - 2 && SKY_KEYS[i + 1].h <= h) i++
  const a = SKY_KEYS[i]
  const b = SKY_KEYS[i + 1]
  const t = Math.min(1, Math.max(0, (h - a.h) / (b.h - a.h)))
  top.copy(ca.set(a.top)).lerp(cb.set(b.top), t)
  bottom.copy(ca.set(a.bottom)).lerp(cb.set(b.bottom), t)
}

const GREY_TOP = new Color('#8a96a4')
const GREY_BOTTOM = new Color('#c4cad0')

function SkyDome() {
  const { camera } = useThree()
  const mesh = useRef<Mesh>(null)
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new Color('#5aa6ec') }, bottom: { value: new Color('#dcf0fa') } },
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y * 1.6 + 0.08, 0.0, 1.0); h = pow(h, 0.8); gl_FragColor = vec4(mix(bottom, top, h), 1.0); }',
      }),
    [],
  )
  useFrame(() => {
    const u = mat.uniforms
    skyAt(exactMinute(), u.top.value, u.bottom.value)
    // เมฆครึ้ม/ฝน: ฟ้าเทาลง
    const cl = Math.min(0.85, weatherRt.cloud * 0.9)
    ;(u.top.value as Color).lerp(GREY_TOP, cl)
    ;(u.bottom.value as Color).lerp(GREY_BOTTOM, cl)
    if (mesh.current) mesh.current.position.copy(camera.position)
  })
  return (
    <mesh ref={mesh} material={mat} renderOrder={-10}>
      <sphereGeometry args={[400, 32, 16]} />
    </mesh>
  )
}

/* ---------------- เมฆก้อนฟู ---------------- */
function Clouds() {
  const g = useRef<Group>(null)
  const clouds = useMemo(() => {
    let k = 31
    const r = () => ((k = (k * 9301 + 49297) % 233280) / 233280)
    return Array.from({ length: 16 }, () => {
      const a = r() * Math.PI * 2
      const d = 140 + r() * 120
      const puffs = Array.from({ length: 5 + Math.floor(r() * 4) }, (_, i) => [(i - 3) * 6 + r() * 4, r() * 4, (r() - 0.5) * 6, 5 + r() * 5] as const)
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, y: 70 + r() * 40, s: 0.8 + r() * 0.7, puffs, speed: 0.4 + r() * 0.5 }
    })
  }, [])
  const mat = useMemo(() => new MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 1, fog: false }), [])
  useFrame((_, dt) => {
    const grp = g.current
    if (!grp) return
    grp.children.forEach((c, i) => {
      c.position.x += clouds[i].speed * dt
      if (c.position.x > 300) c.position.x = -300
    })
    // กลางคืนเมฆมืดลง · ฝนตกเมฆเทา
    const m = exactMinute()
    const night = m < 330 || m > 1170 ? 1 : m < 400 ? (400 - m) / 70 : m > 1080 ? (m - 1080) / 90 : 0
    const v = 1 - Math.min(0.75, night * 0.75)
    mat.color.setRGB(v, v, v * (1 + night * 0.1))
    mat.color.lerp(GREY_TOP, Math.min(0.6, weatherRt.cloud * 0.7))
    mat.emissiveIntensity = 0.35 * v
  })
  return (
    <group ref={g}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {c.puffs.map(([x, y, z, rr], j) => (
            <mesh key={j} position={[x, y, z]} material={mat} scale={[1, 0.72, 1]}>
              <sphereGeometry args={[rr, 20, 14]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/* ---------------- เนินเขาเขียวกลมมน ---------------- */
function Hills() {
  const hills = useMemo(() => {
    const out: { x: number; z: number; sx: number; sy: number; c: string }[] = []
    const cols = ['#7fae5a', '#8bb965', '#74a352', '#93bf6c', '#6e9a4e']
    for (let ring = 0; ring < 2; ring++)
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2 + ring * 0.1 + Math.sin(i * 5.3) * 0.04
        // ภูเขามีจริงแต่อยู่ไกลมาก (ผู้สร้าง 20 พ.ย.): ไกลเลยทุ่งนา/ป่าออกไปมาก ตัวใหญ่ขึ้นให้ยังเห็นเป็นทิวเขาจาง ๆ
        const d = (ring ? 420 : 350) + ((i * 37) % 40)
        out.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, sx: 75 + ((i * 53) % 40) + ring * 35, sy: (ring ? 70 : 48) + ((i * 71) % 22), c: cols[(i + ring * 2) % cols.length] })
      }
    const keep = out
    return keep
  }, [])
  return (
    <group>
      {hills.map((h, i) => (
        <mesh key={i} position={[h.x, -h.sy * 0.25, h.z]} scale={[h.sx, h.sy, h.sx * 0.85]}>
          <sphereGeometry args={[1, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={h.c} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------- ทำทุกอย่างให้โค้งมน ---------------- */
const roundCache = new Map<string, BufferGeometry>()
function roundGeometry(geo: BufferGeometry): BufferGeometry | null {
  // ก้อนกลมเหลี่ยม ๆ (detail ต่ำ) → ทรงกลมเนียน
  const p = (geo as unknown as { parameters?: { radius?: number; detail?: number } }).parameters
  if (geo.type === 'IcosahedronGeometry' || geo.type === 'DodecahedronGeometry') {
    if ((p?.detail ?? 0) >= 2) return null
    const key = 'ico:' + (p?.radius ?? 1)
    if (!roundCache.has(key)) roundCache.set(key, new IcosahedronGeometry(p?.radius ?? 1, 3))
    return roundCache.get(key)!
  }
  if (geo.type === 'SphereGeometry') {
    const sp = (geo as SphereGeometry).parameters
    if (sp.widthSegments >= 12 || sp.phiLength < Math.PI * 2 - 0.01 || sp.thetaLength < Math.PI - 0.01) return null
    const key = 'sph:' + sp.radius
    if (!roundCache.has(key)) roundCache.set(key, new SphereGeometry(sp.radius, 18, 14))
    return roundCache.get(key)!
  }
  return null
}
function SoftenPass() {
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const done = new WeakSet<object>()
    const pass = () => {
      scene.traverse((o) => {
        const m = o as Mesh
        if (!m.isMesh || done.has(m)) return
        done.add(m)
        const r = roundGeometry(m.geometry)
        if (r) m.geometry = r
        const mats = Array.isArray(m.material) ? m.material : [m.material]
        for (const mt of mats) {
          const s = mt as MeshStandardMaterial
          if (s && s.isMeshStandardMaterial && !done.has(s)) {
            done.add(s)
            if (s.flatShading) {
              s.flatShading = false
              s.needsUpdate = true
            }
            // ลดความมันวาว (ไม่ให้ดูเป็นพลาสติก)
            if (s.metalness > 0.3) s.metalness = 0.3
            if (s.roughness < 0.45) s.roughness = 0.45
          }
        }
      })
    }
    pass()
    // ตรวจของใหม่เป็นระยะ (ห่างขึ้น ลดอาการกระตุกทุก 2.5 วิ — แก้เกมอืด)
    const id = window.setInterval(pass, 7000)
    return () => window.clearInterval(id)
  }, [scene])
  return null
}

export function SoftWorld() {
  const fx = useSettings((s) => s.prettyFx ?? true)
  const ao = useSettings((s) => s.aoFx ?? false)
  return (
    <>
      <SkyDome />
      <Clouds />
      <Hills />
      <SoftenPass />
      {fx && (
        <EffectComposer multisampling={0}>
          {ao ? <N8AO halfRes aoRadius={1.6} intensity={1.6} distanceFalloff={0.6} color="#3a3020" /> : <></>}
          <Bloom mipmapBlur luminanceThreshold={0.82} luminanceSmoothing={0.2} intensity={0.45} />
          <Vignette offset={0.32} darkness={0.35} />
        </EffectComposer>
      )}
    </>
  )
}
