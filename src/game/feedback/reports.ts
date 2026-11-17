/**
 * ระบบแจ้งปัญหาเกม / คุยกับผู้พัฒนา
 *
 * - เก็บรายการแจ้งปัญหาไว้ใน localStorage เสมอ (ไม่หายแม้ยังไม่มีเซิร์ฟเวอร์ หรือเน็ตหลุด)
 * - ถ้าตั้ง VITE_API_URL จะส่งเรื่องที่ยังไม่ส่งขึ้นเซิร์ฟเวอร์ และดึงคำตอบ/สถานะจากผู้พัฒนามาอัปเดต
 *
 * สัญญา API ที่คาดไว้ (BAAN-PAIBOON-back):
 *   POST {API}/reports                 body: NewReport          → 200 Report
 *   GET  {API}/reports/mine            (ระบุผู้เล่นด้วย playerKey) → 200 Report[]
 *   POST {API}/reports/:id/messages    body: { text }           → 200 Report
 *   header ทุกคำขอ: X-Player-Key = รหัสสุ่มประจำเครื่อง (ไม่ใช่ข้อมูลส่วนตัว)
 */
import { create } from 'zustand'

export type ReportCategory = 'bug' | 'idea' | 'other'
/** รอรับเรื่อง → กำลังแก้ไข → แก้ไขแล้ว */
export type ReportStatus = 'pending' | 'working' | 'fixed'

export interface ReportMessage {
  from: 'player' | 'dev'
  text: string
  at: number
}

export interface Report {
  id: string
  category: ReportCategory
  title: string
  createdAt: number
  updatedAt: number
  status: ReportStatus
  messages: ReportMessage[]
  /** มีข้อความ/สถานะใหม่จากผู้พัฒนาที่ผู้เล่นยังไม่ได้เปิดดู */
  unread: boolean
  /** ส่งถึงเซิร์ฟเวอร์แล้ว */
  synced: boolean
  /** ข้อมูลเครื่องสำหรับช่วยหาสาเหตุ (ไม่มีข้อมูลส่วนตัว) */
  device?: string
}

export const CATEGORY_LABEL: Record<ReportCategory, { icon: string; label: string }> = {
  bug: { icon: '🐞', label: 'เกมมีปัญหา' },
  idea: { icon: '💡', label: 'ข้อเสนอแนะ' },
  other: { icon: '💬', label: 'อื่น ๆ' },
}

export const STATUS_LABEL: Record<ReportStatus, { icon: string; label: string }> = {
  pending: { icon: '⏳', label: 'รอรับเรื่อง' },
  working: { icon: '🔧', label: 'กำลังแก้ไข' },
  fixed: { icon: '✓', label: 'แก้ไขแล้ว' },
}

const KEY = 'baan-paiboon-reports'
const PLAYER_KEY = 'baan-paiboon-player-key'
const API = import.meta.env.VITE_API_URL as string | undefined

export const reportsOnline = () => !!API

function playerKey() {
  let k = localStorage.getItem(PLAYER_KEY)
  if (!k) {
    k = crypto.randomUUID()
    localStorage.setItem(PLAYER_KEY, k)
  }
  return k
}

function load(): Report[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Report[]) : []
  } catch {
    return []
  }
}

function persist(list: Report[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* พื้นที่เต็ม: ยังอยู่ในหน่วยความจำ จะลองบันทึกใหม่ครั้งหน้า */
  }
}

function deviceInfo() {
  return `${navigator.userAgent} · จอ ${window.innerWidth}×${window.innerHeight}`
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Player-Key': playerKey(), ...init?.headers },
  })
  if (!res.ok) throw new Error(String(res.status))
  return (await res.json()) as T
}

interface ReportState {
  reports: Report[]
  /** สร้างเรื่องใหม่ (เก็บในเครื่องก่อน แล้วค่อยส่ง) */
  submit: (category: ReportCategory, title: string, detail: string) => Report
  /** คุยกับผู้พัฒนาในเรื่องที่รับเรื่องแล้ว */
  sendMessage: (id: string, text: string) => void
  markRead: (id: string) => void
  /** ส่งเรื่องค้างส่ง + ดึงสถานะล่าสุดจากเซิร์ฟเวอร์ */
  sync: () => Promise<void>
  /** (โหมดพัฒนาเท่านั้น) จำลองผู้พัฒนาตอบ เพื่อทดสอบหน้าตา */
  devSimulateReply: (id: string) => void
}

const update = (list: Report[], id: string, fn: (r: Report) => Report) => list.map((r) => (r.id === id ? fn(r) : r))

export const useReports = create<ReportState>((set, get) => {
  const commit = (reports: Report[]) => {
    persist(reports)
    set({ reports })
  }
  return {
    reports: load(),

    submit(category, title, detail) {
      const now = Date.now()
      const report: Report = {
        id: `local-${now.toString(36)}`,
        category,
        title: title.trim(),
        createdAt: now,
        updatedAt: now,
        status: 'pending',
        messages: [{ from: 'player', text: detail.trim(), at: now }],
        unread: false,
        synced: false,
        device: deviceInfo(),
      }
      commit([report, ...get().reports])
      void get().sync()
      return report
    },

    sendMessage(id, text) {
      const now = Date.now()
      commit(
        update(get().reports, id, (r) => ({
          ...r,
          updatedAt: now,
          synced: false,
          messages: [...r.messages, { from: 'player', text: text.trim(), at: now }],
        })),
      )
      void get().sync()
    },

    markRead(id) {
      const r = get().reports.find((x) => x.id === id)
      if (r?.unread) commit(update(get().reports, id, (x) => ({ ...x, unread: false })))
    },

    async sync() {
      if (!API || !navigator.onLine) return
      try {
        // 1) ส่งเรื่อง/ข้อความที่ยังไม่ถึงเซิร์ฟเวอร์
        for (const r of get().reports.filter((x) => !x.synced)) {
          let saved: Report
          if (r.id.startsWith('local-')) {
            saved = await api<Report>('/reports', {
              method: 'POST',
              body: JSON.stringify({ category: r.category, title: r.title, messages: r.messages, device: r.device }),
            })
          } else {
            const last = r.messages[r.messages.length - 1]
            saved = await api<Report>(`/reports/${r.id}/messages`, { method: 'POST', body: JSON.stringify({ text: last.text }) })
          }
          commit(get().reports.map((x) => (x.id === r.id ? { ...saved, unread: false, synced: true } : x)))
        }
        // 2) ดึงสถานะและคำตอบล่าสุด
        const remote = await api<Report[]>('/reports/mine')
        const local = get().reports
        const merged = remote.map((rr) => {
          const old = local.find((x) => x.id === rr.id)
          const devNew =
            !old || old.status !== rr.status || rr.messages.filter((m) => m.from === 'dev').length > old.messages.filter((m) => m.from === 'dev').length
          return { ...rr, synced: true, unread: (old?.unread ?? false) || (!!old && devNew) }
        })
        const pending = local.filter((x) => !x.synced)
        commit([...pending, ...merged].sort((a, b) => b.updatedAt - a.updatedAt))
      } catch {
        /* เซิร์ฟเวอร์ล่ม/เน็ตหลุด: เรื่องยังอยู่ในเครื่อง จะลองส่งใหม่รอบหน้า */
      }
    },

    devSimulateReply(id) {
      const now = Date.now()
      commit(
        update(get().reports, id, (r) => {
          const next: ReportStatus = r.status === 'pending' ? 'working' : 'fixed'
          const text =
            next === 'working'
              ? 'รับเรื่องแล้วครับ กำลังตรวจสอบและแก้ไขให้นะครับ ขอบคุณที่แจ้งมา'
              : 'แก้ไขเรียบร้อยแล้วครับ ลองเข้าเกมใหม่อีกครั้งได้เลย ขอบคุณมากครับ 🙏'
          return { ...r, status: next, updatedAt: now, unread: true, messages: [...r.messages, { from: 'dev', text, at: now }] }
        }),
      )
    },
  }
})

/** จำนวนเรื่องที่มีอัปเดตใหม่ (ใช้กับกระดิ่ง) */
export const useUnreadReports = () => useReports((s) => s.reports.filter((r) => r.unread).length)

// ลองซิงก์เมื่อกลับมาออนไลน์ และทุก 2 นาทีระหว่างเปิดเกม
if (typeof window !== 'undefined' && API) {
  window.addEventListener('online', () => void useReports.getState().sync())
  setInterval(() => void useReports.getState().sync(), 120_000)
  void useReports.getState().sync()
}
