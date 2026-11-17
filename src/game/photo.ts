/**
 * ถ่ายภาพจากฉาก 3D (เฉพาะภาพในเกม ไม่ติดปุ่ม/แถบสถานะ) แล้วบันทึกเป็นไฟล์ PNG ลงเครื่อง
 * ต้องสร้าง Canvas ด้วย gl={{ preserveDrawingBuffer: true }} ภาพจึงไม่ว่าง
 */
export function takePhoto(canvas: HTMLCanvasElement | null | undefined, name = 'baan-paiboon') {
  if (!canvas) return
  flash()
  canvas.toBlob((blob) => {
    if (!blob) return
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}-${stamp}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 3000)
  }, 'image/png')
}

/** แสงแฟลชขาววาบ + เสียงชัตเตอร์สั้น ๆ */
function flash() {
  const el = document.createElement('div')
  el.className = 'photo-flash'
  document.body.appendChild(el)
  window.setTimeout(() => el.remove(), 450)
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AC()
    const len = Math.floor(ctx.sampleRate * 0.08)
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
    const src = ctx.createBufferSource()
    src.buffer = buf
    const g = ctx.createGain()
    g.gain.value = 0.25
    src.connect(g).connect(ctx.destination)
    src.start()
    src.onended = () => void ctx.close()
  } catch {
    /* ไม่มีเสียงก็ไม่เป็นไร */
  }
}
