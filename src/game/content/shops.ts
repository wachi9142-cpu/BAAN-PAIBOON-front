// ร้านค้าทั้งหมู่บ้าน: ร้านค้าขนาดใหญ่ริมถนนใหญ่ (ป้าศรี) + ร้านประจำซอย (ซอย 1–6) ขายของต่างกัน
// ทุกร้านรับซื้อของคืนได้ แต่ร้านใหญ่ให้ราคาเต็ม ร้านในซอยรับซื้อเฉพาะของที่เกี่ยวกับร้าน
import { SHOP, type ItemId, type ShopEntry } from './items'

export interface ShopDef {
  id: string
  name: string
  owner: string
  icon: string
  note: string
  goods: ShopEntry[]
  /** รับซื้อไอเทมอะไรบ้าง (undefined = ทุกอย่าง) */
  buys?: ItemId[]
}

const pick = (ids: string[]) => SHOP.filter((e) => ids.includes(e.id))

export const SHOPS: Record<string, ShopDef> = {
  shop: {
    id: 'shop',
    name: 'ร้านค้าป้าศรี (ร้านใหญ่)',
    owner: 'ป้าศรี',
    icon: '🛒',
    note: 'ร้านค้าขนาดใหญ่ริมถนนใหญ่ ของครบที่สุด รับซื้อทุกอย่าง',
    goods: SHOP.filter((e) => !e.id.startsWith('basket_')),
  },
  'shop-plants': {
    id: 'shop-plants',
    name: 'ร้านต้นไม้ลุงชิต',
    owner: 'ลุงชิต',
    icon: '🌱',
    note: 'ซอย 1 · เมล็ดผัก ต้นกล้า ของทำสวน (ถูกกว่าร้านใหญ่นิดหน่อย)',
    goods: pick(['seed_morningglory', 'seed_scallion', 'seed_basil', 'seed_lemongrass', 'seed_chili', 'seed_eggplant', 'seed_tomato', 'seed_pumpkin', 'sapling']).map((e) => ({ ...e, price: Math.max(5, Math.round(e.price * 0.9)) })),
    buys: ['morningglory', 'scallion', 'basil', 'lemongrass', 'chili', 'eggplant', 'tomato', 'pumpkin', 'leaf', 'sapling'],
  },
  'shop-food': {
    id: 'shop-food',
    name: 'ร้านข้าวแกงป้านวล',
    owner: 'ป้านวล',
    icon: '🍛',
    note: 'ซอย 2 · ข้าวแกง ขนม น้ำดื่ม กินแล้วอิ่มทันที',
    goods: [
      { id: 'curry', name: 'ข้าวแกงเขียวหวาน', icon: '🍛', price: 25, gives: { eat: { hunger: 35, fun: 3 } } },
      { id: 'sticky', name: 'ข้าวเหนียวไก่ปิ้ง', icon: '🍗', price: 20, gives: { eat: { hunger: 30, fun: 2 } } },
      { id: 'noodle', name: 'ก๋วยเตี๋ยวไก่', icon: '🍜', price: 30, gives: { eat: { hunger: 40, thirst: 5 } } },
      { id: 'dessert', name: 'ขนมกล้วย', icon: '🍌', price: 10, gives: { eat: { hunger: 10, fun: 4 } } },
      { id: 'water', name: 'น้ำเปล่า', icon: '💧', price: 5, gives: { eat: { thirst: 25 } } },
      { id: 'tea', name: 'ชาเย็น', icon: '🧋', price: 15, gives: { eat: { thirst: 30, fun: 3 } } },
    ],
    buys: ['morningglory', 'scallion', 'basil', 'lemongrass', 'chili', 'eggplant', 'tomato', 'pumpkin', 'fish_tilapia', 'fish_catfish', 'fish_barb'],
  },
  'shop-tools': {
    id: 'shop-tools',
    name: 'ร้านเครื่องมือช่างหน่อย',
    owner: 'ช่างหน่อย',
    icon: '🔨',
    note: 'ซอย 3 · เครื่องมือช่างครบ ขวานเหล็กราคาดี',
    goods: pick(['axe', 'axe2', 'hammer', 'machete', 'saw', 'plank4', 'rod']).map((e) => (e.id === 'axe2' ? { ...e, price: 320 } : e)),
    buys: ['log', 'plank', 'hardwood', 'stone', 'branch', 'axe', 'axe2', 'hammer', 'machete', 'saw'],
  },
  'shop-craft': {
    id: 'shop-craft',
    name: 'ร้านจักสานยายจันทร์',
    owner: 'ยายจันทร์',
    icon: '🧺',
    note: 'ซอย 4 · กระเป๋าสาน ย่าม เชือกกล้วย งานจักสานฝีมือคนในหมู่บ้าน',
    goods: pick(['bag1', 'bag2', 'bag3', 'vine5']).map((e) => ({ ...e, price: Math.round(e.price * 0.92) })),
    buys: ['vine', 'leaf', 'branch', 'lotus'],
  },
  'shop-grocery': {
    id: 'shop-grocery',
    name: 'ร้านขายของชำยายบุญ',
    owner: 'ยายบุญ',
    icon: '🏪',
    note: 'ซอย 6 · ขนม น้ำดื่ม ของกินเล่น กินแล้วสดชื่น',
    goods: [
      { id: 'g-water', name: 'น้ำเปล่า', icon: '💧', price: 5, gives: { eat: { thirst: 25 } } },
      { id: 'g-soda', name: 'น้ำอัดลม', icon: '🥤', price: 12, gives: { eat: { thirst: 25, fun: 4 } } },
      { id: 'g-snack', name: 'ขนมถุง', icon: '🍪', price: 10, gives: { eat: { hunger: 8, fun: 5 } } },
      { id: 'g-bread', name: 'ขนมปังสังขยา', icon: '🍞', price: 15, gives: { eat: { hunger: 18 } } },
      { id: 'g-icecream', name: 'ไอศกรีมกะทิ', icon: '🍨', price: 15, gives: { eat: { thirst: 8, fun: 8 } } },
      { id: 'g-milk', name: 'นมกล่อง', icon: '🥛', price: 12, gives: { eat: { hunger: 6, thirst: 15 } } },
    ],
    buys: ['tomato', 'pumpkin', 'eggplant', 'chili'],
  },
  'shop-build': {
    id: 'shop-build',
    name: 'ร้านวัสดุก่อสร้างลุงเปีย',
    owner: 'ลุงเปีย',
    icon: '🧱',
    note: 'ซอย 6 · ไม้ หิน เชือก วัสดุสร้างบ้าน (ระบบสร้างบ้านอิสระจะมีของเพิ่ม)',
    goods: [
      ...pick(['plank4', 'vine5']),
      { id: 'b-stone5', name: 'ก้อนหิน ×5', icon: '🪨', price: 20, gives: { item: 'stone', qty: 5 } },
      { id: 'b-log2', name: 'ไม้ท่อน ×2', icon: '🪵', price: 40, gives: { item: 'log', qty: 2 } },
      { id: 'b-hardwood', name: 'ไม้เนื้อแข็ง', icon: '🪵', price: 70, gives: { item: 'hardwood', qty: 1 } },
      ...pick(['hammer', 'saw']),
    ],
    buys: ['log', 'plank', 'hardwood', 'stone', 'branch'],
  },
  'shop-fishing': {
    id: 'shop-fishing',
    name: 'ร้านเบ็ดและเหยื่อน้าสิงห์',
    owner: 'น้าสิงห์',
    icon: '🎣',
    note: 'ซอย 6 · เบ็ดตกปลา รับซื้อปลาและดอกบัวราคาดี',
    goods: pick(['rod']).map((e) => ({ ...e, price: 50 })),
    buys: ['fish_tilapia', 'fish_catfish', 'fish_barb', 'lotus'],
  },
  'shop-pinbasket': {
    id: 'shop-pinbasket',
    name: 'แผงตะกร้าสานตาปิ่น',
    owner: 'ตาปิ่น',
    icon: '🧺',
    note: 'ตะกร้าสานมือฝีมือตาปิ่น ราคา 350 บาททุกแบบ',
    goods: pick(['basket_round', 'basket_tote', 'basket_bag', 'basket_tray']),
    buys: ['vine', 'branch'],
  },
  'shop-pet': {
    id: 'shop-pet',
    name: 'ร้านอาหารสัตว์พี่แดง',
    owner: 'พี่แดง',
    icon: '🐾',
    note: 'ซอย 5 · อาหารสัตว์ ผลไม้ล่อสัตว์ สวิงและกรงดักสัตว์',
    goods: pick(['feed', 'treat3', 'net', 'trap_cage']),
    buys: ['feed', 'treat'],
  },
}

export const isShop = (placeId: string | null | undefined): placeId is string => !!placeId && placeId in SHOPS
