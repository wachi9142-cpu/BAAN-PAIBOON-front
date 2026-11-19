import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, DoubleSide, Object3D, PlaneGeometry, type InstancedMesh } from 'three'

/**
 * กอไผ่ (ตามภาพอ้างอิงของผู้สร้าง): ลำไผ่เรียวหลายสิบลำขึ้นชิดกันเป็นกอ เอนออกนิด ๆ ปลายโค้ง
 * ใบไผ่เรียวเล็กเป็นพุ่มฝอยครึ้มช่วงบน ห้อยลง · ลำและใบวาดแบบ instancing (กอละ 3 ชิ้น ไม่หน่วง)
 */
let leafGeo: PlaneGeometry | null = null
const leaf = () => {
  if (!leafGeo) {
    leafGeo = new PlaneGeometry(0.06, 0.32)
    leafGeo.translate(0, 0.16, 0)
  }
  return leafGeo
}

export function BambooClump({ seed = 1, culms = 16, height = 7.5 }: { seed?: number; culms?: number; height?: number }) {
  const stems = useRef<InstancedMesh>(null)
  const nodes = useRef<InstancedMesh>(null)
  const leaves = useRef<InstancedMesh>(null)
  const LEAVES = culms * 26
  const NODES = culms * 6
  const data = useMemo(() => {
    let s = Math.floor(seed * 9973) + 11
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
    return Array.from({ length: culms }, () => {
      const a = r() * Math.PI * 2
      const d = 0.15 + r() * 0.55
      const h = height * (0.75 + r() * 0.35)
      const lean = 0.06 + r() * 0.16
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, a, h, lean, rad: 0.035 + r() * 0.02, r }
    })
  }, [seed, culms, height])
  useLayoutEffect(() => {
    const o = new Object3D()
    const c = new Color()
    let li = 0
    let ni = 0
    data.forEach((cm, i) => {
      // ลำไผ่: เอนออกจากกลางกอ
      const tx = Math.cos(cm.a) * cm.lean
      const tz = Math.sin(cm.a) * cm.lean
      o.position.set(cm.x + (tx * cm.h) / 2, cm.h / 2, cm.z + (tz * cm.h) / 2)
      o.rotation.set(tz, 0, -tx)
      o.scale.set(cm.rad / 0.04, cm.h, cm.rad / 0.04)
      o.updateMatrix()
      stems.current?.setMatrixAt(i, o.matrix)
      stems.current?.setColorAt(i, c.set(i % 3 === 0 ? '#9ab04a' : i % 3 === 1 ? '#7f9a3e' : '#a8b85a'))
      // ข้อไผ่
      for (let k = 1; k <= 6; k++) {
        const t = k / 7
        o.position.set(cm.x + tx * cm.h * t, cm.h * t, cm.z + tz * cm.h * t)
        o.rotation.set(tz, 0, -tx)
        o.scale.set((cm.rad / 0.04) * 1.15, 1, (cm.rad / 0.04) * 1.15)
        o.updateMatrix()
        nodes.current?.setMatrixAt(ni++, o.matrix)
      }
      // ใบ: เป็นช่อตามข้อช่วงบน ห้อยโค้งออกนอกกอ
      for (let k = 0; k < 26; k++) {
        const t = 0.42 + cm.r() * 0.58
        const px = cm.x + tx * cm.h * t
        const pz = cm.z + tz * cm.h * t
        const yaw = cm.a + (cm.r() - 0.5) * 2.4
        const out = 0.15 + cm.r() * 0.6 * t
        o.position.set(px + Math.cos(yaw) * out, cm.h * t, pz + Math.sin(yaw) * out)
        o.rotation.set(0, -yaw + Math.PI / 2, 0)
        o.rotateX(1.2 + cm.r() * 0.9) // ห้อยลง
        o.scale.setScalar(0.8 + cm.r() * 0.6)
        o.updateMatrix()
        leaves.current?.setMatrixAt(li, o.matrix)
        leaves.current?.setColorAt(li, c.set(cm.r() < 0.5 ? '#7fb84a' : cm.r() < 0.5 ? '#9ccc5a' : '#6aa63e'))
        li++
      }
    })
    for (const m of [stems, nodes, leaves]) {
      if (!m.current) continue
      m.current.instanceMatrix.needsUpdate = true
      if (m.current.instanceColor) m.current.instanceColor.needsUpdate = true
      m.current.computeBoundingSphere()
    }
  }, [data])
  return (
    <group>
      {/* โคนกอ: ดินพูนกับกาบไผ่แห้ง */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.0, 18]} />
        <meshStandardMaterial color="#8a6a44" roughness={1} />
      </mesh>
      <instancedMesh ref={stems} args={[undefined, undefined, culms]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 1, 7]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={nodes} args={[undefined, undefined, NODES]}>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 7]} />
        <meshStandardMaterial color="#6a7a34" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[leaf(), undefined, LEAVES]} castShadow>
        <meshStandardMaterial side={DoubleSide} roughness={0.8} />
      </instancedMesh>
    </group>
  )
}
