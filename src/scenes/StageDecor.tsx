import { useEffect, useMemo, useState } from 'react'
import { BackSide } from 'three'
import { Tree } from './Village'
import { VillagerHouse } from './models/House'
import type { TreeSpot } from '../game/content/village'
import { DecorHouses, GardenYardExtras, MangoYardExtras, MaybeHouse, MeadowYardExtras, TwoStoreyYardExtras } from './StageVariants'

function MangoYard() {
  return (
    <>
      <Fence />
      <Plants />
      <Props />
      <MangoYardExtras />
      <MaybeHouse>
        <BackHouses />
      </MaybeHouse>
    </>
  )
}
function GardenYard() {
  return (
    <>
      <Plants />
      <GardenYardExtras />
    </>
  )
}
function MeadowYard() {
  return <MeadowYardExtras />
}
function TwoStoreyYard() {
  return (
    <>
      <Plants />
      <TwoStoreyYardExtras />
    </>
  )
}

/**
 * ฉากตกแต่งรอบตัวอย่าง (หน้าสร้างตัวละคร/เลือกสัตว์/เลือกบ้าน)
 * "ลานหน้าบ้านในหมู่บ้าน": ท้องฟ้า เมฆ ต้นไม้ รั้วไม้ไผ่ ดอกไม้ กระถาง โอ่งน้ำ บ้านใต้ถุนสูง ทุ่งนาไกล ๆ
 * หมุนกล้องรอบได้ 360° จึงวางของรอบทุกทิศ · scale ขยายทั้งฉาก (ฉากบ้านใช้ ~2.6)
 */
export type DecorVariant = 'mango' | 'garden' | 'meadow' | 'twostorey'
export const DECOR_VARIANTS: DecorVariant[] = ['mango', 'garden', 'meadow', 'twostorey']

const LAST_KEY = 'baan-paiboon-last-stage'
/** สุ่มฉาก 1 ใน 4 ทุกครั้งที่เข้าหน้า — ไม่ซ้ำกับรอบก่อนหน้า */
export function useRandomVariant(): DecorVariant {
  const [v] = useState<DecorVariant>(() => {
    let last: string | null = null
    try {
      last = localStorage.getItem(LAST_KEY)
    } catch {
      /* ignore */
    }
    const choices = DECOR_VARIANTS.filter((x) => x !== last)
    return choices[Math.floor(Math.random() * choices.length)]
  })
  // จำฉากที่แสดงจริง (เขียนใน effect เพราะ StrictMode เรียก initializer 2 รอบ)
  useEffect(() => {
    try {
      localStorage.setItem(LAST_KEY, v)
    } catch {
      /* ignore */
    }
  }, [v])
  return v
}

/*
 * 4 ฉาก (อิงภาพตัวอย่างของผู้สร้าง):
 *  mango     — ลานดินหน้าบ้านไม้ ต้นมะม่วงออกลูก โอ่งดินเผา
 *  garden    — แปลงผักสวนครัว ควายในคอก ศาลพระภูมิ
 *  meadow    — ทุ่งหญ้าโล่ง รั้วไม้ ดอกไม้ป่า ยอดเจดีย์ไกล ๆ
 *  twostorey — บ้านไม้สองชั้นมีกระถางดอกไม้ ต้นมะม่วงลูกแดง-เขียว
 */
export function StageDecor({ scale = 1, variant, houses = true }: { scale?: number; variant: DecorVariant; houses?: boolean }) {
  return (
    <DecorHouses.Provider value={houses}>
    <group>
      <Sky />
      <group scale={scale}>
        <YardGround variant={variant} />
        {variant === 'mango' && <MangoYard />}
        {variant === 'garden' && <GardenYard />}
        {variant === 'meadow' && <MeadowYard />}
        {variant === 'twostorey' && <TwoStoreyYard />}
      </group>
      <FarFields />
      <Clouds />
    </group>
    </DecorHouses.Provider>
  )
}

/** โดมท้องฟ้าไล่สี ฟ้าอ่อนด้านบน → ขาวอมเหลืองที่ขอบฟ้า */
function Sky() {
  const material = useMemo(() => {
    return {
      uniforms: {},
      vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vPos; void main(){
        float h = clamp(normalize(vPos).y, 0.0, 1.0);
        vec3 top = vec3(0.53, 0.75, 0.92);
        vec3 horizon = vec3(0.99, 0.95, 0.84);
        gl_FragColor = vec4(mix(horizon, top, pow(h, 0.55)), 1.0);
      }`,
    }
  }, [])
  return (
    <mesh>
      <sphereGeometry args={[400, 32, 16]} />
      <shaderMaterial args={[material]} side={BackSide} depthWrite={false} />
    </mesh>
  )
}

/** ลานดิน + หญ้า: วงในเป็นลานดินกวาดเรียบ วงนอกเป็นหญ้า */
function YardGround({ variant }: { variant: DecorVariant }) {
  const yard = variant === 'meadow' ? '#93b25e' : variant === 'twostorey' ? '#a9bb6e' : '#d8bf8e'
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[60, 48]} />
        <meshStandardMaterial color="#9db26c" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[3.2, 40]} />
        <meshStandardMaterial color={yard} />
      </mesh>
      {/* ทางเดินดินออกไปด้านหลัง */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -7]} receiveShadow>
        <planeGeometry args={[1.6, 9]} />
        <meshStandardMaterial color="#cfb383" />
      </mesh>
      {/* กอหญ้าเล็ก ๆ */}
      {GRASS.map(([x, z, s], i) => (
        <mesh key={i} position={[x, 0.12 * s, z]} rotation={[0, i, 0]}>
          <coneGeometry args={[0.18 * s, 0.32 * s, 4]} />
          <meshStandardMaterial color={i % 2 ? '#6f9a45' : '#82a852'} flatShading />
        </mesh>
      ))}
    </group>
  )
}

const ring = (n: number, r: number, jitter: number, seed: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + Math.sin(i * 12.9 + seed) * jitter
    const rr = r + Math.sin(i * 7.3 + seed) * jitter * 2
    return [Math.cos(a) * rr, Math.sin(a) * rr, 0.8 + ((i * 37 + seed) % 5) * 0.12] as [number, number, number]
  })

const GRASS = ring(40, 4.6, 0.6, 1)

/** รั้วไม้ไผ่ผูกหลัก ล้อมด้านหลังเป็นครึ่งวง */
function Fence() {
  const posts = 22
  const r = 6.5
  const from = Math.PI * 0.95
  const to = Math.PI * 2.05
  return (
    <group>
      {Array.from({ length: posts }, (_, i) => {
        const a = from + ((to - from) * i) / (posts - 1)
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0.45, Math.sin(a) * r]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 0.9, 6]} />
            <meshStandardMaterial color="#8a6a3e" flatShading />
          </mesh>
        )
      })}
      {[0.35, 0.7].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[r, 0.025, 4, 64, to - from]} />
          <meshStandardMaterial color="#c9b06a" />
        </mesh>
      )).map((m, i) => (
        <group key={i} rotation={[Math.PI / 2, 0, -from]}>
          {m}
        </group>
      ))}
    </group>
  )
}

const TREES: TreeSpot[] = [
  { kind: 'mango', pos: [-5.5, -5], scale: 0.9 },
  { kind: 'coconut', pos: [6, -6], scale: 0.85 },
  { kind: 'banana', pos: [-7.2, -1.5], scale: 0.9 },
  { kind: 'banana', pos: [7.6, -2.2], scale: 0.8 },
  { kind: 'coconut', pos: [-9, 6], scale: 0.9 },
  { kind: 'mango', pos: [9.5, 5.5], scale: 1 },
  { kind: 'coconut', pos: [3, -11], scale: 1.1 },
  { kind: 'mango', pos: [-12, -9], scale: 1.2 },
  { kind: 'banana', pos: [12, -8], scale: 1 },
  { kind: 'coconut', pos: [-14, 2], scale: 1 },
  { kind: 'mango', pos: [14, 0], scale: 1.1 },
  { kind: 'coconut', pos: [0, 15], scale: 1 },
  { kind: 'mango', pos: [-6, 14], scale: 1 },
  { kind: 'banana', pos: [7, 13], scale: 1 },
]

const FLOWERS = ['#f2a7b8', '#f6d36b', '#ffffff', '#e8746a', '#c59ae0']

function Plants() {
  const blooms = useMemo(() => ring(26, 5.4, 0.5, 4), [])
  return (
    <group>
      {TREES.map((t, i) => (
        <Tree key={i} tree={t} />
      ))}
      {/* พุ่มดอกไม้ริมรั้ว */}
      {blooms.map(([x, z, s], i) =>
        z < 1.5 ? (
          <group key={i} position={[x, 0, z]} scale={s}>
            <mesh position={[0, 0.22, 0]} castShadow>
              <icosahedronGeometry args={[0.3, 0]} />
              <meshStandardMaterial color="#5f8f3e" flatShading />
            </mesh>
            {[0, 1, 2].map((k) => (
              <mesh key={k} position={[Math.cos(k * 2.1) * 0.2, 0.42, Math.sin(k * 2.1) * 0.2]}>
                <sphereGeometry args={[0.07, 6, 4]} />
                <meshStandardMaterial color={FLOWERS[(i + k) % FLOWERS.length]} />
              </mesh>
            ))}
          </group>
        ) : null,
      )}
    </group>
  )
}

/** ของในลาน: โอ่งน้ำ กระถางดอกไม้ ม้านั่งไม้ไผ่ (แคร่) */
function Props() {
  return (
    <group>
      {/* โอ่งมังกร */}
      <group position={[-3.4, 0, -3.2]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <sphereGeometry args={[0.45, 12, 10]} />
          <meshStandardMaterial color="#7a4a2a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.28, 0.32, 0.12, 12]} />
          <meshStandardMaterial color="#6a3e22" />
        </mesh>
      </group>
      {/* กระถางดอกไม้ */}
      {[
        [3.3, -3.4, '#f2a7b8'],
        [3.9, -2.6, '#f6d36b'],
        [-4.1, -2.2, '#e8746a'],
      ].map(([x, z, c], i) => (
        <group key={i} position={[x as number, 0, z as number]}>
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.15, 0.32, 8]} />
            <meshStandardMaterial color="#b5603a" />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <icosahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial color="#5f8f3e" flatShading />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <sphereGeometry args={[0.09, 6, 4]} />
            <meshStandardMaterial color={c as string} />
          </mesh>
        </group>
      ))}
      {/* แคร่ไม้ไผ่ */}
      <group position={[4.4, 0, 1.2]} rotation={[0, -1.1, 0]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.08, 0.9]} />
          <meshStandardMaterial color="#c9a866" flatShading />
        </mesh>
        {[
          [-0.8, -0.38],
          [0.8, -0.38],
          [-0.8, 0.38],
          [0.8, 0.38],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.21, z]}>
            <cylinderGeometry args={[0.04, 0.04, 0.42, 5]} />
            <meshStandardMaterial color="#8a6a3e" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** บ้านใต้ถุนสูงหลังรั้ว */
function BackHouses() {
  return (
    <group>
      <group position={[-4, 0, -14]} rotation={[0, 0.25, 0]} scale={0.9}>
        <VillagerHouse color="#9a6b45" />
      </group>
      <group position={[10, 0, -16]} rotation={[0, -0.4, 0]} scale={0.8}>
        <VillagerHouse color="#c9b79a" />
      </group>
    </group>
  )
}

/** ทุ่งนาไกล ๆ เป็นแถบสีเขียวสลับเหลือง */
function FarFields() {
  return (
    <group>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, -a]} position={[Math.cos(a) * 75, 0.01, Math.sin(a) * 75]}>
            <planeGeometry args={[30, 18]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#c9c36a' : i % 2 ? '#86ac4e' : '#a3bd5c'} />
          </mesh>
        )
      })}
      {/* ทิวไม้ไกล ๆ */}
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i / 36) * Math.PI * 2 + Math.sin(i) * 0.05
        const d = 110 + ((i * 13) % 20)
        const s = 6 + ((i * 7) % 5)
        return (
          <mesh key={`t${i}`} position={[Math.cos(a) * d, s * 0.8, Math.sin(a) * d]}>
            <icosahedronGeometry args={[s, 0]} />
            <meshStandardMaterial color={i % 2 ? '#4f7a3e' : '#5d8a48'} flatShading />
          </mesh>
        )
      })}
    </group>
  )
}

function Clouds() {
  const clouds = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + 0.3
        return { x: Math.cos(a) * 150, z: Math.sin(a) * 150, y: 55 + ((i * 17) % 30), s: 1 + ((i * 3) % 4) * 0.25 }
      }),
    [],
  )
  return (
    <group>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s * 8}>
          {[
            [0, 0, 0, 1],
            [1.1, -0.2, 0.2, 0.75],
            [-1.1, -0.25, -0.1, 0.7],
            [0.4, 0.45, 0, 0.7],
          ].map(([x, y, z, r], k) => (
            <mesh key={k} position={[x, y, z]}>
              <icosahedronGeometry args={[r, 1]} />
              <meshStandardMaterial color="#ffffff" flatShading emissive="#ffffff" emissiveIntensity={0.25} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
