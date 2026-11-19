import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Plane, Raycaster, Vector2, Vector3 } from 'three'
import { create } from 'zustand'
import { moveProblem, moveStructure, rotateTool, snap, structureAt, useBuild } from '../game/building'
import { inTerritory } from '../game/content/structures'
import { PLACES } from '../game/content/village'
import { canMove, commitLayout, editables, moveSelectedTo, nudgeSelected, useLayoutEdit } from '../game/layoutEdit'
import { useGame } from '../game/store'
import { recordEdit, snapshotNow } from '../game/editHistory'

/** วัตถุที่จัดการได้: สิ่งปลูกสร้างที่สร้างเอง · หรือวัตถุในผัง (บ้าน ร้าน ต้นไม้ ของในบ้านตา) */
export type HoldTarget = { kind: 'structure'; uid: string } | { kind: 'layout'; id: string }

/** สถานะ: เมนูที่เปิด · ของที่กำลังย้าย (สิ่งปลูกสร้าง) */
interface HoldState {
  menu: null | { kind: 'build'; at: [number, number]; sx: number; sy: number } | { kind: 'object'; t: HoldTarget; sx: number; sy: number }
  drag: null | { uid: string; x: number; z: number; rot: number; ok: boolean; why: string | null; moved: boolean; x0: number; z0: number }
  /** กำลังอยู่ในโหมดย้ายตำแหน่ง (หลังเลือกคำสั่ง "ย้ายตำแหน่ง") */
  moving: HoldTarget | null
}
export const useHold = create<HoldState>(() => ({ menu: null, drag: null, moving: null }))

const HOLD_MS = 380
const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' = 'info') => useGame.getState().toast({ title, body, tone })
const lockCam = (on: boolean) => useLayoutEdit.setState({ dragging: on })

/** ค่าเดิมก่อนย้าย (คืนเมื่อยกเลิก) */
let layoutBefore: { id: string; m: { x: number; z: number; rot: number } | undefined } | null = null
/** ภาพรวมก่อนย้าย (ลงประวัติเมื่อวางสำเร็จ) */
let snapBefore: ReturnType<typeof snapshotNow> = null

/** เริ่มโหมดย้ายตำแหน่ง (เรียกจากเมนู) — กล้องล็อกนิ่ง วัตถุตามเมาส์ คลิกเพื่อวาง */
export function startMove(t: HoldTarget, silent = false) {
  useHold.setState({ menu: null, moving: t })
  if (t.kind === 'structure') {
    const st = useGame.getState().save?.structures.find((x) => x.uid === t.uid)
    if (!st) return
    useHold.setState({ drag: { uid: st.uid, x: st.x, z: st.z, rot: st.rot, ok: true, why: null, moved: false, x0: st.x, z0: st.z } })
  } else {
    layoutBefore = { id: t.id, m: useLayoutEdit.getState().draft[t.id] }
    snapBefore = snapshotNow()
    useLayoutEdit.setState({ selected: t.id })
  }
  lockCam(true)
  if (!silent) toast('ย้ายตำแหน่ง', 'เลื่อนเมาส์ไปที่ใหม่ แล้วคลิกเพื่อวาง · R/ล้อเมาส์ = หมุน · คลิกขวา/Esc = ยกเลิก', 'info')
}

/** ยกเลิกการย้าย: ของกลับที่เดิม · ปลดล็อกกล้อง */
export function cancelMove(silent = false) {
  const mv = useHold.getState().moving
  if (mv?.kind === 'layout' && layoutBefore) {
    const d = { ...useLayoutEdit.getState().draft }
    if (layoutBefore.m) d[layoutBefore.id] = layoutBefore.m
    else delete d[layoutBefore.id]
    useLayoutEdit.setState({ draft: d, selected: null })
  }
  layoutBefore = null
  useHold.setState({ moving: null, drag: null })
  lockCam(false)
  if (!silent) toast('ยกเลิกการย้าย', 'ของกลับไปที่เดิมแล้ว', 'info')
}

/** ยืนยันวางที่ตำแหน่งปัจจุบัน */
export function confirmMove() {
  const mv = useHold.getState().moving
  if (!mv) return
  if (mv.kind === 'structure') {
    const d = useHold.getState().drag
    if (d) {
      const why = moveStructure(d.uid, d.x, d.z, d.rot)
      if (why) {
        toast('วางตรงนี้ไม่ได้', why + ' · ลองตำแหน่งอื่น', 'warn')
        return
      }
    }
    useHold.setState({ moving: null, drag: null })
    lockCam(false)
    toast('วางแล้ว', undefined, 'success')
    return
  }
  const id = mv.id
  // ผู้เล่นทั่วไป: ต้องวางในอาณาเขตของตัวเอง
  if (!useLayoutEdit.getState().creator) {
    const it = editables.get(id)
    const save = useGame.getState().save
    if (it && save && !inTerritory(it.wx, it.wz, save.ownedPlotIds)) {
      toast('วางนอกอาณาเขตไม่ได้', 'ย้ายบ้านและสิ่งปลูกสร้างของตัวเองได้ภายในพื้นที่ของคุณ · ลองตำแหน่งอื่น', 'warn')
      return
    }
  }
  if (id.startsWith('place:')) {
    const m = useLayoutEdit.getState().draft[id]
    const pl = PLACES.find((x) => 'place:' + x.id === id)
    if (m && pl) {
      pl.pos = [m.x, m.z]
      pl.rotation = m.rot
    }
  }
  recordEdit(snapBefore)
  snapBefore = null
  commitLayout()
  layoutBefore = null
  useLayoutEdit.setState({ selected: null })
  useHold.setState({ moving: null })
  lockCam(false)
  toast('วางแล้ว · บันทึกผังแล้ว', undefined, 'success')
}

/** หมุนของที่กำลังย้าย (ปุ่มหมุน / R / ล้อเมาส์) — ไม่กระทบกล้อง */
export function rotateMoving(dir: 1 | -1 = 1) {
  const mv = useHold.getState().moving
  if (!mv) return
  if (mv.kind === 'layout') nudgeSelected(0, 0, dir * (Math.PI / 12))
  else {
    const d = useHold.getState().drag
    if (!d) return
    const rot = (d.rot + (dir > 0 ? 1 : 3)) % 4
    const why = moveProblem(d.uid, d.x, d.z, rot)
    useHold.setState({ drag: { ...d, rot, ok: !why, why } })
  }
}

/** ของในผังที่กำลังย้าย วางตรงนี้ได้ไหม (ผู้เล่นทั่วไปต้องอยู่ในอาณาเขต) */
export function layoutMoveOk(id: string): boolean {
  if (useLayoutEdit.getState().creator) return true
  const it = editables.get(id)
  const save = useGame.getState().save
  return !!it && !!save && inTerritory(it.wx, it.wz, save.ownedPlotIds)
}

/**
 * กดเมาส์ค้าง (Click & Hold) ในฉาก
 * - กดค้างที่วัตถุ → เมนูจัดการวัตถุ (ย้ายตำแหน่ง · เก็บเข้าคลัง · ถอดทิ้ง/รื้อถอน · ยกเลิก) — ไม่ย้ายทันที
 * - เลือก "ย้ายตำแหน่ง" → กล้องนิ่ง วัตถุตามเมาส์ คลิกซ้าย = วาง · คลิกขวา/Esc = ยกเลิก
 * - กดค้างพื้นว่างในอาณาเขตตัวเอง → เมนูสร้าง
 * - ระหว่างกดลงบนวัตถุ กล้องล็อกไว้ก่อน (ถ้าลากออกก่อนครบเวลา = หมุนกล้องตามปกติ)
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
    let target: HoldTarget | null = null
    let pressMove = false
    /** กดค้างแล้วยังไม่ได้ลาก (ปล่อยตรงเดิม = เปิดเมนูแทน) */
    let holdStill = false
    let holdTarget: HoldTarget | null = null
    const groundAt = (cx: number, cy: number): [number, number] | null => {
      const rc = el.getBoundingClientRect()
      ndc.set(((cx - rc.left) / rc.width) * 2 - 1, -((cy - rc.top) / rc.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      return ray.ray.intersectPlane(ground, hit) ? [hit.x, hit.z] : null
    }
    const busy = () => useLayoutEdit.getState().active || useGame.getState().paused

    /** หาวัตถุใต้เมาส์: สิ่งปลูกสร้างของเรา → บ้าน ร้าน ต้นไม้ ของในบ้านตา (ตามสิทธิ์) */
    const findTarget = (p: [number, number]): HoldTarget | null => {
      const st = structureAt(p[0], p[1])
      if (st) return { kind: 'structure', uid: st.uid }
      let best: string | null = null
      let bd = Infinity
      for (const it of editables.values()) {
        if (it.id === 'place:home-tarang' || !canMove(it.id)) continue
        const d = Math.hypot(it.wx - p[0], it.wz - p[1])
        if (d < it.r && d - it.r < bd) {
          bd = d - it.r
          best = it.id
        }
      }
      if (best) return { kind: 'layout', id: best }
      // ไล่ตามแนวเมาส์ (ทรงกระบอกสูง 6 ม.) — กดที่พุ่มไม้/หลังคาก็จับได้
      const o = ray.ray.origin
      const dv = ray.ray.direction
      let bt = Infinity
      for (const it of editables.values()) {
        if (it.id === 'place:home-tarang' || !canMove(it.id)) continue
        const hl = dv.x * dv.x + dv.z * dv.z
        if (hl < 1e-6) continue
        const t = ((it.wx - o.x) * dv.x + (it.wz - o.z) * dv.z) / hl
        if (t <= 0) continue
        const px = o.x + dv.x * t
        const pz = o.z + dv.z * t
        const py = o.y + dv.y * t
        if (Math.hypot(px - it.wx, pz - it.wz) < it.r && py > 0 && py < 6 && t < bt) {
          bt = t
          best = it.id
        }
      }
      return best ? { kind: 'layout', id: best } : null
    }

    const down = (e: PointerEvent) => {
      if (busy()) return
      // โหมดย้ายตำแหน่ง: กดค้างลากได้ · ปล่อยเมาส์ = วาง (กล้องล็อกตลอด ไม่หมุนทั้งฉาก)
      if (useHold.getState().moving) {
        if (e.button === 0) pressMove = true
        return
      }
      if (e.button !== 0) return
      if (useHold.getState().menu) useHold.setState({ menu: null })
      sx = e.clientX
      sy = e.clientY
      window.clearTimeout(timer)
      if (useBuild.getState().active) return
      const p0 = groundAt(sx, sy)
      target = p0 ? findTarget(p0) : null
      pending = true
      if (target) {
        // กดลงบนวัตถุ: ล็อกกล้องไว้ก่อน · ค้างครบเวลา = เมนูจัดการวัตถุ
        lockCam(true)
        timer = window.setTimeout(() => {
          if (!pending || !target) return
          pending = false
          // กดค้างครบเวลา: หยิบของขึ้นมาทันที (เป็นสีเทา) · ลากไปแล้วปล่อย = วาง · ไม่ลาก = เปิดเมนู
          holdTarget = target
          startMove(target, true)
          pressMove = true
          holdStill = true
          if (navigator.vibrate) navigator.vibrate(15)
        }, HOLD_MS)
        return
      }
      // กดบนพื้นว่าง: กล้องหมุนได้ · ค้างนิ่ง ๆ = เมนูสร้าง
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
        if (pub) toast(`จัดการ${pub.name}ไม่ได้`, 'เป็นสิ่งปลูกสร้างส่วนกลาง/ของคนอื่น', 'info')
      }, HOLD_MS)
    }
    const move = (e: PointerEvent) => {
      const mv = useHold.getState().moving
      if (mv) {
        if (holdStill && Math.hypot(e.clientX - sx, e.clientY - sy) > 6) holdStill = false
        if (holdStill) return
        // วัตถุตามเมาส์ (กล้องนิ่ง)
        const p = groundAt(e.clientX, e.clientY)
        if (!p) return
        if (mv.kind === 'layout') moveSelectedTo(p[0], p[1])
        else {
          const d = useHold.getState().drag
          if (!d) return
          const x = snap(p[0])
          const z = snap(p[1])
          const why = moveProblem(d.uid, x, z, d.rot)
          useHold.setState({ drag: { ...d, x, z, ok: !why, why, moved: true } })
        }
        return
      }
      if (pending && Math.hypot(e.clientX - sx, e.clientY - sy) > 6) {
        // ลากออกก่อนครบเวลา = ไม่ใช่การกดค้าง → ปลดล็อกให้หมุนกล้องได้
        pending = false
        window.clearTimeout(timer)
        if (target) lockCam(false)
        target = null
      }
    }
    const up = (e: PointerEvent) => {
      if (useHold.getState().moving) {
        if (pressMove && e.button === 0) {
          pressMove = false
          if (holdStill && holdTarget) {
            // กดค้างแต่ไม่ได้ลาก → เมนูจัดการวัตถุ (ย้าย · เก็บ · รื้อ · ยกเลิก)
            holdStill = false
            cancelMove(true)
            useHold.setState({ menu: { kind: 'object', t: holdTarget, sx, sy } })
            holdTarget = null
            return
          }
          holdTarget = null
          confirmMove()
        }
        return
      }
      if (pending) {
        pending = false
        window.clearTimeout(timer)
      }
      // ปล่อยเมาส์ (เมนูเปิดอยู่หรือคลิกสั้น): ปลดล็อกกล้อง
      if (target) lockCam(false)
      target = null
    }
    const wheel = (e: WheelEvent) => {
      const mv = useHold.getState().moving
      if (mv) {
        e.preventDefault()
        rotateMoving(e.deltaY > 0 ? 1 : -1)
        return
      }
      const bs = useBuild.getState()
      if (bs.active && bs.tool && bs.tool !== 'remove') {
        e.preventDefault()
        rotateTool()
      }
    }
    const context = (e: MouseEvent) => {
      if (useHold.getState().moving) {
        e.preventDefault()
        cancelMove()
        return
      }
      if (useBuild.getState().active && useBuild.getState().once) {
        e.preventDefault()
        useBuild.setState({ active: false, tool: null, hover: null, once: false })
      }
    }
    const key = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' && !e.repeat && useHold.getState().moving) {
        e.stopImmediatePropagation()
        rotateMoving(1)
        return
      }
      if (e.code === 'Escape' && useHold.getState().moving) {
        e.stopImmediatePropagation()
        e.preventDefault()
        cancelMove()
      }
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('contextmenu', context)
    window.addEventListener('keydown', key, true)
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
  return <MoveMarker />
}

/** วงแหวน + เงาใต้ของที่กำลังย้าย: เขียว = วางได้ · แดง = วางไม่ได้ */
function MoveMarker() {
  const mv = useHold((s) => s.moving)
  useLayoutEdit((s) => s.draft)
  if (!mv || mv.kind !== 'layout') return null
  const it = editables.get(mv.id)
  if (!it) return null
  const ok = layoutMoveOk(mv.id)
  const c = ok ? '#3fcf6a' : '#e0443a'
  return (
    <group position={[it.wx, 0.05, it.wz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[it.r, 48]} />
        <meshBasicMaterial color={c} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[it.r - 0.12, it.r, 64]} />
        <meshBasicMaterial color={c} transparent opacity={0.9} depthWrite={false} />
      </mesh>
    </group>
  )
}
