// สัตว์ที่เก็บได้ในเกม + ระดับความยาก — ข้อมูลล้วน
// แนวเกม: ไม่ปาบอล — ใช้ "เข้าใกล้ / ล่อด้วยอาหาร / ไม้คฑาลำแสง" ตามระดับความยาก
import type { PetChoice, PetSpecies } from './pets'
import type { Vec2 } from './village'

export type Tier = 'easy' | 'medium' | 'hard' | 'legend'

export const TIERS: Record<Tier, { label: string; color: string; how: string }> = {
  easy: { label: 'ง่าย', color: '#3fd06a', how: '💚 มือเปล่า: เดินเข้าไปใกล้ ๆ แล้วกด E (มีอาหารสัตว์จะเชื่องเร็วขึ้น)' },
  medium: { label: 'ปานกลาง', color: '#ffcc2a', how: '💛 สวิงจับสัตว์ (หรือล่อด้วยกล้วยสุก โอกาสน้อยกว่า) · เดินเบา ๆ ถ้าวิ่งเข้าใส่จะหนี' },
  hard: { label: 'ยาก', color: '#ff4a4a', how: '❤️ ป้อนกล้วยให้เชื่องก่อน แล้ววางกรงดักใส่กล้วยเป็นเหยื่อ · หนีง่าย' },
  legend: { label: 'พิเศษ / หายากมาก', color: '#b46bff', how: '💜 สัตว์วิเศษ/ในตำนาน ใช้สายสิญจน์หรือเครื่องราง และต้องทำภารกิจก่อนถึงจะพบ (เร็ว ๆ นี้)' },
}

/** ความยากของแต่ละชนิด (ทุกชนิดเก็บได้) */
export const SPECIES_TIER: Record<PetSpecies, Tier> = {
  dog: 'easy',
  cat: 'easy',
  chicken: 'easy',
  duck: 'easy',
  pig: 'easy',
  goat: 'easy',
  cow: 'easy',
  buffalo: 'easy',
  sheep: 'medium',
  goose: 'medium',
  rabbit: 'medium',
  bird: 'medium',
  squirrel: 'medium',
  mouse: 'medium',
  monkey: 'hard',
  turtle: 'hard',
}

/** โอกาสสำเร็จ และโอกาสหนีเมื่อพลาด */
export const CATCH_RULES: Record<Exclude<Tier, 'legend'>, { chance: number; fleeOnFail: number }> = {
  easy: { chance: 1, fleeOnFail: 0 },
  medium: { chance: 0.75, fleeOnFail: 0.4 },
  hard: { chance: 0.5, fleeOnFail: 0.7 },
}

/** สัตว์ในตำนาน (ยังพบไม่ได้ — ต้องมีระบบภารกิจก่อน) */
export const LEGENDS: { id: string; name: string; hint: string }[] = [
  { id: 'white-buffalo', name: 'ควายเผือกเจ้าทุ่ง', hint: 'ว่ากันว่าออกมาเล็มหญ้าในคืนเดือนเพ็ญ' },
  { id: 'golden-silkworm', name: 'หนอนไหมทอง', hint: 'ผู้เฒ่าเล่าว่าอยู่ในสวนหม่อนที่เก่าแก่ที่สุด' },
]

export interface WildSpawn {
  id: string
  pet: PetChoice
  /** จุดกลางที่สัตว์เดินเล่นวนอยู่ */
  home: Vec2
  /** รัศมีที่เดินเล่น */
  roam: number
}

const p = (species: PetSpecies, color: string, patternColor: string, extra: Partial<PetChoice> = {}): PetChoice => ({
  species,
  name: '',
  color,
  pattern: 'plain',
  patternColor,
  ...extra,
})

// ง่าย = ในหมู่บ้าน · ปานกลาง = ริมหมู่บ้าน/ทุ่งนา · ยาก = มุมไกลสุดของแผนที่ (รอพื้นที่ป่าและเขา)
export const WILD_SPAWNS: WildSpawn[] = [
  { id: 'w-chicken-1', pet: p('chicken', '#f3efe6', '#b8682e'), home: [10, 18], roam: 4 },
  { id: 'w-chicken-2', pet: p('chicken', '#b8682e', '#2b2a2c'), home: [-12, 9], roam: 4 },
  { id: 'w-duck-1', pet: p('duck', '#f6f1e2', '#6b8a3a'), home: [-64, 30], roam: 5 },
  { id: 'w-cat-1', pet: p('cat', '#2b2a2c', '#f3ead8', { pattern: 'tuxedo' }), home: [-22, 6], roam: 5 },
  { id: 'w-dog-1', pet: p('dog', '#c8935a', '#f3ead8'), home: [20, 6], roam: 6 },
  { id: 'w-pig-1', pet: p('pig', '#f2b0b8', '#e8909c'), home: [-44, -26.5], roam: 4 },
  { id: 'w-goat-1', pet: p('goat', '#f2ede4', '#b8a890'), home: [40, -30], roam: 5 },
  { id: 'w-rabbit-1', pet: p('rabbit', '#fbf3ee', '#f4b8c4'), home: [-72, 44], roam: 6 },
  { id: 'w-rabbit-2', pet: p('rabbit', '#8a6a4a', '#f4b8c4'), home: [62, 40], roam: 6 },
  { id: 'w-bird-1', pet: p('bird', '#4aa3d8', '#f2d34a'), home: [60, -44], roam: 6 },
  { id: 'w-squirrel-1', pet: p('squirrel', '#9a6236', '#f0dcc0'), home: [-84, -30], roam: 5 },
  { id: 'w-goose-1', pet: p('goose', '#f6f3ec', '#f6f3ec'), home: [-46, 49], roam: 5 },
  { id: 'w-mouse-1', pet: p('mouse', '#a8a4a0', '#f2b8c0'), home: [25, -40], roam: 4 },
  { id: 'w-sheep-1', pet: p('sheep', '#f6f2e8', '#3a3330'), home: [60, 60], roam: 5 },
  { id: 'w-monkey-1', pet: p('monkey', '#7a5634', '#d9b48a'), home: [-82, 64], roam: 5 },
  { id: 'w-turtle-1', pet: p('turtle', '#6f8f4a', '#3f5a2a'), home: [78, 78], roam: 3 },
]
