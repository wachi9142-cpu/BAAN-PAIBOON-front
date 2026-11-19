/** ลานจอดรถหน้าบ้านน้องเนย โน๊ต นิว (ครอบครัว 5 คน) — พิกัดภายในที่ดิน lot-noey (หัวรถหันเข้าหาบ้าน = +z) */
export interface ParkedVehicle {
  kind: 'pickup' | 'tractor' | 'moto' | 'bike'
  x: number
  z: number
  rot?: number
  color?: string
  moto?: 'classic' | 'scooter' | 'family' | 'sport'
  /** วงชน (รัศมี) · 0/ไม่มี = เดินผ่านได้ */
  solid?: { dz: number; r: number }[]
}
export const NOEY_VEHICLES: ParkedVehicle[] = [
  // กระบะ 4 ประตูสีดำ ยี่ห้อ SIAMOTO (ยี่ห้อสมมติ)
  { kind: 'pickup', x: 3.7, z: -6.2, solid: [{ dz: -1.4, r: 1.15 }, { dz: 1.2, r: 1.15 }] },
  // รถไถสีส้ม
  { kind: 'tractor', x: -4.4, z: -7.2, solid: [{ dz: 0, r: 1.25 }] },
  // มอเตอร์ไซค์ 2 คัน
  { kind: 'moto', moto: 'family', x: -2.0, z: -1.6, color: '#b8322a', solid: [{ dz: 0, r: 0.6 }] },
  { kind: 'moto', moto: 'scooter', x: -3.1, z: -1.8, color: '#e8e4dc', solid: [{ dz: 0, r: 0.6 }] },
  // จักรยานผู้ใหญ่ 3 คัน มีที่ซ้อนท้าย
  { kind: 'bike', x: 2.4, z: -1.3, color: '#2f6a9a' },
  { kind: 'bike', x: 3.2, z: -1.3, color: '#c84a6a' },
  { kind: 'bike', x: 4.0, z: -1.3, color: '#3a8a4a' },
]
