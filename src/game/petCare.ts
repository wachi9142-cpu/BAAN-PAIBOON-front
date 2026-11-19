/**
 * การ์ดสัตว์เลี้ยง: สถานะรายตัว (ความสุข · ความอิ่ม · พลังงาน · ความผูกพัน) + สกิล 4 อย่าง
 * ค่าลด/ฟื้นตามเวลาที่เล่นจริง (คำนวณย้อนหลังจาก playSeconds ไม่ต้องอัปเดตทุกเฟรม)
 */
import { MAX_PET_HEARTS, useGame } from './store'
import { activeKeys, moodOf, MOODS, petOf, toggleActive , isGreedy } from './party'
import { getSpecies, type PetChoice, type PetSpecies } from './content/pets'
import { playPetSound } from './audio/petSounds'
import { whistleState } from './whistle'
import { wild, wildPos, tierOf } from './catching'
import { WILD_SPAWNS } from './content/wildlife'
import { playerPose } from './playerPose'
import { addItem } from './inventory'
import { ITEMS, type ItemId } from './content/items'

export interface PetCare {
  happy: number
  /** ความอิ่ม (100 = อิ่มเต็มที่) */
  full: number
  energy: number
  /** ความผูกพัน 0–10 (แสดงเป็นหัวใจ 5 ดวง ดวงละ 2) */
  bond: number
  /** playSeconds ตอนอัปเดตล่าสุด */
  t: number
  /** เวลาจริงที่ใช้สกิลล่าสุด (กันกดรัว) */
  hugAt?: number
  digAt?: number
}

const clamp = (v: number) => Math.max(0, Math.min(100, v))

/** สถานะปัจจุบันของสัตว์ตัวนี้ (คิดการลด/ฟื้นตามเวลาให้แล้ว) */
export function careOf(key: string): PetCare {
  const s = useGame.getState().save
  const now = s?.playSeconds ?? 0
  const base: PetCare = s?.petCare?.[key] ?? { happy: 80, full: 70, energy: 90, bond: key === 'home' ? s?.petHearts ?? 0 : 0, t: now }
  const min = Math.max(0, now - base.t) / 60
  const out = activeKeys().includes(key)
  return {
    ...base,
    happy: clamp(base.happy - min * 0.3 + (out ? min * 0.15 : 0)),
    full: clamp(base.full - min * 0.5),
    // เดินตามอยู่ = เหนื่อยช้า ๆ · พักในทีม = ฟื้นแรง
    energy: clamp(base.energy + (out ? -min * 0.4 : min * 1.2)),
    t: now,
  }
}

function writeCare(key: string, c: PetCare) {
  const g = useGame.getState()
  if (!g.save) return
  useGame.setState({ save: { ...g.save, petCare: { ...(g.save.petCare ?? {}), [key]: c } }, dirty: true })
}

/** เพศ (ไม่ได้เลือกไว้ = สุ่มแบบคงที่จากชื่อ) */
/** สัตว์ของผู้สร้างที่บอกเพศไว้แล้ว (ชื่อ → เพศ) — ผู้สร้าง 19 พ.ย.: โด่ง = ตัวผู้ */
const KNOWN_SEX: Record<string, 'm' | 'f'> = { โด่ง: 'm', ประยุทธ: 'm' }
export function sexOf(key: string, pet: PetChoice): 'ผู้' | 'เมีย' {
  if (pet.sex) return pet.sex === 'm' ? 'ผู้' : 'เมีย'
  const known = KNOWN_SEX[pet.name.trim()]
  if (known) return known === 'm' ? 'ผู้' : 'เมีย'
  let h = 7
  for (const c of key + pet.name) h = (h * 33 + c.charCodeAt(0)) >>> 0
  return h % 2 ? 'ผู้' : 'เมีย'
}

const FOOD: Partial<Record<PetSpecies, string>> = {
  dog: 'ข้าวเหนียวหมูปิ้ง',
  cat: 'ปลาทูนึ่ง',
  buffalo: 'หญ้าอ่อนริมนา',
  cow: 'ฟางข้าวหอม',
  pig: 'ฟักทองต้ม',
  chicken: 'ข้าวเปลือก',
  duck: 'แหนในบ่อ',
  goose: 'ผักบุ้ง',
  monkey: 'กล้วยน้ำว้า',
  rabbit: 'ใบผักบุ้ง',
  squirrel: 'มะพร้าวขูด',
  bird: 'เมล็ดหญ้า',
  turtle: 'ผักกาด',
}

/** คำบรรยายสั้น ๆ ตามนิสัย */
export function blurbOf(key: string, pet: PetChoice) {
  const m = MOODS[moodOf(key, pet)]
  const sp = getSpecies(pet.species).label
  const food = FOOD[pet.species] ?? 'ของกินในหมู่บ้าน'
  return `${sp}${m.label}ประจำบ้าน ${m.note} ชอบกิน${food}`
}

/* ───────── สกิล 4 อย่าง ───────── */
export interface PetSkill {
  id: 'come' | 'guard' | 'hug' | 'dig'
  icon: string
  name: string
  note: string
}
export function skillsOf(pet: PetChoice): PetSkill[] {
  const sp = pet.species
  const guard =
    sp === 'dog'
      ? { name: 'เห่าเฝ้าบ้าน', note: 'ไล่สัตว์ตัวเล็กแถวนี้' }
      : sp === 'cat'
        ? { name: 'ขู่ฟ่อ', note: 'ไล่สัตว์ตัวเล็กแถวนี้' }
        : sp === 'goose'
          ? { name: 'ห่านเฝ้าบ้าน', note: 'ร้องไล่สัตว์ตัวเล็ก' }
          : { name: 'ส่งเสียงเตือน', note: 'ไล่สัตว์ตัวเล็กแถวนี้' }
  return [
    { id: 'come', icon: '🐾', name: 'ตามมา!', note: 'วิ่งมาหาเจ้าของ' },
    { id: 'guard', icon: '🦴', ...guard },
    { id: 'hug', icon: '💗', name: 'ขอกอด', note: 'เพิ่มความผูกพัน' },
    { id: 'dig', icon: '🌱', name: 'ขุดหาของ', note: 'เจอของสุ่ม' },
  ]
}

const HUG_CD = 60_000
const DIG_CD = 120_000
const DIG_ENERGY = 15

/** เหตุผลที่ใช้สกิลไม่ได้ตอนนี้ (null = ใช้ได้) */
export function skillProblem(key: string, id: PetSkill['id']): string | null {
  const c = careOf(key)
  const out = activeKeys().includes(key)
  const now = Date.now()
  if (id === 'guard' && !out) return 'เรียกออกมาเดินตามก่อน'
  if (id === 'dig') {
    if (!out) return 'เรียกออกมาเดินตามก่อน'
    if (c.energy < DIG_ENERGY) return 'เหนื่อยแล้ว ให้พักก่อน'
    if (c.digAt && now - c.digAt < DIG_CD) return `รออีก ${Math.ceil((DIG_CD - (now - c.digAt)) / 1000)} วิ`
  }
  if (id === 'hug' && c.hugAt && now - c.hugAt < HUG_CD) return `เพิ่งกอดไป รออีก ${Math.ceil((HUG_CD - (now - c.hugAt)) / 1000)} วิ`
  return null
}

const DIG_TABLE: { w: number; item?: ItemId; qty?: [number, number]; coins?: [number, number] }[] = [
  { w: 22, item: 'stone', qty: [1, 2] },
  { w: 20, item: 'branch', qty: [1, 3] },
  { w: 10, item: 'seed_morningglory', qty: [1, 2] },
  { w: 8, item: 'seed_chili', qty: [1, 2] },
  { w: 8, item: 'seed_pumpkin', qty: [1, 1] },
  { w: 18, coins: [5, 20] },
  { w: 3, item: 'oldkey', qty: [1, 1] },
]
const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))

export function doSkill(key: string, id: PetSkill['id']) {
  const g = useGame.getState()
  const o = petOf(key)
  if (!g.save || !o) return
  const why = skillProblem(key, id)
  if (why) return g.toast({ title: 'ยังใช้ไม่ได้', body: why, tone: 'warn' })
  const c = careOf(key)
  const name = o.pet.name
  if (id === 'come') {
    if (!activeKeys().includes(key)) toggleActive(key)
    // ใช้สัญญาณเดียวกับผิวปาก: สัตว์ที่เดินตามลุกขึ้นวิ่งมาหา
    whistleState.at = performance.now() - 700
    playPetSound(o.pet, 0.6)
    writeCare(key, { ...careOf(key), energy: clamp(c.energy - 3), happy: clamp(c.happy + 2) })
    g.toast({ title: `🐾 ${name} วิ่งมาหาแล้ว`, tone: 'info' })
  } else if (id === 'guard') {
    playPetSound(o.pet, 0.8)
    window.setTimeout(() => playPetSound(o.pet, 0.7), 380)
    const t = Date.now()
    let n = 0
    for (const s of WILD_SPAWNS) {
      const r = wild.get(s.id)
      if (!r || r.status !== 'free') continue
      const tier = tierOf(s.id)
      if (tier !== 'easy' && tier !== 'medium') continue
      const p = wildPos.get(s.id) ?? s.home
      if (Math.hypot(p[0] - playerPose.x, p[1] - playerPose.z) > 14) continue
      r.scaredUntil = t + 4000
      n++
    }
    writeCare(key, { ...c, energy: clamp(c.energy - 5) })
    g.toast({ title: `🦴 ${name} ส่งเสียงไล่`, body: n ? `สัตว์ตัวเล็ก ${n} ตัววิ่งหนีไปแล้ว` : 'แถวนี้ปลอดภัย ไม่มีอะไรมากวน', tone: 'info' })
  } else if (id === 'hug') {
    const bond = Math.min(MAX_PET_HEARTS, c.bond + 1)
    writeCare(key, { ...c, bond, happy: clamp(c.happy + 12), hugAt: Date.now() })
    // ตัวหลัก/สัตว์คู่ใจ: ใช้หัวใจเดิมของเกมด้วย (ขี่/ช่วยตกน้ำใช้ค่านี้)
    if (activeKeys()[0] === key) g.addPetHeart()
    else g.toast({ title: `💗 ${name} รักคุณมากขึ้น`, body: `ความผูกพัน ${bond}/${MAX_PET_HEARTS}`, tone: 'discover' })
    playPetSound(o.pet, 0.5)
  } else if (id === 'dig') {
    const total = DIG_TABLE.reduce((a, b) => a + b.w, 0)
    let r = Math.random() * total
    const hit = DIG_TABLE.find((d) => (r -= d.w) < 0) ?? DIG_TABLE[0]
    writeCare(key, { ...c, energy: clamp(c.energy - DIG_ENERGY), full: clamp(c.full - 5), happy: clamp(c.happy + 4), digAt: Date.now() })
    if (hit.coins) {
      const amt = rnd(...hit.coins)
      g.addCoins(amt, `🌱 ${name} ขุดเจอเหรียญ`)
    } else if (hit.item) {
      const q = rnd(...hit.qty!)
      const got = addItem(hit.item, q)
      const it = ITEMS[hit.item]
      g.toast(got > 0 ? { title: `🌱 ${name} ขุดเจอ ${it.icon} ${it.name} ×${got}`, tone: 'success' } : { title: `${name} ขุดเจอ ${it.name}`, body: 'แต่กระเป๋าเต็มแล้ว', tone: 'warn' })
    }
  }
  g.saveNow('event')
}

/** ให้อาหาร (ใช้อาหารสัตว์ หรือกล้วยสุก) */
export function feedPet(key: string) {
  const g = useGame.getState()
  const o = petOf(key)
  if (!g.save || !o) return
  const inv = g.save.inventory
  const food: ItemId | null = (inv.feed ?? 0) > 0 ? 'feed' : (inv.treat ?? 0) > 0 ? 'treat' : null
  if (!food) return g.toast({ title: 'ไม่มีอาหารสัตว์', body: 'ซื้ออาหารสัตว์ที่ร้าน หรือเก็บกล้วยสุกจากเถาวัลย์', tone: 'warn' })
  const next = { ...inv, [food]: (inv[food] ?? 0) - 1 }
  if ((next[food] ?? 0) <= 0) delete next[food]
  const c = careOf(key)
  useGame.setState({ save: { ...g.save, inventory: next }, dirty: true })
  writeCare(key, { ...c, full: clamp(c.full + (food === 'feed' ? 35 : 20)), happy: clamp(c.happy + 5) })
  playPetSound(o.pet, 0.5)
  // ตะกละ: กินเกลี้ยงแล้วยังขออีก (ดีใจมากกว่าปกติ)
  if (isGreedy(o.pet)) writeCare(key, { ...careOf(key), happy: clamp(careOf(key).happy + 8) })
  g.toast({ title: isGreedy(o.pet) ? `🍚 ${o.pet.name} กินเกลี้ยงชาม แล้วยังมองหาอีก!` : `🍚 ${o.pet.name} กินอิ่มแล้ว`, body: `ใช้${ITEMS[food].name} 1 ชิ้น${isGreedy(o.pet) ? ' · ตะกละมาก ดีใจสุด ๆ' : ''}`, tone: 'success' })
}

/** อายุ (วันที่อยู่ด้วยกัน) */
export function ageDays(key: string): number {
  const s = useGame.getState().save
  if (!s) return 0
  const c = s.collection.find((x) => x.uid === key)
  return Math.max(1, s.day - (c ? c.day : 1) + 1)
}

/** เลเวล: โตขึ้นตามความผูกพันและเวลาที่อยู่ด้วยกัน (ไม่ขึ้นกับเพศ) */
export function levelOf(key: string): number {
  return 1 + Math.floor(careOf(key).bond / 2) + Math.floor(ageDays(key) / 7)
}

/** เปลี่ยนชื่อ: ตั้งอิสระ ไม่ผูกกับเพศ · เพศ/นิสัยเดิมไม่เปลี่ยน */
export function renamePet(key: string, raw: string): string | null {
  const name = raw.trim().slice(0, 20)
  if (!name) return 'ใส่ชื่อก่อนนะ'
  const g = useGame.getState()
  const o = petOf(key)
  if (!g.save || !o) return 'ไม่พบสัตว์ตัวนี้'
  const old = o.pet
  const pet: PetChoice = { ...old, name, sex: old.sex ?? (sexOf(key, old) === 'ผู้' ? 'm' : 'f'), mood: moodOf(key, old) }
  const same = (p?: PetChoice | null) => !!p && p.species === old.species && p.name === old.name && p.color === old.color
  const save = g.save
  useGame.setState({
    save: {
      ...save,
      homePet: key === 'home' ? pet : save.homePet,
      collection: save.collection.map((c) => (c.uid === key ? { ...c, pet } : c)),
      player: { ...save.player, pet: same(save.player.pet) ? pet : save.player.pet },
    },
    dirty: true,
  })
  g.saveNow('event')
  g.toast({ title: 'เปลี่ยนชื่อแล้ว', body: old.name + ' → ' + name, tone: 'success' })
  return null
}

export const BOND_HEARTS = 5
export { getSpecies }
