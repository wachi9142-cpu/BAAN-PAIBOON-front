/**
 * หีบสมบัติ: เดินไปใกล้แล้วกด E → ฝาหีบเปิด มีประกาย → ได้เงิน/ของ
 * หีบไม้/เหล็ก/เวทมนตร์ มีของใหม่อีกครั้งหลังผ่านไปหลายวันในเกม · หีบโบราณ/หีบลับ เปิดได้ครั้งเดียว
 * หีบโบราณต้องใช้กุญแจโบราณ (ได้จากหีบลับ)
 */
import { create } from 'zustand'
import { useGame } from './store'
import { addItem, countOf } from './inventory'
import { nowMinute } from './garden'
import { ITEMS } from './content/items'
import { CHEST_KINDS, CHEST_SPOTS, type ChestSpot } from './content/treasure'

interface ChestUi {
  near: string | null
}
export const useChests = create<ChestUi>(() => ({ near: null }))

/** เวลาเปิดฝาล่าสุด (performance.now) — ฉาก 3D ใช้ทำแอนิเมชัน */
export const chestFx = new Map<string, number>()

const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' | 'discover' = 'info') => useGame.getState().toast({ title, body, tone })

export function findChest(x: number, z: number): string | null {
  let best: string | null = null
  let bd = 2.3
  for (const c of CHEST_SPOTS) {
    const d = Math.hypot(c.pos[0] - x, c.pos[1] - z)
    if (d < bd) {
      bd = d
      best = c.id
    }
  }
  return best
}

const spot = (id: string) => CHEST_SPOTS.find((c) => c.id === id)!

/** หีบว่างอยู่ไหม (เปิดไปแล้วและยังไม่ถึงเวลามีของใหม่) */
export function isEmpty(c: ChestSpot, now = nowMinute()) {
  const at = useGame.getState().save?.chestsOpened?.[c.id]
  if (at === undefined) return false
  const refill = CHEST_KINDS[c.kind].refillDays
  return refill === undefined || now < at + refill * 1440
}

export function chestHint(id: string) {
  const c = spot(id)
  const def = CHEST_KINDS[c.kind]
  if (isEmpty(c)) {
    if (def.refillDays === undefined) return `${def.name} (เปิดไปแล้ว)`
    const at = useGame.getState().save!.chestsOpened![c.id]
    const left = Math.ceil((at + def.refillDays * 1440 - nowMinute()) / 1440)
    return `${def.name}ว่างเปล่า (มีของใหม่ในอีก ~${left} วัน)`
  }
  if (def.needs && countOf(def.needs) <= 0) return `🔒 ${def.name} — ต้องมี${ITEMS[def.needs].name}`
  return `🎁 เปิด${def.name}`
}

const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1))

export function openChest(id: string) {
  const g = useGame.getState()
  if (!g.save) return
  const c = spot(id)
  const def = CHEST_KINDS[c.kind]
  if (isEmpty(c)) {
    toast(chestHint(id), def.refillDays ? 'แวะมาใหม่ภายหลังนะ' : undefined, 'info')
    return
  }
  if (def.needs && countOf(def.needs) <= 0) {
    toast(`🔒 ${def.name}ล็อกอยู่`, `ต้องใช้${ITEMS[def.needs].name} — ลองออกสำรวจหาหีบลับในป่าดูนะ`, 'warn')
    return
  }
  // ใช้กุญแจ
  if (def.needs) {
    const inv = { ...g.save.inventory }
    inv[def.needs] = (inv[def.needs] ?? 0) - 1
    if ((inv[def.needs] ?? 0) <= 0) delete inv[def.needs]
    useGame.setState({ save: { ...g.save, inventory: inv } })
  }
  const got: string[] = []
  let coins = 0
  for (const l of def.loot) {
    if (Math.random() > (l.chance ?? 1)) continue
    if (l.coins) coins += rand(l.coins[0], l.coins[1])
    if (l.item) {
      const want = l.qty ? rand(l.qty[0], l.qty[1]) : 1
      const n = addItem(l.item, want)
      if (n > 0) got.push(`${ITEMS[l.item].name} +${n}`)
      else got.push(`(กระเป๋าเต็ม — ${ITEMS[l.item].name} ใส่ไม่ได้)`)
    }
  }
  const s = useGame.getState().save!
  useGame.setState({ save: { ...s, chestsOpened: { ...(s.chestsOpened ?? {}), [id]: nowMinute() } }, dirty: true })
  if (coins > 0) useGame.getState().addCoins(coins, `เปิด${def.name}`)
  chestFx.set(id, performance.now())
  playChestSound(c.kind === 'magic' || c.kind === 'ancient')
  useGame.getState().changeStats({ fun: 4 })
  useGame.getState().saveNow('event')
  toast(`✨ เปิด${def.name}แล้ว!`, [coins > 0 ? `เงิน +${coins} บาท` : '', ...got].filter(Boolean).join(' · '), 'discover')
}

// ---------- เสียงเปิดหีบ: เอี๊ยด + กริ๊งระยิบระยับ ----------
let ctx: AudioContext | null = null
function playChestSound(magic: boolean) {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const c = ctx
    const t = c.currentTime + 0.02
    const o = c.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(220, t)
    o.frequency.linearRampToValueAtTime(330, t + 0.35)
    const f = c.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 900
    f.Q.value = 6
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
    o.connect(f).connect(g).connect(c.destination)
    o.start(t)
    o.stop(t + 0.45)
    const notes = magic ? [1046, 1318, 1568, 2093, 2637] : [1318, 1568, 2093]
    notes.forEach((hz, i) => {
      const n = c.createOscillator()
      n.type = 'sine'
      n.frequency.value = hz
      const ng = c.createGain()
      const st = t + 0.35 + i * 0.09
      ng.gain.setValueAtTime(0.0001, st)
      ng.gain.exponentialRampToValueAtTime(0.12, st + 0.01)
      ng.gain.exponentialRampToValueAtTime(0.0001, st + 0.6)
      n.connect(ng).connect(c.destination)
      n.start(st)
      n.stop(st + 0.65)
    })
  } catch {
    /* ไม่มีเสียงก็ไม่เป็นไร */
  }
}
