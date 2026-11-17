// ช่วงเวลาในเกม + แสง/สีท้องฟ้าตามเวลา — ข้อมูลล้วน
// เวลาในเกมเดินเร็วกว่าเวลาจริง: 1 นาทีจริง = 15 นาทีในเกม (1 วันในเกม ≈ 1 ชั่วโมง 36 นาทีจริง)

export const GAME_MINUTES_PER_REAL_SECOND = 15 / 60

export interface TimePeriod {
  id: 'predawn' | 'morning' | 'late' | 'afternoon' | 'evening' | 'dusk' | 'night'
  label: string
  /** ชั่วโมงเริ่ม (รวม) – สิ้นสุด (ไม่รวม) ข้ามเที่ยงคืนได้ */
  from: number
  to: number
  mood: string
}

export const TIME_PERIODS: TimePeriod[] = [
  { id: 'predawn', label: 'เช้ามืด', from: 4, to: 6, mood: 'ฟ้าเริ่มสาง มีไก่ขัน' },
  { id: 'morning', label: 'เช้า', from: 6, to: 9, mood: 'สว่างสดใส' },
  { id: 'late', label: 'สาย', from: 9, to: 12, mood: 'แดดจัด' },
  { id: 'afternoon', label: 'บ่าย', from: 12, to: 15, mood: 'แดดแรง อบอุ่น' },
  { id: 'evening', label: 'เย็น', from: 15, to: 18, mood: 'แสงสีส้ม บรรยากาศสงบ' },
  { id: 'dusk', label: 'ค่ำ', from: 18, to: 20, mood: 'เริ่มมืด มีแสงไฟ' },
  { id: 'night', label: 'กลางคืน', from: 20, to: 4, mood: 'มืด มีเสียงจิ้งหรีด' },
]

export function timePeriodAt(minuteOfDay: number): TimePeriod {
  const h = minuteOfDay / 60
  return TIME_PERIODS.find((p) => (p.from < p.to ? h >= p.from && h < p.to : h >= p.from || h < p.to))!
}

/** นาทีที่ช่วงเวลาถัดไปเริ่ม (ใช้กับปุ่ม "ข้ามช่วงเวลา") */
export function nextPeriodStart(minuteOfDay: number) {
  const cur = timePeriodAt(minuteOfDay)
  return (cur.to * 60) % 1440
}

/** ร้านค้าเปิด 06:00–20:00 */
export const SHOP_HOURS = { open: 6, close: 20 }
export const isShopOpen = (minuteOfDay: number) => minuteOfDay >= SHOP_HOURS.open * 60 && minuteOfDay < SHOP_HOURS.close * 60
/** ชาวบ้านออกมาเดินเล่น/ทำงาน 05:30–19:00 */
export const villagersOut = (minuteOfDay: number) => minuteOfDay >= 330 && minuteOfDay < 1140

// ---------- แสงตามเวลา (คีย์เฟรมรายชั่วโมง แล้วไล่ค่าระหว่างกัน) ----------
export interface LightKey {
  h: number
  /** ความสูงดวงอาทิตย์ (-1 ใต้ขอบฟ้า … 1 กลางฟ้า) */
  sun: number
  sunColor: string
  sunI: number
  sky: string
  ground: string
  hemiI: number
  ambI: number
  fog: string
  /** ไฟบ้าน/ตะเกียง 0–1 */
  lamps: number
}

export const LIGHT_KEYS: LightKey[] = [
  { h: 0, sun: -0.6, sunColor: '#8aa0d8', sunI: 0.12, sky: '#2a3458', ground: '#1a2018', hemiI: 0.35, ambI: 0.18, fog: '#1c2234', lamps: 1 },
  { h: 4, sun: -0.25, sunColor: '#9aa8d8', sunI: 0.15, sky: '#3a4470', ground: '#22281e', hemiI: 0.4, ambI: 0.2, fog: '#2a3048', lamps: 1 },
  { h: 5.5, sun: 0.02, sunColor: '#ffb27a', sunI: 0.5, sky: '#e8a888', ground: '#5a5a40', hemiI: 0.8, ambI: 0.25, fog: '#d8b4a0', lamps: 0.5 },
  { h: 7, sun: 0.3, sunColor: '#ffe2b8', sunI: 0.90, sky: '#fff4dc', ground: '#8a9a62', hemiI: 1.51, ambI: 0.35, fog: '#e8ead8', lamps: 0 },
  { h: 10, sun: 0.75, sunColor: '#fff0d0', sunI: 1.07, sky: '#fffae8', ground: '#8a9a62', hemiI: 1.68, ambI: 0.35, fog: '#eceee0', lamps: 0 },
  { h: 13, sun: 0.95, sunColor: '#fff2d8', sunI: 1.12, sky: '#fffaec', ground: '#8a9a62', hemiI: 1.68, ambI: 0.35, fog: '#eef0e2', lamps: 0 },
  { h: 16, sun: 0.5, sunColor: '#ffd8a0', sunI: 0.99, sky: '#fff0d0', ground: '#8a9060', hemiI: 1.51, ambI: 0.33, fog: '#ece2c8', lamps: 0 },
  { h: 17.5, sun: 0.15, sunColor: '#ffa860', sunI: 0.95, sky: '#ffd0a0', ground: '#7a7050', hemiI: 1.1, ambI: 0.3, fog: '#e8c0a0', lamps: 0.2 },
  { h: 18.5, sun: -0.05, sunColor: '#e87850', sunI: 0.45, sky: '#c88878', ground: '#4a4434', hemiI: 0.7, ambI: 0.24, fog: '#9a7a78', lamps: 0.8 },
  { h: 20, sun: -0.35, sunColor: '#8aa0d8', sunI: 0.15, sky: '#384068', ground: '#22281e', hemiI: 0.42, ambI: 0.2, fog: '#283048', lamps: 1 },
  { h: 24, sun: -0.6, sunColor: '#8aa0d8', sunI: 0.12, sky: '#2a3458', ground: '#1a2018', hemiI: 0.35, ambI: 0.18, fog: '#1c2234', lamps: 1 },
]
