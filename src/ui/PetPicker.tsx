import { useEffect } from 'react'
import { MAX_PET_HEARTS, useGame } from '../game/store'
import { getSpecies } from '../game/content/pets'
import { activeKeys, MAX_ACTIVE, openParty, partySlots, petOf, PARTY_SIZE } from '../game/party'
import { PetPortraitImg } from './PetPortrait'
import { openPetCard } from './PetCard'
import { useBuild } from '../game/building'

/**
 * เลื่อนเปลี่ยนตัวหลัก (Z/X): หยิบตัวถัดไปในทีม 9 ช่องมาเป็นตัวหลัก (ตัวเดิมยังอยู่ในทีม)
 * ตัวที่เดินตามอยู่ตัวอื่น ๆ ยังเดินตามต่อ
 */
export function cycleCompanion(dir: 1 | -1) {
  const party = partySlots().filter((k): k is string => !!k)
  const g = useGame.getState()
  if (!g.save) return
  if (party.length === 0) {
    g.toast({ title: 'ยังไม่มีสัตว์ในทีม', body: 'จับสัตว์ด้วยคฑา หรือเปิดทีมสัตว์เลี้ยง (คลิกวงกลมมุมซ้ายล่าง)', tone: 'info' })
    return
  }
  const active = activeKeys()
  const lead = active[0]
  const i = lead ? party.indexOf(lead) : -1
  const next = party[(i + dir + party.length) % party.length]
  if (next === lead) return
  const rest = active.filter((k) => k !== next && k !== lead)
  const nextActive = [next, ...(lead ? [lead] : []), ...rest].slice(0, MAX_ACTIVE)
  const o = petOf(next)
  useGame.setState({ save: { ...g.save, party: partySlots().map((k) => k ?? ''), activePets: nextActive, player: { ...g.save.player, pet: o?.pet ?? null } }, dirty: true, riding: false })
  g.saveNow('event')
}

/** มุมซ้ายล่าง: สัตว์ที่เดินตามอยู่ (สูงสุด 3) · ตัวหลักวงใหญ่ · Z/X เปลี่ยนตัวหลัก · คลิก = เปิดทีมสัตว์เลี้ยง */
export function PetPicker() {
  const save = useGame((s) => s.save)
  const building = useBuild((s) => s.active)
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
  // โหมดสร้าง: ซ่อนไว้ ไม่ให้ทับแถบสร้าง
  if (!save || building) return null
  const active = activeKeys()
  const party = partySlots()
  const lead = active[0] ? petOf(active[0]) : undefined
  const others = active.slice(1).map((k) => petOf(k)).filter(Boolean)
  const leadIdx = lead ? party.indexOf(lead.key) : -1
  return (
    <div className="pet-picker" aria-label="สัตว์เพื่อนเดินทาง">
      <button type="button" className="pp-key" onClick={() => cycleCompanion(-1)} title="ตัวหลักก่อนหน้า (Z)">
        Z
      </button>
      <div className="pp-main">
        <div className="pp-row">
          <button type="button" className={`pp-circle${lead ? '' : ' none'}`} onClick={() => (lead ? openPetCard(lead.key) : openParty())} title={lead ? 'การ์ดสัตว์เลี้ยง' : 'เปิดทีมสัตว์เลี้ยง'}>
            {lead ? <PetPortraitImg pet={lead.pet} size={56} /> : '🐾'}
          </button>
          {others.map((o) => (
            <button key={o!.key} type="button" className="pp-circle small" onClick={() => openPetCard(o!.key)} title={o!.pet.name}>
              <PetPortraitImg pet={o!.pet} size={36} />
            </button>
          ))}
        </div>
        {lead && (
          <div className="pp-heart" title={`ความผูกพัน ${save.petHearts}/${MAX_PET_HEARTS}`}>
            <span>❤</span>
            <i>
              <b style={{ width: `${(save.petHearts / MAX_PET_HEARTS) * 100}%` }} />
            </i>
            <small>{save.petHearts}/{MAX_PET_HEARTS}</small>
          </div>
        )}
        <div className="pp-dots" title={`ทีม ${party.filter(Boolean).length}/${PARTY_SIZE}`}>
          {party.map((k, i) => (
            <span key={i} className={`pp-dot${k ? ' has' : ''}${k && active.includes(k) ? ' act' : ''}${i === leadIdx ? ' on' : ''}`} />
          ))}
        </div>
        <div className="pp-name">
          {lead ? (
            <>
              <b>{leadIdx + 1}</b> {lead.pet.name} <small>{getSpecies(lead.pet.species).label}</small>
              <small> · เดินตาม {active.length}/{MAX_ACTIVE}</small>
            </>
          ) : (
            'ไม่มีสัตว์เดินตาม · คลิกวงกลม'
          )}
        </div>
      </div>
      <button type="button" className="pp-key" onClick={() => cycleCompanion(1)} title="ตัวหลักถัดไป (X)">
        X
      </button>
    </div>
  )
}
