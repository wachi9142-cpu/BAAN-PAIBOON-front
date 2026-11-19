/**
 * คุยกับชาวบ้าน (NPC ทุกตัว) · ทักทาย · คุยเล่น · ขอภารกิจ · ซื้อของจากแม่ค้า
 * ภารกิจเก็บในเซฟ (save.quests) — ของตอบแทนสุ่ม ผู้เล่นไม่รู้ล่วงหน้า
 */
import { create } from 'zustand'
import { useGame, type QuestState } from './store'
import { addItem, countOf } from './inventory'
import { ITEMS, type ItemId } from './content/items'
import { NPC_INFO } from './content/villagers'
import { getSpecies, PET_SPECIES } from './content/pets'
import { ELDER_LEGENDS, LEGENDS } from './content/legends'

interface TalkState {
  /** NPC ที่อยู่ใกล้พอจะคุย */
  near: string | null
  /** NPC ที่กำลังคุยด้วย (หยุดเดิน หันมาหา) */
  talking: string | null
  /** ข้อความล่าสุดของ NPC */
  line: string
  /** ของรางวัลที่เพิ่งได้ (แสดงตอนเปิดกล่อง) */
  reward: string | null
  tab: 'main' | 'shop'
}
export const useTalk = create<TalkState>(() => ({ near: null, talking: null, line: '', reward: null, tab: 'main' }))

/** ตำแหน่งล่าสุดของ NPC แต่ละคน (ฉาก 3D อัปเดต) */
export const npcPos = new Map<string, [number, number]>()

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' | 'discover' = 'info') =>
  useGame.getState().toast({ title, body, tone })

export function startTalk(id: string) {
  const info = NPC_INFO[id]
  if (!info) return
  useTalk.setState({ talking: id, line: pick(info.greet), reward: null, tab: 'main' })
}
export const endTalk = () => {
  useTalk.setState({ talking: null, reward: null })
  useLegend.setState({ id: null, i: 0 })
}

/** ทักทาย: ไหว้ + ได้ความสนุกเล็กน้อย */
export function greet() {
  const id = useTalk.getState().talking
  if (!id) return
  const g = useGame.getState()
  g.doGesture('wai', 1600)
  g.changeStats({ fun: 1 })
  useTalk.setState({ line: pick(['สวัสดีจ้ะ', 'ไหว้พระเถอะลูก ขอให้เจริญ ๆ', 'สวัสดีจ้า น่ารักจริง', 'จ้า ๆ สวัสดี']) })
}

export function chat() {
  const id = useTalk.getState().talking
  if (!id) return
  useTalk.setState({ line: pick(NPC_INFO[id].greet) })
}

// ---------- ภารกิจ ----------
const BRING: { item: ItemId; qty: [number, number]; ask: string }[] = [
  { item: 'branch', qty: [3, 6], ask: 'จะก่อไฟหุงข้าว ช่วยหากิ่งไม้มาให้หน่อยได้ไหม' },
  { item: 'stone', qty: [2, 5], ask: 'อยากได้ก้อนหินมาทำขอบแปลงผัก ช่วยหามาให้หน่อยนะ' },
  { item: 'vine', qty: [2, 4], ask: 'เชือกกล้วยหมด จะเอาไว้มัดผัก ช่วยลอกมาให้หน่อย' },
  { item: 'log', qty: [1, 3], ask: 'จะซ่อมรั้วบ้าน ขาดไม้ท่อนอยู่ ช่วยตัดมาให้หน่อยได้ไหม' },
  { item: 'treat', qty: [1, 2], ask: 'หลานอยากกินกล้วยสุก ช่วยหามาให้หน่อยจ้ะ' },
]

export function activeQuest(npcId: string): QuestState | undefined {
  return useGame.getState().save?.quests.find((q) => q.npcId === npcId)
}

/** ข้อความภารกิจสั้น ๆ */
export function questText(q: QuestState) {
  if (q.kind === 'bring') return `นำ${ITEMS[q.item!].name} ${q.qty} ชิ้น มาให้ (มีอยู่ ${Math.min(countOf(q.item!), q.qty)}/${q.qty})`
  const done = Math.max(0, (useGame.getState().save?.collection.length ?? 0) - (q.startCount ?? 0))
  return `เก็บ${q.species ? getSpecies(q.species).label : 'สัตว์'}มาเลี้ยง 1 ตัว (${Math.min(done, 1)}/1)`
}

export function questReady(q: QuestState) {
  if (q.kind === 'bring') return countOf(q.item!) >= q.qty
  const s = useGame.getState().save
  if (!s) return false
  return s.collection.slice(q.startCount ?? 0).some((c) => !q.species || c.pet.species === q.species)
}

/** ขอภารกิจจาก NPC */
export function askQuest() {
  const id = useTalk.getState().talking
  const g = useGame.getState()
  if (!id || !g.save) return
  const cur = activeQuest(id)
  if (cur) {
    useTalk.setState({ line: `ที่ขอไว้ยังไม่เสร็จนะจ๊ะ — ${questText(cur)}` })
    return
  }
  if (g.save.quests.length >= 3) {
    useTalk.setState({ line: 'ช่วยคนอื่นอยู่หลายงานแล้ว ทำให้เสร็จก่อนแล้วค่อยมาใหม่นะ' })
    return
  }
  let q: QuestState
  if (Math.random() < 0.25) {
    const sp = pick(['chicken', 'duck', 'cat', 'dog', 'pig', 'goat'] as const)
    q = { npcId: id, kind: 'catch', species: sp, qty: 1, startCount: g.save.collection.length }
    useTalk.setState({ line: `อยากได้${getSpecies(sp).label}มาช่วยดูแลบ้าน ช่วยหามาให้หน่อยได้ไหมจ๊ะ (เข้าใกล้แล้วกด E เพื่อเก็บ)` })
  } else {
    const t = pick(BRING)
    const qty = t.qty[0] + Math.floor(Math.random() * (t.qty[1] - t.qty[0] + 1))
    q = { npcId: id, kind: 'bring', item: t.item, qty }
    useTalk.setState({ line: `${t.ask} (${ITEMS[t.item].name} ${qty} ชิ้น) · ทำเสร็จแล้วมีของตอบแทนนะ` })
  }
  useGame.setState({ save: { ...g.save, quests: [...g.save.quests, q] }, dirty: true })
  g.saveNow('event')
  toast(`📜 รับภารกิจจาก${NPC_INFO[id].name}`, questText(q), 'info')
}

/** ส่งภารกิจ → ของตอบแทนแบบสุ่ม (ไม่รู้ล่วงหน้า) */
export function finishQuest() {
  const id = useTalk.getState().talking
  const g = useGame.getState()
  if (!id || !g.save) return
  const q = activeQuest(id)
  if (!q || !questReady(q)) return
  // หักของที่นำมาส่ง
  let save = g.save
  if (q.kind === 'bring') {
    const inv = { ...save.inventory }
    inv[q.item!] = (inv[q.item!] ?? 0) - q.qty
    if ((inv[q.item!] ?? 0) <= 0) delete inv[q.item!]
    save = { ...save, inventory: inv }
  }
  save = { ...save, quests: save.quests.filter((x) => x !== q), questsDone: (save.questsDone ?? 0) + 1 }
  useGame.setState({ save, dirty: true })
  const reward = rollReward()
  useTalk.setState({ line: pick(['ขอบใจมากนะลูก ใจดีจริง ๆ', 'ช่วยได้เยอะเลย ขอบคุณนะจ๊ะ', 'เก่งจริง ๆ เอานี่ไป ของตอบแทน']), reward })
  useGame.getState().changeStats({ fun: 5 })
  useGame.getState().saveNow('event')
}

/** สุ่มของตอบแทน: เงิน / วัตถุดิบ / ของหายาก */
function rollReward(): string {
  const g = useGame.getState()
  const r = Math.random()
  if (r < 0.45) {
    const coins = 15 + Math.floor(Math.random() * 46)
    g.addCoins(coins)
    return `💰 เงิน ${coins} บาท`
  }
  if (r < 0.9) {
    const id = pick<ItemId>(['branch', 'stone', 'vine', 'log', 'plank', 'treat', 'feed'])
    const qty = 2 + Math.floor(Math.random() * 4)
    const n = addItem(id, qty)
    if (n > 0) return `${ITEMS[id].name} ×${n}`
    g.addCoins(30)
    return '💰 เงิน 30 บาท (กระเป๋าเต็ม เลยให้เป็นเงินแทน)'
  }
  if (r < 0.97) {
    const id = pick<ItemId>(['axe', 'hammer', 'machete'])
    if (addItem(id, 1) > 0) return `🎉 ของดี: ${ITEMS[id].name}`
    g.addCoins(80)
    return '💰 เงิน 80 บาท'
  }
  if (addItem('trap_cage', 1) > 0) return '🌟 ของดี: กรงดักสัตว์!'
  g.addCoins(150)
  return '💰 เงิน 150 บาท'
}

// ---------- ของกินจากแม่ค้าหาบเร่ ----------
export interface FoodEntry {
  id: string
  name: string
  icon: string
  price: number
  /** กินเลย: เพิ่มค่าสถานะ */
  eat?: { hunger?: number; thirst?: number; fun?: number }
  /** หรือได้เป็นไอเทม */
  item?: { id: ItemId; qty: number }
}
export const HAWKER_GOODS: FoodEntry[] = [
  { id: 'sticky', name: 'ข้าวเหนียวไก่ปิ้ง', icon: '🍗', price: 20, eat: { hunger: 30, fun: 2 } },
  { id: 'mango', name: 'มะม่วงสุก', icon: '🥭', price: 10, eat: { hunger: 10, fun: 4 } },
  { id: 'coconut', name: 'น้ำมะพร้าว', icon: '🥥', price: 15, eat: { thirst: 35 } },
  { id: 'water', name: 'น้ำเปล่า', icon: '💧', price: 5, eat: { thirst: 20 } },
  { id: 'banana', name: 'กล้วยสุก ×3 (เก็บใส่กระเป๋า)', icon: '🍌', price: 25, item: { id: 'treat', qty: 3 } },
]

export function buyFood(f: FoodEntry) {
  const g = useGame.getState()
  if (!g.save) return
  if (g.save.coins < f.price) {
    toast('เงินไม่พอ', undefined, 'warn')
    return
  }
  if (f.item) {
    if (addItem(f.item.id, f.item.qty) === 0) {
      toast('กระเป๋าเต็มแล้ว', undefined, 'warn')
      return
    }
  }
  g.addCoins(-f.price, `ซื้อ${f.name}`)
  if (f.eat) {
    g.changeStats(f.eat)
    toast(`${f.icon} อร่อยจัง!`, f.eat.thirst ? 'ชื่นใจ หายหิวน้ำ' : 'อิ่มท้อง', 'success')
  }
  useTalk.setState({ line: pick(['ขอบใจจ้ะ มาอุดหนุนอีกนะ', 'หวานฉ่ำเลยลูก', 'กินให้อร่อยนะจ๊ะ']) })
}

export const ALL_SPECIES = PET_SPECIES

// ---------- ตำนานจากผู้เฒ่า ----------

/** ตำนานที่กำลังฟังอยู่ (ท่อนที่เท่าไร) */
export const useLegend = create<{ id: string | null; i: number }>(() => ({ id: null, i: 0 }))
export const hasLegends = (npc: string) => !!ELDER_LEGENDS[npc]

export function tellLegend() {
  const npc = useTalk.getState().talking
  if (!npc || !ELDER_LEGENDS[npc]) return
  const g = useGame.getState()
  const cur = useLegend.getState()
  if (cur.id) {
    const lg = LEGENDS[cur.id]
    const i = cur.i + 1
    if (i < lg.lines.length) {
      useLegend.setState({ i })
      useTalk.setState({ line: lg.lines[i] })
      return
    }
    // ฟังจบ: จดว่าได้ยินแล้ว + บอกทาง
    const heard = g.save?.forest?.legends ?? []
    if (g.save && !heard.includes(lg.id)) {
      useGame.setState({ save: { ...g.save, forest: { ...(g.save.forest ?? {}), legends: [...heard, lg.id] } }, dirty: true })
      toast(`📜 ได้ฟังตำนาน: ${lg.title}`, lg.hint, 'discover')
    }
    useLegend.setState({ id: null, i: 0 })
    useTalk.setState({ line: 'เรื่องเก่า ๆ ก็มีเท่านี้แหละหลาน เข้าป่าอย่าลืมบอกกล่าวเจ้าที่เจ้าทางนะ' })
    return
  }
  const heard = g.save?.forest?.legends ?? []
  const list = ELDER_LEGENDS[npc]
  const id = list.find((l) => !heard.includes(l)) ?? pick(list)
  useLegend.setState({ id, i: 0 })
  useTalk.setState({ line: LEGENDS[id].lines[0] })
}
