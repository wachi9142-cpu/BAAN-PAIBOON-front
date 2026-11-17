import { useState } from 'react'
import { useGame } from '../game/store'
import { acceptJob, boardQuest, handInJob, jobReady, jobText, noticesFor, useBoard } from '../game/noticeboard'
import { BOARDS, SEASONS, seasonOf, type NoticeKind } from '../game/content/noticeboard'

const TABS: { id: NoticeKind | 'all'; label: string }[] = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'news', label: '📰 ข่าวสาร' },
  { id: 'event', label: '🎉 กิจกรรม' },
  { id: 'job', label: '📜 ภารกิจ' },
]

/** หน้าต่างอ่านประกาศบนบอร์ด — กระดาษติดบอร์ดไม้ */
export function NoticeBoardWindow() {
  const open = useBoard((s) => s.open)
  const save = useGame((s) => s.save)
  const [tab, setTab] = useState<NoticeKind | 'all'>('all')
  if (!open || !save) return null
  const board = BOARDS[open]
  const day = save.day
  const list = noticesFor(open, day).filter((n) => tab === 'all' || n.kind === tab)
  // งานจากบอร์ดนี้ที่รับไว้ในวันก่อน ๆ (ยังส่งได้ที่บอร์ดเดิม)
  const older = save.quests.filter((q) => q.npcId.startsWith(`board:${open}:`) && !q.npcId.startsWith(`board:${open}:${day}:`))
  const close = () => useBoard.setState({ open: null })
  return (
    <div className="menu-backdrop" onClick={close}>
      <div className="menu notice-win" role="dialog" aria-label={board.name} onClick={(e) => e.stopPropagation()}>
        <div className="notice-head">
          <h3>📌 {board.name}</h3>
          <span className="notice-day">
            วันที่ {day} · {SEASONS[seasonOf(day)].icon} {SEASONS[seasonOf(day)].label}
          </span>
        </div>
        <p className="hint">{board.theme} · ประกาศใหม่ทุกวัน</p>
        <div className="chips">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`chip${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="notice-grid">
          {list.map((n, i) => {
            const q = n.kind === 'job' ? boardQuest(n.id) : undefined
            return (
              <article key={n.id} className={`notice-paper ${n.kind}`} style={{ rotate: `${((i % 3) - 1) * 0.8}deg` }}>
                <span className="notice-pin" aria-hidden="true" />
                <h4>
                  {n.icon} {n.title}
                </h4>
                <p>{n.detail}</p>
                <dl>
                  <dt>ประกาศ</dt>
                  <dd>วันที่ {n.posted}</dd>
                  <dt>{n.kind === 'job' ? 'ส่งภายใน' : 'เวลา'}</dt>
                  <dd>{n.when}</dd>
                  {n.kind === 'job' && (
                    <>
                      <dt>ต้องการ</dt>
                      <dd>{jobText(n)}</dd>
                    </>
                  )}
                  {n.terms && (
                    <>
                      <dt>เงื่อนไข</dt>
                      <dd>{n.terms}</dd>
                    </>
                  )}
                  {n.reward && (
                    <>
                      <dt>รางวัล</dt>
                      <dd>{n.reward}</dd>
                    </>
                  )}
                </dl>
                {n.kind === 'job' &&
                  (q ? (
                    <button type="button" className="btn small" disabled={!jobReady(q)} onClick={() => handInJob(n)}>
                      {jobReady(q) ? '✅ ส่งงาน' : '⏳ รับแล้ว — ยังไม่ครบ'}
                    </button>
                  ) : (
                    <button type="button" className="btn small" onClick={() => acceptJob(n)}>
                      📜 รับงานนี้
                    </button>
                  ))}
              </article>
            )
          })}
          {list.length === 0 && <p className="hint">ไม่มีประกาศในหมวดนี้วันนี้</p>}
        </div>
        {older.length > 0 && (
          <div className="notice-older">
            <strong>งานที่รับไว้จากบอร์ดนี้:</strong>
            {older.map((q) => (
              <span key={q.npcId}>
                {q.title} {jobReady(q) ? '✅ ' : ''}
                <button
                  type="button"
                  className="btn small ghost"
                  disabled={!jobReady(q)}
                  onClick={() => {
                    const [b, d, j] = q.npcId.slice(6).split(':')
                    const n = noticesFor(b as typeof open, Number(d)).find((x) => x.id === `${b}:${d}:${j}`)
                    if (n) handInJob(n)
                  }}
                >
                  ส่งงาน
                </button>
              </span>
            ))}
          </div>
        )}
        <button type="button" className="btn ghost small" onClick={close}>
          ปิด (Esc)
        </button>
      </div>
    </div>
  )
}
