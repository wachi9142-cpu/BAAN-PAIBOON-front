import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Plane, Raycaster, Vector2, Vector3, type Mesh } from 'three'
import { editables, moveSelectedTo, nudgeSelected, useLayoutEdit } from '../game/layoutEdit'
import { toggleBuild } from '../game/building'

const HOLD_MS = 280
const PICK_R = 5.5

/**
 * โหมดย้ายที่ (เมาส์/นิ้ว): กดค้างที่สิ่งของ → ยกขึ้น → ลากไปวาง → ปล่อย = วาง
 * ระหว่างลาก หมุนล้อเมาส์ = หมุนสิ่งของ · กดค้างบนพื้นว่าง = เปิดเมนูสร้างสิ่งปลูกสร้าง
 */
export function LayoutDragger() {
  const { gl, camera } = useThree()
  const active = useLayoutEdit((s) => s.active)
  const selected = useLayoutEdit((s) => s.selected)
  const ring = useRef<Mesh>(null)

  useEffect(() => {
    if (!active) return
    const el = gl.domElement
    const ray = new Raycaster()
    const ndc = new Vector2()
    const ground = new Plane(new Vector3(0, 1, 0), 0)
    const hit = new Vector3()
    let timer = 0
    let sx = 0
    let sy = 0
    let pending = false
    const groundAt = (cx: number, cy: number) => {
      const rc = el.getBoundingClientRect()
      ndc.set(((cx - rc.left) / rc.width) * 2 - 1, -((cy - rc.top) / rc.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      return ray.ray.intersectPlane(ground, hit) ? hit.clone() : null
    }
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return
      sx = e.clientX
      sy = e.clientY
      pending = true
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (!pending) return
        pending = false
        const p = groundAt(sx, sy)
        if (!p) return
        // หาสิ่งที่ย้ายได้ใกล้จุดที่กดที่สุด
        let best: string | null = null
        let bd = PICK_R
        for (const it of editables.values()) {
          const d = Math.hypot(it.wx - p.x, it.wz - p.z)
          if (d < bd) {
            bd = d
            best = it.id
          }
        }
        if (best) {
          useLayoutEdit.setState({ selected: best, dragging: true })
          if (navigator.vibrate) navigator.vibrate(20)
        } else {
          // กดค้างบนพื้นว่าง = เมนูสร้างสิ่งปลูกสร้าง
          useLayoutEdit.setState({ active: false, selected: null })
          toggleBuild(true)
        }
      }, HOLD_MS)
    }
    const move = (e: PointerEvent) => {
      if (pending && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
        // ขยับก่อนครบเวลา = หมุนกล้องตามปกติ ไม่ใช่การกดค้าง
        pending = false
        window.clearTimeout(timer)
      }
      if (!useLayoutEdit.getState().dragging) return
      const p = groundAt(e.clientX, e.clientY)
      if (p) moveSelectedTo(p.x, p.z)
    }
    const up = () => {
      pending = false
      window.clearTimeout(timer)
      if (useLayoutEdit.getState().dragging) useLayoutEdit.setState({ dragging: false })
    }
    const wheel = (e: WheelEvent) => {
      if (!useLayoutEdit.getState().dragging) return
      e.preventDefault()
      nudgeSelected(0, 0, (e.deltaY > 0 ? 1 : -1) * (Math.PI / 12))
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      window.clearTimeout(timer)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      el.removeEventListener('wheel', wheel)
      useLayoutEdit.setState({ dragging: false })
    }
  }, [active, gl, camera])

  // วงแหวนบอกสิ่งที่เลือก
  useFrame(({ clock }) => {
    const m = ring.current
    if (!m) return
    const s = useLayoutEdit.getState()
    const it = s.selected ? editables.get(s.selected) : null
    m.visible = s.active && !!it
    if (!it) return
    m.position.set(it.wx, 0.08 + (s.dragging ? 0.15 : 0), it.wz)
    const k = 1 + Math.sin(clock.elapsedTime * 5) * 0.06
    m.scale.set(k, k, k)
  })
  return (
    <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false} key={selected ?? 'none'}>
      <ringGeometry args={[2.2, 2.5, 40]} />
      <meshBasicMaterial color="#ffd23a" transparent opacity={0.85} depthWrite={false} />
    </mesh>
  )
}
