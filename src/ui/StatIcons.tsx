/**
 * ไอคอนสถานะแบบวาด (แทนอีโมจิ): หัวใจ · ชามข้าว · หยดน้ำ · หน้ายิ้ม · เหรียญ
 * มีแสงเงา ไฮไลต์ และขอบ ให้ดูเป็นวัตถุจริงขนาดเล็ก
 */
export type StatIconId = 'health' | 'hunger' | 'thirst' | 'fun' | 'coin'

export function StatIcon({ id, size = 20 }: { id: StatIconId; size?: number }) {
  const s = { width: size, height: size, display: 'block' as const, filter: 'drop-shadow(0 1px 1.2px rgba(0,0,0,.45))' }
  if (id === 'health')
    return (
      <svg viewBox="0 0 32 32" style={s} aria-hidden>
        <defs>
          <radialGradient id="si-h" cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#ff8a8a" />
            <stop offset=".45" stopColor="#e3262f" />
            <stop offset="1" stopColor="#8e0d16" />
          </radialGradient>
        </defs>
        <path d="M16 28.5C6.5 21.6 2.5 16.6 2.5 11.2 2.5 6.9 5.8 3.6 9.9 3.6c2.6 0 4.8 1.3 6.1 3.4 1.3-2.1 3.5-3.4 6.1-3.4 4.1 0 7.4 3.3 7.4 7.6 0 5.4-4 10.4-13.5 17.3z" fill="url(#si-h)" stroke="#6a0a10" strokeWidth=".8" />
        <ellipse cx="10.2" cy="9.4" rx="3.4" ry="2.2" fill="#fff" opacity=".55" transform="rotate(-30 10.2 9.4)" />
        <circle cx="21.5" cy="8.6" r="1.1" fill="#fff" opacity=".4" />
      </svg>
    )
  if (id === 'hunger')
    return (
      <svg viewBox="0 0 32 32" style={s} aria-hidden>
        <defs>
          <radialGradient id="si-r" cx="45%" cy="35%" r="70%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#e3dccb" />
          </radialGradient>
          <linearGradient id="si-b" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4efe6" />
            <stop offset=".55" stopColor="#d9d1c2" />
            <stop offset="1" stopColor="#a89c86" />
          </linearGradient>
        </defs>
        {/* ข้าวพูนชาม */}
        <path d="M5 16c0-5.5 5-9.5 11-9.5s11 4 11 9.5z" fill="url(#si-r)" stroke="#cfc6b0" strokeWidth=".6" />
        <g fill="#fff" opacity=".9">
          <ellipse cx="12" cy="11" rx="1.1" ry=".6" />
          <ellipse cx="17" cy="9.5" rx="1.1" ry=".6" />
          <ellipse cx="20.5" cy="12.5" rx="1.1" ry=".6" />
          <ellipse cx="14.5" cy="13.5" rx="1.1" ry=".6" />
        </g>
        {/* ชามกระเบื้องขอบลายคราม */}
        <path d="M3.5 15.5h25c0 6.5-5.4 11.5-12.5 11.5S3.5 22 3.5 15.5z" fill="url(#si-b)" stroke="#7d725e" strokeWidth=".7" />
        <path d="M4 17.2h24" stroke="#2f5fa8" strokeWidth="1.3" />
        <path d="M6.5 20.2q2-1.4 4 0t4 0 4 0 4 0 4 0" stroke="#2f5fa8" strokeWidth=".7" fill="none" />
        <rect x="12.5" y="26.2" width="7" height="2" rx="1" fill="#a89c86" />
        <path d="M6 18.5q1.5 4 5 5.5" stroke="#fff" strokeWidth="1" opacity=".55" fill="none" />
      </svg>
    )
  if (id === 'thirst')
    return (
      <svg viewBox="0 0 32 32" style={s} aria-hidden>
        <defs>
          <radialGradient id="si-w" cx="40%" cy="55%" r="65%">
            <stop offset="0" stopColor="#bfe6ff" />
            <stop offset=".5" stopColor="#3a9be6" />
            <stop offset="1" stopColor="#13579c" />
          </radialGradient>
        </defs>
        <path d="M16 2.5c4.3 6.2 10 11.9 10 17.6 0 5.6-4.5 9.4-10 9.4S6 25.7 6 20.1C6 14.4 11.7 8.7 16 2.5z" fill="url(#si-w)" stroke="#0f4a86" strokeWidth=".8" />
        <path d="M11 18.5c-.4 3 1 5.5 3.4 6.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity=".7" fill="none" />
        <circle cx="12.4" cy="15" r="1" fill="#fff" opacity=".6" />
      </svg>
    )
  if (id === 'fun')
    return (
      <svg viewBox="0 0 32 32" style={s} aria-hidden>
        <defs>
          <radialGradient id="si-f" cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#fff3a6" />
            <stop offset=".5" stopColor="#ffc928" />
            <stop offset="1" stopColor="#d98a0a" />
          </radialGradient>
        </defs>
        <circle cx="16" cy="16" r="13" fill="url(#si-f)" stroke="#a8650a" strokeWidth=".8" />
        <ellipse cx="11.6" cy="12.6" rx="1.6" ry="2.2" fill="#5a3208" />
        <ellipse cx="20.4" cy="12.6" rx="1.6" ry="2.2" fill="#5a3208" />
        <circle cx="12.1" cy="11.9" r=".55" fill="#fff" />
        <circle cx="20.9" cy="11.9" r=".55" fill="#fff" />
        <path d="M9.5 17.6q6.5 7.2 13 0q-6.5 3.2-13 0z" fill="#7a3a10" />
        <path d="M12.6 20.6q3.4 1.6 6.8 0q-3.4 2.4-6.8 0z" fill="#ff7a7a" />
        <ellipse cx="8.4" cy="17.4" rx="2" ry="1.2" fill="#ff8a6a" opacity=".45" />
        <ellipse cx="23.6" cy="17.4" rx="2" ry="1.2" fill="#ff8a6a" opacity=".45" />
        <ellipse cx="11" cy="7.8" rx="4" ry="2" fill="#fff" opacity=".45" transform="rotate(-25 11 7.8)" />
      </svg>
    )
  return (
    <svg viewBox="0 0 32 32" style={s} aria-hidden>
      <defs>
        <radialGradient id="si-c" cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fff2b0" />
          <stop offset=".5" stopColor="#f2b62a" />
          <stop offset="1" stopColor="#a8700a" />
        </radialGradient>
      </defs>
      <ellipse cx="17" cy="24" rx="11" ry="4" fill="#a8700a" />
      <ellipse cx="17" cy="22.5" rx="11" ry="4" fill="url(#si-c)" stroke="#8a5a08" strokeWidth=".6" />
      <circle cx="14" cy="13.5" r="10" fill="url(#si-c)" stroke="#8a5a08" strokeWidth=".8" />
      <circle cx="14" cy="13.5" r="7.2" fill="none" stroke="#c98a14" strokeWidth="1" />
      <text x="14" y="17.6" textAnchor="middle" fontSize="11" fontWeight="700" fill="#8a5a08" fontFamily="serif">฿</text>
      <ellipse cx="10.5" cy="8.6" rx="3" ry="1.6" fill="#fff" opacity=".55" transform="rotate(-30 10.5 8.6)" />
    </svg>
  )
}
