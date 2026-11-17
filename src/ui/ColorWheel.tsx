import { useEffect, useRef, useState } from 'react'

/**
 * วงล้อสี: กดหรือลากบนวงล้อเพื่อเลือกสี
 * มุม = เฉดสี (hue), ระยะจากกลาง = ความสด (saturation), แถบด้านล่าง = ความสว่าง
 */

interface Hsv {
  h: number // 0–360
  s: number // 0–1
  v: number // 0–1
}

function hsvToHex({ h, s, v }: Hsv) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  const to = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(f(5))}${to(f(3))}${to(f(1))}`
}

function hexToHsv(hex: string): Hsv {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max ? d / max : 0, v: max }
}

export function ColorWheel({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value))
  const wheel = useRef<HTMLDivElement>(null)

  // รับค่าจากภายนอก (เช่น กดสีตัวอย่าง) โดยไม่ทับค่าที่กำลังลากอยู่
  useEffect(() => {
    if (hsvToHex(hsv) !== value) setHsv(hexToHsv(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const update = (next: Hsv) => {
    setHsv(next)
    onChange(hsvToHex(next))
  }

  const pick = (e: React.PointerEvent) => {
    const el = wheel.current!
    const r = el.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    const radius = r.width / 2
    // conic-gradient เริ่มที่ด้านบนแล้ววนตามเข็มนาฬิกา
    let h = (Math.atan2(dx, -dy) * 180) / Math.PI
    if (h < 0) h += 360
    const s = Math.min(1, Math.hypot(dx, dy) / radius)
    update({ h, s, v: hsv.v })
  }

  const rad = (hsv.h * Math.PI) / 180
  const markerX = 50 + Math.sin(rad) * hsv.s * 50
  const markerY = 50 - Math.cos(rad) * hsv.s * 50
  const hex = hsvToHex(hsv)

  return (
    <div className="cw">
      <div
        ref={wheel}
        className="cw-wheel"
        role="slider"
        aria-label="วงล้อเลือกสีผม"
        aria-valuetext={hex}
        tabIndex={0}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          pick(e)
        }}
        onPointerMove={(e) => {
          if (e.buttons) pick(e)
        }}
      >
        <div className="cw-dim" style={{ opacity: 1 - hsv.v }} />
        <span className="cw-marker" style={{ left: `${markerX}%`, top: `${markerY}%`, background: hex }} />
      </div>
      <div className="cw-side">
        <span className="cw-swatch" style={{ background: hex }} />
        <code>{hex.toUpperCase()}</code>
        <label className="cw-bright">
          ความสว่าง
          <input
            type="range"
            min={0.08}
            max={1}
            step={0.01}
            value={hsv.v}
            onChange={(e) => update({ ...hsv, v: Number(e.target.value) })}
            style={{ background: `linear-gradient(90deg, #000, ${hsvToHex({ ...hsv, v: 1 })})` }}
          />
        </label>
      </div>
    </div>
  )
}
