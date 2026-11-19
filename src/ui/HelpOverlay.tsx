import { useEffect, useState } from 'react'

const SEEN_KEY = 'baan-paiboon-help-seen'

const KEYS: [string, string][] = [
  ['W A S D', 'เดิน'],
  ['V', 'สลับเดินช้า/เดินเร็ว'],
  ['Shift ค้าง', 'วิ่ง'],
  ['Enter', 'กระโดด'],
  ['ลากเมาส์', 'หมุนกล้อง'],
  ['ล้อเมาส์', 'ซูมเข้า/ออก'],
  ['E', 'เก็บของ · คุย · เข้าร้าน'],
  ['1–9', 'เลือกช่องในแถบไอเทม (หรือคลิกช่อง)'],
  ['กดเมาส์ค้าง', 'สร้าง/ย้ายของในบ้านตัวเอง'],
  ['Z / X', 'เลื่อนเลือกสัตว์เพื่อนเดินทาง (9 ช่อง)'],
  ['Q', 'ผิวปากเรียกสัตว์'],
  ['L', 'จูง/ปล่อยสัตว์เลี้ยง'],
  ['R', 'ขี่สัตว์'],
  ['B', 'โหมดสร้าง'],
  ['C', 'ถ่ายภาพ'],
  ['P', 'พักเกม'],
  ['Esc', 'เมนู'],
  ['Ctrl+S', 'บันทึก'],
]

/** ปุ่ม ? มุมขวาล่าง: เปิดวิธีควบคุม · แสดงเองอัตโนมัติเฉพาะครั้งแรกที่เล่น */
export function HelpButton() {
  const [open, setOpen] = useState(() => {
    try {
      return !localStorage.getItem(SEEN_KEY)
    } catch {
      return false
    }
  })
  useEffect(() => {
    if (!open) return
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* ไม่เป็นไร */
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <>
      <button type="button" className="help-fab" onClick={() => setOpen((o) => !o)} aria-label="วิธีควบคุม" title="วิธีควบคุม">
        ?
      </button>
      {open && (
        <div className="help-overlay" onClick={() => setOpen(false)}>
          <div className="help-card" role="dialog" aria-label="วิธีควบคุม" onClick={(e) => e.stopPropagation()}>
            <h3>วิธีควบคุม</h3>
            <ul>
              {KEYS.map(([k, label]) => (
                <li key={k}>
                  <kbd>{k}</kbd>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <p className="hint">เปิดดูใหม่ได้ทุกเมื่อที่ปุ่ม ? มุมขวาล่าง</p>
            <button type="button" className="btn small" onClick={() => setOpen(false)}>
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </>
  )
}
