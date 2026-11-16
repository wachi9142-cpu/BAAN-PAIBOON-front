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
}

export const DEFAULT_APPEARANCE: Record<Gender, Appearance> = {
  female: { gender: 'female', skin: 'medium', hairStyle: 'long', hairColor: 'black', outfit: 'phasin' },
  male: { gender: 'male', skin: 'tan', hairStyle: 'short', hairColor: 'black', outfit: 'mohom' },
}

export const byId = <T extends Option>(list: T[], id: string): T => list.find((o) => o.id === id) ?? list[0]
