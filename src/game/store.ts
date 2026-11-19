import type { TreeState, GroundDrop } from './treeTypes'
import type { PlacedStructure, StructureId } from './content/structures'
import { bagSlots, slotsUsed, type ItemId } from './content/items'
import { emptyBed, GARDEN_BEDS, type BedState } from './content/garden'
import { create } from 'zustand'
import type { Appearance } from './content/appearance'
import type { PetChoice } from './content/pets'
import { SPAWN, STARTING_PLOT_ID } from './content/village'
import { clearSaves, listSaves, loadLatest, writeSave, type Envelope, type SaveReason } from './save/localSave'
import { cloudEnabled, flushOutbox, queueForUpload, type CloudStatus } from './save/cloudSync'
import { playCoinSound } from './audio/coin'

/**
 * SaveData = ข้อมูลที่ต้องเก็บถาวร (เซฟเกม)
 * เก็บในเครื่อง (3 ช่องหมุนเวียน) + คิวส่งขึ้นเซิร์ฟเวอร์ (BAAN-PAIBOON-back)
 * เมื่อเปลี่ยนรูปแบบ ให้เพิ่ม SAVE_VERSION และเขียน migrateSave ด้านล่าง
 */
export const SAVE_VERSION = 1

export interface PlayerProfile {
  name: string
  appearance: Appearance
  /** สัตว์เลี้ยงที่พาไปด้วย (null = ไม่มี) */
  pet: PetChoice | null
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
  /** ค่าสถานะ 0–100 — ลดลงเฉพาะตอนเล่น (ออกจากเกมแล้วไม่ลด) */
  stats: PlayerStats
  /** ความผูกพันกับสัตว์เลี้ยง (จำนวนหัวใจ) */
  petHearts: number
  /** จูงสัตว์เลี้ยงอยู่หรือไม่ */
  petLeashed: boolean
  /** ของในกระเป๋า (จำนวนรวมต่อชนิด) */
  inventory: Partial<Record<ItemId, number>>
  /** ระดับกระเป๋า (ยิ่งสูงยิ่งมีช่องมาก) */
  bagLevel: number
  /** สัตว์ที่เก็บได้ (สมุดสะสม) */
  collection: CaughtAnimal[]
  /** สัตว์เลี้ยงตัวแรกที่เลือกตอนสร้างตัวละคร (ไม่หายแม้สลับตัวที่เดินตาม) */
  homePet: PetChoice | null
  /** ทีมสัตว์เลี้ยง 9 ช่อง (กุญแจ: 'home' หรือ uid · '' = ช่องว่าง) */
  party?: string[]
  /** กิจกรรมเทศกาลที่ทำแล้ว (วันที่:กิจกรรม · ปี:เทศกาล) */
  festivalLog?: Record<string, boolean>
  /** สภาพอากาศตอนนี้ (โลกมีวงจรของตัวเอง) */
  weather?: import('./weather').WeatherSave
  /** หนังสือเมนูส่วนตัว: การตกแต่ง + โครงสร้าง */
  book?: import('./bookStyle').BookStyle
  /** สถานะรายตัวของสัตว์ (การ์ดสัตว์เลี้ยง) */
  petCare?: Record<string, import('./petCare').PetCare>
  /** สัตว์ที่เรียกออกมาเดินตาม (สูงสุด 3 · ตัวแรก = ตัวหลัก) */
  activePets?: string[]
  /** จำนวนครั้งที่แปะทองพระประธาน (เห็นทองบนองค์พระเพิ่มขึ้น) */
  goldLeaf?: number
  /** ภารกิจที่รับจากชาวบ้าน (ยังไม่เสร็จ) */
  quests: QuestState[]
  questsDone?: number
  /** แปลงผักสวนครัวหน้าบ้าน (ลำดับตาม GARDEN_BEDS) */
  garden: BedState[]
  /** สิ่งปลูกสร้างที่วางเองในที่ดิน */
  structures: PlacedStructure[]
  /** คลังของ: สิ่งปลูกสร้างที่เก็บไว้ (นำกลับมาวางใหม่ได้โดยไม่เสียวัตถุดิบ) */
  storedStructures?: Partial<Record<StructureId, number>>
  /** ของในกล่องเก็บของ (ตาม uid ของกล่อง) */
  chests: Record<string, Partial<Record<ItemId, number>>>
  /** ต้นไม้ที่ถูกฟัน/โค่น (ตามลำดับใน TREES) */
  trees: Record<string, TreeState>
  /** ของที่ร่วงอยู่บนพื้น รอเดินไปเก็บ */
  drops: GroundDrop[]
  /** สีอัญมณีบนคฑา (ตกแต่ง) */
  wandGem?: 'green' | 'yellow' | 'red' | 'purple'
  /** หีบสมบัติที่เปิดแล้ว (id → นาทีสัมบูรณ์ในเกมที่เปิด) */
  chestsOpened?: Record<string, number>
  /** ดอกบัวที่เก็บแล้ว (id → นาทีสัมบูรณ์ที่เก็บ) */
  lotusPicked?: Record<string, number>
  /** อ่านประกาศบนบอร์ดแต่ละจุดล่าสุดวันที่ */
  boardSeen?: Record<string, number>
  /** เส้นทางไหม (สวนหม่อน กระด้ง สาว ทอ ตัดเย็บ) — ดู game/silk.ts */
  silk?: import('./silk').SilkSave
  /** ป่าดงลึก + ศาลเก่า + ตำนานที่ฟังแล้ว — ดู game/forest.ts */
  forest?: import('./forest').ForestSave
  /** อานสัตว์ที่สร้างแล้ว (id) — ดู game/saddles.ts */
  saddles?: string[]
  /** เช็กอินรายวัน (ตามวันจริงของเครื่อง) — ดู game/checkin.ts */
  checkin?: import('./checkin').CheckinSave
  /** เซียมซี: วันที่เสี่ยงล่าสุด · เลขที่ได้แต่ยังไม่ได้หยิบใบ · ประวัติทั้งหมด */
  siamsi?: {
    lastDrawDay?: number
    pending?: SiamsiDraw
    history: SiamsiDraw[]
  }
}

export interface SiamsiDraw {
  week: number
  day: number
  cup: 0 | 1 | 2
  no: number
  /** หยิบใบคำทำนายมาอ่านแล้ว (ได้โบนัสแล้ว) */
  read?: boolean
}

export interface QuestState {
  npcId: string
  kind: 'bring' | 'catch'
  item?: ItemId
  species?: PetChoice['species']
  qty: number
  /** จำนวนสัตว์ในสมุดตอนรับภารกิจ (ภารกิจเก็บสัตว์) */
  startCount?: number
  /** งานจากบอร์ดประกาศ: หัวข้อ · ค่าจ้าง · ของแถม · ส่งภายในวันที่ */
  title?: string
  coins?: number
  bonus?: { item: ItemId; qty: number }
  until?: number
}

export interface CaughtAnimal {
  uid: string
  pet: PetChoice
  /** วันในเกมที่เก็บได้ */
  day: number
}

/** ท่าทางชั่วคราวของผู้เล่น (ในวัด) */
export type Gesture = 'wai' | 'prostrate' | 'shake' | 'offer' | 'whistle' | 'sit' | 'hang' | 'balance' | 'lie' | 'shower' | 'cook' | 'bathe'

export interface GatherTarget {
  kind: 'tree' | 'rock'
  index: number
}

export interface PlayerStats {
  health: number
  hunger: number
  thirst: number
  fun: number
}

export const DEFAULT_STATS: PlayerStats = { health: 100, hunger: 85, thirst: 85, fun: 70 }
export const MAX_PET_HEARTS = 10

export type Screen = 'title' | 'create' | 'pet' | 'house' | 'world'

export interface Toast {
  id: number
  title: string
  body?: string
  tone?: 'info' | 'success' | 'discover' | 'warn'
}

export type SaveStatus = 'idle' | 'saved' | 'error'

/** ใช้ตรวจว่าเกมปิดไม่สมบูรณ์ (ไฟดับ/ปิดแท็บกะทันหัน) */
const SESSION_FLAG = 'baan-paiboon-session-open'

/** แปลงผัก: ครบตามจำนวนแปลง · เซฟเก่าที่ยังไม่มีแปลง ได้เมล็ดผักบุ้ง/กะเพราติดกระเป๋าไว้เริ่มปลูก */
function withGarden(data: SaveData): Pick<SaveData, 'garden' | 'inventory'> {
  const inv = { ...(data.inventory ?? {}) }
  if (!data.garden) {
    const gift: [ItemId, number][] = [['seed_morningglory', 4], ['seed_basil', 2]]
    for (const [id, q] of gift) {
      const test = { ...inv, [id]: (inv[id] ?? 0) + q }
      if (slotsUsed(test) <= bagSlots(data.bagLevel ?? 0)) Object.assign(inv, test)
    }
  }
  const garden = GARDEN_BEDS.map((_, i) => data.garden?.[i] ?? emptyBed())
  return { garden, inventory: inv }
}

/** เลิกใช้ไม้คฑาจับสัตว์ (19 พ.ย. 2569): ใครมีคฑาอยู่ แลกเป็นสวิง + กรงดักสัตว์ให้อัตโนมัติ */
function swapWand(inv: SaveData['inventory']): SaveData['inventory'] {
  if (!inv?.wand) return inv
  const { wand: _w, ...rest } = inv
  void _w
  return { ...rest, net: Math.max(1, rest.net ?? 0), trap_cage: Math.max(1, rest.trap_cage ?? 0) }
}

function migrateSave(data: SaveData): SaveData {
  // v1 เป็นรุ่นแรก — เติมค่าเริ่มต้นให้ฟิลด์ที่อาจขาด
  return {
    ...data,
    player: { ...data.player, pet: data.player.pet ?? null },
    playSeconds: data.playSeconds ?? 0,
    stats: { ...DEFAULT_STATS, ...data.stats },
    petHearts: data.petHearts ?? 0,
    petLeashed: data.petLeashed ?? false,
    bagLevel: data.bagLevel ?? 0,
    collection: data.collection ?? [],
    quests: data.quests ?? [],
    ...withGarden({ ...data, inventory: swapWand(data.inventory) }),
    structures: data.structures ?? [],
    chests: data.chests ?? {},
    trees: data.trees ?? {},
    drops: data.drops ?? [],
    homePet: data.homePet !== undefined ? data.homePet : (data.player.pet ?? null),
    version: SAVE_VERSION,
  }
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
  /** สิ่งที่เก็บได้ใกล้ตัว (ต้นไม้/กองหิน) */
  gatherTarget: GatherTarget | null
  /** สัตว์ที่อยู่ใกล้พอจะเก็บ (id จุดเกิด) */
  wildTarget: string | null
  /** ยืนอยู่หน้าพระประธาน (กด E กราบพระได้) */
  nearWorship: boolean
  setNearWorship: (v: boolean) => void
  /** กำลังขี่สัตว์เลี้ยง (ควาย/วัว) */
  riding: boolean
  setRiding: (v: boolean) => void
  /** ท่าทางชั่วคราวของผู้เล่น (เช่น ไหว้) */
  gesture: Gesture | null
  doGesture: (g: Gesture, ms?: number) => void
  /** วันที่กราบพระครั้งล่าสุด (ได้ค่าสถานะวันละครั้ง) */
  lastWorshipDay: number
  setWildTarget: (id: string | null) => void
  setGatherTarget: (t: GatherTarget | null) => void

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
  /** ได้/เสียเงิน: เล่นเสียงเหรียญ แสดง +X บาท (รวม Y) แล้วบันทึกทันที */
  addCoins: (amount: number, reason?: string) => void
  /** ปรับค่าสถานะ (ค่าบวก/ลบ) จำกัดอยู่ใน 0–100 */
  changeStats: (delta: Partial<PlayerStats>) => void
  addPetHeart: () => void
  setPetLeashed: (v: boolean) => void
  /** เปลี่ยนการแต่งตัวระหว่างเล่น (บันทึกทันที) */
  updateAppearance: (a: Appearance) => void
  /** หยุดเกมชั่วคราว (เปิดเมนู / กดพัก / สลับไปหน้าต่างอื่น) — ไม่ถูกบันทึก */
  paused: boolean
  setPaused: (v: boolean) => void
  /** ป้ายเงินลอยขึ้นบนจอ */
  moneyPops: { id: number; amount: number; total: number }[]
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
  gatherTarget: null,
  wildTarget: null,
  nearWorship: false,
  setNearWorship: (nearWorship) => {
    if (get().nearWorship !== nearWorship) set({ nearWorship })
  },
  riding: false,
  setRiding: (riding) => set({ riding }),
  gesture: null,
  doGesture: (gesture, ms = 2600) => {
    set({ gesture })
    window.setTimeout(() => {
      if (get().gesture === gesture) set({ gesture: null })
    }, ms)
  },
  lastWorshipDay: -1,
  setWildTarget: (wildTarget) => {
    if (get().wildTarget !== wildTarget) set({ wildTarget })
  },
  setGatherTarget: (gatherTarget) => {
    const cur = get().gatherTarget
    if (cur?.kind !== gatherTarget?.kind || cur?.index !== gatherTarget?.index) set({ gatherTarget })
  },

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
      inventory: { seed_morningglory: 4, seed_basil: 2 },
      bagLevel: 0,
      collection: [],
      quests: [],
      garden: GARDEN_BEDS.map(emptyBed),
      structures: [],
      chests: {},
      trees: {},
      drops: [],
      homePet: draft.pet ?? null,
      day: 1,
      minuteOfDay: STARTING_MINUTE,
      position: [...SPAWN],
      heading: Math.PI,
      discoveredPlaceIds: [],
      playSeconds: 0,
      stats: { ...DEFAULT_STATS },
      petHearts: 0,
      petLeashed: false,
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

  moneyPops: [],
  paused: false,
  setPaused: (paused) => {
    if (get().paused === paused) return
    set({ paused })
    // พักเกม = บันทึกให้เลย (ผู้เล่นอาจลุกไปทำอย่างอื่นนาน)
    if (paused && get().save) get().saveNow('auto')
  },

  addCoins: (amount, reason) => {
    const save = get().save
    if (!save || amount === 0) return
    const total = Math.max(0, save.coins + amount)
    set({ save: { ...save, coins: total }, dirty: true })
    const id = toastSeq++
    set({ moneyPops: [...get().moneyPops.slice(-2), { id, amount, total }] })
    setTimeout(() => set({ moneyPops: get().moneyPops.filter((p) => p.id !== id) }), 2600)
    if (amount > 0) playCoinSound()
    if (reason) get().toast({ title: reason, body: `${amount > 0 ? 'ได้รับ' : 'จ่าย'} ${Math.abs(amount).toLocaleString('th-TH')} บาท · รวม ${total.toLocaleString('th-TH')} บาท`, tone: 'success' })
    // เหตุการณ์สำคัญ: ได้รับหรือใช้เงิน → บันทึกทันที
    get().saveNow('event')
  },

  changeStats: (delta) => {
    const save = get().save
    if (!save) return
    const clamp = (v: number) => Math.max(0, Math.min(100, v))
    const st = save.stats
    set({
      save: {
        ...save,
        stats: {
          health: clamp(st.health + (delta.health ?? 0)),
          hunger: clamp(st.hunger + (delta.hunger ?? 0)),
          thirst: clamp(st.thirst + (delta.thirst ?? 0)),
          fun: clamp(st.fun + (delta.fun ?? 0)),
        },
      },
      dirty: true,
    })
  },

  addPetHeart: () => {
    const save = get().save
    if (!save || save.petHearts >= MAX_PET_HEARTS) return
    set({ save: { ...save, petHearts: save.petHearts + 1 }, dirty: true })
    get().toast({ title: `💗 ${save.player.pet?.name ?? 'สัตว์เลี้ยง'} รักคุณมากขึ้น`, body: `ความผูกพัน ${save.petHearts + 1}/${MAX_PET_HEARTS} หัวใจ`, tone: 'discover' })
  },

  updateAppearance: (appearance) => {
    const save = get().save
    if (!save) return
    set({ save: { ...save, player: { ...save.player, appearance } }, dirty: true })
    get().saveNow('event')
  },

  setPetLeashed: (petLeashed) => {
    const save = get().save
    if (!save) return
    set({ save: { ...save, petLeashed }, dirty: true })
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
    set({ screen: 'title', toasts: [], nearbyPlaceId: null, flushWorld: null, riding: false })
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
