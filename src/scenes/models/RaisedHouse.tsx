/**
 * บ้านสองชั้นยกสูงแบบโมเดิร์นชนบท (ตามภาพอ้างอิงผู้สร้าง 20 พ.ย.) — 3 ห้องนอน
 * ใต้ถุนเปิดโล่งพื้นปูน: ครัวปูน ตู้เย็น โต๊ะกินข้าว เสาปูนขาว
 * ชั้นบนผนังไม้ระแนงสีส้มน้ำตาล 3 ห้องนอน (ประตูกระจกบานใหญ่ 3 บาน) · ระเบียงไม้ยาวเต็มหน้า ราวไม้
 * หลังคาเพิงแหงนแผ่นใหญ่ ชายคายื่นยาว · บันไดไม้ภายนอกขึ้นระเบียงด้านข้าง · หน้าบ้านหัน +z
 */
export function RaisedHouse() {
  const W = 11
  const D = 7
  const F = 2.9
  const H = 2.7
  const wood = '#b8682e'
  const woodD = '#8a4a20'
  const rail = '#9a5a28'
  return (
    <group>
      <mesh position={[0, 0.06, 0.6]} receiveShadow>
        <boxGeometry args={[W + 0.6, 0.12, D + 2]} />
        <meshStandardMaterial color="#c8c4bc" />
      </mesh>
      {[-W / 2 + 0.3, -W / 6, W / 6, W / 2 - 0.3].flatMap((x) =>
        [-D / 2 + 0.3, D / 2 + 1.2].map((z) => (
          <mesh key={`${x}${z}`} position={[x, F / 2, z]} castShadow>
            <boxGeometry args={[0.3, F, 0.3]} />
            <meshStandardMaterial color="#efece4" />
          </mesh>
        )),
      )}
      {/* ครัวใต้ถุน */}
      <mesh position={[-2.6, 0.5, -D / 2 + 0.7]} castShadow>
        <boxGeometry args={[4, 0.9, 0.7]} />
        <meshStandardMaterial color="#e8e4dc" />
      </mesh>
      <mesh position={[-0.2, 0.95, -D / 2 + 0.6]} castShadow>
        <boxGeometry args={[0.8, 1.8, 0.7]} />
        <meshStandardMaterial color="#f2f2f2" />
      </mesh>
      <mesh position={[-W / 2 + 0.2, 1.4, -1]}>
        <boxGeometry args={[0.15, 2.6, 4]} />
        <meshStandardMaterial color="#e2ddd4" />
      </mesh>
      {/* โต๊ะกินข้าว + เก้าอี้ */}
      <group position={[2, 0, 0.6]}>
        <mesh position={[0, 0.75, 0]} castShadow>
          <boxGeometry args={[1.8, 0.08, 1]} />
          <meshStandardMaterial color="#8a5a32" />
        </mesh>
        {[-0.75, 0.75].flatMap((x) =>
          [-0.4, 0.4].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.37, z]}>
              <boxGeometry args={[0.06, 0.74, 0.06]} />
              <meshStandardMaterial color="#6a4426" />
            </mesh>
          )),
        )}
        {[-0.6, 0, 0.6].flatMap((x) =>
          [-0.85, 0.85].map((z) => (
            <mesh key={'c' + x + z} position={[x, 0.45, z]}>
              <boxGeometry args={[0.4, 0.06, 0.4]} />
              <meshStandardMaterial color="#9a6a3a" />
            </mesh>
          )),
        )}
      </group>
      {/* พื้นชั้นบน + ระเบียง */}
      <mesh position={[0, F, 0.6]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.2, 0.22, D + 2]} />
        <meshStandardMaterial color="#d8d4cc" />
      </mesh>
      <mesh position={[0, F + H / 2 + 0.1, -0.4]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D - 0.8]} />
        <meshStandardMaterial color={wood} />
      </mesh>
      {Array.from({ length: 34 }, (_, k) => (
        <mesh key={'g' + k} position={[-W / 2 + 0.16 + k * 0.325, F + H / 2 + 0.1, D / 2 - 0.79]}>
          <boxGeometry args={[0.02, H - 0.05, 0.01]} />
          <meshStandardMaterial color={woodD} />
        </mesh>
      ))}
      {/* ห้องนอน 3 ห้อง: ประตูกระจกบานใหญ่ + ม่านฟ้า */}
      {[-W / 3, 0, W / 3].map((x) => (
        <group key={x} position={[x, F + 1.2, D / 2 - 0.77]}>
          <mesh>
            <boxGeometry args={[1.9, 2.1, 0.05]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[1.75, 1.95, 0.02]} />
            <meshStandardMaterial color="#8ab4c4" metalness={0.4} roughness={0.15} />
          </mesh>
          {[-0.75, 0.75].map((dx) => (
            <mesh key={dx} position={[dx, 0, 0.05]}>
              <boxGeometry args={[0.25, 1.9, 0.02]} />
              <meshStandardMaterial color="#5ac0c8" />
            </mesh>
          ))}
        </group>
      ))}
      {/* ราวระเบียง */}
      <mesh position={[0, F + 1, D / 2 + 1.55]}>
        <boxGeometry args={[W + 0.2, 0.08, 0.08]} />
        <meshStandardMaterial color={rail} />
      </mesh>
      {Array.from({ length: 28 }, (_, k) => (
        <mesh key={'b' + k} position={[-W / 2 + 0.2 + k * 0.4, F + 0.55, D / 2 + 1.55]}>
          <boxGeometry args={[0.05, 0.9, 0.05]} />
          <meshStandardMaterial color={rail} />
        </mesh>
      ))}
      <mesh position={[-W / 3, F + 0.35, D / 2 + 0.6]}>
        <boxGeometry args={[2.2, 0.4, 0.5]} />
        <meshStandardMaterial color="#2a5a9a" />
      </mesh>
      {/* หลังคาเพิงแหงน */}
      <mesh position={[0, F + H + 0.55, 0.4]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[W + 1.6, 0.14, D + 3]} />
        <meshStandardMaterial color="#8a9094" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, F + H + 0.42, D / 2 + 1.9]}>
        <boxGeometry args={[W + 1.6, 0.25, 0.06]} />
        <meshStandardMaterial color="#efece4" />
      </mesh>
      {/* บันไดไม้ภายนอกด้านขวา */}
      {Array.from({ length: 9 }, (_, k) => (
        <mesh key={'s' + k} position={[W / 2 + 0.7, 0.18 + k * (F / 10), D / 2 + 2.6 - k * 0.32]} castShadow>
          <boxGeometry args={[1, 0.07, 0.32]} />
          <meshStandardMaterial color={woodD} />
        </mesh>
      ))}
      <mesh position={[W / 2 + 0.7, F - 0.1, D / 2 - 0.6]}>
        <boxGeometry args={[1, 0.12, 1.2]} />
        <meshStandardMaterial color={woodD} />
      </mesh>
      {[-0.5, 0.5].map((dx) => (
        <mesh key={dx} position={[W / 2 + 0.7 + dx, F / 2 + 0.5, D / 2 + 1.3]} rotation={[Math.atan2(F, 2.9), 0, 0]}>
          <boxGeometry args={[0.06, 0.06, 3.3]} />
          <meshStandardMaterial color={rail} />
        </mesh>
      ))}
      {/* ทางเดินแผ่นปูน */}
      {Array.from({ length: 4 }, (_, k) => (
        <mesh key={'p' + k} position={[0, 0.05, D / 2 + 2.6 + k * 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.1, 0.6]} />
          <meshStandardMaterial color="#d8d4cc" />
        </mesh>
      ))}
    </group>
  )
}
