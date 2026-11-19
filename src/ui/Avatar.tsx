import { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { create } from 'zustand'
import { Box3, Vector3, type Group, type PerspectiveCamera } from 'three'
import { Character } from '../scenes/models/Character'
import type { Appearance } from '../game/content/appearance'

/**
 * รูปโปรไฟล์ผู้เล่น = ภาพหน้าตัวละครที่ผู้เล่นแต่งไว้ในเกม (ถ่ายจากโมเดล 3 มิติจริง)
 * ใช้ชุดเดียวกันทุกหน้า: เพิ่มเพื่อน · รายชื่อเพื่อน · คำเชิญ · หน้าจอผู้เล่นหลายคน
 * เปลี่ยนหน้าตาเมื่อไร รูปจะถ่ายใหม่เอง (กุญแจมาจากค่าหน้าตาทั้งหมด)
 */
const cache = new Map<string, string>()
const queue: { key: string; look: Appearance }[] = []
export const useAvatars = create<{ ver: number; busy: boolean }>(() => ({ ver: 0, busy: false }))

export const avatarKey = (a: Appearance) => JSON.stringify(a)

export function avatarOf(look: Appearance): string | null {
  const k = avatarKey(look)
  const hit = cache.get(k)
  if (hit) return hit
  if (!queue.some((q) => q.key === k)) {
    queue.push({ key: k, look })
    queueMicrotask(() => useAvatars.setState({ busy: true }))
  }
  return null
}

const motion = { current: 0 }

function Shooter() {
  const { gl, scene, camera } = useThree()
  const [cur, setCur] = useState<{ key: string; look: Appearance } | null>(null)
  const grp = useRef<Group>(null)
  const frames = useRef(0)
  useFrame(() => {
    const head = queue[0] ?? null
    if (!cur || !head || head.key !== cur.key) {
      if (head?.key !== cur?.key) {
        frames.current = 0
        setCur(head)
      }
      return
    }
    frames.current++
    // เล็งกล้องที่ใบหน้า: วัดความสูงตัวละคร (เด็ก/ผู้ใหญ่/ผู้สูงอายุสูงไม่เท่ากัน)
    if (frames.current === 2 && grp.current) {
      grp.current.updateMatrixWorld(true)
      const b = new Box3().setFromObject(grp.current)
      const h = b.getSize(new Vector3()).y
      const faceY = b.max.y - h * 0.15
      const cam = camera as PerspectiveCamera
      const dist = h * 0.62
      cam.position.set(0.12 * dist, faceY + h * 0.02, dist)
      cam.lookAt(0, faceY - h * 0.03, 0)
      cam.updateProjectionMatrix()
    }
    if (frames.current < 5) return
    gl.render(scene, camera)
    cache.set(cur.key, gl.domElement.toDataURL('image/png'))
    queue.shift()
    frames.current = 0
    useAvatars.setState((st) => ({ ver: st.ver + 1, busy: queue.length > 0 }))
  })
  if (!cur) return null
  return (
    <group key={cur.key} ref={grp}>
      <Character appearance={cur.look} motion={motion} />
    </group>
  )
}

/** สตูดิโอถ่ายรูปโปรไฟล์ (ซ่อนนอกจอ ทำงานเฉพาะตอนมีคิว) */
export function AvatarStudio() {
  const busy = useAvatars((s) => s.busy)
  if (!busy) return null
  return (
    <div style={{ position: 'fixed', left: -9999, top: 0, width: 160, height: 160 }} aria-hidden>
      <Canvas gl={{ preserveDrawingBuffer: true, alpha: true }} camera={{ position: [0, 1.5, 1.1], fov: 30 }} dpr={1}>
        <ambientLight intensity={0.95} />
        <directionalLight position={[1.5, 2.5, 3]} intensity={1.3} />
        <directionalLight position={[-2, 1, -1]} intensity={0.4} color="#cfe0ff" />
        <Shooter />
      </Canvas>
    </div>
  )
}

/** รูปโปรไฟล์กลม/มน (ระหว่างรอถ่าย = ตัวอักษรแรกของชื่อ) */
export function AvatarImg({ look, name, size = 56 }: { look: Appearance | null | undefined; name: string; size?: number }) {
  useAvatars((s) => s.ver)
  const url = look ? avatarOf(look) : null
  return url ? (
    <img className="avatar-img" src={url} alt={name} width={size} height={size} draggable={false} />
  ) : (
    <span className="avatar-img wait" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {name.trim().charAt(0) || '?'}
    </span>
  )
}
