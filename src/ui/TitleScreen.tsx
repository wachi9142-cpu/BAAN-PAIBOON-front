import { useState, type ReactNode } from 'react'
import { formatSavedAt, useGame } from '../game/store'
import { SaveSlots } from './SaveSlots'
import './title.css'

/**
 * หน้าแรกใช้ภาพที่ออกแบบไว้ทั้งภาพ (public/images/title-screen.jpg ขนาด 1712×1152)
 * แล้ววาง "จุดกด" ทับตำแหน่งปุ่มในภาพ — ถ้าเปลี่ยนภาพ ให้แก้พิกัดใน HOTSPOTS
 */
const IMG_W = 1712
const IMG_H = 1152

type Dialog = null | 'howto' | 'report' | 'support' | 'slots' | 'confirm-new'
type HotspotId = 'new' | 'report' | 'support' | 'howto'

/** พิกัดปุ่มในภาพ (หน่วยพิกเซลของภาพต้นฉบับ): x, y, กว้าง, สูง */
const HOTSPOTS: { id: HotspotId; label: string; rect: [number, number, number, number]; radius: number }[] = [
  { id: 'new', label: 'เริ่มเกมใหม่', rect: [40, 752, 506, 196], radius: 22 },
  { id: 'report', label: 'แจ้งปัญหาเกม', rect: [590, 782, 384, 162], radius: 20 },
  { id: 'support', label: 'สนับสนุนเกม', rect: [1002, 782, 378, 162], radius: 20 },
  { id: 'howto', label: 'วิธีการเล่น', rect: [1400, 815, 276, 130], radius: 18 },
]

const pct = (v: number, total: number) => `${(v / total) * 100}%`

export function TitleScreen() {
  const save = useGame((s) => s.save)
  const recovered = useGame((s) => s.recoveredFrom)
  const goTo = useGame((s) => s.goTo)
  const continueLife = useGame((s) => s.continueLife)
  const deleteSave = useGame((s) => s.deleteSave)
  const [dialog, setDialog] = useState<Dialog>(null)

  const onHotspot = (id: HotspotId) => {
    if (id === 'new') return save ? setDialog('confirm-new') : goTo('create')
    setDialog(id)
  }

  return (
    <div className="ts">
      {/* ภาพเดียวกันแบบเบลอ เติมขอบจอที่ภาพหลักไม่เต็ม */}
      <div className="ts-fill" aria-hidden="true" />

      <div className="ts-frame">
        <img className="ts-img" src="/images/title-screen.jpg" alt="บ้านไพบูลย์ BAANPAIBOON หมู่บ้านแห่งความทรงจำ" draggable={false} />

        {HOTSPOTS.map((h) => {
          const [x, y, w, hgt] = h.rect
          return (
            <button
              key={h.id}
              className="ts-hot"
              aria-label={h.label}
              title={h.label}
              style={{
                left: pct(x, IMG_W),
                top: pct(y, IMG_H),
                width: pct(w, IMG_W),
                height: pct(hgt, IMG_H),
                borderRadius: `${(h.radius / w) * 100}% / ${(h.radius / hgt) * 100}%`,
              }}
              onClick={() => onHotspot(h.id)}
            />
          )
        })}

        {/* มีเซฟอยู่แล้ว: ปุ่มเล่นต่อวางเหนือปุ่มเริ่มเกมใหม่ */}
        {save && (
          <div className="ts-continue" style={{ left: pct(40, IMG_W), bottom: pct(IMG_H - 740, IMG_H), width: pct(506, IMG_W) }}>
            <button className="ts-continue-btn" onClick={continueLife}>
              ▶ เล่นต่อ — {save.player.name}
            </button>
            <button className="ts-continue-link" onClick={() => setDialog('slots')}>
              ไฟล์เซฟสำรอง
            </button>
          </div>
        )}
      </div>

      {recovered && (
        <div className="ts-notice" role="status">
          ครั้งก่อนเกมปิดไม่สมบูรณ์ — กู้คืนจากจุดบันทึกล่าสุดที่สำเร็จแล้ว: <strong>{formatSavedAt(recovered.savedAt)}</strong>
        </div>
      )}

      {dialog === 'howto' && (
        <Modal title="วิธีการเล่น" onClose={() => setDialog(null)}>
          <ul className="howto">
            <li>
              <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> หรือปุ่มลูกศร — เดิน
            </li>
            <li>
              <kbd>Shift</kbd> ค้างไว้ — วิ่ง
            </li>
            <li>ลากเมาส์ — หมุนกล้อง · ล้อเมาส์ — ซูมเข้า/ออก</li>
            <li>
              <kbd>Esc</kbd> — เปิดเมนูเกม (บันทึกเกม ตั้งค่า ออกจากเกม)
            </li>
            <li>เดินไปใกล้สถานที่เพื่อดูรายละเอียด และค้นพบสถานที่ใหม่ในหมู่บ้าน</li>
            <li>เกมบันทึกอัตโนมัติทุก 2 นาที และทุกครั้งที่เกิดเหตุการณ์สำคัญ</li>
          </ul>
        </Modal>
      )}

      {dialog === 'report' && (
        <Modal title="แจ้งปัญหาเกม" onClose={() => setDialog(null)}>
          <p>ระบบแจ้งปัญหาและข้อเสนอแนะจะเปิดให้ใช้งานเร็ว ๆ นี้</p>
          <p className="hint">ขอบคุณที่ช่วยกันทำให้หมู่บ้านไพบูลย์ดีขึ้น</p>
        </Modal>
      )}

      {dialog === 'support' && (
        <Modal title="สนับสนุนเกม" onClose={() => setDialog(null)}>
          <p>ช่องทางสนับสนุนการพัฒนาหมู่บ้านไพบูลย์จะเปิดเร็ว ๆ นี้</p>
          <p className="hint">ทุกการสนับสนุนช่วยให้หมู่บ้านมีชีวิตชีวามากขึ้น ♥</p>
        </Modal>
      )}

      {dialog === 'slots' && (
        <Modal title="ไฟล์เซฟและข้อมูลสำรอง" onClose={() => setDialog(null)}>
          <SaveSlots onLoaded={() => setDialog(null)} />
        </Modal>
      )}

      {dialog === 'confirm-new' && (
        <Modal title="เริ่มเกมใหม่?" onClose={() => setDialog(null)}>
          <p>
            เริ่มใหม่จะลบความคืบหน้าของ <strong>{save?.player.name}</strong> และไฟล์สำรองทั้งหมด ย้อนกลับไม่ได้
          </p>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setDialog(null)}>
              ยกเลิก
            </button>
            <button
              className="btn"
              style={{ background: 'var(--clay)', boxShadow: '0 3px 0 #7d3d22' }}
              onClick={() => {
                deleteSave()
                goTo('create')
              }}
            >
              ลบและเริ่มใหม่
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="menu-backdrop" onClick={onClose}>
      <div className="menu tt-modal" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
        <button className="btn ghost small" onClick={onClose}>
          ปิด
        </button>
      </div>
    </div>
  )
}
