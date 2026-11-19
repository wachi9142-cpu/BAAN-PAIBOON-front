import type { PetChoice, PetSpecies } from '../content/pets'
import type { CallKind } from './synth'
import { audio } from './engine'

/**
 * เสียงร้องของสัตว์เลี้ยง — ทุกชนิดเลือกได้ 4 แบบ (เสียงสากลที่คนคุ้นเคย)
 * ไฟล์จริง (ถ้ามี) วางที่ public/audio/pet-<ชนิด>-<1..4>.mp3 · ไม่มีไฟล์ = ใช้เสียงสังเคราะห์
 */
export interface PetVoice {
  label: string
  kind: CallKind
  /** คูณความถี่ (<1 ทุ้ม, >1 แหลม) */
  pitch: number
  /** ร้องติดกันกี่ครั้ง */
  times?: number
}

const v = (label: string, kind: CallKind, pitch: number, times?: number): PetVoice => ({ label, kind, pitch, times })

/** ชุดทั่วไป: ทุ้ม · ปกติ · แหลม · ร้องรัว */
const basic = (kind: CallKind, words: string): PetVoice[] => [
  v(`${words} (ทุ้ม)`, kind, 0.8),
  v(`${words} (ปกติ)`, kind, 1),
  v(`${words} (แหลม)`, kind, 1.35),
  v(`${words} รัว ๆ`, kind, 1.1, 3),
]

export const PET_VOICES: Record<PetSpecies, PetVoice[]> = {
  dog: [v('โฮ่ง ๆ (หมาใหญ่)', 'bark', 0.7), v('บ็อก ๆ (หมากลาง)', 'bark', 1), v('แง่ง ๆ (หมาเล็ก)', 'bark', 1.7), v('หอน อู้ว~', 'howl', 1)],
  cat: [v('เหมียว', 'meow', 1), v('เมี้ยว (ลูกแมว)', 'meow', 1.45), v('แง้ว (เสียงทุ้ม)', 'meow', 0.75), v('ครางครืด ๆ', 'purr', 1)],
  buffalo: [v('มอ~ (ทุ้ม)', 'moo', 0.6), v('มอ~', 'moo', 0.75), v('มอ (ลูกควาย)', 'moo', 1.4), v('มอ มอ', 'moo', 0.9, 2)],
  cow: [v('มอ~ (ทุ้ม)', 'moo', 0.85), v('มอ~', 'moo', 1.05), v('มอ (ลูกวัว)', 'moo', 1.6), v('มอ มอ', 'moo', 1.1, 2)],
  pig: [v('อู๊ด (ทุ้ม)', 'oink', 0.8), v('อู๊ด อู๊ด', 'oink', 1), v('อี๊ด (ลูกหมู)', 'oink', 1.6), v('อู๊ด รัว ๆ', 'oink', 1.1, 3)],
  goat: basic('bleat', 'แบะ ๆ'),
  sheep: [v('แบ๊~ (ทุ้ม)', 'bleat', 0.75), v('แบ๊~', 'bleat', 0.95), v('แบ๊ (ลูกแกะ)', 'bleat', 1.4), v('แบ๊ แบ๊', 'bleat', 1, 2)],
  monkey: [v('อู๊ก อ๊าก (ทุ้ม)', 'chatter', 0.75), v('อู๊ก อ๊าก', 'chatter', 1), v('เจี๊ยก ๆ (แหลม)', 'chatter', 1.5), v('ร้องรัว ๆ', 'chatter', 1.1, 3)],
  squirrel: basic('squeak', 'จี๊ด ๆ'),
  mouse: [v('จี๊ด (ทุ้ม)', 'squeak', 0.75), v('จี๊ด ๆ', 'squeak', 1), v('จิ๊ด (แหลม)', 'squeak', 1.3), v('จี๊ด รัว ๆ', 'squeak', 1, 3)],
  rabbit: [v('ฟุดฟิด (เบา ๆ)', 'squeak', 0.55), v('จี๊ด ๆ', 'squeak', 0.8), v('ครางครืด', 'purr', 1.6), v('ฟึ่ด (ขู่)', 'hiss', 1)],
  bird: [v('จิ๊บ ๆ (ทุ้ม)', 'chirp', 0.8), v('จิ๊บ ๆ', 'chirp', 1), v('จี๊ด ๆ (แหลม)', 'chirp', 1.25), v('ร้องเพลง', 'chirp', 1.1, 3)],
  chicken: [v('กุ๊ก ๆ', 'cluck', 1), v('กุ๊ก ๆ (เสียงสูง)', 'cluck', 1.3), v('เจี๊ยบ ๆ (ลูกเจี๊ยบ)', 'chickPeep', 1), v('ขัน เอ้กอี้เอ้กเอ้ก', 'crow', 1), v('แม่ไก่เรียกลูก กุ๊ก ๆ ๆ', 'henCall', 1)],
  duck: [v('ก๊าบ (ทุ้ม)', 'quack', 0.8), v('ก๊าบ ก๊าบ', 'quack', 1), v('แก๊บ (ลูกเป็ด)', 'quack', 1.5), v('ก๊าบ รัว ๆ', 'quack', 1, 3)],
  goose: [v('แฮ่ก (ทุ้ม)', 'honk', 0.85), v('แฮ่ก แฮ่ก', 'honk', 1), v('แฮ่ก (แหลม)', 'honk', 1.25), v('ขู่ ฟ่อ!', 'hiss', 0.8)],
  turtle: [v('ฟ่อ (เบา)', 'hiss', 1.4), v('ฟ่อ', 'hiss', 1), v('ฟ่อ (ทุ้ม)', 'hiss', 0.6), v('ฟ่อ ฟ่อ', 'hiss', 1, 2)],
}

export const voicesFor = (species: PetSpecies) => PET_VOICES[species]

/** เล่นเสียงร้องของสัตว์เลี้ยงตามเสียงที่เลือกไว้ (voice) */
export function playPetSound(pet: Pick<PetChoice, 'species' | 'voice'>, volume = 0.7, voice = pet.voice ?? 0) {
  const list = PET_VOICES[pet.species]
  const c = list[Math.min(Math.max(0, voice), list.length - 1)]
  void audio.playCallOrFile(`pet-${pet.species}-${voice + 1}.mp3`, c.kind, volume, c.pitch, c.times ?? 1)
}
