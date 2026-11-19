import { useState } from 'react'
import { useGame } from '../game/store'
import { FESTIVALS, isActive, isShiftDate, MONTHS_SHORT, MONTHS_TH, seasonOfDate, thaiDate, today, upcoming, WEEKDAYS_SHORT, WEEKDAYS_TH, ymd } from '../game/content/calendar'
import { joinedThisYear } from '../game/festival'

const SEASON_TH = { hot: 'ฤดูร้อน', rain: 'ฤดูฝน', cool: 'ฤดูหนาว' } as const

/** หน้าปฏิทินในหนังสือ: ตารางเดือน (เลื่อนดูย้อนหลัง/ล่วงหน้าได้) · เทศกาลประจำปี + วันที่เหลือ + ร่วมแล้วหรือยัง */
export function CalendarPages({ Spread }: { Spread: (p: { left: React.ReactNode; right: React.ReactNode }) => React.ReactNode }) {
  useGame((s) => s.save?.festivalLog)
  const now = today()
  const [ym, setYm] = useState<[number, number]>([now.getFullYear(), now.getMonth()])
  const [sel, setSel] = useState<Date>(now)
  const [y, m] = ym
  const first = new Date(y, m, 1, 12)
  const days = new Date(y, m + 1, 0).getDate()
  const cells: (Date | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1, 12))]
  const festOn = (d: Date) => FESTIVALS.filter((f) => isActive(f, d))
  const mainOf = (d: Date) => FESTIVALS.find((f) => f.main[0] === d.getMonth() + 1 && f.main[1] === d.getDate())
  const shift = (k: number) => setYm(([yy, mm]) => (mm + k < 0 ? [yy - 1, 11] : mm + k > 11 ? [yy + 1, 0] : [yy, mm + k]))
  const list = upcoming(now)
  return (
    <Spread
      left={
        <>
          <h2 className="book-h">
            📅 ปฏิทิน <small>วันนี้ {thaiDate(now)}</small>
          </h2>
          <div className="cal-head">
            <button type="button" className="btn small ghost" onClick={() => shift(-1)} aria-label="เดือนก่อน">
              ‹
            </button>
            <b>
              {MONTHS_TH[m]} {y + 543}
            </b>
            <button type="button" className="btn small ghost" onClick={() => shift(1)} aria-label="เดือนถัดไป">
              ›
            </button>
          </div>
          <div className="cal-grid">
            {WEEKDAYS_SHORT.map((w) => (
              <span key={w} className="cal-wd">
                {w}
              </span>
            ))}
            {cells.map((d, i) => {
              if (!d) return <span key={i} />
              const main = mainOf(d)
              return (
                <button
                  key={i}
                  type="button"
                  className={'cal-day' + (ymd(d) === ymd(now) ? ' today' : '') + (ymd(d) === ymd(sel) ? ' sel' : '') + (festOn(d).length ? ' fest' : '')}
                  onClick={() => setSel(d)}
                >
                  {d.getDate()}
                  {main ? <i>{main.icon}</i> : festOn(d).length ? <em /> : null}
                </button>
              )
            })}
          </div>
          <p className="book-hint">
            {thaiDate(sel)} · วัน{WEEKDAYS_TH[sel.getDay()]} · {isShiftDate(sel) ? 'ช่วงเปลี่ยนฤดู' : SEASON_TH[seasonOfDate(sel)]}
          </p>
          {festOn(sel).map((f) => (
            <div key={f.id} className="cal-fest">
              <b>
                {f.icon} {f.name}
              </b>
              <small>{f.note}</small>
            </div>
          ))}
          {!festOn(sel).length && <p className="book-hint">วันธรรมดา — หมู่บ้านเงียบสงบ ชาวบ้านใช้ชีวิตตามปกติ</p>}
        </>
      }
      right={
        <div className="book-scroll">
          <h2 className="book-h">🎉 เทศกาลประจำปี</h2>
          <ul className="cal-list">
            {list.map(({ f, start, days: dd, active }) => (
              <li key={f.id} className={active ? 'on' : ''}>
                <span className="cal-icon">{f.icon}</span>
                <div>
                  <b>{f.name}</b>
                  <small>
                    {f.start[1]} {MONTHS_SHORT[f.start[0] - 1]}
                    {f.start[0] !== f.end[0] || f.start[1] !== f.end[1] ? ' – ' + f.end[1] + ' ' + MONTHS_SHORT[f.end[0] - 1] : ''} ·{' '}
                    {active ? 'กำลังจัดอยู่ตอนนี้!' : dd === 0 ? 'วันนี้' : 'อีก ' + dd + ' วัน (' + thaiDate(start) + ')'}
                    {joinedThisYear(f.id) ? ' · ✓ ปีนี้ร่วมแล้ว' : ''}
                  </small>
                  {active && (
                    <ul className="cal-changes">
                      {f.changes.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="book-hint">ปฏิทินเดินตามวันที่จริง · เทศกาลวนมาทุกปี · ใกล้ถึงงานมีแจ้งเตือนล่วงหน้า 3 วัน</p>
        </div>
      }
    />
  )
}
