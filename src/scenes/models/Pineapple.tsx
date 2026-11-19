import { useLayoutEffect, useMemo, useRef } from 'react'
import { CanvasTexture, Color, ConeGeometry, DoubleSide, Object3D, RepeatWrapping, SRGBColorSpace, type InstancedMesh } from 'three'

/**
 * แปลงสับปะรด (ตามภาพอ้างอิงของผู้สร้าง): ใบยาวเรียวแหลมแผ่เป็นกอรอบโคน
 * ลูกตั้งบนก้านกลางกอ ผิวเป็นตาหกเหลี่ยม มีจุก (ใบสั้นเป็นพุ่มบนลูก)
 * ส่วนใหญ่ยังเขียว (ยังไม่สุก) · บางลูกสุกสีเหลือง-ส้ม
 * ใบและจุกวาดแบบ instancing ทั้งแปลง (ไม่หน่วง)
 */
const LEAVES = 20
const CROWN = 10

function useSkin(ripe: boolean) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 64
    const x = c.getContext('2d')!
    x.fillStyle = ripe ? '#e0a030' : '#5e8a34'
    x.fillRect(0, 0, 64, 64)
    // ตาสับปะรด: ลายข้าวหลามตัดไขว้ + จุดกลางตา
    x.strokeStyle = ripe ? '#9a5a18' : '#3a5a20'
    x.lineWidth = 2
    for (let i = -64; i < 128; i += 16) {
      x.beginPath()
      x.moveTo(i, 0)
      x.lineTo(i + 64, 64)
      x.stroke()
      x.beginPath()
      x.moveTo(i + 64, 0)
      x.lineTo(i, 64)
      x.stroke()
    }
    x.fillStyle = ripe ? '#f4c860' : '#8ab04a'
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) x.fillRect(k * 16 + 6 + (r % 2) * 8, r * 16 + 6, 4, 4)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(3, 2)
    return t
  }, [ripe])
}

/** points = ปลูกกระจายตามจุดที่กำหนด (ไม่มีแปลงดิน) · ไม่ระบุ = แปลงเรียงแถว cols×rows */
export function PineappleBed({ cols = 4, rows = 5, dx = 0.85, dz = 1.0, ripeEvery = 4, points }: { cols?: number; rows?: number; dx?: number; dz?: number; ripeEvery?: number; points?: [number, number][] }) {
  const leaves = useRef<InstancedMesh>(null)
  const crowns = useRef<InstancedMesh>(null)
  const n = points ? points.length : cols * rows
  const plants = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const c = i % cols
        const r = Math.floor(i / cols)
        return {
          x: points ? points[i][0] : (c - (cols - 1) / 2) * dx + Math.sin(i * 2.7) * 0.08,
          z: points ? points[i][1] : (r - (rows - 1) / 2) * dz + Math.cos(i * 1.9) * 0.08,
          ripe: i % ripeEvery === 1,
          s: 0.85 + ((i * 7) % 4) * 0.07,
          yaw: i * 1.37,
        }
      }),
    [n, cols, rows, dx, dz, ripeEvery, points],
  )
  const leafGeo = useMemo(() => {
    const g = new ConeGeometry(0.03, 0.95, 4)
    g.scale(1.5, 1, 0.3)
    g.translate(0, 0.475, 0)
    return g
  }, [])
  useLayoutEffect(() => {
    const o = new Object3D()
    const c = new Color()
    let li = 0
    let ci = 0
    plants.forEach((p) => {
      for (let k = 0; k < LEAVES; k++) {
        const a = p.yaw + (k / LEAVES) * Math.PI * 2
        const tilt = k % 3 === 0 ? 0.35 : k % 3 === 1 ? 0.7 : 1.05 // ใบในตั้งชัน · ใบกลาง · ใบนอกแผ่
        o.position.set(p.x, 0.02, p.z)
        o.rotation.set(0, a, 0)
        o.rotateX(tilt + ((k * 13) % 5) * 0.05)
        o.scale.setScalar(p.s * (k % 2 ? 1.05 : 0.85))
        o.updateMatrix()
        leaves.current?.setMatrixAt(li, o.matrix)
        leaves.current?.setColorAt(li, c.set(k % 3 === 0 ? '#5f8f4a' : k % 3 === 1 ? '#6e9e52' : '#4f7f3e'))
        li++
      }
      for (let k = 0; k < CROWN; k++) {
        const a = p.yaw + (k / CROWN) * Math.PI * 2
        o.position.set(p.x, 0.62 * p.s + 0.2, p.z)
        o.rotation.set(0, a, 0)
        o.rotateX(0.25 + (k % 2) * 0.25)
        o.scale.setScalar(0.32 * p.s)
        o.updateMatrix()
        crowns.current?.setMatrixAt(ci, o.matrix)
        crowns.current?.setColorAt(ci, c.set(p.ripe ? '#6a9a48' : '#5a8a3e'))
        ci++
      }
    })
    for (const m of [leaves, crowns]) {
      if (!m.current) continue
      m.current.instanceMatrix.needsUpdate = true
      if (m.current.instanceColor) m.current.instanceColor.needsUpdate = true
      m.current.computeBoundingSphere()
    }
  }, [plants])
  const green = useSkin(false)
  const ripe = useSkin(true)
  return (
    <group>
      {/* แปลงดินร่วน (เฉพาะแบบแปลง) */}
      {!points && <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[cols * dx + 0.6, rows * dz + 0.6]} />
        <meshStandardMaterial color="#6a4e34" roughness={1} />
      </mesh>}
      <instancedMesh ref={leaves} args={[leafGeo, undefined, n * LEAVES]} castShadow>
        <meshStandardMaterial side={DoubleSide} roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[leafGeo, undefined, n * CROWN]}>
        <meshStandardMaterial side={DoubleSide} roughness={0.7} />
      </instancedMesh>
      {/* ลูกสับปะรดบนก้านกลางกอ */}
      {plants.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} scale={p.s}>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.02, 0.025, 0.4, 6]} />
            <meshStandardMaterial color="#6a8a3a" />
          </mesh>
          <mesh position={[0, 0.5, 0]} scale={[1, 1.35, 1]} castShadow>
            <sphereGeometry args={[0.11, 14, 10]} />
            <meshStandardMaterial map={p.ripe ? ripe : green} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
