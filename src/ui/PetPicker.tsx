import { useEffect } from 'react'
import { useGame } from '../game/store'
import { summonPet } from '../game/catching'
import { getSpecies, type PetChoice, type PetSpecies } from '../game/content/pets'
import { ItemIcon } from './ItemIcon'

/** ไอคอนสัตว์แต่ละชนิด */
const ICON: Record<PetSpecies, string> = {
  dog: '🐶',
  cat: '🐱',
  buffalo: '🐃',
  cow: '🐮',
  pig: '🐷',
  goat: '🐐',
  sheep: '🐑',
  monkey: '🐵',
  squirrel: '🐿️',
  mouse: '🐭',
  rabbit: '🐰',
  bird: '🐦',
  chicken: '🐔',
  duck: '🦆',
  goose: '🦢',
  turtle: '🐢',
}
const SLOTS = 9
const same = (a?: PetChoice | null, b?: PetChoice | null) => !!a && !!b && a.species === b.species && a.name === b.name && a.color === b.color

/** รายชื่อสัตว์ที่เลือกเดินตามได้ (สูงสุด 9 ตัว): สัตว์คู่ใจ + สัตว์ที่จับได้ */
export function companionList(): PetChoice[] {
  const s = useGame.getState().save
  if (!s) return []
  const out: PetChoice[] = []
  if (s.homePet) out.push(s.homePet)
  for (const c of s.collection) if (!out.some((p) => same(p, c.pet))) out.push(c.pet)
  return out.slice(0, SLOTS)
}

/** เลื่อนเลือกสัตว์ตัวถัดไป/ก่อนหน้า (dir = +1/−1) */
export function cycleCompanion(dir: 1 | -1) {
  const list = companionList()
  if (list.length === 0) {
    useGame.getState().toast({ title: 'ยังไม่มีสัตว์เพื่อนเดินทาง', body: 'จับสัตว์ด้วยคฑา หรือเลี้ยงสัตว์คู่ใจก่อนนะ', tone: 'info' })
    return
  }
  const cur = useGame.getState().save?.player.pet
  const i = list.findIndex((p) => same(p, cur))
  const next = list[(i + dir + list.length) % list.length]
  if (!same(next, cur)) summonPet(next)
}

/**
 * ตัวเลือกสัตว์เพื่อนเดินทาง (มุมซ้ายล่าง): วงกลมแสดงสัตว์ที่เดินตามอยู่ + ชื่อ + ลำดับ
 * กด Z / X (หรือคลิกลูกศร) เลื่อนเลือกตัวก่อนหน้า/ถัดไป — เปลี่ยนได้ตลอดเวลา · มี 9 ช่อง
 */
export function PetPicker() {
  const save = useGame((s) => s.save)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.repeat) return
      if (useGame.getState().paused) return
      if (e.code === 'KeyZ') cycleCompanion(-1)
      if (e.code === 'KeyX') cycleCompanion(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  if (!save) return null
  const list = companionList()
  const cur = save.player.pet
  const idx = list.findIndex((p) => same(p, cur))
  return (
    <div className="pet-picker" aria-label="สัตว์เพื่อนเดินทาง">
      <button type="button" className="pp-key" onClick={() => cycleCompanion(-1)} title="ตัวก่อนหน้า (Z)">
        Z
      </button>
      <div className="pp-main">
        <div className={`pp-circle${cur ? '' : ' none'}`}>{cur ? <ItemIcon icon={ICON[cur.species] ?? '🐾'} /> : '—'}</div>
        <div className="pp-dots">
          {Array.from({ length: SLOTS }).map((_, i) => (
            <span key={i} className={`pp-dot${i === idx ? ' on' : ''}${i < list.length ? ' has' : ''}`} />
          ))}
        </div>
        <div className="pp-name">
          {cur ? (
            <>
              <b>{idx >= 0 ? idx + 1 : '·'}</b> {cur.name} <small>{getSpecies(cur.species).label}</small>
            </>
          ) : (
            'ไม่มีสัตว์เดินตาม'
          )}
        </div>
      </div>
      <button type="button" className="pp-key" onClick={() => cycleCompanion(1)} title="ตัวถัดไป (X)">
        X
      </button>
    </div>
  )
}
