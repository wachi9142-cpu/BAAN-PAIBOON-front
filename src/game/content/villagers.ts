// ชาวบ้านบรรยากาศ (ยังไม่มีบทพูด/อาชีพ) — อ้างอิงภาพ "วันทำความสะอาดหมู่บ้าน" ใน docs/ref/
// พิกัดเหมือน village.ts: x = ตะวันออก(+), z = ใต้(+)
// ตำแหน่งตอนนี้เป็นชั่วคราว รอผู้สร้างเล่าแผนที่จริง
import type { Appearance } from './appearance'
import type { PetChoice } from './pets'
import type { Vec2 } from './village'

export type VillagerBehavior =
  /** เดินไปกลับตามจุด แวะยืนพักเป็นระยะ */
  | { kind: 'walk'; path: Vec2[]; pauseSec?: number }
  /** ยืนทำงานกับที่ ค่อย ๆ ขยับไปตามแนวถนน */
  | { kind: 'work'; action: 'sweep' | 'hoe' | 'inspect'; pos: Vec2; heading: number; drift?: number }
  /** ยืนเฉย ๆ / ยืนคุย หันหน้าเข้าหาจุด */
  | { kind: 'stand'; pos: Vec2; faceTo: Vec2; talk?: boolean }

export interface Villager {
  id: string
  appearance: Appearance
  behavior: VillagerBehavior
  tool?: 'broom' | 'hoe' | 'pole' | 'toolbelt'
}

// ชุดชาวบ้าน: เสื้อแขนยาวสีฟ้า ม่วง แดง ขาว · กางเกงสีเข้ม · หมวกปีกกว้าง
const woman = (top: string, extra: Partial<Appearance> = {}): Appearance => ({
  gender: 'female',
  skin: 'tan',
  hairStyle: 'bun',
  hairColor: 'black',
  outfit: 'farmer',
  topColor: top,
  bottomColor: '#2e2c2a',
  shoes: 'sandals',
  accessory: 'strawhat',
  ...extra,
})
const man = (top: string, extra: Partial<Appearance> = {}): Appearance => ({
  gender: 'male',
  skin: 'dark',
  hairStyle: 'short',
  hairColor: 'black',
  outfit: 'farmer',
  topColor: top,
  bottomColor: '#33302c',
  shoes: 'boots',
  ...extra,
})

export const VILLAGERS: Villager[] = [
  // คนเดินไปมาตามถนน
  { id: 'walk-1', appearance: woman('#6f8fc4'), behavior: { kind: 'walk', path: [[-60, 1.2], [20, 1.2]], pauseSec: 4 } },
  {
    id: 'walk-2',
    appearance: man('#f1ede4', { age: 'elder', hairColor: 'gray', shoes: 'sandals' }),
    behavior: { kind: 'walk', path: [[40, -1.4], [-25, -1.4]], pauseSec: 6 },
  },
  {
    id: 'walk-3',
    appearance: woman('#8a5aa8', { age: 'child', hairStyle: 'long', accessory: 'none', outfit: 'tshirt' }),
    behavior: { kind: 'walk', path: [[0.8, -55], [0.8, -4], [12, -1]], pauseSec: 3 },
  },
  {
    id: 'walk-4',
    appearance: man('#b8463e', { accessory: 'cap', shoes: 'sneakers' }),
    behavior: { kind: 'walk', path: [[30.8, 50], [30.8, 2], [-10, 2]], pauseSec: 5 },
  },

  // แม่ค้าหาบเร่: หาบผลไม้เดินขายรอบหมู่บ้าน
  {
    id: 'hawker',
    appearance: woman('#4f74b8', { hairStyle: 'curly', hairColor: 'darkbrown', outfit: 'phathung', bottomColor: '#a8805a', sarongPattern: 'stripes', sarongAccent: 'cream', accessory: 'widehat', accessoryColor: 'cream' }),
    tool: 'pole',
    behavior: { kind: 'walk', path: [[-30, -2.2], [10, -2.2], [10, -18], [28, -18], [28, 0]], pauseSec: 8 },
  },

  // ยืนกวาดถนน (ไม้กวาดด้ามยาว)
  { id: 'sweep-1', appearance: woman('#9fc2e6'), tool: 'broom', behavior: { kind: 'work', action: 'sweep', pos: [-20, 2.2], heading: Math.PI / 2, drift: 2.5 } },
  {
    id: 'sweep-2',
    appearance: woman('#c0504a', { age: 'elder', hairColor: 'silver' }),
    tool: 'broom',
    behavior: { kind: 'work', action: 'sweep', pos: [-16, -2.2], heading: -Math.PI / 2, drift: 2 },
  },
  { id: 'sweep-3', appearance: woman('#7a5aa0'), tool: 'broom', behavior: { kind: 'work', action: 'sweep', pos: [-1.6, -30], heading: 0, drift: 2 } },

  // ถางหญ้าริมรั้ว (จอบด้ามยาว)
  { id: 'hoe-1', appearance: man('#4f6f9a'), tool: 'hoe', behavior: { kind: 'work', action: 'hoe', pos: [12, 3.2], heading: 0, drift: 1.5 } },
  { id: 'hoe-2', appearance: man('#e8e4da', { accessory: 'strawhat' }), tool: 'hoe', behavior: { kind: 'work', action: 'hoe', pos: [16, 3.4], heading: 0, drift: 1.5 } },

  // จับกลุ่มยืนคุยกัน
  { id: 'chat-1', appearance: woman('#5d86c0'), behavior: { kind: 'stand', pos: [-6, 3.4], faceTo: [-5, 4.4], talk: true } },
  {
    id: 'chat-2',
    appearance: woman('#d8d4cc', { age: 'elder', hairColor: 'gray' }),
    behavior: { kind: 'stand', pos: [-4, 3.6], faceTo: [-5, 4.4], talk: true },
  },
  { id: 'chat-3', appearance: man('#8a4a8a', { accessory: 'strawhat', shoes: 'sandals' }), behavior: { kind: 'stand', pos: [-5, 5.6], faceTo: [-5, 4.4] } },
]

/** หมาในหมู่บ้าน เดินปนกับคน */
export const VILLAGE_DOGS: { id: string; pet: PetChoice; path: Vec2[] }[] = [
  {
    id: 'dog-1',
    pet: { species: 'dog', name: '', color: '#d8a868', pattern: 'plain', patternColor: '#f2e6cf' },
    path: [[-24, 0.4], [-2, 0.4], [-2, 2.6], [-24, 2.6]],
  },
  {
    id: 'dog-2',
    pet: { species: 'dog', name: '', color: '#2a2622', pattern: 'blacktan', patternColor: '#b8743a' },
    path: [[8, -1], [24, -1], [24, 1.6]],
  },
]

/** ชื่อและบุคลิกของชาวบ้านแต่ละคน (คุยด้วยได้ทุกคน) */
export interface NpcInfo {
  name: string
  /** แม่ค้า = ซื้อของได้ */
  vendor?: boolean
  greet: string[]
}
export const NPC_INFO: Record<string, NpcInfo> = {
  rong: {
    name: 'น้ารงณ์ (น้าชายคนกลาง · ช่างซ่อมมอเตอร์ไซค์)',
    greet: [
      'อ้าว ฟ่าง! มือน้าเปื้อนน้ำมันเครื่องนะ อย่าเพิ่งจับ เดี๋ยวเสื้อเลอะ',
      'คันสีแดงนี่โซ่ยืด ต้องตั้งโซ่ใหม่ คันดำหัวเทียนเสื่อม สตาร์ทติดยาก',
      'ขี่รถต้องใส่หมวกกันน็อกทุกครั้งนะหลาน น้าเห็นอุบัติเหตุมาเยอะแล้ว',
      'หยิบประแจเบอร์ 12 ในตู้แดงให้น้าหน่อยสิ ... ขอบใจจ้ะ',
      'ซ่อมเสร็จคันนี้แล้วน้าจะไปนั่งพักกินน้ำที่แคร่หน้าบ้านหน่อย',
      'ฟังเสียงเครื่องสิ เครื่องดีต้องเดินเรียบ ๆ ไม่สะดุด',
    ],
  },
  yot: {
    name: 'น้ายศ (น้าชายคนเล็ก · วิศวกรไฟฟ้า)',
    greet: [
      'อ้าว หลานฟ่าง! น้ากำลังเดินตรวจเสาไฟหน้าบ้านอยู่ เดี๋ยวไปกินข้าวด้วยกันนะ',
      'เสาต้นนี้ต้องดูรอยร้าวกับสายที่หย่อนเกินไป ฝนตกบ่อยต้องระวังไฟรั่ว',
      'อย่าเข้าใกล้สายไฟที่ขาดห้อยลงมานะลูก ถ้าเห็นให้รีบบอกน้า',
      'สายดำ ๆ ข้างล่างเป็นสายโทรศัพท์กับอินเทอร์เน็ต ส่วนสายบนสุดคือสายไฟฟ้าแรงสูง',
      'โตขึ้นอยากเป็นวิศวกรแบบน้าไหม? ต้องตั้งใจเรียนเลขกับวิทย์นะ',
    ],
  },
  hawker: { name: 'ป้าบัว แม่ค้าหาบเร่', vendor: true, greet: ['มาจ้า ๆ ผลไม้สด ๆ จากสวนเลยลูก', 'วันนี้มะม่วงหวานนะ ลองชิมไหม', 'เดินมาทั้งวัน เมื่อยขาแต่ใจยังสู้'] },
  'walk-1': { name: 'น้าแก้ว', greet: ['ไปไหนมาจ๊ะ', 'อากาศดีนะวันนี้'] },
  'walk-2': { name: 'ตาทอง', greet: ['หลานเอ๊ย กินข้าวหรือยัง', 'สมัยตายังหนุ่ม ทุ่งนาตรงนี้กว้างสุดตา'] },
  'walk-3': { name: 'น้องหอม', greet: ['เล่นด้วยกันไหม!', 'หนูจะไปโรงเรียนนะ'] },
  'walk-4': { name: 'พี่ดำ', greet: ['ว่าไงเพื่อน', 'เย็นนี้ไปหาปลากันไหม'] },
  'sweep-1': { name: 'ป้าศรีนวล', greet: ['วันนี้วันทำความสะอาดหมู่บ้านจ้ะ', 'ช่วยกันคนละไม้คนละมือ หมู่บ้านก็สะอาด'] },
  'sweep-2': { name: 'ยายมา', greet: ['ยายกวาดทุกเช้า ใจมันสบาย', 'ระวังลื่นนะลูก'] },
  'sweep-3': { name: 'แม่ปราณี', greet: ['ไปวัดมาหรือยัง วันนี้วันพระ', 'ใบไม้ร่วงเยอะจริงหน้านี้'] },
  'hoe-1': { name: 'ลุงมี', greet: ['หญ้าขึ้นไวเหลือเกิน', 'แดดแรง อย่าลืมใส่หมวกนะ'] },
  'hoe-2': { name: 'ลุงเขียว', greet: ['บ่อปลาลุงอยู่ทางโน้น แวะไปเที่ยวได้', 'ถางเสร็จแล้วจะไปทอดแห'] },
  'chat-1': { name: 'น้าจันทร์', greet: ['คุยเรื่องงานบุญอยู่จ้ะ', 'มาฟังด้วยกันสิ'] },
  'chat-2': { name: 'ยายเพ็ญ', greet: ['หลานใครเนี่ย หน้าตาน่ารัก', 'ยายทอผ้าไหมมาสี่สิบปีแล้วนะ'] },
  'chat-3': { name: 'ลุงสมบัติ', greet: ['ว่าไงหลาน', 'ปีนี้ฝนดี ข้าวน่าจะงาม'] },
}
