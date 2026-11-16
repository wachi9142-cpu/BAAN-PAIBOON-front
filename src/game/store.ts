import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Appearance } from './content/appearance'
import { SPAWN, STARTING_PLOT_ID } from './content/village'

/**
 * SaveData = ข้อมูลที่ต้องเก็บถาวร (เซฟเกม)
 * ตอนนี้เก็บใน localStorage — อนาคตส่งก้อนเดียวกันนี้ไป BAAN-PAIBOON-back
 * เมื่อเปลี่ยนรูปแบบ ให้เพิ่ม SAVE_VERSION และเขียน migrate ด้านล่าง
 */
export const SAVE_VERSION = 1

export interface PlayerProfile {
  name: string
  appearance: Appearance
}

export interface SaveData {
  version: number
  createdAt: string
  player: PlayerProfile
  home: { plotId: string; houseDesignId: string }
  ownedPlotIds: string[]
  coins: number
  day: number
  /** นาทีนับจากเที่ยงคืน (0–1439) */
  minuteOfDay: number
  position: [number, number]
  heading: number
  discoveredPlaceIds: string[]
}

export type Screen = 'title' | 'create' | 'house' | 'world'

export interface Toast {
  id: number
  title: string
  body?: string
  tone?: 'info' | 'success' | 'discover'
}

interface GameState {
  save: SaveData | null
  screen: Screen
  /** ตัวละครที่กำลังสร้าง (ยังไม่ได้เซฟ) */
  draft: PlayerProfile | null
  toasts: Toast[]
  nearbyPlaceId: string | null

  goTo: (s: Screen) => void
  setDraft: (p: PlayerProfile) => void
  startNewLife: (houseDesignId: string) => void
  continueLife: () => void
  deleteSave: () => void
  updatePosition: (pos: [number, number], heading: number) => void
  discoverPlace: (id: string) => boolean
  setNearby: (id: string | null) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
}

const STARTING_COINS = 200
const STARTING_MINUTE = 6 * 60 // ตื่นนอน 06:00

let toastSeq = 1

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      save: null,
      screen: 'title',
      draft: null,
      toasts: [],
      nearbyPlaceId: null,

      goTo: (screen) => set({ screen }),
      setDraft: (draft) => set({ draft }),

      startNewLife: (houseDesignId) => {
        const draft = get().draft
        if (!draft) return
        const save: SaveData = {
          version: SAVE_VERSION,
          createdAt: new Date().toISOString(),
          player: draft,
          home: { plotId: STARTING_PLOT_ID, houseDesignId },
          ownedPlotIds: [STARTING_PLOT_ID],
          coins: STARTING_COINS,
          day: 1,
          minuteOfDay: STARTING_MINUTE,
          position: [...SPAWN],
          heading: Math.PI,
          discoveredPlaceIds: [],
        }
        set({ save, draft: null, screen: 'world', toasts: [] })
        get().toast({
          title: `ยินดีต้อนรับสู่หมู่บ้านไพบูลย์ ${draft.name}`,
          body: 'บ้านใหม่ของคุณอยู่ทางตะวันออกเฉียงใต้ เดินตามซอยไปได้เลย',
          tone: 'success',
        })
      },

      continueLife: () => {
        if (!get().save) return
        set({ screen: 'world', toasts: [] })
        get().toast({ title: `กลับมาแล้ว ${get().save!.player.name}`, body: 'หมู่บ้านไพบูลย์ยังคงรอคุณอยู่', tone: 'info' })
      },

      deleteSave: () => set({ save: null, screen: 'title', draft: null }),

      updatePosition: (position, heading) => {
        const save = get().save
        if (!save) return
        set({ save: { ...save, position, heading } })
      },

      discoverPlace: (id) => {
        const save = get().save
        if (!save || save.discoveredPlaceIds.includes(id)) return false
        set({ save: { ...save, discoveredPlaceIds: [...save.discoveredPlaceIds, id] } })
        return true
      },

      setNearby: (nearbyPlaceId) => {
        if (get().nearbyPlaceId !== nearbyPlaceId) set({ nearbyPlaceId })
      },

      toast: (t) => {
        const id = toastSeq++
        set({ toasts: [...get().toasts.slice(-3), { ...t, id }] })
        setTimeout(() => get().dismissToast(id), 5000)
      },
      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
    }),
    {
      name: 'baan-paiboon-save',
      version: SAVE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // เก็บเฉพาะเซฟ ไม่เก็บสถานะหน้าจอ/แจ้งเตือน
      partialize: (s) => ({ save: s.save }),
      migrate: (persisted) => persisted as { save: SaveData | null },
    },
  ),
)

export function formatClock(minuteOfDay: number) {
  const h = Math.floor(minuteOfDay / 60)
  const m = Math.floor(minuteOfDay % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function periodOfDay(minuteOfDay: number) {
  const h = minuteOfDay / 60
  if (h >= 5 && h < 11) return 'เช้า'
  if (h >= 11 && h < 16) return 'กลางวัน'
  if (h >= 16 && h < 19) return 'เย็น'
  return 'กลางคืน'
}
