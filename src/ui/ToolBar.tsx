import { ItemIcon } from './ItemIcon'
import { useEffect } from 'react'
import { useGame } from '../game/store'
import { checkEquipped, equip, toolChoices, useTools } from '../game/trees'
import { CHOP_TOOLS } from '../game/content/trees'
import { GEM_ORDER, GEMS, setWandGem, type GemColor } from '../game/wand'

/** แถบเครื่องมือในมือ (มุมซ้ายล่าง): มือเปล่า · ขวาน · ขวานเหล็ก · คฑา — คลิกหรือกด 1–4 */
export function ToolBar() {
  const equipped = useTools((s) => s.equipped)
  const inv = useGame((s) => s.save?.inventory)
  const gem = (useGame((s) => s.save?.wandGem) ?? 'purple') as GemColor
  useEffect(() => checkEquipped(), [inv])
  const list = toolChoices()
  return (
    <div className="tool-bar" role="toolbar" aria-label="เครื่องมือในมือ">
      {list.map((t, i) => {
        const d = t === 'wand' ? { name: 'คฑา', icon: '🪄' } : CHOP_TOOLS[t]
        return (
          <button key={t} type="button" className={`tool-slot${equipped === t ? ' on' : ''}`} onClick={() => equip(t)} title={`${d.name} (กด ${i + 1})`}>
            <span className="tool-key">{i + 1}</span>
            <span className={`tool-icon${t === 'axe2' ? ' steel' : ''}`}><ItemIcon icon={d.icon} /></span>
            <span className="tool-name">{d.name}</span>
            {t === 'wand' && <span className="tool-gem" style={{ background: GEMS[gem].color }} />}
          </button>
        )
      })}
      {equipped === 'wand' && (
        <div className="gem-pick" role="radiogroup" aria-label="สีอัญมณีบนคฑา">
          <span>💎 สีอัญมณี</span>
          {GEM_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={gem === c}
              className="gem-dot"
              style={{ background: GEMS[c].color, boxShadow: `0 0 10px ${GEMS[c].color}` }}
              onClick={() => setWandGem(c)}
              title={GEMS[c].label}
            />
          ))}
        </div>
      )}
      {list.length === 1 && <span className="tool-tip">ทำขวานที่โต๊ะประดิษฐ์ หรือซื้อที่ร้านป้าศรี</span>}
    </div>
  )
}
