import { useTools } from './trees'
import { startCast } from './wand'
/**
 * ระบบเก็บสัตว์ (ไม่ใช้การปาบอล)
 * อุปกรณ์แบบชนบทไทย (ผู้สร้าง 19 พ.ย. 2569) ตามสีเพชรบนหัวสัตว์:
 *   💚 ง่าย = มือเปล่า เข้าใกล้แล้วเก็บ · 💛 ปานกลาง = สวิงจับสัตว์ (หรือกล้วยล่อ โอกาสน้อยกว่า)
 *   ❤️ ยาก = ป้อนกล้วยให้เชื่องก่อน แล้ววางกรงดักใส่กล้วยเป็นเหยื่อ รอสัตว์เดินเข้ากรง · 💜 พิเศษ = สายสิญจน์/เครื่องราง (อนาคต)
 * ไม้คฑา (ของเก่า) ยังใช้ได้กับคนที่มีอยู่แล้ว
 * สถานะสัตว์ป่าแต่ละตัว (หนี/ถูกเก็บ/ฟื้นคืน) เก็บในหน่วยความจำ ไม่ต้องเซฟ
 */
import { create } from 'zustand'
import { useGame } from './store'
import { playerPose } from './playerPose'
import { countOf, hasTool } from './inventory'
import { ITEMS, type ItemId } from './content/items'
import { getSpecies } from './content/pets'
import { CATCH_RULES, SPECIES_TIER, TIERS, WILD_SPAWNS, type Tier } from './content/wildlife'

export type WildStatus = 'free' | 'pulling' | 'caught' | 'fled'

export interface WildRuntime {
  status: WildStatus
  /** เวลา (ms) ที่จะกลับมาให้เก็บใหม่ */
  until: number
  /** ป้อนอาหารแล้ว (สัตว์ระดับยากต้องเชื่องก่อน) */
  tamed: boolean
  /** เริ่มดึงเข้าหา (สำหรับแอนิเมชันลำแสง) */
  pullStart: number
  /** ใช้ไม้คฑา (แสดงลำแสง) */
  beam: boolean
  /** ระยะเวลาดูดเข้าคฑา (ms) ตามระดับสัตว์ */
  pullMs?: number
  /** ลำแสงยิงโดนแต่สัตว์สะบัดหลุด จนถึงเวลานี้ (performance.now) */
  resistUntil?: number
  /** ตกใจวิ่งหนีจนถึงเวลานี้ */
  scaredUntil: number
  /** กรงดักที่วางไว้ให้ตัวนี้ (สัตว์จะเดินเข้าไปกินเหยื่อ) */
  trap?: { x: number; z: number; at: number; shut?: number }
  /** ตวัดสวิงใส่ (แอนิเมชันถูกครอบ) */
  netAt?: number
  /** ได้ยินเสียงผิวปาก: เดินเข้ามาหา / หันมามอง จนถึงเวลานี้ */
  callUntil?: number
  callMode?: 'come' | 'look'
}

const RESPAWN_MS = 3 * 60_000
const FLED_MS = 60_000
const PULL_MS = 900

export const wild = new Map<string, WildRuntime>(
  WILD_SPAWNS.map((s) => [s.id, { status: 'free', until: 0, tamed: false, pullStart: 0, beam: false, scaredUntil: 0 }]),
)
/** ตำแหน่งล่าสุดของสัตว์แต่ละตัว (ฉาก 3D อัปเดตทุกเฟรม) */
export const wildPos = new Map<string, [number, number]>()

export const tierOf = (id: string): Tier => SPECIES_TIER[WILD_SPAWNS.find((s) => s.id === id)!.pet.species]

/** สัตว์กลับมาให้เก็บใหม่เมื่อครบเวลา */
export function refreshWild(now = Date.now()) {
  for (const r of wild.values()) {
    if ((r.status === 'caught' || r.status === 'fled') && now > r.until) {
      r.status = 'free'
      r.tamed = false
    }
  }
}

const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' | 'discover' = 'info') =>
  useGame.getState().toast({ title, body, tone })

function use(id: ItemId) {
  const g = useGame.getState()
  if (!g.save) return
  const inv = { ...g.save.inventory }
  inv[id] = (inv[id] ?? 0) - 1
  if ((inv[id] ?? 0) <= 0) delete inv[id]
  useGame.setState({ save: { ...g.save, inventory: inv }, dirty: true })
}

/** ถือสวิงตอนตวัด (ฉากตัวละครอ่านไปวาดสวิงในมือ) */
export const captureFx = { netUntil: 0 }
/** กรงดักที่วางอยู่ (ฉาก 3D วาดกรง) */
export const useTraps = create<{ ver: number }>(() => ({ ver: 0 }))
const bumpTraps = () => useTraps.setState((s) => ({ ver: s.ver + 1 }))

const GEM_ICON: Record<Tier, string> = { easy: '💚', medium: '💛', hard: '❤️', legend: '💜' }

/** ข้อความบอกวิธีเก็บตัวที่อยู่ใกล้ (มีสีเพชรนำหน้า) */
export function catchHint(id: string) {
  const spawn = WILD_SPAWNS.find((s) => s.id === id)!
  const name = getSpecies(spawn.pet.species).label
  const tier = tierOf(id)
  const r = wild.get(id)!
  const gem = GEM_ICON[tier]
  const wandHeld = useTools.getState().equipped === 'wand' && hasTool('wand')
  if (tier === 'easy') return `${gem} ${wandHeld ? `ใช้คฑาดูด${name}` : `เก็บ${name}${countOf('feed') > 0 ? ' (ให้อาหารสัตว์)' : ''}`} · มือเปล่า`
  if (tier === 'medium') {
    if (hasTool('net')) return `${gem} ตวัดสวิงจับ${name}`
    if (hasTool('wand')) return `${gem} ใช้ไม้คฑาเก็บ${name}`
    if (countOf('treat') > 0) return `${gem} ล่อ${name}ด้วยกล้วยสุก (มีสวิงจะง่ายกว่า)`
    return `${gem} ${name} — ต้องมีสวิงจับสัตว์ (ร้านพี่แดง/ประดิษฐ์เอง)`
  }
  if (r.trap) return `${gem} ${name}กำลังเดินเข้ากรง… อยู่นิ่ง ๆ`
  if (!r.tamed) return `${gem} ${countOf('treat') > 0 ? `ป้อนกล้วยให้${name}เชื่องก่อน` : `${name} — ต้องมีกล้วยสุกไว้ป้อนก่อน`}`
  if (hasTool('trap_cage')) return countOf('treat') > 0 ? `${gem} วางกรงดักใส่กล้วยล่อ${name}` : `${gem} ${name}เชื่องแล้ว — ต้องมีกล้วยไว้ใส่กรงเป็นเหยื่อ`
  if (hasTool('wand')) return `${gem} ใช้ไม้คฑาเก็บ${name}`
  return `${gem} ${name}เชื่องแล้ว — ต้องมีกรงดักสัตว์`
}

/** เข้าสมุดสะสม */
function collect(id: string, how: string) {
  const r = wild.get(id)!
  const spawn = WILD_SPAWNS.find((s) => s.id === id)!
  const name = getSpecies(spawn.pet.species).label
  const tier = tierOf(id)
  r.status = 'caught'
  r.until = Date.now() + RESPAWN_MS
  r.trap = undefined
  r.netAt = undefined
  bumpTraps()
  const g = useGame.getState()
  if (!g.save) return
  const caught = { uid: `${spawn.id}-${Date.now().toString(36)}`, pet: { ...spawn.pet, name: getSpecies(spawn.pet.species).suggestName, sex: (Math.random() < 0.5 ? 'm' : 'f') as 'm' | 'f' }, day: g.save.day }
  useGame.setState({ save: { ...g.save, collection: [...g.save.collection, caught] }, dirty: true })
  g.saveNow('event')
  toast(`🐾 เก็บ${name}ได้แล้ว!`, `${how}${GEM_ICON[tier]} ระดับ${TIERS[tier].label} · ดูได้ที่ เมนู → สัตว์ของฉัน`, 'discover')
}

function failed(id: string, tier: Tier, name: string) {
  const r = wild.get(id)!
  const fleeChance = tier === 'easy' ? 0 : CATCH_RULES[tier === 'legend' ? 'hard' : tier].fleeOnFail
  if (Math.random() < fleeChance) {
    r.status = 'fled'
    r.until = Date.now() + FLED_MS
    toast(`${name}ตกใจวิ่งหนีไปแล้ว`, 'รอสักพักแล้วจะกลับมาที่เดิม', 'warn')
  } else {
    r.scaredUntil = Date.now() + 1500
    toast('พลาด! ลองอีกครั้ง', `${name}ยังอยู่ใกล้ ๆ`, 'info')
  }
  useGame.getState().saveNow('event')
}

/** ตวัดสวิง (สัตว์เพชรเหลือง) */
function swingNet(id: string) {
  const r = wild.get(id)!
  const spawn = WILD_SPAWNS.find((s) => s.id === id)!
  const name = getSpecies(spawn.pet.species).label
  const p = wildPos.get(id) ?? spawn.home
  startCast(p[0], p[1], 900)
  captureFx.netUntil = performance.now() + 900
  const ok = Math.random() < 0.8
  window.setTimeout(() => {
    if (r.status !== 'free') return
    if (!ok) return failed(id, 'medium', name)
    r.netAt = performance.now()
    r.status = 'pulling'
    r.beam = false
    r.pullMs = 1100
    r.pullStart = performance.now()
    window.setTimeout(() => collect(id, 'ครอบด้วยสวิงสำเร็จ · '), 1100)
  }, 520)
}

/** วางกรงดักใส่กล้วย (สัตว์เพชรแดงที่เชื่องแล้ว) — สัตว์เดินเข้ากรงเอง */
function placeTrap(id: string) {
  const r = wild.get(id)!
  const spawn = WILD_SPAWNS.find((s) => s.id === id)!
  const name = getSpecies(spawn.pet.species).label
  use('treat')
  const [ax, az] = wildPos.get(id) ?? spawn.home
  // วางกรงห่างจากสัตว์ 1.6 ม. ไปทางผู้เล่น
  const dx = playerPose.x - ax
  const dz = playerPose.z - az
  const l = Math.hypot(dx, dz) || 1
  r.trap = { x: ax + (dx / l) * 1.6, z: az + (dz / l) * 1.6, at: performance.now() }
  bumpTraps()
  useGame.getState().doGesture('offer', 1200)
  toast(`🪤 วางกรงดักใส่กล้วยแล้ว`, `ถอยออกมาอยู่นิ่ง ๆ รอ${name}เดินเข้าไปกินเหยื่อ…`, 'info')
}

/** เรียกจากฉาก: สัตว์เดินถึงกรงแล้ว → ประตูตก */
export function springTrap(id: string) {
  const r = wild.get(id)
  if (!r?.trap || r.trap.shut) return
  const spawn = WILD_SPAWNS.find((s) => s.id === id)!
  const name = getSpecies(spawn.pet.species).label
  r.trap.shut = performance.now()
  bumpTraps()
  const ok = Math.random() < 0.85
  window.setTimeout(() => {
    if (ok) return collect(id, 'ประตูกรงตกปิดพอดี · ')
    r.trap = undefined
    r.tamed = false
    bumpTraps()
    r.scaredUntil = Date.now() + 2500
    toast(`${name}คาบกล้วยแล้วมุดหนีออกไปได้!`, 'ป้อนกล้วยให้เชื่องใหม่ แล้ววางกรงอีกครั้ง', 'warn')
    useGame.getState().saveNow('event')
  }, 900)
}

/** สัตว์ไม่เดินเข้ากรงนานเกิน (ผู้เล่นวิ่งเข้าใส่/อยู่ใกล้เกิน) → เก็บกรงคืน */
export function cancelTrap(id: string, why: string) {
  const r = wild.get(id)
  if (!r?.trap || r.trap.shut) return
  r.trap = undefined
  bumpTraps()
  toast('🪤 เก็บกรงคืนแล้ว', why, 'info')
}

/** กด E ใกล้สัตว์ */
export function tryCatch(id: string) {
  const r = wild.get(id)
  if (!r || r.status !== 'free' || r.trap) return
  const spawn = WILD_SPAWNS.find((s) => s.id === id)!
  const name = getSpecies(spawn.pet.species).label
  const tier = tierOf(id)
  let chance = 1
  let beam = false
  // ถือคฑาอยู่ (ของเก่า) = ใช้ลำแสงกับทุกระดับที่จับได้
  const wandHeld = useTools.getState().equipped === 'wand' && hasTool('wand')

  if (tier === 'easy') {
    if (countOf('feed') > 0) use('feed')
    beam = wandHeld
  } else if (tier === 'medium') {
    if (hasTool('net') && !wandHeld) return swingNet(id)
    if (hasTool('wand')) {
      beam = true
      chance = CATCH_RULES.medium.chance
    } else if (countOf('treat') > 0) {
      use('treat')
      chance = 0.6
    } else {
      toast(`${name}ยังไม่ยอมมาหา`, TIERS.medium.how, 'warn')
      return
    }
  } else if (tier === 'hard') {
    if (!r.tamed) {
      if (countOf('treat') === 0) {
        toast(`${name}ระแวงคน`, TIERS.hard.how, 'warn')
        return
      }
      use('treat')
      r.tamed = true
      useGame.getState().saveNow('event')
      toast(`${name}กินกล้วยแล้ว เริ่มเชื่อง`, hasTool('trap_cage') ? 'ตอนนี้วางกรงดักใส่กล้วยได้แล้ว (กด E อีกครั้ง)' : 'ต้องมีกรงดักสัตว์ (ร้านพี่แดง หรือประดิษฐ์ด้วยค้อน)', 'info')
      return
    }
    if (hasTool('trap_cage') && !wandHeld) {
      if (countOf('treat') === 0) return toast('ต้องมีกล้วยสุกไว้ใส่กรงเป็นเหยื่อ', 'ซื้อที่ร้านพี่แดง หรือลอกเชือกกล้วยแล้วบางทีได้กล้วยสุก', 'warn')
      return placeTrap(id)
    }
    if (!hasTool('wand')) {
      toast(`${name}เชื่องแล้ว แต่ต้องมีกรงดักสัตว์`, 'ซื้อที่ร้านพี่แดง (ซอย 5) หรือประดิษฐ์: ไม้กระดาน 2 กิ่งไม้ 4 เชือกกล้วย 3 + ค้อน', 'warn')
      return
    }
    beam = true
    chance = CATCH_RULES.hard.chance
  } else {
    return
  }

  // ใช้ลำแสง (คฑา): ถือคฑาให้อัตโนมัติ แล้วหันไปชี้ที่สัตว์
  const p = wildPos.get(id) ?? spawn.home
  const pullMs = beam ? (tier === 'easy' ? 1400 : tier === 'medium' ? 1900 : 2500) : PULL_MS
  if (beam) {
    if (useTools.getState().equipped !== 'wand') useTools.setState({ equipped: 'wand' })
  }
  if (Math.random() > chance) {
    if (beam) {
      r.resistUntil = performance.now() + 1100
      startCast(p[0], p[1], 1100)
    }
    return failed(id, tier, name)
  }

  // สำเร็จ: ดึงเข้าหาอย่างนุ่มนวล แล้วเข้าสมุดสะสม
  r.status = 'pulling'
  r.beam = beam
  r.pullMs = pullMs
  r.pullStart = performance.now()
  if (beam) startCast(p[0], p[1], pullMs)
  window.setTimeout(() => collect(id, beam ? 'ดูดเข้าคฑาสำเร็จ · ' : ''), pullMs)
}

/** เรียกสัตว์ออกมาเดินตาม (null = เก็บเข้าไปพักก่อน) */
export function summonPet(pet: import('./content/pets').PetChoice | null) {
  const g = useGame.getState()
  if (!g.save) return
  // เปลี่ยนตัวหรือเก็บสัตว์ = ลงจากหลังก่อน
  // ระบบทีม: ตัวนี้เป็นตัวหลัก (ตัวอื่นที่เดินตามอยู่ยังเดินตามต่อ)
  const key = pet ? (g.save.homePet && g.save.homePet.name === pet.name && g.save.homePet.species === pet.species ? 'home' : g.save.collection.find((c) => c.pet.name === pet.name && c.pet.species === pet.species && c.pet.color === pet.color)?.uid) : undefined
  const others = (g.save.activePets ?? []).filter((k) => k !== key)
  const activePets = pet ? (key ? [key, ...others].slice(0, 3) : undefined) : others.slice(0, 3)
  useGame.setState({ save: { ...g.save, activePets, player: { ...g.save.player, pet } }, dirty: true, riding: false })
  g.saveNow('event')
  toast(pet ? `${pet.name}ออกมาเดินตามแล้ว` : 'ให้สัตว์เลี้ยงพักก่อน', pet ? undefined : 'กดปุ่ม 🐾 เพื่อเรียกออกมาใหม่ได้ทุกเมื่อ', 'success')
}

/** ตั้งสัตว์จากสมุดสะสมเป็นสัตว์เลี้ยงที่เดินตาม */
export function setFollower(uid: string) {
  const g = useGame.getState()
  if (!g.save) return
  const c = g.save.collection.find((x) => x.uid === uid)
  if (!c) return
  const others = (g.save.activePets ?? []).filter((k) => k !== uid)
  useGame.setState({ save: { ...g.save, activePets: [uid, ...others].slice(0, 3), player: { ...g.save.player, pet: c.pet } }, dirty: true })
  g.saveNow('event')
  toast(`${c.pet.name}เดินตามคุณแล้ว`, undefined, 'success')
}

export const PULL_DURATION = PULL_MS
export const itemName = (id: ItemId) => ITEMS[id].name
