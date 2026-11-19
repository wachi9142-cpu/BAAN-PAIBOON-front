import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import { Color, Fog, type AmbientLight, type DirectionalLight, type HemisphereLight, type Mesh, type PointLight } from 'three'
import { exactMinute } from '../game/clock'
import { LIGHT_KEYS, type LightKey } from '../game/content/daytime'
import { PLACES } from '../game/content/village'
import { TEMPLE } from '../game/content/temple'
import { weatherRt } from '../game/weather'

const tmpA = new Color()
const tmpB = new Color()

function lerpColor(a: string, b: string, t: number, out: Color) {
  return out.copy(tmpA.set(a)).lerp(tmpB.set(b), t)
}

/** ค่าแสง ณ เวลา (นาที) — ไล่ระหว่างคีย์เฟรม */
function sample(minute: number) {
  const h = minute / 60
  let i = 0
  while (i < LIGHT_KEYS.length - 2 && LIGHT_KEYS[i + 1].h <= h) i++
  const a: LightKey = LIGHT_KEYS[i]
  const b: LightKey = LIGHT_KEYS[i + 1]
  const t = Math.min(1, Math.max(0, (h - a.h) / (b.h - a.h)))
  const n = (x: number, y: number) => x + (y - x) * t
  return { a, b, t, sun: n(a.sun, b.sun), sunI: n(a.sunI, b.sunI), hemiI: n(a.hemiI, b.hemiI), ambI: n(a.ambI, b.ambI), lamps: n(a.lamps, b.lamps) }
}

/**
 * แสงทั้งฉากตามเวลาในเกม: ดวงอาทิตย์เคลื่อนข้ามฟ้า สีฟ้า/หมอก/แสงเปลี่ยนตามช่วงเวลา
 * กลางคืนมีแสงจันทร์โทนฟ้า และไฟตะเกียงตามบ้าน ร้าน ศาลา วัด
 */
export function DayLight() {
  const sunRef = useRef<DirectionalLight>(null!)
  const hemiRef = useRef<HemisphereLight>(null!)
  const ambRef = useRef<AmbientLight>(null!)
  const skyRef = useRef<Mesh>(null!)
  const lampRefs = useRef<(PointLight | null)[]>([])
  const scene = useThree((s) => s.scene)
  const fog = useMemo(() => {
    const f = new Fog('#e8ead8', 60, 320)
    scene.fog = f
    return f
  }, [scene])
  const lampSpots = useMemo(
    () => [
      ...PLACES.filter((p) => p.kind !== 'temple' && p.kind !== 'ricefield' && p.kind !== 'pond').map((p) => [p.pos[0], 3, p.pos[1] + p.size[1] / 2 + 0.8] as const),
      [TEMPLE.pos[0], TEMPLE.floorY + 3.5, TEMPLE.pos[1] + TEMPLE.hallD / 2 + 2] as const,
    ],
    [],
  )

  useFrame(() => {
    const m = exactMinute()
    const s = sample(m)
    // ดวงอาทิตย์: ขึ้นทางตะวันออก (+x) ตกทางตะวันตก (−x)
    const ang = ((m / 60 - 6) / 12) * Math.PI
    const elev = Math.max(-0.4, s.sun)
    const sx = Math.cos(ang) * 90
    const sy = Math.max(8, elev * 90 + 10)
    sunRef.current.position.set(sx, sy, 30)
    sunRef.current.intensity = s.sunI
    lerpColor(s.a.sunColor, s.b.sunColor, s.t, sunRef.current.color)
    hemiRef.current.intensity = s.hemiI
    lerpColor(s.a.sky, s.b.sky, s.t, hemiRef.current.color)
    lerpColor(s.a.ground, s.b.ground, s.t, hemiRef.current.groundColor)
    ambRef.current.intensity = s.ambI
    lerpColor(s.a.fog, s.b.fog, s.t, fog.color)
    // ท้องฟ้า: ตำแหน่งดวงอาทิตย์ในเชดเดอร์ (ใต้ขอบฟ้า = ฟ้ามืด)
    const mat = skyRef.current?.material as unknown as { uniforms?: { sunPosition: { value: { set: (x: number, y: number, z: number) => void } } } }
    mat?.uniforms?.sunPosition.value.set(Math.cos(ang), s.sun, 0.3)
    // สภาพอากาศ: เมฆบังแดด แสงหม่น หมอกสีเทา · ฟ้าแลบสว่างวาบ
    const cl = weatherRt.cloud
    sunRef.current.intensity *= 1 - 0.78 * cl
    hemiRef.current.intensity *= 1 - 0.32 * cl
    ambRef.current.intensity = ambRef.current.intensity * (1 - 0.2 * cl) + weatherRt.flash * 2.2
    fog.color.lerp(tmpB.set('#9aa2a8'), Math.min(0.75, cl * 0.6 + weatherRt.fog * 0.4))
    // ไฟตะเกียงยามค่ำ
    for (const l of lampRefs.current) if (l) l.intensity = s.lamps * 7
  })

  return (
    <>
      <Sky ref={skyRef as never} distance={450000} sunPosition={[1, 0.3, 0.3]} turbidity={3.5} rayleigh={0.7} mieCoefficient={0.004} mieDirectionalG={0.75} />
      <hemisphereLight ref={hemiRef} args={['#fff4dc', '#8a9a62', 1.45]} />
      <ambientLight ref={ambRef} color="#ffe9c8" intensity={0.35} />
      <directionalLight
        ref={sunRef}
        position={[60, 60, 30]}
        color="#ffe2b8"
        intensity={1.15}
        shadow-intensity={0.4}
        shadow-radius={6}
        shadow-bias={-0.0008}
        shadow-normalBias={0.06}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-far={250}
      />
      {lampSpots.map(([x, y, z], i) => (
        <pointLight key={i} ref={(el) => void (lampRefs.current[i] = el)} position={[x, y, z]} color="#ffc070" intensity={0} distance={16} decay={1.5} />
      ))}
    </>
  )
}
