import type { ShoeId } from '../../game/content/appearance'

/**
 * รองเท้า 1 ข้าง — จุดกำเนิดอยู่ที่พื้นใต้ข้อเท้า, ปลายเท้าชี้ไปทาง +z
 */
export function Shoe({ style, color, skin }: { style: ShoeId; color: string; skin: string }) {
  const M = ({ c, shiny }: { c: string; shiny?: boolean }) => (
    <meshStandardMaterial color={c} flatShading roughness={shiny ? 0.35 : 0.8} metalness={shiny ? 0.15 : 0} />
  )
  switch (style) {
    case 'sandals':
      // รองเท้าแตะ: พื้นบาง + หูหนีบ เห็นเท้า
      return (
        <group>
          <mesh position={[0, 0.012, 0.03]} castShadow>
            <boxGeometry args={[0.12, 0.024, 0.24]} />
            <M c={color} />
          </mesh>
          <mesh position={[0, 0.05, 0.03]}>
            <boxGeometry args={[0.095, 0.05, 0.2]} />
            <M c={skin} />
          </mesh>
          <mesh position={[0, 0.07, 0.06]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.105, 0.012, 0.035]} />
            <M c={color} />
          </mesh>
        </group>
      )
    case 'sneakers':
      // รองเท้าผ้าใบ: ทรงหนา พื้นขาว มีเชือก
      return (
        <group>
          <mesh position={[0, 0.018, 0.03]} castShadow>
            <boxGeometry args={[0.13, 0.036, 0.26]} />
            <M c="#f4f2ee" />
          </mesh>
          <mesh position={[0, 0.07, 0.02]} castShadow>
            <boxGeometry args={[0.12, 0.07, 0.23]} />
            <M c={color} />
          </mesh>
          <mesh position={[0, 0.06, 0.135]}>
            <boxGeometry args={[0.115, 0.05, 0.03]} />
            <M c={color} />
          </mesh>
          {[0.02, 0.05, 0.08].map((z) => (
            <mesh key={z} position={[0, 0.107, z]}>
              <boxGeometry args={[0.07, 0.008, 0.012]} />
              <M c="#ffffff" />
            </mesh>
          ))}
        </group>
      )
    case 'kachu':
      // รองเท้าคัชชู: หนังเงา หัวมน ปิดเท้า
      return (
        <group>
          <mesh position={[0, 0.012, 0.03]}>
            <boxGeometry args={[0.115, 0.024, 0.24]} />
            <M c="#2a1f1a" />
          </mesh>
          <mesh position={[0, 0.055, 0.02]} castShadow>
            <boxGeometry args={[0.105, 0.06, 0.21]} />
            <M c={color} shiny />
          </mesh>
          <mesh position={[0, 0.045, 0.13]} scale={[1, 0.6, 0.8]}>
            <sphereGeometry args={[0.055, 8, 6]} />
            <M c={color} shiny />
          </mesh>
        </group>
      )
    case 'maryjane':
      // รองเท้าแมรี่เจน: หัวกลม มีสายคาดหลังเท้า + กระดุม
      return (
        <group>
          <mesh position={[0, 0.012, 0.03]}>
            <boxGeometry args={[0.115, 0.024, 0.23]} />
            <M c="#2a1f1a" />
          </mesh>
          <mesh position={[0, 0.045, 0.06]} castShadow scale={[1, 0.7, 1.3]}>
            <sphereGeometry args={[0.062, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <M c={color} shiny />
          </mesh>
          <mesh position={[0, 0.045, -0.04]} castShadow>
            <boxGeometry args={[0.1, 0.05, 0.1]} />
            <M c={color} shiny />
          </mesh>
          <mesh position={[0, 0.08, 0.01]}>
            <boxGeometry args={[0.11, 0.012, 0.028]} />
            <M c={color} shiny />
          </mesh>
          <mesh position={[0.056, 0.08, 0.01]}>
            <sphereGeometry args={[0.01, 6, 5]} />
            <M c="#e8d9a8" shiny />
          </mesh>
        </group>
      )
    case 'heels':
      // รองเท้าส้นสูง: ส้นเรียวด้านหลัง ส้นเท้ายก ปลายแหลม
      return (
        <group>
          <mesh position={[0, 0.045, -0.075]} castShadow>
            <cylinderGeometry args={[0.012, 0.018, 0.09, 6]} />
            <M c={color} shiny />
          </mesh>
          <group position={[0, 0.06, 0.02]} rotation={[0.32, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.095, 0.035, 0.2]} />
              <M c={color} shiny />
            </mesh>
            <mesh position={[0, 0.03, -0.03]}>
              <boxGeometry args={[0.085, 0.03, 0.12]} />
              <M c={skin} />
            </mesh>
            <mesh position={[0, 0.0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.045, 0.06, 6]} />
              <M c={color} shiny />
            </mesh>
          </group>
        </group>
      )
  }
}
