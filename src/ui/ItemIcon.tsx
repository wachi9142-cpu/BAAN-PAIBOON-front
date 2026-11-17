/**
 * ไอคอนไอเทม — ใช้อีโมจิเป็นหลัก แต่อีโมจิรุ่นใหม่บางตัว (ไม้ท่อน ก้อนหิน เลื่อย)
 * ไม่มีในฟอนต์ของ Windows 10 จะขึ้นเป็นกล่องว่าง จึงวาดเป็น SVG แทน
 */
export function ItemIcon({ icon, size = '1em' }: { icon: string; size?: string | number }) {
  const svg = SVG[icon]
  if (!svg) return <span aria-hidden="true">{icon}</span>
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" style={{ verticalAlign: '-0.15em' }}>
      {svg}
    </svg>
  )
}

const SVG: Record<string, React.ReactNode> = {
  // ไม้ท่อน
  '🪵': (
    <g>
      <rect x="4" y="10" width="22" height="12" rx="4" fill="#9a6b45" />
      <rect x="4" y="10" width="22" height="3" rx="1.5" fill="#b8865a" />
      <ellipse cx="26" cy="16" rx="4" ry="6" fill="#e2c08a" />
      <ellipse cx="26" cy="16" rx="2" ry="3.2" fill="none" stroke="#b8865a" strokeWidth="1" />
    </g>
  ),
  // ก้อนหิน
  '🪨': (
    <g>
      <path d="M5 23 L8 13 L15 8 L23 10 L28 18 L25 25 Z" fill="#8d8a84" />
      <path d="M8 13 L15 8 L23 10 L18 15 Z" fill="#a8a49c" />
      <path d="M18 15 L28 18 L25 25 L16 24 Z" fill="#76726b" />
    </g>
  ),
  // ไม้คฑา
  '🪄': (
    <g>
      <rect x="14" y="8" width="4" height="22" rx="2" fill="#7a4f2e" transform="rotate(35 16 19)" />
      <path d="M8 2 L10 7 L15 7 L11 10 L12.5 15 L8 12 L3.5 15 L5 10 L1 7 L6 7 Z" fill="#f6d36b" />
      <circle cx="22" cy="6" r="1.6" fill="#f2a7b8" />
      <circle cx="26" cy="11" r="1.2" fill="#a8d8f0" />
    </g>
  ),
  // เลื่อย
  '🪚': (
    <g>
      <path d="M8 8 L27 20 L24 25 L5 13 Z" fill="#c9ccd0" />
      <path d="M5 13 L7 15 L8 13 L10 16 L11 14 L13 17 L14 15 L16 18 L17 16 L19 19 L20 17 L22 21 L23 19 L24 25 Z" fill="#9aa0a6" />
      <rect x="2" y="4" width="9" height="7" rx="2.5" fill="#a8582a" transform="rotate(33 6 8)" />
    </g>
  ),
}
