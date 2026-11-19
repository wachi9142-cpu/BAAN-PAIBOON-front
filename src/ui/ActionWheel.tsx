import { useEffect } from 'react'
import { create } from 'zustand'
import './actionwheel.css'

/**
 * วงล้อคำสั่ง (Radial Menu) ตามภาพอ้างอิงของผู้สร้าง — โผล่ขึ้นรอบตำแหน่งที่คลิก
 * ช่องโค้งรอบวงกลม แต่ละช่องมีไอคอน + ชื่อ + หมายเลข · ตรงกลางเป็นภาพ/สัญลักษณ์ของสิ่งที่คลิก
 * ชี้เมาส์ = ไฮไลต์ · คลิก/กดเลข 1–n = เลือก · คลิกขวา/Esc/คลิกนอกวง = ปิด
 * คำสั่งเปลี่ยนตามสิ่งที่คลิก (สัตว์ เตียง …) · คำสั่งที่ทำไม่ได้ = จางลง กดไม่ได้ (บอกเหตุผล)
 */
export interface WheelOption {
  id: string
  label: string
  icon: string
  disabled?: string | false
  run: () => void
}
interface WheelState {
  open: { x: number; y: number; title: string; center: string; options: WheelOption[] } | null
  hi: number
}
export const useActionWheel = create<WheelState>(() => ({ open: null, hi: -1 }))

export function openActionWheel(x: number, y: number, title: string, center: string, options: WheelOption[]) {
  useActionWheel.setState({ open: { x, y, title, center, options }, hi: -1 })
}
export const closeActionWheel = () => useActionWheel.setState({ open: null, hi: -1 })

const R_OUT = 122
const R_IN = 50
const GAP = 0.035 // ช่องว่างระหว่างช่อง (เรเดียน)

function sector(a0: number, a1: number) {
  const p = (r: number, a: number) => `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M ${p(R_IN, a0)} L ${p(R_OUT, a0)} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${p(R_OUT, a1)} L ${p(R_IN, a1)} A ${R_IN} ${R_IN} 0 ${large} 0 ${p(R_IN, a0)} Z`
}

function choose(i: number) {
  const o = useActionWheel.getState().open
  const opt = o?.options[i]
  if (!opt || opt.disabled) return
  closeActionWheel()
  opt.run()
}

export function ActionWheel() {
  const open = useActionWheel((s) => s.open)
  const hi = useActionWheel((s) => s.hi)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.stopImmediatePropagation()
        closeActionWheel()
      } else if (/^Digit[1-9]$/.test(e.code)) {
        e.stopImmediatePropagation()
        e.preventDefault()
        choose(Number(e.code.slice(5)) - 1)
      }
    }
    const onCtx = (e: MouseEvent) => {
      e.preventDefault()
      closeActionWheel()
    }
    window.addEventListener('keydown', onKey, { capture: true })
    window.addEventListener('contextmenu', onCtx, { capture: true })
    return () => {
      window.removeEventListener('keydown', onKey, { capture: true })
      window.removeEventListener('contextmenu', onCtx, { capture: true })
    }
  }, [open])
  if (!open) return null
  const n = open.options.length
  const size = R_OUT * 2 + 24
  // วางให้อยู่ในจอเสมอ
  const cx = Math.min(window.innerWidth - size / 2 - 8, Math.max(size / 2 + 8, open.x))
  const cy = Math.min(window.innerHeight - size / 2 - 8, Math.max(size / 2 + 40, open.y))
  const step = (Math.PI * 2) / n
  const cur = hi >= 0 ? open.options[hi] : null
  return (
    <div className="aw-backdrop" onMouseDown={closeActionWheel}>
      <div className="aw-wrap" style={{ left: cx, top: cy, width: size, height: size }} onMouseDown={(e) => e.stopPropagation()} role="menu" aria-label={open.title}>
        <div className="aw-title">{cur ? (cur.disabled ? `${cur.label} — ${cur.disabled}` : cur.label) : open.title}</div>
        <svg viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} width={size} height={size} className="aw-svg">
          <defs>
            <radialGradient id="awSeg" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#f6ead2" />
              <stop offset="100%" stopColor="#e6d2ae" />
            </radialGradient>
            <radialGradient id="awSegOn" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#fff8dc" />
              <stop offset="100%" stopColor="#f6d77a" />
            </radialGradient>
          </defs>
          {open.options.map((o, i) => {
            // ช่องแรกอยู่ด้านบน แล้ววนตามเข็มนาฬิกา
            const a0 = -Math.PI / 2 - step / 2 + i * step + GAP
            const a1 = a0 + step - GAP * 2
            return (
              <path
                key={o.id}
                d={sector(a0, a1)}
                className={'aw-seg' + (i === hi ? ' on' : '') + (o.disabled ? ' off' : '')}
                fill={i === hi && !o.disabled ? 'url(#awSegOn)' : 'url(#awSeg)'}
                onMouseEnter={() => useActionWheel.setState({ hi: i })}
                onMouseLeave={() => useActionWheel.setState({ hi: -1 })}
                onClick={() => choose(i)}
              />
            )
          })}
        </svg>
        {open.options.map((o, i) => {
          const a = -Math.PI / 2 + i * step
          const r = (R_OUT + R_IN) / 2 + 4
          return (
            <div
              key={o.id + 'l'}
              className={'aw-item' + (i === hi ? ' on' : '') + (o.disabled ? ' off' : '')}
              style={{ left: size / 2 + Math.cos(a) * r, top: size / 2 + Math.sin(a) * r }}
            >
              <span className="aw-icon">{o.icon}</span>
              <span className="aw-label">{o.label}</span>
              <span className="aw-num">{i + 1}</span>
            </div>
          )
        })}
        <div className="aw-center">
          <span>{open.center}</span>
        </div>
      </div>
    </div>
  )
}
