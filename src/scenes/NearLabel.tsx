import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import { TextSprite } from './TextSprite'
import { playerPose } from '../game/playerPose'
import { useSettings } from '../game/settings'

/**
 * ป้ายชื่อที่ขึ้นเฉพาะตอนเดินเข้าใกล้ (GAME_DESIGN §2.64)
 * - เดินสำรวจปกติไม่มีชื่อบนจอ · เข้าใกล้สิ่งไหน ชื่อสิ่งนั้นค่อย ๆ ลอยขึ้นมา · เดินออกห่างก็จางหายเอง
 * - ขึ้นทีละชื่อ = สิ่งที่ผู้เล่นอยู่ใกล้ที่สุดจริง ๆ (เทียบกับรัศมีของแต่ละอย่าง) ไม่ขึ้นพร้อมกันเต็มจอ
 * - ลอยเหนือวัตถุ ไม่บังตัววัตถุ
 */
interface Entry {
  x: number
  z: number
  r: number
}
const registry = new Map<number, Entry>()
let nextId = 1
const pick = { frame: -1, id: -1 }
/** มีต้นไม้/หินที่อยู่ใกล้กว่า (ป้ายของมันขึ้นแทน) */
export const nearOverride = { on: false }
if (import.meta.env.DEV) (window as unknown as { __near: unknown }).__near = { registry, pick, nearOverride }

function choose(frame: number) {
  if (pick.frame === frame) return pick.id
  pick.frame = frame
  if (nearOverride.on) return (pick.id = -1)
  let best = -1
  let bs = Infinity
  for (const [id, e] of registry) {
    const d = Math.hypot(e.x - playerPose.x, e.z - playerPose.z)
    if (d > e.r) continue
    // เลือกสิ่งที่จุดกลางอยู่ใกล้ผู้เล่นที่สุด (อยู่ในรัศมีของมัน)
    const s = d
    if (s < bs) {
      bs = s
      best = id
    }
  }
  pick.id = best
  return best
}

export function NearLabel({ text, y, r = 4, color = '#2e2a24', height = 0.55 }: { text: string; y: number; r?: number; color?: string; height?: number }) {
  const show = useSettings((s) => s.showLabels)
  const g = useRef<Group>(null)
  const id = useMemo(() => nextId++, [])
  const wp = useMemo(() => new Vector3(), [])
  const k = useRef(0)
  const placed = useRef(false)
  useEffect(() => () => void registry.delete(id), [id])
  useFrame(({ clock }, dt) => {
    const grp = g.current
    if (!grp) return
    // ตำแหน่งจริงในโลก (อัปเดตทุกเฟรม · รองรับโหมดย้ายที่)
    if (!grp.parent) return
    if (!placed.current) {
      grp.parent.updateWorldMatrix(true, false)
      placed.current = true
    }
    grp.parent.getWorldPosition(wp)
    const e = registry.get(id)
    if (e) {
      e.x = wp.x
      e.z = wp.z
      e.r = r
    } else registry.set(id, { x: wp.x, z: wp.z, r })
    const on = show && choose(Math.floor(clock.elapsedTime * 60)) === id
    k.current += ((on ? 1 : 0) - k.current) * Math.min(1, dt * 8)
    const v = k.current
    grp.visible = v > 0.02
    grp.scale.setScalar(0.6 + v * 0.4)
    grp.position.y = y + (1 - v) * -0.3
  })
  return (
    <group ref={g} position={[0, y, 0]} visible={false}>
      <TextSprite text={text} color={color} position={[0, 0, 0]} height={height} />
    </group>
  )
}

/** ชื่อต้นไม้/ก้อนหินที่ยืนอยู่ใกล้ (ใช้เป้าหมายที่กด E ได้) — ป้ายเดียว ลอยเหนือของชิ้นนั้น */
export function GatherNameLabel({ target }: { target: { text: string; x: number; z: number; y: number } | null }) {
  const show = useSettings((s) => s.showLabels)
  const g = useRef<Group>(null)
  const k = useRef(0)
  const last = useRef(target)
  if (target) last.current = target
  nearOverride.on = !!target && show
  useFrame((_, dt) => {
    const grp = g.current
    if (!grp) return
    k.current += ((target && show ? 1 : 0) - k.current) * Math.min(1, dt * 8)
    grp.visible = k.current > 0.02
    grp.scale.setScalar(0.6 + k.current * 0.4)
  })
  const t = last.current
  if (!t) return null
  return (
    <group ref={g} position={[t.x, t.y, t.z]} visible={false}>
      <TextSprite text={t.text} color="#2e2a24" position={[0, 0, 0]} height={0.5} />
    </group>
  )
}
