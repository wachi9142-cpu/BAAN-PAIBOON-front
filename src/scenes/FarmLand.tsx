import { useRef } from 'react'
import { RBox } from './models/RBox'
import { GableRoof, PicketFence } from './models/House'
import { Pet } from './models/Pet'
import type { PetChoice } from '../game/content/pets'

/** พื้นที่ส่วนบุคคลในซอย 2: กว้างมาก มีรั้วล้อม · คอกควาย · ยุ้งข้าว · กองฟาง · พื้นหญ้า (ไม่มีบ้านคน) */
export function FarmLand({ w, d }: { w: number; d: number }) {
  const h = w / 2
  const dd = d / 2
  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#9fb468" />
      </mesh>
      {/* รั้วไม้ล้อมรอบ (ประตูด้านซอย) */}
      <PicketFence x={0} z={-dd} len={w} />
      <PicketFence x={0} z={dd} len={w} />
      <PicketFence x={h} z={0} len={d} rot={Math.PI / 2} />
      <PicketFence x={-h} z={(-dd - 1.8) / 2} len={dd - 1.8} rot={Math.PI / 2} />
      <PicketFence x={-h} z={(dd + 1.8) / 2} len={dd - 1.8} rot={Math.PI / 2} />
      {/* คอกควาย 2 คอก */}
      {/* คอกนี้: ควาย 3 ตัวของคนเลี้ยงควาย (VillageLife) ออกทุ่งตอนเช้า กลับตอนเย็น */}
      <Pen x={-4} z={-3.5} n={0} />
      <Pen x={4.5} z={-3.5} n={2} />
      {/* ยุ้งข้าว 2 หลัง */}
      <Barn x={-7} z={5} />
      <Barn x={1} z={5.5} />
      {/* หญ้ารก ๆ ปลูกให้ควายกิน (หญ้าเนเปียร์สูง) + ต้นไม้ขึ้นแซม */}
      <ForageGrass w={w} d={d} />
      {/* กองฟาง */}
      {[
        [7, 4],
        [9, 6],
        [8.5, 1],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.6, z]} scale={[1.2, 0.8, 1.2]} castShadow>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshStandardMaterial color="#e2c56a" roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function Pen({ x, z, n }: { x: number; z: number; n: number }) {
  const herd: PetChoice[] = Array.from({ length: n }).map(() => ({ species: 'buffalo', name: 'ควาย', color: '#4a4a52', pattern: 'plain', patternColor: '#6a6a72' }) as PetChoice)
  return (
    <group position={[x, 0, z]}>
      {[
        [0, -2.5, 6.5, 0],
        [0, 2.5, 6.5, 0],
        [-3.25, 0, 5, Math.PI / 2],
        [3.25, 0, 5, Math.PI / 2],
      ].map(([px, pz, len, r], i) => (
        <group key={i} position={[px, 0, pz]} rotation={[0, r, 0]}>
          {[0.5, 1].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <RBox args={[len, 0.1, 0.1]} radius={0.04} />
              <meshStandardMaterial color="#8a6040" />
            </mesh>
          ))}
          {[-len / 2, 0, len / 2].map((p) => (
            <mesh key={p} position={[p, 0.6, 0]}>
              <cylinderGeometry args={[0.07, 0.08, 1.2, 8]} />
              <meshStandardMaterial color="#5a3b26" />
            </mesh>
          ))}
        </group>
      ))}
      {herd.map((pet, i) => (
        <Buffalo key={i} pet={pet} pos={[-1.8 + i * 1.8, 0, (i % 2) * 0.8 - 0.4]} rot={i * 1.3} />
      ))}
    </group>
  )
}

function Buffalo({ pet, pos, rot }: { pet: PetChoice; pos: [number, number, number]; rot: number }) {
  const motion = useRef(0)
  const pose = useRef(0)
  return (
    <group position={pos} rotation={[0, rot, 0]} scale={0.8}>
      <Pet pet={pet} motion={motion} pose={pose} />
    </group>
  )
}

export function Barn({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 1.3, 0.5, sz * 1.1]} castShadow>
            <cylinderGeometry args={[0.12, 0.14, 1, 8]} />
            <meshStandardMaterial color="#5a3b26" />
          </mesh>
        )),
      )}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <RBox args={[3.2, 1.8, 2.8]} radius={0.12} />
        <meshStandardMaterial color="#8a5a34" />
      </mesh>
      <GableRoof width={3.2} depth={2.8} height={1.5} y={2.7} color="#6a4a2e" overhang={0.5} />
    </group>
  )
}

/** หญ้าสูงขึ้นเป็นกอ ๆ รกเต็มพื้นที่ (เว้นคอกควาย ยุ้งข้าว กองฟาง) + ต้นไม้ขึ้นแซมริมรั้ว */
function ForageGrass({ w, d }: { w: number; d: number }) {
  const h = w / 2 - 0.8
  const dd = d / 2 - 0.8
  const busy = (x: number, z: number) =>
    (Math.abs(x + 4) < 4 && Math.abs(z + 3.5) < 3.2) || (Math.abs(x - 4.5) < 4 && Math.abs(z + 3.5) < 3.2) || (Math.abs(x + 7) < 2.2 && Math.abs(z - 5) < 2.2) || (Math.abs(x - 1) < 2.2 && Math.abs(z - 5.5) < 2.2) || (x > 5.5 && x < 10.5 && z > -0.5 && z < 7.5) || (x < -h + 2 && Math.abs(z) < 2.5)
  const clumps: [number, number, number, number][] = []
  let seed = 7
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  for (let i = 0; i < 140; i++) {
    const x = -h + rnd() * h * 2
    const z = -dd + rnd() * dd * 2
    if (busy(x, z)) continue
    clumps.push([x, z, 0.7 + rnd() * 0.9, rnd() * Math.PI])
  }
  const trees: [number, number, number][] = [
    [-h + 0.6, dd - 0.6, 2.6],
    [-2, dd - 0.4, 2.2],
    [h - 0.6, dd - 0.8, 2.8],
    [h - 0.5, -dd + 0.8, 2.3],
    [-h + 0.8, -dd + 0.8, 2.0],
  ]
  return (
    <group>
      {clumps.map(([x, z, ht, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[Math.cos(k * 2.1) * 0.15, ht / 2, Math.sin(k * 2.1) * 0.15]} rotation={[Math.cos(k * 2.1) * 0.25, 0, Math.sin(k * 2.1) * 0.25]}>
              <coneGeometry args={[0.16, ht, 4]} />
              <meshStandardMaterial color={k === 1 ? '#6f9a3a' : '#5d8a32'} flatShading />
            </mesh>
          ))}
        </group>
      ))}
      {trees.map(([x, z, ht], i) => (
        <group key={'t' + i} position={[x, 0, z]}>
          <mesh position={[0, ht / 2, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, ht, 6]} />
            <meshStandardMaterial color="#6b5440" />
          </mesh>
          <mesh position={[0, ht + 0.5, 0]} castShadow>
            <icosahedronGeometry args={[1.3, 0]} />
            <meshStandardMaterial color="#4f7f38" flatShading />
          </mesh>
        </group>
      ))}
    </group>
  )
}
