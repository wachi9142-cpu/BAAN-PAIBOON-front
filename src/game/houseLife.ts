/**
 * กิจกรรมในบ้าน (ผู้สร้าง 19 พ.ย. 2569): เข้าห้องน้ำ · อาบน้ำ (ฝักบัว/ตักน้ำจากโอ่ง) · นอน · งีบ · ทำอาหาร
 * - เดินไปใกล้ของในบ้าน → กด E → ตัวละครเดินเข้าตำแหน่ง ทำท่าตามกิจกรรมจริง มีเสียงตามจังหวะ
 * - เดิน (WASD) หรือกด E ซ้ำ = หยุดกลางคัน เสียงหยุดตามทันที
 * - ใช้ได้ทุกบ้านที่เข้าไปได้: บ้านตารัง–ยายเลียน (2 ชั้น) และบ้านชาวบ้านทุกหลัง (ตามของที่มีในห้อง)
 * ตำแหน่ง/ท่าทางระหว่างทำกิจกรรมส่งผ่าน play.ts → Player (ระบบเดียวกับเครื่องเล่นในสนามเด็กเล่น)
 */
import { create } from 'zustand'
import { useGame, type Gesture } from './store'
import { INTERIOR_ORIGIN, useInterior } from './interior'
import { useClock, setClockTo } from './clock'
import { countOf } from './inventory'
import { ITEMS, type ItemId } from './content/items'
import { playFlush, startBucketBath, startCooking, startHaircut, startShower, startSleepBreath, type Stopper } from './audio/houseSfx'

export type ActKind = 'toilet' | 'shower' | 'bathe' | 'sleep' | 'nap' | 'cook' | 'haircut'

export interface ActSpot {
  id: string
  kind: ActKind
  label: string
  /** จุดยืนกด E (พิกัดภายใน) */
  x: number
  z: number
  upper: boolean
  /** ตำแหน่ง/ทิศระหว่างทำกิจกรรม (พิกัดภายใน) · y = ความสูงจากพื้นชั้นนั้น */
  at: { x: number; z: number; y: number; heading: number }
  /** ห้องที่ปิดประตูระหว่างใช้ (ห้องน้ำ) */
  room?: string
}

const bed = (id: string, x: number, z: number, upper: boolean, feet: [number, number], heading: number, y: number): ActSpot[] => [
  { id: id + ':sleep', kind: 'sleep', label: '🛏️ นอนหลับ (ตื่นมาเป็นเช้าวันใหม่)', x, z, upper, at: { x: feet[0], z: feet[1], y, heading } },
  { id: id + ':nap', kind: 'nap', label: '😴 งีบสั้น ๆ (~1 ชั่วโมงครึ่ง)', x: x + 0.6, z, upper, at: { x: feet[0], z: feet[1], y, heading } },
]

/** บ้านตารัง–ยายเลียน (ภายใน x −8..8 · z −5..5) */
export const HOME_ACTS: ActSpot[] = [
  { id: 'h:toilet', kind: 'toilet', label: '🚽 เข้าห้องน้ำ (ปิดประตู)', x: 2.7, z: 3.0, upper: false, at: { x: 2.6, z: 4.15, y: 0.3, heading: Math.PI }, room: 'bath' },
  { id: 'h:shower', kind: 'shower', label: '🚿 อาบน้ำฝักบัว', x: 4.1, z: 3.0, upper: false, at: { x: 4.25, z: 4.1, y: 0, heading: 0 }, room: 'bath' },
  { id: 'h:cook', kind: 'cook', label: '🍳 ทำอาหาร (เตาในครัว)', x: -7.2, z: -2.9, upper: false, at: { x: -7.25, z: -3.35, y: 0, heading: Math.PI } },
  ...bed('h:bed-ta', -0.9, 2.75, false, [0.85, 4.1], Math.PI / 2, 0.55),
  ...bed('h:bed-rong', -5.0, 2.75, false, [-3.65, 4.0], Math.PI / 2, 0.55),
  ...bed('h:bed1', 4.6, 2.2, true, [5, 2.75], Math.PI, 0.55),
  ...bed('h:bed2', 0.6, 2.2, true, [0.95, 2.75], Math.PI, 0.55),
  ...bed('h:bed3', -6.8, 2.2, true, [-6.5, 2.75], Math.PI, 0.55),
]

/** บ้านชาวบ้าน (ห้องโถงใหญ่: ที่นอน+มุ้ง · ครัวเตาถ่าน · โอ่งน้ำ) */
export const NPC_ACTS: ActSpot[] = [
  ...bed('n:bed', -6.2, 2.6, false, [-5.05, 4.05], Math.PI / 2, 0.15),
  { id: 'n:cook', kind: 'cook', label: '🍳 ทำอาหาร (เตาถ่าน)', x: 6.4, z: 1.8, upper: false, at: { x: 6.5, z: 2.15, y: 0, heading: 0 } },
  { id: 'n:toilet', kind: 'toilet', label: '🚽 เข้าห้องน้ำ (ปิดประตู)', x: 5.3, z: -2.6, upper: false, at: { x: 5.05, z: -3.95, y: 0.3, heading: 0 }, room: 'bath' },
  { id: 'n:bathe', kind: 'bathe', label: '🪣 ตักน้ำอาบจากโอ่ง', x: 6.7, z: -2.7, upper: false, at: { x: 6.75, z: -3.05, y: 0, heading: Math.PI }, room: 'bath' },
]

/** บ้านหลังที่สอง (ครัว): เตาแก๊ส + เสื่อนอนเล่น (ผู้สร้างชอบมานอน) — พิกัดตัวอาคาร */
export const COOK_ACTS: ActSpot[] = [
  { id: 'c:cook', kind: 'cook', label: '🍳 ทำอาหาร (เตาแก๊สกับกระทะ)', x: 1.85, z: -0.7, upper: false, at: { x: 1.85, z: -1.0, y: 0, heading: Math.PI } },
  ...bed('c:mat', -1.3, 0.1, false, [-0.45, -0.45], Math.PI / 2, 0.06),
]
/** ห้องน้ำนอกบ้าน: ส้วม · ห้องอาบน้ำ (ฝักบัว + โอ่ง) */
export const BATH_ACTS: ActSpot[] = [
  { id: 'b:toilet', kind: 'toilet', label: '🚽 เข้าห้องส้วม (ปิดประตู)', x: -1.2, z: 1.3, upper: false, at: { x: -1.9, z: -1.55, y: 0.3, heading: 0 }, room: 'bath1' },
  { id: 'b:shower', kind: 'shower', label: '🚿 อาบน้ำฝักบัว', x: 1.6, z: 1.3, upper: false, at: { x: 2.15, z: -1.85, y: 0, heading: Math.PI }, room: 'bath2' },
  { id: 'b:bathe', kind: 'bathe', label: '🪣 ตักน้ำอาบจากโอ่ง', x: 0.9, z: 1.3, upper: false, at: { x: 1.15, z: -1.2, y: 0, heading: Math.PI }, room: 'bath2' },
]
/** ร้านตัดผม: นั่งเก้าอี้ให้ช่างโรจน์ตัด (หันเข้ากระจกเงา) */
export const BARBER_ACTS: ActSpot[] = [
  { id: 'r:cut1', kind: 'haircut', label: '💈 นั่งตัดผม (ช่างโรจน์)', x: -0.2, z: -1.5, upper: false, at: { x: 0.55, z: -1.5, y: 0.22, heading: Math.PI / 2 } },
  { id: 'r:cut2', kind: 'haircut', label: '💈 นั่งตัดผม (ช่างโรจน์)', x: -0.2, z: 1.2, upper: false, at: { x: 0.55, z: 1.2, y: 0.22, heading: Math.PI / 2 } },
]
/** บ้านน้าโรจน์ (บ้านโมเดิร์น): ห้องน้ำมีฝักบัวแทนโอ่ง */
const ROT_ACTS: ActSpot[] = NPC_ACTS.map((s) => (s.id === 'n:bathe' ? { ...s, kind: 'shower' as const, label: '🚿 อาบน้ำฝักบัว' } : s))
const spotsNow = () => {
  const h = useInterior.getState().house
  return h === 'home' ? HOME_ACTS : h === 'cookhouse' ? COOK_ACTS : h === 'bathhouse' ? BATH_ACTS : h === 'barber' ? BARBER_ACTS : h === 'house-rot' ? ROT_ACTS : NPC_ACTS
}

export function findActSpot(lx: number, lz: number, upper: boolean): ActSpot | null {
  let best: ActSpot | null = null
  let bd = 1.1
  for (const s of spotsNow()) {
    if (s.upper !== upper) continue
    const d = Math.hypot(s.x - lx, s.z - lz)
    if (d < bd) {
      bd = d
      best = s
    }
  }
  return best
}
export const actSpotById = (id: string) => spotsNow().find((s) => s.id === id) ?? null

/** ระยะเวลา (วินาที) */
const DUR: Record<ActKind, number> = { toilet: 7, shower: 11, bathe: 10, sleep: 8, nap: 7, cook: 13, haircut: 12 }
const POSE: Record<ActKind, Gesture> = { toilet: 'sit', shower: 'shower', bathe: 'bathe', sleep: 'lie', nap: 'lie', cook: 'cook', haircut: 'sit' }
export const ACT_LABEL: Record<ActKind, string> = {
  toilet: 'เข้าห้องน้ำ',
  shower: 'อาบน้ำ',
  bathe: 'ตักน้ำอาบ',
  sleep: 'นอนหลับ',
  nap: 'งีบหลับ',
  cook: 'ทำอาหาร',
  haircut: 'ตัดผม',
}

interface ActState {
  cur: { spot: ActSpot; t0: number; dur: number; from: [number, number, number, number] } | null
  /** ความมืดของจอตอนหลับ (0–1) */
  dim: number
  /** ข้อความขั้นตอนตอนนี้ */
  step: string
}
export const useActivity = create<ActState>(() => ({ cur: null, dim: 0, step: '' }))

let stops: Stopper[] = []
let timers: number[] = []
const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))
const step = (t: string) => useActivity.setState({ step: t })

/** เมนูทำอาหาร: ใช้วัตถุดิบในกระเป๋า 1 อย่าง (ไม่มีวัตถุดิบ = ต้มข้าวต้มกินเอง) */
const RECIPES: { need: ItemId; dish: string; hunger: number }[] = [
  { need: 'egg', dish: 'ไข่เจียวหมูสับ', hunger: 22 },
  { need: 'basil', dish: 'ผัดกะเพรา', hunger: 25 },
  { need: 'morningglory', dish: 'ผัดผักบุ้งไฟแดง', hunger: 20 },
  { need: 'fish_catfish', dish: 'ปลาดุกทอด', hunger: 30 },
  { need: 'fish_tilapia', dish: 'ปลานิลทอด', hunger: 28 },
  { need: 'fish_barb', dish: 'ปลาตะเพียนทอดกรอบ', hunger: 22 },
  { need: 'eggplant', dish: 'แกงมะเขือ', hunger: 20 },
  { need: 'pumpkin', dish: 'ฟักทองผัดไข่', hunger: 24 },
  { need: 'tomato', dish: 'ต้มยำมะเขือเทศ', hunger: 18 },
]

export function startActivity(id: string) {
  const g = useGame.getState()
  const spot = actSpotById(id)
  if (!spot || !g.save || useActivity.getState().cur) return
  if (g.riding) return
  const p = playerNow()
  const dur = DUR[spot.kind]
  useActivity.setState({ cur: { spot, t0: performance.now(), dur, from: p }, dim: 0, step: '' })
  g.doGesture(POSE[spot.kind], dur * 1000)
  const k = spot.kind
  if (k === 'toilet') {
    step('ปิดประตูห้องน้ำ…')
    later(900, () => step('นั่งชักโครก…'))
    later(5200, () => {
      step('กดชักโครก ซู่ ~')
      playFlush()
    })
  } else if (k === 'shower') {
    step('เปิดฝักบัว…')
    later(500, () => {
      stops.push(startShower())
      step('อาบน้ำ ถูสบู่ สระผม…')
    })
    later(9800, () => step('ปิดน้ำ เช็ดตัว'))
  } else if (k === 'bathe') {
    step('ตักน้ำจากโอ่งราดตัว…')
    stops.push(startBucketBath())
  } else if (k === 'sleep' || k === 'nap') {
    step(k === 'sleep' ? 'ขึ้นเตียง ห่มผ้า…' : 'เอนหลังงีบสักพัก…')
    later(1400, () => stops.push(startSleepBreath()))
    later(2200, () => {
      step('หลับ… Zzz')
      fade(1, 1200)
    })
    later(k === 'sleep' ? 5000 : 4400, () => {
      const { minute, day } = useClock.getState()
      if (k === 'sleep') setClockTo(6 * 60, minute < 5 * 60 ? day : day + 1)
      else setClockTo(minute + 90, day)
      step(k === 'sleep' ? 'อรุณสวัสดิ์ — เช้าวันใหม่แล้ว ☀️' : 'ตื่นแล้ว สดชื่นขึ้น')
      fade(0, 1400)
    })
  } else if (k === 'haircut') {
    step('ช่างโรจน์คลุมผ้าให้…')
    later(700, () => {
      stops.push(startHaircut())
      step('ฉับ ๆ ตัดผม เล็มปลาย…')
    })
    later(5200, () => step('ไถปัตตาเลี่ยนรอบหู…'))
    later(9000, () => step('ปัดเศษผม ส่องกระจก'))
  } else if (k === 'cook') {
    const r = RECIPES.find((x) => countOf(x.need) > 0)
    const cook = startCooking()
    stops.push(cook.stop)
    step('จุดเตา ตั้งกระทะ…')
    later(1300, () => step(r ? `หยิบ${ITEMS[r.need].name}ใส่กระทะ` : 'หยิบข้าวสารกับน้ำใส่หม้อ'))
    later(2000, () => {
      if (r) cook.drop()
      else cook.boil()
    })
    later(3000, () => step(r ? `ผัด ๆ ${r.dish}…` : 'ต้มข้าวต้ม…'))
    later(5200, () => r && cook.drop())
    later(8200, () => {
      if (r) cook.boil()
      step(r ? 'ทำน้ำแกงเล็ก ๆ ต้มเดือด…' : 'ข้าวต้มเดือดปุด ๆ…')
    })
    later(12000, () => step('ตักใส่จาน ปิดเตา'))
    ;(useActivity.getState().cur as { recipe?: typeof r }).recipe = r
  }
  later(dur * 1000, () => stopActivity(true))
}

function fade(to: number, ms: number) {
  const from = useActivity.getState().dim
  const t0 = performance.now()
  const tick = () => {
    const k = Math.min(1, (performance.now() - t0) / ms)
    useActivity.setState({ dim: from + (to - from) * k })
    if (k < 1 && useActivity.getState().cur) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

export function stopActivity(finished = false) {
  const c = useActivity.getState().cur
  if (!c) return
  timers.forEach((t) => clearTimeout(t))
  timers = []
  stops.forEach((s) => s())
  stops = []
  useActivity.setState({ cur: null, dim: 0, step: '' })
  const g = useGame.getState()
  if (g.gesture) useGame.setState({ gesture: null })
  if (!finished) return
  const k = c.spot.kind
  if (k === 'toilet') {
    g.changeStats({ health: 2, fun: 1 })
    g.toast({ title: '🚽 เข้าห้องน้ำเรียบร้อย', body: 'ล้างมือด้วยนะ · สบายตัวขึ้น', tone: 'success' })
  } else if (k === 'shower' || k === 'bathe') {
    g.changeStats({ health: 5, fun: 4 })
    g.toast({ title: k === 'shower' ? '🚿 อาบน้ำเสร็จแล้ว' : '🪣 อาบน้ำจากโอ่งเย็นสดชื่น', body: 'ตัวหอมสะอาด สุขภาพ +5 · สนุก +4', tone: 'success' })
  } else if (k === 'sleep') {
    g.changeStats({ health: 25, fun: 8, hunger: -10, thirst: -10 })
    g.toast({ title: '☀️ ตื่นนอนตอนเช้า', body: 'นอนเต็มอิ่ม สุขภาพ +25 · เริ่มวันใหม่ได้เลย', tone: 'success' })
  } else if (k === 'nap') {
    g.changeStats({ health: 8, fun: 3, hunger: -3, thirst: -3 })
    g.toast({ title: '😴 งีบหลับสบาย', body: 'ผ่านไป 1 ชั่วโมงครึ่ง · สุขภาพ +8', tone: 'success' })
  } else if (k === 'haircut') {
    g.changeStats({ fun: 8, health: 2 })
    g.toast({ title: '💈 ตัดผมเสร็จแล้ว ทรงใหม่ดูดี!', body: 'ช่างโรจน์ตัดให้ · สนุก +8', tone: 'success' })
  } else if (k === 'cook') {
    const r = (c as { recipe?: (typeof RECIPES)[number] }).recipe
    if (r && countOf(r.need) > 0) {
      const inv = { ...(g.save?.inventory ?? {}) }
      inv[r.need] = (inv[r.need] ?? 0) - 1
      if ((inv[r.need] ?? 0) <= 0) delete inv[r.need]
      if (g.save) useGame.setState({ save: { ...g.save, inventory: inv }, dirty: true })
      g.changeStats({ hunger: r.hunger, fun: 4 })
      g.toast({ title: `🍳 ทำ${r.dish}เสร็จแล้ว — อร่อย!`, body: `ใช้${ITEMS[r.need].name} 1 · อิ่มท้อง +${r.hunger}`, tone: 'success' })
    } else {
      g.changeStats({ hunger: 12, fun: 2 })
      g.toast({ title: '🍚 ต้มข้าวต้มกินเอง', body: 'อิ่มท้อง +12 · มีวัตถุดิบ (ไข่ ผัก ปลา) ในกระเป๋าจะทำเมนูอร่อยกว่านี้ได้', tone: 'success' })
    }
    g.saveNow('event')
  }
}

/** ตำแหน่งผู้เล่นตอนเริ่ม (พิกัดโลก + ความสูง + ทิศ) — ใช้เดินเข้าตำแหน่งอย่างนุ่มนวล */
let playerNow: () => [number, number, number, number] = () => [0, 0, 0, 0]
export function bindPlayerNow(fn: () => [number, number, number, number]) {
  playerNow = fn
}

const ease = (k: number) => k * k * (3 - 2 * k)

/** ตำแหน่ง/ท่าทางระหว่างทำกิจกรรม (พิกัดโลก) — null = ไม่ได้ทำกิจกรรม */
export function activityPose(now: number): { x: number; y: number; z: number; heading: number; tilt: number } | null {
  const c = useActivity.getState().cur
  if (!c) return null
  const t = (now - c.t0) / 1000
  const { at, kind, upper } = c.spot
  // y คืนค่าเป็นความสูงจากพื้นชั้นที่ยืนอยู่ (Player บวกความสูงพื้นให้เอง)
  const floor = 0
  void upper
  const tx = INTERIOR_ORIGIN[0] + at.x
  const tz = INTERIOR_ORIGIN[1] + at.z
  const [fx, , fz, fh] = c.from
  const fy = 0
  // เดินเข้าตำแหน่ง 0.8 วิแรก
  const k = ease(Math.min(1, t / 0.8))
  let dh = at.heading - fh
  dh = Math.atan2(Math.sin(dh), Math.cos(dh))
  const heading = fh + dh * k
  let x = fx + (tx - fx) * k
  let z = fz + (tz - fz) * k
  let y = fy + (floor - fy) * k
  let tilt = 0
  if (kind === 'sleep' || kind === 'nap') {
    // ขึ้นเตียง: ยกตัวขึ้นนั่งที่ปลายเตียง แล้วค่อย ๆ เอนหลังลงนอน · ช่วงท้ายลุกขึ้นนั่งแล้วลงจากเตียง
    const end = c.dur
    const lie = t < 0.8 ? 0 : t < 1.6 ? ease((t - 0.8) / 0.8) : t > end - 1.1 ? ease(Math.max(0, (end - t) / 1.1)) : 1
    y = floor + (at.y + 0.1) * Math.min(1, Math.max(0, (t - 0.4) / 0.6)) * (t > end - 0.5 ? (end - t) / 0.5 : 1)
    tilt = -Math.PI / 2 * lie
    // หายใจช้า ๆ ตอนหลับ
    if (lie > 0.98) y += Math.sin(t * 1.6) * 0.008
  } else if (kind === 'toilet') {
    y = floor + (t > 0.8 ? at.y * Math.min(1, (t - 0.8) / 0.4) : 0) * (t > c.dur - 1 ? Math.max(0, (c.dur - t) / 0.6) : 1)
  } else if (kind === 'cook') {
    // ขยับตัวไปมาระหว่างหยิบวัตถุดิบ–เตา
    x += Math.sin(t * 0.9) * 0.05
  }
  return { x, y, z, heading, tilt }
}
