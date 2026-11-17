/**
 * โหมดสร้าง (กด B): เลือกสิ่งปลูกสร้าง → คลิกพื้นในที่ดินของตัวเองเพื่อวาง (หักวัตถุดิบ)
 * โหมด "เก็บคืน" คลิกของที่วางแล้วเพื่อรื้อ ได้วัตถุดิบคืนครบ (ใช้ย้ายที่ได้)
 */
import { create } from 'zustand'
import { useGame } from './store'
import { canAfford } from './inventory'
import { bagSlots, ITEMS, slotsUsed, type Cost, type ItemId } from './content/items'
import { canPlace, CHEST_SLOTS, rectOf, STRUCTURES, type PlacedStructure, type StructureId } from './content/structures'
import { PLOTS } from './content/village'

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
}
export const useBuild = create<BuildState>(() => ({ active: false, tool: null, rot: 0, hover: null, near: null, chestOpen: null }))

type Inv = Partial<Record<ItemId, number>>
const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' = 'info') => useGame.getState().toast({ title, body, tone })

export function toggleBuild(on?: boolean) {
  const g = useGame.getState()
  const s = useBuild.getState()
  const next = on ?? !s.active
  if (next && g.save) {
    const p = PLOTS[0]
    const [px, pz] = g.save.position
    if (Math.hypot(px - p.center[0], pz - p.center[1]) > 26) {
      toast('กลับไปที่ดินของคุณก่อน', 'โหมดสร้างใช้ได้ในที่ดินของตัวเอง (ซอยไปบ้านผู้เล่น ทางตะวันออกของหมู่บ้าน)', 'info')
      return
    }
  }
  useBuild.setState({ active: next, tool: next ? s.tool : null, hover: null })
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
  if (!canAfford(def.cost)) {
    toast('วัตถุดิบไม่พอ', 'ต้องใช้ ' + costText(def.cost), 'warn')
    return
  }
  const s: PlacedStructure = { uid: Math.random().toString(36).slice(2, 10), id: tool, x, z, rot }
  useGame.setState({ save: { ...g.save, inventory: spend(g.save.inventory, def.cost), structures: [...g.save.structures, s] }, dirty: true })
  g.saveNow('event')
  toast(`${def.icon} สร้าง${def.name}แล้ว`, def.note, 'success')
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
