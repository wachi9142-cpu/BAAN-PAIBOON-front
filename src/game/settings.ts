import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SoundPeriod } from './content/soundscape'

/** การตั้งค่าเกม (ผูกกับเครื่อง ไม่ใช่ข้อมูลเซฟ) */
interface Settings {
  mouseSensitivity: number
  showLabels: boolean
  autoSave: boolean
  /** บันทึกอัตโนมัติทุกกี่นาที */
  autoSaveMinutes: number
  // ---- เสียง ----
  musicOn: boolean
  musicVolume: number
  ambienceVolume: number
  sfxVolume: number
  /** ทดลองฟังเสียงของช่วงเวลาอื่น ('auto' = ตามเวลาในเกม) */
  soundPreview: 'auto' | SoundPeriod['id']
  set: (p: Partial<Omit<Settings, 'set'>>) => void
}

export const AUTO_SAVE_CHOICES = [1, 2, 5, 10]

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      mouseSensitivity: 1,
      showLabels: true,
      autoSave: true,
      autoSaveMinutes: 2,
      musicOn: true,
      musicVolume: 0.5,
      ambienceVolume: 0.8,
      sfxVolume: 1,
      soundPreview: 'auto',
      set: (p) => set(p),
    }),
    {
      name: 'baan-paiboon-settings',
      // ไม่จำค่าทดลองฟัง เปิดเกมใหม่ให้กลับเป็นตามเวลาจริงเสมอ
      partialize: ({ soundPreview: _ignored, ...rest }) => rest,
    },
  ),
)
