/**
 * เทศกาลในหมู่บ้าน (§2.57): เทศกาลที่กำลังจัด · จุดกิจกรรม (กด E) · แจ้งเตือนก่อนถึงวันงาน · บันทึกการเข้าร่วม
 */
import { create } from 'zustand'
import { useGame } from './store'
import { activeFestivals, FESTIVALS, today, upcoming, ymd, type FestivalId } from './content/calendar'
import { addItem, canAfford } from './inventory'
import { outsideDoor } from './interior'
import { PLACES } from './content/village'

export interface FestSpot {
  id: string
  fest: FestivalId
  x: number
  z: number
  label: string
}

export const useFestival = create<{ active: FestivalId[]; near: FestSpot | null; floated: { x: number; z: number; t: number }[]; ver: number }>(() => ({
  active: [],
  near: null,
  floated: [],
  ver: 0,
}))

/** ตำแหน่งงานต่าง ๆ (พิกัดโลก) */
const pond = () => PLACES.find((p) => p.id === 'pond')!
const farm = () => PLACES.find((p) => p.id === 'farm-soi2')!
export const FEST_POS = {
  krathongStall: (): [number, number] => [pond().pos[0] + 5, pond().pos[1] - pond().size[1] / 2 - 2.5],
  floatDock: (): [number, number] => [pond().pos[0] - 3, pond().pos[1] - pond().size[1] / 2 - 0.6],
  fairBooth: (): [number, number] => [8, -35],
  wish: (): [number, number] => [-7, -36],
  barrels: (): [number, number] => [-33, 52],
}

export function festSpots(): FestSpot[] {
  const a = useFestival.getState().active
  const out: FestSpot[] = []
  const add = (fest: FestivalId, id: string, p: [number, number], label: string) => a.includes(fest) && out.push({ id, fest, x: p[0], z: p[1], label })
  add('loykrathong', 'krathong-make', FEST_POS.krathongStall(), '🌸 ทำกระทง (ใบไม้ 2 + ดอกบัว 1 · หรือซื้อ 20 บาท)')
  add('loykrathong', 'krathong-float', FEST_POS.floatDock(), '🕯️ ลอยกระทง ขอพร')
  add('songkran', 'rodnam', outsideDoor(), '💐 รดน้ำดำหัวตายาย ขอพร')
  add('songkran', 'splash', FEST_POS.barrels(), '💦 เล่นสาดน้ำสงกรานต์')
  const f = farm()
  add('harvest', 'dry-rice', [f.pos[0] - 6, f.pos[1] + 6], '🌾 ช่วยตากข้าว')
  add('planting', 'seedlings', [f.pos[0] + 6, f.pos[1] + 6], '🌱 ช่วยมัดต้นกล้า')
  add('templefair', 'balloon', FEST_POS.fairBooth(), '🎈 เล่นปาลูกโป่ง (10 บาท)')
  add('newyear', 'wish', FEST_POS.wish(), '🎆 ขอพรปีใหม่')
  return out
}

const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
let lastDay = ''
/** เรียกเป็นระยะ: อัปเดตเทศกาลที่กำลังจัด + แจ้งเตือน (วันละครั้ง) */
export function refreshFestivals() {
  const d = today()
  const key = ymd(d)
  if (key === lastDay) return
  lastDay = key
  useFestival.setState({ active: activeFestivals(d).map((f) => f.id), ver: useFestival.getState().ver + 1 })
  const g = useGame.getState()
  for (const u of upcoming(d)) {
    const md = `${u.f.main[1]} ${TH_MONTH[u.f.main[0] - 1]}`
    if (u.active && u.mainDays > 0) g.toast({ title: `${u.f.icon} เริ่มช่วง${u.f.name}แล้ว · อีก ${u.mainDays} วันถึงวันจริง`, body: `วันจริง ${md} · ${u.f.note}`, tone: 'discover' })
    else if (u.active && u.mainDays === 0) g.toast({ title: `${u.f.icon} วันนี้คือ${u.f.name}`, body: u.f.note, tone: 'discover' })
    else if (u.active) g.toast({ title: `${u.f.icon} ตอนนี้มี${u.f.name}`, body: u.f.note, tone: 'discover' })
    else if (u.days >= 1 && u.days <= 3) g.toast({ title: `${u.f.icon} อีก ${u.mainDays} วันจะถึง${u.f.name} (${md})`, body: `เริ่มเตรียมงานในอีก ${u.days} วัน · ${u.f.note}`, tone: 'info' })
  }
}

export function findFestSpot(x: number, z: number): FestSpot | null {
  let best: FestSpot | null = null
  let bd = 2.4
  for (const s of festSpots()) {
    const d = Math.hypot(s.x - x, s.z - z)
    if (d < bd) {
      bd = d
      best = s
    }
  }
  return best
}

const doneToday = (id: string) => useGame.getState().save?.festivalLog?.[ymd(today()) + ':' + id]
function markDone(id: string, fest: FestivalId) {
  const g = useGame.getState()
  if (!g.save) return
  const k = ymd(today())
  useGame.setState({ save: { ...g.save, festivalLog: { ...(g.save.festivalLog ?? {}), [k + ':' + id]: true, [today().getFullYear() + ':' + fest]: true } }, dirty: true })
}
const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' | 'discover' = 'success') => useGame.getState().toast({ title, body, tone })

/** กด E ที่จุดกิจกรรมเทศกาล */
export function doFestSpot(s: FestSpot) {
  const g = useGame.getState()
  if (!g.save) return
  const inv = g.save.inventory
  switch (s.id) {
    case 'krathong-make': {
      if ((inv.leaf ?? 0) >= 2 && (inv.lotus ?? 0) >= 1) {
        const next: typeof inv = { ...inv, leaf: (inv.leaf ?? 0) - 2, lotus: (inv.lotus ?? 0) - 1 }
        if (!next.leaf) delete next.leaf
        if (!next.lotus) delete next.lotus
        useGame.setState({ save: { ...g.save, inventory: next }, dirty: true })
        addItem('krathong', 1)
        toast('🌸 ทำกระทงเสร็จแล้ว', 'พับใบไม้ ประดับดอกบัว ปักธูปเทียน · ไปลอยที่ท่าน้ำได้เลย')
      } else if (g.save.coins >= 20) {
        if (addItem('krathong', 1) > 0) g.addCoins(-20, '🌸 ซื้อกระทงใบตอง')
      } else toast('เงินไม่พอ', 'ใช้ใบไม้ 2 + ดอกบัว 1 (เก็บบัวที่บ่อได้) หรือมีเงิน 20 บาท', 'warn')
      return
    }
    case 'krathong-float': {
      if ((inv.krathong ?? 0) <= 0) return toast('ยังไม่มีกระทง', 'ทำหรือซื้อกระทงที่ซุ้มริมบ่อก่อนนะ', 'info')
      const next: typeof inv = { ...inv, krathong: (inv.krathong ?? 0) - 1 }
      if (!next.krathong) delete next.krathong
      useGame.setState({ save: { ...g.save, inventory: next }, dirty: true })
      const [x, z] = FEST_POS.floatDock()
      useFestival.setState((st) => ({ floated: [...st.floated, { x, z: z + 1.2, t: performance.now() }] }))
      g.changeStats({ fun: 12 })
      markDone('krathong-float', 'loykrathong')
      const wishes = ['ขอให้ครอบครัวมีความสุข', 'ขอให้ปีนี้นาข้าวงาม', 'ขอขมาพระแม่คงคา', 'ขอให้สัตว์เลี้ยงแข็งแรง', 'ขอให้ได้พบเพื่อนใหม่']
      toast('🕯️ ลอยกระทงแล้ว', wishes[Math.floor(Math.random() * wishes.length)] + ' · สนุก +12', 'discover')
      return
    }
    case 'rodnam': {
      if (doneToday(s.id)) return toast('รดน้ำดำหัวไปแล้ววันนี้', 'ตายายให้พรแล้ว พรุ่งนี้มาใหม่นะ', 'info')
      markDone(s.id, s.fest)
      g.changeStats({ fun: 10, health: 5 })
      g.addCoins(20, 'ตายายให้พรและอั่งเปา')
      toast('💐 รดน้ำดำหัวตายาย', '"ขอให้หลานอยู่เย็นเป็นสุข สุขภาพแข็งแรง" · สนุก +10 · สุขภาพ +5')
      return
    }
    case 'splash': {
      g.changeStats({ fun: 4, thirst: 2 })
      useFestival.setState({ ver: useFestival.getState().ver + 1 })
      toast('💦 สาดน้ำ! เย็นชื่นใจ', 'สุขสันต์วันสงกรานต์ · สนุก +4', 'info')
      return
    }
    case 'dry-rice':
    case 'seedlings': {
      if (doneToday(s.id)) return toast('วันนี้ช่วยไปแล้ว', 'ขอบใจมากนะหลาน พรุ่งนี้มาช่วยใหม่', 'info')
      markDone(s.id, s.fest)
      if (s.id === 'dry-rice') addItem('feed', 3)
      g.addCoins(s.id === 'dry-rice' ? 15 : 10, s.id === 'dry-rice' ? '🌾 ค่าแรงช่วยตากข้าว' : '🌱 ค่าแรงช่วยมัดต้นกล้า')
      toast(s.id === 'dry-rice' ? '🌾 ช่วยตากข้าวเสร็จแล้ว' : '🌱 มัดต้นกล้าเสร็จแล้ว', s.id === 'dry-rice' ? 'ได้ข้าวเปลือก (อาหารสัตว์) ×3 ติดมือกลับบ้าน' : 'พร้อมปักดำแล้ว')
      return
    }
    case 'balloon': {
      if (g.save.coins < 10) return toast('เงินไม่พอ', 'ปาลูกโป่งรอบละ 10 บาท', 'warn')
      g.addCoins(-10)
      const hits = [0, 1, 1, 2, 2, 3][Math.floor(Math.random() * 6)]
      if (hits >= 3) {
        addItem('treat', 2)
        toast('🎈🎈🎈 แตก 3 ลูก! ได้รางวัลใหญ่', 'กล้วยสุก ×2 + ตุ๊กตาหมี (ของสะสมงานวัด)', 'discover')
        markDone('balloon-win', 'templefair')
      } else if (hits === 2) {
        g.addCoins(10, 'ปาแตก 2 ลูก ได้เงินคืน')
      } else toast(hits ? '🎈 แตก 1 ลูก' : 'พลาดหมดเลย', 'ลองใหม่ได้นะ', 'info')
      markDone('balloon', 'templefair')
      return
    }
    case 'wish': {
      if (doneToday(s.id)) return toast('ขอพรไปแล้ววันนี้', undefined, 'info')
      markDone(s.id, s.fest)
      g.addCoins(50, '🎆 ของขวัญปีใหม่จากวัด')
      toast('🎆 สวัสดีปีใหม่', 'ขอให้ปีนี้มีแต่สิ่งดี ๆ', 'discover')
      return
    }
  }
}

/** เทศกาลนี้ปีนี้เข้าร่วมแล้วหรือยัง */
export const joinedThisYear = (fest: FestivalId) => !!useGame.getState().save?.festivalLog?.[today().getFullYear() + ':' + fest]
export { FESTIVALS, canAfford }
