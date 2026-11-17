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
import { Character } from './models/Character'
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
function useKeys() {
  const keys = useRef(new Set<string>())
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
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
export const playerPose = { x: 0, z: 0, heading: 0, motion: 0 }

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
    const running = k.has('ShiftLeft') || k.has('ShiftRight')

    // ทิศทางอิงมุมกล้อง: กล้องอยู่ที่ yaw มองเข้าหาตัวละคร
    const yaw = orbit.current.yaw
    const fx = -Math.sin(yaw)
    const fz = -Math.cos(yaw)
    const rx = -fz
    const rz = fx
    let mx = fx * f + rx * r
    let mz = fz * f + rz * r
    const len = Math.hypot(mx, mz)

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
    if (len > 0 && swing.current < 0 && !wandCast.aiming) {
      mx /= len
      mz /= len
      const age = AGE_RULES[save.player.appearance.age ?? 'adult']
      const look = save.player.appearance
      const caneK = look.age === 'elder' && look.cane && look.cane !== 'none' ? CANE_WALK : 1
      // ขี่สัตว์: ใช้ความเร็วของสัตว์ (ไม่นับไม้เท้า/วัย)
      const ride = useGame.getState().riding ? RIDEABLE[save.player.pet?.species ?? 'dog'] : undefined
      const speed = ride ? (running ? RUN * 1.2 : WALK * ride.speed) : (running ? RUN * age.runSpeed : WALK * age.walkSpeed) * caneK
      pos.current = resolveMove([pos.current[0] + mx * speed * dt, pos.current[1] + mz * speed * dt], colliders)
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

    const [x, z] = pos.current
    if (root.current) {
      // ขึ้นบันได/ยืนบนพื้นโบสถ์ (ค่อย ๆ ขยับความสูงให้นุ่ม)
      const gy = templeGroundY(x, z)
      // ขี่อยู่: ยกตัวขึ้นนั่งบนหลังสัตว์
      const rideY = useGame.getState().riding ? rideHeight(save) : 0
      const targetY = gy + rideY
      root.current.position.set(x, root.current.position.y + (targetY - root.current.position.y) * Math.min(1, dt * 12), z)
      root.current.rotation.y = heading.current
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
    <group ref={root} position={[save.position[0], 0, save.position[1]]}>
      <Character
        appearance={riding ? { ...save.player.appearance, pose: 'ride' } : gesture ? { ...save.player.appearance, pose: gesture } : save.player.appearance}
        motion={motion}
        barefoot={barefoot}
        tool={riding || gesture || equipped === 'hand' ? undefined : equipped}
        chop={swing}
        wandGem={wandGem}
        aim={wandCast}
      />
      <Aura />
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
