import { useEffect, useState } from 'react'
import { HOUSE_DESIGNS, getHouse } from '../game/content/houses'
import { useGame } from '../game/store'
import { PreviewStage } from '../scenes/PreviewStage'
import { House } from '../scenes/models/House'
import { Character } from '../scenes/models/Character'

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
        <PreviewStage camera={[10, 7, 13]} target={[0, 2.2, 0]} minDistance={8} maxDistance={24}>
          <House design={design} />
          <group position={[1.2, 0, 4.6]}>
            <Character appearance={draft.appearance} />
          </group>
        </PreviewStage>
      </div>

      <div className="setup-panel">
        <div>
          <div className="step">ขั้นที่ 2 / 2</div>
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
          <button type="button" className="btn ghost" onClick={() => goTo('create')}>
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
