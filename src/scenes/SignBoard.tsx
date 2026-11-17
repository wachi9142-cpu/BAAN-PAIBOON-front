import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

/** แผ่นป้ายไม้มีตัวหนังสือ (วาดลงแคนวาส) — ใช้กับป้ายในวัด/ร้าน */
export function SignBoard({
  lines,
  width,
  height,
  title,
  bg = '#f2e2bc',
  ink = '#4a2f1a',
  frame = '#7a4a22',
}: {
  lines: string[]
  width: number
  height: number
  title?: string
  bg?: string
  ink?: string
  frame?: string
}) {
  const key = JSON.stringify(lines)
  const tex = useMemo(() => {
    const px = 256
    const c = document.createElement('canvas')
    c.width = Math.round(px * width)
    c.height = Math.round(px * height)
    const g = c.getContext('2d')!
    g.fillStyle = frame
    g.fillRect(0, 0, c.width, c.height)
    g.fillStyle = bg
    const m = Math.round(px * 0.06)
    g.fillRect(m, m, c.width - m * 2, c.height - m * 2)
    g.fillStyle = ink
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    const rows = (title ? 1 : 0) + lines.length
    const rowH = (c.height - m * 2) / (rows + 0.6)
    let y = m + rowH * 0.8
    if (title) {
      g.font = `700 ${Math.round(rowH * 0.62)}px Mitr, Sarabun, sans-serif`
      g.fillText(title, c.width / 2, y)
      y += rowH
    }
    g.font = `500 ${Math.round(rowH * 0.5)}px Sarabun, Mitr, sans-serif`
    g.textAlign = title ? 'left' : 'center'
    for (const line of lines) {
      g.fillText(line, title ? m * 2.2 : c.width / 2, y)
      y += rowH
    }
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 4
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, width, height, title, bg, ink, frame])
  useEffect(() => () => tex.dispose(), [tex])
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={tex} />
    </mesh>
  )
}
