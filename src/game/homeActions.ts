/**
 * ในบ้านตารัง–ยายเลียน: เข้า/ออกบ้าน · เปิด-ปิดทีวี · นั่งโซฟา/เปล
 */
import { create } from 'zustand'
import { useGame } from './store'
import { INSIDE_DOOR, INTERIOR_ORIGIN, FLOOR2, outsideDoor, toWorld, useInterior } from './interior'

export const useHomeTv = create<{ on: boolean; on2: boolean }>(() => ({ on: false, on2: false }))

/** ตำแหน่งที่ผู้เล่นถูกส่งไป (Player อ่านแล้ววาร์ป) */
export const warp = { pending: null as null | { x: number; z: number; heading: number; y: number } }

export interface HomeSpot {
  id: string
  label: string
  /** พิกัดภายใน + ชั้น */
  x: number
  z: number
  upper: boolean
}

export const HOME_SPOTS: HomeSpot[] = [
  { id: 'exit', label: '🚪 ออกจากบ้าน', x: INSIDE_DOOR[0], z: INSIDE_DOOR[1], upper: false },
  { id: 'tv', label: '📺 เปิด/ปิดทีวี', x: -1.5, z: 0.7, upper: false },
  { id: 'sofa', label: '🛋️ นั่งโซฟาไม้ (เด็ก ๆ ชอบแย่งกันนั่ง)', x: -1.5, z: -1.9, upper: false },
  { id: 'hammock', label: '🪢 นั่งเปลชมวิว (ที่โปรดของตา)', x: 4.3, z: -2.4, upper: false },
  { id: 'loom', label: '🧵 ดูเครื่องทอผ้าไหมของยาย', x: 2.2, z: -2.6, upper: false },
  { id: 'silk', label: '🐛 ดูที่เลี้ยงหนอนไหมของยาย', x: -5.6, z: 3.3, upper: false },
  { id: 'tv2', label: '📺 เปิด/ปิดทีวีชั้นบน', x: 0, z: -2.9, upper: true },
]

export function enterHome() {
  const [x, z] = toWorld(INSIDE_DOOR[0], INSIDE_DOOR[1] + 0.6)
  warp.pending = { x, z, heading: 0, y: 0 }
  useInterior.setState({ inside: true })
  useGame.getState().toast({ title: '🏡 เข้าบ้านตารัง–ยายเลียน', body: 'เดินดูได้ทั้งชั้นล่างและชั้นบน (บันไดชิดผนังขวา) · กลับมาที่ประตูกด E เพื่อออกจากบ้าน', tone: 'info' })
}

export function exitHome() {
  const [x, z] = outsideDoor()
  // ออกจากบ้านทางประตูด้านเหนือ: หันหน้าไปทางเหนือ (ลานในบ้าน)
  warp.pending = { x, z, heading: 0, y: 0 }
  useInterior.setState({ inside: false })
}

export function findHomeSpot(wx: number, wz: number, wy: number): string | null {
  const lx = wx - INTERIOR_ORIGIN[0]
  const lz = wz - INTERIOR_ORIGIN[1]
  const upper = wy > FLOOR2 * 0.5
  let best: string | null = null
  let bd = 1.4
  for (const s of HOME_SPOTS) {
    if (s.upper !== upper) continue
    const d = Math.hypot(s.x - lx, s.z - lz)
    if (d < bd) {
      bd = d
      best = s.id
    }
  }
  return best
}

export function activateHomeSpot(id: string) {
  const g = useGame.getState()
  switch (id) {
    case 'exit':
      exitHome()
      break
    case 'tv':
      useHomeTv.setState((s) => ({ on: !s.on }))
      g.changeStats({ fun: 2 })
      break
    case 'tv2':
      useHomeTv.setState((s) => ({ on2: !s.on2 }))
      break
    case 'sofa':
    case 'hammock':
      g.doGesture('sit', 6000)
      g.changeStats({ fun: 3, health: 1 })
      g.toast({ title: id === 'sofa' ? '🛋️ นั่งพักบนโซฟาไม้' : '🪢 นั่งเปลชมวิว', body: id === 'sofa' ? 'โซฟาตัวนี้เด็ก ๆ ในบ้านชอบแย่งกันนั่ง แย่งกันนอนมาก' : 'ตาชอบนั่งเปลชมวิวตอนเช้า', tone: 'success' })
      break
    case 'loom':
      g.toast({ title: '🧵 เครื่องจักรทำผ้าไหมของยายเลียน', body: 'ยายเลี้ยงหนอนไหมเอง แล้วทอเป็นผืนผ้า (อาชีพทอผ้าไหม — เร็ว ๆ นี้)', tone: 'info' })
      break
    case 'silk':
      g.toast({ title: '🐛 ที่เลี้ยงหนอนไหมของยาย', body: 'อยู่หลังตู้เสื้อผ้าหน้าห้องน้ารง หนอนไหมกินใบหม่อนแล้วชักใยเป็นรังสีเหลือง', tone: 'info' })
      break
  }
}

export const homeSpotLabel = (id: string) => HOME_SPOTS.find((s) => s.id === id)?.label ?? ''
