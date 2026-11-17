import type { PetSpecies } from '../content/pets'
import type { CallKind } from './synth'
import { audio } from './engine'

/**
 * เสียงร้องของสัตว์เลี้ยง — ไฟล์จริงวางที่ public/audio/pet-<ชนิด>.mp3
 * ถ้าไม่มีไฟล์: ใช้เสียงสังเคราะห์ (ถ้ามี) ไม่งั้นเงียบ
 */
const PET_CALLS: Record<PetSpecies, { file: string; synth?: CallKind }> = {
  dog: { file: 'pet-dog.mp3' },
  cat: { file: 'pet-cat.mp3', synth: 'meow' },
  buffalo: { file: 'pet-buffalo.mp3' },
  cow: { file: 'pet-cow.mp3' },
  pig: { file: 'pet-pig.mp3', synth: 'oink' },
  goat: { file: 'pet-goat.mp3', synth: 'bleat' },
  sheep: { file: 'pet-sheep.mp3', synth: 'bleat' },
  monkey: { file: 'pet-monkey.mp3' },
  squirrel: { file: 'pet-squirrel.mp3', synth: 'squeak' },
  mouse: { file: 'pet-mouse.mp3', synth: 'squeak' },
  rabbit: { file: 'pet-rabbit.mp3' },
  bird: { file: 'pet-bird.mp3', synth: 'chirp' },
  chicken: { file: 'pet-chicken.mp3', synth: 'cluck' },
  duck: { file: 'pet-duck.mp3', synth: 'quack' },
  goose: { file: 'pet-goose.mp3', synth: 'quack' },
  turtle: { file: 'pet-turtle.mp3' },
}

export function playPetSound(species: PetSpecies, volume = 0.7) {
  const c = PET_CALLS[species]
  void audio.playCallOrFile(c.file, c.synth, volume)
}
