import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BackSide, Color, InstancedMesh, Object3D, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial } from 'three'
import { initWeather, tickWeather, weatherRt } from '../game/weather'
import { useGame } from '../game/store'
import { useClock } from '../game/clock'
import { GAME_MINUTES_PER_REAL_SECOND } from '../game/content/daytime'
import { ROADS } from '../game/content/village'
import { isInterior } from '../game/interior'
import { playerPose } from '../game/playerPose'
import { thunderSound, updateWeatherSound } from '../game/audio/weatherSound'

const DROPS = 1400
const R = 22 // รัศมีรอบกล้องที่มีฝนตก
const TOP = 16
const dummy = new Object3D()
const GREY = new Color('#7d848c')

/**
 * ฉากสภาพอากาศ: ท้องฟ้าครึ้ม (โดมเมฆ) · เม็ดฝนรอบกล้อง · ฟ้าแลบ · แอ่งน้ำบนถนนดินหลังฝน · หมอก
 * ค่ามาจาก weatherRt (ไล่ค่าทุกเฟรม) — ไม่ทำให้ React render ใหม่
 */
export function Weather() {
  const { camera, scene } = useThree()
  const rain = useRef<InstancedMesh>(null)
  const dome = useRef<Mesh>(null)
  const puddleMat = useRef<MeshStandardMaterial>(null)
  const mudMat = useRef<MeshStandardMaterial>(null)
  const drops = useMemo(() => Array.from({ length: DROPS }, () => ({ x: (Math.random() - 0.5) * 2 * R, y: Math.random() * TOP, z: (Math.random() - 0.5) * 2 * R, v: 14 + Math.random() * 6 })), [])
  // แอ่งน้ำตามถนนดิน (เกิดตอนพื้นเปียก)
  const puddles = useMemo(() => {
    let s = 4242
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
    const out: { x: number; z: number; sx: number; sz: number; rot: number }[] = []
    for (const rd of ROADS) {
      if (rd.width > 8) continue
      const len = Math.hypot(rd.to[0] - rd.from[0], rd.to[1] - rd.from[1])
      const n = Math.floor(len / 9)
      for (let i = 0; i < n; i++) {
        const t = r()
        const side = (r() - 0.5) * rd.width * 0.6
        const dx = (rd.to[0] - rd.from[0]) / len
        const dz = (rd.to[1] - rd.from[1]) / len
        out.push({ x: rd.from[0] + dx * t * len - dz * side, z: rd.from[1] + dz * t * len + dx * side, sx: 0.8 + r() * 1.4, sz: 0.6 + r() * 1.1, rot: r() * Math.PI })
      }
    }
    return out
  }, [])
  const mounted = useRef(false)
  useEffect(() => {
    initWeather()
    mounted.current = true
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1)
    const g = useGame.getState()
    if (!g.save) return
    if (!g.paused) tickWeather(dt, dt * GAME_MINUTES_PER_REAL_SECOND * useClock.getState().speed)
    const w = weatherRt
    const inside = isInterior(playerPose.x, playerPose.z)
    // ฟ้าแลบ: สุ่มตามความแรงพายุ แล้วตามด้วยเสียงฟ้าร้อง (ไกล = ดังช้า)
    if (w.thunder > 0 && !g.paused) {
      w.nextBolt -= dt
      if (w.nextBolt <= 0) {
        w.nextBolt = 6 + Math.random() * (30 / Math.max(0.15, w.thunder))
        const far = Math.random() < 0.6 || w.thunder < 0.3
        if (!far) w.flash = 1
        window.setTimeout(() => thunderSound(far ? 0.35 : 0.9), (far ? 2.5 : 0.6) * 1000 + Math.random() * 800)
      }
    }
    // โดมเมฆรอบกล้อง: ฟ้าครึ้มขึ้นตามเมฆ
    if (dome.current) {
      dome.current.position.copy(camera.position)
      const m = dome.current.material as MeshBasicMaterial
      m.opacity = inside ? 0 : Math.min(0.78, w.cloud * 0.72 + w.fog * 0.2)
      m.color.copy(GREY).lerp(new Color('#e8ecf2'), w.flash * 0.8)
    }
    // หมอก: ระยะมองเห็นสั้นลงตามหมอกและฝน
    if (scene.fog && 'near' in scene.fog) {
      const f = scene.fog as { near: number; far: number }
      const vis = 1 - Math.min(0.85, w.fog * 0.85 + w.rain * 0.45)
      f.near = 8 + 52 * vis
      f.far = 70 + 250 * vis
    }
    // เม็ดฝน
    const mesh = rain.current
    if (mesh) {
      const n = inside ? 0 : Math.floor(DROPS * w.rain)
      mesh.count = n
      const cx = camera.position.x
      const cz = camera.position.z
      const slant = w.wind * 0.35
      for (let i = 0; i < n; i++) {
        const d = drops[i]
        d.y -= d.v * dt
        d.x += slant * d.v * dt
        if (d.y < 0) {
          d.y = TOP
          d.x = (Math.random() - 0.5) * 2 * R
          d.z = (Math.random() - 0.5) * 2 * R
        }
        if (d.x > R) d.x -= 2 * R
        dummy.position.set(cx + d.x, d.y, cz + d.z)
        dummy.rotation.set(0, 0, -slant)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
    // แอ่งน้ำ/โคลน: ค่อย ๆ ปรากฏตามความเปียก
    if (puddleMat.current) puddleMat.current.opacity = Math.min(0.85, w.wet * 1.1)
    if (mudMat.current) mudMat.current.opacity = Math.min(0.6, w.wet * 0.9)
    updateWeatherSound(inside ? 0.25 : 1)
  })

  return (
    <group>
      <mesh ref={dome} renderOrder={-1}>
        <sphereGeometry args={[150, 24, 16]} />
        <meshBasicMaterial color={GREY} transparent opacity={0} side={BackSide} depthWrite={false} fog={false} />
      </mesh>
      <instancedMesh ref={rain} args={[undefined, undefined, DROPS]} frustumCulled={false}>
        <boxGeometry args={[0.018, 0.55, 0.018]} />
        <meshBasicMaterial color="#cfdbe6" transparent opacity={0.55} depthWrite={false} />
      </instancedMesh>
      {puddles.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]} scale={[p.sx, 1, p.sz]}>
          <mesh position={[0, 0.036, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.8, 16]} />
            <meshStandardMaterial ref={i === 0 ? mudMat : undefined} color="#6e4130" roughness={0.6} transparent opacity={0} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.038, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.58, 16]} />
            <meshStandardMaterial ref={i === 0 ? puddleMat : undefined} color="#a9bcc6" roughness={0.05} metalness={0.3} transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
