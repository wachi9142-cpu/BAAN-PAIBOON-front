import type { PetChoice } from '../game/content/pets'
import { canCarry, putDown, startCarry, useCarry } from '../game/carry'
import { doSkill, feedPet } from '../game/petCare'
import { useGame } from '../game/store'
import { openActionWheel } from './ActionWheel'

const EMOJI: Record<string, string> = {
  dog: '🐶', cat: '🐱', buffalo: '🐃', cow: '🐄', pig: '🐷', goat: '🐐', sheep: '🐑', monkey: '🐵', squirrel: '🐿️', mouse: '🐭', rabbit: '🐰', bird: '🐦', chicken: '🐔', duck: '🦆', goose: '🪿', turtle: '🐢',
}
export const petEmoji = (p: PetChoice) => EMOJI[p.species] ?? '🐾'

/** วงล้อคำสั่งเมื่อคลิกสัตว์เลี้ยง: กอด · ให้อาหาร · อุ้ม · พาไปนอน (อุ้มอยู่ = วางลง) */
export function openPetWheel(key: string, pet: PetChoice, x: number, y: number) {
  const g = useGame.getState()
  const inv = g.save?.inventory ?? {}
  const hasFood = (inv.feed ?? 0) > 0 || (inv.treat ?? 0) > 0
  const carrying = useCarry.getState().key === key
  const busy = !!useCarry.getState().key && !carrying
  const big = !canCarry(pet)
  const hug = { id: 'hug', label: 'กอด', icon: '🤗', run: () => { g.doGesture('offer', 1600); doSkill(key, 'hug') } }
  const feed = { id: 'feed', label: 'ให้อาหาร', icon: '🍚', disabled: hasFood ? false : 'ไม่มีอาหารสัตว์/กล้วยในกระเป๋า', run: () => feedPet(key) }
  const options = carrying
    ? [
        { id: 'down', label: 'วางลง', icon: '🫳', run: () => putDown() },
        hug,
        feed,
        { id: 'how', label: 'พาไปนอน', icon: '🛏️', run: () => g.toast({ title: `เดินพา${pet.name}ไปที่ฟูกสัตว์/เตียง แล้วกด E วางให้นอน`, tone: 'info' }) },
      ]
    : [
        hug,
        feed,
        { id: 'carry', label: 'อุ้ม', icon: '🤲', disabled: big ? 'ตัวใหญ่เกินไป อุ้มไม่ไหว' : busy ? 'อุ้มตัวอื่นอยู่' : false, run: () => startCarry(key, pet) },
        { id: 'bed', label: 'พาไปนอน', icon: '🛏️', disabled: big ? 'ตัวใหญ่เกินไป อุ้มไม่ไหว' : busy ? 'อุ้มตัวอื่นอยู่' : false, run: () => startCarry(key, pet, 'bed') },
      ]
  openActionWheel(x, y, pet.name, petEmoji(pet), options)
}
