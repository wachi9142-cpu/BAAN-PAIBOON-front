import './book.css'
import { CalendarPages } from './CalendarPages'
import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { createPortal } from 'react-dom'
import { useGame } from '../game/store'
import { ITEMS, RECIPES, BAG_LEVELS, type ItemId, type Recipe } from '../game/content/items'
import { STRUCTURES, type StructureId } from '../game/content/structures'
import { canAfford, craft, hasTool } from '../game/inventory'
import { startPlacing } from '../game/building'
import { NPC_INFO } from '../game/content/villagers'
import { getSpecies } from '../game/content/pets'
import { buildSaddle, canBuildSaddle, costText, RARITY_INFO, SADDLES } from '../game/saddles'
import { activeKeys, MAX_ACTIVE, openParty, PARTY_SIZE, partySlots, petOf, toggleActive, traitText } from '../game/party'
import { careOf, renamePet, sexOf } from '../game/petCare'
import { openFriends } from '../game/social'
import { ItemIcon } from './ItemIcon'
import { PetPortraitImg } from './PetPortrait'
import { openPetCard } from './PetCard'
import { BagTab, SettingsTab } from './GameMenu'
import { BOOK_THEMES, bookStyle, CHARMS, COVER_COLORS, moveInOrder, PATTERNS, resetBook, setBook, type BookCharm, type BookTheme, type CoverPattern } from '../game/bookStyle'

/**
 * หนังสือเมนูหลัก (Main Game Book) — ศูนย์รวมระบบของเกมในเล่มเดียว
 * แท็บด้านบน = ระบบหลัก · แท็บข้าง (ค่าเริ่มต้นฝั่งซ้าย) = หมวดสร้าง/จัดการสิ่งของ · แต่ละหมวดมีสัญลักษณ์และสีประจำ
 */
type TopTab = 'party' | 'calendar' | 'storage' | 'tech' | 'quests' | 'guild' | 'options'
type SideTab = 'make' | 'saddle' | 'store' | 'food' | 'infra' | 'light' | 'build' | 'defend' | 'tools'
type Page = { kind: 'top'; id: TopTab } | { kind: 'side'; id: SideTab } | { kind: 'deco' }

const TOP: { id: TopTab; icon: string; label: string; color: string }[] = [
  { id: 'party', icon: '🐾', label: 'สัตว์ในทีม', color: '#5f9a3a' },
  { id: 'storage', icon: '🎒', label: 'คลัง', color: '#9a6a32' },
  { id: 'tech', icon: '⚙️', label: 'เทคโนโลยี', color: '#3f7aa8' },
  { id: 'quests', icon: '📜', label: 'ภารกิจ', color: '#b0473a' },
  { id: 'guild', icon: '🛡️', label: 'กิลด์', color: '#7a4f9a' },
  { id: 'options', icon: '🔧', label: 'ออปชัน', color: '#6a6a60' },
  { id: 'calendar', icon: '📅', label: 'ปฏิทิน', color: '#c0762e' },
]
const SIDE: { id: SideTab; icon: string; label: string; color: string }[] = [
  { id: 'make', icon: '🔨', label: 'สร้าง', color: '#c0762e' },
  { id: 'saddle', icon: '🐎', label: 'อาน', color: '#9a5a2a' },
  { id: 'store', icon: '📦', label: 'จัดเก็บ', color: '#8a5a2a' },
  { id: 'food', icon: '🍲', label: 'อาหาร', color: '#c9573a' },
  { id: 'infra', icon: '🧱', label: 'โครงสร้างพื้นฐาน', color: '#7a6a5a' },
  { id: 'light', icon: '🏮', label: 'ส่องสว่าง', color: '#d8a52a' },
  { id: 'build', icon: '🌱', label: 'ปลูกสร้าง', color: '#4f9a4a' },
  { id: 'defend', icon: '🛡️', label: 'ป้องกัน', color: '#4a6a9a' },
  { id: 'tools', icon: '🧰', label: 'เครื่องมืออื่น ๆ', color: '#5a5a7a' },
]

/** รายการในหมวดสร้าง: สิ่งปลูกสร้าง (วางในบ้าน) · สูตรคราฟ · ของที่กำลังจะมา */
type Entry =
  | { t: 'structure'; id: StructureId }
  | { t: 'recipe'; r: Recipe }
  | { t: 'soon'; icon: string; name: string; note: string }
const rec = (id: string) => ({ t: 'recipe' as const, r: RECIPES.find((r) => r.id === id)! })
const ENTRIES: Record<SideTab, Entry[]> = {
  // สร้าง = ของชิ้นเล็กทั่วไป (โต๊ะ เตา กล่อง เฟอร์นิเจอร์) · ปลูกสร้าง = สิ่งก่อสร้างใหญ่ (บ้าน คอกสัตว์ โรงเก็บของ รั้ว) — ผู้สร้าง 19 พ.ย.
  make: [{ t: 'structure', id: 'workbench' }, { t: 'structure', id: 'chest' }, rec('plank'), { t: 'soon', icon: '🔥', name: 'เตาถ่าน', note: 'เผาถ่านไว้หุงข้าว (เร็ว ๆ นี้)' }, { t: 'soon', icon: '🪑', name: 'แคร่ไม้ไผ่', note: 'นั่งเล่นหน้าบ้าน (เร็ว ๆ นี้)' }, { t: 'soon', icon: '🗄️', name: 'ตู้กับข้าว', note: 'เฟอร์นิเจอร์ในครัว (เร็ว ๆ นี้)' }],
  saddle: [],
  store: [rec('bag1'), rec('bag2'), rec('bag3')],
  food: [rec('feed'), { t: 'soon', icon: '🍚', name: 'หม้อนึ่งข้าวเหนียว', note: 'ทำอาหารเองที่บ้าน (เร็ว ๆ นี้)' }, { t: 'soon', icon: '🏺', name: 'ไหปลาร้า', note: 'หมักปลาเก็บไว้กิน (เร็ว ๆ นี้)' }],
  infra: [{ t: 'soon', icon: '🌉', name: 'สะพานไม้', note: 'ข้ามลำน้ำ (เร็ว ๆ นี้)' }, { t: 'soon', icon: '🪣', name: 'โอ่งเก็บน้ำ', note: 'รองน้ำฝน (เร็ว ๆ นี้)' }],
  light: [{ t: 'soon', icon: '🏮', name: 'โคมไม้ไผ่', note: 'แขวนหน้าบ้าน สว่างตอนกลางคืน (เร็ว ๆ นี้)' }, { t: 'soon', icon: '🕯️', name: 'ตะเกียงน้ำมัน', note: 'ถือเดินตอนกลางคืน (เร็ว ๆ นี้)' }],
  build: [{ t: 'structure', id: 'pen' }, { t: 'structure', id: 'shed' }, { t: 'structure', id: 'greenhouse' }, { t: 'structure', id: 'fence' }, { t: 'soon', icon: '⛺', name: 'เถียงนา', note: 'เพิงพักกลางทุ่ง (เร็ว ๆ นี้)' }, { t: 'soon', icon: '🏠', name: 'บ้านหลังใหม่', note: 'ปลูกบ้านในที่ดินของตัวเอง (เร็ว ๆ นี้)' }],
  defend: [{ t: 'structure', id: 'scarecrow' }, { t: 'soon', icon: '🪤', name: 'กับดักหนู', note: 'กันหนูกินข้าวในยุ้ง (เร็ว ๆ นี้)' }],
  tools: ['axe', 'hammer', 'machete', 'saw', 'rod', 'net', 'trap_cage', 'bubble_helmet'].map(rec),
}

export const useBook = create<{ open: boolean; page: Page }>(() => ({ open: false, page: { kind: 'top', id: 'party' } }))
export const openBook = (page?: Page) => useBook.setState({ open: true, ...(page ? { page } : {}) })

export function BookButton() {
  return (
    <button type="button" className="btn small ghost hud-ic" onClick={() => openBook()} title="หนังสือคู่มือ (J)" aria-label="หนังสือคู่มือ">
      <svg viewBox="0 0 32 24" width="24" height="18" aria-hidden style={{ display: 'block' }}>
        <path d="M16 5C12 2 6 2 2 3v17c4-1 10-1 14 2 4-3 10-3 14-2V3c-4-1-10-1-14 2z" fill="#7a5230" />
        <path d="M16 6c-3.5-2.4-8-2.6-12-1.8v14c4-.6 8.5-.2 12 2z" fill="#f6ecd4" />
        <path d="M16 6c3.5-2.4 8-2.6 12-1.8v14c-4-.6-8.5-.2-12 2z" fill="#ead9b4" />
        <path d="M7 8h6M7 11h6M7 14h5M19 8h6M19 11h6M19 14h5" stroke="#b09870" strokeWidth="1" />
        <path d="M22 3v8l1.5-1.4L25 11V3" fill="#b0473a" />
      </svg>
    </button>
  )
}

export function GameBook() {
  const open = useBook((s) => s.open)
  const page = useBook((s) => s.page)
  useGame((s) => s.save?.book)
  const [closing, setClosing] = useState(false)
  const close = () => {
    setClosing(true)
    window.setTimeout(() => {
      setClosing(false)
      useBook.setState({ open: false })
    }, 380)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.repeat) return
      if (e.code === 'KeyJ') {
        if (useBook.getState().open) close()
        else openBook()
      } else if (e.code === 'Escape' && useBook.getState().open) {
        e.stopPropagation()
        close()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  if (!open) return null
  const st = bookStyle()
  const theme = BOOK_THEMES[st.theme]
  const go = (p: Page) => useBook.setState({ page: p })
  const color = page.kind === 'top' ? TOP.find((t) => t.id === page.id)!.color : page.kind === 'side' ? SIDE.find((t) => t.id === page.id)!.color : '#c08a3a'
  const top = st.topOrder.map((id) => TOP.find((t) => t.id === id)!).filter(Boolean)
  const side = st.sideOrder.map((id) => SIDE.find((t) => t.id === id)!).filter(Boolean)
  const vars = { ...theme.vars, ...(st.cover ? { '--cover': st.cover, '--cover2': `color-mix(in srgb, ${st.cover} 60%, #000)` } : {}), '--tab': color } as React.CSSProperties
  const cls = ['book', `top-${st.topPos}`, `side-${st.sidePos}`, st.density, `pat-${st.pattern}`, `theme-${st.theme}`].join(' ')
  return createPortal(
    <div className={`book-backdrop${closing ? ' closing' : ''}`} onClick={close}>
      <div className={cls} style={vars} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={st.title}>
        <div className="book-cover" aria-hidden />
        <div className="book-title">{st.title}</div>
        <nav className="book-top" role="tablist">
          {top.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={page.kind === 'top' && page.id === t.id}
              className="book-ttab"
              style={{ '--c': t.color } as React.CSSProperties}
              onClick={() => go({ kind: 'top', id: t.id })}
              title={t.label}
            >
              <span>{t.icon}</span>
              <b>{t.label}</b>
            </button>
          ))}
          <button type="button" className={`book-ttab deco${page.kind === 'deco' ? ' on' : ''}`} style={{ '--c': '#c08a3a' } as React.CSSProperties} onClick={() => go({ kind: 'deco' })} title="ตกแต่งหนังสือ">
            <span>🎨</span>
            <b>ตกแต่งหนังสือ</b>
          </button>
        </nav>
        <nav className="book-side" role="tablist" aria-orientation="vertical">
          {side.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={page.kind === 'side' && page.id === t.id}
              className="book-stab"
              style={{ '--c': t.color } as React.CSSProperties}
              onClick={() => go({ kind: 'side', id: t.id })}
              title={t.label}
            >
              <span>{t.icon}</span>
              <b>{t.label}</b>
            </button>
          ))}
        </nav>
        <button type="button" className="book-close" onClick={close} aria-label="ปิดหนังสือ" title="ปิดหนังสือ (J / Esc)">
          ✕
        </button>
        {st.ribbon && <span className="book-ribbon" aria-hidden />}
        {st.charm !== 'none' && (
          <span className="book-charm" aria-hidden>
            <i />
            {CHARMS[st.charm].icon}
          </span>
        )}
        <div className={`book-pages${st.corners ? ' corners' : ''}`} key={page.kind + ('id' in page ? page.id : '')}>
          {page.kind === 'deco' ? <DecoPages /> : page.kind === 'side' ? <MakePages cat={page.id} close={close} /> : <TopPages id={page.id} close={close} />}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ───────── ตกแต่งหนังสือ: ซ้าย = รูปลักษณ์ · ขวา = โครงสร้าง (แยกกัน) ───────── */
function DecoPages() {
  useGame((s) => s.save?.book)
  const st = bookStyle()
  const Order = ({ which, items }: { which: 'topOrder' | 'sideOrder'; items: { id: string; icon: string; label: string }[] }) => (
    <ol className="deco-order">
      {st[which].map((id, i) => {
        const t = items.find((x) => x.id === id)!
        return (
          <li key={id}>
            <span>
              {t.icon} {t.label}
            </span>
            <button type="button" disabled={i === 0} onClick={() => moveInOrder(which, id, -1)} aria-label="เลื่อนขึ้น">
              ▲
            </button>
            <button type="button" disabled={i === st[which].length - 1} onClick={() => moveInOrder(which, id, 1)} aria-label="เลื่อนลง">
              ▼
            </button>
          </li>
        )
      })}
    </ol>
  )
  return (
    <Spread
      left={
        <div className="book-scroll">
          <h2 className="book-h">🎨 รูปลักษณ์</h2>
          <label className="deco-label">ชื่อหนังสือ</label>
          <input className="deco-input" maxLength={28} value={st.title} onChange={(e) => setBook({ title: e.target.value })} />
          <label className="deco-label">ธีม</label>
          <div className="deco-themes">
            {(Object.keys(BOOK_THEMES) as BookTheme[]).map((k) => (
              <button key={k} type="button" className={`deco-theme t-${k}${st.theme === k ? ' on' : ''}`} style={BOOK_THEMES[k].vars as React.CSSProperties} onClick={() => setBook({ theme: k })}>
                <i />
                <b>{BOOK_THEMES[k].label}</b>
                <small>{BOOK_THEMES[k].note}</small>
              </button>
            ))}
          </div>
          <label className="deco-label">สีปก</label>
          <div className="deco-swatches">
            {COVER_COLORS.map((c) => (
              <button key={c || 'auto'} type="button" className={`deco-sw${st.cover === c ? ' on' : ''}`} style={{ background: c || 'conic-gradient(#7a5230 0 25%, #7b5aa6 0 50%, #1d2550 0 75%, #e9a2bf 0)' }} title={c ? c : 'ตามธีม'} onClick={() => setBook({ cover: c })} />
            ))}
          </div>
          <label className="deco-label">ลายปก</label>
          <div className="deco-chips">
            {(Object.keys(PATTERNS) as CoverPattern[]).map((p) => (
              <button key={p} type="button" className={st.pattern === p ? 'on' : ''} onClick={() => setBook({ pattern: p })}>
                {PATTERNS[p]}
              </button>
            ))}
          </div>
          <label className="deco-label">ของตกแต่ง</label>
          <div className="deco-chips">
            <button type="button" className={st.ribbon ? 'on' : ''} onClick={() => setBook({ ribbon: !st.ribbon })}>
              🎀 ริบบิ้นคั่นหน้า
            </button>
            <button type="button" className={st.corners ? 'on' : ''} onClick={() => setBook({ corners: !st.corners })}>
              ❖ ลายมุมกระดาษ
            </button>
          </div>
          <div className="deco-chips">
            {(Object.keys(CHARMS) as BookCharm[]).map((c) => (
              <button key={c} type="button" className={st.charm === c ? 'on' : ''} onClick={() => setBook({ charm: c })}>
                {CHARMS[c].icon} {CHARMS[c].label}
              </button>
            ))}
          </div>
          <button type="button" className="btn small ghost deco-reset" onClick={() => resetBook('look')}>
            ↺ คืนค่ารูปลักษณ์เริ่มต้น
          </button>
        </div>
      }
      right={
        <div className="book-scroll">
          <h2 className="book-h">🧭 โครงสร้าง</h2>
          <label className="deco-label">แท็บระบบหลัก</label>
          <div className="deco-chips">
            <button type="button" className={st.topPos === 'top' ? 'on' : ''} onClick={() => setBook({ topPos: 'top' })}>
              ด้านบน
            </button>
            <button type="button" className={st.topPos === 'bottom' ? 'on' : ''} onClick={() => setBook({ topPos: 'bottom' })}>
              ด้านล่าง
            </button>
          </div>
          <label className="deco-label">แท็บข้าง (สร้าง จัดเก็บ …)</label>
          <div className="deco-chips">
            <button type="button" className={st.sidePos === 'left' ? 'on' : ''} onClick={() => setBook({ sidePos: 'left' })}>
              ด้านซ้าย
            </button>
            <button type="button" className={st.sidePos === 'right' ? 'on' : ''} onClick={() => setBook({ sidePos: 'right' })}>
              ด้านขวา
            </button>
          </div>
          <label className="deco-label">หน้ารายการ (เมนูให้กดเลือก)</label>
          <div className="deco-chips">
            <button type="button" className={st.listSide === 'right' ? 'on' : ''} onClick={() => setBook({ listSide: 'right' })}>
              หน้าขวา (ถนัดขวา)
            </button>
            <button type="button" className={st.listSide === 'left' ? 'on' : ''} onClick={() => setBook({ listSide: 'left' })}>
              หน้าซ้าย (ถนัดซ้าย)
            </button>
          </div>
          <label className="deco-label">รูปแบบหน้า</label>
          <div className="deco-chips">
            <button type="button" className={st.density === 'simple' ? 'on' : ''} onClick={() => setBook({ density: 'simple' })}>
              เรียบง่าย (แท็บแค่ไอคอน)
            </button>
            <button type="button" className={st.density === 'detailed' ? 'on' : ''} onClick={() => setBook({ density: 'detailed' })}>
              ละเอียด (มีชื่อแท็บ)
            </button>
          </div>
          <div className="deco-cols">
            <div>
              <label className="deco-label">ลำดับแท็บระบบหลัก</label>
              <Order which="topOrder" items={TOP} />
            </div>
            <div>
              <label className="deco-label">ลำดับแท็บข้าง</label>
              <Order which="sideOrder" items={SIDE} />
            </div>
          </div>
          <div className="book-row">
            <button type="button" className="btn small ghost" onClick={() => resetBook('layout')}>
              ↺ คืนค่าโครงสร้าง
            </button>
            <button type="button" className="btn small ghost" onClick={() => resetBook('all')}>
              ↺ คืนค่าเริ่มต้นทั้งหมด
            </button>
          </div>
          <p className="book-hint">บันทึกเองอัตโนมัติในเซฟของคุณ · เปลี่ยนหน้าตาหนังสือไม่ทำให้ไอเทมหรือความคืบหน้าหายไป</p>
        </div>
      }
    />
  )
}

/** สองหน้า: list = หน้ารายการ/เมนู · detail = รายละเอียด — ถนัดขวา (ค่าเริ่มต้น) ให้รายการอยู่หน้าขวา */
function Spread({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  useGame((s) => s.save?.book?.listSide)
  const swap = bookStyle().listSide === 'right'
  return (
    <>
      <section className="book-page left">{swap ? right : left}</section>
      <section className="book-page right">{swap ? left : right}</section>
    </>
  )
}

/* ───────── หมวดสร้าง/จัดการสิ่งของ ───────── */
function MakePages({ cat, close }: { cat: SideTab; close: () => void }) {
  if (cat === 'saddle') return <SaddlePages />
  return <MakeList cat={cat} close={close} />
}
function MakeList({ cat, close }: { cat: SideTab; close: () => void }) {
  const save = useGame((s) => s.save)!
  const list = ENTRIES[cat]
  const [sel, setSel] = useState(0)
  const meta = SIDE.find((s) => s.id === cat)!
  const e = list[Math.min(sel, list.length - 1)]
  const stored = save.storedStructures ?? {}
  return (
    <Spread
      left={
        <>
          <h2 className="book-h">
            {meta.icon} {meta.label}
          </h2>
          <div className="book-grid">
            {list.map((it, i) => {
              const icon = it.t === 'structure' ? STRUCTURES[it.id].icon : it.t === 'recipe' ? it.r.icon : it.icon
              const name = it.t === 'structure' ? STRUCTURES[it.id].name : it.t === 'recipe' ? it.r.name : it.name
              const ok = it.t === 'structure' ? (stored[it.id] ?? 0) > 0 || canAfford(STRUCTURES[it.id].cost) : it.t === 'recipe' ? canAfford(it.r.needs) && (!it.r.tool || hasTool(it.r.tool)) : false
              return (
                <button key={i} type="button" className={`book-cell${i === sel ? ' sel' : ''}${it.t === 'soon' ? ' soon' : ok ? ' ok' : ''}`} onClick={() => setSel(i)}>
                  <span className="book-cicon">
                    <ItemIcon icon={icon} />
                  </span>
                  <small>{name}</small>
                </button>
              )
            })}
          </div>
          <p className="book-hint">จุดสีเขียว = มีวัตถุดิบพอแล้ว · สีจาง = กำลังจะมา</p>
        </>
      }
      right={<EntryDetail e={e} close={close} />}
    />
  )
}

function Needs({ cost, tool }: { cost: Partial<Record<ItemId, number>>; tool?: ItemId }) {
  const inv = useGame((s) => s.save!.inventory)
  return (
    <ul className="book-needs">
      {Object.entries(cost).map(([id, q]) => {
        const have = inv[id as ItemId] ?? 0
        return (
          <li key={id} className={have >= (q ?? 0) ? 'ok' : 'miss'}>
            <ItemIcon icon={ITEMS[id as ItemId].icon} /> {ITEMS[id as ItemId].name} <b>{have}/{q}</b>
          </li>
        )
      })}
      {tool && (
        <li className={hasTool(tool) ? 'ok' : 'miss'}>
          ต้องมี <ItemIcon icon={ITEMS[tool].icon} /> {ITEMS[tool].name} (ไม่ถูกใช้หมด)
        </li>
      )}
    </ul>
  )
}

function EntryDetail({ e, close }: { e: Entry; close: () => void }) {
  const save = useGame((s) => s.save)!
  if (e.t === 'soon')
    return (
      <div className="book-detail soon">
        <div className="book-big">{e.icon}</div>
        <h3>{e.name}</h3>
        <p>{e.note}</p>
        <span className="book-tag">🔒 กำลังจะมา</span>
      </div>
    )
  if (e.t === 'structure') {
    const d = STRUCTURES[e.id]
    const inStore = save.storedStructures?.[e.id] ?? 0
    const ok = inStore > 0 || canAfford(d.cost)
    return (
      <div className="book-detail">
        <div className="book-big">
          <ItemIcon icon={d.icon} />
        </div>
        <h3>{d.name}</h3>
        <p>{d.note}</p>
        <p className="book-sub">ขนาด {d.size[0]} × {d.size[1]} ม. · วางได้ในบ้านของคุณ</p>
        {inStore > 0 ? <p className="book-tag ok">📦 มีในคลัง ×{inStore} (วางฟรี)</p> : <Needs cost={d.cost} />}
        <button
          type="button"
          className="btn"
          disabled={!ok}
          onClick={() => {
            close()
            startPlacing(d.id)
          }}
        >
          🔨 สร้างและวาง
        </button>
      </div>
    )
  }
  const r = e.r
  const bagDone = 'bagLevel' in r.gives && save.bagLevel >= r.gives.bagLevel
  const ok = canAfford(r.needs) && (!r.tool || hasTool(r.tool)) && !bagDone
  return (
    <div className="book-detail">
      <div className="book-big">
        <ItemIcon icon={r.icon} />
      </div>
      <h3>{r.name}</h3>
      <p>{'item' in r.gives ? ITEMS[r.gives.item].note : `กระเป๋า ${BAG_LEVELS[r.gives.bagLevel].slots} ช่อง`}</p>
      <Needs cost={r.needs} tool={r.tool} />
      <button type="button" className="btn" disabled={!ok} onClick={() => craft(r)}>
        {bagDone ? '✓ มีแล้ว' : '🔨 ประดิษฐ์'}
      </button>
    </div>
  )
}

/* ───────── ระบบหลัก ───────── */
function TopPages({ id, close }: { id: TopTab; close: () => void }) {
  if (id === 'party') return <PartyPages close={close} />
  if (id === 'calendar') return <CalendarPages Spread={Spread} />
  if (id === 'storage')
    return (
      <Spread
        left={
          <div className="book-scroll">
            <BagTab onCraft={() => useBook.setState({ page: { kind: 'side', id: 'tools' } })} />
          </div>
        }
        right={<StoredPage />}
      />
    )
  if (id === 'tech') return <TechPages />
  if (id === 'quests') return <QuestPages />
  if (id === 'guild')
    return (
      <Spread
        left={
          <div className="book-detail soon">
            <div className="book-big">🛡️</div>
            <h3>กิลด์</h3>
            <p>รวมกลุ่มกับเพื่อน ทำภารกิจใหญ่ร่วมกัน เช่น สร้างสะพาน จัดงานบุญประจำปี แบ่งรางวัลกันในกลุ่ม</p>
            <span className="book-tag">🔒 เปิดพร้อมระบบออนไลน์</span>
          </div>
        }
        right={
          <div className="book-detail">
            <div className="book-big">👥</div>
            <h3>เพื่อนของฉัน</h3>
            <p>ระหว่างนี้ เพิ่มเพื่อนและเชิญเพื่อนเข้าโลกได้จากหน้าเพื่อน</p>
            <button
              type="button"
              className="btn"
              onClick={() => {
                close()
                openFriends()
              }}
            >
              👥 เปิดหน้าเพื่อน
            </button>
          </div>
        }
      />
    )
  return (
    <Spread
      left={
        <div className="book-scroll">
          <SettingsTab />
        </div>
      }
      right={
        <div className="book-detail">
          <div className="book-big">⌨️</div>
          <h3>ปุ่มลัด</h3>
          <ul className="book-keys">
            <li><kbd>J</kbd> เปิด/ปิดหนังสือ</li>
            <li><kbd>Esc</kbd> เมนูพักเกม · ปิดหนังสือ</li>
            <li><kbd>B</kbd> โหมดสร้าง</li>
            <li><kbd>1–9</kbd> แถบไอเทม</li>
            <li><kbd>Z</kbd>/<kbd>X</kbd> เปลี่ยนสัตว์ตัวหลัก</li>
            <li><kbd>Q</kbd> วงล้ออาวุธ · <kbd>R</kbd> วงล้อไอเทม</li>
            <li><kbd>G</kbd> ผิวปากเรียกสัตว์ · <kbd>F</kbd> ขี่สัตว์</li>
          </ul>
        </div>
      }
    />
  )
}

function PartyPages({ close }: { close: () => void }) {
  useGame((s) => s.save?.activePets)
  useGame((s) => s.save?.party)
  const party = partySlots()
  const active = activeKeys()
  const [sel, setSel] = useState<string | null>(active[0] ?? party.find(Boolean) ?? null)
  const cur = sel ? petOf(sel) : undefined
  return (
    <Spread
      left={
        <>
          <h2 className="book-h">
            🐾 สัตว์ในทีม <small>เดินตาม {active.length}/{MAX_ACTIVE}</small>
          </h2>
          <div className="book-grid three">
            {party.map((k, i) => {
              const o = k ? petOf(k) : undefined
              return (
                <button key={i} type="button" className={`book-cell pet${k && k === sel ? ' sel' : ''}${k && active.includes(k) ? ' ok' : ''}${o ? '' : ' soon'}`} onClick={() => k && setSel(k)}>
                  {o ? <PetPortraitImg pet={o.pet} size={56} /> : <span className="book-cicon">＋</span>}
                  <small>{o ? o.pet.name : `ช่อง ${i + 1}`}</small>
                </button>
              )
            })}
          </div>
          <p className="book-hint">ทีม {party.filter(Boolean).length}/{PARTY_SIZE} · จุดเขียว = กำลังเดินตาม</p>
        </>
      }
      right={
        cur ? (
          <div className="book-detail">
            <div className="book-portrait">
              <PetPortraitImg pet={cur.pet} size={120} />
            </div>
            <PetNameEdit k={cur.key} pet={cur.pet} />
            <p>
              {getSpecies(cur.pet.species).label} · นิสัย{traitText(cur.key, cur.pet)}
            </p>
            <MiniCare k={cur.key} />
            <div className="book-row">
              <button type="button" className="btn small" onClick={() => toggleActive(cur.key)}>
                {active.includes(cur.key) ? '🏠 เก็บเข้า' : '🐾 เรียกออกมา'}
              </button>
              <button
                type="button"
                className="btn small ghost"
                onClick={() => {
                  close()
                  openPetCard(cur.key)
                }}
              >
                📋 การ์ดสัตว์
              </button>
              <button
                type="button"
                className="btn small ghost"
                onClick={() => {
                  close()
                  openParty(cur.key)
                }}
              >
                จัดทีม
              </button>
            </div>
          </div>
        ) : (
          <div className="book-detail soon">
            <div className="book-big">🐾</div>
            <p>ยังไม่มีสัตว์ในทีม — จับสัตว์ด้วยคฑา หรือเลี้ยงสัตว์คู่ใจ</p>
          </div>
        )
      }
    />
  )
}

function MiniCare({ k }: { k: string }) {
  const c = careOf(k)
  const rows: [string, number, string][] = [
    ['💚 ความสุข', c.happy, '#5f9a3a'],
    ['🥣 ความอิ่ม', c.full, '#3f7aa8'],
    ['☀️ พลังงาน', c.energy, '#e08a1e'],
  ]
  return (
    <div className="book-care">
      {rows.map(([l, v, col]) => (
        <div key={l}>
          <span>{l}</span>
          <i>
            <b style={{ width: `${v}%`, background: col }} />
          </i>
          <small>{Math.round(v)}</small>
        </div>
      ))}
    </div>
  )
}

function StoredPage() {
  const save = useGame((s) => s.save)!
  const st = Object.entries(save.storedStructures ?? {}).filter(([, n]) => (n ?? 0) > 0)
  return (
    <div className="book-detail top">
      <h3>📦 สิ่งปลูกสร้างที่เก็บไว้</h3>
      {st.length === 0 && <p className="book-hint">ยังไม่มี — กดค้างที่สิ่งปลูกสร้างแล้วเลือก "เก็บเข้าคลัง"</p>}
      <div className="book-grid">
        {st.map(([id, n]) => (
          <button
            key={id}
            type="button"
            className="book-cell ok"
            title="วางใหม่"
            onClick={() => {
              useBook.setState({ open: false })
              startPlacing(id as StructureId)
            }}
          >
            <span className="book-cicon">
              <ItemIcon icon={STRUCTURES[id as StructureId].icon} />
            </span>
            <small>
              {STRUCTURES[id as StructureId].name} ×{n}
            </small>
          </button>
        ))}
      </div>
      <p className="book-sub">💰 เงินติดตัว {save.coins.toLocaleString('th-TH')} บาท</p>
    </div>
  )
}

/** เทคโนโลยี: ลำดับขั้นการพัฒนา (ปลดล็อกตามของที่มี) */
const TECH: { icon: string; name: string; note: string; done: () => boolean }[] = [
  { icon: '🪵', name: 'เก็บของจากธรรมชาติ', note: 'กิ่งไม้ ก้อนหิน เถาวัลย์', done: () => true },
  { icon: '🪓', name: 'เครื่องมือหิน', note: 'ขวาน · ค้อน · มีดพร้า', done: () => hasTool('axe') || hasTool('hammer') || hasTool('machete') },
  { icon: '🪚', name: 'งานไม้', note: 'เลื่อย → ไม้กระดาน', done: () => hasTool('saw') },
  { icon: '🛠️', name: 'โต๊ะประดิษฐ์', note: 'ตั้งโต๊ะไว้ที่บ้าน', done: () => (useGame.getState().save?.structures ?? []).some((s) => s.id === 'workbench') },
  { icon: '🎒', name: 'กระเป๋าใหญ่', note: 'อัปเกรดกระเป๋าระดับ 2 ขึ้นไป', done: () => (useGame.getState().save?.bagLevel ?? 0) >= 2 },
  { icon: '🥅', name: 'อุปกรณ์จับสัตว์', note: 'สวิง (เพชรเหลือง) · กรงดัก (เพชรแดง)', done: () => hasTool('net') || hasTool('trap_cage') },
  { icon: '🏮', name: 'แสงสว่างยามค่ำ', note: 'โคม ตะเกียง (เร็ว ๆ นี้)', done: () => false },
]
function TechPages() {
  useGame((s) => s.save?.inventory)
  const doneN = TECH.filter((t) => t.done()).length
  const half = Math.ceil(TECH.length / 2)
  const col = (list: typeof TECH, off: number) => (
    <ol className="book-tech" start={off + 1}>
      {list.map((t) => {
        const d = t.done()
        return (
          <li key={t.name} className={d ? 'done' : ''}>
            <span className="book-cicon">
              <ItemIcon icon={t.icon} />
            </span>
            <div>
              <b>{t.name}</b>
              <small>{t.note}</small>
            </div>
            <em>{d ? '✓' : '🔒'}</em>
          </li>
        )
      })}
    </ol>
  )
  return (
    <Spread
      left={
        <>
          <h2 className="book-h">
            ⚙️ เทคโนโลยี <small>ปลดล็อก {doneN}/{TECH.length}</small>
          </h2>
          {col(TECH.slice(0, half), 0)}
        </>
      }
      right={<div className="book-pad">{col(TECH.slice(half), half)}</div>}
    />
  )
}

function QuestPages() {
  const save = useGame((s) => s.save)!
  const qs = save.quests
  const line = (q: (typeof qs)[number]) => {
    const who = NPC_INFO[q.npcId]?.name ?? 'ชาวบ้าน'
    const what = q.kind === 'bring' && q.item ? `นำ${ITEMS[q.item].name} ${q.qty} ชิ้น` : q.species ? `จับ${getSpecies(q.species).label} ${q.qty} ตัว` : `${q.qty} อย่าง`
    const have = q.kind === 'bring' && q.item ? Math.min(q.qty, save.inventory[q.item] ?? 0) : null
    return { who, what, have }
  }
  return (
    <Spread
      left={
        <>
          <h2 className="book-h">📜 ภารกิจที่รับไว้</h2>
          {qs.length === 0 && <p className="book-hint">ยังไม่มีภารกิจ — คุยกับชาวบ้าน หรือดูบอร์ดประกาศในหมู่บ้าน</p>}
          <ul className="book-quests">
            {qs.map((q, i) => {
              const l = line(q)
              return (
                <li key={i}>
                  <b>{q.title ?? l.what}</b>
                  <small>
                    จาก {l.who}
                    {q.title ? ` · ${l.what}` : ''}
                    {l.have !== null ? ` · มีแล้ว ${l.have}/${q.qty}` : ''}
                    {q.until ? ` · ส่งภายในวันที่ ${q.until}` : ''}
                    {q.coins ? ` · ค่าจ้าง ${q.coins} บาท` : ''}
                  </small>
                </li>
              )
            })}
          </ul>
        </>
      }
      right={
        <div className="book-detail">
          <div className="book-big">🗺️</div>
          <h3>วันที่ {save.day} ในหมู่บ้าน</h3>
          <p>สถานที่ที่ไปมาแล้ว {save.discoveredPlaceIds.length} แห่ง · สัตว์ในสมุด {save.collection.length} ตัว</p>
          <p className="book-sub">ส่งของ: เดินไปหาคนที่ให้ภารกิจแล้วกด E</p>
        </div>
      }
    />
  )
}

/** ชื่อสัตว์ + สัญลักษณ์เพศ · กด ✏️ เพื่อเปลี่ยนชื่อได้ทันที */
function PetNameEdit({ k, pet }: { k: string; pet: { name: string } & Parameters<typeof sexOf>[1] }) {
  const [edit, setEdit] = useState<string | null>(null)
  useEffect(() => setEdit(null), [k])
  const male = sexOf(k, pet) === 'ผู้'
  if (edit === null)
    return (
      <h3 className="book-petname">
        {pet.name} <span style={{ color: male ? '#2f5fa8' : '#c8487a', fontSize: '0.8em' }}>{male ? '♂' : '♀'}</span>
        <button type="button" className="btn small ghost" style={{ marginLeft: 8, padding: '2px 8px' }} onClick={() => setEdit(pet.name)} title="เปลี่ยนชื่อ" aria-label="เปลี่ยนชื่อ">
          ✏️ เปลี่ยนชื่อ
        </button>
      </h3>
    )
  return (
    <form
      className="book-row"
      onSubmit={(e) => {
        e.preventDefault()
        if (!renamePet(k, edit)) setEdit(null)
      }}
    >
      <input autoFocus maxLength={20} value={edit} onChange={(e) => setEdit(e.target.value)} onKeyDown={(e) => e.stopPropagation()} style={{ fontSize: 18, padding: '4px 10px', borderRadius: 10, border: '2px solid #c8b890', width: 180 }} />
      <button type="submit" className="btn small">ตกลง</button>
      <button type="button" className="btn small ghost" onClick={() => setEdit(null)}>ยกเลิก</button>
    </form>
  )
}

/* ───────── อานสัตว์: ช่องแดง = ยังไม่ได้สร้าง · เขียว = พร้อมใช้งาน ───────── */
function SaddlePages() {
  const save = useGame((s) => s.save)!
  const [filter, setFilter] = useState<'all' | 'land' | 'water'>('all')
  const [sel, setSel] = useState(SADDLES[0].id)
  const owned = save.saddles ?? []
  const list = SADDLES.filter((x) => filter === 'all' || x.group === filter)
  const cur = SADDLES.find((x) => x.id === sel) ?? SADDLES[0]
  const have = owned.includes(cur.id)
  return (
    <Spread
      left={
        <>
          <h2 className="book-h">🐎 เลือกอานสัตว์</h2>
          <div style={{ display: 'flex', gap: 6, margin: '4px 0 10px' }}>
            {(
              [
                ['all', '🐎 ทั้งหมด'],
                ['land', '🐾 สัตว์บก'],
                ['water', '🌊 สัตว์น้ำ'],
              ] as const
            ).map(([k, t]) => (
              <button key={k} type="button" className={'chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)} style={{ fontWeight: filter === k ? 800 : 500 }}>
                {t}
              </button>
            ))}
          </div>
          <div className="book-grid">
            {list.map((x) => {
              const ok = owned.includes(x.id)
              return (
                <button
                  key={x.id}
                  type="button"
                  className={'book-cell' + (x.id === sel ? ' sel' : '')}
                  onClick={() => setSel(x.id)}
                  style={{ borderWidth: 3, borderColor: ok ? '#4aa83a' : '#d8483a', background: ok ? 'rgba(120,200,100,0.16)' : 'rgba(220,80,60,0.10)' }}
                >
                  <span className="book-cicon" style={{ fontSize: 30 }}>{x.icon}</span>
                  <small style={{ fontWeight: 700 }}>{x.name}</small>
                  <small style={{ fontSize: 10, color: ok ? '#2f7a24' : '#a8321e' }}>{ok ? '✔ พร้อมใช้งาน' : 'ยังไม่ได้สร้าง'}</small>
                </button>
              )
            })}
          </div>
          <p className="book-note">
            🟥 ยังไม่ได้สร้าง · 🟩 พร้อมใช้งาน · อานแต่ละชนิดใช้กับสัตว์ชนิดนั้นเท่านั้น · ประดิษฐ์ได้ทุกที่ ไม่ต้องกลับบ้าน
          </p>
        </>
      }
      right={
        <div className="book-detail">
          <div style={{ fontSize: 64 }}>{cur.icon}</div>
          <h3>{cur.name}</h3>
          <p>
            <span style={{ padding: '2px 10px', borderRadius: 999, color: '#fff', background: RARITY_INFO[cur.rarity].color, fontSize: 12, fontWeight: 800 }}>{RARITY_INFO[cur.rarity].label}</span>{' '}
            ใช้ได้กับ <b>{cur.speciesLabel}</b> เท่านั้น{cur.future ? ' (สัตว์ชนิดนี้จะมาเร็ว ๆ นี้)' : ''}
          </p>
          <p>{cur.note}</p>
          <p>⭐ {cur.stat}</p>
          {have ? (
            <p style={{ color: '#2f7a24', fontWeight: 800 }}>✔ สร้างแล้ว — {cur.future ? 'เก็บไว้ในรายการอาน รอสัตว์ชนิดนี้' : cur.group === 'water' ? 'ไปที่สระน้ำในถ้ำ เดินเข้าใกล้' + cur.speciesLabel + ' แล้วกด E ขี่' : 'เรียก' + cur.speciesLabel + 'ออกมาเดินตาม แล้วกด F ขี่'}</p>
          ) : (
            <>
              <p className="book-note">ต้องใช้: {costText(cur)}</p>
              <button type="button" className="btn" disabled={!canBuildSaddle(cur)} onClick={() => buildSaddle(cur.id)}>
                🛠️ สร้างอาน
              </button>
            </>
          )}
          <p className="book-note">💰 เงินของคุณ {save.coins.toLocaleString('th-TH')} บาท</p>
        </div>
      }
    />
  )
}
