import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { ID, INTERIOR_ORIGIN, IW } from '../game/interior'
import { RBox } from './models/RBox'

/**
 * ภายในบ้านชาวบ้าน (เปิดประตูเข้าไปดูได้ทุกหลัง): ห้องโถงใหญ่ชั้นเดียวแบบบ้านอีสาน
 * มุมนอน (ฟูก + มุ้ง) · ตู้เสื้อผ้า · หิ้งพระ · ทีวี + เสื่อ + โต๊ะเตี้ย · ครัว (เตาถ่าน ตู้กับข้าวมุ้งลวด) · โอ่งน้ำ · ชั้นวางของ
 * ตำแหน่งเฟอร์นิเจอร์ตรงกับ NPC_FURNITURE ใน game/interior.ts (ใช้ชน)
 */
export function NpcInterior() {
  const [ox, oz] = INTERIOR_ORIGIN
  const wood = useMemo(() => planks(), [])
  const h = IW / 2
  const d = ID / 2
  const WALL = '#c8a77e'
  return (
    <group position={[ox, 0, oz]}>
      {/* พื้นไม้กระดาน */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[IW, ID]} />
        <meshStandardMaterial map={wood} />
      </mesh>
      {/* ผนังไม้ 3 ด้าน (ด้านหน้าเตี้ย ให้มองเห็นในบ้านจากกล้องด้านบน) */}
      <mesh position={[0, 1.4, d + 0.1]} receiveShadow>
        <boxGeometry args={[IW + 0.4, 2.8, 0.2]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (h + 0.1), 1.4, 0]} receiveShadow>
          <boxGeometry args={[0.2, 2.8, ID]} />
          <meshStandardMaterial color={WALL} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={'f' + s} position={[s * (h + 1) / 2 + s * 0.4, 0.35, -d - 0.1]}>
          <boxGeometry args={[h - 0.6, 0.7, 0.2]} />
          <meshStandardMaterial color={WALL} />
        </mesh>
      ))}
      {/* วงกบประตู (ทางออก) */}
      {[-0.65, 0.65].map((x) => (
        <mesh key={x} position={[x, 1.1, -d - 0.1]}>
          <boxGeometry args={[0.12, 2.2, 0.24]} />
          <meshStandardMaterial color="#6b4a2e" />
        </mesh>
      ))}
      <mesh position={[0, 0.02, -d + 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 0.8]} />
        <meshStandardMaterial color="#8a6a4a" />
      </mesh>
      {/* หน้าต่างบานเปิด (ผนังหลัง) */}
      {[-4.5, 4.5].map((x) => (
        <group key={'w' + x} position={[x, 1.6, d - 0.02]}>
          <mesh>
            <boxGeometry args={[1.4, 1, 0.05]} />
            <meshStandardMaterial color="#cfe6f2" emissive="#cfe6f2" emissiveIntensity={0.35} />
          </mesh>
          {[-0.95, 0.95].map((sx) => (
            <mesh key={sx} position={[sx, 0, -0.25]} rotation={[0, sx > 0 ? -0.9 : 0.9, 0]}>
              <boxGeometry args={[0.7, 1, 0.05]} />
              <meshStandardMaterial color="#8a5a32" />
            </mesh>
          ))}
        </group>
      ))}

      {/* มุมนอน: ฟูก หมอน มุ้งขาว */}
      <group position={[-6.2, 0, 4.05]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <RBox args={[3, 0.24, 1.6]} radius={0.08} />
          <meshStandardMaterial color="#e8e2d0" />
        </mesh>
        <mesh position={[-1.1, 0.3, 0]}>
          <RBox args={[0.5, 0.14, 1.2]} radius={0.06} />
          <meshStandardMaterial color="#f4d0a0" />
        </mesh>
        <mesh position={[0.3, 0.27, 0]}>
          <RBox args={[1.8, 0.08, 1.5]} radius={0.04} />
          <meshStandardMaterial color="#9a4a5a" />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[3.1, 1.9, 1.7]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      </group>
      {/* ตู้เสื้อผ้า */}
      <mesh position={[-2.6, 1, 4.6]} castShadow>
        <RBox args={[2, 2, 0.6]} radius={0.05} />
        <meshStandardMaterial color="#7a5232" />
      </mesh>
      <mesh position={[-2.6, 1, 4.29]}>
        <boxGeometry args={[0.04, 1.8, 0.02]} />
        <meshStandardMaterial color="#4a3020" />
      </mesh>
      {/* หิ้งพระ + พระพุทธรูป + พวงมาลัย */}
      <group position={[0, 0, 4.7]}>
        <mesh position={[0, 1.7, 0]} castShadow>
          <boxGeometry args={[1.8, 0.1, 0.45]} />
          <meshStandardMaterial color="#8a2a20" />
        </mesh>
        <mesh position={[0, 1.95, 0]}>
          <coneGeometry args={[0.16, 0.42, 10]} />
          <meshStandardMaterial color="#e0b440" metalness={0.6} roughness={0.3} />
        </mesh>
        {[-0.5, 0.5].map((x) => (
          <mesh key={x} position={[x, 1.86, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.22, 10]} />
            <meshStandardMaterial color="#f2f0e8" />
          </mesh>
        ))}
        <mesh position={[0, 1.8, -0.24]}>
          <torusGeometry args={[0.18, 0.04, 6, 14]} />
          <meshStandardMaterial color="#f6e6a0" />
        </mesh>
      </group>
      {/* ตู้ทีวี + ทีวี */}
      <group position={[3.1, 0, 4.55]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <RBox args={[2.2, 0.6, 0.6]} radius={0.04} />
          <meshStandardMaterial color="#6b4a2e" />
        </mesh>
        <mesh position={[0, 0.95, 0.05]}>
          <boxGeometry args={[1.3, 0.75, 0.08]} />
          <meshStandardMaterial color="#1a1a1e" />
        </mesh>
      </group>
      {/* เสื่อ + โต๊ะเตี้ย + ขันน้ำ */}
      <mesh position={[3.1, 0.02, 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.4, 2.4]} />
        <meshStandardMaterial color="#d8b878" />
      </mesh>
      <mesh position={[3.1, 0.2, 2.1]} castShadow>
        <RBox args={[1.6, 0.08, 1]} radius={0.04} />
        <meshStandardMaterial color="#8a5a32" />
      </mesh>
      <mesh position={[3.1, 0.1, 2.1]}>
        <boxGeometry args={[1.4, 0.2, 0.8]} />
        <meshStandardMaterial color="#6b4a2e" />
      </mesh>
      <mesh position={[3.4, 0.3, 2.1]}>
        <cylinderGeometry args={[0.14, 0.1, 0.12, 14]} />
        <meshStandardMaterial color="#c0c4c8" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* ครัว: เตาถ่าน หม้อ ตู้กับข้าวมุ้งลวด */}
      <group position={[6.55, 0, 3.75]}>
        <mesh position={[0, 0.45, 0.4]} castShadow>
          <boxGeometry args={[2.6, 0.9, 0.9]} />
          <meshStandardMaterial color="#9a7a58" />
        </mesh>
        <mesh position={[-0.6, 1.05, 0.4]}>
          <cylinderGeometry args={[0.24, 0.2, 0.3, 14]} />
          <meshStandardMaterial color="#8a5a3a" />
        </mesh>
        <mesh position={[-0.6, 1.3, 0.4]}>
          <cylinderGeometry args={[0.22, 0.18, 0.2, 14]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.5} />
        </mesh>
        <mesh position={[0.7, 1.4, 0.6]} castShadow>
          <boxGeometry args={[1, 1, 0.5]} />
          <meshStandardMaterial color="#b8c0b0" transparent opacity={0.85} />
        </mesh>
      </group>
      {/* โอ่งน้ำ 2 ใบ + ขัน */}
      {[6.2, 7.3].map((x) => (
        <mesh key={x} position={[x, 0.5, -4.15]} castShadow>
          <sphereGeometry args={[0.55, 16, 12]} />
          <meshStandardMaterial color="#6a3a22" roughness={0.6} />
        </mesh>
      ))}
      {/* ชั้นวางของ */}
      <group position={[-6.9, 0, -4.25]}>
        {[0.4, 1, 1.6].map((y) => (
          <mesh key={y} position={[0, y, 0]} castShadow>
            <boxGeometry args={[1.8, 0.06, 0.6]} />
            <meshStandardMaterial color="#8a5a32" />
          </mesh>
        ))}
        {[-0.5, 0, 0.5].map((x, i) => (
          <mesh key={x} position={[x, 1.2, 0]}>
            <boxGeometry args={[0.3, 0.32, 0.3]} />
            <meshStandardMaterial color={['#c94a3a', '#3a7ac9', '#e0b440'][i]} />
          </mesh>
        ))}
      </group>
      {/* หลอดไฟกลางบ้าน */}
      <pointLight position={[0, 2.6, 0]} intensity={8} distance={12} color="#fff1d0" />
      <mesh position={[0, 2.65, 0]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color="#fff6d8" emissive="#fff1c0" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

function planks() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const g = c.getContext('2d')!
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? '#a07848' : '#a8804e'
    g.fillRect(0, i * 16, 128, 16)
    g.fillStyle = 'rgba(60,40,20,0.35)'
    g.fillRect(0, i * 16, 128, 1.5)
  }
  const t = new CanvasTexture(c)
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(4, 3)
  t.colorSpace = SRGBColorSpace
  return t
}
