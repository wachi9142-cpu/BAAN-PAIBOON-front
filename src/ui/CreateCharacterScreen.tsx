import { useState } from 'react'
import {
  ACCESSORIES,
  ACCESSORY_COLORS,
  BAGS,
  BAG_COLORS,
  CLOTH_COLORS,
  DEFAULT_APPEARANCE,
  EYE_COLORS,
  GENDERS,
  HAIR_COLORS,
  HAIR_STYLES,
  isCustomColor,
  LIP_COLORS,
  OUTFITS,
  POSES,
  SHOES,
  SHOE_COLORS,
  SKIN_TONES,
  byId,
  type AccessoryId,
  type Appearance,
  type BagId,
  type Gender,
  type PoseId,
  type ShoeId,
} from '../game/content/appearance'
import { useGame } from '../game/store'
import { PreviewStage } from '../scenes/PreviewStage'
import { Character } from '../scenes/models/Character'
import { ColorWheel } from './ColorWheel'

const MAX_NAME = 20
/** ตัวเลือกที่แสดงก่อนกด "เพิ่มเติม" */
const SHOW_FIRST = 6

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

  // ชุดของเพศที่เลือก (และชุดทุกเพศ) ขึ้นก่อน ชุดอื่นอยู่ใน "เพิ่มเติม"
  const outfits = [...OUTFITS].sort((a, b) => rank(a.for, look.gender) - rank(b.for, look.gender))
  const outfit = byId(OUTFITS, look.outfit)
  const bottomLabel = outfit.bottomShape === 'pants' || outfit.bottomShape === 'shorts' ? 'สีกางเกง' : 'สีกระโปรง'
  const outfitColorOptions = [{ id: 'outfit', label: 'ตามชุด', color: outfit.top }, ...CLOTH_COLORS]
  const bottomColorOptions = [{ id: 'outfit', label: 'ตามชุด', color: outfit.bottom }, ...CLOTH_COLORS]

  return (
    <div className="setup">
      <div className="setup-stage">
        <PreviewStage camera={[0, 1.3, 5]} target={[0, 0.9, 0]} minDistance={1.6} maxDistance={7}>
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
        <ColorChoiceField label="สีตา" options={EYE_COLORS} value={look.eyeColor ?? 'black'} onChange={(eyeColor) => patch({ eyeColor })} fallbackCustom="#8a4fc0" />
        <ColorChoiceField label="สีปาก" options={LIP_COLORS} value={look.lipColor ?? 'natural'} onChange={(lipColor) => patch({ lipColor })} fallbackCustom="#d0506a" />

        <div className="setup-section">ทรงผม</div>
        <ChipField label="ทรงผม" options={HAIR_STYLES} value={look.hairStyle} onChange={(id) => patch({ hairStyle: id as Appearance['hairStyle'] })} />
        <ColorChoiceField label="สีผม" options={HAIR_COLORS} value={look.hairColor} onChange={(hairColor) => patch({ hairColor })} />

        <div className="setup-section">การแต่งตัว</div>
        <ChipField label="ชุด" options={outfits} value={look.outfit} onChange={(o) => patch({ outfit: o, topColor: 'outfit', bottomColor: 'outfit' })} />
        <ColorChoiceField label="สีเสื้อ" options={outfitColorOptions} value={look.topColor ?? 'outfit'} onChange={(topColor) => patch({ topColor })} fallbackCustom="#c8a8dc" />
        <ColorChoiceField label={bottomLabel} options={bottomColorOptions} value={look.bottomColor ?? 'outfit'} onChange={(bottomColor) => patch({ bottomColor })} fallbackCustom="#3d4f6e" />
        <ChipField label="รองเท้า" options={SHOES} value={look.shoes ?? 'sandals'} onChange={(id) => patch({ shoes: id as ShoeId })} />
        <ColorChoiceField label="สีรองเท้า" options={SHOE_COLORS} value={look.shoeColor ?? 'brown'} onChange={(shoeColor) => patch({ shoeColor })} fallbackCustom="#c4566a" />

        <div className="setup-section">เครื่องประดับ</div>
        <ChipField label="บนศีรษะ / ใบหน้า" options={ACCESSORIES} value={look.accessory ?? 'none'} onChange={(id) => patch({ accessory: id as AccessoryId })} />
        {look.accessory && look.accessory !== 'none' && (
          <ColorChoiceField label="สีเครื่องประดับ" options={ACCESSORY_COLORS} value={look.accessoryColor ?? 'navy'} onChange={(accessoryColor) => patch({ accessoryColor })} fallbackCustom="#e58fa0" />
        )}
        <ChipField label="กระเป๋า" options={BAGS} value={look.bag ?? 'none'} onChange={(id) => patch({ bag: id as BagId })} />
        {look.bag && look.bag !== 'none' && (
          <ColorChoiceField label="สีกระเป๋า" options={BAG_COLORS} value={look.bagColor ?? 'indigo'} onChange={(bagColor) => patch({ bagColor })} fallbackCustom="#5c7a3a" />
        )}

        <div className="setup-section">ท่าทาง</div>
        <ChipField label="ท่ายืน" options={POSES} value={look.pose ?? 'stand'} onChange={(id) => patch({ pose: id as PoseId })} />

        <p className="hint">ลากเมาส์บนตัวละครเพื่อหมุนดูรอบตัว · ล้อเมาส์เพื่อซูมดูใบหน้า</p>

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

function rank(forGender: Gender | undefined, current: Gender) {
  return forGender === current ? 0 : forGender === undefined ? 1 : 2
}

/** แสดง n ตัวแรก + ปุ่ม "เพิ่มเติม" (ตัวที่เลือกอยู่จะแสดงเสมอแม้อยู่ในส่วนที่ซ่อน) */
function useMore<T extends { id: string }>(options: T[], selected: (o: T) => boolean) {
  const [open, setOpen] = useState(false)
  const many = options.length > SHOW_FIRST + 1
  const shown = !many || open ? options : options.filter((o, i) => i < SHOW_FIRST || selected(o))
  const hidden = options.length - shown.length
  const toggle = many ? (
    <button type="button" className="chip more" onClick={() => setOpen((v) => !v)}>
      {open ? 'แสดงน้อยลง ▲' : `เพิ่มเติม (+${hidden}) ▼`}
    </button>
  ) : null
  return { shown, toggle }
}

/** เลือกสี: สีตัวอย่าง + "สีอื่น ๆ" ที่เปิดวงล้อสีให้เลือกได้ทุกสี (ใช้กับสีผม สีปาก สีสัตว์เลี้ยง ฯลฯ) */
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
  const { shown, toggle } = useMore(options, (o) => o.id === value)
  return (
    <div className="field">
      <label>{label}</label>
      <div className="chips">
        {shown.map((o) => (
          <button key={o.id} type="button" className="chip" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
            <span className="swatch" style={{ background: o.color }} />
            {o.label}
          </button>
        ))}
        {toggle}
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
  const { shown, toggle } = useMore(options, (o) => o.id === value)
  return (
    <div className="field">
      <label>{label}</label>
      <div className="chips">
        {shown.map((o) => {
          const swatch = o.color ?? o.top
          return (
            <button key={o.id} type="button" className="chip" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
              {swatch && <span className="swatch" style={{ background: swatch }} />}
              {o.label}
            </button>
          )
        })}
        {toggle}
      </div>
    </div>
  )
}
