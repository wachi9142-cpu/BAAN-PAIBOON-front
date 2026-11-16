import { useState, type ReactNode } from 'react'
import { formatSavedAt, useGame } from '../game/store'
import { SaveSlots } from './SaveSlots'
import { useTitleSoundscape } from '../game/audio/useSoundscape'
import './title.css'

/**
 * หน้าแรก: ภาพพื้นหลังล้วน (public/images/title-bg-clean.jpg)
 * ป้ายและปุ่มทั้งหมดเป็น UI จริง → ข้อความแก้ได้ ไม่สะกดผิด และพอดีทุกขนาดจอ
 */

type Dialog = null | 'howto' | 'report' | 'support' | 'slots' | 'confirm-new'

/** ใบไม้ที่ปลิว (ค่าคงที่ ให้หน้าตาเหมือนเดิมทุกครั้ง) */
const LEAVES = [
  { x: 8, dur: 16, delay: 0, size: 18, color: '#7ea443' },
  { x: 22, dur: 21, delay: 6, size: 14, color: '#a8c25a' },
  { x: 37, dur: 18, delay: 11, size: 16, color: '#d9a441' },
  { x: 55, dur: 23, delay: 3, size: 13, color: '#8fb04a' },
  { x: 68, dur: 17, delay: 9, size: 19, color: '#6f9a3c' },
  { x: 81, dur: 20, delay: 14, size: 15, color: '#e0b04e' },
  { x: 93, dur: 19, delay: 5, size: 17, color: '#7ea443' },
]

export function TitleScreen() {
  const save = useGame((s) => s.save)
  const recovered = useGame((s) => s.recoveredFrom)
  const goTo = useGame((s) => s.goTo)
  const continueLife = useGame((s) => s.continueLife)
  const deleteSave = useGame((s) => s.deleteSave)
  const [dialog, setDialog] = useState<Dialog>(null)
  useTitleSoundscape()

  const startNew = () => (save ? setDialog('confirm-new') : goTo('create'))

  return (
    <div className="ts">
      {/* พื้นหลัง: ซูมเข้า-ออกช้า ๆ */}
      <div className="ts-bg" aria-hidden="true" />
      <div className="ts-sun" aria-hidden="true" />

      {/* ป้ายไม้แขวนมุมซ้ายบน */}
      <div className="ts-hang" aria-hidden="true">
        <div className="ts-hang-branch" />
        <div className="ts-hang-ropes" />
        <div className="ts-hang-board">
          ชีวิตเรียบง่าย
          <br />
          สุขอย่างยั่งยืน
          <span className="ts-hang-flowers">
            <Flower color="#f2c230" />
            <Flower color="#f7d25a" />
          </span>
        </div>
      </div>

      {/* ป้ายชื่อเกม */}
      <header className="ts-sign">
        <Vine className="ts-vine tl" />
        <Vine className="ts-vine tr" />
        <Vine className="ts-vine bl" />
        <Vine className="ts-vine br" />
        <Ornament />
        <h1 className="ts-th">บ้านไพบูลย์</h1>
        <div className="ts-en">
          <Sprig /> BAANPAIBOON <Sprig flip />
        </div>
        <div className="ts-rule" aria-hidden="true">
          <span />
          <Diamond />
          <span />
        </div>
        <div className="ts-sub">หมู่บ้านแห่งความทรงจำ</div>
      </header>

      {recovered && (
        <div className="ts-notice" role="status">
          ครั้งก่อนเกมปิดไม่สมบูรณ์ — กู้คืนจากจุดบันทึกล่าสุดที่สำเร็จแล้ว: <strong>{formatSavedAt(recovered.savedAt)}</strong>
        </div>
      )}

      {/* ปุ่มเมนูหลัก */}
      <div className="ts-bottom">
        {save && (
          <div className="ts-continue">
            <button className="ts-continue-btn" onClick={continueLife}>
              ▶ เล่นต่อ — {save.player.name}
            </button>
            <button className="ts-continue-link" onClick={() => setDialog('slots')}>
              ไฟล์เซฟสำรอง
            </button>
          </div>
        )}
        <nav className="ts-menu" aria-label="เมนูหลัก">
          <button className="ts-btn green" onClick={startNew}>
            <LeafIcon />
            <span>
              <strong>เริ่มเกมใหม่</strong>
              <small>เริ่มต้นชีวิตใหม่ในหมู่บ้านไพบูลย์</small>
            </span>
          </button>
          <button className="ts-btn cream" onClick={() => setDialog('report')}>
            <ClipboardIcon />
            <span>
              <strong>แจ้งปัญหาเกม</strong>
              <small>รายงานปัญหาหรือข้อเสนอแนะ</small>
            </span>
          </button>
          <button className="ts-btn orange" onClick={() => setDialog('support')}>
            <HeartIcon />
            <span>
              <strong>สนับสนุนเกม</strong>
              <small>สนับสนุนเพื่อพัฒนาหมู่บ้านไพบูลย์</small>
            </span>
          </button>
          <button className="ts-btn lime" onClick={() => setDialog('howto')}>
            <BookIcon />
            <span>
              <strong>วิธีการเล่น</strong>
            </span>
          </button>
        </nav>
      </div>

      {/* ใบไม้ปลิวลงช้า ๆ */}
      <div className="ts-leaves" aria-hidden="true">
        {LEAVES.map((l, i) => (
          <span
            key={i}
            style={{
              left: `${l.x}%`,
              animationDuration: `${l.dur}s, ${l.dur / 4}s`,
              animationDelay: `${l.delay}s, ${l.delay}s`,
              width: l.size,
              height: l.size * 0.55,
              background: l.color,
            }}
          />
        ))}
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
              <kbd>Esc</kbd> — เปิดเมนูเกม (บันทึกเกม ตั้งค่า เสียง ออกจากเกม)
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
          <SupportQr />
          <p className="hint" style={{ textAlign: 'center' }}>
            ทุกการสนับสนุนช่วยให้หมู่บ้านมีชีวิตชีวามากขึ้น ♥
          </p>
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

/**
 * QR code สนับสนุน — วางไฟล์ภาพที่ public/images/support-qr.png
 * ถ้ายังไม่มีไฟล์ จะแสดงกรอบว่างพร้อมข้อความ "เร็ว ๆ นี้"
 */
function SupportQr() {
  const [missing, setMissing] = useState(false)
  return (
    <div className="qr-box">
      {missing ? (
        <div className="qr-empty">
          <span>QR</span>
          ช่องทางสนับสนุนจะเปิดเร็ว ๆ นี้
        </div>
      ) : (
        <img src="/images/support-qr.png" alt="QR code สำหรับสนับสนุนเกมบ้านไพบูลย์" onError={() => setMissing(true)} />
      )}
      {!missing && <p>สแกนเพื่อสนับสนุนการพัฒนาหมู่บ้านไพบูลย์</p>}
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

/* ---------- ลวดลายและไอคอน (SVG วาดเอง) ---------- */

function Sprig({ flip }: { flip?: boolean }) {
  return (
    <svg className="ts-sprig" viewBox="0 0 40 20" style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      <path d="M2 10 H36" stroke="#5c7a2e" strokeWidth="1.6" />
      {[8, 16, 24].map((x) => (
        <g key={x}>
          <path d={`M${x} 10 C${x + 2} 3, ${x + 8} 2, ${x + 10} 4 C${x + 7} 9, ${x + 3} 10, ${x} 10 Z`} fill="#6f9a3c" />
          <path d={`M${x} 10 C${x + 2} 17, ${x + 8} 18, ${x + 10} 16 C${x + 7} 11, ${x + 3} 10, ${x} 10 Z`} fill="#86ad4a" />
        </g>
      ))}
    </svg>
  )
}

function Diamond() {
  return (
    <svg className="ts-diamond" viewBox="0 0 30 12" aria-hidden="true">
      <path d="M15 1 L21 6 L15 11 L9 6 Z" fill="#8a6a3e" />
      <circle cx="4" cy="6" r="1.6" fill="#8a6a3e" />
      <circle cx="26" cy="6" r="1.6" fill="#8a6a3e" />
    </svg>
  )
}

function Ornament() {
  return (
    <svg className="ts-ornament" viewBox="0 0 160 30" aria-hidden="true">
      <path d="M80 4 C76 12, 76 18, 80 26 C84 18, 84 12, 80 4 Z" fill="#5c7a2e" />
      <path d="M80 18 C66 6, 52 10, 40 16 C30 21, 18 18, 10 12" fill="none" stroke="#5c7a2e" strokeWidth="2" strokeLinecap="round" />
      <path d="M80 18 C94 6, 108 10, 120 16 C130 21, 142 18, 150 12" fill="none" stroke="#5c7a2e" strokeWidth="2" strokeLinecap="round" />
      <path d="M66 14 C64 8, 70 6, 72 10 C71 14, 68 15, 66 14 Z M94 14 C96 8, 90 6, 88 10 C89 14, 92 15, 94 14 Z" fill="#6f9a3c" />
    </svg>
  )
}

function Vine({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
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
      ].map(([x, y, r], i) => (
        <path
          key={i}
          d="M0 0 C5 -8, 15 -8, 20 0 C15 8, 5 8, 0 0 Z"
          fill={i % 2 ? '#6f8f3a' : '#8fb04a'}
          transform={`translate(${x} ${y}) rotate(${r})`}
        />
      ))}
    </svg>
  )
}

function Flower({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="10" cy="5" rx="3.4" ry="4.6" fill={color} transform={`rotate(${r} 10 10)`} />
      ))}
      <circle cx="10" cy="10" r="2.6" fill="#c9781a" />
    </svg>
  )
}

const ic = { viewBox: '0 0 40 40', 'aria-hidden': true, className: 'ts-ic' } as const

function LeafIcon() {
  return (
    <svg {...ic}>
      <path d="M8 34 C6 18, 16 6, 34 5 C34 22, 24 34, 8 34 Z" fill="#e9f0c9" />
      <path d="M8 34 C14 26, 20 18, 30 9 M14 27 L13 20 M18 22 L24 21 M20 19 L19 13" stroke="#5f8a2c" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  )
}
function ClipboardIcon() {
  return (
    <svg {...ic}>
      <rect x="7" y="7" width="26" height="30" rx="3" fill="#4a2f1a" />
      <rect x="14" y="3" width="12" height="7" rx="2" fill="#4a2f1a" stroke="#f3e2bd" strokeWidth="1.5" />
      <path d="M12 17 H28 M12 23 H28 M12 29 H24" stroke="#f3e2bd" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
function HeartIcon() {
  return (
    <svg {...ic}>
      <path d="M20 35 C8 26, 4 18, 8 12 C11 7, 17 7, 20 12 C23 7, 29 7, 32 12 C36 18, 32 26, 20 35 Z" fill="#fbecd2" />
    </svg>
  )
}
function BookIcon() {
  return (
    <svg {...ic}>
      <path d="M4 9 C10 7, 15 8, 20 11 V34 C15 31, 10 30, 4 32 Z" fill="#2f5a1c" />
      <path d="M36 9 C30 7, 25 8, 20 11 V34 C25 31, 30 30, 36 32 Z" fill="#3c6b24" />
      <path d="M20 11 V34" stroke="#d9e8a8" strokeWidth="1.2" />
    </svg>
  )
}
