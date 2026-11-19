/**
 * เสียงกิจกรรมในบ้าน (สังเคราะห์ด้วย Web Audio — ไม่ใช้ไฟล์ลิขสิทธิ์)
 * ทุกเสียงแบบต่อเนื่องคืนฟังก์ชัน stop() → หยุดกิจกรรม/ออกจากห้อง = เสียงค่อย ๆ จางหายทันที
 * สุ่มจังหวะ ความดัง และระดับเสียงทุกครั้ง ไม่วนเสียงเดิมซ้ำ ๆ
 */
import { audio } from './engine'

type Out = { ctx: AudioContext; sfx: GainNode }
const out = (): Out | null => {
  const o = audio.outputs()
  return o ? { ctx: o.ctx, sfx: o.sfx } : null
}
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

let noiseBuf: AudioBuffer | null = null
function noise(ctx: AudioContext) {
  if (!noiseBuf || noiseBuf.sampleRate !== ctx.sampleRate) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const s = ctx.createBufferSource()
  s.buffer = noiseBuf
  s.loop = true
  s.loopStart = Math.random()
  return s
}

/** เสียงน้ำ/ของกระทบสั้น ๆ: noise ผ่านฟิลเตอร์ มี envelope */
function burst(o: Out, t: number, dur: number, freq: number, q: number, vol: number, type: BiquadFilterType = 'bandpass', sweepTo?: number) {
  const n = noise(o.ctx)
  const f = o.ctx.createBiquadFilter()
  f.type = type
  f.frequency.setValueAtTime(freq, t)
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur)
  f.Q.value = q
  const g = o.ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.03, dur * 0.2))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  n.connect(f).connect(g).connect(o.sfx)
  n.start(t)
  n.stop(t + dur + 0.05)
}

/** เสียงโลหะกระทบ (ตะหลิวกับกระทะ): ฮาร์มอนิกไม่ลงตัว ดับเร็ว */
function clink(o: Out, t: number, vol: number, base: number) {
  for (const [m, v, d] of [
    [1, 1, 0.18],
    [2.76, 0.55, 0.12],
    [5.4, 0.3, 0.07],
  ] as const) {
    const osc = o.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = base * m * rnd(0.98, 1.02)
    const g = o.ctx.createGain()
    g.gain.setValueAtTime(vol * v, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + d)
    osc.connect(g).connect(o.sfx)
    osc.start(t)
    osc.stop(t + d + 0.02)
  }
  burst(o, t, 0.04, 3500, 1.5, vol * 0.5)
}

/** ฟองน้ำเดือดหนึ่งฟอง: เสียงป๊อกต่ำ ๆ ที่สูงขึ้นเร็ว */
function bubble(o: Out, t: number, vol: number) {
  const osc = o.ctx.createOscillator()
  osc.type = 'sine'
  const f0 = rnd(180, 420)
  osc.frequency.setValueAtTime(f0, t)
  osc.frequency.exponentialRampToValueAtTime(f0 * rnd(1.8, 2.6), t + 0.06)
  const g = o.ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
  osc.connect(g).connect(o.sfx)
  osc.start(t)
  osc.stop(t + 0.1)
}

/** ตัวจัดตารางเสียงสุ่มต่อเนื่อง + เสียงพื้นหลังที่ต้องหยุดได้ */
function session(o: Out) {
  const timers: number[] = []
  const nodes: { stop: (t: number) => void }[] = []
  let alive = true
  return {
    alive: () => alive,
    every(minMs: number, maxMs: number, fn: () => void) {
      const loop = () => {
        if (!alive) return
        fn()
        timers.push(window.setTimeout(loop, rnd(minMs, maxMs)))
      }
      timers.push(window.setTimeout(loop, rnd(minMs * 0.3, maxMs * 0.6)))
    },
    at(ms: number, fn: () => void) {
      timers.push(window.setTimeout(() => alive && fn(), ms))
    },
    bed(node: { stop: (t: number) => void }) {
      nodes.push(node)
    },
    stop() {
      if (!alive) return
      alive = false
      timers.forEach((t) => clearTimeout(t))
      const t = o.ctx.currentTime
      nodes.forEach((n) => n.stop(t))
    },
  }
}

/** เสียงพื้นหลังต่อเนื่อง (noise ผ่านฟิลเตอร์) ค่อย ๆ ดังขึ้น ค่อย ๆ จางออกตอนหยุด */
function hiss(o: Out, freq: number, q: number, vol: number, type: BiquadFilterType = 'bandpass', wobble = 0) {
  const n = noise(o.ctx)
  const f = o.ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  const g = o.ctx.createGain()
  const t = o.ctx.currentTime
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.6)
  n.connect(f).connect(g).connect(o.sfx)
  let lfo: OscillatorNode | null = null
  if (wobble > 0) {
    lfo = o.ctx.createOscillator()
    lfo.frequency.value = rnd(0.3, 0.7)
    const lg = o.ctx.createGain()
    lg.gain.value = vol * wobble
    lfo.connect(lg).connect(g.gain)
    lfo.start()
  }
  n.start()
  return {
    gain: g,
    stop(at: number) {
      g.gain.cancelScheduledValues(at)
      g.gain.setValueAtTime(g.gain.value, at)
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5)
      n.stop(at + 0.6)
      lfo?.stop(at + 0.6)
    },
  }
}

export type Stopper = () => void
const noop: Stopper = () => {}

/** กดชักโครก: เสียงกดคันโยก → น้ำไหลแรงพุ่งวน → เสียงดูดลงท่อ → น้ำเติมถังเบา ๆ */
export function playFlush() {
  const o = out()
  if (!o) return
  const t = o.ctx.currentTime + 0.05
  clink(o, t, 0.08, 900)
  burst(o, t + 0.05, 0.06, 1200, 2, 0.12)
  burst(o, t + 0.12, 2.4, 700, 0.8, 0.35, 'bandpass', 1600)
  burst(o, t + 0.3, 2.0, 300, 1.2, 0.25, 'lowpass', 120)
  burst(o, t + 1.9, 0.9, 500, 3, 0.18, 'bandpass', 250)
  for (let i = 0; i < 10; i++) bubble(o, t + 1.6 + i * rnd(0.05, 0.12), 0.12)
  burst(o, t + 2.6, 3.2, 2400, 4, 0.05)
}

/** ฝักบัว: เสียงน้ำพุ่งต่อเนื่อง (ดังเบาสลับเหมือนขยับตัวใต้น้ำ) + หยดน้ำกระเซ็น + เสียงถูสบู่เป็นช่วง ๆ */
export function startShower(): Stopper {
  const o = out()
  if (!o) return noop
  const s = session(o)
  burst(o, o.ctx.currentTime, 0.08, 900, 2, 0.1) // เปิดก๊อก
  s.bed(hiss(o, 3800, 0.6, 0.16, 'bandpass', 0.35))
  s.bed(hiss(o, 900, 0.9, 0.08, 'bandpass', 0.5))
  s.every(70, 260, () => bubble(o, o.ctx.currentTime, rnd(0.02, 0.06)))
  s.every(900, 2200, () => {
    // ถูสบู่/ขยับตัว: เสียงเสียดสีนุ่ม ๆ หลายครั้ง
    const t = o.ctx.currentTime
    for (let i = 0; i < 4; i++) burst(o, t + i * rnd(0.12, 0.2), 0.12, rnd(1800, 2600), 1.2, 0.05)
  })
  return () => {
    burst(o, o.ctx.currentTime, 0.08, 800, 2, 0.08) // ปิดก๊อก
    s.stop()
  }
}

/** ตักน้ำอาบจากโอ่ง (ขันน้ำ): ตักน้ำ → ราดตัว ซ่า ๆ เป็นจังหวะไม่สม่ำเสมอ */
export function startBucketBath(): Stopper {
  const o = out()
  if (!o) return noop
  const s = session(o)
  s.every(1500, 2300, () => {
    const t = o.ctx.currentTime
    burst(o, t, 0.25, 400, 2, 0.12, 'bandpass', 250) // ขันจุ่มน้ำ
    for (let i = 0; i < 4; i++) bubble(o, t + 0.05 + i * 0.04, 0.05)
    burst(o, t + 0.55, rnd(0.7, 1.0), 2200, 0.7, 0.3, 'bandpass', 900) // ราดน้ำ
    burst(o, t + 0.6, 0.8, 500, 0.8, 0.12, 'lowpass', 200)
  })
  return () => s.stop()
}

/** ทำอาหาร: คลิกเปิดเตา+ไฟพรึ่บ → ใส่ของลงกระทะ (ฉ่า) → ผัด: เสียงฉ่าต่อเนื่อง + ตะหลิวกระทบกระทะสุ่มจังหวะ → (phase 'boil') น้ำเดือดปุด ๆ */
export function startCooking(): { stop: Stopper; drop: () => void; boil: () => void } {
  const o = out()
  if (!o) return { stop: noop, drop: noop, boil: noop }
  const s = session(o)
  const t0 = o.ctx.currentTime
  // เปิดเตาแก๊ส: แกร๊ก ๆ ๆ แล้วไฟติดพรึ่บ + เสียงไฟฟู่เบา ๆ ต่อเนื่อง
  for (let i = 0; i < 3; i++) burst(o, t0 + i * 0.09, 0.03, 4000, 3, 0.15)
  burst(o, t0 + 0.3, 0.5, 300, 0.7, 0.2, 'lowpass', 900)
  s.bed(hiss(o, 260, 0.6, 0.05, 'lowpass'))
  let sizzle: ReturnType<typeof hiss> | null = null
  const drop = () => {
    const t = o.ctx.currentTime
    burst(o, t, 0.1, 200, 1, 0.18, 'lowpass') // วัตถุดิบตกกระทะ
    burst(o, t + 0.02, 1.2, 5200, 0.5, 0.35, 'highpass') // ฉ่า!
    if (!sizzle) {
      sizzle = hiss(o, 4800, 0.4, 0.09, 'highpass', 0.6)
      s.bed(sizzle)
      // เสียงน้ำมันปะทุเป็นเม็ด ๆ
      s.every(30, 140, () => burst(o, o.ctx.currentTime, rnd(0.01, 0.03), rnd(3000, 7000), 2, rnd(0.03, 0.09)))
      // ตะหลิวผัด: กระทบกระทะเป็นจังหวะผัดสั้น-ยาวสลับ
      s.every(220, 700, () => {
        const tt = o.ctx.currentTime
        clink(o, tt, rnd(0.05, 0.11), rnd(700, 1100))
        if (Math.random() < 0.5) clink(o, tt + rnd(0.1, 0.18), rnd(0.03, 0.07), rnd(800, 1200))
        burst(o, tt + 0.02, 0.18, 3000, 0.8, 0.06) // ของในกระทะไถลตามตะหลิว
      })
    }
  }
  const boil = () => {
    burst(o, o.ctx.currentTime, 0.6, 900, 0.7, 0.15, 'bandpass', 300) // เทน้ำลงหม้อ
    s.bed(hiss(o, 500, 1.2, 0.04, 'bandpass', 0.4))
    s.every(40, 160, () => bubble(o, o.ctx.currentTime, rnd(0.04, 0.1)))
  }
  return {
    drop,
    boil,
    stop: () => {
      const t = o.ctx.currentTime
      for (let i = 0; i < 2; i++) burst(o, t + i * 0.08, 0.03, 3500, 3, 0.12) // ปิดเตา
      s.stop()
    },
  }
}

/** นอน/งีบ: ลมหายใจยาว ๆ เข้า-ออก (บางครั้งกรนเบา ๆ) */
export function startSleepBreath(): Stopper {
  const o = out()
  if (!o) return noop
  const s = session(o)
  s.every(3200, 4200, () => {
    const t = o.ctx.currentTime
    burst(o, t, 1.3, 600, 0.8, 0.05, 'bandpass', 900)
    burst(o, t + 1.5, 1.6, 700, 0.8, 0.04, 'bandpass', 400)
    if (Math.random() < 0.35) {
      const osc = o.ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = rnd(55, 75)
      const f = o.ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = 300
      const g = o.ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.03, t + 0.5)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
      osc.connect(f).connect(g).connect(o.sfx)
      osc.start(t)
      osc.stop(t + 1.3)
    }
  })
  return () => s.stop()
}

/** ประตูไม้: เปิด = บานพับเอี๊ยดสั้น ๆ · ปิด = ปึก + กลอนแกร๊ก */
export function playDoor(open: boolean) {
  const o = out()
  if (!o) return
  const t = o.ctx.currentTime
  if (open) {
    const osc = o.ctx.createOscillator()
    osc.type = 'sawtooth'
    const f0 = rnd(380, 520)
    osc.frequency.setValueAtTime(f0, t)
    osc.frequency.linearRampToValueAtTime(f0 * rnd(1.2, 1.5), t + 0.35)
    const f = o.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 1400
    f.Q.value = 4
    const g = o.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.025, t + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
    osc.connect(f).connect(g).connect(o.sfx)
    osc.start(t)
    osc.stop(t + 0.45)
  } else {
    burst(o, t, 0.15, 160, 1, 0.25, 'lowpass')
    burst(o, t + 0.08, 0.04, 2500, 3, 0.08)
  }
}

/** ตัดผม: กรรไกรตัด (แกร๊บ ๆ เป็นชุด) สลับปัตตาเลี่ยนหึ่ง ๆ เป็นช่วง ๆ */
export function startHaircut(): Stopper {
  const o = out()
  if (!o) return noop
  const s = session(o)
  s.every(500, 1100, () => {
    const t = o.ctx.currentTime
    const n = 2 + Math.floor(Math.random() * 4)
    for (let i = 0; i < n; i++) {
      const tt = t + i * rnd(0.12, 0.2)
      burst(o, tt, 0.035, rnd(5000, 7000), 4, 0.09)
      burst(o, tt + 0.03, 0.03, rnd(3000, 4500), 4, 0.05)
    }
  })
  s.at(5200, () => {
    // ปัตตาเลี่ยนเล็มรอบหู ~2.5 วิ
    const t = o.ctx.currentTime
    const osc = o.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = 118
    const f = o.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 900
    f.Q.value = 1.5
    const g = o.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.035, t + 0.1)
    g.gain.setValueAtTime(0.035, t + 2.3)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.5)
    osc.connect(f).connect(g).connect(o.sfx)
    osc.start(t)
    osc.stop(t + 2.6)
    s.bed({ stop: (at) => { try { osc.stop(at + 0.05) } catch { /* หยุดไปแล้ว */ } } })
  })
  return () => s.stop()
}
