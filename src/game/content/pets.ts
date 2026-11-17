// สัตว์เลี้ยงที่ผู้เล่นเลือกพาไปไหนมาไหนได้ — เพิ่มชนิดใหม่ที่นี่ แล้วเพิ่มโมเดลใน src/scenes/models/Pet.tsx

export type PetSpecies =
  | 'dog'
  | 'cat'
  | 'buffalo'
  | 'cow'
  | 'pig'
  | 'goat'
  | 'sheep'
  | 'monkey'
  | 'squirrel'
  | 'mouse'
  | 'rabbit'
  | 'bird'
  | 'chicken'
  | 'duck'
  | 'goose'
  | 'turtle'

export type PetPattern = 'plain' | 'spots' | 'stripes' | 'patches' | 'calico' | 'colorpoint' | 'tuxedo' | 'blacktan'

/** ลักษณะเฉพาะของพันธุ์ */
export type PetFur = 'short' | 'long' | 'hairless'
export type PetEars = 'normal' | 'folded' | 'floppy' | 'erect'
export type PetTail = 'normal' | 'none' | 'curl' | 'rainbow'
export type PetSize = 'small' | 'medium' | 'large'
export type PetSnout = 'normal' | 'short'

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
  { id: 'cow', label: 'วัว', color: '#b5763f', patternColor: '#e8a8a0', suggestName: 'ขาวนวล', followDistance: 2.4, accentParts: 'จมูกและหู' },
  { id: 'pig', label: 'หมู', color: '#f2b0b8', patternColor: '#e8909c', suggestName: 'หมูน้อย', followDistance: 1.5, accentParts: 'จมูกและหู' },
  { id: 'goat', label: 'แพะ', color: '#f2ede4', patternColor: '#b8a890', suggestName: 'เคราขาว', followDistance: 1.7, accentParts: 'หูและเครา' },
  { id: 'sheep', label: 'แกะ', color: '#f6f2e8', patternColor: '#3a3330', suggestName: 'ปุยเมฆ', followDistance: 1.6, accentParts: 'หน้าและขา' },
  { id: 'monkey', label: 'ลิง', color: '#7a5634', patternColor: '#d9b48a', suggestName: 'จ๋อ', followDistance: 1.5, accentParts: 'หน้าและหู' },
  { id: 'squirrel', label: 'กระรอก', color: '#9a6236', patternColor: '#f0dcc0', suggestName: 'ทองย้อย', followDistance: 1.2, accentParts: 'หาง' },
  { id: 'mouse', label: 'หนู', color: '#a8a4a0', patternColor: '#f2b8c0', suggestName: 'จิ๊บ', followDistance: 1.0, accentParts: 'หูและหาง' },
  { id: 'rabbit', label: 'กระต่าย', color: '#fbf3ee', patternColor: '#f4b8c4', suggestName: 'ปุยฝ้าย', followDistance: 1.3, accentParts: 'ด้านในหู' },
  { id: 'bird', label: 'นก', color: '#4aa3d8', patternColor: '#f2d34a', suggestName: 'เจ้าเขียว', followDistance: 1.2, accentParts: 'ปีกและหาง', flies: true },
  { id: 'chicken', label: 'ไก่', color: '#f3efe6', patternColor: '#b8682e', suggestName: 'เจ้าแดง', followDistance: 1.3, accentParts: 'หาง' },
  { id: 'duck', label: 'เป็ด', color: '#f6f1e2', patternColor: '#6b8a3a', suggestName: 'ก๊าบ ๆ', followDistance: 1.3, accentParts: 'หัว' },
  { id: 'goose', label: 'ห่าน', color: '#f6f3ec', patternColor: '#f6f3ec', suggestName: 'ห่านน้อย', followDistance: 1.5, accentParts: 'หัวและคอ' },
  { id: 'turtle', label: 'เต่า', color: '#6f8f4a', patternColor: '#3f5a2a', suggestName: 'ช้า ๆ', followDistance: 1.3, accentParts: 'หัวและขา' },
]

export const PET_PATTERNS: { id: PetPattern; label: string }[] = [
  { id: 'plain', label: 'ไม่มีลาย' },
  { id: 'spots', label: 'ลายจุด' },
  { id: 'stripes', label: 'ลายทาง' },
  { id: 'patches', label: 'ลายด่าง' },
  { id: 'calico', label: 'สามสี' },
  { id: 'colorpoint', label: 'แต้มสี (หน้า หู ขา หาง)' },
  { id: 'tuxedo', label: 'อกและขาสีรอง' },
  { id: 'blacktan', label: 'แต้มปากและขา' },
]

/** ลายที่ต้องใช้โมเดลรองรับ (แมวและหมา) */
export const BODY_PATTERNS: PetPattern[] = ['colorpoint', 'tuxedo', 'blacktan']
export const patternsFor = (species: PetSpecies) =>
  species === 'cat'
    ? PET_PATTERNS.filter((p) => p.id !== 'blacktan')
    : species === 'dog'
      ? PET_PATTERNS
      : PET_PATTERNS.filter((p) => !BODY_PATTERNS.includes(p.id))

/** สีตัวอย่าง (เลือกสีอื่นได้จากวงล้อสี) */
export const PET_COLORS: { id: string; label: string; color: string }[] = [
  { id: 'white', label: 'ขาว', color: '#f3f0ea' },
  { id: 'cream', label: 'ครีม', color: '#e8d2a8' },
  { id: 'orange', label: 'ส้ม', color: '#e0a35c' },
  { id: 'brown', label: 'น้ำตาล', color: '#8a5a34' },
  { id: 'gray', label: 'เทา', color: '#8a8a8e' },
  { id: 'black', label: 'ดำ', color: '#2b2a2c' },
]

/** สีพาสเทลน่ารัก (วัว/ควาย) */
export const PASTEL_COLORS: { id: string; label: string; color: string }[] = [
  { id: 'lavender', label: 'ลาเวนเดอร์', color: '#c9b3e6' },
  { id: 'strawberry', label: 'ชมพูสตรอว์เบอร์รี', color: '#f2b8c0' },
  { id: 'mint', label: 'เขียวมินต์', color: '#b8e2c4' },
  { id: 'sky', label: 'ฟ้าใส', color: '#9ad8f0' },
  { id: 'butter', label: 'เหลืองนม', color: '#f6e2a8' },
  { id: 'cocoa', label: 'ช็อกโกแลต', color: '#7a5038' },
  { id: 'rose', label: 'แดงกุหลาบ', color: '#c8605a' },
  { id: 'periwinkle', label: 'ม่วงฟ้า', color: '#9aa8e8' },
]
export const colorsFor = (species: PetSpecies) =>
  species === 'cow' || species === 'buffalo' || species === 'pig' || species === 'sheep' || species === 'goat'
    ? [...PET_COLORS, ...PASTEL_COLORS]
    : PET_COLORS

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
  size?: PetSize
  snout?: PetSnout
  /** โหนกบนหลัง (วัวบราห์มัน) */
  hump?: boolean
  /** ชุด/เครื่องประดับของสัตว์เลี้ยง */
  outfit?: PetOutfitId
  outfitColor?: string
  /** ของตกแต่ง (ถือ/กอดไว้ที่อก) */
  held?: PetHeldId
  /** เสียงร้องที่เลือก (0–3) */
  voice?: number
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
  size?: PetSize
  snout?: PetSnout
  hump?: boolean
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

// ---------- พันธุ์หมา ----------
export const DOG_BREEDS: Breed[] = [
  // หมาไทย
  { id: 'thaidog', label: 'หมาไทยบ้าน', note: 'หมาไทยพันธุ์ทาง หูตั้ง หางม้วน', color: '#c8935a', pattern: 'plain', patternColor: '#a8723f', ears: 'erect', tail: 'curl' },
  { id: 'ridgeback', label: 'ไทยหลังอาน', note: 'หมาไทย ขนสั้นสีแดง หูตั้ง', color: '#a8582a', pattern: 'plain', patternColor: '#7a3e1e', ears: 'erect' },
  { id: 'bangkaew', label: 'บางแก้ว', note: 'หมาไทย ขนยาว ขาวด่างน้ำตาล', color: '#f3ede2', pattern: 'patches', patternColor: '#c8853a', fur: 'long', ears: 'erect', tail: 'curl' },
  // หมาเล็ก
  { id: 'pomeranian', label: 'ปอมเมอเรเนียน', note: 'ตัวเล็ก ขนฟู', color: '#e89a3c', pattern: 'plain', patternColor: '#c8782a', fur: 'long', ears: 'erect', tail: 'curl', size: 'small' },
  { id: 'chihuahua', label: 'ชิวาวา', note: 'ตัวเล็กมาก หูใหญ่', color: '#e2c08a', pattern: 'plain', patternColor: '#c8a070', ears: 'erect', size: 'small' },
  { id: 'pug', label: 'ปั๊ก', note: 'หน้าสั้น หน้ากากดำ', color: '#d9b88a', pattern: 'colorpoint', patternColor: '#2b2a2c', snout: 'short', tail: 'curl', size: 'small' },
  { id: 'frenchie', label: 'เฟรนช์บูลด็อก', note: 'หน้าสั้น หูค้างคาว', color: '#e2c8a2', pattern: 'plain', patternColor: '#c8aa82', snout: 'short', ears: 'erect', size: 'small' },
  { id: 'shihtzu', label: 'ชิห์สุ', note: 'ขนยาว ขาวด่างน้ำตาล', color: '#f0e6d6', pattern: 'patches', patternColor: '#9a7448', fur: 'long', ears: 'floppy', tail: 'curl', size: 'small', snout: 'short' },
  { id: 'dachshund', label: 'ดัชชุนด์', note: 'ไส้กรอก ดำแต้มน้ำตาล', color: '#1f1d1f', pattern: 'blacktan', patternColor: '#a8642a', ears: 'floppy', size: 'small' },
  { id: 'corgi', label: 'คอร์กี้', note: 'ขาสั้น ส้มอกขาว', color: '#d9883a', pattern: 'tuxedo', patternColor: '#f3ede2', ears: 'erect', size: 'small', tail: 'none' },
  // หมากลาง
  { id: 'beagle', label: 'บีเกิล', note: 'หูตก น้ำตาลอกขาว', color: '#c8853a', pattern: 'tuxedo', patternColor: '#f3ede2', ears: 'floppy' },
  { id: 'shiba', label: 'ชิบะ อินุ', note: 'หูตั้ง หางม้วน ส้มอกขาว', color: '#d9883a', pattern: 'tuxedo', patternColor: '#f3ede2', ears: 'erect', tail: 'curl' },
  { id: 'bordercollie', label: 'บอร์เดอร์คอลลี่', note: 'ดำ อกและขาขาว', color: '#1f1d1f', pattern: 'tuxedo', patternColor: '#f3ede2', fur: 'long', ears: 'floppy' },
  { id: 'poodle', label: 'พุดเดิ้ล', note: 'ขนหยิกฟู', color: '#f6f4ef', pattern: 'plain', patternColor: '#e2dcd0', fur: 'long', ears: 'floppy' },
  // หมาใหญ่
  { id: 'golden', label: 'โกลเด้น รีทรีฟเวอร์', note: 'ขนยาวสีทอง หูตก', color: '#d9a24a', pattern: 'plain', patternColor: '#b8822f', fur: 'long', ears: 'floppy', size: 'large' },
  { id: 'labrador', label: 'ลาบราดอร์', note: 'ขนสั้น หูตก', color: '#e2c08a', pattern: 'plain', patternColor: '#c8a070', ears: 'floppy', size: 'large' },
  { id: 'husky', label: 'ไซบีเรียน ฮัสกี้', note: 'เทาอกขาว หูตั้ง', color: '#7f8590', pattern: 'tuxedo', patternColor: '#f3f1ec', ears: 'erect', tail: 'curl', size: 'large' },
  { id: 'dalmatian', label: 'ดัลเมเชียน', note: 'ขาวจุดดำ', color: '#f6f4ef', pattern: 'spots', patternColor: '#1f1d1f', ears: 'floppy', size: 'large' },
  { id: 'gsd', label: 'เยอรมันเชพเพิร์ด', note: 'หูตั้ง ด่างดำน้ำตาล', color: '#c8853a', pattern: 'patches', patternColor: '#2b2a2c', ears: 'erect', size: 'large' },
  { id: 'rottweiler', label: 'ร็อตไวเลอร์', note: 'ดำแต้มน้ำตาล', color: '#1f1d1f', pattern: 'blacktan', patternColor: '#a8582a', ears: 'floppy', size: 'large' },
]

// ---------- พันธุ์วัว ----------
export const COW_BREEDS: Breed[] = [
  { id: 'thaicow', label: 'วัวไทยพื้นเมือง', note: 'ตัวเล็ก สีน้ำตาลแดง', color: '#b5763f', pattern: 'plain', patternColor: '#e8a8a0' },
  { id: 'lamphun', label: 'วัวขาวลำพูน', note: 'วัวไทย ขาวทั้งตัว จมูกชมพู', color: '#f3efe6', pattern: 'plain', patternColor: '#e8a8a0' },
  { id: 'holstein', label: 'วัวนม (โฮลสไตน์)', note: 'ขาวด่างดำ', color: '#f3efe6', pattern: 'patches', patternColor: '#262427', size: 'large' },
  { id: 'brahman', label: 'บราห์มัน', note: 'สีเทา มีโหนก หูตก', color: '#9a9aa0', pattern: 'plain', patternColor: '#6f6f76', ears: 'floppy', hump: true, size: 'large' },
  { id: 'kamphaengsaen', label: 'กำแพงแสน', note: 'วัวเนื้อไทย สีน้ำตาลอ่อน', color: '#d9b88a', pattern: 'plain', patternColor: '#c8a070', size: 'large' },
  ...cuteStyles(),
]

/** แบบน่ารักสีพาสเทล (ใช้ทั้งวัวและควาย) */
function cuteStyles(): Breed[] {
  return [
    { id: 'cute-brown', label: '🤎 ขาวด่างน้ำตาล', note: 'ขาวด่างน้ำตาล', color: '#fbf6f0', pattern: 'patches', patternColor: '#8a5232' },
    { id: 'cute-orange', label: '🧡 ขาวด่างส้ม', note: 'ขาวด่างส้ม', color: '#fbf6f0', pattern: 'patches', patternColor: '#e0903a' },
    { id: 'cute-navy', label: '💙 ขาวด่างกรม', note: 'ขาวด่างน้ำเงินเข้ม', color: '#fbf6f0', pattern: 'patches', patternColor: '#2f3f7a' },
    { id: 'cute-blue', label: '🩵 ขาวด่างฟ้า', note: 'ขาวด่างฟ้าอ่อน', color: '#fbf6f0', pattern: 'patches', patternColor: '#8ab8e0' },
    { id: 'cute-strawberry', label: '🍓 สตรอว์เบอร์รี', note: 'ขาวด่างชมพู', color: '#fbf6f0', pattern: 'patches', patternColor: '#f2b8c0' },
    { id: 'cute-lavender', label: '💜 ลาเวนเดอร์', note: 'ขาวด่างม่วง', color: '#fbf6f0', pattern: 'patches', patternColor: '#c9b3e6' },
    { id: 'cute-mint', label: '🍃 มินต์', note: 'เขียวมินต์ด่างขาว', color: '#b8e2c4', pattern: 'patches', patternColor: '#fbf6f0' },
    { id: 'cute-sky', label: '🩵 ฟ้าใส', note: 'ฟ้าด่างขาว', color: '#9ad8f0', pattern: 'patches', patternColor: '#fbf6f0' },
    { id: 'cute-banana', label: '🍌 นมกล้วย', note: 'เหลืองนมล้วน', color: '#f6e2a8', pattern: 'plain', patternColor: '#f2b8c0' },
    { id: 'cute-cookie', label: '🍪 คุกกี้แอนด์ครีม', note: 'ขาวจุดช็อกโกแลต', color: '#fbf6f0', pattern: 'spots', patternColor: '#4a3020' },
    { id: 'cute-grape', label: '🍇 องุ่น', note: 'ม่วงฟ้าด่างขาว', color: '#9aa8e8', pattern: 'patches', patternColor: '#fbf6f0' },
    { id: 'cute-highland', label: '❤️ แดงขนฟู', note: 'แดงกุหลาบ ขนยาว', color: '#c8605a', pattern: 'plain', patternColor: '#f2b8c0', fur: 'long' },
  ]
}

// ---------- พันธุ์หนู ----------
export const MOUSE_BREEDS: Breed[] = [
  { id: 'housemouse', label: 'หนูบ้าน', note: 'สีเทา หูชมพู', color: '#a8a4a0', pattern: 'plain', patternColor: '#f2b8c0' },
  { id: 'whitemouse', label: 'หนูขาว', note: 'ขาวทั้งตัว', color: '#f6f4ef', pattern: 'plain', patternColor: '#f2b8c0' },
  { id: 'hamster', label: 'แฮมสเตอร์', note: 'ส้มทองด่างขาว หางสั้น', color: '#e0a35c', pattern: 'patches', patternColor: '#fbf6f0', tail: 'none' },
  { id: 'dumbo', label: 'หนูดัมโบ้', note: 'หูใหญ่ ด่างขาวเทา', color: '#fbf6f0', pattern: 'patches', patternColor: '#8a8a8e', ears: 'floppy' },
]

// ---------- หมู แพะ แกะ ----------
export const PIG_BREEDS: Breed[] = [
  { id: 'pinkpig', label: 'หมูชมพู', note: 'ชมพูอ่อน หางม้วน', color: '#f2b0b8', pattern: 'plain', patternColor: '#e8909c' },
  { id: 'thaipig', label: 'หมูไทยพื้นเมือง', note: 'ดำ ตัวเล็ก', color: '#2b2a2c', pattern: 'plain', patternColor: '#5a5450' },
  { id: 'spottedpig', label: 'หมูด่าง', note: 'ชมพูด่างดำ', color: '#f2c0c4', pattern: 'patches', patternColor: '#2b2a2c' },
  { id: 'minipig', label: 'หมูแคระ', note: 'ตัวเล็กมาก', color: '#f6c8cc', pattern: 'plain', patternColor: '#e8909c', size: 'small' },
]
export const GOAT_BREEDS: Breed[] = [
  { id: 'whitegoat', label: 'แพะขาว (ซาเนน)', note: 'ขาวทั้งตัว', color: '#f2ede4', pattern: 'plain', patternColor: '#b8a890' },
  { id: 'boer', label: 'แพะบอร์', note: 'ตัวขาว หัวน้ำตาล หูตก', color: '#f2ede4', pattern: 'plain', patternColor: '#9a5a32', ears: 'floppy' },
  { id: 'blackgoat', label: 'แพะดำ', note: 'ดำทั้งตัว', color: '#2b2a2c', pattern: 'plain', patternColor: '#5a5450' },
  { id: 'brown', label: 'แพะน้ำตาล', note: 'น้ำตาลลายขาว', color: '#9a6a42', pattern: 'patches', patternColor: '#f2ede4' },
]
export const SHEEP_BREEDS: Breed[] = [
  { id: 'whitesheep', label: 'แกะขาว', note: 'ขนปุยขาว หน้าดำ', color: '#f6f2e8', pattern: 'plain', patternColor: '#3a3330' },
  { id: 'blacksheep', label: 'แกะดำ', note: 'ขนดำ หน้าเทา', color: '#3a3533', pattern: 'plain', patternColor: '#7a7470' },
  { id: 'creamsheep', label: 'แกะครีม', note: 'ขนครีม หน้าครีม', color: '#efe2c8', pattern: 'plain', patternColor: '#d8c4a0' },
  { id: 'pinksheep', label: '🌸 แกะชมพู', note: 'ขนชมพูพาสเทล', color: '#f6c8d4', pattern: 'plain', patternColor: '#fbf2ec' },
]

// ---------- พันธุ์ไก่ ----------
export const CHICKEN_BREEDS: Breed[] = [
  { id: 'homechicken', label: 'ไก่บ้าน', note: 'ขาว หางน้ำตาล', color: '#f3efe6', pattern: 'plain', patternColor: '#b8682e' },
  { id: 'fighting', label: 'ไก่ชน (เหลืองหางขาว)', note: 'ไก่ไทย ขนแดงเข้ม หางดำ', color: '#9a3a22', pattern: 'plain', patternColor: '#1f1d1f' },
  { id: 'bantam', label: 'ไก่แจ้', note: 'ตัวเล็ก ขาวล้วน', color: '#fbf8f2', pattern: 'plain', patternColor: '#f3efe6', size: 'small' },
  { id: 'rainbow', label: '🌈 ไก่หางรุ้ง', note: 'ขาว หางหลากสี', color: '#fbf8f2', pattern: 'plain', patternColor: '#e84a3a', tail: 'rainbow' },
  { id: 'blackchicken', label: 'ไก่ดำ', note: 'ดำทั้งตัว', color: '#2b2a2c', pattern: 'plain', patternColor: '#1f1d1f' },
]

// ---------- พันธุ์เป็ด ----------
export const DUCK_BREEDS: Breed[] = [
  { id: 'whiteduck', label: '🤍 เป็ดขาว', note: 'ขาวทั้งตัว ปากส้ม', color: '#fbf8f2', pattern: 'plain', patternColor: '#fbf8f2' },
  { id: 'duckling', label: '💛 ลูกเป็ดเหลือง', note: 'เหลืองนวล ตัวเล็ก', color: '#f6dc78', pattern: 'plain', patternColor: '#f6dc78', size: 'small' },
  { id: 'mallard', label: 'เป็ดหัวเขียว', note: 'ตัวเทาน้ำตาล หัวเขียว', color: '#a89a88', pattern: 'plain', patternColor: '#3f7a3a' },
  { id: 'fieldduck', label: 'เป็ดไล่ทุ่ง', note: 'เป็ดไทย น้ำตาลลายจุด', color: '#8a6a4a', pattern: 'spots', patternColor: '#5a4030' },
]

export const GOOSE_BREEDS: Breed[] = [
  { id: 'whitegoose', label: 'ห่านขาว', note: 'ขาวทั้งตัว ปุ่มปากส้ม', color: '#f6f3ec', pattern: 'plain', patternColor: '#f6f3ec' },
  { id: 'graygoose', label: 'ห่านเทา', note: 'ตัวเทา คอน้ำตาล', color: '#a8a29a', pattern: 'stripes', patternColor: '#7a6a5a' },
  { id: 'chinesegoose', label: 'ห่านจีน', note: 'น้ำตาลอ่อน คอแถบเข้ม', color: '#d8c4a8', pattern: 'plain', patternColor: '#8a6a4a' },
]

export const RABBIT_BREEDS: Breed[] = [
  { id: 'cuterabbit', label: '🤍 กระต่ายขาวครีม', note: 'ขาวครีม หูในชมพู', color: '#fbf3ee', pattern: 'plain', patternColor: '#f4b8c4' },
  { id: 'lop', label: 'ฮอลแลนด์ลอป', note: 'หูตกห้อยข้างหัว', color: '#e8cfae', pattern: 'plain', patternColor: '#f4c8c0', ears: 'floppy' },
  { id: 'dutch', label: 'กระต่ายดัตช์', note: 'ขาวด่างดำ', color: '#fbf8f2', pattern: 'patches', patternColor: '#3a3533' },
  { id: 'grayrabbit', label: 'กระต่ายเทา', note: 'เทาอ่อน', color: '#b8b4b0', pattern: 'plain', patternColor: '#e8c8cc' },
  { id: 'brownrabbit', label: 'กระต่ายน้ำตาล', note: 'น้ำตาลอ่อน', color: '#b88a5a', pattern: 'plain', patternColor: '#f0d0c0' },
  { id: 'pinkrabbit', label: '🌸 กระต่ายชมพู', note: 'ชมพูพาสเทล', color: '#f6d0dc', pattern: 'plain', patternColor: '#fbf3ee' },
]

// ---------- พันธุ์ควาย ----------
export const BUFFALO_BREEDS: Breed[] = [
  { id: 'thaibuffalo', label: 'ควายไทย', note: 'ควายปลัก สีเทาดำ', color: '#3d3c40', pattern: 'plain', patternColor: '#8a7f78' },
  { id: 'albino', label: 'ควายเผือก', note: 'ขนสีชมพูอ่อน', color: '#e8c0b0', pattern: 'plain', patternColor: '#f2b8c0' },
  { id: 'murrah', label: 'ควายมูร่าห์', note: 'ดำสนิท ตัวใหญ่', color: '#1f1d1f', pattern: 'plain', patternColor: '#5f5a58', size: 'large' },
  ...cuteStyles(),
]

export const breedsFor = (species: PetSpecies): Breed[] =>
  species === 'cat'
    ? CAT_BREEDS
    : species === 'dog'
      ? DOG_BREEDS
      : species === 'cow'
        ? COW_BREEDS
        : species === 'buffalo'
          ? BUFFALO_BREEDS
          : species === 'mouse'
            ? MOUSE_BREEDS
            : species === 'pig'
              ? PIG_BREEDS
              : species === 'goat'
                ? GOAT_BREEDS
                : species === 'sheep'
                  ? SHEEP_BREEDS
                  : species === 'chicken'
                    ? CHICKEN_BREEDS
                    : species === 'duck'
                      ? DUCK_BREEDS
                      : species === 'goose'
                        ? GOOSE_BREEDS
                        : species === 'rabbit'
                          ? RABBIT_BREEDS
                          : []

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
    size: breed.size ?? 'medium',
    snout: breed.snout ?? 'normal',
    hump: breed.hump ?? false,
  }
}

// ---------- ชุดแต่งตัวสัตว์เลี้ยง ----------
export type PetOutfitId = 'none' | 'collar' | 'scarf' | 'bow' | 'headbow' | 'flower' | 'flowercrown' | 'headscarf' | 'strawhat' | 'bunnyhood' | 'cowhood' | 'froghood' | 'headphones' | 'bee' | 'bag'

export const PET_OUTFITS: { id: PetOutfitId; label: string; color?: string }[] = [
  { id: 'none', label: 'ไม่ใส่' },
  { id: 'collar', label: 'ปลอกคอกระดิ่ง', color: '#d23a3a' },
  { id: 'scarf', label: 'ผ้าพันคอ', color: '#4a90d8' },
  { id: 'bow', label: 'โบว์ผูกคอ', color: '#f08aa0' },
  { id: 'headbow', label: 'โบว์บนหัว', color: '#f08aa0' },
  { id: 'flower', label: 'ดอกไม้ติดหู', color: '#f08aa0' },
  { id: 'flowercrown', label: 'มงกุฎดอกไม้', color: '#f08aa0' },
  { id: 'headscarf', label: 'ผ้าโพกหัว', color: '#4a90d8' },
  { id: 'strawhat', label: 'หมวกสาน', color: '#d23a3a' },
  { id: 'bunnyhood', label: 'ฮู้ดหูกระต่าย', color: '#f6d0dc' },
  { id: 'cowhood', label: 'ฮู้ดวัว', color: '#262427' },
  { id: 'froghood', label: 'ฮู้ดกบ', color: '#9ac86a' },
  { id: 'headphones', label: 'หูฟัง', color: '#c9b3e6' },
  { id: 'bee', label: 'ชุดผึ้ง', color: '#2b2a2c' },
  { id: 'bag', label: 'กระเป๋าสะพาย', color: '#d23a3a' },
]

export const PET_OUTFIT_COLORS: { id: string; label: string; color: string }[] = [
  { id: 'red', label: 'แดง', color: '#d23a3a' },
  { id: 'pink', label: 'ชมพู', color: '#f08aa0' },
  { id: 'blue', label: 'ฟ้า', color: '#4a90d8' },
  { id: 'yellow', label: 'เหลือง', color: '#f2c94a' },
  { id: 'green', label: 'เขียว', color: '#5c9a4a' },
  { id: 'cream', label: 'ครีม', color: '#f6ecd2' },
]

// ---------- ของตกแต่งของสัตว์เลี้ยง (ถือ/กอดไว้ที่อก) ----------
export type PetHeldId = 'none' | 'carrot' | 'boba' | 'bouquet' | 'star' | 'teddy' | 'heart' | 'banana' | 'cheese'
export const PET_HELD: { id: PetHeldId; label: string }[] = [
  { id: 'none', label: 'ไม่มี' },
  { id: 'carrot', label: '🥕 แครอท' },
  { id: 'boba', label: '🥤 ชานมไข่มุก' },
  { id: 'bouquet', label: '💐 ช่อดอกไม้' },
  { id: 'star', label: '⭐ ดาว' },
  { id: 'teddy', label: '🧸 ตุ๊กตาหมี' },
  { id: 'heart', label: '💗 หมอนหัวใจ' },
  { id: 'banana', label: '🍌 กล้วย' },
  { id: 'cheese', label: '🧀 ชีส' },
]
