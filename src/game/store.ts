import { create } from 'zustand'
import type { Appearance } from './content/appearance'
import { SPAWN, STARTING_PLOT_ID } from './content/village'
import { clearSaves, listSaves, loadLatest, writeSave, type Envelope, type SaveReason } from './save/localSave'
import { cloudEnabled, flushOutbox, queueForUpload, type CloudStatus } from './save/cloudSync'

/**
 * SaveData = ข้อมูลที่ต้องเก็บถาวร (เซฟเกม)
 * เก็บในเครื่อง (3 ช่องหมุนเวียน) + คิวส่งขึ้นเซิร์ฟเวอร์ (BAAN-PAIBOON-back)
 * เมื่อเปลี่ยนรูปแบบ ให้เพิ่ม SAVE_VERSION และเขียน migrateSave ด้านล่าง
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
  /** เวลาเล่นสะสม (วินาที) */
  playSeconds: number
}

export type Screen = 'title' | 'create' | 'house' | 'world'

export interface Toast {
  id: number
  title: string
  body?: string
  tone?: 'info' | 'success' | 'discover' | 'warn'
}

export type SaveStatus = 'idle' | 'saved' | 'error'

/** ใช้ตรวจว่าเกมปิดไม่สมบูรณ์ (ไฟดับ/ปิดแท็บกะทันหัน) */
const SESSION_FLAG = 'baan-paiboon-session-open'

function migrateSave(data: SaveData): SaveData {
  // v1 เป็นรุ่นแรก — เติมค่าเริ่มต้นให้ฟิลด์ที่อาจขาด
  return { ...data, playSeconds: data.playSeconds ?? 0, version: SAVE_VERSION }
}

interface GameState {
  save: SaveData | null
  /** มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก */
  dirty: boolean
  saveStatus: SaveStatus
  lastSavedAt: number | null
  lastSeq: number
  cloudStatus: CloudStatus
  /** ครั้งก่อนเกมปิดไม่สมบูรณ์ → แสดงข้อความกู้คืนที่หน้าหลัก */
  recoveredFrom: Envelope<SaveData> | null
  /** ฉาก 3D ลงทะเบียนไว้ เพื่อส่งตำแหน่งล่าสุดเข้าเซฟก่อนบันทึก */
  flushWorld: (() => void) | null

  screen: Screen
  draft: PlayerProfile | null
  toasts: Toast[]
  nearbyPlaceId: string | null

  goTo: (s: Screen) => void
  setDraft: (p: PlayerProfile) => void
  startNewLife: (houseDesignId: string) => void
  continueLife: () => void
  loadBackup: (seq: number) => void
  deleteSave: () => void
  updatePosition: (pos: [number, number], heading: number) => void
  discoverPlace: (id: string) => boolean
  setNearby: (id: string | null) => void
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  setFlushWorld: (fn: (() => void) | null) => void
  /** บันทึกทันที (ตรวจสอบว่าสำเร็จจริง) คืนค่า true ถ้าสำเร็จ */
  saveNow: (reason: SaveReason) => boolean
  /** บันทึกแล้วกลับหน้าหลัก คืนค่า false ถ้าบันทึกไม่สำเร็จ (ยังไม่ออก) */
  exitToTitle: (force?: boolean) => boolean
  syncCloud: () => Promise<void>
}

const STARTING_COINS = 200
const STARTING_MINUTE = 6 * 60 // ตื่นนอน 06:00

let toastSeq = 1

// ---------- โหลดเซฟตอนเปิดเกม ----------
const initial = loadLatest<SaveData>()
const crashed = localStorage.getItem(SESSION_FLAG) !== null && !!initial
localStorage.removeItem(SESSION_FLAG)

export const useGame = create<GameState>()((set, get) => ({
  save: initial ? migrateSave(initial.data) : null,
  dirty: false,
  saveStatus: initial ? 'saved' : 'idle',
  lastSavedAt: initial?.savedAt ?? null,
  lastSeq: initial?.seq ?? 0,
  cloudStatus: cloudEnabled() ? 'pending' : 'disabled',
  recoveredFrom: crashed ? initial : null,
  flushWorld: null,

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
      playSeconds: 0,
    }
    set({ save, draft: null, screen: 'world', toasts: [], dirty: true, recoveredFrom: null })
    enterWorld()
    get().saveNow('new')
    get().toast({
      title: `ยินดีต้อนรับสู่หมู่บ้านไพบูลย์ ${draft.name}`,
      body: 'บ้านใหม่ของคุณอยู่ทางตะวันออกเฉียงใต้ เดินตามซอยไปได้เลย',
      tone: 'success',
    })
  },

  continueLife: () => {
    const save = get().save
    if (!save) return
    set({ screen: 'world', toasts: [], recoveredFrom: null })
    enterWorld()
    get().toast({ title: `กลับมาแล้ว ${save.player.name}`, body: 'หมู่บ้านไพบูลย์ยังคงรอคุณอยู่', tone: 'info' })
  },

  loadBackup: (seq) => {
    const env = listSaves<SaveData>().find((e) => e.seq === seq)
    if (!env) return
    // เขียนเป็นเซฟใหม่ล่าสุด เพื่อไม่ให้ช่องอื่นถูกลบ และเล่นต่อจากจุดนี้
    set({ save: migrateSave(env.data), dirty: true })
    get().saveNow('manual')
    get().continueLife()
  },

  deleteSave: () => {
    clearSaves()
    set({ save: null, screen: 'title', draft: null, dirty: false, lastSavedAt: null, lastSeq: 0, saveStatus: 'idle', recoveredFrom: null })
  },

  updatePosition: (position, heading) => {
    const save = get().save
    if (!save) return
    const [ox, oz] = save.position
    if (Math.abs(ox - position[0]) < 0.01 && Math.abs(oz - position[1]) < 0.01 && Math.abs(save.heading - heading) < 0.01) return
    set({ save: { ...save, position, heading }, dirty: true })
  },

  discoverPlace: (id) => {
    const save = get().save
    if (!save || save.discoveredPlaceIds.includes(id)) return false
    set({ save: { ...save, discoveredPlaceIds: [...save.discoveredPlaceIds, id] }, dirty: true })
    // เหตุการณ์สำคัญ: เปลี่ยนพื้นที่/ค้นพบสถานที่
    get().saveNow('event')
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

  setFlushWorld: (flushWorld) => set({ flushWorld }),

  saveNow: (reason) => {
    get().flushWorld?.()
    const save = get().save
    if (!save) return false
    const env = writeSave(save, reason)
    if (!env) {
      // เซฟเก่าที่สมบูรณ์ยังอยู่ในช่องอื่น ไม่ถูกเขียนทับ
      set({ saveStatus: 'error' })
      return false
    }
    set({ saveStatus: 'saved', lastSavedAt: env.savedAt, lastSeq: env.seq, dirty: false })
    queueForUpload(env)
    void get().syncCloud()
    return true
  },

  exitToTitle: (force = false) => {
    const ok = get().saveNow('exit')
    if (!ok && !force) return false
    leaveWorld()
    set({ screen: 'title', toasts: [], nearbyPlaceId: null, flushWorld: null })
    return true
  },

  syncCloud: async () => {
    const status = await flushOutbox()
    set({ cloudStatus: status })
  },
}))

function enterWorld() {
  try {
    localStorage.setItem(SESSION_FLAG, String(Date.now()))
  } catch {
    /* ignore */
  }
}
function leaveWorld() {
  localStorage.removeItem(SESSION_FLAG)
}

/** ผู้เล่นกด "ออกจากเกม" และบันทึกสำเร็จแล้ว */
export function markCleanExit() {
  leaveWorld()
}

/** ปิดแท็บ/รีเฟรช: ถ้าบันทึกสำเร็จ ถือว่าออกอย่างปลอดภัย (ไม่ใช่เกมปิดกะทันหัน) */
export function saveOnUnload(): boolean {
  const ok = useGame.getState().saveNow('unload')
  if (ok) leaveWorld()
  return ok
}

// ---------- ซิงก์เมื่อกลับมาออนไลน์ ----------
window.addEventListener('online', () => void useGame.getState().syncCloud())
window.addEventListener('offline', () => {
  if (cloudEnabled()) useGame.setState({ cloudStatus: 'offline' })
})
void useGame.getState().syncCloud()

// ---------- helpers ----------
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

export function formatSavedAt(ts: number | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

export const SAVE_REASON_LABEL: Record<SaveReason, string> = {
  new: 'เริ่มชีวิตใหม่',
  manual: 'บันทึกเอง',
  auto: 'บันทึกอัตโนมัติ',
  event: 'เหตุการณ์สำคัญ',
  exit: 'ออกจากเกม',
  unload: 'ปิดหน้าต่าง',
}
