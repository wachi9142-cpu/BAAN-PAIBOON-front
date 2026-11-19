/**
 * ป่าดงลึก + ศาลเก่า (ผู้สร้าง 19 พ.ย. 2569) — ด้าน "ความเชื่อและสิ่งลี้ลับ" ที่อยู่ในโลกเดียวกับหมู่บ้าน
 * - เดินเข้าป่าต่อจากปลายถนนใหญ่ฝั่งตะวันตก · เจอจุดค้นพบระหว่างทาง (ชายป่า ลานสมุนไพร น้ำซับ ศาลเก่า ลานหิ่งห้อย)
 * - เก็บเห็ด/สมุนไพร (มีใหม่ทุกวัน) · ดื่มน้ำซับ · อ่านกองหินเก่า
 * - ศาลเก่า: ไหว้ขอทาง · ทำความสะอาด (ครั้งแรก) · ถวายของ (วันละครั้ง) · ครบ 3 วัน แล้วมาตอนกลางคืน = เจ้าป่ามอบเครื่องราง
 * - เครื่องรางเจ้าป่า: พุ่มหนามหลังศาลแหวกทาง → ลานหิ่งห้อย (ว่านเรืองแสง + หีบลับ)
 * ความเชื่อใช้แบบให้เกียรติ เป็นเรื่องเล่าในโลกเกม
 */
import { create } from 'zustand'
import { useGame } from './store'
import { useClock } from './clock'
import { addItem, countOf } from './inventory'
import { ITEMS, type ItemId } from './content/items'
import { CAIRN_POS, FOREST_FINDS, HERB_SPOTS, SHRINE_POS, SPRING_POS, forestFlags, inForest } from './content/forest'
import { openActionWheel } from '../ui/ActionWheel'

export interface ForestSave {
  /** จุดค้นพบที่เจอแล้ว */
  found?: string[]
  /** จุดเก็บสมุนไพร → วันที่เก็บล่าสุด */
  picked?: Record<string, number>
  shrineCleaned?: boolean
  /** จำนวนวันที่ถวายของแล้ว */
  offers?: number
  lastOfferDay?: number
  lastWaiDay?: number
  amulet?: boolean
  /** ตำนานที่ฟังแล้ว */
  legends?: string[]
}

export const useForest = create<{ near: string | null; inside: boolean; wisps: number }>(() => ({ near: null, inside: false, wisps: 0 }))

const fs = (): ForestSave => useGame.getState().save?.forest ?? {}
function setFs(patch: Partial<ForestSave>) {
  const g = useGame.getState()
  if (!g.save) return
  useGame.setState({ save: { ...g.save, forest: { ...fs(), ...patch } }, dirty: true })
}
const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' | 'discover' = 'info') => useGame.getState().toast({ title, body, tone })
const today = () => useClock.getState().day
export const isNight = () => {
  const m = useClock.getState().minute
  return m >= 19 * 60 || m < 5 * 60
}
export const hasAmulet = () => !!fs().amulet || countOf('amulet_forest') > 0

/** เรียกทุก ~0.2 วิ จากฉาก: หาจุดใกล้ + ข้อความค้นพบ */
export function forestTick(x: number, z: number) {
  forestFlags.thornsOpen = hasAmulet()
  const ins = inForest(x, z)
  if (useForest.getState().inside !== ins) useForest.setState({ inside: ins })
  if (!ins) {
    if (useForest.getState().near) useForest.setState({ near: null })
    return
  }
  const found = fs().found ?? []
  for (const f of FOREST_FINDS) {
    if (found.includes(f.id)) continue
    if (Math.hypot(f.pos[0] - x, f.pos[1] - z) < f.r) {
      setFs({ found: [...found, f.id] })
      toast(f.title, f.body, 'discover')
      useGame.getState().saveNow('event')
      break
    }
  }
  let near: string | null = null
  let bd = 2.2
  const test = (id: string, p: [number, number], r = 2.2) => {
    const d = Math.hypot(p[0] - x, p[1] - z)
    if (d < r && d < bd + (r - 2.2)) {
      bd = d
      near = id
    }
  }
  for (const h of HERB_SPOTS) test('herb:' + h.id, h.pos, 1.8)
  test('shrine', SHRINE_POS, 2.8)
  test('spring', SPRING_POS, 2.9)
  test('cairn', CAIRN_POS, 2)
  if (useForest.getState().near !== near) useForest.setState({ near })
}

export function herbReady(id: string) {
  return (fs().picked?.[id] ?? -1) !== today()
}

export function forestHint(near: string): string {
  if (near.startsWith('herb:')) {
    const h = HERB_SPOTS.find((s) => 'herb:' + s.id === near)!
    const name = h.kind === 'mushroom' ? 'เห็ดป่า' : h.kind === 'herb' ? 'สมุนไพรป่า' : 'ว่านเรืองแสง'
    return herbReady(h.id) ? `เก็บ${name}` : `${name}ถูกเก็บไปแล้ว (พรุ่งนี้ขึ้นใหม่)`
  }
  if (near === 'spring') return '💧 ดื่มน้ำซับ'
  if (near === 'cairn') return '🪨 ดูกองหินเก่า'
  if (near === 'shrine') return '⛩️ ศาลเก่า (กดเพื่อเลือก)'
  return ''
}

export function activateForest(near: string) {
  const g = useGame.getState()
  if (!g.save) return
  if (near.startsWith('herb:')) {
    const h = HERB_SPOTS.find((s) => 'herb:' + s.id === near)
    if (!h) return
    if (!herbReady(h.id)) return toast('ตรงนี้เก็บไปแล้ววันนี้', 'พรุ่งนี้จะขึ้นใหม่ · ลองเดินหาจุดอื่นในป่า', 'info')
    const id: ItemId = h.kind === 'mushroom' ? 'mushroom_wild' : h.kind === 'herb' ? 'herb_wild' : 'herb_rare'
    const qty = h.kind === 'rareherb' ? 1 : 1 + Math.round(Math.random())
    const n = addItem(id, qty)
    if (n === 0) return toast('กระเป๋าเต็ม', 'ขายหรือทิ้งของบางอย่างก่อน', 'warn')
    setFs({ picked: { ...(fs().picked ?? {}), [h.id]: today() } })
    g.changeStats({ thirst: -0.4, hunger: -0.2 })
    toast(`${ITEMS[id].icon} ${ITEMS[id].name} +${n}`, h.kind === 'rareherb' ? 'ใบเรืองแสงจาง ๆ เหมือนมีชีวิต…' : undefined, 'success')
    return
  }
  if (near === 'spring') {
    g.changeStats({ thirst: 35, health: 3 })
    g.doGesture('offer', 1400)
    toast('💧 ดื่มน้ำซับเย็นชื่นใจ', 'หายกระหาย · น้ำซับในป่ามีตลอด ไม่ต้องกลัวขาดน้ำระหว่างเดินทาง', 'success')
    return
  }
  if (near === 'cairn') {
    toast('🪨 กองหินเก่า', 'มีดอกไม้แห้งกับเทียนที่ละลายจนหมดวางอยู่ — เคยมีคนแวะไหว้ทางแถวนี้ · ทางหลักข้างหน้าน่าจะมีอะไรอีก', 'info')
    return
  }
  if (near === 'shrine') openShrineWheel()
}

const OFFERABLE: ItemId[] = ['lotus', 'sticky_rice', 'treat', 'mango_ripe', 'egg']

function openShrineWheel() {
  const s = fs()
  const night = isNight()
  const offerItem = OFFERABLE.find((i) => countOf(i) > 0)
  const offeredToday = s.lastOfferDay === today()
  const ready = (s.offers ?? 0) >= 3 && !s.amulet
  openActionWheel(window.innerWidth / 2, window.innerHeight / 2, s.shrineCleaned ? 'ศาลเจ้าป่า' : 'ศาลเก่า', '⛩️', [
    { id: 'wai', label: 'ไหว้ขอทาง', icon: '🙏', disabled: false, run: waiShrine },
    { id: 'clean', label: 'ทำความสะอาด', icon: '🧹', disabled: s.shrineCleaned ? 'สะอาดแล้ว' : false, run: cleanShrine },
    {
      id: 'offer',
      label: offerItem ? `ถวาย${ITEMS[offerItem].name}` : 'ถวายของ',
      icon: '🌸',
      disabled: !s.shrineCleaned ? 'ทำความสะอาดศาลก่อน' : offeredToday ? 'วันนี้ถวายแล้ว' : !offerItem ? 'ต้องมีดอกบัว ข้าวเหนียว กล้วย มะม่วง หรือไข่' : false,
      run: () => offerItem && offerShrine(offerItem),
    },
    {
      id: 'wish',
      label: 'ขอพรเจ้าป่า',
      icon: '✨',
      disabled: s.amulet ? 'ได้รับเครื่องรางแล้ว' : (s.offers ?? 0) < 3 ? `ถวายของให้ครบ 3 วันก่อน (${s.offers ?? 0}/3)` : !night ? 'กลับมาตอนกลางคืน (หลัง 1 ทุ่ม)' : false,
      run: () => ready && night && grantAmulet(),
    },
  ])
}

function waiShrine() {
  const g = useGame.getState()
  g.doGesture('wai', 2200)
  const s = fs()
  if (s.lastWaiDay !== today()) {
    setFs({ lastWaiDay: today() })
    g.changeStats({ fun: 4 })
    toast('🙏 ไหว้ขอทางเจ้าป่า', isNight() ? 'ลมเย็นพัดผ่าน ใบไทรไหวเบา ๆ เหมือนมีใครรับรู้' : 'ใจสงบขึ้น · คนเฒ่าคนแก่ว่าเข้าป่าต้องบอกกล่าวก่อนเสมอ', 'info')
  } else toast('🙏 ไหว้ศาลเจ้าป่า', undefined, 'info')
}

function cleanShrine() {
  const g = useGame.getState()
  g.doGesture('offer', 2600)
  setFs({ shrineCleaned: true })
  g.changeStats({ thirst: -1, hunger: -0.6, fun: 3 })
  toast('🧹 ทำความสะอาดศาลเก่า', 'กวาดใบไม้ ปัดหยากไย่ ตั้งศาลให้ตรง ผูกผ้าแพรใหม่ — ศาลดูมีชีวิตขึ้นมาอีกครั้ง', 'success')
  g.saveNow('event')
}

function offerShrine(item: ItemId) {
  const g = useGame.getState()
  if (!g.save || countOf(item) <= 0) return
  const inv = { ...g.save.inventory }
  inv[item] = (inv[item] ?? 0) - 1
  if ((inv[item] ?? 0) <= 0) delete inv[item]
  useGame.setState({ save: { ...g.save, inventory: inv }, dirty: true })
  const offers = (fs().offers ?? 0) + 1
  setFs({ offers, lastOfferDay: today() })
  g.doGesture('offer', 2400)
  // พรเล็ก ๆ (สุ่ม)
  const r = Math.random()
  let body = ''
  if (r < 0.4) {
    g.changeStats({ health: 15, fun: 6 })
    body = 'รู้สึกตัวเบา สดชื่น (สุขภาพ +15)'
  } else if (r < 0.75) {
    const n = addItem('herb_wild', 2)
    body = n ? 'ลมพัดใบสมุนไพรมากองตรงหน้าศาล (สมุนไพรป่า +2)' : 'ใบไม้ร่วงพรูลงมารอบศาล'
  } else if (r < 0.93) {
    const n = addItem('mushroom_wild', 2)
    body = n ? 'โคนต้นไทรมีเห็ดป่าโผล่ขึ้นมา (เห็ดป่า +2)' : 'ใบไม้ร่วงพรูลงมารอบศาล'
  } else {
    const n = addItem('pearl', 1)
    body = n ? 'มีเม็ดอะไรใส ๆ ตกอยู่ในถาดถวาย… ไข่มุก!' : 'ได้ยินเสียงกระดิ่งลมแว่ว ๆ'
  }
  toast(`🌸 ถวาย${ITEMS[item].name}ที่ศาลเจ้าป่า (${Math.min(offers, 3)}/3)`, body + (offers === 3 && !fs().amulet ? ' · มีบางอย่างรออยู่… ลองกลับมาตอนกลางคืน' : ''), 'success')
  g.saveNow('event')
}

function grantAmulet() {
  const g = useGame.getState()
  if (addItem('amulet_forest', 1) === 0) return toast('กระเป๋าเต็ม', 'เว้นช่องว่างก่อนนะ', 'warn')
  setFs({ amulet: true })
  forestFlags.thornsOpen = true
  g.doGesture('wai', 3000)
  useForest.setState({ wisps: performance.now() })
  toast('🧿 เจ้าป่ามอบเครื่องรางให้', 'แสงสีเขียวลอยวนรอบศาลแล้วรวมเป็นเครื่องรางในมือ… ได้ยินเสียงพุ่มหนามหลังศาลแหวกออก', 'discover')
  g.saveNow('event')
}
