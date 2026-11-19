/**
 * ระบบอานสัตว์ (ผู้สร้าง 19 พ.ย. 2569) — อุปกรณ์ของผู้เล่นและสัตว์ (แยกจากประเภทสัตว์และความผูกพัน)
 * - สัตว์ที่ขี่ได้ต้องมีอานที่ออกแบบสำหรับชนิดนั้นเท่านั้น · ใช้แทนกันไม่ได้ (อานม้าขี่มังกรไม่ได้)
 * - สร้างที่หน้า "สร้าง → อาน" ในสมุด (ประดิษฐ์ได้ทุกที่ ไม่ต้องกลับบ้าน) · สร้างแล้วบันทึกในรายการของผู้เล่น (save.saddles)
 * - ช่องสีแดง = ยังไม่ได้สร้าง · สีเขียว = พร้อมใช้งาน · กดช่องสีเขียวเพื่อดูว่าใช้กับสัตว์ชนิดไหน
 */
import { useGame } from './store'
import { canAfford } from './inventory'
import { ITEMS, type Cost, type ItemId } from './content/items'

export type SaddleRarity = 'normal' | 'special' | 'rare'
export interface SaddleDef {
  id: string
  name: string
  /** ชนิดสัตว์ที่ใช้ได้ (ตรงกับ PetSpecies หรือสัตว์ที่จะเพิ่มในอนาคต) */
  species: string
  speciesLabel: string
  icon: string
  rarity: SaddleRarity
  group: 'land' | 'water'
  stat: string
  cost: Cost
  coins: number
  /** สัตว์ชนิดนี้ยังไม่มีในเกม (สร้างอานเก็บไว้ได้ก่อน) */
  future?: boolean
  note: string
}

export const SADDLES: SaddleDef[] = [
  { id: 'saddle_buffalo', name: 'อานควาย', species: 'buffalo', speciesLabel: 'ควาย', icon: '🐃', rarity: 'normal', group: 'land', stat: 'ทนทาน +10 · นั่งสบาย', cost: { plank: 2, vine: 4, leaf: 6 }, coins: 0, note: 'อานผ้าห่มสานเชือกกล้วย คาดรอบท้องควาย นั่งได้นาน ๆ ตอนออกทุ่ง' },
  { id: 'saddle_cow', name: 'อานวัว', species: 'cow', speciesLabel: 'วัว', icon: '🐄', rarity: 'normal', group: 'land', stat: 'ความเร็ว +5', cost: { plank: 2, vine: 3 }, coins: 0, note: 'อานไม้บุผ้าเตี้ย ๆ ขนาดพอดีหลังวัว' },
  { id: 'saddle_horse', name: 'อานม้า', species: 'horse', speciesLabel: 'ม้า', icon: '🐎', rarity: 'normal', group: 'land', stat: 'ความเร็ว +12', cost: { plank: 3, vine: 4, hardwood: 1 }, coins: 120, future: true, note: 'อานหนังมีโกลน ใช้กับม้าเท่านั้น (ม้าจะมาในเกมเร็ว ๆ นี้)' },
  { id: 'saddle_bigrabbit', name: 'อานกระต่ายยักษ์', species: 'giant-rabbit', speciesLabel: 'กระต่ายยักษ์', icon: '🐇', rarity: 'rare', group: 'land', stat: 'กระโดดสูง +8', cost: { plank: 2, vine: 6, pearl: 1 }, coins: 250, future: true, note: 'อานนุ่มบุนวม สำหรับกระต่ายพิเศษที่ตัวใหญ่กว่าคน (เร็ว ๆ นี้)' },
  { id: 'saddle_waterdragon', name: 'อานมังกรน้ำ', species: 'water-dragon', speciesLabel: 'มังกรน้ำ', icon: '🐉', rarity: 'special', group: 'water', stat: 'ดำน้ำได้ · ความเร็วในน้ำ +15', cost: { hardwood: 2, vine: 6, sapphire: 1, pearl: 2 }, coins: 500, note: 'อานกันน้ำ มีห่วงจับและเข็มขัดรัดตัว ขี่ดำลงใต้น้ำได้ · มังกรน้ำอาศัยในสระน้ำลึกในถ้ำ' },
  { id: 'saddle_naga', name: 'อานพญานาค', species: 'naga', speciesLabel: 'พญานาค', icon: '🐍', rarity: 'special', group: 'water', stat: 'เคลื่อนที่ในน้ำคล่อง +20', cost: { hardwood: 2, vine: 8, ruby: 1, gold_nugget: 2 }, coins: 800, note: 'อานลายทองสำหรับพญานาค ขี่แหวกว่ายในน้ำได้คล่อง · พญานาคอาศัยในสระน้ำลึกในถ้ำ' },
]

export const RARITY_INFO: Record<SaddleRarity, { label: string; color: string }> = {
  normal: { label: 'ปกติ', color: '#5aa84a' },
  special: { label: 'พิเศษ', color: '#d8483a' },
  rare: { label: 'หายาก', color: '#e0b030' },
}

export const ownedSaddles = () => useGame.getState().save?.saddles ?? []
export const hasSaddle = (id: string) => ownedSaddles().includes(id)
/** อานที่ใช้กับสัตว์ชนิดนี้ได้ (มีแล้ว) */
export const saddleFor = (species: string) => SADDLES.find((s) => s.species === species && hasSaddle(s.id)) ?? null
export const saddleDefFor = (species: string) => SADDLES.find((s) => s.species === species) ?? null

export function costText(s: SaddleDef) {
  const parts = Object.entries(s.cost).map(([id, q]) => `${ITEMS[id as ItemId].name} ${q}`)
  if (s.coins) parts.push(`${s.coins} บาท`)
  return parts.join(' · ')
}
export const canBuildSaddle = (s: SaddleDef) => !hasSaddle(s.id) && canAfford(s.cost) && (useGame.getState().save?.coins ?? 0) >= s.coins

export function buildSaddle(id: string) {
  const g = useGame.getState()
  const s = SADDLES.find((x) => x.id === id)
  if (!g.save || !s) return
  if (hasSaddle(id)) return g.toast({ title: `มี${s.name}แล้ว`, tone: 'info' })
  if (!canBuildSaddle(s)) return g.toast({ title: 'วัตถุดิบไม่พอ', body: costText(s), tone: 'warn' })
  const inv = { ...g.save.inventory }
  for (const [k, q] of Object.entries(s.cost)) {
    const key = k as ItemId
    inv[key] = (inv[key] ?? 0) - (q ?? 0)
    if ((inv[key] ?? 0) <= 0) delete inv[key]
  }
  useGame.setState({ save: { ...g.save, inventory: inv, saddles: [...(g.save.saddles ?? []), id] }, dirty: true })
  if (s.coins) g.addCoins(-s.coins, `สร้าง${s.name}`)
  g.toast({ title: `🛠️ สร้าง${s.name}สำเร็จ`, body: s.future ? `เก็บไว้ในรายการอาน — ใช้ได้เมื่อมี${s.speciesLabel}` : `ตอนนี้ขี่${s.speciesLabel}ได้แล้ว${s.group === 'water' ? ' (ไปที่สระน้ำในถ้ำ เดินเข้าใกล้แล้วกด E)' : ' (เรียกออกมาเดินตาม แล้วกด F)'}`, tone: 'success' })
  g.saveNow('event')
}
