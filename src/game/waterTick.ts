/**
 * ระบบน้ำ ส่วนที่ Player เรียกทุกเฟรม: ลุยน้ำ · ว่าย · แรงว่าย · ลื่นตก · ถูกช่วยลากเข้าฝั่ง · พายเรือ
 * + จุดกด E ริมน้ำ (ท่าน้ำ ริมตลิ่ง ดอกบัว ขึ้นจากเรือ)
 */
import { LOTUS, WADE_MAX, WATER, waterAt, type WaterBody } from './content/water'
import { warp } from './homeActions'
import {
  finishRescue,
  findLotus,
  leaveBoat,
  openWaterMenu,
  pickLotus,
  playDrip,
  playPaddle,
  playSplash,
  playStroke,
  playWade,
  setMode,
  slipIntoWater,
  startRescue,
  useWater,
  waterRt,
} from './water'
import { useGame } from './store'
import { diveKeys } from './water'
import { countOf } from './inventory'
import { MOUNTS, useMount } from './mounts'

/** ลมหายใจใต้น้ำ (วินาที): ไม่มีอุปกรณ์ = กลั้นหายใจสั้น ๆ · หมวกฟองอากาศ = หายใจได้นาน */
const BREATH_HOLD = 12
const BREATH_HELMET = 120
/** ดำน้ำ: ตั้งค่าความลึก/ลมหายใจลง store เฉพาะตอนเลขเปลี่ยน (UI ไม่ render ทุกเฟรม) */
function syncDive() {
  const st = useWater.getState()
  const d = Math.round(waterRt.dive * 10) / 10
  const b = Math.round(waterRt.breath)
  const helmet = countOf('bubble_helmet') > 0
  if (st.dive !== d || st.breath !== b || st.helmet !== helmet) useWater.setState({ dive: d, breath: b, helmet })
}
function resetDive() {
  if (waterRt.dive > 0 || waterRt.breath < 100) {
    waterRt.dive = 0
    waterRt.breath = Math.min(100, waterRt.breath + 100)
    syncDive()
  }
}

const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' = 'info') => useGame.getState().toast({ title, body, tone })

export interface WaterFx {
  /** ยกตัว/จมตัว (ม.) เทียบพื้น */
  sink: number
  /** ตัวเอียงไปข้างหน้า (เรเดียน) */
  tilt: number
  /** คูณความเร็วเดิน */
  speedK: number
  canRun: boolean
  /** บังคับหันหน้า (ตอนถูกลากเข้าฝั่ง) */
  face?: number
}
const LAND: WaterFx = { sink: 0, tilt: 0, speedK: 1, canRun: true }

/** แรงว่ายแบบละเอียด (อัปเดต store เฉพาะตอนเลขเต็มเปลี่ยน ไม่ให้ UI render ทุกเฟรม) */
let exact = 100
let rescueFrom: [number, number] | null = null
function getStamina() {
  const ui = useWater.getState().stamina
  return Math.round(exact) === Math.round(ui) ? exact : ui
}
function setStamina(v: number) {
  exact = Math.max(0, Math.min(100, v))
  if (Math.round(exact) !== Math.round(useWater.getState().stamina)) useWater.setState({ stamina: Math.round(exact) })
}

/**
 * คำนวณสถานะน้ำหลังผู้เล่นขยับแล้ว (pos ถูกแก้ได้: เรือชนฝั่ง · ลื่นตก · ถูกลากเข้าฝั่ง)
 * off = อยู่ในบ้าน/ขี่สัตว์ · bodyK = สัดส่วนความสูงตัวตามวัย (เด็กตัวเล็กจมน้อยกว่า)
 */
export function waterTick(pos: [number, number], prev: [number, number], dt: number, moving: boolean, running: boolean, off: boolean, bodyK: number): WaterFx {
  waterRt.slipCooldown = Math.max(0, waterRt.slipCooldown - dt)
  const st = useWater.getState()
  if (off) {
    if (st.mode !== 'land' && st.mode !== 'boat') setMode('land')
    waterRt.depth = 0
    return LAND
  }
  const now = performance.now()
  if (st.mode !== 'swim' && (waterRt.dive > 0 || waterRt.breath < 100)) resetDive()
  if (moving && st.fishing) {
    useWater.setState({ fishing: null })
    toast('เก็บเบ็ดแล้ว', 'เลิกตกปลา', 'info')
  }

  // ---- กำลังได้รับการช่วยเหลือ ----
  const r = waterRt.rescue
  if (r) {
    const el = (now - r.t0) / 1000
    const towAt = r.byPet ? 2.4 : 4.2
    const dep = waterAt(pos[0], pos[1]).depth
    if (el < towAt) return { sink: -Math.min(1.1, dep * 0.8 + 0.25) * bodyK, tilt: 0.1, speedK: 0, canRun: false }
    if (st.mode !== 'rescue') setMode('rescue')
    // ลากตามเวลาจริง (เฟรมกระตุกก็ยังถึงฝั่งแน่นอน)
    rescueFrom ??= [pos[0], pos[1]]
    const fx0 = rescueFrom[0]
    const fz0 = rescueFrom[1]
    const dx = r.shore[0] - fx0
    const dz = r.shore[1] - fz0
    const total = Math.hypot(dx, dz) || 1
    const k = Math.min(1, ((el - towAt) * 2.2) / total)
    pos[0] = fx0 + dx * k
    pos[1] = fz0 + dz * k
    if ((waterRt.stepT -= dt) <= 0) {
      waterRt.stepT = 0.7
      playStroke()
    }
    if (k >= 1) {
      rescueFrom = null
      exact = 60
      finishRescue()
    }
    return { sink: -0.45 * bodyK, tilt: 1.1, speedK: 0, canRun: false, face: Math.atan2(dx, dz) }
  }

  // ---- พายเรือ ----
  if (st.mode === 'boat' && waterRt.boatBody) {
    const w = waterAt(pos[0], pos[1])
    if (w.body !== waterRt.boatBody || w.depth < 0.35) {
      pos[0] = prev[0]
      pos[1] = prev[1]
    }
    if (moving && (waterRt.stepT -= dt) <= 0) {
      waterRt.stepT = 0.9
      playPaddle()
    }
    waterRt.depth = w.depth
    return { sink: 0.16 + Math.sin(now / 600) * 0.03, tilt: Math.sin(now / 900) * 0.03, speedK: 0.7, canRun: false }
  }

  const w = waterAt(pos[0], pos[1])
  waterRt.depth = w.depth
  waterRt.body = w.body
  let s = getStamina()

  // ---- บนบก ----
  if (w.depth === 0) {
    if (st.mode === 'swim' || st.mode === 'wade') {
      if (st.mode === 'swim') playDrip()
      setMode('land')
    }
    // วิ่งเร็วริมตลิ่งลื่น ๆ → เสียหลักตกน้ำ
    const mx = pos[0] - prev[0]
    const mz = pos[1] - prev[1]
    const ml = Math.hypot(mx, mz)
    if (running && moving && ml > 0 && waterRt.slipCooldown <= 0) {
      const px = pos[0] + (mx / ml) * 1.1
      const pz = pos[1] + (mz / ml) * 1.1
      if (waterAt(px, pz).depth > 0 && Math.random() < dt * 1.5) {
        pos[0] = px + (mx / ml) * 0.8
        pos[1] = pz + (mz / ml) * 0.8
        slipIntoWater()
      }
    }
    if (s < 100) setStamina(s + 12 * dt)
    return LAND
  }

  // ---- ลุยน้ำตื้น ----
  if (w.depth < WADE_MAX) {
    if (st.mode === 'land') playSplash(0.25)
    if (st.mode !== 'wade') setMode('wade')
    if (moving && (waterRt.stepT -= dt) <= 0) {
      waterRt.stepT = 0.42
      playWade()
    }
    if (s < 100) setStamina(s + 5 * dt)
    return { sink: -w.depth * 0.8, tilt: 0, speedK: 1 - w.depth * 0.55, canRun: w.depth < 0.4 }
  }

  // ---- ว่ายน้ำ (+ ดำน้ำ) ----
  if (st.mode !== 'swim') {
    setMode('swim')
    playSplash(st.mode === 'land' ? 1 : 0.5)
  }
  if (moving && (waterRt.stepT -= dt) <= 0) {
    waterRt.stepT = 0.8
    playStroke()
  }
  // ดำน้ำ: C ค้าง = ดำลง · Space ค้าง = ขึ้น · ปล่อย = ลอยขึ้นช้า ๆ (ใส่เสื้อชูชีพดำไม่ได้)
  // ขี่มังกรน้ำ/พญานาค: ดำเร็วตามชนิดสัตว์ · อยู่ใต้น้ำได้ตามเวลาของสัตว์ แล้วสัตว์พาโผล่ขึ้น
  const mount = useMount.getState().riding ? MOUNTS[useMount.getState().riding!] : null
  const wd = waterAt(pos[0], pos[1])
  const floor = Math.max(0, wd.depth - (mount ? 1.1 : 0.7))
  const mountTired = !!mount && useMount.getState().underT > mount.diveSeconds
  if (diveKeys.down && (!st.vest || mount) && !mountTired) waterRt.dive = Math.min(floor, waterRt.dive + (mount ? mount.diveRate : 1.3) * dt)
  else if (diveKeys.up || mountTired) waterRt.dive = Math.max(0, waterRt.dive - (mount ? 2.4 : 1.8) * dt)
  else waterRt.dive = Math.max(0, waterRt.dive - 0.25 * dt)
  waterRt.dive = Math.min(waterRt.dive, floor)
  const under = waterRt.dive > 0.35
  if (mount) {
    const u = useMount.getState().underT
    const nu = under ? u + dt : Math.max(0, u - dt * 3)
    if (u <= mount.diveSeconds && nu > mount.diveSeconds) toast(`${mount.icon} ${mount.name}ต้องขึ้นไปหายใจแล้ว`, 'พาโผล่ขึ้นผิวน้ำ — พักสักครู่แล้วดำต่อได้', 'info')
    useMount.setState({ underT: nu })
  }
  const helmet = countOf('bubble_helmet') > 0
  if (under) {
    waterRt.breath -= (100 / (helmet ? BREATH_HELMET : BREATH_HOLD)) * dt
    if (waterRt.breath <= 0) {
      // หายใจไม่ทัน: ถูกดันขึ้นผิวน้ำ สำลัก หมดแรง (สัตว์ตัวใหญ่ที่ผูกพันมากพอจะมาช่วยลากเข้าฝั่ง)
      waterRt.breath = 0
      waterRt.dive = 0
      useGame.getState().changeStats({ health: -10 })
      toast(helmet ? 'อากาศในฟองหมดแล้ว!' : 'กลั้นหายใจไม่ไหวแล้ว!', 'ถูกดันขึ้นผิวน้ำ สำลักน้ำ — ครั้งหน้ากด Space ขึ้นมาหายใจก่อนลมหมด', 'warn')
      s = 0
    }
  } else waterRt.breath = Math.min(100, waterRt.breath + 35 * dt)
  syncDive()
  if (st.vest || mount) s += 3 * dt
  else s -= (moving ? 4.5 : 1.8) * dt * (under ? 0.5 : 1)
  if (s <= 0) {
    setStamina(0)
    waterRt.dive = 0
    startRescue(pos[0], pos[1])
  } else setStamina(s)
  const float = st.vest ? 0.22 : 0
  if (mount) {
    // นั่งบนหลังสัตว์: ตัวพ้นน้ำ เร็วตามชนิดสัตว์ (ใต้น้ำ = ดิ่งลงพร้อมสัตว์)
    return { sink: 0.3 - waterRt.dive, tilt: 0, speedK: 0.55 * mount.speed, canRun: false }
  }
  if (waterRt.dive > 0.05) {
    // ใต้น้ำ: ตัวนอนขนานพื้นตอนว่าย · ลอยตั้งตรงตอนหยุด
    return { sink: (-1.12 + float) * bodyK - waterRt.dive, tilt: moving ? 1.35 : 0.5, speedK: 0.6, canRun: false }
  }
  return moving ? { sink: (-0.42 + float) * bodyK, tilt: 1.2, speedK: 0.55, canRun: false } : { sink: (-1.12 + float) * bodyK, tilt: 0.12, speedK: 0.55, canRun: false }
}

// ---------- ปุ่ม E ริมน้ำ ----------
export function findWaterSpot(x: number, z: number): string | null {
  const st = useWater.getState()
  if (st.mode === 'struggle' || st.mode === 'rescue') return null
  const l = findLotus(x, z)
  if (l) return 'lotus:' + l
  if (st.mode === 'boat') return 'boat'
  if (waterAt(x, z).depth > 0) return null
  for (const b of WATER) if (Math.hypot(b.dock[0] - x, b.dock[1] - z) < 2.4) return 'dock:' + b.id
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const w = waterAt(x + Math.sin(a) * 1.8, z + Math.cos(a) * 1.8)
    if (w.body) return 'shore:' + w.body.id
  }
  return null
}

export function waterHint(near: string) {
  if (near === 'boat') return '🚣 ขึ้นฝั่ง (พายเข้าใกล้ฝั่งก่อน)'
  if (near.startsWith('lotus:')) return LOTUS.find((l) => l.id === near.slice(6))?.white ? '🌸 เก็บดอกบัวขาว' : '🌸 เก็บดอกบัวชมพู'
  const b = WATER.find((w) => w.id === near.split(':')[1])
  return `${near.startsWith('dock:') ? '⛵ ท่าน้ำ' : '🌊 ริมน้ำ'}${b ? b.name : ''} · เลือกกิจกรรม`
}

export function activateWater(near: string, x: number, z: number) {
  if (near === 'boat') {
    if (!waterRt.boatBody) return
    let ok = false
    for (let i = 0; i < 12 && !ok; i++) {
      const a = (i / 12) * Math.PI * 2
      if (waterAt(x + Math.sin(a) * 3, z + Math.cos(a) * 3).depth === 0) ok = true
    }
    if (!ok) {
      toast('ยังไกลฝั่งอยู่', 'พายเข้าไปใกล้ตลิ่งหรือท่าน้ำก่อน แล้วค่อยกด E', 'info')
      return
    }
    const p = leaveBoat(x, z)
    if (p) warp.pending = { x: p[0], z: p[1], heading: Math.atan2(p[0] - x, p[1] - z), y: 0 }
    playDrip()
    toast('ขึ้นฝั่งแล้ว', 'ผูกเรือไว้ที่ท่าน้ำ', 'info')
    return
  }
  if (near.startsWith('lotus:')) return pickLotus(near.slice(6))
  openWaterMenu(near.split(':')[1])
}

/** จุดจอดเรือ (ในน้ำ ห่างท่า 2.6 ม. เข้าหากลางบ่อ) */
export function boatMooring(b: WaterBody): [number, number] {
  const dx = b.pos[0] - b.dock[0]
  const dz = b.pos[1] - b.dock[1]
  const l = Math.hypot(dx, dz) || 1
  return [b.dock[0] + (dx / l) * 2.6, b.dock[1] + (dz / l) * 2.6]
}
