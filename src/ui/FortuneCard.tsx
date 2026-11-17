import { ASPECTS, CUPS, FORTUNE_LEVEL, weekStart, type Fortune } from '../game/content/siamsi'

/** ใบคำทำนาย (ใช้ทั้งตอนหยิบจากตู้ และในสมุดเซียมซี) */
export function FortuneCard({ f }: { f: Fortune }) {
  const lv = FORTUNE_LEVEL[f.level]
  return (
    <div className="fortune-slip">
      <div className="fortune-cup">ใบเซียมซี · {CUPS[f.cup].name}</div>
      <div className="fortune-no">เลขที่ {f.no}</div>
      <div className="fortune-level" style={{ background: lv.color }}>
        {lv.label}
      </div>
      <div className="fortune-aspect">{ASPECTS[f.aspect]}</div>
      <p className="fortune-text">{f.text}</p>
      <p className="fortune-advice">คำแนะนำ: {f.advice}</p>
      {f.clue && <p className="fortune-clue">🔎 เบาะแส: {f.clue}</p>}
      {f.bonus && (
        <p className="fortune-bonus">
          🎁 {f.bonus.coins ? `โชคเล็ก ๆ: เงิน +${f.bonus.coins} บาท` : 'ใจเบิกบาน (สนุก +5)'}
        </p>
      )}
      <small className="fortune-week">
        คำทำนายประจำสัปดาห์ที่ {f.week} (วันที่ {weekStart(f.week)}–{weekStart(f.week) + 6}) · ชุดใหม่ทุกวันจันทร์
      </small>
    </div>
  )
}
