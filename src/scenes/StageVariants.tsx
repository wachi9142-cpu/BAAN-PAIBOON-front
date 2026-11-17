import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react'
import { House, VillagerHouse } from './models/House'
import { Pet } from './models/Pet'
import { getHouse } from '../game/content/houses'

/* ฉากตกแต่ง 4 แบบสำหรับ StageDecor — ชิ้นส่วนเฉพาะของแต่ละฉาก */

const FLOWERS = ['#f2a7b8', '#f6d36b', '#ffffff', '#e8746a', '#c59ae0']

/** false = ไม่วาดบ้านในฉาก (หน้าเลือกบ้าน ไม่ให้บ้านฉากหลังบังบ้านที่เลือก) */
export const DecorHouses = createContext(true)
export function MaybeHouse({ children }: { children: ReactNode }) {
  return useContext(DecorHouses) ? <>{children}</> : null
}

/** รั้วไม้แบบราว 2 เส้น เป็นแนวตรงจาก a ไป b */
export function RailFence({ from, to, color = '#7a5432' }: { from: [number, number]; to: [number, number]; color?: string }) {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  const len = Math.hypot(dx, dz)
  const n = Math.max(2, Math.round(len / 1.3) + 1)
  const rot = -Math.atan2(dz, dx)
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1)
        return (
          <mesh key={i} position={[from[0] + dx * t, 0.5, from[1] + dz * t]} castShadow>
            <boxGeometry args={[0.14, 1, 0.14]} />
            <meshStandardMaterial color={color} flatShading />
          </mesh>
        )
      })}
      {[0.45, 0.8].map((y) => (
        <mesh key={y} position={[from[0] + dx / 2, y, from[1] + dz / 2]} rotation={[0, rot, 0]} castShadow>
          <boxGeometry args={[len, 0.09, 0.06]} />
          <meshStandardMaterial color={color} flatShading />
        </mesh>
      ))}
    </group>
  )
}

/** ต้นมะม่วงใหญ่ ห้อยลูก */
export function MangoTree({ pos, fruit = ['#e8b63a'], scale = 1 }: { pos: [number, number]; fruit?: string[]; scale?: number }) {
  const fruits = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = i * 2.4
        const r = 1.4 + (i % 3) * 0.35
        return [Math.cos(a) * r, 2.6 + (i % 4) * 0.25, Math.sin(a) * r] as [number, number, number]
      }),
    [],
  )
  return (
    <group position={[pos[0], 0, pos[1]]} scale={scale}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.45, 2.8, 7]} />
        <meshStandardMaterial color="#6b5440" flatShading />
      </mesh>
      {[
        [0, 3.9, 0, 2.1],
        [1.3, 3.5, 0.4, 1.4],
        [-1.2, 3.6, -0.3, 1.5],
        [0.2, 3.4, 1.3, 1.3],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color={i % 2 ? '#4a7d3a' : '#3f6e33'} flatShading />
        </mesh>
      ))}
      {fruits.map((p, i) => (
        <mesh key={i} position={p} scale={[1, 1.4, 1]}>
          <sphereGeometry args={[0.13, 6, 5]} />
          <meshStandardMaterial color={fruit[i % fruit.length]} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function ClayPot({ pos, s = 1 }: { pos: [number, number]; s?: number }) {
  return (
    <group position={[pos[0], 0, pos[1]]} scale={s}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.42, 10, 8]} />
        <meshStandardMaterial color="#8a5a36" flatShading />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.24, 0.28, 0.14, 10]} />
        <meshStandardMaterial color="#7a4a2a" flatShading />
      </mesh>
    </group>
  )
}

function FlowerPot({ pos, color }: { pos: [number, number]; color: string }) {
  return (
    <group position={[pos[0], 0, pos[1]]}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.32, 8]} />
        <meshStandardMaterial color="#b5603a" />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <icosahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#5f8f3e" flatShading />
      </mesh>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[Math.cos(k * 2.1) * 0.13, 0.58, Math.sin(k * 2.1) * 0.13]}>
          <sphereGeometry args={[0.07, 6, 4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

/** ดอกไม้ป่ากระจายเป็นวง (เว้นตรงกลางให้ตัวละคร) */
function Wildflowers({ count, inner, outer, seed }: { count: number; inner: number; outer: number; seed: number }) {
  const spots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = i * 2.399 + seed
        const r = inner + ((Math.sin(i * 9.1 + seed) + 1) / 2) * (outer - inner)
        return [Math.cos(a) * r, Math.sin(a) * r] as [number, number]
      }),
    [count, inner, outer, seed],
  )
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.12, 0]}>
            <coneGeometry args={[0.12, 0.24, 4]} />
            <meshStandardMaterial color="#6f9a45" flatShading />
          </mesh>
          <mesh position={[0, 0.27, 0]}>
            <sphereGeometry args={[0.07, 6, 4]} />
            <meshStandardMaterial color={FLOWERS[i % FLOWERS.length]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ---------- ฉาก 1: ลานดินหน้าบ้าน ต้นมะม่วง โอ่งดินเผา ---------- */
export function MangoYardExtras() {
  return (
    <group>
      <MangoTree pos={[4.8, -2.6]} fruit={['#e8b63a', '#d9a02e']} />
      <ClayPot pos={[3.2, 0.6]} />
      <ClayPot pos={[3.9, 1.5]} s={0.8} />
      <MaybeHouse>
        <group position={[-6, 0, -9]} rotation={[0, 0.5, 0]}>
        <VillagerHouse color="#7d5a3c" />
      </group>
      </MaybeHouse>
    </group>
  )
}

/* ---------- ฉาก 2: ผักสวนครัว ควายในคอก ศาลพระภูมิ ---------- */
export function GardenYardExtras() {
  const still = useRef(0)
  return (
    <group>
      <group position={[-4.6, 0, -1.6]}>
        {[0, 1, 2].map((row) => (
          <group key={row} position={[0, 0, row * 1.1 - 1.1]}>
            <mesh position={[0, 0.08, 0]} receiveShadow>
              <boxGeometry args={[2.8, 0.16, 0.8]} />
              <meshStandardMaterial color="#6b4a30" flatShading />
            </mesh>
            {[-1, -0.33, 0.33, 1].map((x, k) => (
              <mesh key={k} position={[x, 0.3, 0]} castShadow>
                <icosahedronGeometry args={[0.26, 0]} />
                <meshStandardMaterial
                  color={(row + k) % 3 === 0 ? '#9cc46a' : (row + k) % 3 === 1 ? '#6f9a45' : '#7b5aa0'}
                  flatShading
                />
              </mesh>
            ))}
          </group>
        ))}
        {/* ป้ายไม้ "ผักสวนครัว" */}
        <mesh position={[1.7, 0.45, 1.2]}>
          <boxGeometry args={[0.06, 0.9, 0.06]} />
          <meshStandardMaterial color="#7a5432" />
        </mesh>
        <mesh position={[1.7, 0.85, 1.22]} rotation={[0, -0.4, 0]}>
          <boxGeometry args={[0.8, 0.35, 0.05]} />
          <meshStandardMaterial color="#b08a5a" flatShading />
        </mesh>
        <RailFence from={[-1.7, -2]} to={[-1.7, 1.7]} />
      </group>
      {/* คอกควาย */}
      <group position={[4.8, 0, -1.6]}>
        <RailFence from={[-1.8, -1.8]} to={[1.8, -1.8]} />
        <RailFence from={[-1.8, 1.8]} to={[1.8, 1.8]} />
        <RailFence from={[-1.8, -1.8]} to={[-1.8, 1.8]} />
        <RailFence from={[1.8, -1.8]} to={[1.8, 1.8]} />
        <group rotation={[0, -1.9, 0]}>
          <Pet pet={{ species: 'buffalo', name: '', color: '#3a3a40', pattern: 'plain', patternColor: '#55555c' }} motion={still} />
        </group>
      </group>
      {/* ศาลพระภูมิ */}
      <group position={[-1.8, 0, -6]}>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.09, 0.12, 1.4, 6]} />
          <meshStandardMaterial color="#c9b79a" />
        </mesh>
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[0.7, 0.45, 0.6]} />
          <meshStandardMaterial color="#d8c08a" flatShading />
        </mesh>
        <mesh position={[0, 1.9, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.6, 0.45, 4]} />
          <meshStandardMaterial color="#a8402e" flatShading />
        </mesh>
      </group>
      <MaybeHouse>
        <group position={[-5, 0, -10]} rotation={[0, 0.4, 0]}>
        <VillagerHouse color="#8f6a46" />
      </group>
      </MaybeHouse>
    </group>
  )
}

/* ---------- ฉาก 3: ทุ่งหญ้าโล่ง ยอดเจดีย์ไกล ๆ ---------- */
export function MeadowYardExtras() {
  return (
    <group>
      <RailFence from={[-9, -3]} to={[-1.5, -4.2]} />
      <RailFence from={[1.5, -4.2]} to={[9, -3]} />
      <Wildflowers count={70} inner={2.2} outer={12} seed={2} />
      {[
        [-5, -7, 1.3],
        [7, -8, 1.1],
        [9, 5, 1.2],
        [-9, 6, 1],
      ].map(([x, z, s], i) => (
        <group key={i} position={[x, 0, z]} scale={s}>
          <mesh position={[0, 1.3, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.32, 2.6, 6]} />
            <meshStandardMaterial color="#6b5440" flatShading />
          </mesh>
          {[
            [0, 3.4, 0, 1.6],
            [1, 3, 0.3, 1.1],
            [-0.9, 3.1, -0.2, 1.2],
            [0, 4.3, 0.2, 1.1],
          ].map(([a, b, c, r], k) => (
            <mesh key={k} position={[a, b, c]} castShadow>
              <icosahedronGeometry args={[r, 0]} />
              <meshStandardMaterial color={k % 2 ? '#7aa04e' : '#6b9446'} flatShading />
            </mesh>
          ))}
        </group>
      ))}
      {/* ยอดเจดีย์วัดไกล ๆ */}
      <group position={[9, 0, -80]} scale={0.9}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[2.2, 2.6, 3, 8]} />
          <meshStandardMaterial color="#c79a52" flatShading />
        </mesh>
        <mesh position={[0, 6, 0]}>
          <coneGeometry args={[1.8, 7, 8]} />
          <meshStandardMaterial color="#d8a94e" flatShading metalness={0.3} roughness={0.5} />
        </mesh>
      </group>
      <MaybeHouse>
        <group position={[-10, 0, -12]} rotation={[0, 0.6, 0]}>
        <VillagerHouse color="#7d5a3c" />
      </group>
      </MaybeHouse>
    </group>
  )
}

/* ---------- ฉาก 4: บ้านไม้ กระถางดอกไม้ มะม่วงลูกแดง-เขียว ---------- */
export function TwoStoreyYardExtras() {
  return (
    <group>
      <MaybeHouse>
        <group position={[-4.5, 0, -8]} rotation={[0, 0.35, 0]}>
        <House design={getHouse('stilt-wood')} />
      </group>
      </MaybeHouse>
      {[
        [-1.8, -3.2, '#f2a7b8'],
        [-2.6, -2.6, '#e8746a'],
        [-3.3, -1.8, '#c59ae0'],
        [-1, -3.7, '#f6d36b'],
      ].map(([x, z, c], i) => (
        <FlowerPot key={i} pos={[x as number, z as number]} color={c as string} />
      ))}
      <MangoTree pos={[5.2, -3]} fruit={['#d9473a', '#8fb84a', '#e0703a']} scale={1.1} />
      <RailFence from={[2, -6.5]} to={[11, -5]} />
      <Wildflowers count={36} inner={3.4} outer={8} seed={7} />
    </group>
  )
}
