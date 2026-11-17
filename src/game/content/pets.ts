// สัตว์เลี้ยงที่ผู้เล่นเลือกพาไปไหนมาไหนได้ — เพิ่มชนิดใหม่ที่นี่ แล้วเพิ่มโมเดลใน src/scenes/models/Pet.tsx

export type PetSpecies =
  | 'dog'
  | 'cat'
  | 'buffalo'
  | 'monkey'
  | 'squirrel'
  | 'rabbit'
  | 'bird'
  | 'chicken'
  | 'duck'
  | 'turtle'

export type PetPattern = 'plain' | 'spots' | 'stripes' | 'patches'

export interface PetSpeciesInfo {
  id: PetSpecies
  label: string
  /** สีตัวเริ่มต้น */
  color: string
  /** สีลายเริ่มต้น */
  patternColor: string
  /** ชื่อเริ่มต้นที่แนะนำ */
  suggestName: string
  /** ระยะเดินตามหลังผู้เล่น (เมตร) */
  followDistance: number
  /** บินได้ (ลอยตามระดับไหล่) */
  flies?: boolean
}

export const PET_SPECIES: PetSpeciesInfo[] = [
  { id: 'dog', label: 'หมา', color: '#c8935a', patternColor: '#f3ead8', suggestName: 'ด่าง', followDistance: 1.6 },
  { id: 'cat', label: 'แมว', color: '#e0a35c', patternColor: '#a8642a', suggestName: 'ส้มจี๊ด', followDistance: 1.4 },
  { id: 'buffalo', label: 'ควาย', color: '#3d3c40', patternColor: '#8a7f78', suggestName: 'ทองแดง', followDistance: 2.6 },
  { id: 'monkey', label: 'ลิง', color: '#7a5634', patternColor: '#d9b48a', suggestName: 'จ๋อ', followDistance: 1.5 },
  { id: 'squirrel', label: 'กระรอก', color: '#9a6236', patternColor: '#f0dcc0', suggestName: 'ทองย้อย', followDistance: 1.2 },
  { id: 'rabbit', label: 'กระต่าย', color: '#f2efe9', patternColor: '#8a6a52', suggestName: 'ปุยฝ้าย', followDistance: 1.3 },
  { id: 'bird', label: 'นก', color: '#4aa3d8', patternColor: '#f2d34a', suggestName: 'เจ้าเขียว', followDistance: 1.2, flies: true },
  { id: 'chicken', label: 'ไก่', color: '#f3efe6', patternColor: '#b8682e', suggestName: 'เจ้าแดง', followDistance: 1.3 },
  { id: 'duck', label: 'เป็ด', color: '#f6f1e2', patternColor: '#6b8a3a', suggestName: 'ก๊าบ ๆ', followDistance: 1.3 },
  { id: 'turtle', label: 'เต่า', color: '#6f8f4a', patternColor: '#3f5a2a', suggestName: 'ช้า ๆ', followDistance: 1.3 },
]

export const PET_PATTERNS: { id: PetPattern; label: string }[] = [
  { id: 'plain', label: 'ไม่มีลาย' },
  { id: 'spots', label: 'ลายจุด' },
  { id: 'stripes', label: 'ลายทาง' },
  { id: 'patches', label: 'ลายด่าง' },
]

/** สีตัวอย่าง (เลือกสีอื่นได้จากวงล้อสี) */
export const PET_COLORS: { id: string; label: string; color: string }[] = [
  { id: 'white', label: 'ขาว', color: '#f3f0ea' },
  { id: 'cream', label: 'ครีม', color: '#e8d2a8' },
  { id: 'orange', label: 'ส้ม', color: '#e0a35c' },
  { id: 'brown', label: 'น้ำตาล', color: '#8a5a34' },
  { id: 'gray', label: 'เทา', color: '#8a8a8e' },
  { id: 'black', label: 'ดำ', color: '#2b2a2c' },
]

export interface PetChoice {
  species: PetSpecies
  name: string
  color: string
  pattern: PetPattern
  patternColor: string
}

export const getSpecies = (id: PetSpecies) => PET_SPECIES.find((s) => s.id === id) ?? PET_SPECIES[0]

export function defaultPet(species: PetSpecies): PetChoice {
  const s = getSpecies(species)
  return { species, name: s.suggestName, color: s.color, pattern: 'plain', patternColor: s.patternColor }
}
