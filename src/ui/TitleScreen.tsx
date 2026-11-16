import { useState, type ReactNode } from 'react'
import { formatSavedAt, useGame } from '../game/store'
import { SaveSlots } from './SaveSlots'
import './title.css'

type Dialog = null | 'howto' | 'report' | 'support' | 'slots' | 'confirm-new'

export function TitleScreen() {
  const save = useGame((s) => s.save)
  const recovered = useGame((s) => s.recoveredFrom)
  const goTo = useGame((s) => s.goTo)
  const continueLife = useGame((s) => s.continueLife)
  const deleteSave = useGame((s) => s.deleteSave)
  const [dialog, setDialog] = useState<Dialog>(null)

  const startNew = () => (save ? setDialog('confirm-new') : goTo('create'))

  return (
    <>
      {/* ภาพพื้นหลังชั่วคราว (เปลี่ยนไฟล์ได้ที่ public/images/title-bg.jpg) */}
      <div className="title-bg" aria-hidden="true" />

      <div className="tt">
        {/* ป้ายไม้แขวนมุมซ้ายบน */}
        <div className="tt-hang" aria-hidden="true">
          <div className="tt-hang-rope" />
          <div className="tt-hang-board">
            ชีวิตเรียบง่าย
            <br />
            สุขอย่างยั่งยืน
            <LeafIcon className="tt-hang-leaf" />
          </div>
        </div>

        {/* ป้ายชื่อเกม (กระดาษเก่า + เถาวัลย์) */}
        <header className="tt-sign">
          <Vine className="tt-vine tl" />
          <Vine className="tt-vine br" />
          <h1 className="tt-th">บ้านไพบูลย์</h1>
          <div className="tt-en">
            <LeafIcon /> BAANPAIBOON <LeafIcon flip />
          </div>
          <div className="tt-dots" aria-hidden="true">
            <span />
            <FlowerIcon />
            <span />
          </div>
          <div className="tt-sub">
            <LeafIcon /> หมู่บ้านแห่งความทรงจำ <LeafIcon flip />
          </div>
        </header>

        {recovered && (
          <div className="tt-notice" role="status">
            ครั้งก่อนเกมปิดไม่สมบูรณ์ (ไฟดับหรือปิดหน้าต่างกะทันหัน) — กู้คืนจากจุดบันทึกล่าสุดที่สำเร็จแล้ว:{' '}
            <strong>{formatSavedAt(recovered.savedAt)}</strong>
          </div>
        )}

        {/* ปุ่มเมนูหลัก */}
        <nav className="tt-menu" aria-label="เมนูหลัก">
          {save ? (
            <button className="tt-btn primary" onClick={continueLife}>
              <PlayIcon />
              <span>
                <strong>เล่นต่อ</strong>
                <small>กลับไปใช้ชีวิตกับ{save.player.name}</small>
              </span>
            </button>
          ) : (
            <button className="tt-btn primary" onClick={startNew}>
              <SproutIcon />
              <span>
                <strong>เริ่มเกมใหม่</strong>
                <small>เริ่มต้นชีวิตใหม่ในหมู่บ้านไพบูลย์</small>
              </span>
            </button>
          )}
          {save && (
            <button className="tt-btn" onClick={startNew}>
              <SproutIcon />
              <span>
                <strong>เริ่มเกมใหม่</strong>
                <small>สร้างตัวละครใหม่</small>
              </span>
            </button>
          )}
          <button className="tt-btn" onClick={() => setDialog('report')}>
            <GearIcon />
            <span>
              <strong>แจ้งปัญหาเกม</strong>
              <small>รายงานปัญหาหรือข้อเสนอแนะ</small>
            </span>
          </button>
          <button className="tt-btn orange" onClick={() => setDialog('support')}>
            <HeartIcon />
            <span>
              <strong>สนับสนุนเกม</strong>
              <small>สนับสนุนเพื่อพัฒนาหมู่บ้านไพบูลย์</small>
            </span>
          </button>
          <button className="tt-btn compact" onClick={() => setDialog('howto')}>
            <BookIcon />
            <span>
              <strong>วิธีการเล่น</strong>
            </span>
          </button>
        </nav>

        {save && (
          <button className="tt-link" onClick={() => setDialog('slots')}>
            ไฟล์เซฟและข้อมูลสำรอง
          </button>
        )}

        {/* ป้ายเล็กมุมซ้ายล่าง */}
        <div className="tt-small-sign" aria-hidden="true">
          อีสานบ้านเฮา
          <br />
          วิถีชีวิต วัฒนธรรม <span className="heart">♥</span>
        </div>

        {/* แถบคำขวัญด้านล่าง */}
        <div className="tt-banner">
          <FlowerIcon /> ▸ หมู่บ้านเล็ก ๆ ที่มีหัวใจใหญ่ ◂ <FlowerIcon />
        </div>
      </div>

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
    </>
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

/* ---------- ไอคอน (SVG วาดเอง) ---------- */

function LeafIcon({ flip, className }: { flip?: boolean; className?: string }) {
  return (
    <svg className={`ic-leaf ${className ?? ''}`} viewBox="0 0 24 12" style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      <path d="M1 6 C6 0, 14 0, 23 6 C14 12, 6 12, 1 6 Z" fill="currentColor" />
      <path d="M1 6 H20" stroke="rgba(255,255,255,.5)" strokeWidth="0.8" />
    </svg>
  )
}

function FlowerIcon() {
  return (
    <svg className="ic-flower" viewBox="0 0 20 20" aria-hidden="true">
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="10" cy="5" rx="3" ry="4.5" fill="currentColor" transform={`rotate(${r} 10 10)`} />
      ))}
      <circle cx="10" cy="10" r="2.6" fill="#e9b949" />
    </svg>
  )
}

function Vine({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      {/* เถาวัลย์โค้งตามมุมป้าย: ลงมาตามขอบซ้าย แล้วเลี้ยวไปตามขอบบน */}
      <path d="M8 118 C6 70, 8 20, 30 10 S90 6, 118 8" fill="none" stroke="#5b6e2e" strokeWidth="3.5" strokeLinecap="round" />
      {[
        [8, 100, -70],
        [6, 76, -110],
        [8, 52, -60],
        [14, 28, -100],
        [30, 10, -20],
        [52, 6, 20],
        [74, 6, -25],
        [98, 7, 15],
        [10, 64, 60],
        [40, 8, 160],
        [86, 8, 200],
      ].map(([x, y, r], i) => (
        <path
          key={i}
          d="M0 0 C4 -6, 12 -6, 16 0 C12 6, 4 6, 0 0 Z"
          fill={i % 2 ? '#6f8f3a' : '#86a64a'}
          transform={`translate(${x} ${y}) rotate(${r})`}
        />
      ))}
    </svg>
  )
}

const ic = { viewBox: '0 0 32 32', 'aria-hidden': true, className: 'tt-ic' } as const

function SproutIcon() {
  return (
    <svg {...ic}>
      <path d="M16 30 V16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 17 C16 9, 10 5, 3 5 C3 12, 8 17, 16 17 Z" fill="currentColor" />
      <path d="M16 14 C16 7, 22 3, 29 3 C29 10, 24 14, 16 14 Z" fill="currentColor" opacity=".85" />
    </svg>
  )
}
function PlayIcon() {
  return (
    <svg {...ic}>
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M13 10 L22 16 L13 22 Z" fill="currentColor" />
    </svg>
  )
}
function GearIcon() {
  return (
    <svg {...ic}>
      <g fill="currentColor">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
          <rect key={r} x="14" y="2" width="4" height="7" rx="1" transform={`rotate(${r} 16 16)`} />
        ))}
        <circle cx="16" cy="16" r="9" />
      </g>
      <circle cx="16" cy="16" r="3.6" fill="var(--btn-bg, #f3e7cc)" />
    </svg>
  )
}
function HeartIcon() {
  return (
    <svg {...ic}>
      <circle cx="16" cy="16" r="14" fill="#fff5e6" />
      <path d="M16 24 C8 18, 7 13, 10 10.5 C12.5 8.5, 15 9.5, 16 12 C17 9.5, 19.5 8.5, 22 10.5 C25 13, 24 18, 16 24 Z" fill="#c4612b" />
    </svg>
  )
}
function BookIcon() {
  return (
    <svg {...ic}>
      <path d="M3 7 C8 5, 12 6, 16 9 V27 C12 24, 8 23, 3 25 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M29 7 C24 5, 20 6, 16 9 V27 C20 24, 24 23, 29 25 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 11 H12 M6 15 H12 M20 11 H26 M20 15 H26" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
