/**
 * ฤดูกาลและสภาพอากาศ (§2.56)
 * - ฤดู: ร้อน · ฝน · หนาว (ฤดูละ 30 วันในเกม — ตรงกับบอร์ดประกาศ) · 3 วันสุดท้ายของแต่ละฤดู = ช่วงเปลี่ยนฤดู
 * - อากาศเปลี่ยนเป็นขั้น ๆ อย่างเป็นธรรมชาติ: เมฆมา → ลมแรง → ฟ้าร้องไกล ๆ → ฝนปรอย → ฝนหนัก → ค่อย ๆ เบา → หยุดแต่ยังครึ้ม → แดดออก/หมอกบาง
 *   บางครั้งฝนตกกะทันหัน · โอกาสแต่ละแบบขึ้นกับฤดู (ไม่ใช่สุ่มเท่ากัน)
 * - ค่าต่อเนื่อง (เมฆ ฝน ลม หมอก ความเปียก) ไล่เปลี่ยนนุ่ม ๆ ทุกเฟรม — ภาพ เสียง และพื้นใช้ค่าชุดเดียวกัน
 * - โลกมีวงจรของตัวเอง: สุ่มใหม่ทุกครั้ง (ไม่ผูกกับวัน) และจำสภาพล่าสุดไว้ในเซฟ
 */
import { create } from 'zustand'
import { seasonOf, type Season } from './content/noticeboard'
import { isShiftDate, today } from './content/calendar'
import { useGame } from './store'

export type WeatherKind = 'clear' | 'hot' | 'cloudy' | 'windy' | 'drizzle' | 'rain' | 'storm' | 'clearing' | 'mist' | 'cool'

export const WEATHER: Record<WeatherKind, { icon: string; label: string; note: string; cloud: number; rain: number; wind: number; fog: number; thunder: number }> = {
  clear: { icon: '☀️', label: 'แดดออก ฟ้าใส', note: 'มีเมฆลอยผ่านบ้าง', cloud: 0.05, rain: 0, wind: 0.15, fog: 0, thunder: 0 },
  hot: { icon: '🌞', label: 'แดดจัด', note: 'อากาศร้อน ดื่มน้ำบ่อย ๆ', cloud: 0, rain: 0, wind: 0.05, fog: 0, thunder: 0 },
  cool: { icon: '🌤️', label: 'แดดอ่อน อากาศเย็น', note: 'ลมเย็นสบาย', cloud: 0.15, rain: 0, wind: 0.2, fog: 0.1, thunder: 0 },
  cloudy: { icon: '☁️', label: 'ฟ้าครึ้ม', note: 'เมฆปกคลุม แสงแดดลดลง', cloud: 0.6, rain: 0, wind: 0.3, fog: 0.05, thunder: 0 },
  windy: { icon: '🌬️', label: 'ลมแรง เมฆตั้งเค้า', note: 'มีเสียงฟ้าร้องไกล ๆ', cloud: 0.8, rain: 0, wind: 0.8, fog: 0.05, thunder: 0.15 },
  drizzle: { icon: '🌦️', label: 'ฝนตกปรอย ๆ', note: 'พื้นเริ่มเปียก', cloud: 0.8, rain: 0.25, wind: 0.35, fog: 0.15, thunder: 0 },
  rain: { icon: '🌧️', label: 'ฝนตก', note: 'น้ำไหลตามพื้น เริ่มมีแอ่งน้ำ', cloud: 0.9, rain: 0.6, wind: 0.5, fog: 0.25, thunder: 0.1 },
  storm: { icon: '⛈️', label: 'ฝนตกหนัก ฟ้าร้อง', note: 'หาที่หลบฝนก่อนนะ', cloud: 1, rain: 1, wind: 0.9, fog: 0.35, thunder: 0.8 },
  clearing: { icon: '🌥️', label: 'ฝนหยุด ฟ้ายังครึ้ม', note: 'นกกับแมลงเริ่มกลับมาส่งเสียง', cloud: 0.55, rain: 0, wind: 0.2, fog: 0.2, thunder: 0 },
  mist: { icon: '🌫️', label: 'หมอก น้ำค้าง', note: 'หยดน้ำค้างตามใบหญ้า', cloud: 0.3, rain: 0, wind: 0.05, fog: 0.75, thunder: 0 },
}

export const SEASON_INFO: Record<Season | 'shift', { icon: string; label: string }> = {
  hot: { icon: '🔥', label: 'ฤดูร้อน' },
  rain: { icon: '🌧️', label: 'ฤดูฝน' },
  cool: { icon: '❄️', label: 'ฤดูหนาว' },
  shift: { icon: '🍂', label: 'ช่วงเปลี่ยนฤดู' },
}
/** 7 วันท้ายของแต่ละฤดู = ช่วงเปลี่ยนฤดู (ตามปฏิทิน) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const isSeasonShift = (_day?: number) => isShiftDate(today())
export const seasonLabel = (day: number) => (isSeasonShift(day) ? SEASON_INFO.shift : SEASON_INFO[seasonOf(day)])

/** ขั้นถัดไปตามธรรมชาติ [ชนิด, น้ำหนัก] */
const NEXT: Record<WeatherKind, [WeatherKind, number][]> = {
  clear: [['clear', 3], ['cloudy', 3], ['hot', 1], ['rain', 0.5]], // rain = ตกกะทันหัน
  hot: [['hot', 2], ['clear', 3], ['cloudy', 2]],
  cool: [['cool', 3], ['clear', 2], ['mist', 1], ['cloudy', 1]],
  cloudy: [['clear', 2], ['windy', 3], ['drizzle', 2], ['cloudy', 1]],
  windy: [['drizzle', 3], ['rain', 2], ['storm', 1], ['cloudy', 1]],
  drizzle: [['rain', 3], ['drizzle', 1], ['clearing', 2]],
  rain: [['storm', 2], ['rain', 1], ['drizzle', 3]],
  storm: [['rain', 4], ['storm', 1]],
  clearing: [['clear', 3], ['mist', 1], ['cloudy', 1], ['drizzle', 0.5]],
  mist: [['clear', 2], ['cool', 2], ['cloudy', 1]],
}
/** ฤดูปรับน้ำหนัก: ฝนตกบ่อยหน้าฝน · ร้อนแดดจัด · หนาวหมอก */
const SEASON_BIAS: Record<Season | 'shift', Partial<Record<WeatherKind, number>>> = {
  hot: { hot: 2.5, clear: 1.5, rain: 0.35, drizzle: 0.5, storm: 0.6, windy: 0.8, mist: 0.1, cool: 0.1 },
  rain: { rain: 2, drizzle: 1.6, storm: 1.6, windy: 1.5, cloudy: 1.4, hot: 0.2, mist: 0.6, cool: 0.3 },
  cool: { mist: 2.5, cool: 2.5, clear: 1.2, rain: 0.2, drizzle: 0.3, storm: 0.1, windy: 0.4, hot: 0.05 },
  shift: { cloudy: 1.3, windy: 1.3, drizzle: 1.1, mist: 1.1 },
}
/** แต่ละขั้นนานกี่นาทีในเกม [ต่ำสุด, สูงสุด] */
const DURATION: Record<WeatherKind, [number, number]> = {
  clear: [120, 360],
  hot: [120, 300],
  cool: [120, 300],
  cloudy: [40, 150],
  windy: [20, 60],
  drizzle: [30, 90],
  rain: [40, 120],
  storm: [20, 70],
  clearing: [30, 90],
  mist: [60, 150],
}

export interface WeatherSave {
  kind: WeatherKind
  /** นาทีในเกมที่เหลือของขั้นนี้ */
  left: number
  wet: number
}

export const useWeather = create<{ kind: WeatherKind }>(() => ({ kind: 'clear' }))

/** ค่าต่อเนื่องที่ฉาก/เสียงอ่านทุกเฟรม (ไม่ทำให้ React render ใหม่) */
export const weatherRt = { cloud: 0, rain: 0, wind: 0.15, fog: 0, thunder: 0, wet: 0, flash: 0, nextBolt: 0 }

function pick(from: WeatherKind, day: number, minute: number): WeatherKind {
  const s: Season | 'shift' = isSeasonShift(day) ? 'shift' : seasonOf(day)
  const bias = { ...SEASON_BIAS[seasonOf(day)], ...(s === 'shift' ? SEASON_BIAS.shift : {}) }
  const morning = minute >= 240 && minute < 540
  const list = NEXT[from].map(([k, w]) => {
    let ww = w * (bias[k] ?? 1)
    // หมอกเช้า: เกิดง่ายตอนเช้ามืด–เช้า ไม่ค่อยเกิดตอนบ่าย
    if (k === 'mist') ww *= morning ? 2.5 : 0.2
    // แดดจัดตอนกลางคืนไม่มี
    if (k === 'hot' && (minute < 600 || minute > 1020)) ww *= 0.1
    return [k, ww] as const
  })
  const total = list.reduce((a, [, w]) => a + w, 0)
  let r = Math.random() * total
  for (const [k, w] of list) if ((r -= w) <= 0) return k
  return list[0][0]
}
const durOf = (k: WeatherKind) => {
  const [a, b] = DURATION[k]
  return a + Math.random() * (b - a)
}

/** เริ่ม/โหลดอากาศจากเซฟ (ไม่มี = สุ่มตามฤดู) */
export function initWeather() {
  const g = useGame.getState().save
  if (!g) return
  let w = g.weather
  if (!w) {
    const start: WeatherKind = seasonOf(g.day) === 'cool' ? 'cool' : seasonOf(g.day) === 'rain' ? 'cloudy' : 'clear'
    w = { kind: pick(start, g.day, g.minuteOfDay), left: 60 + Math.random() * 120, wet: 0 }
    g.weather = w
  }
  const t = WEATHER[w.kind]
  Object.assign(weatherRt, { cloud: t.cloud, rain: t.rain, wind: t.wind, fog: t.fog, thunder: t.thunder, wet: w.wet })
  useWeather.setState({ kind: w.kind })
}

/** เดินอากาศตามเวลาในเกม (gameMin) และไล่ค่าต่อเนื่องตามเวลาจริง (dt) */
export function tickWeather(dt: number, gameMin: number) {
  const g = useGame.getState().save
  if (!g || !g.weather) return
  const w = g.weather
  w.left -= gameMin
  if (w.left <= 0) {
    const prev = w.kind
    w.kind = pick(prev, g.day, g.minuteOfDay)
    w.left = durOf(w.kind)
    if (w.kind !== prev) {
      useWeather.setState({ kind: w.kind })
      announce(prev, w.kind)
    }
  }
  const t = WEATHER[w.kind]
  // ไล่ค่าแบบนุ่ม (เมฆมาก่อนฝน · ฝนเบาลงช้า ๆ)
  const k = (rate: number) => 1 - Math.exp(-dt * rate)
  weatherRt.cloud += (t.cloud - weatherRt.cloud) * k(0.25)
  weatherRt.rain += (Math.min(t.rain, weatherRt.cloud + 0.1) - weatherRt.rain) * k(0.35)
  weatherRt.wind += (t.wind - weatherRt.wind) * k(0.4)
  weatherRt.fog += (t.fog - weatherRt.fog) * k(0.15)
  weatherRt.thunder = t.thunder
  // พื้นเปียกขึ้นตอนฝนตก แห้งช้า ๆ (แดดจัดแห้งเร็ว)
  const dry = w.kind === 'hot' ? 0.012 : w.kind === 'clear' || w.kind === 'cool' ? 0.006 : 0.002
  weatherRt.wet = Math.max(0, Math.min(1, weatherRt.wet + (weatherRt.rain * 0.05 - dry) * dt))
  w.wet = weatherRt.wet
  weatherRt.flash = Math.max(0, weatherRt.flash - dt * 3)
}

const toast = (title: string, body?: string) => useGame.getState().toast({ title, body, tone: 'info' })
function announce(prev: WeatherKind, next: WeatherKind) {
  const n = WEATHER[next]
  if (next === 'storm') toast(`${n.icon} ${n.label}`, 'ฝนหนัก ลมแรง ชาวบ้านเข้าบ้านหลบฝน · ลองหาชายคาหรือศาลาหลบฝนนะ')
  else if (next === 'drizzle' && prev !== 'rain') toast(`${n.icon} ฝนเริ่มตกปรอย ๆ แล้ว`, n.note)
  else if (next === 'rain' && prev === 'clear') toast('🌧️ ฝนตกกะทันหัน!', 'รีบหาที่หลบฝนเร็ว')
  else if (next === 'clearing') toast(`${n.icon} ฝนหยุดแล้ว`, n.note)
  else if (next === 'mist') toast(`${n.icon} มีหมอกลง`, n.note)
  else if (next === 'windy') toast(`${n.icon} ${n.label}`, 'ท้องฟ้าเริ่มมืด อาจมีฝน')
}

/** ฝนหนักจนคนในหมู่บ้านเข้าบ้าน */
export const rainingHard = () => (useGame.getState().save?.weather?.kind ?? 'clear') === 'storm' || weatherRt.rain > 0.75

/** ทดสอบตอนพัฒนา: บังคับอากาศ */
export function forceWeather(kind: WeatherKind, minutes = 120) {
  const g = useGame.getState().save
  if (!g) return
  const prev = g.weather?.kind ?? 'clear'
  g.weather = { kind, left: minutes, wet: g.weather?.wet ?? 0 }
  useWeather.setState({ kind })
  announce(prev, kind)
}
