import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { create } from 'zustand'
import { Box3, Vector3, type Group } from 'three'
import { closeWheel, confirmWheel, scrollWheel, SLOTS, useLoadout } from '../game/loadout'
import { GEAR, GearModel, gearById } from '../scenes/models/Gear'
import './gearwheel.css'

/* ───────── สตูดิโอถ่ายภาพไอคอน 3 มิติ (ถ่ายครั้งเดียวต่อชิ้น แล้วเก็บเป็นรูป) ───────── */
const shots = new Map<string, string>()
const useShots = create<{ ver: number }>(() => ({ ver: 0 }))

function Shooter() {
  const { gl, scene, camera } = useThree()
  const [i, setI] = useState(0)
  const grp = useRef<Group>(null)
  const frames = useRef(0)
  const id = GEAR[i]?.id
  useFrame(() => {
    if (!id) return
    frames.current++
    if (frames.current === 2 && grp.current) {
      // จัดให้พอดีกรอบ: ย่อ/ขยาย แล้วเลื่อนให้อยู่กลางภาพ
      const g = grp.current
      g.scale.setScalar(1)
      g.position.set(0, 0, 0)
      const b = new Box3().setFromObject(g)
      const size = b.getSize(new Vector3())
      const k = 1.0 / Math.max(size.x, size.y, 0.01)
      g.scale.setScalar(k)
      const b2 = new Box3().setFromObject(g)
      const c = b2.getCenter(new Vector3())
      g.position.sub(c)
    }
    if (frames.current < 5) return
    gl.render(scene, camera)
    shots.set(id, gl.domElement.toDataURL('image/png'))
    frames.current = 0
    useShots.setState((s) => ({ ver: s.ver + 1 }))
    setI((v) => v + 1)
  })
  if (!id) return null
  // อาวุธยาววางเอียงทแยง ดูมีมิติ
  const d = gearById(id)!
  const tilt = d.kind === 'weapon' && id !== 'bomb' ? -0.75 : 0
  return (
    <group key={id}>
      <group ref={grp}>
        <group rotation={[0.25, -0.6, tilt]}>
          <GearModel id={id} />
        </group>
      </group>
      {/* เงาทาบใต้ของ */}
      <mesh position={[0, -0.47, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.5, 1]}>
        <circleGeometry args={[0.3, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} />
      </mesh>
    </group>
  )
}

export function GearStudio() {
  const ver = useShots((s) => s.ver)
  if (ver >= GEAR.length) return null
  return (
    <div style={{ position: 'fixed', left: -9999, top: 0, width: 160, height: 160 }} aria-hidden>
      <Canvas gl={{ preserveDrawingBuffer: true, alpha: true }} camera={{ position: [0, 0.1, 2.2], fov: 30 }} dpr={1} shadows={false}>
        <ambientLight intensity={1.15} />
        <directionalLight position={[2, 3, 3]} intensity={2} />
        <directionalLight position={[-2, 1, -1]} intensity={0.45} color="#cfe0ff" />
        <hemisphereLight args={['#fff6e0', '#8a7a5a', 0.4]} />
        <Shooter />
      </Canvas>
    </div>
  )
}

export function GearIcon({ id, size = 56 }: { id: string; size?: number }) {
  useShots((s) => s.ver)
  const url = shots.get(id)
  return url ? <img src={url} alt={gearById(id)?.name} width={size} height={size} draggable={false} /> : <span className="gw-wait" style={{ width: size, height: size }} />
}

/* ───────── วงล้อเลือกอาวุธ/ไอเทม (มุมขวาของจอ) ───────── */
export function GearWheel() {
  const open = useLoadout((s) => s.open)
  const hi = useLoadout((s) => s.hi)
  const slots = useLoadout((s) => (s.open === 'item' ? s.items : s.weapons))
  const held = useLoadout((s) => (s.open === 'item' ? s.item : s.weapon))
  // ลูกกลิ้งเมาส์: เลื่อนเลือกช่อง (ระหว่างเปิดวงล้อ กล้องไม่ซูม)
  useEffect(() => {
    if (!open) return
    let acc = 0
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      acc += e.deltaY
      if (Math.abs(acc) >= 40) {
        scrollWheel(acc > 0 ? 1 : -1)
        acc = 0
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.stopImmediatePropagation()
        closeWheel()
      }
      // ระหว่างเปิดวงล้อ กด 1–9 = หยิบช่องนั้นเลย (ไม่ไปเลือกแถบไอเทม) · 0 = มือเปล่า
      if (/^Digit[0-9]$/.test(e.code)) {
        e.stopImmediatePropagation()
        const d = Number(e.code.slice(5))
        confirmWheel(d === 0 ? SLOTS : d - 1)
      }
      if (e.code === 'Enter' || e.code === 'KeyE') {
        e.stopImmediatePropagation()
        confirmWheel()
      }
    }
    window.addEventListener('wheel', onWheel, { capture: true, passive: false })
    window.addEventListener('keydown', onKey, { capture: true })
    return () => {
      window.removeEventListener('wheel', onWheel, { capture: true })
      window.removeEventListener('keydown', onKey, { capture: true })
    }
  }, [open])
  if (!open) return <GearStudio />
  const n = SLOTS + 1
  const R = 118
  const cur = hi < SLOTS ? slots[hi] : null
  const curDef = cur ? gearById(cur) : null
  return (
    <>
      <GearStudio />
      <div className="gw-wrap" role="dialog" aria-label={open === 'weapon' ? 'เลือกอาวุธ' : 'เลือกไอเทม'}>
        <div className="gw-title">
          <kbd>{open === 'weapon' ? 'Q' : 'R'}</kbd> {open === 'weapon' ? 'เลือกอาวุธ' : 'เลือกไอเทม'}
          <span className="gw-sub">เลื่อนลูกกลิ้งเพื่อเลือก · คลิก/E หยิบ · Esc ปิด</span>
        </div>
        <div className="gw-ring">
          {Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2 - Math.PI / 2
            const id = i < SLOTS ? slots[i] : null
            const empty = i < SLOTS && !id
            return (
              <button
                key={i}
                type="button"
                className={'gw-slot' + (i === hi ? ' on' : '') + (empty ? ' empty' : '') + ((id ?? null) === held && (i < SLOTS ? !!id : true) ? ' held' : '')}
                style={{ left: `calc(50% + ${Math.cos(a) * R}px)`, top: `calc(50% + ${Math.sin(a) * R}px)` }}
                onMouseEnter={() => useLoadout.setState({ hi: i })}
                onClick={() => confirmWheel(i)}
                disabled={empty}
              >
                {i < SLOTS ? id ? <GearIcon id={id} size={50} /> : <span className="gw-plus">ว่าง</span> : <span className="gw-hand">มือเปล่า</span>}
                <span className="gw-num">{i < SLOTS ? i + 1 : '0'}</span>
              </button>
            )
          })}
          <div className="gw-center">
            {curDef ? <GearIcon id={curDef.id} size={72} /> : <span className="gw-hand big">มือเปล่า</span>}
            <b>{curDef ? curDef.name : hi < SLOTS ? 'ช่องว่าง' : open === 'weapon' ? 'เก็บอาวุธ' : 'เก็บไอเทม'}</b>
          </div>
        </div>
      </div>
    </>
  )
}
