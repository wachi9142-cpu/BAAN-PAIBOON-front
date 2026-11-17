// ผ้าถุง / ผ้าซิ่น และลายผ้า — บ้านไพบูลย์ขึ้นชื่อเรื่องผ้าไหม (โดยเฉพาะลายลูกแก้ว)
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

export type SarongPatternId = 'plain' | 'lukkaew' | 'mudmee' | 'khit' | 'stripes' | 'jok' | 'checks'

export const SARONG_PATTERNS: { id: SarongPatternId; label: string; note: string }[] = [
  { id: 'lukkaew', label: 'ลายลูกแก้ว', note: 'ผ้าไหมขึ้นชื่อของบ้านไพบูลย์ ลายข้าวหลามตัดเล็ก ๆ เรียงกัน' },
  { id: 'mudmee', label: 'มัดหมี่', note: 'มัดย้อมเส้นไหมก่อนทอ ขอบลายพลิ้วนุ่ม' },
  { id: 'khit', label: 'ลายขิด', note: 'ลายเรขาคณิตยกดอกแบบอีสาน' },
  { id: 'jok', label: 'ตีนจก', note: 'ผ้าพื้นเรียบ เชิงผ้าทอลวดลายเต็ม' },
  { id: 'stripes', label: 'ลายทาง', note: 'ผ้าถุงลายทางขวาง ใส่ทุกวัน' },
  { id: 'checks', label: 'ลายตาราง', note: 'ลายตารางแบบผ้าฝ้ายพื้นบ้าน' },
  { id: 'plain', label: 'พื้นเรียบ', note: 'ผ้าพื้นสีเดียว มีเชิงผ้า' },
]

/** สีลายผ้า (เส้นไหมสีที่ทอแทรก) */
export const SARONG_ACCENTS: { id: string; label: string; color: string }[] = [
  { id: 'gold', label: 'ทอง', color: '#d9a441' },
  { id: 'cream', label: 'ครีม', color: '#f2e6cf' },
  { id: 'red', label: 'แดง', color: '#b8323a' },
  { id: 'green', label: 'เขียว', color: '#5c8a3a' },
  { id: 'blue', label: 'ฟ้า', color: '#6f9ac4' },
  { id: 'purple', label: 'ม่วง', color: '#8a5aa8' },
  { id: 'black', label: 'ดำ', color: '#262427' },
]
export const sarongAccent = (v: string | undefined) =>
  !v ? SARONG_ACCENTS[0].color : v.startsWith('#') ? v : (SARONG_ACCENTS.find((a) => a.id === v) ?? SARONG_ACCENTS[0]).color

/** ชุดที่เป็นผ้าถุง/ผ้าซิ่น (เลือกลายผ้าได้) */
export const SARONG_OUTFITS = ['phasin', 'phathung']

const W = 256
const H = 256

/** วาดลายผ้าลงแคนวาส: ตัวผ้าด้านบน + เชิงผ้า (ตีนซิ่น) ด้านล่าง */
export function drawSarong(ctx: CanvasRenderingContext2D, pattern: SarongPatternId, base: string, accent: string) {
  const dark = shade(base, 0.6)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, W, H)
  const body = H - 46 // ส่วนตัวผ้า เหลือด้านล่างเป็นเชิง

  if (pattern === 'lukkaew') {
    // ลายลูกแก้ว: ข้าวหลามตัดเล็กเรียงเป็นตาข่าย มีจุดกลาง
    ctx.strokeStyle = accent
    ctx.lineWidth = 2
    const s = 16
    for (let y = 0; y < body; y += s) {
      for (let x = (y / s) % 2 ? s / 2 : 0; x < W + s; x += s) {
        ctx.beginPath()
        ctx.moveTo(x, y - s / 2)
        ctx.lineTo(x + s / 2, y)
        ctx.lineTo(x, y + s / 2)
        ctx.lineTo(x - s / 2, y)
        ctx.closePath()
        ctx.stroke()
        ctx.fillStyle = accent
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
      }
    }
  } else if (pattern === 'mudmee') {
    // มัดหมี่: แถบลายขอเกี่ยว ขอบเบลอเหมือนเส้นไหมมัดย้อม
    ctx.save()
    ctx.shadowColor = accent
    ctx.shadowBlur = 4
    ctx.fillStyle = accent
    for (let row = 0; row < body; row += 36) {
      for (let x = 0; x < W; x += 32) {
        const cx = x + 16
        const cy = row + 18
        ctx.beginPath()
        ctx.moveTo(cx, cy - 12)
        ctx.lineTo(cx + 12, cy)
        ctx.lineTo(cx, cy + 12)
        ctx.lineTo(cx - 12, cy)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = base
        ctx.fillRect(cx - 4, cy - 4, 8, 8)
        ctx.fillStyle = accent
      }
    }
    ctx.restore()
  } else if (pattern === 'khit') {
    // ลายขิด: สามเหลี่ยมฟันปลาเรียงแถว สลับแถบจุด
    ctx.fillStyle = accent
    for (let row = 4; row < body; row += 28) {
      for (let x = 0; x < W; x += 16) {
        ctx.beginPath()
        ctx.moveTo(x, row + 12)
        ctx.lineTo(x + 8, row)
        ctx.lineTo(x + 16, row + 12)
        ctx.closePath()
        ctx.fill()
      }
      for (let x = 4; x < W; x += 8) ctx.fillRect(x, row + 18, 3, 3)
    }
  } else if (pattern === 'stripes') {
    // ลายทางขวาง ความกว้างไม่เท่ากัน
    const bands = [6, 3, 10, 3, 6, 14]
    let y = 0
    let k = 0
    while (y < body) {
      const h = bands[k % bands.length]
      if (k % 2 === 0) {
        ctx.fillStyle = k % 4 === 0 ? accent : dark
        ctx.fillRect(0, y, W, h)
      }
      y += h + 6
      k++
    }
  } else if (pattern === 'checks') {
    ctx.globalAlpha = 0.55
    ctx.fillStyle = accent
    for (let x = 0; x < W; x += 32) ctx.fillRect(x, 0, 10, body)
    for (let y = 0; y < body; y += 32) ctx.fillRect(0, y, W, 10)
    ctx.globalAlpha = 1
  }

  // ---------- เชิงผ้า (ตีนซิ่น) ----------
  ctx.fillStyle = dark
  ctx.fillRect(0, body, W, H - body)
  ctx.fillStyle = accent
  ctx.fillRect(0, body + 3, W, 3)
  ctx.fillRect(0, H - 6, W, 3)
  if (pattern === 'plain') return
  // ลายในเชิงผ้า: ตีนจกทำลายเต็ม แบบอื่นเป็นลายฟันปลาเล็ก
  if (pattern === 'jok') {
    for (let x = 0; x < W; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x + 10, body + 9)
      ctx.lineTo(x + 19, body + 23)
      ctx.lineTo(x + 10, body + 37)
      ctx.lineTo(x + 1, body + 23)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = base
      ctx.fillRect(x + 8, body + 21, 4, 4)
      ctx.fillStyle = accent
    }
  } else {
    for (let x = 0; x < W; x += 12) {
      ctx.beginPath()
      ctx.moveTo(x, body + 30)
      ctx.lineTo(x + 6, body + 16)
      ctx.lineTo(x + 12, body + 30)
      ctx.closePath()
      ctx.fill()
    }
  }
}

const cache = new Map<string, CanvasTexture>()

/** เท็กซ์เจอร์ลายผ้าสำหรับกระโปรง (ใช้ร่วมกัน ไม่ต้องลบทิ้ง) */
export function sarongTexture(pattern: SarongPatternId, base: string, accent: string) {
  const key = `${pattern}|${base}|${accent}`
  let tex = cache.get(key)
  if (!tex) {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    drawSarong(c.getContext('2d')!, pattern, base, accent)
    tex = new CanvasTexture(c)
    tex.colorSpace = SRGBColorSpace
    tex.wrapS = RepeatWrapping
    tex.repeat.set(2, 1)
    tex.anisotropy = 4
    cache.set(key, tex)
  }
  return tex
}

/** รูปตัวอย่างลายผ้า (สำหรับปุ่มเลือก) */
export function sarongSwatch(pattern: SarongPatternId, base: string, accent: string) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  drawSarong(c.getContext('2d')!, pattern, base, accent)
  return c.toDataURL('image/png')
}

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.round(v * k).toString(16).padStart(2, '0')
  return '#' + ch((n >> 16) & 255) + ch((n >> 8) & 255) + ch(n & 255)
}
