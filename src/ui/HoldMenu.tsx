import { useState } from 'react'
import { cancelMove, confirmMove, layoutMoveOk, rotateMoving, startMove, useHold, type HoldTarget } from '../scenes/HoldInteract'
import { editables, isNaturalTree, useLayoutEdit } from '../game/layoutEdit'
import { costText, removeStructure, startPlacing, storeStructure } from '../game/building'
import { STRUCTURE_LIST, STRUCTURES } from '../game/content/structures'
import { canAfford } from '../game/inventory'
import { useGame } from '../game/store'

/** เมนูที่เปิดจากการกดค้าง: สร้างของ (พื้นว่าง) · จัดการของ (ย้าย/หมุน/เก็บเข้าคลัง/รื้อ) */
export function HoldMenu() {
  const menu = useHold((s) => s.menu)
  const drag = useHold((s) => s.drag)
  const moving = useHold((s) => s.moving)
  useLayoutEdit((s) => s.draft)
  const save = useGame((s) => s.save)
  const close = () => useHold.setState({ menu: null })
  if (moving) {
    const ok = moving.kind === 'structure' ? !!drag?.ok : layoutMoveOk(moving.id)
    const why = moving.kind === 'structure' ? drag?.why : 'นอกอาณาเขตของคุณ'
    const name = moving.kind === 'structure' ? STRUCTURES[save?.structures.find((x) => x.uid === moving.uid)?.id ?? 'chest'].name : editables.get(moving.id)?.name ?? ''
    return (
      <div className={'move-ctl' + (ok ? '' : ' bad')} role="toolbar" aria-label="ย้ายตำแหน่ง">
        <div className="move-info">
          <strong>✥ กำลังย้าย: {name}</strong>
          <small>{ok ? '🟢 วางตรงนี้ได้ · เลื่อนเมาส์หรือกดค้างลาก แล้วปล่อย/คลิกเพื่อวาง' : '🔴 วางไม่ได้: ' + (why ?? '')}</small>
        </div>
        <button type="button" className="build-act" onClick={() => rotateMoving(1)} title="หมุน (R / ล้อเมาส์)">
          <span>↻</span>หมุน (R)
        </button>
        <button type="button" className="build-act done" disabled={!ok} onClick={() => confirmMove()} title="วางตรงนี้">
          <span>✓</span>วางตรงนี้
        </button>
        <button type="button" className="build-act" onClick={() => cancelMove()} title="ยกเลิก (Esc / คลิกขวา)">
          <span>✕</span>ยกเลิก
        </button>
      </div>
    )
  }
  if (!menu || !save) return null
  const left = Math.min(window.innerWidth - 300, Math.max(8, menu.sx + 12))
  const top = Math.min(window.innerHeight - 360, Math.max(8, menu.sy - 20))
  if (menu.kind === 'build') {
    const stored = save.storedStructures ?? {}
    return (
      <div className="hold-menu" style={{ left, top }} role="dialog" aria-label="สร้างสิ่งของ">
        <strong>🔨 สร้างอะไรตรงนี้?</strong>
        <div className="hold-list">
          {STRUCTURE_LIST.map((d) => {
            const inStore = stored[d.id] ?? 0
            const ok = inStore > 0 || canAfford(d.cost)
            return (
              <button
                key={d.id}
                type="button"
                className={`hold-item${ok ? '' : ' poor'}`}
                disabled={!ok}
                onClick={() => {
                  close()
                  startPlacing(d.id, menu.at)
                }}
                title={d.note}
              >
                <span className="hold-icon">{d.icon}</span>
                <span>
                  {d.name}
                  <small>{inStore > 0 ? `📦 ในคลัง ×${inStore} (วางฟรี)` : costText(d.cost)}</small>
                </span>
              </button>
            )
          })}
        </div>
        <button type="button" className="hold-close" onClick={close}>
          ปิด
        </button>
      </div>
    )
  }
  return <ObjectMenu t={menu.t} left={left} top={top} close={close} />
}

/** เมนูจัดการวัตถุ: ย้ายตำแหน่ง · เก็บเข้าคลัง · ถอดทิ้ง/รื้อถอน · ยกเลิก (คำสั่งที่ใช้ไม่ได้ = ปุ่มจาง พร้อมเหตุผล) */
function ObjectMenu({ t, left, top, close }: { t: HoldTarget; left: number; top: number; close: () => void }) {
  const save = useGame((st) => st.save)
  const creator = useLayoutEdit((st) => st.creator)
  const [confirmRemove, setConfirmRemove] = useState(false)
  if (!save) return null
  let icon = '📦'
  let name = ''
  let owner = ''
  let canStore = false
  let canRemove = false
  let why = ''
  let cost = ''
  if (t.kind === 'structure') {
    const st = save.structures.find((x) => x.uid === t.uid)
    if (!st) return null
    const def = STRUCTURES[st.id]
    icon = def.icon
    name = def.name
    owner = 'สิ่งปลูกสร้างที่คุณสร้างเอง'
    canStore = true
    canRemove = true
    cost = costText(def.cost)
  } else {
    const it = editables.get(t.id)
    name = it?.name ?? t.id
    const tree = isNaturalTree(t.id)
    icon = tree ? '🌳' : t.id.startsWith('place:') ? '🏠' : '🏡'
    owner = t.id.startsWith('place:') ? 'สิ่งปลูกสร้างในหมู่บ้าน (สิทธิ์ผู้สร้างเกม)' : tree ? 'ต้นไม้ธรรมชาติ (สิทธิ์ผู้สร้างเกม)' : 'สิ่งปลูกสร้างในบ้านของคุณ'
    why = tree ? 'ต้นไม้ธรรมชาติเก็บ/รื้อไม่ได้' : 'สิ่งปลูกสร้างหลักของบ้าน เก็บเข้าคลังหรือรื้อไม่ได้ (ย้ายได้อย่างเดียว)'
  }
  void creator
  return (
    <div className="hold-menu obj-menu" style={{ left, top }} role="dialog" aria-label={'จัดการ ' + name}>
      <div className="obj-head">
        <span className="obj-icon">{icon}</span>
        <span>
          <strong>{name}</strong>
          <small>{owner}</small>
        </span>
      </div>
      {confirmRemove ? (
        <div className="obj-confirm">
          <p>
            ถอดทิ้ง/รื้อถอน <b>{name}</b> ใช่ไหม? ได้วัตถุดิบคืน: {cost}
          </p>
          <div className="layout-row">
            <button
              type="button"
              className="hold-item danger"
              onClick={() => {
                close()
                if (t.kind === 'structure') removeStructure(t.uid)
              }}
            >
              ยืนยันรื้อถอน
            </button>
            <button type="button" className="hold-item" onClick={() => setConfirmRemove(false)}>
              ไม่ใช่
            </button>
          </div>
        </div>
      ) : (
        <div className="hold-list">
          <button type="button" className="hold-item" onClick={() => startMove(t)}>
            <span className="hold-icon">✥</span>
            <span>
              ย้ายตำแหน่ง<small>เลือกตำแหน่งใหม่ให้วัตถุ</small>
            </span>
          </button>
          <button
            type="button"
            className={'hold-item' + (canStore ? '' : ' poor')}
            disabled={!canStore}
            title={canStore ? '' : why}
            onClick={() => {
              close()
              if (t.kind === 'structure') storeStructure(t.uid)
            }}
          >
            <span className="hold-icon">📦</span>
            <span>
              เก็บเข้าคลัง<small>{canStore ? 'นำวัตถุกลับไปเก็บไว้ วางใหม่ได้ภายหลัง' : why}</small>
            </span>
          </button>
          <button type="button" className={'hold-item danger' + (canRemove ? '' : ' poor')} disabled={!canRemove} title={canRemove ? '' : why} onClick={() => setConfirmRemove(true)}>
            <span className="hold-icon">🗑️</span>
            <span>
              ถอดทิ้ง / รื้อถอน<small>{canRemove ? 'นำวัตถุออกจากพื้นที่ โดยมีการยืนยันก่อน' : why}</small>
            </span>
          </button>
          <button type="button" className="hold-item" onClick={close}>
            <span className="hold-icon">✕</span>
            <span>
              ยกเลิก<small>ปิดเมนูโดยไม่เปลี่ยนแปลงอะไร</small>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
