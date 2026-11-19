import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Quaternion, Vector3, type Group, type Mesh, type MeshBasicMaterial } from 'three'
import { useGame } from '../game/store'
import { cancelTrap, PULL_DURATION, refreshWild, springTrap, tierOf, useTraps, wild, wildPos } from '../game/catching'
import { GEMS, wandGem } from '../game/wand'
import { TIERS, WILD_SPAWNS, type WildSpawn } from '../game/content/wildlife'
import { playerPose } from '../game/playerPose'
import { Pet } from './models/Pet'

const CATCH_RANGE = 2.8
const SCARE_RANGE = 5

/** สัตว์ที่เก็บได้ ใช้ชีวิตอยู่ในหมู่บ้านและรอบ ๆ */
export function Wildlife() {
  const setWildTarget = useGame((s) => s.setWildTarget)
  const tick = useRef(0)
  useFrame((_, dt) => {
    tick.current += dt
    if (tick.current < 0.2) return
    tick.current = 0
    refreshWild()
    // หาสัตว์ที่ใกล้พอจะเก็บ
    let best: string | null = null
    let bd = CATCH_RANGE
    for (const s of WILD_SPAWNS) {
      if (wild.get(s.id)!.status !== 'free') continue
      const p = wildPos.get(s.id)
      if (!p) continue
      const d = Math.hypot(p[0] - playerPose.x, p[1] - playerPose.z)
      if (d < bd) {
        bd = d
        best = s.id
      }
    }
    setWildTarget(best)
  })
  return (
    <group>
      {WILD_SPAWNS.map((s, i) => (
        <WildAnimal key={s.id} spawn={s} seed={i} />
      ))}
    </group>
  )
}

function WildAnimal({ spawn, seed }: { spawn: WildSpawn; seed: number }) {
  const root = useRef<Group>(null!)
  const body = useRef<Group>(null!)
  const marker = useRef<Mesh>(null!)
  const beamG = useRef<Group>(null!)
  const core = useRef<Mesh>(null!)
  const glow = useRef<Mesh>(null!)
  const rings = useRef<Group>(null!)
  const sparks = useRef<(Mesh | null)[]>([])
  const flash = useRef<Mesh>(null!)
  const pullFrom = useRef({ start: -1, x: 0, z: 0 })
  const motion = useRef(0)
  const pose = useRef(0)
  const st = useRef({
    x: spawn.home[0],
    z: spawn.home[1],
    tx: spawn.home[0],
    tz: spawn.home[1],
    wait: seed % 3,
    t: seed,
  })
  const tier = tierOf(spawn.id)
  const color = TIERS[tier].color
  const dirV = new Vector3()
  const up = new Vector3(0, 1, 0)
  const q = new Quaternion()

  useFrame((_, raw) => {
    const r = wild.get(spawn.id)!
    const visible = r.status === 'free' || r.status === 'pulling'
    root.current.visible = visible
    if (!visible) return
    if (useGame.getState().paused) return
    const dt = Math.min(raw, 0.05)
    const s = st.current
    s.t += dt
    const px = playerPose.x
    const pz = playerPose.z
    const dPlayer = Math.hypot(s.x - px, s.z - pz)

    // ---------- ลำแสงจากปลายคฑา ----------
    const now = performance.now()
    const resisting = r.status === 'free' && (r.resistUntil ?? 0) > now
    const pulling = r.status === 'pulling'
    const showBeam = (pulling && r.beam) || resisting
    beamG.current.visible = showBeam
    // ปลายคฑา: ข้างหน้าผู้เล่นระดับไหล่ (แขนเหยียดชี้)
    const tipX = px + Math.sin(playerPose.heading) * 0.95
    const tipZ = pz + Math.cos(playerPose.heading) * 0.95
    const tipY = 1.3
    const gem = GEMS[wandGem()]

    if (pulling) {
      const dur = r.pullMs ?? PULL_DURATION
      const k = Math.min(1, (now - r.pullStart) / dur)
      if (pullFrom.current.start !== r.pullStart) pullFrom.current = { start: r.pullStart, x: s.x, z: s.z }
      const f = pullFrom.current
      if (r.beam) {
        // ดูดเข้าคฑา: ระดับง่ายลอยเข้ามานุ่ม ๆ · ปานกลางส่ายตัว · ยากดิ้นรนดึงกลับก่อนแล้วค่อยถูกดูดเร็ว
        let p: number
        let wob = 0
        if (tier === 'hard') {
          p = k < 0.45 ? 0.12 * Math.abs(Math.sin(k * 22)) : ((k - 0.45) / 0.55) ** 2
          wob = k < 0.45 ? Math.sin(k * 60) * 0.25 : 0
        } else if (tier === 'medium') {
          p = k < 0.25 ? k * 0.3 : 0.075 + ((k - 0.25) / 0.75) ** 1.6 * 0.925
          wob = Math.sin(k * 30) * 0.3 * (1 - k)
        } else {
          p = k * k * (3 - 2 * k)
        }
        const sx = f.x + (tipX - f.x) * p
        const sz = f.z + (tipZ - f.z) * p
        // ส่ายตั้งฉากกับแนวลำแสง
        const lx = tipX - f.x
        const lz = tipZ - f.z
        const ll = Math.hypot(lx, lz) || 1
        s.x = sx + (-lz / ll) * wob
        s.z = sz + (lx / ll) * wob
        root.current.position.set(s.x, Math.min(tipY - 0.2, p * tipY + Math.sin(k * Math.PI) * 0.4), s.z)
        body.current.scale.setScalar(Math.max(0.03, 1 - p * 0.97))
        body.current.rotation.y = p * 9 + wob
        body.current.rotation.z = tier !== 'easy' ? Math.sin(k * 45) * 0.25 * (1 - p) : 0
      } else {
        // ไม่ใช้คฑา (ป้อนอาหาร/เก็บด้วยมือ): เดินเข้ามาหาแล้วค่อย ๆ หายไปอย่างนุ่มนวล
        s.x += (px - s.x) * dt * 3
        s.z += (pz - s.z) * dt * 3
        root.current.position.set(s.x, Math.sin(k * Math.PI) * 0.6, s.z)
        body.current.scale.setScalar(1 - k * 0.85)
      }
      motion.current = 0
      if (r.beam) drawBeam(k, false)
      wildPos.set(spawn.id, [s.x, s.z])
      return
    }
    if (resisting) {
      // ลำแสงโดน แต่สัตว์ดิ้นสะบัดหลุด
      const e = 1 - ((r.resistUntil ?? now) - now) / 1100
      body.current.rotation.z = Math.sin(e * 50) * 0.35 * (1 - e)
      root.current.position.y = Math.abs(Math.sin(e * 25)) * 0.25 * (1 - e)
      drawBeam(e, true)
    } else {
      body.current.rotation.z = 0
      body.current.rotation.y = 0
    }

    function drawBeam(k: number, fail: boolean) {
      const ax = s.x
      const ay = 0.45 + root.current.position.y
      const az = s.z
      dirV.set(tipX - ax, tipY - ay, tipZ - az)
      const len = dirV.length()
      dirV.normalize()
      q.setFromUnitVectors(up, dirV)
      // กลุ่มลำแสงอยู่ในพิกัดของสัตว์ → หักตำแหน่ง root ออก
      beamG.current.position.set(0, 0, 0)
      const midX = (tipX + ax) / 2 - s.x
      const midY = (tipY + ay) / 2 - root.current.position.y
      const midZ = (tipZ + az) / 2 - s.z
      for (const m of [core.current, glow.current]) {
        m.position.set(midX, midY, midZ)
        m.quaternion.copy(q)
        m.scale.set(1, len, 1)
      }
      const flick = fail ? 0.35 + Math.abs(Math.sin(k * 40)) * 0.5 : 0.85
      ;(core.current.material as MeshBasicMaterial).opacity = flick
      ;(core.current.material as MeshBasicMaterial).color.set(gem.glow)
      ;(glow.current.material as MeshBasicMaterial).opacity = flick * 0.35
      ;(glow.current.material as MeshBasicMaterial).color.set(gem.color)
      glow.current.scale.x = glow.current.scale.z = 1 + Math.sin(now * 0.02) * 0.15
      // วงแสงหมุนพันรอบตัวสัตว์ (หดเล็กลงตามที่ถูกดูด)
      rings.current.position.set(0, 0.45, 0)
      rings.current.rotation.y = now * 0.006
      rings.current.children.forEach((c, i) => {
        c.position.y = Math.sin(now * 0.004 + i * 2) * 0.25
        const sc = fail ? 1 + k * 0.6 : 1 - k * 0.7
        c.scale.setScalar(Math.max(0.1, sc))
        ;((c as Mesh).material as MeshBasicMaterial).color.set(gem.color)
        ;((c as Mesh).material as MeshBasicMaterial).opacity = fail ? 0.6 * (1 - k) : 0.75
      })
      // ประกายวิ่งจากตัวสัตว์เข้าปลายคฑา
      sparks.current.forEach((m, i) => {
        if (!m) return
        const t = (now * 0.0012 + i / sparks.current.length) % 1
        m.position.set(midX + (ax - tipX) * (0.5 - t), midY + (ay - tipY) * (0.5 - t), midZ + (az - tipZ) * (0.5 - t))
        m.visible = !fail
        ;(m.material as MeshBasicMaterial).color.set(gem.glow)
      })
      // แสงวาบที่ปลายคฑาตอนดูดเข้าเสร็จ
      const fk = !fail && k > 0.82 ? (k - 0.82) / 0.18 : 0
      flash.current.visible = fk > 0
      flash.current.position.set(tipX - s.x, tipY - root.current.position.y, tipZ - s.z)
      flash.current.scale.setScalar(0.1 + fk * 0.6)
      ;(flash.current.material as MeshBasicMaterial).opacity = 0.9 * (1 - fk * 0.6)
      ;(flash.current.material as MeshBasicMaterial).color.set(gem.glow)
    }
    if (resisting) {
      wildPos.set(spawn.id, [s.x, s.z])
      return
    }
    body.current.scale.setScalar(1)
    root.current.position.y = 0

    // สัตว์ระดับปานกลางขึ้นไปตกใจถ้าวิ่งเข้าใส่ (หรือเพิ่งจับพลาด)
    const scared = (tier !== 'easy' && dPlayer < SCARE_RANGE && playerPose.motion === 2) || performance.now() < 0 || Date.now() < r.scaredUntil
    let speed = tier === 'hard' ? 0.9 : 0.7
    if (r.trap) {
      // กรงดัก: เดินเข้าไปกินกล้วยในกรง · ประตูตกแล้วอยู่ในกรง
      const tp = r.trap
      if (tp.shut) {
        s.x += (tp.x - s.x) * Math.min(1, dt * 6)
        s.z += (tp.z - s.z) * Math.min(1, dt * 6)
        s.tx = s.x
        s.tz = s.z
        s.wait = 0.5
      } else {
        const dTrap = Math.hypot(tp.x - s.x, tp.z - s.z)
        s.tx = tp.x
        s.tz = tp.z
        s.wait = 0
        speed = 0.9
        if (dTrap < 0.3) springTrap(spawn.id)
        else if (dPlayer < 2.2 && playerPose.motion === 2) cancelTrap(spawn.id, 'วิ่งเข้าใส่ สัตว์ตกใจไม่ยอมเข้ากรง · ลองใหม่แล้วอยู่นิ่ง ๆ')
        else if (now - tp.at > 25000) cancelTrap(spawn.id, 'สัตว์ไม่ยอมเข้ากรง ลองวางใหม่อีกครั้ง')
      }
    } else if (scared && dPlayer < SCARE_RANGE * 1.6) {
      // วิ่งหนีออกจากผู้เล่น แต่ไม่ออกนอกบริเวณบ้านของมันไกลเกินไป
      const ax = s.x - px
      const az = s.z - pz
      const l = Math.hypot(ax, az) || 1
      s.tx = s.x + (ax / l) * 4
      s.tz = s.z + (az / l) * 4
      const hx = s.tx - spawn.home[0]
      const hz = s.tz - spawn.home[1]
      const hl = Math.hypot(hx, hz)
      if (hl > spawn.roam * 2.2) {
        s.tx = spawn.home[0] + (hx / hl) * spawn.roam * 2.2
        s.tz = spawn.home[1] + (hz / hl) * spawn.roam * 2.2
      }
      s.wait = 0
      speed = 3.2
    } else if (r.callUntil && Date.now() < r.callUntil) {
      // ได้ยินเสียงผิวปาก: เดินเข้ามาหาผู้เล่น (หยุดห่าง ๆ) หรือหยุดหันมามอง
      if (r.callMode === 'come' && dPlayer > 1.8) {
        s.tx = px + ((s.x - px) / dPlayer) * 1.6
        s.tz = pz + ((s.z - pz) / dPlayer) * 1.6
        s.wait = 0
        speed = tier === 'easy' ? 1.6 : 1.0
      } else {
        s.tx = s.x
        s.tz = s.z
        s.wait = 0.5
        const want = Math.atan2(px - s.x, pz - s.z)
        const df = Math.atan2(Math.sin(want - root.current.rotation.y), Math.cos(want - root.current.rotation.y))
        root.current.rotation.y += df * Math.min(1, dt * 5)
      }
    } else if (s.wait > 0) {
      s.wait -= dt
    }

    const dx = s.tx - s.x
    const dz = s.tz - s.z
    const d = Math.hypot(dx, dz)
    if (s.wait <= 0 && d > 0.15) {
      const step = Math.min(d, speed * dt)
      s.x += (dx / d) * step
      s.z += (dz / d) * step
      const target = Math.atan2(dx, dz)
      const diff = Math.atan2(Math.sin(target - root.current.rotation.y), Math.cos(target - root.current.rotation.y))
      root.current.rotation.y += diff * Math.min(1, dt * 6)
      motion.current = speed > 2 ? 2 : 1
      pose.current = 0
    } else {
      motion.current = 0
      if (s.wait <= 0) {
        // พักสักครู่ แล้วสุ่มจุดเดินเล่นใหม่
        s.wait = 2 + ((seed * 7 + Math.floor(s.t)) % 5)
        const a = Math.random() * Math.PI * 2
        const rr = Math.random() * spawn.roam
        s.tx = spawn.home[0] + Math.cos(a) * rr
        s.tz = spawn.home[1] + Math.sin(a) * rr
      }
      pose.current = s.wait > 3 ? 1 : 0
    }
    root.current.position.x = s.x
    root.current.position.z = s.z
    wildPos.set(spawn.id, [s.x, s.z])

    // ป้ายสีบอกความยาก ลอยขึ้นลงเบา ๆ (เห็นชัดเมื่ออยู่ใกล้)
    marker.current.position.y = 1.15 + Math.sin(s.t * 2.2) * 0.07
    marker.current.rotation.y += dt * 1.5
    marker.current.visible = dPlayer < 14
  })

  const scale = spawn.pet.species === 'buffalo' || spawn.pet.species === 'cow' ? 0.8 : 1
  const markerY = spawn.pet.species === 'buffalo' || spawn.pet.species === 'cow' ? 1.6 : 1.15
  return (
    <group ref={root} position={[spawn.home[0], 0, spawn.home[1]]}>
      <group ref={body} scale={scale}>
        <Pet pet={spawn.pet} motion={motion} pose={pose} />
      </group>
      <group ref={marker} position={[0, markerY, 0]}>
        {/* เพชรสีบอกระดับ: เขียว ง่าย · เหลือง ปานกลาง · แดง ยาก · ม่วง พิเศษ */}
        <mesh scale={[1, 1.35, 1]}>
          <octahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.85} roughness={0.15} metalness={0.3} flatShading />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.3, 12, 10]} />
          <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      </group>
      {/* ลำแสงจากปลายคฑา + วงแสงพันตัว + ประกาย + แสงวาบ */}
      <group ref={beamG} visible={false}>
        <mesh ref={core}>
          <cylinderGeometry args={[0.035, 0.05, 1, 10, 1, true]} />
          <meshBasicMaterial transparent opacity={0.85} depthWrite={false} />
        </mesh>
        <mesh ref={glow}>
          <cylinderGeometry args={[0.12, 0.2, 1, 12, 1, true]} />
          <meshBasicMaterial transparent opacity={0.3} depthWrite={false} side={2} />
        </mesh>
        <group ref={rings}>
          {[0, 1].map((i) => (
            <mesh key={i} rotation={[Math.PI / 2 + (i ? 0.5 : -0.4), 0, 0]}>
              <torusGeometry args={[0.45, 0.025, 6, 28]} />
              <meshBasicMaterial transparent opacity={0.75} depthWrite={false} />
            </mesh>
          ))}
        </group>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} ref={(el) => (sparks.current[i] = el)}>
            <sphereGeometry args={[0.04, 8, 6]} />
            <meshBasicMaterial transparent opacity={0.95} depthWrite={false} />
          </mesh>
        ))}
        <mesh ref={flash} visible={false}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial transparent opacity={0.8} depthWrite={false} />
        </mesh>
      </group>
    </group>
  )
}
