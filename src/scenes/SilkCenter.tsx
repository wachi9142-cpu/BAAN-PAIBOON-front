import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { Editable } from './Editable'
import { MULBERRY, SILK_STATIONS } from '../game/content/silk'
import { leafReady, silkTick, trayList, useSilk, type TrayStage } from '../game/silk'
import { useGame } from '../game/store'
import { useClock } from '../game/clock'
import { playerPose } from '../game/playerPose'

/**
 * เส้นทางไหมที่ศูนย์ฝึกอาชีพ — สวนหม่อน · ชั้นกระด้งเลี้ยงไหม · เตาสาวไหม · กี่ทอผ้า · โต๊ะตัดเย็บ
 * ภาพ Soft 3D การ์ตูน เหมือนส่วนอื่นของหมู่บ้าน · สถานีลากย้ายได้ (โหมดจัดวาง)
 */
const WOOD = '#8a5a34'
const WOOD_D = '#6a4426'
const BAMBOO = '#d8b878'

export function SilkCenter() {
  // อัปเดตภาพตามเวลา/เซฟ
  useGame((s) => s.save?.silk)
  useClock((s) => s.minute)
  const st = SILK_STATIONS
  return (
    <group>
      <SilkWatcher />
      <MulberryGarden />
      <Editable id={st.rack.id} name={st.rack.name} x={st.rack.pos[0]} z={st.rack.pos[1]} rot={st.rack.rot} r={1.2}>
        <group position={[st.rack.pos[0], 0, st.rack.pos[1]]}>
          <RearingRack />
        </group>
      </Editable>
      <Editable id={st.reel.id} name={st.reel.name} x={st.reel.pos[0]} z={st.reel.pos[1]} rot={st.reel.rot} r={1.3}>
        <group position={[st.reel.pos[0], 0, st.reel.pos[1]]}>
          <ReelStove />
        </group>
      </Editable>
      <Editable id={st.loom.id} name={st.loom.name} x={st.loom.pos[0]} z={st.loom.pos[1]} rot={st.loom.rot} r={1.5}>
        <group position={[st.loom.pos[0], 0, st.loom.pos[1]]}>
          <Loom />
        </group>
      </Editable>
      <Editable id={st.sew.id} name={st.sew.name} x={st.sew.pos[0]} z={st.sew.pos[1]} rot={st.sew.rot} r={1.2}>
        <group position={[st.sew.pos[0], 0, st.sew.pos[1]]}>
          <SewTable />
        </group>
      </Editable>
    </group>
  )
}

function SilkWatcher() {
  const t = useRef(0)
  useFrame((_, dt) => {
    t.current += dt
    if (t.current < 0.2) return
    t.current = 0
    silkTick(playerPose.x, playerPose.z)
  })
  return null
}

/** ต้นหม่อน: พุ่มใบรูปหัวใจ ลูกหม่อนสีม่วงเข้ม · เก็บใบแล้วพุ่มบางลงจนถึงพรุ่งนี้ */
function MulberryGarden() {
  return (
    <group>
      {MULBERRY.map(([x, z], i) => {
        const full = leafReady(i)
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, i * 1.7, 0]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.07, 0.9, 6]} />
              <meshStandardMaterial color="#6a5038" />
            </mesh>
            {[
              [0, 1.05, 0, 0.62],
              [0.35, 0.85, 0.2, 0.45],
              [-0.32, 0.9, -0.15, 0.48],
              [0.05, 0.8, -0.38, 0.4],
            ].map(([px, py, pz, s], k) =>
              !full && k > 1 ? null : (
                <mesh key={k} position={[px, py, pz]} scale={[s, s * 0.8, s]} castShadow>
                  <icosahedronGeometry args={[1, 1]} />
                  <meshStandardMaterial color={full ? (k % 2 ? '#5aa040' : '#4a9238') : '#7aa858'} roughness={0.9} flatShading />
                </mesh>
              ),
            )}
            {full &&
              [0, 1, 2].map((k) => (
                <mesh key={k} position={[Math.cos(k * 2.1) * 0.5, 0.8 + k * 0.08, Math.sin(k * 2.1) * 0.5]}>
                  <capsuleGeometry args={[0.035, 0.05, 3, 6]} />
                  <meshStandardMaterial color="#4a1a3a" roughness={0.5} />
                </mesh>
              ))}
          </group>
        )
      })}
      {/* ป้ายสวนหม่อน */}
      <group position={[-58, 0, -26.8]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.08, 1.2, 0.08]} />
          <meshStandardMaterial color={WOOD_D} />
        </mesh>
        <mesh position={[0, 1.15, 0.03]}>
          <boxGeometry args={[1.1, 0.34, 0.05]} />
          <meshStandardMaterial color="#8ac060" />
        </mesh>
      </group>
    </group>
  )
}

/** ชั้นไม้ 3 ชั้น วางกระด้งไม้ไผ่ — ในกระด้งเห็นไข่/หนอน/ใบหม่อน/จ่อ/รังไหมตามขั้น */
function RearingRack() {
  const list = trayList()
  return (
    <group>
      {[-0.6, 0.6].flatMap((x) =>
        [-0.42, 0.42].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.95, z]} castShadow>
            <boxGeometry args={[0.07, 1.9, 0.07]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
        )),
      )}
      {list.map((tr, i) => {
        const y = 0.35 + i * 0.58
        return (
          <group key={i} position={[0, y, 0]}>
            <mesh position={[0, -0.03, 0]} receiveShadow>
              <boxGeometry args={[1.26, 0.04, 0.9]} />
              <meshStandardMaterial color={WOOD} />
            </mesh>
            <Tray stage={tr.stage} meals={tr.t?.meals ?? 0} />
          </group>
        )
      })}
      {/* หลังคาเพิงเล็กกันแดด */}
      <mesh position={[0, 2.02, 0]} rotation={[0.12, 0, 0]} castShadow>
        <boxGeometry args={[1.5, 0.06, 1.15]} />
        <meshStandardMaterial color="#b89a5a" />
      </mesh>
    </group>
  )
}

function Tray({ stage, meals }: { stage: TrayStage; meals: number }) {
  const worms = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!worms.current) return
    const t = clock.elapsedTime
    worms.current.children.forEach((w, i) => {
      w.rotation.y = i * 0.8 + Math.sin(t * 1.5 + i) * 0.4
      w.scale.x = 1 + Math.sin(t * 3 + i * 2) * 0.08
    })
  })
  const size = 0.6 + meals * 0.22
  return (
    <group>
      {/* กระด้ง (ไม้ไผ่สาน) */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.44, 0.42, 0.05, 24]} />
        <meshStandardMaterial color={BAMBOO} roughness={1} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.44, 0.022, 6, 28]} />
        <meshStandardMaterial color="#b8955a" />
      </mesh>
      {stage === 'eggs' && (
        <group position={[0, 0.06, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.4, 0.3]} />
            <meshStandardMaterial color="#f2ece0" />
          </mesh>
          {Array.from({ length: 20 }, (_, k) => (
            <mesh key={k} position={[-0.15 + (k % 5) * 0.075, 0.01, -0.1 + Math.floor(k / 5) * 0.065]}>
              <sphereGeometry args={[0.013, 5, 4]} />
              <meshStandardMaterial color="#5a5048" />
            </mesh>
          ))}
        </group>
      )}
      {(stage === 'hungry' || stage === 'eating') && (
        <>
          {stage === 'eating' &&
            [0, 1, 2, 3].map((k) => (
              <mesh key={k} position={[Math.cos(k * 1.6) * 0.18, 0.065, Math.sin(k * 1.6) * 0.18]} rotation={[-Math.PI / 2, 0, k]} scale={[1, 0.8, 1]}>
                <circleGeometry args={[0.11, 8]} />
                <meshStandardMaterial color="#5aa040" side={2} />
              </mesh>
            ))}
          <group ref={worms}>
            {Array.from({ length: 9 }, (_, k) => (
              <mesh key={k} position={[Math.cos(k * 2.4) * (0.08 + (k % 3) * 0.1), 0.08, Math.sin(k * 2.4) * (0.08 + (k % 3) * 0.1)]} rotation={[0, 0, Math.PI / 2]} scale={size}>
                <capsuleGeometry args={[0.022, 0.07, 4, 8]} />
                <meshStandardMaterial color="#f4f0e4" roughness={0.6} />
              </mesh>
            ))}
          </group>
        </>
      )}
      {(stage === 'spinning' || stage === 'cocoon') && (
        <group position={[0, 0.07, 0]}>
          {/* จ่อ (ไม้ไผ่ขดเป็นวง) ให้หนอนชักใย */}
          {[0.12, 0.22, 0.32].map((r) => (
            <mesh key={r} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <torusGeometry args={[r, 0.012, 4, 24]} />
              <meshStandardMaterial color="#a8884a" />
            </mesh>
          ))}
          {Array.from({ length: 10 }, (_, k) => {
            const a = k * 0.63
            const r = 0.1 + (k % 3) * 0.1
            return (
              <mesh key={k} position={[Math.cos(a) * r, 0.06, Math.sin(a) * r]} rotation={[0, a, 0]} scale={stage === 'cocoon' ? [1, 0.75, 0.75] : [0.8, 0.6, 0.6]}>
                <sphereGeometry args={[0.045, 8, 6]} />
                <meshStandardMaterial color={stage === 'cocoon' ? '#f0c030' : '#f8f4ea'} roughness={0.9} transparent opacity={stage === 'cocoon' ? 1 : 0.75} />
              </mesh>
            )
          })}
        </group>
      )}
    </group>
  )
}

/** เตาดินเผา + หม้อต้มรังไหม + กงสาวไหม (หมุนตอนสาว) + ไอน้ำ */
function ReelStove() {
  const busy = useSilk((s) => s.busy === 'reel')
  const wheel = useRef<Group>(null)
  const steam = useRef<Group>(null)
  const fire = useRef<Mesh>(null)
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    if (wheel.current && busy) wheel.current.rotation.x -= dt * 4
    if (fire.current) fire.current.visible = busy
    if (steam.current) {
      steam.current.visible = busy
      steam.current.children.forEach((p, i) => {
        const k = (t * 0.6 + i / 4) % 1
        p.position.set(Math.sin(i * 2 + t) * 0.08, 0.95 + k * 0.8, 0)
        p.scale.setScalar(0.08 + k * 0.16)
        ;((p as Mesh).material as { opacity: number }).opacity = 0.5 * (1 - k)
      })
    }
  })
  return (
    <group>
      {/* เตาดิน */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.42, 0.6, 16]} />
        <meshStandardMaterial color="#a8603a" roughness={1} />
      </mesh>
      <mesh position={[0, 0.2, 0.36]}>
        <boxGeometry args={[0.26, 0.2, 0.1]} />
        <meshStandardMaterial color="#2a1a14" />
      </mesh>
      <mesh ref={fire} position={[0, 0.22, 0.34]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshBasicMaterial color="#ff9a30" />
      </mesh>
      {/* หม้อดิน + รังไหมลอยในน้ำ */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.32, 16, 12, 0, Math.PI * 2, Math.PI / 3, Math.PI * 0.67]} />
        <meshStandardMaterial color="#6a4030" roughness={0.9} side={2} />
      </mesh>
      <mesh position={[0, 0.86, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.27, 18]} />
        <meshStandardMaterial color="#c8b890" />
      </mesh>
      {[0, 1, 2, 3, 4].map((k) => (
        <mesh key={k} position={[Math.cos(k * 1.3) * 0.13, 0.88, Math.sin(k * 1.3) * 0.13]} scale={[1, 0.75, 0.75]}>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshStandardMaterial color="#f0c030" />
        </mesh>
      ))}
      <group ref={steam}>
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {/* กงสาวไหม (ล้อไม้ซี่) ข้างเตา */}
      <group position={[0.75, 0, 0]}>
        {[-0.18, 0.18].map((z) => (
          <mesh key={z} position={[0, 0.5, z]} castShadow>
            <boxGeometry args={[0.06, 1, 0.06]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
        ))}
        <group ref={wheel} position={[0, 0.95, 0]}>
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} rotation={[(k * Math.PI) / 4, 0, 0]}>
              <boxGeometry args={[0.03, 0.62, 0.03]} />
              <meshStandardMaterial color={WOOD_D} />
            </mesh>
          ))}
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.3, 0.035, 6, 20]} />
            <meshStandardMaterial color="#e8c050" roughness={0.4} metalness={0.2} />
          </mesh>
        </group>
      </group>
      {/* ตะกร้ารังไหม */}
      <group position={[-0.7, 0, 0.1]}>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.24, 0.18, 0.32, 14, 1, true]} />
          <meshStandardMaterial color={BAMBOO} side={2} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <mesh key={k} position={[Math.cos(k) * 0.1, 0.3, Math.sin(k) * 0.1]} scale={[1, 0.75, 0.75]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshStandardMaterial color="#f0c030" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** กี่ทอผ้าไม้ (เส้นยืน + ฟืม + กระสวย + ผ้าทอสีม่วงม้วนอยู่หน้า) · ม้านั่งทอ */
function Loom() {
  const busy = useSilk((s) => s.busy === 'loom')
  const shuttle = useRef<Mesh>(null)
  const reed = useRef<Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (shuttle.current) shuttle.current.position.x = busy ? Math.sin(t * 4) * 0.5 : -0.55
    if (reed.current) reed.current.position.z = busy ? 0.1 + Math.abs(Math.sin(t * 4)) * 0.12 : 0.1
  })
  return (
    <group>
      {/* โครงข้าง 2 ด้าน */}
      {[-0.65, 0.65].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {[-0.55, 0.55].map((z) => (
            <mesh key={z} position={[0, 0.85, z]} castShadow>
              <boxGeometry args={[0.08, 1.7, 0.08]} />
              <meshStandardMaterial color={WOOD} />
            </mesh>
          ))}
          <mesh position={[0, 1.65, 0]}>
            <boxGeometry args={[0.08, 0.08, 1.2]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.08, 0.08, 1.2]} />
            <meshStandardMaterial color={WOOD} />
          </mesh>
        </group>
      ))}
      {/* คานหลัง (เส้นยืนพันอยู่) + คานหน้า (ม้วนผ้า) */}
      <mesh position={[0, 0.85, -0.55]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 1.3, 10]} />
        <meshStandardMaterial color="#f0e8d0" />
      </mesh>
      <mesh position={[0, 0.78, 0.45]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 1.3, 12]} />
        <meshStandardMaterial color="#7a2a8a" />
      </mesh>
      {/* เส้นยืน */}
      {Array.from({ length: 16 }, (_, k) => (
        <mesh key={k} position={[-0.5 + k * 0.066, 0.85, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 1, 3]} />
          <meshStandardMaterial color="#f4ecd8" />
        </mesh>
      ))}
      {/* ผ้าที่ทอแล้ว (ลายลูกแก้วสีม่วง-ทอง) */}
      <mesh position={[0, 0.86, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, 0.3]} />
        <meshStandardMaterial color="#8a3a9a" side={2} />
      </mesh>
      {[0, 1, 2, 3, 4].map((k) => (
        <mesh key={k} position={[-0.4 + k * 0.2, 0.865, 0.3]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
          <planeGeometry args={[0.07, 0.07]} />
          <meshStandardMaterial color="#e8c050" side={2} />
        </mesh>
      ))}
      {/* ฟืม (ตะกรอ) แขวน */}
      <group ref={reed} position={[0, 0, 0.1]}>
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[1.2, 0.36, 0.04]} />
          <meshStandardMaterial color="#9a6a3a" transparent opacity={0.85} />
        </mesh>
      </group>
      {/* กระสวย */}
      <mesh ref={shuttle} position={[-0.55, 0.88, 0.18]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.03, 0.18, 4, 8]} />
        <meshStandardMaterial color="#c88a3a" />
      </mesh>
      {/* ม้านั่งทอ */}
      <mesh position={[0, 0.42, 0.95]} castShadow>
        <boxGeometry args={[0.9, 0.06, 0.32]} />
        <meshStandardMaterial color={WOOD_D} />
      </mesh>
      {[-0.38, 0.38].map((x) => (
        <mesh key={x} position={[x, 0.2, 0.95]}>
          <boxGeometry args={[0.06, 0.4, 0.26]} />
          <meshStandardMaterial color={WOOD_D} />
        </mesh>
      ))}
    </group>
  )
}

/** โต๊ะตัดเย็บ: ผ้าไหมพับ กรรไกร ด้าย + ราวแขวนผ้าถุง/เสื้อที่ตัดเสร็จ */
function SewTable() {
  return (
    <group>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.06, 0.75]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      {[-0.58, 0.58].flatMap((x) =>
        [-0.3, 0.3].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.37, z]}>
            <boxGeometry args={[0.06, 0.74, 0.06]} />
            <meshStandardMaterial color={WOOD_D} />
          </mesh>
        )),
      )}
      {/* ผ้าไหมพับ 2 สี */}
      <mesh position={[-0.3, 0.82, 0]} castShadow>
        <boxGeometry args={[0.42, 0.08, 0.32]} />
        <meshStandardMaterial color="#7a2a8a" />
      </mesh>
      <mesh position={[-0.3, 0.9, 0]}>
        <boxGeometry args={[0.4, 0.06, 0.3]} />
        <meshStandardMaterial color="#d8b04a" />
      </mesh>
      {/* กรรไกร */}
      {[-0.2, 0.2].map((r) => (
        <mesh key={r} position={[0.25, 0.79, 0.05]} rotation={[-Math.PI / 2, 0, r]}>
          <boxGeometry args={[0.03, 0.26, 0.012]} />
          <meshStandardMaterial color="#c9ced4" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* หลอดด้าย */}
      {['#c0304a', '#e8c050', '#3a6aa8'].map((c, k) => (
        <mesh key={c} position={[0.45, 0.82, -0.2 + k * 0.12]}>
          <cylinderGeometry args={[0.035, 0.035, 0.1, 10]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
      {/* ราวแขวนผ้า */}
      <group position={[0, 0, -0.75]}>
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 0.8, 0]}>
            <boxGeometry args={[0.05, 1.6, 0.05]} />
            <meshStandardMaterial color={WOOD_D} />
          </mesh>
        ))}
        <mesh position={[0, 1.58, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 1.25, 6]} />
          <meshStandardMaterial color={WOOD_D} />
        </mesh>
        <mesh position={[-0.25, 1.15, 0]}>
          <boxGeometry args={[0.42, 0.8, 0.02]} />
          <meshStandardMaterial color="#6a2a7a" />
        </mesh>
        <mesh position={[0.28, 1.28, 0]}>
          <boxGeometry args={[0.46, 0.55, 0.02]} />
          <meshStandardMaterial color="#d8b04a" />
        </mesh>
      </group>
    </group>
  )
}
