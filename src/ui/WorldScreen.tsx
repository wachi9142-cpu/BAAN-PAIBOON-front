import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { formatClock, MAX_PET_HEARTS, periodOfDay, useGame } from '../game/store'
import { useSettings } from '../game/settings'
import { PLACES, PLOTS } from '../game/content/village'
import { useVillageSoundscape } from '../game/audio/useSoundscape'
import { Village } from '../scenes/Village'
import { Player } from '../scenes/Player'
import { PetFollower } from '../scenes/PetFollower'
import { Villagers } from '../scenes/Villagers'
import { GameMenu } from './GameMenu'
import { takePhoto } from '../game/photo'
import { gather, gatherHint } from '../game/inventory'
import { ShopWindow } from './ShopWindow'

/** นับเวลาเล่นสะสม (ไม่บันทึกทุกเฟรม แค่เก็บในหน่วยความจำ) */
function PlayClock() {
  useFrame((_, dt) => {
    const g = useGame.getState()
    if (g.save && !g.paused) g.save.playSeconds += Math.min(dt, 0.1)
  })
  return null
}

/** ความผูกพันกับสัตว์เลี้ยง: ทุก 60 วินาทีที่เล่นด้วยกัน (ไม่นับตอนพัก) ได้ 1 หัวใจ + ความสนุก */
function PetBond() {
  const acc = useRef({ t: 0 }).current
  useFrame((_, dt) => {
    const g = useGame.getState()
    if (!g.save?.player.pet || g.paused) return
    acc.t += Math.min(dt, 0.1)
    if (acc.t >= 60) {
      acc.t = 0
      g.addPetHeart()
      g.changeStats({ fun: 5 })
    }
  })
  return null
}

export function WorldScreen() {
  const save = useGame((s) => s.save)
  const exitToTitle = useGame((s) => s.exitToTitle)
  const setPaused = useGame((s) => s.setPaused)
  const [menu, setMenu] = useState(false)
  const [shop, setShop] = useState(false)
  const [pauseOpen, setPauseOpen] = useState(false)
  const [hidden, setHidden] = useState(document.hidden)

  useAutoSave()
  useVillageSoundscape()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setPauseOpen(false)
        setMenu((m) => !m)
      }
      if (e.code === 'KeyP') setPauseOpen((p) => !p)
      if (e.code === 'KeyE' && !e.repeat) {
        const g = useGame.getState()
        if (g.paused) return
        if (g.nearbyPlaceId === 'shop') setShop((o) => !o)
        else if (g.gatherTarget) gather(g.gatherTarget)
      }
      if (e.code === 'KeyC' && (e.target as HTMLElement)?.tagName !== 'INPUT') snapWorld()
      if (e.code === 'KeyL') {
        const g = useGame.getState()
        if (g.save?.player.pet) g.setPetLeashed(!g.save.petLeashed)
      }
    }
    // สลับไปหน้าต่าง/แท็บอื่น = พักอัตโนมัติ
    const onVis = () => setHidden(document.hidden)
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // เปิดเมนู / กดพัก / ไม่ได้ดูหน้าจอเกม → เกมหยุด (ตัวละคร สัตว์เลี้ยง เวลา ค่าสถานะ ไม่เดิน)
  useEffect(() => {
    setPaused(menu || pauseOpen || hidden)
  }, [menu, pauseOpen, hidden, setPaused])
  useEffect(() => () => setPaused(false), [setPaused])

  useEffect(() => {
    if (!save) exitToTitle(true)
  }, [save, exitToTitle])
  if (!save) return null

  return (
    <>
      <Canvas
        shadows="soft"
        camera={{ fov: 50, near: 0.1, far: 400 }}
        gl={{ preserveDrawingBuffer: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* แสงนุ่ม: ฟ้าสีอ่อน แสงแวดล้อมอุ่น แดดโทนเหลืองอ่อน เงาเบลอและจาง */}
        <Sky sunPosition={[80, 30, 60]} turbidity={3.5} rayleigh={0.7} mieCoefficient={0.004} mieDirectionalG={0.75} />
        <hemisphereLight args={['#fff4dc', '#8a9a62', 1.45]} />
        <ambientLight color="#ffe9c8" intensity={0.35} />
        <directionalLight
          position={[60, 60, 30]}
          color="#ffe2b8"
          intensity={1.15}
          shadow-intensity={0.55}
          shadow-radius={6}
          shadow-bias={-0.0004}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
          shadow-camera-far={250}
        />
        <fog attach="fog" args={['#e8ead8', 60, 320]} />
        <Village playerHouseId={save.home.houseDesignId} playerName={save.player.name} />
        <Villagers />
        <Player />
        {save.player.pet && <PetFollower pet={save.player.pet} start={save.position} />}
        <PlayClock />
        <PetBond />
      </Canvas>
      <Hud onMenu={() => setMenu(true)} onPause={() => setPauseOpen(true)} onShop={() => setShop(true)} />
      {shop && !menu && <ShopWindow onClose={() => setShop(false)} />}
      {pauseOpen && !menu && (
        <div className="menu-backdrop pause-backdrop" onClick={() => setPauseOpen(false)}>
          <div className="menu pause-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="พักเกม">
            <div className="pause-icon">⏸</div>
            <h2>พักเกม</h2>
            <p className="hint" style={{ margin: 0, textAlign: 'center' }}>
              เวลาในเกม ค่าสถานะ และสัตว์เลี้ยงหยุดไว้ก่อน บันทึกความคืบหน้าให้แล้ว
              <br />
              ลุกไปทำธุระได้เลย กลับมาแล้วกดเล่นต่อ
            </p>
            <button className="btn" onClick={() => setPauseOpen(false)} autoFocus>
              ▶ เล่นต่อ (P)
            </button>
          </div>
        </div>
      )}
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

/** หลอดค่าสถานะ */
function StatBar({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="stat" title={`${label} ${Math.round(value)}/100`}>
      <span className="stat-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="stat-label">{label}</span>
      <span className="stat-track" role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
        <span className="stat-fill" style={{ width: `${value}%`, background: color }} />
      </span>
    </div>
  )
}

/** แผงสถานะมุมซ้ายบน: ชื่อ หลอดค่าสถานะ ถุงเงิน ความผูกพันกับสัตว์เลี้ยง สายจูง */
function StatusPanel() {
  const save = useGame((s) => s.save)!
  const pops = useGame((s) => s.moneyPops)
  const setPetLeashed = useGame((s) => s.setPetLeashed)
  const pet = save.player.pet
  return (
    <div className="status">
      <div className="status-name">{save.player.name}</div>
      <StatBar icon="❤️" label="ชีวิต" value={save.stats.health} color="#d9534f" />
      <StatBar icon="🍚" label="อิ่ม" value={save.stats.hunger} color="#e0a35c" />
      <StatBar icon="💧" label="น้ำ" value={save.stats.thirst} color="#4a90d8" />
      <StatBar icon="😊" label="สนุก" value={save.stats.fun} color="#5c9a4a" />
      <div className="money">
        <span aria-hidden="true">💰</span>
        <span>
          ถุงเงิน <strong>{save.coins.toLocaleString('th-TH')}</strong> บาท
        </span>
        {pops.map((p) => (
          <span key={p.id} className={`money-pop ${p.amount < 0 ? 'neg' : ''}`}>
            {p.amount > 0 ? '+' : '−'}
            {Math.abs(p.amount).toLocaleString('th-TH')} บาท
            <small>รวม {p.total.toLocaleString('th-TH')} บาท</small>
          </span>
        ))}
      </div>
      {pet && (
        <div className="pet-row">
          <span className="pet-hearts" title={`ความผูกพันกับ${pet.name} ${save.petHearts}/${MAX_PET_HEARTS}`}>
            {Array.from({ length: MAX_PET_HEARTS }).map((_, i) => (
              <span key={i} className={i < save.petHearts ? 'on' : ''}>
                ♥
              </span>
            ))}
          </span>
          <button
            className={`leash-btn ${save.petLeashed ? 'on' : ''}`}
            onClick={() => setPetLeashed(!save.petLeashed)}
            title="กด L เพื่อจูง/ปล่อย"
          >
            {save.petLeashed ? '🦮 จูงอยู่' : '🐾 ปล่อย'}
          </button>
        </div>
      )}
    </div>
  )
}

/** ถ่ายภาพฉากในเกม (เฉพาะภาพ 3D ไม่ติดแถบสถานะ) */
function snapWorld() {
  const canvas = document.querySelector<HTMLCanvasElement>('.screen canvas')
  takePhoto(canvas, 'baan-paiboon')
  useGame.getState().toast({ title: '📷 ถ่ายภาพแล้ว', body: 'บันทึกเป็นไฟล์รูปในเครื่อง (โฟลเดอร์ดาวน์โหลด)', tone: 'info' })
}

function Hud({ onMenu, onPause, onShop }: { onMenu: () => void; onPause: () => void; onShop: () => void }) {
  const gatherTarget = useGame((s) => s.gatherTarget)
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
        <StatusPanel />
        <div className="pill">
          <button className="btn small ghost pause-btn" onClick={onPause} aria-label="พักเกม" title="พักเกม (P)">
            ⏸ พัก
          </button>
          <button className="btn small ghost pause-btn" onClick={snapWorld} aria-label="ถ่ายภาพ" title="ถ่ายภาพ (C)">
            📷
          </button>
          <span className="sep" />
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
          {place.id === 'shop' ? (
            <button className="btn small" onClick={onShop}>
              🛒 เข้าร้าน (E)
            </button>
          ) : (
            place.comingSoon && <div className="soon">เร็ว ๆ นี้: {place.comingSoon}</div>
          )}
        </div>
      )}
      {!place && gatherTarget && (
        <div className="gather-hint">
          <kbd>E</kbd> {gatherHint(gatherTarget).replace('กด E — ', '')}
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
        <kbd>W A S D</kbd> เดิน · <kbd>Shift</kbd> วิ่ง · ลากเมาส์ หมุนกล้อง · ล้อเมาส์ ซูม · <kbd>P</kbd> พัก · <kbd>L</kbd> จูงสัตว์ · <kbd>E</kbd> เก็บของ/เข้าร้าน · <kbd>C</kbd> ถ่ายภาพ · <kbd>Esc</kbd> เมนู
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
