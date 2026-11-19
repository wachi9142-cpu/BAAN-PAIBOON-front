import { RBox } from './models/RBox'
import { MulberryBush } from './Orchard'

/** ต้นมัลเบอร์รี่ 3 ต้นปลูกติดกัน (หลังบ้านน้าโรจน์) */
export function MulberryRow({ w, d }: { w: number; d: number }) {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[Math.min(w, d) / 2, 28]} />
        <meshStandardMaterial color="#8a7a5a" roughness={1} />
      </mesh>
      {[
        [-0.95, 0.35],
        [0.9, 0.45],
        [0, -0.75],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <MulberryBush seed={i * 3 + 1} s={1 + i * 0.08} />
        </group>
      ))}
    </group>
  )
}

/**
 * ครัวนอกบ้าน (หลังบ้านน้าโรจน์): เพิงหลังคาเมทัลชีทบนเสาเหล็ก พื้นปูน
 * เคาน์เตอร์ปูกระเบื้อง + เตาแก๊ส หม้อแกง ถังแก๊ส เขียง ครก · เตาถ่านหวดนึ่งข้าวเหนียว · โอ่งน้ำ · ราวแขวนหม้อ-กระทะ
 * โต๊ะกินข้าวไม้ + ม้านั่งยาวสองข้าง + สำรับกับข้าว (ด้านหน้า +z)
 */
export function OutdoorKitchen({ w, d }: { w: number; d: number }) {
  const hw = w / 2
  const hd = d / 2
  const H = 2.4
  return (
    <group>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[w, 0.08, d]} />
        <meshStandardMaterial color="#c9c3b6" roughness={0.95} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={sx + ':' + sz} position={[sx * (hw - 0.15), H / 2, sz * (hd - 0.15)]} castShadow>
            <boxGeometry args={[0.1, H, 0.1]} />
            <meshStandardMaterial color="#3a3c40" metalness={0.5} roughness={0.4} />
          </mesh>
        )),
      )}
      <mesh position={[0, H + 0.02, 0]} rotation={[-0.08, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.5, 0.05, d + 0.5]} />
        <meshStandardMaterial color="#5a6a72" roughness={0.5} metalness={0.4} />
      </mesh>
      {Array.from({ length: Math.round((w + 0.5) / 0.3) }, (_, i) => (
        <mesh key={'r' + i} position={[-(w + 0.5) / 2 + 0.15 + i * 0.3, H + 0.05, 0]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[0.03, 0.03, d + 0.5]} />
          <meshStandardMaterial color="#4a5a62" metalness={0.4} />
        </mesh>
      ))}
      {/* เคาน์เตอร์ปูน (ด้านหลัง −z) */}
      <group position={[-hw + 1.4, 0, -hd + 0.4]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[2.4, 0.84, 0.6]} />
          <meshStandardMaterial color="#d8d2c4" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.86, 0]}>
          <boxGeometry args={[2.46, 0.04, 0.66]} />
          <meshStandardMaterial color="#f2f0ea" roughness={0.3} />
        </mesh>
        <mesh position={[-0.6, 0.92, 0]}>
          <boxGeometry args={[0.7, 0.08, 0.4]} />
          <meshStandardMaterial color="#2a2a2e" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[-0.75, 1.05, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.14, 0.2, 16]} />
          <meshStandardMaterial color="#b8bcc0" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[-0.4, 0.99, 0]}>
          <cylinderGeometry args={[0.2, 0.12, 0.08, 16]} />
          <meshStandardMaterial color="#2a2a2e" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[-0.6, 0.3, 0.38]}>
          <cylinderGeometry args={[0.15, 0.15, 0.55, 14]} />
          <meshStandardMaterial color="#2a6ac9" roughness={0.4} />
        </mesh>
        <mesh position={[0.35, 0.9, 0.02]}>
          <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
          <meshStandardMaterial color="#a8764a" />
        </mesh>
        <mesh position={[0.85, 0.96, 0]}>
          <cylinderGeometry args={[0.12, 0.09, 0.16, 12]} />
          <meshStandardMaterial color="#8a8478" roughness={0.9} />
        </mesh>
      </group>
      {/* เตาถ่าน + หม้อนึ่ง + หวดข้าวเหนียว */}
      <group position={[hw - 0.55, 0, -hd + 0.45]}>
        <mesh position={[0, 0.17, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.15, 0.34, 14]} />
          <meshStandardMaterial color="#8a5a3a" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.2, 0.18, 0.18, 14]} />
          <meshStandardMaterial color="#b8bcc0" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.66, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.2, 0.32, 12, 1, true]} />
          <meshStandardMaterial color="#d8b878" roughness={0.9} side={2} />
        </mesh>
      </group>
      {/* โอ่งน้ำ */}
      <group position={[hw - 0.45, 0, -hd + 1.25]}>
        <mesh position={[0, 0.38, 0]} scale={[1, 1.15, 1]} castShadow>
          <sphereGeometry args={[0.34, 18, 12]} />
          <meshStandardMaterial color="#6a3a22" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.76, 0]}>
          <cylinderGeometry args={[0.2, 0.22, 0.05, 16]} />
          <meshStandardMaterial color="#4a90b8" transparent opacity={0.7} />
        </mesh>
      </group>
      {/* ราวแขวนหม้อ-กระทะ */}
      <mesh position={[-hw + 1.4, 1.75, -hd + 0.12]}>
        <boxGeometry args={[2.0, 0.04, 0.04]} />
        <meshStandardMaterial color="#c8ccd0" metalness={0.6} />
      </mesh>
      {[-0.7, -0.2, 0.3, 0.75].map((x, i) => (
        <mesh key={'p' + i} position={[-hw + 1.4 + x, 1.55, -hd + 0.14]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13 + (i % 2) * 0.04, 0.13 + (i % 2) * 0.04, 0.03, 14]} />
          <meshStandardMaterial color={i % 2 ? '#2a2a2e' : '#b8bcc0'} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      {/* โต๊ะกินข้าว + ม้านั่ง + สำรับกับข้าว */}
      <group position={[0, 0, hd - 1.2]}>
        <mesh position={[0, 0.74, 0]} castShadow>
          <RBox args={[2.0, 0.07, 0.85]} radius={0.02} />
          <meshStandardMaterial color="#9a6a40" roughness={0.75} />
        </mesh>
        {[-0.9, 0.9].flatMap((x) =>
          [-0.35, 0.35].map((z) => (
            <mesh key={x + ':' + z} position={[x, 0.36, z]}>
              <boxGeometry args={[0.07, 0.72, 0.07]} />
              <meshStandardMaterial color="#7a5030" />
            </mesh>
          )),
        )}
        {[-0.75, 0.75].map((z) => (
          <group key={'bn' + z} position={[0, 0, z]}>
            <mesh position={[0, 0.44, 0]} castShadow>
              <RBox args={[1.9, 0.06, 0.3]} radius={0.02} />
              <meshStandardMaterial color="#9a6a40" roughness={0.75} />
            </mesh>
            {[-0.8, 0.8].map((x) => (
              <mesh key={x} position={[x, 0.22, 0]}>
                <boxGeometry args={[0.07, 0.44, 0.24]} />
                <meshStandardMaterial color="#7a5030" />
              </mesh>
            ))}
          </group>
        ))}
        <mesh position={[-0.5, 0.86, 0]}>
          <cylinderGeometry args={[0.1, 0.09, 0.18, 12]} />
          <meshStandardMaterial color="#d0a860" roughness={0.9} />
        </mesh>
        <mesh position={[0.05, 0.81, 0.05]}>
          <cylinderGeometry args={[0.14, 0.09, 0.08, 14]} />
          <meshStandardMaterial color="#f2f0ea" />
        </mesh>
        <mesh position={[0.05, 0.855, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.12, 14]} />
          <meshStandardMaterial color="#c8742a" />
        </mesh>
        <mesh position={[0.55, 0.79, -0.1]}>
          <cylinderGeometry args={[0.16, 0.14, 0.03, 14]} />
          <meshStandardMaterial color="#f2f0ea" />
        </mesh>
        {[0.5, 0.6, 0.55].map((x, i) => (
          <mesh key={'v' + i} position={[x, 0.83, -0.12 + i * 0.05]}>
            <icosahedronGeometry args={[0.05, 0]} />
            <meshStandardMaterial color="#5f9e47" />
          </mesh>
        ))}
      </group>
    </group>
  )
}
