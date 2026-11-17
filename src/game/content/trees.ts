// กติกาการตัดต้นไม้ — ข้อมูลล้วน
// ฟันด้วยขวาน (เร็ว ได้ไม้มาก) หรือทุบ/หักด้วยมือ (ช้า ได้น้อยกว่า และเจ็บตัว — ค่าชีวิตลด)
import type { ItemId } from './items'
import type { TreeKind } from './village'

export type ChopTool = 'hand' | 'axe' | 'axe2'

export interface ChopToolDef {
  id: ChopTool
  name: string
  icon: string
  /** ความแรงต่อครั้ง (ลดความทนทานของต้นไม้) */
  power: number
  /** เวลาเหวี่ยงหนึ่งครั้ง (วินาที) */
  swing: number
  /** ได้ท่อนไม้ (คูณ) */
  yieldK: number
}

export const CHOP_TOOLS: Record<ChopTool, ChopToolDef> = {
  hand: { id: 'hand', name: 'มือเปล่า', icon: '✋', power: 0.5, swing: 0.7, yieldK: 0.5 },
  axe: { id: 'axe', name: 'ขวาน', icon: '🪓', power: 1, swing: 0.6, yieldK: 1 },
  axe2: { id: 'axe2', name: 'ขวานเหล็ก', icon: '🪓', power: 2, swing: 0.45, yieldK: 1.25 },
}

/** ตัดด้วยมือ: ชีวิตลดต่อครั้ง */
export const HAND_HURT: Record<TreeKind, number> = { banana: 0.5, mango: 2, coconut: 2.5 }

interface Drop {
  item: ItemId
  min: number
  max: number
  /** โอกาสได้ (0–1) ค่าเริ่มต้น 1 */
  chance?: number
  /** ได้เฉพาะตอนใช้ขวาน */
  axeOnly?: boolean
  /** จำนวนคูณตามเครื่องมือ (ท่อนไม้) */
  scaled?: boolean
}

export interface TreeRule {
  name: string
  /** ความทนทาน (ครั้งที่ต้องฟันด้วยขวานธรรมดา) */
  hp: number
  drops: Drop[]
  /** ฟันแต่ละครั้งมีโอกาสกิ่งไม้/ใบไม้ร่วง */
  hitDrop: ItemId
}

export const TREE_RULES: Record<TreeKind, TreeRule> = {
  banana: {
    name: 'ต้นกล้วย',
    hp: 2,
    hitDrop: 'leaf',
    drops: [
      { item: 'vine', min: 2, max: 3, scaled: true },
      { item: 'leaf', min: 2, max: 3 },
      { item: 'treat', min: 1, max: 2, chance: 0.7 },
      { item: 'sapling', min: 1, max: 1, chance: 0.6 },
    ],
  },
  mango: {
    name: 'ต้นมะม่วง',
    hp: 6,
    hitDrop: 'branch',
    drops: [
      { item: 'log', min: 3, max: 4, scaled: true },
      { item: 'branch', min: 2, max: 3 },
      { item: 'leaf', min: 2, max: 4 },
      { item: 'hardwood', min: 1, max: 1, chance: 0.35, axeOnly: true },
      { item: 'sapling', min: 1, max: 1, chance: 0.5 },
    ],
  },
  coconut: {
    name: 'ต้นมะพร้าว',
    hp: 8,
    hitDrop: 'leaf',
    drops: [
      { item: 'log', min: 2, max: 3, scaled: true },
      { item: 'leaf', min: 2, max: 3 },
      { item: 'hardwood', min: 1, max: 1, chance: 0.2, axeOnly: true },
      { item: 'sapling', min: 1, max: 1, chance: 0.4 },
    ],
  },
}

/** ตอไม้งอกใหม่เองหลังกี่วันในเกม · ปลูกต้นกล้าแทนแล้วโตเต็มต้นในกี่วัน */
export const REGROW_DAYS = 4
export const SAPLING_DAYS = 1
