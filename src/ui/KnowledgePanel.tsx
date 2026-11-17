import { useState } from 'react'
import { KNOWLEDGE, KNOWLEDGE_CATEGORIES, type KnowledgeCategory } from '../game/content/knowledge'

/** เกร็ดความรู้: การ์ดแบ่งหมวด (ใช้ทั้งหน้าแรกและเมนูเกม) */
export function KnowledgePanel() {
  const [cat, setCat] = useState<KnowledgeCategory | 'all'>('all')
  const cards = cat === 'all' ? KNOWLEDGE : KNOWLEDGE.filter((k) => k.category === cat)
  return (
    <div className="kn">
      <div className="chips" role="tablist" aria-label="หมวดเกร็ดความรู้">
        <button type="button" className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
          ทั้งหมด
        </button>
        {KNOWLEDGE_CATEGORIES.map((c) => (
          <button key={c.id} type="button" className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="kn-grid">
        {cards.map((k) => (
          <article key={k.id} className="kn-card">
            <div className="kn-head">
              <span className="kn-icon" aria-hidden="true">
                {k.icon}
              </span>
              <h4>{k.title}</h4>
            </div>
            {k.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {k.source && <div className="kn-source">ที่มา: {k.source}</div>}
          </article>
        ))}
      </div>
    </div>
  )
}
