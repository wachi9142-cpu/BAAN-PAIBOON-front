// เสียงตามช่วงเวลาในหมู่บ้าน — ข้อมูลล้วน ปรับ/เพิ่มได้ที่นี่
// ไฟล์เสียงวางที่ public/audio/<file> (ดูรายชื่อใน public/audio/README.md)
// ถ้ายังไม่มีไฟล์ และมี synth กำหนดไว้ เกมจะสังเคราะห์เสียงแทนชั่วคราว

export type SynthKind = 'crickets' | 'birds' | 'wind' | 'insects'

/** เสียงวนต่อเนื่อง (ambience / เพลง) */
export interface LoopLayer {
  id: string
  bus: 'music' | 'ambience'
  file: string
  volume: number
  synth?: SynthKind
}

/** เสียงที่ดังเป็นช่วง ๆ เช่น ไก่ขัน มอเตอร์ไซค์ไกล ๆ */
export interface OneShotLayer {
  id: string
  file: string
  volume: number
  /** สุ่มเว้นระยะระหว่าง [min, max] วินาที */
  every: [number, number]
}

export interface SoundPeriod {
  id: 'dawn' | 'morning' | 'day' | 'evening' | 'night'
  label: string
  /** ชั่วโมงเริ่ม (รวม) – สิ้นสุด (ไม่รวม) ข้ามเที่ยงคืนได้ */
  from: number
  to: number
  loops: LoopLayer[]
  oneShots: OneShotLayer[]
}

export const SOUND_PERIODS: SoundPeriod[] = [
  {
    id: 'dawn',
    label: 'เช้ามืด (03:00–05:00)',
    from: 3,
    to: 5,
    loops: [
      { id: 'amb-dawn', bus: 'ambience', file: 'amb-dawn.mp3', volume: 0.35, synth: 'wind' },
      { id: 'crickets-fading', bus: 'ambience', file: 'amb-night-crickets.mp3', volume: 0.15, synth: 'crickets' },
    ],
    oneShots: [{ id: 'rooster', file: 'sfx-rooster.mp3', volume: 0.8, every: [25, 70] }],
  },
  {
    id: 'morning',
    label: 'เช้า – สาย (05:00–11:00)',
    from: 5,
    to: 11,
    loops: [
      { id: 'amb-birds', bus: 'ambience', file: 'amb-morning-birds.mp3', volume: 0.45, synth: 'birds' },
      { id: 'amb-insects', bus: 'ambience', file: 'amb-insects.mp3', volume: 0.12, synth: 'insects' },
      { id: 'music-morning', bus: 'music', file: 'music-morning.mp3', volume: 0.35 },
    ],
    oneShots: [{ id: 'rooster-late', file: 'sfx-rooster.mp3', volume: 0.5, every: [90, 240] }],
  },
  {
    id: 'day',
    label: 'กลางวัน (11:00–16:00)',
    from: 11,
    to: 16,
    loops: [
      { id: 'amb-day', bus: 'ambience', file: 'amb-day.mp3', volume: 0.35, synth: 'wind' },
      { id: 'amb-birds-day', bus: 'ambience', file: 'amb-morning-birds.mp3', volume: 0.2, synth: 'birds' },
      { id: 'music-day', bus: 'music', file: 'music-day.mp3', volume: 0.35 },
    ],
    oneShots: [
      { id: 'motorbike-far', file: 'sfx-motorbike-far.mp3', volume: 0.3, every: [45, 120] },
      { id: 'villagers-far', file: 'sfx-villagers-far.mp3', volume: 0.25, every: [60, 150] },
    ],
  },
  {
    id: 'evening',
    label: 'เย็น – ค่ำ (16:00–19:00)',
    from: 16,
    to: 19,
    loops: [
      { id: 'amb-evening', bus: 'ambience', file: 'amb-evening.mp3', volume: 0.3, synth: 'wind' },
      { id: 'amb-birds-eve', bus: 'ambience', file: 'amb-morning-birds.mp3', volume: 0.12, synth: 'birds' },
      { id: 'music-evening', bus: 'music', file: 'music-evening.mp3', volume: 0.3 },
    ],
    oneShots: [],
  },
  {
    id: 'night',
    label: 'กลางคืน (19:00–03:00)',
    from: 19,
    to: 3,
    loops: [
      { id: 'amb-crickets', bus: 'ambience', file: 'amb-night-crickets.mp3', volume: 0.55, synth: 'crickets' },
      { id: 'amb-insects-night', bus: 'ambience', file: 'amb-insects.mp3', volume: 0.1, synth: 'insects' },
      { id: 'music-night', bus: 'music', file: 'music-night.mp3', volume: 0.15 },
    ],
    oneShots: [],
  },
]

/** เพลงในบ้าน (ใช้เมื่อมีระบบเข้าบ้านใน Part 3) — แทนที่เพลงของช่วงเวลา */
export const INDOOR_MUSIC: LoopLayer = { id: 'music-home', bus: 'music', file: 'music-home.mp3', volume: 0.3 }

export function periodAt(minuteOfDay: number): SoundPeriod {
  const h = minuteOfDay / 60
  return (
    SOUND_PERIODS.find((p) => (p.from < p.to ? h >= p.from && h < p.to : h >= p.from || h < p.to)) ?? SOUND_PERIODS[1]
  )
}
