/**
 * ชั้นที่ 1: บันทึกในเบราว์เซอร์ (localStorage) แบบกันไฟดับ
 *
 * - หมุนเขียน 3 ช่อง: เซฟใหม่จะเขียนทับ "ช่องที่เก่าที่สุด" เสมอ
 *   ดังนั้นเซฟล่าสุดที่สมบูรณ์จะไม่ถูกแตะ ถ้าการบันทึกครั้งใหม่ล้มเหลว/ไฟดับกลางทาง
 *   → Save 1 = ล่าสุด, Save 2 = ก่อนหน้า, Save 3 = สำรองเพิ่มเติม (เรียงตาม seq)
 * - ทุกเซฟมีเลขลำดับ (seq) + checksum ตอนโหลดเลือกเซฟใหม่สุดที่ checksum ถูกต้อง
 * - หลังเขียนจะอ่านกลับมาตรวจว่าตรงกันจริง ถึงนับว่า "บันทึกสำเร็จ"
 */

const SLOT_KEYS = ['baan-paiboon-save-1', 'baan-paiboon-save-2', 'baan-paiboon-save-3'] as const

export type SaveReason = 'new' | 'manual' | 'auto' | 'event' | 'exit' | 'unload'

export interface Envelope<T> {
  seq: number
  savedAt: number
  reason: SaveReason
  checksum: string
  data: T
}

/** FNV-1a 32-bit — พอสำหรับตรวจข้อมูลเสีย/เขียนไม่ครบ */
function checksum(text: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}

function readSlot<T>(key: string): Envelope<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const env = JSON.parse(raw) as Envelope<T>
    if (checksum(JSON.stringify(env.data)) !== env.checksum) return null
    return env
  } catch {
    return null
  }
}

/** เซฟที่สมบูรณ์ทั้งหมด เรียงจากใหม่ไปเก่า */
export function listSaves<T>(): Envelope<T>[] {
  return SLOT_KEYS.map((k) => readSlot<T>(k))
    .filter((e): e is Envelope<T> => !!e)
    .sort((a, b) => b.seq - a.seq)
}

export function loadLatest<T>(): Envelope<T> | null {
  return listSaves<T>()[0] ?? null
}

/** เลือกช่องที่จะเขียน: ช่องว่าง/เสีย ก่อน ไม่งั้นช่องที่ seq ต่ำสุด */
function pickSlot(): string {
  let pick: string = SLOT_KEYS[0]
  let lowest = Infinity
  for (const k of SLOT_KEYS) {
    const env = readSlot(k)
    if (!env) return k
    if (env.seq < lowest) {
      lowest = env.seq
      pick = k
    }
  }
  return pick
}

/** เขียนเซฟลงช่องที่เก่าที่สุด แล้วอ่านกลับมาตรวจ คืนค่า envelope ถ้าสำเร็จ */
export function writeSave<T>(data: T, reason: SaveReason): Envelope<T> | null {
  const latest = loadLatest()
  const seq = (latest?.seq ?? 0) + 1
  const body = JSON.stringify(data)
  const env: Envelope<T> = { seq, savedAt: Date.now(), reason, checksum: checksum(body), data }
  const key = pickSlot()
  try {
    localStorage.setItem(key, JSON.stringify(env))
    const back = readSlot<T>(key)
    if (!back || back.seq !== seq || back.checksum !== env.checksum) return null
    return env
  } catch {
    return null
  }
}

export function clearSaves() {
  SLOT_KEYS.forEach((k) => localStorage.removeItem(k))
}
