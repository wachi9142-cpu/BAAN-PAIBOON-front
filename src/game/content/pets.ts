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

export type PetPattern = 'plain' | 'spots' | 'stripes' | 'patches' | 'calico' | 'colorpoint' | 'tuxedo'

/** ลักษณะเฉพาะของพันธุ์ */
export type PetFur = 'short' | 'long' | 'hairless'
export type PetEars = 'normal' | 'folded'
export type PetTail = 'normal' | 'none'

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
  /** ส่วนที่ใช้สีรอง (แสดงเป็นชื่อช่องเลือกสี) */
  accentParts: string
  /** บินได้ (ลอยตามระดับไหล่) */
  flies?: boolean
}

export const PET_SPECIES: PetSpeciesInfo[] = [
  { id: 'dog', label: 'หมา', color: '#c8935a', patternColor: '#f3ead8', suggestName: 'ด่าง', followDistance: 1.6, accentParts: 'หู' },
  { id: 'cat', label: 'แมว', color: '#e0a35c', patternColor: '#a8642a', suggestName: 'ส้มจี๊ด', followDistance: 1.4, accentParts: 'หูและหาง' },
  { id: 'buffalo', label: 'ควาย', color: '#3d3c40', patternColor: '#8a7f78', suggestName: 'ทองแดง', followDistance: 2.6, accentParts: 'จมูกและหู' },
  { id: 'monkey', label: 'ลิง', color: '#7a5634', patternColor: '#d9b48a', suggestName: 'จ๋อ', followDistance: 1.5, accentParts: 'หน้าและหู' },
  { id: 'squirrel', label: 'กระรอก', color: '#9a6236', patternColor: '#f0dcc0', suggestName: 'ทองย้อย', followDistance: 1.2, accentParts: 'หาง' },
  { id: 'rabbit', label: 'กระต่าย', color: '#f2efe9', patternColor: '#8a6a52', suggestName: 'ปุยฝ้าย', followDistance: 1.3, accentParts: 'หูและหาง' },
  { id: 'bird', label: 'นก', color: '#4aa3d8', patternColor: '#f2d34a', suggestName: 'เจ้าเขียว', followDistance: 1.2, accentParts: 'ปีกและหาง', flies: true },
  { id: 'chicken', label: 'ไก่', color: '#f3efe6', patternColor: '#b8682e', suggestName: 'เจ้าแดง', followDistance: 1.3, accentParts: 'หาง' },
  { id: 'duck', label: 'เป็ด', color: '#f6f1e2', patternColor: '#6b8a3a', suggestName: 'ก๊าบ ๆ', followDistance: 1.3, accentParts: 'หัว' },
  { id: 'turtle', label: 'เต่า', color: '#6f8f4a', patternColor: '#3f5a2a', suggestName: 'ช้า ๆ', followDistance: 1.3, accentParts: 'หัวและขา' },
]

export const PET_PATTERNS: { id: PetPattern; label: string }[] = [
  { id: 'plain', label: 'ไม่มีลาย' },
  { id: 'spots', label: 'ลายจุด' },
  { id: 'stripes', label: 'ลายทาง' },
  { id: 'patches', label: 'ลายด่าง' },
  { id: 'calico', label: 'สามสี' },
  { id: 'colorpoint', label: 'แต้มสี (หน้า หู ขา หาง)' },
  { id: 'tuxedo', label: 'ขาวดำ (อก เท้าขาว)' },
]

/** ลายที่ต้องใช้โมเดลรองรับ (ตอนนี้มีเฉพาะแมว) */
export const BODY_PATTERNS: PetPattern[] = ['colorpoint', 'tuxedo']
export const patternsFor = (species: PetSpecies) =>
  species === 'cat' ? PET_PATTERNS : PET_PATTERNS.filter((p) => !BODY_PATTERNS.includes(p.id))

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
  /** พันธุ์ (ถ้าเลือก) */
  breed?: string
  fur?: PetFur
  ears?: PetEars
  tail?: PetTail
}

export const getSpecies = (id: PetSpecies) => PET_SPECIES.find((s) => s.id === id) ?? PET_SPECIES[0]

export function defaultPet(species: PetSpecies): PetChoice {
  const s = getSpecies(species)
  return { species, name: s.suggestName, color: s.color, pattern: 'plain', patternColor: s.patternColor }
}

// ---------- พันธุ์แมว ----------
export interface Breed {
  id: string
  label: string
  /** ข้อความสั้น ๆ อธิบายลักษณะ */
  note: string
  color: string
  pattern: PetPattern
  patternColor: string
  fur?: PetFur
  ears?: PetEars
  tail?: PetTail
}

export const CAT_BREEDS: Breed[] = [
  // แมวไทย
  { id: 'siamese', label: 'วิเชียรมาศ', note: 'แมวไทย ขาวครีม แต้มสีน้ำตาลเข้ม', color: '#efe3cf', pattern: 'colorpoint', patternColor: '#4a3326' },
  { id: 'korat', label: 'สีสวาด (โคราช)', note: 'แมวไทย ขนสีเทาเงิน', color: '#7d8590', pattern: 'plain', patternColor: '#5f666f' },
  { id: 'khaomanee', label: 'ขาวมณี', note: 'แมวไทย ขาวล้วน', color: '#f6f4ef', pattern: 'plain', patternColor: '#e9dcd6' },
  { id: 'suphalak', label: 'ศุภลักษณ์', note: 'แมวไทย สีน้ำตาลทองแดง', color: '#7a4a2e', pattern: 'plain', patternColor: '#5e3820' },
  { id: 'konja', label: 'โกนจา', note: 'แมวไทย ดำสนิท', color: '#1f1d1f', pattern: 'plain', patternColor: '#141314' },
  { id: 'orange', label: 'แมวส้มลายสลิด', note: 'แมวบ้าน ส้มลายทาง', color: '#e0a35c', pattern: 'stripes', patternColor: '#a8642a' },
  { id: 'calico', label: 'แมวสามสี', note: 'ขาว ส้ม ดำ', color: '#f3efe6', pattern: 'calico', patternColor: '#d98a3a' },
  { id: 'tuxedo', label: 'แมวขาวดำ (ทักซิโด้)', note: 'ดำ อกและเท้าขาว', color: '#1f1d1f', pattern: 'tuxedo', patternColor: '#f6f4ef' },
  // แมวต่างประเทศ
  { id: 'persian', label: 'เปอร์เซีย', note: 'ขนยาวฟู', color: '#f2ede4', pattern: 'plain', patternColor: '#d8cfc2', fur: 'long' },
  { id: 'scottishfold', label: 'สก็อตติชโฟลด์', note: 'หูพับ', color: '#9aa0a8', pattern: 'stripes', patternColor: '#6f747c', ears: 'folded' },
  { id: 'british', label: 'บริติชช็อตแฮร์', note: 'สีเทาฟ้า ตัวกลม', color: '#7f8792', pattern: 'plain', patternColor: '#666d77' },
  { id: 'bengal', label: 'เบงกอล', note: 'ลายจุดเหมือนเสือดาว', color: '#d9a35a', pattern: 'spots', patternColor: '#4a3020' },
  { id: 'mainecoon', label: 'เมนคูน', note: 'ตัวใหญ่ ขนยาว ลายทาง', color: '#8a6a4a', pattern: 'stripes', patternColor: '#4a3524', fur: 'long' },
  { id: 'ragdoll', label: 'แร็กดอลล์', note: 'ขนยาว แต้มสี', color: '#f1eadc', pattern: 'colorpoint', patternColor: '#6a5a52', fur: 'long' },
  { id: 'sphynx', label: 'สฟิงซ์', note: 'ไม่มีขน', color: '#e8b8a6', pattern: 'plain', patternColor: '#d89c8a', fur: 'hairless' },
  { id: 'abyssinian', label: 'อะบิสซิเนียน', note: 'สีส้มอิฐ', color: '#c47a3c', pattern: 'plain', patternColor: '#8a4e22' },
  { id: 'american', label: 'อเมริกันช็อตแฮร์', note: 'เทาเงิน ลายทางดำ', color: '#b9b3a8', pattern: 'stripes', patternColor: '#3a3633' },
  { id: 'manx', label: 'แมงซ์', note: 'ไม่มีหาง', color: '#c8a070', pattern: 'stripes', patternColor: '#8a6440', tail: 'none' },
]

export const breedsFor = (species: PetSpecies): Breed[] => (species === 'cat' ? CAT_BREEDS : [])

export function applyBreed(pet: PetChoice, breed: Breed): PetChoice {
  return {
    ...pet,
    breed: breed.id,
    color: breed.color,
    pattern: breed.pattern,
    patternColor: breed.patternColor,
    fur: breed.fur ?? 'short',
    ears: breed.ears ?? 'normal',
    tail: breed.tail ?? 'normal',
  }
}
