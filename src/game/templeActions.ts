/**
 * กิจกรรมในโบสถ์: กราบพระ 3 ครั้ง → แปะทอง → เสี่ยงเซียมซี
 */
import { create } from 'zustand'
import { useGame } from './store'
import { playBell } from './audio/bell'
import { PROSTRATE } from '../scenes/models/Character'
import { CUPS, fortuneOf, STICKS_PER_CUP, weekOf, type Fortune } from './content/siamsi'
import type { SiamsiDraw } from './store'
import { BIRTH_DAYS } from './content/temple'

/** หลังกราบแล้วแปะทองได้ภายในเวลานี้ */
const BOW_VALID_MS = 10 * 60_000

interface TempleState {
  busy: boolean
  bowedAt: number
  fortune: Fortune | null
  closeFortune: () => void
  /** กำลังเลือกกระบอกเซียมซี */
  cupPick: boolean
  /** ไม้เซียมซีที่หล่นออกมา (แสดงเลข) */
  stick: SiamsiDraw | null
  /** กระบอกที่กำลังเขย่า (ให้ตัวละครถือ) */
  shakingCup: 0 | 1 | 2 | null
}
export const useTemple = create<TempleState>((set) => ({
  busy: false,
  bowedAt: 0,
  fortune: null,
  closeFortune: () => set({ fortune: null }),
  cupPick: false,
  stick: null,
  shakingCup: null,
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

/**
 * เสี่ยงเซียมซี (ในโบสถ์): เลือกกระบอก → คุกเข่าเขย่าจนไม้หล่น 1 อัน → ได้เลข
 * แล้วเดินออกไปหยิบใบคำทำนายที่ตู้หน้าโบสถ์เอง · เสี่ยงได้วันละ 1 ครั้ง (สุ่มซ้ำไม่ได้)
 */
export function drawSiamsi() {
  const t = useTemple.getState()
  const g = useGame.getState()
  if (t.busy || !g.save) return
  const s = g.save.siamsi
  if (s?.lastDrawDay === g.save.day) {
    toast('วันนี้เสี่ยงเซียมซีแล้ว', s.pending ? `ไปหยิบใบคำทำนายเลข ${s.pending.no} (${CUPS[s.pending.cup].name}) ที่ตู้หน้าโบสถ์นะ` : 'กลับมาเสี่ยงใหม่พรุ่งนี้ · อ่านคำทำนายย้อนหลังได้ที่ เมนู → สมุดเซียมซี', 'info')
    return
  }
  useTemple.setState({ cupPick: true })
}

export function drawFromCup(cup: 0 | 1 | 2) {
  const g = useGame.getState()
  if (!g.save) return
  useTemple.setState({ cupPick: false, busy: true, shakingCup: cup })
  g.doGesture('shake', 3200)
  playRattle()
  window.setTimeout(() => {
    const day = useGame.getState().save!.day
    const draw: SiamsiDraw = { week: weekOf(day), day, cup, no: 1 + Math.floor(Math.random() * STICKS_PER_CUP) }
    const s = useGame.getState().save!
    const prev = s.siamsi ?? { history: [] }
    useGame.setState({ save: { ...s, siamsi: { lastDrawDay: day, pending: draw, history: [...prev.history, draw] } }, dirty: true })
    useGame.getState().saveNow('event')
    playBell(0.18)
    useTemple.setState({ busy: false, stick: draw, shakingCup: null })
  }, 3200)
}

/** ตู้ใบคำทำนายหน้าโบสถ์: หยิบใบตามเลขที่ได้ */
export function takeSlip() {
  const g = useGame.getState()
  if (!g.save) return
  const p = g.save.siamsi?.pending
  if (!p) {
    const last = g.save.siamsi?.history.at(-1)
    if (last && last.week === weekOf(g.save.day)) {
      useTemple.setState({ fortune: fortuneOf(last.week, last.cup, last.no) })
      return
    }
    toast('ยังไม่ได้เสี่ยงเซียมซี', 'เข้าไปเสี่ยงเซียมซีในโบสถ์ก่อน (หน้าพระประธาน กด E) แล้วค่อยมาหยิบใบตามเลขที่ได้', 'info')
    return
  }
  const f = fortuneOf(p.week, p.cup, p.no)
  // โบนัสเล็ก ๆ ตอนอ่านครั้งแรก
  if (f.bonus?.coins) g.addCoins(f.bonus.coins, 'โชคจากใบเซียมซี')
  if (f.bonus?.fun) g.changeStats({ fun: f.bonus.fun })
  const s = useGame.getState().save!
  const history = s.siamsi!.history.map((h) => (h === p || (h.day === p.day && h.no === p.no && h.cup === p.cup) ? { ...h, read: true } : h))
  useGame.setState({ save: { ...s, siamsi: { ...s.siamsi!, pending: undefined, history } }, dirty: true })
  useGame.getState().saveNow('event')
  useTemple.setState({ fortune: f })
}

/** เสียงเขย่ากระบอก: ไม้กระทบกันกรุ๊งกริ๊งเป็นจังหวะ แล้วไม้หล่นแป๊ะ */
let actx: AudioContext | null = null
function playRattle() {
  try {
    actx ??= new AudioContext()
    if (actx.state === 'suspended') void actx.resume()
    const c = actx
    const t0 = c.currentTime + 0.05
    for (let i = 0; i < 22; i++) {
      const t = t0 + i * 0.13 + Math.random() * 0.03
      const len = Math.floor(c.sampleRate * 0.03)
      const buf = c.createBuffer(1, len, c.sampleRate)
      const ch = buf.getChannelData(0)
      for (let n = 0; n < len; n++) ch[n] = (Math.random() * 2 - 1) * (1 - n / len) ** 2
      const src = c.createBufferSource()
      src.buffer = buf
      const f = c.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = 1400 + Math.random() * 900
      f.Q.value = 4
      const g = c.createGain()
      g.gain.value = 0.25
      src.connect(f).connect(g).connect(c.destination)
      src.start(t)
    }
    // ไม้หล่นกระทบพื้น
    const o = c.createOscillator()
    o.type = 'triangle'
    o.frequency.setValueAtTime(520, t0 + 3.05)
    o.frequency.exponentialRampToValueAtTime(260, t0 + 3.15)
    const g2 = c.createGain()
    g2.gain.setValueAtTime(0.0001, t0 + 3.04)
    g2.gain.exponentialRampToValueAtTime(0.25, t0 + 3.06)
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.25)
    o.connect(g2).connect(c.destination)
    o.start(t0 + 3.04)
    o.stop(t0 + 3.3)
  } catch {
    /* ไม่มีเสียงก็ไม่เป็นไร */
  }
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
  /** ผู้เล่นอยู่บนโบสถ์ (บันได/ระเบียง/ในโบสถ์) */
  inside: boolean
  /** ถอดรองเท้าวางไว้ที่ลานถอดรองเท้าแล้ว */
  shoesOff: boolean
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
  shoesOff: false,
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

/** กด E ที่ลานถอดรองเท้า: ถอด / ใส่ */
export function toggleShoes() {
  const s = useMerit.getState()
  if (s.shoesOff && s.inside) return
  useMerit.setState({ shoesOff: !s.shoesOff })
  toast(s.shoesOff ? '👟 ใส่รองเท้าแล้ว' : '👣 ถอดรองเท้าวางไว้แล้ว', s.shoesOff ? undefined : 'ขึ้นไปกราบพระในโบสถ์ได้เลย', 'info')
}

/** ขึ้นบันไดทั้งที่ยังใส่รองเท้า → ถอดให้อัตโนมัติ · ออกจากวัด → ใส่กลับให้อัตโนมัติ */
export function autoShoes(onTemple: boolean, inArea: boolean) {
  const s = useMerit.getState()
  if (onTemple && !s.shoesOff) {
    useMerit.setState({ shoesOff: true })
    toast('👣 ถอดรองเท้าไว้ที่ลานถอดรองเท้าแล้ว', 'ก่อนขึ้นโบสถ์ต้องถอดรองเท้านะ', 'info')
  } else if (!inArea && s.shoesOff) {
    useMerit.setState({ shoesOff: false })
    toast('👟 ใส่รองเท้ากลับแล้ว', undefined, 'info')
  }
}
