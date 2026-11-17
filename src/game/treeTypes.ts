import type { ItemId } from './content/items'

/** สถานะต้นไม้ในเซฟ (เวลา = นาทีสัมบูรณ์ในเกม) */
export interface TreeState {
  /** ฟันไปแล้ว (หน่วยความแรง) */
  dmg: number
  /** มุมที่ฟัน (ให้รอยฟันอยู่ด้านที่ผู้เล่นยืน) */
  mark: number
  /** โค่นแล้วตอนไหน */
  felledAt?: number
  /** ทิศที่ล้ม */
  fallDir?: number
  /** ปลูกต้นกล้าแทนตอนไหน */
  plantedAt?: number
}

export interface GroundDrop {
  id: string
  item: ItemId
  qty: number
  x: number
  z: number
}
