/**
 * ย้อนกลับ / ทำซ้ำ / คืนค่าเดิม (Undo · Redo · Reset) ของการสร้าง · ย้าย · รื้อ · เก็บเข้าคลัง
 * เก็บ "ภาพรวมก่อนแก้" เป็นลำดับ ย้อนได้หลายขั้น · ของในกระเป๋า/คลังย้อนตามด้วย จึงไม่มีของหายหรืองอก
 */
import { create } from 'zustand'
import { useGame, type SaveData } from './store'
import { commitLayout, useLayoutEdit, type LayoutMap } from './layoutEdit'
import { PLACES } from './content/village'

interface Snap {
  layout: LayoutMap
  structures: SaveData['structures']
  storedStructures: SaveData['storedStructures']
  inventory: SaveData['inventory']
  chests: SaveData['chests']
}

const MAX = 50
export const useEditHistory = create<{ undo: Snap[]; redo: Snap[]; base: Snap | null }>(() => ({ undo: [], redo: [], base: null }))

/** ตำแหน่งสถานที่ตอนเปิดเกม (ไว้คืนค่าเมื่อย้อนการย้ายสถานที่) */
const PLACE0 = new Map(PLACES.map((p) => [p.id, { pos: [...p.pos] as [number, number], rotation: p.rotation }]))

function take(): Snap | null {
  const s = useGame.getState().save
  if (!s) return null
  return { layout: { ...useLayoutEdit.getState().draft }, structures: s.structures, storedStructures: s.storedStructures, inventory: s.inventory, chests: s.chests }
}

/** จดภาพรวมก่อนแก้ (เรียกก่อนเปลี่ยนแปลงทุกครั้ง) — ส่ง snap มาเองได้ (เช่น ค่าก่อนเริ่มลาก) */
export function recordEdit(before?: Snap | null) {
  const s = before ?? take()
  if (!s) return
  useEditHistory.setState((h) => ({ undo: [...h.undo, s].slice(-MAX), redo: [], base: h.base ?? s }))
}
export const snapshotNow = take

function apply(s: Snap) {
  const g = useGame.getState()
  if (!g.save) return
  useGame.setState({ save: { ...g.save, structures: s.structures, storedStructures: s.storedStructures, inventory: s.inventory, chests: s.chests }, dirty: true })
  useLayoutEdit.setState({ draft: { ...s.layout }, selected: null })
  for (const p of PLACES) {
    const m = s.layout['place:' + p.id]
    const o = PLACE0.get(p.id)
    if (m) {
      p.pos = [m.x, m.z]
      p.rotation = m.rot
    } else if (o) {
      p.pos = [...o.pos] as [number, number]
      p.rotation = o.rotation
    }
  }
  commitLayout()
  g.saveNow('event')
}

const toast = (title: string, body?: string) => useGame.getState().toast({ title, body, tone: 'info' })

export function undoEdit() {
  const h = useEditHistory.getState()
  const prev = h.undo[h.undo.length - 1]
  const cur = take()
  if (!prev || !cur) return toast('ไม่มีอะไรให้ย้อนกลับ')
  useEditHistory.setState({ undo: h.undo.slice(0, -1), redo: [...h.redo, cur] })
  apply(prev)
  toast('↶ ย้อนกลับแล้ว', `ย้อนได้อีก ${h.undo.length - 1} ขั้น`)
}

export function redoEdit() {
  const h = useEditHistory.getState()
  const next = h.redo[h.redo.length - 1]
  const cur = take()
  if (!next || !cur) return toast('ไม่มีอะไรให้ทำซ้ำ')
  useEditHistory.setState({ redo: h.redo.slice(0, -1), undo: [...h.undo, cur] })
  apply(next)
  toast('↷ ทำซ้ำแล้ว')
}

/** คืนค่าเดิม: กลับไปเหมือนก่อนเริ่มแก้ครั้งแรก (ยังย้อนกลับการคืนค่านี้ได้ด้วย Undo) */
export function resetEdits() {
  const h = useEditHistory.getState()
  const cur = take()
  if (!h.base || !cur) return toast('ยังไม่มีการแก้ไข')
  useEditHistory.setState({ undo: [...h.undo, cur].slice(-MAX), redo: [] })
  apply(h.base)
  toast('⟲ คืนค่าเดิมแล้ว', 'กดย้อนกลับได้ถ้าเปลี่ยนใจ')
}
