import { editables, useLayoutEdit } from '../game/layoutEdit'
import { Barn, FarmLand } from './FarmLand'
import { WoodYard } from './WoodYard'
import { OvergrownLot } from './OvergrownLot'
import { Car, OutdoorToilets } from './GrandHome'
import { GrandHome } from './GrandHome'
import { BigStore, Campus, EventGround, Garage, Lake, RoadSurface, Stall } from './VillageLayout'
import { useGame } from '../game/store'
import type { Group } from 'three'
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { rockFx } from '../game/trees'
import { GatherNameLabel, NearLabel } from './NearLabel'
import { TREE_RULES } from '../game/content/trees'
import { BananaTree } from './models/BananaTree'
import { Treasures } from './Treasure'
import { ChoppableTrees } from './ChoppableTrees'
import { Structures } from './Structures'
import { Garden } from './Garden'
import { useMemo } from 'react'
import { TextSprite } from './TextSprite'
import {
  PLACES,
  PLOTS,
  ROADS,
  ROCKS,
  TREES,
  type Place,
  type Plot,
  type TreeSpot,
} from '../game/content/village'
import { getHouse } from '../game/content/houses'
import { House, VillagerHouse, GableRoof, Bush, HouseYard, PicketFence } from './models/House'
import { RBox } from './models/RBox'
import { Bicycle, Pickup, Tractor } from './models/Vehicles'
import { KoiPond, LemonGarden, ParkPad, RotWalls } from './RotHome'
import { MulberryRow, OutdoorKitchen } from './RotBackyard'
import { MangoOrchard, MangoTree } from './Orchard'
import { ArecaGrove } from './ArecaGrove'
import { CoconutPalm } from './models/Palms'
import { ModernHouse } from './ModernHouse'
import { Motorcycle } from './models/Motorcycle'
import { NOEY_VEHICLES } from '../game/content/noeyYard'
import { BigChedi, Temple } from './Temple'

/** ฉากหมู่บ้านทั้งหมด (สิ่งที่อยู่นิ่ง) */
export function Village({ playerHouseId, playerName }: { playerHouseId?: string; playerName?: string }) {
  return (
    <group>
      <Ground />
      {ROADS.map((r, i) => (
        <RoadSurface key={i} road={r} index={i} />
      ))}
      {PLACES.map((p) => (
        <PlaceMesh key={p.id} place={p} />
      ))}
      {PLOTS.map((p) => (
        <PlotMesh key={p.id} plot={p} houseId={playerHouseId} ownerName={playerName} />
      ))}
      <Trees />
      <Rocks />
      <GatherName />
      <Garden />
      <Structures />
      <Treasures />
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
// ภูเขากรวยเดิม (เลิกใช้: ใช้เนินเขาเขียวใน SoftWorld แทน) — เก็บไว้เผื่ออยากกลับไปใช้
export function Mountains() {
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

/** ป้ายชื่อสถานที่: ขึ้นเฉพาะตอนเดินเข้าใกล้ (ดู NearLabel) */
function Label({ text, y, color = '#2e2a24', r = 8 }: { text: string; y: number; color?: string; r?: number }) {
  return <NearLabel text={text} y={y} r={r} color={color} height={0.7} />
}

/** ชื่อต้นไม้/หินที่ยืนใกล้ (เป้าหมายกด E) */
function GatherName() {
  const t = useGame((s) => s.gatherTarget)
  let target: { text: string; x: number; z: number; y: number } | null = null
  if (t?.kind === 'tree') {
    const tr = TREES[t.index]
    target = { text: TREE_RULES[tr.kind].name, x: tr.pos[0], z: tr.pos[1], y: 4.6 * tr.scale }
  } else if (t?.kind === 'rock') target = { text: 'หิน', x: ROCKS[t.index][0], z: ROCKS[t.index][1], y: 1.1 }
  return <GatherNameLabel target={target} />
}

function PlaceMesh({ place }: { place: Place }) {
  // โหมดย้ายที่: แสดงตำแหน่งที่กำลังลากวาง (ยังไม่บันทึก) ทันที
  const live = useLayoutEdit((st) => st.draft['place:' + place.id])
  const [x, z] = live ? [live.x, live.z] : place.pos
  const rotY = live ? live.rot : (place.rotation ?? 0)
  useEffect(() => {
    editables.set('place:' + place.id, { id: 'place:' + place.id, name: place.name, wx: x, wz: z, rot: rotY, r: Math.max(2, Math.min(place.size[0], place.size[1]) / 2) })
  }, [place.id, place.name, x, z, rotY, place.size])
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
            <RBox args={[w, 0.5, d]} radius={0.18} />
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
          <Bush x={-w / 2 - 0.7} z={0} s={0.9} flowers="#e86a5a" />
          <Bush x={w / 2 + 0.7} z={0} s={0.9} flowers="#f6c445" />
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
            <RBox args={[2.6, 1.4, 0.14]} radius={0.06} />
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
            <RBox args={[3, 0.16, 0.5]} radius={0.07} />
            <meshStandardMaterial color="#7b3b2a" />
          </mesh>
          <BoardBadge id={place.id} />
          <Bush x={-1.8} z={0.5} s={0.6} flowers="#f6c445" />
          <Bush x={1.8} z={0.5} s={0.6} flowers="#f29ab8" />
        </group>
      )
      break
    case 'shop':
      labelY = place.style === 'stall' ? 4.6 : 6
      body = place.style === 'stall' ? <Stall w={w} d={d} color={place.color ?? '#3f7a8c'} name={place.name.replace(/ \(ซอย \d\)/, '')} /> : <BigStore w={w} d={d} />
      break
    case 'garage':
      labelY = 5
      body = <Garage w={w} d={d} />
      break
    case 'eventground':
      labelY = 6.5
      body = <EventGround w={w} d={d} />
      break
    case 'lake':
      labelY = 3
      body = <Lake w={w} d={d} />
      break
    case 'fencedlot':
      labelY = 0
      body = (
        <group>
          <FencedLot w={w} d={d} pad={place.id === 'lot-noey'} />
          {place.id === 'lot-noey' && <NoeyParking />}
        </group>
      )
      break
    case 'barnyard':
      labelY = 4
      body = <BarnYard w={w} d={d} />
      break
    case 'overgrown':
      labelY = 3
      body = <OvergrownLot w={w} d={d} />
      break
    case 'arecagrove':
      labelY = 0
      body = <ArecaGrove w={w} d={d} />
      break
    case 'mangoorchard':
      labelY = 4.5
      body = <MangoOrchard w={w} d={d} />
      break
    case 'mulberry':
      labelY = 3.2
      body = <MulberryRow w={w} d={d} />
      break
    case 'outkitchen':
      labelY = 3.4
      body = <OutdoorKitchen w={w} d={d} />
      break
    case 'koipond':
      labelY = 3
      body = (
        <group>
          <KoiPond w={w} d={d} />
          {place.id === 'rot-koi' && (
            <group position={[-x, 0, -z]}>
              <RotWalls />
            </group>
          )}
        </group>
      )
      break
    case 'lemongarden':
      labelY = 3
      body = <LemonGarden w={w} d={d} />
      break
    case 'parkpad':
      labelY = 0
      body = <ParkPad w={w} d={d} />
      break
    case 'woodyard':
      labelY = 3
      body = <WoodYard w={w} d={d} />
      break
    case 'farm':
      labelY = 4
      body = <FarmLand w={w} d={d} />
      break
    case 'grandhome':
      labelY = 9
      body = <GrandHome />
      break
    case 'training':
      body = (
        <group>
          <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
            <RBox args={[w, 3.2, d]} radius={0.32} />
            <meshStandardMaterial color="#efe3c8" />
          </mesh>
          <GableRoof width={w} depth={d} height={2} y={3.2} color="#3f7a5a" overhang={0.6} />
          <mesh position={[0, 1.15, d / 2 + 0.03]}>
            <RBox args={[1.6, 2.2, 0.08]} radius={0.04} />
            <meshStandardMaterial color="#6b4a2e" />
          </mesh>
          {[-3.6, -2, 2, 3.6].map((wx) => (
            <mesh key={wx} position={[wx, 1.7, d / 2 + 0.03]}>
              <RBox args={[1.1, 0.9, 0.06]} radius={0.03} />
              <meshStandardMaterial color="#6d8fa8" />
            </mesh>
          ))}
          <Bush x={w / 2 - 0.4} z={d / 2 + 1} s={1} flowers="#c99af0" />
          <Bush x={-w / 2 + 0.4} z={-d / 2 - 0.6} s={0.9} flowers="#ffffff" />
          {/* กี่ทอผ้า/ชั้นเลี้ยงไหม/เตาสาว/โต๊ะตัดเย็บ: scenes/SilkCenter.tsx (ใช้งานได้จริง) */}
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
    case 'school':
      labelY = 13
      body = <Campus size={w} />
      break
    case 'ricefield':
      labelY = 3
      body = <RiceField w={w} d={d} />
      break
    case 'npchouse':
      labelY = 8
      body = (
        <group>
          {place.houseStyle === 'modern' ? (
            <ModernHouse shopWing={place.id === 'house-rot' ? -1 : undefined} />
          ) : (
          <group scale={place.houseScale ?? 1}>
            <VillagerHouse color={place.color ?? '#8a5a3b'} seed={[...place.id].reduce((a, c) => a + c.charCodeAt(0), 0)} style={place.houseStyle} roof={place.roof} />
            <HouseYard seed={place.id.length} />
          </group>
          )}
          {place.frontYard && <KidsYard depth={place.frontYard} />}
        </group>
      )
      break
  }

  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {body}
      {labelY > 0 && <Label text={place.name} y={labelY} r={Math.max(w, d) / 2 + 4} />}
    </group>
  )
}

/** ลานโล่งหน้าบ้าน: พื้นดินอัดแน่น ที่วิ่งเล่น จอดจักรยาน/รถของเล่นของเด็ก */
function KidsYard({ depth }: { depth: number }) {
  const z0 = 4.5
  return (
    <group>
      <mesh position={[0, 0.025, z0 + depth / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, depth]} />
        <meshStandardMaterial color="#c9b07a" roughness={1} />
      </mesh>
      {/* จักรยานเด็ก 2 คัน จอดข้างบ้าน */}
      {[
        [-5, z0 + 1.5, '#d8453a'],
        [-5.8, z0 + 2.6, '#3a7ad8'],
      ].map(([x, z, col], i) => (
        <group key={i} position={[x as number, 0, z as number]} rotation={[0, Math.PI / 2, 0]}>
          {[-0.38, 0.38].map((wz) => (
            <mesh key={wz} position={[0, 0.24, wz]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.22, 0.035, 6, 16]} />
              <meshStandardMaterial color="#2b2b2b" />
            </mesh>
          ))}
          <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 6]} />
            <meshStandardMaterial color={col as string} />
          </mesh>
          <mesh position={[0, 0.58, -0.22]}>
            <RBox args={[0.12, 0.05, 0.24]} radius={0.02} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, 0.62, 0.36]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.42, 6]} />
            <meshStandardMaterial color="#888" />
          </mesh>
        </group>
      ))}
      {/* รถของเล่นสีเหลือง */}
      <group position={[3.5, 0, z0 + 3]} rotation={[0, 0.6, 0]}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <RBox args={[0.6, 0.3, 1]} radius={0.1} />
          <meshStandardMaterial color="#f0c23a" />
        </mesh>
        <mesh position={[0, 0.5, -0.1]}>
          <RBox args={[0.5, 0.2, 0.45]} radius={0.08} />
          <meshStandardMaterial color="#e8eef2" />
        </mesh>
        {[-1, 1].flatMap((sx) =>
          [-0.32, 0.32].map((wz) => (
            <mesh key={sx + ':' + wz} position={[sx * 0.32, 0.12, wz]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.12, 0.12, 0.08, 10]} />
              <meshStandardMaterial color="#2b2b2b" />
            </mesh>
          )),
        )}
      </group>
      {/* ลูกบอล + ตารางกระโดดขาเดียวขีดบนพื้น */}
      <mesh position={[1.5, 0.18, z0 + 9]} castShadow>
        <sphereGeometry args={[0.18, 12, 10]} />
        <meshStandardMaterial color="#e2533c" />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-2, 0.03, z0 + 6 + i * 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.26, 0.3, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color="#f4f0e4" />
        </mesh>
      ))}
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
      {/* รั้วไม้รอบนา เว้นประตูกลางด้านใต้ */}
      <PicketFence x={0} z={d / 2 + 0.6} len={w + 1.2} />
      <PicketFence x={(-w / 2 - 0.6 - 1.6) / 2} z={-d / 2 - 0.6} len={w / 2 + 0.6 - 1.6} />
      <PicketFence x={(w / 2 + 0.6 + 1.6) / 2} z={-d / 2 - 0.6} len={w / 2 + 0.6 - 1.6} />
      <PicketFence x={-w / 2 - 0.6} z={0} len={d + 1.2} rot={Math.PI / 2} />
      <PicketFence x={w / 2 + 0.6} z={0} len={d + 1.2} rot={Math.PI / 2} />
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
      out.push([x, -d / 2])
      // ด้านถนน (เหนือ): เว้นช่องทางเข้าที่จอดรถหน้าบ้าน
      if (Math.abs(x + 0.5) > 3) out.push([x, d / 2])
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
        <group position={[plot.houseOffset[0], 0, plot.houseOffset[1]]} rotation={[0, plot.houseRot ?? -Math.PI / 2, 0]}>
          <House design={getHouse(houseId)} />
        </group>
      )}
      {plot.id === 'start-plot' && <MaeChatYard />}
      <group position={[-w / 2 + 1.5, 0, 0]}>
        <Label text={plot.houseName ?? (ownerName ? `บ้านของ${ownerName}` : plot.name)} y={houseId ? 8 : 2} color="#2b4a28" />
      </group>
    </group>
  )
}

/** กองหินเล็ก ๆ ริมทาง (เก็บก้อนหินได้) */
function Rocks() {
  // โดนทุบ: กองหินสั่นสั้น ๆ
  const refs = useRef<(Group | null)[]>([])
  useFrame(() => {
    const now = performance.now()
    for (const [i, t] of rockFx) {
      const g = refs.current[i]
      if (!g) continue
      const e = (now - t) / 1000
      if (e > 0.35) {
        g.position.x = ROCKS[i][0]
        rockFx.delete(i)
      } else g.position.x = ROCKS[i][0] + Math.sin(e * 70) * 0.04 * (1 - e / 0.35)
    }
  })
  return (
    <group>
      {ROCKS.map(([x, z], i) => (
        <group key={i} ref={(el) => { refs.current[i] = el }} position={[x, 0, z]} rotation={[0, i * 1.7, 0]}>
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
  return <ChoppableTrees Tree={Tree} />
}

export function Tree({ tree }: { tree: TreeSpot }) {
  const [x, z] = tree.pos
  const s = tree.scale
  switch (tree.kind) {
    case 'coconut':
      // มะพร้าว: ลำต้นโค้งมีข้อ ทางใบยาวโค้งมีใบย่อยห้อย ทะลายมะพร้าวเขียวใต้ยอด
      return (
        <group position={[x, 0, z]} scale={s}>
          <CoconutPalm h={10} seed={x * 0.37 + z * 0.61} />
        </group>
      )
    case 'banana':
      // กล้วย: ลำต้นกาบซ้อน ใบยาวโค้งปลายตก บางต้นมีเครือกล้วยกับหัวปลี
      return (
        <group position={[x, 0, z]} scale={s}>
          <BananaTree seed={Math.round(x * 7 + z * 13)} />
        </group>
      )
    case 'mango':
      // มะม่วง: แบบเดียวกับสวนบ้านน้าโรจน์ · ต้นมะม่วงทั่วหมู่บ้านลูกเขียวล้วน
      return (
        <group position={[x, 0, z]} scale={s * 1.25}>
          <MangoTree variety="green" seed={x * 0.31 + z * 0.17} ripe={false} />
        </group>
      )
  }
}

/** ป้าย ! ลอยเหนือบอร์ดเมื่อมีประกาศใหม่ที่ยังไม่ได้อ่านวันนี้ */
function BoardBadge({ id }: { id: string }) {
  const seen = useGame((s) => s.save?.boardSeen?.[id])
  const day = useGame((s) => s.save?.day)
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = 3.3 + Math.sin(clock.elapsedTime * 2.5) * 0.08
  })
  if (seen === day) return null
  return (
    <group ref={ref} position={[0, 3.3, 0]}>
      <TextSprite text="❗ ประกาศใหม่" color="#b5603a" height={0.42} position={[0, 0, 0]} />
    </group>
  )
}


/** ลานหน้าบ้านแม่ฉัตร (พิกัดภายในแปลง): ที่จอดรถหน้าบ้าน · สวนดอกไม้ริมถนน · ห้องน้ำนอกบ้าน */
function MaeChatYard() {
  const flowers = ['#f29ab8', '#f6d65a', '#e85a6a', '#c9a0e8', '#ffffff', '#f2a65a']
  return (
    <group>
      {/* ที่จอดรถ: ลานปูน + รถ 1 คัน */}
      <mesh position={[-0.5, 0.035, 5.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 4.5]} />
        <meshStandardMaterial color="#cfc9bb" roughness={0.95} />
      </mesh>
      {/* จอดหันหัวเข้าบ้าน (แนวตั้งฉากกับถนน) */}
      <group position={[-0.5, 0, 5.5]}>
        <Car x={0} z={0} />
      </group>
      {/* โต๊ะไม้นั่งกินข้าวข้างที่จอดรถ: โต๊ะยาว + ม้านั่ง 2 ข้าง + กระติบข้าวเหนียว ถ้วยกับข้าว */}
      <DiningTable x={3.4} z={5.4} />
      {/* แนวหน้าบ้านริมรั้ว: ช่อง 1 ชั้นวางไม้ประดับ · ช่อง 2 สวนดาวเรือง · ช่อง 3 แปลงสมุนไพร */}
      <PlantShelf x={2.6} z={8.1} />
      <MarigoldBed x={5.5} z={8.1} />
      <HerbBed x={8.4} z={8.1} />
      {/* สวนดอกไม้: ขอบไม้ + กอดอกไม้หลากสี */}
      <group position={[-7.2, 0, 5.5]}>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4, 4]} />
          <meshStandardMaterial color="#7a5a3e" roughness={1} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => (
          <Bush key={i} x={-1.4 + (i % 4) * 0.95} z={-1.3 + Math.floor(i / 4) * 1.3} s={0.55 + (i % 3) * 0.08} flowers={flowers[i % flowers.length]} />
        ))}
      </group>
      {/* ห้องน้ำนอกบ้าน */}
      {/* ประตูห้องน้ำหันเข้าหาบ้าน */}
      <group position={[-7, 0, -1.5]} rotation={[0, -Math.PI / 2, 0]}>
        <OutdoorToilets x={0} z={0} />
      </group>
    </group>
  )
}

/** โต๊ะไม้กินข้าวหน้าบ้าน (แบบบ้านชนบท): โต๊ะยาว ม้านั่งยาวสองฝั่ง มีกระติบข้าวเหนียวกับถ้วยกับข้าว */
function DiningTable({ x, z }: { x: number; z: number }) {
  const WOOD = '#8a5a34'
  const DARK = '#6b4428'
  return (
    <group position={[x, 0, z]}>
      {/* พื้นโต๊ะ */}
      <mesh position={[0, 0.76, 0]} castShadow receiveShadow>
        <RBox args={[1.2, 0.08, 2.2]} radius={0.03} />
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </mesh>
      {[-0.5, 0.5].flatMap((lx) => [-0.95, 0.95].map((lz) => (
        <mesh key={lx + ':' + lz} position={[lx, 0.37, lz]} castShadow>
          <boxGeometry args={[0.08, 0.74, 0.08]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
      )))}
      {/* ม้านั่งสองฝั่ง */}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[sd * 0.95, 0, 0]}>
          <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
            <RBox args={[0.34, 0.06, 2.1]} radius={0.02} />
            <meshStandardMaterial color={WOOD} roughness={0.85} />
          </mesh>
          {[-0.85, 0.85].map((lz) => (
            <mesh key={lz} position={[0, 0.21, lz]}>
              <boxGeometry args={[0.07, 0.42, 0.07]} />
              <meshStandardMaterial color={DARK} />
            </mesh>
          ))}
        </group>
      ))}
      {/* กระติบข้าวเหนียว + ถ้วยกับข้าว + จานสังกะสี */}
      <mesh position={[0, 0.9, -0.5]}>
        <cylinderGeometry args={[0.13, 0.11, 0.2, 14]} />
        <meshStandardMaterial color="#c8a46a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.02, -0.5]}>
        <cylinderGeometry args={[0.14, 0.13, 0.05, 14]} />
        <meshStandardMaterial color="#b8945a" />
      </mesh>
      {[[-0.25, 0.15, '#e86a3a'], [0.25, 0.3, '#5a9a3a'], [0, 0.65, '#d8b04a']].map(([bx, bz, c], i) => (
        <group key={i} position={[bx as number, 0.82, bz as number]}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.08, 0.08, 14]} />
            <meshStandardMaterial color="#f2efe6" />
          </mesh>
          <mesh position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.02, 14]} />
            <meshStandardMaterial color={c as string} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.3, 0.83, -0.15]}>
        <cylinderGeometry args={[0.06, 0.05, 0.12, 10]} />
        <meshStandardMaterial color="#c0c4c8" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  )
}

/** ช่อง 1: ชั้นไม้ขั้นบันได วางกระถางไม้ประดับ */
function PlantShelf({ x, z }: { x: number; z: number }) {
  const leaf = ['#4f8a3a', '#6aa04a', '#3f7a3a', '#7ab050']
  const pot = ['#b5653a', '#c47a4a', '#a8583a', '#d08a5a']
  return (
    <group position={[x, 0, z]}>
      {[0, 1, 2].map((k) => (
        <group key={k}>
          <mesh position={[0, 0.25 + k * 0.32, 0.3 - k * 0.3]} castShadow>
            <boxGeometry args={[2.4, 0.06, 0.34]} />
            <meshStandardMaterial color="#8a5a34" roughness={0.85} />
          </mesh>
          {[-0.8, 0, 0.8].map((px, i) => (
            <group key={i} position={[px + (k % 2) * 0.25, 0.28 + k * 0.32, 0.3 - k * 0.3]}>
              <mesh position={[0, 0.09, 0]}>
                <cylinderGeometry args={[0.11, 0.08, 0.18, 12]} />
                <meshStandardMaterial color={pot[(i + k) % pot.length]} roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.28, 0]} scale={[1, 0.9 + ((i + k) % 3) * 0.15, 1]}>
                <sphereGeometry args={[0.16, 14, 10]} />
                <meshStandardMaterial color={leaf[(i * 2 + k) % leaf.length]} roughness={0.9} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {[-1.15, 1.15].map((px) => (
        <mesh key={px} position={[px, 0.5, 0]}>
          <boxGeometry args={[0.07, 1, 0.9]} />
          <meshStandardMaterial color="#6b4428" />
        </mesh>
      ))}
    </group>
  )
}

/** ช่อง 2: สวนดอกดาวเรือง (ส้ม–เหลือง) ขอบไม้ */
function MarigoldBed({ x, z }: { x: number; z: number }) {
  const spots = Array.from({ length: 18 }, (_, i) => [(i % 6) * 0.42 - 1.05, Math.floor(i / 6) * 0.42 - 0.42] as const)
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[2.7, 0.16, 1.35]} />
        <meshStandardMaterial color="#7a5232" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 1.15]} />
        <meshStandardMaterial color="#5a4030" roughness={1} />
      </mesh>
      {spots.map(([sx, sz], i) => (
        <group key={i} position={[sx, 0.17, sz]}>
          <mesh position={[0, 0.12, 0]} scale={[1, 0.8, 1]}>
            <sphereGeometry args={[0.13, 10, 8]} />
            <meshStandardMaterial color="#4f8a3a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.27, 0]} scale={[1, 0.75, 1]}>
            <sphereGeometry args={[0.11, 14, 10]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#f6c23a' : '#f08a1e'} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** ช่อง 3: แปลงสมุนไพร — ตะไคร้ กะเพรา พริก ข่า สะระแหน่ */
function HerbBed({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[2.7, 0.16, 1.35]} />
        <meshStandardMaterial color="#7a5232" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.17, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 1.15]} />
        <meshStandardMaterial color="#5a4030" roughness={1} />
      </mesh>
      {/* ตะไคร้: ใบยาวเรียวเป็นกอ */}
      {[-0.9, -0.5].map((px) => (
        <group key={px} position={[px, 0.17, -0.2]}>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={[Math.cos(i) * 0.05, 0.3, Math.sin(i) * 0.05]} rotation={[Math.cos(i * 2) * 0.35, 0, Math.sin(i * 2) * 0.35]}>
              <coneGeometry args={[0.025, 0.65, 4]} />
              <meshStandardMaterial color="#8ab04a" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      {/* กะเพรา / สะระแหน่: พุ่มเตี้ยใบเขียวเข้ม */}
      {[-0.05, 0.35, 0.75].map((px, i) => (
        <mesh key={px} position={[px, 0.3, i % 2 ? 0.25 : -0.2]} scale={[1, 0.75, 1]}>
          <sphereGeometry args={[0.17, 12, 10]} />
          <meshStandardMaterial color={i === 1 ? '#5aa04a' : '#3f7a34'} roughness={0.9} />
        </mesh>
      ))}
      {/* พริก: พุ่มมีเม็ดแดง */}
      <group position={[1.0, 0.17, 0.2]}>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.16, 12, 10]} />
          <meshStandardMaterial color="#4f8a3a" roughness={0.9} />
        </mesh>
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} position={[Math.cos(k * 1.6) * 0.13, 0.22 + (k % 2) * 0.06, Math.sin(k * 1.6) * 0.13]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.025, 0.09, 6]} />
            <meshStandardMaterial color="#d8322a" roughness={0.6} />
          </mesh>
        ))}
      </group>
      {/* ข่า: ใบใหญ่ตั้ง */}
      {[0, 1].map((k) => (
        <mesh key={k} position={[-0.6 + k * 0.15, 0.4, 0.3]} rotation={[0.2, k, 0.15]} scale={[0.35, 1, 0.06]}>
          <sphereGeometry args={[0.28, 10, 8]} />
          <meshStandardMaterial color="#6a9a3a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/** ลานยุ้งข้าว + กองฟางก้อนใหญ่ (บ้านพี่เอม) */
function BarnYard({ w, d }: { w: number; d: number }) {
  const stacks: [number, number, number][] = [
    [2.6, 1.6, 1.5],
    [-0.4, 2.4, 1.25],
    [3.6, -1.2, 1.0],
    [1.2, 0.1, 0.8],
  ]
  return (
    <group>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#b9a372" roughness={1} />
      </mesh>
      {/* ยุ้งข้าวใต้ถุนสูง */}
      <Barn x={-3} z={-1.2} />
      {/* กองฟางก้อนใหญ่ทรงโดม มีเสาไม้กลางกอง */}
      {stacks.map(([x, z, s], i) => (
        <group key={i} position={[x, 0, z]} scale={s}>
          <mesh position={[0, 0.75, 0]} scale={[1.25, 1, 1.25]} castShadow receiveShadow>
            <sphereGeometry args={[1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={i % 2 ? '#e2c46a' : '#d8b65a'} roughness={1} />
          </mesh>
          <mesh position={[0, 0.38, 0]} scale={[1.25, 0.75, 1.25]} castShadow>
            <cylinderGeometry args={[1, 1.05, 1, 24]} />
            <meshStandardMaterial color={i % 2 ? '#d8b65a' : '#cfac50'} roughness={1} />
          </mesh>
          <mesh position={[0, 1.95, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.6, 6]} />
            <meshStandardMaterial color="#6b4a2e" />
          </mesh>
        </group>
      ))}
      {/* ฟางร่วงบนพื้น */}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={'s' + i} position={[Math.cos(i * 2.3) * 3.5 + 1, 0.04, Math.sin(i * 2.3) * 2.6]} rotation={[-Math.PI / 2, 0, i]}>
          <planeGeometry args={[0.6, 0.12]} />
          <meshStandardMaterial color="#e2c46a" />
        </mesh>
      ))}
    </group>
  )
}

/** ที่ดินมีรั้วล้อม (รั้วไม้ระแนง) · ประตูทางเข้าด้านหน้า (−z ด้านถนน) กว้าง 3 ม. · พื้นหญ้าตัดเรียบ */
function FencedLot({ w, d, pad }: { w: number; d: number; pad?: boolean }) {
  const h = w / 2
  const dd = d / 2
  const gate = 1.5
  return (
    <group>
      <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#9fbf62" roughness={1} />
      </mesh>
      {/* ทางเดินปูนจากประตูถึงหน้าบ้าน (pad = ลานปูนจอดรถกว้างเต็มหน้าบ้าน) */}
      <mesh position={[0, 0.03, pad ? -dd + 7 : -dd + 1.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={pad ? [w - 1.4, 14] : [2.2, 3.2]} />
        <meshStandardMaterial color="#d6d0c2" roughness={0.95} />
      </mesh>
      <PicketFence x={0} z={dd} len={w} />
      <PicketFence x={h} z={0} len={d} rot={Math.PI / 2} />
      <PicketFence x={-h} z={0} len={d} rot={Math.PI / 2} />
      <PicketFence x={(-h + -gate) / 2} z={-dd} len={h - gate} />
      <PicketFence x={(h + gate) / 2} z={-dd} len={h - gate} />
      {/* เสาประตูรั้ว */}
      {[-gate, gate].map((x) => (
        <mesh key={x} position={[x, 0.6, -dd]} castShadow>
          <boxGeometry args={[0.18, 1.2, 0.18]} />
          <meshStandardMaterial color="#d8d2c4" />
        </mesh>
      ))}
    </group>
  )
}

/** ลานจอดรถหน้าบ้านน้องเนย (พิกัดภายในที่ดิน: −z = ประตูรั้วฝั่งซอย 1, +z = หน้าบ้าน) */
function NoeyParking() {
  return (
    <group>
      {NOEY_VEHICLES.map((v, i) => (
        <group key={i} position={[v.x, 0, v.z]} rotation={[0, v.rot ?? 0, 0]}>
          {v.kind === 'pickup' && <Pickup />}
          {v.kind === 'tractor' && <Tractor />}
          {v.kind === 'moto' && <Motorcycle color={v.color} kind={v.moto} lean={0.1} />}
          {v.kind === 'bike' && <Bicycle color={v.color} />}
        </group>
      ))}
    </group>
  )
}
