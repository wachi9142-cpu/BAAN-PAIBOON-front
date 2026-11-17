/**
 * กระเป๋า เก็บของ คราฟ ซื้อ-ขาย — ทำงานกับเซฟใน useGame
 * ทุกครั้งที่ของในกระเป๋าเปลี่ยน = เหตุการณ์สำคัญ → บันทึกทันที
 */
import { useGame, type GatherTarget } from './store'
import { bagSlots, ITEMS, slotsUsed, type Cost, type ItemId, type Recipe, type ShopEntry } from './content/items'
import { ROCKS, TREES } from './content/village'

type Inv = Partial<Record<ItemId, number>>

const inv = (): Inv => useGame.getState().save?.inventory ?? {}

function commit(next: Inv, bagLevel?: number) {
  const g = useGame.getState()
  if (!g.save) return
  useGame.setState({ save: { ...g.save, inventory: next, bagLevel: bagLevel ?? g.save.bagLevel }, dirty: true })
  g.saveNow('event')
}

export const countOf = (id: ItemId) => inv()[id] ?? 0
export const hasTool = (id: ItemId) => countOf(id) > 0
export const canAfford = (cost: Cost) => Object.entries(cost).every(([id, q]) => countOf(id as ItemId) >= (q ?? 0))

/** ใส่ของได้กี่ชิ้น (ไม่เกินช่องว่างในกระเป๋า) */
function room(id: ItemId, want: number) {
  const g = useGame.getState().save
  if (!g) return 0
  const cap = bagSlots(g.bagLevel)
  let n = 0
  const cur = { ...g.inventory }
  while (n < want) {
    cur[id] = (cur[id] ?? 0) + 1
    if (slotsUsed(cur) > cap) break
    n++
  }
  return n
}

/** เพิ่มของ คืนจำนวนที่ใส่ได้จริง (กระเป๋าเต็ม = ใส่ไม่ครบ) */
export function addItem(id: ItemId, qty: number) {
  const n = room(id, qty)
  if (n > 0) {
    const next = { ...inv() }
    next[id] = (next[id] ?? 0) + n
    commit(next)
  }
  return n
}

function spend(cost: Cost) {
  const next = { ...inv() }
  for (const [id, q] of Object.entries(cost)) {
    const k = id as ItemId
    next[k] = (next[k] ?? 0) - (q ?? 0)
    if ((next[k] ?? 0) <= 0) delete next[k]
  }
  return next
}

/** อีโมจิในข้อความแจ้งเตือน (ตัวที่ Windows 10 ไม่มีฟอนต์ ให้เว้นไว้) */
const ic = (id: ItemId) => (['🪵', '🪨', '🪚'].includes(ITEMS[id].icon) ? '' : ITEMS[id].icon + ' ')

const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' = 'info') => useGame.getState().toast({ title, body, tone })
const fullBag = () => toast('กระเป๋าเต็มแล้ว', 'ขายของที่ร้านป้าศรี หรือคราฟ/ซื้อกระเป๋าที่ใหญ่ขึ้น', 'warn')

// ---------- คราฟ ----------
export function craft(r: Recipe) {
  const g = useGame.getState().save
  if (!g) return false
  if (r.tool && !hasTool(r.tool)) {
    toast(`ต้องมี${ITEMS[r.tool].name}ก่อน`, 'เครื่องมือนี้ไม่ถูกใช้หมด แค่ต้องมีติดกระเป๋า', 'warn')
    return false
  }
  if (!canAfford(r.needs)) {
    toast('วัตถุดิบไม่พอ', undefined, 'warn')
    return false
  }
  if ('bagLevel' in r.gives) {
    if (g.bagLevel >= r.gives.bagLevel) {
      toast('มีกระเป๋าใบนี้หรือใหญ่กว่าแล้ว', undefined, 'info')
      return false
    }
    commit(spend(r.needs), r.gives.bagLevel)
    toast(`คราฟ${r.name}สำเร็จ`, `กระเป๋ามี ${bagSlots(r.gives.bagLevel)} ช่องแล้ว`, 'success')
    return true
  }
  // เช็กช่องก่อน (หักวัตถุดิบแล้วต้องใส่ของที่ได้ลงได้)
  const after = spend(r.needs)
  const item = r.gives.item
  const test = { ...after, [item]: (after[item] ?? 0) + r.gives.qty }
  if (slotsUsed(test) > bagSlots(g.bagLevel)) {
    fullBag()
    return false
  }
  commit(test)
  toast(`คราฟ${r.name}สำเร็จ`, `${ic(item)}${ITEMS[item].name} +${r.gives.qty}`, 'success')
  return true
}

// ---------- ร้านค้า ----------
export function buy(e: ShopEntry) {
  const g = useGame.getState()
  if (!g.save) return false
  if (g.save.coins < e.price) {
    toast('เงินไม่พอ', `ต้องใช้ ${e.price} บาท`, 'warn')
    return false
  }
  if ('bagLevel' in e.gives) {
    if (g.save.bagLevel >= e.gives.bagLevel) {
      toast('มีกระเป๋าใบนี้หรือใหญ่กว่าแล้ว', undefined, 'info')
      return false
    }
    commit({ ...inv() }, e.gives.bagLevel)
  } else {
    const n = room(e.gives.item, e.gives.qty)
    if (n < e.gives.qty) {
      fullBag()
      return false
    }
    addItem(e.gives.item, e.gives.qty)
  }
  useGame.getState().addCoins(-e.price, `ซื้อ${e.name}`)
  return true
}

export function sell(id: ItemId, qty: number) {
  const have = countOf(id)
  const n = Math.min(qty, have)
  if (n <= 0) return
  commit(spend({ [id]: n }))
  useGame.getState().addCoins(ITEMS[id].sell * n, `ขาย${ITEMS[id].name} ×${n}`)
}

// ---------- เก็บของจากต้นไม้ / กองหิน ----------
/** ต้นไม้/หินแต่ละจุดเก็บได้ 3 ครั้ง แล้วต้องรอให้ฟื้น (เก็บไว้ในหน่วยความจำ ไม่ต้องเซฟ) */
const USES = 3
const REGROW_MS = 90_000
const used = new Map<string, { n: number; since: number }>()

function takeFrom(key: string) {
  const now = Date.now()
  const u = used.get(key)
  if (u && now - u.since > REGROW_MS) used.delete(key)
  const cur = used.get(key) ?? { n: 0, since: now }
  if (cur.n >= USES) return false
  used.set(key, { n: cur.n + 1, since: cur.n === 0 ? now : cur.since })
  return true
}

/** คำแนะนำที่ขึ้นบนจอเมื่อยืนใกล้ */
export function gatherHint(t: GatherTarget) {
  if (t.kind === 'rock') return 'กด E — เก็บก้อนหิน'
  const tree = TREES[t.index]
  if (tree.kind === 'banana') return 'กด E — ลอกเชือกกล้วย'
  return hasTool('axe') ? 'กด E — ตัดต้นไม้ด้วยขวาน' : 'กด E — เก็บกิ่งไม้'
}

export function gather(t: GatherTarget) {
  const key = `${t.kind}:${t.index}`
  if (!takeFrom(key)) {
    toast(t.kind === 'rock' ? 'กองหินนี้หมดแล้ว' : 'ต้นนี้เก็บหมดแล้ว', 'รอสักพักแล้วค่อยกลับมาใหม่ หรือไปหาจุดอื่น', 'info')
    return
  }
  let id: ItemId
  let qty = 1
  if (t.kind === 'rock') id = 'stone'
  else if (TREES[t.index].kind === 'banana') {
    id = 'vine'
    qty = hasTool('machete') ? 2 : 1
  } else if (hasTool('axe')) {
    id = 'log'
  } else {
    id = 'branch'
    qty = 1 + Math.round(Math.random())
  }
  const n = addItem(id, qty)
  if (n === 0) {
    fullBag()
    return
  }
  // ทำงานแล้วเหนื่อย/หิวน้ำนิดหน่อย
  useGame.getState().changeStats({ thirst: -0.6, hunger: -0.3 })
  toast(`${ic(id)}${ITEMS[id].name} +${n}`, undefined, 'success')
}

/** หาเป้าหมายที่เก็บได้ใกล้ที่สุด (ภายใน 2.4 เมตร) */
export function findGatherTarget(x: number, z: number): GatherTarget | null {
  let best: GatherTarget | null = null
  let bd = 2.4
  TREES.forEach((tr, i) => {
    const d = Math.hypot(tr.pos[0] - x, tr.pos[1] - z)
    if (d < bd) {
      bd = d
      best = { kind: 'tree', index: i }
    }
  })
  ROCKS.forEach((r, i) => {
    const d = Math.hypot(r[0] - x, r[1] - z)
    if (d < bd) {
      bd = d
      best = { kind: 'rock', index: i }
    }
  })
  return best
}
