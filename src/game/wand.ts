/**
 * คฑาจับสัตว์ — ชื่อเดียวทุกสี (ชื่อจริงตั้งทีหลัง)
 * แยก 3 ส่วนตามที่ผู้สร้างกำหนด: สีอัญมณี (ตกแต่ง + สีลำแสง) · การตกแต่ง · คุณสมบัติอัญมณี (ความสามารถจับ)
 * ตอนนี้ทำส่วนสีอัญมณีก่อน — ความสามารถยังเป็นกติกาเดิมของคฑาพื้นฐาน (ไม่ขึ้นกับสี)
 */
import { useGame } from './store'

export type GemColor = 'green' | 'yellow' | 'red' | 'purple'

export const GEMS: Record<GemColor, { label: string; color: string; glow: string }> = {
  green: { label: 'เขียว', color: '#3fe07a', glow: '#b9ffd0' },
  yellow: { label: 'เหลือง', color: '#ffcf3a', glow: '#fff3b8' },
  red: { label: 'แดง', color: '#ff4a4a', glow: '#ffc4c4' },
  purple: { label: 'ม่วง', color: '#b46bff', glow: '#e6d0ff' },
}
export const GEM_ORDER: GemColor[] = ['green', 'yellow', 'red', 'purple']

export const wandGem = (): GemColor => (useGame.getState().save?.wandGem as GemColor) ?? 'purple'

export function setWandGem(c: GemColor) {
  const g = useGame.getState()
  if (!g.save) return
  useGame.setState({ save: { ...g.save, wandGem: c }, dirty: true })
  g.saveNow('event')
  g.toast({ title: `💎 ติดอัญมณีสี${GEMS[c].label}แล้ว`, body: 'สีคฑาและลำแสงเปลี่ยนตาม (สีเป็นการตกแต่ง ไม่เปลี่ยนความสามารถจับสัตว์)', tone: 'info' })
}

/** กำลังร่ายลำแสง: ผู้เล่นหันหน้า/ชี้คฑาไปที่สัตว์จนถึงเวลานี้ (performance.now) */
export const wandCast = { until: 0, x: 0, z: 0, aiming: false }

export function startCast(x: number, z: number, ms: number) {
  wandCast.until = performance.now() + ms
  wandCast.x = x
  wandCast.z = z
}
