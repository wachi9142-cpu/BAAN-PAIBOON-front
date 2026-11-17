// ตัวเลือกรูปลักษณ์ตัวละคร — เพิ่มตัวเลือกใหม่ได้โดยเพิ่มรายการในไฟล์นี้

export type Gender = 'male' | 'female'

export interface Option {
  id: string
  label: string
}

export const GENDERS: (Option & { id: Gender })[] = [
  { id: 'female', label: 'หญิง' },
  { id: 'male', label: 'ชาย' },
]

export type HairStyleId = 'short' | 'buzz' | 'bob' | 'long' | 'bun' | 'ponytail'

export const HAIR_STYLES: (Option & { id: HairStyleId })[] = [
  { id: 'short', label: 'ผมสั้น' },
  { id: 'buzz', label: 'ผมเกรียน' },
  { id: 'bob', label: 'ผมบ็อบ' },
  { id: 'long', label: 'ผมยาว' },
  { id: 'bun', label: 'มวยผม' },
  { id: 'ponytail', label: 'หางม้า' },
]

export const HAIR_COLORS: (Option & { color: string })[] = [
  { id: 'black', label: 'ดำ', color: '#1c1714' },
  { id: 'darkbrown', label: 'น้ำตาลเข้ม', color: '#3e2a1f' },
  { id: 'brown', label: 'น้ำตาล', color: '#6b4428' },
  { id: 'gray', label: 'เทา', color: '#8d8a86' },
]

export const SKIN_TONES: (Option & { color: string })[] = [
  { id: 'light', label: 'ขาว', color: '#f1c9a5' },
  { id: 'medium', label: 'สองสี', color: '#d9a47a' },
  { id: 'tan', label: 'แทน', color: '#b57f55' },
  { id: 'dark', label: 'คล้ำ', color: '#8a5a3b' },
]

export interface Outfit extends Option {
  top: string
  bottom: string
  /** กระโปรง/ผ้าถุง = ทรงบาน, กางเกง = ทรงขาแยก */
  bottomShape: 'pants' | 'skirt'
  hat?: 'straw'
}

export const OUTFITS: Outfit[] = [
  { id: 'mohom', label: 'เสื้อม่อฮ่อม กางเกงเล', top: '#2b3550', bottom: '#2b3550', bottomShape: 'pants' },
  { id: 'farmer', label: 'ชุดทำนา หมวกงอบ', top: '#5b7c99', bottom: '#3d3a36', bottomShape: 'pants', hat: 'straw' },
  { id: 'tshirt', label: 'เสื้อยืด กางเกงขาสั้น', top: '#e8e2d4', bottom: '#4a5d3a', bottomShape: 'pants' },
  { id: 'phasin', label: 'เสื้อแขนกระบอก ผ้าซิ่น', top: '#f2e6cf', bottom: '#7a2e3a', bottomShape: 'skirt' },
  { id: 'phathung', label: 'เสื้อลายดอก ผ้าถุง', top: '#d98a5f', bottom: '#4b3a6b', bottomShape: 'skirt' },
]

export interface Appearance {
  gender: Gender
  skin: string
  hairStyle: HairStyleId
  hairColor: string
  outfit: string
  /** สีปาก: id สีตัวอย่าง หรือ "#rrggbb" (เซฟเก่าที่ไม่มีค่านี้ใช้สีเริ่มต้น) */
  lipColor?: string
  /** รองเท้า (เซฟเก่าที่ไม่มีค่านี้ใช้รองเท้าแตะ) */
  shoes?: ShoeId
  shoeColor?: string
  /** กระเป๋า (none = ไม่มี) */
  bag?: BagId
  bagColor?: string
}

export const DEFAULT_APPEARANCE: Record<Gender, Appearance> = {
  female: { gender: 'female', skin: 'medium', hairStyle: 'long', hairColor: 'black', outfit: 'phasin', lipColor: 'rose', shoes: 'sandals', shoeColor: 'brown' },
  male: { gender: 'male', skin: 'tan', hairStyle: 'short', hairColor: 'black', outfit: 'mohom', lipColor: 'natural', shoes: 'sandals', shoeColor: 'brown' },
}

/** สีผม: เป็น id ของสีตัวอย่าง หรือรหัสสี "#rrggbb" ที่ผู้เล่นเลือกเองจากวงล้อสี */
export const isCustomColor = (v: string) => v.startsWith('#')
export const hairColorValue = (v: string) => (isCustomColor(v) ? v : byId(HAIR_COLORS, v).color)

export const byId =<T extends Option>(list: T[], id: string): T => list.find((o) => o.id === id) ?? list[0]

export const LIP_COLORS: (Option & { color: string })[] = [
  { id: 'natural', label: 'ธรรมชาติ', color: '#8a3b2c' },
  { id: 'rose', label: 'ชมพูกุหลาบ', color: '#c4566a' },
  { id: 'red', label: 'แดง', color: '#b3202c' },
  { id: 'coral', label: 'ส้มพีช', color: '#e07a5f' },
  { id: 'brown', label: 'น้ำตาล', color: '#6b3a2a' },
]

export const lipColorValue = (v: string | undefined) =>
  !v ? LIP_COLORS[0].color : isCustomColor(v) ? v : byId(LIP_COLORS, v).color

export type ShoeId = 'sandals' | 'heels' | 'sneakers' | 'maryjane' | 'kachu' | 'boots'

export const SHOES: (Option & { id: ShoeId })[] = [
  { id: 'sandals', label: 'รองเท้าแตะ' },
  { id: 'sneakers', label: 'รองเท้าผ้าใบ' },
  { id: 'kachu', label: 'รองเท้าคัชชู' },
  { id: 'maryjane', label: 'รองเท้าแมรี่เจน' },
  { id: 'heels', label: 'รองเท้าส้นสูง' },
  { id: 'boots', label: 'รองเท้าบูท' },
]

export const SHOE_COLORS: (Option & { color: string })[] = [
  { id: 'brown', label: 'น้ำตาล', color: '#6b4426' },
  { id: 'black', label: 'ดำ', color: '#1f1b1a' },
  { id: 'white', label: 'ขาว', color: '#f1eee8' },
  { id: 'red', label: 'แดง', color: '#b3202c' },
  { id: 'navy', label: 'กรมท่า', color: '#26324f' },
]

export const shoeColorValue = (v: string | undefined) =>
  !v ? SHOE_COLORS[0].color : isCustomColor(v) ? v : byId(SHOE_COLORS, v).color

export type BagId = 'none' | 'yaam' | 'backpack' | 'tote' | 'shoulder' | 'crossbody' | 'waist' | 'handbag'

export const BAGS: (Option & { id: BagId })[] = [
  { id: 'none', label: 'ไม่มีกระเป๋า' },
  { id: 'yaam', label: 'ย่าม' },
  { id: 'backpack', label: 'เป้สะพายหลัง' },
  { id: 'tote', label: 'กระเป๋าผ้า' },
  { id: 'shoulder', label: 'สะพายไหล่' },
  { id: 'crossbody', label: 'คาดลำตัว' },
  { id: 'waist', label: 'คาดเอว' },
  { id: 'handbag', label: 'กระเป๋าถือ' },
]

export const BAG_COLORS: (Option & { color: string })[] = [
  { id: 'indigo', label: 'คราม', color: '#2f3f6e' },
  { id: 'brown', label: 'น้ำตาล', color: '#7a4a28' },
  { id: 'cream', label: 'ครีม', color: '#e8dcc0' },
  { id: 'green', label: 'เขียว', color: '#5c7a3a' },
  { id: 'red', label: 'แดง', color: '#a83a32' },
  { id: 'black', label: 'ดำ', color: '#222023' },
]

export const bagColorValue = (v: string | undefined) =>
  !v ? BAG_COLORS[0].color : isCustomColor(v) ? v : byId(BAG_COLORS, v).color
