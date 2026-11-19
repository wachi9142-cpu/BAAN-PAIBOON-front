/**
 * ปฏิทินและเทศกาล (§2.57)
 * ปฏิทินในเกมเดินตามวันที่จริง (แบบเกมชีวิตในหมู่บ้าน): เทศกาลมาตามเดือนจริง วนซ้ำทุกปี
 * ส่วน "วันที่ N" บนแถบด้านบน = วันที่ใช้ชีวิตในหมู่บ้าน (เช้า–ค่ำในเกม) แยกกัน
 * ฤดูตามเดือน: ร้อน มี.ค.–พ.ค. · ฝน มิ.ย.–ต.ค. · หนาว พ.ย.–ก.พ. · 7 วันท้ายฤดู = ช่วงเปลี่ยนฤดู
 *
 * เพิ่มเทศกาลใหม่: เพิ่มรายการใน FESTIVALS อย่างเดียว (ไม่ต้องแก้ระบบปฏิทิน)
 */
export type Season = 'hot' | 'rain' | 'cool'

export const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
export const MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
export const WEEKDAYS_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
export const WEEKDAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']

/** วันที่ทดสอบ (โหมดนักพัฒนา): window.__date('2026-11-24') */
let override: Date | null = null
export function setDateOverride(s: string | null) {
  override = s ? new Date(s + 'T12:00:00') : null
}
/** วันที่ปัจจุบันของปฏิทินเกม (ตัดเวลาออก) */
export function today(): Date {
  const d = override ? new Date(override) : new Date()
  d.setHours(12, 0, 0, 0)
  return d
}
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const thaiDate = (d: Date) => `${d.getDate()} ${MONTHS_TH[d.getMonth()]} ${d.getFullYear() + 543}`
export const thaiShort = (d: Date) => `${WEEKDAYS_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`

export function seasonOfDate(d: Date): Season {
  const m = d.getMonth() + 1
  return m >= 3 && m <= 5 ? 'hot' : m >= 6 && m <= 10 ? 'rain' : 'cool'
}
/** 7 วันท้ายของฤดู (ปลาย พ.ค. · ปลาย ต.ค. · ปลาย ก.พ.) = ช่วงเปลี่ยนฤดู */
export function isShiftDate(d: Date): boolean {
  const m = d.getMonth() + 1
  if (m !== 5 && m !== 10 && m !== 2) return false
  const last = new Date(d.getFullYear(), m, 0).getDate()
  return d.getDate() > last - 7
}

export type FestivalId = 'newyear' | 'templefair' | 'songkran' | 'planting' | 'harvest' | 'loykrathong'

export interface Festival {
  id: FestivalId
  name: string
  icon: string
  /** เริ่ม–จบ (เดือน 1–12, วัน) — ข้ามปีได้ (เช่น 31 ธ.ค.–1 ม.ค.) */
  start: [number, number]
  end: [number, number]
  /** วันหลักของงาน (แสดงในปฏิทิน) */
  main: [number, number]
  note: string
  /** สิ่งที่เปลี่ยนในหมู่บ้าน (แสดงในหนังสือ) */
  changes: string[]
  /** ชาวบ้านแต่งตัว: เครื่องประดับ/สีเสื้อ */
  npcDress?: { accessory?: string; topColors?: string[] }
}

export const FESTIVALS: Festival[] = [
  {
    id: 'newyear',
    name: 'วันขึ้นปีใหม่',
    icon: '🎆',
    start: [12, 30],
    end: [1, 1],
    main: [1, 1],
    note: 'ประดับไฟทั้งหมู่บ้าน กลางคืนมีพลุ',
    changes: ['ไฟประดับหลากสีตามถนนใหญ่และลานวัด', 'กลางคืนมีพลุบนฟ้า', 'ขอพรปีใหม่ที่วัดได้รับของขวัญ'],
  },
  {
    id: 'templefair',
    name: 'งานวัดประจำหมู่บ้าน',
    icon: '🎡',
    start: [2, 10],
    end: [2, 14],
    main: [2, 12],
    note: 'ซุ้มเกม ร้านขนม ไฟระยิบระยับที่ลานวัด',
    changes: ['ซุ้มร้านค้าและซุ้มเกมปาลูกโป่งที่ลานหน้าวัด', 'ธงทิวและไฟประดับ', 'เล่นเกมปาลูกโป่งได้ของรางวัล'],
  },
  {
    id: 'songkran',
    name: 'วันสงกรานต์',
    icon: '💦',
    start: [4, 13],
    end: [4, 15],
    main: [4, 13],
    note: 'เล่นน้ำ รดน้ำดำหัวผู้ใหญ่ ก่อเจดีย์ทราย',
    changes: ['ถังน้ำและขันวางริมถนน', 'ชาวบ้านใส่เสื้อลายดอก ห้อยพวงมาลัย', 'รดน้ำดำหัวตายายที่บ้านได้พรและความสุข'],
    npcDress: { accessory: 'flowercrown', topColors: ['#f08aa8', '#7cc6e8', '#f2c94c', '#8fd18a'] },
  },
  {
    id: 'planting',
    name: 'ฤดูดำนา',
    icon: '🌱',
    start: [6, 15],
    end: [7, 31],
    main: [7, 1],
    note: 'ชาวบ้านลงนา ปักดำต้นกล้า',
    changes: ['กองต้นกล้าข้าวตามคันนาและลานบ้าน', 'ช่วยมัดต้นกล้าได้ค่าแรง'],
  },
  {
    id: 'harvest',
    name: 'ช่วงเก็บเกี่ยวข้าว',
    icon: '🌾',
    start: [11, 1],
    end: [12, 10],
    main: [11, 15],
    note: 'เกี่ยวข้าว ตากข้าว เก็บผลผลิต',
    changes: ['ฟ่อนข้าวสีทองกองตามลานบ้านและคอกควาย', 'ลานตากข้าวบนเสื่อ', 'ช่วยตากข้าวได้ข้าวเปลือก (อาหารสัตว์)'],
  },
  {
    id: 'loykrathong',
    name: 'วันลอยกระทง',
    icon: '🏮',
    start: [11, 20],
    end: [11, 24],
    main: [11, 24],
    note: 'ทำกระทง ประดับไฟ ลอยกระทงที่บ่อปลา (วันที่ในเกม: 24 พ.ย.)',
    changes: ['โคมไฟและไฟประดับรอบบ่อปลาลุงเขียว', 'ซุ้มทำกระทงริมบ่อ (ใช้ใบไม้ + ดอกบัว หรือซื้อ 20 บาท)', 'ลอยกระทงที่ท่าน้ำ ขอพร · กลางคืนกระทงเรืองแสงลอยเต็มบ่อ'],
    npcDress: { topColors: ['#e8d8b0', '#c94a6a', '#4a7ac9'] },
  },
]

const key = (m: number, d: number) => m * 100 + d
/** เทศกาลนี้กำลังจัดอยู่ไหม ณ วันที่ d */
export function isActive(f: Festival, d: Date): boolean {
  const k = key(d.getMonth() + 1, d.getDate())
  const a = key(...f.start)
  const b = key(...f.end)
  return a <= b ? k >= a && k <= b : k >= a || k <= b
}
export const activeFestivals = (d = today()) => FESTIVALS.filter((f) => isActive(f, d))
export const festivalActive = (id: FestivalId, d = today()) => isActive(FESTIVALS.find((f) => f.id === id)!, d)

/** วันเริ่มครั้งถัดไป (ถ้ากำลังจัดอยู่ = วันเริ่มของรอบนี้) */
export function nextStart(f: Festival, d = today()): Date {
  const y = d.getFullYear()
  for (const yy of [y - 1, y, y + 1]) {
    const s = new Date(yy, f.start[0] - 1, f.start[1], 12)
    const e = new Date(f.end[0] < f.start[0] ? yy + 1 : yy, f.end[0] - 1, f.end[1], 12)
    if (e >= d) return s
  }
  return new Date(y + 1, f.start[0] - 1, f.start[1], 12)
}
export const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000)

/** เทศกาลที่กำลังจะมาถึง (เรียงตามวัน) */
export function upcoming(d = today()) {
  return FESTIVALS.map((f) => ({ f, start: nextStart(f, d) }))
    .map((x) => {
      // วันหลักของรอบนี้ (เช่น วันลอยกระทงจริง 24 พ.ย. ไม่ใช่วันเริ่มเตรียมงาน)
      const main = new Date(x.f.main[0] < x.f.start[0] ? x.start.getFullYear() + 1 : x.start.getFullYear(), x.f.main[0] - 1, x.f.main[1], 12)
      return { ...x, days: daysBetween(d, x.start), mainDays: daysBetween(d, main), active: isActive(x.f, d) }
    })
    .sort((a, b) => (a.active === b.active ? a.days - b.days : a.active ? -1 : 1))
}
