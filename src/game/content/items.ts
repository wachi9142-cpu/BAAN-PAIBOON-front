// ไอเทม กระเป๋า สูตรคราฟ และร้านค้า — ข้อมูลล้วน เพิ่มของใหม่ได้ที่นี่
// หลักราคา: ของที่ซื้อจากร้าน "แพงกว่า" การหาวัตถุดิบมาคราฟเอง

export type ItemId =
  | 'branch'
  | 'stone'
  | 'vine'
  | 'log'
  | 'plank'
  | 'axe'
  | 'hammer'
  | 'machete'
  | 'saw'
  | 'feed'
  | 'treat'
  | 'wand'

export type ItemKind = 'material' | 'tool'

export interface ItemDef {
  id: ItemId
  name: string
  icon: string
  kind: ItemKind
  /** วางซ้อนในช่องเดียวได้กี่ชิ้น */
  stack: number
  /** ราคาที่ร้านรับซื้อ (บาท/ชิ้น) */
  sell: number
  note: string
}

export const ITEMS: Record<ItemId, ItemDef> = {
  branch: { id: 'branch', name: 'กิ่งไม้', icon: '🥢', kind: 'material', stack: 30, sell: 2, note: 'เก็บจากต้นไม้ด้วยมือเปล่า' },
  stone: { id: 'stone', name: 'ก้อนหิน', icon: '🪨', kind: 'material', stack: 30, sell: 2, note: 'เก็บจากกองหินริมทาง' },
  vine: { id: 'vine', name: 'เชือกกล้วย', icon: '🌿', kind: 'material', stack: 30, sell: 3, note: 'ลอกจากต้นกล้วย ใช้มัดและสาน' },
  log: { id: 'log', name: 'ไม้ท่อน', icon: '🪵', kind: 'material', stack: 20, sell: 10, note: 'ใช้ขวานตัดต้นไม้' },
  plank: { id: 'plank', name: 'ไม้กระดาน', icon: '🟫', kind: 'material', stack: 20, sell: 15, note: 'เลื่อยจากไม้ท่อน' },
  axe: { id: 'axe', name: 'ขวาน', icon: '🪓', kind: 'tool', stack: 1, sell: 40, note: 'ตัดต้นไม้ได้ไม้ท่อน' },
  hammer: { id: 'hammer', name: 'ค้อน', icon: '🔨', kind: 'tool', stack: 1, sell: 30, note: 'ใช้ทำเครื่องมือที่ซับซ้อนขึ้น (เลื่อย)' },
  machete: { id: 'machete', name: 'มีดพร้า', icon: '🗡️', kind: 'tool', stack: 1, sell: 45, note: 'ถางหญ้า ลอกเชือกกล้วยได้มากขึ้น' },
  saw: { id: 'saw', name: 'เลื่อย', icon: '🪚', kind: 'tool', stack: 1, sell: 55, note: 'เลื่อยไม้ท่อนเป็นไม้กระดาน' },
  feed: { id: 'feed', name: 'อาหารสัตว์', icon: '🌾', kind: 'material', stack: 30, sell: 2, note: 'ข้าวเปลือกและรำ ล่อสัตว์เลี้ยงทั่วไปให้เชื่องเร็วขึ้น' },
  treat: { id: 'treat', name: 'กล้วยสุก', icon: '🍌', kind: 'material', stack: 20, sell: 5, note: 'ผลไม้หวาน ล่อสัตว์ป่าระดับปานกลาง-ยาก (บางทีได้จากต้นกล้วย)' },
  wand: { id: 'wand', name: 'ไม้คฑา', icon: '🪄', kind: 'tool', stack: 1, sell: 120, note: 'ยิงลำแสงนุ่ม ๆ ดึงสัตว์เข้ามาหา ใช้กับสัตว์ระดับปานกลางขึ้นไป' },
}

// ---------- กระเป๋า (ยิ่งระดับสูง ยิ่งมีช่องมาก) ----------
export interface BagLevel {
  level: number
  name: string
  icon: string
  slots: number
}
export const BAG_LEVELS: BagLevel[] = [
  { level: 0, name: 'ถุงผ้าใบเล็ก', icon: '👝', slots: 12 },
  { level: 1, name: 'ย่ามผ้าฝ้าย', icon: '🎒', slots: 20 },
  { level: 2, name: 'กระเป๋าสานไม้ไผ่', icon: '🧺', slots: 28 },
  { level: 3, name: 'เป้ใบใหญ่', icon: '🎒', slots: 40 },
]
export const bagSlots = (level: number) => BAG_LEVELS[Math.min(level, BAG_LEVELS.length - 1)].slots

// ---------- สูตรคราฟ ----------
export type Cost = Partial<Record<ItemId, number>>
export interface Recipe {
  id: string
  name: string
  icon: string
  needs: Cost
  /** ต้องมีเครื่องมือนี้ในกระเป๋า (ไม่ถูกใช้หมด) */
  tool?: ItemId
  /** ได้ไอเทม หรือ อัปเกรดกระเป๋าเป็นระดับนี้ */
  gives: { item: ItemId; qty: number } | { bagLevel: number }
}

export const RECIPES: Recipe[] = [
  { id: 'axe', name: 'ขวาน', icon: '🪓', needs: { branch: 3, stone: 2, vine: 1 }, gives: { item: 'axe', qty: 1 } },
  { id: 'hammer', name: 'ค้อน', icon: '🔨', needs: { branch: 2, stone: 3 }, gives: { item: 'hammer', qty: 1 } },
  { id: 'machete', name: 'มีดพร้า', icon: '🗡️', needs: { log: 1, stone: 3, vine: 1 }, gives: { item: 'machete', qty: 1 } },
  { id: 'saw', name: 'เลื่อย', icon: '🪚', needs: { log: 2, stone: 4 }, tool: 'hammer', gives: { item: 'saw', qty: 1 } },
  { id: 'plank', name: 'ไม้กระดาน ×2', icon: '🟫', needs: { log: 1 }, tool: 'saw', gives: { item: 'plank', qty: 2 } },
  { id: 'feed', name: 'อาหารสัตว์ ×4', icon: '🌾', needs: { branch: 1, vine: 1 }, gives: { item: 'feed', qty: 4 } },
  { id: 'wand', name: 'ไม้คฑา', icon: '🪄', needs: { plank: 2, stone: 5, vine: 3 }, tool: 'hammer', gives: { item: 'wand', qty: 1 } },
  { id: 'bag1', name: 'ย่ามผ้าฝ้าย (20 ช่อง)', icon: '🎒', needs: { vine: 6, branch: 2 }, gives: { bagLevel: 1 } },
  { id: 'bag2', name: 'กระเป๋าสานไม้ไผ่ (28 ช่อง)', icon: '🧺', needs: { vine: 10, plank: 4 }, tool: 'machete', gives: { bagLevel: 2 } },
  { id: 'bag3', name: 'เป้ใบใหญ่ (40 ช่อง)', icon: '🎒', needs: { vine: 15, plank: 6, log: 4 }, tool: 'hammer', gives: { bagLevel: 3 } },
]

// ---------- ร้านค้าป้าศรี ----------
export interface ShopEntry {
  id: string
  name: string
  icon: string
  price: number
  gives: { item: ItemId; qty: number } | { bagLevel: number }
}
export const SHOP: ShopEntry[] = [
  { id: 'axe', name: 'ขวาน', icon: '🪓', price: 120, gives: { item: 'axe', qty: 1 } },
  { id: 'hammer', name: 'ค้อน', icon: '🔨', price: 100, gives: { item: 'hammer', qty: 1 } },
  { id: 'machete', name: 'มีดพร้า', icon: '🗡️', price: 150, gives: { item: 'machete', qty: 1 } },
  { id: 'saw', name: 'เลื่อย', icon: '🪚', price: 180, gives: { item: 'saw', qty: 1 } },
  { id: 'feed', name: 'อาหารสัตว์ ×4', icon: '🌾', price: 25, gives: { item: 'feed', qty: 4 } },
  { id: 'treat3', name: 'กล้วยสุก ×3', icon: '🍌', price: 45, gives: { item: 'treat', qty: 3 } },
  { id: 'wand', name: 'ไม้คฑา', icon: '🪄', price: 500, gives: { item: 'wand', qty: 1 } },
  { id: 'vine5', name: 'เชือกกล้วย ×5', icon: '🌿', price: 30, gives: { item: 'vine', qty: 5 } },
  { id: 'plank4', name: 'ไม้กระดาน ×4', icon: '🟫', price: 90, gives: { item: 'plank', qty: 4 } },
  { id: 'bag1', name: 'ย่ามผ้าฝ้าย (20 ช่อง)', icon: '🎒', price: 150, gives: { bagLevel: 1 } },
  { id: 'bag2', name: 'กระเป๋าสานไม้ไผ่ (28 ช่อง)', icon: '🧺', price: 350, gives: { bagLevel: 2 } },
  { id: 'bag3', name: 'เป้ใบใหญ่ (40 ช่อง)', icon: '🎒', price: 800, gives: { bagLevel: 3 } },
]

/** จำนวนช่องที่ใช้ (ของซ้อนได้ตาม stack) */
export function slotsUsed(inv: Partial<Record<ItemId, number>>) {
  let n = 0
  for (const [id, q] of Object.entries(inv)) if (q && q > 0) n += Math.ceil(q / ITEMS[id as ItemId].stack)
  return n
}

/** แตกเป็นช่อง ๆ สำหรับแสดงในกระเป๋า */
export function toSlots(inv: Partial<Record<ItemId, number>>) {
  const out: { id: ItemId; qty: number }[] = []
  for (const id of Object.keys(ITEMS) as ItemId[]) {
    let q = inv[id] ?? 0
    const st = ITEMS[id].stack
    while (q > 0) {
      out.push({ id, qty: Math.min(st, q) })
      q -= st
    }
  }
  return out
}
