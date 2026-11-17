/**
 * แปลงผักสวนครัวหน้าบ้าน: ปลูก → รดน้ำ → รอโต → เก็บ
 * ผักโตตามเวลาในเกม เฉพาะตอนดินยังชื้น (ไม่มีผักตาย — ลืมรดน้ำแค่หยุดโต)
 */
import { create } from 'zustand'
import { useGame } from './store'
import { addItem, countOf } from './inventory'
import { ITEMS, type ItemId } from './content/items'
import { bedProgress, bedStage, CROP_LIST, CROPS, GARDEN_BEDS, grownMinutes, isWet, WATER_HOURS, type BedState, type CropId } from './content/garden'

interface GardenUi {
  /** แปลงที่ยืนใกล้ (index) */
  near: number | null
  /** กำลังเลือกเมล็ดปลูกที่แปลงนี้ */
  picking: number | null
}
export const useGarden = create<GardenUi>(() => ({ near: null, picking: null }))

/** เวลาสัมบูรณ์ในเกม (นาที) */
export function nowMinute() {
  const s = useGame.getState().save
  return s ? s.day * 1440 + s.minuteOfDay : 0
}

const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' = 'info') => useGame.getState().toast({ title, body, tone })

function setBed(i: number, b: BedState) {
  const g = useGame.getState()
  if (!g.save) return
  const garden = g.save.garden.slice()
  garden[i] = b
  useGame.setState({ save: { ...g.save, garden }, dirty: true })
  g.saveNow('event')
}

/** หาแปลงที่ใกล้ที่สุด (ภายใน 1.5 เมตรจากกลางแปลง) */
export function findBed(x: number, z: number): number | null {
  let best: number | null = null
  let bd = 1.5
  GARDEN_BEDS.forEach(([bx, bz], i) => {
    const d = Math.hypot(bx - x, bz - z)
    if (d < bd) {
      bd = d
      best = i
    }
  })
  return best
}

/** เมล็ดที่มีในกระเป๋า */
export const seedsInBag = () => CROP_LIST.filter((c) => countOf(c.seed) > 0)

const hoursLeft = (b: BedState, now: number) => Math.ceil((CROPS[b.crop!].growHours * 60 - grownMinutes(b, now)) / 60)

/** ข้อความป้ายกลางจอ */
export function bedHint(i: number) {
  const b = useGame.getState().save?.garden[i]
  if (!b) return ''
  const now = nowMinute()
  if (!b.crop) return seedsInBag().length ? '🌱 ปลูกผัก' : '🌱 แปลงว่าง (ซื้อเมล็ดผักที่ร้านป้าศรี)'
  const c = CROPS[b.crop]
  if (bedStage(b, now) === 3) return `🧺 เก็บ${c.name}`
  if (!isWet(b, now)) return `💧 รดน้ำ${c.name} (${Math.round(bedProgress(b, now) * 100)}%)`
  return `🌿 ${c.name}กำลังโต ${Math.round(bedProgress(b, now) * 100)}% · อีกราว ${hoursLeft(b, now)} ชม.`
}

/** กด E ที่แปลง */
export function tendBed(i: number) {
  const g = useGame.getState()
  const b = g.save?.garden[i]
  if (!b) return
  const now = nowMinute()
  if (!b.crop) {
    const seeds = seedsInBag()
    if (seeds.length === 0) {
      toast('ยังไม่มีเมล็ดผัก', 'ซื้อเมล็ดผักได้ที่ร้านป้าศรี (เมล็ดละ 3 เม็ดต่อซอง)', 'info')
      return
    }
    if (seeds.length === 1) plant(i, seeds[0].id)
    else useGarden.setState({ picking: i })
    return
  }
  const c = CROPS[b.crop]
  if (bedStage(b, now) === 3) {
    harvest(i)
    return
  }
  if (!isWet(b, now)) {
    // รดน้ำ: เก็บการโตถึงตอนนี้ แล้วดินชื้นต่อไปอีก WATER_HOURS ชม.
    setBed(i, { ...b, grow: grownMinutes(b, now), settled: now, wetUntil: now + WATER_HOURS * 60 })
    g.changeStats({ thirst: -0.3 })
    toast(`💧 รดน้ำ${c.name}แล้ว`, `ดินชื้นไปอีก ${WATER_HOURS} ชั่วโมง · อีกราว ${hoursLeft(b, now)} ชม. เก็บได้`, 'success')
    return
  }
  toast(`🌿 ${c.name}กำลังโต ${Math.round(bedProgress(b, now) * 100)}%`, `ดินยังชื้นอยู่ · อีกราว ${hoursLeft(b, now)} ชั่วโมงในเกม (ข้ามเวลาได้ที่นาฬิกา)`, 'info')
}

export function plant(i: number, crop: CropId) {
  useGarden.setState({ picking: null })
  const c = CROPS[crop]
  const g = useGame.getState()
  if (!g.save || countOf(c.seed) <= 0 || g.save.garden[i]?.crop) return
  const inventory = { ...g.save.inventory }
  inventory[c.seed] = (inventory[c.seed] ?? 0) - 1
  if ((inventory[c.seed] ?? 0) <= 0) delete inventory[c.seed]
  const now = nowMinute()
  const garden = g.save.garden.slice()
  garden[i] = { crop, grow: 0, settled: now, wetUntil: now }
  useGame.setState({ save: { ...g.save, inventory, garden }, dirty: true })
  g.saveNow('event')
  toast(`🌱 ปลูก${c.name}แล้ว`, 'อย่าลืมรดน้ำนะ — กด E อีกครั้ง', 'success')
}

function harvest(i: number) {
  const g = useGame.getState()
  const b = g.save!.garden[i]
  const c = CROPS[b.crop!]
  const want = c.yield[0] + Math.floor(Math.random() * (c.yield[1] - c.yield[0] + 1))
  const n = addItem(c.produce, want)
  if (n === 0) {
    toast('กระเป๋าเต็มแล้ว', 'ขายของที่ร้านป้าศรี หรือกินผักในกระเป๋าก่อน', 'warn')
    return
  }
  const now = nowMinute()
  // ผักที่แตกยอดใหม่ได้: ย้อนกลับไปเป็นต้นอ่อน (ไม่ต้องปลูกใหม่) — ความชื้นดินเดิมยังอยู่
  const next: BedState = c.regrowHours
    ? { crop: c.id, grow: (c.growHours - c.regrowHours) * 60, settled: now, wetUntil: useGame.getState().save!.garden[i].wetUntil }
    : { crop: null, grow: 0, settled: now, wetUntil: b.wetUntil }
  setBed(i, next)
  g.changeStats({ fun: 2 })
  toast(`🧺 เก็บ${c.name} +${n}`, c.regrowHours ? `เดี๋ยวแตกยอดใหม่ อีกราว ${c.regrowHours} ชม. เก็บได้อีก (อย่าลืมรดน้ำ)` : 'แปลงว่างแล้ว ปลูกใหม่ได้เลย', 'success')
}

/** กินผักจากกระเป๋า */
export function eat(id: ItemId) {
  const def = ITEMS[id]
  const g = useGame.getState()
  if (!g.save || !def.food || countOf(id) <= 0) return
  const inventory = { ...g.save.inventory }
  inventory[id] = (inventory[id] ?? 0) - 1
  if ((inventory[id] ?? 0) <= 0) delete inventory[id]
  useGame.setState({ save: { ...g.save, inventory }, dirty: true })
  if (id === 'chili') {
    g.changeStats({ hunger: def.food, thirst: -8 })
    toast('🌶️ เผ็ดมาก! 🥵', 'หิวน้ำขึ้นมาทันที', 'warn')
  } else {
    g.changeStats({ hunger: def.food })
    toast(`😋 กิน${def.name}แล้ว`, `อิ่มขึ้น +${def.food}`, 'success')
  }
  g.saveNow('event')
}
