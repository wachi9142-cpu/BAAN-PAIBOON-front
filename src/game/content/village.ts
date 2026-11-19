// แผนที่หมู่บ้าน (ผังสมมุติ ไม่ใช่ผังจริง — ดูกฎความเป็นส่วนตัวใน docs/VILLAGE_MAP.md) — ข้อมูลล้วน เพิ่มสถานที่/แปลงที่ดินใหม่ได้ที่นี่
import { SAVED_LAYOUT } from '../layoutEdit'
// พิกัด: x = ตะวันออก(+)/ตะวันตก(-), z = ใต้(+)/เหนือ(-), หน่วยเมตร

export type Vec2 = [number, number]

export type PlaceKind =
  | 'temple'
  | 'pond'
  | 'overgrown'
  | 'barnyard'
  | 'fencedlot'
  | 'woodyard'
  | 'koipond'
  | 'lemongarden'
  | 'parkpad'
  | 'mulberry'
  | 'outkitchen'
  | 'mangoorchard'
  | 'arecagrove'
  | 'ricefield'
  | 'questboard'
  | 'shop'
  | 'sala'
  | 'training'
  | 'npchouse'
  | 'chedi'
  | 'school'
  | 'garage'
  | 'eventground'
  | 'lake'
  | 'grandhome'
  | 'farm'

export interface Place {
  id: string
  name: string
  kind: PlaceKind
  pos: Vec2
  /** ขนาดพื้นที่ (กว้าง x ลึก) */
  size: Vec2
  rotation?: number
  /** ร้านค้า: big = ร้านใหญ่ริมถนน · stall = ร้านประจำซอย */
  style?: 'big' | 'stall'
  /** บ้านชาวบ้าน: บังคับแบบบ้าน / สีหลังคา */
  houseStyle?: 'stilt' | 'concrete' | 'halfhalf' | 'wood2' | 'modern'
  roof?: string
  /** ข้อความเมื่อผู้เล่นเดินมาถึง */
  arriveText?: string
  /** ระบบที่จะเปิดใช้ในอนาคต (แสดงเป็น "เร็ว ๆ นี้") */
  comingSoon?: string
  /** ทาสีบ้านชาวบ้าน */
  color?: string
  /** วงชนสำหรับกันเดินทะลุ (0 = เดินผ่านได้) */
  solidRadius?: number
  /** ขยายขนาดตัวบ้านชาวบ้าน (1 = ปกติ) */
  houseScale?: number
  /** ลานโล่งหน้าบ้าน (ลึกกี่เมตร ด้านหน้าบ้าน) — ที่วิ่งเล่น จอดรถของเด็ก */
  frontYard?: number
  /** มีรั้วรอบที่ดิน (ประตูรั้วด้านหน้า) */
  fence?: boolean
}

export interface Plot {
  id: string
  name: string
  center: Vec2
  size: Vec2
  /** ราคาซื้อ (0 = แปลงเริ่มต้นฟรี) */
  price: number
  /** ตำแหน่งบ้านภายในแปลง (relative to center) */
  houseOffset: Vec2
  /** ป้ายชื่อบ้าน (ไม่ใส่ = "บ้านของ<ชื่อผู้เล่น>") */
  houseName?: string
  /** หันหน้าบ้าน (เรเดียน · 0 = หันไปทาง +z) */
  houseRot?: number
}

export interface Road {
  from: Vec2
  to: Vec2
  width: number
  /** concrete = ถนนใหญ่คอนกรีต · dirt (ค่าเริ่มต้น) = ถนนดินแดงในซอย */
  surface?: 'concrete' | 'dirt'
}

export const WORLD_HALF_SIZE = 90
/** เดินได้ไกลสุดจากกลางหมู่บ้าน (ขยายให้มีที่สำหรับถนนหลังบ้านฟ่าง · ต้นไม้/หินยังสุ่มในวง WORLD_HALF_SIZE เดิม) */
export const WORLD_WALK_LIMIT = 120

/** เริ่มเกมใหม่ที่หน้าประตูรั้วบ้านตารัง–ยายเลียน (บ้านฟ่าง) */
export const SPAWN: Vec2 = [-24.5, 55.5]

export const ROADS: Road[] = [
  // ถนนใหญ่ตัดผ่านหมู่บ้าน (ตะวันตก–ตะวันออก)
  { from: [-88, 0], to: [88, 0], width: 7, surface: 'concrete' },
  // สี่แยกกลางหมู่บ้าน: แยกเหนือไปทุ่งนา · แยกใต้ไปวัด
  { from: [0, 3.5], to: [0, 52.25], width: 4.5 },
  { from: [0, -3.5], to: [0, -38], width: 4.5 },
  // ซอย 1–5 (ทุกซอยมีร้านประจำซอย)
  { from: [30, 3.5], to: [30, 104], width: 4.5 }, // ซอย 1 ไปบ้านผู้เล่น · ร้านต้นไม้ · ต่อขึ้นเหนือผ่านซอยบ้านใหม่ 5 หลัง (19 พ.ย.)
  // แยกจากซอย 1 ไปทางตะวันออก เลียบรั้วด้านหน้าบ้านแม่ฉัตร (ผู้สร้าง 19 พ.ย. 2569)
  { from: [32.25, 47.5], to: [80, 47.5], width: 4.5 },
  { from: [-37.5, 3.5], to: [-37.5, 115.25], width: 4.5 }, // ซอย 2 (ถนนดินแดง 2 เลน) · ร้านข้าวแกง · บ่อปลา · บ้านตารัง–ยายเลียน
  // ซอย 2: ช่วงแรกบ้าน 2–3 หลัง → คอกควาย ยุ้งข้าว พื้นที่ส่วนบุคคล (มีรั้ว) → สี่แยก (ทางสี่แพร่ง)
  // แยกขวา (ตะวันออก) = ถนนดินแดงเข้ากลุ่มบ้านตารัง–ยายเลียน (บ้านตาอยู่เหนือถนน · บ้านพ่อน้องน้ำฝนอยู่ตรงข้าม) · แยกซ้ายไปทุ่งนา
  { from: [-35.25, 54.5], to: [27.75, 54.5], width: 4.5 },
  // หลังรั้วฝั่งเหนือของบ้านฟ่าง = ถนนดินแดงแนวนอน 2 เลน ต่อซอย 2 กับถนนเลียบรั้วตะวันออก (ขอบเดินได้ของแผนที่ 120)
  { from: [-39.75, 113], to: [74.25, 113], width: 4.5 }, // ต่อไปทางตะวันออกจนถึงหลังบ้านน้าโรจน์ (ผู้สร้าง 20 พ.ย.)
  { from: [72, 200], to: [72, 82], width: 4.5 }, // ต่อขึ้นเหนือออกไปนอกหมู่บ้าน (ผู้สร้าง 20 พ.ย.) // เลี้ยวลงใต้ไปหลังสวนมะม่วง/บ้านน้าโรจน์
  { from: [-39.75, 54.5], to: [-69, 54.5], width: 4.5 }, // แยกซ้ายเลียบลานหน้าบ้านยายวาน
  { from: [66, -3.5], to: [66, -36], width: 4.5 }, // ซอย 3 · ร้านเครื่องมือช่าง
  { from: [-37.5, -3.5], to: [-37.5, -37], width: 4.5 }, // ซอย 4 (2 เลน ตรงแนวซอย 2) · ร้านจักสาน (ตรงแนวเดียวกับซอย 2 ข้ามถนนใหญ่เป็นสี่แยก)
  { from: [-80, 3.5], to: [-80, 28], width: 4.5 }, // ซอย 5 · ร้านอาหารสัตว์ (ปลายหมู่บ้านฝั่งตะวันตก ห่างซอย 2)
  // ซอย 6 ซอยร้านค้า: ตรงแนวซอย 5 ข้ามถนนใหญ่ (สี่แยก) ลงไปชนถนนหน้าโรงเรียน · ร้านเรียงสองฝั่ง
  { from: [-80, -3.5], to: [-80, -37], width: 4.5 },
  // ถนนเข้าโรงเรียน + ถนนหน้าโรงเรียน (คอนกรีต 2 เลน วิ่งแนวนอนขนานหน้าโรงเรียน)
  { from: [-62, -3.5], to: [-62, -37], width: 7, surface: 'concrete' },
  { from: [-82.25, -40.5], to: [-21, -40.5], width: 7, surface: 'concrete' },
]

export const PLACES: Place[] = [
  {
    id: 'temple',
    name: 'วัด',
    kind: 'temple',
    pos: [0, -62],
    size: [32, 44],
    arriveText: 'ทุกคนเข้าไปกราบพระในโบสถ์ได้ · ทุกเช้าชาวบ้านจะมาใส่บาตรที่นี่',
    comingSoon: 'ใส่บาตรตอนเช้า (Part 2)',
    // เดินเข้าโบสถ์ได้: ใช้กำแพงชน (temple.ts) แทนวงชนทั้งหลัง
    solidRadius: 0,
  },
  {
    id: 'chedi',
    name: 'พระเจดีย์',
    kind: 'chedi',
    pos: [30, -62],
    size: [26, 26],
    arriveText: 'พระเจดีย์องค์ใหญ่ข้างวัด มีวิหารเล็กให้เข้าไปกราบไหว้',
    solidRadius: 0,
  },
  {
    id: 'school',
    name: 'โรงเรียนวัดบ้านไพบูลย์',
    kind: 'school',
    pos: [-62, -62],
    size: [34, 34],
    arriveText: 'โรงเรียนขนาดใหญ่ของหมู่บ้าน มีสนามเด็กเล่น โรงอาหาร โดมกีฬา เวที และแปลงผัก',
    comingSoon: 'กิจกรรมโรงเรียน (เร็ว ๆ นี้)',
    solidRadius: 0,
  },
  {
    id: 'school-pond',
    name: 'บ่อน้ำระหว่างโรงเรียนกับวัด',
    kind: 'lake',
    pos: [-31, -62],
    size: [22, 30],
    arriveText: 'บ่อน้ำใหญ่กั้นระหว่างโรงเรียนกับวัด มีสะพานไม้ทางเดินเดิมเชื่อมสองฝั่ง',
    solidRadius: 0,
  },
  {
    id: 'sala',
    name: 'ศาลาประชาคม',
    kind: 'sala',
    pos: [-14, -14],
    size: [10, 7],
    arriveText: 'ที่ประชุมหมู่บ้านและงานเทศกาล',
    comingSoon: 'ประชุมหมู่บ้านและเทศกาล (Part 7)',
    solidRadius: 0,
  },
  // ---------- ถนนใหญ่: ร้านค้าขนาดใหญ่ → ร้านซ่อมรถ (ติดกัน) → ลานกิจกรรม ----------
  {
    id: 'shop',
    name: 'ร้านค้าป้าศรี (ร้านใหญ่)',
    kind: 'shop',
    style: 'big',
    pos: [16, -11],
    size: [12, 8],
    arriveText: 'ร้านค้าขนาดใหญ่ริมถนนใหญ่ มีของครบ รับซื้อของทุกอย่าง',
    solidRadius: 0,
  },
  {
    id: 'garage',
    name: 'อู่ซ่อมรถช่างเปี๊ยก',
    kind: 'garage',
    pos: [31, -11],
    size: [9, 7],
    arriveText: 'ร้านซ่อมรถติดกับร้านค้าใหญ่ ซ่อมจักรยาน มอเตอร์ไซค์ รถไถ',
    comingSoon: 'ซ่อม/ซื้อยานพาหนะ (เร็ว ๆ นี้)',
    solidRadius: 0,
  },
  {
    id: 'eventground',
    name: 'ลานกิจกรรมหมู่บ้าน',
    kind: 'eventground',
    pos: [51, -15],
    size: [22, 14],
    arriveText: 'ลานจัดงานเทศกาล งานประจำหมู่บ้าน และกิจกรรมตามฤดูกาล',
    comingSoon: 'งานเทศกาล สงกรานต์ ลอยกระทง กีฬาหมู่บ้าน (เร็ว ๆ นี้)',
    solidRadius: 0,
  },
  // ---------- ร้านประจำซอย (ขายของต่างกัน) ----------
  { id: 'shop-plants', name: 'ร้านต้นไม้ลุงชิต (ซอย 1)', kind: 'shop', style: 'stall', color: '#5f9e47', pos: [36.1, 8], rotation: Math.PI, size: [6, 5], arriveText: 'เมล็ดผัก ต้นกล้า และของทำสวน', solidRadius: 0 },
  { id: 'shop-food', name: 'ร้านข้าวแกงป้านวล (ซอย 2)', kind: 'shop', style: 'stall', color: '#e0802e', pos: [-44.5, 8], rotation: Math.PI, size: [6, 5], arriveText: 'ข้าวแกง ขนม น้ำดื่ม กินอิ่มเติมแรง', solidRadius: 0 },
  { id: 'shop-tools', name: 'ร้านเครื่องมือช่างหน่อย (ซอย 3)', kind: 'shop', style: 'stall', color: '#4a6a8a', pos: [72.1, -8], size: [6, 5], arriveText: 'ขวาน ค้อน เลื่อย มีดพร้า เครื่องมือช่างครบ', solidRadius: 0 },
  { id: 'shop-craft', name: 'ร้านจักสานยายจันทร์ (ซอย 4)', kind: 'shop', style: 'stall', color: '#b8904a', pos: [-29.5, -9], size: [6, 5], arriveText: 'กระเป๋าสาน ย่าม เชือกกล้วย งานจักสานฝีมือคนในหมู่บ้าน', solidRadius: 0 },
  { id: 'shop-pet', name: 'ร้านอาหารสัตว์พี่แดง (ซอย 5)', kind: 'shop', style: 'stall', color: '#c0504a', pos: [-86.1, 8], rotation: Math.PI, size: [6, 5], arriveText: 'อาหารสัตว์ ผลไม้ล่อสัตว์ และคฑาจับสัตว์', solidRadius: 0 },
  // ซอย 6 ซอยร้านค้า (ชื่อร้าน/เจ้าของเปลี่ยนได้ภายหลัง)
  { id: 'shop-grocery', name: 'ร้านขายของชำยายบุญ (ซอย 6)', kind: 'shop', style: 'stall', color: '#5a8fc0', pos: [-73.9, -11], rotation: -Math.PI / 2, size: [5, 6], arriveText: 'ขนม น้ำดื่ม ของใช้ในบ้าน ของกินเล่น', solidRadius: 0 },
  { id: 'shop-build', name: 'ร้านวัสดุก่อสร้างลุงเปีย (ซอย 6)', kind: 'shop', style: 'stall', color: '#8a8f96', pos: [-73.9, -26], rotation: -Math.PI / 2, size: [5, 6], arriveText: 'ไม้กระดาน หิน เชือก วัสดุสร้างบ้าน', solidRadius: 0 },
  { id: 'shop-fishing', name: 'ร้านเบ็ดและเหยื่อน้าสิงห์ (ซอย 6)', kind: 'shop', style: 'stall', color: '#3f8f86', pos: [-86.1, -18], rotation: Math.PI / 2, size: [5, 6], arriveText: 'เบ็ดตกปลา เหยื่อ รับซื้อปลาและดอกบัว', solidRadius: 0 },
  // ---------- บอร์ดประกาศ 3 จุด ----------
  {
    id: 'questboard',
    name: 'บอร์ดประกาศหน้าหมู่บ้าน',
    kind: 'questboard',
    pos: [-74, 6],
    size: [3, 1],
    rotation: Math.PI,
    arriveText: 'ข่าวสารประจำหมู่บ้าน กิจกรรมตามฤดูกาล และภารกิจพิเศษ',
    solidRadius: 1.2,
  },
  {
    id: 'board-school',
    name: 'บอร์ดประกาศหน้าโรงเรียน',
    kind: 'questboard',
    pos: [-57.2, -44.4],
    size: [3, 1],
    rotation: 0,
    arriveText: 'ข่าวและกิจกรรมของโรงเรียน รับสมัครเข้าร่วมกิจกรรม',
    solidRadius: 0.8,
  },
  {
    id: 'board-headman',
    name: 'บอร์ดประกาศหน้าบ้านผู้ใหญ่บ้าน',
    kind: 'questboard',
    pos: [25.9, 46],
    size: [3, 1],
    rotation: Math.PI / 2,
    arriveText: 'ประกาศจากผู้ใหญ่บ้าน งานช่วยเหลือชาวบ้าน และตามหาของหาย',
    solidRadius: 1.2,
  },
  {
    id: 'training',
    name: 'ศูนย์ฝึกอาชีพ',
    kind: 'training',
    pos: [-48, -18],
    size: [12, 8],
    arriveText: 'นครแห่งไหม: เก็บใบหม่อนหลังศูนย์ → เลี้ยงไหมในกระด้ง → สาวไหม → ทอผ้า → ตัดเย็บแล้วสวมใส่',
    solidRadius: 6,
  },
  {
    id: 'pond',
    name: 'บ่อปลาลุงเขียว',
    kind: 'pond',
    // ผู้สร้าง 19 พ.ย. 2569: ที่เดิม (−52, 38) เป็นบ้านคนทำฟืนขาย — ย้ายบ่อมาที่ว่างทางใต้ใกล้ ๆ
    pos: [-64, 20],
    size: [20, 14],
    arriveText: 'บ่อปลาดุกของลุงเขียว · ไปริมบ่อหรือท่าน้ำแล้วกด E: ตกปลา เล่นน้ำ เสื้อชูชีพ พายเรือ เก็บบัว',
    solidRadius: 0,
  },
  {
    id: 'home-tarang',
    name: 'บ้านตารัง–ยายเลียน (บ้านฟ่าง)',
    kind: 'grandhome',
    pos: [-18, 71],
    size: [30, 26],
    arriveText: 'บ้านไม้สองชั้นของตารังกับยายเลียน · สวนผัก สวนดอกไม้ สวนผลไม้ ยุ้งข้าว คอกควาย เล้าไก่ คอกหมู',
    comingSoon: 'เดินเข้าไปสำรวจในบ้าน (กำลังสร้าง)',
    solidRadius: 0,
  },
  // บ้านชาวบ้าน (Part 6 จะใส่ชาวบ้านและกิจวัตร)
  { id: 'house-khiao', name: 'บ้านลุงเขียว', kind: 'npchouse', pos: [-46, 16], size: [6, 5], color: '#7d5a3c', solidRadius: 4.2 },
  { id: 'house-si', name: 'บ้านป้าศรี', kind: 'npchouse', pos: [22, -27], size: [6, 5], color: '#c9b79a', solidRadius: 4.2 },
  { id: 'house-mai', name: 'บ้านยายไหม', kind: 'npchouse', pos: [-46, -34], size: [6, 5], color: '#8f6a46', solidRadius: 4.2 },
  { id: 'house-thong', name: 'บ้านตาทอง', kind: 'npchouse', pos: [80, -16], size: [6, 5], color: '#a8805a', solidRadius: 4.2 },
  // กลุ่มบ้านเดียวกับบ้านตารัง–ยายเลียน (ฝั่งตรงข้ามถนนดินแดงที่ตัดเข้าไป) — ชื่อเปลี่ยนได้ภายหลัง
  // ซอย 2 ช่วงแรก: บ้าน 2–3 หลัง (หันหน้าเข้าซอย)
  { id: 'house-kaew', name: 'บ้านน้าแก้ว', kind: 'npchouse', pos: [-18, 10], rotation: Math.PI, size: [6, 5], color: '#d4c4a8', solidRadius: 4.2 },
  { id: 'house-noi', name: 'บ้านยายน้อย', kind: 'npchouse', pos: [-8, 10], rotation: Math.PI, size: [6, 5], color: '#9a6a42', solidRadius: 4.2 },
  // คอกควาย ยุ้งข้าว และพื้นที่ส่วนบุคคล (กว้างประมาณบ้าน 4 หลัง มีรั้วล้อม)
  {
    id: 'farm-soi2',
    name: 'คอกควายและยุ้งข้าว (พื้นที่ส่วนบุคคล)',
    kind: 'farm',
    // ผู้สร้าง 19 พ.ย. 2569: สลับฝั่ง — แถวบ้าน (บ้านพ่อน้องน้ำฝน) อยู่ใกล้ปากซอย · คอกควายอยู่ลึกเข้าไปจนถึงทางแยก ฝั่งเหนือเป็นหญ้ารก ๆ ปลูกให้ควายกิน
    pos: [-20, 40.5],
    size: [24, 17],
    arriveText: 'พื้นที่ส่วนบุคคลกว้าง มีรั้วล้อม คอกควาย ยุ้งข้าว กองฟาง',
    solidRadius: 0,
  },
  // ฝั่งเหนือถนนหน้าบ้านแม่ฉัตร: บ้านปูนชั้นเดียวของน้องเนย โน๊ต นิว มีรั้วล้อม หันหน้าออกถนน (ผู้สร้าง 19 พ.ย. 2569)
  // ถัดจากบ้านน้องเนยไปทางตะวันออก ริมถนนแยกซอย 1: บ้านน้าโรจน์ · ลานจอดรถหน้าบ้าน · สวนมะนาว 15 ต้น · บ่อปลาคาร์ฟมีน้ำตกจำลอง (ผู้สร้าง 19 พ.ย. 2569)
  { id: 'rot-lemon', name: 'สวนมะนาวน้าโรจน์', kind: 'lemongarden', pos: [64.75, 55.5], size: [7.5, 9], arriveText: 'สวนมะนาว 15 ต้นของน้าโรจน์ ลูกดกเต็มต้น', solidRadius: 0 },
  { id: 'rot-park', name: 'ที่จอดรถบ้านน้าโรจน์', kind: 'parkpad', pos: [72.4, 54.95], size: [5.8, 8.9], solidRadius: 0 },
  { id: 'house-rot', name: 'บ้านน้าโรจน์', kind: 'npchouse', houseStyle: 'modern', pos: [72, 63.5], rotation: Math.PI, size: [11, 7], color: '#b98252', arriveText: 'บ้านชั้นเดียวสไตล์โมเดิร์นของน้าโรจน์ · ปีกฝั่งบ่อปลาเปิดเป็นร้านตัดผมชาย-หญิง ช่างโรจน์ · มีกำแพงอิฐกั้นสวนมะนาว และบ่อปลาคาร์ฟ', solidRadius: 4.6 },
  // หลังบ้านน้าโรจน์: ครัวนอก (มีโต๊ะกินข้าว) + ต้นมัลเบอร์รี่ 3 ต้นเรียงติดกัน
  // ซอย 1 ช่วงเหนือ: บ้านใหม่ 5 หลัง สองฝั่งซอย ทุกหลังหันหน้าลงทางใต้ (ถนนเส้นหน้า) เว้นลานหน้าบ้าน ~4 ม. ไม่ชิดถนน (ผู้สร้าง 19 พ.ย. 2569)
  { id: 'house-s1a', name: 'บ้านป้าบุญเรือน', kind: 'npchouse', houseStyle: 'stilt', pos: [22.5, 67.5], rotation: Math.PI / 2, size: [6.2, 6.5], houseScale: 0.72, fence: true, color: '#8a6040', solidRadius: 2.6 },
  { id: 'house-s1b', name: 'บ้านลุงทองดี', kind: 'npchouse', houseStyle: 'halfhalf', roof: '#a8483a', pos: [22.5, 74], rotation: Math.PI / 2, size: [6.2, 6.5], houseScale: 0.72, fence: true, color: '#d8c8a8', solidRadius: 2.6 },
  { id: 'house-s1c', name: 'บ้านพี่แสงเดือน', kind: 'npchouse', houseStyle: 'concrete', roof: '#5a7a8a', pos: [37.5, 66], rotation: -Math.PI / 2, size: [6.2, 6.5], houseScale: 0.72, fence: true, color: '#efe6d2', solidRadius: 2.6 },
  { id: 'house-s1d', name: 'บ้านน้าคำมี', kind: 'npchouse', houseStyle: 'wood2', pos: [37.5, 72.5], rotation: -Math.PI / 2, size: [6.2, 6.5], houseScale: 0.72, fence: true, color: '#9a7048', solidRadius: 2.6 },
  { id: 'house-s1e', name: 'บ้านยายสมบูรณ์', kind: 'npchouse', houseStyle: 'stilt', pos: [37.5, 79], rotation: -Math.PI / 2, size: [6.2, 6.5], houseScale: 0.72, fence: true, color: '#7a5434', solidRadius: 2.6 },
  // ซอย 1 (ผู้สร้าง 20 พ.ย.): บ้านเรียงเป็นแถวสองฝั่งถนน หันหน้าเข้าถนน ทุกหลังมีรั้ว
  { id: 'house-s1f', name: 'บ้านริมซอย 1 (ฝั่งตะวันตก)', kind: 'npchouse', houseStyle: 'wood2', pos: [22.5, 80.5], rotation: Math.PI / 2, size: [6.2, 6.5], houseScale: 0.72, fence: true, color: '#8a6444', solidRadius: 2.6 },
  { id: 'shop-kit', name: 'ร้านค้าน้ากิจ', kind: 'shop', style: 'stall', color: '#c8783a', pos: [22.5, 87], rotation: Math.PI / 2, size: [6.2, 6.5], fence: true, arriveText: 'ร้านขายของชำประจำซอย 1 ของน้ากิจ', solidRadius: 0 },
  { id: 'house-s1g', name: 'บ้านริมซอย 1 (ฝั่งตะวันออก)', kind: 'npchouse', houseStyle: 'concrete', roof: '#8a4a3a', pos: [37.5, 85.5], rotation: -Math.PI / 2, size: [6.2, 6.5], houseScale: 0.72, fence: true, color: '#e8dcc4', solidRadius: 2.6 },
  { id: 'house-s1h', name: 'บ้านริมซอย 1 (ท้ายซอย)', kind: 'npchouse', houseStyle: 'stilt', pos: [37.5, 92], rotation: -Math.PI / 2, size: [6.2, 6.5], houseScale: 0.72, fence: true, color: '#7a5434', solidRadius: 2.6 },
  { id: 'house-s1i', name: 'บ้านริมซอย 1 (สุดซอย)', kind: 'npchouse', houseStyle: 'halfhalf', roof: '#5a7a8a', pos: [37.5, 98.5], rotation: -Math.PI / 2, size: [6.2, 6.5], houseScale: 0.72, fence: true, color: '#d8c8a8', solidRadius: 2.6 },
  { id: 'rot-kitchen', name: 'ครัวนอกบ้านน้าโรจน์', kind: 'outkitchen', pos: [71.8, 70.2], rotation: Math.PI, size: [4.6, 3.4], arriveText: 'ครัวนอกบ้าน มีเตาถ่านนึ่งข้าวเหนียว โอ่งน้ำ และโต๊ะกินข้าว', solidRadius: 0 },
  { id: 'rot-mulberry', name: 'ต้นมัลเบอร์รี่น้าโรจน์', kind: 'mulberry', pos: [65.2, 70.4], size: [4, 4], arriveText: 'ต้นมัลเบอร์รี่ (หม่อน) 3 ต้น ลูกสุกสีม่วงดำ กินได้', solidRadius: 0 },
  { id: 'rot-mango', name: 'สวนมะม่วงน้าโรจน์', kind: 'mangoorchard', pos: [73, 76.8], size: [20.5, 7], arriveText: 'สวนมะม่วงหลายพันธุ์ อาร์ทูอีทู น้ำดอกไม้สีม่วง มะม่วงยักษ์ เขียวใหญ่ เขียวเสวย น้ำดอกไม้สีทอง', solidRadius: 0 },
  // หลังบ้านน้องเนย (ระหว่างบ้านคุณตามะไฟกับสวนมะม่วงน้าโรจน์): สวนหมากราว 30 ต้น (ผู้สร้าง 19 พ.ย. 2569)
  { id: 'areca-grove', name: 'สวนหมาก', kind: 'arecagrove', pos: [51, 83], size: [17, 9], arriveText: 'สวนหมากราว 30 ต้น ลำต้นสูงเรียว ทะลายหมากสุกสีส้ม', solidRadius: 0 },
  { id: 'rot-koi', name: 'บ่อปลาคาร์ฟน้าโรจน์', kind: 'koipond', pos: [78.5, 54.8], size: [5, 7], arriveText: 'บ่อปลาคาร์ฟหลากสี 5 ตัว มีน้ำตกจำลองเล็ก ๆ ไหลลงบ่อ เสียงน้ำเย็นชื่นใจ', solidRadius: 2.3 },
  { id: 'lot-noey', name: 'บ้านน้องเนย โน๊ต นิว', kind: 'fencedlot', pos: [46.5, 57.1], rotation: Math.PI / 2, size: [14, 27], solidRadius: 0 },
  { id: 'house-noey', name: 'บ้านน้องเนย โน๊ต นิว', kind: 'npchouse', houseStyle: 'concrete', roof: '#7a8a96', pos: [52.5, 57.1], rotation: -Math.PI / 2, size: [9, 7.5], houseScale: 1.5, color: '#ece4d4', arriveText: 'บ้านปูนชั้นเดียวหลังใหญ่ ครอบครัวห้าคนของน้องเนย น้องโน๊ต น้องนิว · ลานจอดหน้าบ้านมีรถไถ กระบะ มอเตอร์ไซค์ จักรยาน', solidRadius: 5.2 },
  // ถัดจากบ้านแม่ฉัตรไปทางตะวันออก: บ้านพี่เอม หันหน้าเข้าหาบ้านแม่ฉัตร · ลานยุ้งข้าวกับกองฟางใหญ่ (ผู้สร้าง 19 พ.ย. 2569)
  { id: 'house-aem', name: 'บ้านพี่เอม', kind: 'npchouse', pos: [72, 31], rotation: -Math.PI / 2, size: [6, 5], color: '#8a6040', houseStyle: 'stilt', arriveText: 'บ้านพี่เอม ข้างบ้านแม่ฉัตร มียุ้งข้าวกับกองฟางใหญ่', solidRadius: 4.2 },
  { id: 'aem-yard', name: 'ยุ้งข้าวและกองฟางพี่เอม', kind: 'barnyard', pos: [74.5, 40.5], size: [11, 8], arriveText: 'ยุ้งข้าวใต้ถุนสูง กองฟางก้อนใหญ่ไว้ให้วัวควายกิน', solidRadius: 0 },
  // ที่เดิมของบ้านฟ่างหลังเก่า: กลายเป็นที่รกร้าง หญ้ารก ไม้พุ่ม (ผู้สร้าง 19 พ.ย. 2569)
  { id: 'wild-lot', name: 'ที่รกร้าง', kind: 'overgrown', pos: [39, 36], size: [10, 18], arriveText: 'หญ้าขึ้นรก ไม้พุ่มเต็มไปหมด ไม่มีใครดูแลมานาน', solidRadius: 0 },
  // บ้านคนทำฟืนขาย (ที่เดิมของบ่อปลา) + ลานกองฟืน หันหน้าออกซอย 2
  { id: 'house-firewood', name: 'บ้านลุงสีทำฟืนขาย', kind: 'npchouse', pos: [-50, 33.5], rotation: Math.PI / 2, size: [6, 5], color: '#8a6040', arriveText: 'ลุงสีตัดไม้ ผ่าฟืน มัดเป็นกำวางขายหน้าบ้าน', solidRadius: 4.2 },
  { id: 'woodyard', name: 'ลานกองฟืนขาย', kind: 'woodyard', pos: [-50, 43.5], rotation: Math.PI / 2, size: [10, 7], arriveText: 'กองฟืนเรียงสูง ฟืนมัดเป็นกำ ขายกำละ 10 บาท', solidRadius: 0 },
  // ตรงข้ามบ้านตารัง–ยายเลียน (ฝั่งใต้ถนนดินแดง): บ้านพ่อน้องน้ำฝน (หลังคาม่วง) + บ้านอีก 2 หลังในกลุ่มเดียวกัน
  { id: 'house-namfon', name: 'บ้านพ่อน้องน้ำฝน', kind: 'npchouse', houseStyle: 'concrete', roof: '#4f3a7a', pos: [-28.5, 28], rotation: -Math.PI / 2, size: [6, 5], color: '#e8dcc0', solidRadius: 4.2 },
  { id: 'house-boon', name: 'บ้านลุงบุญมา', kind: 'npchouse', pos: [-19.5, 28], rotation: Math.PI, size: [6, 5], color: '#8a6040', solidRadius: 4.2 },
  { id: 'house-kham', name: 'บ้านป้าคำ', kind: 'npchouse', pos: [-10.5, 28], rotation: Math.PI, size: [6, 5], color: '#b89a72', solidRadius: 4.2 },
  { id: 'house-dam', name: 'บ้านพี่ดำ', kind: 'npchouse', pos: [58, 14], size: [6, 5], color: '#6e4f37', solidRadius: 4.2 },
  // ฝั่งตะวันตกของซอย 2 ช่วงที่ 2 (เดิมเป็นทุ่งนา): บ้านยายแดงตรงข้ามบ้านฟ่างพอดี · บ้านยายวานอยู่ลึกเข้าไป (ตรงที่เคยเป็นนา) หน้าบ้านเป็นลานกว้าง
  { id: 'house-daeng', name: 'บ้านยายแดง', kind: 'npchouse', pos: [-45, 66], rotation: Math.PI / 2, size: [6, 5], color: '#b0704a', arriveText: 'บ้านยายแดง ลูกสาวอี๊ดเอี๊ยง หลานน้องไม้วายุ · อยู่ตรงข้ามบ้านฟ่างพอดี', solidRadius: 4.2 },
  { id: 'house-wan', name: 'บ้านยายวาน', kind: 'npchouse', pos: [-72, 72], rotation: Math.PI / 2, size: [6, 5], color: '#8a6a48', arriveText: 'บ้านยายวานกับมินท์หลานสาว · หน้าบ้านเป็นลานกว้าง เด็ก ๆ วิ่งเล่นและจอดจักรยาน', solidRadius: 4.2, frontYard: 18 },
  // ข้างบ้านฟ่างฝั่งตะวันออก (ชิดรั้ว ไม่มีถนนคั่น): บ้านคุณตามะไฟ หันหน้าลงถนนเส้นหน้า (ทิศใต้)
  { id: 'house-mafai', name: 'บ้านคุณตามะไฟ', kind: 'npchouse', pos: [22.5, 61], rotation: Math.PI / 2, size: [6.2, 6.5], houseScale: 0.72, fence: true, color: '#9a7048', arriveText: 'บ้านคุณตามะไฟ เพื่อนบ้านติดกับบ้านฟ่างฝั่งตะวันออก', solidRadius: 2.6 },
  { id: 'house-headman', name: 'บ้านผู้ใหญ่บ้าน', kind: 'npchouse', pos: [23.5, 40], rotation: Math.PI / 2, size: [6, 5], color: '#9a6a42', solidRadius: 4.2 },
]

// โหมด "ย้ายที่": ผู้สร้างย้ายตำแหน่ง/หมุนสถานที่ไว้ → ใช้ค่าที่บันทึกแทนค่าในโค้ด (ก่อนระบบอื่นคำนวณผัง กล่องชน ต้นไม้)
for (const p of PLACES) {
  const m = SAVED_LAYOUT['place:' + p.id]
  if (m) {
    p.pos = [m.x, m.z]
    p.rotation = m.rot
  }
}

export const PLOTS: Plot[] = [
  { id: 'start-plot', name: 'ที่ดินของฉัน', houseName: 'บ้านแม่ฉัตร', houseRot: 0, center: [56, 36], size: [20, 18], price: 0, houseOffset: [0, -3] },
]

export const STARTING_PLOT_ID = 'start-plot'

/** ต้นไม้ประดับ — สุ่มแบบคงที่ (seed) เพื่อให้หมู่บ้านหน้าตาเหมือนเดิมทุกครั้ง */
export type TreeKind = 'coconut' | 'banana' | 'mango'
export interface TreeSpot {
  pos: Vec2
  kind: TreeKind
  scale: number
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function distToSegment(p: Vec2, a: Vec2, b: Vec2) {
  const [px, pz] = p
  const [ax, az] = a
  const [bx, bz] = b
  const dx = bx - ax
  const dz = bz - az
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)))
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz))
}

function inRect(p: Vec2, c: Vec2, s: Vec2, pad: number) {
  return Math.abs(p[0] - c[0]) < s[0] / 2 + pad && Math.abs(p[1] - c[1]) < s[1] / 2 + pad
}

export function isBlockedForDecor(p: Vec2) {
  if (ROADS.some((r) => distToSegment(p, r.from, r.to) < r.width / 2 + 2)) return true
  if (PLACES.some((pl) => inRect(p, pl.pos, pl.size, 3))) return true
  // ลานหน้าบ้าน (frontYard) ต้องโล่ง ไม่มีต้นไม้/หิน
  for (const pl of PLACES) {
    if (!pl.frontYard) continue
    const r = pl.rotation ?? 0
    const dx = p[0] - pl.pos[0]
    const dz = p[1] - pl.pos[1]
    const lx = dx * Math.cos(r) - dz * Math.sin(r)
    const lz = dx * Math.sin(r) + dz * Math.cos(r)
    if (Math.abs(lx) < 9 && lz > 2 && lz < 4.5 + pl.frontYard + 2) return true
  }
  // บ้านฟ่าง (ดู HOME_BOX ใน GrandHome.tsx): x −33..15, z 58..109 · ช่วง x 15..21 เป็นพื้นว่างนอกรั้ว (คงกรอบเดิมไว้ ไม่ให้ต้นไม้สุ่มทั้งหมู่บ้านเปลี่ยนที่)
  if (p[0] > -35 && p[0] < 26 && p[1] > 56 && p[1] < 118) return true
  if (PLOTS.some((pl) => inRect(p, pl.center, pl.size, 2))) return true
  if (Math.hypot(p[0] - SPAWN[0], p[1] - SPAWN[1]) < 6) return true
  return false
}

export const TREES: TreeSpot[] = (() => {
  const rand = mulberry32(2565)
  const kinds: TreeKind[] = ['coconut', 'banana', 'mango']
  const out: TreeSpot[] = []
  let guard = 0
  while (out.length < 140 && guard++ < 4000) {
    const p: Vec2 = [(rand() * 2 - 1) * (WORLD_HALF_SIZE - 4), (rand() * 2 - 1) * (WORLD_HALF_SIZE - 4)]
    if (isBlockedForDecor(p)) continue
    if (out.some((t) => Math.hypot(t.pos[0] - p[0], t.pos[1] - p[1]) < 4)) continue
    out.push({ pos: p, kind: kinds[Math.floor(rand() * kinds.length)], scale: 0.8 + rand() * 0.5 })
  }
  return out
})()

/** กองหินริมทาง/ริมนา — เก็บก้อนหินได้ (สุ่มแบบคงที่) */
export const ROCKS: Vec2[] = (() => {
  const rand = mulberry32(7741)
  const out: Vec2[] = []
  let guard = 0
  while (out.length < 36 && guard++ < 3000) {
    const p: Vec2 = [(rand() * 2 - 1) * (WORLD_HALF_SIZE - 6), (rand() * 2 - 1) * (WORLD_HALF_SIZE - 6)]
    if (isBlockedForDecor(p)) continue
    if (TREES.some((t) => Math.hypot(t.pos[0] - p[0], t.pos[1] - p[1]) < 2.5)) continue
    if (out.some((r) => Math.hypot(r[0] - p[0], r[1] - p[1]) < 6)) continue
    out.push(p)
  }
  // กองหินใกล้จุดเกิด ให้หาเจอง่าย
  out.unshift([6, 14], [-8, 16])
  return out
})()
