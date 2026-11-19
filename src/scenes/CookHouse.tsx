import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Shape, type Texture } from 'three'

/**
 * บ้านหลังที่สอง (ทำกับข้าว · ผู้สร้างชอบมานอน) — ตามภาพอ้างอิงของผู้สร้าง 19 พ.ย.
 * เรือนไม้ใต้ถุนสูง ผนังไม้กระดานสีน้ำตาลเข้ม หลังคาสังกะสีลอนจั่ว + หลังคาเพิงคลุมชานหน้า
 * ชานหน้าบ้านมีราวลูกกรงไม้กลึง ผ้าขาวม้าตากบนราว · บันไดไม้มีราวจับ ขึ้นจากลานดินถึงชาน (ตีนบันไดเป็นแท่นปูน)
 * ใต้ถุน: แคร่ไม้ แกลลอนน้ำเหลือง/ฟ้า งอบกับเสื้อผ้าแขวนเสา เครื่องมือทำสวน รถมอเตอร์ไซค์
 * แกนบ้าน: หน้าบ้าน (ชาน + บันได) อยู่ทาง +z · กว้าง 5 (x) × ลึก 4 (z)
 */
function useCanvasTex(draw: (x: CanvasRenderingContext2D) => void, rx: number, ry: number, size = 128) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = size
    const x = c.getContext('2d')!
    draw(x)
    const t = new CanvasTexture(c)
    t.colorSpace = SRGBColorSpace
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(rx, ry)
    return t
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rx, ry, size])
}

const FLOOR = 1.65 // ความสูงพื้นชั้นบน (เตี้ยลงจาก 2.1 ตามผู้สร้าง 19 พ.ย.)
const W = 5
const BACK = -2 // ผนังหลัง
const FRONT_WALL = 0.5 // ผนังหน้าห้อง (ชานอยู่หน้าผนังนี้)
const EDGE = 2 // ขอบชาน
const WALL_H = 2.2

/** ใช้ทำฉากภายใน (เดินเข้าครัวได้) */
export function useCookTextures() {
  const plank = useCanvasTex((g) => {
    g.fillStyle = '#5e4630'
    g.fillRect(0, 0, 128, 128)
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 3 === 0 ? '#664c34' : i % 3 === 1 ? '#56402c' : '#5e4630'
      g.fillRect(i * 16 + 1, 0, 14, 128)
      g.fillStyle = '#3a2a1c'
      g.fillRect(i * 16, 0, 1.5, 128)
    }
  }, 3, 1)
  return plank
}

export function CookHouse({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  // ผนังไม้กระดานแนวตั้ง
  const plank = useCanvasTex((g) => {
    g.fillStyle = '#5e4630'
    g.fillRect(0, 0, 128, 128)
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 3 === 0 ? '#664c34' : i % 3 === 1 ? '#56402c' : '#5e4630'
      g.fillRect(i * 16 + 1, 0, 14, 128)
      g.fillStyle = '#3a2a1c'
      g.fillRect(i * 16, 0, 1.5, 128)
    }
  }, 3, 1)
  // สังกะสีลอน (ซีดสนิมนิด ๆ)
  const zinc = useCanvasTex((g) => {
    const grd = g.createLinearGradient(0, 0, 16, 0)
    grd.addColorStop(0, '#8e9294')
    grd.addColorStop(0.5, '#b4b8b8')
    grd.addColorStop(1, '#7c8082')
    for (let i = 0; i < 8; i++) {
      g.fillStyle = grd
      g.save()
      g.translate(i * 16, 0)
      g.fillRect(0, 0, 16, 128)
      g.restore()
    }
    g.fillStyle = 'rgba(140,90,50,0.25)'
    g.fillRect(30, 90, 40, 38)
    g.fillRect(95, 20, 20, 30)
  }, 6, 1)
  // ผ้าขาวม้าลายตาราง 2 ผืน
  const cloth1 = useCanvasTex((g) => {
    g.fillStyle = '#d9a020'
    g.fillRect(0, 0, 64, 64)
    g.fillStyle = 'rgba(200,40,40,0.75)'
    for (let i = 0; i < 64; i += 16) {
      g.fillRect(i, 0, 6, 64)
      g.fillRect(0, i, 64, 6)
    }
    g.fillStyle = 'rgba(40,110,60,0.7)'
    for (let i = 8; i < 64; i += 16) {
      g.fillRect(i, 0, 3, 64)
      g.fillRect(0, i, 64, 3)
    }
  }, 1, 1, 64)
  const cloth2 = useCanvasTex((g) => {
    g.fillStyle = '#f0f0f0'
    g.fillRect(0, 0, 64, 64)
    g.fillStyle = 'rgba(40,70,170,0.75)'
    for (let i = 0; i < 64; i += 10) {
      g.fillRect(i, 0, 5, 64)
      g.fillRect(0, i, 64, 5)
    }
    g.fillStyle = '#c03070'
    g.fillRect(0, 56, 64, 8)
  }, 1, 1, 64)

  const roomD = FRONT_WALL - BACK
  const gable = useMemo(() => {
    const s = new Shape()
    s.moveTo(-roomD / 2 - 0.05, 0)
    s.lineTo(roomD / 2 + 0.05, 0)
    s.lineTo(0, 0.95)
    s.closePath()
    return s
  }, [roomD])
  const wood = '#6a5038'
  const post = '#5a4632'
  const rail = '#8a7058'
  // ราวลูกกรงชาน: หน้า (เว้นช่องบันได x −1.7..−0.7) + สองข้าง
  const STAIR_X = -1.2
  const balusters: [number, number][] = []
  for (let bx = -2.35; bx <= 2.36; bx += 0.22) if (bx < STAIR_X - 0.55 || bx > STAIR_X + 0.55) balusters.push([bx, EDGE - 0.05])
  for (let bz = FRONT_WALL + 0.15; bz < EDGE - 0.1; bz += 0.22) {
    balusters.push([2.45, bz])
  }
  // บันได: จากพื้น (z = EDGE + RUN) ขึ้นถึงชาน (z = EDGE)
  const STEPS = 6
  const RUN = 1.85
  const slope = Math.atan2(FLOOR, RUN)
  const stairLen = Math.hypot(FLOOR, RUN)

  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* เสาใต้ถุน 3×3 บนตีนเสาปูน */}
      {[-2.35, 0, 2.35].flatMap((px) =>
        [BACK + 0.1, FRONT_WALL, EDGE - 0.05].map((pz) => (
          <group key={`${px}:${pz}`} position={[px, 0, pz]}>
            <mesh position={[0, 0.08, 0]} receiveShadow>
              <boxGeometry args={[0.32, 0.16, 0.32]} />
              <meshStandardMaterial color="#9a958a" roughness={1} />
            </mesh>
            <mesh position={[0, FLOOR / 2 + 0.08, 0]} castShadow>
              <boxGeometry args={[0.2, FLOOR, 0.2]} />
              <meshStandardMaterial color={post} roughness={0.9} />
            </mesh>
          </group>
        )),
      )}
      {/* พื้นชั้นบน + ตง */}
      <mesh position={[0, FLOOR + 0.06, (BACK + EDGE) / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.12, EDGE - BACK]} />
        <meshStandardMaterial color="#7a5e42" roughness={0.85} />
      </mesh>
      <mesh position={[0, FLOOR - 0.06, EDGE - 0.02]}>
        <boxGeometry args={[W + 0.1, 0.16, 0.1]} />
        <meshStandardMaterial color={post} />
      </mesh>
      {/* ห้องครัว: ผนังไม้กระดาน (กลวง มองเห็นข้างในผ่านประตู หน้าต่าง และระแนง) */}
      <KitchenRoom plank={plank} />
      <KitchenInterior />
      {/* ข้าวของแขวนผนังหน้า (ตะกร้า/กระติบ) */}
      <mesh position={[-0.6, FLOOR + 1.5, FRONT_WALL + 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.1, 0.12, 10]} />
        <meshStandardMaterial color="#c8a468" roughness={1} />
      </mesh>
      <mesh position={[-1.5, FLOOR + 1.4, FRONT_WALL + 0.06]} scale={[1, 1.3, 0.4]}>
        <sphereGeometry args={[0.14, 10, 8]} />
        <meshStandardMaterial color="#b89458" roughness={1} />
      </mesh>
      {/* หลังคาจั่วสังกะสี (สันขนานแกน x) คลุมห้อง */}
      {[-1, 1].map((sd) => {
        const run = roomD / 2 + 0.55
        const h = 1.0
        const ang = Math.atan2(h, run)
        const len = Math.hypot(h, run)
        const cz = (BACK + FRONT_WALL) / 2
        return (
          <mesh
            key={sd}
            position={[0, FLOOR + 0.12 + WALL_H + h / 2 - 0.05, cz + (sd * run) / 2]}
            rotation={[sd * ang, 0, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[W + 0.7, 0.04, len]} />
            <meshStandardMaterial map={zinc} metalness={0.45} roughness={0.5} side={2} />
          </mesh>
        )
      })}
      {/* หน้าจั่วไม้ 2 ข้าง */}
      {[-1, 1].map((sd) => (
        <mesh key={'g' + sd} position={[sd * (W / 2 - 0.05), FLOOR + 0.12 + WALL_H, (BACK + FRONT_WALL) / 2]} rotation={[0, sd * Math.PI / 2, 0]}>
          <shapeGeometry args={[gable]} />
          <meshStandardMaterial map={plank} side={2} />
        </mesh>
      ))}
      {/* ระเบียงข้างบ้าน (ด้านซ้าย −x) ยื่นออกไป 1.3 ม. ต่อจากชานหน้ายาวตลอดข้างบ้าน (ผู้สร้าง 19 พ.ย.) */}
      <SideBalcony rail={rail} post={post} />
      {/* หลังคาเพิงสังกะสีคลุมชานหน้า (ลาดลงทาง +z) */}
      <mesh position={[0, FLOOR + 0.12 + WALL_H - 0.2, (FRONT_WALL + EDGE + 0.5) / 2]} rotation={[0.2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.5, 0.04, EDGE + 0.5 - FRONT_WALL + 0.2]} />
        <meshStandardMaterial map={zinc} metalness={0.45} roughness={0.5} side={2} />
      </mesh>
      {/* เสาชาน รับหลังคาเพิง */}
      {[-2.35, 2.35].map((px) => (
        <mesh key={'vp' + px} position={[px, FLOOR + 0.12 + (WALL_H - 0.45) / 2, EDGE - 0.05]} castShadow>
          <boxGeometry args={[0.14, WALL_H - 0.45, 0.14]} />
          <meshStandardMaterial color={post} />
        </mesh>
      ))}
      {/* ราวชาน: ราวบน ราวล่าง ลูกกรงไม้กลึง */}
      {[
        [(-2.45 + STAIR_X - 0.55) / 2, EDGE - 0.05, STAIR_X - 0.55 + 2.45, 0],
        [(2.45 + STAIR_X + 0.55) / 2, EDGE - 0.05, 2.45 - STAIR_X - 0.55, 0],
        [2.45, (FRONT_WALL + EDGE) / 2, EDGE - FRONT_WALL, Math.PI / 2],
      ].map(([px, pz, len, r], i) =>
        [0.15, 0.92].map((y) => (
          <mesh key={`r${i}${y}`} position={[px, FLOOR + 0.12 + y, pz]} rotation={[0, r, 0]}>
            <boxGeometry args={[len, y > 0.5 ? 0.08 : 0.06, y > 0.5 ? 0.12 : 0.06]} />
            <meshStandardMaterial color={rail} roughness={0.8} />
          </mesh>
        )),
      )}
      {balusters.map(([bx, bz], i) => (
        <group key={'b' + i} position={[bx, FLOOR + 0.12, bz]}>
          <mesh position={[0, 0.53, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.72, 6]} />
            <meshStandardMaterial color={rail} />
          </mesh>
          <mesh position={[0, 0.53, 0]}>
            <sphereGeometry args={[0.04, 6, 5]} />
            <meshStandardMaterial color={rail} />
          </mesh>
        </group>
      ))}
      {/* ผ้าขาวม้าตากบนราวชาน */}
      <mesh position={[0.4, FLOOR + 0.12 + 0.62, EDGE + 0.02]}>
        <boxGeometry args={[0.85, 0.65, 0.02]} />
        <meshStandardMaterial map={cloth1} roughness={1} />
      </mesh>
      <mesh position={[1.7, FLOOR + 0.12 + 0.62, EDGE + 0.02]}>
        <boxGeometry args={[0.75, 0.6, 0.02]} />
        <meshStandardMaterial map={cloth2} roughness={1} />
      </mesh>
      {/* บันไดไม้ + ราวจับ */}
      <group position={[STAIR_X, 0, EDGE]}>
        {[-0.5, 0.5].map((sx) => (
          <mesh key={'st' + sx} position={[sx, FLOOR / 2 + 0.1, RUN / 2]} rotation={[slope, 0, 0]} castShadow>
            <boxGeometry args={[0.07, 0.24, stairLen]} />
            <meshStandardMaterial color={wood} />
          </mesh>
        ))}
        {Array.from({ length: STEPS }, (_, k) => {
          const t = (k + 1) / (STEPS + 1)
          return (
            <mesh key={'tr' + k} position={[0, FLOOR * (1 - t) + 0.12, RUN * t]} castShadow receiveShadow>
              <boxGeometry args={[0.95, 0.05, 0.28]} />
              <meshStandardMaterial color="#8a6a4a" roughness={0.85} />
            </mesh>
          )
        })}
        {[-0.56, 0.56].map((sx) => (
          <group key={'hr' + sx}>
            {/* เสาราวตีนบันได */}
            <mesh position={[sx, 0.55, RUN - 0.05]} castShadow>
              <boxGeometry args={[0.12, 1.1, 0.12]} />
              <meshStandardMaterial color={rail} />
            </mesh>
            {/* ราวจับเอียงตามบันได */}
            <mesh position={[sx, FLOOR / 2 + 0.95, RUN / 2]} rotation={[slope, 0, 0]}>
              <boxGeometry args={[0.07, 0.07, stairLen]} />
              <meshStandardMaterial color={rail} />
            </mesh>
            {/* ลูกกรงราวบันได */}
            {[0.2, 0.35, 0.5, 0.65, 0.8].map((t) => (
              <mesh key={t} position={[sx, FLOOR * (1 - t) + 0.12 + 0.42, RUN * t]}>
                <boxGeometry args={[0.035, 0.84, 0.035]} />
                <meshStandardMaterial color={rail} />
              </mesh>
            ))}
          </group>
        ))}
        {/* แท่นปูนตีนบันได */}
        <mesh position={[0, 0.06, RUN + 0.3]} receiveShadow>
          <boxGeometry args={[1.4, 0.12, 0.7]} />
          <meshStandardMaterial color="#9a978e" roughness={1} />
        </mesh>
      </group>
      {/* ใต้ถุน: แคร่ไม้ */}
      <group position={[1.2, 0, 1.1]}>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.6, 0.06, 0.7]} />
          <meshStandardMaterial color="#8a6a4a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.72, -0.33]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[1.6, 0.5, 0.05]} />
          <meshStandardMaterial color="#7a5a3a" roughness={0.9} />
        </mesh>
        {[-0.7, 0.7].flatMap((lx) =>
          [-0.28, 0.28].map((lz) => (
            <mesh key={`${lx}${lz}`} position={[lx, 0.2, lz]}>
              <boxGeometry args={[0.07, 0.4, 0.07]} />
              <meshStandardMaterial color="#5a4030" />
            </mesh>
          )),
        )}
      </group>
      {/* แกลลอนน้ำเหลือง + ฟ้า บนแท่นไม้ */}
      <mesh position={[2.0, 0.12, 0.2]}>
        <boxGeometry args={[0.8, 0.12, 0.4]} />
        <meshStandardMaterial color="#7a5a3a" />
      </mesh>
      {[
        [1.82, '#e8d890'],
        [2.2, '#3a8ad0'],
      ].map(([gx, col]) => (
        <group key={gx as number} position={[gx as number, 0.18, 0.2]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.3, 0.4, 0.26]} />
            <meshStandardMaterial color={col as string} roughness={0.5} />
          </mesh>
          <mesh position={[0.05, 0.44, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.06, 8]} />
            <meshStandardMaterial color={col as string} />
          </mesh>
        </group>
      ))}
      {/* งอบ + หมวกแขวนเสา และเสื้อผ้าแขวนราวใต้ถุน */}
      <mesh position={[2.35, 1.2, FRONT_WALL + 0.14]} rotation={[Math.PI / 2 - 0.2, 0, 0]}>
        <coneGeometry args={[0.24, 0.12, 14]} />
        <meshStandardMaterial color="#c8b080" roughness={1} />
      </mesh>
      <mesh position={[0, 1.3, FRONT_WALL + 0.14]} rotation={[Math.PI / 2 - 0.2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.08, 12]} />
        <meshStandardMaterial color="#2a2a2a" roughness={1} />
      </mesh>
      <mesh position={[1.2, 1.45, FRONT_WALL]}>
        <boxGeometry args={[2.3, 0.02, 0.02]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {[
        [0.7, '#b8303a', 0.6],
        [1.15, '#2a2a30', 0.7],
        [1.6, '#a83040', 0.55],
      ].map(([cx, col, h]) => (
        <mesh key={cx as number} position={[cx as number, 1.45 - (h as number) / 2, FRONT_WALL]}>
          <boxGeometry args={[0.38, h as number, 0.04]} />
          <meshStandardMaterial color={col as string} roughness={1} />
        </mesh>
      ))}
      {/* เครื่องมือทำสวนพิงเสาหลัง */}
      {[-1.6, -1.2, -0.8].map((dx, i) => (
        <mesh key={dx} position={[dx, 0.7, BACK + 0.25]} rotation={[0, 0, 0.12 * (i - 1)]}>
          <cylinderGeometry args={[0.025, 0.025, 1.4, 6]} />
          <meshStandardMaterial color="#a0784a" />
        </mesh>
      ))}
      {/* รถมอเตอร์ไซค์จอดใต้ถุน */}
      <group position={[0.9, 0, -0.9]}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.4, 0.3, 0.3]} />
          <meshStandardMaterial color="#c2412d" />
        </mesh>
        {[-0.6, 0.6].map((wx) => (
          <mesh key={wx} position={[wx, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.28, 0.07, 8, 16]} />
            <meshStandardMaterial color="#2a2a2c" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export const F = FLOOR + 0.12 // ระดับพื้นห้อง
const DOOR: [number, number] = [0.02, 0.98] // ช่องประตูหน้า (x)
const WIN: [number, number] = [1.3, 2.3] // ช่องหน้าต่างหน้า (x) สูง 0.9–1.9

/** ผนังห้องครัวแบบกลวง: ผนังหน้ามีประตูเปิด + หน้าต่างบานเปิด · ผนังข้างครึ่งล่างทึบ ครึ่งบนเป็นระแนงไม้ (ลมผ่าน ควันออก) */
export function KitchenRoom({ plank }: { plank: Texture }) {
  const cz = (BACK + FRONT_WALL) / 2
  const D = FRONT_WALL - BACK
  const T = 0.06
  const x0 = -W / 2 + 0.05
  const x1 = W / 2 - 0.05
  const wall = <meshStandardMaterial map={plank} roughness={0.85} side={2} />
  // ชิ้นผนังหน้า [xa, xb, ya, yb]
  const front: [number, number, number, number][] = [
    [x0, DOOR[0], 0, WALL_H],
    [DOOR[0], DOOR[1], 1.95, WALL_H],
    [DOOR[1], WIN[0], 0, WALL_H],
    [WIN[0], WIN[1], 0, 0.9],
    [WIN[0], WIN[1], 1.9, WALL_H],
    [WIN[1], x1, 0, WALL_H],
  ]
  const slats = Array.from({ length: 14 }, (_, i) => BACK + 0.15 + (i * (D - 0.3)) / 13)
  return (
    <group>
      {front.map(([a, b, ya, yb], i) => (
        <mesh key={'fw' + i} position={[(a + b) / 2, F + (ya + yb) / 2, FRONT_WALL]} castShadow receiveShadow>
          <boxGeometry args={[b - a, yb - ya, T]} />
          {wall}
        </mesh>
      ))}
      {/* บานหน้าต่างไม้เปิดออก */}
      <mesh position={[WIN[1] + 0.02, F + 1.4, FRONT_WALL + 0.48]} rotation={[0, -Math.PI / 2 + 0.25, 0]}>
        <boxGeometry args={[0.95, 1.0, 0.04]} />
        {wall}
      </mesh>
      {/* บานประตูไม้เปิดพับเข้าด้านใน */}
      <mesh position={[DOOR[0] + 0.05, F + 0.97, FRONT_WALL - 0.45]} rotation={[0, Math.PI / 2 - 0.15, 0]}>
        <boxGeometry args={[0.92, 1.92, 0.04]} />
        <meshStandardMaterial color="#6a4e34" roughness={0.85} />
      </mesh>
      {/* ผนังหลัง (ทึบ) */}
      <mesh position={[0, F + WALL_H / 2, BACK]} castShadow receiveShadow>
        <boxGeometry args={[W - 0.1, WALL_H, T]} />
        {wall}
      </mesh>
      {/* ผนังข้าง: ล่างทึบ 1.0 ม. + ระแนงตั้ง + คานบน */}
      {[x0, x1].map((sx) => (
        <group key={'sw' + sx}>
          <mesh position={[sx, F + 0.5, cz]} castShadow receiveShadow>
            <boxGeometry args={[T, 1.0, D]} />
            {wall}
          </mesh>
          <mesh position={[sx, F + WALL_H - 0.08, cz]}>
            <boxGeometry args={[T + 0.02, 0.16, D]} />
            <meshStandardMaterial color="#5a4632" />
          </mesh>
          {slats.map((sz) => (
            <mesh key={sz} position={[sx, F + 1.0 + (WALL_H - 1.16) / 2, sz]} castShadow>
              <boxGeometry args={[0.05, WALL_H - 1.16, 0.07]} />
              <meshStandardMaterial color="#6e5640" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

/** ของในครัว (ตามภาพอ้างอิง): โต๊ะไม้ยาวริมผนังหลัง ครกหิน เขียง ตะกร้าพริก กระเทียม ตะไคร้ ใบโหระพา มะกรูด
 *  กระติบข้าวเหนียว ชามดินเผาซ้อน ขวดเครื่องเทศ · ชั้นไม้วางหม้อดินกับตะกร้าสาน · เตาแก๊สกับกระทะ · พวงสมุนไพรแห้งห้อย */
export function KitchenInterior() {
  const top = F + 0.82
  const cz = BACK + 0.4 // แนวโต๊ะชิดผนังหลัง
  const clay = '#b0643a'
  const weave = '#c8a468'
  return (
    <group>
      {/* โต๊ะไม้ยาว */}
      <mesh position={[-0.4, top - 0.03, cz]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.06, 0.62]} />
        <meshStandardMaterial color="#7a5e44" roughness={0.9} />
      </mesh>
      {[-2, 1.2].flatMap((lx) =>
        [cz - 0.25, cz + 0.25].map((lz) => (
          <mesh key={`${lx}${lz}`} position={[lx, F + 0.4, lz]}>
            <boxGeometry args={[0.07, 0.8, 0.07]} />
            <meshStandardMaterial color="#5a4632" />
          </mesh>
        )),
      )}
      <mesh position={[-0.4, F + 0.2, cz]}>
        <boxGeometry args={[3.2, 0.04, 0.5]} />
        <meshStandardMaterial color="#6a5038" />
      </mesh>
      {/* ครกหินกับสาก มีพริกในครก */}
      <group position={[-0.6, top, cz + 0.05]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.11, 0.2, 12]} />
          <meshStandardMaterial color="#6e6e68" roughness={1} />
        </mesh>
        <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.11, 12]} />
          <meshStandardMaterial color="#c0301e" />
        </mesh>
        <mesh position={[0.05, 0.3, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.025, 0.035, 0.32, 8]} />
          <meshStandardMaterial color="#5e5e58" />
        </mesh>
      </group>
      {/* เขียงไม้กลม + มีด */}
      <group position={[0.3, top, cz + 0.05]}>
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.08, 16]} />
          <meshStandardMaterial color="#9a7448" />
        </mesh>
        <mesh position={[0, 0.085, 0]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[0.24, 0.008, 0.04]} />
          <meshStandardMaterial color="#c8ccd0" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      {/* กระด้ง/ตะกร้า: พริก · กระเทียม · ใบโหระพา */}
      {(
        [
          [-1.7, '#c0301e'],
          [-1.25, '#ece4d0'],
          [0.8, '#4a8a34'],
        ] as [number, string][]
      ).map(([bx, col]) => (
        <group key={bx} position={[bx, top, cz + 0.08]}>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.19, 0.15, 0.06, 14]} />
            <meshStandardMaterial color={weave} roughness={1} />
          </mesh>
          {[0, 1, 2, 3, 4].map((k) => (
            <mesh key={k} position={[Math.cos(k * 1.3) * 0.08, 0.07, Math.sin(k * 1.3) * 0.08]}>
              <sphereGeometry args={[0.05, 6, 5]} />
              <meshStandardMaterial color={col} roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
      {/* ตะไคร้ + ลูกมะกรูด */}
      {[0, 1, 2, 3].map((k) => (
        <mesh key={'lg' + k} position={[-0.15, top + 0.02 + k * 0.012, cz + 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.016, 0.5, 5]} />
          <meshStandardMaterial color="#d8e0a8" />
        </mesh>
      ))}
      {[0, 1].map((k) => (
        <mesh key={'mk' + k} position={[0.05 + k * 0.08, top + 0.04, cz + 0.12]}>
          <dodecahedronGeometry args={[0.04, 0]} />
          <meshStandardMaterial color="#5a8e34" flatShading />
        </mesh>
      ))}
      {/* กระติบข้าวเหนียว 2 ใบ + ชามดินเผาซ้อน */}
      {[
        [-0.95, 0.24],
        [-1.1, 0.18],
      ].map(([gx, h], k) => (
        <mesh key={'kt' + k} position={[gx, top + h / 2, cz - 0.18 + k * 0.05]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, h, 12]} />
          <meshStandardMaterial color={weave} roughness={1} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((k) => (
        <mesh key={'bw' + k} position={[0.0, top + 0.03 + k * 0.035, cz - 0.15]}>
          <cylinderGeometry args={[0.13, 0.08, 0.05, 14, 1, true]} />
          <meshStandardMaterial color={clay} roughness={0.8} side={2} />
        </mesh>
      ))}
      {/* ขวดโหลเครื่องเทศเรียงริมโต๊ะ */}
      {[-2.0, -1.9, -1.8, -1.7].map((jx, k) => (
        <group key={'jar' + k} position={[jx, top, cz - 0.22]}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.16, 10]} />
            <meshStandardMaterial color={['#c08040', '#e0d0b0', '#a03020', '#806040'][k]} transparent opacity={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.042, 0.042, 0.025, 10]} />
            <meshStandardMaterial color="#b0b0b0" metalness={0.6} />
          </mesh>
        </group>
      ))}
      {/* โหลแก้วใส่น้ำ */}
      <mesh position={[0.6, top + 0.12, cz - 0.18]}>
        <cylinderGeometry args={[0.07, 0.07, 0.24, 12]} />
        <meshStandardMaterial color="#cfe6ee" transparent opacity={0.45} roughness={0.05} />
      </mesh>
      {/* โต๊ะเตาแก๊ส + กระทะเหล็ก (มุมขวาของห้อง) + หม้อใต้โต๊ะ */}
      <group position={[1.85, 0, BACK + 0.4]}>
        <mesh position={[0, F + 0.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.06, 0.6]} />
          <meshStandardMaterial color="#7a5e44" />
        </mesh>
        {[-0.4, 0.4].flatMap((lx) =>
          [-0.25, 0.25].map((lz) => (
            <mesh key={`${lx}${lz}`} position={[lx, F + 0.35, lz]}>
              <boxGeometry args={[0.06, 0.7, 0.06]} />
              <meshStandardMaterial color="#5a4632" />
            </mesh>
          )),
        )}
        <mesh position={[0, F + 0.78, 0]}>
          <boxGeometry args={[0.5, 0.1, 0.36]} />
          <meshStandardMaterial color="#c8ccd2" metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0, F + 0.9, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
          <meshStandardMaterial color="#1e1e20" metalness={0.5} roughness={0.5} side={2} />
        </mesh>
        <mesh position={[0, F + 0.3, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 14]} />
          <meshStandardMaterial color="#a8acb0" metalness={0.6} roughness={0.35} />
        </mesh>
      </group>
      {/* ชั้นไม้ติดผนังข้าง (ซ้าย) 2 ชั้น: หม้อดินมีฝา ชามดินเผา ตะกร้าสาน */}
      <group position={[-W / 2 + 0.3, 0, -0.5]}>
        {[1.3, 1.75].map((h) => (
          <mesh key={h} position={[0, F + h, 0]} castShadow>
            <boxGeometry args={[0.4, 0.04, 1.4]} />
            <meshStandardMaterial color="#7a5e44" />
          </mesh>
        ))}
        {[-0.45, 0.1].map((pz, k) => (
          <group key={'pot' + k} position={[0, F + 1.32 + k * 0.45, pz]}>
            <mesh position={[0, 0.12, 0]} scale={[1, 0.8, 1]} castShadow>
              <sphereGeometry args={[0.15, 14, 10]} />
              <meshStandardMaterial color={clay} roughness={0.75} />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.07, 0.11, 0.05, 12]} />
              <meshStandardMaterial color="#a05a32" />
            </mesh>
          </group>
        ))}
        <mesh position={[0, F + 1.45, 0.45]} castShadow>
          <cylinderGeometry args={[0.16, 0.12, 0.22, 12]} />
          <meshStandardMaterial color={weave} roughness={1} />
        </mesh>
        <mesh position={[0, F + 1.9, -0.25]}>
          <cylinderGeometry args={[0.15, 0.13, 0.25, 12]} />
          <meshStandardMaterial color={weave} roughness={1} />
        </mesh>
        <mesh position={[0, F + 1.85, 0.45]}>
          <cylinderGeometry args={[0.13, 0.09, 0.12, 12]} />
          <meshStandardMaterial color={clay} roughness={0.8} />
        </mesh>
      </group>
      {/* พวงสมุนไพรแห้งห้อยจากขื่อ */}
      {[-1.4, -0.9].map((hx) => (
        <group key={hx} position={[hx, F + WALL_H - 0.2, -0.4]}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.2, 4]} />
            <meshStandardMaterial color="#5a4a3a" />
          </mesh>
          <mesh position={[0, -0.12, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.09, 0.3, 7]} />
            <meshStandardMaterial color="#7a6440" roughness={1} />
          </mesh>
        </group>
      ))}
      {/* ขื่อรับหลังคา (เห็นจากข้างใน) */}
      <mesh position={[0, F + WALL_H - 0.05, -0.4]}>
        <boxGeometry args={[W - 0.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#5a4632" />
      </mesh>
      {/* ผ้าเช็ดมือบนโต๊ะ */}
      <mesh position={[0.65, top + 0.005, cz + 0.15]}>
        <boxGeometry args={[0.25, 0.01, 0.15]} />
        <meshStandardMaterial color="#e8ddd4" />
      </mesh>
    </group>
  )
}

/** ระเบียงยื่นข้างบ้าน: พื้นไม้ต่อจากชาน เสาค้ำใต้ระเบียง ราวลูกกรงไม้กลึงรอบนอก */
function SideBalcony({ rail, post }: { rail: string; post: string }) {
  const X0 = -W / 2 // ชิดผนังข้าง
  const X1 = -W / 2 - 1.3 // ขอบนอก
  const Z0 = BACK
  const Z1 = EDGE
  const y = FLOOR + 0.12
  const bal: [number, number][] = []
  for (let z = Z0 + 0.1; z <= Z1 - 0.05; z += 0.22) bal.push([X1 + 0.05, z])
  for (let x = X1 + 0.25; x < X0 - 0.1; x += 0.22) {
    bal.push([x, Z0 + 0.05])
    bal.push([x, Z1 - 0.05])
  }
  return (
    <group>
      <mesh position={[(X0 + X1) / 2, FLOOR + 0.06, (Z0 + Z1) / 2]} castShadow receiveShadow>
        <boxGeometry args={[X0 - X1, 0.12, Z1 - Z0]} />
        <meshStandardMaterial color="#7a5e42" roughness={0.85} />
      </mesh>
      {/* เสาค้ำใต้ระเบียง */}
      {[Z0 + 0.1, (Z0 + Z1) / 2, Z1 - 0.1].map((pz) => (
        <group key={pz} position={[X1 + 0.1, 0, pz]}>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.28, 0.16, 0.28]} />
            <meshStandardMaterial color="#9a958a" roughness={1} />
          </mesh>
          <mesh position={[0, FLOOR / 2 + 0.08, 0]} castShadow>
            <boxGeometry args={[0.16, FLOOR, 0.16]} />
            <meshStandardMaterial color={post} roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* ราวบน-ล่าง 3 ด้าน */}
      {[
        [X1 + 0.05, (Z0 + Z1) / 2, Z1 - Z0, Math.PI / 2],
        [(X0 + X1) / 2, Z0 + 0.05, X0 - X1, 0],
        [(X0 + X1) / 2, Z1 - 0.05, X0 - X1, 0],
      ].flatMap(([px, pz, len, r], i) =>
        [0.15, 0.92].map((h) => (
          <mesh key={i + ':' + h} position={[px, y + h, pz]} rotation={[0, r, 0]}>
            <boxGeometry args={[len, h > 0.5 ? 0.08 : 0.06, h > 0.5 ? 0.12 : 0.06]} />
            <meshStandardMaterial color={rail} roughness={0.8} />
          </mesh>
        )),
      )}
      {bal.map(([bx, bz], i) => (
        <mesh key={'sb' + i} position={[bx, y + 0.53, bz]}>
          <cylinderGeometry args={[0.025, 0.025, 0.72, 6]} />
          <meshStandardMaterial color={rail} />
        </mesh>
      ))}
      {/* เสาหัวมุมราว */}
      {[Z0 + 0.05, Z1 - 0.05].map((pz) => (
        <mesh key={'cp' + pz} position={[X1 + 0.05, y + 0.55, pz]}>
          <boxGeometry args={[0.1, 1.1, 0.1]} />
          <meshStandardMaterial color={post} />
        </mesh>
      ))}
    </group>
  )
}
