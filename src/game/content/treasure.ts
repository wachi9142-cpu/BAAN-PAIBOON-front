// หีบสมบัติ 5 แบบ — ข้อมูลล้วน (ตำแหน่งเป็นแบบสมมุติ ไม่อิงแผนที่จริงของหมู่บ้าน)
import type { ItemId } from './items'
import type { Vec2 } from './village'

export type ChestKind = 'wood' | 'iron' | 'magic' | 'ancient' | 'secret'

export interface Loot {
  item?: ItemId
  coins?: [number, number]
  qty?: [number, number]
  chance?: number
}

export interface ChestKindDef {
  name: string
  note: string
  /** เปิดแล้วมีของใหม่อีกครั้งหลังกี่วันในเกม (ไม่มี = เปิดได้ครั้งเดียว) */
  refillDays?: number
  /** ต้องมีไอเทมนี้ (ใช้หมดเมื่อเปิด) */
  needs?: ItemId
  loot: Loot[]
}

export const CHEST_KINDS: Record<ChestKind, ChestKindDef> = {
  wood: {
    name: 'หีบไม้',
    note: 'ของรางวัลทั่วไป',
    refillDays: 3,
    loot: [
      { coins: [10, 30] },
      { item: 'branch', qty: [2, 4] },
      { item: 'vine', qty: [1, 3], chance: 0.6 },
      { item: 'seed_chili', qty: [2, 3], chance: 0.4 },
      { item: 'seed_tomato', qty: [2, 3], chance: 0.3 },
      { item: 'feed', qty: [2, 4], chance: 0.4 },
    ],
  },
  iron: {
    name: 'หีบเหล็ก',
    note: 'ของรางวัลหายาก',
    refillDays: 5,
    loot: [
      { coins: [50, 100] },
      { item: 'plank', qty: [2, 4] },
      { item: 'hardwood', qty: [1, 2], chance: 0.6 },
      { item: 'seed_pumpkin', qty: [2, 3], chance: 0.5 },
      { item: 'axe2', qty: [1, 1], chance: 0.12 },
    ],
  },
  magic: {
    name: 'หีบเวทมนตร์',
    note: 'ของพิเศษ',
    refillDays: 7,
    loot: [
      { coins: [80, 150] },
      { item: 'treat', qty: [2, 4] },
      { item: 'sapling', qty: [2, 3] },
      { item: 'wand', qty: [1, 1], chance: 0.35 },
      { item: 'hardwood', qty: [1, 2], chance: 0.5 },
    ],
  },
  ancient: {
    name: 'หีบโบราณ',
    note: 'ต้องใช้กุญแจโบราณ (ซ่อนอยู่ในหีบลับ)',
    needs: 'oldkey',
    loot: [{ coins: [250, 350] }, { item: 'hardwood', qty: [3, 4] }, { item: 'wand', qty: [1, 1] }, { item: 'axe2', qty: [1, 1], chance: 0.5 }],
  },
  secret: {
    name: 'หีบลับ',
    note: 'ซ่อนตามป่าและพื้นที่ที่ต้องสำรวจ',
    loot: [{ coins: [60, 120] }, { item: 'oldkey', qty: [1, 1] }, { item: 'hardwood', qty: [1, 2] }, { item: 'sapling', qty: [1, 2], chance: 0.6 }],
  },
}

export interface ChestSpot {
  id: string
  kind: ChestKind
  pos: Vec2
  /** หันหน้าหีบ (เรเดียน) */
  rot: number
}

export const CHEST_SPOTS: ChestSpot[] = [
  { id: 'wood-1', kind: 'wood', pos: [-4, 22], rot: 0.4 },
  { id: 'wood-2', kind: 'wood', pos: [26, 10], rot: -0.6 },
  { id: 'wood-3', kind: 'wood', pos: [-26, -10], rot: 1.2 },
  { id: 'iron-1', kind: 'iron', pos: [52, -36], rot: -1.1 },
  { id: 'iron-2', kind: 'iron', pos: [-58, 10], rot: 0.9 },
  { id: 'magic-1', kind: 'magic', pos: [-24, -50], rot: 0.2 },
  { id: 'ancient-1', kind: 'ancient', pos: [66, 26], rot: -1.6 },
  { id: 'secret-1', kind: 'secret', pos: [-76, 70], rot: 2.4 },
  { id: 'secret-2', kind: 'secret', pos: [74, -72], rot: -2.2 },
]
