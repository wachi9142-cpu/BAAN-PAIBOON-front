import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** การตั้งค่าเกม (ผูกกับเครื่อง ไม่ใช่ข้อมูลเซฟ) */
interface Settings {
  mouseSensitivity: number
  showLabels: boolean
  autoSave: boolean
  /** บันทึกอัตโนมัติทุกกี่นาที */
  autoSaveMinutes: number
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
      set: (p) => set(p),
    }),
    { name: 'baan-paiboon-settings' },
  ),
)
