import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** การตั้งค่าเกม (ผูกกับเครื่อง ไม่ใช่ข้อมูลเซฟ) */
interface Settings {
  mouseSensitivity: number
  showLabels: boolean
  shadows: boolean
  set: (p: Partial<Omit<Settings, 'set'>>) => void
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      mouseSensitivity: 1,
      showLabels: true,
      shadows: true,
      set: (p) => set(p),
    }),
    { name: 'baan-paiboon-settings' },
  ),
)
