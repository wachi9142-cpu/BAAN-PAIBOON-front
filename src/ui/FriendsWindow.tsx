import { useEffect, useState } from 'react'
import { useGame } from '../game/store'
import {
  acceptInvite,
  addDemoFriends,
  addFriendByCode,
  cancelPending,
  declineInvite,
  demoInvite,
  inviteProblem,
  MAX_PLAYERS,
  myId,
  openFriends,
  ONLINE_READY,
  sendInvite,
  useSocial,
} from '../game/social'
import { AvatarImg, AvatarStudio } from './Avatar'

/** หน้าต่างเพื่อน: โปรไฟล์ของฉัน (รหัสผู้เล่น) · เพิ่มเพื่อน (+) · ค้นหา · รายชื่อ + ออนไลน์/ออฟไลน์ · + เชิญเข้าโลก */
export function FriendsWindow() {
  const open = useSocial((s) => s.windowOpen)
  const profiles = useSocial((s) => s.profiles)
  const friendIds = useSocial((s) => s.friendIds)
  const pending = useSocial((s) => s.pending)
  const invited = useSocial((s) => s.invited)
  const guests = useSocial((s) => s.guests)
  const roomOpen = useSocial((s) => s.roomOpen)
  const save = useGame((s) => s.save)
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [code, setCode] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  if (!open || !save) return null
  const close = () => useSocial.setState({ windowOpen: false })
  const me = myId()
  const list = friendIds
    .map((id) => profiles[id])
    .filter(Boolean)
    .filter((p) => !q.trim() || p.name.includes(q.trim()) || p.id.includes(q.trim().toUpperCase()))
    .sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name, 'th'))
  const onlineCount = friendIds.filter((id) => profiles[id]?.online).length
  return (
    <div className="menu-backdrop" onClick={close}>
      <div className="menu friends-win" role="dialog" aria-label="เพื่อน" onClick={(e) => e.stopPropagation()}>
        <div className="party-head">
          <h3>👥 เพื่อน</h3>
          <span className="party-count">
            ออนไลน์ <b className="act">{onlineCount}</b>/{friendIds.length} · โลกของฉัน {roomOpen ? `${1 + guests.length}/${MAX_PLAYERS} คน` : 'ยังไม่เปิดห้อง'}
          </span>
          <button type="button" className="btn small ghost" onClick={close}>
            ปิด
          </button>
        </div>

        {/* โปรไฟล์ของฉัน = ชื่อ + รูปเดียวกับที่เพื่อนเห็น */}
        <div className="fr-me">
          <AvatarImg look={save.player.appearance} name={save.player.name} size={52} />
          <div className="fr-who">
            <strong>{save.player.name}</strong>
            <small>
              รหัสผู้เล่นของฉัน <code>{me}</code>
            </small>
          </div>
          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              void navigator.clipboard?.writeText(me).then(() => setCopied(true))
              window.setTimeout(() => setCopied(false), 1500)
            }}
          >
            {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกรหัส'}
          </button>
        </div>

        <div className="fr-tools">
          <input className="fr-search" placeholder="🔍 ค้นหาเพื่อน (ชื่อหรือรหัส)" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="button" className="btn small" onClick={() => setAdding((v) => !v)}>
            ＋ เพิ่มเพื่อน
          </button>
        </div>
        {adding && (
          <form
            className="fr-add"
            onSubmit={(e) => {
              e.preventDefault()
              const why = addFriendByCode(code)
              setErr(why)
              if (!why) {
                setCode('')
                setAdding(false)
              }
            }}
          >
            <input autoFocus placeholder="ใส่รหัสผู้เล่นของเพื่อน เช่น BP-7K2Q-94MD" value={code} onChange={(e) => setCode(e.target.value)} />
            <button type="submit" className="btn small">
              ส่งคำขอ
            </button>
            {err && <span className="fr-err">{err}</span>}
          </form>
        )}

        <div className="fr-list">
          {list.length === 0 && pending.length === 0 && <p className="hint">ยังไม่มีเพื่อน — กด ＋ เพิ่มเพื่อน แล้วใส่รหัสผู้เล่นของเพื่อน</p>}
          {list.map((p) => {
            const why = inviteProblem(p.id)
            const sent = invited.includes(p.id)
            const inWorld = guests.includes(p.id)
            return (
              <div key={p.id} className={`fr-row${p.online ? '' : ' off'}`}>
                <span className="fr-av">
                  <AvatarImg look={p.appearance} name={p.name} size={42} />
                  <i className={`fr-dot${p.online ? ' on' : ''}`} />
                </span>
                <div className="fr-who">
                  <strong>{p.name}</strong>
                  <small>
                    {p.online ? 'ออนไลน์' : 'ออฟไลน์'}
                    {p.online && p.roomCount > 0 ? ` · โลกของเขา ${p.roomCount}/${MAX_PLAYERS}` : ''}
                    {inWorld ? ' · อยู่ในโลกของคุณ' : sent ? ' · ส่งคำเชิญแล้ว' : ''}
                    {p.demo ? ' · ตัวอย่าง' : ''}
                  </small>
                </div>
                <button
                  type="button"
                  className="fr-plus"
                  disabled={!!why}
                  title={why ?? `เชิญ ${p.name} เข้าโลกของคุณ`}
                  aria-label={`เชิญ ${p.name}`}
                  onClick={() => sendInvite(p.id)}
                >
                  ＋
                </button>
              </div>
            )
          })}
          {pending.map((c) => (
            <div key={c} className="fr-row off">
              <span className="fr-av">
                <span className="avatar-img wait" style={{ width: 42, height: 42, fontSize: 16 }}>
                  ?
                </span>
              </span>
              <div className="fr-who">
                <strong>{c}</strong>
                <small>ส่งคำขอเป็นเพื่อนแล้ว · รอตอบรับ</small>
              </div>
              <button type="button" className="btn small ghost" onClick={() => cancelPending(c)}>
                ยกเลิก
              </button>
            </div>
          ))}
        </div>

        {!ONLINE_READY && <p className="hint">ระบบออนไลน์ยังไม่เปิด: หน้าจอนี้ใช้ได้ครบ แต่การส่งคำขอ/คำเชิญถึงเพื่อนจริงจะทำงานเมื่อมีเซิร์ฟเวอร์</p>}
        {import.meta.env.DEV && (
          <div className="layout-row">
            <button type="button" className="btn small ghost" onClick={addDemoFriends}>
              🧪 เพื่อนตัวอย่าง
            </button>
            <button type="button" className="btn small ghost" onClick={() => window.setTimeout(demoInvite, 1500)}>
              🧪 จำลองคำเชิญ (1.5 วิ)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const INVITE_TTL = 60_000

/** หน้าต่างคำเชิญบนจอของเพื่อน — ขึ้นทันทีแม้กำลังเล่นในโลกตัวเอง (ไม่หยุดเกม) */
export function InvitePopup() {
  const invites = useSocial((s) => s.invites)
  const profiles = useSocial((s) => s.profiles)
  const [, tick] = useState(0)
  useEffect(() => {
    if (!invites.length) return
    const t = window.setInterval(() => {
      const now = Date.now()
      for (const i of useSocial.getState().invites) if (now - i.at > INVITE_TTL) declineInvite(i.id)
      tick((n) => n + 1)
    }, 500)
    return () => window.clearInterval(t)
  }, [invites.length])
  const inv = invites[0]
  return (
    <>
      <AvatarStudio />
      {inv && (() => {
        const host = profiles[inv.fromId]
        const name = host?.name ?? 'ผู้เล่น'
        const left = Math.max(0, 1 - (Date.now() - inv.at) / INVITE_TTL)
        return (
          <div className="invite-pop" role="alertdialog" aria-label="คำเชิญจากเพื่อน">
            <div className="invite-title">
              คำเชิญจากเพื่อน{invites.length > 1 && <span className="gm-badge">{invites.length}</span>}
            </div>
            <div className="invite-body">
              <AvatarImg look={host?.appearance} name={name} size={72} />
              <div>
                <strong>{name}</strong>
                <small>เจ้าของโลก · {host?.online ? 'ออนไลน์' : 'ออฟไลน์'}</small>
                <span>เชิญคุณเข้าร่วมโลกของเขา</span>
              </div>
            </div>
            <div className="invite-actions">
              <button type="button" className="invite-yes" onClick={() => acceptInvite(inv.id)}>
                <span>✓</span>เข้าร่วม
              </button>
              <button type="button" className="invite-no" onClick={() => declineInvite(inv.id)}>
                <span>✕</span>ปฏิเสธ
              </button>
            </div>
            <div className="invite-timer">
              <i style={{ width: `${left * 100}%` }} />
            </div>
          </div>
        )
      })()}
    </>
  )
}

/** ปุ่ม 👥 บนแถบด้านบน (มีจุดเขียว = จำนวนเพื่อนออนไลน์) */
export function FriendsButton() {
  const profiles = useSocial((s) => s.profiles)
  const ids = useSocial((s) => s.friendIds)
  const on = ids.filter((id) => profiles[id]?.online).length
  return (
    <button type="button" className="btn small ghost hud-ic" onClick={openFriends} title="เพื่อน · เชิญเพื่อนเข้าโลก" aria-label="เพื่อน">
      👥{on > 0 && <span className="gm-badge">{on}</span>}
    </button>
  )
}
