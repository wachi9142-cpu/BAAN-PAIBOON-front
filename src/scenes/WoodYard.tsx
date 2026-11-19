import { RBox } from './models/RBox'

/** ลานกองฟืนขาย (บ้านคนทำฟืนขาย): กองฟืนเรียงสูง · ฟืนมัดเป็นกำ · ตอไม้ผ่าฟืน + ขวาน · ป้าย "ขายฟืน" */
export function WoodYard({ w, d }: { w: number; d: number }) {
  const logs = (cx: number, cz: number, rows: number, cols: number, len = 1.6) => {
    const out: React.ReactElement[] = []
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols - (r % 2); c++)
        out.push(
          <mesh key={`${cx}:${r}:${c}`} position={[cx - (cols * 0.22) / 2 + c * 0.22 + (r % 2) * 0.11, 0.12 + r * 0.19, cz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.11, len, 7]} />
            <meshStandardMaterial color={['#8a5a32', '#7a4e2a', '#9a6a3a'][(r + c) % 3]} />
          </mesh>,
        )
    return out
  }
  return (
    <group>
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#b79a6e" roughness={1} />
      </mesh>
      {/* กองฟืนเรียงสูง 3 กอง (มีหลังคาสังกะสีกันฝน) */}
      {[-2.6, 0, 2.6].map((x) => (
        <group key={x} position={[x, 0, -d / 2 + 1.6]}>
          {logs(0, 0, 6, 9)}
          {[-1.1, 1.1].map((px) => (
            <mesh key={px} position={[px, 0.9, 0]}>
              <boxGeometry args={[0.08, 1.8, 0.08]} />
              <meshStandardMaterial color="#6b4a2e" />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 2.05, -d / 2 + 1.6]} rotation={[0.18, 0, 0]} castShadow>
        <boxGeometry args={[8.2, 0.05, 2.2]} />
        <meshStandardMaterial color="#9aa3aa" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* ฟืนมัดเป็นกำ วางขาย */}
      {[-2.2, -1.3, -0.4].map((x, i) => (
        <group key={x} position={[x, 0, 1.2 + (i % 2) * 0.3]} rotation={[0, i * 0.3, 0]}>
          {[-0.12, 0, 0.12].map((o) =>
            [0.1, 0.28].map((y) => (
              <mesh key={o + ':' + y} position={[o, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.8, 6]} />
                <meshStandardMaterial color="#8a5a32" />
              </mesh>
            )),
          )}
          <mesh position={[0, 0.2, 0]}>
            <torusGeometry args={[0.2, 0.025, 5, 12]} />
            <meshStandardMaterial color="#c8a86a" />
          </mesh>
        </group>
      ))}
      {/* ตอไม้ผ่าฟืน + ขวานปัก + เศษไม้ */}
      <group position={[2.2, 0, 1.4]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.45, 0.6, 12]} />
          <meshStandardMaterial color="#7a5232" />
        </mesh>
        <mesh position={[0.05, 0.75, 0]} rotation={[0, 0, -0.25]}>
          <boxGeometry args={[0.05, 0.7, 0.05]} />
          <meshStandardMaterial color="#8a6a42" />
        </mesh>
        <mesh position={[-0.02, 0.63, 0]} rotation={[0, 0, -0.25]}>
          <boxGeometry args={[0.22, 0.12, 0.03]} />
          <meshStandardMaterial color="#9aa3aa" metalness={0.6} />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh key={i} position={[Math.cos(i * 1.7) * 0.8, 0.04, Math.sin(i * 1.7) * 0.8]} rotation={[0, i, Math.PI / 2]}>
            <boxGeometry args={[0.08, 0.3, 0.06]} />
            <meshStandardMaterial color="#c8a070" />
          </mesh>
        ))}
      </group>
      {/* ป้ายขายฟืน */}
      <group position={[w / 2 - 0.6, 0, d / 2 - 0.6]}>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.08, 1.4, 0.08]} />
          <meshStandardMaterial color="#6b4a2e" />
        </mesh>
        <mesh position={[0, 1.35, 0.05]}>
          <RBox args={[1.1, 0.45, 0.06]} radius={0.03} />
          <meshStandardMaterial color="#e8d8b0" />
        </mesh>
      </group>
    </group>
  )
}
