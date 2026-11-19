import type { ThreeEvent } from '@react-three/fiber'
import { INTERIOR_ORIGIN, useInterior } from '../game/interior'
import { actSpotById, findActSpot, startActivity, useActivity } from '../game/houseLife'
import { findCarrySpot, putDown, useCarry } from '../game/carry'
import { playerPose } from '../game/playerPose'
import { openActionWheel } from './ActionWheel'

/**
 * คลิกที่เตียง/ฟูก/เสื่อ → วงล้อคำสั่งของเตียง (คนละชุดกับคำสั่งสัตว์)
 * นอนหลับ · งีบ · วางสัตว์ที่อุ้มอยู่ให้นอน · ต้องเดินเข้าไปใกล้เตียงก่อน (ไม่วาร์ป)
 */
export function onBedClick(e: ThreeEvent<MouseEvent>) {
  if (e.delta > 6) return
  e.stopPropagation()
  const lx = e.point.x - INTERIOR_ORIGIN[0]
  const lz = e.point.z - INTERIOR_ORIGIN[1]
  const upper = useInterior.getState().upper
  // หาจุดนอนของเตียงที่คลิก (ใกล้จุดคลิกที่สุด)
  const spot = findActSpot(lx, lz - 1, upper) ?? findActSpot(lx, lz, upper) ?? findActSpot(lx, lz + 1, upper)
  const base = spot?.id.replace(/:(sleep|nap)$/, '')
  const sleep = base ? actSpotById(base + ':sleep') : null
  const nap = base ? actSpotById(base + ':nap') : null
  const near = sleep ? Math.hypot(playerPose.x - (INTERIOR_ORIGIN[0] + sleep.x), playerPose.z - (INTERIOR_ORIGIN[1] + sleep.z)) < 2.4 : false
  const far = near ? false : 'เดินเข้าไปใกล้เตียงก่อน'
  const busy = useActivity.getState().cur ? 'กำลังทำอย่างอื่นอยู่' : false
  const carrying = useCarry.getState().pet
  const bedNear = carrying ? findCarrySpot(playerPose.x, playerPose.z) : null
  openActionWheel(e.nativeEvent.clientX, e.nativeEvent.clientY, 'เตียงนอน', '🛏️', [
    { id: 'sleep', label: 'นอนหลับ', icon: '😴', disabled: !sleep ? 'ไม่มีที่ให้นอน' : busy || far, run: () => sleep && startActivity(sleep.id) },
    { id: 'nap', label: 'งีบ', icon: '💤', disabled: !nap ? 'ไม่มีที่ให้นอน' : busy || far, run: () => nap && startActivity(nap.id) },
    {
      id: 'pet',
      label: carrying ? `วาง${carrying.name}นอน` : 'วางสัตว์นอน',
      icon: '🐾',
      disabled: !carrying ? 'ต้องอุ้มสัตว์มาก่อน' : !bedNear ? 'อุ้มเดินเข้าไปใกล้เตียงก่อน' : false,
      run: () => putDown(),
    },
  ])
}
