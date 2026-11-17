/**
 * ระบบเก็บสัตว์ (ไม่ใช้การปาบอล)
 * ง่าย = เข้าใกล้แล้วเก็บ · ปานกลาง = ไม้คฑา หรือกล้วยสุกล่อ · ยาก = ป้อนกล้วยให้เชื่องก่อน แล้วใช้ไม้คฑา
 * สถานะสัตว์ป่าแต่ละตัว (หนี/ถูกเก็บ/ฟื้นคืน) เก็บในหน่วยความจำ ไม่ต้องเซฟ
 */
import { useGame } from './store'
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
  /** ตกใจวิ่งหนีจนถึงเวลานี้ */
  scaredUntil: number
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

/** ข้อความบอกวิธีเก็บตัวที่อยู่ใกล้ */
export function catchHint(id: string) {
  const spawn = WILD_SPAWNS.find((s) => s.id === id)!
  const name = getSpecies(spawn.pet.species).label
  const tier = tierOf(id)
  const r = wild.get(id)!
  if (tier === 'easy') return `เก็บ${name}${countOf('feed') > 0 ? ' (ให้อาหารสัตว์)' : ''}`
  if (tier === 'medium') {
    if (hasTool('wand')) return `ใช้ไม้คฑาเก็บ${name}`
    if (countOf('treat') > 0) return `ล่อ${name}ด้วยกล้วยสุก`
    return `${name} (ต้องมีไม้คฑา หรือกล้วยสุก)`
  }
  if (!r.tamed) return countOf('treat') > 0 ? `ป้อนกล้วยให้${name}เชื่องก่อน` : `${name} (ต้องมีกล้วยสุกไว้ป้อนก่อน)`
  return hasTool('wand') ? `ใช้ไม้คฑาเก็บ${name}` : `${name} เชื่องแล้ว (ต้องมีไม้คฑา)`
}

/** กด E ใกล้สัตว์ */
export function tryCatch(id: string) {
  const r = wild.get(id)
  if (!r || r.status !== 'free') return
  const spawn = WILD_SPAWNS.find((s) => s.id === id)!
  const name = getSpecies(spawn.pet.species).label
  const tier = tierOf(id)
  let chance = 1
  let beam = false

  if (tier === 'easy') {
    if (countOf('feed') > 0) use('feed')
  } else if (tier === 'medium') {
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
      toast(`${name}กินกล้วยแล้ว เริ่มเชื่อง`, 'ตอนนี้ใช้ไม้คฑาได้แล้ว — อย่าวิ่งเข้าใส่นะ', 'info')
      return
    }
    if (!hasTool('wand')) {
      toast(`${name}เชื่องแล้ว แต่ต้องใช้ไม้คฑา`, 'คราฟหรือซื้อไม้คฑาที่ร้านป้าศรี', 'warn')
      return
    }
    beam = true
    chance = CATCH_RULES.hard.chance
  } else {
    return
  }

  if (Math.random() > chance) {
    const fleeChance = tier === 'easy' ? 0 : CATCH_RULES[tier].fleeOnFail
    if (Math.random() < fleeChance) {
      r.status = 'fled'
      r.until = Date.now() + FLED_MS
      toast(`${name}ตกใจวิ่งหนีไปแล้ว`, 'รอสักพักแล้วจะกลับมาที่เดิม', 'warn')
    } else {
      r.scaredUntil = Date.now() + 1500
      toast('พลาด! ลองอีกครั้ง', `${name}ยังอยู่ใกล้ ๆ`, 'info')
    }
    useGame.getState().saveNow('event')
    return
  }

  // สำเร็จ: ดึงเข้าหาอย่างนุ่มนวล แล้วเข้าสมุดสะสม
  r.status = 'pulling'
  r.beam = beam
  r.pullStart = performance.now()
  window.setTimeout(() => {
    r.status = 'caught'
    r.until = Date.now() + RESPAWN_MS
    const g = useGame.getState()
    if (!g.save) return
    const caught = { uid: `${spawn.id}-${Date.now().toString(36)}`, pet: { ...spawn.pet, name: getSpecies(spawn.pet.species).suggestName }, day: g.save.day }
    useGame.setState({ save: { ...g.save, collection: [...g.save.collection, caught] }, dirty: true })
    g.saveNow('event')
    toast(`🐾 เก็บ${name}ได้แล้ว!`, `ระดับ${TIERS[tier].label} · ดูได้ที่ เมนู → สัตว์ของฉัน`, 'discover')
  }, PULL_MS)
}

/** เรียกสัตว์ออกมาเดินตาม (null = เก็บเข้าไปพักก่อน) */
export function summonPet(pet: import('./content/pets').PetChoice | null) {
  const g = useGame.getState()
  if (!g.save) return
  // เปลี่ยนตัวหรือเก็บสัตว์ = ลงจากหลังก่อน
  useGame.setState({ save: { ...g.save, player: { ...g.save.player, pet } }, dirty: true, riding: false })
  g.saveNow('event')
  toast(pet ? `${pet.name}ออกมาเดินตามแล้ว` : 'ให้สัตว์เลี้ยงพักก่อน', pet ? undefined : 'กดปุ่ม 🐾 เพื่อเรียกออกมาใหม่ได้ทุกเมื่อ', 'success')
}

/** ตั้งสัตว์จากสมุดสะสมเป็นสัตว์เลี้ยงที่เดินตาม */
export function setFollower(uid: string) {
  const g = useGame.getState()
  if (!g.save) return
  const c = g.save.collection.find((x) => x.uid === uid)
  if (!c) return
  useGame.setState({ save: { ...g.save, player: { ...g.save.player, pet: c.pet } }, dirty: true })
  g.saveNow('event')
  toast(`${c.pet.name}เดินตามคุณแล้ว`, undefined, 'success')
}

export const PULL_DURATION = PULL_MS
export const itemName = (id: ItemId) => ITEMS[id].name
