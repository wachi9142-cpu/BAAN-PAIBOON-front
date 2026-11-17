// บอร์ดประกาศประจำหมู่บ้าน 3 จุด — ข้อมูลล้วน
// แต่ละบอร์ดมีประกาศของตัวเอง เปลี่ยนทุกวัน ตามฤดูกาล และเหตุการณ์ในเกม (วันพระ ตลาดนัด)
import type { ItemId } from './items'
import type { PetSpecies } from './pets'

export type BoardId = 'questboard' | 'board-school' | 'board-headman'

export interface BoardDef {
  id: BoardId
  name: string
  theme: string
}

export const BOARDS: Record<BoardId, BoardDef> = {
  questboard: { id: 'questboard', name: 'บอร์ดประกาศหน้าหมู่บ้าน', theme: 'ข่าวสารประจำหมู่บ้าน · กิจกรรมตามฤดูกาลและเทศกาล · ภารกิจพิเศษ' },
  'board-school': { id: 'board-school', name: 'บอร์ดประกาศหน้าโรงเรียน', theme: 'ข่าวและกิจกรรมโรงเรียน · รับสมัครเข้าร่วม · ภารกิจเกี่ยวกับเด็ก' },
  'board-headman': { id: 'board-headman', name: 'บอร์ดประกาศหน้าบ้านผู้ใหญ่บ้าน', theme: 'ประกาศจากผู้ใหญ่บ้าน · ช่วยเหลือชาวบ้าน · ตามหาของ/สัตว์หาย' },
}

// ---------- ฤดูกาลและเหตุการณ์ ----------
export type Season = 'hot' | 'rain' | 'cool'
export const SEASONS: Record<Season, { label: string; icon: string }> = {
  hot: { label: 'ฤดูร้อน', icon: '☀️' },
  rain: { label: 'ฤดูฝน', icon: '🌧️' },
  cool: { label: 'ฤดูหนาว', icon: '🍃' },
}
/** ฤดูละ 30 วันในเกม: ร้อน → ฝน → หนาว */
export const seasonOf = (day: number): Season => (['hot', 'rain', 'cool'] as const)[Math.floor((day - 1) / 30) % 3]
/** วันพระ: ทุก 7 วัน */
export const isHolyDay = (day: number) => day % 7 === 0
/** ตลาดนัด: ทุก 3 วัน */
export const isMarketDay = (day: number) => day % 3 === 1

// ---------- ชนิดประกาศ ----------
export type NoticeKind = 'news' | 'event' | 'job'

export interface JobSpec {
  kind: 'bring' | 'catch'
  item?: ItemId
  species?: PetSpecies
  qty: number
  coins: number
  bonus?: { item: ItemId; qty: number }
}

export interface Notice {
  /** id คงที่ต่อบอร์ด+วัน (ใช้ผูกภารกิจ) */
  id: string
  kind: NoticeKind
  icon: string
  title: string
  detail: string
  /** วันที่ประกาศ */
  posted: number
  /** ช่วงเวลา (ข้อความ) */
  when: string
  /** เงื่อนไขการเข้าร่วม */
  terms?: string
  /** รางวัล (ข้อความ) */
  reward?: string
  job?: JobSpec
  /** ภารกิจหมดเขตวันที่ */
  until?: number
}

interface Pool {
  news: ((d: number) => Omit<Notice, 'id' | 'posted' | 'kind'>)[]
  events: ((d: number) => Omit<Notice, 'id' | 'posted' | 'kind'>)[]
  jobs: ((d: number) => Omit<Notice, 'id' | 'posted' | 'kind'> & { job: JobSpec })[]
}

const bring = (item: ItemId, qty: number, coins: number, bonus?: JobSpec['bonus']): JobSpec => ({ kind: 'bring', item, qty, coins, bonus })
const find = (species: PetSpecies, coins: number): JobSpec => ({ kind: 'catch', species, qty: 1, coins })

export const POOLS: Record<BoardId, Pool> = {
  // 1. หน้าหมู่บ้าน: ข่าวสารประจำหมู่บ้าน · กิจกรรมตามฤดูกาลและเทศกาล · ข่าวการเปลี่ยนแปลง · ภารกิจพิเศษ
  questboard: {
    news: [
      () => ({ icon: '📰', title: 'ยินดีต้อนรับสู่หมู่บ้านไพบูลย์', detail: 'หมู่บ้านแห่งความทรงจำ ใครผ่านมาแวะทักทายตายายได้ทุกบ้าน', when: 'ทุกวัน' }),
      () => ({ icon: '🛒', title: 'ร้านป้าศรีมีเมล็ดผักใหม่', detail: 'เมล็ดพริก มะเขือ มะเขือเทศ ฟักทอง มาครบแล้ว ปลูกได้ที่แปลงผักหน้าบ้าน', when: 'ร้านเปิด 06:00–20:00 น.' }),
      () => ({ icon: '🌳', title: 'ชวนปลูกต้นไม้ทดแทน', detail: 'ตัดต้นไม้แล้วอย่าลืมปลูกต้นกล้าแทนที่ตอไม้ ช่วยให้หมู่บ้านร่มรื่นตลอดไป', when: 'ทุกวัน' }),
      () => ({ icon: '🗝️', title: 'ลือกันว่ามีหีบลับในป่า', detail: 'ชาวบ้านเล่าว่ามีหีบเก่าซ่อนอยู่ตามมุมป่าไกล ๆ ข้างในมีกุญแจโบราณ', when: 'ไม่มีกำหนด' }),
      () => ({ icon: '🐾', title: 'สัตว์ในหมู่บ้านชอบเสียงผิวปาก', detail: 'ลองผิวปาก (กด Q) ไก่ หมา แมว จะเดินเข้ามาหา แต่บางตัวก็ตกใจวิ่งหนีนะ', when: 'ทุกวัน' }),
    ],
    events: [
      (d) =>
        isMarketDay(d)
          ? { icon: '🧺', title: 'ตลาดนัดหมู่บ้านวันนี้', detail: 'ชาวบ้านนำผักผลไม้มาขาย ป้าบัวหาบขนมมาด้วย', when: 'วันนี้ 06:00–10:00 น. ลานกลางหมู่บ้าน', terms: 'ทุกคนเข้าร่วมได้' }
          : { icon: '🧺', title: 'ตลาดนัดครั้งถัดไป', detail: 'ตลาดนัดหมู่บ้านจัดทุก 3 วัน เตรียมผักจากแปลงไว้ขายได้เลย', when: `วันที่ ${d + ((1 - (d % 3) + 3) % 3)} 06:00–10:00 น.` },
      (d) =>
        seasonOf(d) === 'hot'
          ? { icon: '💦', title: 'เตรียมงานสงกรานต์', detail: 'หน้าร้อนนี้ชวนกันรดน้ำดำหัวผู้สูงอายุ และเล่นน้ำที่ลานกลางหมู่บ้าน', when: 'ฤดูร้อน (เร็ว ๆ นี้)', terms: 'ทุกวัย' }
          : seasonOf(d) === 'rain'
            ? { icon: '🌾', title: 'ลงแขกดำนา', detail: 'หน้าฝนมาแล้ว ชวนกันไปช่วยดำนาที่ทุ่งนาหมู่บ้าน', when: 'ฤดูฝน (เร็ว ๆ นี้)', terms: 'ผู้ใหญ่ที่มีแรง' }
            : { icon: '🏮', title: 'งานลอยกระทงหมู่บ้าน', detail: 'หน้าหนาวนี้ทำกระทงจากใบตองกล้วยไปลอยที่บ่อปลา', when: 'ฤดูหนาว (เร็ว ๆ นี้)', terms: 'เตรียมใบตองมาเอง' },
      () => ({ icon: '⚽', title: 'กีฬาหมู่บ้านตอนเย็น', detail: 'เตะตะกร้อ วิ่งเปี้ยว ที่ลานกลางหมู่บ้าน ใครว่างมาเชียร์กันได้', when: 'ทุกวัน 16:00–18:00 น. (เร็ว ๆ นี้)' }),
    ],
    jobs: [
      (d) => ({ icon: '📜', title: 'ต้องการกิ่งไม้ทำรั้ว', detail: 'ซ่อมรั้วไม้ไผ่ทางเข้าหมู่บ้าน ขอกิ่งไม้หน่อย', when: `ภายในวันที่ ${d + 2}`, until: d + 2, job: bring('branch', 6, 40) }),
      (d) => ({ icon: '📜', title: 'หาหินมาทำทางเดิน', detail: 'ทางเดินหน้าหมู่บ้านเป็นหลุม ขอก้อนหินมาถม', when: `ภายในวันที่ ${d + 2}`, until: d + 2, job: bring('stone', 6, 45) }),
      (d) => ({ icon: '📜', title: 'ผักไปขายตลาดนัด', detail: 'ป้าศรีอยากได้ผักบุ้งจากแปลงผักชาวบ้าน', when: `ภายในวันที่ ${d + 3}`, until: d + 3, job: bring('morningglory', 4, 50, { item: 'seed_tomato', qty: 3 }) }),
      (d) => ({ icon: '📜', title: 'ท่อนไม้สร้างศาลาใหม่', detail: 'หมู่บ้านจะต่อเติมศาลา ขอท่อนไม้ช่วยกันคนละนิด', when: `ภายในวันที่ ${d + 3}`, until: d + 3, job: bring('log', 3, 70, { item: 'plank', qty: 2 }) }),
    ],
  },
  // 2. หน้าโรงเรียน: ข่าวสารและกิจกรรมโรงเรียน · ตารางกิจกรรมพิเศษ · รับสมัคร · ภารกิจเกี่ยวกับเด็ก
  'board-school': {
    news: [
      () => ({ icon: '🏫', title: 'โรงเรียนเปิดเรียนวันจันทร์–ศุกร์', detail: 'เด็ก ๆ มาเรียนแต่เช้า ผู้ปกครองช่วยขับขี่ช้า ๆ หน้าโรงเรียนนะ', when: '08:00–15:30 น.' }),
      () => ({ icon: '📚', title: 'มุมหนังสือรับบริจาค', detail: 'ใครมีหนังสือนิทาน หนังสือภาพ บริจาคให้ห้องสมุดโรงเรียนได้', when: 'ทุกวัน' }),
      () => ({ icon: '🥬', title: 'แปลงผักโรงเรียน', detail: 'นักเรียนปลูกผักกินเองเป็นอาหารกลางวัน ชวนผู้ปกครองมาช่วยดูแล', when: 'ทุกเช้า' }),
    ],
    events: [
      (d) => ({ icon: '🏃', title: 'รับสมัครกีฬาสีโรงเรียน', detail: 'แบ่งเป็นสีเขียว เหลือง แดง ม่วง แข่งวิ่ง ชักเย่อ และเปตอง', when: `ปิดรับสมัครวันที่ ${d + 5} (เร็ว ๆ นี้)`, terms: 'เด็ก ๆ และผู้ปกครอง', reward: 'ถ้วยรางวัลและขนม' }),
      () => ({ icon: '🎨', title: 'ประกวดวาดภาพ "หมู่บ้านของฉัน"', detail: 'วาดภาพบ้าน สัตว์เลี้ยง หรือทุ่งนา ส่งที่ห้องธุรการ', when: 'สัปดาห์นี้ (เร็ว ๆ นี้)', terms: 'นักเรียนทุกชั้น' }),
      (d) =>
        isHolyDay(d + 1)
          ? { icon: '🙏', title: 'พาเด็ก ๆ ไปทำบุญวันพระ', detail: 'พรุ่งนี้วันพระ คุณครูพานักเรียนไปตักบาตรที่วัด', when: 'พรุ่งนี้ 06:30 น. หน้าวัด' }
          : { icon: '🌱', title: 'กิจกรรมปลูกต้นไม้วันเสาร์', detail: 'นักเรียนกับชาวบ้านช่วยกันปลูกต้นไม้รอบโรงเรียน', when: 'วันเสาร์ (เร็ว ๆ นี้)', terms: 'นำต้นกล้ามาเองได้' },
    ],
    jobs: [
      (d) => ({ icon: '📜', title: 'ตามหาลูกแมวของเด็กนักเรียน', detail: 'น้องเล็กร้องไห้ ลูกแมวหลุดออกจากบ้าน ช่วยหาแมวมาให้หน่อย', when: `ภายในวันที่ ${d + 3}`, until: d + 3, job: find('cat', 80) }),
      (d) => ({ icon: '📜', title: 'ผลไม้สำหรับอาหารว่างเด็ก', detail: 'ครูอยากได้กล้วยสุกให้เด็ก ๆ กินตอนบ่าย', when: `ภายในวันที่ ${d + 2}`, until: d + 2, job: bring('treat', 3, 55) }),
      (d) => ({ icon: '📜', title: 'ไม้กระดานทำชั้นหนังสือ', detail: 'ห้องสมุดโรงเรียนต้องการชั้นวางหนังสือเพิ่ม', when: `ภายในวันที่ ${d + 4}`, until: d + 4, job: bring('plank', 3, 75) }),
      (d) => ({ icon: '📜', title: 'ใบไม้ทำปุ๋ยหมักแปลงผักโรงเรียน', detail: 'นักเรียนจะทำปุ๋ยหมัก ขอใบไม้แห้งหน่อย', when: `ภายในวันที่ ${d + 2}`, until: d + 2, job: bring('leaf', 6, 35, { item: 'seed_basil', qty: 3 }) }),
    ],
  },
  // 3. หน้าบ้านผู้ใหญ่บ้าน: ประกาศจากผู้ใหญ่บ้าน · ภารกิจช่วยเหลือชาวบ้าน · งานพัฒนาหมู่บ้าน · ตามหาของ/สัตว์หาย
  'board-headman': {
    news: [
      () => ({ icon: '📢', title: 'ประกาศจากผู้ใหญ่บ้าน', detail: 'ขอให้ทุกบ้านช่วยกันดูแลความสะอาด ทิ้งขยะให้เป็นที่ และระวังไฟตอนหน้าแล้ง', when: 'ทุกวัน' }),
      () => ({ icon: '🛡️', title: 'ระวังคนแปลกหน้า', detail: 'บ้านเรามีผู้สูงอายุเยอะ ถ้าเห็นคนแปลกหน้าแวะเวียนผิดปกติ แจ้งผู้ใหญ่บ้านได้เลย', when: 'ทุกวัน' }),
      (d) => ({ icon: SEASONS[seasonOf(d)].icon, title: `ตอนนี้${SEASONS[seasonOf(d)].label}`, detail: seasonOf(d) === 'rain' ? 'ฝนตกบ่อย อย่าลืมรดน้ำแปลงผักน้อยลงได้ (เร็ว ๆ นี้)' : seasonOf(d) === 'hot' ? 'อากาศร้อน ดื่มน้ำบ่อย ๆ นะ' : 'อากาศเย็นสบาย เหมาะกับการเดินเที่ยวรอบหมู่บ้าน', when: 'ฤดูละ 30 วันในเกม' }),
    ],
    events: [
      (d) =>
        isHolyDay(d)
          ? { icon: '🙏', title: 'วันนี้วันพระ', detail: 'ชวนกันไปทำบุญ ตักบาตร ฟังธรรมที่วัด', when: 'วันนี้ ทั้งวัน', terms: 'ถอดรองเท้าก่อนขึ้นโบสถ์' }
          : { icon: '🙏', title: 'วันพระครั้งถัดไป', detail: 'ทำบุญที่วัดกันนะ จุดธูปเทียน ตีระฆัง กรวดน้ำ', when: `วันที่ ${d + (7 - (d % 7))}` },
      () => ({ icon: '🏛️', title: 'ประชุมหมู่บ้านประจำเดือน', detail: 'คุยเรื่องงานพัฒนาหมู่บ้าน ถนน ไฟทาง และงานบุญประจำปี', when: 'ศาลากลางหมู่บ้าน 19:00 น. (เร็ว ๆ นี้)', terms: 'ตัวแทนบ้านละ 1 คน' }),
      () => ({ icon: '🧹', title: 'วันพัฒนาหมู่บ้าน', detail: 'ช่วยกันกวาดถนน ตัดหญ้าข้างทาง เก็บกิ่งไม้', when: 'วันอาทิตย์ 07:00 น. (เร็ว ๆ นี้)', terms: 'นำไม้กวาดมาเอง' }),
    ],
    jobs: [
      (d) => ({ icon: '🔎', title: 'ตามหาไก่ของยายไหม', detail: 'ไก่ของยายไหมหลุดออกจากเล้า ช่วยตามหามาให้หน่อย', when: `ภายในวันที่ ${d + 3}`, until: d + 3, job: find('chicken', 70) }),
      (d) => ({ icon: '🔎', title: 'ตามหาเป็ดหาย', detail: 'เป็ดของลุงเขียวเดินหลงไปแถวบ่อปลา', when: `ภายในวันที่ ${d + 3}`, until: d + 3, job: find('duck', 75) }),
      (d) => ({ icon: '📜', title: 'ช่วยตาทองซ่อมเล้าไก่', detail: 'เล้าไก่พัง ขอไม้กระดานกับเชือกกล้วย', when: `ภายในวันที่ ${d + 3}`, until: d + 3, job: bring('vine', 4, 50, { item: 'feed', qty: 4 }) }),
      (d) => ({ icon: '📜', title: 'ฟืนให้บ้านผู้สูงอายุ', detail: 'บ้านยายไหมฟืนหมด ช่วยหาท่อนไม้ไปให้หน่อย', when: `ภายในวันที่ ${d + 2}`, until: d + 2, job: bring('log', 2, 60) }),
    ],
  },
}

/** สุ่มแบบคงที่ตามบอร์ด+วัน (ทุกคนเห็นเหมือนกันในวันเดียวกัน) */
function seeded(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** ประกาศของบอร์ดในวันนั้น: ข่าว 1–2 · กิจกรรม 1 · ภารกิจ 2 */
export function noticesFor(board: BoardId, day: number): Notice[] {
  const pool = POOLS[board]
  const rand = seeded(day * 97 + board.length * 13)
  const pickN = <T,>(arr: T[], n: number) => {
    const a = [...arr]
    const out: T[] = []
    while (out.length < n && a.length) out.push(a.splice(Math.floor(rand() * a.length), 1)[0])
    return out
  }
  const out: Notice[] = []
  pickN(pool.news, 2).forEach((f, i) => out.push({ ...f(day), id: `${board}:${day}:n${i}`, kind: 'news', posted: day }))
  pickN(pool.events, 1).forEach((f, i) => out.push({ ...f(day), id: `${board}:${day}:e${i}`, kind: 'event', posted: day }))
  pickN(pool.jobs, 2).forEach((f, i) => {
    const n = f(day)
    out.push({ ...n, id: `${board}:${day}:j${i}`, kind: 'job', posted: day, terms: 'รับงานแล้วนำของ/สัตว์มาส่งที่บอร์ดนี้', reward: `เงิน ${n.job.coins} บาท${n.job.bonus ? ` + ของแถม` : ''}` })
  })
  return out
}
