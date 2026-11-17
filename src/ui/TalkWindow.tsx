import { useGame } from '../game/store'
import { NPC_INFO } from '../game/content/villagers'
import {
  activeQuest,
  askQuest,
  buyFood,
  chat,
  endTalk,
  finishQuest,
  greet,
  HAWKER_GOODS,
  questReady,
  questText,
  useTalk,
} from '../game/talk'

/** หน้าต่างคุยกับชาวบ้าน: ทักทาย · คุยเล่น · ภารกิจ (ของตอบแทนสุ่ม) · ซื้อของ (แม่ค้า) */
export function TalkWindow() {
  const talking = useTalk((s) => s.talking)
  const line = useTalk((s) => s.line)
  const reward = useTalk((s) => s.reward)
  const tab = useTalk((s) => s.tab)
  // อัปเดตเมื่อของในกระเป๋า/เงินเปลี่ยน (เช็กภารกิจพร้อมส่ง)
  const save = useGame((s) => s.save)
  if (!talking || !save) return null
  const info = NPC_INFO[talking]
  if (!info) return null
  const q = activeQuest(talking)
  const ready = q ? questReady(q) : false

  return (
    <div className="talk" role="dialog" aria-label={`คุยกับ${info.name}`}>
      <div className="talk-name">{info.name}</div>
      <p className="talk-line">“{line}”</p>

      {reward && (
        <div className="talk-reward">
          🎁 ของตอบแทน: <strong>{reward}</strong>
        </div>
      )}
      {q && !reward && (
        <div className={`talk-quest${ready ? ' ready' : ''}`}>
          📜 {questText(q)} {ready && '· พร้อมส่งแล้ว!'}
        </div>
      )}

      {tab === 'shop' ? (
        <>
          <ul className="shop-list">
            {HAWKER_GOODS.map((f) => (
              <li key={f.id} className="shop-row">
                <span className="shop-icon">{f.icon}</span>
                <span className="shop-name">
                  <strong>{f.name}</strong>
                  <small>
                    {f.eat
                      ? [f.eat.hunger && `อิ่ม +${f.eat.hunger}`, f.eat.thirst && `น้ำ +${f.eat.thirst}`, f.eat.fun && `สนุก +${f.eat.fun}`].filter(Boolean).join(' · ')
                      : 'ใช้ล่อสัตว์ป่าได้'}
                  </small>
                </span>
                <button type="button" className="btn small" disabled={save.coins < f.price} onClick={() => buyFood(f)}>
                  {f.price} บาท
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn ghost small" onClick={() => useTalk.setState({ tab: 'main' })}>
            ← กลับ
          </button>
        </>
      ) : (
        <div className="talk-actions">
          <button type="button" className="btn small" onClick={greet}>
            🙏 ทักทาย
          </button>
          <button type="button" className="btn small ghost" onClick={chat}>
            💬 คุยเล่น
          </button>
          {q && ready ? (
            <button type="button" className="btn small" onClick={finishQuest}>
              🎁 ส่งงาน
            </button>
          ) : (
            <button type="button" className="btn small ghost" onClick={askQuest}>
              📜 มีงานให้ช่วยไหม
            </button>
          )}
          {info.vendor && (
            <button type="button" className="btn small" onClick={() => useTalk.setState({ tab: 'shop' })}>
              🛒 ซื้อของ
            </button>
          )}
          <button type="button" className="btn small ghost" onClick={endTalk}>
            ลาก่อน
          </button>
        </div>
      )}
    </div>
  )
}
