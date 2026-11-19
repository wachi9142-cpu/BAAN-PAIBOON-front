import { useEffect, useRef, useState } from 'react'
import { create } from 'zustand'
import { useGame } from '../game/store'
import { ITEMS } from '../game/content/items'
import { itemIcon3D } from '../game/itemIcons'
import {
  CATEGORY_LABEL,
  RARITY_LABEL,
  REWARDS,
  autoCheckin,
  canRollToday,
  claimToday,
  rewardByKey,
  rollToday,
  streakNow,
  todayRoll,
  weekStatus,
  type CheckinRoll,
  type RewardDef,
} from '../game/checkin'
import './checkin.css'

/**
 * หน้าต่างเช็กอินรายวัน (Soft 3D Cartoon) — เปิดเองเมื่อเข้าเกมวันใหม่ · เปิดซ้ำได้จากปุ่ม 🎁 บนแถบบน
 * แสดงวันในสัปดาห์ + สถานะ · ปุ่มสุ่มรางวัล (วงล้อสลับภาพของรางวัล) · เผยรางวัล ชื่อ จำนวน ความหายาก · ปุ่มรับเข้ากระเป๋า
 */
export const useCheckinUI = create<{ open: boolean }>(() => ({ open: false }))
const openCheckin = () => useCheckinUI.setState({ open: true })

const iconOf = (r: RewardDef) => itemIcon3D(r.item ?? 'coins')
const nameOf = (r: RewardDef) => (r.item ? ITEMS[r.item].name : 'เงิน')
const qtyText = (r: RewardDef, q: number) => (r.category === 'money' ? `${q.toLocaleString('th-TH')} บาท` : `× ${q}`)

export function CheckinButton() {
  const save = useGame((s) => s.save)
  const pending = !!save && (canRollToday() || (todayRoll() && !todayRoll()!.claimed))
  return (
    <button type="button" className={`btn small ghost pause-btn checkin-btn${pending ? ' has-gift' : ''}`} onClick={openCheckin} title="เช็กอินรายวัน · สุ่มรางวัล">
      🎁{pending && <span className="checkin-dot" />}
    </button>
  )
}

export function CheckinWindow() {
  const open = useCheckinUI((s) => s.open)
  const hasSave = useGame((s) => !!s.save)
  // เข้าเกมวันใหม่ = เช็กอินอัตโนมัติ แล้วเปิดหน้าต่างให้สุ่มรางวัล
  useEffect(() => {
    if (!hasSave) return
    const first = autoCheckin()
    if (first || canRollToday()) {
      const t = setTimeout(openCheckin, 1600)
      return () => clearTimeout(t)
    }
  }, [hasSave])
  if (!open || !hasSave) return null
  return <CheckinPanel onClose={() => useCheckinUI.setState({ open: false })} />
}

function CheckinPanel({ onClose }: { onClose: () => void }) {
  useGame((s) => s.save?.checkin) // ให้รีเรนเดอร์เมื่อสถานะเปลี่ยน
  const week = weekStatus()
  const [roll, setRoll] = useState<CheckinRoll | null>(() => todayRoll() ?? null)
  const [spinning, setSpinning] = useState(false)
  const [face, setFace] = useState(0)
  const timer = useRef<number | null>(null)
  const pool = REWARDS
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  const spin = () => {
    if (spinning || roll) return
    setSpinning(true)
    let step = 0
    const steps = 16
    const tick = () => {
      step++
      setFace((f) => (f + 1 + Math.floor(Math.random() * 3)) % pool.length)
      if (step < steps) {
        timer.current = window.setTimeout(tick, 45 + step * step * 0.7)
      } else {
        setRoll(rollToday())
        setSpinning(false)
      }
    }
    tick()
  }
  const claim = () => setRoll(claimToday())

  const shown: RewardDef | undefined = roll ? rewardByKey(roll.key) : pool[face]
  const icon = shown ? iconOf(shown) : null
  const revealed = !!roll && !spinning

  return (
    <div className="checkin-backdrop" onClick={onClose}>
      <div className="checkin-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="เช็กอินรายวัน">
        <button type="button" className="checkin-x" onClick={onClose} aria-label="ปิด">
          ✕
        </button>
        <div className="checkin-head">
          <div className="checkin-title">เช็กอินรายวัน</div>
          <div className="checkin-sub">เข้าเกมทุกวัน รับสิทธิ์สุ่มรางวัลวันละ 1 ครั้ง · ติดต่อกัน {streakNow()} วัน 🔥</div>
        </div>

        <div className="checkin-week">
          {week.map((d) => (
            <div key={d.date} className={`checkin-day${d.isToday ? ' today' : ''}${d.checked ? ' checked' : ''}${d.future ? ' future' : ''}`}>
              <span className="dl">{d.label}</span>
              <span className="dn">{d.dayNum}</span>
              <span className="ds">{d.claimed ? '🎁' : d.checked ? '✔' : d.future ? '·' : '—'}</span>
            </div>
          ))}
        </div>

        <div className={`checkin-stage${revealed ? ' reveal rarity-' + shown?.rarity : ''}${spinning ? ' spinning' : ''}`}>
          <div className="checkin-glow" />
          {icon ? <img className="checkin-icon" src={icon} alt="" draggable={false} /> : <div className="checkin-icon fallback">🎁</div>}
          {revealed && shown && roll ? (
            <div className="checkin-result">
              <span className={`checkin-rarity r-${shown.rarity}`}>{RARITY_LABEL[shown.rarity]}</span>
              <div className="checkin-name">{nameOf(shown)}</div>
              <div className="checkin-qty">{qtyText(shown, roll.qty)}</div>
              <div className="checkin-cat">ประเภท: {CATEGORY_LABEL[shown.category]}</div>
            </div>
          ) : (
            <div className="checkin-result muted">{spinning ? 'กำลังสุ่ม…' : 'กดปุ่มด้านล่างเพื่อสุ่มรางวัลวันนี้'}</div>
          )}
        </div>

        <div className="checkin-actions">
          {!roll && (
            <button type="button" className="checkin-cta" onClick={spin} disabled={spinning}>
              {spinning ? 'กำลังสุ่ม…' : '🎲 สุ่มรางวัลวันนี้'}
            </button>
          )}
          {roll && !roll.claimed && !spinning && (
            <button type="button" className="checkin-cta claim" onClick={claim}>
              🎁 กดรับรางวัล
            </button>
          )}
          {roll?.claimed && (
            <div className="checkin-done">
              ✔ รับรางวัลวันนี้แล้ว{roll.convertedCoins ? ` (กระเป๋าเต็ม แปลงเป็นเงิน ${roll.convertedCoins} บาท)` : ' — เก็บเข้ากระเป๋าแล้ว'} · พรุ่งนี้มาใหม่นะ
            </div>
          )}
        </div>

        <div className="checkin-legend">
          {(['money', 'food', 'treasure', 'weapon', 'wear'] as const).map((c) => (
            <span key={c} className="chip-cat">
              {CATEGORY_LABEL[c]}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
