import type { AccessoryId } from '../../game/content/appearance'

const M = ({ c }: { c: string }) => <meshStandardMaterial color={c} flatShading />

/** เครื่องประดับบนหัว/คอ — พิกัดเดียวกับหัวของ Character (กลางหัว y 1.57, หน้าไปทาง +z) */
export function Accessory({ kind, color }: { kind: AccessoryId; color: string }) {
  switch (kind) {
    case 'none':
      return null
    case 'glasses':
      return (
        <group position={[0, 1.59, 0.168]}>
          {[-0.06, 0.06].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <torusGeometry args={[0.038, 0.006, 6, 16]} />
              <M c={color} />
            </mesh>
          ))}
          <mesh>
            <boxGeometry args={[0.04, 0.006, 0.006]} />
            <M c={color} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.12, 0.005, -0.08]} rotation={[0, s * 0.2, 0]}>
              <boxGeometry args={[0.006, 0.006, 0.16]} />
              <M c={color} />
            </mesh>
          ))}
        </group>
      )
    case 'ribbon':
      // โบว์ใหญ่ด้านหลังหัว
      return (
        <group position={[0, 1.73, -0.12]} rotation={[-0.5, 0, 0]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.06, 0, 0]} rotation={[0, 0, s * 0.3]} scale={[1.4, 0.8, 0.35]}>
              <sphereGeometry args={[0.05, 8, 6]} />
              <M c={color} />
            </mesh>
          ))}
          <mesh>
            <sphereGeometry args={[0.025, 6, 6]} />
            <M c={color} />
          </mesh>
        </group>
      )
    case 'hairclip':
      return (
        <group position={[0.11, 1.7, 0.1]} rotation={[0.5, 0.4, -0.5]}>
          <mesh>
            <boxGeometry args={[0.08, 0.018, 0.012]} />
            <M c={color} />
          </mesh>
          <mesh position={[0.045, 0, 0]}>
            <sphereGeometry args={[0.016, 6, 6]} />
            <M c="#f4f1ea" />
          </mesh>
        </group>
      )
    case 'flowercrown': {
      const flowers = ['#f4f1ea', color, '#f0c94a', '#f4f1ea', color, '#f0c94a', '#f4f1ea', color]
      return (
        <group position={[0, 1.7, -0.01]}>
          <mesh rotation={[Math.PI / 2 - 0.15, 0, 0]}>
            <torusGeometry args={[0.165, 0.012, 6, 20]} />
            <M c="#5c7a3a" />
          </mesh>
          {flowers.map((c, i) => {
            const a = (i / flowers.length) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.sin(a) * 0.165, Math.cos(a) * 0.025, Math.cos(a) * 0.165]}>
                <sphereGeometry args={[0.03, 6, 5]} />
                <M c={c} />
              </mesh>
            )
          })}
        </group>
      )
    }
    case 'headband':
      return (
        <mesh position={[0, 1.66, 0.0]} rotation={[0.25, 0, 0]}>
          <torusGeometry args={[0.18, 0.014, 6, 18, Math.PI]} />
          <M c={color} />
        </mesh>
      )
    case 'cap':
      return (
        <group position={[0, 1.7, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.19, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <M c={color} />
          </mesh>
          <mesh position={[0, 0.0, 0.2]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.24, 0.015, 0.16]} />
            <M c={color} />
          </mesh>
          <mesh position={[0, 0.19, 0]}>
            <sphereGeometry args={[0.018, 6, 5]} />
            <M c={color} />
          </mesh>
        </group>
      )
    case 'beanie':
      return (
        <group position={[0, 1.66, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.192, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <M c={color} />
          </mesh>
          <mesh position={[0, 0.0, 0]}>
            <cylinderGeometry args={[0.195, 0.195, 0.06, 14]} />
            <M c={color} />
          </mesh>
        </group>
      )
    case 'beret':
      return (
        <group position={[0.03, 1.74, 0]} rotation={[0, 0, -0.25]}>
          <mesh castShadow scale={[1, 0.35, 1]}>
            <sphereGeometry args={[0.2, 12, 8]} />
            <M c={color} />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.03, 5]} />
            <M c={color} />
          </mesh>
        </group>
      )
    case 'strawhat':
      return (
        <group position={[0, 1.71, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.015, 18]} />
            <M c="#e2c27a" />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.15, 0.18, 0.12, 14]} />
            <M c="#e2c27a" />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.182, 0.182, 0.03, 14]} />
            <M c={color} />
          </mesh>
        </group>
      )
    case 'widehat':
      // หมวกผ้าปีกกว้าง (แบบที่ชาวบ้านใส่ทำงานกลางแดด)
      return (
        <group position={[0, 1.7, 0]} rotation={[-0.08, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.34, 0.36, 0.02, 20]} />
            <M c={color} />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <sphereGeometry args={[0.18, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <M c={color} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.183, 0.183, 0.035, 14]} />
            <M c="#f1ece0" />
          </mesh>
        </group>
      )
    case 'headphones':
      // หูฟังคล้องคอ
      return (
        <group position={[0, 1.39, 0.02]}>
          <mesh rotation={[Math.PI / 2 + 0.3, 0, 0]}>
            <torusGeometry args={[0.11, 0.012, 6, 16, Math.PI]} />
            <M c="#2b2a2c" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.11, -0.02, 0.04]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, 0.03, 10]} />
              <M c={color} />
            </mesh>
          ))}
        </group>
      )
  }
}
