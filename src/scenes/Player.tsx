import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import { saveOnUnload, useGame } from '../game/store'
import { useSettings } from '../game/settings'
import { AGE_RULES } from '../game/content/appearance'
import { buildColliders, resolveMove } from '../game/collision'
import { PLACES, PLOTS } from '../game/content/village'
import { Character } from './models/Character'

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

  const colliders = useMemo(() => buildColliders(save.home.houseDesignId), [save.home.houseDesignId])

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

    if (len > 0) {
      mx /= len
      mz /= len
      const age = AGE_RULES[save.player.appearance.age ?? 'adult']
      const speed = running ? RUN * age.runSpeed : WALK * age.walkSpeed
      pos.current = resolveMove([pos.current[0] + mx * speed * dt, pos.current[1] + mz * speed * dt], colliders)
      const target = Math.atan2(mx, mz)
      let diff = target - heading.current
      diff = Math.atan2(Math.sin(diff), Math.cos(diff))
      heading.current += diff * Math.min(1, dt * 12)
      motion.current = running ? 2 : 1
    } else {
      motion.current = 0
    }

    const [x, z] = pos.current
    if (root.current) {
      root.current.position.set(x, 0, z)
      root.current.rotation.y = heading.current
    }
    playerPose.x = x
    playerPose.z = z
    playerPose.heading = heading.current
    playerPose.motion = motion.current

    // กล้องตาม
    const { pitch, dist } = orbit.current
    const eye = 1.5 * AGE_RULES[save.player.appearance.age ?? 'adult'].bodyScale
    camTarget.set(x, eye, z)
    camPos.set(
      x + Math.sin(yaw) * Math.cos(pitch) * dist,
      eye + Math.sin(pitch) * dist,
      z + Math.cos(yaw) * Math.cos(pitch) * dist,
    )
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
      <Character appearance={save.player.appearance} motion={motion} />
    </group>
  )
}
