/**
 * ระบบลม (GAME_DESIGN §2.63)
 * - แรงลมพื้นฐานมาจากสภาพอากาศ (weatherRt.wind: แดดจัด 0.05 · ลมแรงก่อนฝน 0.8 · พายุ 0.9)
 * - ลมกระโชกเป็นช่วง ๆ (บ่อยและแรงขึ้นเมื่ออากาศมีลมมาก)
 * - ทิศลมค่อย ๆ เปลี่ยน · ลมหยุดแล้วต้นไม้/หญ้าค่อย ๆ กลับที่เดิม (ไล่ค่านุ่ม ๆ)
 * ค่าทั้งหมดอยู่ใน uniform ที่ shader ของต้นไม้/หญ้าใช้ร่วมกัน (ไม่ทำให้ React render ใหม่)
 */
import { Vector2 } from 'three'
import { weatherRt } from './weather'

export const windU = {
  uTime: { value: 0 },
  /** แรงลมต่อเนื่อง 0–1 */
  uWind: { value: 0.15 },
  /** แรงลมกระโชก 0–1 */
  uGust: { value: 0 },
  /** ทิศลม (หน่วยเวกเตอร์บนพื้น x,z) */
  uDir: { value: new Vector2(0.8, 0.6) },
}

let dirA = 0.65
let gust = 0
let gustTarget = 0
let nextGust = 4
let force: number | null = null

/** ระดับลมเป็นคำ (ใช้แสดงผล/ดีบัก) */
export function windLevel(): 'ลมสงบ' | 'ลมอ่อน' | 'ลมปานกลาง' | 'ลมแรง' {
  const w = windU.uWind.value + windU.uGust.value * 0.5
  return w < 0.1 ? 'ลมสงบ' : w < 0.3 ? 'ลมอ่อน' : w < 0.6 ? 'ลมปานกลาง' : 'ลมแรง'
}

export function tickWind(t: number, dt: number) {
  windU.uTime.value = t
  const base = force ?? weatherRt.wind
  const k = 1 - Math.exp(-dt * 0.6)
  windU.uWind.value += (base - windU.uWind.value) * k
  // ทิศลมแกว่งช้า ๆ
  dirA += (Math.sin(t * 0.021) * 0.004 + Math.sin(t * 0.07) * 0.002) * dt * 60
  windU.uDir.value.set(Math.cos(dirA), Math.sin(dirA))
  // ลมกระโชก: เป็นช่วง ๆ ยิ่งลมแรงยิ่งบ่อย
  nextGust -= dt
  if (nextGust <= 0) {
    const w = windU.uWind.value
    gustTarget = (0.25 + Math.random() * 0.75) * (0.15 + w * 1.1)
    nextGust = (w > 0.5 ? 3 : 7) + Math.random() * (w > 0.5 ? 5 : 12)
  }
  // ขึ้นเร็ว ลงช้า
  gust += (gustTarget - gust) * (1 - Math.exp(-dt * (gustTarget > gust ? 2.5 : 0.8)))
  gustTarget *= Math.exp(-dt * 0.9)
  windU.uGust.value = gust
}

if (import.meta.env.DEV)
  (window as unknown as { __wind: (v: number | null) => string }).__wind = (v) => {
    force = v
    return `ลมทดสอบ: ${v ?? 'ตามอากาศ'}`
  }
