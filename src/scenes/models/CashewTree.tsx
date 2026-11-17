/**
 * ต้นมะม่วงหิมพานต์ (ตามภาพตัวอย่างของผู้สร้าง): ต้นสูงใหญ่ ลำต้นเปลือกเทาน้ำตาลแตกกิ่งเป็นง่าม
 * พุ่มใบกว้างหลายก้อน · ผลเป็นพวงห้อยตามกิ่ง: ผลปลอมทรงลูกแพร์สีแดง/ส้ม/เหลือง มีเม็ดมะม่วงหิมพานต์สีเทาเขียวติดปลายล่าง
 */
export function CashewTree({ seed = 0, scale = 1 }: { seed?: number; scale?: number }) {
  const r = (k: number) => {
    const x = Math.sin(seed * 91.7 + k * 37.13) * 43758.5453
    return x - Math.floor(x)
  }
  const trunk = '#6e5a48'
  // กิ่งหลัก 3 กิ่งแตกจากง่ามที่ความสูง 1.6 ม.
  const branches = [0, 1, 2].map((i) => {
    const yaw = (i / 3) * Math.PI * 2 + r(i) * 0.8
    const tilt = 0.55 + r(i + 5) * 0.25
    return { yaw, tilt, len: 1.9 + r(i + 9) * 0.5 }
  })
  // ก้อนพุ่มใบ
  const blobs = Array.from({ length: 9 }).map((_, i) => {
    const a = (i / 9) * Math.PI * 2 + r(i + 20)
    const d = i % 3 === 0 ? 0.4 : 1.5 + r(i + 30) * 0.8
    return { x: Math.cos(a) * d, z: Math.sin(a) * d, y: 3.4 + r(i + 40) * 0.9 - (d > 1 ? 0.3 : -0.3), s: 1 + r(i + 50) * 0.45 }
  })
  // พวงผลห้อยใต้พุ่ม
  const bunches = Array.from({ length: 8 }).map((_, i) => {
    const a = (i / 8) * Math.PI * 2 + r(i + 60) * 0.7
    const d = 1.1 + r(i + 70) * 1.1
    return { x: Math.cos(a) * d, z: Math.sin(a) * d, y: 2.5 + r(i + 80) * 0.6, n: 3 + Math.floor(r(i + 90) * 3) }
  })
  const fruitColors = ['#d8342c', '#e8532e', '#f08a2c', '#e8c03a', '#c42a3a']
  return (
    <group scale={scale}>
      {/* ลำต้น: โคนกว้าง เปลือกขรุขระ */}
      <mesh position={[0, 0.85, 0]} rotation={[0, 0, 0.04]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 1.7, 9]} />
        <meshStandardMaterial color={trunk} roughness={1} flatShading />
      </mesh>
      {branches.map((b, i) => (
        <group key={i} position={[0, 1.6, 0]} rotation={[0, b.yaw, 0]}>
          <mesh position={[0, Math.cos(b.tilt) * b.len * 0.5, Math.sin(b.tilt) * b.len * 0.5]} rotation={[b.tilt, 0, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.16, b.len, 7]} />
            <meshStandardMaterial color={trunk} roughness={1} flatShading />
          </mesh>
        </group>
      ))}
      {/* พุ่มใบ */}
      {blobs.map((b, i) => (
        <mesh key={'l' + i} position={[b.x, b.y, b.z]} scale={[b.s * 1.15, b.s * 0.8, b.s * 1.15]} castShadow>
          <icosahedronGeometry args={[0.95, 1]} />
          <meshStandardMaterial color={i % 3 === 0 ? '#3f7a32' : i % 3 === 1 ? '#4c8a3a' : '#5a9642'} roughness={0.85} flatShading />
        </mesh>
      ))}
      {/* พวงผลมะม่วงหิมพานต์ */}
      {bunches.map((b, i) => (
        <group key={'b' + i} position={[b.x, b.y, b.z]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.4, 4]} />
            <meshStandardMaterial color="#5a4a30" />
          </mesh>
          {Array.from({ length: b.n }).map((_, k) => {
            const a = (k / b.n) * Math.PI * 2
            const c = fruitColors[(i + k) % fruitColors.length]
            return (
              <group key={k} position={[Math.cos(a) * 0.1, -0.02 - (k % 2) * 0.08, Math.sin(a) * 0.1]} rotation={[Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25]}>
                {/* ผลปลอมทรงลูกแพร์ */}
                <mesh scale={[1, 1.25, 1]} castShadow>
                  <sphereGeometry args={[0.085, 10, 8]} />
                  <meshStandardMaterial color={c} roughness={0.45} />
                </mesh>
                <mesh position={[0, 0.08, 0]}>
                  <sphereGeometry args={[0.06, 8, 6]} />
                  <meshStandardMaterial color={c} roughness={0.45} />
                </mesh>
                {/* เม็ดมะม่วงหิมพานต์ (ทรงไต) */}
                <mesh position={[0, -0.13, 0]} rotation={[0, 0, 0.5]} scale={[1.3, 0.8, 0.8]}>
                  <sphereGeometry args={[0.04, 8, 6]} />
                  <meshStandardMaterial color="#8a9a6a" roughness={0.8} />
                </mesh>
              </group>
            )
          })}
        </group>
      ))}
    </group>
  )
}
