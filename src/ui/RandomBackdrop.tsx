import { useEffect, useState } from 'react'

/**
 * ภาพพื้นหลังแบบสุ่ม (เช่นหน้าสร้างตัวละคร): เข้ามาแต่ละรอบสุ่มได้ 1 ใน 4 ภาพ
 * วางไฟล์ที่ public/images/<prefix>-1.jpg ... -4.jpg — ภาพไหนยังไม่มีจะถูกข้าม
 * ไม่มีภาพเลย → คืนค่า null (ใช้พื้นหลังเดิม)
 */
export function useRandomBackdrop(prefix: string, count = 4) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    const order = Array.from({ length: count }, (_, i) => i + 1).sort(() => Math.random() - 0.5)
    const tryNext = (i: number) => {
      if (!alive || i >= order.length) return
      const src = `/images/${prefix}-${order[i]}.jpg`
      const img = new Image()
      img.onload = () => alive && setUrl(src)
      img.onerror = () => tryNext(i + 1)
      img.src = src
    }
    tryNext(0)
    return () => {
      alive = false
    }
  }, [prefix, count])
  return url
}
