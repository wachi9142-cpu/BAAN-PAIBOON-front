import { useEffect, useRef, useState } from 'react'
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  reportsOnline,
  useReports,
  type Report,
  type ReportCategory,
  type ReportStatus,
} from '../game/feedback/reports'

type View = { kind: 'list' } | { kind: 'new' } | { kind: 'detail'; id: string }

const fmt = (t: number) =>
  new Date(t).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** แจ้งปัญหาเกม: ประวัติเรื่องที่แจ้ง + สถานะ + คุยกับผู้พัฒนา (ใช้ทั้งหน้าแรกและเมนูเกม) */
export function ReportPanel() {
  const reports = useReports((s) => s.reports)
  const [view, setView] = useState<View>(reports.length ? { kind: 'list' } : { kind: 'new' })

  useEffect(() => {
    void useReports.getState().sync()
  }, [])

  if (view.kind === 'new') return <NewReportForm hasList={reports.length > 0} onDone={(id) => setView(id ? { kind: 'detail', id } : { kind: 'list' })} />
  if (view.kind === 'detail') {
    const r = reports.find((x) => x.id === view.id)
    if (r) return <ReportDetail report={r} onBack={() => setView({ kind: 'list' })} />
  }

  return (
    <div className="rp">
      <div className="rp-bar">
        <p className="hint">เรื่องที่คุณแจ้งไว้ {reports.length} เรื่อง</p>
        <button type="button" className="btn small" onClick={() => setView({ kind: 'new' })}>
          + แจ้งปัญหาใหม่
        </button>
      </div>
      <OfflineNote />
      <ul className="rp-list">
        {reports.map((r) => (
          <li key={r.id}>
            <button type="button" className={`rp-item${r.unread ? ' unread' : ''}`} onClick={() => setView({ kind: 'detail', id: r.id })}>
              <span className="rp-cat" aria-hidden="true">
                {CATEGORY_LABEL[r.category].icon}
              </span>
              <span className="rp-main">
                <strong>{r.title}</strong>
                <small>
                  {CATEGORY_LABEL[r.category].label} · {fmt(r.updatedAt)}
                </small>
              </span>
              {r.unread && <span className="rp-new">ใหม่</span>}
              <StatusBadge status={r.status} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const s = STATUS_LABEL[status]
  return (
    <span className={`rp-status ${status}`}>
      <span aria-hidden="true">{s.icon}</span> {s.label}
    </span>
  )
}

function OfflineNote() {
  if (reportsOnline()) return null
  return <p className="rp-note">ตอนนี้ระบบยังไม่เชื่อมกับเซิร์ฟเวอร์ เรื่องที่แจ้งจะเก็บไว้ในเครื่องก่อน และส่งถึงผู้พัฒนาอัตโนมัติเมื่อระบบพร้อม</p>
}

function NewReportForm({ hasList, onDone }: { hasList: boolean; onDone: (id?: string) => void }) {
  const submit = useReports((s) => s.submit)
  const [category, setCategory] = useState<ReportCategory>('bug')
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const ok = title.trim().length > 0 && detail.trim().length > 0

  return (
    <form
      className="rp rp-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (ok) onDone(submit(category, title, detail).id)
      }}
    >
      <div className="field">
        <label>เรื่องอะไร</label>
        <div className="chips">
          {(Object.keys(CATEGORY_LABEL) as ReportCategory[]).map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABEL[c].icon} {CATEGORY_LABEL[c].label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor="rp-title">หัวข้อ</label>
        <input
          id="rp-title"
          type="text"
          maxLength={80}
          value={title}
          placeholder={category === 'bug' ? 'เช่น สัตว์เลี้ยงเดินทะลุบ้าน' : 'เช่น อยากให้มีตลาดนัด'}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="rp-detail">รายละเอียด</label>
        <textarea
          id="rp-detail"
          rows={4}
          maxLength={1000}
          value={detail}
          placeholder={category === 'bug' ? 'เกิดอะไรขึ้น ทำอะไรอยู่ตอนนั้น' : 'เล่าให้ฟังได้เลย'}
          onChange={(e) => setDetail(e.target.value)}
        />
      </div>
      <p className="hint">ระบบจะแนบข้อมูลเบราว์เซอร์และขนาดจอไปด้วย เพื่อช่วยหาสาเหตุ (ไม่มีข้อมูลส่วนตัว)</p>
      <div className="rp-actions">
        {hasList && (
          <button type="button" className="btn ghost small" onClick={() => onDone()}>
            ← ย้อนกลับ
          </button>
        )}
        <button type="submit" className="btn small" disabled={!ok}>
          ส่งเรื่อง
        </button>
      </div>
    </form>
  )
}

function ReportDetail({ report: r, onBack }: { report: Report; onBack: () => void }) {
  const { sendMessage, markRead, devSimulateReply } = useReports.getState()
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  // ผู้พัฒนารับเรื่องแล้ว (สถานะไม่ใช่ "รอรับเรื่อง") จึงคุยต่อได้
  const canChat = r.status !== 'pending'

  useEffect(() => {
    markRead(r.id)
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [r.id, r.messages.length, markRead])

  const steps: ReportStatus[] = ['pending', 'working', 'fixed']
  const at = steps.indexOf(r.status)

  return (
    <div className="rp rp-detail">
      <div className="rp-bar">
        <button type="button" className="btn ghost small" onClick={onBack}>
          ← เรื่องทั้งหมด
        </button>
        <StatusBadge status={r.status} />
      </div>
      <h3 className="rp-title">
        {CATEGORY_LABEL[r.category].icon} {r.title}
      </h3>
      <ol className="rp-steps" aria-label="สถานะ">
        {steps.map((s, i) => (
          <li key={s} className={i <= at ? 'done' : ''}>
            <span className="dot">{i < at || r.status === 'fixed' ? '✓' : i + 1}</span>
            {STATUS_LABEL[s].label}
          </li>
        ))}
      </ol>
      <div className="rp-thread">
        {r.messages.map((m, i) => (
          <div key={i} className={`rp-msg ${m.from}`}>
            <div className="who">{m.from === 'dev' ? '🛠️ ผู้พัฒนา' : 'คุณ'}</div>
            <div className="bubble">{m.text}</div>
            <div className="when">{fmt(m.at)}</div>
          </div>
        ))}
        <div ref={end} />
      </div>
      {!r.synced && <OfflineNote />}
      {canChat ? (
        <form
          className="rp-chat"
          onSubmit={(e) => {
            e.preventDefault()
            if (!text.trim()) return
            sendMessage(r.id, text)
            setText('')
          }}
        >
          <input type="text" value={text} maxLength={500} placeholder="พิมพ์ข้อความถึงผู้พัฒนา…" onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn small" disabled={!text.trim()}>
            คุยกับผู้พัฒนา
          </button>
        </form>
      ) : (
        <p className="rp-note">รอผู้พัฒนารับเรื่องก่อน แล้วจะคุยกับผู้พัฒนาต่อได้ที่นี่ · มีกระดิ่งแจ้งเตือนเมื่อมีคำตอบ 🔔</p>
      )}
      {import.meta.env.DEV && r.status !== 'fixed' && (
        <button type="button" className="rp-dev" onClick={() => devSimulateReply(r.id)}>
          (ทดสอบ) จำลองผู้พัฒนาตอบ
        </button>
      )}
    </div>
  )
}
