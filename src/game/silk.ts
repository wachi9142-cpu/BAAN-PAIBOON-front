/**
 * เส้นทางไหม — ทำได้จริงตั้งแต่ใบหม่อนจนสวมผ้าไหมที่ทอเอง (ดู game/content/silk.ts)
 * เก็บในเซฟ: save.silk
 */
import { create } from 'zustand'
import { useGame } from './store'
import { useClock } from './clock'
import { nowMinute } from './garden'
import { addItem, countOf } from './inventory'
import { editables } from './layoutEdit'
import { ITEMS, type ItemId } from './content/items'
import { LEAVES_PER_MEAL, MULBERRY, REEL_COST, SILK_SHIRT_COLOR, SILK_STATIONS, SILK_TIME, TRAYS, WEAVE_COST, WEAVE_PATTERNS, type SilkStation, type V2 } from './content/silk'
import type { SarongPatternId } from './content/sarong'
import { openActionWheel } from '../ui/ActionWheel'
import { startCooking, startLoom } from './audio/houseSfx'

export interface SilkTray {
  /** เวลาที่วางไข่ (นาทีในเกม) */
  placed: number
  meals: number
  lastMeal: number
}
export interface SilkSave {
  trays?: (SilkTray | null)[]
  /** ต้นหม่อน → วันที่เก็บใบล่าสุด */
  picked?: Record<number, number>
  /** วันล่าสุดที่รับไข่ไหมฟรีจากศูนย์ */
  eggDay?: number
  /** ลายของผ้าไหมผืนล่าสุดที่ทอ */
  pattern?: SarongPatternId
  /** เคยมาที่ศูนย์แล้ว (สอนขั้นตอนครั้งแรก) */
  intro?: boolean
}

export type TrayStage = 'empty' | 'eggs' | 'hungry' | 'eating' | 'spinning' | 'cocoon'

export const useSilk = create<{ near: string | null; busy: SilkStation | null; busyUntil: number }>(() => ({ near: null, busy: null, busyUntil: 0 }))

const ss = (): SilkSave => useGame.getState().save?.silk ?? {}
function setSs(patch: Partial<SilkSave>) {
  const g = useGame.getState()
  if (!g.save) return
  useGame.setState({ save: { ...g.save, silk: { ...ss(), ...patch } }, dirty: true })
}
const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' | 'discover' = 'info') => useGame.getState().toast({ title, body, tone })
const today = () => useClock.getState().day
const trays = (): (SilkTray | null)[] => {
  const t = ss().trays ?? []
  return Array.from({ length: TRAYS }, (_, i) => t[i] ?? null)
}

export function trayStage(t: SilkTray | null, now = nowMinute()): TrayStage {
  if (!t) return 'empty'
  if (now < t.placed + SILK_TIME.hatch) return 'eggs'
  if (t.meals < SILK_TIME.meals) {
    const ready = t.meals === 0 ? t.placed + SILK_TIME.hatch : t.lastMeal + SILK_TIME.hungry
    return now >= ready ? 'hungry' : 'eating'
  }
  return now < t.lastMeal + SILK_TIME.spin ? 'spinning' : 'cocoon'
}
export const trayList = () => trays().map((t) => ({ t, stage: trayStage(t) }))

const left = (until: number) => {
  const m = Math.max(0, Math.ceil(until - nowMinute()))
  return m >= 60 ? `~${Math.round(m / 60)} ชม.` : `${m} นาที`
}
export function trayText(t: SilkTray | null) {
  const st = trayStage(t)
  if (!t || st === 'empty') return 'ว่าง'
  if (st === 'eggs') return `ไข่ไหม (ฟักใน ${left(t.placed + SILK_TIME.hatch)})`
  if (st === 'hungry') return `หนอนไหมหิว! (กินแล้ว ${t.meals}/${SILK_TIME.meals})`
  if (st === 'eating') return `หนอนไหมกินอิ่ม (${t.meals}/${SILK_TIME.meals} · หิวใน ${left(t.lastMeal + SILK_TIME.hungry)})`
  if (st === 'spinning') return `ชักใยทำรัง (เสร็จใน ${left(t.lastMeal + SILK_TIME.spin)})`
  return 'รังไหมพร้อมเก็บ!'
}

/** ตำแหน่งจริงของสถานี (ผู้สร้างลากย้ายแล้วใช้ตำแหน่งใหม่) */
export function stationPos(k: SilkStation): V2 {
  const e = editables.get(SILK_STATIONS[k].id)
  return e ? [e.wx, e.wz] : SILK_STATIONS[k].pos
}

/** เรียกทุก ~0.2 วิ จากฉาก */
export function silkTick(x: number, z: number) {
  // ไกลศูนย์ = ไม่ต้องหาอะไร
  if (Math.hypot(x + 48, z + 18) > 22) {
    if (useSilk.getState().near) useSilk.setState({ near: null })
    return
  }
  if (!ss().intro && Math.hypot(x + 48, z + 10) < 7) {
    setSs({ intro: true })
    toast(
      '🐛 ศูนย์ฝึกอาชีพ: เส้นทางไหม',
      '1) เก็บใบหม่อนที่สวนหลังศูนย์ · 2) รับไข่ไหมที่ชั้นกระด้ง แล้ววางลงกระด้ง · 3) ให้ใบหม่อนตอนหนอนหิว 4 มื้อ · 4) เก็บรังไหม ไปต้มสาวที่เตา · 5) ทอผ้าที่กี่ · 6) ตัดเย็บแล้วสวมใส่',
      'discover',
    )
  }
  let near: string | null = null
  let bd = 2.8
  for (const k of Object.keys(SILK_STATIONS) as SilkStation[]) {
    const [sx, sz] = stationPos(k)
    const d = Math.hypot(sx - x, sz - z)
    if (d < bd) {
      bd = d
      near = k
    }
  }
  if (!near)
    MULBERRY.forEach(([mx, mz], i) => {
      const d = Math.hypot(mx - x, mz - z)
      if (d < Math.min(bd, 1.9)) {
        bd = d
        near = 'mulberry:' + i
      }
    })
  if (useSilk.getState().near !== near) useSilk.setState({ near })
}

export const leafReady = (i: number) => (ss().picked?.[i] ?? -1) !== today()

export function silkHint(near: string): string {
  const busy = useSilk.getState().busy
  if (near.startsWith('mulberry:')) return leafReady(+near.slice(9)) ? '🌿 เก็บใบหม่อน' : 'ต้นนี้เก็บใบไปแล้ววันนี้ (พรุ่งนี้แตกใบใหม่)'
  if (busy === near) return near === 'reel' ? '♨️ กำลังต้มรังไหม สาวเส้นไหม…' : near === 'loom' ? '🧵 กำลังทอผ้า…' : '✂️ กำลังตัดเย็บ…'
  if (near === 'rack') return '🐛 ชั้นกระด้งเลี้ยงไหม — ' + trays().map((t, i) => `${i + 1}: ${trayText(t)}`).join(' · ')
  if (near === 'reel') return `♨️ เตาสาวไหม (รังไหม ${REEL_COST.cocoon} + กิ่งไม้ ${REEL_COST.branch}) · มีรังไหม ${countOf('cocoon')}`
  if (near === 'loom') return `🧵 กี่ทอผ้า (เส้นไหม ${WEAVE_COST}) · มีเส้นไหม ${countOf('silk_thread')}`
  if (near === 'sew') return `✂️ โต๊ะตัดเย็บ · มีผ้าไหม ${countOf('silk_cloth')} ผืน`
  return ''
}

function take(id: ItemId, n: number) {
  const g = useGame.getState()
  if (!g.save) return
  const inv = { ...g.save.inventory }
  inv[id] = (inv[id] ?? 0) - n
  if ((inv[id] ?? 0) <= 0) delete inv[id]
  useGame.setState({ save: { ...g.save, inventory: inv }, dirty: true })
}
const center = (): [number, number] => [window.innerWidth / 2, window.innerHeight / 2]

export function activateSilk(near: string) {
  const g = useGame.getState()
  if (!g.save) return
  if (useSilk.getState().busy) return toast('รอให้เสร็จก่อนนะ', undefined, 'info')
  if (near.startsWith('mulberry:')) return pickLeaves(+near.slice(9))
  if (near === 'rack') return rackWheel()
  if (near === 'reel') return reel()
  if (near === 'loom') return loomWheel()
  if (near === 'sew') return sewWheel()
}

function pickLeaves(i: number) {
  if (!leafReady(i)) return toast('ต้นนี้เก็บใบไปแล้ววันนี้', 'พรุ่งนี้แตกใบใหม่ · ลองต้นอื่นในสวน', 'info')
  const n = addItem('mulberry_leaf', 3)
  if (!n) return toast('กระเป๋าเต็ม', undefined, 'warn')
  setSs({ picked: { ...(ss().picked ?? {}), [i]: today() } })
  useGame.getState().doGesture('offer', 1000)
  useGame.getState().changeStats({ thirst: -0.3 })
  toast(`🌿 ใบหม่อน +${n}`, 'อาหารของหนอนไหม (มื้อละ 2 ใบต่อกระด้ง)', 'success')
}

function rackWheel() {
  const list = trayList()
  const empty = list.findIndex((x) => x.stage === 'empty')
  const hungry = list.filter((x) => x.stage === 'hungry').length
  const ready = list.filter((x) => x.stage === 'cocoon').length
  const eggToday = ss().eggDay === today()
  openActionWheel(...center(), 'ชั้นกระด้งเลี้ยงไหม', '🐛', [
    { id: 'egg', label: 'รับไข่ไหม (ฟรีวันละแผ่น)', icon: '🥚', disabled: eggToday ? 'วันนี้รับแล้ว พรุ่งนี้มาใหม่' : false, run: takeEggs },
    { id: 'place', label: 'วางไข่ไหมลงกระด้ง', icon: '🧺', disabled: countOf('silk_eggs') <= 0 ? 'ต้องมีไข่ไหมก่อน' : empty < 0 ? 'กระด้งเต็มทั้ง 3 ใบ' : false, run: () => placeEggs(empty) },
    {
      id: 'feed',
      label: hungry ? `ให้ใบหม่อน (${hungry} กระด้ง)` : 'ให้ใบหม่อน',
      icon: '🌿',
      disabled: !hungry ? 'ยังไม่มีกระด้งไหนหิว' : countOf('mulberry_leaf') < LEAVES_PER_MEAL ? `ต้องมีใบหม่อน ${LEAVES_PER_MEAL} ใบต่อกระด้ง` : false,
      run: feed,
    },
    { id: 'harvest', label: ready ? `เก็บรังไหม (${ready} กระด้ง)` : 'เก็บรังไหม', icon: '🟡', disabled: !ready ? 'ยังไม่มีรังไหมพร้อมเก็บ' : false, run: harvest },
  ])
}

function takeEggs() {
  if (!addItem('silk_eggs', 1)) return toast('กระเป๋าเต็ม', undefined, 'warn')
  setSs({ eggDay: today() })
  toast('🥚 ได้ไข่ไหม 1 แผ่น', 'แม่ครูที่ศูนย์ฝากมา · วางลงกระด้งว่าง แล้วรอฟักราว 2 ชั่วโมงในเกม', 'success')
}

function placeEggs(i: number) {
  if (i < 0 || countOf('silk_eggs') <= 0) return
  take('silk_eggs', 1)
  const t = trays()
  t[i] = { placed: nowMinute(), meals: 0, lastMeal: 0 }
  setSs({ trays: t })
  useGame.getState().doGesture('offer', 1200)
  toast(`🧺 วางไข่ไหมลงกระด้งที่ ${i + 1}`, 'อีกราว 2 ชั่วโมง (ในเกม) จะฟักเป็นหนอนไหม · เตรียมใบหม่อนไว้ด้วยนะ', 'success')
  useGame.getState().saveNow('event')
}

function feed() {
  const now = nowMinute()
  const t = trays()
  let fed = 0
  t.forEach((x, i) => {
    if (trayStage(x, now) !== 'hungry' || countOf('mulberry_leaf') < LEAVES_PER_MEAL) return
    take('mulberry_leaf', LEAVES_PER_MEAL)
    t[i] = { ...x!, meals: x!.meals + 1, lastMeal: now }
    fed++
  })
  if (!fed) return
  setSs({ trays: t })
  useGame.getState().doGesture('offer', 1400)
  const done = t.filter((x) => x && x.meals >= SILK_TIME.meals && x.lastMeal === now).length
  toast(`🌿 ให้ใบหม่อน ${fed} กระด้ง`, done ? 'หนอนไหมโตเต็มที่แล้ว เริ่มชักใยทำรัง (~2 ชั่วโมงในเกม)' : 'ได้ยินเสียงหนอนไหมกินใบหม่อนกรอบ ๆ · อีกราว 1 ชั่วโมงจะหิวอีก', 'success')
  useGame.getState().saveNow('event')
}

function harvest() {
  const t = trays()
  let got = 0
  t.forEach((x, i) => {
    if (trayStage(x) !== 'cocoon') return
    got += addItem('cocoon', 4 + Math.round(Math.random() * 2))
    t[i] = null
  })
  if (!got) return toast('กระเป๋าเต็ม', undefined, 'warn')
  setSs({ trays: t })
  useGame.getState().doGesture('offer', 1400)
  toast(`🟡 เก็บรังไหม +${got}`, 'รังไหมสีเหลืองทองของบ้านไพบูลย์ · เอาไปต้มสาวเป็นเส้นไหมที่เตาสาวไหม', 'success')
  useGame.getState().saveNow('event')
}

function busyFor(k: SilkStation, ms: number, done: () => void, onEnd?: () => void) {
  useSilk.setState({ busy: k, busyUntil: performance.now() + ms })
  setTimeout(() => {
    onEnd?.()
    useSilk.setState({ busy: null, busyUntil: 0 })
    done()
  }, ms)
}

function reel() {
  if (countOf('cocoon') < REEL_COST.cocoon) return toast(`ต้องมีรังไหม ${REEL_COST.cocoon} รัง`, `ตอนนี้มี ${countOf('cocoon')} · เลี้ยงไหมที่ชั้นกระด้งแล้วเก็บรังไหม`, 'warn')
  if (countOf('branch') < REEL_COST.branch) return toast('ต้องมีกิ่งไม้ 1 กิ่งไว้ก่อไฟ', 'ทุบต้นไม้เก็บกิ่งไม้ได้', 'warn')
  take('cocoon', REEL_COST.cocoon)
  take('branch', REEL_COST.branch)
  const g = useGame.getState()
  g.doGesture('cook', 6000)
  const snd = startCooking()
  snd.boil()
  toast('♨️ ต้มรังไหมในหม้อดิน', 'ใช้ไม้คีบดึงปลายเส้นไหม แล้วหมุนกงสาวเส้นไหมขึ้นมา…', 'info')
  busyFor('reel', 6000, () => {
    const a = addItem('silk_thread', 2)
    const b = addItem('pupa', 5)
    g.changeStats({ thirst: -1.5, hunger: -0.8 })
    toast(`🧵 ได้เส้นไหม +${a}`, `ได้ดักแด้ไหม +${b} ด้วย (ทอดกินอร่อย โปรตีนสูง) · เอาเส้นไหมไปทอที่กี่ทอผ้า`, 'success')
    useGame.getState().saveNow('event')
  }, () => snd.stop())
}

function loomWheel() {
  const enough = countOf('silk_thread') >= WEAVE_COST
  openActionWheel(
    ...center(),
    'กี่ทอผ้า — เลือกลาย',
    '🧵',
    WEAVE_PATTERNS.map((p) => ({
      id: p.id,
      label: p.label,
      icon: p.icon,
      disabled: enough ? false : `ต้องมีเส้นไหม ${WEAVE_COST} (มี ${countOf('silk_thread')})`,
      run: () => weave(p.id),
    })),
  )
}

function weave(pattern: SarongPatternId) {
  if (countOf('silk_thread') < WEAVE_COST) return
  take('silk_thread', WEAVE_COST)
  const g = useGame.getState()
  g.doGesture('sit', 7000)
  const snd = startLoom()
  const label = WEAVE_PATTERNS.find((p) => p.id === pattern)?.label ?? ''
  toast(`🧵 ทอผ้าไหม${label}`, 'เหยียบไม้เหยียบ พุ่งกระสวย กระทบฟืม ปึก ปึก…', 'info')
  busyFor('loom', 7000, () => {
    if (!addItem('silk_cloth', 1)) return toast('กระเป๋าเต็ม — ผ้าวางไว้ที่กี่ก่อนนะ', undefined, 'warn')
    setSs({ pattern })
    g.changeStats({ fun: 5, hunger: -1 })
    toast(`🎀 ได้ผ้าไหม${label} 1 ผืน`, 'เอาไปตัดเย็บเป็นผ้าถุงหรือเสื้อที่โต๊ะตัดเย็บ', 'success')
    useGame.getState().saveNow('event')
  }, () => snd())
}

function sewWheel() {
  const cloth = countOf('silk_cloth')
  const app = useGame.getState().save!.player.appearance
  openActionWheel(...center(), 'โต๊ะตัดเย็บ', '✂️', [
    { id: 'sarong', label: 'ตัดผ้าถุงไหม (ผ้า 1)', icon: '👘', disabled: cloth < 1 ? 'ต้องมีผ้าไหม 1 ผืน' : false, run: () => sew('sarong_silk', 1) },
    { id: 'shirt', label: 'ตัดเสื้อไหม (ผ้า 2)', icon: '👚', disabled: cloth < 2 ? 'ต้องมีผ้าไหม 2 ผืน' : false, run: () => sew('shirt_silk', 2) },
    { id: 'wear-sarong', label: 'นุ่งผ้าถุงไหม', icon: '✨', disabled: countOf('sarong_silk') < 1 ? 'ต้องตัดผ้าถุงไหมก่อน' : false, run: wearSarong },
    { id: 'wear-shirt', label: app.topColor === SILK_SHIRT_COLOR ? 'ถอดเสื้อไหม' : 'สวมเสื้อไหม', icon: '👕', disabled: countOf('shirt_silk') < 1 ? 'ต้องตัดเสื้อไหมก่อน' : false, run: wearShirt },
  ])
}

function sew(id: 'sarong_silk' | 'shirt_silk', cloth: number) {
  if (countOf('silk_cloth') < cloth) return
  take('silk_cloth', cloth)
  useGame.getState().doGesture('offer', 4000)
  busyFor('sew', 4000, () => {
    if (!addItem(id, 1)) return toast('กระเป๋าเต็ม', undefined, 'warn')
    toast(`✂️ ตัดเย็บ${ITEMS[id].name}เสร็จ`, 'กดสวมใส่ได้ที่โต๊ะตัดเย็บ · หรือเก็บไว้ขาย/ให้คนที่รัก', 'success')
    useGame.getState().saveNow('event')
  })
}

function wearSarong() {
  const g = useGame.getState()
  const app = g.save!.player.appearance
  const pattern = ss().pattern ?? 'lukkaew'
  const outfit = app.outfit === 'phasin' || app.outfit === 'phathung' ? app.outfit : 'phasin'
  g.updateAppearance({ ...app, outfit, sarongPattern: pattern, bottomColor: '#6a2a7a' })
  g.doGesture('offer', 1200)
  toast('✨ นุ่งผ้าถุงไหมที่ทอเอง', `ลาย${WEAVE_PATTERNS.find((p) => p.id === pattern)?.label.replace('ลาย', '') ?? 'ลูกแก้ว'} · เปลี่ยนชุดกลับได้ที่เมนูแต่งตัว`, 'success')
}

function wearShirt() {
  const g = useGame.getState()
  const app = g.save!.player.appearance
  const on = app.topColor === SILK_SHIRT_COLOR
  g.updateAppearance({ ...app, topColor: on ? 'outfit' : SILK_SHIRT_COLOR })
  toast(on ? 'ถอดเสื้อไหมแล้ว' : '👕 สวมเสื้อไหมสีทอง', on ? undefined : 'ไหมเส้นทองธรรมชาติของบ้านไพบูลย์', 'success')
}
