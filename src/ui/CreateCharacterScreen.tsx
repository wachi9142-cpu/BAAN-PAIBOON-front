import { useState } from 'react'
import {
  DEFAULT_APPEARANCE,
  GENDERS,
  HAIR_COLORS,
  HAIR_STYLES,
  OUTFITS,
  SKIN_TONES,
  type Appearance,
  type Gender,
} from '../game/content/appearance'
import { useGame } from '../game/store'
import { PreviewStage } from '../scenes/PreviewStage'
import { Character } from '../scenes/models/Character'

const MAX_NAME = 20

export function CreateCharacterScreen() {
  const draft = useGame((s) => s.draft)
  const setDraft = useGame((s) => s.setDraft)
  const goTo = useGame((s) => s.goTo)

  const [name, setName] = useState(draft?.name ?? '')
  const [look, setLook] = useState<Appearance>(draft?.appearance ?? DEFAULT_APPEARANCE.female)

  const patch = (p: Partial<Appearance>) => setLook((l) => ({ ...l, ...p }))
  const chooseGender = (g: Gender) => setLook((l) => (l.gender === g ? l : { ...DEFAULT_APPEARANCE[g] }))

  const trimmed = name.trim()
  const canNext = trimmed.length > 0

  const next = () => {
    if (!canNext) return
    setDraft({ name: trimmed, appearance: look })
    goTo('house')
  }

  return (
    <div className="setup">
      <div className="setup-stage">
        <PreviewStage camera={[0, 1.4, 4.2]} target={[0, 1, 0]} minDistance={2} maxDistance={6}>
          <Character appearance={look} />
        </PreviewStage>
      </div>

      <form
        className="setup-panel"
        onSubmit={(e) => {
          e.preventDefault()
          next()
        }}
      >
        <div>
          <div className="step">ขั้นที่ 1 / 2</div>
          <h2>สร้างตัวละคร</h2>
        </div>

        <div className="field">
          <label htmlFor="name">ชื่อตัวละคร</label>
          <input
            id="name"
            type="text"
            value={name}
            maxLength={MAX_NAME}
            placeholder="เช่น ฟ่าง"
            autoFocus
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <ChipField label="เพศ" options={GENDERS} value={look.gender} onChange={(id) => chooseGender(id as Gender)} />
        <ChipField label="สีผิว" options={SKIN_TONES} value={look.skin} onChange={(skin) => patch({ skin })} />
        <ChipField
          label="ทรงผม"
          options={HAIR_STYLES}
          value={look.hairStyle}
          onChange={(id) => patch({ hairStyle: id as Appearance['hairStyle'] })}
        />
        <ChipField label="สีผม" options={HAIR_COLORS} value={look.hairColor} onChange={(hairColor) => patch({ hairColor })} />
        <ChipField label="เครื่องแต่งกาย" options={OUTFITS} value={look.outfit} onChange={(outfit) => patch({ outfit })} />

        <p className="hint">ลากเมาส์บนตัวละครเพื่อหมุนดูรอบตัว</p>

        <div className="setup-footer">
          <button type="button" className="btn ghost" onClick={() => goTo('title')}>
            ย้อนกลับ
          </button>
          <button type="submit" className="btn" disabled={!canNext}>
            ต่อไป: เลือกบ้าน
          </button>
        </div>
      </form>
    </div>
  )
}

function ChipField({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { id: string; label: string; color?: string; top?: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="chips">
        {options.map((o) => {
          const swatch = o.color ?? o.top
          return (
            <button key={o.id} type="button" className="chip" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
              {swatch && <span className="swatch" style={{ background: swatch }} />}
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
