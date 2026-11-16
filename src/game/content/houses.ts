// แบบบ้านที่ผู้เล่นเลือกสร้างได้ — เพิ่มแบบใหม่ได้ที่นี่ แล้วเพิ่มโมเดลใน src/scenes/models/House.tsx

export type HouseStyle = 'stilt' | 'concrete' | 'halfhalf'

export interface HouseDesign {
  id: string
  name: string
  description: string
  style: HouseStyle
  /** ขนาดฐานบ้าน (กว้าง x ลึก) หน่วยเมตร ใช้ทำ collision */
  footprint: [number, number]
  wall: string
  roof: string
  trim: string
  /** จุดเด่นที่จะมีผลในระบบถัด ๆ ไป */
  perks: string[]
}

export const HOUSE_DESIGNS: HouseDesign[] = [
  {
    id: 'stilt-wood',
    name: 'บ้านไม้ใต้ถุนสูง',
    description: 'บ้านไม้แบบดั้งเดิม ใต้ถุนโล่งไว้นั่งเล่น ผูกเปล และเก็บของ เย็นสบายช่วงหน้าร้อน',
    style: 'stilt',
    footprint: [6, 5],
    wall: '#8a5a3b',
    roof: '#7b3b2a',
    trim: '#d9c29a',
    perks: ['ใต้ถุนเก็บเครื่องมือ', 'ผูกเปลพักผ่อนได้'],
  },
  {
    id: 'concrete',
    name: 'บ้านปูนชั้นเดียว',
    description: 'บ้านปูนหลังเล็ก แข็งแรง ดูแลง่าย มีระเบียงหน้าบ้านไว้นั่งรับลม',
    style: 'concrete',
    footprint: [6, 5],
    wall: '#e6dccb',
    roof: '#3f6b73',
    trim: '#b9ab92',
    perks: ['ทนทาน ซ่อมแซมน้อย', 'ระเบียงหน้าบ้าน'],
  },
  {
    id: 'half-half',
    name: 'บ้านครึ่งตึกครึ่งไม้',
    description: 'ชั้นล่างก่อปูน ชั้นบนเป็นไม้ พื้นที่ใช้สอยมากที่สุด เหมาะกับคนที่อยากขยายบ้านในอนาคต',
    style: 'halfhalf',
    footprint: [6, 5],
    wall: '#d8cbb3',
    roof: '#8c4a2f',
    trim: '#7a5236',
    perks: ['พื้นที่ใช้สอยมาก', 'ขยายห้องได้ง่าย'],
  },
]

export const getHouse = (id: string) => HOUSE_DESIGNS.find((h) => h.id === id) ?? HOUSE_DESIGNS[0]
