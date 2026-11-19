import { useState } from 'react'
import { clearAllLayout, editables, layoutText, nudgeSelected, resetSelected, saveLayoutAndReload, setCreator, toggleLayoutEdit, useLayoutEdit } from '../game/layoutEdit'
import { useGame } from '../game/store'

/** ปุ่ม "ย้ายที่" + แผงคำสั่ง (ใช้เมาส์กดค้างลากในฉาก) */
export function LayoutEditor() {
  const active = useLayoutEdit((s) => s.active)
  const selected = useLayoutEdit((s) => s.selected)
  const dirty = useLayoutEdit((s) => s.dirty)
  const count = useLayoutEdit((s) => Object.keys(s.draft).length)
  const creator = useLayoutEdit((s) => s.creator)
  const [copied, setCopied] = useState(false)
  const name = selected ? (editables.get(selected)?.name ?? selected) : null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(layoutText())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      useGame.getState().toast({ title: 'คัดลอกไม่ได้', body: 'เบราว์เซอร์ไม่อนุญาตให้คัดลอก', tone: 'warn' })
    }
  }
  if (!import.meta.env.DEV) return null
  if (!creator)
    return (
      <button type="button" className="layout-toggle" onClick={() => setCreator(true)} title="เปิดสิทธิ์ผู้สร้างเกม (เฉพาะตอนพัฒนา)">
        👤 ผู้เล่นทั่วไป
      </button>
    )
  return (
    <>
      <button type="button" className={`layout-toggle${active ? ' on' : ''}`} onClick={toggleLayoutEdit} title="ย้ายตำแหน่งบ้าน อาคาร และของในบ้าน">
        {active ? '✓ เสร็จ' : '✋ ย้ายที่'}
      </button>
      {active && (
        <div className="layout-panel">
          <strong>โหมดย้ายที่ (ผู้สร้างเกม)</strong>
          <label className="layout-row">
            <input type="checkbox" checked={creator} onChange={(ev) => setCreator(ev.target.checked)} /> สิทธิ์ผู้สร้างเกม: ย้ายได้ทุกอย่าง (เอาออก = ทดลองเป็นผู้เล่นทั่วไป)
          </label>
          <p>
            กดเมาส์ค้างที่บ้าน/อาคาร/ของ แล้ว<b>ลาก</b>ไปวาง ปล่อยเมาส์ = วาง · หมุนล้อเมาส์ระหว่างลาก = หมุน · กดค้างที่พื้นว่าง = เมนูสร้าง
          </p>
          {name ? (
            <div className="layout-sel">
              <span>เลือก: {name}</span>
              <div className="layout-row">
                <button type="button" onClick={() => nudgeSelected(0, 0, -Math.PI / 12)}>
                  ↺ หมุน
                </button>
                <button type="button" onClick={() => nudgeSelected(0, 0, Math.PI / 12)}>
                  หมุน ↻
                </button>
                <button type="button" onClick={resetSelected}>
                  คืนที่เดิม
                </button>
              </div>
            </div>
          ) : (
            <span className="layout-hint">ยังไม่ได้เลือกอะไร</span>
          )}
          <div className="layout-row">
            <button type="button" className="primary" disabled={!dirty} onClick={() => saveLayoutAndReload(() => {
                useGame.getState().flushWorld?.()
                useGame.getState().saveNow('event')
              })}>
              บันทึกผัง (โหลดใหม่)
            </button>
            <button type="button" onClick={copy}>
              {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกส่งผู้พัฒนา'}
            </button>
          </div>
          <div className="layout-row">
            <span className="layout-hint">ย้ายไว้ {count} รายการ</span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('คืนทุกอย่างกลับตำแหน่งเดิมทั้งหมด?')) clearAllLayout()
              }}
            >
              คืนค่าทั้งหมด
            </button>
          </div>
        </div>
      )}
    </>
  )
}
