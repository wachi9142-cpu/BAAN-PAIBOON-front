import { create } from 'zustand'
import { useGame } from './store'
import type { Appearance } from './content/appearance'
import { VILLAGERS } from './content/villagers'

/**
 * ระบบเพื่อน + คำเชิญเข้าร่วมโลก (§2.48)
 * หลักการ: ตัวตนเดียวทั้งเกม — ชื่อในเกม + รูปโปรไฟล์ (หน้าตัวละคร) ชุดเดียวกันทุกหน้า
 * ไม่ใช้ชื่อบัญชีหรืออีเมล · เก็บโปรไฟล์ตามรหัสผู้เล่น จึงแสดงข้อมูลล่าสุดเสมอ
 *
 * ตอนนี้ยังไม่มีเซิร์ฟเวอร์ออนไลน์: ส่วนติดต่อทั้งหมดทำงานได้ แต่การส่ง/รับจริงรอ BAAN-PAIBOON-back
 * (โหมดนักพัฒนามีปุ่ม "🧪 เพื่อนตัวอย่าง / จำลองคำเชิญ" ไว้ลองหน้าจอ)
 */

export const MAX_PLAYERS = 6 // เจ้าของโลก 1 + เพื่อน 5
export const ONLINE_READY = false // เปลี่ยนเป็น true เมื่อเชื่อมเซิร์ฟเวอร์แล้ว

export interface Profile {
  id: string
  /** ชื่อผู้เล่นในเกม (ไม่ใช่ชื่อบัญชี/อีเมล) */
  name: string
  /** หน้าตาตัวละคร = รูปโปรไฟล์ */
  appearance: Appearance | null
  online: boolean
  /** จำนวนคนในโลกของเขาตอนนี้ (รวมเจ้าของ) · 0 = ยังไม่เปิดห้อง */
  roomCount: number
  demo?: boolean
}

export interface Invite {
  id: number
  /** ผู้เชิญ (อ้างด้วยรหัส → แสดงชื่อ/รูปล่าสุดเสมอ) */
  fromId: string
  at: number
}

interface SocialState {
  /** โปรไฟล์ทุกคนที่รู้จัก (ตามรหัส) */
  profiles: Record<string, Profile>
  friendIds: string[]
  /** รหัสที่ขอเป็นเพื่อนไปแล้ว รอยืนยัน */
  pending: string[]
  invites: Invite[]
  /** ห้องของฉัน: เปิดให้เพื่อนเข้าแล้วหรือยัง · เพื่อนที่อยู่ในโลกฉัน */
  roomOpen: boolean
  guests: string[]
  /** เพื่อนที่ฉันส่งคำเชิญไปแล้ว */
  invited: string[]
  windowOpen: boolean
}

const FRIENDS_KEY = 'baan-paiboon-friends'
const ID_KEY = 'baan-paiboon-player-id'

function loadFriends(): Pick<SocialState, 'friendIds' | 'pending'> {
  try {
    const raw = JSON.parse(localStorage.getItem(FRIENDS_KEY) || '{}')
    return { friendIds: [], pending: Array.isArray(raw.pending) ? raw.pending : [] }
  } catch {
    return { friendIds: [], pending: [] }
  }
}

export const useSocial = create<SocialState>(() => ({
  profiles: {},
  ...loadFriends(),
  invites: [],
  roomOpen: false,
  guests: [],
  invited: [],
  windowOpen: false,
}))

function persist() {
  const s = useSocial.getState()
  try {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify({ pending: s.pending }))
  } catch {
    /* ไม่เป็นไร */
  }
}

/** รหัสผู้เล่นของฉัน (ใช้ให้เพื่อนเพิ่ม) เช่น BP-7K2Q-94MD */
export function myId(): string {
  try {
    let id = localStorage.getItem(ID_KEY)
    if (!id) {
      const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      const part = () => Array.from({ length: 4 }, () => c[Math.floor(Math.random() * c.length)]).join('')
      id = `BP-${part()}-${part()}`
      localStorage.setItem(ID_KEY, id)
    }
    return id
  } catch {
    return 'BP-LOCAL'
  }
}

/** โปรไฟล์ของฉัน — อ่านจากเซฟทุกครั้ง จึงตรงกับชื่อ/หน้าตาล่าสุด */
export function myProfile(): Profile | null {
  const save = useGame.getState().save
  if (!save) return null
  const s = useSocial.getState()
  return { id: myId(), name: save.player.name, appearance: save.player.appearance, online: true, roomCount: s.roomOpen ? 1 + s.guests.length : 0 }
}

/** อัปเดต/เพิ่มโปรไฟล์ (เมื่อเซิร์ฟเวอร์ส่งข้อมูลล่าสุดมา ทุกหน้าที่อ้างรหัสนี้จะเปลี่ยนตาม) */
export function upsertProfile(p: Profile) {
  useSocial.setState((s) => ({ profiles: { ...s.profiles, [p.id]: { ...s.profiles[p.id], ...p } } }))
}

export const openFriends = () => useSocial.setState({ windowOpen: true })

const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' = 'info') => useGame.getState().toast({ title, body, tone })

/** เพิ่มเพื่อนด้วยรหัสผู้เล่น */
export function addFriendByCode(raw: string): string | null {
  const code = raw.trim().toUpperCase()
  if (!/^BP-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return 'รหัสผู้เล่นต้องเป็นแบบ BP-XXXX-XXXX'
  if (code === myId()) return 'นี่คือรหัสของคุณเอง'
  const s = useSocial.getState()
  if (s.friendIds.includes(code)) return 'เป็นเพื่อนกันอยู่แล้ว'
  if (s.pending.includes(code)) return 'ส่งคำขอไปแล้ว รอเพื่อนตอบรับ'
  useSocial.setState({ pending: [...s.pending, code] })
  persist()
  toast('ส่งคำขอเป็นเพื่อนแล้ว', ONLINE_READY ? 'รอเพื่อนตอบรับ' : 'คำขอจะส่งถึงเพื่อนเมื่อระบบออนไลน์เปิดใช้งาน', 'success')
  return null
}

export function cancelPending(code: string) {
  useSocial.setState((s) => ({ pending: s.pending.filter((c) => c !== code) }))
  persist()
}

/** เหตุผลที่เชิญเพื่อนคนนี้ไม่ได้ (null = เชิญได้) */
export function inviteProblem(id: string): string | null {
  const s = useSocial.getState()
  const p = s.profiles[id]
  if (!p) return 'ไม่พบผู้เล่น'
  if (!p.online) return 'เพื่อนออฟไลน์อยู่'
  if (s.guests.includes(id)) return 'อยู่ในโลกของคุณแล้ว'
  if (1 + s.guests.length >= MAX_PLAYERS) return `ห้องเต็มแล้ว (${MAX_PLAYERS} คน)`
  return null
}

/** เจ้าของโลกกด + เพื่อเชิญ — เปิดห้องให้อัตโนมัติถ้ายังไม่เปิด */
export function sendInvite(id: string) {
  const why = inviteProblem(id)
  const p = useSocial.getState().profiles[id]
  if (why) return toast('เชิญไม่ได้', why, 'warn')
  useSocial.setState((s) => ({ roomOpen: true, invited: s.invited.includes(id) ? s.invited : [...s.invited, id] }))
  toast(`ส่งคำเชิญถึง ${p.name} แล้ว`, ONLINE_READY ? 'เปิดโลกของคุณให้เพื่อนเข้าแล้ว' : 'เปิดห้องในเครื่องแล้ว · การส่งจริงรอระบบออนไลน์', 'success')
}

/** ได้รับคำเชิญ (เซิร์ฟเวอร์เรียก · หรือจำลองในโหมดนักพัฒนา) — แสดงทันทีแม้กำลังเล่นในโลกตัวเอง */
let inviteSeq = 1
export function receiveInvite(fromId: string) {
  const s = useSocial.getState()
  if (s.invites.some((i) => i.fromId === fromId)) return
  useSocial.setState({ invites: [...s.invites, { id: inviteSeq++, fromId, at: Date.now() }] })
}

export function declineInvite(inviteId: number) {
  useSocial.setState((s) => ({ invites: s.invites.filter((i) => i.id !== inviteId) }))
}

/** กดเข้าร่วม: ตรวจว่าเจ้าของโลกยังออนไลน์ · ห้องยังไม่เต็ม → เข้าโลกของผู้เชิญ */
export function acceptInvite(inviteId: number): string | null {
  const s = useSocial.getState()
  const inv = s.invites.find((i) => i.id === inviteId)
  if (!inv) return 'คำเชิญหมดอายุแล้ว'
  const host = s.profiles[inv.fromId]
  if (!host || !host.online || host.roomCount === 0) {
    declineInvite(inviteId)
    toast('เข้าร่วมไม่ได้', `${host?.name ?? 'เจ้าของโลก'} ออกจากเกมแล้ว จึงเข้าโลกนั้นไม่ได้`, 'warn')
    return 'host-offline'
  }
  if (host.roomCount >= MAX_PLAYERS) {
    declineInvite(inviteId)
    toast('ห้องเต็มแล้ว', `โลกของ ${host.name} มีผู้เล่นครบ ${MAX_PLAYERS} คนแล้ว`, 'warn')
    return 'full'
  }
  declineInvite(inviteId)
  if (!ONLINE_READY) {
    toast(`กำลังเข้าโลกของ ${host.name}…`, 'ระบบออนไลน์ยังไม่เปิด (ยังไม่มีเซิร์ฟเวอร์) จึงยังเข้าโลกเพื่อนจริงไม่ได้', 'warn')
    return 'no-server'
  }
  return null
}

/* ───────── โหมดนักพัฒนา: เพื่อนตัวอย่าง (ชื่อสมมติ) ไว้ลองหน้าจอ ───────── */
const DEMO = [
  { id: 'BP-DEMO-0001', name: 'ข้าวหอม', v: 'walk-1', online: true, roomCount: 1 },
  { id: 'BP-DEMO-0002', name: 'ต้นกล้า', v: 'walk-4', online: true, roomCount: 3 },
  { id: 'BP-DEMO-0003', name: 'น้ำใส', v: 'walk-3', online: false, roomCount: 0 },
  { id: 'BP-DEMO-0004', name: 'ลุงคำ', v: 'walk-2', online: true, roomCount: 6 },
]
export function addDemoFriends() {
  for (const d of DEMO) {
    const look = VILLAGERS.find((v) => v.id === d.v)?.appearance ?? null
    upsertProfile({ id: d.id, name: d.name, appearance: look, online: d.online, roomCount: d.roomCount, demo: true })
  }
  useSocial.setState((s) => ({ friendIds: [...new Set([...s.friendIds, ...DEMO.map((d) => d.id)])] }))
}
export function demoInvite() {
  if (!useSocial.getState().friendIds.includes(DEMO[0].id)) addDemoFriends()
  const pool = DEMO.filter((d) => d.online)
  receiveInvite(pool[Math.floor(Math.random() * pool.length)].id)
}
if (import.meta.env.DEV) (window as unknown as { __social: unknown }).__social = { useSocial, demoInvite, addDemoFriends, upsertProfile }
