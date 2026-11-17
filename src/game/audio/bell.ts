import { useSettings } from '../settings'

let ctx: AudioContext | null = null

/** เสียงระฆังเบา ๆ (สังเคราะห์) — ใช้ตอนกราบพระ */
export function playBell(volume = 0.35) {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const sfx = useSettings.getState().sfxVolume ?? 1
    const t = ctx.currentTime + 0.01
    const out = ctx.createGain()
    out.gain.value = volume * sfx
    out.connect(ctx.destination)
    // เสียงระฆังโลหะ: ความถี่หลัก + โอเวอร์โทนที่ไม่ลงตัว ค่อย ๆ จางยาว
    for (const [f, a, d] of [
      [660, 1, 2.8],
      [1590, 0.4, 1.8],
      [2420, 0.18, 1.1],
      [3300, 0.08, 0.6],
    ] as const) {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(a, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + d)
      o.connect(g).connect(out)
      o.start(t)
      o.stop(t + d + 0.1)
    }
  } catch {
    /* ไม่มีเสียงก็ไม่เป็นไร */
  }
}
