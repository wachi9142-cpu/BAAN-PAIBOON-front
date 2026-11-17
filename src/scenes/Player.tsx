import { playerPose } from '../game/playerPose'
import { useWater, waterRt } from '../game/water'
import { findWaterSpot, waterTick, type WaterFx } from '../game/waterTick'
import { FLOOR2, interiorCameraBox, interiorColliders, interiorGround, INTERIOR_ORIGIN, isInterior, outsideDoor, useInterior } from '../game/interior'
import { findHomeSpot, warp } from '../game/homeActions'
import { findToy, playPose, stopPlay, usePlay } from '../game/play'
import { findChest, useChests } from '../game/treasure'
import { wandCast } from '../game/wand'
import { TextSprite } from './TextSprite'
import { hitTree, IMPACT, pickupNear, swing, tendTree, useTools } from '../game/trees'
import { TREES } from '../game/content/village'
import { findUsable, useBuild } from '../game/building'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import { saveOnUnload, useGame } from '../game/store'
import { useSettings } from '../game/settings'
import { AGE_RULES, CANE_WALK } from '../game/content/appearance'
import { buildColliders, resolveMove } from '../game/collision'
import { PLACES, PLOTS } from '../game/content/village'
import { Character, JUMP_CROUCH, JUMP_LAND } from './models/Character'
import { findGatherTarget } from '../game/inventory'
import { findBed, useGarden } from '../game/garden'
import { insideTempleBox, TEMPLE, templeSpots, WORSHIP_SPOT, templeGroundY } from '../game/content/temple'
import { autoShoes, leaveTemple, useMerit } from '../game/templeActions'
import { RIDEABLE } from '../game/content/pets'
import { PET_ANCHORS } from './models/PetOutfit'
import { petScale } from './models/Pet'
import type { SaveData } from '../game/store'
import { Aura } from './Aura'

const SPOTS = templeSpots()

/** ความสูงหลังสัตว์ที่ขี่ ลบความสูงสะโพกผู้เล่น (ให้นั่งพอดีหลัง) */
function rideHeight(save: SaveData) {
  const pet = save.player.pet
  if (!pet) return 0
  const a = PET_ANCHORS[pet.species]
  const back = (a.body[0] + a.bodyW * 0.45) * petScale(pet)
  const age = AGE_RULES[save.player.appearance.age ?? 'adult']
  return Math.max(0, back - 0.82 * age.legScale * age.bodyScale * 0.92)
}

/** เก็บปุ่มที่กดค้าง (ใช้ e.code จึงใช้ได้แม้คีย์บอร์ดเป็นภาษาไทย) */
/** คำขอกระโดดล่าสุด (กด Enter) */
const jumpReq = { at: -1e9 }
/** กระโดด: ทั้งหมด 0.8 วิ (ย่อตัว → ลอย → ลงพื้นรับแรง) สูงสุด 0.85 ม. · ลอยอยู่ = ข้ามรั้ว/สิ่งกีดขวางเตี้ยได้ */
const JUMP_DUR = 0.8
const JUMP_H = 0.85

function useKeys() {
  const keys = useRef(new Set<string>())
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      // Enter = กระโดด (กันไม่ให้ไปกดปุ่มบนจอที่โฟกัสค้างอยู่)
      if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        if (document.querySelector('.menu-backdrop')) return
        e.preventDefault()
        if (!e.repeat) jumpReq.at = performance.now()
        return
      }
      keys.current.add(e.code)
    }
    const up = (e: KeyboardEvent) => keys.current.delete(e.code)
    const clear = () => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', clear)
    }
  }, [])
  return keys
}

/** มุมกล้อง: ลากเมาส์เพื่อหมุน, ล้อเมาส์เพื่อซูม */
function useOrbit() {
  const gl = useThree((s) => s.gl)
  const orbit = useRef({ yaw: Math.PI, pitch: 0.42, dist: 9 })
  useEffect(() => {
    const el = gl.domElement
    let dragging = false
    let lx = 0
    let ly = 0
    const down = (e: PointerEvent) => {
      dragging = true
      lx = e.clientX
      ly = e.clientY
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const s = useSettings.getState().mouseSensitivity
      orbit.current.yaw -= (e.clientX - lx) * 0.006 * s
      orbit.current.pitch = Math.min(1.2, Math.max(0.12, orbit.current.pitch + (e.clientY - ly) * 0.004 * s))
      lx = e.clientX
      ly = e.clientY
    }
    const up = () => (dragging = false)
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      orbit.current.dist = Math.min(22, Math.max(4, orbit.current.dist + e.deltaY * 0.01))
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [gl])
  return orbit
}

/** ตำแหน่งผู้เล่นล่าสุด (อัปเดตทุกเฟรม) ให้สัตว์เลี้ยงและระบบอื่นอ่านได้โดยไม่ต้อง re-render */

const WALK = 4.2
const RUN = 8

export function Player() {
  const save = useGame((s) => s.save)!
  const updatePosition = useGame((s) => s.updatePosition)
  const discoverPlace = useGame((s) => s.discoverPlace)
  const setNearby = useGame((s) => s.setNearby)
  const setGatherTarget = useGame((s) => s.setGatherTarget)
  const setNearWorship = useGame((s) => s.setNearWorship)
  const wasInTemple = useRef(false)
  const barefoot = useMerit((s) => s.shoesOff)
  const riding = useGame((s) => s.riding)
  const equipped = useTools((s) => s.equipped)
  const wandGem = useGame((s) => s.save?.wandGem) ?? 'purple'
  const gesture = useGame((s) => s.gesture)
  const wMode = useWater((s) => s.mode)
  const vest = useWater((s) => s.vest)
  const wPose = wMode === 'swim' || wMode === 'rescue' ? 'swim' : wMode === 'struggle' ? 'struggle' : wMode === 'boat' ? 'paddle' : null
  const wfx = useRef<WaterFx>({ sink: 0, tilt: 0, speedK: 1, canRun: true })
  const tilt = useRef(0)
  const jumpT = useRef(-1)
  const baseY = useRef(0)
  const toast = useGame((s) => s.toast)

  const keys = useKeys()
  const orbit = useOrbit()
  const root = useRef<Group>(null)
  const motion = useRef(0)
  const pos = useRef<[number, number]>([...save.position])
  const heading = useRef(save.heading)
  const lastSave = useRef(0)
  const lastNearCheck = useRef(0)
  const camTarget = useMemo(() => new Vector3(), [])
  const camPos = useMemo(() => new Vector3(), [])

  const colliders = useMemo(() => buildColliders(save.home.houseDesignId, save.structures), [save.home.houseDesignId, save.structures])
  const homeCol = useMemo(() => ({ low: interiorColliders(false), up: interiorColliders(true) }), [])
  // โหลดเซฟตอนอยู่ในบ้าน → อยู่ในบ้านต่อ
  useEffect(() => {
    useInterior.setState({ inside: isInterior(save.position[0], save.position[1]) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ทดสอบตอนพัฒนา: window.__dev.warp(x, z) · window.__dev.water() ดูสถานะน้ำ
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { __dev: unknown }).__dev = {
      warp: (x: number, z: number, h = 0) => (warp.pending = { x, z, heading: h, y: 0 }),
      water: () => ({ ...useWater.getState(), depth: waterRt.depth, pos: [...pos.current], jumpT: jumpT.current, y: root.current?.position.y, gesture: useGame.getState().gesture, riding: useGame.getState().riding, play: !!playPose(performance.now()) }),
      useWater,
    }
  }, [])

  // เริ่มกล้องด้านหลังตัวละคร
  useEffect(() => {
    orbit.current.yaw = save.heading + Math.PI
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((state, rawDt) => {
    if (useGame.getState().paused) return
    const dt = Math.min(rawDt, 0.05)
    const k = keys.current
    const f = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0)
    const r = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0)
    const running = (k.has('ShiftLeft') || k.has('ShiftRight')) && wfx.current.canRun

    // ทิศทางอิงมุมกล้อง: กล้องอยู่ที่ yaw มองเข้าหาตัวละคร
    const yaw = orbit.current.yaw
    const fx = -Math.sin(yaw)
    const fz = -Math.cos(yaw)
    const rx = -fz
    const rz = fx
    let mx = fx * f + rx * r
    let mz = fz * f + rz * r
    const len = Math.hypot(mx, mz)
    // วาร์ปเข้า/ออกบ้าน
    if (warp.pending) {
      const w = warp.pending
      warp.pending = null
      pos.current = [w.x, w.z]
      heading.current = w.heading
      orbit.current.yaw = w.heading + Math.PI
      // ในบ้าน: มองจากด้านบน (บ้านตุ๊กตา) · ออกนอกบ้าน: มุมปกติ
      orbit.current.pitch = useInterior.getState().inside ? 1.05 : 0.42
      orbit.current.dist = useInterior.getState().inside ? 8 : 9
      if (root.current) root.current.position.set(w.x, w.y, w.z)
      baseY.current = w.y
      state.camera.position.set(w.x, 2, w.z + 3)
    }
    const prevP: [number, number] = [pos.current[0], pos.current[1]]
    // กระโดด: เฉพาะบนบก/น้ำตื้น ไม่ได้ขี่สัตว์ ไม่ได้อยู่ในบ้าน ไม่ได้เล่นเครื่องเล่น
    if (performance.now() - jumpReq.at < 400 && jumpT.current < 0) {
      jumpReq.at = -1e9
      const wm = useWater.getState().mode
      const g0 = useGame.getState()
      if ((wm === 'land' || wm === 'wade') && !g0.riding && !useInterior.getState().inside && !playPose(performance.now()) && !g0.gesture) {
        jumpT.current = 0
      }
    }
    if (jumpT.current >= 0) {
      const before = jumpT.current
      jumpT.current += dt / JUMP_DUR
      // เสียงตอนดีดตัวขึ้น และตอนเท้าแตะพื้น
      if (before < JUMP_CROUCH && jumpT.current >= JUMP_CROUCH) playJump()
      if (before < JUMP_LAND && jumpT.current >= JUMP_LAND) playLand()
      if (jumpT.current >= 1) jumpT.current = -1
    }
    // สัดส่วนช่วงลอยตัว 0..1 (-1 = ไม่ได้ลอย)
    const airP = jumpT.current >= JUMP_CROUCH && jumpT.current < JUMP_LAND ? (jumpT.current - JUMP_CROUCH) / (JUMP_LAND - JUMP_CROUCH) : -1
    const airborne = airP > 0.06 && airP < 0.94
    // กำลังเล่นเครื่องเล่น: เดินเพื่อเลิกเล่น
    let pp = playPose(performance.now())
    if (pp && len > 0) {
      stopPlay()
      pp = null
    }
    if (pp) {
      pos.current = [pp.x, pp.z]
      heading.current = pp.heading
    }

    // ยิงลำแสงจากคฑา: ยืนนิ่ง หันไปชี้ที่สัตว์
    wandCast.aiming = performance.now() < wandCast.until
    if (wandCast.aiming) {
      const want = Math.atan2(wandCast.x - pos.current[0], wandCast.z - pos.current[1])
      let diff = want - heading.current
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      heading.current += diff * Math.min(1, dt * 12)
      mx = 0
      mz = 0
    }
    // กำลังฟันต้นไม้: ยืนนิ่ง หันหน้าเข้าหาต้นไม้ เดินแล้วยกเลิก
    if (swing.current >= 0) {
      if (len > 0 && swing.current > IMPACT) {
        swing.current = -1
        swing.queued = false
      } else {
        const tr = TREES[swing.tree]
        const want = Math.atan2(tr.pos[0] - pos.current[0], tr.pos[1] - pos.current[1])
        let diff = want - heading.current
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        heading.current += diff * Math.min(1, dt * 14)
        swing.current += dt / swing.dur
        if (!swing.hit && swing.current >= IMPACT) {
          swing.hit = true
          hitTree(swing.tree, Math.atan2(pos.current[0] - tr.pos[0], pos.current[1] - tr.pos[1]))
        }
        if (swing.current >= 1) {
          swing.current = -1
          if (swing.queued) {
            swing.queued = false
            tendTree(swing.tree)
          }
        }
        mx = 0
        mz = 0
      }
    }
    if (len > 0 && swing.current < 0 && !wandCast.aiming && !pp && !waterRt.rescue) {
      mx /= len
      mz /= len
      const age = AGE_RULES[save.player.appearance.age ?? 'adult']
      const look = save.player.appearance
      const caneK = look.age === 'elder' && look.cane && look.cane !== 'none' ? CANE_WALK : 1
      // ขี่สัตว์: ใช้ความเร็วของสัตว์ (ไม่นับไม้เท้า/วัย)
      const ride = useGame.getState().riding ? RIDEABLE[save.player.pet?.species ?? 'dog'] : undefined
      const speed = ride ? (running ? RUN * 1.2 : WALK * ride.speed) : (running ? RUN * age.runSpeed : WALK * age.walkSpeed) * caneK * wfx.current.speedK
      const insideNow = useInterior.getState().inside
      const upperNow = (root.current?.position.y ?? 0) > FLOOR2 * 0.5
      pos.current = resolveMove([pos.current[0] + mx * speed * dt, pos.current[1] + mz * speed * dt], insideNow ? (upperNow ? homeCol.up : homeCol.low) : colliders, !insideNow, airborne && !insideTempleBox(pos.current[0], pos.current[1]))
      const target = Math.atan2(mx, mz)
      let diff = target - heading.current
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      heading.current += diff * Math.min(1, dt * 12)
      motion.current = running ? 2 : 1
    } else {
      motion.current = 0
      // ทำท่าในโบสถ์ (กราบ แปะทอง เขย่าเซียมซี): หันหน้าเข้าหาพระประธาน
      const gst = useGame.getState().gesture
      if (gst && gst !== 'wai' && useGame.getState().nearWorship) {
        let diff = Math.PI - heading.current
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        heading.current += diff * Math.min(1, dt * 6)
      }
    }

    // น้ำ: ลุย/ว่าย/พายเรือ/ถูกช่วยลากเข้าฝั่ง (อาจขยับตำแหน่ง)
    const wf = waterTick(
      pos.current,
      prevP,
      dt,
      len > 0 && !pp,
      running,
      useInterior.getState().inside || !!useGame.getState().riding || !!pp,
      AGE_RULES[save.player.appearance.age ?? 'adult'].bodyScale,
    )
    wfx.current = wf
    if (wf.face !== undefined) {
      let diff = wf.face - heading.current
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      heading.current += diff * Math.min(1, dt * 6)
    }
    tilt.current += (wf.tilt - tilt.current) * Math.min(1, dt * 5)
    const [x, z] = pos.current
    if (root.current) {
      // ขึ้นบันได/ยืนบนพื้นโบสถ์ (ค่อย ๆ ขยับความสูงให้นุ่ม)
      const inHome = useInterior.getState().inside
      const gy = inHome ? interiorGround(x - INTERIOR_ORIGIN[0], z - INTERIOR_ORIGIN[1], root.current.position.y) : templeGroundY(x, z)
      // ขี่อยู่: ยกตัวขึ้นนั่งบนหลังสัตว์
      const rideY = useGame.getState().riding ? rideHeight(save) : 0
      const jp = airP >= 0 ? 4 * JUMP_H * airP * (1 - airP) : 0
      const targetY = gy + rideY + wf.sink
      if (pp) {
        root.current.position.set(x, gy + pp.y, z)
        root.current.rotation.order = 'XYZ'
        root.current.rotation.set(pp.tilt, heading.current, 0)
      } else {
        baseY.current += (targetY - baseY.current) * Math.min(1, dt * 12)
        root.current.position.set(x, baseY.current + jp, z)
        // เอียงตัวไปข้างหน้าตามทิศที่หัน (ว่ายน้ำ)
        root.current.rotation.order = 'YXZ'
        root.current.rotation.set(tilt.current, heading.current, 0)
      }
    }
    playerPose.x = x
    playerPose.z = z
    playerPose.heading = heading.current
    playerPose.motion = motion.current

    // กล้องตาม
    const { pitch, dist } = orbit.current
    const eye = 1.5 * AGE_RULES[save.player.appearance.age ?? 'adult'].bodyScale
    camTarget.set(x, eye + (root.current?.position.y ?? 0), z)
    camPos.set(
      x + Math.sin(yaw) * Math.cos(pitch) * dist,
      eye + Math.sin(pitch) * dist,
      z + Math.cos(yaw) * Math.cos(pitch) * dist,
    )
    // อยู่ในโบสถ์: กล้องไม่ทะลุผนังออกไปข้างนอก
    const box = insideTempleBox(x, z)
    if (box) {
      camPos.x = Math.max(box.minX, Math.min(box.maxX, camPos.x))
      camPos.z = Math.max(box.minZ, Math.min(box.maxZ, camPos.z))
      camPos.y = Math.min(camPos.y, TEMPLE.floorY + TEMPLE.wallH - 0.3)
    }
    camPos.y += root.current?.position.y ?? 0
    // ในบ้าน: กล้องไม่ทะลุผนัง/เพดาน
    if (useInterior.getState().inside) {
      const ib = interiorCameraBox((root.current?.position.y ?? 0) > FLOOR2 * 0.5)
      camPos.x = Math.max(ib.minX, Math.min(ib.maxX, camPos.x))
      camPos.z = Math.max(ib.minZ, Math.min(ib.maxZ, camPos.z))
      camPos.y = Math.min(camPos.y, ib.maxY)
    }
    state.camera.position.lerp(camPos, 1 - Math.exp(-dt * 10))
    state.camera.lookAt(camTarget)

    const t = state.clock.elapsedTime

    // ตรวจสถานที่ใกล้เคียง (5 ครั้ง/วินาที)
    if (t - lastNearCheck.current > 0.2) {
      lastNearCheck.current = t
      let near: string | null = null
      let best = Infinity
      for (const p of PLACES) {
        const d = Math.hypot(x - p.pos[0], z - p.pos[1])
        const reach = Math.max(p.size[0], p.size[1]) / 2 + 3
        if (d < reach && d < best) {
          best = d
          near = p.id
        }
      }
      for (const p of PLOTS) {
        if (Math.abs(x - p.center[0]) < p.size[0] / 2 && Math.abs(z - p.center[1]) < p.size[1] / 2) near = 'plot:' + p.id
      }
      setNearby(near)
      setGatherTarget(findGatherTarget(x, z))
      pickupNear(x, z)
      // ประตูบ้านตารัง–ยายเลียน / ของในบ้าน
      const ins = useInterior.getState()
      let hn: string | null = null
      if (ins.inside) hn = findHomeSpot(x, z, root.current?.position.y ?? 0)
      else {
        const [dx, dz] = outsideDoor()
        if (Math.hypot(dx - x, dz - z) < 1.8) hn = 'enter'
      }
      if (ins.near !== hn) useInterior.setState({ near: hn })
      const up = ins.inside && (root.current?.position.y ?? 0) > FLOOR2 * 0.5
      if (ins.upper !== up) useInterior.setState({ upper: up })
      const ws = ins.inside ? null : findWaterSpot(x, z)
      if (useWater.getState().near !== ws) useWater.setState({ near: ws })
      const toy = findToy(x, z)
      if (usePlay.getState().near !== toy) usePlay.setState({ near: toy })
      const chest = findChest(x, z)
      if (useChests.getState().near !== chest) useChests.setState({ near: chest })
      const bed = findBed(x, z)
      if (useGarden.getState().near !== bed) useGarden.setState({ near: bed })
      const usable = findUsable(x, z)
      if (useBuild.getState().near !== usable) useBuild.setState({ near: usable })
      setNearWorship(Math.hypot(x - WORSHIP_SPOT[0], z - WORSHIP_SPOT[1]) < 2.6)
      // จุดทำบุญรอบโบสถ์ / อยู่ในโบสถ์ (ถอดรองเท้า) / เดินออกจากวัด
      let spot: string | null = null
      let sd = 1.9
      for (const sp of SPOTS) {
        const d = Math.hypot(sp.x - x, sp.z - z)
        if (d < sd) {
          sd = d
          spot = sp.id
        }
      }
      // ขึ้นบันได = ถอดรองเท้าไว้ที่ลานถอดรองเท้า (ลงมาแล้วใส่กลับ)
      const inside = templeGroundY(x, z) > 0.05
      const m = useMerit.getState()
      if (m.spot !== spot || m.inside !== inside) useMerit.setState({ spot, inside })
      const inArea = Math.hypot(x - TEMPLE.pos[0], z - TEMPLE.pos[1]) < 24
      autoShoes(inside, inArea)
      if (wasInTemple.current && !inArea) leaveTemple()
      wasInTemple.current = inArea
      if (near && !near.startsWith('plot:') && discoverPlace(near)) {
        const place = PLACES.find((p) => p.id === near)!
        toast({ title: `ค้นพบสถานที่ใหม่: ${place.name}`, body: place.arriveText, tone: 'discover' })
      }
      if (near?.startsWith('plot:') && discoverPlace(near)) {
        toast({ title: 'ถึงบ้านแล้ว', body: 'ที่ดินผืนนี้เป็นของคุณ รั้วไม้ไผ่คือขอบเขตที่ดิน', tone: 'success' })
      }
    }

    // บันทึกตำแหน่งทุก 3 วินาที
    if (t - lastSave.current > 3) {
      lastSave.current = t
      updatePosition([x, z], heading.current)
    }
  })

  // ลงทะเบียนให้ store ดึงตำแหน่งล่าสุดได้ตอนกดบันทึก/ออกจากเกม และบันทึกตอนปิดแท็บ
  useEffect(() => {
    const flush = () => updatePosition([...pos.current], heading.current)
    useGame.getState().setFlushWorld(flush)
    const onUnload = (e: BeforeUnloadEvent) => {
      // บันทึกก่อนปิดแท็บ ถ้าไม่สำเร็จให้เบราว์เซอร์ถามยืนยันก่อนออก
      if (!saveOnUnload()) e.preventDefault()
    }
    window.addEventListener('beforeunload', onUnload)
    return () => {
      flush()
      window.removeEventListener('beforeunload', onUnload)
      if (useGame.getState().flushWorld === flush) useGame.getState().setFlushWorld(null)
    }
  }, [updatePosition])

  return (
    // ตำแหน่งตั้งทุกเฟรมใน useFrame (ไม่ผูกกับ prop ไม่งั้นตอนบันทึกตำแหน่งทุก 3 วิ ตัวจะกระตุกกลับพื้น)
    <group ref={root}>
      <Character
        appearance={riding ? { ...save.player.appearance, pose: 'ride' } : wPose ? { ...save.player.appearance, pose: wPose } : gesture ? { ...save.player.appearance, pose: gesture } : save.player.appearance}
        motion={motion}
        barefoot={barefoot}
        tool={gesture === 'shake' ? 'siamsi' : riding || wPose || gesture || equipped === 'hand' ? undefined : equipped}
        chop={swing}
        jump={jumpT}
        wandGem={wandGem}
        aim={wandCast}
      />
      <Aura />
      {vest && <LifeVest k={AGE_RULES[save.player.appearance.age ?? 'adult'].bodyScale} />}
      {gesture === 'whistle' && <WhistleNotes />}
    </group>
  )
}

/** โน้ตดนตรีลอยขึ้นจากปากตอนผิวปาก */
function WhistleNotes() {
  const refs = useRef<(Group | null)[]>([])
  const start = useRef(performance.now())
  useFrame(() => {
    const e = (performance.now() - start.current) / 1000
    refs.current.forEach((g, i) => {
      if (!g) return
      const t = (e - i * 0.35) % 1.4
      const on = e - i * 0.35 > 0
      g.visible = on
      g.position.set(0.25 + Math.sin(t * 4 + i) * 0.12 + i * 0.08, 1.75 + t * 0.9, 0.2)
      g.scale.setScalar(on ? Math.max(0.01, 1 - t / 1.4) : 0.01)
    })
  })
  return (
    <group>
      {['♪', '♫', '♪'].map((n, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)}>
          <TextSprite text={n} color={i === 1 ? '#7a4fd0' : '#3f6b3a'} height={0.28} position={[0, 0, 0]} />
        </group>
      ))}
    </group>
  )
}

/** เสื้อชูชีพสีส้ม (สวมทับเสื้อ) */
function LifeVest({ k }: { k: number }) {
  return (
    <group scale={k}>
      <mesh position={[0, 1.18, 0]} castShadow>
        <cylinderGeometry args={[0.235, 0.215, 0.5, 14]} />
        <meshStandardMaterial color="#f07a1e" roughness={0.6} />
      </mesh>
      {[1.06, 1.3].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <torusGeometry args={[0.232, 0.018, 6, 20]} />
          <meshStandardMaterial color="#f2f2f2" />
        </mesh>
      ))}
      <mesh position={[0, 1.2, 0.22]}>
        <boxGeometry args={[0.03, 0.42, 0.04]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
    </group>
  )
}

// ---------- เสียงกระโดด/ลงพื้น (สังเคราะห์) ----------
let jctx: AudioContext | null = null
function puff(freq: number, dur: number, gain: number) {
  try {
    jctx ??= new AudioContext()
    if (jctx.state === 'suspended') void jctx.resume()
    const c = jctx
    const len = Math.floor(c.sampleRate * dur)
    const buf = c.createBuffer(1, len, c.sampleRate)
    const ch = buf.getChannelData(0)
    for (let n = 0; n < len; n++) ch[n] = (Math.random() * 2 - 1) * (1 - n / len) ** 2
    const src = c.createBufferSource()
    src.buffer = buf
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = freq
    const g = c.createGain()
    g.gain.value = gain * (useSettings.getState().sfxVolume ?? 1)
    src.connect(f).connect(g).connect(c.destination)
    src.start()
  } catch {
    /* ไม่มีเสียงก็ไม่เป็นไร */
  }
}
const playJump = () => puff(1400, 0.12, 0.12)
const playLand = () => puff(380, 0.16, 0.35)
