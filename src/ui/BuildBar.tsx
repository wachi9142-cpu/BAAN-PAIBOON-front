import { useGame } from '../game/store'
import { costText, moveItem, placeProblem, rotateTool, toggleBuild, useBuild, type BuildTool } from '../game/building'
import { canAfford } from '../game/inventory'
import { CHEST_SLOTS, STRUCTURE_LIST } from '../game/content/structures'
import { bagSlots, ITEMS, slotsUsed, type ItemId } from '../game/content/items'
import { ItemIcon } from './ItemIcon'

/** แถบโหมดสร้าง (ล่างจอ): เลือกสิ่งปลูกสร้าง · หมุน · เก็บคืน · ออก */
export function BuildBar() {
  const active = useBuild((s) => s.active)
  const tool = useBuild((s) => s.tool)
  const rot = useBuild((s) => s.rot)
  const hover = useBuild((s) => s.hover)
  useGame((s) => s.save?.inventory)
  if (!active) return null
  const pick = (t: BuildTool) => useBuild.setState({ tool: tool === t ? null : t })
  const why = hover && tool && tool !== 'remove' ? placeProblem(tool, hover[0], hover[1], rot) : null
  return (
    <div className="build-bar" role="toolbar" aria-label="โหมดสร้าง">
      <div className="build-head">
        <strong>🔨 โหมดสร้าง</strong>
        <span className="build-tip">
          {tool === 'remove'
            ? 'คลิกสิ่งปลูกสร้างเพื่อรื้อ (ได้วัตถุดิบคืนครบ)'
            : tool
              ? why
                ? `❌ ${why}`
                : '✅ คลิกพื้นเพื่อวาง · ลากเมาส์หมุนกล้องได้'
              : 'เลือกของที่จะสร้าง · พื้นสีเขียว = สร้างได้ · สีแดง = สร้างไม่ได้'}
        </span>
        <button type="button" className="btn small ghost" onClick={rotateTool} title="หมุน (R)">
          ↻ หมุน (R)
        </button>
        <button type="button" className={`btn small ghost${tool === 'remove' ? ' on' : ''}`} onClick={() => pick('remove')}>
          🧹 รื้อ/ย้าย
        </button>
        <button type="button" className="btn small" onClick={() => toggleBuild(false)}>
          เสร็จแล้ว (B)
        </button>
      </div>
      <div className="build-items">
        {STRUCTURE_LIST.map((d) => {
          const ok = canAfford(d.cost)
          return (
            <button
              key={d.id}
              type="button"
              className={`build-item${tool === d.id ? ' on' : ''}${ok ? '' : ' poor'}`}
              onClick={() => pick(d.id)}
              title={d.note}
            >
              <span className="build-icon">{d.icon}</span>
              <span className="build-name">{d.name}</span>
              <small>{costText(d.cost)}</small>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** กล่องเก็บของ: คลิกของเพื่อย้าย กระเป๋า ⇄ กล่อง (Shift+คลิก = ย้ายทั้งหมด) */
export function ChestWindow() {
  const uid = useBuild((s) => s.chestOpen)
  const save = useGame((s) => s.save)
  if (!uid || !save) return null
  const box = save.chests[uid] ?? {}
  const close = () => useBuild.setState({ chestOpen: null })
  const list = (inv: Partial<Record<ItemId, number>>, toChest: boolean) => {
    const ids = (Object.keys(ITEMS) as ItemId[]).filter((id) => (inv[id] ?? 0) > 0)
    if (ids.length === 0) return <p className="hint">ว่างเปล่า</p>
    return (
      <ul className="chest-list">
        {ids.map((id) => (
          <li key={id}>
            <button type="button" className="chest-row" onClick={(e) => moveItem(uid, id, e.shiftKey ? inv[id] ?? 0 : 1, toChest)} title="คลิก = ย้าย 1 ชิ้น · Shift+คลิก = ย้ายทั้งหมด">
              <ItemIcon icon={ITEMS[id].icon} /> {ITEMS[id].name} ×{inv[id]}
              <span className="chest-arrow">{toChest ? '→' : '←'}</span>
            </button>
          </li>
        ))}
      </ul>
    )
  }
  return (
    <div className="menu-backdrop" onClick={close}>
      <div className="menu chest-win" role="dialog" aria-label="กล่องเก็บของ" onClick={(e) => e.stopPropagation()}>
        <h3>📦 กล่องเก็บของ</h3>
        <p className="hint">คลิกของเพื่อย้าย 1 ชิ้น · Shift+คลิก ย้ายทั้งหมด</p>
        <div className="chest-cols">
          <section>
            <h4>
              🎒 กระเป๋า {slotsUsed(save.inventory)}/{bagSlots(save.bagLevel)}
            </h4>
            {list(save.inventory, true)}
          </section>
          <section>
            <h4>
              📦 ในกล่อง {slotsUsed(box)}/{CHEST_SLOTS}
            </h4>
            {list(box, false)}
          </section>
        </div>
        <button type="button" className="btn ghost small" onClick={close}>
          ปิด (Esc)
        </button>
      </div>
    </div>
  )
}
