/**
 * เสียงสภาพอากาศ (สังเคราะห์ ไม่ต้องใช้ไฟล์): ฝนตก (ซ่า ๆ + เม็ดฝนกระทบหลังคา/ใบไม้) · ลม (หวีดต่ำ ๆ ขึ้นลง) · ฟ้าร้อง
 * หลังฝนหยุด: นกกับแมลงกลับมาส่งเสียง
 * ต่อเข้า ambience bus ของ audio engine (ปรับระดับตามตั้งค่าเสียงธรรมชาติ)
 */
import { audio } from './engine'
import { playCall } from './synth'
import { weatherRt } from '../weather'

let nodes: null | { rainG: GainNode; dropG: GainNode; windG: GainNode; windF: BiquadFilterNode } = null
let lastRain = 0
let birdsAt = 0

function noise(ctx: AudioContext, seconds = 2, brown = false) {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    if (brown) {
      last = (last + 0.02 * w) / 1.02
      d[i] = last * 3.5
    } else d[i] = w
  }
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  return src
}

function build() {
  const o = audio.outputs()
  if (!o) return null
  const { ctx, ambience } = o
  // ฝน: เสียงซ่ากรองช่วงกลาง-สูง
  const rain = noise(ctx, 3)
  const rf = ctx.createBiquadFilter()
  rf.type = 'bandpass'
  rf.frequency.value = 2400
  rf.Q.value = 0.6
  const rainG = ctx.createGain()
  rainG.gain.value = 0
  rain.connect(rf).connect(rainG).connect(ambience)
  rain.start()
  // เม็ดฝนกระทบหลังคา/ใบไม้: เสียงแตกเป็นเม็ด ๆ ช่วงต่ำกว่า
  const drop = noise(ctx, 2)
  const df = ctx.createBiquadFilter()
  df.type = 'lowpass'
  df.frequency.value = 900
  const dropG = ctx.createGain()
  dropG.gain.value = 0
  drop.connect(df).connect(dropG).connect(ambience)
  drop.start()
  // ลม: brown noise กรองต่ำ ความถี่เลื่อนขึ้นลง
  const wind = noise(ctx, 4, true)
  const windF = ctx.createBiquadFilter()
  windF.type = 'lowpass'
  windF.frequency.value = 400
  const windG = ctx.createGain()
  windG.gain.value = 0
  wind.connect(windF).connect(windG).connect(ambience)
  wind.start()
  return { rainG, dropG, windG, windF }
}

/** เรียกทุกเฟรม: ปรับระดับเสียงตามค่าอากาศ (k = ลดเสียงตอนอยู่ในบ้าน) */
export function updateWeatherSound(k = 1) {
  if (!nodes) nodes = build()
  if (!nodes) return
  const o = audio.outputs()!
  const t = o.ctx.currentTime
  const w = weatherRt
  nodes.rainG.gain.setTargetAtTime(w.rain * 0.22 * k, t, 0.6)
  nodes.dropG.gain.setTargetAtTime(w.rain * 0.12 * (k < 1 ? 1.6 : 1), t, 0.6) // ในบ้านได้ยินฝนบนหลังคาชัดกว่า
  nodes.windG.gain.setTargetAtTime(Math.max(0, w.wind - 0.2) * 0.35 * k, t, 0.8)
  nodes.windF.frequency.setTargetAtTime(250 + w.wind * 500 + Math.sin(t * 0.7) * 120 * w.wind, t, 0.5)
  // ฝนเพิ่งหยุด → นกกับแมลงกลับมาร้อง
  if (lastRain > 0.3 && w.rain < 0.05 && t - birdsAt > 60) {
    birdsAt = t
    const g = o.ctx.createGain()
    g.gain.value = 0.25 * k
    g.connect(o.ambience)
    ;[0, 1.4, 2.6, 4.2].forEach((d, i) => window.setTimeout(() => playCall(o.ctx, g, i % 2 ? 'chirp' : 'chatter', 1 + Math.random() * 0.3, 2), d * 1000))
    window.setTimeout(() => g.disconnect(), 8000)
  }
  if (w.rain > 0.3 || w.rain < 0.05) lastRain = w.rain > 0.3 ? w.rain : lastRain * 0.999
}

/** ฟ้าร้อง: ครืนต่ำ ๆ ยาว (vol 0.35 = ไกล · 0.9 = ใกล้) */
export function thunderSound(vol = 0.6) {
  const o = audio.outputs()
  if (!o) return
  const { ctx, ambience } = o
  const src = noise(ctx, 4, true)
  src.loop = false
  const f = ctx.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = vol > 0.6 ? 500 : 180
  const g = ctx.createGain()
  const t = ctx.currentTime
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + (vol > 0.6 ? 0.05 : 0.6))
  g.gain.exponentialRampToValueAtTime(vol * 0.5, t + 1.2)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 3.8)
  src.connect(f).connect(g).connect(ambience)
  src.start(t)
  src.stop(t + 4)
}
