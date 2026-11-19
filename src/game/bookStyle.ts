/**
 * หนังสือส่วนตัว (Personal Book): ทุกคนได้หนังสือค่าเริ่มต้น ใช้ได้ทันที
 * ตกแต่งได้ 2 ส่วนแยกกัน: รูปลักษณ์ (ปก สี ธีม ชื่อ ของตกแต่ง) · โครงสร้าง (ตำแหน่งแท็บ ลำดับ ความละเอียด)
 * บันทึกในเซฟของผู้เล่นแต่ละคน · เปลี่ยนแล้วไม่กระทบไอเทม/ความคืบหน้า · คืนค่าเริ่มต้นได้
 */
import { useGame } from './store'

export type BookTheme = 'baan' | 'lavender' | 'forest' | 'starry' | 'sweet'
export type CoverPattern = 'plain' | 'kanok' | 'flower' | 'star'
export type BookCharm = 'none' | 'flower' | 'paw' | 'star' | 'leaf'

export interface BookStyle {
  // รูปลักษณ์
  theme: BookTheme
  /** สีปก ('' = ตามธีม) */
  cover: string
  pattern: CoverPattern
  title: string
  ribbon: boolean
  corners: boolean
  charm: BookCharm
  // โครงสร้าง
  topPos: 'top' | 'bottom'
  sidePos: 'left' | 'right'
  /** simple = แท็บมีแต่ไอคอน หน้ากระดาษโล่ง · detailed = มีชื่อแท็บและคำอธิบาย */
  density: 'simple' | 'detailed'
  /** หน้ารายการ (เมนูให้กดเลือก) อยู่หน้าขวา = ถนัดขวา (ค่าเริ่มต้น) · ซ้าย = ถนัดซ้าย */
  listSide: 'left' | 'right'
  topOrder: string[]
  sideOrder: string[]
}

export const BOOK_THEMES: Record<BookTheme, { label: string; note: string; vars: Record<string, string> }> = {
  baan: {
    label: 'บ้านไพบูลย์',
    note: 'ครีม ไม้ อบอุ่น (ค่าเริ่มต้น)',
    vars: { '--cover': '#7a5230', '--cover2': '#4f3218', '--paper': '#f6ecd4', '--paper2': '#ead9b4', '--ink': '#3b2a16', '--ink2': '#7a6040', '--line': 'rgba(122,82,48,.28)', '--cell': 'rgba(255,250,236,.7)' },
  },
  lavender: {
    label: 'Lavender Garden',
    note: 'ม่วงลาเวนเดอร์ ลายดอกไม้',
    vars: { '--cover': '#7b5aa6', '--cover2': '#4e3577', '--paper': '#f8f2fb', '--paper2': '#e9dcf2', '--ink': '#3d2a55', '--ink2': '#7d63a0', '--line': 'rgba(123,90,166,.28)', '--cell': 'rgba(255,252,255,.75)' },
  },
  forest: {
    label: 'Forest Explorer',
    note: 'น้ำตาลไม้ ธรรมชาติ',
    vars: { '--cover': '#4a3322', '--cover2': '#2a1c12', '--paper': '#eee0c0', '--paper2': '#d9c296', '--ink': '#2e2414', '--ink2': '#5e6a3a', '--line': 'rgba(70,90,40,.3)', '--cell': 'rgba(250,244,226,.7)' },
  },
  starry: {
    label: 'Starry Night',
    note: 'น้ำเงินเข้ม ดวงดาว',
    vars: { '--cover': '#1d2550', '--cover2': '#0c1230', '--paper': '#1f2a52', '--paper2': '#141c3c', '--ink': '#f3e6b8', '--ink2': '#b8c3ea', '--line': 'rgba(243,230,184,.25)', '--cell': 'rgba(255,255,255,.07)' },
  },
  sweet: {
    label: 'Sweet Dream',
    note: 'ครีม ชมพู พาสเทล',
    vars: { '--cover': '#e9a2bf', '--cover2': '#b77fb7', '--paper': '#fff6f6', '--paper2': '#fbe3ee', '--ink': '#5a3550', '--ink2': '#a2709a', '--line': 'rgba(200,120,170,.28)', '--cell': 'rgba(255,255,255,.75)' },
  },
}
export const COVER_COLORS = ['', '#7a5230', '#2f6a3a', '#7b5aa6', '#1d2550', '#b0473a', '#d8a52a', '#e9a2bf', '#3f7aa8']
export const PATTERNS: Record<CoverPattern, string> = { plain: 'เรียบ', kanok: 'ลายไทย', flower: 'ดอกไม้', star: 'ดวงดาว' }
export const CHARMS: Record<BookCharm, { icon: string; label: string }> = {
  none: { icon: '—', label: 'ไม่มี' },
  flower: { icon: '🌸', label: 'ดอกไม้' },
  paw: { icon: '🐾', label: 'รอยเท้าสัตว์' },
  star: { icon: '⭐', label: 'ดาว' },
  leaf: { icon: '🍃', label: 'ใบไม้' },
}

export const TOP_IDS = ['party', 'storage', 'tech', 'quests', 'guild', 'options']
export const SIDE_IDS = ['make', 'store', 'food', 'infra', 'light', 'build', 'defend', 'tools']

export function defaultBook(): BookStyle {
  const name = useGame.getState().save?.player.name ?? ''
  return {
    theme: 'baan',
    cover: '',
    pattern: 'kanok',
    title: name ? `สมุดของ${name}` : 'สมุดบ้านไพบูลย์',
    ribbon: true,
    corners: true,
    charm: 'none',
    topPos: 'top',
    sidePos: 'right',
    density: 'detailed',
    listSide: 'right',
    topOrder: [...TOP_IDS],
    sideOrder: [...SIDE_IDS],
  }
}

export function bookStyle(): BookStyle {
  const b = useGame.getState().save?.book
  const d = defaultBook()
  if (!b) return d
  const fix = (order: string[] | undefined, all: string[]) => [...(order ?? []).filter((x) => all.includes(x)), ...all.filter((x) => !(order ?? []).includes(x))]
  return { ...d, ...b, topOrder: fix(b.topOrder, TOP_IDS), sideOrder: fix(b.sideOrder, SIDE_IDS) }
}

export function setBook(patch: Partial<BookStyle>) {
  const g = useGame.getState()
  if (!g.save) return
  useGame.setState({ save: { ...g.save, book: { ...bookStyle(), ...patch } }, dirty: true })
}

/** คืนค่าเริ่มต้น: เลือกได้ว่าจะคืนแค่รูปลักษณ์ หรือแค่โครงสร้าง หรือทั้งหมด */
export function resetBook(part: 'look' | 'layout' | 'all') {
  const d = defaultBook()
  if (part === 'all') return setBook(d)
  if (part === 'look') return setBook({ theme: d.theme, cover: d.cover, pattern: d.pattern, title: d.title, ribbon: d.ribbon, corners: d.corners, charm: d.charm })
  setBook({ topPos: d.topPos, sidePos: d.sidePos, density: d.density, listSide: d.listSide, topOrder: d.topOrder, sideOrder: d.sideOrder })
}

export function moveInOrder(which: 'topOrder' | 'sideOrder', id: string, dir: -1 | 1) {
  const list = [...bookStyle()[which]]
  const i = list.indexOf(id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j], list[i]]
  setBook({ [which]: list } as Partial<BookStyle>)
}
