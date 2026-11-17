import { useEffect, useState } from 'react'
import { HOUSE_DESIGNS, getHouse } from '../game/content/houses'
import { useGame } from '../game/store'
import { PreviewStage } from '../scenes/PreviewStage'
import { House } from '../scenes/models/House'
import { Character } from '../scenes/models/Character'
import { Pet } from '../scenes/models/Pet'

export function ChooseHouseScreen() {
  const draft = useGame((s) => s.draft)
  const goTo = useGame((s) => s.goTo)
  const startNewLife = useGame((s) => s.startNewLife)
  const [houseId, setHouseId] = useState(HOUSE_DESIGNS[0].id)

  useEffect(() => {
    if (!draft) goTo('create')
  }, [draft, goTo])
  if (!draft) return null

  const design = getHouse(houseId)

  return (
    <div className="setup">
      <div className="setup-stage">
        <PreviewStage camera={[14, 8, 18]} target={[0, 2.4, 0]} minDistance={10} maxDistance={30}>
          <House design={design} />
          <group position={[1.2, 0, 4.6]}>
            <Character appearance={draft.appearance} />
          </group>
          {draft.pet && (
            <group position={[2.2, draft.pet.species === 'bird' ? 1.3 : 0, 4.9]} rotation={[0, -0.4, 0]}>
              <Pet pet={draft.pet} />
            </group>
          )}
        </PreviewStage>
      </div>

      <div className="setup-panel">
        <div>
          <div className="step">ขั้นที่ 3 / 3</div>
          <h2>เลือกบ้านของ{draft.name}</h2>
        </div>
        <p className="hint" style={{ margin: 0 }}>
          บ้านจะสร้างบนที่ดินเริ่มต้นของคุณในหมู่บ้านไพบูลย์ ต่อเติมและซื้อที่ดินเพิ่มได้ในภายหลัง
        </p>

        <div className="house-list">
          {HOUSE_DESIGNS.map((h) => (
            <button key={h.id} type="button" className="house-option" aria-pressed={h.id === houseId} onClick={() => setHouseId(h.id)}>
              <h3>{h.name}</h3>
              <p>{h.description}</p>
              <div className="perks">
                {h.perks.map((p) => (
                  <span key={p} className="perk">
                    {p}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="setup-footer">
          <button type="button" className="btn ghost" onClick={() => goTo('pet')}>
            ย้อนกลับ
          </button>
          <button type="button" className="btn" onClick={() => startNewLife(houseId)}>
            เริ่มชีวิตที่บ้านไพบูลย์
          </button>
        </div>
      </div>
    </div>
  )
}
