import { useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { formatClock, formatSavedAt, markCleanExit, periodOfDay, useGame } from '../game/store'
import { AUTO_SAVE_CHOICES, useSettings } from '../game/settings'
import { PLACES, PLOTS } from '../game/content/village'
import { Village } from '../scenes/Village'
import { Player } from '../scenes/Player'
import { SaveSlots } from './SaveSlots'

/** นับเวลาเล่นสะสม (ไม่บันทึกทุกเฟรม แค่เก็บในหน่วยความจำ) */
function PlayClock() {
  useFrame((_, dt) => {
    const s = useGame.getState().save
    if (s) s.playSeconds += Math.min(dt, 0.1)
  })
  return null
}

export function WorldScreen() {
  const save = useGame((s) => s.save)
  const exitToTitle = useGame((s) => s.exitToTitle)
  const [menu, setMenu] = useState(false)

  useAutoSave()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') setMenu((m) => !m)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!save) exitToTitle(true)
  }, [save, exitToTitle])
  if (!save) return null

  return (
    <>
      <Canvas shadows camera={{ fov: 50, near: 0.1, far: 400 }} style={{ position: 'absolute', inset: 0 }}>
        <Sky sunPosition={[80, 30, 60]} turbidity={6} rayleigh={1.2} />
        <hemisphereLight args={['#fff2d6', '#6d7f4a', 1]} />
        <directionalLight
          position={[60, 60, 30]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
          shadow-camera-far={250}
        />
        <fog attach="fog" args={['#dfe6d8', 70, 340]} />
        <Village playerHouseId={save.home.houseDesignId} playerName={save.player.name} />
        <Player />
        <PlayClock />
      </Canvas>
      <Hud onMenu={() => setMenu(true)} />
      {menu && <GameMenu onClose={() => setMenu(false)} />}
    </>
  )
}

/** บันทึกอัตโนมัติตามช่วงเวลาที่ตั้งไว้ (ค่าเริ่มต้น 2 นาที) */
function useAutoSave() {
  const enabled = useSettings((s) => s.autoSave)
  const minutes = useSettings((s) => s.autoSaveMinutes)
  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => {
      const ok = useGame.getState().saveNow('auto')
      if (!ok) {
        useGame.getState().toast({ title: 'บันทึกอัตโนมัติไม่สำเร็จ', body: 'เซฟก่อนหน้ายังปลอดภัย จะลองใหม่รอบถัดไป', tone: 'warn' })
      }
    }, minutes * 60_000)
    return () => window.clearInterval(id)
  }, [enabled, minutes])
}

function Hud({ onMenu }: { onMenu: () => void }) {
  const save = useGame((s) => s.save)!
  const nearby = useGame((s) => s.nearbyPlaceId)
  const toasts = useGame((s) => s.toasts)
  const dismiss = useGame((s) => s.dismissToast)

  const place = nearby && !nearby.startsWith('plot:') ? PLACES.find((p) => p.id === nearby) : null
  const plot = nearby?.startsWith('plot:') ? PLOTS.find((p) => 'plot:' + p.id === nearby) : null
  const locationName = place?.name ?? (plot ? `บ้านของ${save.player.name}` : 'หมู่บ้านไพบูลย์')

  return (
    <div className="hud">
      <div className="hud-top">
        <div className="pill">
          <span>{save.player.name}</span>
          <span className="sep" />
          <span className="coins"><span className="coin-dot" /> {save.coins.toLocaleString('th-TH')} เหรียญ</span>
        </div>
        <div className="pill">
          <span>วันที่ {save.day}</span>
          <span className="sep" />
          <span>
            {formatClock(save.minuteOfDay)} · {periodOfDay(save.minuteOfDay)}
          </span>
          <span className="sep" />
          <SaveIndicator />
          <button className="btn small" onClick={onMenu} aria-label="เปิดเมนูเกม">
            เมนู
          </button>
        </div>
      </div>

      <div className="location">📍 {locationName}</div>

      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone ?? ''}`} onClick={() => dismiss(t.id)}>
            <strong>{t.title}</strong>
            {t.body && <span>{t.body}</span>}
          </div>
        ))}
      </div>

      {place && (
        <div className="interact">
          <h3>{place.name}</h3>
          {place.arriveText && <p>{place.arriveText}</p>}
          {place.comingSoon && <div className="soon">เร็ว ๆ นี้: {place.comingSoon}</div>}
        </div>
      )}
      {plot && (
        <div className="interact">
          <h3>ที่ดินของคุณ</h3>
          <p>รั้วไม้ไผ่คือขอบเขตที่ดิน สร้างสวน ฟาร์ม และต่อเติมบ้านได้ภายในเขตนี้</p>
          <div className="soon">เร็ว ๆ นี้: ตกแต่งบ้านและซื้อที่ดินเพิ่ม (Part 5)</div>
        </div>
      )}

      <div className="controls-help">
        <kbd>W A S D</kbd> เดิน · <kbd>Shift</kbd> วิ่ง · ลากเมาส์ หมุนกล้อง · ล้อเมาส์ ซูม · <kbd>Esc</kbd> เมนู
      </div>
    </div>
  )
}

function SaveIndicator() {
  const status = useGame((s) => s.saveStatus)
  const dirty = useGame((s) => s.dirty)
  const cloud = useGame((s) => s.cloudStatus)
  const text = status === 'error' ? '⚠ บันทึกไม่สำเร็จ' : dirty ? '● ยังไม่บันทึก' : '✓ บันทึกแล้ว'
  const cloudText: Record<typeof cloud, string> = {
    disabled: 'ยังไม่เชื่อมเซิร์ฟเวอร์',
    synced: 'ซิงก์เซิร์ฟเวอร์แล้ว',
    pending: 'รอซิงก์เซิร์ฟเวอร์',
    offline: 'ออฟไลน์: เก็บไว้รอส่ง',
    error: 'ซิงก์เซิร์ฟเวอร์ไม่สำเร็จ',
  }
  return (
    <span className={`save-ind ${status === 'error' ? 'err' : dirty ? 'dirty' : 'ok'}`} title={cloudText[cloud]}>
      {text}
    </span>
  )
}

type MenuView = 'main' | 'settings' | 'slots' | 'confirm-exit' | 'confirm-title' | 'exited'

function GameMenu({ onClose }: { onClose: () => void }) {
  const save = useGame((s) => s.save)!
  const saveNow = useGame((s) => s.saveNow)
  const exitToTitle = useGame((s) => s.exitToTitle)
  const status = useGame((s) => s.saveStatus)
  const lastSavedAt = useGame((s) => s.lastSavedAt)
  const cloud = useGame((s) => s.cloudStatus)
  const settings = useSettings()
  const [view, setView] = useState<MenuView>('main')
  const [flash, setFlash] = useState<string | null>(null)

  const doSave = () => {
    const ok = saveNow('manual')
    setFlash(ok ? 'บันทึกเกมเรียบร้อย' : 'บันทึกไม่สำเร็จ — เซฟก่อนหน้ายังปลอดภัย')
  }

  // ออกจากเกม / กลับหน้าหลัก: บันทึกก่อนเสมอ ถ้าไม่สำเร็จให้ยืนยัน
  const tryLeave = (target: 'exit' | 'title') => {
    const ok = useGame.getState().saveNow('exit')
    if (!ok) {
      setView(target === 'exit' ? 'confirm-exit' : 'confirm-title')
      return
    }
    if (target === 'title') exitToTitle()
    else {
      markCleanExit()
      setView('exited')
    }
  }

  if (view === 'exited') {
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

  return (
    <div className="menu-backdrop" onClick={onClose}>
      <div className="menu" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="เมนูเกม">
        {view === 'main' && (
          <>
            <h2>เมนูเกม</h2>
            <button className="menu-item primary" onClick={doSave}>
              <span className="mi-icon">💾</span>
              <span className="mi-text">
                <strong>บันทึกเกม</strong>
                <small>Save Game · ล่าสุด {formatSavedAt(lastSavedAt)}</small>
              </span>
              <span className={`badge ${status === 'error' ? 'err' : ''}`}>{status === 'error' ? 'มีปัญหา' : 'พร้อมใช้งาน'}</span>
            </button>
            {flash && <div className="hint" role="status">{flash}</div>}
            <div className="menu-sep" />
            <button className="menu-item" onClick={() => setView('slots')}>
              <span className="mi-icon">🗂</span>
              <span className="mi-text">
                <strong>ไฟล์สำรอง</strong>
                <small>
                  Save 1–3 ·{' '}
                  {cloud === 'disabled' ? 'เซิร์ฟเวอร์: ยังไม่เชื่อม' : cloud === 'offline' ? 'ออฟไลน์ เก็บไว้รอส่ง' : 'เซิร์ฟเวอร์: ' + cloud}
                </small>
              </span>
            </button>
            <button className="menu-item" onClick={() => setView('settings')}>
              <span className="mi-icon">⚙</span>
              <span className="mi-text">
                <strong>ตั้งค่าเกม</strong>
              </span>
            </button>
            <button className="menu-item" onClick={() => tryLeave('title')}>
              <span className="mi-icon">🏠</span>
              <span className="mi-text">
                <strong>กลับหน้าหลัก</strong>
              </span>
            </button>
            <button className="menu-item" onClick={() => tryLeave('exit')}>
              <span className="mi-icon">🚪</span>
              <span className="mi-text">
                <strong>ออกจากเกม</strong>
                <small>บันทึกอัตโนมัติก่อนออก</small>
              </span>
            </button>
            <button className="btn ghost small" onClick={onClose}>
              เล่นต่อ (Esc)
            </button>
          </>
        )}

        {view === 'settings' && (
          <>
            <h2>ตั้งค่าเกม</h2>
            <label className="setting">
              <span>บันทึกอัตโนมัติ</span>
              <input type="checkbox" checked={settings.autoSave} onChange={(e) => settings.set({ autoSave: e.target.checked })} />
            </label>
            <label className="setting">
              <span>บันทึกทุก</span>
              <select
                value={settings.autoSaveMinutes}
                disabled={!settings.autoSave}
                onChange={(e) => settings.set({ autoSaveMinutes: Number(e.target.value) })}
              >
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
              <input
                type="range"
                min={0.3}
                max={2}
                step={0.1}
                value={settings.mouseSensitivity}
                onChange={(e) => settings.set({ mouseSensitivity: Number(e.target.value) })}
              />
            </label>
            <button className="btn ghost small" onClick={() => setView('main')}>
              ย้อนกลับ
            </button>
          </>
        )}

        {view === 'slots' && (
          <>
            <h2>ไฟล์สำรอง</h2>
            <p className="hint" style={{ margin: 0 }}>
              เซฟใหม่จะเขียนทับช่องที่เก่าที่สุดเสมอ ถ้าการบันทึกล้มเหลว เซฟล่าสุดที่สมบูรณ์จะไม่ถูกแตะ
            </p>
            <SaveSlots onLoaded={onClose} />
            <button className="btn ghost small" onClick={() => setView('main')}>
              ย้อนกลับ
            </button>
          </>
        )}

        {(view === 'confirm-exit' || view === 'confirm-title') && (
          <>
            <h2>บันทึกไม่สำเร็จ</h2>
            <p style={{ margin: 0 }}>
              บันทึกความคืบหน้าล่าสุดไม่สำเร็จ (พื้นที่เบราว์เซอร์อาจเต็มหรือถูกปิดกั้น)
              <br />
              ถ้าออกตอนนี้ จะกลับมาเล่นต่อจากจุดบันทึกล่าสุดที่สำเร็จ: <strong>{formatSavedAt(lastSavedAt)}</strong>
            </p>
            <button className="btn" onClick={() => tryLeave(view === 'confirm-exit' ? 'exit' : 'title')}>
              ลองบันทึกอีกครั้ง
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                exitToTitle(true)
              }}
            >
              ออกโดยไม่บันทึก
            </button>
            <button className="btn ghost small" onClick={() => setView('main')}>
              ยกเลิก
            </button>
          </>
        )}
      </div>
    </div>
  )
}
