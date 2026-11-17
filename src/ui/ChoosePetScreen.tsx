import { useEffect, useState } from 'react'
import { colorsFor, PET_HATS, PET_HELD, PET_OUTFITS, PET_OUTFIT_COLORS, PET_SPECIES, applyBreed, breedsFor, defaultPet, getSpecies, patternsFor, type PetChoice, type PetSpecies } from '../game/content/pets'
import { useGame } from '../game/store'
import { playPetSound, voicesFor } from '../game/audio/petSounds'
import { PreviewStage } from '../scenes/PreviewStage'
import { Character } from '../scenes/models/Character'
import { Pet } from '../scenes/models/Pet'
import { ColorChoiceField } from './CreateCharacterScreen'

const MAX_NAME = 16

/** ขั้นที่ 2: เลือกสัตว์เลี้ยง (ไม่บังคับ) */
export function ChoosePetScreen() {
  const draft = useGame((s) => s.draft)
  const setDraft = useGame((s) => s.setDraft)
  const goTo = useGame((s) => s.goTo)

  const [hasPet, setHasPet] = useState(draft?.pet != null)
  const [allBreeds, setAllBreeds] = useState(false)
  const [pet, setPet] = useState<PetChoice>(draft?.pet ?? defaultPet('dog'))

  useEffect(() => {
    if (!draft) goTo('create')
  }, [draft, goTo])
  if (!draft) return null

  const patch = (p: Partial<PetChoice>) => setPet((x) => ({ ...x, ...p }))
  const chooseSpecies = (species: PetSpecies) =>
    setPet((x) => {
      // เปลี่ยนชนิด: ใช้สีเริ่มต้นของชนิดนั้น แต่ถ้าผู้เล่นตั้งชื่อเองแล้ว ให้คงชื่อเดิม
      const fresh = defaultPet(species)
      const customName = x.name.trim() && x.name !== defaultPet(x.species).name
      const keepPattern = patternsFor(species).some((p) => p.id === x.pattern)
      return { ...fresh, name: customName ? x.name : fresh.name, pattern: keepPattern ? x.pattern : 'plain', outfit: x.outfit, outfitColor: x.outfitColor, held: x.held, hat: x.hat, hatColor: x.hatColor }
    })

  const finish = (withPet: boolean) => {
    setDraft({ ...draft, pet: withPet ? { ...pet, name: pet.name.trim() || defaultPet(pet.species).name } : null })
    goTo('house')
  }

  const flies = pet.species === 'bird'
  const sp = getSpecies(pet.species)
  const breeds = breedsFor(pet.species)
  const currentBreed = breeds.find((b) => b.id === pet.breed)
  // สีธรรมชาติของสัตว์ชนิดนั้นเป็นตัวเลือกแรกเสมอ
  const bodyColors = [{ id: 'natural', label: 'สีธรรมชาติ', color: sp.color }, ...colorsFor(pet.species)]
  const accentColors = [{ id: 'natural', label: 'สีธรรมชาติ', color: sp.patternColor }, ...colorsFor(pet.species)]

  return (
    <div className="setup">
      <div className="setup-stage">
        <PreviewStage camera={[1.4, 1.5, 6.2]} target={[0.2, 0.8, 0]} minDistance={2.5} maxDistance={10} decor hint="ลากเพื่อหมุนดู">
          <group position={[-0.4, 0, 0]}>
            <Character appearance={draft.appearance} />
          </group>
          {hasPet && (
            <group position={[0.55, flies ? 1.45 : 0, 0.35]} rotation={[0, -0.5, 0]} scale={pet.species === 'buffalo' || pet.species === 'cow' ? 0.8 : pet.species === 'mouse' ? 2.2 : 1.3}>
              <Pet pet={pet} />
            </group>
          )}
        </PreviewStage>
      </div>

      <div className="setup-panel">
        <div>
          <div className="step">ขั้นที่ 2 / 3</div>
          <h2>สัตว์เลี้ยงคู่ใจ</h2>
        </div>
        <p className="hint" style={{ margin: 0 }}>
          สัตว์เลี้ยงจะเดินตาม{draft.name}ไปทุกที่ในหมู่บ้าน — ไม่เลือกก็ได้
        </p>

        <label className="pet-toggle">
          <input type="checkbox" checked={hasPet} onChange={(e) => setHasPet(e.target.checked)} />
          <span>พาสัตว์เลี้ยงไปด้วย</span>
        </label>

        {hasPet && (
          <>
            <div className="field">
              <label>ชนิดสัตว์</label>
              <div className="chips">
                {PET_SPECIES.map((s) => (
                  <button key={s.id} type="button" className="chip" aria-pressed={s.id === pet.species} onClick={() => chooseSpecies(s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>เสียงร้อง</label>
              <div className="chips">
                {voicesFor(pet.species).map((vo, i) => (
                  <button
                    key={i}
                    type="button"
                    className="chip"
                    aria-pressed={(pet.voice ?? 0) === i}
                    onClick={() => {
                      patch({ voice: i })
                      playPetSound(pet, 0.9, i)
                    }}
                  >
                    🔊 {vo.label}
                  </button>
                ))}
              </div>
            </div>

            {breeds.length > 0 && (
              <div className="field">
                <label>พันธุ์</label>
                <div className="chips">
                  <button
                    type="button"
                    className="chip"
                    aria-pressed={!pet.breed}
                    onClick={() => patch({ breed: undefined, fur: 'short', ears: 'normal', tail: 'normal', size: 'medium', snout: 'normal', hump: false })}
                  >
                    ไม่ระบุพันธุ์
                  </button>
                  {(allBreeds ? breeds : breeds.filter((b, i) => i < 8 || b.id === pet.breed)).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className="chip"
                      title={b.note}
                      aria-pressed={pet.breed === b.id}
                      onClick={() => setPet((x) => applyBreed(x, b))}
                    >
                      <span className="swatch" style={{ background: b.color, borderColor: b.patternColor, borderWidth: 3 }} />
                      {b.label}
                    </button>
                  ))}
                  {breeds.length > 9 && (
                    <button type="button" className="chip more" onClick={() => setAllBreeds((v) => !v)}>
                      {allBreeds ? 'แสดงน้อยลง ▲' : `เพิ่มเติม (+${breeds.length - 8}) ▼`}
                    </button>
                  )}
                </div>
                {currentBreed && <p className="hint" style={{ margin: '6px 0 0' }}>{currentBreed.note} — ปรับสีและลายต่อได้ด้านล่าง</p>}
              </div>
            )}

            <div className="field">
              <label htmlFor="petname">ชื่อสัตว์เลี้ยง</label>
              <input
                id="petname"
                type="text"
                value={pet.name}
                maxLength={MAX_NAME}
                autoComplete="off"
                onChange={(e) => patch({ name: e.target.value })}
              />
            </div>

            <ColorChoiceField
              key={'c' + pet.species}
              label={pet.species === 'turtle' ? 'สีกระดอง' : 'สีตัว'}
              options={bodyColors}
              value={colorChoice(pet.color, bodyColors)}
              onChange={(v) => patch({ color: resolveColor(v, bodyColors) })}
              fallbackCustom={pet.color}
            />

            <div className="field">
              <label>ลาย</label>
              <div className="chips">
                {patternsFor(pet.species).map((p) => (
                  <button key={p.id} type="button" className="chip" aria-pressed={p.id === pet.pattern} onClick={() => patch({ pattern: p.id })}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <ColorChoiceField
              key={'p' + pet.species}
              label={pet.pattern === 'plain' ? `สี${sp.accentParts}` : `สีลาย และสี${sp.accentParts}`}
              options={accentColors}
              value={colorChoice(pet.patternColor, accentColors)}
              onChange={(v) => patch({ patternColor: resolveColor(v, accentColors) })}
              fallbackCustom={pet.patternColor}
            />

            <div className="setup-section">แต่งตัวสัตว์เลี้ยง</div>
            <div className="field">
              <label>ชุด / เครื่องประดับ</label>
              <div className="chips">
                {PET_OUTFITS.map((o) => (
                  <button key={o.id} type="button" className="chip" aria-pressed={(pet.outfit ?? 'none') === o.id} onClick={() => patch({ outfit: o.id, outfitColor: o.color ?? pet.outfitColor })}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>หมวก / ของบนหัว</label>
              <div className="chips">
                {PET_HATS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className="chip"
                    aria-pressed={(pet.hat ?? 'none') === h.id}
                    onClick={() => patch({ hat: h.id, hatColor: h.color ?? pet.hatColor })}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
            {pet.hat && pet.hat !== 'none' && (
              <ColorChoiceField
                label="สีหมวก"
                options={PET_OUTFIT_COLORS}
                value={colorChoice(pet.hatColor ?? '#e58fa0', PET_OUTFIT_COLORS)}
                onChange={(v) => patch({ hatColor: resolveColor(v, PET_OUTFIT_COLORS) })}
                fallbackCustom="#c9b3e6"
              />
            )}
            <div className="field">
              <label>ของตกแต่ง</label>
              <div className="chips">
                {PET_HELD.map((o) => (
                  <button key={o.id} type="button" className="chip" aria-pressed={(pet.held ?? 'none') === o.id} onClick={() => patch({ held: o.id })}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {pet.outfit && pet.outfit !== 'none' && (
              <ColorChoiceField
                label="สีชุด"
                options={PET_OUTFIT_COLORS}
                value={colorChoice(pet.outfitColor ?? '#d23a3a', PET_OUTFIT_COLORS)}
                onChange={(v) => patch({ outfitColor: resolveColor(v, PET_OUTFIT_COLORS) })}
                fallbackCustom="#c9b3e6"
              />
            )}
          </>
        )}

        <p className="hint">ลากเมาส์บนภาพเพื่อหมุนดูรอบตัว</p>

        <div className="setup-footer">
          <button type="button" className="btn ghost" onClick={() => goTo('create')}>
            ย้อนกลับ
          </button>
          <button type="button" className="btn" onClick={() => finish(hasPet)}>
            {hasPet ? 'ต่อไป: เลือกบ้าน' : 'ข้าม: ไม่มีสัตว์เลี้ยง'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** สีที่เก็บเป็น hex เสมอ → แปลงกลับเป็น id ถ้าตรงกับสีตัวอย่าง (ให้ปุ่มสีตัวอย่างขึ้นว่าเลือกอยู่) */
type Opt = { id: string; color: string }
function colorChoice(hex: string, opts: Opt[]) {
  return opts.find((c) => c.color.toLowerCase() === hex.toLowerCase())?.id ?? hex
}
function resolveColor(v: string, opts: Opt[]) {
  return v.startsWith('#') ? v : (opts.find((c) => c.id === v)?.color ?? v)
}
