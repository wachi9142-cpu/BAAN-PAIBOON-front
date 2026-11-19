/**
 * ตัดต้นไม้: ถือขวาน (หรือมือเปล่า) → กด E ฟันทีละครั้ง → ต้นไม้สั่น มีรอยฟัน → ครบความทนทานแล้วล้ม
 * → กิ่งไม้ ท่อนไม้ ใบไม้ ร่วงบนพื้น → เดินผ่านเพื่อเก็บเข้ากระเป๋า → เหลือตอไม้ (งอกใหม่เองช้า ๆ หรือปลูกต้นกล้าแทน)
 */
import { create } from 'zustand'
import { useGame } from './store'
import { addItem, countOf } from './inventory'
import { nowMinute } from './garden'
import { ITEMS, type ItemId } from './content/items'
import { CHOP_TOOLS, HAND_HURT, REGROW_DAYS, SAPLING_DAYS, TREE_RULES, type ChopTool } from './content/trees'
import { TREES } from './content/village'
import type { GroundDrop, TreeState } from './treeTypes'
import { useSettings } from './settings'
import { handStatus, registerStrike, restingHand } from './handStrike'
import { ROCKS } from './content/village'

// ---------- เครื่องมือในมือ ----------
export type HeldTool = ChopTool | 'wand'
interface ToolState {
  equipped: HeldTool
}
export const useTools = create<ToolState>(() => ({ equipped: 'hand' }))

/** เครื่องมือที่มีให้เลือก (มือเปล่ามีเสมอ) */
export const toolChoices = (): HeldTool[] => ['hand', ...(['axe', 'axe2', 'wand'] as const).filter((t) => countOf(t) > 0)]

/** เครื่องมือที่ใช้ฟันต้นไม้ (ถือคฑาอยู่ = ทุบด้วยมือ) */
export const chopTool = (): ChopTool => {
  const e = useTools.getState().equipped
  return e === 'wand' ? 'hand' : e
}

export function equip(t: HeldTool) {
  if (t !== 'hand' && countOf(t) <= 0) return
  useTools.setState({ equipped: t })
  if (t === 'wand') {
    useGame.getState().toast({ title: '✨ ถือคฑาจับสัตว์', body: 'เดินไปใกล้สัตว์ที่มีป้ายสีแล้วกด E เพื่อยิงลำแสง · เปลี่ยนสีอัญมณีได้ที่แถบเครื่องมือ', tone: 'info' })
    return
  }
  const d = CHOP_TOOLS[t]
  useGame.getState().toast({ title: `${d.icon} ถือ${d.name}`, body: t === 'hand' ? 'ทุบต้นไม้และก้อนหินด้วยมือได้ · ทุบติดกันเกิน 20 ครั้งจะเริ่มเจ็บมือ' : 'เดินไปที่ต้นไม้แล้วกด E เพื่อฟัน', tone: 'info' })
}

/** ขวานหาย (ขายไปแล้ว) → กลับเป็นมือเปล่า */
export function checkEquipped() {
  const t = useTools.getState().equipped
  if (t !== 'hand' && countOf(t) <= 0) useTools.setState({ equipped: 'hand' })
}

// ---------- จังหวะเหวี่ยง (Player อ่านทุกเฟรม) ----------
/** progress: -1 = ไม่ได้เหวี่ยง, 0→1 = กำลังเหวี่ยง · hit ที่ 0.55 */
export const swing = { current: -1, tree: -1, dur: 0.6, hit: false, queued: false, kind: 'tree' as 'tree' | 'rock' }
export const IMPACT = 0.55

/** เอฟเฟกต์ของแต่ละต้น (เวลาจริง ms): สั่น / เริ่มล้ม */
export const treeFx = new Map<number, { shakeAt?: number; fallAt?: number }>()

const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' = 'info') => useGame.getState().toast({ title, body, tone })

// ---------- สถานะต้นไม้ ----------
export type TreePhase = 'standing' | 'stump' | 'sapling'

export function treePhase(st: TreeState | undefined, now: number): TreePhase {
  if (!st?.felledAt) return 'standing'
  if (st.plantedAt !== undefined) return now >= st.plantedAt + SAPLING_DAYS * 1440 ? 'standing' : 'sapling'
  return now >= st.felledAt + REGROW_DAYS * 1440 ? 'standing' : 'stump'
}

/** ความโตของต้นกล้า 0–1 */
export const saplingGrowth = (st: TreeState, now: number) => Math.min(1, Math.max(0, (now - (st.plantedAt ?? now)) / (SAPLING_DAYS * 1440)))

function treeState(i: number): TreeState | undefined {
  return useGame.getState().save?.trees[String(i)]
}

function setTree(i: number, st: TreeState | null, extra?: { drops?: GroundDrop[]; inventory?: Partial<Record<ItemId, number>> }) {
  const g = useGame.getState()
  if (!g.save) return
  const trees = { ...g.save.trees }
  if (st) trees[String(i)] = st
  else delete trees[String(i)]
  useGame.setState({ save: { ...g.save, trees, ...(extra ?? {}) }, dirty: true })
}

/** ป้ายกลางจอ */
export function treeHint(i: number) {
  const tr = TREES[i]
  const rule = TREE_RULES[tr.kind]
  const st = treeState(i)
  const phase = treePhase(st, nowMinute())
  if (phase === 'stump') return countOf('sapling') > 0 ? `🌱 ปลูกต้นกล้าแทนตอ${rule.name}` : `🌳 ตอ${rule.name} (ปลูกต้นกล้าแทนได้ — ซื้อที่ร้านป้าศรี)`
  if (phase === 'sapling') return `🌱 ต้นกล้ากำลังโต`
  const tool = CHOP_TOOLS[chopTool()]
  const left = Math.max(1, Math.ceil((rule.hp - (st && !st.felledAt ? st.dmg : 0)) / tool.power))
  if (tool.id === 'hand') return `✋ ทุบ${rule.name}ด้วยมือ (อีก ${left} ครั้ง · ${handStatus('tree')})`
  return `🪓 ฟัน${rule.name} (อีก ${left} ครั้ง)`
}

/** กด E ที่ต้นไม้/ตอไม้ */
export function tendTree(i: number) {
  const st = treeState(i)
  const phase = treePhase(st, nowMinute())
  if (phase === 'stump') {
    plantSapling(i)
    return
  }
  if (phase === 'sapling') {
    toast('🌱 ต้นกล้ากำลังโต', 'อีกไม่นานจะเป็นต้นไม้ใหญ่ ตัดได้อีกครั้ง', 'info')
    return
  }
  // กดระหว่างเหวี่ยงอยู่ = ต่อคิวฟันครั้งถัดไปทันทีที่จบ
  if (swing.current >= 0) {
    if (swing.tree === i && swing.kind === 'tree') swing.queued = true
    return
  }
  if (chopTool() === 'hand' && restingHand()) return
  swing.queued = false
  swing.current = 0
  swing.tree = i
  swing.kind = 'tree'
  swing.dur = CHOP_TOOLS[chopTool()].swing
  swing.hit = false
}

/** จังหวะขวานกระทบต้นไม้ (เรียกจาก Player) */
export function hitTree(i: number, fromAngle: number) {
  const g = useGame.getState()
  if (!g.save) return
  const tr = TREES[i]
  const rule = TREE_RULES[tr.kind]
  const tool = CHOP_TOOLS[chopTool()]
  const now = nowMinute()
  let st = treeState(i)
  // ต้นที่งอกกลับมาแล้ว เริ่มนับใหม่
  if (st && treePhase(st, now) === 'standing' && st.felledAt) st = undefined
  const dmg = (st?.dmg ?? 0) + tool.power
  treeFx.set(i, { ...treeFx.get(i), shakeAt: performance.now() })
  playChop(tool.id === 'hand' ? 0.5 : 1)

  // มือเปล่า: นับครั้งที่ทุบต้นไม้ (ครั้งที่ 20 ขึ้นไปเริ่มเจ็บมือ · ต้นแข็งเจ็บกว่า)
  if (tool.id === 'hand') registerStrike('tree', HAND_HURT[tr.kind] / 1.5)
  g.changeStats({ thirst: -0.4, hunger: -0.2 })

  const drops = [...g.save.drops]
  // ฟันแต่ละครั้ง มีโอกาสกิ่งไม้/ใบไม้ร่วงลงมา
  if (Math.random() < 0.3) drops.push(dropNear(tr.pos[0], tr.pos[1], rule.hitDrop, 1, 1.4))

  if (dmg < rule.hp) {
    setTree(i, { dmg, mark: fromAngle }, { drops })
    return
  }
  // ---------- ล้ม ----------
  swing.queued = false
  const fallDir = fromAngle + Math.PI
  treeFx.set(i, { ...treeFx.get(i), fallAt: performance.now() })
  setTimeout(() => playFall(), 600)
  for (const d of rule.drops) {
    if (d.axeOnly && tool.id === 'hand') continue
    if (Math.random() > (d.chance ?? 1)) continue
    let n = d.min + Math.floor(Math.random() * (d.max - d.min + 1))
    if (d.scaled) n = Math.max(1, Math.round(n * tool.yieldK))
    // ของตกตามแนวที่ต้นไม้ล้ม
    for (let k = 0; k < n; k++) {
      const along = 1.2 + Math.random() * 3 * tr.scale
      const side = (Math.random() - 0.5) * 1.6
      const x = tr.pos[0] + Math.sin(fallDir) * along + Math.cos(fallDir) * side
      const z = tr.pos[1] + Math.cos(fallDir) * along - Math.sin(fallDir) * side
      drops.push({ id: uid(), item: d.item, qty: 1, x, z })
    }
  }
  setTree(i, { dmg: 0, mark: fromAngle, felledAt: now, fallDir }, { drops })
  g.saveNow('event')
  g.changeStats({ fun: 3 })
  toast(`🌳 ${rule.name}ล้มแล้ว!`, 'เดินไปเก็บไม้ที่ร่วงอยู่บนพื้น · ตอไม้ปลูกต้นกล้าแทนได้', 'success')
}

const uid = () => Math.random().toString(36).slice(2, 10)

// ---------- ทุบก้อนหินด้วยมือเปล่า ----------
/** ทุบครบ 3 ครั้ง ได้หิน 1 ก้อน · กองหินหนึ่งกองให้หินได้ 3 ก้อน แล้วต้องรอสักพัก */
const ROCK_HITS_PER_STONE = 3
const ROCK_STONES = 3
const ROCK_REGROW_MS = 90_000
const rockState = new Map<number, { dmg: number; got: number; since: number }>()
export const rockFx = new Map<number, number>()

export function rockHint(i: number) {
  const r = rockState.get(i)
  if (r && r.got >= ROCK_STONES && Date.now() - r.since < ROCK_REGROW_MS) return 'กองหินนี้แตกหมดแล้ว รอสักพัก'
  const left = ROCK_HITS_PER_STONE - (r?.dmg ?? 0)
  return `✋ ทุบก้อนหินด้วยมือ (อีก ${left} ครั้งได้หิน · ${handStatus('rock')})`
}

/** กด E ที่ก้อนหิน (ถือมือเปล่า) */
export function punchRock(i: number) {
  if (swing.current >= 0) {
    if (swing.tree === i && swing.kind === 'rock') swing.queued = true
    return
  }
  if (restingHand()) return
  const r = rockState.get(i)
  if (r && r.got >= ROCK_STONES) {
    if (Date.now() - r.since < ROCK_REGROW_MS) {
      toast('กองหินนี้แตกหมดแล้ว', 'รอสักพักแล้วค่อยกลับมาใหม่ หรือไปหากองอื่น', 'info')
      return
    }
    rockState.delete(i)
  }
  swing.queued = false
  swing.current = 0
  swing.tree = i
  swing.kind = 'rock'
  swing.dur = 0.75
  swing.hit = false
}

/** จังหวะกำปั้นกระทบหิน (เรียกจาก Player) */
export function hitRock(i: number) {
  const g = useGame.getState()
  if (!g.save) return
  rockFx.set(i, performance.now())
  playChop(0.35)
  registerStrike('rock', 1.6)
  g.changeStats({ thirst: -0.3, hunger: -0.15 })
  const r = rockState.get(i) ?? { dmg: 0, got: 0, since: Date.now() }
  r.dmg += 1
  if (r.dmg >= ROCK_HITS_PER_STONE) {
    r.dmg = 0
    const n = addItem('stone', 1)
    if (n > 0) {
      if (r.got === 0) r.since = Date.now()
      r.got += 1
      toast('🪨 หิน +1', r.got >= ROCK_STONES ? 'กองหินนี้แตกหมดแล้ว' : undefined, 'success')
    } else toast('กระเป๋าเต็มแล้ว', 'ขายหรือฝากของก่อนแล้วค่อยมาทุบใหม่', 'warn')
    if (r.got >= ROCK_STONES) swing.queued = false
  }
  rockState.set(i, r)
}

/** ตำแหน่งเป้าที่กำลังทุบอยู่ */
export const swingTargetPos = (): [number, number] => (swing.kind === 'rock' ? ROCKS[swing.tree] : TREES[swing.tree].pos)

function dropNear(x: number, z: number, item: ItemId, qty: number, r: number): GroundDrop {
  const a = Math.random() * Math.PI * 2
  const d = r * (0.6 + Math.random() * 0.6)
  return { id: uid(), item, qty, x: x + Math.cos(a) * d, z: z + Math.sin(a) * d }
}

function plantSapling(i: number) {
  if (countOf('sapling') <= 0) {
    toast('ยังไม่มีต้นกล้าไม้', 'ได้จากการโค่นต้นไม้ (บางครั้ง) หรือซื้อที่ร้านป้าศรี', 'info')
    return
  }
  const g = useGame.getState()
  const st = treeState(i)
  if (!g.save || !st) return
  const inventory = { ...g.save.inventory }
  inventory.sapling = (inventory.sapling ?? 0) - 1
  if (inventory.sapling <= 0) delete inventory.sapling
  setTree(i, { ...st, plantedAt: nowMinute() }, { inventory })
  g.saveNow('event')
  g.changeStats({ fun: 2 })
  toast('🌱 ปลูกต้นกล้าแทนแล้ว', `อีก ${SAPLING_DAYS} วันในเกมจะโตเป็น${TREE_RULES[TREES[i].kind].name}ต้นใหญ่ ขอบคุณที่ช่วยดูแลธรรมชาติ`, 'success')
}

// ---------- เก็บของบนพื้น (เดินผ่าน) ----------
let fullWarnAt = 0
export function pickupNear(x: number, z: number) {
  const g = useGame.getState()
  if (!g.save || g.save.drops.length === 0) return
  const near = g.save.drops.filter((d) => Math.hypot(d.x - x, d.z - z) < 1.1)
  if (near.length === 0) return
  const got: Partial<Record<ItemId, number>> = {}
  const taken = new Set<string>()
  for (const d of near) {
    const n = addItem(d.item, d.qty)
    if (n < d.qty) {
      if (Date.now() - fullWarnAt > 6000) {
        fullWarnAt = Date.now()
        toast('กระเป๋าเต็มแล้ว', 'ของยังวางอยู่บนพื้น ขายหรือฝากของในกล่องก่อนแล้วค่อยมาเก็บ', 'warn')
      }
      break
    }
    got[d.item] = (got[d.item] ?? 0) + n
    taken.add(d.id)
  }
  if (taken.size === 0) return
  const s = useGame.getState().save!
  useGame.setState({ save: { ...s, drops: s.drops.filter((d) => !taken.has(d.id)) }, dirty: true })
  const text = Object.entries(got)
    .map(([id, q]) => `${ITEMS[id as ItemId].name} +${q}`)
    .join(' · ')
  toast('🧺 เก็บของแล้ว', text, 'success')
}

// ---------- เสียง ----------
let ctx: AudioContext | null = null
function audio() {
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** เสียงขวานกระทบไม้: ตุบทุ้ม + เสียงไม้แตกสั้น ๆ */
function playChop(k: number) {
  try {
    const c = audio()
    const vol = (useSettings.getState().sfxVolume ?? 1) * 0.5 * k
    const t = c.currentTime + 0.005
    const o = c.createOscillator()
    o.type = 'triangle'
    o.frequency.setValueAtTime(180, t)
    o.frequency.exponentialRampToValueAtTime(70, t + 0.12)
    const g = c.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
    o.connect(g).connect(c.destination)
    o.start(t)
    o.stop(t + 0.2)
    const len = Math.floor(c.sampleRate * 0.08)
    const buf = c.createBuffer(1, len, c.sampleRate)
    const ch = buf.getChannelData(0)
    for (let n = 0; n < len; n++) ch[n] = (Math.random() * 2 - 1) * (1 - n / len) ** 3
    const src = c.createBufferSource()
    src.buffer = buf
    const f = c.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 1800
    const g2 = c.createGain()
    g2.gain.value = vol * 0.8
    src.connect(f).connect(g2).connect(c.destination)
    src.start(t)
  } catch {
    /* ไม่มีเสียงก็ไม่เป็นไร */
  }
}

/** เสียงต้นไม้ล้ม: ไม้ลั่นเอี๊ยด แล้วตูมลงพื้น */
function playFall() {
  try {
    const c = audio()
    const vol = (useSettings.getState().sfxVolume ?? 1) * 0.55
    const t = c.currentTime + 0.01
    const len = Math.floor(c.sampleRate * 0.9)
    const buf = c.createBuffer(1, len, c.sampleRate)
    const ch = buf.getChannelData(0)
    for (let n = 0; n < len; n++) ch[n] = (Math.random() * 2 - 1) * Math.exp(-n / (c.sampleRate * 0.25))
    const src = c.createBufferSource()
    src.buffer = buf
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 260
    const g = c.createGain()
    g.gain.value = vol
    src.connect(f).connect(g).connect(c.destination)
    src.start(t + 0.5)
    const o = c.createOscillator()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(140, t)
    o.frequency.linearRampToValueAtTime(90, t + 0.5)
    const g2 = c.createGain()
    g2.gain.setValueAtTime(0.0001, t)
    g2.gain.exponentialRampToValueAtTime(vol * 0.15, t + 0.1)
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    const f2 = c.createBiquadFilter()
    f2.type = 'lowpass'
    f2.frequency.value = 600
    o.connect(f2).connect(g2).connect(c.destination)
    o.start(t)
    o.stop(t + 0.55)
  } catch {
    /* ไม่มีเสียงก็ไม่เป็นไร */
  }
}
