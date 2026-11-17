/**
 * บอร์ดประกาศประจำหมู่บ้าน: กด E อ่านประกาศ · รับงานจากบอร์ด · นำของ/สัตว์มาส่งที่บอร์ดเดิม รับรางวัลที่บอกไว้ชัดเจน
 */
import { create } from 'zustand'
import { useGame, type QuestState } from './store'
import { addItem, countOf } from './inventory'
import { ITEMS } from './content/items'
import { getSpecies } from './content/pets'
import { BOARDS, noticesFor, type BoardId, type Notice } from './content/noticeboard'

export const useBoard = create<{ open: BoardId | null }>(() => ({ open: null }))

const toast = (title: string, body?: string, tone: 'info' | 'success' | 'warn' | 'discover' = 'info') => useGame.getState().toast({ title, body, tone })

export const isBoard = (placeId: string | null): placeId is BoardId => !!placeId && placeId in BOARDS

export function openBoard(id: BoardId) {
  const g = useGame.getState()
  if (!g.save) return
  useBoard.setState({ open: id })
  // จำว่าอ่านประกาศของวันนี้แล้ว (ป้าย ! บนบอร์ดจะหายไป)
  useGame.setState({ save: { ...g.save, boardSeen: { ...(g.save.boardSeen ?? {}), [id]: g.save.day } }, dirty: true })
}

/** ภารกิจจากบอร์ดที่รับไว้ */
export const boardQuest = (noticeId: string): QuestState | undefined => useGame.getState().save?.quests.find((q) => q.npcId === 'board:' + noticeId)

export function jobText(n: Notice) {
  const j = n.job!
  return j.kind === 'bring' ? `${ITEMS[j.item!].name} ${j.qty} ชิ้น` : `${getSpecies(j.species!).label} 1 ตัว (จับด้วยคฑาหรือมือ)`
}

export function jobReady(q: QuestState) {
  const g = useGame.getState().save
  if (!g) return false
  if (q.kind === 'bring') return countOf(q.item!) >= q.qty
  return g.collection.length > (q.startCount ?? 0) && g.collection.slice(q.startCount ?? 0).some((c) => c.pet.species === q.species)
}

export function acceptJob(n: Notice) {
  const g = useGame.getState()
  if (!g.save || !n.job) return
  if (boardQuest(n.id)) return
  const mine = g.save.quests.filter((q) => q.npcId.startsWith('board:')).length
  if (mine >= 3) {
    toast('รับงานจากบอร์ดได้ครั้งละ 3 งาน', 'ส่งงานที่รับไว้ก่อน แล้วค่อยมารับใหม่', 'warn')
    return
  }
  const q: QuestState = {
    npcId: 'board:' + n.id,
    kind: n.job.kind,
    item: n.job.item,
    species: n.job.species,
    qty: n.job.qty,
    startCount: g.save.collection.length,
    title: n.title,
    coins: n.job.coins,
    bonus: n.job.bonus,
    until: n.until,
  }
  useGame.setState({ save: { ...g.save, quests: [...g.save.quests, q] }, dirty: true })
  g.saveNow('event')
  toast(`📜 รับงาน: ${n.title}`, `นำ${jobText(n)} มาส่งที่${BOARDS[n.id.split(':')[0] as BoardId].name}`, 'info')
}

export function handInJob(n: Notice) {
  const g = useGame.getState()
  const q = boardQuest(n.id)
  if (!g.save || !q) return
  if (!jobReady(q)) {
    toast('ยังไม่ครบนะ', `ต้องการ${jobText(n)}`, 'warn')
    return
  }
  let save = g.save
  if (q.kind === 'bring') {
    const inv = { ...save.inventory }
    inv[q.item!] = (inv[q.item!] ?? 0) - q.qty
    if ((inv[q.item!] ?? 0) <= 0) delete inv[q.item!]
    save = { ...save, inventory: inv }
  }
  save = { ...save, quests: save.quests.filter((x) => x !== q), questsDone: (save.questsDone ?? 0) + 1 }
  useGame.setState({ save, dirty: true })
  const coins = q.coins ?? 0
  const late = q.until !== undefined && save.day > q.until
  const pay = late ? Math.round(coins / 2) : coins
  if (pay > 0) useGame.getState().addCoins(pay, `งานจากบอร์ด: ${q.title ?? ''}`)
  let bonus = ''
  if (q.bonus && !late && addItem(q.bonus.item, q.bonus.qty) > 0) bonus = ` + ${ITEMS[q.bonus.item].name} ×${q.bonus.qty}`
  useGame.getState().changeStats({ fun: 5 })
  useGame.getState().saveNow('event')
  toast(`✅ ส่งงานแล้ว: ${q.title ?? ''}`, `ได้เงิน ${pay} บาท${bonus}${late ? ' (ส่งช้า ได้ครึ่งเดียว)' : ''}`, 'success')
}

/** บอร์ดนี้มีประกาศใหม่ที่ยังไม่ได้อ่านวันนี้ */
export function hasNew(id: BoardId) {
  const s = useGame.getState().save
  if (!s) return false
  return (s.boardSeen?.[id] ?? 0) !== s.day
}

export { noticesFor }
