import { ACTIVITY_INFO, WATER, type WaterActivity } from '../game/content/water'
import { countOf } from '../game/inventory'
import { useGame } from '../game/store'
import { boardBoat, startFishing, toggleVest, useWater } from '../game/water'

/** หน้าต่างเลือกกิจกรรมเมื่อเข้าใกล้น้ำ (กิจกรรมต่างกันตามแหล่งน้ำ) */
export function WaterMenu() {
  const menu = useWater((s) => s.menu)
  const vest = useWater((s) => s.vest)
  useGame((s) => s.save?.inventory)
  if (!menu) return null
  const body = WATER.find((w) => w.id === menu)
  if (!body) return null
  const close = () => useWater.setState({ menu: null })
  const toast = (title: string, b: string) => useGame.getState().toast({ title, body: b, tone: 'info' })
  const run = (a: WaterActivity) => {
    if (a === 'fish') startFishing()
    else if (a === 'vest') toggleVest()
    else if (a === 'boat') boardBoat(body.id)
    else if (a === 'swim') {
      close()
      toast('🌊 เดินลงน้ำได้เลย', vest ? 'ใส่เสื้อชูชีพแล้ว ลอยตัวสบาย ว่ายได้ไม่เหนื่อย' : 'ริมตลิ่งตื้นลุยได้ · กลางบ่อลึกต้องว่าย ดูแถบแรงว่ายด้วยนะ (ใส่เสื้อชูชีพปลอดภัยกว่า)')
    } else {
      close()
      toast('🌸 เก็บดอกบัว', 'เดินลุยน้ำหรือพายเรือเข้าไปใกล้ดอกบัว แล้วกด E')
    }
  }
  return (
    <div className="menu-backdrop" onClick={close}>
      <div className="menu water-win" role="dialog" aria-label={`กิจกรรมทางน้ำ ${body.name}`} onClick={(e) => e.stopPropagation()}>
        <h3>💧 {body.name}</h3>
        <p className="hint">ลึกสุดประมาณ {body.maxDepth.toFixed(1)} ม. · {vest ? '🦺 สวมเสื้อชูชีพอยู่' : 'ยังไม่ได้สวมเสื้อชูชีพ'}</p>
        <div className="water-acts">
          {body.activities.map((a) => {
            const info = ACTIVITY_INFO[a]
            const label = a === 'vest' ? (vest ? 'ถอดเสื้อชูชีพ' : 'สวมเสื้อชูชีพ') : info.name
            const note = a === 'fish' ? (countOf('rod') > 0 ? 'มีเบ็ดแล้ว เหวี่ยงได้เลย' : info.note) : info.note
            return (
              <button key={a} type="button" className="water-act" onClick={() => run(a)}>
                <span className="water-act-icon">{info.icon}</span>
                <strong>{label}</strong>
                <small>{note}</small>
              </button>
            )
          })}
        </div>
        <button type="button" className="btn small ghost" onClick={close}>
          ปิด
        </button>
      </div>
    </div>
  )
}

/** แถบแรงว่ายน้ำ (แสดงเฉพาะตอนอยู่ในน้ำลึก) */
export function SwimBar() {
  const mode = useWater((s) => s.mode)
  const stamina = useWater((s) => s.stamina)
  const vest = useWater((s) => s.vest)
  const fishing = useWater((s) => s.fishing)
  if (fishing) return <div className="swim-bar">🎣 รอปลากินเบ็ด… (เดินเพื่อเลิก)</div>
  if (mode === 'boat') return <div className="swim-bar">🚣 พายเรืออยู่ · เดินหน้า/เลี้ยวเพื่อพาย</div>
  if (mode === 'struggle' || mode === 'rescue') return <div className="swim-bar danger">🆘 {mode === 'rescue' ? 'กำลังถูกพาเข้าฝั่ง…' : 'หมดแรง! กำลังรอคนมาช่วย…'}</div>
  if (mode !== 'swim') return null
  const low = !vest && stamina < 30
  return (
    <div className={`swim-bar${low ? ' danger' : ''}`}>
      <span>{vest ? '🦺 ลอยตัว' : '🏊 แรงว่าย'}</span>
      <span className="swim-track">
        <span className="swim-fill" style={{ width: `${stamina}%` }} />
      </span>
      {low && <span>ใกล้หมดแรง! ว่ายเข้าฝั่ง</span>}
    </div>
  )
}
