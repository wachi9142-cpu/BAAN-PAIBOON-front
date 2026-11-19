import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { create } from 'zustand'
import { Box3, Vector3, type Group } from 'three'
import { Pet } from '../scenes/models/Pet'
import type { PetChoice } from '../game/content/pets'

/**
 * รูปสัตว์ 3 มิติ (แทน Emoji): ถ่ายรูปโมเดลสัตว์ตัวจริงในเกมครั้งเดียวแล้วเก็บไว้
 * ใช้ "สตูดิโอถ่ายรูป" ที่ซ่อนอยู่ 1 จอ ถ่ายทีละตัวตามคิว
 */
const cache = new Map<string, string>()
if (import.meta.env.DEV) (window as unknown as { __portraits: unknown }).__portraits = cache
const queue: { key: string; pet: PetChoice }[] = []
export const usePortraits = create<{ ver: number; busy: boolean }>(() => ({ ver: 0, busy: false }))

export const portraitKey = (p: PetChoice) => [p.species, p.name, p.color, p.pattern, p.patternColor, p.breed, p.size, p.fur, p.ears, p.tail, p.snout, p.hump, p.outfit].join('|')

/** ขอรูปสัตว์ (ได้ทันทีถ้าเคยถ่ายแล้ว ไม่งั้นเข้าคิวถ่าย) */
export function portraitOf(pet: PetChoice): string | null {
  const k = portraitKey(pet)
  const hit = cache.get(k)
  if (hit) return hit
  if (!queue.some((q) => q.key === k)) {
    queue.push({ key: k, pet })
    // อย่าเปลี่ยน state ระหว่างวาดหน้าจอ
    queueMicrotask(() => usePortraits.setState({ busy: true }))
  }
  return null
}

function Shooter() {
  const { gl, scene, camera } = useThree()
  const [cur, setCur] = useState<{ key: string; pet: PetChoice } | null>(null)
  const grp = useRef<Group>(null)
  const frames = useRef(0)
  const motion = useRef(0)
  const pose = useRef(0)
  useFrame(() => {
    const head = queue[0] ?? null
    // เปลี่ยนตัวที่จะถ่าย: แสดงโมเดลก่อน แล้วรอให้วาดเสร็จสักครู่
    if (!cur || !head || head.key !== cur.key) {
      if (head?.key !== cur?.key) {
        frames.current = 0
        setCur(head)
      }
      return
    }
    frames.current++
    // จัดขนาดให้พอดีกรอบ (สัตว์ตัวใหญ่ เช่น ควาย จะไม่ล้นกรอบ)
    if (frames.current === 2 && grp.current) fitTo(grp.current, 0.74, 0.38)
    if (frames.current < 5) return
    gl.render(scene, camera)
    cache.set(cur.key, gl.domElement.toDataURL('image/png'))
    queue.shift()
    frames.current = 0
    usePortraits.setState((st) => ({ ver: st.ver + 1, busy: queue.length > 0 }))
  })
  if (!cur) return null
  return (
    <group key={cur.key} ref={grp} rotation={[0, -0.55, 0]}>
      <Pet pet={cur.pet} motion={motion} pose={pose} />
    </group>
  )
}

/** สตูดิโอถ่ายรูปสัตว์ (ซ่อนอยู่นอกจอ) — วางไว้ครั้งเดียวในหน้าต่างทีมสัตว์ */
export function PortraitStudio() {
  const busy = usePortraits((s) => s.busy)
  if (!busy) return null
  return (
    <div style={{ position: 'fixed', left: -9999, top: 0, width: 192, height: 192 }} aria-hidden>
      <Canvas gl={{ preserveDrawingBuffer: true, alpha: true }} camera={{ position: [0.15, 0.62, 1.45], fov: 34 }} dpr={1} onCreated={({ camera }) => camera.lookAt(0, 0.38, 0)}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[2, 3, 3]} intensity={1.4} />
        <directionalLight position={[-2, 1, -1]} intensity={0.4} color="#cfe0ff" />
        <Shooter />
      </Canvas>
    </div>
  )
}

/** รูปสัตว์ (ระหว่างรอถ่าย แสดงวงกลมเรียบ ๆ) */
export function PetPortraitImg({ pet, size = 56 }: { pet: PetChoice; size?: number }) {
  usePortraits((s) => s.ver)
  const url = portraitOf(pet)
  return url ? <img src={url} alt={pet.name} width={size} height={size} draggable={false} style={{ display: 'block' }} /> : <span className="pp-wait" style={{ width: size, height: size }} />
}

/** ภาพสัตว์ตัวใหญ่ หมุนช้า ๆ มีชีวิต (หน้าต่างรายละเอียด) */
export function PetLivePreview({ pet }: { pet: PetChoice }) {
  return (
    <Canvas camera={{ position: [0.25, 0.7, 1.85], fov: 34 }} dpr={[1, 2]} onCreated={({ camera }) => camera.lookAt(0, 0.38, 0)}>
      <ambientLight intensity={0.85} />
      <directionalLight position={[2, 3, 3]} intensity={1.3} />
      <Spinner pet={pet} />
    </Canvas>
  )
}
function Spinner({ pet }: { pet: PetChoice }) {
  const g = useRef<Group>(null)
  const motion = useRef(0)
  const pose = useRef(0)
  const t = useRef(0)
  useFrame((_, dt) => {
    t.current += dt
    if (g.current) g.current.rotation.y = -0.5 + Math.sin(t.current * 0.6) * 0.6
    // นั่งพักเป็นระยะ ให้ดูมีชีวิต
    pose.current = Math.sin(t.current * 0.35) > 0.6 ? 1 : 0
  })
  useEffect(() => {
    t.current = 0
  }, [pet])
  useEffect(() => {
    const id = window.setTimeout(() => g.current && fitTo(g.current, 0.98, 0.38), 60)
    return () => window.clearTimeout(id)
  }, [pet])
  return (
    <group ref={g}>
      <Pet pet={pet} motion={motion} pose={pose} />
    </group>
  )
}

/** ย่อ/ขยายโมเดลให้ขนาดใหญ่สุดเท่ากับ size และวางกลางที่ความสูง cy */
export function fitTo(g: Group, size: number, cy: number) {
  g.scale.setScalar(1)
  g.position.set(0, 0, 0)
  g.updateMatrixWorld(true)
  const b = new Box3().setFromObject(g)
  const dim = b.getSize(new Vector3())
  const k = size / Math.max(0.01, dim.x, dim.y, dim.z)
  g.scale.setScalar(k)
  const c = b.getCenter(new Vector3())
  g.position.set(-c.x * k, cy - c.y * k, -c.z * k)
}
