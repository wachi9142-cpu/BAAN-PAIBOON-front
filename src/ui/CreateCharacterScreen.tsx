import { useState } from 'react'
import {
  DEFAULT_APPEARANCE,
  GENDERS,
  HAIR_COLORS,
  HAIR_STYLES,
  isCustomColor,
  LIP_COLORS,
  SHOES,
  SHOE_COLORS,
  BAGS,
  BAG_COLORS,
  type ShoeId,
  type BagId,
  OUTFITS,
  SKIN_TONES,
  type Appearance,
  type Gender,
} from '../game/content/appearance'
import { useGame } from '../game/store'
import { PreviewStage } from '../scenes/PreviewStage'
import { Character } from '../scenes/models/Character'
import { ColorWheel } from './ColorWheel'

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
    setDraft({ name: trimmed, appearance: look, pet: draft?.pet ?? null })
    goTo('pet')
  }

  return (
    <div className="setup">
      <div className="setup-stage">
        <PreviewStage camera={[0, 1.3, 5]} target={[0, 0.9, 0]} minDistance={2.5} maxDistance={7}>
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
          <div className="step">ขั้นที่ 1 / 3</div>
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
        <ColorChoiceField label="สีผม" options={HAIR_COLORS} value={look.hairColor} onChange={(hairColor) => patch({ hairColor })} />
        <ColorChoiceField
          label="สีปาก"
          options={LIP_COLORS}
          value={look.lipColor ?? 'natural'}
          onChange={(lipColor) => patch({ lipColor })}
          fallbackCustom="#d0506a"
        />
        <ChipField label="เครื่องแต่งกาย" options={OUTFITS} value={look.outfit} onChange={(outfit) => patch({ outfit })} />
        <ChipField label="รองเท้า" options={SHOES} value={look.shoes ?? 'sandals'} onChange={(id) => patch({ shoes: id as ShoeId })} />
        <ColorChoiceField
          label="สีรองเท้า"
          options={SHOE_COLORS}
          value={look.shoeColor ?? 'brown'}
          onChange={(shoeColor) => patch({ shoeColor })}
          fallbackCustom="#c4566a"
        />
        <ChipField label="กระเป๋า" options={BAGS} value={look.bag ?? 'none'} onChange={(id) => patch({ bag: id as BagId })} />
        {look.bag && look.bag !== 'none' && (
          <ColorChoiceField
            label="สีกระเป๋า"
            options={BAG_COLORS}
            value={look.bagColor ?? 'indigo'}
            onChange={(bagColor) => patch({ bagColor })}
            fallbackCustom="#5c7a3a"
          />
        )}

        <p className="hint">ลากเมาส์บนตัวละครเพื่อหมุนดูรอบตัว</p>

        <div className="setup-footer">
          <button type="button" className="btn ghost" onClick={() => goTo('title')}>
            ย้อนกลับ
          </button>
          <button type="submit" className="btn" disabled={!canNext}>
            ต่อไป: สัตว์เลี้ยง
          </button>
        </div>
      </form>
    </div>
  )
}

/** เลือกสี: สีตัวอย่าง + "สีอื่น ๆ" ที่เปิดวงล้อสีให้เลือกได้ทุกสี (ใช้กับสีผม สีปาก สีสัตว์เลี้ยง) */
export function ColorChoiceField({
  label,
  options,
  value,
  onChange,
  fallbackCustom = '#b5482a',
}: {
  label: string
  options: { id: string; label: string; color: string }[]
  value: string
  onChange: (v: string) => void
  fallbackCustom?: string
}) {
  const custom = isCustomColor(value)
  const [lastCustom, setLastCustom] = useState(custom ? value : fallbackCustom)
  return (
    <div className="field">
      <label>{label}</label>
      <div className="chips">
        {options.map((o) => (
          <button key={o.id} type="button" className="chip" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
            <span className="swatch" style={{ background: o.color }} />
            {o.label}
          </button>
        ))}
        <button type="button" className="chip" aria-pressed={custom} onClick={() => onChange(lastCustom)}>
          <span className="swatch rainbow" style={custom ? { background: value } : undefined} />
          สีอื่น ๆ
        </button>
      </div>
      {custom && (
        <ColorWheel
          value={value}
          onChange={(hex) => {
            setLastCustom(hex)
            onChange(hex)
          }}
        />
      )}
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
