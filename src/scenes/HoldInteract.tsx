import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Plane, Raycaster, Vector2, Vector3 } from 'three'
import { create } from 'zustand'
import { moveProblem, moveStructure, rotateTool, snap, structureAt, useBuild } from '../game/building'
import { inTerritory } from '../game/content/structures'
import { PLACES } from '../game/content/village'
import { commitLayout, DEV_MOVE, editables, moveSelectedTo, nudgeSelected, useLayoutEdit } from '../game/layoutEdit'
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
    let devDrag = false
    const groundAt = (cx: number, cy: number): [number, number] | null => {
      const rc = el.getBoundingClientRect()
      ndc.set(((cx - rc.left) / rc.width) * 2 - 1, -((cy - rc.top) / rc.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      return ray.ray.intersectPlane(ground, hit) ? [hit.x, hit.z] : null
    }
    const busy = () => useLayoutEdit.getState().active || useGame.getState().paused
    /** ล็อกกล้อง: หน้าจอนิ่ง ระหว่างจับ/ลากวัตถุ */
    const lockCam = (on: boolean) => useLayoutEdit.setState({ dragging: on })
    type Target = { kind: 'structure'; uid: string } | { kind: 'dev'; id: string }
    let target: Target | null = null
    /** ค่าเดิมก่อนลาก (ไว้คืนเมื่อยกเลิก) */
    let devBefore: { id: string; m: { x: number; z: number; rot: number } | undefined } | null = null

    /** หาวัตถุใต้เมาส์: สิ่งปลูกสร้างของเรา → (ผู้พัฒนา) บ้าน ร้าน ของในบ้านตา */
    const findTarget = (p: [number, number]): Target | null => {
      const st = structureAt(p[0], p[1])
      if (st) return { kind: 'structure', uid: st.uid }
      if (!DEV_MOVE) return null
      let best: string | null = null
      let bd = Infinity
      for (const it of editables.values()) {
        // ทั้งบริเวณบ้านตาไม่ลากทั้งก้อน · ย้ายได้ทีละหลัง/ทีละชิ้น
        if (it.id === 'place:home-tarang') continue
        const d = Math.hypot(it.wx - p[0], it.wz - p[1])
        if (d < it.r && d - it.r < bd) {
          bd = d - it.r
          best = it.id
        }
      }
      return best ? { kind: 'dev', id: best } : null
    }
    const beginDrag = () => {
      if (!target || devDrag || useHold.getState().drag) return
      pending = false
      window.clearTimeout(timer)
      if (target.kind === 'structure') {
        const st = useGame.getState().save?.structures.find((t) => t.uid === (target as { uid: string }).uid)
        if (!st) return
        useHold.setState({ drag: { uid: st.uid, x: st.x, z: st.z, rot: st.rot, ok: true, why: null, moved: false, x0: st.x, z0: st.z } })
      } else {
        devBefore = { id: target.id, m: useLayoutEdit.getState().draft[target.id] }
        useLayoutEdit.setState({ selected: target.id })
        devDrag = true
      }
      lockCam(true)
      if (navigator.vibrate) navigator.vibrate(20)
    }
    /** ยกเลิกการย้าย: ของกลับที่เดิม · ปลดล็อกกล้อง */
    const cancelDrag = () => {
      if (devDrag && devBefore) {
        const d = { ...useLayoutEdit.getState().draft }
        if (devBefore.m) d[devBefore.id] = devBefore.m
        else delete d[devBefore.id]
        useLayoutEdit.setState({ draft: d, selected: null })
        devDrag = false
        devBefore = null
      }
      if (useHold.getState().drag) useHold.setState({ drag: null })
      target = null
      pending = false
      window.clearTimeout(timer)
      lockCam(false)
      toast('ยกเลิกการย้าย', 'ของกลับไปที่เดิมแล้ว', 'info')
    }

    const down = (e: PointerEvent) => {
      if (e.button !== 0 || busy()) return
      if (useHold.getState().menu) useHold.setState({ menu: null })
      sx = e.clientX
      sy = e.clientY
      window.clearTimeout(timer)
      const p0 = groundAt(sx, sy)
      // กำลังวางของจากเมนูอยู่: คลิกปกติเป็นการวาง
      if (useBuild.getState().active) return
      target = p0 ? findTarget(p0) : null
      if (target) {
        // กดลงบนวัตถุ: ล็อกกล้องทันที (หน้าจอไม่หมุนตามเมาส์) · ขยับเมาส์หรือค้างไว้ = ยกขึ้นลาก
        lockCam(true)
        pending = true
        timer = window.setTimeout(() => {
          if (pending) beginDrag()
        }, 220)
        return
      }
      // กดบนพื้นว่าง: กล้องหมุนได้ตามปกติ · ค้างไว้นิ่ง ๆ = เมนูสร้าง
      pending = true
      timer = window.setTimeout(() => {
        if (!pending) return
        pending = false
        const p = groundAt(sx, sy)
        const save = useGame.getState().save
        if (!p || !save) return
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
      const far = Math.hypot(e.clientX - sx, e.clientY - sy) > 4
      if (pending && target && far) beginDrag()
      else if (pending && !target && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
        pending = false
        window.clearTimeout(timer)
      }
      if (devDrag) {
        const q = groundAt(e.clientX, e.clientY)
        if (q) moveSelectedTo(q[0], q[1])
        return
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
      const hadTarget = target
      target = null
      if (devDrag) {
        devDrag = false
        devBefore = null
        lockCam(false)
        const id = useLayoutEdit.getState().selected
        // ย้ายสถานที่ในหมู่บ้าน: อัปเดตข้อมูลสถานที่ทันที (ป้ายชื่อ ระยะใกล้ กล่องชน)
        if (id?.startsWith('place:')) {
          const m = useLayoutEdit.getState().draft[id]
          const pl = PLACES.find((x) => 'place:' + x.id === id)
          if (m && pl) {
            pl.pos = [m.x, m.z]
            pl.rotation = m.rot
          }
        }
        commitLayout()
        useLayoutEdit.setState({ selected: null })
        return
      }
      const d = useHold.getState().drag
      if (!d) {
        // กดบนวัตถุแล้วปล่อยเร็ว ๆ (ไม่ได้ลาก): ปลดล็อกกล้อง
        if (hadTarget) lockCam(false)
        return
      }
      useHold.setState({ drag: null })
      lockCam(false)
      if (!d.moved) {
        // จับแล้วปล่อยโดยไม่ลาก = เมนูของชิ้นนี้
        useHold.setState({ menu: { kind: 'item', uid: d.uid, sx: e.clientX, sy: e.clientY } })
        return
      }
      const why = moveStructure(d.uid, d.x, d.z, d.rot)
      if (why) toast('วางตรงนี้ไม่ได้', why + ' · ของกลับไปที่เดิม', 'warn')
    }
    const wheel = (e: WheelEvent) => {
      if (devDrag) {
        e.preventDefault()
        nudgeSelected(0, 0, (e.deltaY > 0 ? 1 : -1) * (Math.PI / 12))
        return
      }
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
      // คลิกขวาระหว่างลาก = ยกเลิก คืนที่เดิม
      if (devDrag || useHold.getState().drag) {
        e.preventDefault()
        cancelDrag()
        return
      }
      // คลิกขวา = ยกเลิกการวางจากเมนูกดค้าง
      if (useBuild.getState().active && useBuild.getState().once) {
        e.preventDefault()
        useBuild.setState({ active: false, tool: null, hover: null, once: false })
      }
    }
    const key = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && (devDrag || useHold.getState().drag)) {
        e.stopImmediatePropagation()
        cancelDrag()
      }
    }
    window.addEventListener('keydown', key, true)
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
      window.removeEventListener('keydown', key, true)
    }
  }, [gl, camera])
  return null
}
