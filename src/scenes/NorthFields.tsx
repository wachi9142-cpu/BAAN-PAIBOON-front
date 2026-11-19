import { useLayoutEffect, useRef } from 'react'
import { Color, Object3D, type InstancedMesh } from 'three'
import { TextSprite } from './TextSprite'
import { FISH_PONDS, HAYSTACKS, NORTH, NORTH_PATH, pathX, NORTH_TREES, PADDIES, TALL_GRASS } from '../game/content/northFields'

/** ทุ่งนาเหนือหมู่บ้าน: ทางดิน หญ้าสูง ลอมฟาง ต้นไม้ บ่อน้ำ นาเป็นแปลง (ภาพ Soft 3D) */
const dummy = new Object3D()

export function NorthFields() {
  return (
    <group>
      {/* พื้นทุ่ง */}
      <mesh position={[(NORTH.minX + NORTH.maxX) / 2, 0.004, (116 + NORTH.maxZ + 10) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[NORTH.maxX - NORTH.minX + 10, NORTH.maxZ + 10 - 116]} />
        <meshStandardMaterial color="#8aa856" roughness={1} />
      </mesh>
      <Trail />
      <Grass />
      <Trees />
      {HAYSTACKS.map((h, i) => (
        <Haystack key={i} {...h} />
      ))}
      {/* บ่อเลี้ยงปลาสี่เหลี่ยม: คันดินรอบ + น้ำ + ศาลาเฝ้าบ่อเล็ก ๆ */}
      {FISH_PONDS.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[p.w + 2, p.d + 2]} />
            <meshStandardMaterial color="#9a805a" roughness={1} polygonOffset polygonOffsetFactor={-3} />
          </mesh>
          <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[p.w, p.d]} />
            <meshStandardMaterial color="#4f8aa0" roughness={0.15} metalness={0.2} polygonOffset polygonOffsetFactor={-5} />
          </mesh>
          {[-1, 1].map((sz) => (
            <mesh key={'z' + sz} position={[0, 0.16, (sz * (p.d + 1)) / 2]}>
              <boxGeometry args={[p.w + 2, 0.28, 1]} />
              <meshStandardMaterial color="#9a805a" />
            </mesh>
          ))}
          {[-1, 1].map((sx) => (
            <mesh key={'x' + sx} position={[(sx * (p.w + 1)) / 2, 0.16, 0]}>
              <boxGeometry args={[1, 0.28, p.d]} />
              <meshStandardMaterial color="#9a805a" />
            </mesh>
          ))}
        </group>
      ))}
      {/* นา: แปลงน้ำ/ต้นข้าว + คันนา */}
      {PADDIES.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[p.w, p.d]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#7ab84a' : i % 3 === 1 ? '#9ac85a' : '#8ab0a0'} roughness={0.8} />
          </mesh>
          {[-1, 1].map((sz) => (
            <mesh key={'z' + sz} position={[0, 0.1, (sz * p.d) / 2]}>
              <boxGeometry args={[p.w + 0.6, 0.2, 0.5]} />
              <meshStandardMaterial color="#9a805a" />
            </mesh>
          ))}
          {[-1, 1].map((sx) => (
            <mesh key={'x' + sx} position={[(sx * p.w) / 2, 0.1, 0]}>
              <boxGeometry args={[0.5, 0.2, p.d]} />
              <meshStandardMaterial color="#9a805a" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function Grass() {
  const ref = useRef<InstancedMesh>(null)
  const N = TALL_GRASS.length * 3
  useLayoutEffect(() => {
    const m = ref.current!
    const c = new Color()
    let n = 0
    TALL_GRASS.forEach((g, i) => {
      for (let k = 0; k < 3; k++) {
        dummy.position.set(g.x + Math.cos(g.r + k * 2.1) * 0.18, 0.55 * g.s, g.z + Math.sin(g.r + k * 2.1) * 0.18)
        dummy.rotation.set(Math.cos(g.r + k) * 0.25, g.r + k, Math.sin(g.r + k) * 0.25)
        dummy.scale.set(0.16 * g.s, 1.1 * g.s, 0.16 * g.s)
        dummy.updateMatrix()
        m.setMatrixAt(n, dummy.matrix)
        m.setColorAt(n, c.set(['#7a9a3a', '#8aaa42', '#9ab04a', '#6a8a32'][(i + k) % 4]))
        n++
      }
    })
    m.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} castShadow>
      <coneGeometry args={[1, 1, 4]} />
      <meshStandardMaterial roughness={1} flatShading />
    </instancedMesh>
  )
}

function Trees() {
  const trunk = useRef<InstancedMesh>(null)
  const crown = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const c = new Color()
    NORTH_TREES.forEach((t, i) => {
      dummy.rotation.set(0, i, 0)
      dummy.position.set(t.x, 2 * t.s, t.z)
      dummy.scale.set(t.s, 4 * t.s, t.s)
      dummy.updateMatrix()
      trunk.current!.setMatrixAt(i, dummy.matrix)
      dummy.position.set(t.x, 5 * t.s, t.z)
      dummy.scale.set(2.8 * t.s, 2.3 * t.s, 2.8 * t.s)
      dummy.updateMatrix()
      crown.current!.setMatrixAt(i, dummy.matrix)
      crown.current!.setColorAt(i, c.set(['#4f8a38', '#5a9a40', '#467e30'][i % 3]))
    })
    trunk.current!.instanceMatrix.needsUpdate = true
    crown.current!.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group>
      <instancedMesh ref={trunk} args={[undefined, undefined, NORTH_TREES.length]} castShadow>
        <cylinderGeometry args={[0.22, 0.32, 1, 7]} />
        <meshStandardMaterial color="#6a4e34" />
      </instancedMesh>
      <instancedMesh ref={crown} args={[undefined, undefined, NORTH_TREES.length]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.95} flatShading />
      </instancedMesh>
    </group>
  )
}

/** ลอมฟาง: กองฟางทรงสูงรอบเสาไม้ ยอดแหลม */
function Haystack({ x, z, s }: { x: number; z: number; s: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.5, 1.7, 2.8, 14]} />
        <meshStandardMaterial color="#d8b860" roughness={1} />
      </mesh>
      <mesh position={[0, 3.6, 0]} castShadow>
        <coneGeometry args={[1.6, 1.8, 14]} />
        <meshStandardMaterial color="#cfae58" roughness={1} />
      </mesh>
      <mesh position={[0, 4.9, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 1.2, 6]} />
        <meshStandardMaterial color="#6a4a2e" />
      </mesh>
    </group>
  )
}

/** ทางเดินเท้าคดเคี้ยวที่ชาวบ้านเดินจนเป็นทาง: ดินสองร่องกลางมีหญ้า · ปากทางมีเสาไม้ 2 ต้น + ป้าย "ทางไปทุ่งนา" + ลานดินกว้าง */
function Trail() {
  const segs: { x: number; z: number; a: number; len: number }[] = []
  const step = 2
  for (let z = NORTH_PATH.z0; z < NORTH_PATH.z1; z += step) {
    const x0 = pathX(z)
    const x1 = pathX(z + step)
    segs.push({ x: (x0 + x1) / 2, z: z + step / 2, a: Math.atan2(x1 - x0, step), len: Math.hypot(x1 - x0, step) + 0.15 })
  }
  const ex = pathX(NORTH_PATH.z0)
  return (
    <group>
      {segs.map((g, i) => (
        <group key={i} position={[g.x, 0, g.z]} rotation={[0, g.a, 0]}>
          {[-0.42, 0.42].map((dx) => (
            <mesh key={dx} position={[dx, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[0.62, g.len]} />
              <meshStandardMaterial color="#a27c54" roughness={1} polygonOffset polygonOffsetFactor={-3} />
            </mesh>
          ))}
          {/* หญ้าเตี้ยกลางทาง */}
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.24, g.len]} />
            <meshStandardMaterial color="#8aa04e" roughness={1} polygonOffset polygonOffsetFactor={-2} />
          </mesh>
        </group>
      ))}
      {/* ปากทาง: ลานดินกว้าง เชื่อมกับถนนดินแดง */}
      <mesh position={[ex, 0.031, NORTH_PATH.z0 + 1.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.4, 20]} />
        <meshStandardMaterial color="#a27c54" roughness={1} polygonOffset polygonOffsetFactor={-3} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[ex + sx * 1.6, 0.75, NORTH_PATH.z0 + 1.2]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 1.5, 7]} />
          <meshStandardMaterial color="#6a4a30" />
        </mesh>
      ))}
      <group position={[ex + 2.2, 0, NORTH_PATH.z0 + 0.6]} rotation={[0, Math.PI + 0.3, 0]}>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.08, 1.4, 0.08]} />
          <meshStandardMaterial color="#6a4a30" />
        </mesh>
        <mesh position={[0.1, 1.28, 0]}>
          <boxGeometry args={[0.9, 0.3, 0.05]} />
          <meshStandardMaterial color="#c8a468" />
        </mesh>
        <TextSprite text="ทางไปทุ่งนา" position={[0.1, 1.28, -0.04]} height={0.2} />
      </group>
    </group>
  )
}
