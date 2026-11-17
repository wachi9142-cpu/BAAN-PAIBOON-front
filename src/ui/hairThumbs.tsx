import { useEffect, useState, type ReactNode } from 'react'
import { createRoot, flushSync } from '@react-three/fiber'
import { HAIR_STYLES, type Appearance, type HairStyleId } from '../game/content/appearance'
import { Character } from '../scenes/models/Character'
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
      {/* หุ่นหัว: หัว คอ บ่า ตา (แสงอยู่ใน renderAll) */}
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
        <mesh key={x} position={[x, 1.563, 0.158]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#2a2220" />
        </mesh>
      ))}
      <Hair style={style} color={hair} />
    </>
  )
}

interface ThumbView {
  /** ตำแหน่งกล้อง และจุดที่มอง */
  eye: [number, number, number]
  at: [number, number, number]
  fov: number
}
/** มุมกล้อง: หัวอย่างเดียว (ทรงผม) / หัวถึงอก (สีผิว เพศ) */
const HEAD: ThumbView = { eye: [0.32, 1.64, 0.9], at: [0, 1.56, 0], fov: 34 }
export const FACE: ThumbView = { eye: [0.08, 1.58, 0.78], at: [0, 1.56, 0], fov: 28 }
/** ซูมใกล้: เห็นดวงตาชัด / เห็นปากชัด */
export const EYES: ThumbView = { eye: [0, 1.575, 0.6], at: [0, 1.57, 0], fov: 24 }
export const MOUTH: ThumbView = { eye: [0, 1.48, 0.55], at: [0, 1.49, 0], fov: 18 }
export const BUST: ThumbView = { eye: [0.45, 1.5, 1.75], at: [0, 1.32, 0], fov: 34 }

async function renderAll(items: { id: string; node: ReactNode }[], view: ThumbView): Promise<Record<string, string>> {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const root = createRoot(canvas)
  await root.configure({
    gl: { preserveDrawingBuffer: true, alpha: true, antialias: true },
    camera: { fov: view.fov, position: view.eye, near: 0.1, far: 10 },
    frameloop: 'never',
    size: { width: SIZE, height: SIZE, top: 0, left: 0 },
    dpr: 1,
  })
  const out: Record<string, string> = {}
  for (const it of items) {
    let store!: ReturnType<typeof root.render>
    flushSync(() => {
      store = root.render(
        <>
          <hemisphereLight args={['#fff6e0', '#b0a090', 1.8]} />
          <directionalLight position={[-2, 2, -2]} intensity={0.9} />
          <directionalLight position={[2, 3, 3]} intensity={1.4} />
          {it.node}
        </>,
      )
    })
    const { gl, scene, camera } = store.getState()
    camera.lookAt(...view.at)
    gl.setClearColor(0x000000, 0)
    gl.render(scene, camera)
    out[it.id] = canvas.toDataURL('image/png')
  }
  root.unmount()
  return out
}

/** วาดรูปตัวอย่างชุดหนึ่ง (เก็บแคชตาม key) — ระหว่างวาดคืนค่าชุดเดิม */
function useThumbs(key: string, build: () => { id: string; node: ReactNode }[], view: ThumbView) {
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
        .then(() => renderAll(build(), view))
        .then((imgs) => {
          cache.set(key, imgs)
          if (alive) setThumbs(imgs)
        })
        .catch(() => {
          /* วาดไม่ได้ (เช่น WebGL ไม่พร้อม) → แสดงช่องว่างแทน */
        })
    }, 250)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return thumbs
}

/** รูปทุกทรงผม ตามสีผมและสีผิวปัจจุบัน */
export function useHairThumbs(hair: string, skin: string) {
  return useThumbs('hair|' + hair + '|' + skin, () => HAIR_STYLES.map((s) => ({ id: s.id, node: <HeadScene style={s.id} hair={hair} skin={skin} /> })), HEAD)
}

/** รูปหุ่นหัวถึงอก: ตัวละครปัจจุบันที่เปลี่ยนค่าเดียว (เช่น สีผิว หรือเพศ) */
export function useVariantThumbs(prefix: string, look: Appearance, variants: { id: string; patch: Partial<Appearance> }[], view: ThumbView = BUST) {
  const base = { ...look, cane: undefined, kidItem: undefined, basket: undefined, bag: 'none' as const }
  const key = prefix + '|' + JSON.stringify(base) + '|' + variants.map((v) => v.id).join(',')
  return useThumbs(key, () => variants.map((v) => ({ id: v.id, node: <Character appearance={{ ...base, ...v.patch }} /> })), view)
}
