/**
 * อาวุธ 9 ช่อง + ไอเทม 9 ช่อง (GAME_DESIGN §2.65) — แยกจาก Hotbar เก็บของด่วน 9 ช่องเดิม
 * Q = วงล้ออาวุธ · R = วงล้อไอเทม · เลื่อนลูกกลิ้งเลือก · คลิก/กด E/Enter/ปุ่มเดิมซ้ำ = หยิบออกมาใช้ · Esc = ปิด
 */
import { create } from 'zustand'
import { GEAR, gearById, type GearKind } from '../scenes/models/Gear'
import { useGame } from './store'

export const SLOTS = 9
const KEY = 'baan-paiboon-loadout'

interface LoadoutState {
  weapons: (string | null)[]
  items: (string | null)[]
  /** ที่ถืออยู่ตอนนี้ (null = มือเปล่า) */
  weapon: string | null
  item: string | null
  /** วงล้อที่เปิดอยู่ */
  open: GearKind | null
  /** ช่องที่ชี้อยู่ในวงล้อ */
  hi: number
}

const fill = (kind: GearKind) => {
  const ids = GEAR.filter((g) => g.kind === kind).map((g) => g.id)
  return Array.from({ length: SLOTS }, (_, i) => ids[i] ?? null)
}

function load(): Pick<LoadoutState, 'weapons' | 'items' | 'weapon' | 'item'> {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const v = JSON.parse(raw)
      return { weapons: v.weapons ?? fill('weapon'), items: v.items ?? fill('item'), weapon: v.weapon ?? null, item: v.item ?? null }
    }
  } catch {
    /* ไม่มีที่เก็บก็ใช้ค่าเริ่มต้น */
  }
  return { weapons: fill('weapon'), items: fill('item'), weapon: null, item: null }
}

export const useLoadout = create<LoadoutState>(() => ({ ...load(), open: null, hi: 0 }))
useLoadout.subscribe((s) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ weapons: s.weapons, items: s.items, weapon: s.weapon, item: s.item }))
  } catch {
    /* ไม่เป็นไร */
  }
})

const slotsOf = (k: GearKind) => (k === 'weapon' ? useLoadout.getState().weapons : useLoadout.getState().items)

/** เปิด/ปิดวงล้อ (กดปุ่มเดิมซ้ำตอนเปิดอยู่ = หยิบช่องที่ชี้) */
export function toggleWheel(kind: GearKind) {
  const s = useLoadout.getState()
  if (s.open === kind) {
    confirmWheel()
    return
  }
  const cur = kind === 'weapon' ? s.weapon : s.item
  const idx = Math.max(0, slotsOf(kind).indexOf(cur))
  useLoadout.setState({ open: kind, hi: idx })
}

export const closeWheel = () => useLoadout.setState({ open: null })

/** เลื่อนช่องที่ชี้ (ลูกกลิ้ง) */
export function scrollWheel(dir: number) {
  const s = useLoadout.getState()
  if (!s.open) return
  const n = SLOTS + 1 // ช่องสุดท้าย = มือเปล่า (เก็บของ)
  useLoadout.setState({ hi: (((s.hi + dir) % n) + n) % n })
}

/** หยิบช่องที่ชี้ออกมาใช้ */
export function confirmWheel(at?: number) {
  const s = useLoadout.getState()
  if (!s.open) return
  const i = at ?? s.hi
  const id = i >= SLOTS ? null : slotsOf(s.open)[i]
  if (i < SLOTS && !id) return // ช่องว่าง
  const kind = s.open
  useLoadout.setState(kind === 'weapon' ? { weapon: id, open: null } : { item: id, open: null })
  const d = id ? gearById(id) : null
  useGame.getState().toast({
    title: d ? `ถือ${d.name}` : kind === 'weapon' ? 'เก็บอาวุธแล้ว' : 'เก็บไอเทมแล้ว',
    body: kind === 'weapon' ? 'Q เปิดวงล้ออาวุธ · เลื่อนลูกกลิ้งเพื่อเลือก' : 'R เปิดวงล้อไอเทม · เลื่อนลูกกลิ้งเพื่อเลือก',
    tone: 'info',
  })
}
