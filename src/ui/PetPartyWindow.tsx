import { useGame } from '../game/store'
import { getSpecies } from '../game/content/pets'
import { activeKeys, makeLead, MAX_ACTIVE, moodOf, MOODS, ownedPets, PARTY_SIZE, partySlots, petOf, setPartySlot, toggleActive, usePartyUi } from '../game/party'
import { PetLivePreview, PetPortraitImg, PortraitStudio } from './PetPortrait'
import { openPetCard } from './PetCard'

/**
 * หน้าต่างทีมสัตว์เลี้ยง: ทีม 9 ช่อง · เรียกออกมาเดินตามได้ 3 ตัว · ภาพสัตว์ตัวใหญ่ + รายละเอียด · สัตว์ทั้งหมดที่มี
 */
export function PetPartyWindow() {
  const open = usePartyUi((s) => s.open)
  const sel = usePartyUi((s) => s.sel)
  useGame((s) => s.save?.party)
  useGame((s) => s.save?.activePets)
  useGame((s) => s.save?.collection)
  if (!open) return <PortraitStudio />
  const close = () => usePartyUi.setState({ open: false })
  const party = partySlots()
  const active = activeKeys()
  const owned = ownedPets()
  const inParty = party.filter(Boolean).length
  const cur = sel ? petOf(sel) : undefined
  const mood = cur ? MOODS[moodOf(cur.key, cur.pet)] : null
  const curActive = cur ? active.includes(cur.key) : false
  const curInParty = cur ? party.includes(cur.key) : false
  return (
    <div className="menu-backdrop" onClick={close}>
      <PortraitStudio />
      <div className="menu party-win" role="dialog" aria-label="ทีมสัตว์เลี้ยง" onClick={(e) => e.stopPropagation()}>
        <div className="party-head">
          <h3>🐾 ทีมสัตว์เลี้ยง</h3>
          <span className="party-count">
            ในทีม <b>{inParty}</b>/{PARTY_SIZE} · เดินตามอยู่ <b className="act">{active.length}</b>/{MAX_ACTIVE}
          </span>
          <button type="button" className="btn small ghost" onClick={close}>
            ปิด
          </button>
        </div>

        <div className="party-body">
          {/* ทีม 9 ช่อง */}
          <div className="party-left">
            <div className="party-grid">
              {party.map((k, i) => {
                const o = k ? petOf(k) : undefined
                const on = !!k && active.includes(k)
                return (
                  <button
                    key={i}
                    type="button"
                    className={`party-slot${o ? '' : ' empty'}${on ? ' active' : ''}${k && k === sel ? ' sel' : ''}`}
                    onClick={() => (o ? usePartyUi.setState({ sel: k }) : null)}
                    onDoubleClick={() => k && toggleActive(k)}
                    title={o ? `${o.pet.name} · ดับเบิลคลิก = เรียกออกมา/เก็บเข้า` : 'ช่องว่าง'}
                  >
                    <span className="party-no">{i + 1}</span>
                    {o ? <PetPortraitImg pet={o.pet} size={64} /> : <span className="party-plus">+</span>}
                    {o && <span className="party-name">{o.pet.name}</span>}
                    {on && <span className="party-badge">{active.indexOf(k!) === 0 ? '★ ตัวหลัก' : 'เดินตาม'}</span>}
                  </button>
                )
              })}
            </div>
            <p className="hint">
              คลิกเลือกดูรายละเอียด · ดับเบิลคลิก = เรียกออกมา/เก็บเข้า · ป้ายสีเขียว = กำลังเดินตาม · ไม่มีป้าย = อยู่ในทีม (พักอยู่)
            </p>

            {/* สัตว์ทั้งหมดที่มี */}
            <h4>สัตว์ทั้งหมดของฉัน ({owned.length})</h4>
            <div className="party-all">
              {owned.length === 0 && <p className="hint">ยังไม่มีสัตว์ — จับสัตว์ด้วยคฑา หรือเลี้ยงสัตว์คู่ใจ</p>}
              {owned.map((o) => (
                <button key={o.key} type="button" className={`party-mini${o.key === sel ? ' sel' : ''}${party.includes(o.key) ? ' in' : ''}`} onClick={() => usePartyUi.setState({ sel: o.key })}>
                  <PetPortraitImg pet={o.pet} size={40} />
                  <span>{o.pet.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* รายละเอียดตัวที่เลือก */}
          <div className="party-right">
            {cur ? (
              <>
                <div className="party-preview">
                  <PetLivePreview pet={cur.pet} />
                </div>
                <h3 className="party-title">{cur.pet.name}</h3>
                <p className="party-sub">
                  {getSpecies(cur.pet.species).label}
                  {cur.pet.breed ? ` · ${cur.pet.breed}` : ''} · {cur.note}
                </p>
                {mood && (
                  <p className="party-mood">
                    นิสัย: <b>{mood.label}</b> — {mood.note}
                  </p>
                )}
                <p className={`party-state${curActive ? ' on' : ''}`}>
                  {curActive ? (active[0] === cur.key ? '★ ตัวหลัก · กำลังเดินตาม (ขี่/จูงได้)' : 'กำลังเดินตาม') : curInParty ? 'อยู่ในทีม · พักอยู่' : 'ยังไม่อยู่ในทีม'}
                </p>
                <div className="party-actions">
                  <button type="button" className="btn small" onClick={() => { close(); openPetCard(cur.key) }}>
                    📋 การ์ดสัตว์
                  </button>
                  <button type="button" className="btn small" onClick={() => toggleActive(cur.key)}>
                    {curActive ? '🏠 เก็บเข้า (พัก)' : '🐾 เรียกออกมาเดินตาม'}
                  </button>
                  {curActive && active[0] !== cur.key && (
                    <button type="button" className="btn small ghost" onClick={() => makeLead(cur.key)}>
                      ★ ตั้งเป็นตัวหลัก
                    </button>
                  )}
                  {curInParty ? (
                    <button type="button" className="btn small ghost" onClick={() => setPartySlot(party.indexOf(cur.key), null)}>
                      เอาออกจากทีม
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn small ghost"
                      disabled={!party.includes(null)}
                      onClick={() => setPartySlot(party.indexOf(null), cur.key)}
                    >
                      ใส่เข้าทีม
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="hint">เลือกสัตว์เพื่อดูรายละเอียด</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
