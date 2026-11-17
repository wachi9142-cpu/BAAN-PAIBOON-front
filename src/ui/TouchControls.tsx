import { useEffect, useRef, useState } from 'react'
import { requestJump, stick } from '../game/movement'

/**
 * ปุ่มบนจอสัมผัส: จอยสติกซ้ายล่าง (ดันนิดเดียว = เดินช้า · ดันสุด = เดินเร็ว) · ปุ่มวิ่ง (กดค้าง) · ปุ่มกระโดด
 * แสดงเฉพาะอุปกรณ์จอสัมผัส · ใช้เมาส์ลากจอยสติกได้ด้วย (เปิดดูบนจอคอมได้โดยเพิ่ม ?touch ในลิงก์)
 */
export function TouchControls() {
  const [show] = useState(() => {
    try {
      return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || new URLSearchParams(location.search).has('touch')
    } catch {
      return false
    }
  })
  const base = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState<[number, number]>([0, 0])
  const pid = useRef<number | null>(null)
  const R = 52

  useEffect(
    () => () => {
      stick.active = false
      stick.run = false
    },
    [],
  )
  if (!show) return null

  const move = (e: React.PointerEvent) => {
    const el = base.current
    if (!el || pid.current !== e.pointerId) return
    const rc = el.getBoundingClientRect()
    let dx = e.clientX - (rc.left + rc.width / 2)
    let dy = e.clientY - (rc.top + rc.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > R) {
      dx = (dx / d) * R
      dy = (dy / d) * R
    }
    setKnob([dx, dy])
    stick.active = true
    stick.x = dx / R
    stick.y = dy / R
  }
  const end = (e: React.PointerEvent) => {
    if (pid.current !== e.pointerId) return
    pid.current = null
    setKnob([0, 0])
    stick.active = false
    stick.x = 0
    stick.y = 0
  }

  return (
    <div className="touch-ctl">
      <div
        ref={base}
        className="touch-stick"
        onPointerDown={(e) => {
          pid.current = e.pointerId
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          move(e)
        }}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        aria-label="จอยสติกเดิน"
      >
        <div className="touch-knob" style={{ transform: `translate(${knob[0]}px, ${knob[1]}px)` }} />
      </div>
      <div className="touch-btns">
        <button
          type="button"
          className="touch-btn"
          onPointerDown={() => (stick.run = true)}
          onPointerUp={() => (stick.run = false)}
          onPointerLeave={() => (stick.run = false)}
          onPointerCancel={() => (stick.run = false)}
        >
          วิ่ง
        </button>
        <button type="button" className="touch-btn jump" onPointerDown={requestJump}>
          กระโดด
        </button>
      </div>
    </div>
  )
}
