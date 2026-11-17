/**
 * โหมด "ย้ายที่" (ผู้สร้างจัดผังเอง): เลือกสิ่งของ/อาคาร → คลิกพื้นเพื่อวาง · หมุน · ขยับทีละนิด → บันทึก
 * ค่าที่ย้ายเก็บใน localStorage ของเครื่อง (ใช้กับทุกเซฟ ไม่ปนกับเซฟเกม) และคัดลอกเป็นข้อความส่งให้ผู้พัฒนาฝังลงโค้ดได้
 * ไฟล์นี้ห้าม import ข้อมูลหมู่บ้าน (village.ts ใช้ไฟล์นี้ตอนโหลด)
 */
import { create } from 'zustand'

export const LAYOUT_KEY = 'baan-paiboon-layout'

/** ค่าที่ย้าย: x,z = ตำแหน่งใหม่ (โลก หรือภายในบ้านตาสำหรับของในบ้าน) · rot = มุมหมุน (เรเดียน) */
export interface LayoutMove {
  x: number
  z: number
  rot: number
}
export type LayoutMap = Record<string, LayoutMove>

export function loadLayout(): LayoutMap {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    return raw ? (JSON.parse(raw) as LayoutMap) : {}
  } catch {
    return {}
  }
}
/** ค่าที่โหลดตอนเปิดเกม (ใช้กับข้อมูลที่คำนวณครั้งเดียว เช่น ผังหมู่บ้าน/กล่องชน) */
export const SAVED_LAYOUT: LayoutMap = loadLayout()

/** สิ่งที่ย้ายได้: ลงทะเบียนตอนแสดงผล (ตำแหน่งฐานในพิกัดโลก) */
export interface EditableInfo {
  id: string
  name: string
  /** ตำแหน่งปัจจุบันในพิกัดโลก */
  wx: number
  wz: number
  rot: number
  /** ของในบ้านตา: จุดกลางบ้าน (แปลงโลก ↔ ภายใน) */
  origin?: [number, number]
}
export const editables = new Map<string, EditableInfo>()

interface EditUi {
  active: boolean
  selected: string | null
  /** ค่าที่กำลังแก้ (ยังไม่บันทึก) ทับค่าที่บันทึกไว้ */
  draft: LayoutMap
  dirty: boolean
  /** กำลังกดค้างลากของอยู่ */
  dragging: boolean
}
export const useLayoutEdit = create<EditUi>(() => ({ active: false, selected: null, draft: { ...SAVED_LAYOUT }, dirty: false, dragging: false }))

export function toggleLayoutEdit() {
  useLayoutEdit.setState((s) => ({ active: !s.active, selected: s.active ? null : s.selected }))
}

/** ตั้งตำแหน่งใหม่ (รับพิกัดโลก) */
export function moveSelectedTo(wx: number, wz: number) {
  const s = useLayoutEdit.getState()
  if (!s.selected) return
  const info = editables.get(s.selected)
  if (!info) return
  const [ox, oz] = info.origin ?? [0, 0]
  const cur = s.draft[s.selected]
  useLayoutEdit.setState({ draft: { ...s.draft, [s.selected]: { x: wx - ox, z: wz - oz, rot: cur?.rot ?? info.rot } }, dirty: true })
}
export function nudgeSelected(dx: number, dz: number, drot = 0) {
  const s = useLayoutEdit.getState()
  if (!s.selected) return
  const info = editables.get(s.selected)
  if (!info) return
  const [ox, oz] = info.origin ?? [0, 0]
  const cur = s.draft[s.selected] ?? { x: info.wx - ox, z: info.wz - oz, rot: info.rot }
  useLayoutEdit.setState({ draft: { ...s.draft, [s.selected]: { x: cur.x + dx, z: cur.z + dz, rot: cur.rot + drot } }, dirty: true })
}
export function resetSelected() {
  const s = useLayoutEdit.getState()
  if (!s.selected) return
  const d = { ...s.draft }
  delete d[s.selected]
  useLayoutEdit.setState({ draft: d, dirty: true })
}
/** บันทึกแล้วโหลดเกมใหม่ (ผังหมู่บ้าน กล่องชน ต้นไม้ คำนวณใหม่ทั้งหมด) */
export function saveLayoutAndReload(beforeReload?: () => void) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(useLayoutEdit.getState().draft))
  } catch {
    /* เครื่องเต็ม */
  }
  beforeReload?.()
  location.reload()
}
export function clearAllLayout() {
  useLayoutEdit.setState({ draft: {}, dirty: true })
}
export function layoutText() {
  const d = useLayoutEdit.getState().draft
  const lines = Object.entries(d).map(([id, m]) => `${id}: x ${m.x.toFixed(1)}, z ${m.z.toFixed(1)}, หมุน ${Math.round((m.rot * 180) / Math.PI)}°`)
  return `ผังที่ย้ายในเกมบ้านไพบูลย์ (${lines.length} รายการ)\n${lines.join('\n')}\n\nJSON:\n${JSON.stringify(d)}`
}

/** ตำแหน่ง/มุมของสิ่งที่ย้ายได้ (ค่าที่กำลังแก้ → ค่าที่บันทึก → ค่าเดิมในโค้ด) */
export function layoutOf(id: string, base: { x: number; z: number; rot: number }, draft: LayoutMap) {
  const m = draft[id]
  return m ? { x: m.x, z: m.z, rot: m.rot } : base
}
