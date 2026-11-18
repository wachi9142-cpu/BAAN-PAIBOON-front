import { useHold } from '../scenes/HoldInteract'
import { costText, moveStructure, removeStructure, startPlacing, storeStructure } from '../game/building'
import { STRUCTURE_LIST, STRUCTURES } from '../game/content/structures'
import { canAfford } from '../game/inventory'
import { useGame } from '../game/store'

/** เมนูที่เปิดจากการกดค้าง: สร้างของ (พื้นว่าง) · จัดการของ (ย้าย/หมุน/เก็บเข้าคลัง/รื้อ) */
export function HoldMenu() {
  const menu = useHold((s) => s.menu)
  const drag = useHold((s) => s.drag)
  const save = useGame((s) => s.save)
  const close = () => useHold.setState({ menu: null })
  if (drag)
    return (
      <div className={`hold-drag-tip${drag.ok ? '' : ' bad'}`}>
        {drag.moved ? (drag.ok ? '✅ ปล่อยเมาส์เพื่อวาง · หมุนล้อ = หมุน' : `❌ ${drag.why}`) : '✋ ยกขึ้นแล้ว — ลากไปที่ใหม่ หรือปล่อยเพื่อดูเมนู'}
      </div>
    )
  if (!menu || !save) return null
  const left = Math.min(window.innerWidth - 300, Math.max(8, menu.sx + 12))
  const top = Math.min(window.innerHeight - 360, Math.max(8, menu.sy - 20))
  if (menu.kind === 'build') {
    const stored = save.storedStructures ?? {}
    return (
      <div className="hold-menu" style={{ left, top }} role="dialog" aria-label="สร้างสิ่งของ">
        <strong>🔨 สร้างอะไรตรงนี้?</strong>
        <div className="hold-list">
          {STRUCTURE_LIST.map((d) => {
            const inStore = stored[d.id] ?? 0
            const ok = inStore > 0 || canAfford(d.cost)
            return (
              <button
                key={d.id}
                type="button"
                className={`hold-item${ok ? '' : ' poor'}`}
                disabled={!ok}
                onClick={() => {
                  close()
                  startPlacing(d.id, menu.at)
                }}
                title={d.note}
              >
                <span className="hold-icon">{d.icon}</span>
                <span>
                  {d.name}
                  <small>{inStore > 0 ? `📦 ในคลัง ×${inStore} (วางฟรี)` : costText(d.cost)}</small>
                </span>
              </button>
            )
          })}
        </div>
        <button type="button" className="hold-close" onClick={close}>
          ปิด
        </button>
      </div>
    )
  }
  const s = save.structures.find((t) => t.uid === menu.uid)
  if (!s) return null
  const def = STRUCTURES[s.id]
  return (
    <div className="hold-menu" style={{ left, top }} role="dialog" aria-label={def.name}>
      <strong>
        {def.icon} {def.name}
      </strong>
      <p className="hold-hint">กดค้างที่ของแล้วลาก = ย้าย</p>
      <div className="hold-list">
        <button type="button" className="hold-item" onClick={() => moveStructure(s.uid, s.x, s.z, (s.rot + 1) % 4) && useGame.getState().toast({ title: 'หมุนตรงนี้ไม่ได้', body: 'ชนของอื่นหรือเกินอาณาเขต', tone: 'warn' })}>
          <span className="hold-icon">↻</span>
          <span>หมุน 90°</span>
        </button>
        <button
          type="button"
          className="hold-item"
          onClick={() => {
            close()
            storeStructure(s.uid)
          }}
        >
          <span className="hold-icon">📦</span>
          <span>
            เก็บเข้าคลัง<small>นำกลับมาวางใหม่ได้ ไม่เสียวัตถุดิบ</small>
          </span>
        </button>
        <button
          type="button"
          className="hold-item"
          onClick={() => {
            close()
            removeStructure(s.uid)
          }}
        >
          <span className="hold-icon">🧹</span>
          <span>
            รื้อ<small>ได้วัตถุดิบคืน: {costText(def.cost)}</small>
          </span>
        </button>
      </div>
      <button type="button" className="hold-close" onClick={close}>
        ปิด
      </button>
    </div>
  )
}
