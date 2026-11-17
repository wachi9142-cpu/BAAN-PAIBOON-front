import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Group, type Texture } from 'three'
import type { PetChoice, PetPattern } from '../../game/content/pets'
import { PET_ANCHORS, PetHeld, PetHat, PetOutfit } from './PetOutfit'
import { RBox } from './RBox'

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
  } else if (pattern === 'calico') {
    // สามสี: พื้นขาว + ด่างส้ม + ด่างดำ
    const blob = (color: string, n: number) => {
      g.fillStyle = color
      for (let i = 0; i < n; i++) {
        const cx = rand() * 128
        const cy = rand() * 128
        g.beginPath()
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 6) {
          const r = 12 + rand() * 14
          g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
        }
        g.fill()
      }
    }
    blob(accent, 4)
    blob('#2b2a2c', 3)
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
    () =>
      pet.pattern === 'plain' || pet.pattern === 'colorpoint' || pet.pattern === 'tuxedo' || pet.pattern === 'blacktan'
        ? null // ลายเหล่านี้โมเดลลงสีเป็นส่วน ๆ เอง
        : drawPattern(pet.color, pet.pattern, pet.patternColor),
    [pet.color, pet.pattern, pet.patternColor],
  )
  // คืนหน่วยความจำของลายเก่าเมื่อเปลี่ยนลาย (ไม่ dispose ใน cleanup ของ effect
  // เพราะ StrictMode จะเรียก cleanup ระหว่างที่ texture ยังถูกใช้อยู่ ทำให้ตัวสัตว์เป็นสีดำ)
  const prev = useRef<Texture | null>(null)
  useEffect(() => {
    if (prev.current && prev.current !== tex) prev.current.dispose()
    prev.current = tex
  }, [tex])
  return tex
}

/** วัสดุขน: ใช้ texture ลาย ถ้ามี ไม่งั้นใช้สีล้วน */
function Fur({ pet, tex }: { pet: PetChoice; tex: Texture | null }) {
  // ต้องกำหนดทั้ง color และ map ทุกครั้ง: React Three Fiber ใช้วัสดุเดิมซ้ำ
  // ถ้าไม่รีเซ็ตสีเป็นขาวตอนมีลาย สีเดิม (เช่นดำ) จะคูณทับลายจนมองไม่เห็น
  // key ใหม่เมื่อเปลี่ยนระหว่าง "มีลาย/ไม่มีลาย" เพื่อสร้างวัสดุใหม่ (shader ต้องคอมไพล์ใหม่จึงจะแสดงลาย)
  return <meshStandardMaterial key={tex ? tex.uuid : 'plain'} color={tex ? '#ffffff' : pet.color} map={tex} />
}

const Mat = ({ c }: { c: string }) => <meshStandardMaterial color={c} />

function Eyes({ y, z, gap, r = 0.02 }: { y: number; z: number; gap: number; r?: number }) {
  return (
    <>
      {/* ตาขาว + ตาดำ + จุดแสง → มองเห็นได้แม้ตัวสัตว์สีเข้ม */}
      {[-gap, gap].map((x) => (
        <group key={x} position={[x, y, z]}>
          <mesh scale={[1, 1, 0.6]}>
            <sphereGeometry args={[r * 1.45, 14, 10]} />
            <meshBasicMaterial color="#f4efe4" />
          </mesh>
          <mesh position={[0, 0, r * 0.45]}>
            <sphereGeometry args={[r, 14, 10]} />
            <meshStandardMaterial color="#141210" roughness={0.3} />
          </mesh>
          <mesh position={[r * 0.35, r * 0.4, r * 1.3]}>
            <sphereGeometry args={[r * 0.3, 14, 10]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </>
  )
}

// ---------- ขา (แกว่งเมื่อเดิน) ----------

/** ท่าของสัตว์เลี้ยง: 0 = ยืน, 1 = นั่ง, 2 = นอน (ส่งผ่าน context ให้ขาทุกชนิดพับตาม) */
export const PetPoseContext = createContext<React.RefObject<number> | null>(null)

function useLegSwing(motion: React.RefObject<number> | undefined, speed = 10, amount = 0.6) {
  const refs = [useRef<Group>(null), useRef<Group>(null), useRef<Group>(null), useRef<Group>(null)]
  const phase = useRef(0)
  const poseRef = useContext(PetPoseContext)
  useFrame((_, dt) => {
    const moving = (motion?.current ?? 0) > 0
    const pose = moving ? 0 : (poseRef?.current ?? 0)
    if (moving) phase.current += dt * speed * ((motion?.current ?? 0) === 2 ? 1.6 : 1)
    const s = moving ? Math.sin(phase.current) * amount : 0
    refs.forEach((r, i) => {
      if (!r.current) return
      let target = i % 3 === 0 ? s : -s // ขาทแยงขยับพร้อมกัน
      if (pose === 2) target = i < 2 ? -1.35 : 1.35 // นอน: ขาหน้าเหยียดไปหน้า ขาหลังพับไปหลัง
      else if (pose === 1) target = i < 2 ? 0.15 : -1.2 // นั่ง: พับขาหลังเข้าใต้ตัว
      r.current.rotation.x += (target - r.current.rotation.x) * Math.min(1, dt * 8)
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
            <RBox args={[w, len, w]} />
            {children}
          </mesh>
        </group>
      ))}
    </>
  )
}

// ---------- ชนิดสัตว์ ----------

function Dog({ pet, tex, motion }: Props & { tex: Texture | null }) {
  const point = pet.pattern === 'colorpoint' // หน้ากาก หู หาง
  const tux = pet.pattern === 'tuxedo' // อกและขา
  const tan = pet.pattern === 'blacktan' // ปากและขา
  const long = pet.fur === 'long'
  const shortSnout = pet.snout === 'short'
  const scale = pet.size === 'small' ? 0.72 : pet.size === 'large' ? 1.35 : 1
  const accent = <Mat c={pet.patternColor} />
  const fur = <Fur pet={pet} tex={tex} />
  const earMat = point || pet.pattern === 'plain' ? accent : fur
  const legMat = tux || tan ? accent : fur
  const muzzleMat = tan || point ? accent : fur
  const body: [number, number, number] = long ? [1.18, 1.18, 1.05] : [1, 1, 1]
  return (
    <group scale={scale}>
      <mesh position={[0, 0.36, 0]} scale={body} castShadow>
        <RBox args={[0.26, 0.24, 0.48]} />
        {fur}
      </mesh>
      {long && (
        <mesh position={[0, 0.46, 0.2]} scale={[1.2, 1, 0.8]}>
          <sphereGeometry args={[0.15, 14, 10]} />
          {fur}
        </mesh>
      )}
      {tux && (
        <mesh position={[0, 0.38, 0.23]}>
          <RBox args={[0.17, 0.2, 0.06]} />
          {accent}
        </mesh>
      )}
      <group position={[0, 0.54, 0.26]}>
        <mesh castShadow>
          <RBox args={[0.22, 0.2, 0.2]} />
          {fur}
        </mesh>
        {point && (
          <mesh position={[0, -0.02, 0.102]}>
            <RBox args={[0.16, 0.12, 0.01]} />
            {accent}
          </mesh>
        )}
        {/* ปาก (หน้าสั้นจะแบนติดหน้า) */}
        <mesh position={[0, -0.04, shortSnout ? 0.105 : 0.13]}>
          <RBox args={[0.13, 0.09, shortSnout ? 0.03 : 0.1]} />
          {muzzleMat}
        </mesh>
        <mesh position={[0, -0.01, shortSnout ? 0.125 : 0.185]}>
          <RBox args={[0.05, 0.04, 0.02]} />
          <Mat c="#1a1412" />
        </mesh>
        {/* คิ้วแต้ม (แต้มปากและขา) */}
        {tan &&
          [-1, 1].map((s) => (
            <mesh key={'b' + s} position={[s * 0.05, 0.075, 0.101]}>
              <RBox args={[0.035, 0.02, 0.01]} />
              {accent}
            </mesh>
          ))}
        {[-1, 1].map((s) =>
          pet.ears === 'floppy' ? (
            <mesh key={s} position={[s * 0.125, -0.01, 0.0]} rotation={[0, 0, s * 0.12]}>
              <RBox args={[0.04, 0.16, 0.1]} />
              {earMat}
            </mesh>
          ) : pet.ears === 'erect' ? (
            <mesh key={s} position={[s * 0.07, 0.14, -0.02]} rotation={[0, 0, s * -0.15]}>
              <coneGeometry args={[0.045, 0.11, 4]} />
              {earMat}
            </mesh>
          ) : (
            <mesh key={s} position={[s * 0.1, 0.06, -0.02]} rotation={[0, 0, s * 0.5]}>
              <RBox args={[0.05, 0.12, 0.08]} />
              {earMat}
            </mesh>
          ),
        )}
        <Eyes y={0.04} z={0.101} gap={0.05} />
      </group>
      {pet.tail === 'curl' ? (
        <mesh position={[0, 0.55, -0.2]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.07, long ? 0.035 : 0.022, 6, 10, Math.PI * 1.5]} />
          {point ? accent : fur}
        </mesh>
      ) : pet.tail !== 'none' ? (
        <mesh position={[0, 0.48, -0.27]} rotation={[0.8, 0, 0]}>
          <cylinderGeometry args={long ? [0.04, 0.05, 0.22, 6] : [0.025, 0.035, 0.22, 6]} />
          {point ? accent : fur}
        </mesh>
      ) : null}
      <Legs4 motion={motion} x={0.09} zf={0.16} zb={-0.16} top={0.26} len={0.26} w={0.07}>
        {legMat}
      </Legs4>
    </group>
  )
}

function Cat({ pet, tex, motion }: Props & { tex: Texture | null }) {
  const point = pet.pattern === 'colorpoint'
  const tux = pet.pattern === 'tuxedo'
  const long = pet.fur === 'long'
  const hairless = pet.fur === 'hairless'
  const folded = pet.ears === 'folded'
  // แต้มสี: หน้า หู ขา หาง เป็นสีรอง / ขาวดำ: เท้าและอกเป็นสีรอง
  const ears = <Mat c={point || pet.pattern === 'plain' ? pet.patternColor : pet.color} />
  const legMat = point || tux ? <Mat c={pet.patternColor} /> : <Fur pet={pet} tex={tex} />
  const tailMat = point || pet.pattern === 'plain' ? <Mat c={pet.patternColor} /> : <Fur pet={pet} tex={tex} />
  const bodyScale: [number, number, number] = long ? [1.25, 1.25, 1.1] : [1, 1, 1]
  return (
    <group>
      <mesh position={[0, 0.27, 0]} scale={bodyScale} castShadow>
        <RBox args={[0.2, 0.18, 0.4]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      {/* ขนยาว: แผงคอฟู */}
      {long && (
        <mesh position={[0, 0.36, 0.16]} scale={[1.2, 1, 0.8]}>
          <sphereGeometry args={[0.13, 14, 10]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
      )}
      {/* ขาวดำ: อกขาว */}
      {tux && (
        <mesh position={[0, 0.3, 0.17]}>
          <RBox args={[0.12, 0.14, 0.08]} />
          <Mat c={pet.patternColor} />
        </mesh>
      )}
      <group position={[0, 0.42, 0.22]}>
        <mesh castShadow>
          <RBox args={[0.18, 0.16, 0.15]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        {/* หน้ากากแต้มสี */}
        {point && (
          <mesh position={[0, -0.015, 0.072]}>
            <RBox args={[0.12, 0.1, 0.012]} />
            <Mat c={pet.patternColor} />
          </mesh>
        )}
        {[-1, 1].map((s) =>
          folded ? (
            <mesh key={s} position={[s * 0.06, 0.085, 0.01]} rotation={[0.9, 0, s * -0.3]}>
              <RBox args={[0.05, 0.015, 0.05]} />
              {ears}
            </mesh>
          ) : (
            <mesh key={s} position={[s * 0.06, 0.11, 0]} rotation={[0, 0, s * -0.2]} scale={hairless ? 1.4 : 1}>
              <coneGeometry args={[0.04, 0.08, 4]} />
              {ears}
            </mesh>
          ),
        )}
        <mesh position={[0, -0.02, 0.08]}>
          <RBox args={[0.03, 0.025, 0.02]} />
          <Mat c="#e48f86" />
        </mesh>
        <Eyes y={0.03} z={0.08} gap={0.045} r={0.018} />
      </group>
      {pet.tail !== 'none' && (
        <mesh position={[0, 0.42, -0.3]} rotation={[0.35, 0, 0]}>
          <cylinderGeometry args={long ? [0.04, 0.05, 0.36, 6] : hairless ? [0.012, 0.02, 0.36, 6] : [0.02, 0.025, 0.36, 6]} />
          {tailMat}
        </mesh>
      )}
      <Legs4 motion={motion} x={0.07} zf={0.14} zb={-0.14} top={0.19} len={0.19} w={0.05}>
        {legMat}
      </Legs4>
    </group>
  )
}

function Buffalo({ pet, tex, motion }: Props & { tex: Texture | null }) {
  return (
    <group>
      <mesh position={[0, 0.85, 0]} castShadow>
        <RBox args={[0.7, 0.62, 1.3]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.95, 0.75]}>
        <mesh castShadow>
          <RBox args={[0.42, 0.4, 0.42]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        <mesh position={[0, -0.1, 0.22]}>
          <RBox args={[0.3, 0.2, 0.12]} />
          <Mat c={pet.patternColor} />
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
            <RBox args={[0.12, 0.06, 0.08]} />
            <Mat c={pet.patternColor} />
          </mesh>
        ))}
        <Eyes y={0.06} z={0.215} gap={0.13} r={0.03} />
      </group>
      <mesh position={[0, 0.85, -0.68]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.45, 12]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <Legs4 motion={motion} x={0.24} zf={0.45} zb={-0.45} top={0.58} len={0.58} w={0.16}>
        <Fur pet={pet} tex={tex} />
      </Legs4>
    </group>
  )
}

function Cow({ pet, tex, motion }: Props & { tex: Texture | null }) {
  const scale = pet.size === 'large' ? 1.12 : 0.9
  const floppy = pet.ears === 'floppy'
  return (
    <group scale={scale}>
      <mesh position={[0, 0.82, 0]} castShadow>
        <RBox args={[0.6, 0.55, 1.15]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      {/* โหนก (บราห์มัน) */}
      {pet.hump && (
        <mesh position={[0, 1.13, 0.38]} scale={[1, 0.8, 1]} castShadow>
          <sphereGeometry args={[0.17, 14, 10]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
      )}
      <group position={[0, 0.95, 0.7]}>
        <mesh castShadow>
          <RBox args={[0.34, 0.34, 0.36]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        {/* จมูก */}
        <mesh position={[0, -0.1, 0.2]}>
          <RBox args={[0.28, 0.15, 0.08]} />
          <Mat c={pet.patternColor} />
        </mesh>
        {[-0.06, 0.06].map((x) => (
          <mesh key={x} position={[x, -0.09, 0.245]}>
            <RBox args={[0.035, 0.03, 0.01]} />
            <Mat c="#3a2a24" />
          </mesh>
        ))}
        {/* เขาสั้นงอนขึ้น */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.16, 0.2, -0.05]} rotation={[0, 0, s * -0.6]}>
            <coneGeometry args={[0.03, 0.13, 12]} />
            <Mat c="#e8dcc0" />
          </mesh>
        ))}
        {/* หู */}
        {[-1, 1].map((s) => (
          <mesh
            key={'e' + s}
            position={[s * (floppy ? 0.19 : 0.22), floppy ? 0.0 : 0.08, -0.02]}
            rotation={[0, 0, floppy ? s * 0.15 : s * -0.25]}
          >
            <RBox args={floppy ? [0.05, 0.2, 0.1] : [0.14, 0.06, 0.08]} />
            <Mat c={pet.patternColor} />
          </mesh>
        ))}
        <Eyes y={0.06} z={0.18} gap={0.11} r={0.026} />
      </group>
      {/* หาง + พู่ปลายหาง */}
      <mesh position={[0, 0.78, -0.6]} rotation={[0.15, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.45, 12]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <mesh position={[0, 0.54, -0.63]}>
        <sphereGeometry args={[0.045, 14, 10]} />
        <Mat c="#3a2a24" />
      </mesh>
      <Legs4 motion={motion} x={0.2} zf={0.42} zb={-0.42} top={0.56} len={0.56} w={0.13}>
        <Fur pet={pet} tex={tex} />
      </Legs4>
    </group>
  )
}

function Pig({ pet, tex, motion }: Props & { tex: Texture | null }) {
  const scale = pet.size === 'small' ? 0.7 : 1
  return (
    <group scale={scale}>
      <mesh position={[0, 0.3, 0]} scale={[1, 0.9, 1.25]} castShadow>
        <sphereGeometry args={[0.2, 14, 10]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.36, 0.25]}>
        <mesh castShadow>
          <sphereGeometry args={[0.13, 14, 10]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        {/* จมูกหมู */}
        <mesh position={[0, -0.02, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.06, 0.05, 12]} />
          <Mat c={pet.patternColor} />
        </mesh>
        {[-0.022, 0.022].map((x) => (
          <mesh key={x} position={[x, -0.02, 0.157]}>
            <sphereGeometry args={[0.011, 14, 10]} />
            <Mat c="#8a4a52" />
          </mesh>
        ))}
        {/* หูพับไปข้างหน้า */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.08, 0.12, 0.02]} rotation={[0.6, 0, s * -0.4]}>
            <coneGeometry args={[0.05, 0.09, 3]} />
            <Mat c={pet.patternColor} />
          </mesh>
        ))}
        <Eyes y={0.04} z={0.11} gap={0.055} r={0.016} />
      </group>
      {/* หางม้วน */}
      <mesh position={[0, 0.36, -0.26]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.035, 0.012, 5, 10, Math.PI * 1.7]} />
        <Mat c={pet.patternColor} />
      </mesh>
      <Legs4 motion={motion} x={0.1} zf={0.13} zb={-0.13} top={0.15} len={0.15} w={0.06}>
        <Fur pet={pet} tex={tex} />
      </Legs4>
    </group>
  )
}

function Goat({ pet, tex, motion }: Props & { tex: Texture | null }) {
  const floppy = pet.ears === 'floppy'
  return (
    <group>
      <mesh position={[0, 0.52, 0]} castShadow>
        <RBox args={[0.3, 0.3, 0.6]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.78, 0.33]} rotation={[-0.25, 0, 0]}>
        <mesh castShadow>
          <RBox args={[0.18, 0.2, 0.24]} />
          {floppy ? <Mat c={pet.patternColor} /> : <Fur pet={pet} tex={tex} />}
        </mesh>
        {/* เขาโค้งไปด้านหลัง */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.05, 0.13, -0.07]} rotation={[-0.7, 0, s * 0.15]}>
            <coneGeometry args={[0.022, 0.16, 12]} />
            <Mat c="#8a7a66" />
          </mesh>
        ))}
        {/* หู */}
        {[-1, 1].map((s) => (
          <mesh key={'e' + s} position={[s * 0.12, floppy ? -0.02 : 0.04, -0.02]} rotation={[0, 0, floppy ? s * 0.2 : s * -1.1]}>
            <RBox args={[0.04, 0.12, 0.06]} />
            <Mat c={pet.patternColor} />
          </mesh>
        ))}
        {/* เครา */}
        <mesh position={[0, -0.14, 0.08]}>
          <coneGeometry args={[0.03, 0.1, 12]} />
          <Mat c={pet.patternColor} />
        </mesh>
        <Eyes y={0.03} z={0.121} gap={0.06} r={0.017} />
      </group>
      <mesh position={[0, 0.7, -0.31]} rotation={[-0.6, 0, 0]}>
        <coneGeometry args={[0.03, 0.1, 12]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <Legs4 motion={motion} x={0.1} zf={0.2} zb={-0.2} top={0.38} len={0.38} w={0.06}>
        <Fur pet={pet} tex={tex} />
      </Legs4>
    </group>
  )
}

function Sheep({ pet, tex, motion }: Props & { tex: Texture | null }) {
  // ขนปุย: ก้อนกลมหลายก้อน
  const puffs: [number, number, number, number][] = [
    [0, 0.5, 0, 0.2],
    [-0.12, 0.47, 0.14, 0.15],
    [0.12, 0.47, 0.14, 0.15],
    [-0.12, 0.47, -0.14, 0.15],
    [0.12, 0.47, -0.14, 0.15],
    [0, 0.6, 0.1, 0.14],
    [0, 0.6, -0.1, 0.14],
    [0, 0.45, 0.2, 0.13],
    [0, 0.45, -0.22, 0.13],
  ]
  return (
    <group>
      {puffs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 14, 10]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
      ))}
      <group position={[0, 0.55, 0.32]}>
        <mesh castShadow scale={[1, 1.1, 1.05]}>
          <sphereGeometry args={[0.09, 14, 10]} />
          <Mat c={pet.patternColor} />
        </mesh>
        {/* ขนปุยบนหัว */}
        <mesh position={[0, 0.08, -0.02]}>
          <sphereGeometry args={[0.07, 14, 10]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.1, 0.02, -0.02]} rotation={[0, 0, s * -1.2]} scale={[0.5, 1, 0.3]}>
            <sphereGeometry args={[0.06, 14, 10]} />
            <Mat c={pet.patternColor} />
          </mesh>
        ))}
        <Eyes y={0.02} z={0.08} gap={0.04} r={0.014} />
      </group>
      <Legs4 motion={motion} x={0.09} zf={0.14} zb={-0.14} top={0.34} len={0.34} w={0.05}>
        <Mat c={pet.patternColor} />
      </Legs4>
    </group>
  )
}

function Mouse({ pet, tex }: Props & { tex: Texture | null }) {
  const bigEars = pet.ears === 'floppy'
  const hamster = pet.tail === 'none'
  return (
    <group>
      {/* ตัวกลมรี (แฮมสเตอร์ตัวกลมกว่า) */}
      <mesh position={[0, 0.09, 0]} scale={hamster ? [1.15, 1, 1.1] : [0.9, 0.85, 1.3]} castShadow>
        <sphereGeometry args={[0.09, 14, 10]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.12, hamster ? 0.09 : 0.12]}>
        <mesh scale={[1, 0.95, 1.15]} castShadow>
          <sphereGeometry args={[0.06, 14, 10]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        {/* หูกลมใหญ่ */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (bigEars ? 0.065 : 0.045), 0.055, -0.01]} rotation={[0, 0, s * -0.3]} scale={[1, 1, 0.35]}>
            <sphereGeometry args={[bigEars ? 0.045 : 0.032, 14, 10]} />
            <Mat c={pet.patternColor} />
          </mesh>
        ))}
        {/* จมูกชมพู + หนวด */}
        <mesh position={[0, -0.005, 0.07]}>
          <sphereGeometry args={[0.012, 14, 10]} />
          <Mat c="#e88a9a" />
        </mesh>
        {[-1, 1].flatMap((s) =>
          [0.008, -0.006].map((dy) => (
            <mesh key={`${s}${dy}`} position={[s * 0.035, dy, 0.06]} rotation={[0, 0, s * dy * 20]}>
              <RBox args={[0.045, 0.002, 0.002]} />
              <meshBasicMaterial color="#3a3330" />
            </mesh>
          )),
        )}
        <Eyes y={0.015} z={0.05} gap={0.028} r={0.01} />
      </group>
      {/* หางยาว */}
      {!hamster && (
        <mesh position={[0, 0.05, -0.2]} rotation={[1.35, 0, 0]}>
          <cylinderGeometry args={[0.005, 0.01, 0.22, 12]} />
          <Mat c={pet.patternColor} />
        </mesh>
      )}
      {/* เท้าเล็ก ๆ */}
      {[
        [-0.04, 0.06],
        [0.04, 0.06],
        [-0.045, -0.06],
        [0.045, -0.06],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.01, z]}>
          <sphereGeometry args={[0.014, 14, 10]} />
          <Mat c={pet.patternColor} />
        </mesh>
      ))}
    </group>
  )
}

function Monkey({ pet, tex, motion }: Props & { tex: Texture | null }) {
  const arms = useLegSwing(motion, 9, 0.8)
  return (
    <group>
      <mesh position={[0, 0.32, 0]} castShadow>
        <sphereGeometry args={[0.16, 14, 10]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.58, 0.02]}>
        <mesh castShadow>
          <sphereGeometry args={[0.13, 14, 10]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        <mesh position={[0, -0.02, 0.09]} scale={[1, 0.8, 0.6]}>
          <sphereGeometry args={[0.09, 14, 10]} />
          <Mat c={pet.patternColor} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.13, 0.02, 0]} scale={[0.4, 1, 1]}>
            <sphereGeometry args={[0.05, 14, 10]} />
            <Mat c={pet.patternColor} />
          </mesh>
        ))}
        <Eyes y={0.02} z={0.12} gap={0.04} />
      </group>
      {[-1, 1].map((s, i) => (
        <group key={s} ref={arms[i]} position={[s * 0.16, 0.42, 0]}>
          <mesh position={[0, -0.13, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.26, 12]} />
            <Fur pet={pet} tex={tex} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((s, i) => (
        <group key={'l' + s} ref={arms[i + 2]} position={[s * 0.07, 0.2, 0]}>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.2, 12]} />
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
        <sphereGeometry args={[0.1, 14, 10]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.25, 0.12]}>
        <mesh castShadow>
          <sphereGeometry args={[0.075, 14, 10]} />
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
        <sphereGeometry args={[0.1, 14, 10]} />
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
        <sphereGeometry args={[0.13, 14, 10]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.28, 0.12]}>
        <mesh castShadow>
          <sphereGeometry args={[0.09, 14, 10]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        {/* หูยาว (หูตก = ห้อยลงข้างหัวแบบลอป) ด้านนอกสีตัว ด้านในสีรอง */}
        {[-1, 1].map((s) =>
          pet.ears === 'floppy' ? (
            <group key={s} position={[s * 0.085, 0.03, -0.01]} rotation={[0, 0, s * 0.15]}>
              <mesh position={[0, -0.05, 0]} scale={[0.35, 1, 0.55]}>
                <sphereGeometry args={[0.09, 14, 10]} />
                <Fur pet={pet} tex={tex} />
              </mesh>
              <mesh position={[s * 0.012, -0.05, 0.012]} scale={[0.2, 0.8, 0.4]}>
                <sphereGeometry args={[0.09, 14, 10]} />
                <Mat c={pet.patternColor} />
              </mesh>
            </group>
          ) : (
            <group key={s} position={[s * 0.035, 0.14, -0.02]} rotation={[-0.15, 0, s * 0.12]}>
              <mesh scale={[0.5, 1, 0.3]}>
                <sphereGeometry args={[0.1, 14, 10]} />
                <Fur pet={pet} tex={tex} />
              </mesh>
              <mesh position={[0, 0, 0.018]} scale={[0.28, 0.8, 0.2]}>
                <sphereGeometry args={[0.1, 14, 10]} />
                <Mat c={pet.patternColor} />
              </mesh>
            </group>
          ),
        )}
        <mesh position={[0, -0.01, 0.085]}>
          <sphereGeometry args={[0.013, 14, 10]} />
          <Mat c="#e48f86" />
        </mesh>
        <Eyes y={0.02} z={0.075} gap={0.045} r={0.016} />
        {/* แก้มชมพู */}
        {[-1, 1].map((s) => (
          <mesh key={'c' + s} position={[s * 0.06, -0.015, 0.06]} rotation={[0, s * 0.7, 0]} scale={[1, 0.75, 0.3]}>
            <sphereGeometry args={[0.02, 14, 10]} />
            <meshStandardMaterial color="#f4a8b4" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
      {/* อุ้งเท้าหน้า */}
      {[-1, 1].map((s) => (
        <mesh key={'p' + s} position={[s * 0.05, 0.04, 0.12]} scale={[1, 0.7, 1.2]}>
          <sphereGeometry args={[0.03, 14, 10]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
      ))}
      <mesh position={[0, 0.17, -0.16]}>
        <sphereGeometry args={[0.045, 14, 10]} />
        <Fur pet={pet} tex={tex} />
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
        <sphereGeometry args={[0.08, 14, 10]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.06, 0.08]}>
        <mesh>
          <sphereGeometry args={[0.055, 14, 10]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        <mesh position={[0, -0.01, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.018, 0.05, 12]} />
          <Mat c="#f0a830" />
        </mesh>
        <Eyes y={0.015} z={0.045} gap={0.03} r={0.011} />
      </group>
      {[-1, 1].map((s, i) => (
        <group key={s} ref={wings[i]} position={[s * 0.06, 0.02, 0]}>
          <mesh position={[s * 0.07, 0, 0]} scale={[1, 0.2, 0.7]}>
            <sphereGeometry args={[0.07, 14, 10]} />
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
        <sphereGeometry args={[0.13, 14, 10]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.4, 0.1]}>
        <mesh castShadow>
          <sphereGeometry args={[0.07, 14, 10]} />
          <Fur pet={pet} tex={tex} />
        </mesh>
        <mesh position={[0, 0.07, 0]} scale={[0.4, 1, 1]}>
          <sphereGeometry args={[0.04, 14, 10]} />
          <Mat c="#d23a2a" />
        </mesh>
        <mesh position={[0, -0.05, 0.05]} scale={[0.5, 1, 0.6]}>
          <sphereGeometry args={[0.025, 14, 10]} />
          <Mat c="#d23a2a" />
        </mesh>
        <mesh position={[0, 0, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.02, 0.045, 4]} />
          <Mat c="#f0a830" />
        </mesh>
        <Eyes y={0.015} z={0.055} gap={0.04} r={0.012} />
      </group>
      {pet.tail === 'rainbow' ? (
        // หางสีรุ้ง: ขนหางหลายเส้นเรียงเป็นพัด
        ['#e84a3a', '#f39a2a', '#f2d34a', '#5cb85c', '#3f8fd8', '#8a5cc8'].map((c, i) => (
          <mesh key={c} position={[0, 0.34, -0.15]} rotation={[-0.9 + i * 0.12, 0, (i - 2.5) * 0.18]}>
            <RBox args={[0.03, 0.2, 0.012]} />
            <Mat c={c} />
          </mesh>
        ))
      ) : (
        <mesh position={[0, 0.32, -0.15]} rotation={[-0.6, 0, 0]} scale={[0.4, 1, 0.8]}>
          <sphereGeometry args={[0.09, 14, 10]} />
          <Mat c={pet.patternColor} />
        </mesh>
      )}
      {[-1, 1].map((s, i) => (
        <group key={s} ref={legs[i * 3]} position={[s * 0.05, 0.13, 0]}>
          <mesh position={[0, -0.065, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.13, 12]} />
            <Mat c="#f0a830" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Goose({ pet, tex, motion }: Props & { tex: Texture | null }) {
  const legs = useLegSwing(motion, 11, 0.6)
  return (
    <group>
      <mesh position={[0, 0.27, -0.02]} scale={[0.95, 0.85, 1.4]} castShadow>
        <sphereGeometry args={[0.17, 14, 10]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      {/* คอยาวโค้ง */}
      <mesh position={[0, 0.46, 0.15]} rotation={[0.25, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.055, 0.32, 12]} />
        <Mat c={pet.patternColor} />
      </mesh>
      <group position={[0, 0.66, 0.2]}>
        <mesh castShadow scale={[0.9, 0.95, 1.15]}>
          <sphereGeometry args={[0.07, 14, 10]} />
          <Mat c={pet.patternColor} />
        </mesh>
        {/* ปากส้ม + ปุ่มบนปาก */}
        <mesh position={[0, -0.015, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.028, 0.08, 12]} />
          <Mat c="#f09a30" />
        </mesh>
        <mesh position={[0, 0.02, 0.06]}>
          <sphereGeometry args={[0.02, 14, 10]} />
          <Mat c="#e8822a" />
        </mesh>
        <Eyes y={0.02} z={0.05} gap={0.042} r={0.012} />
      </group>
      {/* หางชี้ขึ้น */}
      <mesh position={[0, 0.34, -0.25]} rotation={[-0.8, 0, 0]} scale={[0.6, 1, 0.4]}>
        <coneGeometry args={[0.07, 0.12, 12]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      {[-1, 1].map((s, i) => (
        <group key={s} ref={legs[i * 3]} position={[s * 0.06, 0.13, 0]}>
          <mesh position={[0, -0.065, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.13, 12]} />
            <Mat c="#f09a30" />
          </mesh>
          <mesh position={[0, -0.13, 0.035]}>
            <RBox args={[0.06, 0.012, 0.07]} />
            <Mat c="#f09a30" />
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
        <sphereGeometry args={[0.13, 14, 10]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      <group position={[0, 0.38, 0.11]}>
        <mesh castShadow>
          <sphereGeometry args={[0.07, 14, 10]} />
          <Mat c={pet.patternColor} />
        </mesh>
        <mesh position={[0, -0.015, 0.08]} scale={[1, 0.35, 1]}>
          <RBox args={[0.07, 0.05, 0.08]} />
          <Mat c="#f6b860" />
        </mesh>
        <Eyes y={0.02} z={0.058} gap={0.04} r={0.012} />
        {/* แก้มชมพู */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.052, -0.012, 0.042]} rotation={[0, s * 0.8, 0]} scale={[1, 0.8, 0.3]}>
            <sphereGeometry args={[0.018, 14, 10]} />
            <meshStandardMaterial color="#f2a8b0" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.28, 0.08]}>
        <cylinderGeometry args={[0.035, 0.05, 0.12, 12]} />
        <Fur pet={pet} tex={tex} />
      </mesh>
      {[-1, 1].map((s, i) => (
        <group key={s} ref={legs[i * 3]} position={[s * 0.05, 0.1, 0]}>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.1, 12]} />
            <Mat c="#f09a30" />
          </mesh>
          <mesh position={[0, -0.1, 0.03]}>
            <RBox args={[0.05, 0.01, 0.06]} />
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
          <sphereGeometry args={[0.055, 14, 10]} />
          <Mat c={pet.patternColor} />
        </mesh>
        <Eyes y={0.015} z={0.05} gap={0.03} r={0.01} />
      </group>
      <Legs4 motion={motion} x={0.13} zf={0.13} zb={-0.13} top={0.08} len={0.07} w={0.05}>
        <Mat c={pet.patternColor} />
      </Legs4>
    </group>
  )
}

const MODELS = {
  dog: Dog,
  cat: Cat,
  buffalo: Buffalo,
  cow: Cow,
  pig: Pig,
  goat: Goat,
  sheep: Sheep,
  monkey: Monkey,
  squirrel: Squirrel,
  mouse: Mouse,
  rabbit: Rabbit,
  bird: Bird,
  chicken: Chicken,
  duck: Duck,
  goose: Goose,
  turtle: Turtle,
} as const

/** สัตว์เลี้ยง + ท่าทางพื้นฐาน (ตัวเด้งเวลาเดิน, กระต่ายกระโดด) */
export function Pet({ pet, motion, pose }: Props & { pose?: React.RefObject<number> }) {
  const tex = useFur(pet)
  const Model = MODELS[pet.species]
  const body = useRef<Group>(null)
  const poseGroup = useRef<Group>(null)
  const phase = useRef(0)
  const anchor = PET_ANCHORS[pet.species]
  const hasLegs4 = !['rabbit', 'mouse', 'bird', 'chicken', 'duck', 'goose', 'monkey'].includes(pet.species)
  useFrame((_, dt) => {
    // ---- ท่านั่ง/นอน ----
    const p = (motion?.current ?? 0) > 0 ? 0 : (pose?.current ?? 0)
    if (poseGroup.current && pet.species !== 'bird') {
      const h = anchor.body[0] * innerScale(pet)
      // นั่ง: ยกหน้า ก้นลง / นอน: ลดตัวลงแนบพื้น (ขาพับเข้าใต้ตัว)
      const tRotX = p === 1 && hasLegs4 ? -0.32 : 0
      const tY = p === 1 ? (hasLegs4 ? -h * 0.12 : -h * 0.05) : p === 2 ? (hasLegs4 ? -h * 0.62 : -h * 0.25) : 0
      const k = Math.min(1, dt * 6)
      poseGroup.current.rotation.x += (tRotX - poseGroup.current.rotation.x) * k
      poseGroup.current.position.y += (tY - poseGroup.current.position.y) * k
      // หายใจช้า ๆ ตอนนอน
      const breathe = p === 2 ? 1 + Math.sin(phase.current * 1.5) * 0.015 : 1
      poseGroup.current.scale.set(1, breathe, 1)
    }
  })
  useFrame((_, dt) => {
    const moving = (motion?.current ?? 0) > 0
    phase.current += dt * (moving ? 10 : 2)
    if (!body.current) return
    if (pet.species === 'rabbit' || pet.species === 'squirrel' || pet.species === 'mouse') {
      body.current.position.y = moving ? Math.abs(Math.sin(phase.current * 0.8)) * 0.12 : 0
    } else if (pet.species === 'bird') {
      body.current.position.y = Math.sin(phase.current * 0.6) * 0.05
    } else if (pet.species === 'duck' || pet.species === 'chicken' || pet.species === 'goose') {
      body.current.rotation.z = moving ? Math.sin(phase.current) * 0.12 : 0
    } else {
      body.current.position.y = moving ? Math.abs(Math.sin(phase.current)) * 0.02 : Math.sin(phase.current) * 0.004
    }
  })
  // หมา/วัว/หมูย่อ-ขยายตามขนาดพันธุ์ในโมเดลเอง ชนิดอื่นย่อ-ขยายที่นี่
  const selfScaled = pet.species === 'dog' || pet.species === 'cow' || pet.species === 'pig'
  const outerScale = selfScaled ? 1 : pet.size === 'small' ? 0.75 : pet.size === 'large' ? 1.2 : 1
  return (
    <PetPoseContext.Provider value={pose ?? null}>
      <group ref={body} scale={outerScale}>
        <group ref={poseGroup}>
          <Model pet={pet} tex={tex} motion={motion} />
          {pet.held && pet.held !== 'none' && (
            <group scale={innerScale(pet)}>
              <PetHeld pet={pet} kind={pet.held} />
            </group>
          )}
          {pet.outfit && pet.outfit !== 'none' && (
            <group scale={innerScale(pet)}>
              <PetOutfit pet={pet} kind={pet.outfit} color={pet.outfitColor ?? '#d23a3a'} />
            </group>
          )}
          {pet.hat && pet.hat !== 'none' && (
            <group scale={innerScale(pet)}>
              <PetHat pet={pet} kind={pet.hat} color={pet.hatColor ?? '#e58fa0'} />
            </group>
          )}
        </group>
      </group>
    </PetPoseContext.Provider>
  )
}

/** ขนาดรวมของสัตว์ (ใช้หาตำแหน่งคอสำหรับสายจูง) */
export function petScale(pet: PetChoice) {
  const selfScaled = pet.species === 'dog' || pet.species === 'cow' || pet.species === 'pig'
  const outer = selfScaled ? 1 : pet.size === 'small' ? 0.75 : pet.size === 'large' ? 1.2 : 1
  return outer * innerScale(pet)
}

/** ขนาดที่โมเดลหมา/วัว/หมูใช้ภายใน (ชุดต้องย่อ-ขยายเท่ากันจึงจะพอดีตัว) */
function innerScale(pet: PetChoice) {
  switch (pet.species) {
    case 'dog':
      return pet.size === 'small' ? 0.72 : pet.size === 'large' ? 1.35 : 1
    case 'cow':
      return pet.size === 'large' ? 1.12 : 0.9
    case 'pig':
      return pet.size === 'small' ? 0.7 : 1
    default:
      return 1
  }
}
