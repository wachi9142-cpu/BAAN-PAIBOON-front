import { Garden } from './Garden'
import { useMemo } from 'react'
import { TextSprite } from './TextSprite'
import {
  PLACES,
  PLOTS,
  ROADS,
  TREES,
  ROCKS,
  type Place,
  type Plot,
  type Road,
  type TreeSpot,
} from '../game/content/village'
import { getHouse } from '../game/content/houses'
import { useSettings } from '../game/settings'
import { House, VillagerHouse, GableRoof } from './models/House'
import { RBox } from './models/RBox'
import { BigChedi, Temple } from './Temple'

/** ฉากหมู่บ้านทั้งหมด (สิ่งที่อยู่นิ่ง) */
export function Village({ playerHouseId, playerName }: { playerHouseId?: string; playerName?: string }) {
  return (
    <group>
      <Ground />
      {ROADS.map((r, i) => (
        <RoadMesh key={i} road={r} />
      ))}
      {PLACES.map((p) => (
        <PlaceMesh key={p.id} place={p} />
      ))}
      {PLOTS.map((p) => (
        <PlotMesh key={p.id} plot={p} houseId={playerHouseId} ownerName={playerName} />
      ))}
      <Trees />
      <Rocks />
      <Garden />
      <Mountains />
    </group>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[700, 700]} />
      <meshStandardMaterial color="#8fa860" />
    </mesh>
  )
}

/** ทิวเขาไกล ๆ รอบหมู่บ้าน (ฉากหลัง เดินไปไม่ถึง) */
function Mountains() {
  const peaks = useMemo(() => {
    const out: { x: number; z: number; r: number; h: number; c: string }[] = []
    const colors = ['#5f7f5a', '#6b8c63', '#557552', '#738f6a']
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + Math.sin(i * 3.7) * 0.05
      const dist = 210 + ((i * 37) % 50)
      out.push({
        x: Math.cos(a) * dist,
        z: Math.sin(a) * dist,
        r: 28 + ((i * 53) % 26),
        h: 35 + ((i * 71) % 45),
        c: colors[i % colors.length],
      })
    }
    return out
  }, [])
  return (
    <group>
      {peaks.map((p, i) => (
        <mesh key={i} position={[p.x, p.h / 2 - 2, p.z]} rotation={[0, i, 0]}>
          <coneGeometry args={[p.r, p.h, 12]} />
          <meshStandardMaterial color={p.c} />
        </mesh>
      ))}
    </group>
  )
}

function RoadMesh({ road }: { road: Road }) {
  const [ax, az] = road.from
  const [bx, bz] = road.to
  const len = Math.hypot(bx - ax, bz - az)
  const angle = Math.atan2(bx - ax, bz - az)
  return (
    <mesh position={[(ax + bx) / 2, 0.02, (az + bz) / 2]} rotation={[-Math.PI / 2, 0, angle]} receiveShadow>
      <planeGeometry args={[road.width, len + road.width]} />
      <meshStandardMaterial color="#c9b58e" />
    </mesh>
  )
}

function Label({ text, y, color = '#2e2a24' }: { text: string; y: number; color?: string }) {
  const show = useSettings((s) => s.showLabels)
  if (!show) return null
  return (
    <TextSprite text={text} color={color} position={[0, y, 0]} height={0.9} />
  )
}

function PlaceMesh({ place }: { place: Place }) {
  const [x, z] = place.pos
  const [w, d] = place.size
  let body: React.ReactNode = null
  let labelY = 5

  switch (place.kind) {
    case 'temple':
      labelY = 15
      body = <Temple placeZ={place.pos[1]} />
      break
    case 'chedi':
      labelY = 26
      body = <BigChedi />
      break
    case 'sala':
      body = (
        <group>
          <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
            <RBox args={[w, 0.5, d]} />
            <meshStandardMaterial color="#c8b48f" />
          </mesh>
          {[-1, 1].flatMap((sx) =>
            [-1, 1].map((sz) => (
              <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.4), 2, sz * (d / 2 - 0.4)]} castShadow>
                <RBox args={[0.3, 3.2, 0.3]} />
                <meshStandardMaterial color="#efe7d6" />
              </mesh>
            )),
          )}
          <GableRoof width={w} depth={d} height={1.8} y={3.6} color="#a24a2c" overhang={0.6} />
          {/* ม้านั่ง */}
          {[-1.5, 0, 1.5].map((bz) => (
            <mesh key={bz} position={[0, 0.85, bz]} castShadow>
              <RBox args={[w * 0.6, 0.12, 0.5]} />
              <meshStandardMaterial color="#7a5236" />
            </mesh>
          ))}
        </group>
      )
      break
    case 'questboard':
      labelY = 3.4
      body = (
        <group>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 1.2, 1.1, 0]} castShadow>
              <RBox args={[0.15, 2.2, 0.15]} />
              <meshStandardMaterial color="#5a3b26" />
            </mesh>
          ))}
          <mesh position={[0, 1.7, 0]} castShadow>
            <RBox args={[2.6, 1.4, 0.12]} />
            <meshStandardMaterial color="#8a6340" />
          </mesh>
          {[
            [-0.7, 1.85, '#fff6d8'],
            [0.1, 1.6, '#ffe9b0'],
            [0.8, 1.9, '#f6efe1'],
          ].map(([px, py, c], i) => (
            <mesh key={i} position={[px as number, py as number, 0.08]} rotation={[0, 0, (i - 1) * 0.08]}>
              <planeGeometry args={[0.6, 0.75]} />
              <meshStandardMaterial color={c as string} />
            </mesh>
          ))}
          <mesh position={[0, 2.55, 0]} castShadow>
            <RBox args={[3, 0.12, 0.5]} />
            <meshStandardMaterial color="#7b3b2a" />
          </mesh>
        </group>
      )
      break
    case 'shop':
      body = (
        <group>
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <RBox args={[w, 3, d]} />
            <meshStandardMaterial color="#e8d9b8" />
          </mesh>
          <mesh position={[0, 2.9, d / 2 + 0.8]} rotation={[0.25, 0, 0]} castShadow>
            <RBox args={[w + 0.4, 0.1, 1.8]} />
            <meshStandardMaterial color="#3f7a8c" />
          </mesh>
          <mesh position={[0, 1.2, d / 2 + 0.05]}>
            <RBox args={[w * 0.6, 2.2, 0.1]} />
            <meshStandardMaterial color="#4a3a2a" />
          </mesh>
          {/* ตู้เย็นเครื่องดื่ม/ลังของหน้าร้าน */}
          {[-2.2, 2.2].map((cx) => (
            <mesh key={cx} position={[cx, 0.5, d / 2 + 0.8]} castShadow>
              <RBox args={[0.9, 1, 0.7]} />
              <meshStandardMaterial color={cx < 0 ? '#c2412d' : '#d9a441'} />
            </mesh>
          ))}
          <GableRoof width={w} depth={d} height={1.2} y={3} color="#8b8f86" overhang={0.3} />
        </group>
      )
      break
    case 'training':
      body = (
        <group>
          <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
            <RBox args={[w, 3.2, d]} />
            <meshStandardMaterial color="#efe3c8" />
          </mesh>
          <GableRoof width={w} depth={d} height={2} y={3.2} color="#5c4a8a" overhang={0.6} />
          {/* กี่ทอผ้าหน้าอาคาร */}
          <group position={[-3, 0, d / 2 + 2]}>
            <mesh position={[0, 0.9, 0]} castShadow>
              <RBox args={[1.6, 0.1, 1.2]} />
              <meshStandardMaterial color="#7a5236" />
            </mesh>
            <mesh position={[0, 0.96, 0]}>
              <RBox args={[1.2, 0.02, 0.9]} />
              <meshStandardMaterial color="#b0304a" />
            </mesh>
            {[-1, 1].flatMap((sx) =>
              [-1, 1].map((sz) => (
                <mesh key={`${sx}${sz}`} position={[sx * 0.75, 0.6, sz * 0.55]}>
                  <RBox args={[0.08, 1.2, 0.08]} />
                  <meshStandardMaterial color="#5a3b26" />
                </mesh>
              )),
            )}
          </group>
        </group>
      )
      break
    case 'pond':
      labelY = 3
      body = (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} scale={[w / 2, d / 2, 1]} receiveShadow>
            <circleGeometry args={[1, 40]} />
            <meshStandardMaterial color="#5f8f8a" roughness={0.15} metalness={0.1} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} scale={[w / 2 + 1, d / 2 + 1, 1]}>
            <circleGeometry args={[1, 40]} />
            <meshStandardMaterial color="#7a6a4a" />
          </mesh>
          {/* ท่าน้ำไม้ */}
          <mesh position={[w / 2 - 1, 0.25, 0]} castShadow receiveShadow>
            <RBox args={[4, 0.15, 1.4]} />
            <meshStandardMaterial color="#8a6340" />
          </mesh>
          {/* บัว */}
          {[
            [-3, 2],
            [-5, -1],
            [2, -3],
            [-1, 4],
          ].map(([lx, lz], i) => (
            <mesh key={i} position={[lx, 0.06, lz]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.6, 10]} />
              <meshStandardMaterial color="#4f8a46" />
            </mesh>
          ))}
        </group>
      )
      break
    case 'ricefield':
      labelY = 3
      body = <RiceField w={w} d={d} />
      break
    case 'npchouse':
      labelY = 8
      body = <VillagerHouse color={place.color ?? '#8a5a3b'} />
      break
  }

  return (
    <group position={[x, 0, z]} rotation={[0, place.rotation ?? 0, 0]}>
      {body}
      <Label text={place.name} y={labelY} />
    </group>
  )
}

function RiceField({ w, d }: { w: number; d: number }) {
  const cols = 3
  const rows = 2
  const pw = w / cols
  const pd = d / rows
  return (
    <group>
      {Array.from({ length: cols * rows }).map((_, i) => {
        const cx = -w / 2 + pw * (i % cols) + pw / 2
        const cz = -d / 2 + pd * Math.floor(i / cols) + pd / 2
        return (
          <group key={i} position={[cx, 0, cz]}>
            {/* คันนา */}
            <mesh position={[0, 0.12, 0]} receiveShadow>
              <RBox args={[pw, 0.24, pd]} />
              <meshStandardMaterial color="#8b7a52" />
            </mesh>
            {/* แปลงข้าว */}
            <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
              <RBox args={[pw - 0.8, 0.35, pd - 0.8]} />
              <meshStandardMaterial color={i % 2 ? '#7fb24a' : '#9cc457'} />
            </mesh>
          </group>
        )
      })}
      {/* กระท่อมกลางนา */}
      <group position={[w / 2 - 3, 0, -d / 2 + 3]}>
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh key={`${sx}${sz}`} position={[sx * 1.1, 1.1, sz * 1.1]}>
              <RBox args={[0.15, 2.2, 0.15]} />
              <meshStandardMaterial color="#5a3b26" />
            </mesh>
          )),
        )}
        <mesh position={[0, 0.8, 0]} castShadow>
          <RBox args={[2.4, 0.1, 2.4]} />
          <meshStandardMaterial color="#a07a4a" />
        </mesh>
        <GableRoof width={2.4} depth={2.4} height={1.1} y={2.2} color="#c9a65a" overhang={0.3} />
      </group>
    </group>
  )
}

function PlotMesh({ plot, houseId, ownerName }: { plot: Plot; houseId?: string; ownerName?: string }) {
  const [cx, cz] = plot.center
  const [w, d] = plot.size
  const posts = useMemo(() => {
    const out: [number, number][] = []
    const step = 2
    for (let x = -w / 2; x <= w / 2 + 0.01; x += step) {
      out.push([x, -d / 2], [x, d / 2])
    }
    for (let z = -d / 2 + step; z < d / 2 - 0.01; z += step) {
      // เว้นช่องประตูรั้วด้านถนน (ทิศตะวันตก)
      if (Math.abs(z - 0) < 2) continue
      out.push([-w / 2, z], [w / 2, z])
    }
    return out
  }, [w, d])

  return (
    <group position={[cx, 0, cz]}>
      {/* พื้นที่ดิน */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#a3b46c" />
      </mesh>
      {/* รั้วไม้ไผ่ แสดงขอบเขตที่ดิน */}
      {posts.map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.5, pz]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1, 12]} />
          <meshStandardMaterial color="#c2a560" />
        </mesh>
      ))}
      {houseId && (
        <group position={[plot.houseOffset[0], 0, plot.houseOffset[1]]} rotation={[0, -Math.PI / 2, 0]}>
          <House design={getHouse(houseId)} />
        </group>
      )}
      <group position={[-w / 2 + 1.5, 0, 0]}>
        <Label text={ownerName ? `บ้านของ${ownerName}` : plot.name} y={houseId ? 8 : 2} color="#2b4a28" />
      </group>
    </group>
  )
}

/** กองหินเล็ก ๆ ริมทาง (เก็บก้อนหินได้) */
function Rocks() {
  return (
    <group>
      {ROCKS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, i * 1.7, 0]}>
          <mesh position={[0, 0.18, 0]} scale={[1.2, 0.75, 1]} castShadow receiveShadow>
            <dodecahedronGeometry args={[0.32, 0]} />
            <meshStandardMaterial color="#8d8a84" />
          </mesh>
          <mesh position={[0.36, 0.1, 0.12]} scale={[1, 0.7, 1]} castShadow>
            <dodecahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color="#a19d96" />
          </mesh>
          <mesh position={[-0.28, 0.08, -0.18]} castShadow>
            <dodecahedronGeometry args={[0.13, 0]} />
            <meshStandardMaterial color="#7a766f" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Trees() {
  return (
    <group>
      {TREES.map((t, i) => (
        <Tree key={i} tree={t} />
      ))}
    </group>
  )
}

export function Tree({ tree }: { tree: TreeSpot }) {
  const [x, z] = tree.pos
  const s = tree.scale
  switch (tree.kind) {
    case 'coconut':
      // มะพร้าว: ลำต้นเรียว ใบโค้งเป็นทางยาว ปลายตกลง
      return (
        <group position={[x, 0, z]} scale={s}>
          <mesh position={[0, 3, 0]} rotation={[0, 0, 0.08]} castShadow>
            <cylinderGeometry args={[0.14, 0.24, 6, 12]} />
            <meshStandardMaterial color="#8a7058" roughness={0.9} />
          </mesh>
          {Array.from({ length: 7 }).map((_, k) => (
            <group key={k} position={[0.24, 6, 0]} rotation={[0, (k / 7) * Math.PI * 2, 0]}>
              <mesh position={[0, -0.35, 1.15]} rotation={[0.45, 0, 0]} scale={[0.32, 0.05, 1.35]} castShadow>
                <sphereGeometry args={[1, 16, 10]} />
                <meshStandardMaterial color={k % 2 ? '#5a9a42' : '#4f8a3a'} />
              </mesh>
            </group>
          ))}
          <mesh position={[0.24, 5.9, 0]}>
            <sphereGeometry args={[0.32, 14, 10]} />
            <meshStandardMaterial color="#6a8a3a" />
          </mesh>
        </group>
      )
    case 'banana':
      // กล้วย: ใบกว้างโค้งออกรอบต้น
      return (
        <group position={[x, 0, z]} scale={s}>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.17, 0.23, 2, 14]} />
            <meshStandardMaterial color="#8aa055" />
          </mesh>
          {Array.from({ length: 6 }).map((_, k) => (
            <group key={k} position={[0, 2.05, 0]} rotation={[0, (k / 6) * Math.PI * 2 + 0.3, 0]}>
              <mesh position={[0, 0.25, 0.75]} rotation={[-0.55, 0, 0]} scale={[0.4, 0.035, 0.95]} castShadow>
                <sphereGeometry args={[1, 16, 10]} />
                <meshStandardMaterial color={k % 2 ? '#7ab452' : '#6fa64a'} />
              </mesh>
            </group>
          ))}
        </group>
      )
    case 'mango':
      // มะม่วง: พุ่มกลมหลายก้อนซ้อนกัน (ไม่เป็นเหลี่ยม)
      return (
        <group position={[x, 0, z]} scale={s}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.24, 0.36, 2.4, 14]} />
            <meshStandardMaterial color="#6b5440" roughness={0.9} />
          </mesh>
          {(
            [
              [0, 3.3, 0, 1.7, '#3f6e33'],
              [1.05, 3.0, 0.35, 1.15, '#4a7d3a'],
              [-1.0, 3.05, -0.25, 1.2, '#467a37'],
              [0.15, 4.15, -0.3, 1.15, '#4f8640'],
              [-0.2, 3.1, 1.0, 1.0, '#437535'],
            ] as const
          ).map(([px, py, pz, r, c], k) => (
            <mesh key={k} position={[px, py, pz]} castShadow receiveShadow>
              <icosahedronGeometry args={[r, 3]} />
              <meshStandardMaterial color={c} roughness={0.95} />
            </mesh>
          ))}
        </group>
      )
  }
}
