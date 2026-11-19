// ไอเทม กระเป๋า สูตรคราฟ และร้านค้า — ข้อมูลล้วน เพิ่มของใหม่ได้ที่นี่
// หลักราคา: ของที่ซื้อจากร้าน "แพงกว่า" การหาวัตถุดิบมาคราฟเอง

export type ItemId =
  | 'krathong'
  | 'branch'
  | 'stone'
  | 'vine'
  | 'log'
  | 'plank'
  | 'axe'
  | 'hammer'
  | 'machete'
  | 'saw'
  | 'feed'
  | 'treat'
  | 'wand'
  | 'axe2'
  | 'leaf'
  | 'hardwood'
  | 'sapling'
  | 'oldkey'
  | 'mushroom_wild'
  | 'herb_wild'
  | 'herb_rare'
  | 'amulet_forest'
  | 'mulberry_leaf'
  | 'silk_eggs'
  | 'cocoon'
  | 'silk_thread'
  | 'silk_cloth'
  | 'pupa'
  | 'shirt_silk'
  | 'net'
  | 'trap_cage'
  | 'basket_round'
  | 'basket_tote'
  | 'basket_bag'
  | 'basket_tray'
  | 'seed_morningglory'
  | 'morningglory'
  | 'seed_scallion'
  | 'scallion'
  | 'seed_basil'
  | 'basil'
  | 'seed_lemongrass'
  | 'lemongrass'
  | 'seed_chili'
  | 'chili'
  | 'seed_eggplant'
  | 'eggplant'
  | 'seed_tomato'
  | 'tomato'
  | 'seed_pumpkin'
  | 'pumpkin'
  | 'rod'
  | 'lotus'
  | 'fish_tilapia'
  | 'fish_catfish'
  | 'fish_barb'
  // รางวัลเช็กอินรายวัน: เพชรและทอง · อาวุธ · เครื่องแต่งกาย · อาหาร
  | 'gold_nugget'
  | 'ruby'
  | 'amethyst'
  | 'sapphire'
  | 'pearl'
  | 'sword_wood'
  | 'slingshot'
  | 'spear_bamboo'
  | 'hat_ngob'
  | 'pakaoma'
  | 'sarong_silk'
  | 'egg'
  | 'sticky_rice'
  | 'mango_ripe'
  // อุปกรณ์ดำน้ำ
  | 'bubble_helmet'

export type ItemKind = 'material' | 'tool' | 'seed' | 'food' | 'treasure' | 'weapon' | 'wear'

export interface ItemDef {
  id: ItemId
  name: string
  icon: string
  kind: ItemKind
  /** วางซ้อนในช่องเดียวได้กี่ชิ้น */
  stack: number
  /** ราคาที่ร้านรับซื้อ (บาท/ชิ้น) */
  sell: number
  note: string
  /** กินได้: เพิ่มความอิ่มเท่านี้ */
  food?: number
}

export const ITEMS: Record<ItemId, ItemDef> = {
  branch: { id: 'branch', name: 'กิ่งไม้', icon: '🥢', kind: 'material', stack: 30, sell: 2, note: 'เก็บจากต้นไม้ด้วยมือเปล่า' },
  stone: { id: 'stone', name: 'ก้อนหิน', icon: '🪨', kind: 'material', stack: 30, sell: 2, note: 'เก็บจากกองหินริมทาง' },
  vine: { id: 'vine', name: 'เชือกกล้วย', icon: '🌿', kind: 'material', stack: 30, sell: 3, note: 'ลอกจากต้นกล้วย ใช้มัดและสาน' },
  log: { id: 'log', name: 'ไม้ท่อน', icon: '🪵', kind: 'material', stack: 20, sell: 10, note: 'ใช้ขวานตัดต้นไม้' },
  plank: { id: 'plank', name: 'ไม้กระดาน', icon: '🟫', kind: 'material', stack: 20, sell: 15, note: 'เลื่อยจากไม้ท่อน' },
  axe: { id: 'axe', name: 'ขวาน', icon: '🪓', kind: 'tool', stack: 1, sell: 40, note: 'ตัดต้นไม้ได้ไม้ท่อน' },
  hammer: { id: 'hammer', name: 'ค้อน', icon: '🔨', kind: 'tool', stack: 1, sell: 30, note: 'ใช้ทำเครื่องมือที่ซับซ้อนขึ้น (เลื่อย)' },
  machete: { id: 'machete', name: 'มีดพร้า', icon: '🗡️', kind: 'tool', stack: 1, sell: 45, note: 'ถางหญ้า ลอกเชือกกล้วยได้มากขึ้น' },
  saw: { id: 'saw', name: 'เลื่อย', icon: '🪚', kind: 'tool', stack: 1, sell: 55, note: 'เลื่อยไม้ท่อนเป็นไม้กระดาน' },
  feed: { id: 'feed', name: 'อาหารสัตว์', icon: '🌾', kind: 'material', stack: 30, sell: 2, note: 'ข้าวเปลือกและรำ ล่อสัตว์เลี้ยงทั่วไปให้เชื่องเร็วขึ้น' },
  treat: { id: 'treat', name: 'กล้วยสุก', icon: '🍌', kind: 'material', stack: 20, sell: 5, note: 'ผลไม้หวาน ล่อสัตว์ป่าระดับปานกลาง-ยาก (บางทีได้จากต้นกล้วย)' },
  seed_morningglory: { id: 'seed_morningglory', name: 'เมล็ดผักบุ้ง', icon: '🌱', kind: 'seed', stack: 30, sell: 1, note: 'ปลูกที่แปลงผักหน้าบ้าน (เดินไปที่แปลงแล้วกด E)' },
  morningglory: { id: 'morningglory', name: 'ผักบุ้ง', icon: '🥬', kind: 'food', stack: 20, sell: 6, note: 'ผัดผักบุ้งไฟแดงอร่อย กินสดก็ได้', food: 6 },
  seed_scallion: { id: 'seed_scallion', name: 'เมล็ดต้นหอม', icon: '🌱', kind: 'seed', stack: 30, sell: 1, note: 'ปลูกที่แปลงผักหน้าบ้าน (เดินไปที่แปลงแล้วกด E)' },
  scallion: { id: 'scallion', name: 'ต้นหอม', icon: '🧅', kind: 'food', stack: 20, sell: 6, note: 'โรยหน้าแกงจืดหอม ๆ', food: 3 },
  seed_basil: { id: 'seed_basil', name: 'เมล็ดกะเพรา', icon: '🌱', kind: 'seed', stack: 30, sell: 1, note: 'ปลูกที่แปลงผักหน้าบ้าน (เดินไปที่แปลงแล้วกด E)' },
  basil: { id: 'basil', name: 'กะเพรา', icon: '🍃', kind: 'food', stack: 20, sell: 8, note: 'ใบกะเพราหอมฉุน ไว้ผัดกะเพรา', food: 4 },
  seed_lemongrass: { id: 'seed_lemongrass', name: 'เมล็ดตะไคร้', icon: '🌱', kind: 'seed', stack: 30, sell: 1, note: 'ปลูกที่แปลงผักหน้าบ้าน (เดินไปที่แปลงแล้วกด E)' },
  lemongrass: { id: 'lemongrass', name: 'ตะไคร้', icon: '🎋', kind: 'food', stack: 20, sell: 8, note: 'ใส่ต้มยำ (ระบบทำอาหารเร็ว ๆ นี้) กินสดไม่ได้' },
  seed_chili: { id: 'seed_chili', name: 'เมล็ดพริก', icon: '🌱', kind: 'seed', stack: 30, sell: 1, note: 'ปลูกที่แปลงผักหน้าบ้าน (เดินไปที่แปลงแล้วกด E)' },
  chili: { id: 'chili', name: 'พริก', icon: '🌶️', kind: 'food', stack: 20, sell: 10, note: 'เผ็ดมาก! กินสดแล้วหิวน้ำ', food: 2 },
  seed_eggplant: { id: 'seed_eggplant', name: 'เมล็ดมะเขือ', icon: '🌱', kind: 'seed', stack: 30, sell: 1, note: 'ปลูกที่แปลงผักหน้าบ้าน (เดินไปที่แปลงแล้วกด E)' },
  eggplant: { id: 'eggplant', name: 'มะเขือ', icon: '🍆', kind: 'food', stack: 20, sell: 10, note: 'มะเขือเปราะลูกกลม จิ้มน้ำพริก', food: 6 },
  seed_tomato: { id: 'seed_tomato', name: 'เมล็ดมะเขือเทศ', icon: '🌱', kind: 'seed', stack: 30, sell: 1, note: 'ปลูกที่แปลงผักหน้าบ้าน (เดินไปที่แปลงแล้วกด E)' },
  tomato: { id: 'tomato', name: 'มะเขือเทศ', icon: '🍅', kind: 'food', stack: 20, sell: 12, note: 'มะเขือเทศสุกแดง หวานอมเปรี้ยว', food: 8 },
  seed_pumpkin: { id: 'seed_pumpkin', name: 'เมล็ดฟักทอง', icon: '🌱', kind: 'seed', stack: 30, sell: 1, note: 'ปลูกที่แปลงผักหน้าบ้าน (เดินไปที่แปลงแล้วกด E)' },
  pumpkin: { id: 'pumpkin', name: 'ฟักทอง', icon: '🎃', kind: 'food', stack: 20, sell: 35, note: 'ฟักทองลูกโต ขายได้ราคาดี นึ่งกินอิ่มนาน', food: 18 },
  axe2: { id: 'axe2', name: 'ขวานเหล็ก', icon: '🪓', kind: 'tool', stack: 1, sell: 120, note: 'ฟันแรงและเร็วกว่าขวานธรรมดา ได้ไม้มากขึ้น' },
  leaf: { id: 'leaf', name: 'ใบไม้', icon: '🍂', kind: 'material', stack: 40, sell: 1, note: 'ใบไม้ ใบตอง ทางมะพร้าว — ทำปุ๋ยหมัก อาหารสัตว์บางชนิด (เร็ว ๆ นี้)' },
  hardwood: { id: 'hardwood', name: 'ไม้เนื้อแข็ง', icon: '🪵', kind: 'material', stack: 20, sell: 30, note: 'ได้จากการโค่นต้นไม้ใหญ่ด้วยขวาน ใช้ทำเครื่องเรือนระดับสูง' },
  sapling: { id: 'sapling', name: 'ต้นกล้าไม้', icon: '🌱', kind: 'material', stack: 20, sell: 3, note: 'ปลูกแทนที่ตอไม้ (เดินไปที่ตอไม้แล้วกด E) โตเป็นต้นไม้ใน 1 วัน' },
  mulberry_leaf: { id: 'mulberry_leaf', name: 'ใบหม่อน', icon: '🍃', kind: 'material', stack: 40, sell: 2, note: 'เก็บจากสวนหม่อนหลังศูนย์ฝึกอาชีพ (ต้นละครั้งต่อวัน) · อาหารของหนอนไหม มื้อละ 2 ใบต่อกระด้ง' },
  silk_eggs: { id: 'silk_eggs', name: 'ไข่ไหม', icon: '🥚', kind: 'material', stack: 5, sell: 5, note: 'แผ่นไข่ไหมพันธุ์พื้นบ้าน รับฟรีวันละแผ่นที่ชั้นกระด้งเลี้ยงไหม · วางลงกระด้งแล้วรอฟัก' },
  cocoon: { id: 'cocoon', name: 'รังไหม', icon: '🟡', kind: 'material', stack: 40, sell: 8, note: 'รังไหมสีเหลืองทอง · ต้มที่เตาสาวไหม 5 รัง ได้เส้นไหม 2 ไจ' },
  silk_thread: { id: 'silk_thread', name: 'เส้นไหม', icon: '🧶', kind: 'material', stack: 30, sell: 25, note: 'เส้นไหมสาวมือ เงาสวย · ทอที่กี่ทอผ้า 3 ไจ ได้ผ้าไหม 1 ผืน' },
  silk_cloth: { id: 'silk_cloth', name: 'ผ้าไหม', icon: '🎀', kind: 'material', stack: 10, sell: 90, note: 'ผ้าไหมทอมือ ลายตามที่เลือกตอนทอ · ตัดเย็บเป็นผ้าถุง (1 ผืน) หรือเสื้อ (2 ผืน)' },
  pupa: { id: 'pupa', name: 'ดักแด้ไหม', icon: '🐛', kind: 'food', stack: 30, sell: 4, note: 'ได้จากการสาวไหม · ทอดกรอบ ๆ โปรตีนสูง อาหารพื้นบ้านอีสาน', food: 7 },
  shirt_silk: { id: 'shirt_silk', name: 'เสื้อไหม', icon: '👚', kind: 'wear', stack: 5, sell: 220, note: 'เสื้อผ้าไหมสีทองที่ตัดเย็บเอง · สวมได้ที่โต๊ะตัดเย็บ · เครื่องแต่งกาย' },
  mushroom_wild: { id: 'mushroom_wild', name: 'เห็ดป่า', icon: '🍄', kind: 'food', stack: 20, sell: 12, note: 'เห็ดโคนป่าดอกใหญ่ เก็บได้ที่ป่าดงลึก (มีใหม่ทุกวัน) · ต้มหรือย่างกินอร่อย', food: 9 },
  herb_wild: { id: 'herb_wild', name: 'สมุนไพรป่า', icon: '🌿', kind: 'material', stack: 30, sell: 15, note: 'ใบไม้ยาจากป่าดงลึก · ตำพอกแผล ต้มดื่มแก้เหนื่อย (ใช้ประดิษฐ์ยาในอนาคต)' },
  herb_rare: { id: 'herb_rare', name: 'ว่านเรืองแสง', icon: '🌱', kind: 'treasure', stack: 10, sell: 180, note: 'ว่านหายากที่ขึ้นเฉพาะลานหิ่งห้อยหลังศาลเก่า ใบเรืองแสงจาง ๆ ตอนกลางคืน' },
  amulet_forest: { id: 'amulet_forest', name: 'เครื่องรางเจ้าป่า', icon: '🧿', kind: 'treasure', stack: 1, sell: 0, note: 'ได้รับจากศาลเก่าในป่าดงลึก เมื่อดูแลศาลและถวายของด้วยใจ · พกไว้แล้วพุ่มหนามหลังศาลจะแหวกทางให้ (ในโลกเกม)' },
  oldkey: { id: 'oldkey', name: 'กุญแจโบราณ', icon: '🗝️', kind: 'material', stack: 5, sell: 0, note: 'ไขหีบโบราณได้หนึ่งใบ (ได้จากหีบลับที่ซ่อนอยู่ในป่า)' },
  rod: { id: 'rod', name: 'เบ็ดตกปลา', icon: '🎣', kind: 'tool', stack: 1, sell: 30, note: 'คันเบ็ดไม้ไผ่ ตกปลาที่บ่อปลาลุงเขียว (เดินไปริมบ่อแล้วกด E)' },
  krathong: { id: 'krathong', name: 'กระทงใบตอง', icon: '🌸', kind: 'material', stack: 5, sell: 10, note: 'ทำจากใบไม้ + ดอกบัว · นำไปลอยที่ท่าน้ำบ่อปลาช่วงลอยกระทง' },
  lotus: { id: 'lotus', name: 'ดอกบัว', icon: '🌸', kind: 'material', stack: 20, sell: 6, note: 'เก็บจากบ่อ ใช้ตกแต่งบ้าน ถวายพระ หรือมอบให้ชาวบ้าน · บานใหม่ทุกวัน' },
  fish_tilapia: { id: 'fish_tilapia', name: 'ปลานิล', icon: '🐟', kind: 'food', stack: 10, sell: 25, note: 'ตกได้จากบ่อ ย่างเกลือหรือทอดก็อร่อย', food: 14 },
  fish_catfish: { id: 'fish_catfish', name: 'ปลาดุก', icon: '🐟', kind: 'food', stack: 10, sell: 30, note: 'ปลาดุกบ่อลุงเขียว ย่างกินกับน้ำพริก', food: 16 },
  fish_barb: { id: 'fish_barb', name: 'ปลาตะเพียน', icon: '🐟', kind: 'food', stack: 10, sell: 18, note: 'ปลาตัวเล็กก้างเยอะ ทอดกรอบ ๆ', food: 10 },
  // ---------- รางวัลเช็กอินรายวัน ----------
  gold_nugget: { id: 'gold_nugget', name: 'ทองคำก้อน', icon: '🪙', kind: 'treasure', stack: 20, sell: 250, note: 'ทองคำก้อนเล็ก ๆ ได้จากเช็กอินรายวัน · ขายร้านได้ราคาดี' },
  ruby: { id: 'ruby', name: 'ทับทิม', icon: '💎', kind: 'treasure', stack: 10, sell: 400, note: 'อัญมณีสีแดงสด ของหายาก' },
  amethyst: { id: 'amethyst', name: 'อเมทิสต์', icon: '💎', kind: 'treasure', stack: 10, sell: 300, note: 'อัญมณีสีม่วงใส' },
  sapphire: { id: 'sapphire', name: 'ไพลิน', icon: '💎', kind: 'treasure', stack: 10, sell: 450, note: 'อัญมณีสีน้ำเงินเข้ม ของหายากมาก' },
  pearl: { id: 'pearl', name: 'ไข่มุก', icon: '⚪', kind: 'treasure', stack: 20, sell: 120, note: 'ไข่มุกเม็ดกลมขาวนวล' },
  sword_wood: { id: 'sword_wood', name: 'ดาบไม้', icon: '🗡️', kind: 'weapon', stack: 1, sell: 60, note: 'ดาบไม้เนื้อแข็งด้ามพันผ้า · ของสะสมประเภทอาวุธ' },
  slingshot: { id: 'slingshot', name: 'หนังสติ๊ก', icon: '🏹', kind: 'weapon', stack: 1, sell: 40, note: 'หนังสติ๊กง่ามไม้มะขาม · ของสะสมประเภทอาวุธ' },
  spear_bamboo: { id: 'spear_bamboo', name: 'ทวนไม้ไผ่', icon: '🔱', kind: 'weapon', stack: 1, sell: 50, note: 'ทวนไม้ไผ่ปลายเหลา · ของสะสมประเภทอาวุธ' },
  hat_ngob: { id: 'hat_ngob', name: 'งอบใบลาน', icon: '👒', kind: 'wear', stack: 5, sell: 45, note: 'งอบสานใบลาน กันแดดตอนทำนา · เครื่องแต่งกาย' },
  pakaoma: { id: 'pakaoma', name: 'ผ้าขาวม้า', icon: '🧣', kind: 'wear', stack: 5, sell: 35, note: 'ผ้าขาวม้าลายตาราง ใช้ได้สารพัด · เครื่องแต่งกาย' },
  sarong_silk: { id: 'sarong_silk', name: 'ผ้าซิ่นไหม', icon: '👘', kind: 'wear', stack: 5, sell: 150, note: 'ผ้าซิ่นไหมทอมือ ลายสวย ของหายาก · เครื่องแต่งกาย' },
  egg: { id: 'egg', name: 'ไข่ไก่', icon: '🥚', kind: 'food', stack: 20, sell: 5, note: 'ไข่ไก่สด ทอดหรือต้มก็อร่อย', food: 8 },
  sticky_rice: { id: 'sticky_rice', name: 'ข้าวเหนียว', icon: '🍙', kind: 'food', stack: 20, sell: 10, note: 'ข้าวเหนียวนึ่งร้อน ๆ ในกระติบ อิ่มท้อง', food: 15 },
  mango_ripe: { id: 'mango_ripe', name: 'มะม่วงสุก', icon: '🥭', kind: 'food', stack: 20, sell: 15, note: 'มะม่วงน้ำดอกไม้สุกหอมหวาน', food: 10 },
  bubble_helmet: { id: 'bubble_helmet', name: 'หมวกฟองอากาศ', icon: '🥽', kind: 'tool', stack: 1, sell: 90, note: 'สวมครอบศีรษะเป็นฟองอากาศใส หายใจใต้น้ำได้ ~2 นาที (ไม่มี = กลั้นได้ ~12 วิ) · ขึ้นผิวน้ำแล้วอากาศเติมเอง · ดำน้ำ: กด C ค้าง · ขึ้น: Space' },
  wand: { id: 'wand', name: 'ไม้คฑา', icon: '🪄', kind: 'tool', stack: 1, sell: 120, note: 'เลิกใช้แล้ว — แลกเป็นสวิงจับสัตว์ + กรงดักสัตว์ให้อัตโนมัติ' },
  basket_round: { id: 'basket_round', name: 'ตะกร้าหวายทรงกลมหูหิ้ว', icon: '🧺', kind: 'treasure', stack: 5, sell: 175, note: 'ตะกร้าหวายใบใหญ่ หูจับสองข้าง ฝีมือตาปิ่น · ใส่ผ้า ใส่ผลไม้' },
  basket_tote: { id: 'basket_tote', name: 'ตะกร้าทรงสูงหูหิ้ว', icon: '🧺', kind: 'treasure', stack: 5, sell: 175, note: 'ตะกร้าไม้ไผ่ทรงสูง หูหิ้วคู่ ฝีมือตาปิ่น · ใส่ของไปตลาด' },
  basket_bag: { id: 'basket_bag', name: 'กระเป๋าสานลายดอก', icon: '👜', kind: 'wear', stack: 5, sell: 175, note: 'กระเป๋าสานหวายลายดอก หูหิ้วโค้ง ฝีมือตาปิ่น · เครื่องแต่งกาย' },
  basket_tray: { id: 'basket_tray', name: 'กระบุงตะกร้าใบเตี้ย', icon: '🧺', kind: 'treasure', stack: 5, sell: 175, note: 'ตะกร้าปากกว้างใบเตี้ย มีหูจับ ฝีมือตาปิ่น · ใส่ผักเก็บจากสวน' },
  net: { id: 'net', name: 'สวิงจับสัตว์', icon: '🥅', kind: 'tool', stack: 1, sell: 40, note: 'ด้ามไม้ไผ่ ตาข่ายเชือกกล้วย · ใช้กับสัตว์เพชรเหลือง (ตัวเล็ก/วิ่งเร็ว) เดินเข้าไปใกล้ ๆ แล้วกด E ตวัดสวิง' },
  trap_cage: { id: 'trap_cage', name: 'กรงดักสัตว์', icon: '🪤', kind: 'tool', stack: 1, sell: 90, note: 'กรงไม้ไผ่ประตูตก ใช้ซ้ำได้ · สัตว์เพชรแดง: ป้อนกล้วยให้เชื่องก่อน แล้วกด E วางกรงใส่กล้วยเป็นเหยื่อ รอสัตว์เดินเข้ากรง' },
}

// ---------- กระเป๋า (ยิ่งระดับสูง ยิ่งมีช่องมาก) ----------
export interface BagLevel {
  level: number
  name: string
  icon: string
  slots: number
}
export const BAG_LEVELS: BagLevel[] = [
  { level: 0, name: 'ถุงผ้าใบเล็ก', icon: '👝', slots: 12 },
  { level: 1, name: 'ย่ามผ้าฝ้าย', icon: '🎒', slots: 20 },
  { level: 2, name: 'กระเป๋าสานไม้ไผ่', icon: '🧺', slots: 28 },
  { level: 3, name: 'เป้ใบใหญ่', icon: '🎒', slots: 40 },
]
export const bagSlots = (level: number) => BAG_LEVELS[Math.min(level, BAG_LEVELS.length - 1)].slots

// ---------- สูตรคราฟ ----------
export type Cost = Partial<Record<ItemId, number>>
export interface Recipe {
  id: string
  name: string
  icon: string
  needs: Cost
  /** ต้องมีเครื่องมือนี้ในกระเป๋า (ไม่ถูกใช้หมด) */
  tool?: ItemId
  /** ได้ไอเทม หรือ อัปเกรดกระเป๋าเป็นระดับนี้ */
  gives: { item: ItemId; qty: number } | { bagLevel: number }
}

export const RECIPES: Recipe[] = [
  { id: 'axe', name: 'ขวาน', icon: '🪓', needs: { branch: 3, stone: 2, vine: 1 }, gives: { item: 'axe', qty: 1 } },
  { id: 'hammer', name: 'ค้อน', icon: '🔨', needs: { branch: 2, stone: 3 }, gives: { item: 'hammer', qty: 1 } },
  { id: 'machete', name: 'มีดพร้า', icon: '🗡️', needs: { log: 1, stone: 3, vine: 1 }, gives: { item: 'machete', qty: 1 } },
  { id: 'saw', name: 'เลื่อย', icon: '🪚', needs: { log: 2, stone: 4 }, tool: 'hammer', gives: { item: 'saw', qty: 1 } },
  { id: 'plank', name: 'ไม้กระดาน ×2', icon: '🟫', needs: { log: 1 }, tool: 'saw', gives: { item: 'plank', qty: 2 } },
  { id: 'bubble_helmet', name: 'หมวกฟองอากาศ (ดำน้ำ)', icon: '🥽', needs: { pearl: 1, vine: 3, plank: 1 }, tool: 'hammer', gives: { item: 'bubble_helmet', qty: 1 } },
  { id: 'feed', name: 'อาหารสัตว์ ×4', icon: '🌾', needs: { branch: 1, vine: 1 }, gives: { item: 'feed', qty: 4 } },
  { id: 'rod', name: 'เบ็ดตกปลา', icon: '🎣', needs: { branch: 2, vine: 2 }, gives: { item: 'rod', qty: 1 } },
  { id: 'net', name: 'สวิงจับสัตว์', icon: '🥅', needs: { branch: 2, vine: 4 }, gives: { item: 'net', qty: 1 } },
  { id: 'trap_cage', name: 'กรงดักสัตว์', icon: '🪤', needs: { plank: 2, branch: 4, vine: 3 }, tool: 'hammer', gives: { item: 'trap_cage', qty: 1 } },
  { id: 'bag1', name: 'ย่ามผ้าฝ้าย (20 ช่อง)', icon: '🎒', needs: { vine: 6, branch: 2 }, gives: { bagLevel: 1 } },
  { id: 'bag2', name: 'กระเป๋าสานไม้ไผ่ (28 ช่อง)', icon: '🧺', needs: { vine: 10, plank: 4 }, tool: 'machete', gives: { bagLevel: 2 } },
  { id: 'bag3', name: 'เป้ใบใหญ่ (40 ช่อง)', icon: '🎒', needs: { vine: 15, plank: 6, log: 4 }, tool: 'hammer', gives: { bagLevel: 3 } },
]

// ---------- ร้านค้าป้าศรี ----------
export interface ShopEntry {
  id: string
  name: string
  icon: string
  price: number
  gives: { item: ItemId; qty: number } | { bagLevel: number } | { eat: { hunger?: number; thirst?: number; fun?: number } }
}
export const SHOP: ShopEntry[] = [
  { id: 'axe', name: 'ขวาน', icon: '🪓', price: 120, gives: { item: 'axe', qty: 1 } },
  { id: 'hammer', name: 'ค้อน', icon: '🔨', price: 100, gives: { item: 'hammer', qty: 1 } },
  { id: 'machete', name: 'มีดพร้า', icon: '🗡️', price: 150, gives: { item: 'machete', qty: 1 } },
  { id: 'saw', name: 'เลื่อย', icon: '🪚', price: 180, gives: { item: 'saw', qty: 1 } },
  { id: 'feed', name: 'อาหารสัตว์ ×4', icon: '🌾', price: 25, gives: { item: 'feed', qty: 4 } },
  { id: 'treat3', name: 'กล้วยสุก ×3', icon: '🍌', price: 45, gives: { item: 'treat', qty: 3 } },
  { id: 'axe2', name: 'ขวานเหล็ก', icon: '🪓', price: 350, gives: { item: 'axe2', qty: 1 } },
  { id: 'sapling', name: 'ต้นกล้าไม้ ×2', icon: '🌱', price: 20, gives: { item: 'sapling', qty: 2 } },
  { id: 'rod', name: 'เบ็ดตกปลา', icon: '🎣', price: 60, gives: { item: 'rod', qty: 1 } },
  { id: 'net', name: 'สวิงจับสัตว์', icon: '🥅', price: 60, gives: { item: 'net', qty: 1 } },
  { id: 'basket_round', name: 'ตะกร้าหวายทรงกลมหูหิ้ว', icon: '🧺', price: 350, gives: { item: 'basket_round', qty: 1 } },
  { id: 'basket_tote', name: 'ตะกร้าทรงสูงหูหิ้ว', icon: '🧺', price: 350, gives: { item: 'basket_tote', qty: 1 } },
  { id: 'basket_bag', name: 'กระเป๋าสานลายดอก', icon: '👜', price: 350, gives: { item: 'basket_bag', qty: 1 } },
  { id: 'basket_tray', name: 'กระบุงตะกร้าใบเตี้ย', icon: '🧺', price: 350, gives: { item: 'basket_tray', qty: 1 } },
  { id: 'trap_cage', name: 'กรงดักสัตว์', icon: '🪤', price: 150, gives: { item: 'trap_cage', qty: 1 } },
  { id: 'seed_morningglory', name: 'เมล็ดผักบุ้ง ×3', icon: '🌱', price: 10, gives: { item: 'seed_morningglory', qty: 3 } },
  { id: 'seed_scallion', name: 'เมล็ดต้นหอม ×3', icon: '🌱', price: 12, gives: { item: 'seed_scallion', qty: 3 } },
  { id: 'seed_basil', name: 'เมล็ดกะเพรา ×3', icon: '🌱', price: 15, gives: { item: 'seed_basil', qty: 3 } },
  { id: 'seed_lemongrass', name: 'เมล็ดตะไคร้ ×3', icon: '🌱', price: 15, gives: { item: 'seed_lemongrass', qty: 3 } },
  { id: 'seed_chili', name: 'เมล็ดพริก ×3', icon: '🌱', price: 18, gives: { item: 'seed_chili', qty: 3 } },
  { id: 'seed_eggplant', name: 'เมล็ดมะเขือ ×3', icon: '🌱', price: 20, gives: { item: 'seed_eggplant', qty: 3 } },
  { id: 'seed_tomato', name: 'เมล็ดมะเขือเทศ ×3', icon: '🌱', price: 24, gives: { item: 'seed_tomato', qty: 3 } },
  { id: 'seed_pumpkin', name: 'เมล็ดฟักทอง ×3', icon: '🌱', price: 40, gives: { item: 'seed_pumpkin', qty: 3 } },
  { id: 'vine5', name: 'เชือกกล้วย ×5', icon: '🌿', price: 30, gives: { item: 'vine', qty: 5 } },
  { id: 'plank4', name: 'ไม้กระดาน ×4', icon: '🟫', price: 90, gives: { item: 'plank', qty: 4 } },
  { id: 'bag1', name: 'ย่ามผ้าฝ้าย (20 ช่อง)', icon: '🎒', price: 150, gives: { bagLevel: 1 } },
  { id: 'bag2', name: 'กระเป๋าสานไม้ไผ่ (28 ช่อง)', icon: '🧺', price: 350, gives: { bagLevel: 2 } },
  { id: 'bag3', name: 'เป้ใบใหญ่ (40 ช่อง)', icon: '🎒', price: 800, gives: { bagLevel: 3 } },
]

/** จำนวนช่องที่ใช้ (ของซ้อนได้ตาม stack) */
export function slotsUsed(inv: Partial<Record<ItemId, number>>) {
  let n = 0
  for (const [id, q] of Object.entries(inv)) if (q && q > 0) n += Math.ceil(q / ITEMS[id as ItemId].stack)
  return n
}

/** แตกเป็นช่อง ๆ สำหรับแสดงในกระเป๋า */
export function toSlots(inv: Partial<Record<ItemId, number>>) {
  const out: { id: ItemId; qty: number }[] = []
  for (const id of Object.keys(ITEMS) as ItemId[]) {
    let q = inv[id] ?? 0
    const st = ITEMS[id].stack
    while (q > 0) {
      out.push({ id, qty: Math.min(st, q) })
      q -= st
    }
  }
  return out
}
