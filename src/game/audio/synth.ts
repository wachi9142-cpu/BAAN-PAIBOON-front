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
