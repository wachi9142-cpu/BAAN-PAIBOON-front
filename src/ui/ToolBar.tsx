import { ItemIcon } from './ItemIcon'
import { useEffect, useState } from 'react'
import { useGame } from '../game/store'
import { checkEquipped, equip, toolChoices, useTools, type HeldTool } from '../game/trees'
import { CHOP_TOOLS } from '../game/content/trees'
import { GEM_ORDER, GEMS, setWandGem, type GemColor } from '../game/wand'
import { ITEMS, type ItemId } from '../game/content/items'
import { eat } from '../game/garden'

const SLOTS = 9
/** ลำดับชนิดของในแถบ: ของกิน → เมล็ดพันธุ์ → วัตถุดิบ (เครื่องมืออยู่หน้าสุดเสมอ) */
const KIND_ORDER = { food: 0, seed: 1, material: 2, tool: 3 } as const

export type HotSlot = { kind: 'tool'; tool: HeldTool } | { kind: 'item'; id: ItemId; qty: number }

/** ช่องในแถบไอเทม: เครื่องมือในมือ (มือเปล่า ขวาน คฑา) แล้วตามด้วยของที่พกอยู่ */
export function hotbarSlots(inv: Partial<Record<ItemId, number>> | undefined): HotSlot[] {
  const tools: HotSlot[] = toolChoices().map((t) => ({ kind: 'tool', tool: t }))
  const toolIds = new Set<string>(['axe', 'axe2', 'wand'])
  const items: HotSlot[] = (Object.keys(ITEMS) as ItemId[])
    .filter((id) => !toolIds.has(id) && (inv?.[id] ?? 0) > 0)
    .sort((a, b) => KIND_ORDER[ITEMS[a].kind] - KIND_ORDER[ITEMS[b].kind])
    .map((id) => ({ kind: 'item', id, qty: inv?.[id] ?? 0 }))
  return [...tools, ...items].slice(0, SLOTS)
}

/** ใช้ช่องที่เลือก: เครื่องมือ = ถือ · ของกิน = กิน · อื่น ๆ = บอกวิธีใช้ */
export function activateHotSlot(s: HotSlot | undefined) {
  if (!s) return
  if (s.kind === 'tool') return equip(s.tool)
  const def = ITEMS[s.id]
  if (def.food) return eat(s.id)
  useGame.getState().toast({ title: `${def.name} ×${s.qty}`, body: def.note, tone: 'info' })
}

/** แถบไอเทม (ล่างกลางจอ): เครื่องมือและของที่พกอยู่ พร้อมจำนวน — กดตัวเลข 1–9 หรือคลิกช่อง */
export function ToolBar() {
  const equipped = useTools((s) => s.equipped)
  const inv = useGame((s) => s.save?.inventory)
  const gem = (useGame((s) => s.save?.wandGem) ?? 'purple') as GemColor
  const [tip, setTip] = useState<number | null>(null)
  useEffect(() => checkEquipped(), [inv])
  const slots = hotbarSlots(inv)
  return (
    <div className="hotbar-wrap">
      {equipped === 'wand' && (
        <div className="gem-pick" role="radiogroup" aria-label="สีอัญมณีบนคฑา">
          <span>💎</span>
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
      <div className="hotbar" role="toolbar" aria-label="แถบไอเทม">
        {Array.from({ length: SLOTS }).map((_, i) => {
          const s = slots[i]
          const on = s?.kind === 'tool' && s.tool === equipped
          let icon: string | null = null
          let name = ''
          if (s?.kind === 'tool') {
            const d = s.tool === 'wand' ? { name: 'คฑา', icon: '🪄' } : CHOP_TOOLS[s.tool]
            icon = d.icon
            name = d.name
          } else if (s) {
            icon = ITEMS[s.id].icon
            name = ITEMS[s.id].name
          }
          return (
            <button
              key={i}
              type="button"
              className={`hot-slot${on ? ' on' : ''}${s ? '' : ' empty'}`}
              onClick={() => activateHotSlot(s)}
              onMouseEnter={() => setTip(i)}
              onMouseLeave={() => setTip((t) => (t === i ? null : t))}
              aria-label={s ? `${name} (กด ${i + 1})` : `ช่องว่าง ${i + 1}`}
            >
              <span className="hot-key">{i + 1}</span>
              {icon && (
                <span className={`hot-icon${s?.kind === 'tool' && s.tool === 'axe2' ? ' steel' : ''}`}>
                  <ItemIcon icon={icon} />
                </span>
              )}
              {s?.kind === 'item' && s.qty > 1 && <span className="hot-qty">{s.qty}</span>}
              {s?.kind === 'tool' && s.tool === 'wand' && <span className="tool-gem" style={{ background: GEMS[gem].color }} />}
              {tip === i && s && <span className="hot-tip">{name}{s.kind === 'item' && ITEMS[s.id].food ? ' · คลิกเพื่อกิน' : ''}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
