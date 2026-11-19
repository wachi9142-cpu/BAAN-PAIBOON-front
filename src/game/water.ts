/**
 * ระบบน้ำ: ลุยน้ำ · ว่ายน้ำ · แรงว่าย · ตกน้ำ · สัตว์เลี้ยงช่วยลากขึ้นฝั่ง · เสื้อชูชีพ · ตกปลา · เรือพาย · เก็บดอกบัว
 * สถานะต่อเฟรมเก็บใน waterRt (ไม่ทำให้ฉาก render ใหม่) · ส่วนที่ UI ต้องเห็นอยู่ใน useWater
 */
import { create } from 'zustand'
import { useGame } from './store'
import { addItem, countOf } from './inventory'
import { nowMinute } from './garden'
import { useSettings } from './settings'
import { getSpecies } from './content/pets'
import { traitsOf } from './content/animalTraits'
import { playPetSound } from './audio/petSounds'
import { LOTUS, WATER, waterAt, type WaterBody } from './content/water'
import { warp } from './homeActions'

export type WaterMode = 'land' | 'wade' | 'swim' | 'struggle' | 'rescue' | 'boat'

interface WaterUi {
  mode: WaterMode
  /** แรงว่าย 0–100 */
  stamina: number
  vest: boolean
  /** หน้าต่างกิจกรรมริมน้ำ */
  menu: string | null
  /** ยืนใกล้จุดอะไร: 'shore:<id>' · 'lotus:<id>' · 'dock:<id>' */
  near: string | null
  fishing: { until: number } | null
  /** ดำน้ำ: ลึกจากผิวน้ำ (ม.) · ลมหายใจ 0–100 · มีหมวกฟองอากาศไหม */
  dive: number
  breath: number
  helmet: boolean
}
export const useWater = create<WaterUi>(() => ({ mode: 'land', stamina: 100, vest: false, menu: null, near: null, fishing: null, dive: 0, breath: 100, helmet: false }))

/** ปุ่มดำน้ำ: กด C ค้าง = ดำลง · Space ค้าง = ว่ายขึ้น (ผู้สร้าง 19 พ.ย.) */
export const diveKeys = { down: false, up: false }
if (typeof window !== 'undefined') {
  const set = (e: KeyboardEvent, v: boolean) => {
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (e.code === 'KeyC') diveKeys.down = v
    if (e.code === 'Space') {
      diveKeys.up = v
      if (v && useWater.getState().mode === 'swim') e.preventDefault()
    }
  }
  window.addEventListener('keydown', (e) => set(e, true))
  window.addEventListener('keyup', (e) => set(e, false))
  window.addEventListener('blur', () => {
    diveKeys.down = false
    diveKeys.up = false
  })
}

/** ค่าที่ Player ใช้ทุกเฟรม */
export const waterRt = {
  depth: 0,
  body: null as WaterBody | null,
  /** เรือ: แหล่งน้ำที่พายอยู่ */
  boatBody: null as WaterBody | null,
  rescue: null as null | { t0: number; shore: [number, number]; byPet: boolean },
  /** ความลึกที่ดำลงไป (ละเอียด) + ลมหายใจละเอียด */
  dive: 0,
  breath: 100,
  slipCooldown: 0,
  stepT: 0,
}

const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' = 'info') => useGame.getState().toast({ title, body, tone })

export function setMode(m: WaterMode) {
  if (useWater.getState().mode !== m) useWater.setState({ mode: m })
}

/** หาจุดบนฝั่งที่ใกล้ที่สุด (เดินออกจากกลางบ่อไปหาขอบ) */
export function nearestShore(x: number, z: number, body: WaterBody): [number, number] {
  let ax = x - body.pos[0]
  let az = z - body.pos[1]
  const l = Math.hypot(ax, az) || 1
  ax /= l
  az /= l
  for (let r = 0; r < 40; r += 0.3) {
    const px = x + ax * r
    const pz = z + az * r
    if (waterAt(px, pz).depth === 0) return [px + ax * 0.8, pz + az * 0.8]
  }
  return [body.pos[0] + body.size[0] / 2 + 1.5, body.pos[1]]
}

/** หมดแรงว่าย: ร้องขอความช่วยเหลือ → สุนัข/สัตว์ตัวใหญ่ว่ายมาลากเข้าฝั่ง หรือชาวบ้านยื่นไม้ไผ่ช่วย */
export function startRescue(x: number, z: number) {
  const g = useGame.getState()
  const body = waterRt.body ?? WATER[0]
  const pet = g.save?.player.pet
  // ช่วยลากขึ้นฝั่งได้: สัตว์ตัวใหญ่ที่ว่ายเก่ง (ประเภทสัตว์) + ผูกพันกับเจ้าของมากพอ (≥ 3 หัวใจ) — ผู้สร้าง 19 พ.ย.
  const bond = g.save?.petHearts ?? 0
  const able = !!pet && !!traitsOf(pet.species).rescuer && pet.size !== 'small'
  const big = able && bond >= 3
  waterRt.rescue = { t0: performance.now(), shore: nearestShore(x, z, body), byPet: big }
  setMode('struggle')
  playCry()
  if (pet) window.setTimeout(() => playPetSound(pet, 0.9), 400)
  toast('🆘 ช่วยด้วย! ว่ายไม่ไหวแล้ว', big ? `${pet!.name}กระโดดลงน้ำมาช่วย!` : able ? `${pet!.name}ยังไม่ผูกพันมากพอจะกล้าลงมาช่วย (ต้อง 3 หัวใจ) — เห่าเรียกคนมาช่วยแทน` : pet ? `${pet.name}ลงน้ำมาช่วยไม่ได้ ได้แต่ส่งเสียงเรียกคนมาช่วย…` : 'ร้องเรียกให้คนแถวนั้นมาช่วย…', 'warn')
}

export function finishRescue() {
  const r = waterRt.rescue
  if (!r) return
  waterRt.rescue = null
  const g = useGame.getState()
  g.changeStats({ health: -8, fun: -3 })
  useWater.setState({ stamina: 60 })
  setMode('land')
  playDrip()
  const pet = g.save?.player.pet
  toast(
    r.byPet ? `🐕 ${pet?.name ?? 'สัตว์เลี้ยง'}ลากขึ้นฝั่งได้แล้ว!` : '🎋 ลุงเขียวยื่นไม้ไผ่มาให้จับ ดึงขึ้นฝั่งได้แล้ว',
    r.byPet ? 'ทั้งคู่เหนื่อยหอบ สะบัดน้ำออกจากตัว · คราวหน้าใส่เสื้อชูชีพนะ' : 'เกือบไปแล้ว · ใส่เสื้อชูชีพก่อนลงน้ำลึกนะ',
    'success',
  )
}

/** ลื่นตกน้ำ (วิ่งเร็วบนตลิ่งลื่น) */
export function slipIntoWater() {
  waterRt.slipCooldown = 6
  playSplash(1)
  useGame.getState().doGesture('shake', 700)
  toast('😱 ลื่นตกน้ำ!', 'ตลิ่งลื่น วิ่งเร็วเกินไป · ค่อย ๆ เดินริมบ่อนะ', 'warn')
}

// ---------- หน้าต่างกิจกรรม ----------
export function openWaterMenu(bodyId: string) {
  useWater.setState({ menu: bodyId })
}

export function toggleVest() {
  const v = !useWater.getState().vest
  useWater.setState({ vest: v, menu: null })
  toast(v ? '🦺 สวมเสื้อชูชีพแล้ว' : 'ถอดเสื้อชูชีพแล้ว', v ? 'ลอยน้ำได้ ว่ายได้ไม่เหนื่อย ไม่จมน้ำ' : 'ว่ายน้ำลึกระวังหมดแรงนะ', 'info')
}

export function startFishing() {
  const g = useGame.getState()
  useWater.setState({ menu: null })
  if (countOf('rod') <= 0) {
    toast('ยังไม่มีเบ็ดตกปลา', 'ซื้อได้ที่ร้านเครื่องมือช่าง (ซอย 3) หรือร้านค้าป้าศรี', 'info')
    return
  }
  const wait = 3000 + Math.random() * 4000
  useWater.setState({ fishing: { until: performance.now() + wait } })
  g.doGesture('offer', wait + 600)
  playSplash(0.3)
  toast('🎣 เหวี่ยงเบ็ดแล้ว', 'รอปลากินเบ็ดสักครู่… (เดินเพื่อเลิกตก)', 'info')
  window.setTimeout(() => {
    if (!useWater.getState().fishing) return
    useWater.setState({ fishing: null })
    if (Math.random() < 0.25) {
      toast('ปลาไม่กินเบ็ด', 'ลองอีกครั้งนะ', 'info')
      return
    }
    const fish = (['fish_tilapia', 'fish_catfish', 'fish_barb'] as const)[Math.floor(Math.random() * 3)]
    const n = addItem(fish, 1)
    playSplash(0.6)
    if (n) {
      g.changeStats({ fun: 4 })
      toast('🐟 ได้ปลาแล้ว!', `${fish === 'fish_tilapia' ? 'ปลานิล' : fish === 'fish_catfish' ? 'ปลาดุก' : 'ปลาตะเพียน'} +1`, 'success')
    } else toast('กระเป๋าเต็ม ปล่อยปลาคืนน้ำ', undefined, 'warn')
  }, wait)
}

export function boardBoat(bodyId: string) {
  const b = WATER.find((w) => w.id === bodyId)
  if (!b) return
  useWater.setState({ menu: null })
  waterRt.boatBody = b
  // ก้าวจากท่าน้ำลงเรือที่จอดอยู่
  const dx = b.pos[0] - b.dock[0]
  const dz = b.pos[1] - b.dock[1]
  const l = Math.hypot(dx, dz) || 1
  const mx = b.dock[0] + (dx / l) * 2.6
  const mz = b.dock[1] + (dz / l) * 2.6
  warp.pending = { x: mx, z: mz, heading: Math.atan2(dx, dz), y: 0 }
  setMode('boat')
  playSplash(0.4)
  toast('🚣 ขึ้นเรือแล้ว', 'เดินหน้า/เลี้ยวเพื่อพาย · กลับมาใกล้ฝั่งแล้วกด E เพื่อขึ้นฝั่ง', 'info')
}

export function leaveBoat(x: number, z: number) {
  const b = waterRt.boatBody
  if (!b) return null
  waterRt.boatBody = null
  setMode('land')
  return nearestShore(x, z, b)
}

// ---------- ดอกบัว ----------
export const LOTUS_REGROW_MIN = 1440
export function lotusPicked(id: string) {
  const at = useGame.getState().save?.lotusPicked?.[id]
  return at !== undefined && nowMinute() < at + LOTUS_REGROW_MIN
}

export function findLotus(x: number, z: number): string | null {
  let best: string | null = null
  let bd = 1.4
  for (const l of LOTUS) {
    if (lotusPicked(l.id)) continue
    const d = Math.hypot(l.x - x, l.z - z)
    if (d < bd) {
      bd = d
      best = l.id
    }
  }
  return best
}

export function pickLotus(id: string) {
  const g = useGame.getState()
  if (!g.save) return
  g.doGesture('offer', 1300)
  playRipple()
  window.setTimeout(() => {
    const s = useGame.getState().save!
    const n = addItem('lotus', 1)
    if (!n) {
      toast('กระเป๋าเต็มแล้ว', undefined, 'warn')
      return
    }
    useGame.setState({ save: { ...s, lotusPicked: { ...(s.lotusPicked ?? {}), [id]: nowMinute() } }, dirty: true })
    useGame.getState().saveNow('event')
    const white = LOTUS.find((l) => l.id === id)?.white
    toast(`🌸 เก็บดอกบัว${white ? 'ขาว' : 'ชมพู'}แล้ว`, 'ใช้ตกแต่งบ้าน ถวายพระ หรือมอบให้ชาวบ้านได้ · จะบานใหม่พรุ่งนี้', 'success')
  }, 1100)
}

export const petCanRescue = (species?: string, size?: string) => !!species && ['dog', 'buffalo', 'cow'].includes(species) && size !== 'small'
export const speciesLabel = (s: string) => getSpecies(s as never).label

// ---------- เสียง (สังเคราะห์) ----------
let ctx: AudioContext | null = null
function audio() {
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}
const vol = () => useSettings.getState().sfxVolume ?? 1

function noiseBurst(dur: number, freq: number, q: number, gain: number, delay = 0, type: BiquadFilterType = 'bandpass') {
  try {
    const c = audio()
    const t = c.currentTime + 0.01 + delay
    const len = Math.floor(c.sampleRate * dur)
    const buf = c.createBuffer(1, len, c.sampleRate)
    const ch = buf.getChannelData(0)
    for (let n = 0; n < len; n++) ch[n] = (Math.random() * 2 - 1) * (1 - n / len) ** 2
    const src = c.createBufferSource()
    src.buffer = buf
    const f = c.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = q
    const g = c.createGain()
    g.gain.value = gain * vol()
    src.connect(f).connect(g).connect(c.destination)
    src.start(t)
  } catch {
    /* ไม่มีเสียงก็ไม่เป็นไร */
  }
}
/** น้ำกระจาย (ตกน้ำ/กระโดด) */
export const playSplash = (k = 1) => {
  noiseBurst(0.5 * k + 0.2, 900, 0.7, 0.5 * k)
  noiseBurst(0.3, 2400, 1.5, 0.25 * k, 0.05)
}
/** เท้าลุยน้ำ กระฉอก */
export const playWade = () => noiseBurst(0.18, 1300, 1.2, 0.14)
/** แขนขาตีน้ำ */
export const playStroke = () => noiseBurst(0.25, 800, 0.9, 0.16)
/** ไม้พายตีน้ำ */
export const playPaddle = () => noiseBurst(0.3, 600, 0.8, 0.18)
/** น้ำกระเพื่อมเบา ๆ */
export const playRipple = () => noiseBurst(0.4, 1800, 2, 0.08)
/** น้ำหยด + สะบัดตัว */
export const playDrip = () => {
  for (let i = 0; i < 5; i++) noiseBurst(0.04, 3200 - i * 200, 6, 0.12, i * 0.12)
  noiseBurst(0.35, 1500, 1, 0.15, 0.7)
}
/** สำลักน้ำ ร้องขอความช่วยเหลือ */
export function playCry() {
  try {
    const c = audio()
    const t = c.currentTime + 0.02
    for (let i = 0; i < 2; i++) {
      const o = c.createOscillator()
      o.type = 'triangle'
      const st = t + i * 0.55
      o.frequency.setValueAtTime(520, st)
      o.frequency.linearRampToValueAtTime(760, st + 0.15)
      o.frequency.linearRampToValueAtTime(480, st + 0.4)
      const g = c.createGain()
      g.gain.setValueAtTime(0.0001, st)
      g.gain.exponentialRampToValueAtTime(0.12 * vol(), st + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.45)
      o.connect(g).connect(c.destination)
      o.start(st)
      o.stop(st + 0.5)
    }
    noiseBurst(0.3, 700, 1, 0.2, 0.1)
  } catch {
    /* ไม่มีเสียงก็ไม่เป็นไร */
  }
}
