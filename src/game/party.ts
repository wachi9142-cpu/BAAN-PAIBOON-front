/**
 * ทีมสัตว์เลี้ยง (Pet Party): เลือกเข้าทีมได้ 9 ตัว · เรียกออกมาเดินตามพร้อมกันได้สูงสุด 3 ตัว
 * กุญแจของสัตว์ = 'home' (สัตว์คู่ใจ) หรือ uid ในสมุดสะสม
 * ตัวแรกที่เรียกออกมา = ตัวหลัก (player.pet) ใช้ขี่ จูง ช่วยตอนตกน้ำ
 */
import { create } from 'zustand'
import { useGame } from './store'
import type { PetChoice } from './content/pets'

export const PARTY_SIZE = 9
export const MAX_ACTIVE = 3

export interface OwnedPet {
  key: string
  pet: PetChoice
  note: string
}

const same = (a?: PetChoice | null, b?: PetChoice | null) => !!a && !!b && a.species === b.species && a.name === b.name && a.color === b.color

/** สัตว์ทั้งหมดที่มี (สัตว์คู่ใจ + สัตว์ที่จับได้) */
export function ownedPets(): OwnedPet[] {
  const s = useGame.getState().save
  if (!s) return []
  const out: OwnedPet[] = []
  if (s.homePet) out.push({ key: 'home', pet: s.homePet, note: 'สัตว์เลี้ยงคู่ใจ' })
  for (const c of s.collection) if (!(s.homePet && same(c.pet, s.homePet))) out.push({ key: c.uid, pet: c.pet, note: `จับได้วันที่ ${c.day}` })
  return out
}
export function petOf(key: string): OwnedPet | undefined {
  return ownedPets().find((p) => p.key === key)
}

/** ทีม 9 ช่อง (null = ช่องว่าง) — ยังไม่เคยจัด = เอาตัวที่มีเรียงเข้าทีมอัตโนมัติ */
export function partySlots(): (string | null)[] {
  const s = useGame.getState().save
  const owned = ownedPets()
  const keys = new Set(owned.map((o) => o.key))
  const base = s?.party ?? owned.slice(0, PARTY_SIZE).map((o) => o.key)
  const slots = Array.from({ length: PARTY_SIZE }, (_, i) => (base[i] && keys.has(base[i]!) ? base[i]! : null))
  return slots
}

/** ตัวที่เรียกออกมาเดินตามอยู่ (สูงสุด 3) */
export function activeKeys(): string[] {
  const s = useGame.getState().save
  if (!s) return []
  if (s.activePets) return s.activePets.filter((k) => !!petOf(k)).slice(0, MAX_ACTIVE)
  // เซฟเก่า: ใช้สัตว์ที่เดินตามอยู่ตอนนี้
  const cur = s.player.pet
  const o = cur ? ownedPets().find((p) => same(p.pet, cur)) : undefined
  return o ? [o.key] : []
}

function write(party: (string | null)[], active: string[], toastMsg?: { title: string; body?: string }) {
  const g = useGame.getState()
  if (!g.save) return
  const lead = active[0] ? petOf(active[0])?.pet ?? null : null
  useGame.setState({
    save: { ...g.save, party: party.map((k) => k ?? '') , activePets: active, player: { ...g.save.player, pet: lead } },
    dirty: true,
    riding: lead && g.save.player.pet && same(lead, g.save.player.pet) ? g.riding : false,
  })
  g.saveNow('event')
  if (toastMsg) g.toast({ ...toastMsg, tone: 'success' })
}

/** วางสัตว์ลงช่องทีม (key = null → เอาออกจากช่อง) */
export function setPartySlot(i: number, key: string | null) {
  const party = partySlots()
  if (key) {
    const j = party.indexOf(key)
    if (j >= 0) party[j] = party[i] // สลับช่อง
  }
  party[i] = key
  // เอาออกจากทีมแล้ว ก็เก็บกลับไม่ให้เดินตาม
  const active = activeKeys().filter((k) => party.includes(k))
  write(party, active)
}

/** เรียกออกมา / เก็บเข้า (สูงสุด 3 ตัวพร้อมกัน) */
export function toggleActive(key: string) {
  const active = activeKeys()
  const party = partySlots()
  const p = petOf(key)
  if (!p) return
  if (active.includes(key)) {
    write(party, active.filter((k) => k !== key), { title: `ให้${p.pet.name}พักก่อน`, body: 'ยังอยู่ในทีม เรียกออกมาใหม่ได้ทุกเมื่อ' })
    return
  }
  if (active.length >= MAX_ACTIVE) {
    useGame.getState().toast({ title: 'เรียกออกมาได้สูงสุด 3 ตัว', body: 'เก็บตัวใดตัวหนึ่งเข้าก่อน แล้วค่อยเรียกตัวใหม่', tone: 'warn' })
    return
  }
  // ยังไม่อยู่ในทีม → ใส่ช่องว่างแรก
  if (!party.includes(key)) {
    const e = party.indexOf(null)
    if (e < 0) {
      useGame.getState().toast({ title: 'ทีมเต็ม 9 ตัวแล้ว', body: 'เอาตัวใดตัวหนึ่งออกจากทีมก่อน', tone: 'warn' })
      return
    }
    party[e] = key
  }
  write(party, [...active, key], { title: `${p.pet.name}ออกมาเดินตามแล้ว`, body: `เดินตามอยู่ ${active.length + 1}/${MAX_ACTIVE} ตัว` })
}

/** ให้ตัวนี้เป็นตัวหลัก (ขี่/จูงได้) */
export function makeLead(key: string) {
  const active = activeKeys()
  if (!active.includes(key)) return
  write(partySlots(), [key, ...active.filter((k) => k !== key)])
}

// ---------- บุคลิก (ทำให้แต่ละตัวเดินตามไม่เหมือนกัน) ----------
export type Mood = 'playful' | 'shy' | 'lazy' | 'loyal' | 'curious' | 'fierce'
export const MOODS: Record<Mood, { label: string; note: string; follow: number; play: number; speed: number; sit: number }> = {
  playful: { label: 'ขี้เล่น', note: 'ชอบวิ่งเล่นรอบตัว ไม่ค่อยอยู่นิ่ง', follow: 1, play: 0.45, speed: 1.1, sit: 1.5 },
  shy: { label: 'ขี้อาย', note: 'เดินตามห่าง ๆ ระวังตัว', follow: 1.6, play: 2, speed: 0.95, sit: 1 },
  lazy: { label: 'ขี้เกียจ', note: 'ชอบนั่งชอบนอน เดินช้า', follow: 1.2, play: 3, speed: 0.8, sit: 0.4 },
  loyal: { label: 'ซื่อสัตย์', note: 'เดินชิดเจ้าของเสมอ', follow: 0.75, play: 1.5, speed: 1.05, sit: 1 },
  curious: { label: 'อยากรู้อยากเห็น', note: 'ชอบเดินสำรวจ ดมโน่นนี่', follow: 1.3, play: 0.7, speed: 1, sit: 1.2 },
  fierce: { label: 'ดุ', note: 'หวงเจ้าของ เดินนำหน้า ใครเข้าใกล้ก็เห่า', follow: 0.85, play: 1.2, speed: 1.1, sit: 1.3 },
}
/** สัตว์ของผู้สร้างที่บอกนิสัยไว้แล้ว (ชื่อ → นิสัยหลัก + นิสัยเสริม) — ผู้สร้าง 19 พ.ย.: โด่ง = ดุ เห่าเก่ง ตะกละ */
export const KNOWN_TRAITS: Record<string, { mood: Mood; extra: ('barky' | 'greedy')[] }> = {
  โด่ง: { mood: 'fierce', extra: ['barky', 'greedy'] },
}
const knownOf = (pet: PetChoice) => KNOWN_TRAITS[pet.name.trim()]
/** ข้อความนิสัยเต็ม เช่น "ดุ · เห่าเก่ง · ตะกละ" */
export function traitText(key: string, pet: PetChoice) {
  const k = knownOf(pet)
  const base = MOODS[moodOf(key, pet)].label
  if (!k) return base
  return [base, ...k.extra.map((e) => (e === 'barky' ? 'เห่าเก่ง' : 'ตะกละ'))].join(' · ')
}
export const isBarky = (pet: PetChoice) => !!knownOf(pet)?.extra.includes('barky')
export const isGreedy = (pet: PetChoice) => !!knownOf(pet)?.extra.includes('greedy')
const MOOD_ORDER: Mood[] = ['playful', 'shy', 'lazy', 'loyal', 'curious']
export function moodOf(key: string, pet: PetChoice): Mood {
  const k = knownOf(pet)
  if (k) return k.mood
  if (pet.mood) return pet.mood
  let h = 0
  for (const c of key + pet.name + pet.species) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return MOOD_ORDER[h % MOOD_ORDER.length]
}

/** หน้าต่างทีมสัตว์เลี้ยง */
export const usePartyUi = create<{ open: boolean; sel: string | null }>(() => ({ open: false, sel: null }))
export const openParty = (sel?: string) => usePartyUi.setState({ open: true, sel: sel ?? activeKeys()[0] ?? partySlots().find((k) => !!k) ?? null })
