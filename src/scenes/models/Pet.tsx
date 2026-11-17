import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Group, type Texture } from 'three'
import type { PetChoice, PetPattern } from '../../game/content/pets'

/**
 * สัตว์เลี้ยงแบบ low-poly — หันหน้าไปทาง +z, ยืนบนพื้น y=0
 * ลาย (จุด/ทาง/ด่าง) วาดเป็น texture แล้วใช้กับ "ขน/ตัว" ของสัตว์
 */

interface Props {
  pet: PetChoice
  /** 0 = ยืน, 1 = เดิน (ใช้ ref เพื่อไม่ต้อง re-render ทุกเฟรม) */
  motion?: React.RefObject<number>
}

// ---------- ลาย ----------

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

function drawPattern(base: string, pattern: PetPattern, accent: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = base
  g.fillRect(0, 0, 128, 128)
  g.fillStyle = accent
  const rand = seeded(7)
  if (pattern === 'spots') {
    for (let i = 0; i < 22; i++) {
      g.beginPath()
      g.arc(rand() * 128, rand() * 128, 4 + rand() * 7, 0, Math.PI * 2)
      g.fill()
    }
  } else if (pattern === 'stripes') {
    for (let y = 0; y < 128; y += 18) {
      g.beginPath()
      g.moveTo(0, y)
      for (let x = 0; x <= 128; x += 16) g.lineTo(x, y + Math.sin(x / 14) * 3)
      g.lineTo(128, y + 7)
      for (let x = 128; x >= 0; x -= 16) g.lineTo(x, y + 7 + Math.sin(x / 14) * 3)
      g.closePath()
      g.fill()
    }
  } else if (pattern === 'patches') {
    for (let i = 0; i < 5; i++) {
      const cx = rand() * 128
      const cy = rand() * 128
      g.beginPath()
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 6) {
        const r = 14 + rand() * 14
        g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
      }
      g.fill()
    }
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = t.wrapT = RepeatWrapping
  return t
}

function useFur(pet: PetChoice): Texture | null {
  const tex = useMemo(
    () => (pet.pattern === 'plain' ? null : drawPattern(pet.color, pet.pattern, pet.patternColor)),
    [pet.color, pet.pattern, pet.patternColor],
  )
  useEffect(() => () => tex?.dispose(), [tex])
  return tex
}

/** วัสดุขน: ใช้ texture ลาย ถ้ามี ไม่งั้นใช้สีล้วน */
function Fur({ pet, tex }: { pet: PetChoice; tex: Texture | null }) {
  return tex ? <meshStandardMaterial map={tex} flatShading /> : <meshStandardMaterial color={pet.color} flatShading />
}

const Mat = ({ c }: { c: string }) => <meshStandardMaterial color={c} flatShading />

function Eyes({ y, z, gap, r = 0.02 }: { y: number; z: number; gap: number; r?: number }) {
  return (
    <>
      {[-gap, gap].map((x) => (
        <mesh key={x} position={[x, y, z]}>
          <sphereGeometry args={[r, 6, 6]} />
          <meshStandardMaterial color="#141210" />
        </mesh>
      ))}
    </>
  )
}

// ---------- ขา (แกว่งเมื่อเดิน) ----------

function useLegSwing(motion: React.RefObject<number> | undefined, speed = 10, amount = 0.6) {
  const refs = [useRef<Group>(null), useRef<Group>(null), useRef<Group>(null), useRef<Group>(null)]
  const phase = useRef(0)
  useFrame((_, dt) => {
    const moving = (motion?.current ?? 0) > 0
    if (moving) phase.current += dt * speed
    const s = moving ? Math.sin(phase.current) * amount : 0
    refs.forEach((r, i) => {
      if (!r.current) return
      const target = i % 3 === 0 ? s : -s // ขาทแยงขยับพร้อมกัน
      r.current.rotation.x += (target - r.current.rotation.x) * Math.min(1, dt * 12)
    })
  })
  return refs
}

function Legs4({
  motion,
  x,
  zf,
  zb,
  top,
  len,
  w,
  children,
}: {
  motion?: React.RefObject<number>
  x: number
  zf: number
  zb: number
  top: number
  len: number
  w: number
  children: ReactNode
}) {
  const refs = useLegSwing(motion)
  const pos: [number, number][] = [
    [-x, zf],
    [x, zf],
    [-x, zb],
    [x, zb],
  ]
  return (
    <>
      {pos.map(([px, pz], i) => (
        <group key={i} ref={refs[i]} position={[px, top, pz]}>
          <mesh position={[0, -len / 2, 0]} castShadow>
            <boxGeometry args={[w, len, w]} />
            {children}
          </mesh>
        </group>
      ))}
    </>
  )
}

// ---------- ชนิดสัตว์ ----------

function Dog({ pet, tex, motion }: Props & { tex: Texture | null }) {
  return (
    <group>
      <mesh position={[0, 0.36, 0]} castShadow>
        <boxGeometry args={[0.26, 0.24, 0.48]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.54, 0.26]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.2, 0.2]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        <mesh position={[0, -0.04, 0.13]}>
          <boxGeometry args={[0.12, 0.09, 0.1]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        <mesh position={[0, -0.01, 0.185]}>
          <boxGeometry args={[0.05, 0.04, 0.02]} />
          <Mat c="#1a1412" />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.1, 0.06, -0.02]} rotation={[0, 0, s * 0.5]}>
            <boxGeometry args={[0.05, 0.12, 0.08]} />
            <Mat c={pet.patternColor} />
          </mesh>
        ))}
        <Eyes y={0.04} z={0.1} gap={0.05} />
      </group>
      <mesh position={[0, 0.48, -0.27]} rotation={[0.8, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.22, 6]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <Legs4 motion={motion} x={0.09} zf={0.16} zb={-0.16} top={0.26} len={0.26} w={0.07}>
        <Fur pet={pet} tex={tex} />
      </Legs4>
    </group>
  )
}

function Cat({ pet, tex, motion }: Props & { tex: Texture | null }) {
  return (
    <group>
      <mesh position={[0, 0.27, 0]} castShadow>
        <boxGeometry args={[0.2, 0.18, 0.4]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.42, 0.22]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.16, 0.15]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.06, 0.11, 0]} rotation={[0, 0, s * -0.2]}>
            <coneGeometry args={[0.04, 0.08, 4]} />
            <Fur pet={pet} tex={tex} />
          </mesh>
        ))}
        <mesh position={[0, -0.02, 0.08]}>
          <boxGeometry args={[0.03, 0.025, 0.02]} />
          <Mat c="#e48f86" />
        </mesh>
        <Eyes y={0.03} z={0.076} gap={0.045} r={0.018} />
      </group>
      <mesh position={[0, 0.42, -0.3]} rotation={[0.35, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.36, 6]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <Legs4 motion={motion} x={0.07} zf={0.14} zb={-0.14} top={0.19} len={0.19} w={0.05}>
        <Fur pet={pet} tex={tex} />
      </Legs4>
    </group>
  )
}

function Buffalo({ pet, tex, motion }: Props & { tex: Texture | null }) {
  return (
    <group>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.7, 0.62, 1.3]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.95, 0.75]}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.4, 0.42]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        <mesh position={[0, -0.1, 0.22]}>
          <boxGeometry args={[0.3, 0.2, 0.12]} />
          <Mat c="#2b2a2c" />
        </mesh>
        {/* เขาโค้ง */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.3, 0.2, -0.05]} rotation={[Math.PI / 2, 0, s > 0 ? -0.3 : Math.PI + 0.3]}>
            <torusGeometry args={[0.18, 0.04, 6, 10, Math.PI * 0.9]} />
            <Mat c="#d8cbb0" />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={'e' + s} position={[s * 0.25, 0.08, 0]}>
            <boxGeometry args={[0.12, 0.06, 0.08]} />
            <Fur pet={pet} tex={tex} />
          </mesh>
        ))}
        <Eyes y={0.06} z={0.215} gap={0.13} r={0.03} />
      </group>
      <mesh position={[0, 0.85, -0.68]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.45, 5]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <Legs4 motion={motion} x={0.24} zf={0.45} zb={-0.45} top={0.58} len={0.58} w={0.16}>
        <Fur pet={pet} tex={tex} />
      </Legs4>
    </group>
  )
}

function Monkey({ pet, tex, motion }: Props & { tex: Texture | null }) {
  const arms = useLegSwing(motion, 9, 0.8)
  return (
    <group>
      <mesh position={[0, 0.32, 0]} castShadow>
        <sphereGeometry args={[0.16, 8, 7]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.58, 0.02]}>
        <mesh castShadow>
          <sphereGeometry args={[0.13, 8, 7]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        <mesh position={[0, -0.02, 0.09]} scale={[1, 0.8, 0.6]}>
          <sphereGeometry args={[0.09, 8, 6]} />
          <Mat c={pet.patternColor} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.13, 0.02, 0]} scale={[0.4, 1, 1]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <Mat c={pet.patternColor} />
          </mesh>
        ))}
        <Eyes y={0.02} z={0.12} gap={0.04} />
      </group>
      {[-1, 1].map((s, i) => (
        <group key={s} ref={arms[i]} position={[s * 0.16, 0.42, 0]}>
          <mesh position={[0, -0.13, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.26, 5]} />
            <Fur pet={pet} tex={tex} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((s, i) => (
        <group key={'l' + s} ref={arms[i + 2]} position={[s * 0.07, 0.2, 0]}>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.2, 5]} />
            <Fur pet={pet} tex={tex} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.42, -0.2]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.14, 0.022, 5, 10, Math.PI * 1.3]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
    </group>
  )
}

function Squirrel({ pet, tex, motion }: Props & { tex: Texture | null }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} scale={[1, 0.9, 1.3]} castShadow>
        <sphereGeometry args={[0.1, 8, 7]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.25, 0.12]}>
        <mesh castShadow>
          <sphereGeometry args={[0.075, 8, 7]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.04, 0.07, -0.01]}>
            <coneGeometry args={[0.02, 0.05, 4]} />
            <Fur pet={pet} tex={tex} />
          </mesh>
        ))}
        <Eyes y={0.02} z={0.065} gap={0.035} r={0.014} />
      </group>
      {/* หางฟู */}
      <mesh position={[0, 0.3, -0.16]} rotation={[-0.4, 0, 0]} scale={[0.8, 1.6, 0.8]} castShadow>
        <sphereGeometry args={[0.1, 8, 7]} />
        <Mat c={pet.patternColor} />
      </mesh>
      <Legs4 motion={motion} x={0.05} zf={0.07} zb={-0.07} top={0.08} len={0.08} w={0.035}>
        <Fur pet={pet} tex={tex} />
      </Legs4>
    </group>
  )
}

function Rabbit({ pet, tex }: Props & { tex: Texture | null }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} scale={[1, 0.95, 1.2]} castShadow>
        <sphereGeometry args={[0.13, 8, 7]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.28, 0.12]}>
        <mesh castShadow>
          <sphereGeometry args={[0.09, 8, 7]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.035, 0.14, -0.02]} rotation={[-0.15, 0, s * 0.12]} scale={[0.5, 1, 0.3]}>
            <sphereGeometry args={[0.1, 6, 6]} />
            <Fur pet={pet} tex={tex} />
          </mesh>
        ))}
        <mesh position={[0, -0.01, 0.085]}>
          <sphereGeometry args={[0.015, 5, 5]} />
          <Mat c="#e48f86" />
        </mesh>
        <Eyes y={0.02} z={0.075} gap={0.045} r={0.016} />
      </group>
      <mesh position={[0, 0.17, -0.16]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <Mat c="#ffffff" />
      </mesh>
    </group>
  )
}

function Bird({ pet, tex }: Props & { tex: Texture | null }) {
  const wings = [useRef<Group>(null), useRef<Group>(null)]
  useFrame(({ clock }) => {
    const a = Math.sin(clock.elapsedTime * 18) * 0.7
    if (wings[0].current) wings[0].current.rotation.z = a
    if (wings[1].current) wings[1].current.rotation.z = -a
  })
  return (
    <group>
      <mesh scale={[1, 0.9, 1.3]} castShadow>
        <sphereGeometry args={[0.08, 8, 7]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.06, 0.08]}>
        <mesh>
          <sphereGeometry args={[0.055, 8, 7]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        <mesh position={[0, -0.01, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.018, 0.05, 5]} />
          <Mat c="#f0a830" />
        </mesh>
        <Eyes y={0.015} z={0.045} gap={0.03} r={0.011} />
      </group>
      {[-1, 1].map((s, i) => (
        <group key={s} ref={wings[i]} position={[s * 0.06, 0.02, 0]}>
          <mesh position={[s * 0.07, 0, 0]} scale={[1, 0.2, 0.7]}>
            <sphereGeometry args={[0.07, 6, 5]} />
            <Mat c={pet.patternColor} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.01, -0.12]} rotation={[-0.3, 0, 0]} scale={[1, 0.2, 1]}>
        <coneGeometry args={[0.05, 0.1, 4]} />
        <Mat c={pet.patternColor} />
      </mesh>
    </group>
  )
}

function Chicken({ pet, tex, motion }: Props & { tex: Texture | null }) {
  const legs = useLegSwing(motion, 14, 0.7)
  return (
    <group>
      <mesh position={[0, 0.24, 0]} scale={[0.9, 1, 1.2]} castShadow>
        <sphereGeometry args={[0.13, 8, 7]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.4, 0.1]}>
        <mesh castShadow>
          <sphereGeometry args={[0.07, 8, 7]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        <mesh position={[0, 0.07, 0]} scale={[0.4, 1, 1]}>
          <sphereGeometry args={[0.04, 6, 5]} />
          <Mat c="#d23a2a" />
        </mesh>
        <mesh position={[0, -0.05, 0.05]} scale={[0.5, 1, 0.6]}>
          <sphereGeometry args={[0.025, 5, 5]} />
          <Mat c="#d23a2a" />
        </mesh>
        <mesh position={[0, 0, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.02, 0.045, 4]} />
          <Mat c="#f0a830" />
        </mesh>
        <Eyes y={0.015} z={0.055} gap={0.04} r={0.012} />
      </group>
      <mesh position={[0, 0.32, -0.15]} rotation={[-0.6, 0, 0]} scale={[0.4, 1, 0.8]}>
        <sphereGeometry args={[0.09, 6, 5]} />
        <Mat c={pet.patternColor} />
      </mesh>
      {[-1, 1].map((s, i) => (
        <group key={s} ref={legs[i * 3]} position={[s * 0.05, 0.13, 0]}>
          <mesh position={[0, -0.065, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.13, 4]} />
            <Mat c="#f0a830" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Duck({ pet, tex, motion }: Props & { tex: Texture | null }) {
  const legs = useLegSwing(motion, 12, 0.6)
  return (
    <group>
      <mesh position={[0, 0.2, 0]} scale={[0.95, 0.8, 1.35]} castShadow>
        <sphereGeometry args={[0.13, 8, 7]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.38, 0.11]}>
        <mesh castShadow>
          <sphereGeometry args={[0.07, 8, 7]} />
          <Mat c={pet.pattern === 'plain' ? pet.color : pet.patternColor} />
        </mesh>
        <mesh position={[0, -0.015, 0.08]} scale={[1, 0.35, 1]}>
          <boxGeometry args={[0.07, 0.05, 0.08]} />
          <Mat c="#f09a30" />
        </mesh>
        <Eyes y={0.02} z={0.058} gap={0.04} r={0.012} />
      </group>
      <mesh position={[0, 0.28, 0.08]}>
        <cylinderGeometry args={[0.035, 0.05, 0.12, 6]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      {[-1, 1].map((s, i) => (
        <group key={s} ref={legs[i * 3]} position={[s * 0.05, 0.1, 0]}>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.1, 4]} />
            <Mat c="#f09a30" />
          </mesh>
          <mesh position={[0, -0.1, 0.03]}>
            <boxGeometry args={[0.05, 0.01, 0.06]} />
            <Mat c="#f09a30" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Turtle({ pet, tex, motion }: Props & { tex: Texture | null }) {
  return (
    <group>
      {/* กระดอง */}
      <mesh position={[0, 0.08, 0]} scale={[1, 0.6, 1.2]} castShadow>
        <sphereGeometry args={[0.17, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <mesh position={[0, 0.075, 0]} scale={[1, 0.15, 1.2]}>
        <cylinderGeometry args={[0.175, 0.175, 0.04, 12]} />
        <Mat c="#d8c58a" />
      </mesh>
      <group position={[0, 0.1, 0.24]}>
        <mesh scale={[0.9, 0.8, 1.1]}>
          <sphereGeometry args={[0.055, 7, 6]} />
          <Mat c="#a8b878" />
        </mesh>
        <Eyes y={0.015} z={0.05} gap={0.03} r={0.01} />
      </group>
      <Legs4 motion={motion} x={0.13} zf={0.13} zb={-0.13} top={0.08} len={0.07} w={0.05}>
        <Mat c="#a8b878" />
      </Legs4>
    </group>
  )
}

const MODELS = {
  dog: Dog,
  cat: Cat,
  buffalo: Buffalo,
  monkey: Monkey,
  squirrel: Squirrel,
  rabbit: Rabbit,
  bird: Bird,
  chicken: Chicken,
  duck: Duck,
  turtle: Turtle,
} as const

/** สัตว์เลี้ยง + ท่าทางพื้นฐาน (ตัวเด้งเวลาเดิน, กระต่ายกระโดด) */
export function Pet({ pet, motion }: Props) {
  const tex = useFur(pet)
  const Model = MODELS[pet.species]
  const body = useRef<Group>(null)
  const phase = useRef(0)
  useFrame((_, dt) => {
    const moving = (motion?.current ?? 0) > 0
    phase.current += dt * (moving ? 10 : 2)
    if (!body.current) return
    if (pet.species === 'rabbit' || pet.species === 'squirrel') {
      body.current.position.y = moving ? Math.abs(Math.sin(phase.current * 0.8)) * 0.12 : 0
    } else if (pet.species === 'bird') {
      body.current.position.y = Math.sin(phase.current * 0.6) * 0.05
    } else if (pet.species === 'duck' || pet.species === 'chicken') {
      body.current.rotation.z = moving ? Math.sin(phase.current) * 0.12 : 0
    } else {
      body.current.position.y = moving ? Math.abs(Math.sin(phase.current)) * 0.02 : Math.sin(phase.current) * 0.004
    }
  })
  return (
    <group ref={body}>
      <Model pet={pet} tex={tex} motion={motion} />
    </group>
  )
}
