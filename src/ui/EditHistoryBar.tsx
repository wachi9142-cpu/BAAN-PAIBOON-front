import { useEffect, useState } from 'react'
import { redoEdit, resetEdits, undoEdit, useEditHistory } from '../game/editHistory'
import { useBuild } from '../game/building'
import { useHold } from '../scenes/HoldInteract'

/** ปุ่มย้อนกลับ · ทำซ้ำ · คืนค่าเดิม (คืนค่าเดิมมีหน้าต่างยืนยัน) */
export function HistoryButtons() {
  const undo = useEditHistory((s) => s.undo.length)
  const redo = useEditHistory((s) => s.redo.length)
  const base = useEditHistory((s) => !!s.base)
  const [ask, setAsk] = useState(false)
  return (
    <>
      <button type="button" className="build-act" disabled={!undo} onClick={undoEdit} title="ย้อนกลับ (Ctrl+Z)">
        <span>↶</span>ย้อนกลับ
      </button>
      <button type="button" className="build-act" disabled={!redo} onClick={redoEdit} title="ทำซ้ำ (Ctrl+Y)">
        <span>↷</span>ทำซ้ำ
      </button>
      <button type="button" className="build-act" disabled={!base} onClick={() => setAsk(true)} title="คืนค่าเดิม">
        <span>⟲</span>คืนค่าเดิม
      </button>
      {ask && (
        <div className="menu-backdrop" onClick={() => setAsk(false)}>
          <div className="menu hist-confirm" role="alertdialog" aria-label="ยืนยันคืนค่าเดิม" onClick={(e) => e.stopPropagation()}>
            <h3>⟲ คืนค่าเดิมทั้งหมด?</h3>
            <p>สิ่งที่สร้าง ย้าย รื้อ หรือเก็บเข้าคลังตั้งแต่เริ่มแก้ไข จะกลับเป็นเหมือนเดิมทั้งหมด (ของในกระเป๋าและคลังคืนตามด้วย ไม่มีของหาย) · ถ้าเปลี่ยนใจ กดย้อนกลับได้</p>
            <div className="layout-row">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setAsk(false)
                  resetEdits()
                }}
              >
                คืนค่าเดิม
              </button>
              <button type="button" className="btn ghost" onClick={() => setAsk(false)}>
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/** แถบประวัติแบบลอย (ขวาบน) ตอนไม่ได้อยู่ในโหมดสร้าง · ปุ่มลัด Ctrl+Z / Ctrl+Y */
export function FloatingHistory() {
  const any = useEditHistory((s) => s.undo.length + s.redo.length > 0)
  const building = useBuild((s) => s.active)
  const moving = useHold((s) => !!s.moving)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || !(e.ctrlKey || e.metaKey) || useHold.getState().moving) return
      if (e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault()
        undoEdit()
      } else if (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey)) {
        e.preventDefault()
        redoEdit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  if (!any || building || moving) return null
  return (
    <div className="hist-float" role="toolbar" aria-label="ย้อนกลับ ทำซ้ำ คืนค่าเดิม">
      <HistoryButtons />
    </div>
  )
}
