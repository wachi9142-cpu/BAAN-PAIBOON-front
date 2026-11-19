import { useMemo } from 'react'
import { LatheGeometry, Vector2 } from 'three'

/**
 * โอ่งน้ำใหญ่ (สูงกว่าเอวคน เกือบท่วมหัว) — ตามภาพอ้างอิงของผู้สร้าง
 * - kind 'rain'  : โอ่งรองน้ำฝน สีน้ำตาลเคลือบมัน มีลายวงรอบไหล่ น้ำเต็มปาก + รางสังกะสีรองน้ำจากชายคาลงโอ่ง
 * - kind 'use'   : โอ่งปูนสีเทา (โอ่งใช้งาน) มีคราบน้ำ ฝาไม้ปิดครึ่ง + ขันน้ำวางบนฝา
 * ฐานโอ่งที่ y = 0 · h = ความสูง
 */
function useJarGeo(h: number, r: number) {
  return useMemo(() => {
    // โปรไฟล์โอ่ง: ก้นแคบ → ป่องกลางค่อนบน → ไหล่ → คอสั้น → ปากบาน
    const p: [number, number][] = [
      [0.0, 0],
      [0.55, 0],
      [0.72, 0.12],
      [0.9, 0.35],
      [1.0, 0.58],
      [0.97, 0.72],
      [0.86, 0.84],
      [0.68, 0.92],
      [0.58, 0.95],
      [0.6, 0.99],
      [0.64, 1.0],
    ]
    return new LatheGeometry(
      p.map(([x, y]) => new Vector2(x * r, y * h)),
      32,
    )
  }, [h, r])
}

export function WaterJar({ kind = 'rain', h = 1.4, r = 0.68 }: { kind?: 'rain' | 'use'; h?: number; r?: number }) {
  const geo = useJarGeo(h, r)
  const rain = kind === 'rain'
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color={rain ? '#6e3a22' : '#a9a69c'} roughness={rain ? 0.28 : 0.95} metalness={rain ? 0.08 : 0} side={2} />
      </mesh>
      {/* ลายวงรอบไหล่ (โอ่งเคลือบ) / คราบน้ำ (โอ่งปูน) */}
      {rain
        ? [0.78, 0.83].map((y) => (
            <mesh key={y} position={[0, y * h, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r * (y < 0.8 ? 0.93 : 0.86), 0.012, 6, 40]} />
              <meshStandardMaterial color="#4e2814" roughness={0.4} />
            </mesh>
          ))
        : [0, 1, 2].map((k) => (
            <mesh key={k} position={[Math.cos(k * 2.1) * r * 0.99, h * (0.55 + k * 0.08), Math.sin(k * 2.1) * r * 0.99]} rotation={[0, -k * 2.1 + Math.PI / 2, 0]} scale={[1, 0.6, 1]}>
              <circleGeometry args={[0.16 + k * 0.04, 12]} />
              <meshStandardMaterial color="#6f6c62" roughness={1} transparent opacity={0.6} side={2} />
            </mesh>
          ))}
      {/* น้ำในโอ่ง */}
      <mesh position={[0, h * 0.97, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r * 0.6, 24]} />
        <meshStandardMaterial color="#5a8a9a" roughness={0.05} metalness={0.2} transparent opacity={0.85} />
      </mesh>
      {!rain && (
        <>
          {/* ฝาไม้ปิดครึ่งปาก + ขันน้ำ */}
          <mesh position={[r * 0.18, h + 0.02, 0]} castShadow>
            <cylinderGeometry args={[r * 0.6, r * 0.6, 0.04, 20, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#8a5a34" roughness={0.8} />
          </mesh>
          <group position={[r * 0.3, h + 0.08, 0]}>
            <mesh>
              <sphereGeometry args={[0.12, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              <meshStandardMaterial color="#c8a040" metalness={0.6} roughness={0.3} side={2} />
            </mesh>
          </group>
        </>
      )}
    </group>
  )
}

/** รางสังกะสีรองน้ำฝนจากชายคาลงปากโอ่ง (ลาดลงทาง +z) */
export function RainChute({ len = 1.4, w = 0.5 }: { len?: number; w?: number }) {
  return (
    <group rotation={[0.42, 0, 0]}>
      <mesh position={[0, 0, len / 2]} castShadow>
        <boxGeometry args={[w, 0.015, len]} />
        <meshStandardMaterial color="#3a6ab8" metalness={0.5} roughness={0.35} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * w) / 2, 0.04, len / 2]}>
          <boxGeometry args={[0.015, 0.08, len]} />
          <meshStandardMaterial color="#3a6ab8" metalness={0.5} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}
