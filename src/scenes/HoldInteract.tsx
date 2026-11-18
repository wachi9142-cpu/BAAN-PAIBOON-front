import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Plane, Raycaster, Vector2, Vector3 } from 'three'
import { create } from 'zustand'
import { moveProblem, moveStructure, rotateTool, snap, structureAt, useBuild } from '../game/building'
import { inTerritory } from '../game/content/structures'
import { PLACES } from '../game/content/village'
import { useLayoutEdit } from '../game/layoutEdit'
import { useGame } from '../game/store'

/** สถานะการกดค้าง: เมนูที่เปิด · ของที่กำลังลาก */
interface HoldState {
  menu: null | { kind: 'build'; at: [number, number]; sx: number; sy: number } | { kind: 'item'; uid: string; sx: number; sy: number }
  drag: null | { uid: string; x: number; z: number; rot: number; ok: boolean; why: string | null; moved: boolean; x0: number; z0: number }
}
export const useHold = create<HoldState>(() => ({ menu: null, drag: null }))

const HOLD_MS = 320
const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' = 'info') => useGame.getState().toast({ title, body, tone })

/**
 * กดเมาส์ค้าง (Click & Hold) ในฉาก — ไม่ต้องเปิดโหมดด้วยคีย์บอร์ด
 * - กดค้างพื้นว่างในอาณาเขตตัวเอง → เมนูสร้าง (เลือกแล้วเลื่อนเมาส์ คลิกยืนยันวาง)
 * - กดค้างที่ของของตัวเอง → ยกขึ้น ลากไปที่ใหม่ ปล่อย = วาง (หมุนล้อเมาส์ = หมุน)
 * - กดค้างแล้วปล่อยโดยไม่ลาก → เมนูของชิ้นนั้น (หมุน · เก็บเข้าคลัง · รื้อ)
 * - สิ่งปลูกสร้างส่วนกลาง (บ้านคนอื่น ร้าน วัด โรงเรียน) ย้ายไม่ได้
 */
export function HoldInteract() {
  const { gl, camera } = useThree()
  useEffect(() => {
    const el = gl.domElement
    const ray = new Raycaster()
    const ndc = new Vector2()
    const ground = new Plane(new Vector3(0, 1, 0), 0)
    const hit = new Vector3()
    let timer = 0
    let sx = 0
    let sy = 0
    let pending = false
    const groundAt = (cx: number, cy: number): [number, number] | null => {
      const rc = el.getBoundingClientRect()
      ndc.set(((cx - rc.left) / rc.width) * 2 - 1, -((cy - rc.top) / rc.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      return ray.ray.intersectPlane(ground, hit) ? [hit.x, hit.z] : null
    }
    const busy = () => useLayoutEdit.getState().active || useGame.getState().paused
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || busy()) return
      if (useHold.getState().menu) useHold.setState({ menu: null })
      sx = e.clientX
      sy = e.clientY
      pending = true
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (!pending) return
        pending = false
        const p = groundAt(sx, sy)
        const save = useGame.getState().save
        if (!p || !save) return
        // กำลังวางของจากเมนูอยู่: คลิกปกติเป็นการวาง ไม่เปิดเมนูซ้อน
        if (useBuild.getState().active) return
        const s = structureAt(p[0], p[1])
        if (s) {
          useHold.setState({ drag: { uid: s.uid, x: s.x, z: s.z, rot: s.rot, ok: true, why: null, moved: false, x0: s.x, z0: s.z } })
          useLayoutEdit.setState({ dragging: true })
          if (navigator.vibrate) navigator.vibrate(20)
          return
        }
        if (inTerritory(p[0], p[1], save.ownedPlotIds)) {
          useHold.setState({ menu: { kind: 'build', at: [snap(p[0]), snap(p[1])], sx, sy } })
          return
        }
        const pub = PLACES.find((pl) => Math.abs(pl.pos[0] - p[0]) < pl.size[0] / 2 + 1 && Math.abs(pl.pos[1] - p[1]) < pl.size[1] / 2 + 1)
        if (pub) toast(`ย้าย${pub.name}ไม่ได้`, 'เป็นสิ่งปลูกสร้างส่วนกลาง/ของคนอื่น · สร้างและย้ายของได้เฉพาะในอาณาเขตของตัวเอง', 'info')
        else toast('ตรงนี้ไม่ใช่อาณาเขตของคุณ', 'กดค้างในบ้านตารัง–ยายเลียน หรือที่ดินของคุณ เพื่อสร้าง/ย้ายของ', 'info')
      }, HOLD_MS)
    }
    const move = (e: PointerEvent) => {
      if (pending && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
        pending = false
        window.clearTimeout(timer)
      }
      const d = useHold.getState().drag
      if (!d) return
      const p = groundAt(e.clientX, e.clientY)
      if (!p) return
      const x = snap(p[0])
      const z = snap(p[1])
      const why = moveProblem(d.uid, x, z, d.rot)
      useHold.setState({ drag: { ...d, x, z, ok: !why, why, moved: d.moved || Math.hypot(x - d.x0, z - d.z0) > 0.4 } })
    }
    const up = (e: PointerEvent) => {
      pending = false
      window.clearTimeout(timer)
      const d = useHold.getState().drag
      if (!d) return
      useHold.setState({ drag: null })
      useLayoutEdit.setState({ dragging: false })
      if (!d.moved) {
        // กดค้างแล้วปล่อยเฉย ๆ = เปิดเมนูของชิ้นนี้
        useHold.setState({ menu: { kind: 'item', uid: d.uid, sx: e.clientX, sy: e.clientY } })
        return
      }
      const why = moveStructure(d.uid, d.x, d.z, d.rot)
      if (why) toast('วางตรงนี้ไม่ได้', why + ' · ของกลับไปที่เดิม', 'warn')
    }
    const wheel = (e: WheelEvent) => {
      const d = useHold.getState().drag
      if (d) {
        e.preventDefault()
        const rot = (d.rot + 1) % 4
        const why = moveProblem(d.uid, d.x, d.z, rot)
        useHold.setState({ drag: { ...d, rot, ok: !why, why } })
        return
      }
      if (useBuild.getState().active && useBuild.getState().once) {
        e.preventDefault()
        rotateTool()
      }
    }
    const context = (e: MouseEvent) => {
      // คลิกขวา = ยกเลิกการวางจากเมนูกดค้าง
      if (useBuild.getState().active && useBuild.getState().once) {
        e.preventDefault()
        useBuild.setState({ active: false, tool: null, hover: null, once: false })
      }
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('contextmenu', context)
    return () => {
      window.clearTimeout(timer)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('contextmenu', context)
    }
  }, [gl, camera])
  return null
}
