import { useEffect, useMemo } from 'react'
import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three'

const PX = 48 // ความละเอียดตัวอักษรบน texture
const FONT = `500 ${PX}px Mitr, Sarabun, sans-serif`

function draw(canvas: HTMLCanvasElement, text: string, color: string) {
  const ctx = canvas.getContext('2d')!
  ctx.font = FONT
  const padX = PX * 0.6
  const w = Math.ceil(ctx.measureText(text).width + padX * 2)
  const h = Math.ceil(PX * 1.7)
  canvas.width = w
  canvas.height = h
  ctx.font = FONT
  ctx.fillStyle = 'rgba(246, 239, 225, 0.88)'
  const r = h / 2
  ctx.beginPath()
  ctx.roundRect(0, 0, w, h, r)
  ctx.fill()
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, w / 2, h / 2 + PX * 0.05)
  return w / h
}

/**
 * ป้ายข้อความลอยในฉาก 3D (หันหาผู้เล่นเสมอ)
 * วาดด้วยฟอนต์ของเบราว์เซอร์ จึงแสดงภาษาไทยได้ถูกต้อง
 */
export function TextSprite({ text, color = '#2e2a24', height = 1, position }: {
  text: string
  color?: string
  height?: number
  position: [number, number, number]
}) {
  const { texture, canvas } = useMemo(() => {
    const canvas = document.createElement('canvas')
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    texture.minFilter = LinearFilter
    return { texture, canvas }
  }, [])

  const aspect = useMemo(() => draw(canvas, text, color), [canvas, text, color])

  // วาดใหม่เมื่อฟอนต์ Mitr โหลดเสร็จ
  useEffect(() => {
    let alive = true
    document.fonts?.load(FONT, text).then(() => {
      if (!alive) return
      draw(canvas, text, color)
      texture.needsUpdate = true
    })
    texture.needsUpdate = true
    return () => {
      alive = false
    }
  }, [canvas, texture, text, color])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <sprite position={position} scale={[height * aspect, height, 1]} center={[0.5, 0]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  )
}
