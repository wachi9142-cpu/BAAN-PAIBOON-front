// ตัวเลือกรูปลักษณ์ตัวละคร — เพิ่มตัวเลือกใหม่ได้โดยเพิ่มรายการในไฟล์นี้

export type Gender = 'male' | 'female'

export interface Option {
  id: string
  label: string
}

export const GENDERS: (Option & { id: Gender })[] = [
  { id: 'female', label: 'หญิง' },
  { id: 'male', label: 'ชาย' },
]

export type HairStyleId =
  | 'short'
  | 'buzz'
  | 'curly'
  | 'bob'
  | 'long'
  | 'longbangs'
  | 'wavy'
  | 'bun'
  | 'sidebuns'
  | 'halfup'
  | 'ponytail'
  | 'twintails'
  | 'braid'
  | 'twinbraids'
  | 'sidebraid'
  | 'topknot'

export const HAIR_STYLES: (Option & { id: HairStyleId })[] = [
  { id: 'short', label: 'ผมสั้น' },
  { id: 'bob', label: 'ผมบ็อบ' },
  { id: 'long', label: 'ผมยาว' },
  { id: 'twinbraids', label: 'เปียสองข้าง' },
  { id: 'sidebraid', label: 'เปียข้างเดียว' },
  { id: 'ponytail', label: 'หางม้า' },
  { id: 'buzz', label: 'ผมเกรียน' },
  { id: 'bun', label: 'มวยผม' },
  { id: 'topknot', label: 'ผมจุก (เด็ก)' },
  { id: 'curly', label: 'ผมหยิกสั้น' },
  { id: 'longbangs', label: 'ผมยาวหน้าม้า' },
  { id: 'wavy', label: 'ผมยาวลอน' },
  { id: 'sidebuns', label: 'มวยสองข้าง' },
  { id: 'halfup', label: 'รวบครึ่งหัว' },
  { id: 'twintails', label: 'แกละสองข้าง' },
  { id: 'braid', label: 'เปียหลัง' },
]

export const HAIR_COLORS: (Option & { color: string })[] = [
  { id: 'black', label: 'ดำ', color: '#1c1714' },
  { id: 'darkbrown', label: 'น้ำตาลเข้ม', color: '#3e2a1f' },
  { id: 'brown', label: 'น้ำตาล', color: '#6b4428' },
  { id: 'gray', label: 'เทา', color: '#8d8a86' },
  { id: 'blonde', label: 'บลอนด์', color: '#d8b46a' },
  { id: 'auburn', label: 'แดงอิฐ', color: '#8a3a22' },
  { id: 'orange', label: 'ส้ม', color: '#c8642a' },
  { id: 'silver', label: 'เงิน', color: '#d8d8dc' },
  { id: 'lavender', label: 'ม่วงลาเวนเดอร์', color: '#b8a0d8' },
  { id: 'icyblue', label: 'ฟ้าอ่อน', color: '#a8c8e0' },
]

export const SKIN_TONES: (Option & { color: string })[] = [
  { id: 'light', label: 'ขาว', color: '#f1c9a5' },
  { id: 'medium', label: 'สองสี', color: '#d9a47a' },
  { id: 'tan', label: 'แทน', color: '#b57f55' },
  { id: 'dark', label: 'คล้ำ', color: '#8a5a3b' },
]

export interface Outfit extends Option {
  top: string
  bottom: string
  /** กระโปรง/ผ้าถุง = ทรงบาน, กางเกง = ทรงขาแยก */
  bottomShape: 'pants' | 'shorts' | 'skirt' | 'mini'
  hat?: 'straw'
  /** ถุงเท้ายาว (สี) */
  socks?: string
  /** เอี๊ยม/เสื้อกั๊กทับเสื้อ (สีแผ่นหน้า) */
  bib?: string
  /** แสดงเฉพาะเพศนี้ (ไม่ระบุ = ทุกเพศ) */
  for?: Gender
}

export const OUTFITS: Outfit[] = [
  { id: 'mohom', label: 'เสื้อม่อฮ่อม กางเกงเล', top: '#2b3550', bottom: '#2b3550', bottomShape: 'pants' },
  { id: 'farmer', label: 'ชุดทำนา หมวกงอบ', top: '#5b7c99', bottom: '#3d3a36', bottomShape: 'pants', hat: 'straw' },
  { id: 'tshirt', label: 'เสื้อยืด กางเกงขาสั้น', top: '#e8e2d4', bottom: '#4a5d3a', bottomShape: 'shorts' },
  { id: 'phasin', label: 'เสื้อแขนกระบอก ผ้าซิ่น', top: '#f2e6cf', bottom: '#7a2e3a', bottomShape: 'skirt' },
  { id: 'phathung', label: 'เสื้อลายดอก ผ้าถุง', top: '#d98a5f', bottom: '#4b3a6b', bottomShape: 'skirt' },
  { id: 'jeans', label: 'เสื้อยืด กางเกงยีนส์', top: '#f2efe6', bottom: '#3d4f6e', bottomShape: 'pants' },
  // ชุดผู้ชาย (bib = เสื้อตัวในที่เห็นตรงกลาง เมื่อสวมแจ็กเก็ต/คาร์ดิแกนเปิดหน้า)
  { id: 'sweatshirt', label: 'สเวตเชิ้ต กางเกงขาสั้น', top: '#8ab4dc', bottom: '#f1efe9', bottomShape: 'shorts', socks: '#f1efe9', for: 'male' },
  { id: 'varsity', label: 'แจ็กเก็ตเบสบอล ชิโน่', top: '#26324f', bottom: '#e8dcc0', bottomShape: 'pants', bib: '#f4f1ea', for: 'male' },
  { id: 'cardigan', label: 'คาร์ดิแกน ยีนส์ดำ', top: '#c8a8dc', bottom: '#262427', bottomShape: 'pants', bib: '#f4f1ea', for: 'male' },
  { id: 'hoodie', label: 'ฮู้ด กางเกงคาร์โก้', top: '#3f8a8a', bottom: '#7a2e3a', bottomShape: 'pants', for: 'male' },
  { id: 'jersey', label: 'เสื้อบาส กางเกงขาสั้น', top: '#2f6a42', bottom: '#2f6a42', bottomShape: 'shorts', socks: '#f4f1ea', for: 'male' },
  { id: 'jacket', label: 'แจ็กเก็ต ยีนส์', top: '#d99a9a', bottom: '#2f3f6e', bottomShape: 'pants', bib: '#f4f1ea', for: 'male' },
  { id: 'overalls', label: 'เอี๊ยมยีนส์', top: '#f1ead8', bottom: '#6f8fb4', bottomShape: 'pants', bib: '#6f8fb4' },
  // ชุดผู้หญิง
  { id: 'pinafore', label: 'เดรสเอี๊ยม', top: '#f4f1ea', bottom: '#6a7a52', bottomShape: 'mini', bib: '#6a7a52', socks: '#f1efe9', for: 'female' },
  { id: 'pleated', label: 'เชิ้ต กระโปรงพลีท', top: '#f4f1ea', bottom: '#4f6f95', bottomShape: 'mini', socks: '#f1efe9', for: 'female' },
  { id: 'sweater', label: 'สเวตเตอร์ กระโปรงสั้น', top: '#7a4a6a', bottom: '#2b2a2c', bottomShape: 'mini', socks: '#2b2a2c', for: 'female' },
  { id: 'plaid', label: 'เสื้อดำ กระโปรงแดง', top: '#262427', bottom: '#a8323a', bottomShape: 'mini', socks: '#262427', for: 'female' },
  { id: 'vest', label: 'เสื้อกั๊ก กระโปรงสั้น', top: '#f4f1ea', bottom: '#3f5a3a', bottomShape: 'mini', bib: '#4f7a3a', socks: '#8a8a8e', for: 'female' },
  { id: 'sundress', label: 'เดรสยาว', top: '#e8b4b8', bottom: '#e8b4b8', bottomShape: 'skirt', for: 'female' },
]

export interface Appearance {
  gender: Gender
  /** วัย (เซฟเก่าที่ไม่มีค่านี้ = ผู้ใหญ่) */
  age?: AgeGroup
  skin: string
  hairStyle: HairStyleId
  hairColor: string
  outfit: string
  /** สีปาก: id สีตัวอย่าง หรือ "#rrggbb" (เซฟเก่าที่ไม่มีค่านี้ใช้สีเริ่มต้น) */
  lipColor?: string
  /** รองเท้า (เซฟเก่าที่ไม่มีค่านี้ใช้รองเท้าแตะ) */
  shoes?: ShoeId
  shoeColor?: string
  /** กระเป๋า (none = ไม่มี) */
  bag?: BagId
  bagColor?: string
  /** สีเสื้อ/สีท่อนล่าง กำหนดเอง ('outfit' หรือไม่มี = ตามชุด) */
  topColor?: string
  bottomColor?: string
  eyeColor?: string
  accessory?: AccessoryId
  accessoryColor?: string
  pose?: PoseId
  /** ไม้เท้า (เฉพาะผู้สูงอายุ) */
  cane?: CaneId
  /** ผ้าคลุมไหล่ */
  shawl?: ShawlId
  /** ของถือของเด็ก (เฉพาะวัยเด็ก) */
  kidItem?: KidItemId
  /** ของเด็ก: กระเป๋าเป้เล็ก / ของบนหัว (โบว์ หมวกเด็ก) */
  kidBag?: boolean
  kidHead?: KidHeadId
  /** ของผู้สูงอายุ: แว่นตา / หมวกปีกกว้าง / ตะกร้าเล็ก (ใส่พร้อมกันได้) */
  elderGlasses?: boolean
  elderHat?: boolean
  basket?: boolean
}

export type KidHeadId = 'none' | 'bow' | 'hat'
export const KID_HEADS: (Option & { id: KidHeadId })[] = [
  { id: 'none', label: 'ไม่มี' },
  { id: 'bow', label: 'โบว์ผม' },
  { id: 'hat', label: 'หมวกเด็ก' },
]
/** ตัวเลือก ใส่ / ไม่ใส่ */
export const YES_NO: Option[] = [
  { id: 'no', label: 'ไม่ใช้' },
  { id: 'yes', label: 'ใช้' },
]

// ---------- ของถือของเด็ก ----------
export type KidItemId = 'none' | 'bottle' | 'ball' | 'teddy'
export const KID_ITEMS: (Option & { id: KidItemId })[] = [
  { id: 'none', label: 'ไม่ถือ' },
  { id: 'bottle', label: 'ขวดนม' },
  { id: 'ball', label: 'ลูกบอลผ้า' },
  { id: 'teddy', label: 'ตุ๊กตาหมี' },
]

// ---------- ไม้เท้า (ผู้สูงอายุ) ----------
export type CaneId = 'none' | 'plain' | 'wood' | 'flower'
export const CANES: (Option & { id: CaneId })[] = [
  { id: 'none', label: 'ไม่ใช้' },
  { id: 'plain', label: 'ไม้เท้าธรรมดา' },
  { id: 'wood', label: 'ไม้เท้าลายไม้' },
  { id: 'flower', label: 'ไม้เท้าดอกไม้' },
]
/** ถือไม้เท้าแล้วเดินช้าลงอีกเล็กน้อย */
export const CANE_WALK = 0.9

// ---------- ผ้าคลุมไหล่ ----------
export type ShawlId = 'none' | 'white' | 'pakaoma' | 'silk' | 'knit'
export const SHAWLS: (Option & { id: ShawlId; color: string; stripe?: string })[] = [
  { id: 'none', label: 'ไม่มี', color: '#ffffff' },
  { id: 'white', label: 'ผ้าสีขาว', color: '#f1ece0' },
  { id: 'pakaoma', label: 'ผ้าขาวม้า', color: '#c0443a', stripe: '#f2e6cf' },
  { id: 'silk', label: 'ผ้าไหมสีม่วง', color: '#7a4a8a', stripe: '#d9a441' },
  { id: 'knit', label: 'ผ้าถักไหมพรม', color: '#d98a6a', stripe: '#f2d0a0' },
]

export const DEFAULT_APPEARANCE: Record<Gender, Appearance> = {
  female: { gender: 'female', skin: 'medium', hairStyle: 'long', hairColor: 'black', outfit: 'phasin', lipColor: 'rose', shoes: 'sandals', shoeColor: 'brown' },
  male: { gender: 'male', skin: 'tan', hairStyle: 'short', hairColor: 'black', outfit: 'mohom', lipColor: 'natural', shoes: 'sandals', shoeColor: 'brown' },
}

/** สีผม: เป็น id ของสีตัวอย่าง หรือรหัสสี "#rrggbb" ที่ผู้เล่นเลือกเองจากวงล้อสี */
export const isCustomColor = (v: string) => v.startsWith('#')
export const hairColorValue = (v: string) => (isCustomColor(v) ? v : byId(HAIR_COLORS, v).color)

export const byId =<T extends Option>(list: T[], id: string): T => list.find((o) => o.id === id) ?? list[0]

export const LIP_COLORS: (Option & { color: string })[] = [
  { id: 'natural', label: 'ธรรมชาติ', color: '#8a3b2c' },
  { id: 'rose', label: 'ชมพูกุหลาบ', color: '#c4566a' },
  { id: 'red', label: 'แดง', color: '#b3202c' },
  { id: 'coral', label: 'ส้มพีช', color: '#e07a5f' },
  { id: 'brown', label: 'น้ำตาล', color: '#6b3a2a' },
]

export const lipColorValue = (v: string | undefined) =>
  !v ? LIP_COLORS[0].color : isCustomColor(v) ? v : byId(LIP_COLORS, v).color

export type ShoeId = 'sandals' | 'heels' | 'sneakers' | 'maryjane' | 'kachu' | 'boots'

export const SHOES: (Option & { id: ShoeId })[] = [
  { id: 'sandals', label: 'รองเท้าแตะ' },
  { id: 'sneakers', label: 'รองเท้าผ้าใบ' },
  { id: 'kachu', label: 'รองเท้าคัชชู' },
  { id: 'maryjane', label: 'รองเท้าแมรี่เจน' },
  { id: 'heels', label: 'รองเท้าส้นสูง' },
  { id: 'boots', label: 'รองเท้าบูท' },
]

export const SHOE_COLORS: (Option & { color: string })[] = [
  { id: 'brown', label: 'น้ำตาล', color: '#6b4426' },
  { id: 'black', label: 'ดำ', color: '#1f1b1a' },
  { id: 'white', label: 'ขาว', color: '#f1eee8' },
  { id: 'red', label: 'แดง', color: '#b3202c' },
  { id: 'navy', label: 'กรมท่า', color: '#26324f' },
]

export const shoeColorValue = (v: string | undefined) =>
  !v ? SHOE_COLORS[0].color : isCustomColor(v) ? v : byId(SHOE_COLORS, v).color

export type BagId = 'none' | 'yaam' | 'backpack' | 'tote' | 'shoulder' | 'crossbody' | 'waist' | 'handbag'

export const BAGS: (Option & { id: BagId })[] = [
  { id: 'none', label: 'ไม่มีกระเป๋า' },
  { id: 'yaam', label: 'ย่าม' },
  { id: 'backpack', label: 'เป้สะพายหลัง' },
  { id: 'tote', label: 'กระเป๋าผ้า' },
  { id: 'shoulder', label: 'สะพายไหล่' },
  { id: 'crossbody', label: 'คาดลำตัว' },
  { id: 'waist', label: 'คาดเอว' },
  { id: 'handbag', label: 'กระเป๋าถือ' },
]

export const BAG_COLORS: (Option & { color: string })[] = [
  { id: 'indigo', label: 'คราม', color: '#2f3f6e' },
  { id: 'brown', label: 'น้ำตาล', color: '#7a4a28' },
  { id: 'cream', label: 'ครีม', color: '#e8dcc0' },
  { id: 'green', label: 'เขียว', color: '#5c7a3a' },
  { id: 'red', label: 'แดง', color: '#a83a32' },
  { id: 'black', label: 'ดำ', color: '#222023' },
]

export const bagColorValue = (v: string | undefined) =>
  !v ? BAG_COLORS[0].color : isCustomColor(v) ? v : byId(BAG_COLORS, v).color

// ---------- สีเสื้อผ้ากำหนดเอง ----------
export const CLOTH_COLORS: (Option & { color: string })[] = [
  { id: 'white', label: 'ขาว', color: '#f4f1ea' },
  { id: 'cream', label: 'ครีม', color: '#e8dcc0' },
  { id: 'pink', label: 'ชมพู', color: '#e8b4b8' },
  { id: 'red', label: 'แดง', color: '#a8323a' },
  { id: 'blue', label: 'ฟ้า', color: '#6f9ac4' },
  { id: 'navy', label: 'กรมท่า', color: '#26324f' },
  { id: 'green', label: 'เขียว', color: '#5c7a3a' },
  { id: 'black', label: 'ดำ', color: '#262427' },
]
/** 'outfit' = ใช้สีของชุด */
export const clothColor = (v: string | undefined, fallback: string) =>
  !v || v === 'outfit' ? fallback : isCustomColor(v) ? v : byId(CLOTH_COLORS, v).color

// ---------- สีตา ----------
export const EYE_COLORS: (Option & { color: string })[] = [
  { id: 'black', label: 'ดำ', color: '#1a1410' },
  { id: 'brown', label: 'น้ำตาล', color: '#5a3a22' },
  { id: 'hazel', label: 'น้ำตาลอ่อน', color: '#9a6a2e' },
  { id: 'gray', label: 'เทา', color: '#6f7a82' },
  { id: 'blue', label: 'ฟ้า', color: '#3f7fc0' },
  { id: 'green', label: 'เขียว', color: '#4f8a4a' },
]
export const eyeColorValue = (v: string | undefined) =>
  !v ? EYE_COLORS[0].color : isCustomColor(v) ? v : byId(EYE_COLORS, v).color

// ---------- เครื่องประดับ ----------
export type AccessoryId = 'none' | 'glasses' | 'ribbon' | 'hairclip' | 'flowercrown' | 'headband' | 'cap' | 'beanie' | 'beret' | 'strawhat' | 'widehat' | 'headphones'
export const ACCESSORIES: (Option & { id: AccessoryId })[] = [
  { id: 'none', label: 'ไม่มี' },
  { id: 'glasses', label: 'แว่นตา' },
  { id: 'ribbon', label: 'โบว์' },
  { id: 'hairclip', label: 'กิ๊บติดผม' },
  { id: 'flowercrown', label: 'มงกุฎดอกไม้' },
  { id: 'headband', label: 'ที่คาดผม' },
  { id: 'cap', label: 'หมวกแก๊ป' },
  { id: 'beanie', label: 'หมวกไหมพรม' },
  { id: 'headphones', label: 'หูฟังคล้องคอ' },
  { id: 'beret', label: 'หมวกเบเร่ต์' },
  { id: 'strawhat', label: 'หมวกสาน' },
  { id: 'widehat', label: 'หมวกปีกกว้าง' },
]
export const ACCESSORY_COLORS: (Option & { color: string })[] = [
  { id: 'navy', label: 'กรมท่า', color: '#26324f' },
  { id: 'pink', label: 'ชมพู', color: '#e58fa0' },
  { id: 'yellow', label: 'เหลือง', color: '#f0c94a' },
  { id: 'white', label: 'ขาว', color: '#f4f1ea' },
  { id: 'red', label: 'แดง', color: '#b3202c' },
  { id: 'brown', label: 'น้ำตาล', color: '#6b4426' },
]
export const accessoryColorValue = (v: string | undefined) =>
  !v ? ACCESSORY_COLORS[0].color : isCustomColor(v) ? v : byId(ACCESSORY_COLORS, v).color

// ---------- ท่าทาง (ตอนยืนอยู่กับที่) ----------
export type PoseId = 'stand' | 'wave' | 'wai' | 'shy' | 'behind' | 'cheer'
export const POSES: (Option & { id: PoseId })[] = [
  { id: 'stand', label: 'ยืนปกติ' },
  { id: 'wave', label: 'โบกมือ' },
  { id: 'wai', label: 'ไหว้' },
  { id: 'shy', label: 'ประสานมือ' },
  { id: 'behind', label: 'ไขว้มือหลัง' },
  { id: 'cheer', label: 'ชูมือดีใจ' },
]

// ---------- วัยของตัวละคร ----------
export type AgeGroup = 'child' | 'adult' | 'elder'

export interface AgeRules {
  label: string
  /** คำอธิบายข้อจำกัด แสดงตอนสร้างตัวละคร */
  note: string
  /** สัดส่วนตัว (ความสูง) และขนาดหัว */
  bodyScale: number
  headScale: number
  /** ความยาวขา / แขน เทียบผู้ใหญ่ (เด็กแขนขาสั้น) */
  legScale: number
  armScale: number
  /** ขนาดตา (เด็กตาโต) */
  eyeScale: number
  /** รอยย่นบนหน้า (ผู้สูงอายุ) */
  wrinkles: boolean
  /** หลังค่อมเล็กน้อย (เรเดียน) */
  hunch: number
  /** ความเร็วเดิน/วิ่ง เทียบผู้ใหญ่ */
  walkSpeed: number
  runSpeed: number
  /** ต้องเข้าบ้าน/นอนก่อนเวลานี้ (ชั่วโมง) — ใช้เมื่อมีระบบเวลา (Part 4) */
  curfewHour?: number
  /** ทำงานหนักได้ไหม — ใช้กับงานรับจ้าง/อาชีพ (Part 5, 9) */
  heavyWork: boolean
  /** ความเหนื่อยเพิ่มขึ้นกี่เท่าเมื่อทำงาน — ใช้กับค่าสถานะ (Part 3) */
  fatigue: number
}

export const AGE_RULES: Record<AgeGroup, AgeRules> = {
  child: {
    label: 'เด็ก',
    note: 'ต้องเข้าบ้านหรือเข้านอนก่อนมืด (ก่อน 19:00 น.) · ทำงานหนักไม่ได้',
    bodyScale: 0.66,
    headScale: 1.42,
    legScale: 0.78,
    armScale: 0.82,
    eyeScale: 1.4,
    wrinkles: false,
    hunch: 0,
    walkSpeed: 1,
    runSpeed: 1,
    curfewHour: 19,
    heavyWork: false,
    fatigue: 1,
  },
  adult: {
    label: 'ผู้ใหญ่',
    note: 'ทำงานได้ทุกอย่าง ไม่มีข้อจำกัด',
    bodyScale: 1,
    headScale: 1,
    legScale: 1,
    armScale: 1,
    eyeScale: 1,
    wrinkles: false,
    hunch: 0,
    walkSpeed: 1,
    runSpeed: 1,
    heavyWork: true,
    fatigue: 1,
  },
  elder: {
    label: 'ผู้สูงอายุ',
    note: 'ทำงานหนักไม่ได้ · เมื่อยง่าย เหนื่อยง่าย · เดินและวิ่งช้าลง',
    bodyScale: 0.94,
    headScale: 1,
    legScale: 0.96,
    armScale: 1,
    eyeScale: 0.85,
    wrinkles: true,
    hunch: 0.26,
    walkSpeed: 0.8,
    runSpeed: 0.65,
    heavyWork: false,
    fatigue: 1.8,
  },
}

export const AGE_GROUPS: (Option & { id: AgeGroup })[] = [
  { id: 'child', label: 'เด็ก' },
  { id: 'adult', label: 'ผู้ใหญ่' },
  { id: 'elder', label: 'ผู้สูงอายุ' },
]
