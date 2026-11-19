/**
 * ระบบเช็กอินเข้าเกมรายวัน (ผู้สร้าง 19 พ.ย. 2569)
 * - เข้าเกมแต่ละวัน (วันจริงตามนาฬิกาเครื่อง) = เช็กอินอัตโนมัติ · ได้สิทธิ์สุ่มรางวัลวันละ 1 ครั้ง
 * - รางวัล 5 ประเภท: เงิน · อาหาร · เพชรและทอง · อาวุธ · เครื่องแต่งกาย — มีของทั่วไปและของหายาก
 * - สุ่มได้ทั้งไอเทมชิ้นเดียว/หลายชิ้น หรือเงินตามจำนวน · ผู้เล่นแต่ละคนได้ไม่เหมือนกัน (สุ่มจริง)
 * - ของที่สุ่มได้เข้ากระเป๋าตามประเภท (เงิน → กระเป๋าเงิน) · กระเป๋าเต็ม = แปลงเป็นเงินตามราคาขายแทน
 */
import { addItem } from './inventory'
import { useGame } from './store'
import { ITEMS, type ItemId } from './content/items'

export type RewardCategory = 'money' | 'food' | 'treasure' | 'weapon' | 'wear'
export type Rarity = 'common' | 'rare' | 'epic'

export interface RewardDef {
  key: string
  category: RewardCategory
  rarity: Rarity
  /** ไอเทม (ไม่มี = เงิน) */
  item?: ItemId
  /** จำนวน [ต่ำสุด, สูงสุด] — เงินเป็นบาท */
  qty: [number, number]
  /** น้ำหนักการสุ่ม (ยิ่งมากยิ่งออกบ่อย) */
  weight: number
}

export const CATEGORY_LABEL: Record<RewardCategory, string> = {
  money: 'เงิน',
  food: 'อาหาร',
  treasure: 'เพชรและทอง',
  weapon: 'อาวุธ',
  wear: 'เครื่องแต่งกาย',
}
export const RARITY_LABEL: Record<Rarity, string> = { common: 'ทั่วไป', rare: 'หายาก', epic: 'หายากมาก' }

export const REWARDS: RewardDef[] = [
  // เงิน
  { key: 'coins-s', category: 'money', rarity: 'common', qty: [30, 80], weight: 16 },
  { key: 'coins-m', category: 'money', rarity: 'rare', qty: [120, 250], weight: 6 },
  { key: 'coins-l', category: 'money', rarity: 'epic', qty: [500, 800], weight: 1.5 },
  // อาหาร
  { key: 'egg', category: 'food', rarity: 'common', item: 'egg', qty: [3, 6], weight: 9 },
  { key: 'sticky', category: 'food', rarity: 'common', item: 'sticky_rice', qty: [2, 4], weight: 9 },
  { key: 'tomato', category: 'food', rarity: 'common', item: 'tomato', qty: [3, 5], weight: 6 },
  { key: 'mango', category: 'food', rarity: 'common', item: 'mango_ripe', qty: [2, 4], weight: 7 },
  { key: 'fish', category: 'food', rarity: 'rare', item: 'fish_catfish', qty: [1, 2], weight: 4 },
  { key: 'pumpkin', category: 'food', rarity: 'rare', item: 'pumpkin', qty: [1, 2], weight: 3 },
  // เพชรและทอง
  { key: 'pearl', category: 'treasure', rarity: 'rare', item: 'pearl', qty: [1, 2], weight: 3.5 },
  { key: 'gold', category: 'treasure', rarity: 'rare', item: 'gold_nugget', qty: [1, 2], weight: 3 },
  { key: 'amethyst', category: 'treasure', rarity: 'epic', item: 'amethyst', qty: [1, 1], weight: 1.2 },
  { key: 'ruby', category: 'treasure', rarity: 'epic', item: 'ruby', qty: [1, 1], weight: 1 },
  { key: 'sapphire', category: 'treasure', rarity: 'epic', item: 'sapphire', qty: [1, 1], weight: 0.8 },
  // อาวุธ
  { key: 'slingshot', category: 'weapon', rarity: 'common', item: 'slingshot', qty: [1, 1], weight: 3 },
  { key: 'spear', category: 'weapon', rarity: 'rare', item: 'spear_bamboo', qty: [1, 1], weight: 2 },
  { key: 'sword', category: 'weapon', rarity: 'epic', item: 'sword_wood', qty: [1, 1], weight: 1.2 },
  // เครื่องแต่งกาย
  { key: 'pakaoma', category: 'wear', rarity: 'common', item: 'pakaoma', qty: [1, 1], weight: 4 },
  { key: 'ngob', category: 'wear', rarity: 'rare', item: 'hat_ngob', qty: [1, 1], weight: 2.5 },
  { key: 'sarong', category: 'wear', rarity: 'epic', item: 'sarong_silk', qty: [1, 1], weight: 1 },
]
export const rewardByKey = (k: string) => REWARDS.find((r) => r.key === k)

export interface CheckinRoll {
  /** วันที่จริง YYYY-MM-DD */
  date: string
  key: string
  qty: number
  /** เก็บเข้ากระเป๋าแล้ว */
  claimed: boolean
  /** กระเป๋าเต็ม → แปลงเป็นเงิน (บาท) */
  convertedCoins?: number
}

export interface CheckinSave {
  /** วันที่เช็กอินทั้งหมด (YYYY-MM-DD) */
  days: string[]
  /** วันติดต่อกันล่าสุด */
  streak: number
  /** ประวัติการสุ่ม (ล่าสุดท้ายสุด) */
  history: CheckinRoll[]
}

/** วันที่จริงตามเวลาเครื่อง (ไม่ใช่วันในเกม) */
export function todayStr(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const dayBefore = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return todayStr(new Date(y, m - 1, d - 1))
}

const cur = (): CheckinSave => useGame.getState().save?.checkin ?? { days: [], streak: 0, history: [] }

function commit(next: CheckinSave) {
  const g = useGame.getState()
  if (!g.save) return
  useGame.setState({ save: { ...g.save, checkin: next }, dirty: true })
  g.saveNow('event')
}

/** เช็กอินอัตโนมัติเมื่อเข้าเกม — คืน true ถ้าเป็นการเช็กอินครั้งแรกของวันนี้ */
export function autoCheckin(): boolean {
  const c = cur()
  const today = todayStr()
  if (c.days.includes(today)) return false
  const streak = c.days.includes(dayBefore(today)) ? c.streak + 1 : 1
  commit({ ...c, days: [...c.days.slice(-60), today], streak })
  return true
}

/** สุ่มรางวัลของวันนี้แล้วหรือยัง */
export const todayRoll = () => cur().history.find((h) => h.date === todayStr())
export const canRollToday = () => cur().days.includes(todayStr()) && !todayRoll()

function pick(): RewardDef {
  const total = REWARDS.reduce((s, r) => s + r.weight, 0)
  let x = Math.random() * total
  for (const r of REWARDS) {
    x -= r.weight
    if (x <= 0) return r
  }
  return REWARDS[0]
}
const between = ([a, b]: [number, number]) => a + Math.floor(Math.random() * (b - a + 1))

/** สุ่มรางวัลประจำวัน (วันละครั้ง) — เก็บผลไว้ในเซฟก่อน แล้วค่อยกดรับเข้ากระเป๋า */
export function rollToday(): CheckinRoll | null {
  if (!canRollToday()) return todayRoll() ?? null
  const r = pick()
  let qty = between(r.qty)
  if (r.category === 'money') qty = Math.round(qty / 5) * 5
  const roll: CheckinRoll = { date: todayStr(), key: r.key, qty, claimed: false }
  const c = cur()
  commit({ ...c, history: [...c.history.slice(-59), roll] })
  return roll
}

/** รับรางวัลเข้ากระเป๋า/กระเป๋าเงิน */
export function claimToday(): CheckinRoll | null {
  const roll = todayRoll()
  if (!roll || roll.claimed) return roll ?? null
  const r = rewardByKey(roll.key)
  const g = useGame.getState()
  let converted: number | undefined
  if (!r || r.category === 'money') {
    g.addCoins(roll.qty, 'รางวัลเช็กอินรายวัน')
  } else if (r.item) {
    const got = addItem(r.item, roll.qty)
    const left = roll.qty - got
    if (left > 0) {
      converted = left * ITEMS[r.item].sell
      g.addCoins(converted, `กระเป๋าเต็ม — แปลง${ITEMS[r.item].name} ${left} ชิ้นเป็นเงิน`)
    }
  }
  const done: CheckinRoll = { ...roll, claimed: true, convertedCoins: converted }
  const c = cur()
  commit({ ...c, history: c.history.map((h) => (h.date === roll.date ? done : h)) })
  return done
}

/** วันในสัปดาห์นี้ (จันทร์–อาทิตย์) พร้อมสถานะ */
export function weekStatus() {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7 // 0 = จันทร์
  const c = cur()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + i)
    const s = todayStr(d)
    const roll = c.history.find((h) => h.date === s)
    return {
      date: s,
      dayNum: d.getDate(),
      label: ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'][i],
      checked: c.days.includes(s),
      claimed: !!roll?.claimed,
      isToday: s === todayStr(),
      future: d > now && s !== todayStr(),
    }
  })
}
export const streakNow = () => cur().streak
