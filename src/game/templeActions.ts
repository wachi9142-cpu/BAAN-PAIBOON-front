/**
 * กิจกรรมในโบสถ์: กราบพระ 3 ครั้ง → แปะทอง → เสี่ยงเซียมซี
 */
import { create } from 'zustand'
import { useGame } from './store'
import { playBell } from './audio/bell'
import { PROSTRATE } from '../scenes/models/Character'
import { SIAMSI, type Fortune } from './content/siamsi'
import { BIRTH_DAYS } from './content/temple'

/** หลังกราบแล้วแปะทองได้ภายในเวลานี้ */
const BOW_VALID_MS = 10 * 60_000

interface TempleState {
  busy: boolean
  bowedAt: number
  fortune: Fortune | null
  closeFortune: () => void
}
export const useTemple = create<TempleState>((set) => ({
  busy: false,
  bowedAt: 0,
  fortune: null,
  closeFortune: () => set({ fortune: null }),
}))

const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' | 'discover' = 'info') =>
  useGame.getState().toast({ title, body, tone })

/** กราบพระ 3 ครั้ง: คุกเข่า พนมมือ กราบลงจนหน้าผากแตะพื้น มีเสียงระฆังเบา ๆ ทุกครั้ง */
export function bowThreeTimes() {
  const t = useTemple.getState()
  if (t.busy) return
  const g = useGame.getState()
  if (!g.save) return
  useTemple.setState({ busy: true })
  const total = (PROSTRATE.settle + PROSTRATE.each * PROSTRATE.times) * 1000 + 500
  g.doGesture('prostrate', total)
  for (let i = 0; i < PROSTRATE.times; i++) {
    window.setTimeout(() => playBell(0.28), (PROSTRATE.settle + PROSTRATE.each * i + PROSTRATE.each * 0.45) * 1000)
  }
  window.setTimeout(() => {
    useTemple.setState({ busy: false, bowedAt: Date.now() })
    markMerit('bow')
    const s = useGame.getState()
    if (!s.save) return
    if (s.lastWorshipDay !== s.save.day) {
      useGame.setState({ lastWorshipDay: s.save.day })
      s.changeStats({ fun: 8, health: 3 })
      toast('🙏 กราบพระครบสามครั้ง', 'รู้สึกสงบใจ (สนุก +8 · ชีวิต +3) · แปะทองหรือเสี่ยงเซียมซีต่อได้', 'success')
    } else {
      toast('🙏 กราบพระครบสามครั้ง', 'รู้สึกสงบใจ', 'info')
    }
  }, total)
}

/** แปะทองคำเปลวที่องค์พระ (ต้องกราบก่อน · ไม่เสียเงิน) */
export function applyGoldLeaf() {
  const t = useTemple.getState()
  if (t.busy) return
  const g = useGame.getState()
  if (!g.save) return
  if (Date.now() - t.bowedAt > BOW_VALID_MS) {
    toast('กราบพระก่อนแล้วค่อยแปะทองนะ', undefined, 'info')
    return
  }
  useTemple.setState({ busy: true })
  g.doGesture('offer', 2200)
  window.setTimeout(() => {
    useTemple.setState({ busy: false })
    const s = useGame.getState()
    if (!s.save) return
    useGame.setState({ save: { ...s.save, goldLeaf: (s.save.goldLeaf ?? 0) + 1 }, dirty: true })
    s.changeStats({ fun: 4 })
    markMerit('gold')
    s.saveNow('event')
    toast('✨ แปะทองที่องค์พระแล้ว', 'อิ่มบุญ ใจเบิกบาน (สนุก +4)', 'success')
    playBell(0.2)
  }, 2000)
}

/** เสี่ยงเซียมซี: เขย่ากระบอก แล้วหยิบไม้ที่หล่นออกมา */
export function drawSiamsi() {
  const t = useTemple.getState()
  if (t.busy) return
  useTemple.setState({ busy: true })
  useGame.getState().doGesture('shake', 2600)
  window.setTimeout(() => {
    const f = SIAMSI[Math.floor(Math.random() * SIAMSI.length)]
    useTemple.setState({ busy: false, fortune: f })
  }, 2600)
}


// ---------- ทำบุญรอบโบสถ์ + ออร่า ----------

interface MeritState {
  /** ทำบุญอย่างใดอย่างหนึ่งแล้วในการมาวัดครั้งนี้ (ออกจากวัดจะมีออร่า) */
  meritThisVisit: boolean
  /** ขั้นตอนบุญที่ทำแล้วในการมาวัดครั้งนี้ */
  steps: MeritStep[]
  /** ความสว่างของออร่า 0–1 */
  auraLevel: number
  /** ออร่าแสดงถึงเวลานี้ (ms) */
  auraUntil: number
  /** ระฆังที่เพิ่งถูกตี: id → เวลา (สำหรับแกว่ง) */
  bellHit: Record<string, number>
  /** จุดธูปเทียนล่าสุด (มีควันลอย) */
  incenseAt: number
  popup: null | 'donate' | 'birthday' | 'incense'
  /** ผู้เล่นอยู่ในตัวโบสถ์ (ถอดรองเท้า) */
  inside: boolean
  /** จุดทำบุญที่อยู่ใกล้ (กด E) */
  spot: string | null
}
export const useMerit = create<MeritState>(() => ({
  meritThisVisit: false,
  steps: [],
  auraLevel: 0.5,
  auraUntil: 0,
  bellHit: {},
  incenseAt: 0,
  popup: null,
  inside: false,
  spot: null,
}))

const AURA_MS = 90_000

/** จดว่าได้ทำบุญแล้ว (กราบ แปะทอง หยอดตู้ จุดธูป ตีระฆัง) */
export type MeritStep = 'incense' | 'bow' | 'gold' | 'donate' | 'water' | 'bell'
export const MERIT_STEPS: { id: MeritStep; label: string }[] = [
  { id: 'incense', label: 'จุดธูปเทียน' },
  { id: 'bow', label: 'กราบพระ 3 ครั้ง' },
  { id: 'gold', label: 'แปะทอง' },
  { id: 'donate', label: 'ใส่เงินทำบุญ' },
  { id: 'water', label: 'กรวดน้ำ' },
  { id: 'bell', label: 'ตีระฆัง' },
]
export function markMerit(step: MeritStep) {
  useMerit.setState((s) => ({ meritThisVisit: true, steps: s.steps.includes(step) ? s.steps : [...s.steps, step] }))
}

/** เดินออกจากบริเวณวัด: ถ้าทำบุญมา มีออร่าสีทองอ่อนรอบตัวชั่วคราว */
export function leaveTemple() {
  const m = useMerit.getState()
  if (!m.meritThisVisit) return
  // ใส่รองเท้ากลับแล้ว เดินออกจากวัด: ทำบุญหลายอย่าง = ออร่าชัดขึ้น
  const level = Math.min(1, m.steps.length / MERIT_STEPS.length)
  useMerit.setState({ meritThisVisit: false, steps: [], auraUntil: Date.now() + AURA_MS * (0.6 + level * 0.8), auraLevel: level })
  playBell(0.18)
  if (level >= 1) toast('✨ ทำบุญครบทุกขั้นตอน', 'ใจสงบ อิ่มบุญเต็มที่ ออร่าสว่างไสว', 'success')
  else toast('✨ ได้บุญแล้ว', 'รู้สึกสงบใจ อิ่มเอมใจ', 'success')
}

/** หยอดตู้ทำบุญตามศรัทธา (0 บาท = ไหว้ด้วยใจ) */
export function donate(amount: number) {
  const g = useGame.getState()
  if (!g.save) return
  if (g.save.coins < amount) {
    toast('เงินไม่พอ', undefined, 'warn')
    return
  }
  g.doGesture('offer', 1500)
  if (amount > 0) g.addCoins(-amount, '🙏 ทำบุญแล้ว')
  else toast('🙏 ทำบุญด้วยใจแล้ว', 'บุญอยู่ที่ใจ', 'success')
  g.changeStats({ fun: Math.min(6, 1 + Math.floor(amount / 5)) })
  markMerit('donate')
  useMerit.setState({ popup: null })
}

/** หยอดเหรียญประจำวันเกิด (1 บาท) — ได้คำอวยพร */
export function birthdayCoin(dayIndex: number) {
  const g = useGame.getState()
  if (!g.save) return
  if (g.save.coins < 1) {
    toast('ไม่มีเหรียญเหลือแล้ว', undefined, 'warn')
    return
  }
  const d = BIRTH_DAYS[dayIndex]
  g.doGesture('offer', 1200)
  g.addCoins(-1)
  playBell(0.15)
  toast(`🪙 หยอดเหรียญวัน${d.label}`, d.wish, 'success')
  markMerit('donate')
  useMerit.setState({ popup: null })
}

/** หยิบธูปเทียนไปจุดบูชา — ทำบุญค่าธูปเทียนตามศรัทธา (ให้กี่บาทก็ได้ หรือไม่ให้ก็ได้) */
export function lightIncense(amount: number) {
  const g = useGame.getState()
  if (!g.save) return
  if (amount > g.save.coins) {
    toast('เงินไม่พอ', undefined, 'warn')
    return
  }
  if (amount > 0) g.addCoins(-amount, '🕯️ ทำบุญค่าธูปเทียน')
  g.doGesture('wai', 2400)
  useMerit.setState({ incenseAt: Date.now(), popup: null })
  toast('🕯️ จุดธูปเทียนบูชาแล้ว', 'ควันธูปลอยขึ้นฟ้า ใจสงบ', 'success')
  markMerit('incense')
}

/** ตีระฆัง */
export function ringBell(id: string) {
  playBell(0.55)
  useMerit.setState((s) => ({ bellHit: { ...s.bellHit, [id]: performance.now() } }))
  markMerit('bell')
}


/** กรวดน้ำ: รินน้ำจากคนโทลงภาชนะ อุทิศส่วนกุศล */
export function pourWater() {
  const g = useGame.getState()
  g.doGesture('offer', 3000)
  markMerit('water')
  window.setTimeout(() => {
    toast('💧 กรวดน้ำแล้ว', 'อุทิศส่วนกุศลให้ผู้ที่ล่วงลับและสรรพสัตว์', 'success')
  }, 1500)
}
