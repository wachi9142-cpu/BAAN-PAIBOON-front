import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { create } from 'zustand'
import { createPortal } from 'react-dom'
import { Box3, type Group } from 'three'
import { useGame } from '../game/store'
import { activeKeys, openParty, petOf } from '../game/party'
import { ageDays, blurbOf, BOND_HEARTS, careOf, doSkill, feedPet, getSpecies, levelOf, renamePet, sexOf, skillProblem, skillsOf } from '../game/petCare'
import { Pet } from '../scenes/models/Pet'
import type { PetChoice } from '../game/content/pets'
import { fitTo, PetPortraitImg } from './PetPortrait'

/** การ์ดสัตว์เลี้ยง: ซ้าย = ข้อมูล · กลาง = โมเดลสัตว์ (เห็นหมู่บ้านด้านหลัง) · ขวา = สถานะ · ล่าง = สกิล 4 อย่าง */
export const usePetCard = create<{ key: string | null }>(() => ({ key: null }))
export const openPetCard = (key?: string | null) => usePetCard.setState({ key: key ?? activeKeys()[0] ?? null })

export function PetCard() {
  const key = usePetCard((s) => s.key)
  useGame((s) => s.save?.petCare)
  useGame((s) => s.save?.activePets)
  useGame((s) => s.save?.inventory)
  const [, tick] = useState(0)
  const [editName, setEditName] = useState<string | null>(null)
  useEffect(() => {
    if (!key) return
    const t = window.setInterval(() => tick((n) => n + 1), 1000)
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.stopPropagation()
        usePetCard.setState({ key: null })
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.clearInterval(t)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [key])
  const o = key ? petOf(key) : undefined
  if (!key || !o) return null
  const close = () => usePetCard.setState({ key: null })
  const c = careOf(key)
  const out = activeKeys().includes(key)
  const pet = o.pet
  const hearts = c.bond / 2
  const inv = useGame.getState().save?.inventory ?? {}
  const food = (inv.feed ?? 0) + (inv.treat ?? 0)
  return createPortal(
    <div className="pc-root" onClick={close}>
      <div className="pc-stage" aria-hidden>
        <PetStage pet={pet} />
      </div>

      {/* ซ้าย: ข้อมูล */}
      <div className="pc-panel pc-info" onClick={(e) => e.stopPropagation()}>
        <div className="pc-top">
          <span className="pc-face">
            <PetPortraitImg pet={pet} size={78} />
          </span>
          <div>
            {editName === null ? (
              <h2>
                {pet.name}
                <button type="button" className="pc-rename" onClick={() => setEditName(pet.name)} title="เปลี่ยนชื่อ" aria-label="เปลี่ยนชื่อ">
                  ✏️
                </button>
              </h2>
            ) : (
              <form
                className="pc-nameform"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!renamePet(key, editName)) setEditName(null)
                }}
              >
                <input autoFocus maxLength={20} value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.stopPropagation()} />
                <button type="submit" className="btn small">ตกลง</button>
              </form>
            )}
            <p className="pc-breed">
              {getSpecies(pet.species).label}
              {pet.breed ? ` · พันธุ์${pet.breed}` : ''}
            </p>
            <p className="pc-sex">
              <span className={'pc-sexbadge ' + (sexOf(key, pet) === 'ผู้' ? 'm' : 'f')}>{sexOf(key, pet) === 'ผู้' ? '♂ เพศผู้' : '♀ เพศเมีย'}</span>
              <span className="pc-lv">Lv.{levelOf(key)}</span>
              <span className="pc-age">อายุ {ageDays(key)} วัน</span>
            </p>
          </div>
        </div>
        <p className="pc-blurb">{blurbOf(key, pet)}</p>
        <div className="pc-bond">
          <span className="pc-leaf">🍃</span> ความผูกพัน
          <span className="pc-hearts">
            {Array.from({ length: BOND_HEARTS }, (_, i) => (
              <i key={i} className={hearts >= i + 1 ? 'on' : hearts > i ? 'half' : ''}>
                ♥
              </i>
            ))}
          </span>
        </div>
        <div className="pc-state">{out ? (activeKeys()[0] === key ? '★ ตัวหลัก · เดินตามอยู่' : 'เดินตามอยู่') : 'พักอยู่ในทีม'}</div>
      </div>

      {/* ขวา: สถานะ */}
      <div className="pc-panel pc-stats" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pc-close" onClick={close} aria-label="ปิด">
          ✕
        </button>
        <Stat icon="💚" label="ความสุข" v={c.happy} cls="g" />
        <Stat icon="🥣" label="ความอิ่ม" v={c.full} cls="b" />
        <Stat icon="☀️" label="พลังงาน" v={c.energy} cls="o" />
        <div className="pc-row">
          <button type="button" className="btn small" onClick={() => feedPet(key)} disabled={food === 0} title={food ? '' : 'ไม่มีอาหารสัตว์/กล้วยสุก'}>
            🍚 ให้อาหาร ({food})
          </button>
          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              close()
              openParty(key)
            }}
          >
            🐾 ทีมสัตว์
          </button>
        </div>
      </div>

      {/* ล่าง: สกิล */}
      <div className="pc-panel pc-skills" onClick={(e) => e.stopPropagation()}>
        {skillsOf(pet).map((s) => {
          const why = skillProblem(key, s.id)
          return (
            <button key={s.id} type="button" className={`pc-skill${why ? ' off' : ''}`} onClick={() => doSkill(key, s.id)} title={why ?? s.note}>
              <span className="pc-sicon">{s.icon}</span>
              <b>{s.name}</b>
              <small>{why ?? s.note}</small>
            </button>
          )
        })}
      </div>
    </div>,
    document.body,
  )
}

function Stat({ icon, label, v, cls }: { icon: string; label: string; v: number; cls: string }) {
  const n = Math.round(v)
  return (
    <div className="pc-stat">
      <span className={`pc-sic ${cls}`}>{icon}</span>
      <div>
        <span className="pc-slabel">{label}</span>
        <span className="pc-bar">
          <i className={cls} style={{ width: `${n}%` }} />
        </span>
      </div>
      <span className="pc-num">{n}/100</span>
    </div>
  )
}

/** โมเดลสัตว์ตรงกลาง (พื้นหลังโปร่ง เห็นโลกเกมด้านหลัง) */
function PetStage({ pet }: { pet: PetChoice }) {
  return (
    <Canvas gl={{ alpha: true }} camera={{ position: [0.7, 0.85, 2.6], fov: 30 }} dpr={[1, 2]} onCreated={({ camera }) => camera.lookAt(0, 0.38, 0)}>
      <ambientLight intensity={0.95} />
      <directionalLight position={[2, 3, 3]} intensity={1.35} />
      <directionalLight position={[-2, 1, -1]} intensity={0.4} color="#cfe0ff" />
      <Idle pet={pet} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[0.38, 40]} />
        <meshBasicMaterial color="#000" transparent opacity={0.14} />
      </mesh>
    </Canvas>
  )
}
function Idle({ pet }: { pet: PetChoice }) {
  const g = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const motion = useRef(0)
  const pose = useRef(0)
  const t = useRef(0)
  useFrame((_, dt) => {
    t.current += dt
    if (g.current) g.current.rotation.y = 0.35 + Math.sin(t.current * 0.5) * 0.35
    // ส่ายหาง/ขยับตัวเบา ๆ
    motion.current = 0.15 + Math.max(0, Math.sin(t.current * 0.8)) * 0.25
  })
  useEffect(() => {
    const id = window.setTimeout(() => {
      const n = inner.current
      if (!n) return
      fitTo(n, 0.8, 0.4)
      // วางเท้าบนพื้น (เงาอยู่ใต้เท้า)
      n.updateMatrixWorld(true)
      n.position.y -= new Box3().setFromObject(n).min.y
    }, 60)
    return () => window.clearTimeout(id)
  }, [pet])
  return (
    <group ref={g}>
      <group ref={inner}>
        <Pet pet={pet} motion={motion} pose={pose} />
      </group>
    </group>
  )
}
