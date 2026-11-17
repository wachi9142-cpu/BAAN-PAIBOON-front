import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useMerit } from '../game/templeActions'
import { LatheGeometry, Shape, Vector2 } from 'three'
import { RBox } from './models/RBox'
import { SignBoard } from './SignBoard'
import { GableRoof } from './models/House'
import { BIRTH_DAYS, SPOT_LOCAL, TEMPLE } from '../game/content/temple'
import { useGame } from '../game/store'

/**
 * โบสถ์วัด (เดินเข้าไปข้างในได้) — พิกัดภายในกลุ่ม: หน้าโบสถ์หันไปทาง +z (ทางหมู่บ้าน)
 * ภายใน: ผนังแดงลายทอง พระประธานสีทองบนฐานชุกชี พระยืนซ้าย-ขวา โต๊ะหมู่บูชา พรมแดง
 */
export function Temple({ placeZ }: { placeZ: number }) {
  const goldLeaf = useGame((s) => s.save?.goldLeaf ?? 0)
  const { hallW: W, hallD: D, wallH: H, door } = TEMPLE
  const offZ = TEMPLE.pos[1] - placeZ
  const t = 0.35 // ความหนาผนัง
  const floorY = TEMPLE.floorY
  // โทนวิหารไม้อีสาน: ผนังไม้ เสาไม้เข้ม ฐานหิน หลังคากระเบื้องดินเผา
  const cream = '#9a6a42'
  const post = '#6b4428'
  const red = '#8a2b25'
  const gold = '#d9a441'
  const sideWall = (x: number) => (
    <group position={[x, floorY + H / 2, 0]}>
      <mesh castShadow receiveShadow>
        <RBox args={[t, H, D]} />
        <meshStandardMaterial color={cream} />
      </mesh>
      {/* ผนังด้านในสีแดง */}
      <mesh position={[-Math.sign(x) * (t / 2 + 0.01), 0, 0]}>
        <boxGeometry args={[0.02, H - 0.1, D - 0.4]} />
        <meshStandardMaterial color={red} />
      </mesh>
      {/* ลายทองบนผนังด้านใน */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[-Math.sign(x) * (t / 2 + 0.03), 0.2, -D / 2 + 2 + i * ((D - 4) / 5)]} rotation={[0, Math.sign(x) * Math.PI / 2, 0]}>
          <circleGeometry args={[0.35, 4]} />
          <meshStandardMaterial color={gold} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
  const frontSeg = (W - door) / 2
  const gable = useMemo(() => {
    const sh = new Shape()
    sh.moveTo(-W / 2 - 0.6, 0)
    sh.lineTo(W / 2 + 0.6, 0)
    sh.lineTo(0, 3.0)
    sh.closePath()
    return sh
  }, [W])
  return (
    <group position={[0, 0, offZ]}>
      {/* ลานวัด */}
      <mesh position={[0, 0.03, D / 2 + 3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W + 16, D + 14]} />
        <meshStandardMaterial color="#e3d6b8" />
      </mesh>
      {/* ฐานยกพื้น + บันไดหน้า */}
      {/* ฐานหินยกสูง (รวมระเบียงหน้า) */}
      <mesh position={[0, floorY / 2, (TEMPLE.porch - 1) / 2 + 0.5]} castShadow receiveShadow>
        <RBox args={[W + 2, floorY, D + 1 + TEMPLE.porch]} />
        <meshStandardMaterial color="#b8ad98" />
      </mesh>
      {/* แนวหินขอบฐาน */}
      <mesh position={[0, floorY - 0.06, (TEMPLE.porch - 1) / 2 + 0.5]}>
        <RBox args={[W + 2.3, 0.14, D + 1.3 + TEMPLE.porch]} />
        <meshStandardMaterial color="#9e927c" />
      </mesh>
      {/* พื้นระเบียงไม้ */}
      <mesh position={[0, floorY + 0.04, D / 2 + TEMPLE.porch / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W + 1.6, TEMPLE.porch - 0.2]} />
        <meshStandardMaterial color="#a87a4e" />
      </mesh>
      {/* บันไดหินหน้า 5 ขั้น + ราวบันไดสองข้าง */}
      {Array.from({ length: 5 }).map((_, i) => {
        const h = (floorY / 5) * (5 - i)
        return (
          <mesh key={i} position={[0, h / 2, D / 2 + TEMPLE.porch + (i + 0.5) * (TEMPLE.stairLen / 5)]} receiveShadow castShadow>
            <RBox args={[door + 1.6, h, TEMPLE.stairLen / 5]} />
            <meshStandardMaterial color={i % 2 ? '#c9bfa8' : '#c2b79e'} />
          </mesh>
        )
      })}
      {[-1, 1].map((sx) => (
        <mesh key={'bal' + sx} position={[sx * (door / 2 + 1.0), floorY * 0.55, D / 2 + TEMPLE.porch + TEMPLE.stairLen / 2]} rotation={[-Math.atan2(floorY, TEMPLE.stairLen), 0, 0]} castShadow>
          <RBox args={[0.35, 0.5, Math.hypot(TEMPLE.stairLen, floorY) + 0.2]} />
          <meshStandardMaterial color="#a89c84" />
        </mesh>
      ))}
      {/* เสาไม้รอบระเบียงข้าง + ราวระเบียง */}
      {[-1, 1].map((sx) => (
        <mesh key={'rail' + sx} position={[sx * (W / 2 + 0.75), floorY + 0.55, 0]}>
          <RBox args={[0.12, 0.1, D]} />
          <meshStandardMaterial color={post} />
        </mesh>
      ))}
      {/* พื้นกระเบื้องในโบสถ์ */}
      <mesh position={[0, floorY + 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W - 0.4, D - 0.4]} />
        <meshStandardMaterial color="#e9e0cc" />
      </mesh>
      {/* พรมแดงจากประตูถึงพระประธาน */}
      <mesh position={[0, floorY + 0.07, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, D - 4]} />
        <meshStandardMaterial color="#a8323a" />
      </mesh>

      {/* ผนัง */}
      {sideWall(-W / 2)}
      {sideWall(W / 2)}
      <group position={[0, floorY + H / 2, -D / 2]}>
        <mesh castShadow receiveShadow>
          <RBox args={[W, H, t]} />
          <meshStandardMaterial color={cream} />
        </mesh>
        <mesh position={[0, 0, t / 2 + 0.01]}>
          <boxGeometry args={[W - 0.6, H - 0.1, 0.02]} />
          <meshStandardMaterial color={red} />
        </mesh>
      </group>
      {/* ผนังหน้า: เว้นช่องประตูตรงกลาง */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (door / 2 + frontSeg / 2), floorY + H / 2, D / 2]}>
          <mesh castShadow receiveShadow>
            <RBox args={[frontSeg, H, t]} />
            <meshStandardMaterial color={cream} />
          </mesh>
          <mesh position={[0, 0, -t / 2 - 0.01]}>
            <boxGeometry args={[frontSeg - 0.3, H - 0.1, 0.02]} />
            <meshStandardMaterial color={red} />
          </mesh>
        </group>
      ))}
      {/* ทับหลังเหนือประตู + กรอบประตูทอง */}
      <mesh position={[0, floorY + H - 0.6, D / 2]} castShadow>
        <RBox args={[door + 0.2, 1.2, t]} />
        <meshStandardMaterial color={cream} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={'f' + s} position={[s * (door / 2), floorY + (H - 1.2) / 2, D / 2 + 0.2]}>
          <RBox args={[0.18, H - 1.2, 0.12]} />
          <meshStandardMaterial color={gold} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      {/* เสาระเบียงรอบโบสถ์ */}
      {[-1, 1].flatMap((s) =>
        Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`p${s}${i}`} position={[s * (W / 2 + 0.7), floorY + H / 2, -D / 2 + 1 + i * ((D - 2) / 4)]} castShadow>
            <cylinderGeometry args={[0.2, 0.24, H, 14]} />
            <meshStandardMaterial color={post} />
          </mesh>
        )),
      )}

      {/* หลังคาซ้อนสองชั้น สันหลังคาตามแนวยาวของโบสถ์ */}
      <group position={[0, floorY, 0]} rotation={[0, Math.PI / 2, 0]}>
        <GableRoof width={W + 3.3} depth={D + 2.3} height={3.1} y={H - 0.1} color="#efe6d6" overhang={0.4} />
        <GableRoof width={W + 2.8} depth={D + 1.8} height={3} y={H} color="#9a4430" overhang={0.4} />
        <GableRoof width={W * 0.7} depth={D * 0.78} height={2.6} y={H + 1.9} color="#a8492e" overhang={0.3} />
      </group>
      {/* ช่อฟ้า */}
      {[-1, 1].map((s) => (
        <mesh key={'c' + s} position={[0, floorY + H + 4.6, s * D * 0.36]} rotation={[s * 0.45, 0, 0]}>
          <coneGeometry args={[0.18, 1.5, 12]} />
          <meshStandardMaterial color={gold} metalness={0.5} roughness={0.3} />
        </mesh>
      ))}

      {/* หน้าบันสีทอง (หน้าจั่ว) ด้านหน้าและหลัง */}
      {[1, -1].map((s) => (
        <group key={'g' + s} position={[0, floorY + H + 0.05, s * (D / 2 + 0.95)]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
          <mesh>
            <shapeGeometry args={[gable]} />
            <meshStandardMaterial color={gold} metalness={0.45} roughness={0.35} side={2} />
          </mesh>
          {/* ลายในหน้าบัน */}
          {[-1.6, 0, 1.6].map((x) => (
            <mesh key={x} position={[x, 0.9 - Math.abs(x) * 0.35, 0.05]}>
              <circleGeometry args={[0.32, 3, Math.PI / 2]} />
              <meshStandardMaterial color="#b8862a" metalness={0.4} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
      {/* ช่อฟ้า/หางหงส์ ที่มุมชายคา */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`h${sx}${sz}`} position={[sx * (W / 2 + 1.5), floorY + H + 0.35, sz * (D / 2 + 1.0)]} rotation={[sz * -0.5, 0, sx * -0.5]}>
            <coneGeometry args={[0.14, 1.1, 10]} />
            <meshStandardMaterial color={gold} metalness={0.5} roughness={0.3} />
          </mesh>
        )),
      )}
      {/* มุขหน้า: เสาขาวหัวเสาทอง 4 ต้น + หลังคามุข */}
      {[-3.2, -1.3, 1.3, 3.2].map((x) => (
        <group key={'c' + x} position={[x, floorY, D / 2 + 1.6]}>
          <mesh position={[0, H / 2, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.26, H, 16]} />
            <meshStandardMaterial color={post} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <RBox args={[0.7, 0.5, 0.7]} />
            <meshStandardMaterial color={gold} metalness={0.4} roughness={0.35} />
          </mesh>
          <mesh position={[0, H - 0.2, 0]}>
            <cylinderGeometry args={[0.36, 0.26, 0.45, 16]} />
            <meshStandardMaterial color={gold} metalness={0.4} roughness={0.35} />
          </mesh>
        </group>
      ))}
      <group position={[0, floorY, D / 2 + 1.6]} rotation={[0, Math.PI / 2, 0]}>
        <GableRoof width={8.6} depth={3.4} height={2.2} y={H + 0.05} color="#9a4430" overhang={0.3} />
      </group>
      <group position={[0, floorY + H + 0.1, D / 2 + 3.3]}>
        <mesh scale={0.62}>
          <shapeGeometry args={[gable]} />
          <meshStandardMaterial color={gold} metalness={0.45} roughness={0.35} side={2} />
        </mesh>
      </group>
      {/* หน้าต่างแดงซุ้มทองด้านข้าง */}
      {[-1, 1].flatMap((sx) =>
        [-6, -1.5, 3].map((z) => (
          <group key={`w${sx}${z}`} position={[sx * (W / 2 + 0.19), floorY + 2.1, z]} rotation={[0, sx * Math.PI / 2, 0]}>
            <mesh>
              <planeGeometry args={[1.1, 1.8]} />
              <meshStandardMaterial color="#b8323a" />
            </mesh>
            <mesh position={[0, 1.15, 0.01]}>
              <circleGeometry args={[0.75, 3, Math.PI / 2]} />
              <meshStandardMaterial color={gold} metalness={0.45} roughness={0.35} />
            </mesh>
            {[-1, 1].map((k) => (
              <mesh key={k} position={[k * 0.62, 0, 0.01]}>
                <planeGeometry args={[0.14, 1.9]} />
                <meshStandardMaterial color={gold} metalness={0.45} roughness={0.35} />
              </mesh>
            ))}
          </group>
        )),
      )}
      {/* บานประตูแดงเปิดอยู่ */}
      {[-1, 1].map((sx) => (
        <mesh key={'d' + sx} position={[sx * (TEMPLE.door / 2 + 0.55), floorY + (H - 1.2) / 2, D / 2 + 0.4]} rotation={[0, sx * 0.4, 0]}>
          <RBox args={[1.2, H - 1.3, 0.1]} />
          <meshStandardMaterial color="#b8323a" />
        </mesh>
      ))}
      {/* ซุ้มประตูยอดแหลมสีทอง */}
      <mesh position={[0, floorY + H + 0.0, D / 2 + 0.25]}>
        <circleGeometry args={[TEMPLE.door / 2 + 0.3, 3, Math.PI / 2]} />
        <meshStandardMaterial color={gold} metalness={0.45} roughness={0.35} side={2} />
      </mesh>

      {/* ทางเดินหินจากถนนถึงบันไดโบสถ์ */}
      <mesh position={[0, 0.045, D / 2 + 9.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.2, 14]} />
        <meshStandardMaterial color="#d8cdb6" />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={'st' + i} position={[0, 0.05, D / 2 + 3.4 + i * 1.15]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.0, 0.06]} />
          <meshStandardMaterial color="#bfb299" />
        </mesh>
      ))}
      {/* ตุงหลากสีปักเรียงสองข้างทางเดิน */}
      {[-1, 1].flatMap((sx) =>
        [0, 1, 2, 3].map((i) => (
          <group key={`tung${sx}${i}`} position={[sx * 2.4, 0, D / 2 + 4.5 + i * 3]}>
            <mesh position={[0, 1.8, 0]}>
              <cylinderGeometry args={[0.04, 0.05, 3.6, 8]} />
              <meshStandardMaterial color="#8a6a3e" />
            </mesh>
            <mesh position={[0, 2.7, 0.02]}>
              <planeGeometry args={[0.32, 1.5]} />
              <meshStandardMaterial color={['#d9473a', '#f6d36b', '#5fa0d8', '#7ab452'][(i + (sx > 0 ? 1 : 0)) % 4]} side={2} />
            </mesh>
            <mesh position={[0, 3.55, 0]}>
              <coneGeometry args={[0.09, 0.2, 8]} />
              <meshStandardMaterial color="#d9a441" />
            </mesh>
          </group>
        )),
      )}
      {/* แปลงดอกไม้หน้าโบสถ์ */}
      {[-1, 1].map((sx) => (
        <group key={'fl' + sx} position={[sx * 5.6, 0, D / 2 + 4.5]}>
          <mesh position={[0, 0.15, 0]} receiveShadow>
            <RBox args={[4.2, 0.3, 2]} />
            <meshStandardMaterial color="#cdbf9e" />
          </mesh>
          {Array.from({ length: 10 }).map((_, k) => (
            <group key={k} position={[-1.7 + (k % 5) * 0.85, 0.3, k < 5 ? -0.45 : 0.45]}>
              <mesh position={[0, 0.18, 0]}>
                <sphereGeometry args={[0.28, 12, 10]} />
                <meshStandardMaterial color="#5f8f3e" />
              </mesh>
              {[0, 1, 2].map((j) => (
                <mesh key={j} position={[Math.cos(j * 2.1) * 0.18, 0.4, Math.sin(j * 2.1) * 0.18]}>
                  <sphereGeometry args={[0.07, 8, 6]} />
                  <meshStandardMaterial color={['#f2a7b8', '#f6d36b', '#ffffff', '#e8746a'][(k + j) % 4]} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}
      {/* ต้นไม้ใหญ่ร่มรื่นรอบวัด */}
      {[
        [-W / 2 - 4, D / 2 - 2, 1.2],
        [W / 2 + 4, D / 2 - 2, 1.1],
        [-W / 2 - 4.5, -D / 2 + 3, 1.3],
        [W / 2 + 4.5, -D / 2 + 3, 1.2],
      ].map(([x, z, k], i) => (
        <group key={'tr' + i} position={[x, 0, z]} scale={k}>
          <mesh position={[0, 1.4, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.4, 2.8, 14]} />
            <meshStandardMaterial color="#6b5440" />
          </mesh>
          {[
            [0, 3.8, 0, 1.9],
            [1.1, 3.4, 0.4, 1.3],
            [-1.1, 3.5, -0.3, 1.35],
            [0.2, 4.7, -0.3, 1.2],
          ].map(([px, py, pz, r], j) => (
            <mesh key={j} position={[px, py, pz]} castShadow>
              <icosahedronGeometry args={[r, 3]} />
              <meshStandardMaterial color={j % 2 ? '#4a7d3a' : '#3f6e33'} />
            </mesh>
          ))}
        </group>
      ))}

      <MeritSpots floorY={floorY} W={W} D={D} H={H} />

      {/* เจดีย์ทรงระฆังองค์ใหญ่ด้านหลังโบสถ์ */}
      <Chedi position={[0, 0, -D / 2 - TEMPLE.chediGap]} />

      {/* ---------- ภายใน ---------- */}
      <group position={[0, floorY, TEMPLE.altarZ]}>
        {/* ฐานชุกชี */}
        <mesh position={[0, 0.55, -0.6]} castShadow receiveShadow>
          <RBox args={[4.2, 1.1, 2.4]} />
          <meshStandardMaterial color="#efe8da" />
        </mesh>
        {/* ซุ้มเรือนแก้วสีทองด้านหลังพระ */}
        <mesh position={[0, 3.1, -1.55]}>
          <torusGeometry args={[1.35, 0.12, 8, 28, Math.PI]} />
          <meshStandardMaterial color={gold} metalness={0.6} roughness={0.3} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={'a' + s} position={[s * 1.35, 2.2, -1.55]}>
            <cylinderGeometry args={[0.1, 0.1, 1.8, 10]} />
            <meshStandardMaterial color={gold} metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        {/* พระประธานปางมารวิชัย (นั่ง) สีทอง */}
        <group position={[0, 1.1, -0.7]}>
          <mesh position={[0, 0.3, 0]} scale={[1.5, 0.45, 1]} castShadow>
            <sphereGeometry args={[0.8, 20, 14]} />
            <meshStandardMaterial color={gold} metalness={0.6} roughness={0.32} />
          </mesh>
          <mesh position={[0, 1.15, -0.05]} scale={[1, 1.3, 0.8]} castShadow>
            <sphereGeometry args={[0.55, 20, 14]} />
            <meshStandardMaterial color={gold} metalness={0.6} roughness={0.32} />
          </mesh>
          <mesh position={[0, 2.05, 0]} castShadow>
            <sphereGeometry args={[0.36, 20, 14]} />
            <meshStandardMaterial color={gold} metalness={0.6} roughness={0.32} />
          </mesh>
          <mesh position={[0, 2.55, 0]}>
            <coneGeometry args={[0.13, 0.5, 14]} />
            <meshStandardMaterial color={gold} metalness={0.6} roughness={0.32} />
          </mesh>
        </group>
        {/* ทองคำเปลวที่ชาวบ้าน (และผู้เล่น) แปะไว้ — ยิ่งแปะยิ่งเพิ่ม */}
        {LEAF_SPOTS.slice(0, Math.min(LEAF_SPOTS.length, 4 + goldLeaf)).map(([x, y, z, r], i) => (
          <mesh key={'leaf' + i} position={[x, 1.1 + y, -0.7 + z]} rotation={[0, 0, r]}>
            <planeGeometry args={[0.11, 0.11]} />
            <meshStandardMaterial color="#ffe08a" metalness={0.9} roughness={0.15} side={2} />
          </mesh>
        ))}
        {/* กระบอกเซียมซีบนโต๊ะ */}
        <group position={[-1.35, 0.9, 1.0]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.13, 0.12, 0.4, 14]} />
            <meshStandardMaterial color="#a8323a" />
          </mesh>
          {Array.from({ length: 7 }).map((_, i) => (
            <mesh key={i} position={[Math.cos(i * 0.9) * 0.06, 0.48, Math.sin(i * 0.9) * 0.06]} rotation={[Math.sin(i) * 0.1, 0, Math.cos(i) * 0.1]}>
              <cylinderGeometry args={[0.01, 0.01, 0.35, 5]} />
              <meshStandardMaterial color="#d8b878" />
            </mesh>
          ))}
        </group>
        {/* พระยืนซ้าย-ขวา */}
        {[-1, 1].map((s) => (
          <group key={'s' + s} position={[s * 2.9, 0, -0.9]}>
            <mesh position={[0, 0.4, 0]}>
              <RBox args={[0.9, 0.8, 0.9]} />
              <meshStandardMaterial color="#efe8da" />
            </mesh>
            <mesh position={[0, 1.6, 0]} scale={[1, 1, 0.75]} castShadow>
              <capsuleGeometry args={[0.28, 1.2, 6, 14]} />
              <meshStandardMaterial color={gold} metalness={0.6} roughness={0.32} />
            </mesh>
            <mesh position={[0, 2.55, 0]}>
              <sphereGeometry args={[0.2, 16, 12]} />
              <meshStandardMaterial color={gold} metalness={0.6} roughness={0.32} />
            </mesh>
          </group>
        ))}
        {/* โต๊ะหมู่บูชา: แจกันดอกไม้ เชิงเทียน กระถางธูป */}
        <mesh position={[0, 0.45, 1.0]} castShadow>
          <RBox args={[2.2, 0.9, 0.7]} />
          <meshStandardMaterial color="#7a3a22" />
        </mesh>
        {[-0.8, 0.8].map((x) => (
          <group key={'v' + x} position={[x, 0.9, 1.0]}>
            <mesh position={[0, 0.18, 0]}>
              <cylinderGeometry args={[0.1, 0.13, 0.36, 12]} />
              <meshStandardMaterial color="#e8dcc0" />
            </mesh>
            <mesh position={[0, 0.48, 0]}>
              <sphereGeometry args={[0.2, 12, 10]} />
              <meshStandardMaterial color="#f6d36b" />
            </mesh>
          </group>
        ))}
        {[-0.35, 0.35].map((x) => (
          <group key={'k' + x} position={[x, 0.9, 1.05]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
              <meshStandardMaterial color="#f6f1e2" />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
              <sphereGeometry args={[0.05, 8, 6]} />
              <meshStandardMaterial color="#ffb347" emissive="#ff9a2a" emissiveIntensity={0.8} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 1.0, 1.0]}>
          <cylinderGeometry args={[0.16, 0.12, 0.2, 14]} />
          <meshStandardMaterial color="#b08a3a" metalness={0.4} />
        </mesh>
        {/* เบาะกราบหน้าโต๊ะ */}
        {[-1, 0, 1].map((x) => (
          <mesh key={'m' + x} position={[x * 1.1, 0.04, 2.3]}>
            <RBox args={[0.8, 0.08, 0.8]} />
            <meshStandardMaterial color="#c8a050" />
          </mesh>
        ))}
        {/* ไฟจากเทียน ให้ภายในอบอุ่น */}
        <pointLight position={[0, 2.5, 1.5]} color="#ffd29a" intensity={6} distance={12} decay={1.6} />
      </group>
    </group>
  )
}

/** เจดีย์ทรงระฆังสีทอง: ฐานเขียง → องค์ระฆัง → บัลลังก์ (มีช่อง) → ปล้องไฉน → ปลี → ยอด */
export function Chedi({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const bell = useMemo(() => {
    const pts = [
      [5.2, 0],
      [5.4, 0.6],
      [5.0, 1.6],
      [4.4, 3.2],
      [3.6, 5.0],
      [2.6, 6.4],
      [1.6, 7.2],
      [0, 7.5],
    ].map(([x, y]) => new Vector2(x, y))
    return new LatheGeometry(pts, 40)
  }, [])
  const gold = '#e0a642'
  const deep = '#c88a2a'
  return (
    <group position={position} scale={scale}>
      {/* ฐานเขียงซ้อน 3 ชั้น */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.4 + i * 0.8, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[7.2 - i * 0.7, 7.4 - i * 0.7, 0.8, 40]} />
          <meshStandardMaterial color={i % 2 ? '#f2ead8' : '#ece0c4'} />
        </mesh>
      ))}
      {/* องค์ระฆัง */}
      <mesh position={[0, 2.4, 0]} geometry={bell} castShadow>
        <meshStandardMaterial color={gold} metalness={0.35} roughness={0.45} />
      </mesh>
      {/* ลายหยดน้ำบนองค์ระฆัง */}
      <mesh position={[0, 6.3, 3.3]} rotation={[-0.45, 0, 0]}>
        <circleGeometry args={[0.45, 20]} />
        <meshStandardMaterial color="#fff2c8" />
      </mesh>
      {/* บัลลังก์ (ทรงสี่เหลี่ยม มีช่องสีเข้ม) */}
      <mesh position={[0, 10.5, 0]} castShadow>
        <RBox args={[3.2, 1.4, 3.2]} />
        <meshStandardMaterial color="#f2c25a" metalness={0.3} roughness={0.45} />
      </mesh>
      {[0, 1, 2, 3].map((k) => (
        <group key={k} rotation={[0, (k * Math.PI) / 2, 0]}>
          {[-1, -0.33, 0.33, 1].map((x) => (
            <mesh key={x} position={[x, 10.5, 1.62]}>
              <planeGeometry args={[0.3, 0.7]} />
              <meshStandardMaterial color="#6a3a1a" />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 11.4, 0]}>
        <RBox args={[3.6, 0.4, 3.6]} />
        <meshStandardMaterial color="#f6d070" metalness={0.3} roughness={0.45} />
      </mesh>
      {/* ปล้องไฉน + ปลี (กรวยสูง มีวงแหวนเป็นปล้อง) */}
      <mesh position={[0, 16.2, 0]} castShadow>
        <coneGeometry args={[1.6, 9.2, 32]} />
        <meshStandardMaterial color={gold} metalness={0.35} roughness={0.45} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={'r' + i} position={[0, 12.1 + i * 0.75, 0]}>
          <torusGeometry args={[1.48 - i * 0.15, 0.05, 6, 32]} />
          <meshStandardMaterial color={deep} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      {/* ยอดฉัตร */}
      <mesh position={[0, 21.3, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />
        <meshStandardMaterial color={deep} metalness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={'t' + s} position={[s * 0.18, 21.5, 0]} rotation={[0, 0, s * -0.7]}>
          <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
          <meshStandardMaterial color={deep} metalness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

/** ตำแหน่งแผ่นทองบนองค์พระ (ด้านหน้า: ตัก อก แขน) */
const LEAF_SPOTS: [number, number, number, number][] = Array.from({ length: 40 }, (_, i) => {
  const a = (i * 2.399) % (Math.PI * 2)
  const ring = i % 3
  const y = ring === 0 ? 0.3 : ring === 1 ? 0.95 : 1.35
  const rx = ring === 0 ? 1.0 : 0.5
  return [Math.sin(a) * rx * (0.3 + ((i * 37) % 10) / 14), y + Math.cos(i * 1.7) * 0.15, ring === 0 ? 0.42 : 0.47, i * 0.6]
})

/** จุดทำบุญรอบโบสถ์: ตู้ทำบุญ · ตู้เหรียญวันเกิด · ธูปเทียน · ระฆัง · รองเท้าที่ถอดไว้ */
function MeritSpots({ floorY, W, D, H }: { floorY: number; W: number; D: number; H: number }) {
  const inside = useMerit((s) => s.inside)
  const incenseAt = useMerit((s) => s.incenseAt)
  const lit = Date.now() - incenseAt < 3 * 60_000
  const wood = '#7a3a22'
  return (
    <group>
      {/* ตู้ทำบุญ (บนระเบียงซ้าย) */}
      <group position={[SPOT_LOCAL.donate[0], floorY, SPOT_LOCAL.donate[1]]}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <RBox args={[0.9, 1.1, 0.6]} />
          <meshStandardMaterial color={wood} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <RBox args={[0.5, 0.04, 0.08]} />
          <meshStandardMaterial color="#2a1a10" />
        </mesh>
        <group position={[0, 0.7, 0.31]}>
          <SignBoard lines={['กล่องใส่เงินทำบุญ']} width={0.8} height={0.28} bg="#f6e6c0" />
        </group>
      </group>
      {/* ตู้หยอดเหรียญวันเกิด 7 สี (บนระเบียงขวา) */}
      <group position={[SPOT_LOCAL.birthday[0], floorY, SPOT_LOCAL.birthday[1]]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <RBox args={[2.4, 0.8, 0.6]} />
          <meshStandardMaterial color={wood} />
        </mesh>
        {BIRTH_DAYS.map((d, i) => (
          <mesh key={d.id} position={[-1.02 + i * 0.34, 0.95, 0]} castShadow>
            <RBox args={[0.28, 0.3, 0.4]} />
            <meshStandardMaterial color={d.color} />
          </mesh>
        ))}
      </group>
      {/* แท่นธูปเทียน + กระถางธูปหน้าโบสถ์ */}
      <group position={[SPOT_LOCAL.incense[0], 0, SPOT_LOCAL.incense[1]]}>
        {/* ซุ้มธูป-เทียน-ดอกไม้: เคาน์เตอร์ไม้ หลังคา ป้าย */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <RBox args={[1.6, 0.9, 0.7]} />
          <meshStandardMaterial color={wood} />
        </mesh>
        {[-0.75, 0.75].map((x) => (
          <mesh key={'sp' + x} position={[x, 1.25, -0.3]}>
            <cylinderGeometry args={[0.05, 0.05, 2.5, 8]} />
            <meshStandardMaterial color="#6b4428" />
          </mesh>
        ))}
        <mesh position={[0, 2.5, -0.05]} rotation={[0.35, 0, 0]} castShadow>
          <RBox args={[1.9, 0.08, 1.1]} />
          <meshStandardMaterial color="#8a5a32" />
        </mesh>
        <group position={[0, 2.05, 0.06]}>
          <SignBoard lines={['ธูป - เทียน - ดอกไม้']} width={1.5} height={0.32} />
        </group>
        {/* พวงมาลัยดาวเรือง */}
        {[-0.65, 0.65].map((x) => (
          <mesh key={'mg' + x} position={[x, 1.6, 0.05]}>
            <cylinderGeometry args={[0.06, 0.06, 0.5, 10]} />
            <meshStandardMaterial color="#f2a530" />
          </mesh>
        ))}
        <mesh position={[0.45, 0.95, 0.1]}>
          <cylinderGeometry args={[0.1, 0.1, 0.12, 12]} />
          <meshStandardMaterial color="#f6f1e2" />
        </mesh>
        <mesh position={[0.45, 1.03, 0.1]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color="#f2a7b8" />
        </mesh>
        {[-0.3, 0, 0.3].map((x) => (
          <mesh key={x} position={[x, 1.0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.22, 8]} />
            <meshStandardMaterial color="#f6f1e2" />
          </mesh>
        ))}
        {/* กระถางธูปทองเหลือง */}
        <group position={[1.6, 0, 0]}>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 0.7, 14]} />
            <meshStandardMaterial color="#8a6a3e" />
          </mesh>
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.32, 0.4, 20]} />
            <meshStandardMaterial color="#b08a3a" metalness={0.5} roughness={0.35} />
          </mesh>
          {lit && <Smoke />}
        </group>
      </group>
      {/* คนโทกรวดน้ำบนระเบียง */}
      <group position={[SPOT_LOCAL.water[0], floorY, SPOT_LOCAL.water[1]]}>
        <mesh position={[0, 0.3, 0]}>
          <RBox args={[0.6, 0.6, 0.5]} />
          <meshStandardMaterial color={wood} />
        </mesh>
        <mesh position={[-0.12, 0.72, 0]}>
          <sphereGeometry args={[0.13, 14, 10]} />
          <meshStandardMaterial color="#c0c4c8" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[-0.12, 0.9, 0]}>
          <cylinderGeometry args={[0.03, 0.05, 0.16, 10]} />
          <meshStandardMaterial color="#c0c4c8" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0.15, 0.66, 0]}>
          <cylinderGeometry args={[0.12, 0.08, 0.08, 14]} />
          <meshStandardMaterial color="#c0c4c8" metalness={0.7} roughness={0.25} />
        </mesh>
      </group>
      {/* ป้ายลำดับการทำบุญ */}
      <group position={[SPOT_LOCAL.sign[0], 0, SPOT_LOCAL.sign[1]]} rotation={[0, 0.35, 0]}>
        {[-0.75, 0.75].map((x) => (
          <mesh key={'sg' + x} position={[x, 0.9, -0.03]}>
            <cylinderGeometry args={[0.06, 0.06, 1.8, 8]} />
            <meshStandardMaterial color="#6b4428" />
          </mesh>
        ))}
        <group position={[0, 1.55, 0]}>
          <SignBoard
            title="ลำดับการทำบุญ"
            lines={['1. ถอดรองเท้า', '2. จุดธูปเทียน', '3. กราบพระ 3 ครั้ง', '4. แปะทอง · ใส่เงินทำบุญ', '5. กรวดน้ำ', '6. ตีระฆัง']}
            width={1.6}
            height={1.5}
          />
        </group>
      </group>
      {/* ธงทิวหลากสีขึงเหนือลานหน้าโบสถ์ */}
      {[-1, 1].map((sx) => (
        <group key={'flagline' + sx}>
          {Array.from({ length: 10 }).map((_, i) => {
            const t = (i + 0.5) / 10
            const x0 = sx * 2.4
            const x1 = sx * (W / 2 + 0.7)
            const z0 = D / 2 + 13.5
            const z1 = D / 2 + 1.6
            const x = x0 + (x1 - x0) * t
            const z = z0 + (z1 - z0) * t
            const y = 3.55 + (floorY + H - 0.4 - 3.55) * t - Math.sin(t * Math.PI) * 0.5
            return (
              <mesh key={i} position={[x, y - 0.18, z]} rotation={[0, Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2, 0]}>
                <planeGeometry args={[0.28, 0.36]} />
                <meshStandardMaterial color={['#d9473a', '#f6d36b', '#5fa0d8', '#7ab452', '#f28a3a'][i % 5]} side={2} />
              </mesh>
            )
          })}
        </group>
      ))}
      {/* ระฆังสองข้างโบสถ์ */}
      {SPOT_LOCAL.bells.map(([x, z], i) => (
        <Bell key={i} id={'bell' + i} position={[x, 0, z]} />
      ))}
      {/* ลานถอดรองเท้า: แท่นไม้ข้างตีนบันได + ป้าย + รองเท้าชาวบ้านวางเรียง */}
      <group position={[SPOT_LOCAL.shoes[0], 0, SPOT_LOCAL.shoes[1]]}>
        <mesh position={[0, 0.06, 0]} receiveShadow>
          <RBox args={[2.2, 0.12, 1.1]} />
          <meshStandardMaterial color="#9a6a42" />
        </mesh>
        {[['#2b3550', -0.7], ['#6b4428', -0.25], ['#8a3a2a', 0.25]].map(([c, x]) =>
          [-0.08, 0.08].map((dx) => (
            <mesh key={`${x}${dx}`} position={[(x as number) + dx, 0.15, 0.1]}>
              <RBox args={[0.1, 0.06, 0.24]} />
              <meshStandardMaterial color={c as string} />
            </mesh>
          )),
        )}
        <group position={[0, 0.85, -0.55]}>
          <mesh position={[0, -0.4, -0.02]}>
            <cylinderGeometry args={[0.04, 0.04, 0.9, 8]} />
            <meshStandardMaterial color="#6b4428" />
          </mesh>
          <SignBoard lines={['บริเวณถอดรองเท้า', 'โปรดถอดรองเท้าก่อนเข้าอุโบสถ']} width={1.6} height={0.5} />
        </group>
      </group>
      {/* รองเท้าของผู้เล่นที่ถอดวางไว้ (ตอนขึ้นไปบนโบสถ์) */}
      {inside && (
        <group position={[SPOT_LOCAL.shoes[0] + 0.7, 0.16, SPOT_LOCAL.shoes[1] + 0.1]}>
          {[-0.09, 0.09].map((x) => (
            <mesh key={x} position={[x, 0.03, 0]}>
              <RBox args={[0.11, 0.06, 0.26]} />
              <meshStandardMaterial color="#6b4428" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

/** ระฆังแขวนบนเสา แกว่งเมื่อถูกตี */
function Bell({ id, position }: { id: string; position: [number, number, number] }) {
  const swing = useRef<Group>(null!)
  useFrame(() => {
    const hit = useMerit.getState().bellHit[id]
    const t = hit ? (performance.now() - hit) / 1000 : 99
    swing.current.rotation.x = t < 4 ? Math.sin(t * 9) * 0.45 * Math.exp(-t * 1.1) : 0
  })
  return (
    <group position={position}>
      {[-0.55, 0.55].map((z) => (
        <mesh key={z} position={[0, 1.35, z]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 2.7, 10]} />
          <meshStandardMaterial color="#6b4428" />
        </mesh>
      ))}
      <mesh position={[0, 2.7, 0]}>
        <RBox args={[0.14, 0.12, 1.3]} />
        <meshStandardMaterial color="#6b4428" />
      </mesh>
      <group ref={swing} position={[0, 2.62, 0]}>
        <mesh position={[0, -0.35, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.32, 0.55, 18, 1, true]} />
          <meshStandardMaterial color="#c89a3a" metalness={0.6} roughness={0.3} side={2} />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.12, 14, 10]} />
          <meshStandardMaterial color="#c89a3a" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* พู่หลากสีใต้ระฆัง */}
        {['#d9473a', '#f6d36b', '#5fa0d8', '#7ab452', '#c97ad8'].map((c, k) => (
          <mesh key={c} position={[(k - 2) * 0.05, -0.85, 0]}>
            <boxGeometry args={[0.045, 0.45, 0.02]} />
            <meshStandardMaterial color={c} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** ควันธูปลอยขึ้นช้า ๆ */
function Smoke() {
  const g = useRef<Group>(null!)
  useFrame((_, dt) => {
    g.current.children.forEach((c, i) => {
      c.position.y += dt * 0.35
      c.position.x = Math.sin(c.position.y * 2 + i) * 0.08
      const k = (c.position.y - 1.1) / 1.6
      c.scale.setScalar(0.6 + k * 1.2)
      if (c.position.y > 2.7) c.position.y = 1.1
    })
  })
  return (
    <group ref={g}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[0, 1.1 + i * 0.27, 0]}>
          <sphereGeometry args={[0.08, 10, 8]} />
          <meshStandardMaterial color="#e8e4dc" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}
      {[-0.06, 0, 0.06].map((x) => (
        <mesh key={'st' + x} position={[x, 1.15, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.3, 5]} />
          <meshStandardMaterial color="#c0503a" emissive="#ff7a3a" emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * พระเจดีย์องค์ใหญ่ข้างวัด: ฐานทักษิณ (ลานรอบองค์ มีกำแพงแก้วเตี้ย) · องค์ระฆังสีทอง
 * · วิหารเล็กสีขาวหลังคาส้ม-เขียวด้านหน้า · บันไดขึ้น · ต้นไม้ทรงพุ่มกลมสองข้าง
 */
export function BigChedi() {
  const gold = '#d9a441'
  return (
    <group>
      {/* ลานรอบ */}
      <mesh position={[0, 0.03, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#e3d6b8" />
      </mesh>
      {/* ฐานทักษิณ + กำแพงแก้วเตี้ยรอบลาน */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <RBox args={[18, 1, 18]} />
        <meshStandardMaterial color="#a8916a" />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 8.9, 1.35, 0]}>
            <RBox args={[0.25, 0.7, 18]} />
            <meshStandardMaterial color="#f6f0e0" />
          </mesh>
          <mesh position={[0, 1.35, s * 8.9]} visible={s < 0}>
            <RBox args={[18, 0.7, 0.25]} />
            <meshStandardMaterial color="#f6f0e0" />
          </mesh>
          {/* กำแพงหน้าเว้นช่องบันได */}
          <mesh position={[s * 5.3, 1.35, 8.9]}>
            <RBox args={[7.2, 0.7, 0.25]} />
            <meshStandardMaterial color="#f6f0e0" />
          </mesh>
        </group>
      ))}
      {/* บันไดขึ้นฐาน */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[0, 0.125 + i * 0.25 - 0.0, 9.0 + (3 - i) * 0.45]} receiveShadow>
          <RBox args={[3.2, 0.25 * (i + 1), 0.45]} />
          <meshStandardMaterial color="#cfc2a6" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={'pp' + s} position={[s * 1.75, 1.3, 9.4]}>
          <RBox args={[0.35, 1.4, 0.35]} />
          <meshStandardMaterial color="#f6f0e0" />
        </mesh>
      ))}
      {/* องค์เจดีย์ (ใช้แบบเดียวกับเจดีย์หลังโบสถ์ ขยายใหญ่) */}
      <Chedi position={[0, 1, -1.5]} scale={1.35} />
      {/* วิหารเล็กหน้าองค์เจดีย์ */}
      <group position={[0, 1, 5.6]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <RBox args={[4, 2.8, 2.6]} />
          <meshStandardMaterial color="#fbf6ea" />
        </mesh>
        <mesh position={[0, 1.15, 1.31]}>
          <planeGeometry args={[1.1, 2.1]} />
          <meshStandardMaterial color="#8a5a32" />
        </mesh>
        {[-1.35, 1.35].map((x) => (
          <mesh key={x} position={[x, 1.5, 1.31]}>
            <planeGeometry args={[0.5, 0.8]} />
            <meshStandardMaterial color="#c89a5a" />
          </mesh>
        ))}
        <group rotation={[0, Math.PI / 2, 0]}>
          <GableRoof width={3.2} depth={4.6} height={1.7} y={2.8} color="#4f8a6a" overhang={0.3} />
          <GableRoof width={2.8} depth={4.2} height={1.6} y={2.9} color="#d9702a" overhang={0.2} />
        </group>
        {/* ช่อฟ้า */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 2.2, 3.0, 1.4]} rotation={[0, 0, sx * -0.5]}>
            <coneGeometry args={[0.1, 0.6, 10]} />
            <meshStandardMaterial color={gold} metalness={0.5} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* ต้นไม้ทรงพุ่มกลมสองข้างบันได */}
      {[-1, 1].map((sx) => (
        <group key={'tr' + sx} position={[sx * 5.5, 0, 11]}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.22, 1.6, 10]} />
            <meshStandardMaterial color="#7a4a1a" />
          </mesh>
          <mesh position={[0, 2.2, 0]} scale={[1, 1.35, 1]} castShadow>
            <sphereGeometry args={[1.0, 20, 14]} />
            <meshStandardMaterial color="#7ab43a" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
