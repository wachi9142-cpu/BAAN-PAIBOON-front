/**
 * สัตว์พลังพิเศษที่ขี่ได้ในน้ำ (ผู้สร้าง 19 พ.ย. 2569): มังกรน้ำ · พญานาค — อาศัยอยู่ในสระน้ำลึกในถ้ำ
 * - ต้องมีอานของชนิดนั้น (game/saddles.ts) ถึงขี่ได้ · เดินไปใกล้แล้วกด E ขึ้นขี่ / กด E อีกครั้งลง
 * - ขี่แล้วว่ายบนผิวน้ำได้เร็ว ไม่เหนื่อย · ดำน้ำ (C ค้าง / Space ขึ้น) ได้ตามเวลาของสัตว์แต่ละชนิด
 * - ผู้เล่นยังต้องหายใจ: ดำนาน ๆ ต้องสวมหมวกฟองอากาศ
 */
import { create } from 'zustand'
import { useGame } from './store'
import { saddleFor, saddleDefFor } from './saddles'
import { playerPose } from './playerPose'

export type MountId = 'water-dragon' | 'naga'
export interface MountDef {
  id: MountId
  name: string
  icon: string
  /** คูณความเร็วว่าย (ว่ายปกติ = 1) */
  speed: number
  /** ดำน้ำได้นานกี่วินาที (หมดแล้วสัตว์พาโผล่ขึ้นผิวน้ำ) */
  diveSeconds: number
  /** ความเร็วดำลง (ม./วิ) */
  diveRate: number
  note: string
}
export const MOUNTS: Record<MountId, MountDef> = {
  'water-dragon': { id: 'water-dragon', name: 'มังกรน้ำ', icon: '🐉', speed: 3.2, diveSeconds: 90, diveRate: 2.4, note: 'ว่ายเร็วที่สุด ดำลึกได้เร็ว' },
  naga: { id: 'naga', name: 'พญานาค', icon: '🐍', speed: 2.6, diveSeconds: 150, diveRate: 1.8, note: 'แหวกว่ายคล่องแคล่ว อยู่ใต้น้ำได้นานที่สุด' },
}

interface MountState {
  riding: MountId | null
  near: MountId | null
  /** เวลาที่อยู่ใต้น้ำแล้ว (วินาที) ของตัวที่ขี่อยู่ */
  underT: number
}
export const useMount = create<MountState>(() => ({ riding: null, near: null, underT: 0 }))

/** ตำแหน่งสัตว์ตอนว่ายวนเอง (ฉากถ้ำอัปเดตทุกเฟรม) */
export const mountPos: Record<MountId, [number, number]> = { 'water-dragon': [0, 0], naga: [0, 0] }

export function findMount(x: number, z: number): MountId | null {
  if (useMount.getState().riding) return null
  for (const id of Object.keys(MOUNTS) as MountId[]) {
    const [mx, mz] = mountPos[id]
    if (Math.hypot(mx - x, mz - z) < 3.2) return id
  }
  return null
}

export function toggleMount(id?: MountId | null) {
  const g = useGame.getState()
  const cur = useMount.getState().riding
  if (cur) {
    useMount.setState({ riding: null, underT: 0 })
    mountPos[cur] = [playerPose.x + 1.2, playerPose.z]
    g.toast({ title: `ลงจากหลัง${MOUNTS[cur].name}แล้ว`, tone: 'info' })
    return
  }
  if (!id) return
  const m = MOUNTS[id]
  if (!saddleFor(id)) {
    const d = saddleDefFor(id)
    g.toast({ title: `ต้องมี${d?.name ?? 'อาน'}ก่อนถึงจะขี่${m.name}ได้`, body: 'สร้างที่ สมุด → อาน (อานสัตว์ชนิดอื่นใช้แทนกันไม่ได้)', tone: 'warn' })
    return
  }
  useMount.setState({ riding: id, underT: 0, near: null })
  g.toast({ title: `${m.icon} ขี่${m.name}แล้ว`, body: `${m.note} · ดำน้ำได้ ~${m.diveSeconds} วิ · C ค้าง = ดำลง · Space = ขึ้น · E = ลง · ดำนานต้องใส่หมวกฟองอากาศ`, tone: 'success' })
}
