import { useEffect, useState } from 'react'
import { ACT_LABEL, useActivity } from '../game/houseLife'

/** แถบสถานะกิจกรรมในบ้าน (อาบน้ำ นอน ทำอาหาร…) + จอมืดลงตอนหลับ */
export function ActivityHud() {
  const cur = useActivity((s) => s.cur)
  const step = useActivity((s) => s.step)
  const dim = useActivity((s) => s.dim)
  const [, tick] = useState(0)
  useEffect(() => {
    if (!cur) return
    const id = window.setInterval(() => tick((n) => n + 1), 100)
    return () => clearInterval(id)
  }, [cur])
  if (!cur && dim <= 0) return null
  const k = cur ? Math.min(1, (performance.now() - cur.t0) / 1000 / cur.dur) : 1
  return (
    <>
      {dim > 0 && (
        <div style={{ position: 'fixed', inset: 0, background: '#0a0d1a', opacity: dim, pointerEvents: 'none', zIndex: 40, display: 'grid', placeItems: 'center' }}>
          <div style={{ color: '#f4e6c0', fontSize: '1.6rem', fontWeight: 700, opacity: Math.min(1, dim * 1.5) }}>Zzz…</div>
        </div>
      )}
      {cur && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 104,
            transform: 'translateX(-50%)',
            zIndex: 41,
            minWidth: 260,
            maxWidth: 'calc(100vw - 32px)',
            padding: '10px 16px 12px',
            borderRadius: 18,
            background: 'rgba(255, 248, 236, 0.95)',
            boxShadow: '0 4px 0 #e2c49a, 0 10px 22px rgba(60,40,20,0.3)',
            color: '#5a3e26',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 800 }}>{ACT_LABEL[cur.spot.kind]}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, minHeight: '1.2em' }}>{step}</div>
          <div style={{ marginTop: 6, height: 8, borderRadius: 999, background: '#f0dcc0', overflow: 'hidden' }}>
            <div style={{ width: `${k * 100}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#ffbe5c,#f0902a)' }} />
          </div>
          <div style={{ marginTop: 4, fontSize: '0.72rem', opacity: 0.7 }}>เดิน (WASD) หรือกด E เพื่อหยุด</div>
        </div>
      )}
    </>
  )
}
