import { useMemo, useRef } from 'react'
import { CanvasTexture, RepeatWrapping, Vector3, type Group } from 'three'
import { useFrame } from '@react-three/fiber'
import { exactMinute } from '../game/clock'
import { RBox } from './models/RBox'
import { CashewTree } from './models/CashewTree'
import { WaterTower } from './models/WaterTower'
import { Editable } from './Editable'
import { LIVE } from '../game/layoutEdit'
import { PLACES } from '../game/content/village'
import { Bush, GableRoof, OpenWindow } from './models/House'
import { BananaTree } from './models/BananaTree'
import { Pet } from './models/Pet'
import { SignBoard } from './SignBoard'
import { ArecaPalmTree, CoconutPalm } from './models/Palms'
import { MangoTree, type MangoVariety } from './Orchard'
import { Windy } from './Wind'
import { CreamFence } from './models/CreamFence'
import { BambooClump } from './models/BambooClump'
import { PineappleBed } from './models/Pineapple'
import { callSound } from './VillageLife'
import { CurtainWindow, GlassBlockWindow, LaceWindow } from './models/Windows'
import type { PetChoice } from '../game/content/pets'

/**
 * บ้านตารัง–ยายเลียน (บ้านฟ่าง) — อ้างอิง docs/HOME_TARANG_YAILIAN.md
 * พิกัดภายในบริเวณบ้าน (x = ตะวันออก, z = เหนือ) ขอบใต้ (z = −13) ติดถนนดินแดงที่ตัดเข้ากลุ่มบ้าน
 */
/**
 * ขอบเขตรั้วบ้าน (พิกัดภายใน เทียบจุดกลางเดิม) — ขยายพื้นที่ไปทางตะวันออกและทางเหนือ (ผู้สร้าง 18 พ.ย. 2569: "บ้านฟ่างใหญ่กว่านี้")
 * ฝั่งตะวันตก (ติดซอย 2) และฝั่งใต้ (ติดถนนดินแดง/ประตู) อยู่ที่เดิม
 */
export const HOME_BOX = { x0: -17, x1: 33, z0: -13, z1: 38 }
/** ช่องทางเข้ารถยนต์ 1 คัน ที่รั้วฝั่งเหนือ (ติดถนนดินแดงแนวนอนหลังบ้าน): x กลางช่อง · ครึ่งความกว้าง */
export const HOME_BACK_GATE = { x: 9.5, half: 4.5 } // ย้ายไปทางตะวันออก 8 ม. (ผู้สร้าง 19 พ.ย.)
/** มุมรั้วด้านซอย 2 ฝั่งถนนหลังบ้าน (มุม x0, z1) ไม่มีรั้ว เป็นพื้นที่ว่างทางลัดเดินเข้าออก — เว้นกี่เมตรจากมุมทั้งสองด้าน */
export const HOME_CORNER_GAP = 4
/** ช่องทางเข้าออกที่รั้วฝั่งซอย 2 (ข้างรถ หน้ายุ้งข้าว) ไม่มีรั้ว (ผู้สร้าง 19 พ.ย. 2569): z กลางช่อง · ครึ่งความกว้าง */
export const HOME_SIDE_GAP = { z: 8.5, half: 4.5 }
export const HOME_W = HOME_BOX.x1 - HOME_BOX.x0
export const HOME_D = HOME_BOX.z1 - HOME_BOX.z0
const BOX_CX = (HOME_BOX.x0 + HOME_BOX.x1) / 2
const BOX_CZ = (HOME_BOX.z0 + HOME_BOX.z1) / 2
/** ประตูรั้วหน้าบ้าน (พิกัดภายใน) */
export const HOME_GATE: [number, number] = [-6.5, -13]

/** ตำแหน่งสิ่งปลูกสร้างทึบ (ใช้ทำกล่องชน) — [x, z, กว้าง, ลึก] */
const BASE_SOLIDS: [number, number, number, number, string][] = [
  [-7.5, -6, 13, 9, 'main'], // บ้านไม้สองชั้น (ชั้นล่าง = ครัว)
  [-14.4, -3.9, 0.8, 4.1, 'bathroom'], // ห้องอาบน้ำยื่นออกจากผนังบ้านด้านตะวันตก
  [-12, 9, 3, 3, 'ricebarn'], // ยุ้งข้าว
  [-6.5, 9, 5, 4, 'cookhouse'], // บ้านหลังที่สอง (ครัว)
  [-2, 10.2, 3, 2, 'toilets'], // ห้องน้ำนอกบ้าน 2 ห้อง
  [8, 10.5, 2.5, 2, 'coop'], // เล้าไก่
  [11, 10.5, 2.5, 2.5, 'pigpen'], // คอกหมู
  [13.5, 7, 2, 3, 'strawbarn'], // ยุ้งฟาง
  [3.8, -10.2, 3.2, 2.4, 'orchid3'], // เรือนกล้วยไม้ (ย้ายไปแทนที่ต้นยอ 2 ต้น 19 พ.ย.)
  [10.6, -11, 4.8, 3.8, 'watertower3'], // หอถังน้ำ + เพิงปั๊ม (ย้ายมาหน้าบ้านฝั่งถนน 19 พ.ย.)
]
/** ตำแหน่งสิ่งปลูกสร้างทึบ (ใช้ทำกล่องชน) — [x, z, กว้าง, ลึก] · ย้ายตามโหมด "ย้ายที่" (หมุน ~90° สลับกว้าง/ลึก) */
export function homeSolids(): [number, number, number, number][] {
  return BASE_SOLIDS.map(([x, z, w, d, id]) => {
    const m = LIVE.map['home:' + id]
    if (!m) return [x, z, w, d]
    const q = Math.abs(Math.sin(m.rot)) > 0.7
    return [m.x, m.z, q ? d : w, q ? w : d]
  })
}

export function GrandHome() {
  const { x0, x1, z0, z1 } = HOME_BOX
  // จุดกลางบ้านในพิกัดโลก (สำหรับโหมดย้ายที่)
  const hp = PLACES.find((p) => p.id === 'home-tarang')
  const O: [number, number] = hp ? [hp.pos[0], hp.pos[1]] : [0, 0]
  return (
    <group>
      {/* พื้นดินบริเวณบ้าน + ลานปูนหน้าบ้าน */}
      <mesh position={[BOX_CX, 0.022, BOX_CZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HOME_W, HOME_D]} />
        <meshStandardMaterial color="#93ad62" />
      </mesh>
      <mesh position={[-6.5, 0.03, 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11, 5]} />
        <meshStandardMaterial color="#c9c3b5" />
      </mesh>
      <Editable id="home:main" name="บ้านไม้สองชั้น (บ้านหลัก)" x={-7.5} z={-6} r={6} origin={O}>
        <MainHouse />
      </Editable>
      {/* แคร่หน้าประตู = ที่นอนของน้องหมา + แคร่ใหญ่ 2 ตัวข้างครัว */}
      <Editable id="home:frontbench" name="แคร่หน้าประตู + น้องหมา" x={-3.9} z={-0.3} origin={O}>
        <group position={[4.1, 0, 0.1]}>
          <Bench x={-8} z={-0.4} w={2.2} d={1.2} />
          <HousePets only="dog" />
        </group>
      </Editable>
      <Editable id="home:sidebench" name="แคร่ใหญ่ข้างครัว + แมว" x={0.6} z={-3} origin={O}>
        <group position={[3.9, 0, -0.3]}>
          <Bench x={-3.3} z={-2} w={1.8} d={1.1} />
          <Bench x={-3.3} z={-3.4} w={1.8} d={1.1} />
          <HousePets only="cat" />
        </group>
      </Editable>
      <Editable id="home:car" name="รถยนต์" x={-9.6} z={1.4} origin={O}>
        {/* จอดรถ 1 คัน: ลานปูนหน้าประตูด้านเหนือ ฝั่งตะวันตกของประตู */}
        <Car x={-9.6} z={1.4} />
      </Editable>
      <Editable id="home:filter" name="เครื่องกรองน้ำ" x={-13.4} z={-11.8} origin={O}>
        <WaterFilter x={-13.4} z={-11.8} />
      </Editable>
      {/* โอ่งใหญ่ใส่น้ำ + โอ่งรองน้ำฝน หลังครัว */}
      {[
        [-2.2, -0.4, 0.55],
        [-2.2, 0.8, 0.45],
      ].map(([x, z, r]) => (
        <group key={z} position={[x, 0, z]}>
          <mesh position={[0, r, 0]} castShadow>
            <sphereGeometry args={[r, 16, 12]} />
            <meshStandardMaterial color="#7a4a2c" roughness={0.6} />
          </mesh>
          <mesh position={[0, r * 1.95, 0]}>
            <cylinderGeometry args={[r * 0.55, r * 0.6, 0.08, 16]} />
            <meshStandardMaterial color="#6a3f24" />
          </mesh>
        </group>
      ))}
      <Editable id="home:watertower3" name="หอถังน้ำ + เพิงปั๊มน้ำ" x={10.6} z={-11} r={2.6} origin={O}>
        <group position={[10.6, 0, -11]}>
          <WaterTower />
        </group>
      </Editable>
      {/* สวนผัก + สวนดอกไม้ เอาออกแล้ว รอรูปตัวอย่างจากผู้สร้างเพื่อทำใหม่ (19 พ.ย.) */}
      <Editable id="home:orchid3" name="เรือนกล้วยไม้" x={3.8} z={-10.2} origin={O}>
        {/* วางตรงแนวเดียวกับหอถังน้ำ (ขนานรั้ว) */}
        <group position={[3.8, 0, -10.2]} scale={0.82}>
          <OrchidHouse x={0} z={0} />
        </group>
      </Editable>
      <Editable id="home:ricebarn" name="ยุ้งข้าว" x={-12} z={9} origin={O}>
        <RiceBarn x={-12} z={9} />
      </Editable>
      <Editable id="home:cookhouse" name="บ้านหลังที่สอง (ครัว)" x={-6.5} z={9} r={3} origin={O}>
        <CookHouse x={-6.5} z={9} />
      </Editable>
      <Editable id="home:toilets" name="ห้องน้ำนอกบ้าน" x={-2} z={10.2} origin={O}>
        <OutdoorToilets x={-2} z={10.2} />
      </Editable>
      {/* คอกควาย: ย้ายไปใกล้ประตูหลังใหม่ (ผู้สร้าง 19 พ.ย.) */}
      <Editable id="home:buffalo2" name="คอกควาย" x={8.5} z={25} r={3.5} origin={O}>
        <BuffaloPen x={8.5} z={25} />
      </Editable>
      <Editable id="home:coop" name="เล้าไก่" x={8} z={10.5} origin={O}>
        <ChickenCoop x={8} z={10.5} />
      </Editable>
      <Editable id="home:pigpen" name="คอกหมู" x={11} z={10.5} origin={O}>
        <PigPen x={11} z={10.5} />
      </Editable>
      <Editable id="home:strawbarn" name="ยุ้งฟาง" x={13.5} z={7} origin={O}>
        <StrawBarn x={13.5} z={7} />
      </Editable>
      <Orchard />
      <Surroundings />
      {/* รั้วไม้ระแนงสีครีม หัวเสาลูกบอล รอบบ้าน (เว้นประตูหน้าบ้าน) — ผู้สร้าง 19 พ.ย. */}
      <CreamFence x={(x0 + HOME_GATE[0] - 2) / 2} z={z0} len={HOME_GATE[0] - 2 - x0} />
      <CreamFence x={(HOME_GATE[0] + 2 + x1) / 2} z={z0} len={x1 - HOME_GATE[0] - 2} />
      <CreamFence x={(x0 + HOME_CORNER_GAP + HOME_BACK_GATE.x - HOME_BACK_GATE.half) / 2} z={z1} len={HOME_BACK_GATE.x - HOME_BACK_GATE.half - x0 - HOME_CORNER_GAP} />
      <CreamFence x={(HOME_BACK_GATE.x + HOME_BACK_GATE.half + x1) / 2} z={z1} len={x1 - HOME_BACK_GATE.x - HOME_BACK_GATE.half} />
      {/* ทางรถเข้าออกด้านหลัง (ดินอัด) */}
      <mesh position={[HOME_BACK_GATE.x, 0.028, z1 - 3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[HOME_BACK_GATE.half * 2 - 1, 6]} />
        <meshStandardMaterial color="#b8865a" roughness={1} />
      </mesh>
      <CreamFence x={x0} z={(z0 + HOME_SIDE_GAP.z - HOME_SIDE_GAP.half) / 2} len={HOME_SIDE_GAP.z - HOME_SIDE_GAP.half - z0} rot={Math.PI / 2} />
      <CreamFence x={x0} z={(HOME_SIDE_GAP.z + HOME_SIDE_GAP.half + z1 - HOME_CORNER_GAP) / 2} len={z1 - HOME_CORNER_GAP - HOME_SIDE_GAP.z - HOME_SIDE_GAP.half} rot={Math.PI / 2} />
      <CreamFence x={x1} z={BOX_CZ} len={HOME_D} rot={Math.PI / 2} />
      {/* ป้ายหน้าบ้าน */}
      <group position={[HOME_GATE[0] + 2.6, 0, z0 - 0.3]}>
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, 0.55, 0]}>
            <RBox args={[0.08, 1.1, 0.08]} radius={0.03} />
            <meshStandardMaterial color="#6e4a2e" />
          </mesh>
        ))}
        <group position={[0, 1.15, 0.05]} rotation={[0, Math.PI, 0]}>
          <SignBoard lines={['บ้านตารัง–ยายเลียน']} width={1.6} height={0.4} />
        </group>
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
/** บ้านไม้สองชั้น พื้นปูน: ชั้นล่างก่อปูน มีมุ้งลวดสแตนเลสรอบบ้าน ประตูน้ำเงินบานคู่กว้าง 3 ม. · ชั้นบนไม้ หน้าต่างคู่ 11 บาน */
/** บ้านหลัก: ใหญ่ขึ้น (ผู้สร้าง 18 พ.ย. 2569) · ชั้นล่างทั้งชั้นเป็นห้องครัว ประตูน้ำเงินด้าน +z */
export const MAIN_HOUSE = { x: -7.5, z: -6, W: 13, D: 9 }
/** ประตูน้ำเงิน: กลางประตู (x ภายในบ้าน) · ความกว้าง */
const DOOR_X = 1.4
const DOOR_W = 3
/** ประตูไม้บานเดียว ด้าน −z (หันออกถนนหน้าบ้าน) */
const FRONT_DOOR_X = 1.4
function MainHouse() {
  const W = MAIN_HOUSE.W
  const D = MAIN_HOUSE.D
  const low = 2.8
  const up = 2.6
  return (
    <group position={[MAIN_HOUSE.x, 0, MAIN_HOUSE.z]}>
      {/* พื้นปูน */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <RBox args={[W + 0.6, 0.2, D + 0.6]} radius={0.08} />
        <meshStandardMaterial color="#bdb7aa" />
      </mesh>
      {/* ชั้น 1 ผนังปูนสีครีม: เว้นช่องมุ้งลวดรอบบ้าน มองทะลุเห็นครัวข้างใน */}
      <HouseShell W={W} D={D} y0={0.2} y1={0.2 + low} t={0.16} color="#eadfc8" inner="#f2ead8" holes={groundHoles(W, D)} />
      <KitchenInside W={W} D={D} y={0.2} h={low} />
      {/* ประตูบ้านสีน้ำเงินบานกว้าง (บานคู่) ด้าน +z หันเข้าลานในบ้าน */}
      <mesh position={[DOOR_X, 1.3, D / 2 + 0.03]}>
        <RBox args={[DOOR_W, 2.2, 0.08]} radius={0.04} />
        <meshStandardMaterial color="#2f5f9a" />
      </mesh>
      <mesh position={[DOOR_X, 1.3, D / 2 + 0.08]}>
        <boxGeometry args={[0.04, 2.1, 0.02]} />
        <meshStandardMaterial color="#1f3f6a" />
      </mesh>
      {[-0.25, 0.25].map((dx) => (
        <mesh key={dx} position={[DOOR_X + dx, 1.25, D / 2 + 0.1]}>
          <boxGeometry args={[0.05, 0.3, 0.04]} />
          <meshStandardMaterial color="#c8c8c8" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* มุ้งลวดสแตนเลสรอบบ้าน เฉพาะชั้น 1 (ครึ่งบนของผนัง) — ไม่ใช่หน้าต่างบานเดียว เป็นแนวยาวรอบบ้าน เว้นช่องประตู */}
      <MeshBand W={W} D={D} y0={1.25} y1={2.75} doors={[{ side: 'S', at: DOOR_X, w: DOOR_W + 0.3 }, { side: 'E', at: 1.6, w: 1.3 }, { side: 'N', at: FRONT_DOOR_X, w: 1.4 }, { side: 'W', at: 0, w: D }]} />
      {/* หน้าต่างผนังตะวันตกชั้นล่าง (หันออก −x): ห้องน้ารงณ์ · ตรงเตียงตายาย */}
      <group position={[-W / 2 - 0.04, 0.95, -3.1]} rotation={[0, -Math.PI / 2, 0]}>
        <LaceWindow w={1.3} h={1.5} />
      </group>
      <group position={[-W / 2 - 0.04, 1.05, -0.9]} rotation={[0, -Math.PI / 2, 0]}>
        <CurtainWindow w={1.05} h={1.3} />
      </group>
      {/* ห้องอาบน้ำ: ก่อปูนยื่นออกจากผนังด้านตะวันตก (−x) ชั้นล่าง · หน้าต่างบล็อกแก้วฝ้า · ชายคาเล็ก */}
      <group position={[-W / 2 - 0.4, 0.2, 2.05]}>
        <mesh position={[0, low / 2, 0]} castShadow receiveShadow>
          <RBox args={[0.8, low, 4.1]} radius={0.04} />
          <meshStandardMaterial color="#e6dac2" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.84, 0.24, 4.14]} />
          <meshStandardMaterial color="#b8b0a0" />
        </mesh>
        {/* หน้าต่างบล็อกแก้วฝ้า (ห้องอาบน้ำ) */}
        <group position={[-0.41, 1.0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <GlassBlockWindow cols={3} rows={5} size={0.2} />
        </group>
        <mesh position={[-0.05, low + 0.06, 0]} rotation={[0, 0, 0.12]}>
          <boxGeometry args={[1.05, 0.06, 4.4]} />
          <meshStandardMaterial color="#8a5a34" />
        </mesh>
        {/* ท่อน้ำทิ้งลงพื้น */}
        <mesh position={[-0.43, 0.25, -1.8]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
          <meshStandardMaterial color="#9aa0a6" />
        </mesh>
      </group>
      {/* ประตูไม้สักลูกฟัก 8 ช่อง ด้านหน้าบ้าน (−z หันออกถนน) */}
      <group position={[FRONT_DOOR_X, 0.2, -D / 2 - 0.03]} rotation={[0, Math.PI, 0]}>
        <WoodPanelDoor />
      </group>
      {/* ประตูครัว (ด้านตะวันออก) */}
      <mesh position={[W / 2 + 0.03, 1.15, 1.6]} rotation={[0, Math.PI / 2, 0]}>
        <RBox args={[1, 1.9, 0.06]} radius={0.03} />
        <meshStandardMaterial color="#6b4a2e" />
      </mesh>
      {/* ชายคาระหว่างชั้น */}
      <mesh position={[0, 0.2 + low + 0.08, -0.2]} castShadow>
        <RBox args={[W + 0.6, 0.16, D + 1]} radius={0.06} />
        <meshStandardMaterial color="#8a5a34" />
      </mesh>
      {/* ชั้น 2 ไม้: เจาะช่องหน้าต่างจริง มองเห็น 3 ห้องข้างใน */}
      <HouseShell W={W - 0.3} D={D - 0.3} y0={0.36 + low} y1={0.36 + low + up} t={0.12} color="#8f5e38" inner="#c9a070" holes={upperHoles(W - 0.3, D - 0.3, 0.36 + low + up * 0.52)} />
      <UpperRooms W={W - 0.3} D={D - 0.3} y={0.36 + low} h={up} />
      {/* แนวตีไม้ฝา */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, 0.5 + low + i * 0.5, -(D - 0.3) / 2 - 0.02]}>
          <planeGeometry args={[W - 0.5, 0.03]} />
          <meshBasicMaterial color="#6a4226" />
        </mesh>
      ))}
      {/* หน้าต่างชั้นบน ด้าน −z: 3 ห้อง ห้องละ 3 บาน เปิดออกทั้งหมด */}
      {[-4.35, 0, 4.35].flatMap((cx) =>
        [-1.05, 0, 1.05].map((dx) => (
          <group key={'n' + cx + dx} position={[cx + dx, 0, -(D - 0.3) / 2 - 0.04]} rotation={[0, Math.PI, 0]}>
            <OpenWindow x={0} y={0.36 + low + up * 0.52} z={0} frame="#6a3a1c" w={0.8} h={1.05} see />
          </group>
        )),
      )}
      {/* หน้าต่างชั้นบนด้านประตูน้ำเงิน (+z): ซ้าย 3 บาน · กลาง 2 บานกว้าง · ขวา 2 บาน — เปิดออก */}
      {(
        [
          [-4.4, 3, 0.62],
          [0.4, 2, 0.95],
          [4.5, 2, 0.62],
        ] as [number, number, number][]
      ).flatMap(([cx, n, pw]) =>
        Array.from({ length: n }).map((_, k) => (
          <OpenWindow key={'s' + cx + k} x={cx - ((n - 1) * pw) / 2 + k * pw} y={0.36 + low + up * 0.52} z={(D - 0.3) / 2 + 0.04} frame="#6a3a1c" w={pw - 0.18} h={1.05} see />
        )),
      )}
      {/* ด้านจั่ว (+x): 3 ชุด ชุดละ 3 บาน (ห้องละชุด) — เปิดออก */}
      {[-2.9, 0, 2.9].flatMap((cz) =>
        [-0.68, 0, 0.68].map((dz) => (
          <group key={'e' + cz + dz} position={[(W - 0.3) / 2 + 0.04, 0, cz + dz]} rotation={[0, Math.PI / 2, 0]}>
            <OpenWindow x={0} y={0.36 + low + up * 0.52} z={0} frame="#6a3a1c" w={0.52} h={1.05} see />
          </group>
        )),
      )}
      {/* ด้านจั่วอีกฝั่ง (−x): 3 ชุด ชุดละ 3 บาน เหมือนกัน + เสากั้นห้อง */}
      {[-2.9, 0, 2.9].flatMap((cz) =>
        [-0.68, 0, 0.68].map((dz) => (
          <group key={'w' + cz + dz} position={[-(W - 0.3) / 2 - 0.04, 0, cz + dz]} rotation={[0, -Math.PI / 2, 0]}>
            <OpenWindow x={0} y={0.36 + low + up * 0.52} z={0} frame="#6a3a1c" w={0.52} h={1.05} see />
          </group>
        )),
      )}
      {[-1.45, 1.45].map((z) => (
        <mesh key={'pw' + z} position={[-(W - 0.3) / 2 - 0.05, 0.36 + low + up / 2, z]}>
          <RBox args={[0.1, up, 0.18]} radius={0.03} />
          <meshStandardMaterial color="#4a2e1a" />
        </mesh>
      ))}
      {/* เสากั้นห้องชั้นบน 3 ห้อง (เห็นเป็นเสาไม้ตั้งที่ผนังด้านนอก) */}
      {[-2.17, 2.17].flatMap((x) =>
        [1, -1].map((sz) => (
          <mesh key={'pz' + x + sz} position={[x, 0.36 + low + up / 2, sz * ((D - 0.3) / 2 + 0.05)]}>
            <RBox args={[0.18, up, 0.1]} radius={0.03} />
            <meshStandardMaterial color="#4a2e1a" />
          </mesh>
        )),
      )}
      {[-1.45, 1.45].map((z) => (
        <mesh key={'pe' + z} position={[(W - 0.3) / 2 + 0.05, 0.36 + low + up / 2, z]}>
          <RBox args={[0.1, up, 0.18]} radius={0.03} />
          <meshStandardMaterial color="#4a2e1a" />
        </mesh>
      ))}
      {/* เสาอากาศทีวีบนหลังคา */}
      <group position={[W / 2 - 1.6, 0.36 + low + up + 2, 0]}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 2.6, 6]} />
          <meshStandardMaterial color="#9aa0a6" metalness={0.7} roughness={0.35} />
        </mesh>
        {[0.6, 1.1, 1.6, 2.1].map((y, i) => (
          <mesh key={y} position={[0, y + 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, 1.6 - i * 0.25, 5]} />
            <meshStandardMaterial color="#9aa0a6" metalness={0.7} roughness={0.35} />
          </mesh>
        ))}
      </group>
      {/* จานดาวเทียม (จานทีวี) สีแดง ติดผนังชั้นบนด้านจั่ว */}
      <group position={[(W - 0.3) / 2 + 0.2, 0.36 + low + up - 0.3, -3.9]} rotation={[0, Math.PI / 2 + 0.4, 0]}>
        <mesh position={[0, 0, 0.35]} rotation={[-Math.PI / 2 + 0.5, 0, 0]}>
          <sphereGeometry args={[0.45, 18, 8, 0, Math.PI * 2, 0, 0.75]} />
          <meshStandardMaterial color="#c8202a" side={2} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.15, 0.15]} rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.5, 6]} />
          <meshStandardMaterial color="#6a6a6a" />
        </mesh>
        <mesh position={[0, 0.12, 0.7]} rotation={[-0.9, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.55, 5]} />
          <meshStandardMaterial color="#6a6a6a" />
        </mesh>
        <mesh position={[0, 0.3, 0.88]}>
          <boxGeometry args={[0.08, 0.08, 0.1]} />
          <meshStandardMaterial color="#e8e8e8" />
        </mesh>
      </group>
      {/* บันไดขึ้นชั้นบนอยู่ในบ้าน (ดู HomeInterior) — ข้างนอกไม่มีบันได */}
      <GableRoof width={W} depth={D - 0.3} height={2} y={0.36 + low + up} color="#7a3a2a" overhang={0.7} />
      {/* เปลนั่งชมวิวของตารัง (ระเบียงข้างบ้าน) */}
      <group position={[-W / 2 - 1.1, 0, -2.6]}>
        {[-0.8, 0.8].map((z) => (
          <mesh key={z} position={[0, 1.1, z]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 2.2, 8]} />
            <meshStandardMaterial color="#6e4a2e" />
          </mesh>
        ))}
        <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.35]}>
          <torusGeometry args={[0.7, 0.05, 6, 18, Math.PI]} />
          <meshStandardMaterial color="#d0503e" />
        </mesh>
      </group>
    </group>
  )
}

function Bench({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <RBox args={[w, 0.08, d]} radius={0.03} />
        <meshStandardMaterial color="#c8a468" />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.1), 0.22, sz * (d / 2 - 0.1)]}>
            <RBox args={[0.08, 0.44, 0.08]} radius={0.02} />
            <meshStandardMaterial color="#8a6a3e" />
          </mesh>
        )),
      )}
    </group>
  )
}

/** หมา 6 ตัวนอนที่แคร่หน้าประตู + แมวแต้ม (นอนนิ่ง ๆ) */
const HOME_PETS: { pet: PetChoice; pos: [number, number, number]; rot: number }[] = [
  { pet: { species: 'dog', name: 'ถุงเงิน', color: '#c99a4a', pattern: 'patches', patternColor: '#f3ead8', fur: 'long', size: 'large' } as PetChoice, pos: [-8.6, 0.5, -0.4], rot: Math.PI - 0.4 },
  { pet: { species: 'dog', name: 'โซดา', color: '#f4efe6', pattern: 'plain', patternColor: '#ffffff', fur: 'long' } as PetChoice, pos: [-7.4, 0.5, -0.5], rot: Math.PI + 0.6 },
  { pet: { species: 'dog', name: 'เสือ', color: '#8a5a32', pattern: 'stripes', patternColor: '#2b2a2c' } as PetChoice, pos: [-9.6, 0, 0.6], rot: Math.PI - 1.2 },
  { pet: { species: 'dog', name: 'เบอร์ดี้', color: '#9a6a3e', pattern: 'blacktan', patternColor: '#2b2a2c' } as PetChoice, pos: [-6.4, 0, 0.9], rot: Math.PI + 1.4 },
  { pet: { species: 'dog', name: 'ฟีโน่', color: '#2b2a2c', pattern: 'tuxedo', patternColor: '#f4efe6' } as PetChoice, pos: [-5.6, 0, -0.8], rot: Math.PI - 2.4 },
  { pet: { species: 'dog', name: 'ตัวที่ 5', color: '#c99a4a', pattern: 'plain', patternColor: '#f3ead8' } as PetChoice, pos: [-10.4, 0, -0.6], rot: Math.PI + 0.2 },
  { pet: { species: 'cat', name: 'แต้ม', color: '#2b2a2c', pattern: 'tuxedo', patternColor: '#f4efe6' } as PetChoice, pos: [-3.3, 0.5, -2.2], rot: 0.8 },
]

function HousePets({ only }: { only?: 'dog' | 'cat' }) {
  return (
    <group>
      {HOME_PETS.filter((p) => !only || p.pet.species === only).map((p, i) => (
        <RestingPet key={i} pet={p.pet} pos={p.pos} rot={p.rot} />
      ))}
    </group>
  )
}

function RestingPet({ pet, pos, rot }: { pet: PetChoice; pos: [number, number, number]; rot: number }) {
  const motion = useRef(0)
  const pose = useRef(2)
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <Pet pet={pet} motion={motion} pose={pose} />
    </group>
  )
}

export function Car({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <RBox args={[3.6, 0.8, 1.6]} radius={0.3} />
        <meshStandardMaterial color="#c8ccd2" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[-0.2, 1.25, 0]} castShadow>
        <RBox args={[2, 0.6, 1.45]} radius={0.25} />
        <meshStandardMaterial color="#4a6278" metalness={0.3} roughness={0.2} />
      </mesh>
      {[-1.2, 1.2].flatMap((wx) =>
        [-0.75, 0.75].map((wz) => (
          <mesh key={`${wx}${wz}`} position={[wx, 0.32, wz]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.22, 16]} />
            <meshStandardMaterial color="#2a2a2c" />
          </mesh>
        )),
      )}
    </group>
  )
}

/** เครื่องกรองน้ำบาดาลหน้าบ้าน */
function WaterFilter({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.15, 0]}>
        <RBox args={[1.2, 0.3, 0.8]} radius={0.06} />
        <meshStandardMaterial color="#bdb7aa" />
      </mesh>
      {[-0.3, 0.3].map((dx) => (
        <mesh key={dx} position={[dx, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 1.1, 14]} />
          <meshStandardMaterial color={dx < 0 ? '#5f9fd8' : '#e8e8e8'} />
        </mesh>
      ))}
      <mesh position={[0, 0.6, 0.35]}>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
        <meshStandardMaterial color="#6b6e72" metalness={0.5} />
      </mesh>
    </group>
  )
}

/** สวนผักสวนครัว + สวนดอกไม้ของยายเลียน (มีรั้วไม้เตี้ย) */
// เก็บไว้เผื่อใช้ (ตอนนี้ไม่ได้วางในบ้าน)
export function VegFlowerGarden({ x, z }: { x: number; z: number }) {
  const flowers = ['#f29ab8', '#f6c445', '#e86a5a', '#ffffff', '#c99af0']
  return (
    <group position={[x, 0, z]}>
      {[-1.6, 0, 1.6].map((dx) => (
        <group key={dx} position={[dx - 1.2, 0, 0]}>
          <mesh position={[0, 0.12, 0]} receiveShadow>
            <RBox args={[1.2, 0.24, 3.6]} radius={0.05} />
            <meshStandardMaterial color="#6a4630" />
          </mesh>
          {[-1.2, -0.4, 0.4, 1.2].map((dz) => (
            <mesh key={dz} position={[0, 0.36, dz]}>
              <icosahedronGeometry args={[0.22, 1]} />
              <meshStandardMaterial color={dx === 0 ? '#7cbf4e' : '#5f9e47'} flatShading />
            </mesh>
          ))}
        </group>
      ))}
      {/* สวนดอกไม้ */}
      {[0, 1, 2, 3].map((i) => (
        <Bush key={i} x={2.6} z={-1.6 + i * 1.1} s={0.6} flowers={flowers[i % flowers.length]} />
      ))}
      {/* รั้วไม้เตี้ยรอบแปลงผักเอาออกแล้ว (ผู้สร้าง 19 พ.ย.) */}
    </group>
  )
}

/** เรือนกล้วยไม้ (หน้าบ้านฝั่งครัว) + แก้วมังกร 3 ต้น */
function OrchidHouse({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 1.9, 1.1, sz * 1.4]}>
            <cylinderGeometry args={[0.05, 0.05, 2.2, 8]} />
            <meshStandardMaterial color="#7a5236" />
          </mesh>
        )),
      )}
      <mesh position={[0, 2.22, 0]}>
        <planeGeometry args={[4.2, 3.2]} />
        <meshStandardMaterial color="#2c3a2e" transparent opacity={0.45} side={2} depthWrite={false} />
      </mesh>
      <mesh position={[0, 2.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.2, 3.2]} />
        <meshStandardMaterial color="#2c3a2e" transparent opacity={0.45} side={2} depthWrite={false} />
      </mesh>
      {/* กล้วยไม้ 10 ต้น แขวนเป็นแถว */}
      {Array.from({ length: 10 }).map((_, i) => (
        <group key={i} position={[-1.6 + (i % 5) * 0.8, 1.4, i < 5 ? -0.6 : 0.6]}>
          <mesh>
            <cylinderGeometry args={[0.1, 0.08, 0.12, 8]} />
            <meshStandardMaterial color="#8a6a3e" />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <icosahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color="#5f9e47" flatShading />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[0.08 * (k - 1), 0.28 + k * 0.05, 0.05]}>
              <sphereGeometry args={[0.05, 8, 6]} />
              <meshStandardMaterial color={i % 3 === 0 ? '#c99af0' : i % 3 === 1 ? '#f29ab8' : '#ffffff'} />
            </mesh>
          ))}
        </group>
      ))}
      {/* แก้วมังกร 3 ต้น ขึ้นค้างเสาปูน */}
      {[-1.5, 0, 1.5].map((dx) => (
        <group key={dx} position={[dx, 0, 2.3]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.4, 8]} />
            <meshStandardMaterial color="#bdb7aa" />
          </mesh>
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} position={[Math.cos(k * 1.6) * 0.25, 1.35, Math.sin(k * 1.6) * 0.25]} rotation={[Math.cos(k) * 0.9, k, Math.sin(k) * 0.9]}>
              <cylinderGeometry args={[0.05, 0.05, 0.6, 3]} />
              <meshStandardMaterial color="#6aa84f" flatShading />
            </mesh>
          ))}
          <mesh position={[0.2, 1.2, 0.1]} scale={[1, 1.2, 1]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshStandardMaterial color="#e0407a" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** ยุ้งข้าวโบราณ: เรือนไม้ยกพื้นเตี้ย หลังคาจั่วสูง */
function RiceBarn({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 1.2, 0.5, sz * 1.2]} castShadow>
            <cylinderGeometry args={[0.12, 0.14, 1, 8]} />
            <meshStandardMaterial color="#5a3b26" />
          </mesh>
        )),
      )}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <RBox args={[3, 1.8, 3]} radius={0.12} />
        <meshStandardMaterial color="#8a5a34" />
      </mesh>
      <GableRoof width={3} depth={3} height={1.6} y={2.7} color="#6a4a2e" overhang={0.5} />
      <group position={[0, 3.2, 1.55]}>
        <SignBoard lines={['ยุ้งข้าว']} width={1} height={0.3} />
      </group>
    </group>
  )
}

/** บ้านหลังที่สอง (ทำกับข้าว · ผู้สร้างชอบมานอน) ใต้ถุนเก็บเครื่องมือทำสวนและซ่อมรถ */
function CookHouse({ x, z }: { x: number; z: number }) {
  const floorY = 1.7
  return (
    <group position={[x, 0, z]}>
      {[-1, 0, 1].flatMap((ix) =>
        [-1, 1].map((iz) => (
          <mesh key={`${ix}${iz}`} position={[ix * 2.2, floorY / 2, iz * 1.7]} castShadow>
            <RBox args={[0.22, floorY, 0.22]} radius={0.08} />
            <meshStandardMaterial color="#5a3b26" />
          </mesh>
        )),
      )}
      <mesh position={[0, floorY, 0]} castShadow receiveShadow>
        <RBox args={[5, 0.16, 4]} radius={0.06} />
        <meshStandardMaterial color="#6e4a30" />
      </mesh>
      <mesh position={[0, floorY + 1.1, -0.2]} castShadow receiveShadow>
        <RBox args={[5, 2.2, 3.4]} radius={0.2} />
        <meshStandardMaterial color="#9a6a42" />
      </mesh>
      <GableRoof width={5} depth={3.4} height={1.3} y={floorY + 2.2} color="#7a3a2a" overhang={0.5} />
      {/* ใต้ถุน: เครื่องมือทำสวน รถมอเตอร์ไซค์ */}
      {[-1.6, -1.2, -0.8].map((dx, i) => (
        <mesh key={dx} position={[dx, 0.7, -1.4]} rotation={[0, 0, 0.12 * (i - 1)]}>
          <cylinderGeometry args={[0.025, 0.025, 1.4, 6]} />
          <meshStandardMaterial color="#a0784a" />
        </mesh>
      ))}
      <group position={[1, 0, 0.2]}>
        <mesh position={[0, 0.55, 0]}>
          <RBox args={[1.4, 0.3, 0.3]} radius={0.1} />
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

export function OutdoorToilets({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <RBox args={[3, 2.2, 2]} radius={0.18} />
        <meshStandardMaterial color="#d8d2c4" />
      </mesh>
      {[-0.7, 0.7].map((dx) => (
        <mesh key={dx} position={[dx, 0.95, -1.02]}>
          <RBox args={[0.7, 1.7, 0.05]} radius={0.03} />
          <meshStandardMaterial color="#5a7a8a" />
        </mesh>
      ))}
      <GableRoof width={3} depth={2} height={0.6} y={2.2} color="#8fa0a8" overhang={0.2} />
    </group>
  )
}

/** คอกควาย 5 ตัว: แม่ควาย 2 · ลูกผู้ตัวโต 1 · ลูกเมียตัวเล็ก 1 · ลูกเมียเพิ่งคลอด 2 เดือน 1 */
function BuffaloPen({ x, z }: { x: number; z: number }) {
  const herd = useMemo(
    () =>
      [
        { s: 1, p: [-1.6, -0.8], r: 0.3 },
        { s: 1, p: [1.2, -1], r: -0.5 },
        { s: 0.85, p: [-0.4, 1], r: 1.4 },
        { s: 0.65, p: [1.6, 1.2], r: 2.2 },
        { s: 0.45, p: [0.4, 0.1], r: -1.8 },
      ].map((b) => ({ ...b, pet: { species: 'buffalo', name: 'ควาย', color: '#4a4a52', pattern: 'plain', patternColor: '#6a6a72' } as PetChoice })),
    [],
  )
  return (
    <group position={[x, 0, z]}>
      {/* หลังคาเล้าควาย + รังแม่ไก่ตามมุมเสา */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[sx * 2.9, 0, sz * 2.4]}>
            <mesh position={[0, 1.4, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.12, 2.8, 8]} />
              <meshStandardMaterial color="#5a3b26" />
            </mesh>
            <mesh position={[-sx * 0.15, 2.5, -sz * 0.15]} scale={[1, 0.5, 1]}>
              <sphereGeometry args={[0.2, 10, 8]} />
              <meshStandardMaterial color="#c8a468" roughness={1} />
            </mesh>
          </group>
        )),
      )}
      <mesh position={[0, 2.9, 0]} castShadow>
        <RBox args={[6.4, 0.1, 5.4]} radius={0.04} />
        <meshStandardMaterial color="#8a7a5a" />
      </mesh>
      {/* ราวคอก */}
      {[
        [0, -2.5, 6, 0],
        [0, 2.5, 6, 0],
        [-3, 0, 5, Math.PI / 2],
        [3, 0, 5, Math.PI / 2],
      ].map(([px, pz, len, r], i) => (
        <group key={i} position={[px, 0, pz]} rotation={[0, r, 0]}>
          {[0.5, 1].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <RBox args={[len, 0.1, 0.1]} radius={0.04} />
              <meshStandardMaterial color="#8a6040" />
            </mesh>
          ))}
        </group>
      ))}
      {herd.map((b, i) => (
        <group key={i} position={[b.p[0], 0, b.p[1]]} rotation={[0, b.r, 0]} scale={b.s * 0.8}>
          <RestingPet pet={b.pet} pos={[0, 0, 0]} rot={0} />
        </group>
      ))}
    </group>
  )
}

function ChickenCoop({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <RBox args={[2.5, 1.6, 2]} radius={0.1} />
        <meshStandardMaterial color="#a8805a" />
      </mesh>
      <GableRoof width={2.5} depth={2} height={0.7} y={1.7} color="#8fa0a8" overhang={0.2} />
      <mesh position={[0, 0.6, -1.02]}>
        <planeGeometry args={[1.8, 0.9]} />
        <meshStandardMaterial color="#d8d2c4" wireframe />
      </mesh>
    </group>
  )
}

function PigPen({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <PigSounds />
      <mesh position={[0, 0.4, 0]} castShadow>
        <RBox args={[2.5, 0.8, 2.5]} radius={0.1} />
        <meshStandardMaterial color="#bdb7aa" />
      </mesh>
      <mesh position={[0, 0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.1, 2.1]} />
        <meshStandardMaterial color="#7a5a3e" />
      </mesh>
      <mesh position={[0, 1.8, 0.4]} castShadow>
        <RBox args={[2.8, 0.08, 1.8]} radius={0.03} />
        <meshStandardMaterial color="#8fa0a8" />
      </mesh>
    </group>
  )
}

function StrawBarn({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.9, 1.2, sz * 1.4]}>
            <cylinderGeometry args={[0.07, 0.07, 2.4, 8]} />
            <meshStandardMaterial color="#5a3b26" />
          </mesh>
        )),
      )}
      <GableRoof width={2} depth={3} height={0.8} y={2.4} color="#6a4a2e" overhang={0.25} />
      <mesh position={[0, 0.7, 0]} scale={[1, 0.8, 1.4]} castShadow>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial color="#e2c56a" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// ต้นไม้ในบ้าน (สวนผลไม้ + รอบบ้าน)
/** จุดกลางบ้านตาในพิกัดโลก (ต้นไม้ในบ้านย้ายได้) */
const homeO = (): [number, number] => {
  const hp = PLACES.find((p) => p.id === 'home-tarang')
  return hp ? [hp.pos[0], hp.pos[1]] : [0, 0]
}
/** ต้นไม้ในบ้านตาเป็นของเรา: กดค้างลากย้ายได้ (เหมือนบ้าน) */
const TrunkTree = (p: Parameters<typeof TrunkTreeModel>[0]) => (
  <Editable id={'home:tree:' + p.x + ':' + p.z} name="ต้นไม้" x={p.x} z={p.z} r={(p.r ?? 1.2) + 0.8} origin={homeO()}>
    <TrunkTreeModel {...p} />
  </Editable>
)
/** ต้นมะม่วงในบ้านฟ่าง: แบบเดียวกับสวนบ้านน้าโรจน์ มีลูกสุกเหลือง-ส้มปน · ลากย้ายได้ */
const Mango = ({ x, z, s = 1, v }: { x: number; z: number; s?: number; v: MangoVariety }) => (
  <Editable id={'home:tree:' + x + ':' + z} name="ต้นมะม่วง" x={x} z={z} r={1.6 * s + 0.8} origin={homeO()}>
    <group position={[x, 0, z]} scale={s}>
      <Windy h={5 * s} amp={0.24} flutter={1}>
        <MangoTree variety={v} seed={x * 0.7 + z * 0.3} />
      </Windy>
    </group>
  </Editable>
)
const Palm = (p: Parameters<typeof PalmModel>[0]) => (
  <Editable id={'home:palm:' + p.x + ':' + p.z} name={p.areca ? 'ต้นหมาก' : 'ต้นมะพร้าว'} x={p.x} z={p.z} r={1.2} origin={homeO()}>
    <PalmModel {...p} />
  </Editable>
)
const Bamboo = (p: Parameters<typeof BambooModel>[0]) => (
  <Editable id={'home:bamboo:' + p.x + ':' + p.z} name="กอไผ่" x={p.x} z={p.z} r={2} origin={homeO()}>
    <BambooModel {...p} />
  </Editable>
)
const TrunkTreeModel = ({ x, z, h = 2.2, r = 1.2, color = '#4f8640', trunk = '#6b5440', fruit, fruitColor = '#e0402f', fruitR = 0.08 }: { x: number; z: number; h?: number; r?: number; color?: string; trunk?: string; fruit?: number; fruitColor?: string; fruitR?: number }) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, h / 2, 0]} castShadow>
      <cylinderGeometry args={[0.1 + r * 0.06, 0.14 + r * 0.08, h, 10]} />
      <meshStandardMaterial color={trunk} roughness={0.9} />
    </mesh>
    <mesh position={[0, h + r * 0.55, 0]} castShadow>
      <icosahedronGeometry args={[r, 2]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
    {fruit &&
      Array.from({ length: fruit }).map((_, i) => (
        <mesh key={i} position={[Math.cos(i * 2.4) * r * 0.85, h + r * 0.2 + (i % 3) * 0.25, Math.sin(i * 2.4) * r * 0.85]}>
          <sphereGeometry args={[fruitR, 8, 6]} />
          <meshStandardMaterial color={fruitColor} />
        </mesh>
      ))}
  </group>
)

const PalmModel = ({ x, z, h = 5, areca = false }: { x: number; z: number; h?: number; areca?: boolean }) =>
  areca ? (
    <group position={[x, 0, z]}>
      <ArecaPalmTree h={h * 1.5} seed={x * 0.7 + z * 1.3} />
    </group>
  ) : (
    <group position={[x, 0, z]}>
      <CoconutPalm h={h * 2} seed={x * 0.37 + z * 0.61} />
    </group>
  )

/** กอไผ่ (แบบภาพอ้างอิง: ลำเรียวหลายสิบลำ ใบฝอยครึ้มช่วงบน) ไหวตามลม */
const BambooModel = ({ x, z }: { x: number; z: number }) => (
  <group position={[x, 0, z]}>
    <Windy h={7.5} amp={0.5} flutter={1.8}>
      <BambooClump seed={x * 0.37 + z * 0.91} culms={16} height={7.2} />
    </Windy>
  </group>
)

const Pandan = ({ x, z }: { x: number; z: number }) => (
  <group position={[x, 0, z]}>
    {Array.from({ length: 8 }).map((_, i) => (
      <mesh key={i} position={[0, 0.35, 0]} rotation={[0.5, (i / 8) * Math.PI * 2, 0]}>
        <coneGeometry args={[0.05, 0.8, 4]} />
        <meshStandardMaterial color="#4f9a3a" />
      </mesh>
    ))}
  </group>
)

/** สวนผลไม้ (ตายายปลูกร่วมกัน) — ฝั่งตะวันออกของบ้าน หน้ารั้วสวนผัก */
function Orchard() {
  return (
    <group>
      {/* มะม่วงต้นใหญ่ 3 ต้น (ผูกเปล) */}
      {/* ย้ายมาเรียงแถวริมรั้วหน้าบ้าน (ฝั่งถนน) ใกล้แนวมะพร้าว — ผู้สร้าง 19 พ.ย. */}
      <Mango x={16.5} z={-10.3} s={1.05} v="ndm-gold" />
      <Mango x={20.5} z={-10.3} s={1} v="khiew" />
      <Mango x={24.5} z={-10.3} s={1} v="r2e2" />
      {/* เปลผูกระหว่างมะม่วง */}
      <mesh position={[18.5, 1.2, -10.3]}>
        <RBox args={[3.4, 0.06, 0.7]} radius={0.03} />
        <meshStandardMaterial color="#d0503e" />
      </mesh>
      {/* มะม่วงแคระ 2 ต้น (ปีนเล่นได้) */}
      <Mango x={27.8} z={-10.3} s={0.6} v="ndm-gold" />
      <Mango x={30.3} z={-10.3} s={0.55} v="khiew" />
      {/* สวนไม้ผลเล็ก (ชมพู่ น้อยหน่า ขนุน ยอ ลำไย) ย้ายมารวมกันในแปลงริมรั้วตะวันออก (ผู้สร้าง 19 พ.ย.) */}
      {/* ชมพู่แคระ 4 ต้น */}
      {[
        [18.5, -6],
        [22, -6],
        [25.5, -6],
        [29, -6],
      ].map(([x, z]) => (
        <TrunkTree key={x} x={x} z={z} h={1} r={0.8} color="#5a9a48" fruit={6} fruitColor="#ef6a7a" fruitR={0.07} />
      ))}
      {/* น้อยหน่า 3 ต้น */}
      {[
        [18.5, -3],
        [22, -3],
        [25.5, -3],
      ].map(([x, z]) => (
        <TrunkTree key={'n' + x + z} x={x} z={z} h={1} r={0.75} color="#6a9a4a" fruit={4} fruitColor="#9ab86a" fruitR={0.09} />
      ))}
      {/* ขนุน 2 ต้น (ผลใหญ่ติดลำต้น) */}
      {[
        [18.5, 0.3],
        [22.2, 0.5],
      ].map(([x, z]) => (
        <group key={'j' + x}>
          <TrunkTree x={x} z={z} h={2.4} r={1.3} color="#3f6e33" />
          {[0, 1].map((k) => (
            <mesh key={k} position={[x + (k ? 0.22 : -0.22), 1.1 + k * 0.4, z + 0.12]} scale={[1, 1.4, 1]}>
              <sphereGeometry args={[0.2, 10, 8]} />
              <meshStandardMaterial color="#9ab040" flatShading />
            </mesh>
          ))}
        </group>
      ))}
      {/* ใบเตย 5–6 กอ */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Pandan key={i} x={4.6 + i * 0.7} z={-1.6} />
      ))}
      {/* กล้วย 10 ต้น (แถวริมรั้วตะวันออก) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <group key={i} position={[14.2, 0, -11 + i * 2.2]} scale={0.75}>
          <BananaTree seed={i * 7 + 3} />
        </group>
      ))}
      {/* ยอ 4 ต้น */}
      {[
        [25.5, 0.2],
        [28.8, 0.5],
        [-13.5, 3],
        [-13.5, 0.5],
      ].map(([x, z]) => (
        <TrunkTree key={'y' + x + z} x={x} z={z} h={1.2} r={0.7} color="#3f7a3a" fruit={3} fruitColor="#e8ecd0" fruitR={0.08} />
      ))}
    </group>
  )
}

/** รอบบ้าน: มะพร้าว หมาก ไผ่ ลำไย มะม่วงเขียวใหญ่ พื้นที่หญ้า */
function Surroundings() {
  const h = -HOME_BOX.x0 - 0.9
  const d = HOME_BOX.z1 - 0.9
  const east = HOME_BOX.x1 - 0.9
  return (
    <group>
      {/* แนวมะพร้าวรอบบ้าน (หลังแนวมะพร้าวคือรั้วไม้) */}
      {/* ต้นมะพร้าวแนวรั้วหลัง: เว้นช่องประตูหลังใหม่ (x 5–14) · 2 ต้นที่ขวางย้ายไปแทนช่องประตูเดิม */}
      {[-13, -9, -5, -1, 3, 15, 18, 21, 24, 27, 30].map((x, i) => (
        <Palm key={'cn' + x} x={x} z={d} h={5 + (i % 3) * 0.6} />
      ))}
      {/* 2 ต้นที่เคยขึ้นกลางช่องประตูข้าง (z 7, 12) ย้ายไปแนวที่มีรั้ว (z 14.6, 23.5) — ผู้สร้าง 19 พ.ย. */}
      {[-8, -3, 2, 14.6, 23.5, 17, 21, 26, 31, 35].map((z, i) => (
        // ต้นมะพร้าวที่ชิดตัวบ้าน (z −8, −3, 2) เปลี่ยนเป็นต้นมะม่วง · เรียงเป็นแถวยาวตามรั้วฝั่งตะวันตก ระหว่างรั้วกับตัวบ้าน (ผู้สร้าง 19 พ.ย.)
        z === -8 ? (
          <Mango key={'cw' + z} x={-15.9} z={-10.5} s={0.6} v="ndm-gold" />
        ) : z === -3 ? (
          <Mango key={'cw' + z} x={-15.9} z={-7} s={0.6} v="r2e2" />
        ) : z === 2 ? (
          <Mango key={'cw' + z} x={-15.9} z={-3.5} s={0.6} v="ndm-purple" />
        ) : (
          <Palm key={'cw' + z} x={-h - 0.4} z={z} h={5.4 + (i % 2) * 0.5} />
        )
      ))}
      {[-6, 0, 6, 12, 18, 24, 30, 35].map((z, i) => (
        <Palm key={'ce' + z} x={east} z={z} h={5.2 + (i % 2) * 0.5} />
      ))}
      {/* สวนหมากราว 30 ต้น (6×5) หลังคอกควาย ใกล้รั้วตะวันออก — ย้ายต้นหมากเดิมทั้งหมดมารวมที่นี่ (ผู้สร้าง 19 พ.ย.) */}
      {Array.from({ length: 30 }).map((_, i) => {
        const c = i % 6
        const r = Math.floor(i / 6)
        const x = 16 + c * 2.8 + Math.sin(i * 2.1) * 0.35
        const z = 14.5 + r * 2 + Math.cos(i * 1.7) * 0.3
        return <Palm key={'ar' + i} x={Math.round(x * 10) / 10} z={Math.round(z * 10) / 10} h={4.4 + (i % 4) * 0.25} areca />
      })}
      {/* แปลงสับปะรด 20 ต้น ระหว่างสวนหมากกับคอกควาย (ผู้สร้าง 19 พ.ย.) */}
      <Editable id="home:pineapple" name="แปลงสับปะรด" x={13.4} z={19.6} r={2.4} origin={homeO()}>
        <group position={[13.4, 0, 19.6]}>
          <Windy h={0.9} amp={0.06} flutter={0.8}>
            <PineappleBed cols={4} rows={5} dx={0.8} dz={1.0} />
          </Windy>
        </group>
      </Editable>
      {/* ไผ่กอใหญ่ */}
      <Bamboo x={-14} z={12} />
      {/* แนวกอไผ่ริมรั้วตะวันตก ถัดจากมะม่วงหิมพานต์ (ผู้สร้าง 19 พ.ย.) */}
      <Bamboo x={-14.4} z={30.6} />
      <Bamboo x={-14.2} z={33.2} />
      <Bamboo x={14} z={12} />
      {/* ลำไย: กลางรั้วบ้าน 1 ต้น + หลังห้องน้ำ 2 ต้น */}
      <TrunkTree x={29} z={-3} h={1.8} r={1.3} color="#3f6e33" fruit={8} fruitColor="#c8a468" fruitR={0.07} />
      <TrunkTree x={-3.5} z={11.8} h={1.8} r={1.1} color="#3f6e33" fruit={6} fruitColor="#c8a468" fruitR={0.07} />
      <TrunkTree x={-0.5} z={11.8} h={1.8} r={1.1} color="#3f6e33" fruit={6} fruitColor="#c8a468" fruitR={0.07} />
      {/* มะม่วงหิมพานต์ 3 ต้น: ย้ายไปใกล้แนวมะพร้าวริมรั้วตะวันตก (ผู้สร้าง 19 พ.ย. 2569 · เดิมกำหนดจุด 18 พ.ย.) · ผลสีส้มแดง */}
      {[
        [-12.5, 23.5],
        [-9.5, 26.5],
        [-13, 28.8],
      ].map(([x, z], i) => (
        <Editable key={'cashew' + i} id={`home:cashew2:${i}`} name="ต้นมะม่วงหิมพานต์" x={x} z={z} r={2.6} origin={homeO()}>
        <group position={[x, 0, z]}>
          <CashewTree seed={i + 3} scale={1 + (i % 2) * 0.12} />
        </group>
        </Editable>
      ))}
      {/* มะม่วงเขียวใหญ่ (ต้นที่ 4 ของแถวริมรั้วตะวันตก) */}
      <Mango x={-15.9} z={0} s={0.6} v="big-green" />
    </group>
  )
}

/** แนวมุ้งลวดสแตนเลสรอบผนัง: กรอบสแตนเลสเงา เสาแบ่งช่องทุก ~1 ม. ตาข่ายสีเทาโปร่ง · เว้นช่องประตู */
function MeshBand({ W, D, y0, y1, doors }: { W: number; D: number; y0: number; y1: number; doors: { side: 'N' | 'S' | 'E' | 'W'; at: number; w: number }[] }) {
  const h = y1 - y0
  const yc = (y0 + y1) / 2
  // ด้าน: S = +z (ประตู), N = −z, E = +x, W = −x · แต่ละด้านคือแกนยาว (u) และตำแหน่ง/การหมุน
  const sides: { side: 'N' | 'S' | 'E' | 'W'; len: number; pos: (u: number) => [number, number]; rot: number }[] = [
    { side: 'S', len: W, pos: (u) => [u, D / 2 + 0.04], rot: 0 },
    { side: 'N', len: W, pos: (u) => [u, -D / 2 - 0.04], rot: 0 },
    { side: 'E', len: D, pos: (u) => [W / 2 + 0.04, u], rot: Math.PI / 2 },
    { side: 'W', len: D, pos: (u) => [-W / 2 - 0.04, u], rot: Math.PI / 2 },
  ]
  const out: React.ReactNode[] = []
  for (const sd of sides) {
    // ช่วงที่มีมุ้ง (ตัดช่องประตูออก) เว้นมุมบ้าน 0.35 ม.
    let segs: [number, number][] = [[-sd.len / 2 + 0.35, sd.len / 2 - 0.35]]
    for (const d of doors.filter((x) => x.side === sd.side)) {
      const a = d.at - d.w / 2
      const b = d.at + d.w / 2
      segs = segs.flatMap(([s0, s1]) => {
        if (b <= s0 || a >= s1) return [[s0, s1] as [number, number]]
        const r: [number, number][] = []
        if (a - s0 > 0.4) r.push([s0, a])
        if (s1 - b > 0.4) r.push([b, s1])
        return r
      })
    }
    segs.forEach(([s0, s1], i) => {
      const len = s1 - s0
      const mid = (s0 + s1) / 2
      const [px, pz] = sd.pos(mid)
      const n = Math.max(1, Math.round(len / 1.3))
      out.push(
        <group key={sd.side + i} position={[px, yc, pz]} rotation={[0, sd.rot, 0]}>
          {/* ตาข่ายลวดสแตนเลสลายข้าวหลามตัด (แบบรั้วตาข่าย) */}
          <mesh position={[0, 0, 0.005]}>
            <planeGeometry args={[len, h]} />
            <meshStandardMaterial map={chainLinkTex(len, h)} transparent alphaTest={0.2} metalness={0.6} roughness={0.4} side={2} />
          </mesh>
          {/* กรอบบน-ล่าง */}
          {[h / 2, -h / 2].map((y) => (
            <mesh key={y} position={[0, y, 0.01]}>
              <boxGeometry args={[len + 0.06, 0.07, 0.05]} />
              <meshStandardMaterial color="#d4d8da" metalness={0.8} roughness={0.25} />
            </mesh>
          ))}
          {/* เสาแบ่งช่อง */}
          {Array.from({ length: n + 1 }).map((_, k) => (
            <mesh key={k} position={[-len / 2 + (k * len) / n, 0, 0.01]}>
              <boxGeometry args={[0.05, h, 0.05]} />
              <meshStandardMaterial color="#d4d8da" metalness={0.8} roughness={0.25} />
            </mesh>
          ))}
        </group>,
      )
    })
  }
  return <group>{out}</group>
}

// ---------- ลายตาข่ายลวด (ข้าวหลามตัด) — สร้างภาพครั้งเดียว ใช้ซ้ำ ----------
let chainBase: CanvasTexture | null = null
const chainCache = new Map<string, CanvasTexture>()
function chainLinkTex(len: number, h: number) {
  const key = len.toFixed(1) + 'x' + h.toFixed(1)
  const hit = chainCache.get(key)
  if (hit) return hit
  if (!chainBase) {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 64
    const g = c.getContext('2d')!
    g.clearRect(0, 0, 64, 64)
    g.strokeStyle = '#d6dadc'
    g.lineWidth = 2
    g.beginPath()
    // ลวดเฉียงสองทิศ ไขว้กันเป็นช่องข้าวหลามตัด
    g.moveTo(0, 32); g.lineTo(32, 0); g.moveTo(32, 64); g.lineTo(64, 32)
    g.moveTo(0, 32); g.lineTo(32, 64); g.moveTo(32, 0); g.lineTo(64, 32)
    g.stroke()
    chainBase = new CanvasTexture(c)
  }
  const t = chainBase.clone()
  t.wrapS = RepeatWrapping
  t.wrapT = RepeatWrapping
  // ช่องตาข่ายกว้างราว 6 ซม.
  t.repeat.set(len / 0.16, h / 0.16)
  t.needsUpdate = true
  chainCache.set(key, t)
  return t
}

// ---------------------------------------------------------------------------
// บ้านตามองทะลุได้: ผนังแบบเปลือกบาง เจาะช่อง + ของข้างใน
type Hole = { side: 'N' | 'S' | 'E' | 'W'; u0: number; u1: number; v0: number; v1: number }

/** ช่องมุ้งลวดชั้น 1 (ตรงกับ MeshBand) */
function groundHoles(W: number, D: number): Hole[] {
  const doors = [
    { side: 'S' as const, at: DOOR_X, w: DOOR_W + 0.3 },
    { side: 'E' as const, at: 1.6, w: 1.3 },
    { side: 'N' as const, at: FRONT_DOOR_X, w: 1.4 },
    { side: 'W' as const, at: 0, w: D },
  ]
  const out: Hole[] = []
  for (const [side, len] of [
    ['S', W],
    ['N', W],
    ['E', D],
    ['W', D],
  ] as ['N' | 'S' | 'E' | 'W', number][]) {
    let segs: [number, number][] = [[-len / 2 + 0.35, len / 2 - 0.35]]
    for (const d of doors.filter((x) => x.side === side)) {
      const a = d.at - d.w / 2
      const b = d.at + d.w / 2
      segs = segs.flatMap(([s0, s1]) => {
        if (b <= s0 || a >= s1) return [[s0, s1] as [number, number]]
        const r: [number, number][] = []
        if (a - s0 > 0.4) r.push([s0, a])
        if (s1 - b > 0.4) r.push([b, s1])
        return r
      })
    }
    for (const [u0, u1] of segs) out.push({ side, u0, u1, v0: 1.25, v1: 2.75 })
  }
  return out
}

/** ช่องหน้าต่างชั้น 2 (ตรงกับตำแหน่ง OpenWindow) */
function upperHoles(W: number, D: number, cy: number): Hole[] {
  const v0 = cy - 0.52
  const v1 = cy + 0.52
  const out: Hole[] = []
  // ด้าน −z: ห้องละ 3 บาน (หันกลับด้าน: u ของผนังด้าน N วัดตามแกน x)
  for (const cx of [-4.35, 0, 4.35]) out.push({ side: 'N', u0: cx - 1.05 - 0.4, u1: cx + 1.05 + 0.4, v0, v1 })
  // ด้าน +z: ซ้าย 3 บาน · กลาง 2 บานกว้าง · ขวา 2 บาน
  for (const [cx, n, pw] of [
    [-4.4, 3, 0.62],
    [0.4, 2, 0.95],
    [4.5, 2, 0.62],
  ] as [number, number, number][])
    out.push({ side: 'S', u0: cx - (n * pw) / 2 + 0.05, u1: cx + (n * pw) / 2 - 0.05, v0, v1 })
  // ด้านจั่วทั้งสอง: ห้องละ 3 บาน (u วัดตามแกน z)
  for (const side of ['E', 'W'] as const) for (const cz of [-2.9, 0, 2.9]) out.push({ side, u0: cz - 0.68 - 0.27, u1: cz + 0.68 + 0.27, v0, v1 })
  void W
  void D
  return out
}

/** ผนังบาง 4 ด้าน เว้นช่องตาม holes (ช่องในแต่ละผนังห้ามซ้อนกันตามแนวนอน) */
function HouseShell({ W, D, y0, y1, t, color, inner, holes }: { W: number; D: number; y0: number; y1: number; t: number; color: string; inner: string; holes: Hole[] }) {
  const walls: { side: 'N' | 'S' | 'E' | 'W'; len: number; pos: [number, number]; rot: number }[] = [
    { side: 'S', len: W, pos: [0, D / 2 - t / 2], rot: 0 },
    { side: 'N', len: W, pos: [0, -D / 2 + t / 2], rot: 0 },
    { side: 'E', len: D - 2 * t, pos: [W / 2 - t / 2, 0], rot: Math.PI / 2 },
    { side: 'W', len: D - 2 * t, pos: [-W / 2 + t / 2, 0], rot: Math.PI / 2 },
  ]
  const pieces: React.ReactNode[] = []
  for (const w of walls) {
    const hs = holes.filter((h) => h.side === w.side).map((h) => ({ ...h, u0: Math.max(-w.len / 2, h.u0), u1: Math.min(w.len / 2, h.u1) }))
    // ด้าน E/W: u ตามแกน z แต่ผนังหมุน 90° → แกน x ภายในของผนัง = −z
    const flip = w.rot !== 0
    const edges = Array.from(new Set([-w.len / 2, w.len / 2, ...hs.flatMap((h) => [h.u0, h.u1])])).sort((a, b) => a - b)
    for (let i = 0; i < edges.length - 1; i++) {
      const a = edges[i]
      const b = edges[i + 1]
      if (b - a < 0.005) continue
      const mid = (a + b) / 2
      const hole = hs.find((h) => mid > h.u0 && mid < h.u1)
      const parts: [number, number][] = hole ? [[y0, hole.v0], [hole.v1, y1]] : [[y0, y1]]
      for (const [p0, p1] of parts) {
        if (p1 - p0 < 0.01) continue
        const lx = flip ? -mid : mid
        pieces.push(
          <group key={w.side + i + ':' + p0} position={[w.pos[0], 0, w.pos[1]]} rotation={[0, w.rot, 0]}>
            <mesh position={[lx, (p0 + p1) / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[b - a, p1 - p0, t]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>,
        )
      }
    }
  }
  return (
    <group>
      {pieces}
      {/* พื้นในบ้าน */}
      <mesh position={[0, y0 + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W - 2 * t, D - 2 * t]} />
        <meshStandardMaterial color={inner} />
      </mesh>
    </group>
  )
}

/** ชั้นล่าง = ห้องครัว: เคาน์เตอร์ อ่างล้าง เตาแก๊ส ตู้กับข้าว ตู้เย็น โต๊ะกินข้าว พัดลมเพดาน */
function KitchenInside({ W, D, y, h }: { W: number; D: number; y: number; h: number }) {
  const wz = -D / 2 + 0.55
  return (
    <group position={[0, y, 0]}>
      {/* เคาน์เตอร์ครัวยาวชิดผนัง −z */}
      <mesh position={[-2, 0.43, wz]} castShadow>
        <RBox args={[6, 0.86, 0.6]} radius={0.03} />
        <meshStandardMaterial color="#f1ece2" />
      </mesh>
      <mesh position={[-2, 0.88, wz]}>
        <boxGeometry args={[6.05, 0.05, 0.64]} />
        <meshStandardMaterial color="#6a6a68" />
      </mesh>
      {/* อ่างล้างจาน + ก๊อก */}
      <mesh position={[-3.6, 0.89, wz]}>
        <boxGeometry args={[0.7, 0.04, 0.42]} />
        <meshStandardMaterial color="#c9ced2" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-3.6, 1.05, wz - 0.22]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
        <meshStandardMaterial color="#c9ced2" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* เตาแก๊ส 2 หัว + กระทะ */}
      <mesh position={[-0.6, 0.94, wz]}>
        <boxGeometry args={[0.7, 0.08, 0.4]} />
        <meshStandardMaterial color="#2b2b2b" />
      </mesh>
      <mesh position={[-0.75, 1.0, wz]}>
        <cylinderGeometry args={[0.2, 0.14, 0.07, 14]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.5} />
      </mesh>
      {/* หม้อหุงข้าว */}
      <mesh position={[0.6, 1.02, wz]}>
        <cylinderGeometry args={[0.16, 0.16, 0.24, 14]} />
        <meshStandardMaterial color="#f4f0e8" />
      </mesh>
      {/* ชั้นวางของ/ตู้แขวนเหนือเคาน์เตอร์ */}
      <mesh position={[-2, 2.05, -D / 2 + 0.35]}>
        <RBox args={[4.5, 0.6, 0.35]} radius={0.03} />
        <meshStandardMaterial color="#a9784a" />
      </mesh>
      {/* ตู้กับข้าว (มุ้งลวด) + ตู้เย็น */}
      <mesh position={[W / 2 - 0.6, 0.85, -D / 2 + 0.6]} castShadow>
        <RBox args={[0.9, 1.7, 0.6]} radius={0.03} />
        <meshStandardMaterial color="#8a5a34" />
      </mesh>
      <mesh position={[W / 2 - 1.8, 0.9, -D / 2 + 0.55]} castShadow>
        <RBox args={[0.75, 1.8, 0.7]} radius={0.06} />
        <meshStandardMaterial color="#e8eef0" />
      </mesh>
      {/* โต๊ะกินข้าว + เก้าอี้ 4 ตัว */}
      <mesh position={[-1, 0.74, 0.6]} castShadow>
        <RBox args={[2, 0.06, 1.1]} radius={0.02} />
        <meshStandardMaterial color="#9a6a3e" />
      </mesh>
      {[-1.8, -0.2].flatMap((x) =>
        [-0.35, 0.35].map((dz) => (
          <mesh key={x + ':' + dz} position={[x - 1 + 1 + (x < -1 ? 0 : 0), 0.37, 0.6 + dz]}>
            <boxGeometry args={[0.06, 0.74, 0.06]} />
            <meshStandardMaterial color="#6e4a2e" />
          </mesh>
        )),
      )}
      {[-1.6, -0.4].flatMap((x) =>
        [-0.85, 0.85].map((dz) => (
          <mesh key={'ch' + x + dz} position={[x, 0.45, 0.6 + dz]} castShadow>
            <RBox args={[0.42, 0.06, 0.42]} radius={0.02} />
            <meshStandardMaterial color="#c0503a" />
          </mesh>
        )),
      )}
      {/* สำรับกับข้าวบนโต๊ะ */}
      {[-1.4, -0.9, -0.5].map((x, i) => (
        <mesh key={'d' + x} position={[x, 0.8, 0.6 + (i % 2 ? 0.2 : -0.15)]}>
          <cylinderGeometry args={[0.13, 0.1, 0.06, 12]} />
          <meshStandardMaterial color={['#f4f0e8', '#e8c86a', '#7aa05a'][i]} />
        </mesh>
      ))}
      {/* พัดลมเพดาน */}
      <group position={[-1, h - 0.25, 0.6]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.12, 10]} />
          <meshStandardMaterial color="#f4f0e8" />
        </mesh>
        {[0, 1, 2].map((k) => (
          <mesh key={k} rotation={[0, (k * Math.PI * 2) / 3, 0]} position={[0, -0.04, 0]}>
            <boxGeometry args={[1, 0.015, 0.12]} />
            <meshStandardMaterial color="#d9c9a8" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** ชั้นบน 3 ห้อง (ผนังกั้นตามเสา x = ±2.17): ห้องนอนฟูก+มุ้ง · ห้องตู้เสื้อผ้า · ห้องเตียง+ทีวี */
function UpperRooms({ W, D, y, h }: { W: number; D: number; y: number; h: number }) {
  return (
    <group position={[0, y, 0]}>
      {[-2.17, 2.17].map((x) => (
        <mesh key={x} position={[x, h / 2, 0]} castShadow>
          <boxGeometry args={[0.1, h, D - 0.3]} />
          <meshStandardMaterial color="#b88a58" />
        </mesh>
      ))}
      {/* ห้อง 1: ฟูก หมอน มุ้งสีฟ้าอ่อน */}
      <mesh position={[-4.4, 0.1, -0.6]}>
        <RBox args={[1.6, 0.18, 2]} radius={0.06} />
        <meshStandardMaterial color="#e8a6b4" />
      </mesh>
      <mesh position={[-4.4, 0.25, -1.4]}>
        <RBox args={[0.9, 0.14, 0.35]} radius={0.06} />
        <meshStandardMaterial color="#fff8ee" />
      </mesh>
      <mesh position={[-4.4, 0.95, -0.6]}>
        <boxGeometry args={[1.7, 1.5, 2.1]} />
        <meshStandardMaterial color="#cfe6f2" transparent opacity={0.28} depthWrite={false} side={2} />
      </mesh>
      {/* ห้อง 2: ตู้เสื้อผ้า เสื่อ พัดลมตั้งพื้น */}
      <mesh position={[0, 0.95, -D / 2 + 0.45]} castShadow>
        <RBox args={[1.6, 1.9, 0.55]} radius={0.04} />
        <meshStandardMaterial color="#7a4e2c" />
      </mesh>
      <mesh position={[0, 0.02, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 1.4]} />
        <meshStandardMaterial color="#d8b86a" />
      </mesh>
      <group position={[1.4, 0, 1.2]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 1, 6]} />
          <meshStandardMaterial color="#e8e8e8" />
        </mesh>
        <mesh position={[0, 1.05, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
          <meshStandardMaterial color="#6aa8d8" transparent opacity={0.8} />
        </mesh>
      </group>
      {/* ห้อง 3: เตียงไม้ ผ้าห่ม โต๊ะเล็ก ทีวี */}
      <mesh position={[4.4, 0.25, -0.5]} castShadow>
        <RBox args={[1.7, 0.4, 2.1]} radius={0.05} />
        <meshStandardMaterial color="#8a5a34" />
      </mesh>
      <mesh position={[4.4, 0.5, -0.2]}>
        <RBox args={[1.6, 0.12, 1.4]} radius={0.05} />
        <meshStandardMaterial color="#7fb0d8" />
      </mesh>
      <mesh position={[4.4, 0.4, 1.7]} castShadow>
        <RBox args={[1, 0.8, 0.45]} radius={0.03} />
        <meshStandardMaterial color="#6e4a2e" />
      </mesh>
      <mesh position={[4.4, 1.05, 1.75]}>
        <RBox args={[0.8, 0.5, 0.08]} radius={0.02} />
        <meshStandardMaterial color="#1e1e22" />
      </mesh>
      {/* ฝ้าเพดานชั้นบน */}
      <mesh position={[0, h - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W - 0.2, D - 0.2]} />
        <meshStandardMaterial color="#e8dcc4" side={2} />
      </mesh>
    </group>
  )
}

/** ประตูไม้บานเดียวแบบลูกฟัก 2×4 ช่อง สีไม้สัก + ลูกบิดเงิน (ด้านหน้า = +z · ฐานประตูอยู่ที่ y=0) */
function WoodPanelDoor() {
  const W = 1.0
  const H = 2.15
  return (
    <group>
      {/* วงกบ */}
      <mesh position={[0, H / 2 + 0.03, -0.01]} castShadow>
        <boxGeometry args={[W + 0.14, H + 0.08, 0.1]} />
        <meshStandardMaterial color="#5a3418" roughness={0.7} />
      </mesh>
      {/* บานประตู */}
      <mesh position={[0, H / 2, 0.04]} castShadow>
        <boxGeometry args={[W, H, 0.05]} />
        <meshStandardMaterial color="#8a4e24" roughness={0.55} />
      </mesh>
      {/* ลูกฟัก 2 คอลัมน์ × 4 แถว (นูน มีขอบเข้ม) */}
      {[-1, 1].flatMap((c) =>
        [0, 1, 2, 3].map((r) => {
          const x = c * 0.235
          const y = 0.32 + r * 0.5
          return (
            <group key={c + ':' + r} position={[x, y, 0.07]}>
              <mesh>
                <boxGeometry args={[0.36, 0.42, 0.012]} />
                <meshStandardMaterial color="#6a3a1a" roughness={0.6} />
              </mesh>
              <mesh position={[0, 0, 0.012]}>
                <boxGeometry args={[0.29, 0.35, 0.014]} />
                <meshStandardMaterial color={(c + r) % 2 ? '#9a5a2c' : '#94562a'} roughness={0.5} />
              </mesh>
            </group>
          )
        }),
      )}
      {/* ลูกบิดเงิน */}
      <mesh position={[-0.4, 1.0, 0.1]}>
        <sphereGeometry args={[0.04, 12, 10]} />
        <meshStandardMaterial color="#d0d4d8" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[-0.4, 1.0, 0.075]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
        <meshStandardMaterial color="#d0d4d8" metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  )
}

/** หมูในคอกร้อง "อู๊ด อู๊ด" เป็นระยะ (ตอนหิว/ช่วงเช้า-เย็นบ่อยขึ้น) */
function PigSounds() {
  const g = useRef<Group>(null)
  const next = useRef(4 + Math.random() * 10)
  const wp = useMemo(() => new Vector3(), [])
  useFrame((_, dt) => {
    next.current -= Math.min(dt, 0.1)
    if (next.current > 0 || !g.current) return
    const m = exactMinute()
    const feeding = (m > 360 && m < 480) || (m > 960 && m < 1080)
    next.current = feeding ? 6 + Math.random() * 10 : 14 + Math.random() * 26
    g.current.getWorldPosition(wp)
    callSound('oink', wp.x, wp.z, 0.5)
  })
  return <group ref={g} />
}
