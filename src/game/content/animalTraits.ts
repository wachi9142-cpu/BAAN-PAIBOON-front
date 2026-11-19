/**
 * ประเภทและความสามารถของสัตว์ (ผู้สร้าง 19 พ.ย. 2569)
 * แยกให้ชัด 3 เรื่อง (ไม่ปนกัน):
 *   1) ประเภทและความสามารถของสัตว์ (ไฟล์นี้) — สัตว์แต่ละชนิดทำอะไรได้
 *   2) ความสัมพันธ์กับผู้เล่น — ความรัก/ความผูกพัน (game/petCare.ts · save.petHearts)
 *   3) อุปกรณ์ของผู้เล่นและสัตว์ — อาน หมวกฟองอากาศ (game/saddles.ts · items)
 * สัตว์หนึ่งตัวมีได้หลายคุณสมบัติ เช่น มังกรน้ำ = สัตว์พลังพิเศษ + ดำน้ำได้
 */
import type { PetSpecies } from './pets'

export type AnimalCategory = 'land' | 'aquatic' | 'semi' | 'flying' | 'special' | 'prehistoric'
export const CATEGORY_INFO: Record<AnimalCategory, { label: string; en: string; icon: string; note: string }> = {
  land: { label: 'สัตว์บก', en: 'Land Animals', icon: '🐾', note: 'ใช้ชีวิตบนบกเป็นหลัก บางชนิดว่ายน้ำได้ แต่ดำน้ำลึกไม่ได้' },
  aquatic: { label: 'สัตว์น้ำ', en: 'Aquatic Animals', icon: '🐟', note: 'ใช้ชีวิตและเคลื่อนที่ในน้ำได้ดี' },
  semi: { label: 'สัตว์ครึ่งบกครึ่งน้ำ', en: 'Semi-aquatic Animals', icon: '🐢', note: 'อยู่ได้ทั้งบกและน้ำ ดำน้ำได้ช่วงสั้น ๆ' },
  flying: { label: 'สัตว์ปีก', en: 'Flying Animals', icon: '🪶', note: 'บินได้ ใช้ชีวิตตามลักษณะของแต่ละชนิด' },
  special: { label: 'สัตว์พลังพิเศษ', en: 'Special & Mythical Creatures', icon: '✨', note: 'สัตว์ในตำนาน มีพลังธาตุหรือความสามารถเฉพาะตัว เช่น มังกร พญานาค งูน้ำ' },
  prehistoric: { label: 'สัตว์ดึกดำบรรพ์', en: 'Prehistoric Animals', icon: '🦖', note: 'ไดโนเสาร์และสัตว์โบราณ มีความสามารถตามสายพันธุ์' },
}

/** ความสามารถทางน้ำ: none = ไม่ลงน้ำ · short = ลอย/ว่ายได้สั้น ๆ (ตัวเล็ก) · swim = ว่ายได้ ไม่ดำ · dive = ดำได้ (มีเวลาจำกัด) · native = อยู่ในน้ำได้ตลอด */
export type WaterAbility = 'none' | 'short' | 'swim' | 'dive' | 'native'
export const WATER_LABEL: Record<WaterAbility, string> = {
  none: 'ไม่ลงน้ำ',
  short: 'ลอยตัวได้ช่วงสั้น ๆ ไม่เหมาะกับการดำน้ำ',
  swim: 'ว่ายน้ำได้ แต่ไม่ดำน้ำ',
  dive: 'ดำน้ำได้ แต่มีเวลาจำกัด',
  native: 'ว่ายและดำน้ำได้ตามธรรมชาติ',
}

export interface AnimalTraits {
  categories: AnimalCategory[]
  water: WaterAbility
  /** ดำน้ำได้นานกี่วินาที (dive/native) */
  diveSeconds?: number
  /** ช่วยลากเจ้าของขึ้นฝั่งได้ (ตัวใหญ่ ว่ายเก่ง) — ต้องผูกพันมากพอด้วย */
  rescuer?: boolean
}

export const ANIMAL_TRAITS: Record<PetSpecies, AnimalTraits> = {
  dog: { categories: ['land'], water: 'swim', rescuer: true },
  cat: { categories: ['land'], water: 'none' },
  buffalo: { categories: ['land'], water: 'dive', diveSeconds: 20, rescuer: true },
  cow: { categories: ['land'], water: 'swim', rescuer: true },
  pig: { categories: ['land'], water: 'swim' },
  goat: { categories: ['land'], water: 'short' },
  sheep: { categories: ['land'], water: 'short' },
  monkey: { categories: ['land'], water: 'swim' },
  squirrel: { categories: ['land'], water: 'none' },
  mouse: { categories: ['land'], water: 'none' },
  rabbit: { categories: ['land'], water: 'none' },
  bird: { categories: ['flying'], water: 'none' },
  chicken: { categories: ['flying', 'land'], water: 'none' },
  duck: { categories: ['flying', 'semi'], water: 'dive', diveSeconds: 15 },
  goose: { categories: ['flying', 'semi'], water: 'swim' },
  turtle: { categories: ['semi'], water: 'native', diveSeconds: 300 },
}
export const traitsOf = (s: PetSpecies): AnimalTraits => ANIMAL_TRAITS[s] ?? { categories: ['land'], water: 'swim' }

/** สัตว์ตัวนี้ลงไปในน้ำลึกตามเจ้าของได้ไหม (ownerDiving = เจ้าของดำลงใต้น้ำอยู่) */
export function canFollowInWater(s: PetSpecies, small: boolean, ownerDiving: boolean) {
  const w = traitsOf(s).water
  if (w === 'none' || w === 'short') return false
  if (small && w === 'swim') return false // หมาตัวเล็ก ๆ ไม่พาลงน้ำลึก
  if (ownerDiving) return w === 'dive' || w === 'native'
  return true
}
