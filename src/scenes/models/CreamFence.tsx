import { useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, ExtrudeGeometry, Object3D, Shape, type InstancedMesh } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * รั้วไม้ระแนงสีครีม (ตามภาพอ้างอิงบ้านฟ่าง): ระแนงปลายแหลมถี่ ๆ · คานนอน 2 เส้น · เสาเหลี่ยมทุก ~2.2 ม. หัวเสามีบัว + ลูกบอลกลม
 * วาดแบบ instancing ต่อแนวรั้ว (ไม่หน่วงแม้รั้วยาวรอบบ้าน)
 */
const CREAM = '#efe8cf'
const H = 1.0 // ความสูงระแนง

let picketGeo: ReturnType<typeof mergeGeometries> | null = null
function picketGeometry() {
  if (picketGeo) return picketGeo
  const body = new BoxGeometry(0.075, H - 0.08, 0.025).toNonIndexed()
  body.translate(0, (H - 0.08) / 2, 0)
  const s = new Shape()
  s.moveTo(-0.0375, 0)
  s.lineTo(0.0375, 0)
  s.lineTo(0, 0.09)
  s.closePath()
  const tip = new ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: false }).toNonIndexed()
  tip.translate(0, H - 0.08, -0.0125)
  body.deleteAttribute('uv')
  tip.deleteAttribute('uv')
  picketGeo = mergeGeometries([body, tip])
  return picketGeo
}

export function CreamFence({ x, z, len, rot = 0 }: { x: number; z: number; len: number; rot?: number }) {
  const pickets = useRef<InstancedMesh>(null)
  const posts = useRef<InstancedMesh>(null)
  const caps = useRef<InstancedMesh>(null)
  const balls = useRef<InstancedMesh>(null)
  const geo = useMemo(picketGeometry, [])
  const nP = Math.max(2, Math.round(len / 0.13))
  const nPost = Math.max(2, Math.round(len / 2.2) + 1)
  useLayoutEffect(() => {
    const o = new Object3D()
    for (let i = 0; i < nP; i++) {
      o.position.set(-len / 2 + (i + 0.5) * (len / nP), 0, 0.03)
      o.updateMatrix()
      pickets.current?.setMatrixAt(i, o.matrix)
    }
    for (let i = 0; i < nPost; i++) {
      const px = -len / 2 + (i / (nPost - 1)) * len
      o.position.set(px, 0.6, 0)
      o.updateMatrix()
      posts.current?.setMatrixAt(i, o.matrix)
      o.position.set(px, 1.22, 0)
      o.updateMatrix()
      caps.current?.setMatrixAt(i, o.matrix)
      o.position.set(px, 1.33, 0)
      o.updateMatrix()
      balls.current?.setMatrixAt(i, o.matrix)
    }
    for (const m of [pickets, posts, caps, balls]) if (m.current) m.current.instanceMatrix.needsUpdate = true
  }, [len, nP, nPost])
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <instancedMesh ref={pickets} args={[geo!, undefined, nP]} castShadow>
        <meshStandardMaterial color={CREAM} roughness={0.75} />
      </instancedMesh>
      {/* คานนอนบน-ล่าง */}
      {[0.22, 0.78].map((y) => (
        <mesh key={y} position={[0, y, -0.01]} castShadow>
          <boxGeometry args={[len, 0.08, 0.035]} />
          <meshStandardMaterial color="#e6dec2" roughness={0.75} />
        </mesh>
      ))}
      <instancedMesh ref={posts} args={[undefined, undefined, nPost]} castShadow>
        <boxGeometry args={[0.14, 1.2, 0.14]} />
        <meshStandardMaterial color={CREAM} roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[undefined, undefined, nPost]}>
        <boxGeometry args={[0.19, 0.06, 0.19]} />
        <meshStandardMaterial color="#e6dec2" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={balls} args={[undefined, undefined, nPost]} castShadow>
        <sphereGeometry args={[0.065, 12, 10]} />
        <meshStandardMaterial color="#f4eedc" roughness={0.6} />
      </instancedMesh>
    </group>
  )
}
