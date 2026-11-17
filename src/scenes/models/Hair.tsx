import type { Appearance } from '../../game/content/appearance'

/** ทรงผม — พิกัดเดียวกับหัวของ Character (หัวกลางที่ y 1.57, รัศมี 0.17, หน้าไปทาง +z) */
export function Hair({ style, color }: { style: Appearance['hairStyle']; color: string }) {
  const mat = <meshStandardMaterial color={color} flatShading />
  const cap = (
    <mesh position={[0, 1.62, -0.01]} castShadow>
      <sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
      {mat}
    </mesh>
  )
  /** หน้าม้า */
  const bangs = (
    <mesh position={[0, 1.685, 0.13]} rotation={[0.35, 0, 0]}>
      <boxGeometry args={[0.3, 0.07, 0.06]} />
      {mat}
    </mesh>
  )
  /** ผมยาวด้านหลัง */
  const longBack = (h = 0.46) => (
    <mesh position={[0, 1.65 - h / 2 - 0.02, -0.15]} castShadow>
      <boxGeometry args={[0.34, h, 0.08]} />
      {mat}
    </mesh>
  )
  /** เปีย: ลูกกลมเรียงต่อกันลงมา */
  const braid = (x: number, z: number, n = 5) =>
    Array.from({ length: n }).map((_, i) => (
      <mesh key={`${x}-${i}`} position={[x, 1.48 - i * 0.075, z]} castShadow>
        <sphereGeometry args={[0.045 - i * 0.003, 7, 6]} />
        {mat}
      </mesh>
    ))

  switch (style) {
    case 'buzz':
      return (
        <mesh position={[0, 1.6, -0.01]}>
          <sphereGeometry args={[0.175, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
          {mat}
        </mesh>
      )
    case 'short':
      return (
        <group>
          {cap}
          <mesh position={[0, 1.6, -0.06]}>
            <boxGeometry args={[0.34, 0.16, 0.24]} />
            {mat}
          </mesh>
        </group>
      )
    case 'curly':
      // หยิกสั้น: ก้อนกลมหลายก้อนรอบหัว
      return (
        <group>
          {cap}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.sin(a) * 0.16, 1.66 + (i % 2) * 0.04, Math.cos(a) * 0.14 - 0.02]} castShadow>
                <sphereGeometry args={[0.06, 7, 6]} />
                {mat}
              </mesh>
            )
          })}
        </group>
      )
    case 'bob':
      return (
        <group>
          {cap}
          <mesh position={[0, 1.53, -0.04]} castShadow>
            <cylinderGeometry args={[0.2, 0.21, 0.2, 12, 1, true, Math.PI * 0.15, Math.PI * 1.7]} />
            <meshStandardMaterial color={color} flatShading side={2} />
          </mesh>
        </group>
      )
    case 'long':
      return (
        <group>
          {cap}
          {longBack()}
        </group>
      )
    case 'longbangs':
      return (
        <group>
          {cap}
          {bangs}
          {longBack(0.52)}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.16, 1.5, 0.02]}>
              <boxGeometry args={[0.05, 0.3, 0.1]} />
              {mat}
            </mesh>
          ))}
        </group>
      )
    case 'wavy':
      // ยาวลอน: ลูกคลื่นด้านหลังและสองข้าง
      return (
        <group>
          {cap}
          {[-0.12, 0, 0.12].flatMap((x) =>
            [0, 1, 2, 3].map((j) => (
              <mesh key={`${x}${j}`} position={[x + (j % 2 ? 0.02 : -0.02), 1.55 - j * 0.11, -0.14]} castShadow>
                <sphereGeometry args={[0.07, 7, 6]} />
                {mat}
              </mesh>
            )),
          )}
          {[-1, 1].flatMap((s) =>
            [0, 1, 2].map((j) => (
              <mesh key={`s${s}${j}`} position={[s * (0.17 + (j % 2) * 0.02), 1.52 - j * 0.1, 0]}>
                <sphereGeometry args={[0.055, 7, 6]} />
                {mat}
              </mesh>
            )),
          )}
        </group>
      )
    case 'bun':
      return (
        <group>
          {cap}
          <mesh position={[0, 1.72, -0.14]} castShadow>
            <sphereGeometry args={[0.09, 10, 8]} />
            {mat}
          </mesh>
        </group>
      )
    case 'sidebuns':
      return (
        <group>
          {cap}
          {bangs}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.14, 1.75, -0.05]} castShadow>
              <sphereGeometry args={[0.075, 10, 8]} />
              {mat}
            </mesh>
          ))}
        </group>
      )
    case 'halfup':
      return (
        <group>
          {cap}
          {longBack(0.4)}
          <mesh position={[0, 1.66, -0.19]} castShadow>
            <sphereGeometry args={[0.06, 8, 7]} />
            {mat}
          </mesh>
        </group>
      )
    case 'ponytail':
      return (
        <group>
          {cap}
          <mesh position={[0, 1.52, -0.2]} rotation={[0.35, 0, 0]} castShadow>
            <coneGeometry args={[0.07, 0.4, 8]} />
            {mat}
          </mesh>
        </group>
      )
    case 'twintails':
      return (
        <group>
          {cap}
          {bangs}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.2, 1.5, -0.06]} rotation={[0.1, 0, s * 0.25]} castShadow>
              <coneGeometry args={[0.06, 0.38, 8]} />
              {mat}
            </mesh>
          ))}
        </group>
      )
    case 'braid':
      return (
        <group>
          {cap}
          {braid(0, -0.17, 6)}
        </group>
      )
    case 'twinbraids':
      return (
        <group>
          {cap}
          {bangs}
          {braid(-0.15, 0.02)}
          {braid(0.15, 0.02)}
        </group>
      )
  }
}
