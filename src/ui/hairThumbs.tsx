import { useEffect, useState } from 'react'
import { createRoot, flushSync } from '@react-three/fiber'
import { HAIR_STYLES, type HairStyleId } from '../game/content/appearance'
import { Hair } from '../scenes/models/Hair'

/**
 * รูปตัวอย่างทรงผม (หุ่นมีแต่หัว) — วาดด้วยโมเดล 3D จริงลงแคนวาสเดียว แล้วเก็บเป็นรูป
 * วาดใหม่เมื่อเปลี่ยนสีผม/สีผิว (เก็บแคชไว้ ไม่วาดซ้ำ)
 */
const SIZE = 160
const cache = new Map<string, Record<string, string>>()
let queue: Promise<unknown> = Promise.resolve()

function HeadScene({ style, hair, skin }: { style: HairStyleId; hair: string; skin: string }) {
  return (
    <>
      <hemisphereLight args={['#fff6e0', '#b0a090', 1.8]} />
      <directionalLight position={[-2, 2, -2]} intensity={0.9} />
      <directionalLight position={[2, 3, 3]} intensity={1.4} />
      {/* หุ่นหัว: หัว คอ บ่า ตา */}
      <mesh position={[0, 1.57, 0]}>
        <sphereGeometry args={[0.17, 16, 12]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
      <mesh position={[0, 1.38, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.12, 8]} />
        <meshStandardMaterial color={skin} flatShading />
      </mesh>
      <mesh position={[0, 1.27, -0.01]}>
        <boxGeometry args={[0.42, 0.12, 0.24]} />
        <meshStandardMaterial color="#e9e1d2" flatShading />
      </mesh>
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 1.59, 0.155]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#2a2220" />
        </mesh>
      ))}
      <Hair style={style} color={hair} />
    </>
  )
}

async function renderAll(hair: string, skin: string): Promise<Record<string, string>> {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const root = createRoot(canvas)
  await root.configure({
    gl: { preserveDrawingBuffer: true, alpha: true, antialias: true },
    camera: { fov: 34, position: [0.32, 1.64, 0.9], near: 0.1, far: 10 },
    frameloop: 'never',
    size: { width: SIZE, height: SIZE, top: 0, left: 0 },
    dpr: 1,
  })
  const out: Record<string, string> = {}
  for (const s of HAIR_STYLES) {
    let store!: ReturnType<typeof root.render>
    flushSync(() => {
      store = root.render(<HeadScene style={s.id} hair={hair} skin={skin} />)
    })
    const { gl, scene, camera } = store.getState()
    camera.lookAt(0, 1.56, 0)
    gl.setClearColor(0x000000, 0)
    gl.render(scene, camera)
    out[s.id] = canvas.toDataURL('image/png')
  }
  root.unmount()
  return out
}

/** รูปตัวอย่างทุกทรงผม ตามสีผมและสีผิวปัจจุบัน (ระหว่างวาดคืนค่าชุดเดิม) */
export function useHairThumbs(hair: string, skin: string) {
  const key = `${hair}|${skin}`
  const [thumbs, setThumbs] = useState<Record<string, string>>(() => cache.get(key) ?? {})
  useEffect(() => {
    const hit = cache.get(key)
    if (hit) {
      setThumbs(hit)
      return
    }
    let alive = true
    // รอสักครู่ (ลากวงล้อสีอยู่จะไม่วาดทุกเฟรม) แล้วต่อคิว วาดทีละชุด
    const t = window.setTimeout(() => {
      queue = queue
        .then(() => renderAll(hair, skin))
        .then((imgs) => {
          cache.set(key, imgs)
          if (alive) setThumbs(imgs)
        })
        .catch(() => {
          /* วาดไม่ได้ (เช่น WebGL ไม่พร้อม) → ใช้ปุ่มข้อความแทน */
        })
    }, 250)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [key, hair, skin])
  return thumbs
}
