/**
 * ทุบด้วยมือเปล่า + ระบบเจ็บมือ (GAME_DESIGN §2.62)
 * - นับจำนวนครั้งที่ทุบสะสม แยก "ต้นไม้" กับ "หิน" (ไม่รวมกัน)
 * - ครั้งที่ 1–19 ไม่เจ็บ · ครั้งที่ 20 ขึ้นไปเริ่มเจ็บ แล้วค่อย ๆ หนักขึ้น:
 *     เจ็บนิด (20–24) สะบัดมือ · เจ็บ (25–29) จับมือตัวเอง · เจ็บมาก (30+) ต้องหยุดพักกุมมือสักครู่
 * - พักมือ (ไม่ทุบอย่างนั้น) นานพอ ตัวนับจะค่อย ๆ ลดลงเอง
 */
import { useGame } from './store'

export type StrikeKind = 'tree' | 'rock'
export const HURT_FROM = 20

/** ตัวนับสะสม (เวลาจริง) */
export const handHits: Record<StrikeKind, { n: number; last: number }> = {
  tree: { n: 0, last: 0 },
  rock: { n: 0, last: 0 },
}

/** ท่าแสดงอาการเจ็บ (ตัวละครผู้เล่นอ่านทุกเฟรม) · level 1 สะบัดมือ · 2 จับมือ · 3 กุมมือพัก */
export const handPain = { level: 0, start: 0, until: 0, restUntil: 0 }

const IDLE_MS = 10_000 // หยุดทุบ 10 วิ เริ่มฟื้น
const RECOVER_MS = 4_000 // แล้วลดลง 1 ครั้งทุก 4 วิ

function recover(k: StrikeKind, now: number) {
  const h = handHits[k]
  const idle = now - h.last
  if (h.n > 0 && idle > IDLE_MS) {
    h.n = Math.max(0, h.n - Math.floor((idle - IDLE_MS) / RECOVER_MS))
    if (h.n > 0) h.last = now - IDLE_MS // นับฟื้นต่อจากตรงนี้
  }
}

/** จำนวนครั้งที่ทุบไปแล้ว (หลังหักการพักฟื้น) */
export function hitsOf(k: StrikeKind) {
  recover(k, performance.now())
  return handHits[k].n
}

/** กำลังหยุดพักเพราะเจ็บมือมาก (ทุบไม่ได้ชั่วคราว) */
export const restingHand = () => performance.now() < handPain.restUntil

/** ข้อความสถานะมือ สำหรับป้ายกลางจอ */
export function handStatus(k: StrikeKind) {
  const n = hitsOf(k)
  if (restingHand()) return 'พักมือก่อน'
  if (n < HURT_FROM - 1) return `ทุบได้อีก ${HURT_FROM - 1 - n} ครั้งก่อนเจ็บมือ`
  if (n === HURT_FROM - 1) return 'ครั้งหน้าจะเริ่มเจ็บมือ'
  if (n < 25) return 'เริ่มเจ็บมือ'
  if (n < 30) return 'เจ็บมือ'
  return 'เจ็บมือมาก'
}

/**
 * ทุบโดนเป้า 1 ครั้ง: นับครั้ง แล้วแสดงอาการเจ็บตามจำนวนครั้ง
 * hurtK = ความแข็งของเป้า (ต้นกล้วยนิ่ม < ต้นมะม่วง < หิน)
 */
export function registerStrike(k: StrikeKind, hurtK: number) {
  const now = performance.now()
  recover(k, now)
  const h = handHits[k]
  h.n += 1
  h.last = now
  if (h.n < HURT_FROM) return
  const g = useGame.getState()
  const over = h.n - HURT_FROM // 0,1,2,...
  const level = h.n < 25 ? 1 : h.n < 30 ? 2 : 3
  // เจ็บค่อย ๆ เพิ่มขึ้น ไม่หนักทันที
  g.changeStats({ health: -Math.min(2.5, (0.25 + over * 0.08) * hurtK) })
  handPain.level = level
  handPain.start = now
  handPain.until = now + (level === 1 ? 900 : level === 2 ? 1500 : 2600)
  if (level === 3) handPain.restUntil = handPain.until
  const what = k === 'tree' ? 'ทุบต้นไม้' : 'ทุบหิน'
  if (h.n === HURT_FROM) g.toast({ title: '✋ เริ่มเจ็บมือแล้ว', body: `${what}มา ${HURT_FROM} ครั้ง มือเริ่มระบม · พักมือสักครู่จะหายเอง หรือใช้ขวาน/เครื่องมือแทน`, tone: 'warn' })
  else if (h.n === 25) g.toast({ title: '✋ เจ็บมือ', body: 'มือแดงช้ำแล้ว ลองพักก่อนดีไหม', tone: 'warn' })
  else if (level === 3 && (h.n - 30) % 5 === 0) g.toast({ title: '😣 เจ็บมือมาก', body: 'ต้องหยุดกุมมือพักสักครู่ · ถ้าพักนานพอมือจะหายเจ็บเอง', tone: 'warn' })
}
