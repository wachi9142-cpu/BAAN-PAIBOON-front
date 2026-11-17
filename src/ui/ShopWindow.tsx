import { useState } from 'react'
import { useGame } from '../game/store'
import { buy, sell } from '../game/inventory'
import { BAG_LEVELS, bagSlots, ITEMS, RECIPES, SHOP, slotsUsed, type ItemId } from '../game/content/items'
import { ItemIcon } from './ItemIcon'

/** ร้านค้าป้าศรี: ซื้อเครื่องมือ/กระเป๋า และขายของที่เก็บมา */
export function ShopWindow({ onClose }: { onClose: () => void }) {
  const save = useGame((s) => s.save)!
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  const inv = save.inventory
  const owned = (Object.keys(inv) as ItemId[]).filter((id) => (inv[id] ?? 0) > 0)

  return (
    <div className="menu-backdrop" onClick={onClose}>
      <div className="menu shop" role="dialog" aria-label="ร้านค้าป้าศรี" onClick={(e) => e.stopPropagation()}>
        <div className="shop-head">
          <h2>🛒 ร้านค้าป้าศรี</h2>
          <div className="shop-coins">💰 {save.coins.toLocaleString('th-TH')} บาท</div>
        </div>
        <p className="hint" style={{ margin: 0 }}>
          ของในร้านสะดวกแต่แพงกว่า — หาวัตถุดิบมาคราฟเองจะประหยัดกว่า (เมนู → คราฟของ)
        </p>
        <div className="chips">
          <button type="button" className="chip" aria-pressed={tab === 'buy'} onClick={() => setTab('buy')}>
            ซื้อของ
          </button>
          <button type="button" className="chip" aria-pressed={tab === 'sell'} onClick={() => setTab('sell')}>
            ขายของ
          </button>
          <span className="shop-bag">
            {BAG_LEVELS[save.bagLevel].icon} {BAG_LEVELS[save.bagLevel].name} · ใช้ {slotsUsed(inv)}/{bagSlots(save.bagLevel)} ช่อง
          </span>
        </div>

        {tab === 'buy' ? (
          <ul className="shop-list">
            {SHOP.map((e) => {
              const isBag = 'bagLevel' in e.gives
              const ownedBag = isBag && 'bagLevel' in e.gives && save.bagLevel >= e.gives.bagLevel
              const recipe = RECIPES.find((r) => r.id === e.id)
              return (
                <li key={e.id} className="shop-row">
                  <span className="shop-icon"><ItemIcon icon={e.icon} /></span>
                  <span className="shop-name">
                    <strong>{e.name}</strong>
                    <small>
                      {'item' in e.gives ? ITEMS[e.gives.item].note : 'เพิ่มช่องในกระเป๋า'}
                      {recipe && ' · คราฟเองได้'}
                    </small>
                  </span>
                  <button
                    type="button"
                    className="btn small"
                    disabled={ownedBag || save.coins < e.price}
                    onClick={() => buy(e)}
                  >
                    {ownedBag ? 'มีแล้ว' : `${e.price} บาท`}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : owned.length === 0 ? (
          <p className="hint">ยังไม่มีของจะขาย — ลองเก็บกิ่งไม้ ก้อนหิน หรือตัดต้นไม้ดูนะ</p>
        ) : (
          <ul className="shop-list">
            {owned.map((id) => {
              const it = ITEMS[id]
              const q = inv[id] ?? 0
              return (
                <li key={id} className="shop-row">
                  <span className="shop-icon"><ItemIcon icon={it.icon} /></span>
                  <span className="shop-name">
                    <strong>
                      {it.name} ×{q}
                    </strong>
                    <small>รับซื้อชิ้นละ {it.sell} บาท</small>
                  </span>
                  <button type="button" className="btn small ghost" onClick={() => sell(id, 1)}>
                    ขาย 1
                  </button>
                  {q > 1 && (
                    <button type="button" className="btn small ghost" onClick={() => sell(id, q)}>
                      ขายหมด ({it.sell * q})
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <button type="button" className="btn ghost small" onClick={onClose}>
          ออกจากร้าน
        </button>
      </div>
    </div>
  )
}
