/**
 * เส้นทางไหม (ผู้สร้าง 19 พ.ย. 2569) — ศูนย์ฝึกอาชีพบ้านไพบูลย์ "นครแห่งไหม"
 * สวนหม่อน → เก็บใบหม่อน → กระด้งเลี้ยงไหม (ไข่ → หนอน → กินใบหม่อน 4 มื้อ → ทำรัง) → เก็บรังไหม
 * → หม้อสาวไหม (ต้มรังไหม ได้เส้นไหม + ดักแด้) → กี่ทอผ้า (เลือกลาย) → โต๊ะตัดเย็บ (ผ้าถุง/เสื้อไหม) → สวมใส่ได้จริง
 * ข้อมูลล้วน (ตำแหน่ง + เวลา)
 */
import type { SarongPatternId } from './sarong'

export type V2 = [number, number]

/** สถานี (พิกัดโลก หน้าศูนย์ฝึกอาชีพ (-48, -18) ฝั่งถนนใหญ่) — ผู้สร้างลากย้ายได้ (Editable) */
export const SILK_STATIONS = {
  rack: { id: 'silk-rack', name: 'ชั้นกระด้งเลี้ยงไหม', pos: [-41.8, -10.6] as V2, rot: 0 },
  reel: { id: 'silk-reel', name: 'เตาสาวไหม', pos: [-47.8, -10.2] as V2, rot: 0 },
  loom: { id: 'silk-loom', name: 'กี่ทอผ้า', pos: [-51.6, -10.6] as V2, rot: 0 },
  sew: { id: 'silk-sew', name: 'โต๊ะตัดเย็บ', pos: [-55.2, -10.4] as V2, rot: 0 },
}
export type SilkStation = keyof typeof SILK_STATIONS

/** สวนหม่อนหลังศูนย์ฝึกอาชีพ (2 แถว · เว้นกลางให้ต้นมะม่วงเดิม) */
export const MULBERRY: V2[] = [
  ...[-57, -54, -46.5, -43.5, -40.5].map((x) => [x, -25] as V2),
  ...[-57, -54, -46.5, -43.5, -40.5].map((x) => [x, -28.6] as V2),
]

/** เวลาในเกม (นาที) — 1 วันในเกม ≈ 96 นาทีจริง */
export const SILK_TIME = {
  /** ไข่ฟักเป็นหนอน */
  hatch: 120,
  /** หิวอีกครั้งหลังกินใบหม่อน */
  hungry: 60,
  /** จำนวนมื้อก่อนชักใยทำรัง */
  meals: 4,
  /** ชักใยจนเป็นรังไหม */
  spin: 120,
}
/** ใบหม่อนต่อมื้อต่อกระด้ง */
export const LEAVES_PER_MEAL = 2
/** สาวไหม: รังไหม 5 + กิ่งไม้ (ฟืน) 1 → เส้นไหม 2 + ดักแด้ 5 */
export const REEL_COST = { cocoon: 5, branch: 1 }
/** ทอผ้า: เส้นไหม 3 → ผ้าไหม 1 ผืน */
export const WEAVE_COST = 3
export const TRAYS = 3

export const WEAVE_PATTERNS: { id: SarongPatternId; label: string; icon: string }[] = [
  { id: 'lukkaew', label: 'ลายลูกแก้ว', icon: '💠' },
  { id: 'mudmee', label: 'มัดหมี่', icon: '🌀' },
  { id: 'khit', label: 'ลายขิด', icon: '🔷' },
  { id: 'jok', label: 'ตีนจก', icon: '🌺' },
]
/** สีเสื้อไหม (สีไหมทองธรรมชาติ) */
export const SILK_SHIRT_COLOR = '#d8b04a'
