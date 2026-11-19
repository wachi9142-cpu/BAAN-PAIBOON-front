/**
 * ภาพไอเทมแบบ 3 มิติ (แทน Emoji): ประกอบโมเดลเล็ก ๆ ของจริงแต่ละชนิด แล้วเรนเดอร์ครั้งเดียวเป็นรูป (เก็บแคช)
 * ขวาน = ด้ามไม้ + ใบมีดเหล็ก · ไม้ท่อน = ท่อนไม้มีวงปี · ปลา = ตัวปลา ฯลฯ
 */
import {
  AmbientLight,
  BoxGeometry,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DodecahedronGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  Scene,
  SphereGeometry,
  TorusGeometry,
  WebGLRenderer,
  type BufferGeometry,
} from 'three'

const SIZE = 128
let renderer: WebGLRenderer | null = null
const cache = new Map<string, string>()

const mat = (color: string, o: { metal?: number; rough?: number; emissive?: string } = {}) =>
  new MeshStandardMaterial({ color: new Color(color), metalness: Math.min(0.35, o.metal ?? 0), roughness: o.rough ?? 0.75, emissive: o.emissive ? new Color(o.emissive) : undefined, emissiveIntensity: o.emissive ? 0.6 : 0, flatShading: true })

function part(g: BufferGeometry, color: string, p: [number, number, number] = [0, 0, 0], r: [number, number, number] = [0, 0, 0], s: [number, number, number] = [1, 1, 1], o?: Parameters<typeof mat>[1]) {
  const m = new Mesh(g, mat(color, o))
  m.position.set(...p)
  m.rotation.set(...r)
  m.scale.set(...s)
  return m
}

const WOOD = '#9a6a3c'
const STEEL = '#c9ced4'

/** โมเดลของแต่ละไอเทม (หน่วยประมาณ −1..1) */
function build(id: string): Group {
  const g = new Group()
  const add = (...m: Mesh[]) => m.forEach((x) => g.add(x))
  switch (id) {
    case 'hand':
      add(part(new SphereGeometry(0.42, 14, 10), '#e8b48a', [0, -0.1, 0], [0, 0, 0], [1, 0.8, 0.6]))
      for (let i = 0; i < 4; i++) add(part(new CapsuleGeometry(0.08, 0.35, 4, 8), '#e8b48a', [-0.27 + i * 0.18, 0.38, 0], [0, 0, (i - 1.5) * 0.08]))
      add(part(new CapsuleGeometry(0.09, 0.25, 4, 8), '#e8b48a', [0.42, -0.05, 0], [0, 0, -1]))
      break
    case 'axe':
    case 'axe2': {
      add(part(new CylinderGeometry(0.1, 0.11, 1.75, 8), WOOD, [0, 0, 0], [0, 0, 0.6]))
      const blade = id === 'axe2' ? '#dfe4ea' : '#9a9da2'
      add(part(new BoxGeometry(0.75, 0.55, 0.14), blade, [0.42, 0.62, 0], [0, 0, 0.6], [1, 1, 1], { metal: 0.8, rough: 0.3 }))
      add(part(new BoxGeometry(0.1, 0.5, 0.09), '#e8eaee', [0.64, 0.82, 0], [0, 0, 0.6], [1, 1, 1], { metal: 0.9, rough: 0.2 }))
      break
    }
    case 'hammer':
      add(part(new CylinderGeometry(0.1, 0.11, 1.5, 8), WOOD, [0, -0.1, 0], [0, 0, 0.5]))
      add(part(new BoxGeometry(0.85, 0.34, 0.34), '#8a8e94', [0.33, 0.6, 0], [0, 0, 0.5], [1, 1, 1], { metal: 0.8, rough: 0.35 }))
      break
    case 'machete':
      add(part(new CylinderGeometry(0.07, 0.07, 0.55, 8), '#5a3a22', [-0.45, -0.45, 0], [0, 0, 0.8]))
      add(part(new BoxGeometry(1.25, 0.24, 0.04), STEEL, [0.15, 0.1, 0], [0, 0, 0.8], [1, 1, 1], { metal: 0.85, rough: 0.25 }))
      break
    case 'saw':
      add(part(new BoxGeometry(1.3, 0.4, 0.03), STEEL, [0.15, 0.1, 0], [0, 0, 0.3], [1, 1, 1], { metal: 0.85, rough: 0.3 }))
      add(part(new BoxGeometry(0.35, 0.42, 0.12), WOOD, [-0.62, -0.2, 0], [0, 0, 0.3]))
      break
    case 'wand':
      add(part(new CylinderGeometry(0.08, 0.1, 1.7, 8), '#7a4f9a', [0, -0.1, 0], [0, 0, 0.6]))
      add(part(new IcosahedronGeometry(0.2, 0), '#b07bff', [0.45, 0.68, 0], [0, 0, 0], [1, 1, 1], { emissive: '#9a5cff', rough: 0.2 }))
      add(part(new TorusGeometry(0.17, 0.035, 6, 14), '#e6c25a', [0.4, 0.6, 0], [Math.PI / 2, 0, 0.6], [1, 1, 1], { metal: 0.8 }))
      break
    case 'rod':
      add(part(new CylinderGeometry(0.05, 0.09, 2, 8), '#c9a45c', [0, 0, 0], [0, 0, 0.7]))
      add(part(new TorusGeometry(0.13, 0.04, 6, 12), '#555', [-0.35, -0.4, 0.05], [0, 0, 0], [1, 1, 1], { metal: 0.6 }))
      break
    case 'log':
      add(part(new CylinderGeometry(0.42, 0.45, 1.3, 14), '#7a4e2c', [0, 0, 0], [0, 0, Math.PI / 2 - 0.3], [1, 1, 1], { rough: 0.95 }))
      add(part(new CircleGeometry(0.4, 14), '#d9b07a', [0.66, 0.2, 0], [0, Math.PI / 2, -0.3]))
      add(part(new TorusGeometry(0.22, 0.025, 4, 16), '#a8784a', [0.67, 0.2, 0], [0, Math.PI / 2, -0.3]))
      break
    case 'hardwood':
      add(part(new CylinderGeometry(0.4, 0.42, 1.3, 14), '#4a2c18', [0, 0, 0], [0, 0, Math.PI / 2 - 0.3], [1, 1, 1], { rough: 0.9 }))
      add(part(new CircleGeometry(0.38, 14), '#8a5530', [0.66, 0.2, 0], [0, Math.PI / 2, -0.3]))
      break
    case 'plank':
      for (let i = 0; i < 3; i++) add(part(new BoxGeometry(1.6, 0.14, 0.5), i % 2 ? '#c8935a' : '#b9824c', [0, -0.25 + i * 0.16, 0], [0.3, 0.4, 0.05 * i]))
      break
    case 'branch':
      add(part(new CylinderGeometry(0.05, 0.08, 1.6, 6), '#7a5532', [0, 0, 0], [0, 0, 0.7]))
      add(part(new CylinderGeometry(0.03, 0.05, 0.6, 6), '#7a5532', [0.2, 0.25, 0], [0, 0, -0.3]))
      add(part(new IcosahedronGeometry(0.16, 0), '#5d9a3e', [0.35, 0.55, 0]))
      break
    case 'stone':
      add(part(new DodecahedronGeometry(0.55, 0), '#8f8f8a', [0, -0.05, 0], [0.4, 0.6, 0.2], [1.1, 0.8, 0.9], { rough: 1 }))
      add(part(new DodecahedronGeometry(0.28, 0), '#a5a59f', [0.5, -0.35, 0.2], [0.2, 0.3, 0.1]))
      break
    case 'vine':
      for (let i = 0; i < 3; i++) add(part(new TorusGeometry(0.42 - i * 0.04, 0.05, 6, 18), i % 2 ? '#b8a06a' : '#a88f58', [0, 0, i * 0.06], [0.5, 0.3, i * 0.6]))
      break
    case 'leaf':
      add(part(new SphereGeometry(0.55, 10, 8), '#c98a3a', [0, 0, 0], [0, 0, 0.6], [1, 0.45, 0.08]))
      add(part(new CylinderGeometry(0.02, 0.02, 1.1, 4), '#8a5a2a', [0, 0, 0.06], [0, 0, 0.6 + Math.PI / 2]))
      break
    case 'sapling':
      add(part(new CylinderGeometry(0.3, 0.24, 0.35, 12), '#a85a3a', [0, -0.5, 0]))
      add(part(new CylinderGeometry(0.03, 0.04, 0.7, 6), '#6a8a3a', [0, -0.05, 0]))
      add(part(new SphereGeometry(0.2, 8, 6), '#5da840', [-0.15, 0.32, 0], [0, 0, 0.6], [1, 0.4, 0.5]), part(new SphereGeometry(0.2, 8, 6), '#6ab84a', [0.15, 0.4, 0], [0, 0, -0.6], [1, 0.4, 0.5]))
      break
    case 'oldkey':
      add(part(new TorusGeometry(0.25, 0.07, 8, 16), '#c9a040', [-0.45, 0.2, 0], [0, 0, 0], [1, 1, 1], { metal: 0.8, rough: 0.35 }))
      add(part(new BoxGeometry(1, 0.1, 0.08), '#c9a040', [0.25, 0.2, 0], [0, 0, 0], [1, 1, 1], { metal: 0.8, rough: 0.35 }))
      add(part(new BoxGeometry(0.1, 0.25, 0.08), '#c9a040', [0.6, 0.05, 0], [0, 0, 0], [1, 1, 1], { metal: 0.8, rough: 0.35 }))
      break
    case 'feed':
      add(part(new SphereGeometry(0.6, 12, 10), '#d8c28a', [0, -0.1, 0], [0, 0, 0], [1, 1.1, 0.8], { rough: 1 }))
      add(part(new CylinderGeometry(0.2, 0.3, 0.2, 10), '#c8b078', [0, 0.6, 0]))
      for (let i = 0; i < 5; i++) add(part(new SphereGeometry(0.05, 5, 4), '#e8c858', [-0.4 + i * 0.2, -0.75, 0.3]))
      break
    case 'treat':
      for (let i = 0; i < 3; i++) add(part(new CapsuleGeometry(0.13, 0.75, 4, 8), '#f2cf45', [-0.2 + i * 0.2, 0, 0], [0, 0, 0.5 - i * 0.25]))
      add(part(new CylinderGeometry(0.06, 0.06, 0.2, 6), '#6a5a2a', [0.05, 0.5, 0]))
      break
    case 'lotus':
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        add(part(new ConeGeometry(0.16, 0.6, 6), '#f29bbb', [Math.sin(a) * 0.18, 0.15, Math.cos(a) * 0.18], [Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5]))
      }
      add(part(new CylinderGeometry(0.12, 0.1, 0.1, 10), '#e6c84a', [0, 0.22, 0]))
      add(part(new CylinderGeometry(0.6, 0.6, 0.04, 16), '#4f8f45', [0, -0.25, 0]))
      break
    case 'fish_tilapia':
    case 'fish_catfish':
    case 'fish_barb': {
      const c = id === 'fish_tilapia' ? '#7a8a92' : id === 'fish_catfish' ? '#4a4a3e' : '#c9c2a0'
      add(part(new SphereGeometry(0.5, 14, 10), c, [0, 0, 0], [0, 0, 0], [1.4, 0.65, 0.35], { metal: 0.3, rough: 0.4 }))
      add(part(new ConeGeometry(0.35, 0.45, 4), c, [-0.85, 0, 0], [0, 0, Math.PI / 2], [1, 1, 0.3]))
      add(part(new SphereGeometry(0.07, 6, 5), '#111', [0.5, 0.1, 0.16]))
      if (id === 'fish_catfish') add(part(new CylinderGeometry(0.015, 0.01, 0.5, 4), '#222', [0.75, -0.05, 0.1], [0, 0, 1.2]))
      break
    }
    case 'morningglory':
      for (let i = 0; i < 5; i++) add(part(new CylinderGeometry(0.04, 0.05, 1.3, 6), '#8ab84a', [-0.2 + i * 0.1, 0, 0], [0, 0, 0.2 - i * 0.1]))
      for (let i = 0; i < 4; i++) add(part(new SphereGeometry(0.18, 8, 6), '#4f9a3a', [-0.2 + i * 0.15, 0.6, 0], [0, 0, 0], [1, 0.4, 0.6]))
      break
    case 'scallion':
      for (let i = 0; i < 4; i++) add(part(new CylinderGeometry(0.04, 0.07, 1.4, 6), i % 2 ? '#5ea83e' : '#78c050', [-0.15 + i * 0.1, 0.1, 0], [0, 0, 0.1 - i * 0.06]))
      add(part(new SphereGeometry(0.16, 8, 6), '#f4f0e0', [0, -0.65, 0], [0, 0, 0], [1.4, 0.8, 0.8]))
      break
    case 'basil':
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2
        add(part(new SphereGeometry(0.2, 8, 6), '#3f8a34', [Math.sin(a) * 0.3, 0.1 + (i % 2) * 0.15, Math.cos(a) * 0.3], [0, a, 0.5], [1, 0.35, 0.6]))
      }
      add(part(new CylinderGeometry(0.03, 0.04, 0.8, 5), '#6a4a8a', [0, -0.3, 0]))
      break
    case 'lemongrass':
      for (let i = 0; i < 3; i++) add(part(new CylinderGeometry(0.07, 0.1, 1.5, 6), '#c9d888', [-0.15 + i * 0.15, 0, 0], [0, 0, 0.15 - i * 0.15]))
      break
    case 'chili':
      for (let i = 0; i < 3; i++) {
        add(part(new ConeGeometry(0.12, 0.9, 8), '#d8261c', [-0.25 + i * 0.25, -0.1, 0], [0, 0, Math.PI + (i - 1) * 0.3], [1, 1, 1], { rough: 0.35 }))
        add(part(new CylinderGeometry(0.03, 0.03, 0.2, 4), '#4a8a2a', [-0.25 + i * 0.25 - (i - 1) * 0.1, 0.42, 0]))
      }
      break
    case 'eggplant':
      add(part(new SphereGeometry(0.42, 14, 10), '#e8e8d0', [0, -0.05, 0], [0, 0, 0], [1, 0.95, 1], { rough: 0.4 }))
      add(part(new ConeGeometry(0.2, 0.2, 6), '#4a7a2a', [0, 0.42, 0], [Math.PI, 0, 0]))
      break
    case 'tomato':
      add(part(new SphereGeometry(0.5, 14, 10), '#e0362a', [0, -0.05, 0], [0, 0, 0], [1, 0.85, 1], { rough: 0.35 }))
      add(part(new ConeGeometry(0.2, 0.12, 6), '#3f8a2a', [0, 0.42, 0], [Math.PI, 0, 0]))
      break
    case 'pumpkin':
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        add(part(new SphereGeometry(0.42, 12, 10), '#e8862a', [Math.sin(a) * 0.18, -0.05, Math.cos(a) * 0.18], [0, a, 0], [0.7, 0.85, 1]))
      }
      add(part(new CylinderGeometry(0.06, 0.08, 0.25, 6), '#5a6a2a', [0, 0.45, 0]))
      break
    // ---------- รางวัลเช็กอินรายวัน (Soft 3D Cartoon) ----------
    case 'coins': {
      // เหรียญทองซ้อนเป็นตั้ง + เหรียญใหญ่ตั้งพิงลายดาว
      const gold = { metal: 0.35, rough: 0.35, emissive: '#b88a10' }
      for (let i = 0; i < 4; i++) add(part(new CylinderGeometry(0.42, 0.42, 0.12, 24), i % 2 ? '#f0c040' : '#e8b030', [0.25, -0.65 + i * 0.13, 0], [0, 0, 0], [1, 1, 1], gold))
      add(part(new CylinderGeometry(0.5, 0.5, 0.14, 28), '#f4c848', [-0.3, 0.05, 0.15], [Math.PI / 2, 0, 0.25], [1, 1, 1], gold))
      add(part(new CylinderGeometry(0.4, 0.4, 0.16, 5), '#ffd860', [-0.3, 0.05, 0.22], [Math.PI / 2, 0, 0.25], [1, 1, 1], gold))
      break
    }
    case 'gold_nugget':
      add(part(new DodecahedronGeometry(0.45, 0), '#f0c040', [0, -0.1, 0], [0.3, 0.5, 0], [1.2, 0.8, 1], { metal: 0.35, rough: 0.3, emissive: '#b88a10' }))
      add(part(new DodecahedronGeometry(0.25, 0), '#ffd860', [0.4, 0.25, 0.1], [0.6, 0.2, 0], [1, 1, 1], { metal: 0.35, rough: 0.3, emissive: '#b88a10' }))
      break
    case 'ruby':
    case 'amethyst':
    case 'sapphire': {
      const c = id === 'ruby' ? '#e02a4a' : id === 'amethyst' ? '#a050e0' : '#2a5ae0'
      add(part(new ConeGeometry(0.55, 0.7, 8), c, [0, -0.25, 0], [Math.PI, 0, 0], [1, 1, 1], { rough: 0.15, emissive: c }))
      add(part(new CylinderGeometry(0.35, 0.55, 0.3, 8), c, [0, 0.25, 0], [0, 0, 0], [1, 1, 1], { rough: 0.15, emissive: c }))
      add(part(new CylinderGeometry(0.33, 0.33, 0.02, 8), '#ffffff', [0, 0.41, 0], [0, 0, 0], [1, 1, 1], { rough: 0.1 }))
      break
    }
    case 'pearl':
      add(part(new SphereGeometry(0.42, 18, 14), '#fffaf0', [0, 0, 0], [0, 0, 0], [1, 1, 1], { rough: 0.2, emissive: '#b8b0a0' }))
      add(part(new SphereGeometry(0.12, 10, 8), '#ffffff', [-0.15, 0.18, 0.32], [0, 0, 0], [1, 1, 1], { rough: 0.05 }))
      break
    case 'sword_wood':
      add(part(new BoxGeometry(0.2, 1.3, 0.08), '#c89a62', [0.15, 0.25, 0], [0, 0, -0.6]))
      add(part(new ConeGeometry(0.1, 0.25, 4), '#c89a62', [0.53, 0.82, 0], [0, 0, -0.6]))
      add(part(new BoxGeometry(0.6, 0.12, 0.14), '#e0b030', [-0.22, -0.32, 0], [0, 0, -0.6], [1, 1, 1], { metal: 0.3, rough: 0.4 }))
      add(part(new CylinderGeometry(0.07, 0.07, 0.45, 8), '#3a6ac8', [-0.42, -0.58, 0], [0, 0, -0.6]))
      add(part(new SphereGeometry(0.1, 10, 8), '#e02a4a', [-0.55, -0.78, 0]))
      break
    case 'slingshot':
      add(part(new CylinderGeometry(0.08, 0.09, 0.8, 8), WOOD, [0, -0.45, 0]))
      add(part(new CylinderGeometry(0.07, 0.08, 0.7, 8), WOOD, [-0.25, 0.25, 0], [0, 0, 0.45]))
      add(part(new CylinderGeometry(0.07, 0.08, 0.7, 8), WOOD, [0.25, 0.25, 0], [0, 0, -0.45]))
      add(part(new TorusGeometry(0.42, 0.03, 6, 20, Math.PI), '#d84a3a', [0, 0.52, 0.05], [0, 0, Math.PI]))
      break
    case 'spear_bamboo':
      add(part(new CylinderGeometry(0.07, 0.08, 1.9, 8), '#b8b060', [0, 0, 0], [0, 0, 0.7]))
      for (let i = -2; i <= 2; i++) add(part(new CylinderGeometry(0.085, 0.085, 0.04, 8), '#8a8a40', [Math.sin(0.7) * -i * 0.3, Math.cos(0.7) * i * 0.3, 0], [0, 0, 0.7]))
      add(part(new ConeGeometry(0.13, 0.4, 6), '#d8d0a0', [-0.73, 0.83, 0], [0, 0, 0.7]))
      break
    case 'hat_ngob':
      add(part(new ConeGeometry(0.85, 0.45, 20), '#d8b878', [0, 0, 0], [0, 0, 0], [1, 1, 1], { rough: 0.9 }))
      add(part(new CylinderGeometry(0.32, 0.36, 0.22, 16), '#c8a060', [0, 0.18, 0]))
      add(part(new TorusGeometry(0.34, 0.04, 6, 20), '#c84a3a', [0, 0.1, 0], [Math.PI / 2, 0, 0]))
      break
    case 'pakaoma':
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
          add(part(new BoxGeometry(0.34, 0.06, 0.34), (r + c) % 2 ? '#e05040' : (r * c) % 3 ? '#3a8ad0' : '#f0c040', [-0.51 + c * 0.34, -0.1 + Math.sin(c) * 0.04, -0.51 + r * 0.34], [0.5, 0, 0]))
      break
    case 'sarong_silk':
      add(part(new CylinderGeometry(0.45, 0.55, 1.2, 16, 1, true), '#a03070', [0, 0, 0], [0, 0, 0], [1, 1, 0.6], { rough: 0.35 }))
      for (let i = 0; i < 3; i++) add(part(new TorusGeometry(0.5 - i * 0.03, 0.035, 6, 24), '#f0c040', [0, -0.4 + i * 0.35, 0], [Math.PI / 2, 0, 0], [1, 0.6, 1], { metal: 0.3, rough: 0.3 }))
      break
    case 'egg':
      for (let i = 0; i < 3; i++) add(part(new SphereGeometry(0.28, 14, 10), '#f4e2c4', [-0.32 + i * 0.32, -0.15 + (i === 1 ? 0.2 : 0), i === 1 ? -0.1 : 0.1], [0, 0, 0], [1, 1.25, 1], { rough: 0.5 }))
      break
    case 'sticky_rice':
      add(part(new CylinderGeometry(0.4, 0.4, 0.75, 16), '#d8b070', [0, -0.15, 0], [0, 0, 0], [1, 1, 1], { rough: 1 }))
      add(part(new CylinderGeometry(0.43, 0.43, 0.25, 16), '#c89a58', [0, 0.38, 0], [0, 0, 0], [1, 1, 1], { rough: 1 }))
      add(part(new TorusGeometry(0.42, 0.03, 6, 20), '#8a6030', [0, 0.1, 0], [Math.PI / 2, 0, 0]))
      break
    case 'mango_ripe':
      add(part(new SphereGeometry(0.48, 16, 12), '#f4b028', [0, -0.05, 0], [0, 0, 0.5], [0.8, 1.15, 0.75], { rough: 0.4 }))
      add(part(new SphereGeometry(0.2, 10, 8), '#e88a20', [0.12, -0.35, 0.18], [0, 0, 0], [1, 1, 0.6]))
      add(part(new ConeGeometry(0.1, 0.3, 5), '#4a8a2a', [-0.28, 0.5, 0], [0, 0, 0.9], [1, 1, 0.3]))
      break
    default:
      if (id.startsWith('seed_')) {
        // ซองเมล็ดพันธุ์ + เมล็ดหกออกมา
        add(part(new BoxGeometry(0.85, 1.1, 0.1), '#f2e6c8', [0, 0.05, 0], [0, 0.2, 0.08]))
        add(part(new BoxGeometry(0.6, 0.45, 0.02), seedColor(id), [0, 0.15, 0.06], [0, 0.2, 0.08]))
        for (let i = 0; i < 5; i++) add(part(new SphereGeometry(0.05, 5, 4), '#8a6a3a', [-0.35 + i * 0.16, -0.7, 0.25]))
      } else {
        add(part(new BoxGeometry(0.9, 0.9, 0.9), '#b88a58', [0, 0, 0], [0.4, 0.6, 0]))
      }
  }
  return g
}
function seedColor(id: string) {
  const m: Record<string, string> = { seed_morningglory: '#6ab04a', seed_scallion: '#8ac860', seed_basil: '#3f8a34', seed_lemongrass: '#c9d888', seed_chili: '#d8261c', seed_eggplant: '#8a6abf', seed_tomato: '#e0362a', seed_pumpkin: '#e8862a' }
  return m[id] ?? '#7aa05a'
}

/** รูปไอเทม 3 มิติ (data URL) — null ถ้าเครื่องไม่รองรับ WebGL */
export function itemIcon3D(id: string): string | null {
  const hit = cache.get(id)
  if (hit) return hit
  try {
    renderer ??= new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setSize(SIZE, SIZE, false)
    renderer.setPixelRatio(1)
    const scene = new Scene()
    scene.add(new AmbientLight('#ffffff', 0.75))
    const key = new DirectionalLight('#fff4e0', 1.6)
    key.position.set(2, 3, 4)
    scene.add(key)
    const rim = new DirectionalLight('#cfe0ff', 0.6)
    rim.position.set(-3, 1, -2)
    scene.add(rim)
    const model = build(id)
    model.rotation.set(0.35, -0.5, 0)
    scene.add(model)
    const cam = new OrthographicCamera(-1.1, 1.1, 1.1, -1.1, 0.1, 20)
    cam.position.set(0, 0, 6)
    renderer.setClearColor(0x000000, 0)
    renderer.render(scene, cam)
    const url = renderer.domElement.toDataURL('image/png')
    cache.set(id, url)
    model.traverse((o) => {
      const m = o as Mesh
      if (m.isMesh) {
        m.geometry.dispose()
        ;(m.material as MeshStandardMaterial).dispose()
      }
    })
    return url
  } catch {
    return null
  }
}
