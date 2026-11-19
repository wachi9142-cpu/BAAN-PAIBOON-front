import { useInterior } from '../game/interior'
import { activateHomeSpot, enterHome, homeSpotLabel } from '../game/homeActions'
import { HomeInterior } from '../scenes/HomeInterior'
import { startPlay, toyHint, usePlay } from '../game/play'
import { isShop, SHOPS } from '../game/content/shops'
import { isBoard, openBoard, useBoard } from '../game/noticeboard'
import { NoticeBoardWindow } from './NoticeBoardWindow'
import { toggleFastWalk, useMove } from '../game/movement'
import { TouchControls } from './TouchControls'
import { LayoutEditor } from './LayoutEditor'
import { LayoutDragger } from '../scenes/LayoutDragger'
import { HoldInteract } from '../scenes/HoldInteract'
import { HoldMenu } from './HoldMenu'
import { SwimBar, WaterMenu } from './WaterMenu'
import { useWater } from '../game/water'
import { activateWater, waterHint } from '../game/waterTick'
import { playerPose } from '../game/playerPose'
import { chestHint, openChest, useChests } from '../game/treasure'
import { whistle } from '../game/whistle'
import { activateHotSlot, hotbarSlots, ToolBar } from './ToolBar'
import { HelpButton } from './HelpOverlay'
import { PetPicker } from './PetPicker'
import { useBuild, toggleBuild, rotateTool } from '../game/building'
import { BuildBar, ChestWindow } from './BuildBar'
import { STRUCTURES } from '../game/content/structures'
import { bedHint, plant, seedsInBag, tendBed, useGarden } from '../game/garden'
import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { formatClock, MAX_PET_HEARTS, useGame } from '../game/store'
import { useSettings } from '../game/settings'
import { PLACES, PLOTS } from '../game/content/village'
import { useVillageSoundscape } from '../game/audio/useSoundscape'
import { Village } from '../scenes/Village'
import { Player } from '../scenes/Player'
import { PetFollower } from '../scenes/PetFollower'
import { activeKeys, moodOf, openParty, petOf } from '../game/party'
import { PetPartyWindow } from './PetPartyWindow'
import { FriendsWindow, InvitePopup } from './FriendsWindow'
import { PetCard } from './PetCard'
import { FloatingHistory } from './EditHistoryBar'
import { Weather } from '../scenes/Weather'
import { forceWeather, seasonLabel, useWeather, WEATHER } from '../game/weather'
import { BookButton, GameBook } from './GameBook'
import { StatIcon, type StatIconId } from './StatIcons'
import { FriendsButton } from './FriendsWindow'
import { WaterLife } from '../scenes/WaterLife'
import { Villagers } from '../scenes/Villagers'
import { GameMenu, type Tab } from './GameMenu'
import { takePhoto } from '../game/photo'
import { countOf, gather, gatherHint } from '../game/inventory'
import { ItemIcon } from './ItemIcon'
import { ITEMS } from '../game/content/items'
import { catchHint, summonPet, tierOf, tryCatch } from '../game/catching'
import { getSpecies, RIDEABLE } from '../game/content/pets'
import { TIERS } from '../game/content/wildlife'
import { Wildlife } from '../scenes/Wildlife'
import { DayLight } from '../scenes/DayLight'
import { SPEEDS, skipToNextPeriod, syncClockFromSave, tickClock, useClock } from '../game/clock'
import { isShopOpen, SHOP_HOURS, timePeriodAt } from '../game/content/daytime'
import { applyGoldLeaf, birthdayCoin, bowThreeTimes, donate, drawFromCup, drawSiamsi, lightIncense, pourWater, ringBell, takeSlip, toggleShoes, useMerit, useTemple } from '../game/templeActions'
import { BIRTH_DAYS } from '../game/content/temple'
import { TalkWindow } from './TalkWindow'
import { startTalk, useTalk } from '../game/talk'
import { NPC_INFO } from '../game/content/villagers'
import { FortuneCard } from './FortuneCard'
import { CUPS, STICKS_PER_CUP } from '../game/content/siamsi'
import { ShopWindow } from './ShopWindow'

/** นับเวลาเล่นสะสม (ไม่บันทึกทุกเฟรม แค่เก็บในหน่วยความจำ) */
function PlayClock() {
  useEffect(() => syncClockFromSave(), [])
  useFrame((_, dt) => {
    const g = useGame.getState()
    if (g.save && !g.paused) {
      g.save.playSeconds += Math.min(dt, 0.1)
      tickClock(Math.min(dt, 0.1))
    }
  })
  return null
}

/** แจ้งเตือนตามเวลา: เด็กต้องกลับบ้านก่อนมืด · ร้านปิด · เริ่มวันใหม่ */
function TimeAlerts() {
  const minute = useClock((s) => s.minute)
  const day = useClock((s) => s.day)
  const said = useRef(new Set<string>())
  useEffect(() => {
    const g = useGame.getState()
    if (!g.save) return
    const once = (key: string, fn: () => void) => {
      const k = day + ':' + key
      if (said.current.has(k)) return
      said.current.add(k)
      fn()
    }
    const child = g.save.player.appearance.age === 'child'
    if (child && minute >= 18 * 60 && minute < 18 * 60 + 30)
      once('curfew1', () => g.toast({ title: '🌇 ใกล้มืดแล้ว', body: 'เด็ก ๆ ต้องกลับบ้านก่อน 19:00 น. นะ', tone: 'warn' }))
    if (child && minute >= 19 * 60)
      once('curfew2', () => g.toast({ title: '🌙 มืดแล้ว กลับบ้านกันเถอะ', body: 'ตายายเป็นห่วง รีบกลับบ้านไปนอนนะ', tone: 'warn' }))
    if (minute >= SHOP_HOURS.close * 60 && minute < SHOP_HOURS.close * 60 + 15)
      once('shopclose', () => g.toast({ title: '🏪 ร้านป้าศรีปิดแล้ว', body: `เปิดอีกที ${String(SHOP_HOURS.open).padStart(2, '0')}:00 น.`, tone: 'info' }))
    if (minute >= 5 * 60 && minute < 5 * 60 + 15)
      once('rooster', () => g.toast({ title: '🐓 ไก่ขันแล้ว ฟ้าเริ่มสาง', body: `วันที่ ${day} เริ่มต้นแล้ว`, tone: 'info' }))
  }, [minute, day])
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
  // อย่าอ่านทั้งเซฟ: ตำแหน่ง/ค่าสถานะเปลี่ยนบ่อย จะทำให้ทั้งฉาก 3 มิติวาดใหม่ (เกมกระตุก)
  const hasSave = useGame((s) => !!s.save)
  const houseDesignId = useGame((s) => s.save?.home.houseDesignId ?? '')
  const playerName = useGame((s) => s.save?.player.name ?? '')
  const save = hasSave ? { home: { houseDesignId }, player: { name: playerName } } : null
  const exitToTitle = useGame((s) => s.exitToTitle)
  const setPaused = useGame((s) => s.setPaused)
  const [menu, setMenu] = useState(false)
  const [menuTab, setMenuTab] = useState<Tab | undefined>(undefined)
  const [shop, setShop] = useState<string | null>(null)
  const [temple, setTemple] = useState(false)
  const nearWorshipNow = useGame((s) => s.nearWorship)
  useEffect(() => {
    if (!nearWorshipNow) setTemple(false)
  }, [nearWorshipNow])
  const [pauseOpen, setPauseOpen] = useState(false)
  const [hidden, setHidden] = useState(document.hidden)

  useAutoSave()
  useVillageSoundscape()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      // แถบไอเทม: กด 1–9 เลือกช่อง (เครื่องมือ = ถือ · ของกิน = กิน)
      if (/^Digit[1-9]$/.test(e.code) && !e.repeat) {
        activateHotSlot(hotbarSlots(useGame.getState().save?.inventory)[Number(e.code.slice(5)) - 1], Number(e.code.slice(5)) - 1)
      }
      // โหมดสร้าง: B เปิด/ปิด · R หมุน · Esc ออก
      if (e.code === 'KeyB' && !e.repeat) {
        toggleBuild()
        return
      }
      if (useBuild.getState().active) {
        if (e.code === 'Escape') toggleBuild(false)
        if (e.code === 'KeyR' && !e.repeat) rotateTool()
        if (e.code === 'Escape' || e.code === 'KeyR' || e.code === 'KeyE') return
      }
      if (e.code === 'Escape') {
        setPauseOpen(false)
        const tp = useTemple.getState()
        if (tp.stick || tp.cupPick || tp.fortune) {
          useTemple.setState({ stick: null, cupPick: false, fortune: null })
          return
        }
        if (useBoard.getState().open) {
          useBoard.setState({ open: null })
          return
        }
        if (useBuild.getState().chestOpen) {
          useBuild.setState({ chestOpen: null })
          return
        }
        setMenuTab(undefined)
        setMenu((m) => !m)
      }
      if (e.code === 'KeyP') setPauseOpen((p) => !p)
      if (e.code === 'KeyR' && !e.repeat) toggleRide()
      if (e.code === 'KeyQ' && !e.repeat) whistle()
      if (e.code === 'KeyV' && !e.repeat && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        toggleFastWalk()
        useGame.getState().toast({ title: useMove.getState().fastWalk ? 'เดินเร็ว' : 'เดินช้า (ปกติ)', body: 'กด V สลับเดินช้า/เดินเร็ว · Shift ค้าง = วิ่ง', tone: 'info' })
      }
      if (e.code === 'KeyE' && !e.repeat) {
        const g = useGame.getState()
        if (g.paused) return
        const hn = useInterior.getState().near
        if (hn) {
          if (hn === 'enter') enterHome()
          else if (hn.startsWith('enter:')) enterHome(hn.slice(6))
          else activateHomeSpot(hn)
        }
        else if (isBoard(g.nearbyPlaceId)) {
          if (useBoard.getState().open) useBoard.setState({ open: null })
          else openBoard(g.nearbyPlaceId)
        }
        else if (isShop(g.nearbyPlaceId)) {
          const id = g.nearbyPlaceId
          if (isShopOpen(useClock.getState().minute)) setShop((o) => (o ? null : id))
          else g.toast({ title: `${SHOPS[id].name}ปิดแล้ว`, body: `เปิด ${String(SHOP_HOURS.open).padStart(2, '0')}:00 – ${SHOP_HOURS.close}:00 น.`, tone: 'info' })
        }
        else if (g.nearWorship) setTemple((o) => !o)
        else if (useTalk.getState().near && !useTalk.getState().talking) startTalk(useTalk.getState().near!)
        else if (useMerit.getState().spot) {
          const sp = useMerit.getState().spot!
          if (sp.startsWith('bell')) ringBell(sp)
          else if (sp === 'water') pourWater()
          else if (sp === 'shoes') toggleShoes()
          else if (sp === 'slips') takeSlip()
          else useMerit.setState({ popup: sp as 'donate' | 'birthday' | 'incense' })
        }
        else if (usePlay.getState().near && !usePlay.getState().playing) startPlay(usePlay.getState().near!)
        else if (useWater.getState().near) {
          if (useWater.getState().menu) useWater.setState({ menu: null })
          else activateWater(useWater.getState().near!, playerPose.x, playerPose.z)
        }
        else if (useChests.getState().near) openChest(useChests.getState().near!)
        else if (useBuild.getState().near) {
          const uid = useBuild.getState().near!
          const st = g.save?.structures.find((s) => s.uid === uid)
          if (st && STRUCTURES[st.id].use === 'craft') {
            setMenuTab('craft')
            setMenu(true)
          } else if (st) useBuild.setState({ chestOpen: uid })
        }
        else if (useGarden.getState().near !== null) tendBed(useGarden.getState().near!)
        else if (g.wildTarget) tryCatch(g.wildTarget)
        else if (g.gatherTarget) gather(g.gatherTarget)
        else g.toast({ title: 'ไม่มีอะไรให้เก็บใกล้ ๆ', body: 'เดินไปใกล้ต้นไม้ กองหิน หรือสัตว์ แล้วกด E (มีป้ายบอกกลางจอ)', tone: 'info' })
      }
      // Ctrl+S = บันทึกเกมทันที
      if (e.code === 'KeyS' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        quickSave()
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
    if (!hasSave) exitToTitle(true)
  }, [hasSave, exitToTitle])
  if (!save) return null

  return (
    <>
      <Canvas
        shadows="soft"
        dpr={[1, 1.5]}
        camera={{ fov: 50, near: 0.1, far: 400 }}
        gl={{ preserveDrawingBuffer: true }}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* แสง ท้องฟ้า หมอก ไฟตะเกียง เปลี่ยนตามเวลาในเกม */}
        <DayLight />
        <Weather />
        <Village playerHouseId={save.home.houseDesignId} playerName={save.player.name} />
        <Villagers />
        <Wildlife />
        <Player />
        <HomeInterior />
        <WaterLife />
        <LayoutDragger />
        <HoldInteract />
        <PartyFollowers />
        <PlayClock />
        <PetBond />
      </Canvas>
      <TimeAlerts />
      <Hud onMenu={() => setMenu(true)} onPause={() => setPauseOpen(true)} onShop={(id) => setShop(id)} />
      {shop && !menu && <ShopWindow shopId={shop} onClose={() => setShop(null)} />}
      {temple && !menu && <TemplePanel onClose={() => setTemple(false)} />}
      <FortuneSlip />
      <CupPicker />
      <StickPopup />
      <MeritPopup />
      <SeedPicker />
      <NoticeBoardWindow />
      <WaterMenu />
      <TouchControls />
      <LayoutEditor />
      <HoldMenu />
      <TalkWindow />
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
      {menu && <GameMenu initialTab={menuTab} onClose={() => setMenu(false)} />}
      <BuildBar />
      {!menu && <ToolBar />}
      <ChestWindow />
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
function StatBar({ icon, label, value, color }: { icon: StatIconId; label: string; value: number; color: string }) {
  return (
    <div className="stat" title={`${label} ${Math.round(value)}/100`}>
      <span className="stat-icon" aria-hidden="true">
        <StatIcon id={icon} size={22} />
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
  const [full, setFull] = useState(false)
  // ปกติเป็นแถบเล็ก ไม่บังวิว · กดเพื่อขยายดูรายละเอียด
  if (!full)
    return (
      <button type="button" className="status-mini" onClick={() => setFull(true)} title="กดเพื่อดูรายละเอียด">
        {(
          [
            ['health', save.stats.health, '#d9534f'],
            ['hunger', save.stats.hunger, '#e0a35c'],
            ['thirst', save.stats.thirst, '#4a90d8'],
            ['fun', save.stats.fun, '#5c9a4a'],
          ] as [StatIconId, number, string][]
        ).map(([ic, v, c]) => (
          <span key={ic} className={'sm-bar' + (v < 25 ? ' low' : '')} title={Math.round(v) + '%'}>
            <i><StatIcon id={ic} size={19} /></i>
            <span className="sm-track">
              <span style={{ width: Math.max(0, Math.min(100, v)) + '%', background: c }} />
            </span>
          </span>
        ))}
        <span className="sm-coins"><StatIcon id="coin" size={17} /> {save.coins.toLocaleString('th-TH')}</span>
        {pops.map((p) => (
          <span key={p.id} className={'money-pop' + (p.amount < 0 ? ' neg' : '')}>
            {p.amount > 0 ? '+' : '−'}
            {Math.abs(p.amount).toLocaleString('th-TH')}
          </span>
        ))}
      </button>
    )
  return (
    <div className="status">
      <div className="status-name">
        {save.player.name}
        <button type="button" className="status-fold" onClick={() => setFull(false)} title="ย่อ">
          ▴ ย่อ
        </button>
      </div>
      <StatBar icon="health" label="ชีวิต" value={save.stats.health} color="#d9534f" />
      <StatBar icon="hunger" label="อิ่ม" value={save.stats.hunger} color="#e0a35c" />
      <StatBar icon="thirst" label="น้ำ" value={save.stats.thirst} color="#4a90d8" />
      <StatBar icon="fun" label="สนุก" value={save.stats.fun} color="#5c9a4a" />
      <div className="money">
        <span aria-hidden="true"><StatIcon id="coin" size={22} /></span>
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
      <AnimalButton />
      <button type="button" className="animal-btn whistle-btn" onClick={whistle} title="ผิวปากเรียกสัตว์ (Q)">
        🎵 ผิวปากเรียกสัตว์ (Q)
      </button>
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

/** นาฬิกาบนแถบด้านบน + ปุ่มเร่งเวลา / ข้ามช่วงเวลา */
function HudClock() {
  const minute = useClock((s) => s.minute)
  const day = useClock((s) => s.day)
  const speed = useClock((s) => s.speed)
  const setSpeed = useClock((s) => s.setSpeed)
  const p = timePeriodAt(minute)
  const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]
  return (
    <>
      <span>วันที่ {day}</span>
      <span className="sep" />
      <WeatherBadge day={day} />
      <span className="sep" />
      <span title={p.mood}>
        {formatClock(minute)} · {p.label}
      </span>
      <button type="button" className="btn small ghost pause-btn" onClick={() => setSpeed(next)} title="เร่งเวลา">
        ⏩ x{speed}
      </button>
      <button type="button" className="btn small ghost pause-btn" onClick={skipToNextPeriod} title="ข้ามไปช่วงเวลาถัดไป">
        ⏭
      </button>
    </>
  )
}

/** ฤดู + สภาพอากาศตอนนี้ (ชี้เพื่อดูรายละเอียด) */
function WeatherBadge({ day }: { day: number }) {
  const kind = useWeather((s) => s.kind)
  const w = WEATHER[kind]
  const se = seasonLabel(day)
  return (
    <span className="wx-badge" title={se.label + ' · ' + w.label + ' — ' + w.note}>
      {w.icon} <small>{w.label}</small>
    </span>
  )
}
if (import.meta.env.DEV) (window as unknown as { __weather: unknown }).__weather = forceWeather

/** ปุ่ม 🐾 เรียกสัตว์ออกมา / เก็บเข้า — สัตว์เลี้ยงตัวแรก + สัตว์ที่จับมาได้ */
function AnimalButton() {
  const save = useGame((s) => s.save)!
  const [open, setOpen] = useState(false)
  const current = save.player.pet
  const same = (a: typeof current, b: typeof current) => !!a && !!b && a.species === b.species && a.name === b.name && a.color === b.color
  const list = [
    ...(save.homePet ? [{ key: 'home', pet: save.homePet, note: 'สัตว์เลี้ยงคู่ใจ' }] : []),
    ...save.collection
      .filter((c) => !same(c.pet, save.homePet))
      .map((c) => ({ key: c.uid, pet: c.pet, note: `จับได้วันที่ ${c.day}` })),
  ]
  return (
    <div className="animal-btn-wrap">
      <button type="button" className="animal-btn" onClick={() => openParty()} aria-expanded={open}>
        🐾 เรียกสัตว์ {list.length > 0 && <span className="gm-badge">{list.length}</span>}
      </button>
      {open && (
        <div className="animal-pop" role="menu">
          {list.length === 0 && <p className="hint">ยังไม่มีสัตว์ — เข้าใกล้สัตว์ที่มีป้ายสีบนหัวแล้วกด E</p>}
          {list.map((it) => {
            const on = same(current, it.pet)
            return (
              <button
                key={it.key}
                type="button"
                role="menuitem"
                className={`animal-pick${on ? ' on' : ''}`}
                onClick={() => {
                  summonPet(on ? null : it.pet)
                  setOpen(false)
                }}
              >
                <strong>
                  {it.pet.name} ({getSpecies(it.pet.species).label})
                </strong>
                <small>{on ? 'เดินตามอยู่ · กดเพื่อเก็บเข้า' : it.note}</small>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** แผงกิจกรรมหน้าพระประธาน: กราบ 3 ครั้ง · แปะทอง · เสี่ยงเซียมซี */
function TemplePanel({ onClose }: { onClose: () => void }) {
  const busy = useTemple((s) => s.busy)
  const bowedAt = useTemple((s) => s.bowedAt)
  const bowed = Date.now() - bowedAt < 10 * 60_000
  return (
    <div className="temple-panel" role="dialog" aria-label="กิจกรรมในโบสถ์">
      <h3>🛕 หน้าพระประธาน</h3>
      <button type="button" className="btn small" disabled={busy} onClick={bowThreeTimes}>
        🙏 กราบพระ 3 ครั้ง
      </button>
      <button type="button" className="btn small" disabled={busy || !bowed} onClick={applyGoldLeaf} title={bowed ? '' : 'กราบพระก่อน'}>
        ✨ แปะทอง
      </button>
      <button type="button" className="btn small" disabled={busy} onClick={drawSiamsi}>
        🎋 เสี่ยงเซียมซี
      </button>
      {!bowed && <small>กราบพระก่อน แล้วจึงแปะทองได้</small>}
      <button type="button" className="btn ghost small" disabled={busy} onClick={onClose}>
        ปิด
      </button>
    </div>
  )
}

/** เลือกเมล็ดที่จะปลูก (มีเมล็ดหลายชนิดในกระเป๋า) */
function SeedPicker() {
  const picking = useGarden((s) => s.picking)
  useGame((s) => s.save?.inventory)
  if (picking === null) return null
  const close = () => useGarden.setState({ picking: null })
  const seeds = seedsInBag()
  return (
    <div className="menu-backdrop" onClick={close}>
      <div className="menu merit-pop" role="dialog" aria-label="เลือกเมล็ดผัก" onClick={(e) => e.stopPropagation()}>
        <h3>🌱 ปลูกอะไรดี?</h3>
        <p className="hint">ปลูกแล้วรดน้ำ ผักจะโตตามเวลาในเกม (โตเฉพาะตอนดินชื้น)</p>
        <div className="chips">
          {seeds.map((c) => (
            <button key={c.id} type="button" className="chip" onClick={() => plant(picking, c.id)}>
              <ItemIcon icon={ITEMS[c.produce].icon} /> {c.name} ×{countOf(c.seed)} · {c.growHours} ชม.
            </button>
          ))}
        </div>
        <button type="button" className="btn ghost small" onClick={close}>
          ปิด
        </button>
      </div>
    </div>
  )
}

/** ทำบุญตามศรัทธา: ตู้ทำบุญ / ค่าธูปเทียน (เลือกจำนวนเอง หรือไม่ให้ก็ได้) · เหรียญวันเกิด */
function MeritPopup() {
  const popup = useMerit((s) => s.popup)
  const coins = useGame((s) => s.save?.coins ?? 0)
  const [custom, setCustom] = useState('')
  if (!popup) return null
  const close = () => useMerit.setState({ popup: null })
  if (popup === 'birthday') {
    return (
      <div className="menu-backdrop" onClick={close}>
        <div className="menu merit-pop" role="dialog" aria-label="หยอดเหรียญวันเกิด" onClick={(e) => e.stopPropagation()}>
          <h3>🪙 หยอดเหรียญประจำวันเกิด (1 บาท)</h3>
          <p className="hint">เลือกวันเกิดของคุณ แล้วรับคำอวยพร</p>
          <div className="day-grid">
            {BIRTH_DAYS.map((d, i) => (
              <button key={d.id} type="button" className="day-btn" style={{ background: d.color }} disabled={coins < 1} onClick={() => birthdayCoin(i)}>
                วัน{d.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn ghost small" onClick={close}>
            ปิด
          </button>
        </div>
      </div>
    )
  }
  const isIncense = popup === 'incense'
  const give = (n: number) => {
    setCustom('')
    if (isIncense) lightIncense(n)
    else donate(n)
  }
  const n = Math.max(0, Math.floor(Number(custom) || 0))
  return (
    <div className="menu-backdrop" onClick={close}>
      <div className="menu merit-pop" role="dialog" aria-label={isIncense ? 'ธูปเทียน' : 'ตู้ทำบุญ'} onClick={(e) => e.stopPropagation()}>
        <h3>{isIncense ? '🕯️ ธูปเทียน — ทำบุญตามศรัทธา' : '🙏 ตู้ทำบุญ — ตามศรัทธา'}</h3>
        <p className="hint">ให้กี่บาทก็ได้ หรือไม่ให้ก็ได้ · มีเงิน {coins.toLocaleString('th-TH')} บาท</p>
        <div className="chips">
          {[0, 1, 5, 10, 20, 50].map((v) => (
            <button key={v} type="button" className="chip" disabled={v > coins} onClick={() => give(v)}>
              {v === 0 ? 'ไม่ให้ (ไหว้ด้วยใจ)' : `${v} บาท`}
            </button>
          ))}
        </div>
        <div className="merit-custom">
          <input type="number" min={0} max={coins} placeholder="จำนวนเอง" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <button type="button" className="btn small" disabled={n > coins} onClick={() => give(n)}>
            ให้ {n} บาท
          </button>
        </div>
        <button type="button" className="btn ghost small" onClick={close}>
          ปิด
        </button>
      </div>
    </div>
  )
}

/** ใบเซียมซีที่หยิบจากตู้หน้าโบสถ์ */
function FortuneSlip() {
  const f = useTemple((s) => s.fortune)
  const close = useTemple((s) => s.closeFortune)
  if (!f) return null
  return (
    <div className="menu-backdrop" onClick={close}>
      <div className="fortune-wrap" role="dialog" aria-label="ใบเซียมซี" onClick={(e) => e.stopPropagation()}>
        <FortuneCard f={f} />
        <p className="hint" style={{ color: '#fff8ea', textAlign: 'center' }}>เก็บไว้ในสมุดเซียมซีแล้ว (เมนู → สมุดเซียมซี)</p>
        <button type="button" className="btn small" onClick={close}>
          🙏 สาธุ
        </button>
      </div>
    </div>
  )
}

/** เลือกกระบอกเซียมซี 3 กระบอก */
function CupPicker() {
  const open = useTemple((s) => s.cupPick)
  if (!open) return null
  const close = () => useTemple.setState({ cupPick: false })
  return (
    <div className="menu-backdrop" onClick={close}>
      <div className="menu cup-pick" role="dialog" aria-label="เลือกกระบอกเซียมซี" onClick={(e) => e.stopPropagation()}>
        <h3>🎋 ตั้งจิตอธิษฐาน แล้วเลือกกระบอก</h3>
        <p className="hint">ถามคำถามในใจ · เขย่าจนไม้หล่นออกมา 1 อัน · เสี่ยงได้วันละ 1 ครั้ง</p>
        <div className="cups">
          {CUPS.map((c) => (
            <button key={c.id} type="button" className="cup-btn" onClick={() => drawFromCup(c.id)}>
              <span className="cup-art" aria-hidden="true">
                <span className="cup-sticks" />
                <span className="cup-body" />
              </span>
              <strong>{c.name}</strong>
              <small>เลข 1–{STICKS_PER_CUP}</small>
            </button>
          ))}
        </div>
        <button type="button" className="btn ghost small" onClick={close}>
          ปิด
        </button>
      </div>
    </div>
  )
}

/** ไม้เซียมซีที่หล่นออกมา */
function StickPopup() {
  const st = useTemple((s) => s.stick)
  if (!st) return null
  const close = () => useTemple.setState({ stick: null })
  return (
    <div className="menu-backdrop" onClick={close}>
      <div className="menu stick-pop" role="dialog" aria-label="ไม้เซียมซี" onClick={(e) => e.stopPropagation()}>
        <div className="stick-art" aria-hidden="true">
          <span>{st.no}</span>
        </div>
        <h3>ไม้เซียมซีหล่นออกมาแล้ว!</h3>
        <p>
          กระบอก <strong>{CUPS[st.cup].name}</strong> · เลขที่ <strong>{st.no}</strong>
        </p>
        <p className="hint">เดินออกไปหยิบใบคำทำนายที่ตรงกับเลขนี้ ที่ตู้ใบเซียมซีหน้าโบสถ์ (ลานด้านขวา)</p>
        <button type="button" className="btn small" onClick={close}>
          🙏 รับทราบ
        </button>
      </div>
    </div>
  )
}

/** ขี่ / ลงจากสัตว์เลี้ยงตัวใหญ่ (ควาย วัว) */
function toggleRide() {
  const g = useGame.getState()
  const pet = g.save?.player.pet
  if (g.riding) {
    g.setRiding(false)
    g.toast({ title: 'ลงจากหลัง' + (pet?.name ?? 'สัตว์') + 'แล้ว', tone: 'info' })
    return
  }
  if (!pet) return
  if (!RIDEABLE[pet.species]) {
    g.toast({ title: `${getSpecies(pet.species).label}ตัวเล็กเกินไป ขี่ไม่ได้`, body: 'ขี่ได้เฉพาะสัตว์ตัวใหญ่ เช่น ควาย วัว (เรียกออกมาด้วยปุ่ม 🐾)', tone: 'info' })
    return
  }
  if (useMerit.getState().inside) {
    g.toast({ title: 'ห้ามขี่สัตว์ขึ้นโบสถ์นะ', tone: 'warn' })
    return
  }
  g.setRiding(true)
  if (g.save?.petLeashed) g.setPetLeashed(false)
  g.toast({ title: `🐃 ขี่${pet.name}แล้ว`, body: 'เดินเร็วขึ้น · กด R อีกครั้งเพื่อลง', tone: 'success' })
}

/** บันทึกเกมทันที (Ctrl+S หรือกดป้าย "บันทึก" มุมบน) */
function quickSave() {
  const g = useGame.getState()
  const ok = g.saveNow('manual')
  g.toast(ok ? { title: '💾 บันทึกเกมแล้ว', tone: 'success' } : { title: 'บันทึกไม่สำเร็จ', body: 'ลองอีกครั้ง หรือดูที่ เมนู → บันทึก', tone: 'warn' })
}

/** ถ่ายภาพฉากในเกม (เฉพาะภาพ 3D ไม่ติดแถบสถานะ) */
function snapWorld() {
  const canvas = document.querySelector<HTMLCanvasElement>('.screen canvas')
  takePhoto(canvas, 'baan-paiboon')
  useGame.getState().toast({ title: '📷 ถ่ายภาพแล้ว', body: 'บันทึกเป็นไฟล์รูปในเครื่อง (โฟลเดอร์ดาวน์โหลด)', tone: 'info' })
}

function Hud({ onMenu, onPause, onShop }: { onMenu: () => void; onPause: () => void; onShop: (id: string) => void }) {
  const gatherTarget = useGame((s) => s.gatherTarget)
  const wildTarget = useGame((s) => s.wildTarget)
  const nearWorship = useGame((s) => s.nearWorship)
  const meritSpot = useMerit((s) => s.spot)
  const bedNear = useGarden((s) => s.near)
  const usableNear = useBuild((s) => s.near)
  const chestNear = useChests((s) => s.near)
  const toyNear = usePlay((s) => s.near)
  const homeNear = useInterior((s) => s.near)
  const waterNear = useWater((s) => s.near)
  const playing = usePlay((s) => s.playing)
  useGame((s) => s.save?.chestsOpened)
  const building = useBuild((s) => s.active)
  const garden = useGame((s) => s.save?.garden)
  useClock((s) => s.minute)
  const shoesOff = useMerit((s) => s.shoesOff)
  const npcNear = useTalk((s) => s.near)
  const talking = useTalk((s) => s.talking)
  const save = useGame((s) => s.save)!
  const nearby = useGame((s) => s.nearbyPlaceId)
  const toasts = useGame((s) => s.toasts)
  const dismiss = useGame((s) => s.dismissToast)

  const place = nearby && !nearby.startsWith('plot:') ? PLACES.find((p) => p.id === nearby) : null
  const plot = nearby?.startsWith('plot:') ? PLOTS.find((p) => 'plot:' + p.id === nearby) : null
  const locationName = place?.name ?? (plot ? `บ้านของ${save.player.name}` : 'หมู่บ้านไพบูลย์')
  // การ์ดคำอธิบายสถานที่: โผล่ตอนเพิ่งมาถึง แล้วซ่อนเอง ให้หน้าจอเป็นของเกม
  const [cardFresh, setCardFresh] = useState(true)
  useEffect(() => {
    setCardFresh(true)
    const t = window.setTimeout(() => setCardFresh(false), 5000)
    return () => window.clearTimeout(t)
  }, [nearby])

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
          <HudClock />
          <span className="sep" />
          <SaveIndicator />
          <BookButton />
          <FriendsButton />
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

      {place && cardFresh && (
        <div className="interact">
          <h3>{place.name}</h3>
          {place.arriveText && <p>{place.arriveText}</p>}
          {isShop(place.id) ? (
            <button className="btn small" onClick={() => onShop(place.id)}>
              {SHOPS[place.id].icon} เข้าร้าน (E)
            </button>
          ) : isBoard(place.id) ? (
            <button className="btn small" onClick={() => openBoard(place.id as Parameters<typeof openBoard>[0])}>
              📌 อ่านประกาศ (E)
            </button>
          ) : (
            place.comingSoon && <div className="soon">เร็ว ๆ นี้: {place.comingSoon}</div>
          )}
        </div>
      )}
      {place && !cardFresh && (isShop(place.id) || isBoard(place.id)) && (
        <div className="gather-hint">
          <kbd>E</kbd> {isShop(place.id) ? `${SHOPS[place.id].icon} เข้าร้าน` : '📌 อ่านประกาศ'}
        </div>
      )}
      {nearWorship && (
        <div className="gather-hint">
          <kbd>E</kbd> 🙏 กราบพระ · แปะทอง · เสี่ยงเซียมซี
        </div>
      )}
      {!nearWorship && npcNear && !talking && (
        <div className="gather-hint">
          <kbd>E</kbd> 💬 คุยกับ{NPC_INFO[npcNear]?.name ?? 'ชาวบ้าน'}
        </div>
      )}
      {!nearWorship && !npcNear && meritSpot && (
        <div className="gather-hint">
          <kbd>E</kbd>{' '}
          {meritSpot === 'donate'
            ? '🙏 หยอดตู้ทำบุญ'
            : meritSpot === 'birthday'
              ? '🪙 หยอดเหรียญวันเกิด'
              : meritSpot === 'incense'
                ? '🕯️ จุดธูปเทียนบูชา'
                : meritSpot === 'water'
                  ? '💧 กรวดน้ำ'
                  : meritSpot === 'slips'
                  ? '📜 หยิบใบคำทำนายเซียมซี'
                  : meritSpot === 'shoes'
                  ? shoesOff
                    ? '👟 ใส่รองเท้า'
                    : '👣 ถอดรองเท้า'
                  : '🔔 ตีระฆัง'}
        </div>
      )}
      {homeNear && (
        <div className="gather-hint">
          <kbd>E</kbd> {homeNear === 'enter' ? '🏡 เข้าบ้านตารัง–ยายเลียน' : homeNear.startsWith('enter:') ? '🚪 เปิดประตูเข้า' + (PLACES.find((p) => 'enter:' + p.id === homeNear)?.name ?? 'บ้าน') : homeSpotLabel(homeNear)}
        </div>
      )}
      {!building && toyNear && (
        <div className="gather-hint">{playing ? `😄 กำลังเล่น${playing.spot.name} · เดินเพื่อเลิกเล่น` : <><kbd>E</kbd> {toyHint(toyNear)}</>}</div>
      )}
      {!building && !toyNear && !nearWorship && !npcNear && !meritSpot && waterNear && (
        <div className="gather-hint">
          <kbd>E</kbd> {waterHint(waterNear)}
        </div>
      )}
      <SwimBar />
      {!building && !toyNear && !nearWorship && !npcNear && !meritSpot && !waterNear && chestNear && (
        <div className="gather-hint">
          <kbd>E</kbd> {chestHint(chestNear)}
        </div>
      )}
      {!building && !nearWorship && !npcNear && !meritSpot && !chestNear && usableNear && (
        <div className="gather-hint">
          <kbd>E</kbd> {(() => {
            const st = save.structures.find((s) => s.uid === usableNear)
            if (!st) return ''
            return STRUCTURES[st.id].use === 'craft' ? '🛠️ ประดิษฐ์ของที่โต๊ะ' : '📦 เปิดกล่องเก็บของ'
          })()}
        </div>
      )}
      {!nearWorship && !npcNear && !meritSpot && !usableNear && bedNear !== null && garden && (
        <div className="gather-hint">
          <kbd>E</kbd> {bedHint(bedNear)}
        </div>
      )}
      {!nearWorship && !npcNear && !meritSpot && bedNear === null && wildTarget && (
        <div className="gather-hint wild">
          <span className="tier-dot" style={{ background: TIERS[tierOf(wildTarget)].color }} />
          <kbd>E</kbd> {catchHint(wildTarget)}
          <small> · ระดับ{TIERS[tierOf(wildTarget)].label}</small>
        </div>
      )}
      {!nearWorship && !npcNear && !meritSpot && bedNear === null && !wildTarget && gatherTarget && (
        <div className="gather-hint">
          <kbd>E</kbd> {gatherHint(gatherTarget).replace('กด E — ', '')}
        </div>
      )}
      {plot && !building && cardFresh && (
        <div className="interact">
          <h3>ที่ดินของคุณ</h3>
          <p>รั้วไม้ไผ่คือขอบเขตที่ดิน · แปลงผัก 8 แปลงหน้าบ้าน (กด E ที่แปลง) · กด <kbd>B</kbd> เพื่อสร้างโต๊ะประดิษฐ์ กล่องเก็บของ รั้ว โรงเก็บของ คอกสัตว์</p>
          <div className="soon">เร็ว ๆ นี้: ซื้อที่ดินเพิ่มและต่อเติมบ้าน</div>
        </div>
      )}

      <HelpButton />
      <PetPicker />
      <PetPartyWindow />
      <FriendsWindow />
      <PetCard />
      <FloatingHistory />
      <GameBook />
      <InvitePopup />
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
    <button
      type="button"
      className={`save-ind ${status === 'error' ? 'err' : dirty ? 'dirty' : 'ok'}`}
      title={`กดเพื่อบันทึกเกมทันที (Ctrl+S) · ${cloudText[cloud]}`}
      onClick={quickSave}
    >
      💾 {text}
    </button>
  )
}

/** สัตว์ที่เรียกออกมาเดินตาม (สูงสุด 3 ตัว แต่ละตัวมีตำแหน่งในขบวนและบุคลิกของตัวเอง) */
function PartyFollowers() {
  // อ่านเฉพาะทีมสัตว์ (ไม่วาดสัตว์ใหม่ทุกครั้งที่ตำแหน่งผู้เล่นถูกบันทึก)
  useGame((s) => s.save?.activePets)
  useGame((s) => s.save?.collection)
  useGame((s) => s.save?.homePet)
  useGame((s) => s.save?.player.pet)
  const save = useGame.getState().save
  if (!save) return null
  const keys = activeKeys()
  return (
    <>
      {keys.map((k, i) => {
        const o = petOf(k)
        if (!o) return null
        return <PetFollower key={k + o.pet.color + o.pet.name} pet={o.pet} start={save.position} slot={i} mood={moodOf(k, o.pet)} />
      })}
    </>
  )
}
