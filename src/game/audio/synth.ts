/**
 * เสียงสังเคราะห์ชั่วคราว (ใช้แทนเมื่อยังไม่มีไฟล์เสียงจริง)
 * ทุกตัวคืน { output, stop } — output ต่อเข้ากับ bus ได้เลย
 */
import type { SynthKind } from '../content/soundscape'

export interface Voice {
  output: GainNode
  stop: () => void
}

let noiseBuf: AudioBuffer | null = null
function noise(ctx: AudioContext) {
  if (!noiseBuf || noiseBuf.sampleRate !== ctx.sampleRate) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  return src
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** ลมเบา ๆ: noise ผ่าน lowpass + แรงลมขึ้นลงช้า ๆ */
function wind(ctx: AudioContext): Voice {
  const out = ctx.createGain()
  const src = noise(ctx)
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 420
  const amp = ctx.createGain()
  amp.gain.value = 0.25
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.07
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.12
  lfo.connect(lfoGain).connect(amp.gain)
  src.connect(lp).connect(amp).connect(out)
  src.start()
  lfo.start()
  return {
    output: out,
    stop: () => {
      src.stop()
      lfo.stop()
    },
  }
}

/** แมลงกลางวันเบา ๆ: noise ผ่าน bandpass ความถี่สูง */
function insects(ctx: AudioContext): Voice {
  const out = ctx.createGain()
  const src = noise(ctx)
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 6200
  bp.Q.value = 6
  const amp = ctx.createGain()
  amp.gain.value = 0.35
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.2
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.15
  lfo.connect(lfoGain).connect(amp.gain)
  src.connect(bp).connect(amp).connect(out)
  src.start()
  lfo.start()
  return {
    output: out,
    stop: () => {
      src.stop()
      lfo.stop()
    },
  }
}

/** ตั้งเวลาเรียกซ้ำแบบสุ่มช่วง จนกว่าจะ stop */
function every(min: number, max: number, fn: () => void) {
  let t: number
  let alive = true
  const tick = () => {
    if (!alive) return
    fn()
    t = window.setTimeout(tick, rand(min, max))
  }
  t = window.setTimeout(tick, rand(0, max))
  return () => {
    alive = false
    window.clearTimeout(t)
  }
}

/** จิ้งหรีด: หลายตัว ความถี่ต่างกันเล็กน้อย ร้องเป็นจังหวะ "กริก-กริก-กริก" */
function crickets(ctx: AudioContext): Voice {
  const out = ctx.createGain()
  const stops: (() => void)[] = []
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = rand(4100, 4900)
    const env = ctx.createGain()
    env.gain.value = 0
    const pan = ctx.createStereoPanner()
    pan.pan.value = rand(-0.8, 0.8)
    const level = ctx.createGain()
    level.gain.value = rand(0.04, 0.09)
    osc.connect(env).connect(pan).connect(level).connect(out)
    osc.start()
    const pulses = Math.floor(rand(2, 5))
    const stopTimer = every(500, 1400, () => {
      let t = ctx.currentTime + 0.02
      for (let p = 0; p < pulses; p++) {
        env.gain.setValueAtTime(0, t)
        env.gain.linearRampToValueAtTime(1, t + 0.008)
        env.gain.linearRampToValueAtTime(0, t + 0.035)
        t += 0.05
      }
    })
    stops.push(() => {
      stopTimer()
      osc.stop()
    })
  }
  return { output: out, stop: () => stops.forEach((s) => s()) }
}

/** นก: เสียงจิ๊บ ๆ ความถี่กวาดขึ้นลง เว้นช่วงแบบสุ่ม */
function birds(ctx: AudioContext): Voice {
  const out = ctx.createGain()
  const stopTimer = every(400, 2600, () => {
    const notes = Math.floor(rand(1, 5))
    const base = rand(2200, 4200)
    const pan = ctx.createStereoPanner()
    pan.pan.value = rand(-0.9, 0.9)
    pan.connect(out)
    let t = ctx.currentTime + 0.02
    for (let n = 0; n < notes; n++) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      const env = ctx.createGain()
      const dur = rand(0.06, 0.16)
      const f1 = base * rand(0.85, 1.15)
      osc.frequency.setValueAtTime(f1, t)
      osc.frequency.exponentialRampToValueAtTime(f1 * rand(1.2, 1.7), t + dur * 0.6)
      osc.frequency.exponentialRampToValueAtTime(f1 * rand(0.8, 1.1), t + dur)
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(0.08, t + 0.01)
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(env).connect(pan)
      osc.start(t)
      osc.stop(t + dur + 0.02)
      t += dur + rand(0.03, 0.12)
    }
  })
  return { output: out, stop: stopTimer }
}

export function createSynth(ctx: AudioContext, kind: SynthKind): Voice {
  switch (kind) {
    case 'wind':
      return wind(ctx)
    case 'insects':
      return insects(ctx)
    case 'crickets':
      return crickets(ctx)
    case 'birds':
      return birds(ctx)
  }
}

// ---------- เสียงร้องสั้น ๆ ของสัตว์ (เล่นครั้งเดียว) ----------
export type CallKind =
  | 'chirp'
  | 'cluck'
  | 'quack'
  | 'squeak'
  | 'meow'
  | 'bleat'
  | 'oink'
  | 'bark'
  | 'howl'
  | 'moo'
  | 'purr'
  | 'chatter'
  | 'crow'
  | 'hiss'
  | 'henCall'
  | 'chickPeep'
  | 'honk'

/** เล่นเสียงร้องสังเคราะห์ 1 ครั้ง ต่อเข้า output ที่ให้มา คืนความยาวเสียง (วินาที) */
export function playCall(ctx: AudioContext, out: AudioNode, kind: CallKind, pitch = 1, times = 1): number {
  let start = ctx.currentTime + 0.02
  let total = 0
  for (let i = 0; i < times; i++) {
    const d = callOnce(ctx, out, kind, start, pitch)
    start += d + 0.08
    total += d + 0.08
  }
  return total
}

function callOnce(ctx: AudioContext, out: AudioNode, kind: CallKind, t0: number, pitch: number): number {
  const tone = (type: OscillatorType, at: number, dur: number, fr: [number, number, number?], peak = 0.25, filter?: number) => {
    const f = fr.map((x) => (x === undefined ? undefined : x * pitch)) as [number, number, number?]
    const filterHz = filter ? filter * pitch : undefined
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(f[0], at)
    if (f[2] !== undefined) {
      osc.frequency.linearRampToValueAtTime(f[1], at + dur * 0.4)
      osc.frequency.linearRampToValueAtTime(f[2], at + dur)
    } else {
      osc.frequency.exponentialRampToValueAtTime(f[1], at + dur)
    }
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(peak, at + Math.min(0.03, dur * 0.2))
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    let node: AudioNode = osc
    if (filterHz) {
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = filterHz
      bp.Q.value = 2.5
      osc.connect(bp)
      node = bp
    }
    node.connect(g).connect(out)
    osc.start(at)
    osc.stop(at + dur + 0.05)
  }
  switch (kind) {
    case 'chirp': {
      let t = t0
      for (let i = 0; i < 3; i++) {
        tone('sine', t, 0.09, [2800 + i * 300, 4200], 0.2)
        t += 0.13
      }
      return 0.5
    }
    case 'cluck': {
      // กุ๊ก กุ๊ก กุ๊ก
      let t = t0
      for (let i = 0; i < 3; i++) {
        tone('square', t, 0.08, [420, 300], 0.12, 900)
        t += 0.16
      }
      return 0.55
    }
    case 'quack':
      // ก๊าบ ก๊าบ
      tone('sawtooth', t0, 0.18, [520, 360], 0.18, 1100)
      tone('sawtooth', t0 + 0.26, 0.18, [500, 340], 0.18, 1100)
      return 0.5
    case 'squeak':
      tone('sine', t0, 0.07, [3200, 4300], 0.12)
      tone('sine', t0 + 0.11, 0.06, [3400, 4500], 0.1)
      return 0.25
    case 'meow':
      // เหมียว: เสียงขึ้นแล้วลง
      tone('triangle', t0, 0.55, [520, 820, 430], 0.22, 1400)
      return 0.6
    case 'bleat':
      // แบะ ๆ (แพะ/แกะ): เสียงสั่น
      {
        const n = 6
        for (let i = 0; i < n; i++) tone('sawtooth', t0 + i * 0.07, 0.08, [440 - i * 6, 420 - i * 6], 0.12, 1000)
      }
      return 0.5
    case 'oink': {
      // หมูร้อง "อู๊ด อู๊ด": เสียงทุ้มขึ้นจมูก แหบสั่น + เสียงฟืดลมจมูก (มีไฟล์จริง sfx-pig.mp3 จะใช้ไฟล์นั้น)
      const real = sampleFor(ctx, 'sfx-pig')
      if (real) {
        const src = ctx.createBufferSource()
        src.buffer = real
        src.playbackRate.value = pitch
        src.connect(out)
        src.start(t0)
        return real.duration / pitch
      }
      const grunt = (at: number, dur: number, f0: number) => {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(f0 * pitch, at)
        osc.frequency.linearRampToValueAtTime(f0 * 1.25 * pitch, at + dur * 0.3)
        osc.frequency.linearRampToValueAtTime(f0 * 0.8 * pitch, at + dur)
        const nose = ctx.createBiquadFilter()
        nose.type = 'bandpass'
        nose.frequency.value = 520 * pitch
        nose.Q.value = 2.2
        const lp = ctx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 1400
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.0001, at)
        g.gain.exponentialRampToValueAtTime(0.42, at + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
        // สั่นแหบ (เสียงคอหมู)
        const trem = ctx.createOscillator()
        trem.frequency.value = 32
        const tg = ctx.createGain()
        tg.gain.value = 0.22
        trem.connect(tg).connect(g.gain)
        osc.connect(nose).connect(lp).connect(g).connect(out)
        for (const o of [osc, trem]) {
          o.start(at)
          o.stop(at + dur + 0.05)
        }
        // ฟืดลมจมูก
        const n = Math.floor(ctx.sampleRate * dur)
        const buf = ctx.createBuffer(1, n, ctx.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((i / n) * Math.PI)
        const src = ctx.createBufferSource()
        src.buffer = buf
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.frequency.value = 900
        bp.Q.value = 1.2
        const ng = ctx.createGain()
        ng.gain.value = 0.12
        src.connect(bp).connect(ng).connect(out)
        src.start(at)
      }
      grunt(t0, 0.2, 150)
      grunt(t0 + 0.27, 0.24, 140)
      if (Math.random() < 0.5) grunt(t0 + 0.6, 0.18, 160)
      return 0.85
    }
    case 'bark':
      // โฮ่ง ๆ: เสียงสั้นกระแทก 2 ครั้ง
      tone('sawtooth', t0, 0.13, [380, 520, 240], 0.3, 900)
      tone('square', t0, 0.1, [190, 140], 0.12, 500)
      tone('sawtooth', t0 + 0.22, 0.12, [360, 500, 230], 0.28, 900)
      return 0.4
    case 'howl':
      // อู้ว~ ยาว ๆ
      tone('triangle', t0, 1.3, [380, 620, 480], 0.22, 1200)
      tone('sine', t0, 1.3, [760, 1240, 960], 0.05)
      return 1.35
    case 'moo':
      // มอ~ ทุ้มยาว
      tone('sawtooth', t0, 1, [150, 190, 120], 0.22, 500)
      tone('sine', t0, 1, [75, 95, 60], 0.15)
      return 1.05
    case 'purr': {
      // ครืด ๆ: เสียงต่ำสั่นถี่
      const n = 14
      for (let i = 0; i < n; i++) tone('sawtooth', t0 + i * 0.045, 0.05, [60, 55], 0.12, 300)
      return n * 0.045 + 0.05
    }
    case 'chatter': {
      // อู๊ก อ๊าก รัว ๆ (ลิง)
      const n = 5
      for (let i = 0; i < n; i++) tone('square', t0 + i * 0.09, 0.08, [700 + (i % 2) * 300, 500], 0.12, 1500)
      return n * 0.09 + 0.08
    }
    case 'crow': {
      // มีไฟล์เสียงจริง public/audio/sfx-rooster.mp3 (ผู้สร้างใส่เอง) → ใช้ไฟล์นั้นแทนเสียงสังเคราะห์
      const real = sampleFor(ctx, 'sfx-rooster')
      if (real) {
        const src = ctx.createBufferSource()
        src.buffer = real
        src.playbackRate.value = pitch
        const g = ctx.createGain()
        g.gain.value = 0.9
        src.connect(g).connect(out)
        src.start(t0)
        return real.duration / pitch
      }
      // พ่อไก่ขัน "เอ้ก-อี-เอ้ก-เอ้กกกกก" (เสียงชัด ใส ดัง)
      // แต่ละพยางค์: เสียงก้อง (ฮาร์มอนิกเต็ม) ผ่าน lowpass + ยกย่าน formant ~1.8 kHz · ต้นพยางค์มีเสียงลม "ก" สั้น ๆ
      // พยางค์สุดท้ายลากยาว: ไต่ขึ้นสูงสุด ค้าง สั่นเบา ๆ แล้วตกลงท้าย
      const syll = (at: number, dur: number, pts: [number, number][], peak: number, vibrato = 0) => {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(pts[0][1] * pitch, at)
        for (const [p, hz] of pts.slice(1)) osc.frequency.linearRampToValueAtTime(hz * pitch, at + dur * p)
        if (vibrato) {
          const vib = ctx.createOscillator()
          vib.frequency.value = 6
          const vg = ctx.createGain()
          vg.gain.value = vibrato * pitch
          vib.connect(vg).connect(osc.frequency)
          vib.start(at + dur * 0.3)
          vib.stop(at + dur)
        }
        const lp = ctx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 3200
        const fm = ctx.createBiquadFilter()
        fm.type = 'peaking'
        fm.frequency.value = 1800 * pitch
        fm.Q.value = 1.4
        fm.gain.value = 9
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.0001, at)
        g.gain.exponentialRampToValueAtTime(peak, at + 0.025)
        g.gain.setValueAtTime(peak, at + dur * 0.75)
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
        osc.connect(lp).connect(fm).connect(g).connect(out)
        osc.start(at)
        osc.stop(at + dur + 0.05)
        // เสียง "ก" ต้นพยางค์ (ลมสั้น ๆ)
        const n = Math.floor(ctx.sampleRate * 0.03)
        const buf = ctx.createBuffer(1, n, ctx.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
        const src = ctx.createBufferSource()
        src.buffer = buf
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.frequency.value = 2200
        const ng = ctx.createGain()
        ng.gain.value = peak * 0.5
        src.connect(bp).connect(ng).connect(out)
        src.start(at)
      }
      syll(t0, 0.13, [[0, 430], [1, 640]], 0.26) // เอ้ก
      syll(t0 + 0.17, 0.2, [[0, 640], [1, 720]], 0.26) // อี
      syll(t0 + 0.41, 0.14, [[0, 640], [1, 760]], 0.28) // เอ้ก
      syll(t0 + 0.6, 1.0, [[0, 700], [0.15, 830], [0.55, 800], [0.8, 760], [1, 480]], 0.3, 10) // เอ้กกกกก
      return 1.7
    }
    case 'henCall': {
      // แม่ไก่ร้องเรียกลูก "กุ๊ก กุ๊ก กุ๊ก กุ๊ก..." ต่ำ ๆ ถี่ขึ้นเรื่อย ๆ (มีไฟล์จริง sfx-hen-call.mp3 จะใช้ไฟล์นั้น)
      const real = sampleFor(ctx, 'sfx-hen-call')
      if (real) {
        const src = ctx.createBufferSource()
        src.buffer = real
        src.playbackRate.value = pitch
        src.connect(out)
        src.start(t0)
        return real.duration / pitch
      }
      let t = t0
      tone('triangle', t, 0.16, [420, 360, 300], 0.16, 800) // กร๊อก นำ
      t += 0.24
      const n = 6 + Math.floor(Math.random() * 3)
      for (let i = 0; i < n; i++) {
        tone('triangle', t, 0.065, [390 - i * 6, 280], 0.15, 750)
        tone('square', t, 0.03, [700, 500], 0.04, 1200) // ขอบเสียงคอ
        t += 0.13 - i * 0.006
      }
      return t - t0 + 0.05
    }
    case 'honk': {
      // ห่านร้อง "แฮ่ก แฮ่ก": เสียงแตรขึ้นจมูก สองจังหวะ (ไม่ใช่เสียงเป็ด)
      tone('square', t0, 0.22, [330, 440, 380], 0.2, 950)
      tone('sawtooth', t0, 0.22, [660, 880, 760], 0.08, 1800)
      tone('square', t0 + 0.3, 0.26, [320, 430, 360], 0.2, 950)
      tone('sawtooth', t0 + 0.3, 0.26, [640, 860, 720], 0.08, 1800)
      return 0.6
    }
    case 'chickPeep': {
      // ลูกเจี๊ยบ "เจี๊ยบ เจี๊ยบ": เสียงสูงแหลมสั้น ๆ ปลายตกเร็ว ร้องถี่ ๆ หลายตัวซ้อนกัน (มีไฟล์จริง sfx-chick.mp3 จะใช้ไฟล์นั้น)
      const real = sampleFor(ctx, 'sfx-chick')
      if (real) {
        const src = ctx.createBufferSource()
        src.buffer = real
        src.playbackRate.value = pitch
        src.connect(out)
        src.start(t0)
        return real.duration / pitch
      }
      const peep = (at: number, base: number, vol: number) => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(base * 0.92 * pitch, at)
        osc.frequency.linearRampToValueAtTime(base * 1.12 * pitch, at + 0.03)
        osc.frequency.exponentialRampToValueAtTime(base * 0.68 * pitch, at + 0.12)
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.0001, at)
        g.gain.exponentialRampToValueAtTime(vol, at + 0.012)
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.13)
        osc.connect(g).connect(out)
        osc.start(at)
        osc.stop(at + 0.15)
      }
      let end = t0
      // ลูกเจี๊ยบ 2–3 ตัว ร้องคนละจังหวะ คนละระดับเสียง
      const chicks = 2 + Math.floor(Math.random() * 2)
      for (let c = 0; c < chicks; c++) {
        let t = t0 + Math.random() * 0.15
        const base = 3600 + c * 350 + Math.random() * 200
        const n = 4 + Math.floor(Math.random() * 4)
        for (let i = 0; i < n; i++) {
          peep(t, base, 0.07 + Math.random() * 0.03)
          t += 0.16 + Math.random() * 0.08
        }
        end = Math.max(end, t)
      }
      return end - t0
    }
    case 'hiss': {
      // ฟ่อ: เสียงลมผ่านฟิลเตอร์
      const len = Math.floor(ctx.sampleRate * 0.6)
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
      const src = ctx.createBufferSource()
      src.buffer = buf
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 2500 * pitch
      const g = ctx.createGain()
      g.gain.value = 0.25
      src.connect(hp).connect(g).connect(out)
      src.start(t0)
      return 0.6
    }
  }
}

// ---------- เสียงจริงจากไฟล์ (ถ้ามี) ----------
const samples = new Map<string, AudioBuffer | null | 'loading'>()
/** โหลดไฟล์ /audio/<name>.mp3 ครั้งแรกที่ขอ · ยังไม่พร้อม/ไม่มีไฟล์ = null (ใช้เสียงสังเคราะห์ไปก่อน) */
function sampleFor(ctx: AudioContext, name: string): AudioBuffer | null {
  const s = samples.get(name)
  if (s === undefined) {
    samples.set(name, 'loading')
    fetch('/audio/' + name + '.mp3')
      .then((r) => (r.ok && (r.headers.get('content-type') ?? '').includes('audio') ? r.arrayBuffer() : Promise.reject()))
      .then((b) => ctx.decodeAudioData(b))
      .then((buf) => samples.set(name, buf))
      .catch(() => samples.set(name, null))
    return null
  }
  return s === 'loading' ? null : s
}
