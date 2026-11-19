import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SoundPeriod } from './content/soundscape'

/** การตั้งค่าเกม (ผูกกับเครื่อง ไม่ใช่ข้อมูลเซฟ) */
interface Settings {
  mouseSensitivity: number
  /** โทนภาพนุ่มตา 0 (สีจัดเดิม) – 1 (นุ่มที่สุด) */
  softLook?: number
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
  /** ขนาดหน้าจอเกม: ใหญ่ = เต็มหน้าต่าง, กลาง = กรอบกลางจอ (เต็มจอจริงใช้ Fullscreen API แยก) */
  displaySize: 'large' | 'medium'
  /** ความเข้มของแถบสีม่วงโปร่งแสงตอนเปิดเมนู Esc (0.4–0.9) */
  overlayOpacity: number
  /** สีแถบเมนู Esc ที่ผู้เล่นชอบ */
  menuColor: MenuColor
  set: (p: Partial<Omit<Settings, 'set'>>) => void
}

export type MenuColor = 'purple' | 'blue' | 'pink'
/** สีแถบเมนู: [สีหลัก rgb, ปุ่มเข้ม rgb, สีตัวอักษรบนปุ่มที่เลือก] */
export const MENU_COLORS: Record<MenuColor, { label: string; main: string; dark: string; ink: string; swatch: string }> = {
  purple: { label: 'ม่วงลาเวนเดอร์', main: '139, 92, 246', dark: '59, 22, 120', ink: '#4c1d95', swatch: '#8B5CF6' },
  blue: { label: 'ฟ้า', main: '56, 152, 236', dark: '14, 64, 120', ink: '#0c4a8a', swatch: '#3898EC' },
  pink: { label: 'ชมพู', main: '236, 102, 170', dark: '128, 24, 84', ink: '#9d1d63', swatch: '#EC66AA' },
}

export const AUTO_SAVE_CHOICES = [1, 2, 5, 10]

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      mouseSensitivity: 1,
      softLook: 0.7,
      showLabels: true,
      autoSave: true,
      autoSaveMinutes: 2,
      musicOn: true,
      musicVolume: 0.5,
      ambienceVolume: 0.8,
      sfxVolume: 1,
      soundPreview: 'auto',
      displaySize: 'large',
      overlayOpacity: 0.7,
      menuColor: 'purple',
      set: (p) => set(p),
    }),
    {
      name: 'baan-paiboon-settings',
      // ไม่จำค่าทดลองฟัง เปิดเกมใหม่ให้กลับเป็นตามเวลาจริงเสมอ
      partialize: ({ soundPreview: _ignored, ...rest }) => rest,
    },
  ),
)
