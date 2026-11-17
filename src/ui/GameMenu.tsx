import { useEffect, useState } from 'react'
import { formatSavedAt, markCleanExit, useGame } from '../game/store'
import { AUTO_SAVE_CHOICES, useSettings } from '../game/settings'
import { SOUND_PERIODS } from '../game/content/soundscape'
import type { Appearance } from '../game/content/appearance'
import { PreviewStage } from '../scenes/PreviewStage'
import { Character } from '../scenes/models/Character'
import { AppearanceEditor } from './CreateCharacterScreen'
import { SaveSlots } from './SaveSlots'
import { KnowledgePanel } from './KnowledgePanel'
import { BAG_LEVELS, bagSlots, ITEMS, RECIPES, SHOP, toSlots, type ItemId } from '../game/content/items'
import { craft } from '../game/inventory'
import { ReportPanel } from './ReportPanel'
import { useUnreadReports } from '../game/feedback/reports'
import { ItemIcon } from './ItemIcon'

type Tab = 'character' | 'bag' | 'craft' | 'guide' | 'knowledge' | 'report' | 'save' | 'settings'
type Confirm = null | 'confirm-exit' | 'confirm-title' | 'exited'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'character', icon: '👕', label: 'ตัวละคร' },
  { id: 'bag', icon: '🎒', label: 'กระเป๋า' },
  { id: 'craft', icon: '🔨', label: 'คราฟของ' },
  { id: 'guide', icon: '📖', label: 'คู่มือ' },
  { id: 'knowledge', icon: '📜', label: 'เกร็ดความรู้' },
  { id: 'report', icon: '📮', label: 'แจ้งปัญหา' },
  { id: 'save', icon: '💾', label: 'บันทึก' },
  { id: 'settings', icon: '⚙️', label: 'ตั้งค่า' },
]

/** เมนูเกม (กด Esc): แท็บ ตัวละคร · กระเป๋า · คู่มือ · บันทึก · ตั้งค่า */
export function GameMenu({ onClose }: { onClose: () => void }) {
  const save = useGame((s) => s.save)!
  const exitToTitle = useGame((s) => s.exitToTitle)
  const lastSavedAt = useGame((s) => s.lastSavedAt)
  const [tab, setTab] = useState<Tab>('character')
  const unread = useUnreadReports()
  const [confirm, setConfirm] = useState<Confirm>(null)

  // ออกจากเกม / กลับหน้าหลัก: บันทึกก่อนเสมอ ถ้าไม่สำเร็จให้ยืนยัน
  const tryLeave = (target: 'exit' | 'title') => {
    const ok = useGame.getState().saveNow('exit')
    if (!ok) return setConfirm(target === 'exit' ? 'confirm-exit' : 'confirm-title')
    if (target === 'title') exitToTitle()
    else {
      markCleanExit()
      setConfirm('exited')
    }
  }

  if (confirm === 'exited') {
    return (
      <div className="menu-backdrop">
        <div className="menu">
          <h2>บันทึกเรียบร้อย</h2>
          <p style={{ margin: 0 }}>
            ความคืบหน้าของ {save.player.name} ถูกบันทึกแล้วเมื่อ {formatSavedAt(lastSavedAt)}
            <br />
            ปิดแท็บนี้ได้อย่างปลอดภัย กลับมาเมื่อไรก็เล่นต่อได้ทันที
          </p>
          <button className="btn" onClick={() => exitToTitle()}>
            ไปหน้าหลัก
          </button>
        </div>
      </div>
    )
  }
  if (confirm) {
    return (
      <div className="menu-backdrop">
        <div className="menu">
          <h2>บันทึกไม่สำเร็จ</h2>
          <p style={{ margin: 0 }}>
            บันทึกความคืบหน้าล่าสุดไม่สำเร็จ (พื้นที่เบราว์เซอร์อาจเต็มหรือถูกปิดกั้น)
            <br />
            ถ้าออกตอนนี้ จะกลับมาเล่นต่อจากจุดบันทึกล่าสุดที่สำเร็จ: <strong>{formatSavedAt(lastSavedAt)}</strong>
          </p>
          <button className="btn" onClick={() => tryLeave(confirm === 'confirm-exit' ? 'exit' : 'title')}>
            ลองบันทึกอีกครั้ง
          </button>
          <button className="btn ghost" onClick={() => exitToTitle(true)}>
            ออกโดยไม่บันทึก
          </button>
          <button className="btn ghost small" onClick={() => setConfirm(null)}>
            ยกเลิก
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="menu-backdrop" onClick={onClose}>
      <div className="gm" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="เมนูเกม">
        <nav className="gm-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className="gm-tab" onClick={() => setTab(t.id)}>
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
              {t.id === 'report' && unread > 0 && <span className="gm-badge">{unread}</span>}
            </button>
          ))}
          <span className="gm-spacer" />
          <button className="gm-tab ghost" onClick={() => tryLeave('title')}>
            🏠 หน้าหลัก
          </button>
          <button className="gm-tab ghost" onClick={() => tryLeave('exit')}>
            🚪 ออกจากเกม
          </button>
        </nav>

        <div className="gm-body">
          {tab === 'character' && <CharacterTab onDone={onClose} />}
          {tab === 'bag' && <BagTab onCraft={() => setTab('craft')} />}
          {tab === 'craft' && <CraftTab />}
          {tab === 'guide' && <GuideTab />}
          {tab === 'knowledge' && (
            <>
              <h3>เกร็ดความรู้ บ้านไพบูลย์</h3>
              <KnowledgePanel />
            </>
          )}
          {tab === 'report' && (
            <>
              <h3>แจ้งปัญหาเกม · คุยกับผู้พัฒนา</h3>
              <ReportPanel />
            </>
          )}
          {tab === 'save' && <SaveTab onLoaded={onClose} />}
          {tab === 'settings' && <SettingsTab />}
        </div>

        <div className="gm-foot">
          <button className="btn" onClick={onClose}>
            ▶ เล่นต่อ (Esc)
          </button>
        </div>
      </div>
    </div>
  )
}

/** เปลี่ยนการแต่งตัวได้ตลอดระหว่างเล่น */
function CharacterTab({ onDone }: { onDone: () => void }) {
  const save = useGame((s) => s.save)!
  const updateAppearance = useGame((s) => s.updateAppearance)
  const [look, setLook] = useState<Appearance>(save.player.appearance)
  const changed = JSON.stringify(look) !== JSON.stringify(save.player.appearance)
  return (
    <div className="gm-char">
      <div className="gm-char-stage">
        <PreviewStage camera={[0, 1.3, 4.6]} target={[0, 0.9, 0]} minDistance={1.6} maxDistance={7}>
          <Character appearance={look} />
        </PreviewStage>
      </div>
      <div className="gm-char-panel">
        <h3>แต่งตัว {save.player.name}</h3>
        <AppearanceEditor look={look} setLook={setLook} />
        <div className="gm-char-actions">
          <button className="btn ghost small" disabled={!changed} onClick={() => setLook(save.player.appearance)}>
            ยกเลิกที่เปลี่ยน
          </button>
          <button
            className="btn small"
            disabled={!changed}
            onClick={() => {
              updateAppearance(look)
              onDone()
            }}
          >
            ✓ ใส่ชุดนี้
          </button>
        </div>
      </div>
    </div>
  )
}

/** กระเป๋า (ช่องใส่ของ) — ระบบของในกระเป๋ามาใน Part 7 */
function BagTab({ onCraft }: { onCraft: () => void }) {
  const save = useGame((s) => s.save)!
  const cap = bagSlots(save.bagLevel)
  const slots = toSlots(save.inventory)
  const bag = BAG_LEVELS[save.bagLevel]
  const next = BAG_LEVELS[save.bagLevel + 1]
  return (
    <div className="gm-bag">
      <h3>
        {bag.icon} {bag.name}ของ{save.player.name}
      </h3>
      <p className="hint">
        ใช้ไป {slots.length}/{cap} ช่อง
        {next ? ` · อัปเกรดเป็น${next.name} (${next.slots} ช่อง) ได้จากการคราฟหรือร้านป้าศรี` : ' · กระเป๋าใหญ่สุดแล้ว'}
      </p>
      <div className="bag-grid">
        {Array.from({ length: cap }).map((_, k) => {
          const it = slots[k]
          if (!it) return <div key={k} className="bag-slot" aria-label="ช่องว่าง" />
          const def = ITEMS[it.id]
          return (
            <div key={k} className="bag-slot filled" title={`${def.name} — ${def.note}`}>
              <span className="bag-icon"><ItemIcon icon={def.icon} /></span>
              <span className="bag-name">{def.name}</span>
              {it.qty > 1 && <span className="bag-qty">×{it.qty}</span>}
            </div>
          )
        })}
      </div>
      <p className="hint">
        💰 เงินติดตัว {save.coins.toLocaleString('th-TH')} บาท · เดินไปใกล้ต้นไม้หรือกองหินแล้วกด <kbd>E</kbd> เพื่อเก็บของ
      </p>
      <button type="button" className="btn small" onClick={onCraft}>
        🔨 ไปคราฟของ
      </button>
    </div>
  )
}

function CraftTab() {
  const save = useGame((s) => s.save)!
  const inv = save.inventory
  return (
    <div className="gm-craft">
      <h3>คราฟของ</h3>
      <p className="hint">ทำเองถูกกว่าซื้อที่ร้าน · เครื่องมือที่ "ต้องมี" ไม่ถูกใช้หมด แค่ต้องมีในกระเป๋า</p>
      <ul className="shop-list">
        {RECIPES.map((r) => {
          const toolOk = !r.tool || (inv[r.tool] ?? 0) > 0
          const enough = Object.entries(r.needs).every(([id, q]) => (inv[id as ItemId] ?? 0) >= (q ?? 0))
          const bagDone = 'bagLevel' in r.gives && save.bagLevel >= r.gives.bagLevel
          const price = SHOP.find((e) => e.id === r.id)?.price
          return (
            <li key={r.id} className="shop-row">
              <span className="shop-icon"><ItemIcon icon={r.icon} /></span>
              <span className="shop-name">
                <strong>{r.name}</strong>
                <small className="craft-needs">
                  {Object.entries(r.needs).map(([id, q]) => {
                    const have = inv[id as ItemId] ?? 0
                    const ok = have >= (q ?? 0)
                    return (
                      <span key={id} className={ok ? 'ok' : 'miss'}>
                        <ItemIcon icon={ITEMS[id as ItemId].icon} /> {ITEMS[id as ItemId].name} {have}/{q}
                      </span>
                    )
                  })}
                  {r.tool && (
                    <span className={toolOk ? 'ok' : 'miss'}>
                      ต้องมี <ItemIcon icon={ITEMS[r.tool].icon} /> {ITEMS[r.tool].name}
                    </span>
                  )}
                  {price && <span className="price">ร้านขาย {price} บาท</span>}
                </small>
              </span>
              <button type="button" className="btn small" disabled={bagDone || !enough || !toolOk} onClick={() => craft(r)}>
                {bagDone ? 'มีแล้ว' : 'คราฟ'}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function GuideTab() {
  return (
    <div className="gm-guide">
      <h3>คู่มือการเล่น</h3>
      <ul className="howto">
        <li>
          <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> หรือปุ่มลูกศร — เดิน · <kbd>Shift</kbd> ค้างไว้ — วิ่ง
        </li>
        <li>ลากเมาส์ — หมุนกล้อง · ล้อเมาส์ — ซูมเข้า/ออก</li>
        <li>
          <kbd>P</kbd> — พักเกม (เวลาและค่าสถานะหยุด) · สลับไปหน้าต่างอื่นก็พักให้อัตโนมัติ
        </li>
        <li>
          <kbd>L</kbd> — จูง/ปล่อยสัตว์เลี้ยง
        </li>
        <li>
          <kbd>E</kbd> — ใกล้ต้นไม้: เก็บกิ่งไม้ (มีขวาน = ตัดได้ไม้ท่อน) · ต้นกล้วย: ลอกเชือกกล้วย · กองหิน: เก็บก้อนหิน · หน้าร้านป้าศรี: เข้าร้าน
        </li>
        <li>เมนู → คราฟของ — ทำขวาน ค้อน มีดพร้า เลื่อย และกระเป๋าใบใหญ่ขึ้นเอง ถูกกว่าซื้อที่ร้าน</li>
        <li>
          <kbd>C</kbd> — ถ่ายภาพ
        </li>
        <li>
          <kbd>Esc</kbd> — เมนูนี้: เปลี่ยนการแต่งตัว ดูกระเป๋า บันทึก ตั้งค่า
        </li>
        <li>เดินไปใกล้สถานที่เพื่อดูรายละเอียด และค้นพบสถานที่ใหม่ในหมู่บ้าน</li>
        <li>สัตว์เลี้ยงจะนั่งรอเมื่อคุณหยุด วิ่งเล่นแถว ๆ นั้น และวิ่งตามเมื่อคุณเดินออกไป · พาไปด้วยนาน ๆ ได้หัวใจความผูกพัน 💗</li>
        <li>เกมบันทึกอัตโนมัติทุก 2 นาที เมื่อเกิดเหตุการณ์สำคัญ และตอนพักเกม/ออกจากเกม</li>
      </ul>
    </div>
  )
}

function SaveTab({ onLoaded }: { onLoaded: () => void }) {
  const saveNow = useGame((s) => s.saveNow)
  const status = useGame((s) => s.saveStatus)
  const lastSavedAt = useGame((s) => s.lastSavedAt)
  const cloud = useGame((s) => s.cloudStatus)
  const [flash, setFlash] = useState<string | null>(null)
  return (
    <div className="gm-save">
      <h3>บันทึกเกม</h3>
      <button
        className="menu-item primary"
        onClick={() => setFlash(saveNow('manual') ? 'บันทึกเกมเรียบร้อย' : 'บันทึกไม่สำเร็จ — เซฟก่อนหน้ายังปลอดภัย')}
      >
        <span className="mi-icon">💾</span>
        <span className="mi-text">
          <strong>บันทึกเกมตอนนี้</strong>
          <small>Save Game · ล่าสุด {formatSavedAt(lastSavedAt)}</small>
        </span>
        <span className={`badge ${status === 'error' ? 'err' : ''}`}>{status === 'error' ? 'มีปัญหา' : 'พร้อมใช้งาน'}</span>
      </button>
      {flash && (
        <div className="hint" role="status">
          {flash}
        </div>
      )}
      <div className="setting-group">ไฟล์สำรอง (Save 1–3)</div>
      <p className="hint" style={{ margin: 0 }}>
        เซฟใหม่จะเขียนทับช่องที่เก่าที่สุดเสมอ ถ้าการบันทึกล้มเหลว เซฟล่าสุดที่สมบูรณ์จะไม่ถูกแตะ ·{' '}
        {cloud === 'disabled' ? 'เซิร์ฟเวอร์: ยังไม่เชื่อม' : cloud === 'offline' ? 'ออฟไลน์ เก็บไว้รอส่ง' : 'เซิร์ฟเวอร์: ' + cloud}
      </p>
      <SaveSlots onLoaded={onLoaded} />
    </div>
  )
}

function VolumeRow({ label, value, disabled, onChange }: { label: string; value: number; disabled?: boolean; onChange: (v: number) => void }) {
  return (
    <label className="setting">
      <span>{label}</span>
      <span className="vol">
        <input type="range" min={0} max={1} step={0.05} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
        <output>{Math.round(value * 100)}</output>
      </span>
    </label>
  )
}

function useFullscreen() {
  const [on, setOn] = useState(!!document.fullscreenElement)
  useEffect(() => {
    const h = () => setOn(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])
  const set = (v: boolean) => {
    if (v && !document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => {})
    if (!v && document.fullscreenElement) void document.exitFullscreen?.().catch(() => {})
  }
  return [on, set] as const
}

function SettingsTab() {
  const settings = useSettings()
  const [full, setFull] = useFullscreen()
  const mode = full ? 'full' : settings.displaySize
  const choose = (m: 'full' | 'large' | 'medium') => {
    if (m === 'full') {
      settings.set({ displaySize: 'large' })
      setFull(true)
    } else {
      setFull(false)
      settings.set({ displaySize: m })
    }
  }
  return (
    <div className="gm-settings">
      <h3>ตั้งค่าเกม</h3>
      <div className="setting-group">ขนาดหน้าจอเกม</div>
      <div className="size-choices">
        {(
          [
            ['full', '⛶', 'เต็มจอ', 'ซ่อนแถบเบราว์เซอร์ทั้งหมด'],
            ['large', '▣', 'ใหญ่', 'เต็มหน้าต่างเบราว์เซอร์'],
            ['medium', '▢', 'กลาง', 'กรอบกลางจอ มีขอบรอบ'],
          ] as const
        ).map(([id, icon, label, note]) => (
          <button key={id} className="size-choice" aria-pressed={mode === id} onClick={() => choose(id)}>
            <span className="size-icon">{icon}</span>
            <strong>{label}</strong>
            <small>{note}</small>
          </button>
        ))}
      </div>
      <p className="hint" style={{ margin: 0 }}>เหมาะกับคอมพิวเตอร์ โน้ตบุ๊ก และไอแพด · กด Esc ในโหมดเต็มจอจะออกจากเต็มจอก่อน</p>

      <div className="setting-group">เสียงและดนตรี</div>
      <label className="setting">
        <span>เปิดเพลง</span>
        <input type="checkbox" checked={settings.musicOn} onChange={(e) => settings.set({ musicOn: e.target.checked })} />
      </label>
      <VolumeRow label="ระดับเสียงเพลง" value={settings.musicVolume} disabled={!settings.musicOn} onChange={(musicVolume) => settings.set({ musicVolume })} />
      <VolumeRow label="เสียงธรรมชาติ" value={settings.ambienceVolume} onChange={(ambienceVolume) => settings.set({ ambienceVolume })} />
      <VolumeRow label="เสียงเอฟเฟกต์" value={settings.sfxVolume} onChange={(sfxVolume) => settings.set({ sfxVolume })} />
      <label className="setting">
        <span>ทดลองฟังช่วงเวลา</span>
        <select value={settings.soundPreview} onChange={(e) => settings.set({ soundPreview: e.target.value as typeof settings.soundPreview })}>
          <option value="auto">ตามเวลาในเกม</option>
          {SOUND_PERIODS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <div className="setting-group">การเล่น</div>
      <label className="setting">
        <span>บันทึกอัตโนมัติ</span>
        <input type="checkbox" checked={settings.autoSave} onChange={(e) => settings.set({ autoSave: e.target.checked })} />
      </label>
      <label className="setting">
        <span>บันทึกทุก</span>
        <select value={settings.autoSaveMinutes} disabled={!settings.autoSave} onChange={(e) => settings.set({ autoSaveMinutes: Number(e.target.value) })}>
          {AUTO_SAVE_CHOICES.map((m) => (
            <option key={m} value={m}>
              {m} นาที
            </option>
          ))}
        </select>
      </label>
      <label className="setting">
        <span>แสดงป้ายชื่อสถานที่</span>
        <input type="checkbox" checked={settings.showLabels} onChange={(e) => settings.set({ showLabels: e.target.checked })} />
      </label>
      <label className="setting">
        <span>ความไวเมาส์</span>
        <input type="range" min={0.3} max={2} step={0.1} value={settings.mouseSensitivity} onChange={(e) => settings.set({ mouseSensitivity: Number(e.target.value) })} />
      </label>
    </div>
  )
}
