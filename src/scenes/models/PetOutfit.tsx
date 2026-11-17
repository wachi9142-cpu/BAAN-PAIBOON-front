import type { PetChoice, PetHeldId, PetOutfitId, PetSpecies } from '../../game/content/pets'

/**
 * ชุดแต่งตัวสัตว์เลี้ยง — วางตาม "จุดยึด" ของแต่ละชนิด (พิกัดเดียวกับโมเดลใน Pet.tsx)
 * head = กลางหัว + รัศมีหัว, neck = ตำแหน่งคอ + รัศมี, body = กลางลำตัว + กว้าง/ยาว
 */
interface Anchor {
  head: [number, number, number]
  headR: number
  neck: [number, number]
  neckR: number
  body: [number, number]
  bodyW: number
  bodyL: number
}

export const PET_ANCHORS: Record<PetSpecies, Anchor> = {
  dog: { head: [0, 0.54, 0.26], headR: 0.11, neck: [0.45, 0.17], neckR: 0.1, body: [0.36, 0], bodyW: 0.26, bodyL: 0.48 },
  cat: { head: [0, 0.42, 0.22], headR: 0.09, neck: [0.35, 0.15], neckR: 0.075, body: [0.27, 0], bodyW: 0.2, bodyL: 0.4 },
  buffalo: { head: [0, 0.95, 0.75], headR: 0.21, neck: [0.88, 0.56], neckR: 0.2, body: [0.85, 0], bodyW: 0.7, bodyL: 1.3 },
  cow: { head: [0, 0.95, 0.7], headR: 0.17, neck: [0.88, 0.52], neckR: 0.17, body: [0.82, 0], bodyW: 0.6, bodyL: 1.15 },
  pig: { head: [0, 0.36, 0.25], headR: 0.13, neck: [0.34, 0.15], neckR: 0.13, body: [0.3, 0], bodyW: 0.4, bodyL: 0.5 },
  goat: { head: [0, 0.78, 0.33], headR: 0.1, neck: [0.66, 0.27], neckR: 0.085, body: [0.52, 0], bodyW: 0.3, bodyL: 0.6 },
  sheep: { head: [0, 0.55, 0.32], headR: 0.09, neck: [0.5, 0.25], neckR: 0.09, body: [0.5, 0], bodyW: 0.42, bodyL: 0.55 },
  monkey: { head: [0, 0.58, 0.02], headR: 0.13, neck: [0.46, 0.02], neckR: 0.09, body: [0.32, 0], bodyW: 0.32, bodyL: 0.32 },
  squirrel: { head: [0, 0.25, 0.12], headR: 0.075, neck: [0.2, 0.08], neckR: 0.05, body: [0.15, 0], bodyW: 0.18, bodyL: 0.26 },
  mouse: { head: [0, 0.12, 0.12], headR: 0.06, neck: [0.11, 0.08], neckR: 0.05, body: [0.09, 0], bodyW: 0.16, bodyL: 0.23 },
  rabbit: { head: [0, 0.28, 0.12], headR: 0.09, neck: [0.22, 0.08], neckR: 0.075, body: [0.15, 0], bodyW: 0.26, bodyL: 0.31 },
  bird: { head: [0, 0.06, 0.08], headR: 0.055, neck: [0.03, 0.05], neckR: 0.05, body: [0, 0], bodyW: 0.16, bodyL: 0.2 },
  chicken: { head: [0, 0.4, 0.1], headR: 0.07, neck: [0.33, 0.08], neckR: 0.06, body: [0.24, 0], bodyW: 0.23, bodyL: 0.3 },
  duck: { head: [0, 0.38, 0.11], headR: 0.07, neck: [0.3, 0.08], neckR: 0.05, body: [0.2, 0], bodyW: 0.25, bodyL: 0.35 },
  goose: { head: [0, 0.68, 0.2], headR: 0.075, neck: [0.44, 0.22], neckR: 0.065, body: [0.27, 0], bodyW: 0.32, bodyL: 0.45 },
  turtle: { head: [0, 0.1, 0.24], headR: 0.055, neck: [0.1, 0.2], neckR: 0.04, body: [0.1, 0], bodyW: 0.34, bodyL: 0.4 },
}

const M = ({ c }: { c: string }) => <meshStandardMaterial color={c} flatShading />

export function PetOutfit({ pet, color, kind }: { pet: PetChoice; color: string; kind: PetOutfitId }) {
  const a = PET_ANCHORS[pet.species]
  const [hx, hy, hz] = a.head
  const hr = a.headR
  const [ny, nz] = a.neck
  const nr = a.neckR
  const [by, bz] = a.body
  switch (kind) {
    case 'none':
      return null
    case 'collar':
      return (
        <group position={[0, ny, nz]}>
          <mesh rotation={[Math.PI / 2 - 0.4, 0, 0]}>
            <torusGeometry args={[nr, nr * 0.13, 6, 18]} />
            <M c={color} />
          </mesh>
          <mesh position={[0, -nr * 0.95, nr * 0.45]}>
            <sphereGeometry args={[nr * 0.28, 8, 7]} />
            <meshStandardMaterial color="#e8b830" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      )
    case 'scarf':
      return (
        <group position={[0, ny, nz]}>
          <mesh rotation={[Math.PI / 2 - 0.4, 0, 0]}>
            <torusGeometry args={[nr * 1.02, nr * 0.25, 6, 18]} />
            <M c={color} />
          </mesh>
          <mesh position={[0, -nr * 0.9, nr * 0.5]} rotation={[0.3, 0, Math.PI]} scale={[1, 1, 0.3]}>
            <coneGeometry args={[nr * 0.7, nr * 1.1, 3]} />
            <M c={color} />
          </mesh>
        </group>
      )
    case 'bow':
      return (
        <group position={[0, ny - nr * 0.2, nz + nr * 0.8]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * nr * 0.75, 0, 0]} rotation={[0, 0, s * 0.35]} scale={[1.5, 0.9, 0.4]}>
              <sphereGeometry args={[nr * 0.55, 8, 6]} />
              <M c={color} />
            </mesh>
          ))}
          <mesh>
            <sphereGeometry args={[nr * 0.28, 6, 6]} />
            <M c={color} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={'t' + s} position={[s * nr * 0.35, -nr * 0.6, 0]} rotation={[0, 0, s * 0.3]}>
              <boxGeometry args={[nr * 0.25, nr * 0.9, nr * 0.08]} />
              <M c={color} />
            </mesh>
          ))}
        </group>
      )
    case 'headbow':
      // โบว์บนหัว (เยื้องไปข้างหนึ่ง)
      return (
        <group position={[hx + hr * 0.45, hy + hr * 0.9, hz]} rotation={[0, 0, -0.35]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * hr * 0.32, 0, 0]} rotation={[0, 0, s * 0.35]} scale={[1.4, 0.85, 0.45]}>
              <sphereGeometry args={[hr * 0.28, 8, 6]} />
              <M c={color} />
            </mesh>
          ))}
          <mesh>
            <sphereGeometry args={[hr * 0.13, 6, 6]} />
            <M c={color} />
          </mesh>
        </group>
      )
    case 'flower':
      return (
        <group position={[hx + hr * 0.7, hy + hr * 0.6, hz + hr * 0.2]} rotation={[0.3, 0.6, 0]}>
          {[0, 72, 144, 216, 288].map((d) => {
            const t = (d * Math.PI) / 180
            return (
              <mesh key={d} position={[Math.sin(t) * hr * 0.18, Math.cos(t) * hr * 0.18, 0]} scale={[1, 1, 0.4]}>
                <sphereGeometry args={[hr * 0.14, 6, 5]} />
                <M c={color} />
              </mesh>
            )
          })}
          <mesh position={[0, 0, hr * 0.04]}>
            <sphereGeometry args={[hr * 0.1, 6, 5]} />
            <M c="#f2c94a" />
          </mesh>
        </group>
      )
    case 'flowercrown': {
      const cols = ['#fbf6f0', color, '#f2c94a', color, '#fbf6f0', '#f2b8c0', color]
      return (
        <group position={[hx, hy + hr * 0.7, hz]}>
          <mesh rotation={[Math.PI / 2 - 0.15, 0, 0]}>
            <torusGeometry args={[hr * 0.75, hr * 0.06, 6, 18]} />
            <M c="#5c7a3a" />
          </mesh>
          {cols.map((c, i) => {
            const t = (i / cols.length) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.sin(t) * hr * 0.75, Math.cos(t) * hr * 0.1, Math.cos(t) * hr * 0.75]}>
                <sphereGeometry args={[hr * 0.16, 6, 5]} />
                <M c={c} />
              </mesh>
            )
          })}
        </group>
      )
    }
    case 'headscarf':
      // ผ้าโพกหัวลายจุด ผูกปมใต้คาง
      return (
        <group position={[hx, hy, hz]}>
          <mesh position={[0, hr * 0.15, -hr * 0.05]} castShadow>
            <sphereGeometry args={[hr * 1.08, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <M c={color} />
          </mesh>
          {Array.from({ length: 6 }).map((_, i) => {
            const t = (i / 6) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.sin(t) * hr * 0.75, hr * 0.85, Math.cos(t) * hr * 0.6]}>
                <sphereGeometry args={[hr * 0.1, 5, 4]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            )
          })}
          <mesh position={[hr * 0.6, -hr * 0.85, hr * 0.4]}>
            <sphereGeometry args={[hr * 0.2, 6, 5]} />
            <M c={color} />
          </mesh>
        </group>
      )
    case 'strawhat':
      return (
        <group position={[hx, hy + hr * 0.85, hz]}>
          <mesh castShadow>
            <cylinderGeometry args={[hr * 1.7, hr * 1.7, hr * 0.08, 16]} />
            <M c="#e2c27a" />
          </mesh>
          <mesh position={[0, hr * 0.32, 0]}>
            <cylinderGeometry args={[hr * 0.75, hr * 0.9, hr * 0.6, 14]} />
            <M c="#e2c27a" />
          </mesh>
          <mesh position={[0, hr * 0.12, 0]}>
            <cylinderGeometry args={[hr * 0.91, hr * 0.91, hr * 0.18, 14]} />
            <M c={color} />
          </mesh>
        </group>
      )
    case 'bunnyhood':
      // ฮู้ดหูกระต่าย: ครอบหัว + หูยาวสองข้าง
      return (
        <group position={[hx, hy, hz - hr * 0.1]}>
          <mesh castShadow>
            <sphereGeometry args={[hr * 1.22, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial color={color} flatShading side={2} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * hr * 0.5, hr * 1.1, -hr * 0.1]} rotation={[-0.2, 0, s * -0.25]}>
              <mesh position={[0, hr * 0.7, 0]} scale={[0.45, 1.4, 0.3]}>
                <sphereGeometry args={[hr * 0.6, 8, 6]} />
                <M c={color} />
              </mesh>
              <mesh position={[0, hr * 0.7, hr * 0.12]} scale={[0.28, 1.1, 0.2]}>
                <sphereGeometry args={[hr * 0.6, 8, 6]} />
                <M c="#f2b8c0" />
              </mesh>
            </group>
          ))}
        </group>
      )
    case 'cowhood':
      // ฮู้ดวัว: ครอบหัวสีขาวด่าง (สีด่างตามสีชุด) + เขา + หู
      return (
        <group position={[hx, hy, hz - hr * 0.1]}>
          <mesh castShadow>
            <sphereGeometry args={[hr * 1.22, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial color="#fbf6f0" flatShading side={2} />
          </mesh>
          {[
            [0.5, 0.85, 0.5],
            [-0.6, 0.6, -0.3],
            [0.2, 0.7, -0.8],
          ].map(([x, y, z], i) => (
            <mesh key={i} position={[x * hr, y * hr, z * hr]} scale={[1, 0.6, 1]}>
              <sphereGeometry args={[hr * 0.38, 7, 5]} />
              <M c={color} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={'h' + s} position={[s * hr * 0.55, hr * 1.1, 0]} rotation={[0, 0, s * -0.4]}>
              <coneGeometry args={[hr * 0.12, hr * 0.4, 6]} />
              <M c="#f2d34a" />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={'e' + s} position={[s * hr * 1.2, hr * 0.55, 0]} rotation={[0, 0, s * -0.5]} scale={[1.4, 0.5, 0.8]}>
              <sphereGeometry args={[hr * 0.28, 7, 5]} />
              <M c="#f2b8c0" />
            </mesh>
          ))}
        </group>
      )
    case 'froghood':
      // ฮู้ดกบ: ครอบหัวสีเขียว (สีชุด) + ตากบโปนสองข้างบนหัว
      return (
        <group position={[hx, hy, hz - hr * 0.1]}>
          <mesh castShadow>
            <sphereGeometry args={[hr * 1.22, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial color={color} flatShading side={2} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * hr * 0.55, hr * 1.05, hr * 0.15]}>
              <mesh>
                <sphereGeometry args={[hr * 0.32, 8, 7]} />
                <M c={color} />
              </mesh>
              <mesh position={[0, hr * 0.05, hr * 0.24]}>
                <sphereGeometry args={[hr * 0.16, 7, 6]} />
                <meshBasicMaterial color="#fbf8f2" />
              </mesh>
              <mesh position={[0, hr * 0.05, hr * 0.36]}>
                <sphereGeometry args={[hr * 0.08, 6, 5]} />
                <meshBasicMaterial color="#1a1612" />
              </mesh>
            </group>
          ))}
        </group>
      )
    case 'headphones':
      return (
        <group position={[hx, hy, hz]}>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[hr * 1.08, hr * 0.09, 6, 16, Math.PI]} />
            <M c={color} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * hr * 1.05, -hr * 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[hr * 0.38, hr * 0.38, hr * 0.25, 12]} />
              <M c={color} />
            </mesh>
          ))}
        </group>
      )
    case 'bee': {
      // ชุดผึ้ง: แถบดำบนตัว + ปีก + หนวด
      const w = a.bodyW
      const l = a.bodyL
      return (
        <group>
          {[-0.18, 0.12].map((t) => (
            <mesh key={t} position={[0, by, bz + t * l]}>
              <boxGeometry args={[w * 1.06, w * 1.0, l * 0.13]} />
              <M c="#2b2a2c" />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * w * 0.35, by + w * 0.55, bz]} rotation={[0.3, 0, s * -0.6]} scale={[1, 0.15, 0.7]}>
              <sphereGeometry args={[w * 0.4, 8, 6]} />
              <meshStandardMaterial color="#dff1fb" transparent opacity={0.75} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <group key={'a' + s} position={[hx + s * hr * 0.35, hy + hr * 0.9, hz]} rotation={[0.2, 0, s * -0.3]}>
              <mesh position={[0, hr * 0.35, 0]}>
                <cylinderGeometry args={[hr * 0.04, hr * 0.04, hr * 0.7, 5]} />
                <M c="#2b2a2c" />
              </mesh>
              <mesh position={[0, hr * 0.72, 0]}>
                <sphereGeometry args={[hr * 0.14, 6, 5]} />
                <M c={color} />
              </mesh>
            </group>
          ))}
        </group>
      )
    }
    case 'bag': {
      const w = a.bodyW
      return (
        <group>
          <mesh position={[w * 0.58, by - w * 0.1, bz + a.bodyL * 0.05]} castShadow>
            <boxGeometry args={[w * 0.12, w * 0.35, w * 0.45]} />
            <M c={color} />
          </mesh>
          <mesh position={[0, by, bz + a.bodyL * 0.05]} rotation={[0, 0, 0.5]}>
            <torusGeometry args={[w * 0.6, w * 0.025, 5, 16]} />
            <M c="#6b4426" />
          </mesh>
        </group>
      )
    }
  }
}

/** ของที่สัตว์เลี้ยงถือ/กอดไว้ที่หน้าอก */
export function PetHeld({ pet, kind }: { pet: PetChoice; kind: PetHeldId }) {
  const a = PET_ANCHORS[pet.species]
  const [ny, nz] = a.neck
  const s = a.neckR * 1.6 // ขนาดของถือ ตามขนาดตัว
  if (kind === 'none') return null
  const pos: [number, number, number] = [0, ny - a.neckR * 0.9, nz + a.neckR * 1.15]
  switch (kind) {
    case 'carrot':
      return (
        <group position={pos} rotation={[0.4, 0, 0.6]}>
          <mesh>
            <coneGeometry args={[s * 0.22, s * 0.9, 8]} />
            <M c="#f08a2a" />
          </mesh>
          {[-1, 0, 1].map((i) => (
            <mesh key={i} position={[i * s * 0.08, s * 0.55, 0]} rotation={[0, 0, i * 0.4]}>
              <boxGeometry args={[s * 0.06, s * 0.3, s * 0.06]} />
              <M c="#5c9a3a" />
            </mesh>
          ))}
        </group>
      )
    case 'boba':
      return (
        <group position={pos}>
          <mesh>
            <cylinderGeometry args={[s * 0.26, s * 0.2, s * 0.6, 12]} />
            <meshStandardMaterial color="#d8b88a" transparent opacity={0.9} />
          </mesh>
          {[[-0.08, -0.2], [0.08, -0.22], [0, -0.18]].map(([x, y], i) => (
            <mesh key={i} position={[x * s, y * s, s * 0.17]}>
              <sphereGeometry args={[s * 0.05, 5, 4]} />
              <M c="#3a2a20" />
            </mesh>
          ))}
          <mesh position={[0, s * 0.31, 0]}>
            <cylinderGeometry args={[s * 0.27, s * 0.27, s * 0.03, 12]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>
          <mesh position={[s * 0.06, s * 0.5, 0]} rotation={[0, 0, -0.2]}>
            <cylinderGeometry args={[s * 0.03, s * 0.03, s * 0.45, 5]} />
            <M c="#e86a8a" />
          </mesh>
        </group>
      )
    case 'bouquet':
      return (
        <group position={pos}>
          <mesh position={[0, -s * 0.15, 0]}>
            <coneGeometry args={[s * 0.22, s * 0.5, 8]} />
            <M c="#f6d0dc" />
          </mesh>
          {['#f08aa0', '#fbf6f0', '#f2c94a', '#f08aa0', '#c9b3e6'].map((c, i) => {
            const t = (i / 5) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.sin(t) * s * 0.15, s * 0.18 + (i % 2) * s * 0.06, Math.cos(t) * s * 0.1]}>
                <sphereGeometry args={[s * 0.12, 6, 5]} />
                <M c={c} />
              </mesh>
            )
          })}
        </group>
      )
    case 'star':
      return (
        <group position={pos}>
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={i} rotation={[0, 0, (i / 5) * Math.PI * 2]} position={[0, 0, 0]}>
              <coneGeometry args={[s * 0.14, s * 0.55, 4]} />
              <M c="#f6d860" />
            </mesh>
          ))}
          <mesh>
            <sphereGeometry args={[s * 0.18, 8, 6]} />
            <M c="#f6d860" />
          </mesh>
        </group>
      )
    case 'teddy':
      return (
        <group position={pos}>
          <mesh>
            <sphereGeometry args={[s * 0.25, 8, 7]} />
            <M c="#a8743f" />
          </mesh>
          <mesh position={[0, s * 0.32, 0]}>
            <sphereGeometry args={[s * 0.18, 8, 7]} />
            <M c="#a8743f" />
          </mesh>
          {[-1, 1].map((k) => (
            <mesh key={k} position={[k * s * 0.14, s * 0.46, 0]}>
              <sphereGeometry args={[s * 0.07, 6, 5]} />
              <M c="#a8743f" />
            </mesh>
          ))}
          <mesh position={[0, s * 0.29, s * 0.16]}>
            <sphereGeometry args={[s * 0.06, 6, 5]} />
            <M c="#e8c8a0" />
          </mesh>
        </group>
      )
    case 'heart':
      return (
        <group position={pos} scale={[1, 1, 0.45]}>
          {[-1, 1].map((k) => (
            <mesh key={k} position={[k * s * 0.13, s * 0.08, 0]}>
              <sphereGeometry args={[s * 0.19, 8, 7]} />
              <M c="#f4a8c0" />
            </mesh>
          ))}
          <mesh position={[0, -s * 0.12, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[s * 0.3, s * 0.38, 8]} />
            <M c="#f4a8c0" />
          </mesh>
        </group>
      )
    case 'banana':
      return (
        <group position={pos} rotation={[0, 0, 0.3]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[s * 0.3, s * 0.07, 6, 12, Math.PI * 0.8]} />
            <M c="#f2d34a" />
          </mesh>
        </group>
      )
    case 'cheese':
      return (
        <group position={pos} rotation={[0.2, 0.4, 0]}>
          <mesh>
            <cylinderGeometry args={[s * 0.32, s * 0.32, s * 0.2, 3, 1, false, 0, Math.PI * 0.5]} />
            <M c="#f6c84a" />
          </mesh>
        </group>
      )
  }
}
