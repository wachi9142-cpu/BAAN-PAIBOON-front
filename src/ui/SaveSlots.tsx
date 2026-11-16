import { useMemo } from 'react'
import { listSaves } from '../game/save/localSave'
import { formatClock, formatSavedAt, SAVE_REASON_LABEL, useGame, type SaveData } from '../game/store'

const SLOT_NAMES = ['Save 1 · ล่าสุด', 'Save 2 · ก่อนหน้า', 'Save 3 · สำรองเพิ่มเติม']

/** รายการเซฟในเครื่อง (สูงสุด 3 ช่อง) พร้อมปุ่มเล่นจากจุดสำรอง */
export function SaveSlots({ onLoaded }: { onLoaded?: () => void }) {
  const lastSeq = useGame((s) => s.lastSeq)
  const loadBackup = useGame((s) => s.loadBackup)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saves = useMemo(() => listSaves<SaveData>(), [lastSeq])

  return (
    <div className="slots">
      {saves.map((env, i) => (
        <div key={env.seq} className="slot">
          <div>
            <strong>{SLOT_NAMES[i]}</strong>
            <span>
              {formatSavedAt(env.savedAt)} · {SAVE_REASON_LABEL[env.reason] ?? env.reason}
            </span>
            <span>
              วันที่ {env.data.day} · {formatClock(env.data.minuteOfDay)} · {env.data.coins} เหรียญ
            </span>
          </div>
          {i > 0 && (
            <button
              className="btn ghost small"
              onClick={() => {
                loadBackup(env.seq)
                onLoaded?.()
              }}
            >
              เล่นจากจุดนี้
            </button>
          )}
        </div>
      ))}
      {saves.length === 0 && <p className="hint">ยังไม่มีไฟล์เซฟ</p>}
    </div>
  )
}
