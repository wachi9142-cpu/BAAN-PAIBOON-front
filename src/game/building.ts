/**
 * โหมดสร้าง (กด B): เลือกสิ่งปลูกสร้าง → คลิกพื้นในที่ดินของตัวเองเพื่อวาง (หักวัตถุดิบ)
 * โหมด "เก็บคืน" คลิกของที่วางแล้วเพื่อรื้อ ได้วัตถุดิบคืนครบ (ใช้ย้ายที่ได้)
 */
import { recordEdit } from './editHistory'
import { create } from 'zustand'
import { useGame } from './store'
import { canAfford } from './inventory'
import { bagSlots, ITEMS, slotsUsed, type Cost, type ItemId } from './content/items'
import { canPlace, CHEST_SLOTS, inTerritory, rectOf, STRUCTURES, type PlacedStructure, type StructureId } from './content/structures'

export type BuildTool = StructureId | 'remove'

interface BuildState {
  active: boolean
  tool: BuildTool | null
  rot: number
  /** ตำแหน่งเมาส์บนพื้น (ปัดเป็นช่อง 0.5 ม.) */
  hover: [number, number] | null
  /** ยืนใกล้สิ่งปลูกสร้างที่ใช้งานได้ (uid) */
  near: string | null
  /** เปิดกล่องเก็บของ (uid) */
  chestOpen: string | null
  /** เปิดจากการกดค้าง: วางครั้งเดียวแล้วปิดโหมดสร้าง */
  once: boolean
}
export const useBuild = create<BuildState>(() => ({ active: false, tool: null, rot: 0, hover: null, near: null, chestOpen: null, once: false }))

type Inv = Partial<Record<ItemId, number>>
const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' = 'info') => useGame.getState().toast({ title, body, tone })

export function toggleBuild(on?: boolean) {
  const g = useGame.getState()
  const s = useBuild.getState()
  const next = on ?? !s.active
  if (next && g.save) {
    const [px, pz] = g.save.position
    if (!inTerritory(px, pz, g.save.ownedPlotIds)) {
      toast('กลับไปที่บ้านของคุณก่อน', 'สร้าง/ย้ายของได้ในอาณาเขตของตัวเอง (บ้านตารัง–ยายเลียน หรือที่ดินของคุณ)', 'info')
      return
    }
  }
  useBuild.setState({ active: next, tool: next ? s.tool : null, hover: null, once: false })
  if (next) toast('🔨 โหมดสร้าง', 'เลือกของด้านล่าง แล้วคลิกพื้นเพื่อวาง · R หมุน · B หรือ Esc ออก', 'info')
}

export const rotateTool = () => useBuild.setState((s) => ({ rot: (s.rot + 1) % 4 }))

export const snap = (v: number) => Math.round(v * 2) / 2

function spend(inv: Inv, cost: Cost): Inv {
  const next = { ...inv }
  for (const [id, q] of Object.entries(cost)) {
    const k = id as ItemId
    next[k] = (next[k] ?? 0) - (q ?? 0)
    if ((next[k] ?? 0) <= 0) delete next[k]
  }
  return next
}

/** เหตุผลที่วางตรงที่ชี้ไม่ได้ (null = วางได้) */
export function placeProblem(tool: StructureId, x: number, z: number, rot: number) {
  const g = useGame.getState().save
  if (!g) return 'ยังไม่ได้เริ่มเกม'
  return canPlace(tool, x, z, rot, g.structures, g.ownedPlotIds)
}

export function placeAt(x: number, z: number) {
  const { tool, rot } = useBuild.getState()
  const g = useGame.getState()
  if (!g.save || !tool) return
  if (tool === 'remove') {
    const hit = structureAt(x, z)
    if (hit) removeStructure(hit.uid)
    return
  }
  const def = STRUCTURES[tool]
  const why = placeProblem(tool, x, z, rot)
  if (why) {
    toast('วางตรงนี้ไม่ได้', why, 'warn')
    return
  }
  // มีในคลัง: เอาออกมาวางได้เลย ไม่เสียวัตถุดิบ
  const stored = g.save.storedStructures?.[tool] ?? 0
  if (stored <= 0 && !canAfford(def.cost)) {
    toast('วัตถุดิบไม่พอ', 'ต้องใช้ ' + costText(def.cost), 'warn')
    return
  }
  const s: PlacedStructure = { uid: Math.random().toString(36).slice(2, 10), id: tool, x, z, rot }
  const save = stored > 0
    ? { ...g.save, storedStructures: { ...g.save.storedStructures, [tool]: stored - 1 }, structures: [...g.save.structures, s] }
    : { ...g.save, inventory: spend(g.save.inventory, def.cost), structures: [...g.save.structures, s] }
  recordEdit()
  useGame.setState({ save, dirty: true })
  g.saveNow('event')
  toast(`${def.icon} ${stored > 0 ? 'วาง' : 'สร้าง'}${def.name}แล้ว`, stored > 0 ? 'เอาออกจากคลังมาวาง' : def.note, 'success')
  if (useBuild.getState().once) useBuild.setState({ active: false, tool: null, hover: null, once: false })
}

export function structureAt(x: number, z: number) {
  const g = useGame.getState().save
  if (!g) return null
  return g.structures.find((s) => {
    const r = rectOf(s.id, s.x, s.z, s.rot)
    return x >= r.minX - 0.2 && x <= r.maxX + 0.2 && z >= r.minZ - 0.2 && z <= r.maxZ + 0.2
  }) ?? null
}

/** รื้อ: คืนวัตถุดิบครบ (ถ้ากระเป๋าพอใส่) */
export function removeStructure(uid: string) {
  const g = useGame.getState()
  if (!g.save) return
  const s = g.save.structures.find((t) => t.uid === uid)
  if (!s) return
  const def = STRUCTURES[s.id]
  const stored = g.save.chests[uid]
  if (stored && Object.values(stored).some((q) => (q ?? 0) > 0)) {
    toast('ในกล่องยังมีของอยู่', 'เอาของออกจากกล่องก่อนแล้วค่อยรื้อ', 'warn')
    return
  }
  const inventory = { ...g.save.inventory }
  for (const [id, q] of Object.entries(def.cost)) inventory[id as ItemId] = (inventory[id as ItemId] ?? 0) + (q ?? 0)
  if (slotsUsed(inventory) > bagSlots(g.save.bagLevel)) {
    toast('กระเป๋าเต็ม รับวัตถุดิบคืนไม่ได้', 'ขายหรือฝากของก่อน แล้วค่อยรื้อ', 'warn')
    return
  }
  const chests = { ...g.save.chests }
  delete chests[uid]
  recordEdit()
  useGame.setState({ save: { ...g.save, inventory, chests, structures: g.save.structures.filter((t) => t.uid !== uid) }, dirty: true })
  g.saveNow('event')
  toast(`รื้อ${def.name}แล้ว`, 'ได้วัตถุดิบคืน: ' + costText(def.cost), 'info')
}

export const costText = (c: Cost) =>
  Object.entries(c)
    .map(([id, q]) => `${ITEMS[id as ItemId].name} ${q}`)
    .join(' · ')

/** หาสิ่งปลูกสร้างที่ใช้งานได้ใกล้ที่สุด (โต๊ะประดิษฐ์ กล่องเก็บของ) */
export function findUsable(x: number, z: number): string | null {
  const g = useGame.getState().save
  if (!g) return null
  let best: string | null = null
  let bd = Infinity
  for (const s of g.structures) {
    if (!STRUCTURES[s.id].use) continue
    const r = rectOf(s.id, s.x, s.z, s.rot)
    const dx = Math.max(r.minX - x, 0, x - r.maxX)
    const dz = Math.max(r.minZ - z, 0, z - r.maxZ)
    const d = Math.hypot(dx, dz)
    if (d < 1.3 && d < bd) {
      bd = d
      best = s.uid
    }
  }
  return best
}

// ---------- กล่องเก็บของ ----------
/** ย้ายของ กระเป๋า ⇄ กล่อง */
export function moveItem(uid: string, id: ItemId, qty: number, toChest: boolean) {
  const g = useGame.getState()
  if (!g.save) return
  const bag = { ...g.save.inventory }
  const box: Inv = { ...(g.save.chests[uid] ?? {}) }
  const from = toChest ? bag : box
  const to = toChest ? box : bag
  const cap = toChest ? CHEST_SLOTS : bagSlots(g.save.bagLevel)
  let n = 0
  while (n < qty && (from[id] ?? 0) > 0) {
    to[id] = (to[id] ?? 0) + 1
    if (slotsUsed(to) > cap) {
      to[id]! -= 1
      if (!to[id]) delete to[id]
      break
    }
    from[id] = (from[id] ?? 0) - 1
    if (!from[id]) delete from[id]
    n++
  }
  if (n === 0) {
    toast(toChest ? 'กล่องเต็มแล้ว' : 'กระเป๋าเต็มแล้ว', undefined, 'warn')
    return
  }
  useGame.setState({ save: { ...g.save, inventory: bag, chests: { ...g.save.chests, [uid]: box } }, dirty: true })
  g.saveNow('event')
}

// ---------- กดค้าง: ย้าย / เก็บเข้าคลัง ----------
/** ย้ายสิ่งปลูกสร้างไปตำแหน่งใหม่ (คืนเหตุผลถ้าวางไม่ได้) */
export function moveStructure(uid: string, x: number, z: number, rot: number): string | null {
  const g = useGame.getState()
  if (!g.save) return 'ยังไม่ได้เริ่มเกม'
  const s = g.save.structures.find((t) => t.uid === uid)
  if (!s) return 'ไม่พบของชิ้นนี้'
  const others = g.save.structures.filter((t) => t.uid !== uid)
  const why = canPlace(s.id, x, z, rot, others, g.save.ownedPlotIds)
  if (why) return why
  recordEdit()
  useGame.setState({ save: { ...g.save, structures: g.save.structures.map((t) => (t.uid === uid ? { ...t, x, z, rot } : t)) }, dirty: true })
  g.saveNow('event')
  return null
}
export function moveProblem(uid: string, x: number, z: number, rot: number) {
  const g = useGame.getState().save
  if (!g) return 'ยังไม่ได้เริ่มเกม'
  const s = g.structures.find((t) => t.uid === uid)
  if (!s) return 'ไม่พบของชิ้นนี้'
  return canPlace(s.id, x, z, rot, g.structures.filter((t) => t.uid !== uid), g.ownedPlotIds)
}

/** เก็บเข้าคลัง: ของหายจากพื้น ไปอยู่ในคลัง นำกลับมาวางใหม่ได้ (ไม่เสียวัตถุดิบ) */
export function storeStructure(uid: string) {
  const g = useGame.getState()
  if (!g.save) return
  const s = g.save.structures.find((t) => t.uid === uid)
  if (!s) return
  const def = STRUCTURES[s.id]
  const box = g.save.chests[uid]
  if (box && Object.values(box).some((q) => (q ?? 0) > 0)) {
    toast('ในกล่องยังมีของอยู่', 'เอาของออกจากกล่องก่อนแล้วค่อยเก็บเข้าคลัง', 'warn')
    return
  }
  const chests = { ...g.save.chests }
  delete chests[uid]
  const stored = { ...(g.save.storedStructures ?? {}) }
  stored[s.id] = (stored[s.id] ?? 0) + 1
  recordEdit()
  useGame.setState({ save: { ...g.save, chests, storedStructures: stored, structures: g.save.structures.filter((t) => t.uid !== uid) }, dirty: true })
  g.saveNow('event')
  toast(`📦 เก็บ${def.name}เข้าคลังแล้ว`, 'กดค้างที่พื้นว่างในบ้าน → เลือกของในคลังเพื่อวางใหม่', 'info')
}

/** เปิดเมนูสร้างแล้ววางครั้งเดียว (จากการกดค้างพื้นว่าง) */
export function startPlacing(tool: StructureId, at?: [number, number]) {
  useBuild.setState({ active: true, tool, once: true, hover: at ?? null })
  toast(`วาง${STRUCTURES[tool].name}`, 'เลื่อนเมาส์ไปที่ที่ต้องการ แล้วคลิกเพื่อวาง · หมุนล้อเมาส์/R หมุน · คลิกขวาหรือ Esc ยกเลิก', 'info')
}
