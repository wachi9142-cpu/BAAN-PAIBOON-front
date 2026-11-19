/**
 * นาฬิกาในเกม — เดินเฉพาะตอนเล่น (พักเกม/ออกเกม = หยุด)
 * แยก store ไว้เพื่อให้ HUD/เสียง อัปเดตตามเวลา โดยไม่ทำให้ทั้งฉาก 3D render ใหม่
 * ค่าจริงเขียนลงเซฟ (save.minuteOfDay / save.day) ทุกครั้งที่นาทีเปลี่ยน
 */
import { create } from 'zustand'
import { useGame } from './store'
import { GAME_MINUTES_PER_REAL_SECOND, nextPeriodStart, timePeriodAt } from './content/daytime'

export const SPEEDS = [1, 2, 4] as const
export type Speed = (typeof SPEEDS)[number]

interface ClockState {
  minute: number
  day: number
  speed: Speed
  setSpeed: (s: Speed) => void
}

export const useClock = create<ClockState>((set) => ({
  minute: 6 * 60,
  day: 1,
  speed: 1,
  setSpeed: (speed) => set({ speed }),
}))

let exact = 6 * 60

/** เริ่มนาฬิกาจากค่าในเซฟ (ตอนเข้าเกม) */
export function syncClockFromSave() {
  const s = useGame.getState().save
  if (!s) return
  exact = s.minuteOfDay
  useClock.setState({ minute: Math.floor(s.minuteOfDay), day: s.day })
}

/** เดินเวลาตามเวลาจริงที่ผ่านไป (วินาที) */
export function tickClock(realSeconds: number) {
  const g = useGame.getState()
  if (!g.save || g.paused) return
  const { speed, minute, day } = useClock.getState()
  exact += realSeconds * GAME_MINUTES_PER_REAL_SECOND * speed
  let d = day
  if (exact >= 1440) {
    exact -= 1440
    d += 1
  }
  const m = Math.floor(exact)
  // เขียนลงเซฟโดยตรง (เหมือน playSeconds) — ไม่สร้าง object ใหม่ ฉากจะได้ไม่ render ใหม่
  g.save.minuteOfDay = exact
  g.save.day = d
  if (m !== minute || d !== day) useClock.setState({ minute: m, day: d })
}

/** ข้ามไปช่วงเวลาถัดไป */
export function skipToNextPeriod() {
  const g = useGame.getState()
  if (!g.save) return
  const { minute, day } = useClock.getState()
  const next = nextPeriodStart(minute)
  const d = next <= minute ? day + 1 : day
  exact = next
  g.save.minuteOfDay = next
  g.save.day = d
  useClock.setState({ minute: next, day: d })
  const p = timePeriodAt(next)
  g.toast({ title: `⏭ ข้ามไปช่วง${p.label}`, body: p.mood, tone: 'info' })
  g.saveNow('event')
}

/** เวลาละเอียด (ทศนิยม) สำหรับไล่แสงอย่างนุ่มนวลในฉาก 3D */
export const exactMinute = () => exact

/** ตั้งเวลาไปที่นาที/วันที่กำหนด (นอนหลับ งีบ) — ไม่แจ้งเตือน */
export function setClockTo(minute: number, day: number) {
  const g = useGame.getState()
  if (!g.save) return
  let m = minute
  let d = day
  while (m >= 1440) {
    m -= 1440
    d += 1
  }
  exact = m
  g.save.minuteOfDay = m
  g.save.day = d
  useClock.setState({ minute: Math.floor(m), day: d })
  g.saveNow('event')
}
