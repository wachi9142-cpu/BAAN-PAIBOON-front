/**
 * ชั้นที่ 2: ซิงก์เซฟขึ้นเซิร์ฟเวอร์ (BAAN-PAIBOON-back)
 *
 * - ทุกครั้งที่บันทึกในเครื่องสำเร็จ จะเก็บ "รายการรอส่ง" (outbox) ไว้ใน localStorage ก่อน
 * - ถ้าเน็ตหลุด/เซิร์ฟเวอร์ล่ม outbox จะยังอยู่ แม้ปิดเกมไปแล้ว
 * - เมื่อกลับมาออนไลน์ (event 'online') หรือเปิดเกมใหม่ จะส่งเซฟล่าสุดใน outbox ขึ้นไป
 * - เซิร์ฟเวอร์ต้องตอบ seq ที่บันทึกแล้ว จึงลบออกจาก outbox (ยืนยันว่าบันทึกสำเร็จจริง)
 *
 * ตอนนี้ยังไม่มี backend → ตั้ง VITE_SAVE_API_URL เมื่อ BAAN-PAIBOON-back พร้อม
 * สัญญา API ที่คาดไว้:  PUT {API}/saves/me  body: Envelope  → 200 { seq }
 *                       409 = เซิร์ฟเวอร์มีเซฟที่ใหม่กว่า (ต้องดึงมาเทียบ)
 */
import type { Envelope } from './localSave'

const OUTBOX_KEY = 'baan-paiboon-outbox'
const API = import.meta.env.VITE_SAVE_API_URL as string | undefined

export type CloudStatus = 'disabled' | 'synced' | 'pending' | 'offline' | 'error'

export function queueForUpload<T>(env: Envelope<T>) {
  try {
    // เก็บเฉพาะเซฟล่าสุด เพราะเซฟใหม่ครอบคลุมของเก่าทั้งหมด
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(env))
  } catch {
    /* พื้นที่เต็ม: เซฟในเครื่องยังอยู่ จะลองใหม่รอบหน้า */
  }
}

export function hasPending() {
  return localStorage.getItem(OUTBOX_KEY) !== null
}

export function cloudEnabled() {
  return !!API
}

let inflight: Promise<CloudStatus> | null = null

/** ส่ง outbox ขึ้นเซิร์ฟเวอร์ (ถ้ามี) */
export function flushOutbox(): Promise<CloudStatus> {
  if (!API) return Promise.resolve('disabled')
  if (!navigator.onLine) return Promise.resolve(hasPending() ? 'offline' : 'synced')
  if (inflight) return inflight
  inflight = (async (): Promise<CloudStatus> => {
    const raw = localStorage.getItem(OUTBOX_KEY)
    if (!raw) return 'synced'
    const env = JSON.parse(raw) as Envelope<unknown>
    try {
      const res = await fetch(`${API}/saves/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: raw,
      })
      if (!res.ok) return 'error'
      const body = (await res.json()) as { seq?: number }
      // ลบออกจาก outbox เฉพาะเมื่อเซิร์ฟเวอร์ยืนยัน seq เดียวกัน และไม่มีเซฟใหม่กว่าเข้าคิวระหว่างส่ง
      const current = localStorage.getItem(OUTBOX_KEY)
      if (body.seq === env.seq && current === raw) localStorage.removeItem(OUTBOX_KEY)
      return hasPending() ? 'pending' : 'synced'
    } catch {
      return 'offline'
    }
  })().finally(() => {
    inflight = null
  })
  return inflight
}
