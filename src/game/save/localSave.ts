/**
 * ชั้นที่ 1: บันทึกในเบราว์เซอร์ (localStorage) แบบกันไฟดับ
 *
 * - เขียนสลับ 2 ช่อง (A/B) ถ้าเขียนค้างกลางทางตอนไฟดับ ช่องอีกช่องยังเป็นเซฟที่สมบูรณ์
 * - ทุกเซฟมีเลขลำดับ (seq) + checksum ตอนโหลดเลือกเซฟใหม่สุดที่ checksum ถูกต้อง
 * - หลังเขียนจะอ่านกลับมาตรวจว่าตรงกันจริง ถึงนับว่า "บันทึกสำเร็จ"
 */

const SLOT_KEYS = ['baan-paiboon-save-A', 'baan-paiboon-save-B'] as const

export interface Envelope<T> {
  seq: number
  savedAt: number
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

/** โหลดเซฟล่าสุดที่สมบูรณ์ */
export function loadLatest<T>(): Envelope<T> | null {
  const slots = SLOT_KEYS.map((k) => readSlot<T>(k)).filter((e): e is Envelope<T> => !!e)
  slots.sort((a, b) => b.seq - a.seq)
  return slots[0] ?? null
}

/** เขียนเซฟลงช่องที่เก่ากว่า แล้วอ่านกลับมาตรวจ คืนค่า envelope ถ้าสำเร็จ */
export function writeSave<T>(data: T, prevSeq: number): Envelope<T> | null {
  const seq = prevSeq + 1
  const body = JSON.stringify(data)
  const env: Envelope<T> = { seq, savedAt: Date.now(), checksum: checksum(body), data }
  const key = SLOT_KEYS[seq % 2]
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
