/**
 * วงจรการนอนหลับของสัตว์ และสัตว์ร่วมเดินทาง (Pet Sleep & Adventure System) — ผู้สร้าง 19 พ.ย. 2569
 * - สัตว์ร่วมเดินทาง (ตัวที่เรียกออกมาเดินตาม): ไม่หลับเองระหว่างออกไปนอกบ้าน (นั่งรอได้ แต่ไม่นอน) · กลับถึงบ้านแล้วใช้วงจรปกติ
 * - สัตว์ที่อยู่บ้าน: ใช้ชีวิตตามธรรมชาติของตัวเอง
 *   · หากินกลางวัน (หมา ไก่ วัว ควาย …): กลางวันตื่น เดินเล่น/นั่ง · ค่ำเดินกลับที่นอน ขดตัวหลับ · เช้าตื่นบิดขี้เกียจ
 *   · หากินกลางคืน (แมว หนู): กลางวันนอนพัก · ค่ำตื่นออกเดินหากินไกลกว่าเดิม
 * - แต่ละตัวมีเวลาเข้านอน/ตื่นของตัวเอง (เหลื่อมกันได้ ±45 นาทีตามชื่อ) ไม่เข้านอนพร้อมกันทุกตัว
 */
import type { PetChoice, PetSpecies } from './content/pets'
import { PLACES } from './content/village'
import { HOME_BOX } from '../scenes/GrandHome'

export const NOCTURNAL: PetSpecies[] = ['cat', 'mouse']
export const isNocturnal = (s: PetSpecies) => NOCTURNAL.includes(s)

export type LifePhase = 'awake' | 'seek' | 'sleep' | 'wake'

function offsetOf(pet: PetChoice) {
  let h = 11
  for (const c of pet.name + pet.species + pet.color) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return (h % 91) - 45
}
const inRange = (m: number, a: number, b: number) => {
  const x = ((m - a) % 1440 + 1440) % 1440
  const len = ((b - a) % 1440 + 1440) % 1440
  return x < len
}

/** ช่วงชีวิตตอนนี้ของสัตว์ตัวนี้ (นาทีในวัน) */
export function lifePhase(pet: PetChoice, minute: number): LifePhase {
  const off = offsetOf(pet)
  const night = isNocturnal(pet.species)
  // เข้านอน → ตื่น (นาทีในวัน)
  const sleepAt = (night ? 7 * 60 + 30 : 20 * 60 + 30) + off
  const wakeAt = (night ? 16 * 60 + 30 : 5 * 60 + 40) + off
  if (inRange(minute, sleepAt - 20, sleepAt)) return 'seek'
  if (inRange(minute, sleepAt, wakeAt)) return 'sleep'
  if (inRange(minute, wakeAt, wakeAt + 15)) return 'wake'
  return 'awake'
}
export const isSleepTime = (pet: PetChoice, minute: number) => lifePhase(pet, minute) === 'sleep'

/** ผู้เล่นอยู่ในบริเวณบ้านตารัง–ยายเลียนไหม (ในบ้าน = นอกการผจญภัย) */
export function atHome(x: number, z: number) {
  const h = PLACES.find((p) => p.id === 'home-tarang')
  if (!h) return false
  const lx = x - h.pos[0]
  const lz = z - h.pos[1]
  return lx > HOME_BOX.x0 - 1 && lx < HOME_BOX.x1 + 1 && lz > HOME_BOX.z0 - 1 && lz < HOME_BOX.z1 + 1
}
